import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  LayoutChangeEvent,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';
import * as THREE from 'three';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  buildAnatomySceneGraph,
  AnatomySceneGraph,
} from '../models/anatomyModelBuilder';
import { BodySystemId } from '../types';
import { CameraPreset } from '../state/useAnatomyStore';
import { theme } from '../theme';

interface Anatomy3DViewportProps {
  selectedOrganId: string | null;
  selectedSystemId: BodySystemId | 'all';
  cameraPreset: CameraPreset;
  zoomLevel: number;
  showBodyShell: boolean;
  showSkeletal: boolean;
  showMuscular: boolean;
  animatePhysiology: boolean;
  onSelectOrgan: (organId: string) => void;
}

export const Anatomy3DViewport: React.FC<Anatomy3DViewportProps> = ({
  selectedOrganId,
  selectedSystemId,
  cameraPreset,
  zoomLevel,
  showBodyShell,
  showSkeletal,
  showMuscular,
  animatePhysiology,
  onSelectOrgan,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [renderError, setRenderError] = useState<string | null>(null);
  const layoutRef = useRef<{ width: number; height: number }>({
    width: 360,
    height: 440,
  });

  const isMountedRef = useRef<boolean>(true);
  const rafIdRef = useRef<number | null>(null);
  const sceneGraphRef = useRef<AnatomySceneGraph | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Spherical camera orbit coordinates
  const targetOrbitRef = useRef<{ theta: number; phi: number; radius: number }>({
    theta: 0,
    phi: Math.PI / 2.1,
    radius: 3.4,
  });
  const currentOrbitRef = useRef<{ theta: number; phi: number; radius: number }>({
    theta: 0,
    phi: Math.PI / 2.1,
    radius: 3.4,
  });

  // Latest props ref for animation loop & raycaster
  const stateRef = useRef({
    selectedOrganId,
    selectedSystemId,
    showBodyShell,
    showSkeletal,
    showMuscular,
    animatePhysiology,
    onSelectOrgan,
  });

  useEffect(() => {
    stateRef.current = {
      selectedOrganId,
      selectedSystemId,
      showBodyShell,
      showSkeletal,
      showMuscular,
      animatePhysiology,
      onSelectOrgan,
    };
    applySceneState();
  }, [
    selectedOrganId,
    selectedSystemId,
    showBodyShell,
    showSkeletal,
    showMuscular,
    animatePhysiology,
  ]);

  // Update camera target angle when preset changes
  useEffect(() => {
    switch (cameraPreset) {
      case 'front':
        targetOrbitRef.current.theta = 0;
        targetOrbitRef.current.phi = Math.PI / 2.05;
        break;
      case 'side':
        targetOrbitRef.current.theta = Math.PI / 2;
        targetOrbitRef.current.phi = Math.PI / 2.05;
        break;
      case 'back':
        targetOrbitRef.current.theta = Math.PI;
        targetOrbitRef.current.phi = Math.PI / 2.05;
        break;
      case 'isometric':
        targetOrbitRef.current.theta = Math.PI / 4;
        targetOrbitRef.current.phi = Math.PI / 2.5;
        break;
    }
  }, [cameraPreset]);

  // Update camera radius when zoomLevel changes
  useEffect(() => {
    const scale = Math.max(0.5, Math.min(1.8, zoomLevel / 100));
    targetOrbitRef.current.radius = 3.4 / scale;
  }, [zoomLevel]);

  // Apply visibility & organ highlighting without mutating original material data
  const applySceneState = useCallback(() => {
    const graph = sceneGraphRef.current;
    if (!graph) return;

    const {
      selectedOrganId: activeOrganId,
      selectedSystemId: activeSystemId,
      showBodyShell: shellVisible,
      showSkeletal: skeletalVisible,
      showMuscular: muscularVisible,
    } = stateRef.current;

    // 1. Outer translucent body shell
    graph.bodyShellGroup.visible = shellVisible;

    // 2. System groups visibility
    graph.systemGroups.forEach((group, sysId) => {
      if (sysId === 'skeletal') {
        group.visible =
          activeSystemId === 'skeletal' ||
          (activeSystemId === 'all' && skeletalVisible);
      } else if (sysId === 'muscular') {
        group.visible =
          activeSystemId === 'muscular' ||
          (activeSystemId === 'all' && muscularVisible);
      } else {
        group.visible = activeSystemId === 'all' || activeSystemId === sysId;
      }
    });

    // 3. Organ highlighting (non-destructive restoration + emissive highlight)
    graph.organRecords.forEach((record) => {
      const isSelected = record.organId === activeOrganId;
      record.meshes.forEach((mesh) => {
        const origMat = record.originalMaterials.get(mesh);
        const currentMat = mesh.material as THREE.MeshStandardMaterial;
        if (!origMat || !currentMat) return;

        // Restore base color and opacity first
        currentMat.color.copy(origMat.color);
        currentMat.opacity = origMat.opacity;
        currentMat.transparent = origMat.transparent;

        if (isSelected) {
          currentMat.emissive.setHex(0x38bdf8);
          currentMat.emissiveIntensity = 0.55;
        } else {
          currentMat.emissive.setHex(0x000000);
          currentMat.emissiveIntensity = 0;
        }
      });
    });
  }, []);

  // Perform 3D Raycasting on tap coordinates
  const handleTapRaycast = useCallback((touchX: number, touchY: number) => {
    const graph = sceneGraphRef.current;
    const camera = cameraRef.current;
    if (!graph || !camera) return;

    const { width, height } = layoutRef.current;
    if (width <= 0 || height <= 0) return;

    // Convert screen touch to Normalized Device Coordinates (-1 to +1)
    const ndc = new THREE.Vector2(
      (touchX / width) * 2 - 1,
      -(touchY / height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(ndc, camera);

    // Collect all meshes belonging to currently visible organs
    const pickableMeshes: THREE.Mesh[] = [];
    graph.organRecords.forEach((record) => {
      const sysGroup = graph.systemGroups.get(record.systemId);
      if (sysGroup && sysGroup.visible) {
        pickableMeshes.push(...record.meshes);
      }
    });

    const intersects = raycaster.intersectObjects(pickableMeshes, false);
    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const hitOrganId = hitMesh.userData?.organId;
      if (hitOrganId) {
        stateRef.current.onSelectOrgan(hitOrganId);
      }
    }
  }, []);

  // Touch gesture tracking for 1-finger orbit & 2-finger pinch zoom
  const gestureStateRef = useRef<{
    startTheta: number;
    startPhi: number;
    initialPinchDist: number | null;
    startRadius: number;
  }>({
    startTheta: 0,
    startPhi: Math.PI / 2.1,
    initialPinchDist: null,
    startRadius: 3.4,
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        gestureStateRef.current.startTheta = targetOrbitRef.current.theta;
        gestureStateRef.current.startPhi = targetOrbitRef.current.phi;
        gestureStateRef.current.startRadius = targetOrbitRef.current.radius;

        const touches = evt.nativeEvent.touches;
        if (touches && touches.length === 2) {
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          gestureStateRef.current.initialPinchDist = Math.hypot(dx, dy);
        } else {
          gestureStateRef.current.initialPinchDist = null;
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        if (touches && touches.length === 2) {
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const dist = Math.hypot(dx, dy);

          if (gestureStateRef.current.initialPinchDist === null) {
            gestureStateRef.current.initialPinchDist = dist;
            gestureStateRef.current.startRadius = targetOrbitRef.current.radius;
          } else if (gestureStateRef.current.initialPinchDist > 10) {
            const pinchScale = dist / gestureStateRef.current.initialPinchDist;
            const nextRadius = gestureStateRef.current.startRadius / pinchScale;
            targetOrbitRef.current.radius = Math.max(1.8, Math.min(5.5, nextRadius));
          }
        } else {
          // Single-finger 360° rotation + vertical tilt
          targetOrbitRef.current.theta =
            gestureStateRef.current.startTheta - gestureState.dx * 0.011;
          const nextPhi =
            gestureStateRef.current.startPhi - gestureState.dy * 0.008;
          targetOrbitRef.current.phi = Math.max(
            0.35,
            Math.min(Math.PI - 0.35, nextPhi)
          );
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        gestureStateRef.current.initialPinchDist = null;
        // If finger barely moved, treat as a tap for 3D organ raycasting
        if (Math.abs(gestureState.dx) < 8 && Math.abs(gestureState.dy) < 8) {
          const { locationX, locationY } = evt.nativeEvent;
          handleTapRaycast(locationX, locationY);
        }
      },
    })
  ).current;

  const onContextCreate = useCallback(
    async (gl: ExpoWebGLRenderingContext) => {
      try {
        const width = gl.drawingBufferWidth;
        const height = gl.drawingBufferHeight;

        // Create Three.js WebGLRenderer bound to Expo GL context
        const renderer = new THREE.WebGLRenderer({
          canvas: {
            width,
            height,
            style: {},
            addEventListener: () => {},
            removeEventListener: () => {},
            clientHeight: height,
          } as any,
          context: gl,
          antialias: true,
        });
        renderer.setSize(width, height);
        renderer.setClearColor(0xf1f5f9, 1);
        rendererRef.current = renderer;

        // Create Scene
        const scene = new THREE.Scene();

        // Create Camera
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        cameraRef.current = camera;

        // Medical Studio Lighting Setup
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
        scene.add(ambientLight);

        const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x94a3b8, 0.55);
        hemiLight.position.set(0, 5, 0);
        scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
        dirLight.position.set(3, 5, 4);
        scene.add(dirLight);

        const backLight = new THREE.DirectionalLight(0xbae6fd, 0.45);
        backLight.position.set(-3, 2, -4);
        scene.add(backLight);

        // Subtle anatomical platform ring beneath the model
        const ringGeo = new THREE.RingGeometry(0.62, 0.68, 36);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x0284c7,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.35,
        });
        const floorRing = new THREE.Mesh(ringGeo, ringMat);
        floorRing.rotation.x = Math.PI / 2;
        floorRing.position.set(0, -1.65, 0);
        scene.add(floorRing);

        // Build 3D Human Anatomy Scene Graph
        const graph = buildAnatomySceneGraph();
        sceneGraphRef.current = graph;
        scene.add(graph.rootGroup);

        applySceneState();

        if (isMountedRef.current) {
          setIsLoading(false);
        }

        let clock = 0;

        // Render Loop
        const animate = () => {
          if (!isMountedRef.current) return;
          rafIdRef.current = requestAnimationFrame(animate);

          clock += 0.04;

          // Smoothly interpolate camera spherical coordinates
          const cur = currentOrbitRef.current;
          const tgt = targetOrbitRef.current;
          cur.theta += (tgt.theta - cur.theta) * 0.15;
          cur.phi += (tgt.phi - cur.phi) * 0.15;
          cur.radius += (tgt.radius - cur.radius) * 0.15;

          camera.position.x =
            cur.radius * Math.sin(cur.phi) * Math.sin(cur.theta);
          camera.position.y = cur.radius * Math.cos(cur.phi) + 0.25;
          camera.position.z =
            cur.radius * Math.sin(cur.phi) * Math.cos(cur.theta);
          camera.lookAt(0, 0.25, 0);

          // Physiological animations (Heartbeat & Lung Respiration + Selected Pulse)
          if (sceneGraphRef.current) {
            const { animatePhysiology: doAnim, selectedOrganId: selId } =
              stateRef.current;

            if (doAnim) {
              // Heartbeat ~72 BPM double-pulse
              if (sceneGraphRef.current.heartGroup) {
                const beat =
                  1 +
                  Math.pow(Math.sin(clock * 2.2), 6) * 0.08 +
                  Math.pow(Math.sin(clock * 2.2 - 0.4), 8) * 0.04;
                sceneGraphRef.current.heartGroup.scale.setScalar(beat);
              }
              // Lung breathing cycle
              if (sceneGraphRef.current.lungsGroup) {
                const breath = 1 + Math.sin(clock * 0.75) * 0.035;
                sceneGraphRef.current.lungsGroup.scale.set(
                  breath,
                  1 + Math.sin(clock * 0.75) * 0.02,
                  breath
                );
              }
            } else {
              sceneGraphRef.current.heartGroup?.scale.setScalar(1);
              sceneGraphRef.current.lungsGroup?.scale.setScalar(1);
            }

            // Selected organ emissive pulse
            if (selId) {
              const selRecord = sceneGraphRef.current.organRecords.get(selId);
              if (selRecord) {
                const pulse = 0.45 + Math.sin(clock * 2.5) * 0.25;
                selRecord.meshes.forEach((m) => {
                  const mat = m.material as THREE.MeshStandardMaterial;
                  if (mat && mat.emissive) {
                    mat.emissiveIntensity = pulse;
                  }
                });
              }
            }
          }

          renderer.render(scene, camera);
          gl.endFrameEXP();
        };

        animate();
      } catch (err: any) {
        if (isMountedRef.current) {
          setRenderError(
            err?.message || 'Unable to initialize 3D WebGL context on this device.'
          );
          setIsLoading(false);
        }
      }
    },
    [applySceneState]
  );

  // Cleanup GPU resources on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (sceneGraphRef.current) {
        sceneGraphRef.current.dispose();
        sceneGraphRef.current = null;
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, []);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      layoutRef.current = { width, height };
      if (cameraRef.current) {
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
      }
    }
  };

  if (renderError) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={42}
          color={theme.colors.danger}
        />
        <Text style={styles.errorTitle}>3D Graphics Unavailable</Text>
        <Text style={styles.errorMessage}>{renderError}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => {
            setRenderError(null);
            setIsLoading(true);
          }}
        >
          <Text style={styles.retryBtnText}>Retry 3D Initialization</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={styles.container}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      <GLView style={styles.glView} onContextCreate={onContextCreate} />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading 3D Human Anatomy Meshes...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  glView: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(248, 250, 252, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  loadingText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    backgroundColor: '#F1F5F9',
  },
  errorTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.sm,
    marginBottom: 4,
  },
  errorMessage: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  retryBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.sm,
  },
  retryBtnText: {
    ...theme.typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
