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
import {
  applyCachedGlbOrgansSync,
  ensurePriorityOrganGlbLoaded,
  loadAllRealMedicalGlbModels,
} from '../models/realGlbLoader';
import { ORGAN_SUB_PARTS, getSubPartColorHex } from '../data/organSubParts';
import { BodySystemId } from '../types';
import { CameraPreset } from '../state/useAnatomyStore';
import { theme } from '../theme';

export type ViewMode3D = 'body' | 'isolate';
export type ShellMode = 'xray' | 'solid' | 'hidden';

interface Anatomy3DViewportProps {
  selectedOrganId: string | null;
  selectedSubPartId?: string | null;
  selectedSystemId: BodySystemId | 'all';
  cameraPreset: CameraPreset;
  zoomLevel: number;
  viewMode: ViewMode3D;
  shellMode: ShellMode;
  showSkeletal: boolean;
  showMuscular: boolean;
  showVascular: boolean;
  showInternalOrgans?: boolean;
  showNervous?: boolean;
  animatePhysiology: boolean;
  canvasBackgroundColor?: string;
  isActive?: boolean;
  onSelectOrgan: (organId: string) => void;
  onSelectSubPart?: (subPartId: string | null) => void;
}

/**
 * Prepares an ExpoWebGLRenderingContext for Three.js r163+ compatibility on Android/iOS.
 */
export function patchExpoGlForThree(gl: ExpoWebGLRenderingContext) {
  const width = gl.drawingBufferWidth || 360;
  const height = gl.drawingBufferHeight || 440;

  const g = globalThis as any;
  if (g.WebGLRenderingContext && g.WebGL2RenderingContext) {
    if (g.WebGL2RenderingContext.prototype instanceof g.WebGLRenderingContext) {
      Object.assign(
        g.WebGL2RenderingContext.prototype,
        g.WebGLRenderingContext.prototype
      );
      Object.setPrototypeOf(
        g.WebGL2RenderingContext.prototype,
        Object.prototype
      );
    }
  }

  if (
    typeof g.WebGLRenderingContext !== 'undefined' &&
    gl instanceof g.WebGLRenderingContext
  ) {
    const detachedProto = Object.assign(
      Object.create(Object.prototype),
      g.WebGLRenderingContext.prototype,
      Object.getPrototypeOf(gl)
    );
    Object.setPrototypeOf(gl, detachedProto);
  }

  if (typeof gl.pixelStorei === 'function') {
    const origPixelStorei = gl.pixelStorei.bind(gl);
    gl.pixelStorei = ((pname: number, param: any) => {
      if (
        pname === gl.UNPACK_ALIGNMENT ||
        pname === gl.UNPACK_FLIP_Y_WEBGL
      ) {
        return origPixelStorei(pname, param);
      }
    }) as any;
  }

  if (typeof gl.getContextAttributes !== 'function') {
    (gl as any).getContextAttributes = () => ({
      alpha: true,
      depth: true,
      stencil: true,
      antialias: false,
      premultipliedAlpha: false,
    });
  }

  const canvasShim: any = {
    width,
    height,
    clientWidth: width,
    clientHeight: height,
    style: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    setAttribute: () => {},
    getContext: () => gl,
  };

  (gl as any).canvas = canvasShim;

  return { canvasShim, width, height };
}

