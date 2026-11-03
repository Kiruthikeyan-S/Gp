import * as THREE from 'three';
import { BodySystemId } from '../types';

export interface OrganMeshRecord {
  organId: string;
  meshName: string;
  systemId: BodySystemId;
  group: THREE.Group;
  meshes: THREE.Mesh[];
  originalMaterials: Map<THREE.Mesh, THREE.MeshStandardMaterial>;
}

export interface AnatomySceneGraph {
  rootGroup: THREE.Group;
  organRecords: Map<string, OrganMeshRecord>;
  systemGroups: Map<BodySystemId, THREE.Group>;
  bodyShellGroup: THREE.Group;
  heartGroup: THREE.Group | null;
  lungsGroup: THREE.Group | null;
  dispose: () => void;
}

/**
 * Helper to register an organ's meshes so raycasting and non-destructive
 * highlighting work across composite 3D geometries.
 */
function registerOrganGroup(
  organId: string,
  meshName: string,
  systemId: BodySystemId,
  group: THREE.Group,
  organRecords: Map<string, OrganMeshRecord>
) {
  group.name = meshName;
  group.userData = { organId, meshName, systemId };

  const meshes: THREE.Mesh[] = [];
  const originalMaterials = new Map<THREE.Mesh, THREE.MeshStandardMaterial>();

  group.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.userData = { organId, meshName, systemId };
      meshes.push(mesh);
      if (mesh.material instanceof THREE.MeshStandardMaterial) {
        originalMaterials.set(mesh, mesh.material.clone());
      }
    }
  });

  organRecords.set(organId, {
    organId,
    meshName,
    systemId,
    group,
    meshes,
    originalMaterials,
  });
}

/**
 * Builds a complete, anatomically structured 3D Human Body model with
 * separate selectable organ meshes, skeletal framework, muscular layer,
 * and translucent body shell.
 */
