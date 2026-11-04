import * as THREE from 'three';
import { BodySystemId } from '../types';

export interface OrganMeshRecord {
  organId: string;
  meshName: string;
  systemId: BodySystemId;
  group: THREE.Group;
  meshes: THREE.Mesh[];
  originalMaterials: Map<THREE.Mesh, THREE.MeshStandardMaterial>;
  focusCenter: THREE.Vector3;
  focusRadius: number;
}

export interface AnatomySceneGraph {
  rootGroup: THREE.Group;
  organRecords: Map<string, OrganMeshRecord>;
  systemGroups: Map<BodySystemId, THREE.Group>;
  bodyShellGroup: THREE.Group;
  vascularGroup: THREE.Group;
  heartGroup: THREE.Group | null;
  lungsGroup: THREE.Group | null;
  setShellMode: (mode: 'xray' | 'solid' | 'hidden') => void;
  dispose: () => void;
}

/**
 * Helper to apply vertex colors and organic surface displacement to a BufferGeometry.
 */
function applyOrganicVertexShading(
  geometry: THREE.BufferGeometry,
  baseColorHex: number,
  creviceColorHex: number,
  displacementFn?: (x: number, y: number, z: number, nx: number, ny: number, nz: number) => {
    offset: number;
    colorMix: number;
  }
) {
  const pos = geometry.attributes.position;
  const norm = geometry.attributes.normal;
  const count = pos.count;

  const colors = new Float32Array(count * 3);
  const baseColor = new THREE.Color(baseColorHex);
  const creviceColor = new THREE.Color(creviceColorHex);
  const tempColor = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const nx = norm ? norm.getX(i) : 0;
    const ny = norm ? norm.getY(i) : 1;
    const nz = norm ? norm.getZ(i) : 0;

    let mixFactor = 0.5;
    if (displacementFn) {
      const { offset, colorMix } = displacementFn(x, y, z, nx, ny, nz);
      pos.setXYZ(i, x + nx * offset, y + ny * offset, z + nz * offset);
      mixFactor = Math.max(0, Math.min(1, colorMix));
    } else {
      mixFactor = 0.5 + 0.5 * Math.sin(x * 12 + y * 12 + z * 12);
    }

    tempColor.copy(creviceColor).lerp(baseColor, mixFactor);
    colors[i * 3] = tempColor.r;
    colors[i * 3 + 1] = tempColor.g;
    colors[i * 3 + 2] = tempColor.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
}

/**
 * Creates a variable-radius organic tube along a 3D curve (for colon haustra, stomach, vessels, etc.).
 */