export const Anatomy3DViewport: React.FC<Anatomy3DViewportProps> = ({
  selectedOrganId,
  selectedSubPartId = null,
  selectedSystemId,
  cameraPreset,
  zoomLevel,
  viewMode,
  shellMode,
  showSkeletal,
  showMuscular,
  showVascular,
  showInternalOrgans = true,
  showNervous = true,
  animatePhysiology,
  canvasBackgroundColor,
  isActive = true,
  onSelectOrgan,
  onSelectSubPart,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [glKey, setGlKey] = useState<number>(0);
  const [glbScanStatus, setGlbScanStatus] = useState<{
    loaded: number;
    total: number;
  }>({ loaded: 0, total: 10 });
  const layoutRef = useRef<{ width: number; height: number }>({
    width: 360,
    height: 520,
  });

  const isMountedRef = useRef<boolean>(true);
  const rafIdRef = useRef<number | null>(null);
  const sceneGraphRef = useRef<AnatomySceneGraph | null>(null);
  const pedestalGroupRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Spherical camera orbit + lookAt target coordinates
  const targetOrbitRef = useRef<{
    theta: number;
    phi: number;
    radius: number;
    lookX: number;
    lookY: number;
    lookZ: number;
  }>({
    theta: 0,
    phi: Math.PI / 2.05,
    radius: 2.85,
    lookX: 0,
    lookY: 0.12,
    lookZ: 0,
  });

  const currentOrbitRef = useRef<{
    theta: number;
    phi: number;
    radius: number;
    lookX: number;
    lookY: number;
    lookZ: number;
  }>({
    theta: 0,
    phi: Math.PI / 2.05,
    radius: 2.85,
    lookX: 0,
    lookY: 0.12,
    lookZ: 0,
  });

  const stateRef = useRef({
    selectedOrganId,
    selectedSubPartId,
    selectedSystemId,
    viewMode,
    shellMode,
    showSkeletal,
    showMuscular,
    showVascular,
    showInternalOrgans,
    showNervous,
    animatePhysiology,
    zoomLevel,
    isActive,
    onSelectOrgan,
    onSelectSubPart,
  });

  const updateCameraFocusForMode = useCallback(() => {
    const graph = sceneGraphRef.current;
    const {
      selectedOrganId: selId,
      viewMode: mode,
      zoomLevel: zLevel,
    } = stateRef.current;
    const scale = Math.max(0.5, Math.min(2.2, zLevel / 100));

    if (mode === 'isolate' && selId && graph) {
      const rec = graph.organRecords.get(selId);
      if (rec) {
        targetOrbitRef.current.lookX = rec.focusCenter.x;
        const isCompact =
          layoutRef.current.height > 0 && layoutRef.current.height <= 320;
        targetOrbitRef.current.lookY = isCompact
          ? rec.focusCenter.y - 0.58
          : rec.focusCenter.y - 0.58 - rec.focusRadius * 0.06;
        targetOrbitRef.current.lookZ = rec.focusCenter.z;
        targetOrbitRef.current.radius = (rec.focusRadius * 1.15) / scale;
        return;
      }
    }

    // Full Body Mode
    targetOrbitRef.current.lookX = 0;
    targetOrbitRef.current.lookY = 0.08;
    targetOrbitRef.current.lookZ = 0;
    targetOrbitRef.current.radius = 2.75 / scale;
  }, []);

  const applySceneState = useCallback(() => {
    const graph = sceneGraphRef.current;
    if (!graph) return;

    const {
      selectedOrganId: activeOrganId,
      selectedSubPartId: activeSubPartId,
      selectedSystemId: activeSystemId,
      viewMode: mode,
      shellMode: activeShellMode,
      showSkeletal: skeletalVisible,
      showMuscular: muscularVisible,
      showVascular: vascularVisible,
    } = stateRef.current;

    if (mode === 'isolate' && activeOrganId) {
      // Isolated 3D Organ Macro View — show ONLY the selected organ, hide ALL surroundings!
      graph.bodyShellGroup.visible = false;
      graph.vascularGroup.visible = false;
      if (pedestalGroupRef.current) {
        pedestalGroupRef.current.visible = false;
      }

      const targetRecord = graph.organRecords.get(activeOrganId);

      // Hide skeletal, muscular, and all other system groups; only keep the target organ's parent systemGroup visible
      graph.systemGroups.forEach((group, sysId) => {
        group.visible = targetRecord ? sysId === targetRecord.systemId : false;
      });

      graph.organRecords.forEach((record) => {
        const isTarget = record.organId === activeOrganId;
        record.group.visible = isTarget;
        record.meshes.forEach((mesh) => {
          const origMat = record.originalMaterials.get(mesh);
          const currentMat = mesh.material as THREE.MeshStandardMaterial;
          if (!origMat || !currentMat) return;
          currentMat.color.copy(origMat.color);
          currentMat.opacity = origMat.opacity;
          currentMat.transparent = origMat.transparent;

          const meshSubPartId = mesh.userData?.subPartId;
          const isSelectedSubPart =
            isTarget &&
            Boolean(activeSubPartId) &&
            meshSubPartId === activeSubPartId;

          if (isSelectedSubPart && activeSubPartId) {
            const partHex = getSubPartColorHex(activeSubPartId);
            // VIBRANT CLINICAL PART COLOR: Set base & emissive color to the part's distinct hue (pink, yellow, green, etc.)
            currentMat.vertexColors = false;
            currentMat.color.setHex(partHex);
            currentMat.emissive.setHex(partHex);
            currentMat.emissiveIntensity = 0.55;
            currentMat.opacity = 1.0;
            currentMat.transparent = false;
            currentMat.depthWrite = true;
          } else {
            currentMat.vertexColors = origMat.vertexColors;
            currentMat.color.copy(origMat.color);
            currentMat.emissive.setHex(0x000000);
            currentMat.emissiveIntensity = 0;
            // Retain solid, realistic anatomical tissue appearance so unselected regions don't turn translucent or wash out
            currentMat.opacity = origMat.opacity;
            currentMat.transparent = origMat.transparent;
            currentMat.depthWrite = true;
          }
          currentMat.needsUpdate = true;
        });
      });
    } else {
      // Full Body 3D View
      if (pedestalGroupRef.current) {
        pedestalGroupRef.current.visible = true;
      }

      graph.setShellMode(activeShellMode);
      graph.vascularGroup.visible = vascularVisible;

      const nervousVisible = stateRef.current.showNervous ?? true;
      const internalOrgansVisible = stateRef.current.showInternalOrgans ?? true;

      graph.systemGroups.forEach((group, sysId) => {
        if (sysId === 'skeletal') {
          group.visible = skeletalVisible;
        } else if (sysId === 'muscular') {
          group.visible = muscularVisible;
        } else if (sysId === 'nervous') {
          group.visible = nervousVisible;
        } else {
          group.visible = internalOrgansVisible;
        }
      });

      graph.organRecords.forEach((record) => {
        if (record.systemId === 'skeletal') {
          record.group.visible = skeletalVisible;
        } else if (record.systemId === 'muscular') {
          record.group.visible = muscularVisible;
        } else if (record.systemId === 'nervous') {
          record.group.visible = nervousVisible;
        } else {
          const matchesSystem =
            activeSystemId === 'all' ||
            activeSystemId === record.systemId ||
            activeSystemId === 'skeletal' ||
            activeSystemId === 'muscular';
          record.group.visible = internalOrgansVisible && matchesSystem;
        }
        const isSelected = record.organId === activeOrganId;
        record.meshes.forEach((mesh) => {
          const origMat = record.originalMaterials.get(mesh);
          const currentMat = mesh.material as THREE.MeshStandardMaterial;
          if (!origMat || !currentMat) return;

          currentMat.color.copy(origMat.color);
          currentMat.opacity = origMat.opacity;
          currentMat.transparent = origMat.transparent;

          if (isSelected) {
            currentMat.emissive.setHex(0x38bdf8);
            currentMat.emissiveIntensity = 0.38;
          } else {
            currentMat.emissive.setHex(0x000000);
            currentMat.emissiveIntensity = 0;
          }
        });
      });
    }

    updateCameraFocusForMode();
  }, [updateCameraFocusForMode]);

  useEffect(() => {
    stateRef.current = {
      selectedOrganId,
      selectedSubPartId,
      selectedSystemId,
      viewMode,
      shellMode,
      showSkeletal,
      showMuscular,
      showVascular,
      showInternalOrgans,
      showNervous,
      animatePhysiology,
      zoomLevel,
      isActive,
      onSelectOrgan,
      onSelectSubPart,
    };
    applySceneState();

    if (selectedOrganId && sceneGraphRef.current) {
      const g = sceneGraphRef.current;
      const rec = g.organRecords.get(selectedOrganId);
      const isAlreadyGlb =
        rec && rec.meshes.length > 0 && rec.meshes[0].userData?.isRealGlbScan;
      if (!isAlreadyGlb) {
        ensurePriorityOrganGlbLoaded(
          selectedOrganId,
          g,
          () => !isMountedRef.current
        ).then((ok) => {
          if (ok && isMountedRef.current) {
            applySceneState();
          }
        });
      }
    }
  }, [
    selectedOrganId,
    selectedSubPartId,
    selectedSystemId,
    viewMode,
    shellMode,
    showSkeletal,
    showMuscular,
    showVascular,
    showInternalOrgans,
    showNervous,
    animatePhysiology,
    zoomLevel,
    onSelectOrgan,
    onSelectSubPart,
    applySceneState,
  ]);

  useEffect(() => {
    if (rendererRef.current) {
      const clearHex = canvasBackgroundColor
        ? new THREE.Color(canvasBackgroundColor).getHex()
        : 0xf8fafc;
      rendererRef.current.setClearColor(clearHex, 1);
    }
  }, [canvasBackgroundColor]);

  useEffect(() => {
    switch (cameraPreset) {
      case 'front':
        targetOrbitRef.current.theta = 0;
        targetOrbitRef.current.phi = Math.PI / 2.02;
        break;
      case 'side':
        targetOrbitRef.current.theta = Math.PI / 2.2;
        targetOrbitRef.current.phi = Math.PI / 2.02;
        break;
      case 'back':
        targetOrbitRef.current.theta = Math.PI;
        targetOrbitRef.current.phi = Math.PI / 2.02;
        break;
      case 'isometric':
        targetOrbitRef.current.theta = Math.PI / 4.2;
        targetOrbitRef.current.phi = Math.PI / 2.35;
        break;
    }
  }, [cameraPreset]);

  const handleTapRaycast = useCallback((touchX: number, touchY: number) => {
    const graph = sceneGraphRef.current;
    const camera = cameraRef.current;
    if (!graph || !camera) return;

    const { width, height } = layoutRef.current;
    if (width <= 0 || height <= 0) return;

    const ndc = new THREE.Vector2(
      (touchX / width) * 2 - 1,
      -(touchY / height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(ndc, camera);

    const pickableMeshes: THREE.Mesh[] = [];
    graph.organRecords.forEach((record) => {
      const sysGroup = graph.systemGroups.get(record.systemId);
      if (sysGroup && sysGroup.visible && record.group.visible) {
        pickableMeshes.push(...record.meshes);
      }
    });

    // Fast bounding-box + strided triangle/vertex raycast (< 2ms on mobile Hermes even for 300k-triangle scans)
    let bestHitMesh: THREE.Mesh | null = null;
    let bestWorldDist = Infinity;
    const bestWorldPoint = new THREE.Vector3();

    const invMat = new THREE.Matrix4();
    const localRay = new THREE.Ray();
    const vA = new THREE.Vector3();
    const vB = new THREE.Vector3();
    const vC = new THREE.Vector3();
    const tmpLocalHit = new THREE.Vector3();
    const tmpWorldHit = new THREE.Vector3();

    for (const mesh of pickableMeshes) {
      const geo = mesh.geometry;
      if (!geo) continue;
      if (!geo.boundingBox) {
        geo.computeBoundingBox();
      }
      const bbox = geo.boundingBox;
      if (!bbox) continue;

      mesh.updateMatrixWorld();
      invMat.copy(mesh.matrixWorld).invert();
      localRay.copy(raycaster.ray).applyMatrix4(invMat);

      if (!localRay.intersectsBox(bbox)) continue;

      const posAttr = geo.getAttribute('position');
      if (!posAttr) continue;
      const indexAttr = geo.getIndex();
      const triCount = indexAttr
        ? Math.floor(indexAttr.count / 3)
        : Math.floor(posAttr.count / 3);

      if (triCount <= 12000) {
        const triStride = triCount > 4500 ? 2 : 1;
        for (let t = 0; t < triCount; t += triStride) {
          const i0 = indexAttr ? indexAttr.getX(t * 3) : t * 3;
          const i1 = indexAttr ? indexAttr.getX(t * 3 + 1) : t * 3 + 1;
          const i2 = indexAttr ? indexAttr.getX(t * 3 + 2) : t * 3 + 2;
          vA.fromBufferAttribute(posAttr, i0);
          vB.fromBufferAttribute(posAttr, i1);
          vC.fromBufferAttribute(posAttr, i2);
          if (localRay.intersectTriangle(vA, vB, vC, false, tmpLocalHit)) {
            tmpWorldHit.copy(tmpLocalHit).applyMatrix4(mesh.matrixWorld);
            const dist = raycaster.ray.origin.distanceTo(tmpWorldHit);
            if (dist < bestWorldDist) {
              bestWorldDist = dist;
              bestHitMesh = mesh;
              bestWorldPoint.copy(tmpWorldHit);
            }
          }
        }
      } else {
        // Dense MRI/CT mesh (>12k triangles): fast strided surface-vertex proximity check along localRay
        const vCount = posAttr.count;
        const vStride = Math.max(1, Math.floor(vCount / 3500));
        const bSize = new THREE.Vector3();
        bbox.getSize(bSize);
        const radiusSq = Math.pow(
          Math.max(bSize.x, bSize.y, bSize.z) * 0.085,
          2
        );
        for (let i = 0; i < vCount; i += vStride) {
          vA.fromBufferAttribute(posAttr, i);
          if (localRay.distanceSqToPoint(vA) <= radiusSq) {
            tmpWorldHit.copy(vA).applyMatrix4(mesh.matrixWorld);
            const dist = raycaster.ray.origin.distanceTo(tmpWorldHit);
            if (dist < bestWorldDist) {
              bestWorldDist = dist;
              bestHitMesh = mesh;
              bestWorldPoint.copy(tmpWorldHit);
            }
          }
        }
      }
    }

    if (bestHitMesh) {
      const hitOrganId = bestHitMesh.userData?.organId;
      if (hitOrganId) {
        const wasAlreadyIsolatedOnThisOrgan =
          stateRef.current.viewMode === 'isolate' &&
          stateRef.current.selectedOrganId === hitOrganId;

        stateRef.current.onSelectOrgan(hitOrganId);

        // Only resolve & highlight a specific sub-part when touching the 3D organ in Separate 3D (isolate) mode
        if (wasAlreadyIsolatedOnThisOrgan && stateRef.current.onSelectSubPart) {
          let hitSubPartId: string | null =
            bestHitMesh.userData?.subPartId || null;

          const subParts = ORGAN_SUB_PARTS[hitOrganId];
          if (!hitSubPartId && subParts && subParts.length > 0) {
            const rootPt = graph.rootGroup.worldToLocal(bestWorldPoint.clone());
            let bestDist = Infinity;
            for (const sp of subParts) {
              const dx = rootPt.x - sp.localAnchor[0];
              const dy = rootPt.y - sp.localAnchor[1];
              const dz = rootPt.z - sp.localAnchor[2];
              const dist = dx * dx + dy * dy + dz * dz;
              if (dist < bestDist) {
                bestDist = dist;
                hitSubPartId = sp.id;
              }
            }
          }

          stateRef.current.onSelectSubPart(hitSubPartId);
        }
      }
    }
  }, []);

  const gestureStateRef = useRef<{
    startTheta: number;
    startPhi: number;
    initialPinchDist: number | null;
    startRadius: number;
  }>({
    startTheta: 0,
    startPhi: Math.PI / 2.05,
    initialPinchDist: null,
    startRadius: 2.85,
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
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
            targetOrbitRef.current.radius = Math.max(
              0.45,
              Math.min(5.0, nextRadius)
            );
          }
        } else {
          targetOrbitRef.current.theta =
            gestureStateRef.current.startTheta - gestureState.dx * 0.011;
          const nextPhi =
            gestureStateRef.current.startPhi - gestureState.dy * 0.008;
          targetOrbitRef.current.phi = Math.max(
            0.32,
            Math.min(Math.PI - 0.32, nextPhi)
          );
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        gestureStateRef.current.initialPinchDist = null;
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
        if (!gl || (gl as any).isPendingContext) {
          await new Promise((r) => setTimeout(r, 80));
          const contexts = (globalThis as any).__EXGLContexts;
          const ctxId = (gl as any)?.contextId;
          const realGl = ctxId && contexts ? contexts[String(ctxId)] : null;
          if (realGl && !realGl.isPendingContext) {
            gl = realGl;
          }
        }

        if (!gl || (gl as any).isPendingContext) {
          if (isMountedRef.current) {
            setTimeout(() => setGlKey((k) => k + 1), 100);
          }
          return;
        }

        const { canvasShim, width, height } = patchExpoGlForThree(gl);

        const renderer = new THREE.WebGLRenderer({
          canvas: canvasShim,
          antialias: true,
        });
        renderer.setSize(width, height, false);
        // Background color support (custom per screen, e.g. #ffebff on Explorer)
        const clearHex = canvasBackgroundColor
          ? new THREE.Color(canvasBackgroundColor).getHex()
          : 0xf8fafc;
        renderer.setClearColor(clearHex, 1);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.12;
        rendererRef.current = renderer;

        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(
          42,
          width / height,
          0.08,
          100
        );
        cameraRef.current = camera;

        // 4-Point Medical Studio Lighting Setup for Organic Depth & Rim Glow
        const ambientLight = new THREE.AmbientLight(0xf8fafc, 0.65);
        scene.add(ambientLight);

        const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e1b4b, 0.58);
        hemiLight.position.set(0, 6, 0);
        scene.add(hemiLight);

        // Warm Surgical Key Light (Front-Right)
        const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.35);
        keyLight.position.set(2.8, 4.2, 4.5);
        scene.add(keyLight);

        // Soft Fill Light (Front-Left)
        const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.65);
        fillLight.position.set(-3.2, 1.8, 3.0);
        scene.add(fillLight);

        // Medical Rim / Backlight for X-Ray Silhouette Edge Definition
        const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.95);
        rimLight.position.set(0, 3.5, -4.5);
        scene.add(rimLight);

        // Subtle Holographic Medical Pedestal Rings at Feet (visible only in Full Body mode)
        const pedestalGroup = new THREE.Group();
        pedestalGroupRef.current = pedestalGroup;

        const outerRingGeo = new THREE.RingGeometry(0.68, 0.71, 48);
        const outerRingMat = new THREE.MeshBasicMaterial({
          color: 0x0ea5e9,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.28,
        });
        const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
        outerRing.rotation.x = Math.PI / 2;
        outerRing.position.set(0, -1.32, 0);
        pedestalGroup.add(outerRing);

        const innerRingGeo = new THREE.RingGeometry(0.42, 0.44, 48);
        const innerRingMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.18,
        });
        const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
        innerRing.rotation.x = Math.PI / 2;
        innerRing.position.set(0, -1.32, 0);
        pedestalGroup.add(innerRing);

        scene.add(pedestalGroup);

        // Build Sculpted 3D Human Anatomy Scene Graph & Attach Any Pre-Cached GLB Scans Synchronously (0ms)
        const graph = buildAnatomySceneGraph();
        sceneGraphRef.current = graph;
        scene.add(graph.rootGroup);

        applyCachedGlbOrgansSync(graph);

        const priorityOrganId = stateRef.current.selectedOrganId || 'heart';
        await Promise.race([
          ensurePriorityOrganGlbLoaded(
            priorityOrganId,
            graph,
            () => !isMountedRef.current
          ),
          new Promise((resolve) => setTimeout(resolve, 2200)),
        ]);

        applySceneState();
        currentOrbitRef.current = { ...targetOrbitRef.current };

        if (isMountedRef.current) {
          setIsLoading(false);
        }

        // Demand-based loading: Only load additional models when requested to optimize Android memory and battery
        setGlbScanStatus({ loaded: 1, total: 1 });

        let clock = 0;

        const animate = () => {
          if (!isMountedRef.current) return;
          rafIdRef.current = requestAnimationFrame(animate);
          if (!stateRef.current.isActive) return;

          clock += 0.04;

          const cur = currentOrbitRef.current;
          const tgt = targetOrbitRef.current;
          cur.theta += (tgt.theta - cur.theta) * 0.26;
          cur.phi += (tgt.phi - cur.phi) * 0.26;
          cur.radius += (tgt.radius - cur.radius) * 0.26;
          cur.lookX += (tgt.lookX - cur.lookX) * 0.26;
          cur.lookY += (tgt.lookY - cur.lookY) * 0.26;
          cur.lookZ += (tgt.lookZ - cur.lookZ) * 0.26;

          camera.position.x =
            cur.lookX + cur.radius * Math.sin(cur.phi) * Math.sin(cur.theta);
          camera.position.y = cur.lookY + cur.radius * Math.cos(cur.phi);
          camera.position.z =
            cur.lookZ + cur.radius * Math.sin(cur.phi) * Math.cos(cur.theta);
          camera.lookAt(cur.lookX, cur.lookY, cur.lookZ);

          if (sceneGraphRef.current) {
            const {
              animatePhysiology: doAnim,
              selectedOrganId: selId,
              viewMode: mode,
            } = stateRef.current;

            if (doAnim) {
              if (sceneGraphRef.current.heartGroup) {
                const beat =
                  1 +
                  Math.pow(Math.sin(clock * 2.2), 6) * 0.065 +
                  Math.pow(Math.sin(clock * 2.2 - 0.4), 8) * 0.035;
                sceneGraphRef.current.heartGroup.scale.setScalar(beat);
              }
              if (sceneGraphRef.current.lungsGroup) {
                const breath = 1 + Math.sin(clock * 0.75) * 0.028;
                sceneGraphRef.current.lungsGroup.scale.set(
                  breath,
                  1 + Math.sin(clock * 0.75) * 0.018,
                  breath
                );
              }
            } else {
              sceneGraphRef.current.heartGroup?.scale.setScalar(1);
              sceneGraphRef.current.lungsGroup?.scale.setScalar(1);
            }

            // Subtle emissive highlight pulse only in full body mode so isolated organ retains pure tissue colors
            if (selId && mode === 'body') {
              const selRecord = sceneGraphRef.current.organRecords.get(selId);
              if (selRecord) {
                const pulse = 0.24 + Math.sin(clock * 2.8) * 0.14;
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
            err?.message ||
              'Unable to initialize 3D WebGL context on this device.'
          );
          setIsLoading(false);
        }
      }
    },
    [applySceneState]
  );

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
      if (rendererRef.current) {
        rendererRef.current.setSize(width, height, false);
      }
      updateCameraFocusForMode();
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
            setGlKey((k) => k + 1);
          }}
        >
          <Text style={styles.retryBtnText}>Retry 3D Initialization</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isLightBg =
    canvasBackgroundColor &&
    canvasBackgroundColor !== '#0A0F1D' &&
    canvasBackgroundColor !== '#0B0F19';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: canvasBackgroundColor || '#0B0F19' },
      ]}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      <GLView
        key={glKey}
        style={styles.glView}
        onContextCreate={onContextCreate}
      />

      {isLoading && (
        <View
          style={[
            styles.loadingOverlay,
            isLightBg && { backgroundColor: canvasBackgroundColor },
          ]}
        >
          <ActivityIndicator size="large" color="#0284C7" />
          <Text
            style={[
              styles.loadingText,
              isLightBg && { color: '#64748B' },
            ]}
          >
            Rendering 3D Anatomical Atlas...
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignSelf: 'stretch',
    backgroundColor: '#0B0F19',
    overflow: 'hidden',
  },
  glView: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignSelf: 'stretch',
  },
  glbStreamingPill: {
    position: 'absolute',
    top: 56,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    gap: 6,
  },
  glbStreamingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#BAE6FD',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(11, 15, 25, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  loadingText: {
    ...theme.typography.bodyMedium,
    color: '#94A3B8',
    marginTop: theme.spacing.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    backgroundColor: '#0B0F19',
  },
  errorTitle: {
    ...theme.typography.h3,
    color: '#F8FAFC',
    marginTop: theme.spacing.sm,
    marginBottom: 4,
  },
  errorMessage: {
    ...theme.typography.caption,
    color: '#94A3B8',
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