export function buildAnatomySceneGraph(): AnatomySceneGraph {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'HumanAnatomyRoot';

  const organRecords = new Map<string, OrganMeshRecord>();
  const systemGroups = new Map<BodySystemId, THREE.Group>();

  const systems: BodySystemId[] = [
    'circulatory',
    'respiratory',
    'nervous',
    'digestive',
    'urinary',
    'skeletal',
    'muscular',
  ];

  systems.forEach((sysId) => {
    const g = new THREE.Group();
    g.name = `System_${sysId}`;
    systemGroups.set(sysId, g);
    rootGroup.add(g);
  });

  // =========================================================================
  // 1. TRANSLUCENT HUMAN BODY SHELL (Outer anatomical reference envelope)
  // =========================================================================
  const bodyShellGroup = new THREE.Group();
  bodyShellGroup.name = 'Layer_BodyShell';
  const shellMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    transparent: true,
    opacity: 0.14,
    roughness: 0.4,
    metalness: 0.05,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  // Head envelope
  const headGeo = new THREE.SphereGeometry(0.38, 24, 24);
  headGeo.scale(0.88, 1.08, 0.95);
  const headMesh = new THREE.Mesh(headGeo, shellMat);
  headMesh.position.set(0, 1.92, 0);
  bodyShellGroup.add(headMesh);

  // Neck envelope
  const neckGeo = new THREE.CylinderGeometry(0.16, 0.19, 0.28, 18);
  const neckMesh = new THREE.Mesh(neckGeo, shellMat);
  neckMesh.position.set(0, 1.48, 0);
  bodyShellGroup.add(neckMesh);

  // Upper Torso / Thorax envelope
  const thoraxGeo = new THREE.CylinderGeometry(0.54, 0.44, 0.95, 24);
  thoraxGeo.scale(1.0, 1.0, 0.62);
  const thoraxMesh = new THREE.Mesh(thoraxGeo, shellMat);
  thoraxMesh.position.set(0, 0.9, 0);
  bodyShellGroup.add(thoraxMesh);

  // Abdomen & Pelvis envelope
  const abdomenGeo = new THREE.CylinderGeometry(0.44, 0.46, 0.95, 24);
  abdomenGeo.scale(1.0, 1.0, 0.62);
  const abdomenMesh = new THREE.Mesh(abdomenGeo, shellMat);
  abdomenMesh.position.set(0, -0.02, 0);
  bodyShellGroup.add(abdomenMesh);

  // Left & Right Shoulders + Arms
  [-1, 1].forEach((side) => {
    const upperArmGeo = new THREE.CylinderGeometry(0.13, 0.11, 0.85, 16);
    const upperArm = new THREE.Mesh(upperArmGeo, shellMat);
    upperArm.position.set(side * 0.68, 0.88, 0);
    upperArm.rotation.z = side * 0.12;
    bodyShellGroup.add(upperArm);

    const forearmGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.78, 16);
    const forearm = new THREE.Mesh(forearmGeo, shellMat);
    forearm.position.set(side * 0.76, 0.12, 0.04);
    forearm.rotation.z = side * 0.06;
    bodyShellGroup.add(forearm);

    const thighGeo = new THREE.CylinderGeometry(0.19, 0.14, 0.95, 16);
    const thigh = new THREE.Mesh(thighGeo, shellMat);
    thigh.position.set(side * 0.24, -0.92, 0);
    bodyShellGroup.add(thigh);
  });

  rootGroup.add(bodyShellGroup);

  // =========================================================================
  // 2. SKELETAL SYSTEM (Cranium, Spine, Ribcage, Pelvis, Clavicles, Limbs)
  // =========================================================================
  const skeletalGroup = systemGroups.get('skeletal')!;
  const boneMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.45,
    metalness: 0.05,
    transparent: true,
    opacity: 0.55,
  });

  // Vertebral Column (24 stacked vertebrae segments)
  for (let i = 0; i < 20; i++) {
    const yPos = 1.45 - i * 0.095;
    const vGeo = new THREE.CylinderGeometry(0.065, 0.07, 0.065, 12);
    const vMesh = new THREE.Mesh(vGeo, boneMat);
    vMesh.position.set(0, yPos, -0.18);
    skeletalGroup.add(vMesh);
  }

  // Sternum (Breastbone)
  const sternumGeo = new THREE.BoxGeometry(0.09, 0.52, 0.03);
  const sternumMesh = new THREE.Mesh(sternumGeo, boneMat);
  sternumMesh.position.set(0, 0.98, 0.27);
  skeletalGroup.add(sternumMesh);

  // Ribcage (Pairs of curved ribs wrapping the thoracic cavity)
  for (let r = 0; r < 8; r++) {
    const yRib = 1.24 - r * 0.085;
    const radiusX = 0.38 + Math.sin((r / 7) * Math.PI) * 0.09;
    const ribGeo = new THREE.TorusGeometry(radiusX, 0.016, 8, 24, Math.PI * 1.65);
    const ribMesh = new THREE.Mesh(ribGeo, boneMat);
    ribMesh.position.set(0, yRib, -0.02);
    ribMesh.rotation.x = Math.PI / 2 + 0.15;
    ribMesh.rotation.z = -Math.PI * 0.325;
    ribMesh.scale.set(1, 0.68, 1);
    skeletalGroup.add(ribMesh);
  }

  // Clavicles
  [-1, 1].forEach((side) => {
    const clavGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.46, 10);
    const clavMesh = new THREE.Mesh(clavGeo, boneMat);
    clavMesh.position.set(side * 0.24, 1.32, 0.12);
    clavMesh.rotation.z = (Math.PI / 2) * side - side * 0.15;
    skeletalGroup.add(clavMesh);
  });

  // Pelvic Girdle
  const pelvisGeo = new THREE.TorusGeometry(0.32, 0.065, 12, 24, Math.PI * 1.3);
  const pelvisMesh = new THREE.Mesh(pelvisGeo, boneMat);
  pelvisMesh.position.set(0, -0.42, 0);
  pelvisMesh.rotation.x = Math.PI / 2.2;
  pelvisMesh.rotation.z = -Math.PI * 0.15;
  skeletalGroup.add(pelvisMesh);

  // =========================================================================
  // 3. MUSCULAR SYSTEM (Translucent anatomical muscle bundles)
  // =========================================================================
  const muscularGroup = systemGroups.get('muscular')!;
  const muscleMat = new THREE.MeshStandardMaterial({
    color: 0xbe185d,
    roughness: 0.6,
    metalness: 0.05,
    transparent: true,
    opacity: 0.28,
  });

  // Pectoral & Deltoid muscle groups
  [-1, 1].forEach((side) => {
    const pecGeo = new THREE.SphereGeometry(0.22, 16, 16);
    pecGeo.scale(1.1, 0.75, 0.4);
    const pecMesh = new THREE.Mesh(pecGeo, muscleMat);
    pecMesh.position.set(side * 0.21, 1.08, 0.24);
    muscularGroup.add(pecMesh);

    const deltGeo = new THREE.SphereGeometry(0.16, 16, 16);
    deltGeo.scale(0.85, 1.3, 0.85);
    const deltMesh = new THREE.Mesh(deltGeo, muscleMat);
    deltMesh.position.set(side * 0.58, 1.18, 0);
    muscularGroup.add(deltMesh);
  });

  // =========================================================================
  // 4. NERVOUS SYSTEM: BRAIN (Mesh_Brain)
  // =========================================================================
  const nervousGroup = systemGroups.get('nervous')!;
  const brainGroup = new THREE.Group();
  const brainMat = new THREE.MeshStandardMaterial({
    color: 0xa855f7,
    roughness: 0.45,
    metalness: 0.08,
  });

  // Left & Right Cerebral Hemispheres
  [-1, 1].forEach((side) => {
    const hemiGeo = new THREE.SphereGeometry(0.21, 24, 24);
    hemiGeo.scale(0.82, 0.95, 1.22);
    const hemi = new THREE.Mesh(hemiGeo, brainMat.clone());
    hemi.position.set(side * 0.11, 1.96, 0.02);
    brainGroup.add(hemi);
  });

  // Cerebellum
  const cerebellumGeo = new THREE.SphereGeometry(0.12, 16, 16);
  cerebellumGeo.scale(1.35, 0.75, 0.85);
  const cerebellum = new THREE.Mesh(cerebellumGeo, brainMat.clone());
  cerebellum.position.set(0, 1.78, -0.14);
  brainGroup.add(cerebellum);

  // Brainstem & Spinal Cord tract
  const stemGeo = new THREE.CylinderGeometry(0.045, 0.032, 0.36, 12);
  const stem = new THREE.Mesh(stemGeo, brainMat.clone());
  stem.position.set(0, 1.64, -0.08);
  brainGroup.add(stem);

  registerOrganGroup('brain', 'Mesh_Brain', 'nervous', brainGroup, organRecords);
  nervousGroup.add(brainGroup);

  // =========================================================================
  // 5. CIRCULATORY SYSTEM: HEART (Mesh_Heart) & SPLEEN (Mesh_Spleen)
  // =========================================================================
  const circulatoryGroup = systemGroups.get('circulatory')!;
  const heartGroup = new THREE.Group();
  heartGroup.position.set(0.06, 0.88, 0.1);

  const heartMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.35,
    metalness: 0.12,
  });

  // Main Ventricular Body
  const ventGeo = new THREE.SphereGeometry(0.145, 24, 24);
  ventGeo.scale(0.88, 1.22, 0.82);
  const ventMesh = new THREE.Mesh(ventGeo, heartMat.clone());
  ventMesh.rotation.z = -0.35;
  heartGroup.add(ventMesh);

  // Right Atrium bulge
  const atriumGeo = new THREE.SphereGeometry(0.085, 16, 16);
  const atriumMesh = new THREE.Mesh(atriumGeo, heartMat.clone());
  atriumMesh.position.set(-0.07, 0.08, 0.02);
  heartGroup.add(atriumMesh);

  // Aortic Arch
  const aortaMat = new THREE.MeshStandardMaterial({
    color: 0xb91c1c,
    roughness: 0.35,
    metalness: 0.1,
  });
  const aortaGeo = new THREE.TorusGeometry(0.065, 0.026, 12, 20, Math.PI);
  const aortaMesh = new THREE.Mesh(aortaGeo, aortaMat);
  aortaMesh.position.set(0.0, 0.14, 0.0);
  heartGroup.add(aortaMesh);

  // Superior Vena Cava
  const venaMat = new THREE.MeshStandardMaterial({
    color: 0x2563eb,
    roughness: 0.4,
    metalness: 0.1,
  });
  const venaGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.18, 12);
  const venaMesh = new THREE.Mesh(venaGeo, venaMat);
  venaMesh.position.set(-0.08, 0.16, -0.02);
  heartGroup.add(venaMesh);

  registerOrganGroup('heart', 'Mesh_Heart', 'circulatory', heartGroup, organRecords);
  circulatoryGroup.add(heartGroup);

  // SPLEEN (Mesh_Spleen)
  const spleenGroup = new THREE.Group();
  const spleenMat = new THREE.MeshStandardMaterial({
    color: 0x9333ea,
    roughness: 0.42,
    metalness: 0.08,
  });
  const spleenGeo = new THREE.SphereGeometry(0.1, 20, 20);
  spleenGeo.scale(0.65, 1.25, 0.85);
  const spleenMesh = new THREE.Mesh(spleenGeo, spleenMat);
  spleenMesh.position.set(0.32, 0.44, -0.04);
  spleenMesh.rotation.z = -0.25;
  spleenGroup.add(spleenMesh);

  registerOrganGroup('spleen', 'Mesh_Spleen', 'circulatory', spleenGroup, organRecords);
  circulatoryGroup.add(spleenGroup);

  // =========================================================================
  // 6. RESPIRATORY SYSTEM: LUNGS & TRACHEA (Mesh_Lungs)
  // =========================================================================
  const respiratoryGroup = systemGroups.get('respiratory')!;
  const lungsGroup = new THREE.Group();
  lungsGroup.position.set(0, 0.96, 0.02);

  const lungMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.48,
    metalness: 0.05,
    transparent: true,
    opacity: 0.88,
  });

  // Right Lung (slightly larger)
  const rLungGeo = new THREE.SphereGeometry(0.21, 24, 24);
  rLungGeo.scale(0.82, 1.48, 0.88);
  const rLung = new THREE.Mesh(rLungGeo, lungMat.clone());
  rLung.position.set(-0.22, 0, 0);
  rLung.rotation.z = 0.08;
  lungsGroup.add(rLung);

  // Left Lung (with cardiac notch space)
  const lLungGeo = new THREE.SphereGeometry(0.195, 24, 24);
  lLungGeo.scale(0.78, 1.42, 0.86);
  const lLung = new THREE.Mesh(lLungGeo, lungMat.clone());
  lLung.position.set(0.23, 0.01, 0);
  lLung.rotation.z = -0.08;
  lungsGroup.add(lLung);

  // Trachea airway
  const tracheaMat = new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    roughness: 0.4,
  });
  const tracheaGeo = new THREE.CylinderGeometry(0.036, 0.036, 0.42, 16);
  const trachea = new THREE.Mesh(tracheaGeo, tracheaMat);
  trachea.position.set(0, 0.34, 0.02);
  lungsGroup.add(trachea);

  registerOrganGroup('lungs', 'Mesh_Lungs', 'respiratory', lungsGroup, organRecords);
  respiratoryGroup.add(lungsGroup);

  // =========================================================================
  // 7. DIGESTIVE SYSTEM: LIVER, STOMACH, PANCREAS, INTESTINES
  // =========================================================================
  const digestiveGroup = systemGroups.get('digestive')!;

  // LIVER (Mesh_Liver) — Right Upper Quadrant
  const liverGroup = new THREE.Group();
  const liverMat = new THREE.MeshStandardMaterial({
    color: 0xb45309,
    roughness: 0.42,
    metalness: 0.06,
  });
  // Right lobe of liver
  const rLobeGeo = new THREE.SphereGeometry(0.19, 24, 24);
  rLobeGeo.scale(1.15, 0.78, 0.85);
  const rLobe = new THREE.Mesh(rLobeGeo, liverMat.clone());
  rLobe.position.set(-0.14, 0.5, 0.08);
  rLobe.rotation.z = 0.22;
  liverGroup.add(rLobe);

  // Left lobe of liver
  const lLobeGeo = new THREE.SphereGeometry(0.13, 20, 20);
  lLobeGeo.scale(1.1, 0.65, 0.75);
  const lLobe = new THREE.Mesh(lLobeGeo, liverMat.clone());
  lLobe.position.set(0.04, 0.54, 0.11);
  lLobe.rotation.z = -0.15;
  liverGroup.add(lLobe);

  registerOrganGroup('liver', 'Mesh_Liver', 'digestive', liverGroup, organRecords);
  digestiveGroup.add(liverGroup);

  // STOMACH (Mesh_Stomach) — Left Upper Quadrant J-Shape
  const stomachGroup = new THREE.Group();
  const stomachMat = new THREE.MeshStandardMaterial({
    color: 0xea580c,
    roughness: 0.42,
    metalness: 0.06,
  });
  const stomachBodyGeo = new THREE.SphereGeometry(0.14, 22, 22);
  stomachBodyGeo.scale(0.85, 1.35, 0.75);
  const stomachBody = new THREE.Mesh(stomachBodyGeo, stomachMat.clone());
  stomachBody.position.set(0.16, 0.44, 0.08);
  stomachBody.rotation.z = 0.48;
  stomachGroup.add(stomachBody);

  const pylorusGeo = new THREE.SphereGeometry(0.085, 16, 16);
  const pylorus = new THREE.Mesh(pylorusGeo, stomachMat.clone());
  pylorus.position.set(0.05, 0.34, 0.09);
  stomachGroup.add(pylorus);

  registerOrganGroup('stomach', 'Mesh_Stomach', 'digestive', stomachGroup, organRecords);
  digestiveGroup.add(stomachGroup);

  // PANCREAS (Mesh_Pancreas) — Deep behind stomach
  const pancreasGroup = new THREE.Group();
  const pancreasMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.5,
    metalness: 0.05,
  });
  const pancGeo = new THREE.CylinderGeometry(0.045, 0.068, 0.32, 16);
  const pancMesh = new THREE.Mesh(pancGeo, pancreasMat);
  pancMesh.position.set(0.06, 0.32, -0.02);
  pancMesh.rotation.z = Math.PI / 2 - 0.18;
  pancreasGroup.add(pancMesh);

  registerOrganGroup('pancreas', 'Mesh_Pancreas', 'digestive', pancreasGroup, organRecords);
  digestiveGroup.add(pancreasGroup);

  // SMALL INTESTINE (Mesh_SmallIntestine) — Central coiled loops
  const smallIntGroup = new THREE.Group();
  const smallIntMat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    roughness: 0.46,
    metalness: 0.05,
  });
  for (let row = 0; row < 4; row++) {
    const loopGeo = new THREE.TorusGeometry(0.13 - row * 0.012, 0.036, 12, 24);
    const loopMesh = new THREE.Mesh(loopGeo, smallIntMat.clone());
    loopMesh.position.set(
      (row % 2 === 0 ? 1 : -1) * 0.02,
      0.08 - row * 0.075,
      0.08
    );
    loopMesh.rotation.x = Math.PI / 2.6;
    loopMesh.scale.set(1.25, 0.72, 1);
    smallIntGroup.add(loopMesh);
  }

  registerOrganGroup(
    'small_intestine',
    'Mesh_SmallIntestine',
    'digestive',
    smallIntGroup,
    organRecords
  );
  digestiveGroup.add(smallIntGroup);

  // LARGE INTESTINE (Mesh_LargeIntestine) — Framing the perimeter of the abdomen
  const largeIntGroup = new THREE.Group();
  const largeIntMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.48,
    metalness: 0.05,
  });

  // Ascending colon (Right side)
  const ascGeo = new THREE.CylinderGeometry(0.055, 0.058, 0.42, 16);
  const ascMesh = new THREE.Mesh(ascGeo, largeIntMat.clone());
  ascMesh.position.set(-0.24, -0.02, 0.06);
  largeIntGroup.add(ascMesh);

  // Transverse colon (Across top)
  const transGeo = new THREE.CylinderGeometry(0.054, 0.054, 0.48, 16);
  const transMesh = new THREE.Mesh(transGeo, largeIntMat.clone());
  transMesh.position.set(0, 0.19, 0.1);
  transMesh.rotation.z = Math.PI / 2;
  largeIntGroup.add(transMesh);

  // Descending colon (Left side)
  const descGeo = new THREE.CylinderGeometry(0.052, 0.048, 0.45, 16);
  const descMesh = new THREE.Mesh(descGeo, largeIntMat.clone());
  descMesh.position.set(0.24, -0.03, 0.06);
  largeIntGroup.add(descMesh);

  // Sigmoid & Rectum
  const sigGeo = new THREE.CylinderGeometry(0.045, 0.04, 0.24, 14);
  const sigMesh = new THREE.Mesh(sigGeo, largeIntMat.clone());
  sigMesh.position.set(0.11, -0.28, 0.02);
  sigMesh.rotation.z = -0.65;
  largeIntGroup.add(sigMesh);

  registerOrganGroup(
    'large_intestine',
    'Mesh_LargeIntestine',
    'digestive',
    largeIntGroup,
    organRecords
  );
  digestiveGroup.add(largeIntGroup);

  // =========================================================================
  // 8. URINARY SYSTEM: KIDNEYS (Mesh_Kidneys)
  // =========================================================================
  const urinaryGroup = systemGroups.get('urinary')!;
  const kidneysGroup = new THREE.Group();
  const kidneyMat = new THREE.MeshStandardMaterial({
    color: 0xca8a04,
    roughness: 0.4,
    metalness: 0.08,
  });

  [-1, 1].forEach((side) => {
    const kGeo = new THREE.SphereGeometry(0.095, 20, 20);
    kGeo.scale(0.68, 1.28, 0.62);
    const kMesh = new THREE.Mesh(kGeo, kidneyMat.clone());
    // Right kidney sits slightly lower than left due to liver
    const yOffset = side === -1 ? 0.22 : 0.26;
    kMesh.position.set(side * 0.18, yOffset, -0.09);
    kMesh.rotation.z = side * -0.15;
    kidneysGroup.add(kMesh);
  });

  registerOrganGroup('kidneys', 'Mesh_Kidneys', 'urinary', kidneysGroup, organRecords);
  urinaryGroup.add(kidneysGroup);

  // Center the entire human model vertically around y=0 for smooth camera orbiting
  rootGroup.position.set(0, -0.55, 0);

  const dispose = () => {
    rootGroup.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material?.dispose();
        }
      }
    });
  };

  return {
    rootGroup,
    organRecords,
    systemGroups,
    bodyShellGroup,
    heartGroup,
    lungsGroup,
    dispose,
  };
}