function createVariableTubeGeometry(
  curve: THREE.Curve<THREE.Vector3>,
  tubularSegments: number,
  radialSegments: number,
  radiusFn: (u: number, vAngle: number) => number,
  baseColorHex: number,
  creviceColorHex: number
): THREE.BufferGeometry {
  const geometry = new THREE.TubeGeometry(curve, tubularSegments, 1, radialSegments, false);
  const pos = geometry.attributes.position;
  const uvs = geometry.attributes.uv;
  const count = pos.count;

  const colors = new Float32Array(count * 3);
  const baseColor = new THREE.Color(baseColorHex);
  const creviceColor = new THREE.Color(creviceColorHex);
  const tempColor = new THREE.Color();
  const centerPt = new THREE.Vector3();
  const radialVec = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    const u = uvs.getX(i);
    const v = uvs.getY(i) * Math.PI * 2;
    curve.getPointAt(u, centerPt);

    radialVec.set(pos.getX(i), pos.getY(i), pos.getZ(i)).sub(centerPt).normalize();
    const r = radiusFn(u, v);

    pos.setXYZ(
      i,
      centerPt.x + radialVec.x * r,
      centerPt.y + radialVec.y * r,
      centerPt.z + radialVec.z * r
    );

    // Normalize radius relative to local min/max for realistic crease shading
    const rNext = radiusFn(Math.min(1, u + 0.01), v);
    const rAvg = (r + rNext) * 0.5;
    const shade = Math.max(0.15, Math.min(1, (r / (rAvg + 0.0001)) * 0.85));
    tempColor.copy(creviceColor).lerp(baseColor, shade);
    colors[i * 3] = tempColor.r;
    colors[i * 3 + 1] = tempColor.g;
    colors[i * 3 + 2] = tempColor.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function registerOrganGroup(
  organId: string,
  meshName: string,
  systemId: BodySystemId,
  group: THREE.Group,
  focusCenter: THREE.Vector3,
  focusRadius: number,
  organRecords: Map<string, OrganMeshRecord>
) {
  group.name = meshName;
  group.userData = { organId, meshName, systemId };

  const meshes: THREE.Mesh[] = [];
  const originalMaterials = new Map<THREE.Mesh, THREE.MeshStandardMaterial>();

  group.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.userData = { ...mesh.userData, organId, meshName, systemId };
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
    focusCenter,
    focusRadius,
  });
}

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
  // 1. ANATOMICAL HUMAN BODY SILHOUETTE SHELL (Dark Medical X-Ray / Solid)
  // =========================================================================
  const bodyShellGroup = new THREE.Group();
  bodyShellGroup.name = 'Layer_BodyShell';

  const shellMaterials: THREE.MeshStandardMaterial[] = [];
  const createShellMat = (opacity = 0.28) => {
    const m = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      emissive: 0x0f172a,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity,
      roughness: 0.25,
      metalness: 0.15,
      depthWrite: false,
      side: THREE.FrontSide,
    });
    shellMaterials.push(m);
    return m;
  };
  const mainShellMat = createShellMat(0.28);

  // Sculpted Torso Lathe / Profile (Smooth neck -> shoulders -> chest -> waist -> hips)
  const torsoProfile: THREE.Vector2[] = [
    new THREE.Vector2(0.01, -0.68), // Perineum base
    new THREE.Vector2(0.39, -0.52), // Lower pelvis
    new THREE.Vector2(0.45, -0.28), // Iliac hip flare
    new THREE.Vector2(0.38, 0.06),  // Waist taper
    new THREE.Vector2(0.44, 0.42),  // Lower ribcage
    new THREE.Vector2(0.51, 0.85),  // Pectoral chest
    new THREE.Vector2(0.55, 1.18),  // Broad shoulders
    new THREE.Vector2(0.22, 1.36),  // Trapezius slope
    new THREE.Vector2(0.16, 1.56),  // Cylindrical neck
    new THREE.Vector2(0.01, 1.62),  // Neck top cap
  ];
  const torsoLatheGeo = new THREE.LatheGeometry(torsoProfile, 36);
  torsoLatheGeo.scale(1.0, 1.0, 0.58); // Flatten anterior-posterior depth naturally
  const torsoShellMesh = new THREE.Mesh(torsoLatheGeo, mainShellMat);
  bodyShellGroup.add(torsoShellMesh);

  // Sculpted Cranium & Face Silhouette
  const headShellGeo = new THREE.SphereGeometry(0.34, 32, 28);
  const hPos = headShellGeo.attributes.position;
  for (let i = 0; i < hPos.count; i++) {
    let x = hPos.getX(i);
    let y = hPos.getY(i);
    let z = hPos.getZ(i);
    // Taper jaw/chin below y < 0
    if (y < 0) {
      const jawTaper = 1.0 + y * 0.65;
      x *= Math.max(0.48, jawTaper);
      z *= Math.max(0.65, jawTaper + 0.12);
      y *= 1.18;
    } else {
      // Slightly elongate cranium dome
      y *= 1.08;
      x *= 0.88;
    }
    hPos.setXYZ(i, x, y, z);
  }
  headShellGeo.computeVertexNormals();
  const headShellMesh = new THREE.Mesh(headShellGeo, mainShellMat);
  headShellMesh.position.set(0, 1.94, 0.02);
  bodyShellGroup.add(headShellMesh);

  // Anatomical Arms & Legs Silhouette
  [-1, 1].forEach((side) => {
    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.52, 1.18, -0.02),
      new THREE.Vector3(side * 0.64, 0.76, -0.03),
      new THREE.Vector3(side * 0.72, 0.34, 0.02),
      new THREE.Vector3(side * 0.81, -0.12, 0.07),
    ]);
    const armGeo = new THREE.TubeGeometry(armCurve, 20, 0.115, 16, false);
    const armMesh = new THREE.Mesh(armGeo, mainShellMat);
    bodyShellGroup.add(armMesh);

    const legCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.23, -0.52, 0),
      new THREE.Vector3(side * 0.24, -1.05, 0.01),
      new THREE.Vector3(side * 0.23, -1.55, -0.01),
    ]);
    const legGeo = new THREE.TubeGeometry(legCurve, 16, 0.165, 16, false);
    const legMesh = new THREE.Mesh(legGeo, mainShellMat);
    bodyShellGroup.add(legMesh);
  });

  rootGroup.add(bodyShellGroup);

  // =========================================================================
  // 2. SKELETAL SYSTEM (Vertebral Column, Ribcage, Sternum, Pelvis, Clavicles)
  // =========================================================================
  const skeletalGroup = systemGroups.get('skeletal')!;
  const boneMat = new THREE.MeshStandardMaterial({
    color: 0xe6dcc8,
    roughness: 0.42,
    metalness: 0.06,
  });
  const cartilageMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.35,
    metalness: 0.05,
  });

  // 22 Articulated Vertebrae (Cervical, Thoracic, Lumbar) + Intervertebral Discs + Spinous Processes
  for (let i = 0; i < 22; i++) {
    const t = i / 21;
    const yPos = 1.56 - i * 0.088;
    // physiological spinal S-curve (cervical lordosis, thoracic kyphosis, lumbar lordosis)
    const zCurve = -0.14 + Math.sin(t * Math.PI * 2.2) * 0.035;
    const radius = 0.048 + t * 0.028;

    const vBodyGeo = new THREE.CylinderGeometry(radius * 0.95, radius, 0.054, 14);
    const vBody = new THREE.Mesh(vBodyGeo, boneMat);
    vBody.position.set(0, yPos, zCurve);
    skeletalGroup.add(vBody);

    // Intervertebral fibrocartilage disc
    const discGeo = new THREE.CylinderGeometry(radius * 0.96, radius * 0.96, 0.022, 14);
    const disc = new THREE.Mesh(discGeo, cartilageMat);
    disc.position.set(0, yPos - 0.038, zCurve);
    skeletalGroup.add(disc);

    // Posterior Spinous Process & Transverse Processes
    const spinousGeo = new THREE.BoxGeometry(0.022, 0.038, 0.075);
    const spinous = new THREE.Mesh(spinousGeo, boneMat);
    spinous.position.set(0, yPos - 0.01, zCurve - radius - 0.025);
    spinous.rotation.x = 0.35;
    skeletalGroup.add(spinous);

    const transGeo = new THREE.BoxGeometry(radius * 2.7, 0.022, 0.024);
    const trans = new THREE.Mesh(transGeo, boneMat);
    trans.position.set(0, yPos, zCurve - radius * 0.55);
    skeletalGroup.add(trans);
  }

  // Sternum (Manubrium, Body, Xiphoid Process)
  const manubriumGeo = new THREE.CylinderGeometry(0.068, 0.048, 0.14, 6);
  manubriumGeo.scale(1, 1, 0.32);
  const manubrium = new THREE.Mesh(manubriumGeo, boneMat);
  manubrium.position.set(0, 1.18, 0.23);
  skeletalGroup.add(manubrium);

  const sternumBodyGeo = new THREE.BoxGeometry(0.065, 0.34, 0.024);
  const sternumBody = new THREE.Mesh(sternumBodyGeo, boneMat);
  sternumBody.position.set(0, 0.94, 0.245);
  skeletalGroup.add(sternumBody);

  // 10 Pairs of Anatomically Curved 3D Ribs wrapping the thorax
  for (let r = 0; r < 10; r++) {
    const yStart = 1.21 - r * 0.068;
    const widthFactor = 0.29 + Math.sin((r / 9) * Math.PI * 0.85) * 0.14;
    const depthFront = 0.24 - (r > 6 ? (r - 6) * 0.035 : 0);

    [-1, 1].forEach((side) => {
      const ribCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.04, yStart, -0.14),
        new THREE.Vector3(side * (widthFactor * 0.78), yStart - 0.02, -0.11),
        new THREE.Vector3(side * widthFactor, yStart - 0.055, 0.04),
        new THREE.Vector3(side * (widthFactor * 0.65), yStart - 0.085, depthFront * 0.85),
        new THREE.Vector3(side * (r < 7 ? 0.04 : widthFactor * 0.35), yStart - 0.09, depthFront),
      ]);
      const ribGeo = new THREE.TubeGeometry(ribCurve, 20, 0.014, 8, false);
      const ribMesh = new THREE.Mesh(ribGeo, boneMat);
      skeletalGroup.add(ribMesh);
    });
  }

  // S-Curved Clavicles (Collarbones)
  [-1, 1].forEach((side) => {
    const clavCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.05, 1.24, 0.22),
      new THREE.Vector3(side * 0.22, 1.27, 0.19),
      new THREE.Vector3(side * 0.44, 1.25, 0.06),
    ]);
    const clavGeo = new THREE.TubeGeometry(clavCurve, 14, 0.017, 8, false);
    const clavMesh = new THREE.Mesh(clavGeo, boneMat);
    skeletalGroup.add(clavMesh);
  });

  // Sculpted Pelvic Girdle (Iliac Wings, Sacrum, Pubic Arch, Obturator Foramen)
  [-1, 1].forEach((side) => {
    // Flaring Iliac Wing
    const iliumCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.06, -0.26, -0.14),
      new THREE.Vector3(side * 0.26, -0.18, -0.06),
      new THREE.Vector3(side * 0.36, -0.24, 0.09),
      new THREE.Vector3(side * 0.24, -0.44, 0.14),
      new THREE.Vector3(side * 0.04, -0.52, 0.15),
    ]);
    const iliumGeo = new THREE.TubeGeometry(iliumCurve, 22, 0.046, 12, false);
    iliumGeo.scale(1, 1.25, 0.72);
    const iliumMesh = new THREE.Mesh(iliumGeo, boneMat);
    skeletalGroup.add(iliumMesh);

    // Ischial & Pubic Ramus loop (framing obturator foramen like Image 1)
    const ischiumCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.22, -0.42, 0.08),
      new THREE.Vector3(side * 0.19, -0.58, 0.04),
      new THREE.Vector3(side * 0.05, -0.54, 0.14),
    ]);
    const ischiumGeo = new THREE.TubeGeometry(ischiumCurve, 14, 0.025, 10, false);
    const ischiumMesh = new THREE.Mesh(ischiumGeo, boneMat);
    skeletalGroup.add(ischiumMesh);
  });

  // Sacrum & Coccyx wedge
  const sacrumGeo = new THREE.ConeGeometry(0.11, 0.24, 12);
  sacrumGeo.scale(1.1, 1, 0.45);
  const sacrumMesh = new THREE.Mesh(sacrumGeo, boneMat);
  sacrumMesh.position.set(0, -0.36, -0.15);
  sacrumMesh.rotation.x = Math.PI + 0.2;
  skeletalGroup.add(sacrumMesh);

  // =========================================================================
  // 3. MUSCULAR SYSTEM (Sculpted Pectorals, Deltoids, Rectus Abdominis)
  // =========================================================================
  const muscularGroup = systemGroups.get('muscular')!;
  const muscleMat = new THREE.MeshStandardMaterial({
    color: 0x9f1239,
    roughness: 0.48,
    metalness: 0.05,
    transparent: true,
    opacity: 0.45,
  });

  [-1, 1].forEach((side) => {
    const pecGeo = new THREE.SphereGeometry(0.21, 20, 20);
    pecGeo.scale(1.15, 0.78, 0.35);
    const pec = new THREE.Mesh(pecGeo, muscleMat);
    pec.position.set(side * 0.19, 1.02, 0.22);
    pec.rotation.z = side * -0.15;
    muscularGroup.add(pec);

    const deltGeo = new THREE.SphereGeometry(0.15, 18, 18);
    deltGeo.scale(0.82, 1.35, 0.85);
    const delt = new THREE.Mesh(deltGeo, muscleMat);
    delt.position.set(side * 0.54, 1.12, 0);
    muscularGroup.add(delt);

    // Six-pack Rectus Abdominis segments
    for (let a = 0; a < 4; a++) {
      const abGeo = new THREE.SphereGeometry(0.075, 14, 14);
      abGeo.scale(0.95, 0.85, 0.35);
      const ab = new THREE.Mesh(abGeo, muscleMat);
      ab.position.set(side * 0.075, 0.38 - a * 0.14, 0.22);
      muscularGroup.add(ab);
    }
  });

  // =========================================================================
  // 4. VASCULAR NETWORK (Systemic Aorta, Vena Cava, Carotid/Iliac Vessels)
  // =========================================================================
  const vascularGroup = new THREE.Group();
  vascularGroup.name = 'Layer_Vascular';
  const arteryMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.32,
    metalness: 0.12,
  });
  const veinMat = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8,
    roughness: 0.35,
    metalness: 0.12,
  });

  // Descending Abdominal Aorta & Common Iliac bifurcation
  const descAortaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.02, 1.02, -0.02),
    new THREE.Vector3(0.01, 0.65, -0.07),
    new THREE.Vector3(0.0, 0.22, -0.08),
    new THREE.Vector3(0.0, -0.18, -0.08),
  ]);
  vascularGroup.add(
    new THREE.Mesh(new THREE.TubeGeometry(descAortaCurve, 24, 0.024, 10, false), arteryMat)
  );

  // Inferior Vena Cava parallel to Aorta
  const ivcCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.05, 0.98, 0.02),
    new THREE.Vector3(-0.04, 0.55, -0.05),
    new THREE.Vector3(-0.03, 0.18, -0.07),
    new THREE.Vector3(-0.03, -0.18, -0.07),
  ]);
  vascularGroup.add(
    new THREE.Mesh(new THREE.TubeGeometry(ivcCurve, 24, 0.026, 10, false), veinMat)
  );

  // Iliac & Carotid branches
  [-1, 1].forEach((side) => {
    const iliacArt = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.18, -0.08),
      new THREE.Vector3(side * 0.12, -0.34, -0.05),
      new THREE.Vector3(side * 0.21, -0.56, 0.0),
    ]);
    vascularGroup.add(
      new THREE.Mesh(new THREE.TubeGeometry(iliacArt, 14, 0.016, 8, false), arteryMat)
    );

    const carotidArt = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.04, 1.12, 0.04),
      new THREE.Vector3(side * 0.07, 1.45, 0.02),
      new THREE.Vector3(side * 0.08, 1.78, 0.02),
    ]);
    vascularGroup.add(
      new THREE.Mesh(new THREE.TubeGeometry(carotidArt, 14, 0.013, 8, false), arteryMat)
    );
  });
  rootGroup.add(vascularGroup);

  // =========================================================================
  // 5. NERVOUS SYSTEM: SCULPTED BRAIN WITH GYRI & SULCI (Mesh_Brain)
  // =========================================================================
  const nervousGroup = systemGroups.get('nervous')!;
  const brainGroup = new THREE.Group();
  const brainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.36,
    metalness: 0.06,
  });

  // Left & Right Convoluted Cerebral Hemispheres with 3D Gyri/Sulci Folds
  [-1, 1].forEach((side) => {
    const hemiGeo = new THREE.SphereGeometry(0.22, 42, 36);
    hemiGeo.scale(0.76, 0.92, 1.22);

    applyOrganicVertexShading(
      hemiGeo,
      0xf4b4aa, // Raised gyri crown (warm fleshy coral-pink)
      0x883542, // Deep sulci vascular groove (deep crimson-rose)
      (x, y, z) => {
        // Multi-frequency gyroid brain folds
        const fold1 = Math.sin(x * 38 + Math.cos(y * 34) * 1.8) * Math.cos(z * 32);
        const fold2 = Math.cos(y * 42 + Math.sin(z * 36) * 1.6) * Math.sin(x * 30);
        const sulcus = Math.abs(fold1 + fold2 * 0.65);
        // Flatten medial interhemispheric wall
        const medialFlat = side * x < -0.02 ? -0.012 : 0;
        const offset = sulcus * 0.012 + medialFlat;
        const colorMix = Math.min(1, sulcus * 0.72 + 0.22);
        return { offset, colorMix };
      }
    );

    const hemiMesh = new THREE.Mesh(hemiGeo, brainMat.clone());
    hemiMesh.position.set(side * 0.098, 1.98, 0.02);
    hemiMesh.userData = {
      subPartId: side === -1 ? 'frontal_lobe' : 'parietal_lobe',
    };
    brainGroup.add(hemiMesh);

    // Temporal Lobe inferior bulge
    const tempGeo = new THREE.SphereGeometry(0.11, 24, 20);
    tempGeo.scale(0.75, 0.68, 1.35);
    applyOrganicVertexShading(tempGeo, 0xf2afa4, 0x8c3845, (x, y, z) => {
      const f = Math.abs(Math.sin(x * 40 + z * 35) * Math.cos(y * 38));
      return { offset: f * 0.008, colorMix: f * 0.8 + 0.2 };
    });
    const tempMesh = new THREE.Mesh(tempGeo, brainMat.clone());
    tempMesh.position.set(side * 0.13, 1.86, 0.05);
    tempMesh.rotation.x = 0.22;
    tempMesh.userData = { subPartId: 'temporal_lobe' };
    brainGroup.add(tempMesh);
  });

  // Striated Cerebellum (Folia horizontal ridges)
  const cerebellumGeo = new THREE.SphereGeometry(0.125, 32, 24);
  cerebellumGeo.scale(1.38, 0.72, 0.82);
  applyOrganicVertexShading(cerebellumGeo, 0xdfa099, 0x7a2e3a, (x, y, z) => {
    const folia = Math.abs(Math.sin(y * 85 + z * 12));
    return { offset: folia * 0.006, colorMix: folia * 0.75 + 0.2 };
  });
  const cerebellumMesh = new THREE.Mesh(cerebellumGeo, brainMat.clone());
  cerebellumMesh.position.set(0, 1.79, -0.12);
  cerebellumMesh.userData = { subPartId: 'cerebellum' };
  brainGroup.add(cerebellumMesh);

  // Pons & Medulla Oblongata (Brainstem)
  const brainstemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.85, -0.02),
    new THREE.Vector3(0, 1.76, -0.04),
    new THREE.Vector3(0, 1.64, -0.07),
  ]);
  const stemGeo = createVariableTubeGeometry(
    brainstemCurve,
    20,
    14,
    (u) => (u < 0.45 ? 0.052 - u * 0.035 : 0.032 * (1 - (u - 0.45) * 0.4)),
    0xf5d0c8,
    0xb87a74
  );
  const stemMesh = new THREE.Mesh(stemGeo, brainMat.clone());
  stemMesh.userData = { subPartId: 'pons_medulla' };
  brainGroup.add(stemMesh);

  registerOrganGroup(
    'brain',
    'Mesh_Brain',
    'nervous',
    brainGroup,
    new THREE.Vector3(0, 1.88, 0.0),
    0.68,
    organRecords
  );
  nervousGroup.add(brainGroup);

  // =========================================================================
  // 6. CIRCULATORY SYSTEM: 13-PART 3D CROSS-SECTION HEART (Mesh_Heart)
  //    Matches the exact labeled anatomical cross-section diagram:
  //    Superior/Inferior Vena Cava (blue), Pulmonary Artery (blue),
  //    Aorta with 3 branches (red), Pulmonary Veins (red),
  //    Pink Cutaway Myocardium & Septum, 4 Burgundy Chambers,
  //    4 White Cardiac Valves & 3D White Blood-Flow Arrows!
  // =========================================================================
  const circulatoryGroup = systemGroups.get('circulatory')!;
  const heartGroup = new THREE.Group();
  heartGroup.position.set(0.055, 0.86, 0.09);

  const heartMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.3,
    metalness: 0.08,
  });

  const addHeartSubMesh = (
    geo: THREE.BufferGeometry,
    subPartId: string,
    pos?: [number, number, number],
    rot?: [number, number, number],
    customMat?: THREE.MeshStandardMaterial
  ) => {
    const m = new THREE.Mesh(geo, (customMat || heartMat).clone());
    m.userData = { subPartId };
    if (pos) m.position.set(pos[0], pos[1], pos[2]);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    heartGroup.add(m);
    return m;
  };

  // A. Sculpted Cutaway Myocardial Wall & Interventricular Septum (Pink-Flesh Anterior Cutaway + Crimson Posterior)
  const ventGeo = new THREE.SphereGeometry(0.162, 42, 36);
  const vPos = ventGeo.attributes.position;
  for (let i = 0; i < vPos.count; i++) {
    let x = vPos.getX(i);
    let y = vPos.getY(i);
    let z = vPos.getZ(i);
    if (y < 0) {
      const taper = 1 + y * 1.95;
      x = x * Math.max(0.32, taper) + (-y) * 0.22;
      z = z * Math.max(0.35, taper);
      y *= 1.28;
    } else {
      y *= 0.88;
    }
    // Flatten anterior cutaway plane at z > 0.042 to reveal the 4 internal chambers & septum
    if (z > 0.042) {
      z = 0.042 + (z - 0.042) * 0.15;
    }
    vPos.setXYZ(i, x, y, z);
  }
  ventGeo.computeVertexNormals();

  applyOrganicVertexShading(ventGeo, 0xf6c4be, 0xc83e3b, (_x, _y, z) => {
    // Anterior cutaway face (z > 0.03) is soft anatomical pink-flesh (#F6C4BE); posterior is crimson myocardium
    const isCutawayPlane = z > 0.028;
    return {
      offset: 0,
      colorMix: isCutawayPlane ? 0.96 : 0.22,
    };
  });
  addHeartSubMesh(ventGeo, 'left_ventricle');

  // B. 4 Deep-Burgundy Hollow Cutaway Chambers (Right Atrium, Right Ventricle, Left Atrium, Left Ventricle)
  const chamberMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.42,
    metalness: 0.04,
  });

  // 1. Right Atrium (Upper-Left Cavity)
  const raChamberGeo = new THREE.SphereGeometry(0.056, 26, 22);
  raChamberGeo.scale(0.82, 1.18, 0.38);
  applyOrganicVertexShading(raChamberGeo, 0x802432, 0x470e18);
  addHeartSubMesh(
    raChamberGeo,
    'right_atrium',
    [-0.102, 0.035, 0.042],
    [0, 0, 0.12],
    chamberMat
  );

  // 2. Right Ventricle (Lower-Left Crescent Cavity)
  const rvChamberGeo = new THREE.SphereGeometry(0.068, 28, 24);
  rvChamberGeo.scale(0.78, 1.32, 0.38);
  applyOrganicVertexShading(rvChamberGeo, 0x7a202e, 0x420c16);
  addHeartSubMesh(
    rvChamberGeo,
    'right_ventricle',
    [-0.042, -0.095, 0.044],
    [0, 0, -0.22],
    chamberMat
  );

  // 3. Left Atrium (Upper-Right Cavity)
  const laChamberGeo = new THREE.SphereGeometry(0.048, 24, 20);
  laChamberGeo.scale(0.78, 1.12, 0.38);
  applyOrganicVertexShading(laChamberGeo, 0x7c2230, 0x440d17);
  addHeartSubMesh(
    laChamberGeo,
    'left_atrium',
    [0.092, 0.065, 0.038],
    [0, 0, -0.15],
    chamberMat
  );

  // 4. Left Ventricle (Lower-Right Thick-Walled Cavity)
  const lvChamberGeo = new THREE.SphereGeometry(0.066, 28, 24);
  lvChamberGeo.scale(0.75, 1.38, 0.38);
  applyOrganicVertexShading(lvChamberGeo, 0x7a202e, 0x420c16);
  addHeartSubMesh(
    lvChamberGeo,
    'left_ventricle',
    [0.068, -0.088, 0.044],
    [0, 0, 0.18],
    chamberMat
  );

  // C. Bright Venous-Blue Great Vessels (Superior Vena Cava, Inferior Vena Cava, Pulmonary Artery)
  // 5. Superior Vena Cava (Vertical blue trunk on upper-left + 2 top branches + right branch)
  const svcCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.105, 0.08, 0.02),
    new THREE.Vector3(-0.115, 0.17, 0.015),
    new THREE.Vector3(-0.128, 0.27, 0.01),
  ]);
  const svcGeo = createVariableTubeGeometry(
    svcCurve,
    20,
    16,
    (u) => 0.032 - u * 0.004,
    0x0ea5e9,
    0x0369a1
  );
  addHeartSubMesh(svcGeo, 'superior_vena_cava');

  const svcRightBranchCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.11, 0.18, 0.015),
    new THREE.Vector3(-0.075, 0.255, 0.01),
  ]);
  addHeartSubMesh(
    createVariableTubeGeometry(
      svcRightBranchCurve,
      12,
      12,
      () => 0.02,
      0x0ea5e9,
      0x0369a1
    ),
    'superior_vena_cava'
  );

  const svcSideBranchCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.115, 0.16, 0.0),
    new THREE.Vector3(-0.19, 0.175, -0.01),
  ]);
  addHeartSubMesh(
    createVariableTubeGeometry(
      svcSideBranchCurve,
      10,
      10,
      () => 0.02,
      0x0284c7,
      0x075985
    ),
    'superior_vena_cava'
  );

  // 6. Inferior Vena Cava (Vertical blue trunk at bottom-left ascending into right atrium)
  const ivcHeartCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.128, -0.22, -0.01),
    new THREE.Vector3(-0.122, -0.13, -0.005),
    new THREE.Vector3(-0.112, -0.04, 0.005),
  ]);
  addHeartSubMesh(
    createVariableTubeGeometry(
      ivcHeartCurve,
      16,
      14,
      () => 0.026,
      0x0ea5e9,
      0x0369a1
    ),
    'inferior_vena_cava'
  );

  // 7. Pulmonary Artery (Blue trunk rising diagonally from Right Ventricle & bifurcating Left/Right)
  const pulmMainCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.022, 0.02, 0.062),
    new THREE.Vector3(0.01, 0.095, 0.058),
    new THREE.Vector3(0.048, 0.155, 0.048),
    new THREE.Vector3(0.165, 0.19, 0.032),
  ]);
  addHeartSubMesh(
    createVariableTubeGeometry(
      pulmMainCurve,
      24,
      16,
      (u) => (u < 0.6 ? 0.031 : 0.025),
      0x0ea5e9,
      0x0369a1
    ),
    'pulmonary_artery'
  );

  const pulmLeftBranch = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.035, 0.145, 0.05),
    new THREE.Vector3(0.005, 0.195, 0.04),
  ]);
  addHeartSubMesh(
    createVariableTubeGeometry(
      pulmLeftBranch,
      10,
      12,
      () => 0.022,
      0x0ea5e9,
      0x0369a1
    ),
    'pulmonary_artery'
  );

  // D. Bright Arterial-Red Great Vessels (Aorta with 3 Superior Branches + Left/Right Pulmonary Veins)
  // 8. Aorta (Large red Aortic Arch + 3 Superior Arterial Branches)
  const aorticArchCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.032, 0.02, 0.045),
    new THREE.Vector3(0.015, 0.12, 0.025),
    new THREE.Vector3(-0.005, 0.205, 0.015),
    new THREE.Vector3(0.035, 0.195, -0.01),
    new THREE.Vector3(0.055, 0.11, -0.03),
  ]);
  addHeartSubMesh(
    createVariableTubeGeometry(
      aorticArchCurve,
      28,
      18,
      (u) => 0.044 - u * 0.008,
      0xef4444,
      0x991b1b
    ),
    'aorta'
  );

  // 3 Superior Aortic Arch Branches (Brachiocephalic, Left Common Carotid, Left Subclavian)
  [
    { start: [-0.032, 0.21, 0.015], end: [-0.055, 0.305, 0.01] },
    { start: [0.0, 0.22, 0.01], end: [0.0, 0.315, 0.005] },
    { start: [0.032, 0.21, 0.005], end: [0.048, 0.305, 0.0] },
  ].forEach((b) => {
    const bCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(b.start[0], b.start[1], b.start[2]),
      new THREE.Vector3(b.end[0], b.end[1], b.end[2]),
    ]);
    addHeartSubMesh(
      createVariableTubeGeometry(bCurve, 10, 10, () => 0.014, 0xef4444, 0x991b1b),
      'aorta'
    );
  });

  // 9. Pulmonary Veins (Pairs of bright-red horizontal vessels on Left & Right entering Left Atrium)
  [
    { y: 0.102, side: -1 },
    { y: 0.062, side: -1 },
    { y: 0.102, side: 1 },
    { y: 0.062, side: 1 },
  ].forEach((pv) => {
    const pvCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(pv.side * 0.11, pv.y, 0.0),
      new THREE.Vector3(pv.side * 0.185, pv.y + 0.008, -0.01),
    ]);
    addHeartSubMesh(
      createVariableTubeGeometry(pvCurve, 10, 10, () => 0.015, 0xef4444, 0x991b1b),
      'pulmonary_vein'
    );
  });

  // E. 4 Ivory-White Cardiac Valves (Tricuspid, Pulmonary, Mitral, Aortic)
  const valveMat = new THREE.MeshStandardMaterial({
    color: 0xfff1f2,
    roughness: 0.25,
    metalness: 0.05,
  });

  const buildValveCusps = (
    subPartId: string,
    center: [number, number, number],
    rotZ: number
  ) => {
    [-0.012, 0.012].forEach((dx, idx) => {
      const cuspGeo = new THREE.SphereGeometry(0.016, 14, 12);
      cuspGeo.scale(1.15, 0.42, 0.65);
      addHeartSubMesh(
        cuspGeo,
        subPartId,
        [center[0] + dx, center[1], center[2]],
        [0, 0, rotZ + (idx === 0 ? -0.35 : 0.35)],
        valveMat
      );
    });
  };

  buildValveCusps('pulmonary_valve', [-0.022, 0.018, 0.072], 0.25);
  buildValveCusps('tricuspid_valve', [-0.076, -0.024, 0.065], -0.2);
  buildValveCusps('mitral_valve', [0.082, 0.005, 0.065], 0.2);
  buildValveCusps('aortic_valve', [0.032, 0.014, 0.068], -0.15);

  // F. 3D White Blood-Flow Directional Arrows inside Chambers & Great Vessels (matching Diagram)
  const arrowMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xe2e8f0,
    emissiveIntensity: 0.35,
    roughness: 0.2,
  });

  const addFlowArrow3D = (points: [number, number, number][], subPartId: string) => {
    const vecs = points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    const curve = new THREE.CatmullRomCurve3(vecs);
    const shaftGeo = new THREE.TubeGeometry(curve, 14, 0.0042, 8, false);
    addHeartSubMesh(shaftGeo, subPartId, undefined, undefined, arrowMat);

    // Arrowhead cone at tip
    const tip = vecs[vecs.length - 1];
    const prev = vecs[vecs.length - 2];
    const dir = new THREE.Vector3().subVectors(tip, prev).normalize();
    const coneGeo = new THREE.ConeGeometry(0.01, 0.022, 10);
    const coneMesh = new THREE.Mesh(coneGeo, arrowMat);
    coneMesh.position.copy(tip);
    coneMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    coneMesh.userData = { subPartId };
    heartGroup.add(coneMesh);
  };

  // Blood flow arrows matching the reference diagram:
  // 1. Superior Vena Cava -> Right Atrium (downward)
  addFlowArrow3D(
    [
      [-0.118, 0.21, 0.048],
      [-0.112, 0.12, 0.052],
    ],
    'superior_vena_cava'
  );
  // 2. Inferior Vena Cava -> Right Atrium (upward)
  addFlowArrow3D(
    [
      [-0.125, -0.19, 0.022],
      [-0.12, -0.11, 0.025],
    ],
    'inferior_vena_cava'
  );
  // 3. Right Atrium -> Right Ventricle (downward through tricuspid valve)
  addFlowArrow3D(
    [
      [-0.102, 0.06, 0.062],
      [-0.088, -0.01, 0.065],
    ],
    'right_atrium'
  );
  // 4. Right Ventricle U-turn upward toward Pulmonary Valve
  addFlowArrow3D(
    [
      [-0.062, -0.09, 0.065],
      [-0.032, -0.12, 0.066],
      [-0.025, -0.04, 0.068],
    ],
    'right_ventricle'
  );
  // 5. Pulmonary Artery upward flow
  addFlowArrow3D(
    [
      [0.0, 0.065, 0.085],
      [0.042, 0.145, 0.078],
    ],
    'pulmonary_artery'
  );
  // 6. Left Atrium -> Left Ventricle (downward)
  addFlowArrow3D(
    [
      [0.092, 0.085, 0.06],
      [0.092, 0.03, 0.064],
    ],
    'left_atrium'
  );
  // 7. Left Ventricle U-turn upward toward Aortic Valve
  addFlowArrow3D(
    [
      [0.088, -0.05, 0.065],
      [0.068, -0.095, 0.066],
      [0.042, -0.035, 0.068],
    ],
    'left_ventricle'
  );
  // 8. Aortic Arch upward flow
  addFlowArrow3D(
    [
      [-0.012, 0.11, 0.055],
      [0.005, 0.19, 0.052],
    ],
    'aorta'
  );

  registerOrganGroup(
    'heart',
    'Mesh_Heart',
    'circulatory',
    heartGroup,
    new THREE.Vector3(0.055, 0.88, 0.09),
    0.66,
    organRecords
  );
  circulatoryGroup.add(heartGroup);

  // SPLEEN (Mesh_Spleen) — Cupped purple-crimson lymphoid organ in left upper quadrant
  const spleenGroup = new THREE.Group();
  const spleenMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.34,
    metalness: 0.08,
  });
  const spleenGeo = new THREE.SphereGeometry(0.105, 28, 24);
  spleenGeo.scale(0.58, 1.25, 0.85);
  applyOrganicVertexShading(spleenGeo, 0x862e73, 0x4c1440, (x, y, z) => {
    const l = Math.sin(y * 28 + z * 22) * 0.004;
    return { offset: l, colorMix: 0.5 + 0.4 * Math.cos(y * 15) };
  });
  const spleenMesh = new THREE.Mesh(spleenGeo, spleenMat);
  spleenMesh.position.set(0.31, 0.46, -0.03);
  spleenMesh.rotation.z = -0.28;
  spleenGroup.add(spleenMesh);

  registerOrganGroup(
    'spleen',
    'Mesh_Spleen',
    'circulatory',
    spleenGroup,
    new THREE.Vector3(0.31, 0.46, -0.03),
    0.5,
    organRecords
  );
  circulatoryGroup.add(spleenGroup);

  // =========================================================================
  // 7. RESPIRATORY SYSTEM: SCULPTED LUNGS & TRACHEA (Mesh_Lungs)
  // =========================================================================
  const respiratoryGroup = systemGroups.get('respiratory')!;
  const lungsGroup = new THREE.Group();
  lungsGroup.position.set(0, 0.94, 0.03);

  const lungMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.42,
    metalness: 0.04,
  });

  // Sculpt Left & Right Multi-Lobed Lungs (Flat diaphragmatic base, tapered apex, oblique fissure)
  [-1, 1].forEach((side) => {
    const isLeft = side === 1;
    const lGeo = new THREE.SphereGeometry(0.22, 38, 34);
    const lPos = lGeo.attributes.position;

    for (let i = 0; i < lPos.count; i++) {
      let x = lPos.getX(i);
      let y = lPos.getY(i);
      let z = lPos.getZ(i);

      // Elongate vertically
      y *= 1.48;
      // Taper apex at top
      if (y > 0) {
        const apexTaper = 1.0 - (y / 0.34) * 0.48;
        x *= Math.max(0.35, apexTaper);
        z *= Math.max(0.42, apexTaper);
      }
      // Concave diaphragmatic dome at bottom (y < -0.18)
      if (y < -0.18) {
        y = -0.22 + (x * x + z * z) * 0.45;
      }
      // Flatten mediastinal inner wall & carve cardiac notch on left lung
      if (side * x < 0) {
        x *= 0.55;
        if (isLeft && y < 0.05 && y > -0.22 && z > -0.05) {
          x += 0.055; // Cardiac impression for heart
        }
      } else {
        x *= 0.95;
      }
      z *= 0.88;
      lPos.setXYZ(i, x, y, z);
    }
    lGeo.computeVertexNormals();

    applyOrganicVertexShading(
      lGeo,
      0xe67e76, // Healthy salmon-coral pulmonary parenchyma (like Image 1)
      0xa8423b, // Interlobular fissure & vascular shading
      (x, y, z) => {
        // Oblique anatomical fissure indentation
        const fissurePlane = Math.abs(y - z * 0.85 + 0.04);
        const fissureGroove = fissurePlane < 0.018 ? -0.009 : 0;
        const lobule = Math.sin(x * 48) * Math.cos(y * 48) * Math.sin(z * 48) * 0.003;
        return {
          offset: fissureGroove + lobule,
          colorMix: fissurePlane < 0.022 ? 0.15 : 0.55 + Math.sin(x * 35 + y * 30) * 0.35,
        };
      }
    );

    const lungMesh = new THREE.Mesh(lGeo, lungMat.clone());
    lungMesh.position.set(side * 0.185, 0, 0);
    lungMesh.userData = {
      subPartId: isLeft ? 'left_superior_lobe' : 'right_superior_lobe',
    };
    lungsGroup.add(lungMesh);
  });

  // Trachea & Cartilaginous C-Rings + Mainstem Bronchi
  const tracheaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.48, 0.01),
    new THREE.Vector3(0, 0.28, 0.01),
    new THREE.Vector3(0, 0.14, 0.0),
  ]);
  const tracheaGeo = createVariableTubeGeometry(
    tracheaCurve,
    28,
    16,
    (u) => 0.033 + Math.sin(u * Math.PI * 22) * 0.0035,
    0xdbeafe,
    0x93c5fd
  );
  const tracheaMesh = new THREE.Mesh(tracheaGeo, lungMat.clone());
  tracheaMesh.userData = { subPartId: 'trachea' };
  lungsGroup.add(tracheaMesh);

  registerOrganGroup(
    'lungs',
    'Mesh_Lungs',
    'respiratory',
    lungsGroup,
    new THREE.Vector3(0, 0.94, 0.03),
    1.15,
    organRecords
  );
  respiratoryGroup.add(lungsGroup);

  // =========================================================================
  // 8. DIGESTIVE SYSTEM: LIVER, STOMACH, PANCREAS, SMALL & LARGE INTESTINES
  // =========================================================================
  const digestiveGroup = systemGroups.get('digestive')!;

  // A. LIVER & GALLBLADDER (Mesh_Liver)
  const liverGroup = new THREE.Group();
  const liverMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.25,
    metalness: 0.08,
  });

  // Sculpted Wedge-Shaped Right & Left Hepatic Lobes
  const rHepaticGeo = new THREE.SphereGeometry(0.185, 32, 28);
  rHepaticGeo.scale(1.18, 0.78, 0.82);
  applyOrganicVertexShading(rHepaticGeo, 0x7c2d24, 0x471510, (x, y, z) => {
    const smooth = Math.sin(x * 16 + y * 14) * 0.003;
    return { offset: smooth, colorMix: 0.55 + 0.35 * Math.cos(y * 12 + z * 10) };
  });
  const rHepatic = new THREE.Mesh(rHepaticGeo, liverMat.clone());
  rHepatic.position.set(-0.13, 0.52, 0.09);
  rHepatic.rotation.z = 0.24;
  rHepatic.userData = { subPartId: 'right_hepatic_lobe' };
  liverGroup.add(rHepatic);

  const lHepaticGeo = new THREE.SphereGeometry(0.135, 28, 24);
  lHepaticGeo.scale(1.22, 0.62, 0.72);
  applyOrganicVertexShading(lHepaticGeo, 0x853228, 0x4d1812);
  const lHepatic = new THREE.Mesh(lHepaticGeo, liverMat.clone());
  lHepatic.position.set(0.05, 0.56, 0.11);
  lHepatic.rotation.z = -0.18;
  lHepatic.userData = { subPartId: 'left_hepatic_lobe' };
  liverGroup.add(lHepatic);

  // White Falciform Ligament dividing Right & Left Lobes (like Image 1 & Image 3)
  const falciformCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.02, 0.63, 0.15),
    new THREE.Vector3(-0.03, 0.54, 0.18),
    new THREE.Vector3(-0.04, 0.45, 0.16),
  ]);
  const falciformGeo = createVariableTubeGeometry(
    falciformCurve,
    12,
    8,
    () => 0.009,
    0xf8fafc,
    0xcbd5e1
  );
  const falciformMesh = new THREE.Mesh(falciformGeo, liverMat.clone());
  falciformMesh.userData = { subPartId: 'falciform_ligament' };
  liverGroup.add(falciformMesh);

  // Green Pear-Shaped Gallbladder tucked under Right Lobe
  const gbGeo = new THREE.SphereGeometry(0.042, 18, 16);
  gbGeo.scale(0.75, 1.35, 0.75);
  applyOrganicVertexShading(gbGeo, 0x65a30d, 0x365314);
  const gbMesh = new THREE.Mesh(gbGeo, liverMat.clone());
  gbMesh.position.set(-0.14, 0.41, 0.14);
  gbMesh.rotation.z = 0.35;
  gbMesh.userData = { subPartId: 'gallbladder' };
  liverGroup.add(gbMesh);

  registerOrganGroup(
    'liver',
    'Mesh_Liver',
    'digestive',
    liverGroup,
    new THREE.Vector3(-0.06, 0.52, 0.1),
    0.85,
    organRecords
  );
  digestiveGroup.add(liverGroup);

  // B. J-SHAPED STOMACH (Mesh_Stomach)
  const stomachGroup = new THREE.Group();
  const stomachMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.34,
    metalness: 0.06,
  });

  const stomachCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.04, 0.64, 0.04),  // Esophageal cardia junction
    new THREE.Vector3(0.18, 0.58, 0.06),  // Fundus dome
    new THREE.Vector3(0.22, 0.45, 0.09),  // Greater curvature body
    new THREE.Vector3(0.14, 0.35, 0.11),  // Pyloric antrum
    new THREE.Vector3(0.02, 0.37, 0.08),  // Pyloric sphincter to duodenum
  ]);
  const stomachGeo = createVariableTubeGeometry(
    stomachCurve,
    36,
    24,
    (u) => {
      // Swell wide at fundus/body (u = 0.25..0.65), narrow at cardia & pylorus
      const bell = Math.sin(u * Math.PI);
      return 0.032 + bell * 0.082;
    },
    0xf0938c, // Smooth gastric pink-coral (like Image 1)
    0xb5534c
  );
  stomachGroup.add(new THREE.Mesh(stomachGeo, stomachMat));

  registerOrganGroup(
    'stomach',
    'Mesh_Stomach',
    'digestive',
    stomachGroup,
    new THREE.Vector3(0.14, 0.46, 0.09),
    0.75,
    organRecords
  );
  digestiveGroup.add(stomachGroup);

  // C. LOBULATED PANCREAS (Mesh_Pancreas)
  const pancreasGroup = new THREE.Group();
  const pancreasMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.46,
    metalness: 0.04,
  });
  const pancCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.02, 0.28, 0.02), // Head in duodenal C-loop
    new THREE.Vector3(0.04, 0.33, 0.01),  // Neck
    new THREE.Vector3(0.14, 0.36, 0.0),   // Body
    new THREE.Vector3(0.25, 0.41, -0.02), // Tail reaching spleen
  ]);
  const pancGeo = createVariableTubeGeometry(
    pancCurve,
    28,
    18,
    (u, v) => {
      const baseR = 0.056 * (1 - u * 0.48);
      const lobule = Math.sin(u * 65) * Math.cos(v * 6) * 0.006;
      return baseR + lobule;
    },
    0xfbbf24,
    0xb45309
  );
  pancreasGroup.add(new THREE.Mesh(pancGeo, pancreasMat));

  registerOrganGroup(
    'pancreas',
    'Mesh_Pancreas',
    'digestive',
    pancreasGroup,
    new THREE.Vector3(0.1, 0.34, 0.0),
    0.68,
    organRecords
  );
  digestiveGroup.add(pancreasGroup);

  // D. SERPENTINE SMALL INTESTINE COILS (Mesh_SmallIntestine)
  const smallIntGroup = new THREE.Group();
  const smallIntMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.36,
    metalness: 0.05,
  });

  // Generate organic, tightly folded serpentine coils filling the central abdomen (like Image 1)
  const coilPoints: THREE.Vector3[] = [];
  const numRows = 7;
  const ptsPerRow = 10;
  for (let r = 0; r < numRows; r++) {
    const vProg = r / (numRows - 1);
    const yBase = 0.14 - vProg * 0.44;
    const dir = r % 2 === 0 ? 1 : -1;
    for (let c = 0; c < ptsPerRow; c++) {
      const hProg = c / (ptsPerRow - 1);
      const xSpan = (dir === 1 ? -0.17 + hProg * 0.34 : 0.17 - hProg * 0.34) * (1 - vProg * 0.15);
      const yWave = Math.sin(c * 1.8 + r * 1.3) * 0.032;
      const zWave = 0.09 + Math.cos(c * 1.6 + r * 2.1) * 0.038;
      coilPoints.push(new THREE.Vector3(xSpan, yBase + yWave, zWave));
    }
  }
  const smallIntCurve = new THREE.CatmullRomCurve3(coilPoints, false, 'centripetal', 0.5);
  const smallIntGeo = createVariableTubeGeometry(
    smallIntCurve,
    180,
    14,
    (u) => 0.034 + Math.sin(u * Math.PI * 45) * 0.004,
    0xeb8c86, // Warm rosy intestinal pink (matching Image 1)
    0xa64944
  );
  smallIntGroup.add(new THREE.Mesh(smallIntGeo, smallIntMat));

  registerOrganGroup(
    'small_intestine',
    'Mesh_SmallIntestine',
    'digestive',
    smallIntGroup,
    new THREE.Vector3(0, -0.08, 0.09),
    0.85,
    organRecords
  );
  digestiveGroup.add(smallIntGroup);

  // E. HAUSTRATED LARGE INTESTINE / COLON FRAME (Mesh_LargeIntestine)
  const largeIntGroup = new THREE.Group();
  const largeIntMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.38,
    metalness: 0.05,
  });

  // Continuous anatomical colon path: Cecum -> Ascending -> Hepatic Flexure -> Transverse -> Splenic Flexure -> Descending -> Sigmoid -> Rectum
  const colonCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.22, -0.26, 0.08), // Cecum pouch (Right lower quadrant)
    new THREE.Vector3(-0.24, -0.06, 0.07), // Ascending colon
    new THREE.Vector3(-0.23, 0.18, 0.08),  // Right hepatic flexure
    new THREE.Vector3(-0.11, 0.22, 0.13),  // Transverse colon right
    new THREE.Vector3(0.0, 0.20, 0.14),    // Transverse colon mid-dip
    new THREE.Vector3(0.12, 0.23, 0.13),   // Transverse colon left
    new THREE.Vector3(0.24, 0.21, 0.07),   // Left splenic flexure
    new THREE.Vector3(0.25, -0.04, 0.06),  // Descending colon
    new THREE.Vector3(0.22, -0.26, 0.06),  // Iliac colon
    new THREE.Vector3(0.09, -0.34, 0.04),  // Sigmoid S-curve
    new THREE.Vector3(0.0, -0.42, -0.02),  // Upper rectum
    new THREE.Vector3(0.0, -0.54, -0.04),  // Lower rectum
  ]);

  // Haustra (segmented pouches created by strong sinusoidal radius modulation along the colon)
  const colonGeo = createVariableTubeGeometry(
    colonCurve,
    140,
    18,
    (u, v) => {
      const haustra = Math.abs(Math.sin(u * Math.PI * 34)) * 0.016;
      const teniae = Math.cos(v * 3) * 0.004;
      const taperEnd = u > 0.88 ? 1 - (u - 0.88) * 2.2 : 1.0;
      return (0.048 + haustra + teniae) * Math.max(0.55, taperEnd);
    },
    0xe5857b, // Haustrated colon coral-pink (like Image 1)
    0x993d35
  );
  largeIntGroup.add(new THREE.Mesh(colonGeo, largeIntMat));

  registerOrganGroup(
    'large_intestine',
    'Mesh_LargeIntestine',
    'digestive',
    largeIntGroup,
    new THREE.Vector3(0, -0.06, 0.08),
    0.95,
    organRecords
  );
  digestiveGroup.add(largeIntGroup);

  // =========================================================================
  // 9. URINARY SYSTEM: BEAN-SHAPED KIDNEYS, URETERS & BLADDER (Mesh_Kidneys)
  // =========================================================================
  const urinaryGroup = systemGroups.get('urinary')!;
  const kidneysGroup = new THREE.Group();
  const kidneyMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.32,
    metalness: 0.08,
  });

  [-1, 1].forEach((side) => {
    // Sculpted Reniform (Bean-Shaped) Kidney with concave medial hilum
    const kGeo = new THREE.SphereGeometry(0.095, 28, 24);
    const kPos = kGeo.attributes.position;
    for (let i = 0; i < kPos.count; i++) {
      let x = kPos.getX(i);
      let y = kPos.getY(i);
      let z = kPos.getZ(i);

      y *= 1.38;
      z *= 0.62;
      x *= 0.78;
      // Carve medial hilum indentation facing spine (side * x < 0)
      const hilumProfile = Math.exp(-(y * y) * 85);
      if (side * x < 0) {
        x += side * hilumProfile * 0.042;
      } else {
        x += side * hilumProfile * 0.015;
      }
      kPos.setXYZ(i, x, y, z);
    }
    kGeo.computeVertexNormals();
    applyOrganicVertexShading(kGeo, 0xa13d2d, 0x5c1c12);

    const yOffset = side === -1 ? 0.21 : 0.25; // Right kidney slightly lower under liver
    const kMesh = new THREE.Mesh(kGeo, kidneyMat.clone());
    kMesh.position.set(side * 0.17, yOffset, -0.06);
    kMesh.rotation.z = side * -0.14;
    kMesh.userData = {
      subPartId: side === -1 ? 'right_kidney' : 'left_kidney',
    };
    kidneysGroup.add(kMesh);

    // Suprarenal (Adrenal) Gland cap atop each kidney
    const adrenalGeo = new THREE.ConeGeometry(0.042, 0.048, 14);
    adrenalGeo.scale(1.1, 1, 0.65);
    applyOrganicVertexShading(adrenalGeo, 0xf59e0b, 0xb45309);
    const adrenal = new THREE.Mesh(adrenalGeo, kidneyMat.clone());
    adrenal.position.set(side * 0.155, yOffset + 0.13, -0.06);
    adrenal.rotation.z = side * 0.25;
    adrenal.userData = { subPartId: 'adrenal_gland' };
    kidneysGroup.add(adrenal);

    // Ureter descending from renal pelvis to urinary bladder
    const ureterCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.13, yOffset - 0.02, -0.05),
      new THREE.Vector3(side * 0.11, -0.12, -0.03),
      new THREE.Vector3(side * 0.06, -0.42, 0.05),
    ]);
    const ureterGeo = createVariableTubeGeometry(
      ureterCurve,
      18,
      8,
      () => 0.008,
      0xfef08a,
      0xca8a04
    );
    const ureterMesh = new THREE.Mesh(ureterGeo, kidneyMat.clone());
    ureterMesh.userData = { subPartId: 'ureter' };
    kidneysGroup.add(ureterMesh);
  });

  // Urinary Bladder at base of pelvis
  const bladderGeo = new THREE.SphereGeometry(0.072, 22, 20);
  bladderGeo.scale(1.0, 0.92, 0.95);
  applyOrganicVertexShading(bladderGeo, 0xd97757, 0x8c3b24);
  const bladderMesh = new THREE.Mesh(bladderGeo, kidneyMat.clone());
  bladderMesh.position.set(0, -0.45, 0.07);
  bladderMesh.userData = { subPartId: 'urinary_bladder' };
  kidneysGroup.add(bladderMesh);

  registerOrganGroup(
    'kidneys',
    'Mesh_Kidneys',
    'urinary',
    kidneysGroup,
    new THREE.Vector3(0, 0.05, -0.04),
    0.95,
    organRecords
  );
  urinaryGroup.add(kidneysGroup);

  // Center entire human model vertically around y=0
  rootGroup.position.set(0, -0.58, 0);

  const setShellMode = (mode: 'xray' | 'solid' | 'hidden') => {
    if (mode === 'hidden') {
      bodyShellGroup.visible = false;
      return;
    }
    bodyShellGroup.visible = true;
    shellMaterials.forEach((m) => {
      if (mode === 'xray') {
        m.color.setHex(0x1e293b);
        m.emissive.setHex(0x0f172a);
        m.opacity = 0.28;
        m.depthWrite = false;
      } else {
        // Rich dark medical silhouette with subtle translucency so internal glow peeks through
        m.color.setHex(0x334155);
        m.emissive.setHex(0x1e293b);
        m.opacity = 0.58;
        m.depthWrite = false;
      }
      m.needsUpdate = true;
    });
  };

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
    vascularGroup,
    heartGroup,
    lungsGroup,
    setShellMode,
    dispose,
  };
}
