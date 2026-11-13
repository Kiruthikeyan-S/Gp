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
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
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
    const u = uvs ? uvs.getX(i) : i / count;
    const v = uvs ? uvs.getY(i) * Math.PI * 2 : 0;
    curve.getPointAt(u, centerPt);

    radialVec.set(pos.getX(i), pos.getY(i), pos.getZ(i)).sub(centerPt);
    const rLen = radialVec.length();
    if (rLen > 0.00001) {
      radialVec.multiplyScalar(1 / rLen);
    } else {
      radialVec.set(0, 1, 0);
    }

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
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
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
    'endocrine',
    'lymphatic',
    'reproductive',
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
  bodyShellGroup.visible = false; // Permanently hidden for pure Solo 3D Atlas organ views

  const shellMaterials: THREE.MeshStandardMaterial[] = [];
  const createShellMat = (opacity = 0.22) => {
    const m = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.12,
      transparent: true,
      opacity,
      roughness: 0.35,
      metalness: 0.08,
      depthWrite: false,
      side: THREE.FrontSide,
    });
    shellMaterials.push(m);
    return m;
  };
  const mainShellMat = createShellMat(0.22);

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
    // Upper & Lower Arm Shell down to hand
    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.52, 1.18, 0.02),
      new THREE.Vector3(side * 0.57, 0.94, 0.01), // Biceps bulge
      new THREE.Vector3(side * 0.60, 0.72, -0.01), // Elbow joint
      new THREE.Vector3(side * 0.66, 0.50, 0.03), // Forearm
      new THREE.Vector3(side * 0.71, 0.30, 0.05), // Wrist
      new THREE.Vector3(side * 0.73, 0.16, 0.06), // Hand & fingers
    ]);
    const armGeo = new THREE.TubeGeometry(armCurve, 24, 0.105, 16, false);
    const armMesh = new THREE.Mesh(armGeo, mainShellMat);
    bodyShellGroup.add(armMesh);

    // Thigh, Knee, Calf & Foot Shell down to toes
    const legCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.21, -0.48, 0.01), // Hip joint
      new THREE.Vector3(side * 0.22, -0.74, 0.02), // Thigh bulk
      new THREE.Vector3(side * 0.21, -1.02, 0.02), // Knee joint
      new THREE.Vector3(side * 0.21, -1.26, -0.01), // Calf bulge
      new THREE.Vector3(side * 0.20, -1.54, -0.01), // Ankle joint
    ]);
    const legGeo = new THREE.TubeGeometry(legCurve, 22, 0.145, 16, false);
    const legMesh = new THREE.Mesh(legGeo, mainShellMat);
    bodyShellGroup.add(legMesh);

    // Anatomical Foot Shell forward
    const footCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.20, -1.56, -0.04), // Calcaneus heel
      new THREE.Vector3(side * 0.20, -1.59, 0.08),  // Midfoot arch
      new THREE.Vector3(side * 0.20, -1.61, 0.18),  // Toes
    ]);
    const footGeo = new THREE.TubeGeometry(footCurve, 12, 0.065, 14, false);
    const footMesh = new THREE.Mesh(footGeo, mainShellMat);
    bodyShellGroup.add(footMesh);
  });

  rootGroup.add(bodyShellGroup);

  // =========================================================================
  // 2. SKELETAL SYSTEM (Vertebral Column, Ribcage, Sternum, Pelvis, Clavicles)
  // =========================================================================
  const skeletalGroup = systemGroups.get('skeletal')!;
  const boneMat = new THREE.MeshStandardMaterial({
    color: 0xede4d4,
    roughness: 0.38,
    metalness: 0.08,
  });
  const cartilageMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.32,
    metalness: 0.05,
  });

  // 1. ANATOMICALLY SCULPTED CRANIUM & MANDIBLE (Skull)
  // Neurocranium (Brain Vault)
  const craniumVaultGeo = new THREE.SphereGeometry(0.19, 28, 24);
  craniumVaultGeo.scale(0.84, 0.98, 1.06);
  const craniumMesh = new THREE.Mesh(craniumVaultGeo, boneMat);
  craniumMesh.position.set(0, 1.96, 0.01);
  craniumMesh.userData = { subPartId: 'cranium', organId: 'skeleton' };
  skeletalGroup.add(craniumMesh);

  // Facial Skeleton & Brow Ridge (Frontal Bone / Orbit Rim)
  const browGeo = new THREE.BoxGeometry(0.24, 0.045, 0.06);
  const browMesh = new THREE.Mesh(browGeo, boneMat);
  browMesh.position.set(0, 1.94, 0.165);
  browMesh.userData = { subPartId: 'cranium', organId: 'skeleton' };
  skeletalGroup.add(browMesh);

  // Bilateral Eye Orbits (Deep orbital sockets)
  [-1, 1].forEach((side) => {
    const orbitRingGeo = new THREE.TorusGeometry(0.038, 0.014, 12, 20);
    const orbitMesh = new THREE.Mesh(orbitRingGeo, boneMat);
    orbitMesh.position.set(side * 0.064, 1.91, 0.168);
    orbitMesh.rotation.y = side * -0.12;
    orbitMesh.userData = { subPartId: 'cranium', organId: 'skeleton' };
    skeletalGroup.add(orbitMesh);

    // Zygomatic Arch (Cheekbone)
    const zygoCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.075, 1.88, 0.16),
      new THREE.Vector3(side * 0.145, 1.87, 0.08),
      new THREE.Vector3(side * 0.13, 1.90, -0.04),
    ]);
    const zygoGeo = new THREE.TubeGeometry(zygoCurve, 12, 0.012, 8, false);
    const zygoMesh = new THREE.Mesh(zygoGeo, boneMat);
    zygoMesh.userData = { subPartId: 'cranium', organId: 'skeleton' };
    skeletalGroup.add(zygoMesh);
  });

  // Nasal Aperture & Pyriform Bone
  const nasalGeo = new THREE.ConeGeometry(0.024, 0.075, 8);
  nasalGeo.scale(1, 1, 0.55);
  const nasalMesh = new THREE.Mesh(nasalGeo, boneMat);
  nasalMesh.position.set(0, 1.88, 0.185);
  nasalMesh.rotation.x = 0.22;
  nasalMesh.userData = { subPartId: 'cranium', organId: 'skeleton' };
  skeletalGroup.add(nasalMesh);

  // Maxilla & Upper Dental Arcade
  const maxillaGeo = new THREE.CylinderGeometry(0.062, 0.078, 0.052, 12);
  maxillaGeo.scale(1.1, 1, 0.75);
  const maxillaMesh = new THREE.Mesh(maxillaGeo, boneMat);
  maxillaMesh.position.set(0, 1.81, 0.14);
  maxillaMesh.userData = { subPartId: 'cranium', organId: 'skeleton' };
  skeletalGroup.add(maxillaMesh);

  // Sculpted Mandible (Lower Jaw with chin and bilateral ascending rami)
  const mandibleBodyCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.088, 1.78, 0.03),
    new THREE.Vector3(-0.068, 1.74, 0.12),
    new THREE.Vector3(0, 1.725, 0.165),
    new THREE.Vector3(0.068, 1.74, 0.12),
    new THREE.Vector3(0.088, 1.78, 0.03),
  ]);
  const mandibleBodyGeo = new THREE.TubeGeometry(mandibleBodyCurve, 18, 0.018, 8, false);
  const mandibleBody = new THREE.Mesh(mandibleBodyGeo, boneMat);
  mandibleBody.userData = { subPartId: 'cranium', organId: 'skeleton' };
  skeletalGroup.add(mandibleBody);

  [-1, 1].forEach((side) => {
    const ramusCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.088, 1.78, 0.03),
      new THREE.Vector3(side * 0.092, 1.84, 0.02),
      new THREE.Vector3(side * 0.085, 1.88, 0.01),
    ]);
    const ramusGeo = new THREE.TubeGeometry(ramusCurve, 10, 0.015, 8, false);
    const ramusMesh = new THREE.Mesh(ramusGeo, boneMat);
    ramusMesh.userData = { subPartId: 'cranium', organId: 'skeleton' };
    skeletalGroup.add(ramusMesh);
  });

  // 2. ARTICULATED VERTEBRAL COLUMN (24 Distinct Cervical, Thoracic, Lumbar Segments)
  for (let i = 0; i < 24; i++) {
    const t = i / 23;
    const yPos = 1.64 - i * 0.086;
    const zCurve = -0.13 + Math.sin(t * Math.PI * 2.1) * 0.042;
    const radius = 0.044 + t * 0.034;

    const vBodyGeo = new THREE.CylinderGeometry(radius * 0.94, radius, 0.052, 16);
    vBodyGeo.scale(1.15, 1, 0.92);
    const vBody = new THREE.Mesh(vBodyGeo, boneMat);
    vBody.position.set(0, yPos, zCurve);
    vBody.userData = { subPartId: 'vertebral_column', organId: 'skeleton' };
    skeletalGroup.add(vBody);

    const discGeo = new THREE.CylinderGeometry(radius * 0.96, radius * 0.96, 0.022, 16);
    discGeo.scale(1.12, 1, 0.9);
    const disc = new THREE.Mesh(discGeo, cartilageMat);
    disc.position.set(0, yPos - 0.037, zCurve);
    disc.userData = { subPartId: 'vertebral_column', organId: 'skeleton' };
    skeletalGroup.add(disc);

    const spinousGeo = new THREE.BoxGeometry(0.02, 0.036, 0.082);
    const spinous = new THREE.Mesh(spinousGeo, boneMat);
    spinous.position.set(0, yPos - 0.014, zCurve - radius - 0.028);
    spinous.rotation.x = 0.38;
    spinous.userData = { subPartId: 'vertebral_column', organId: 'skeleton' };
    skeletalGroup.add(spinous);

    const transGeo = new THREE.BoxGeometry(radius * 2.8, 0.024, 0.026);
    const trans = new THREE.Mesh(transGeo, boneMat);
    trans.position.set(0, yPos, zCurve - radius * 0.52);
    trans.userData = { subPartId: 'vertebral_column', organId: 'skeleton' };
    skeletalGroup.add(trans);
  }

  // 3. STERNUM (Manubrium, Sternal Body, Xiphoid Process)
  const manubriumGeo = new THREE.CylinderGeometry(0.072, 0.052, 0.15, 8);
  manubriumGeo.scale(1, 1, 0.35);
  const manubrium = new THREE.Mesh(manubriumGeo, boneMat);
  manubrium.position.set(0, 1.22, 0.23);
  manubrium.userData = { subPartId: 'ribcage', organId: 'skeleton' };
  skeletalGroup.add(manubrium);

  const sternumBodyGeo = new THREE.BoxGeometry(0.068, 0.36, 0.026);
  const sternumBody = new THREE.Mesh(sternumBodyGeo, boneMat);
  sternumBody.position.set(0, 0.96, 0.245);
  sternumBody.userData = { subPartId: 'ribcage', organId: 'skeleton' };
  skeletalGroup.add(sternumBody);

  const xiphoidGeo = new THREE.ConeGeometry(0.028, 0.075, 6);
  xiphoidGeo.scale(1, 1, 0.4);
  const xiphoid = new THREE.Mesh(xiphoidGeo, cartilageMat);
  xiphoid.position.set(0, 0.74, 0.245);
  xiphoid.rotation.x = Math.PI;
  xiphoid.userData = { subPartId: 'ribcage', organId: 'skeleton' };
  skeletalGroup.add(xiphoid);

  // 12 Pairs of 3D Articulated Ribs
  for (let r = 0; r < 12; r++) {
    const yStart = 1.25 - r * 0.062;
    const widthFactor = 0.28 + Math.sin((r / 11) * Math.PI * 0.88) * 0.16;
    const depthFront = 0.25 - (r > 7 ? (r - 7) * 0.038 : 0);

    [-1, 1].forEach((side) => {
      const ribCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.045, yStart, -0.13),
        new THREE.Vector3(side * (widthFactor * 0.76), yStart - 0.02, -0.10),
        new THREE.Vector3(side * widthFactor, yStart - 0.05, 0.05),
        new THREE.Vector3(side * (widthFactor * 0.68), yStart - 0.08, depthFront * 0.86),
        new THREE.Vector3(side * (r < 8 ? 0.045 : widthFactor * 0.38), yStart - 0.09, depthFront),
      ]);
      const ribGeo = new THREE.TubeGeometry(ribCurve, 20, 0.015, 8, false);
      const ribMesh = new THREE.Mesh(ribGeo, r < 7 ? boneMat : (r < 10 ? cartilageMat : boneMat));
      ribMesh.userData = { subPartId: 'ribcage', organId: 'skeleton' };
      skeletalGroup.add(ribMesh);
    });
  }

  // S-Curved Clavicles (Collarbones)
  [-1, 1].forEach((side) => {
    const clavCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.05, 1.28, 0.23),
      new THREE.Vector3(side * 0.24, 1.30, 0.19),
      new THREE.Vector3(side * 0.46, 1.27, 0.06),
    ]);
    const clavGeo = new THREE.TubeGeometry(clavCurve, 16, 0.018, 8, false);
    const clavMesh = new THREE.Mesh(clavGeo, boneMat);
    clavMesh.userData = { subPartId: 'ribcage', organId: 'skeleton' };
    skeletalGroup.add(clavMesh);
  });

  // 4. SCULPTED PELVIC GIRDLE (Flared Ilium, Ischium, Pubis, Obturator Foramen, Sacrum)
  [-1, 1].forEach((side) => {
    const iliumCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.07, -0.25, -0.14),
      new THREE.Vector3(side * 0.27, -0.18, -0.06),
      new THREE.Vector3(side * 0.37, -0.24, 0.09),
      new THREE.Vector3(side * 0.26, -0.44, 0.14),
      new THREE.Vector3(side * 0.05, -0.52, 0.15),
    ]);
    const iliumGeo = new THREE.TubeGeometry(iliumCurve, 24, 0.048, 12, false);
    iliumGeo.scale(1, 1.22, 0.74);
    const iliumMesh = new THREE.Mesh(iliumGeo, boneMat);
    iliumMesh.userData = { subPartId: 'pelvis_girdle', organId: 'skeleton' };
    skeletalGroup.add(iliumMesh);

    const ischiumCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.24, -0.42, 0.08),
      new THREE.Vector3(side * 0.20, -0.58, 0.04),
      new THREE.Vector3(side * 0.05, -0.54, 0.14),
    ]);
    const ischiumGeo = new THREE.TubeGeometry(ischiumCurve, 16, 0.026, 10, false);
    const ischiumMesh = new THREE.Mesh(ischiumGeo, boneMat);
    ischiumMesh.userData = { subPartId: 'pelvis_girdle', organId: 'skeleton' };
    skeletalGroup.add(ischiumMesh);
  });

  const sacrumGeo = new THREE.ConeGeometry(0.12, 0.26, 14);
  sacrumGeo.scale(1.15, 1, 0.48);
  const sacrumMesh = new THREE.Mesh(sacrumGeo, boneMat);
  sacrumMesh.position.set(0, -0.34, -0.15);
  sacrumMesh.rotation.x = Math.PI + 0.22;
  sacrumMesh.userData = { subPartId: 'pelvis_girdle', organId: 'skeleton' };
  skeletalGroup.add(sacrumMesh);

  // 5. APPENDICULAR SKELETON: UPPER LIMBS (Scapulae, Humerus, Elbows, Radius & Ulna, Carpals & Hands)
  [-1, 1].forEach((side) => {
    // Scapula (Shoulder Blade with spine and acromion process)
    const scapulaGeo = new THREE.BoxGeometry(0.14, 0.22, 0.024);
    scapulaGeo.scale(1, 1, 0.6);
    const scapulaMesh = new THREE.Mesh(scapulaGeo, boneMat);
    scapulaMesh.position.set(side * 0.28, 1.12, -0.16);
    scapulaMesh.rotation.y = side * 0.35;
    scapulaMesh.rotation.z = side * -0.15;
    scapulaMesh.userData = { subPartId: 'upper_limbs', organId: 'skeleton' };
    skeletalGroup.add(scapulaMesh);

    // Humerus (Upper arm long bone from glenohumeral joint to elbow)
    const humerusCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.48, 1.18, 0.02),
      new THREE.Vector3(side * 0.54, 0.95, 0.0),
      new THREE.Vector3(side * 0.58, 0.72, -0.02),
    ]);
    const humerusGeo = new THREE.TubeGeometry(humerusCurve, 14, 0.026, 10, false);
    const humerusMesh = new THREE.Mesh(humerusGeo, boneMat);
    humerusMesh.userData = { subPartId: 'upper_limbs', organId: 'skeleton' };
    skeletalGroup.add(humerusMesh);

    // Elbow Condyle Joint
    const elbowGeo = new THREE.SphereGeometry(0.032, 12, 10);
    const elbowMesh = new THREE.Mesh(elbowGeo, boneMat);
    elbowMesh.position.set(side * 0.58, 0.72, -0.02);
    elbowMesh.userData = { subPartId: 'upper_limbs', organId: 'skeleton' };
    skeletalGroup.add(elbowMesh);

    // Radius (Lateral) & Ulna (Medial) Forearm Bones
    const radiusCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.59, 0.70, -0.01),
      new THREE.Vector3(side * 0.64, 0.52, 0.03),
      new THREE.Vector3(side * 0.69, 0.32, 0.06),
    ]);
    const radiusGeo = new THREE.TubeGeometry(radiusCurve, 12, 0.015, 8, false);
    const radiusMesh = new THREE.Mesh(radiusGeo, boneMat);
    radiusMesh.userData = { subPartId: 'upper_limbs', organId: 'skeleton' };
    skeletalGroup.add(radiusMesh);

    const ulnaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.56, 0.70, -0.03),
      new THREE.Vector3(side * 0.61, 0.51, 0.01),
      new THREE.Vector3(side * 0.66, 0.31, 0.04),
    ]);
    const ulnaGeo = new THREE.TubeGeometry(ulnaCurve, 12, 0.016, 8, false);
    const ulnaMesh = new THREE.Mesh(ulnaGeo, boneMat);
    ulnaMesh.userData = { subPartId: 'upper_limbs', organId: 'skeleton' };
    skeletalGroup.add(ulnaMesh);

    // Carpals & Metacarpals (Wrist & Palm)
    const handBaseGeo = new THREE.BoxGeometry(0.052, 0.082, 0.022);
    const handBaseMesh = new THREE.Mesh(handBaseGeo, boneMat);
    handBaseMesh.position.set(side * 0.70, 0.24, 0.06);
    handBaseMesh.rotation.z = side * -0.22;
    handBaseMesh.userData = { subPartId: 'upper_limbs', organId: 'skeleton' };
    skeletalGroup.add(handBaseMesh);

    // Phalanges (Fingers)
    [-0.018, -0.006, 0.006, 0.018].forEach((fOffset) => {
      const fingerCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * (0.70 + fOffset * 0.7), 0.20, 0.06),
        new THREE.Vector3(side * (0.72 + fOffset * 0.8), 0.12, 0.07),
      ]);
      const fingerGeo = new THREE.TubeGeometry(fingerCurve, 6, 0.007, 6, false);
      const fingerMesh = new THREE.Mesh(fingerGeo, boneMat);
      fingerMesh.userData = { subPartId: 'upper_limbs', organId: 'skeleton' };
      skeletalGroup.add(fingerMesh);
    });
  });

  // 6. APPENDICULAR SKELETON: LOWER LIMBS (Femurs, Patellae, Tibia, Fibula, Tarsals & Feet)
  [-1, 1].forEach((side) => {
    // Femur (Strongest weight-bearing long bone)
    const femurCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.18, -0.42, 0.04),
      new THREE.Vector3(side * 0.22, -0.72, 0.03),
      new THREE.Vector3(side * 0.21, -1.02, 0.01),
    ]);
    const femurGeo = new THREE.TubeGeometry(femurCurve, 16, 0.034, 10, false);
    const femurMesh = new THREE.Mesh(femurGeo, boneMat);
    femurMesh.userData = { subPartId: 'lower_limbs', organId: 'skeleton' };
    skeletalGroup.add(femurMesh);

    // Patella (Kneecap anterior sesamoid bone)
    const patellaGeo = new THREE.SphereGeometry(0.028, 12, 10);
    patellaGeo.scale(1, 1.25, 0.55);
    const patellaMesh = new THREE.Mesh(patellaGeo, boneMat);
    patellaMesh.position.set(side * 0.21, -1.02, 0.055);
    patellaMesh.userData = { subPartId: 'lower_limbs', organId: 'skeleton' };
    skeletalGroup.add(patellaMesh);

    // Tibia (Primary lower leg shin bone)
    const tibiaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.21, -1.06, 0.01),
      new THREE.Vector3(side * 0.20, -1.32, 0.0),
      new THREE.Vector3(side * 0.19, -1.55, -0.01),
    ]);
    const tibiaGeo = new THREE.TubeGeometry(tibiaCurve, 14, 0.026, 10, false);
    const tibiaMesh = new THREE.Mesh(tibiaGeo, boneMat);
    tibiaMesh.userData = { subPartId: 'lower_limbs', organId: 'skeleton' };
    skeletalGroup.add(tibiaMesh);

    // Fibula (Slender lateral stabilizer bone)
    const fibulaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.25, -1.08, 0.0),
      new THREE.Vector3(side * 0.24, -1.32, -0.01),
      new THREE.Vector3(side * 0.23, -1.55, -0.01),
    ]);
    const fibulaGeo = new THREE.TubeGeometry(fibulaCurve, 14, 0.014, 8, false);
    const fibulaMesh = new THREE.Mesh(fibulaGeo, boneMat);
    fibulaMesh.userData = { subPartId: 'lower_limbs', organId: 'skeleton' };
    skeletalGroup.add(fibulaMesh);

    // Tarsals & Calcaneus (Heel & Ankle)
    const heelGeo = new THREE.BoxGeometry(0.054, 0.045, 0.092);
    const heelMesh = new THREE.Mesh(heelGeo, boneMat);
    heelMesh.position.set(side * 0.20, -1.58, -0.04);
    heelMesh.userData = { subPartId: 'lower_limbs', organId: 'skeleton' };
    skeletalGroup.add(heelMesh);

    // Metatarsals & Toe Phalanges (Arched foot forward)
    const footCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.20, -1.59, 0.0),
      new THREE.Vector3(side * 0.20, -1.61, 0.09),
      new THREE.Vector3(side * 0.20, -1.62, 0.16),
    ]);
    const footGeo = new THREE.TubeGeometry(footCurve, 10, 0.022, 8, false);
    const footMesh = new THREE.Mesh(footGeo, boneMat);
    footMesh.userData = { subPartId: 'lower_limbs', organId: 'skeleton' };
    skeletalGroup.add(footMesh);
  });

  registerOrganGroup(
    'skeleton',
    'Mesh_Skeleton',
    'skeletal',
    skeletalGroup,
    new THREE.Vector3(0, 0.05, 0.0),
    1.85,
    organRecords
  );

  // =========================================================================
  // 3. ANATOMICALLY SCULPTED MUSCULAR SYSTEM (Écorché Anatomical Musculature)
  // =========================================================================
  const muscularGroup = systemGroups.get('muscular')!;
  const muscleMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.38,
    metalness: 0.08,
    side: THREE.DoubleSide,
  });

  // 1. Continuous Contoured Muscular Trunk & Abdominal Wall (Unified Anatomical Core)
  const coreTorsoGeo = new THREE.CylinderGeometry(0.32, 0.26, 1.05, 32, 40);
  coreTorsoGeo.scale(1.15, 1.0, 0.68);
  const ctPos = coreTorsoGeo.attributes.position;
  for (let i = 0; i < ctPos.count; i++) {
    const x = ctPos.getX(i);
    const y = ctPos.getY(i);
    let z = ctPos.getZ(i);

    // Sculpt waist narrowing, thoracic rib expansion, and abdominal wall curvature
    const waistIndent = Math.exp(-Math.pow(y + 0.15, 2) * 20) * 0.04;
    const chestExpansion = Math.exp(-Math.pow(y - 0.28, 2) * 12) * 0.05;
    if (z > 0) {
      z += chestExpansion - waistIndent;
      // Linea Alba depression down central anterior midline
      const linea = Math.exp(-Math.pow(x * 28, 2)) * 0.015;
      z -= linea;
    } else {
      // Vertebral spinal groove down posterior back
      const spineGroove = Math.exp(-Math.pow(x * 24, 2)) * 0.018;
      z += spineGroove;
    }
    ctPos.setXYZ(i, x * (1 - waistIndent), y, z);
  }
  coreTorsoGeo.computeVertexNormals();
  applyOrganicVertexShading(coreTorsoGeo, 0x991b1b, 0x4c0519);
  coreTorsoGeo.computeBoundingBox();
  coreTorsoGeo.computeBoundingSphere();

  const coreTorsoMesh = new THREE.Mesh(coreTorsoGeo, muscleMat.clone());
  coreTorsoMesh.position.set(0, 0.65, 0.02);
  coreTorsoMesh.userData = { subPartId: 'rectus_abdominis', organId: 'muscles' };
  muscularGroup.add(coreTorsoMesh);

  // 2. PECTORALIS MAJOR (Contoured anatomical fan-shaped chest muscle with clavicular & sternocostal heads)
  [-1, 1].forEach((side) => {
    const pecGeo = new THREE.SphereGeometry(0.18, 24, 20);
    pecGeo.scale(1.42, 0.88, 0.52);
    const pPos = pecGeo.attributes.position;
    for (let i = 0; i < pPos.count; i++) {
      let x = pPos.getX(i);
      let y = pPos.getY(i);
      let z = pPos.getZ(i);
      if (side * x > 0) {
        x *= 1.28;
        y += (x / 0.25) * 0.04;
      }
      if (y < 0) y *= 0.82;
      if (z > 0) z *= 1.15;
      pPos.setXYZ(i, x, y, z);
    }
    pecGeo.computeVertexNormals();
    applyOrganicVertexShading(pecGeo, 0x991b1b, 0x5c0911);
    pecGeo.computeBoundingBox();
    pecGeo.computeBoundingSphere();

    const pecMesh = new THREE.Mesh(pecGeo, muscleMat.clone());
    pecMesh.position.set(side * 0.17, 1.04, 0.16);
    pecMesh.rotation.z = side * -0.22;
    pecMesh.rotation.y = side * 0.14;
    pecMesh.userData = { subPartId: 'pectoralis', organId: 'muscles' };
    muscularGroup.add(pecMesh);
  });

  // 3. RECTUS ABDOMINIS & LINEA ALBA (Natural anatomical paired muscle columns with 3 tendinous intersections)
  [-1, 1].forEach((side) => {
    const absGeo = new THREE.CylinderGeometry(0.082, 0.072, 0.52, 20, 24);
    absGeo.scale(0.95, 1, 0.44);
    const aPos = absGeo.attributes.position;
    for (let i = 0; i < aPos.count; i++) {
      let x = aPos.getX(i);
      const y = aPos.getY(i);
      let z = aPos.getZ(i);

      // Sculpt 3 natural horizontal tendinous intersections (sulci) across the muscle belly
      const inscription1 = Math.exp(-Math.pow((y - 0.14) * 28, 2)) * 0.012;
      const inscription2 = Math.exp(-Math.pow(y * 28, 2)) * 0.012;
      const inscription3 = Math.exp(-Math.pow((y + 0.14) * 28, 2)) * 0.012;
      z -= inscription1 + inscription2 + inscription3;

      // Medial Linea Alba tapering
      if (side * x < 0) {
        x *= 0.85;
      }
      aPos.setXYZ(i, x, y, z);
    }
    absGeo.computeVertexNormals();
    applyOrganicVertexShading(absGeo, 0xa82020, 0x600a12);
    absGeo.computeBoundingBox();
    absGeo.computeBoundingSphere();

    const absMesh = new THREE.Mesh(absGeo, muscleMat.clone());
    absMesh.position.set(side * 0.062, 0.62, 0.185);
    absMesh.rotation.y = side * -0.06;
    absMesh.userData = { subPartId: 'rectus_abdominis', organId: 'muscles' };
    muscularGroup.add(absMesh);
  });

  // 4. EXTERNAL OBLIQUES & SERRATUS ANTERIOR (Lateral flank muscular sheets interdigitating with ribs)
  [-1, 1].forEach((side) => {
    const oblGeo = new THREE.CylinderGeometry(0.09, 0.12, 0.48, 16, 16);
    oblGeo.scale(0.85, 1, 0.52);
    const oPos = oblGeo.attributes.position;
    for (let i = 0; i < oPos.count; i++) {
      let x = oPos.getX(i);
      const y = oPos.getY(i);
      let z = oPos.getZ(i);
      // Gentle serratus digitations along rib margins
      const serrFingers = Math.sin(y * 42) * 0.008;
      z += serrFingers;
      oPos.setXYZ(i, x, y, z);
    }
    oblGeo.computeVertexNormals();
    applyOrganicVertexShading(oblGeo, 0x881337, 0x4c0519);
    oblGeo.computeBoundingBox();
    oblGeo.computeBoundingSphere();

    const oblMesh = new THREE.Mesh(oblGeo, muscleMat.clone());
    oblMesh.position.set(side * 0.22, 0.66, 0.11);
    oblMesh.rotation.z = side * -0.16;
    oblMesh.rotation.y = side * 0.28;
    oblMesh.userData = { subPartId: 'rectus_abdominis', organId: 'muscles' };
    muscularGroup.add(oblMesh);
  });

  // 5. DELTOIDS (3-Headed Volumetric Shoulder Caps wrapping humerus & clavicle)
  [-1, 1].forEach((side) => {
    const deltGeo = new THREE.SphereGeometry(0.14, 22, 20);
    deltGeo.scale(0.92, 1.42, 0.96);
    const dPos = deltGeo.attributes.position;
    for (let i = 0; i < dPos.count; i++) {
      let x = dPos.getX(i);
      let y = dPos.getY(i);
      let z = dPos.getZ(i);
      // Clavicular, acromial, and spinous head definition
      if (y < 0) {
        y *= 1.25;
        x *= 1 - Math.abs(y) * 0.65;
        z *= 1 - Math.abs(y) * 0.65;
      }
      dPos.setXYZ(i, x, y, z);
    }
    deltGeo.computeVertexNormals();
    applyOrganicVertexShading(deltGeo, 0x991b1b, 0x58081f);
    deltGeo.computeBoundingBox();
    deltGeo.computeBoundingSphere();

    const deltMesh = new THREE.Mesh(deltGeo, muscleMat.clone());
    deltMesh.position.set(side * 0.44, 1.15, 0.03);
    deltMesh.rotation.z = side * -0.22;
    deltMesh.userData = { subPartId: 'deltoids', organId: 'muscles' };
    muscularGroup.add(deltMesh);
  });

  // 6. TRAPEZIUS & STERNOCLEIDOMASTOID (Neck & Upper Back Musculature)
  [-1, 1].forEach((side) => {
    // SCM
    const scmGeo = new THREE.CylinderGeometry(0.022, 0.028, 0.34, 12);
    applyOrganicVertexShading(scmGeo, 0x991b1b, 0x5c0911);
    scmGeo.computeBoundingBox();
    scmGeo.computeBoundingSphere();

    const scmMesh = new THREE.Mesh(scmGeo, muscleMat.clone());
    scmMesh.position.set(side * 0.09, 1.40, 0.07);
    scmMesh.rotation.z = side * 0.26;
    scmMesh.rotation.x = -0.16;
    scmMesh.userData = { subPartId: 'trapezius', organId: 'muscles' };
    muscularGroup.add(scmMesh);

    // Trapezius mantle
    const trapGeo = new THREE.CylinderGeometry(0.06, 0.22, 0.44, 14);
    trapGeo.scale(1.2, 1, 0.45);
    applyOrganicVertexShading(trapGeo, 0x881337, 0x4c0519);
    trapGeo.computeBoundingBox();
    trapGeo.computeBoundingSphere();

    const trapMesh = new THREE.Mesh(trapGeo, muscleMat.clone());
    trapMesh.position.set(side * 0.16, 1.30, -0.09);
    trapMesh.rotation.z = side * -0.28;
    trapMesh.userData = { subPartId: 'trapezius', organId: 'muscles' };
    muscularGroup.add(trapMesh);
  });

  // 7. UPPER LIMB MUSCULATURE: BICEPS BRACHII, TRICEPS & FOREARMS (Contoured Anatomical Bellies)
  [-1, 1].forEach((side) => {
    // Biceps Brachii (Anterior fusiform flexor with muscular belly and distal tendon)
    const bicepsGeo = new THREE.SphereGeometry(0.072, 18, 16);
    bicepsGeo.scale(0.92, 2.1, 0.88);
    applyOrganicVertexShading(bicepsGeo, 0x991b1b, 0x58081f);
    bicepsGeo.computeBoundingBox();
    bicepsGeo.computeBoundingSphere();

    const bicepsMesh = new THREE.Mesh(bicepsGeo, muscleMat.clone());
    bicepsMesh.position.set(side * 0.50, 0.88, 0.04);
    bicepsMesh.rotation.z = side * -0.14;
    bicepsMesh.userData = { subPartId: 'biceps_brachii', organId: 'muscles' };
    muscularGroup.add(bicepsMesh);

    // Triceps Brachii (Posterior arm extensor)
    const tricepsGeo = new THREE.SphereGeometry(0.078, 18, 16);
    tricepsGeo.scale(0.95, 2.2, 0.95);
    applyOrganicVertexShading(tricepsGeo, 0x881337, 0x4c0519);
    tricepsGeo.computeBoundingBox();
    tricepsGeo.computeBoundingSphere();

    const tricepsMesh = new THREE.Mesh(tricepsGeo, muscleMat.clone());
    tricepsMesh.position.set(side * 0.51, 0.88, -0.04);
    tricepsMesh.rotation.z = side * -0.14;
    tricepsMesh.userData = { subPartId: 'biceps_brachii', organId: 'muscles' };
    muscularGroup.add(tricepsMesh);

    // Forearm flexors and extensors tapering gracefully to wrist
    const forearmGeo = new THREE.CylinderGeometry(0.042, 0.068, 0.44, 18);
    forearmGeo.scale(1.1, 1, 0.88);
    applyOrganicVertexShading(forearmGeo, 0x991b1b, 0x5c0911);
    forearmGeo.computeBoundingBox();
    forearmGeo.computeBoundingSphere();

    const forearmMesh = new THREE.Mesh(forearmGeo, muscleMat.clone());
    forearmMesh.position.set(side * 0.60, 0.46, 0.02);
    forearmMesh.rotation.z = side * -0.22;
    forearmMesh.userData = { subPartId: 'biceps_brachii', organId: 'muscles' };
    muscularGroup.add(forearmMesh);
  });

  // 8. LOWER LIMB MUSCULATURE: GLUTEALS, QUADRICEPS, HAMSTRINGS & CALVES
  [-1, 1].forEach((side) => {
    // Gluteus Maximus & Medius (Full rounded pelvic muscle mass)
    const gluteGeo = new THREE.SphereGeometry(0.17, 22, 20);
    gluteGeo.scale(1.02, 1.25, 1.08);
    applyOrganicVertexShading(gluteGeo, 0x991b1b, 0x58081f);
    gluteGeo.computeBoundingBox();
    gluteGeo.computeBoundingSphere();

    const gluteMesh = new THREE.Mesh(gluteGeo, muscleMat.clone());
    gluteMesh.position.set(side * 0.20, -0.38, -0.10);
    gluteMesh.rotation.y = side * -0.16;
    gluteMesh.userData = { subPartId: 'quadriceps', organId: 'muscles' };
    muscularGroup.add(gluteMesh);

    // Quadriceps Femoris: Rectus Femoris & Vastus Lateralis (Anterior thigh sweep)
    const quadGeo = new THREE.SphereGeometry(0.13, 20, 20);
    quadGeo.scale(0.96, 2.5, 0.92);
    applyOrganicVertexShading(quadGeo, 0x991b1b, 0x5c0911);
    quadGeo.computeBoundingBox();
    quadGeo.computeBoundingSphere();

    const quadMesh = new THREE.Mesh(quadGeo, muscleMat.clone());
    quadMesh.position.set(side * 0.21, -0.74, 0.03);
    quadMesh.rotation.z = side * 0.04;
    quadMesh.userData = { subPartId: 'quadriceps', organId: 'muscles' };
    muscularGroup.add(quadMesh);

    // Vastus Medialis (Distinctive anatomical teardrop muscle bulging above medial knee)
    const vastusMedGeo = new THREE.SphereGeometry(0.068, 16, 14);
    vastusMedGeo.scale(0.85, 1.5, 0.75);
    applyOrganicVertexShading(vastusMedGeo, 0xa82020, 0x600a12);
    vastusMedGeo.computeBoundingBox();
    vastusMedGeo.computeBoundingSphere();

    const vastusMedMesh = new THREE.Mesh(vastusMedGeo, muscleMat.clone());
    vastusMedMesh.position.set(side * 0.16, -0.92, 0.05);
    vastusMedMesh.rotation.z = side * 0.15;
    vastusMedMesh.userData = { subPartId: 'quadriceps', organId: 'muscles' };
    muscularGroup.add(vastusMedMesh);

    // Hamstrings (Posterior thigh flexor group)
    const hamGeo = new THREE.SphereGeometry(0.11, 18, 18);
    hamGeo.scale(0.95, 2.4, 0.92);
    applyOrganicVertexShading(hamGeo, 0x881337, 0x4c0519);
    hamGeo.computeBoundingBox();
    hamGeo.computeBoundingSphere();

    const hamMesh = new THREE.Mesh(hamGeo, muscleMat.clone());
    hamMesh.position.set(side * 0.21, -0.74, -0.05);
    hamMesh.userData = { subPartId: 'quadriceps', organId: 'muscles' };
    muscularGroup.add(hamMesh);

    // Gastrocnemius (Two-headed calf muscle tapering into Achilles tendon)
    const calfGeo = new THREE.SphereGeometry(0.096, 20, 18);
    calfGeo.scale(0.92, 2.1, 0.88);
    applyOrganicVertexShading(calfGeo, 0x991b1b, 0x58081f);
    calfGeo.computeBoundingBox();
    calfGeo.computeBoundingSphere();

    const calfMesh = new THREE.Mesh(calfGeo, muscleMat.clone());
    calfMesh.position.set(side * 0.20, -1.24, -0.04);
    calfMesh.userData = { subPartId: 'quadriceps', organId: 'muscles' };
    muscularGroup.add(calfMesh);

    // Tibialis Anterior (Anterior shin dorsiflexor muscle ridge)
    const tibGeo = new THREE.CylinderGeometry(0.038, 0.024, 0.48, 14);
    tibGeo.scale(0.85, 1, 0.85);
    applyOrganicVertexShading(tibGeo, 0x881337, 0x4c0519);
    tibGeo.computeBoundingBox();
    tibGeo.computeBoundingSphere();

    const tibMesh = new THREE.Mesh(tibGeo, muscleMat.clone());
    tibMesh.position.set(side * 0.20, -1.26, 0.03);
    tibMesh.userData = { subPartId: 'quadriceps', organId: 'muscles' };
    muscularGroup.add(tibMesh);
  });

  registerOrganGroup(
    'muscles',
    'Mesh_Muscles',
    'muscular',
    muscularGroup,
    new THREE.Vector3(0, 0.05, 0.0),
    1.85,
    organRecords
  );

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
      organId: 'brain',
    };
    brainGroup.add(hemiMesh);

    // Posterior occipital cortex dome
    const occGeo = new THREE.SphereGeometry(0.12, 24, 20);
    occGeo.scale(0.85, 0.88, 1.05);
    applyOrganicVertexShading(occGeo, 0xf4b4aa, 0x883542);
    const occMesh = new THREE.Mesh(occGeo, brainMat.clone());
    occMesh.position.set(side * 0.085, 1.94, -0.16);
    occMesh.userData = { subPartId: 'occipital_lobe', organId: 'brain' };
    brainGroup.add(occMesh);

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
    tempMesh.userData = { subPartId: 'temporal_lobe', organId: 'brain' };
    brainGroup.add(tempMesh);
  });

  // Striated Cerebellum (Folia horizontal ridges)
  const cerebellumGeo = new THREE.SphereGeometry(0.125, 32, 24);
  cerebellumGeo.scale(1.38, 0.72, 0.82);
  applyOrganicVertexShading(cerebellumGeo, 0xdfa099, 0x7a2e3a, (_x, y, z) => {
    const folia = Math.abs(Math.sin(y * 85 + z * 12));
    return { offset: folia * 0.006, colorMix: folia * 0.75 + 0.2 };
  });
  const cerebellumMesh = new THREE.Mesh(cerebellumGeo, brainMat.clone());
  cerebellumMesh.position.set(0, 1.79, -0.12);
  cerebellumMesh.userData = { subPartId: 'cerebellum', organId: 'brain' };
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
  stemMesh.userData = { subPartId: 'pons_medulla', organId: 'brain' };
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
  // 6. CIRCULATORY SYSTEM: ANATOMICAL HEART & CORONARY VESSELS (Mesh_Heart)
  // =========================================================================
  const circulatoryGroup = systemGroups.get('circulatory')!;
  const heartGroup = new THREE.Group();
  heartGroup.position.set(0.055, 0.86, 0.09);

  const heartMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.28,
    metalness: 0.1,
  });

  // Sculpted Asymmetric Ventricular Myocardium (Tapering apex pointing inferior-left)
  const ventGeo = new THREE.SphereGeometry(0.155, 36, 32);
  const vPos = ventGeo.attributes.position;
  for (let i = 0; i < vPos.count; i++) {
    let x = vPos.getX(i);
    let y = vPos.getY(i);
    let z = vPos.getZ(i);
    // Taper toward the cardiac apex at bottom-left-anterior
    if (y < 0) {
      const taper = 1 + y * 2.1;
      x = x * Math.max(0.28, taper) + (-y) * 0.24;
      z = z * Math.max(0.32, taper) + (-y) * 0.14;
      y *= 1.25;
    } else {
      y *= 0.95;
    }
    vPos.setXYZ(i, x, y, z);
  }
  ventGeo.computeVertexNormals();

  applyOrganicVertexShading(ventGeo, 0xc8232c, 0x6e0d14, (x, y, z) => {
    // Anterior interventricular sulcus groove + myocardial fiber texture
    const sulcusDist = Math.abs(x - y * 0.18 + 0.01);
    const groove = sulcusDist < 0.025 ? -0.006 : 0;
    const fiber = Math.sin((x + y * 1.4) * 45) * 0.002;
    const isFatSulcus = sulcusDist < 0.022 && z > 0;
    return {
      offset: groove + fiber,
      colorMix: isFatSulcus ? 0.95 : 0.45 + 0.45 * Math.cos(x * 18 + y * 14),
    };
  });

  const ventMesh = new THREE.Mesh(ventGeo, heartMat.clone());
  ventMesh.userData = { subPartId: 'left_ventricle' };
  heartGroup.add(ventMesh);

  // Right & Left Atria / Auricles
  const rAtriumGeo = new THREE.SphereGeometry(0.088, 22, 20);
  rAtriumGeo.scale(0.85, 1.05, 0.85);
  applyOrganicVertexShading(rAtriumGeo, 0x991b1b, 0x5c0a0a);
  const rAtrium = new THREE.Mesh(rAtriumGeo, heartMat.clone());
  rAtrium.position.set(-0.085, 0.075, 0.01);
  rAtrium.userData = { subPartId: 'right_atrium' };
  heartGroup.add(rAtrium);

  const lAuricleGeo = new THREE.SphereGeometry(0.068, 20, 18);
  applyOrganicVertexShading(lAuricleGeo, 0xb91c1c, 0x6b0f12);
  const lAuricle = new THREE.Mesh(lAuricleGeo, heartMat.clone());
  lAuricle.position.set(0.095, 0.085, 0.02);
  lAuricle.userData = { subPartId: 'left_atrium' };
  heartGroup.add(lAuricle);

  // Sculpted Ascending Aorta & Aortic Arch + 3 Superior Arterial Branches
  const aorticArchCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.01, 0.08, 0.02),
    new THREE.Vector3(0.0, 0.19, 0.03),
    new THREE.Vector3(-0.02, 0.24, 0.0),
    new THREE.Vector3(-0.04, 0.18, -0.06),
    new THREE.Vector3(-0.03, 0.04, -0.08),
  ]);
  const aortaArchGeo = createVariableTubeGeometry(
    aorticArchCurve,
    24,
    14,
    (u) => 0.034 - u * 0.005,
    0xd9383a,
    0x8c191c
  );
  const aortaMesh = new THREE.Mesh(aortaArchGeo, heartMat.clone());
  aortaMesh.userData = { subPartId: 'aorta' };
  heartGroup.add(aortaMesh);

  // 3 Aortic Arch branches (Brachiocephalic, Left Common Carotid, Left Subclavian)
  [-0.02, 0.0, 0.02].forEach((bx, idx) => {
    const branchCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(bx, 0.23, 0.01 - idx * 0.015),
      new THREE.Vector3(bx + (idx - 1) * 0.015, 0.32, 0.0 - idx * 0.015),
    ]);
    const bGeo = createVariableTubeGeometry(
      branchCurve,
      8,
      8,
      () => 0.012,
      0xd9383a,
      0x8c191c
    );
    const branchMesh = new THREE.Mesh(bGeo, heartMat.clone());
    branchMesh.userData = { subPartId: 'aorta' };
    heartGroup.add(branchMesh);
  });

  // Superior Vena Cava & Pulmonary Artery Trunk (Venous Blue-Purple)
  const svcCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.09, 0.08, 0.0),
    new THREE.Vector3(-0.095, 0.26, -0.01),
  ]);
  const svcGeo = createVariableTubeGeometry(svcCurve, 12, 12, () => 0.025, 0x2563eb, 0x1e3a8a);
  const svcMesh = new THREE.Mesh(svcGeo, heartMat.clone());
  svcMesh.userData = { subPartId: 'superior_vena_cava' };
  heartGroup.add(svcMesh);

  const pulmCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.03, 0.07, 0.05),
    new THREE.Vector3(0.01, 0.16, 0.04),
    new THREE.Vector3(-0.08, 0.17, 0.01),
  ]);
  const pulmGeo = createVariableTubeGeometry(pulmCurve, 14, 12, () => 0.026, 0x4f46e5, 0x312e81);
  const pulmMesh = new THREE.Mesh(pulmGeo, heartMat.clone());
  pulmMesh.userData = { subPartId: 'pulmonary_artery' };
  heartGroup.add(pulmMesh);

  // Branching 3D Coronary Arteries wrapping the myocardium surface
  const ladCoronaryCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.02, 0.08, 0.09),
    new THREE.Vector3(0.03, 0.0, 0.115),
    new THREE.Vector3(0.05, -0.08, 0.105),
    new THREE.Vector3(0.07, -0.15, 0.075),
  ]);
  const ladGeo = createVariableTubeGeometry(
    ladCoronaryCurve,
    16,
    8,
    (u) => 0.007 * (1 - u * 0.45),
    0xef4444,
    0x991b1b
  );
  const ladMesh = new THREE.Mesh(ladGeo, heartMat.clone());
  ladMesh.userData = { subPartId: 'left_ventricle' };
  heartGroup.add(ladMesh);

  registerOrganGroup(
    'heart',
    'Mesh_Heart',
    'circulatory',
    heartGroup,
    new THREE.Vector3(0.04, 0.91, 0.08),
    0.62,
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
  applyOrganicVertexShading(spleenGeo, 0x862e73, 0x4c1440, (_x, y, z) => {
    const l = Math.sin(y * 28 + z * 22) * 0.004;
    return { offset: l, colorMix: 0.5 + 0.4 * Math.cos(y * 15) };
  });
  const spleenMesh = new THREE.Mesh(spleenGeo, spleenMat);
  spleenMesh.position.set(0.31, 0.46, -0.03);
  spleenMesh.rotation.z = -0.28;
  spleenMesh.userData = { subPartId: 'diaphragmatic_surface', organId: 'spleen' };
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
      organId: 'lungs',
    };
    lungsGroup.add(lungMesh);

    // Sculpt lower diaphragmatic lobe
    const lowerLobeGeo = new THREE.SphereGeometry(0.19, 28, 24);
    lowerLobeGeo.scale(0.95, 0.75, 0.95);
    applyOrganicVertexShading(lowerLobeGeo, 0xd9726a, 0x943832);
    const lowerLobeMesh = new THREE.Mesh(lowerLobeGeo, lungMat.clone());
    lowerLobeMesh.position.set(side * 0.19, -0.16, 0.01);
    lowerLobeMesh.userData = {
      subPartId: isLeft ? 'left_inferior_lobe' : 'right_inferior_lobe',
      organId: 'lungs',
    };
    lungsGroup.add(lowerLobeMesh);
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
  tracheaMesh.userData = { subPartId: 'trachea', organId: 'lungs' };
  lungsGroup.add(tracheaMesh);

  registerOrganGroup(
    'lungs',
    'Mesh_Lungs',
    'respiratory',
    lungsGroup,
    new THREE.Vector3(0, 0.94, 0.03),
    0.72,
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
  rHepatic.userData = { subPartId: 'right_hepatic_lobe', organId: 'liver' };
  liverGroup.add(rHepatic);

  const lHepaticGeo = new THREE.SphereGeometry(0.135, 28, 24);
  lHepaticGeo.scale(1.22, 0.62, 0.72);
  applyOrganicVertexShading(lHepaticGeo, 0x853228, 0x4d1812);
  const lHepatic = new THREE.Mesh(lHepaticGeo, liverMat.clone());
  lHepatic.position.set(0.05, 0.56, 0.11);
  lHepatic.rotation.z = -0.18;
  lHepatic.userData = { subPartId: 'left_hepatic_lobe', organId: 'liver' };
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
  falciformMesh.userData = { subPartId: 'falciform_ligament', organId: 'liver' };
  liverGroup.add(falciformMesh);

  // Green Pear-Shaped Gallbladder tucked under Right Lobe
  const gbGeo = new THREE.SphereGeometry(0.042, 18, 16);
  gbGeo.scale(0.75, 1.35, 0.75);
  applyOrganicVertexShading(gbGeo, 0x65a30d, 0x365314);
  const gbMesh = new THREE.Mesh(gbGeo, liverMat.clone());
  gbMesh.position.set(-0.14, 0.41, 0.14);
  gbMesh.rotation.z = 0.35;
  gbMesh.userData = { subPartId: 'gallbladder', organId: 'liver' };
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
  const stomachMesh = new THREE.Mesh(stomachGeo, stomachMat);
  stomachMesh.userData = { subPartId: 'greater_curvature', organId: 'stomach' };
  stomachGroup.add(stomachMesh);

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
  const pancMesh = new THREE.Mesh(pancGeo, pancreasMat);
  pancMesh.userData = { subPartId: 'pancreas_body', organId: 'pancreas' };
  pancreasGroup.add(pancMesh);

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
  const smallIntMesh = new THREE.Mesh(smallIntGeo, smallIntMat);
  smallIntMesh.userData = { subPartId: 'mesenteric_coils', organId: 'small_intestine' };
  smallIntGroup.add(smallIntMesh);

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
  const colonMesh = new THREE.Mesh(colonGeo, largeIntMat);
  colonMesh.userData = { subPartId: 'transverse_colon', organId: 'large_intestine' };
  largeIntGroup.add(colonMesh);

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
      organId: 'kidneys',
    };
    kidneysGroup.add(kMesh);

    // Suprarenal (Adrenal) Gland cap atop each kidney
    const adrenalGeo = new THREE.ConeGeometry(0.042, 0.048, 14);
    adrenalGeo.scale(1.1, 1, 0.65);
    applyOrganicVertexShading(adrenalGeo, 0xf59e0b, 0xb45309);
    const adrenal = new THREE.Mesh(adrenalGeo, kidneyMat.clone());
    adrenal.position.set(side * 0.155, yOffset + 0.13, -0.06);
    adrenal.rotation.z = side * 0.25;
    adrenal.userData = { subPartId: 'renal_hilum', organId: 'kidneys' };
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
    ureterMesh.userData = { subPartId: 'ureter', organId: 'kidneys' };
    kidneysGroup.add(ureterMesh);
  });

  // Urinary Bladder at base of pelvis
  const bladderGeo = new THREE.SphereGeometry(0.072, 22, 20);
  bladderGeo.scale(1.0, 0.92, 0.95);
  applyOrganicVertexShading(bladderGeo, 0xd97757, 0x8c3b24);
  const bladderMesh = new THREE.Mesh(bladderGeo, kidneyMat.clone());
  bladderMesh.position.set(0, -0.45, 0.07);
  bladderMesh.userData = { subPartId: 'urinary_bladder', organId: 'kidneys' };
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

  // =========================================================================
  // 10. ENDOCRINE SYSTEM: ANATOMICALLY SCULPTED THYROID GLAND & LARYNX
  // =========================================================================
  const endocrineGroup = systemGroups.get('endocrine')!;
  const thyroidGroup = new THREE.Group();
  const thyroidMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.36,
    metalness: 0.08,
  });
  const laryngealCartilageMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.35,
    metalness: 0.08,
  });

  // 1. Laryngeal Cartilaginous Framework (Thyroid Cartilage Shield & Trachea)
  // Thyroid Cartilage (Adam's Apple) V-shaped shield
  const thyroidCartGeo = new THREE.CylinderGeometry(0.044, 0.038, 0.082, 16, 1, true, -Math.PI * 0.65, Math.PI * 1.3);
  applyOrganicVertexShading(thyroidCartGeo, 0x94a3b8, 0x475569);
  const tCartMesh = new THREE.Mesh(thyroidCartGeo, laryngealCartilageMat.clone());
  tCartMesh.position.set(0, 1.49, 0.162);
  tCartMesh.rotation.y = Math.PI;
  tCartMesh.userData = { subPartId: 'thyroid_isthmus', organId: 'thyroid' };
  thyroidGroup.add(tCartMesh);

  // Cricoid Cartilage Ring (Stout signet-ring cartilage)
  const cricoidGeo = new THREE.TorusGeometry(0.034, 0.011, 12, 22);
  applyOrganicVertexShading(cricoidGeo, 0x94a3b8, 0x475569);
  const cricoidMesh = new THREE.Mesh(cricoidGeo, laryngealCartilageMat.clone());
  cricoidMesh.position.set(0, 1.44, 0.162);
  cricoidMesh.rotation.x = Math.PI / 2;
  cricoidMesh.userData = { subPartId: 'thyroid_isthmus', organId: 'thyroid' };
  thyroidGroup.add(cricoidMesh);

  // Descending Tracheal Rings (Cartilaginous windpipe rings)
  for (let t = 0; t < 5; t++) {
    const ringGeo = new THREE.TorusGeometry(0.031, 0.0075, 10, 20);
    applyOrganicVertexShading(ringGeo, 0xa1a1aa, 0x52525b);
    const ringMesh = new THREE.Mesh(ringGeo, laryngealCartilageMat.clone());
    ringMesh.position.set(0, 1.405 - t * 0.022, 0.162);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.userData = { subPartId: 'thyroid_isthmus', organId: 'thyroid' };
    thyroidGroup.add(ringMesh);
  }

  // 2. Anatomical Butterfly Thyroid Gland Lobes
  // Bilateral Lateral Lobes (Tapered superior pole, broad rounded inferior base hugging trachea)
  [-1, 1].forEach((side) => {
    const lobeGeo = new THREE.SphereGeometry(0.046, 22, 20);
    lobeGeo.scale(0.85, 1.55, 0.75);
    const lPos = lobeGeo.attributes.position;
    for (let i = 0; i < lPos.count; i++) {
      let x = lPos.getX(i);
      let y = lPos.getY(i);
      let z = lPos.getZ(i);

      if (y > 0) {
        x *= 1 - (y / 0.075) * 0.42;
        z *= 1 - (y / 0.075) * 0.42;
      }
      if (side * x < 0) {
        x *= 0.55;
      }
      lPos.setXYZ(i, x, y, z);
    }
    lobeGeo.computeVertexNormals();
    applyOrganicVertexShading(
      lobeGeo,
      side === 1 ? 0xa855f7 : 0x9333ea,
      side === 1 ? 0x6b21a8 : 0x581c87
    );
    lobeGeo.computeBoundingBox();
    lobeGeo.computeBoundingSphere();

    const lobeMesh = new THREE.Mesh(lobeGeo, thyroidMat.clone());
    lobeMesh.position.set(side * 0.038, 1.44, 0.178);
    lobeMesh.rotation.z = side * -0.14;
    lobeMesh.rotation.y = side * 0.22;
    lobeMesh.userData = {
      subPartId: side === 1 ? 'left_thyroid_lobe' : 'right_thyroid_lobe',
      organId: 'thyroid',
    };
    thyroidGroup.add(lobeMesh);
  });

  // 3. Central Thyroid Isthmus & Pyramidal Lobe
  const isthmusGeo = new THREE.CylinderGeometry(0.018, 0.020, 0.048, 16);
  isthmusGeo.scale(1.25, 0.65, 0.55);
  applyOrganicVertexShading(isthmusGeo, 0xc084fc, 0x7e22ce);
  isthmusGeo.computeBoundingBox();
  isthmusGeo.computeBoundingSphere();

  const isthmusMesh = new THREE.Mesh(isthmusGeo, thyroidMat.clone());
  isthmusMesh.rotation.z = Math.PI / 2;
  isthmusMesh.position.set(0, 1.41, 0.192);
  isthmusMesh.userData = { subPartId: 'thyroid_isthmus', organId: 'thyroid' };
  thyroidGroup.add(isthmusMesh);

  // Pyramidal Lobe (authentic anatomical variant ascending from isthmus toward hyoid)
  const pyramidGeo = new THREE.ConeGeometry(0.012, 0.052, 10);
  pyramidGeo.scale(0.85, 1, 0.55);
  applyOrganicVertexShading(pyramidGeo, 0xa855f7, 0x6b21a8);
  pyramidGeo.computeBoundingBox();
  pyramidGeo.computeBoundingSphere();

  const pyramidMesh = new THREE.Mesh(pyramidGeo, thyroidMat.clone());
  pyramidMesh.position.set(-0.010, 1.445, 0.190);
  pyramidMesh.userData = { subPartId: 'thyroid_isthmus', organId: 'thyroid' };
  thyroidGroup.add(pyramidMesh);

  registerOrganGroup(
    'thyroid',
    'Mesh_Thyroid',
    'endocrine',
    thyroidGroup,
    new THREE.Vector3(0, 1.44, 0.18),
    0.42,
    organRecords
  );
  endocrineGroup.add(thyroidGroup);

  // =========================================================================
  // 11. LYMPHATIC SYSTEM: ANATOMICAL LYMPH NODE & VASCULAR COMPLEX (Mesh_LymphNodes)
  // =========================================================================
  const lymphaticGroup = systemGroups.get('lymphatic')!;
  const lymphNodesGroup = new THREE.Group();
  const lymphMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.30,
    metalness: 0.10,
  });

  const lymphVesselMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.28,
    metalness: 0.12,
  });

  const hilarArteryMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    roughness: 0.35,
    metalness: 0.08,
  });

  const hilarVeinMat = new THREE.MeshStandardMaterial({
    color: 0x2563eb,
    roughness: 0.35,
    metalness: 0.08,
  });

  // -------------------------------------------------------------------------
  // FULL 3D ANATOMICAL LYMPHATIC SYSTEM NETWORK (Mesh_LymphNodes)
  // Comprehensive organic 3D tree: Thoracic Duct, Cisterna Chyli, Cervical Nodes,
  // Axillary Nodes, and Inguinal-Pelvic Lymphatic Chains (Pure standalone 3D complex)
  // -------------------------------------------------------------------------
  function createOrganicLymphNode(rx: number, ry: number, rz: number): THREE.BufferGeometry {
    const geo = new THREE.SphereGeometry(rx, 16, 14);
    geo.scale(1.25, ry / rx, rz / rx);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i);
      let y = p.getY(i);
      let z = p.getZ(i);
      // Subtle bean-shaped indentation (hilum)
      if (x < 0 && Math.abs(y) < ry * 0.4) {
        x *= 0.78;
      }
      p.setXYZ(i, x, y, z);
    }
    geo.computeVertexNormals();
    applyOrganicVertexShading(geo, 0x10b981, 0x047857);
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
    return geo;
  }

  // 1. THORACIC DUCT & CISTERNA CHYLI (subPartId: 'thoracic_duct')
  // Main thoracic collecting duct running from cisterna chyli up to left venous angle
  const thoracicDuctSpline = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.015, -0.22, 0.02),
    new THREE.Vector3(-0.010, -0.05, 0.025),
    new THREE.Vector3(-0.012, 0.12, 0.03),
    new THREE.Vector3(-0.018, 0.28, 0.035),
    new THREE.Vector3(-0.025, 0.44, 0.04),
    new THREE.Vector3(-0.045, 0.54, 0.045),
    new THREE.Vector3(-0.085, 0.60, 0.045),
    new THREE.Vector3(-0.130, 0.58, 0.04),
  ]);
  const tdGeo = createVariableTubeGeometry(
    thoracicDuctSpline,
    36,
    8,
    (t) => 0.0075 + Math.sin(t * Math.PI * 10) * 0.0018, // Valvular segments along thoracic duct
    0x34d399,
    0x059669
  );
  const tdMesh = new THREE.Mesh(tdGeo, lymphVesselMat.clone());
  tdMesh.userData = { subPartId: 'thoracic_duct', organId: 'lymph_nodes' };
  lymphNodesGroup.add(tdMesh);

  // Cisterna Chyli: Anatomical dilated lymphatic reservoir at L1/L2
  const ccGeo = new THREE.SphereGeometry(0.034, 18, 16);
  ccGeo.scale(1.15, 2.2, 0.85);
  applyOrganicVertexShading(ccGeo, 0x10b981, 0x059669);
  const ccMesh = new THREE.Mesh(ccGeo, lymphMat.clone());
  ccMesh.position.set(-0.015, -0.25, 0.02);
  ccMesh.userData = { subPartId: 'thoracic_duct', organId: 'lymph_nodes' };
  lymphNodesGroup.add(ccMesh);

  // Right Lymphatic Duct entering right venous angle
  const rightDuctSpline = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.015, 0.44, 0.035),
    new THREE.Vector3(0.040, 0.52, 0.04),
    new THREE.Vector3(0.075, 0.58, 0.042),
    new THREE.Vector3(0.115, 0.57, 0.038),
  ]);
  const rdGeo = createVariableTubeGeometry(
    rightDuctSpline,
    20,
    8,
    (t) => 0.006 + Math.sin(t * Math.PI * 6) * 0.0015,
    0x34d399,
    0x059669
  );
  const rdMesh = new THREE.Mesh(rdGeo, lymphVesselMat.clone());
  rdMesh.userData = { subPartId: 'thoracic_duct', organId: 'lymph_nodes' };
  lymphNodesGroup.add(rdMesh);

  // Mediastinal and Parasternal Intercostal Lymphatic Trunks (Ascending anatomical drainage)
  [-1, 1].forEach((side) => {
    for (let r = 0; r < 3; r++) {
      const ribY = 0.12 + r * 0.13;
      const icCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.14, ribY - 0.04, 0.015),
        new THREE.Vector3(side * 0.07, ribY - 0.01, 0.025),
        new THREE.Vector3(side * 0.015, ribY + 0.02, 0.032),
      ]);
      const icGeo = createVariableTubeGeometry(
        icCurve,
        14,
        8,
        () => 0.0038,
        0x34d399,
        0x059669
      );
      const icMesh = new THREE.Mesh(icGeo, lymphVesselMat.clone());
      icMesh.userData = { subPartId: 'thoracic_duct', organId: 'lymph_nodes' };
      lymphNodesGroup.add(icMesh);

      // Mediastinal lymph node
      const medNodeGeo = createOrganicLymphNode(0.018, 0.014, 0.012);
      const medMesh = new THREE.Mesh(medNodeGeo, lymphMat.clone());
      medMesh.position.set(side * 0.05, ribY + 0.005, 0.03);
      medMesh.userData = { subPartId: 'thoracic_duct', organId: 'lymph_nodes' };
      lymphNodesGroup.add(medMesh);
    }
  });

  // 2. CERVICAL LYMPH NODES & JUGULAR TRUNKS (subPartId: 'cervical_nodes')
  [-1, 1].forEach((side) => {
    // Cervical jugular lymphatic trunk
    const jugularSpline = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.055, 0.82, 0.035),
      new THREE.Vector3(side * 0.065, 0.74, 0.040),
      new THREE.Vector3(side * 0.075, 0.66, 0.042),
      new THREE.Vector3(side * 0.090, 0.58, 0.040),
    ]);
    const jugGeo = createVariableTubeGeometry(
      jugularSpline,
      20,
      8,
      () => 0.0055,
      0x34d399,
      0x059669
    );
    const jugMesh = new THREE.Mesh(jugGeo, lymphVesselMat.clone());
    jugMesh.userData = { subPartId: 'cervical_nodes', organId: 'lymph_nodes' };
    lymphNodesGroup.add(jugMesh);

    // Chain of 6 cervical lymph nodes along the internal jugular vein
    const cervicalPositions = [
      { y: 0.82, x: 0.055, z: 0.035, r: 0.024 },
      { y: 0.77, x: 0.062, z: 0.038, r: 0.027 },
      { y: 0.72, x: 0.068, z: 0.040, r: 0.030 },
      { y: 0.67, x: 0.074, z: 0.042, r: 0.028 },
      { y: 0.62, x: 0.082, z: 0.041, r: 0.032 }, // Jugulodigastric node
      { y: 0.58, x: 0.092, z: 0.039, r: 0.025 }, // Supraclavicular node
    ];

    cervicalPositions.forEach((pos) => {
      const cGeo = createOrganicLymphNode(pos.r, pos.r * 0.8, pos.r * 0.7);
      const cMesh = new THREE.Mesh(cGeo, lymphMat.clone());
      cMesh.position.set(side * pos.x, pos.y, pos.z);
      cMesh.userData = { subPartId: 'cervical_nodes', organId: 'lymph_nodes' };
      lymphNodesGroup.add(cMesh);
    });
  });

  // 3. AXILLARY LYMPH NODES & SUBCLAVIAN TRUNKS (subPartId: 'axillary_nodes')
  [-1, 1].forEach((side) => {
    // Subclavian lymphatic trunk connecting axillary nodes to the venous angle
    const subclavSpline = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.28, 0.44, 0.03),
      new THREE.Vector3(side * 0.20, 0.48, 0.035),
      new THREE.Vector3(side * 0.13, 0.52, 0.038),
      new THREE.Vector3(side * 0.09, 0.56, 0.040),
    ]);
    const subclavGeo = createVariableTubeGeometry(
      subclavSpline,
      20,
      8,
      () => 0.0055,
      0x34d399,
      0x059669
    );
    const subMesh = new THREE.Mesh(subclavGeo, lymphVesselMat.clone());
    subMesh.userData = { subPartId: 'axillary_nodes', organId: 'lymph_nodes' };
    lymphNodesGroup.add(subMesh);

    // Axillary cluster: 7 nodes (Central, Pectoral, Lateral, Subscapular, Apical)
    const axillaryCoords = [
      { x: 0.30, y: 0.43, z: 0.025, r: 0.028 },
      { x: 0.26, y: 0.46, z: 0.032, r: 0.032 },
      { x: 0.22, y: 0.48, z: 0.036, r: 0.030 },
      { x: 0.32, y: 0.47, z: 0.020, r: 0.026 },
      { x: 0.25, y: 0.41, z: 0.035, r: 0.029 },
      { x: 0.20, y: 0.43, z: 0.040, r: 0.027 },
      { x: 0.16, y: 0.50, z: 0.038, r: 0.031 }, // Apical node
    ];

    axillaryCoords.forEach((coord, i) => {
      const aGeo = createOrganicLymphNode(coord.r, coord.r * 0.82, coord.r * 0.72);
      const aMesh = new THREE.Mesh(aGeo, lymphMat.clone());
      aMesh.position.set(side * coord.x, coord.y, coord.z);
      aMesh.userData = { subPartId: 'axillary_nodes', organId: 'lymph_nodes' };
      lymphNodesGroup.add(aMesh);

      // Connecting feeder vessel between adjacent axillary nodes
      if (i > 0) {
        const prev = axillaryCoords[i - 1];
        const vCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(side * prev.x, prev.y, prev.z),
          new THREE.Vector3(side * coord.x, coord.y, coord.z),
        ]);
        const vGeo = createVariableTubeGeometry(
          vCurve,
          10,
          8,
          () => 0.0035,
          0x34d399,
          0x059669
        );
        const vMesh = new THREE.Mesh(vGeo, lymphVesselMat.clone());
        vMesh.userData = { subPartId: 'axillary_nodes', organId: 'lymph_nodes' };
        lymphNodesGroup.add(vMesh);
      }
    });
  });

  // 4. INGUINAL & PELVIC LYMPHATIC CHAINS (subPartId: 'inguinal_nodes')
  [-1, 1].forEach((side) => {
    // Common & External Iliac lymphatic trunks connecting inguinal nodes to cisterna chyli
    const iliacSpline = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.15, -0.48, 0.05),
      new THREE.Vector3(side * 0.11, -0.40, 0.04),
      new THREE.Vector3(side * 0.07, -0.32, 0.03),
      new THREE.Vector3(-0.015, -0.25, 0.02), // Joins cisterna chyli
    ]);
    const iliacGeo = createVariableTubeGeometry(
      iliacSpline,
      22,
      8,
      () => 0.006,
      0x34d399,
      0x059669
    );
    const iliacMesh = new THREE.Mesh(iliacGeo, lymphVesselMat.clone());
    iliacMesh.userData = { subPartId: 'inguinal_nodes', organId: 'lymph_nodes' };
    lymphNodesGroup.add(iliacMesh);

    // Inguinal & Iliac Lymph Nodes (Superficial horizontal & vertical chains, Deep inguinal)
    const inguinalCoords = [
      { x: 0.16, y: -0.48, z: 0.055, r: 0.032 },
      { x: 0.20, y: -0.49, z: 0.060, r: 0.030 },
      { x: 0.24, y: -0.50, z: 0.062, r: 0.028 },
      { x: 0.17, y: -0.55, z: 0.058, r: 0.031 },
      { x: 0.18, y: -0.62, z: 0.055, r: 0.027 },
      { x: 0.12, y: -0.41, z: 0.045, r: 0.029 }, // External iliac node
      { x: 0.08, y: -0.34, z: 0.035, r: 0.028 }, // Common iliac node
    ];

    inguinalCoords.forEach((coord, i) => {
      const ingGeo = createOrganicLymphNode(coord.r, coord.r * 0.85, coord.r * 0.75);
      const ingMesh = new THREE.Mesh(ingGeo, lymphMat.clone());
      ingMesh.position.set(side * coord.x, coord.y, coord.z);
      ingMesh.userData = { subPartId: 'inguinal_nodes', organId: 'lymph_nodes' };
      lymphNodesGroup.add(ingMesh);

      if (i > 0 && i < 5) {
        const prev = inguinalCoords[i - 1];
        const ingCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(side * prev.x, prev.y, prev.z),
          new THREE.Vector3(side * coord.x, coord.y, coord.z),
        ]);
        const ivGeo = createVariableTubeGeometry(
          ingCurve,
          10,
          8,
          () => 0.0035,
          0x34d399,
          0x059669
        );
        const ivMesh = new THREE.Mesh(ivGeo, lymphVesselMat.clone());
        ivMesh.userData = { subPartId: 'inguinal_nodes', organId: 'lymph_nodes' };
        lymphNodesGroup.add(ivMesh);
      }
    });
  });

  registerOrganGroup(
    'lymph_nodes',
    'Mesh_LymphNodes',
    'lymphatic',
    lymphNodesGroup,
    new THREE.Vector3(0, 0.08, 0.04),
    0.98,
    organRecords
  );
  lymphaticGroup.add(lymphNodesGroup);

  // =========================================================================
  // 12. REPRODUCTIVE SYSTEM (Mesh_Reproductive)
  // =========================================================================
  const reproductiveGroup = systemGroups.get('reproductive')!;
  const repGroup = new THREE.Group();
  const repMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.36,
    metalness: 0.08,
  });

  // 1. CENTRAL GENITAL TRACT: Pear-Shaped Piriform Uterus (Fundus, Corpus, Cervix)
  const uterusGeo = new THREE.SphereGeometry(0.068, 24, 22);
  uterusGeo.scale(1.15, 1.45, 0.85);
  const uPos = uterusGeo.attributes.position;
  for (let i = 0; i < uPos.count; i++) {
    let x = uPos.getX(i);
    let y = uPos.getY(i);
    let z = uPos.getZ(i);

    if (y < 0) {
      const taper = 1 + (y / 0.10) * 0.48;
      x *= taper;
      z *= taper;
    }
    z += Math.cos((y / 0.10) * Math.PI * 0.5) * 0.012;
    uPos.setXYZ(i, x, y, z);
  }
  uterusGeo.computeVertexNormals();
  applyOrganicVertexShading(uterusGeo, 0xf472b6, 0x9d174d);
  uterusGeo.computeBoundingBox();
  uterusGeo.computeBoundingSphere();

  const uterusMesh = new THREE.Mesh(uterusGeo, repMat.clone());
  uterusMesh.position.set(0, -0.45, 0.05);
  uterusMesh.userData = { subPartId: 'genital_tract', organId: 'reproductive' };
  repGroup.add(uterusMesh);

  // Cylindrical Cervix with external os
  const cervixGeo = new THREE.CylinderGeometry(0.024, 0.022, 0.045, 16);
  cervixGeo.scale(1.1, 1, 0.85);
  applyOrganicVertexShading(cervixGeo, 0xec4899, 0x831843);
  cervixGeo.computeBoundingBox();
  cervixGeo.computeBoundingSphere();

  const cervixMesh = new THREE.Mesh(cervixGeo, repMat.clone());
  cervixMesh.position.set(0, -0.53, 0.05);
  cervixMesh.userData = { subPartId: 'genital_tract', organId: 'reproductive' };
  repGroup.add(cervixMesh);

  // 2. GONADAL PARENCHYMA: Bilateral Almond-Shaped Ovaries
  [-1, 1].forEach((side) => {
    const ovaryGeo = new THREE.SphereGeometry(0.032, 18, 16);
    ovaryGeo.scale(1.35, 0.85, 0.80);
    applyOrganicVertexShading(ovaryGeo, 0xdb2777, 0x831843);
    ovaryGeo.computeBoundingBox();
    ovaryGeo.computeBoundingSphere();

    const ovaryMesh = new THREE.Mesh(ovaryGeo, repMat.clone());
    ovaryMesh.position.set(side * 0.145, -0.41, 0.035);
    ovaryMesh.rotation.z = side * -0.22;
    ovaryMesh.userData = { subPartId: 'gonads', organId: 'reproductive' };
    repGroup.add(ovaryMesh);

    // Ovarian Ligament anchoring ovary to uterine cornu
    const ligCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.065, -0.41, 0.048),
      new THREE.Vector3(side * 0.105, -0.415, 0.040),
      new THREE.Vector3(side * 0.130, -0.41, 0.035),
    ]);
    const ligGeo = new THREE.TubeGeometry(ligCurve, 10, 0.005, 6, false);
    applyOrganicVertexShading(ligGeo, 0xfce7f3, 0xdb2777);
    ligGeo.computeBoundingBox();
    ligGeo.computeBoundingSphere();

    const ligMesh = new THREE.Mesh(ligGeo, repMat.clone());
    ligMesh.userData = { subPartId: 'gonads', organId: 'reproductive' };
    repGroup.add(ligMesh);
  });

  // 3. REPRODUCTIVE DUCT NETWORK: Elegant Arched Fallopian Tubes with Infundibulum & Fimbriae
  [-1, 1].forEach((side) => {
    const tubeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.062, -0.395, 0.05),
      new THREE.Vector3(side * 0.110, -0.365, 0.055),
      new THREE.Vector3(side * 0.160, -0.380, 0.045),
      new THREE.Vector3(side * 0.165, -0.415, 0.035),
    ]);
    const tubeGeo = new THREE.TubeGeometry(tubeCurve, 16, 0.008, 8, false);
    applyOrganicVertexShading(tubeGeo, 0xf472b6, 0x9d174d);
    tubeGeo.computeBoundingBox();
    tubeGeo.computeBoundingSphere();

    const tubeMesh = new THREE.Mesh(tubeGeo, repMat.clone());
    tubeMesh.userData = { subPartId: 'duct_network', organId: 'reproductive' };
    repGroup.add(tubeMesh);

    // Trumpet-shaped fimbriated infundibulum embracing the ovary
    const fimbriaeGeo = new THREE.ConeGeometry(0.018, 0.032, 10, 1, true);
    applyOrganicVertexShading(fimbriaeGeo, 0xec4899, 0x831843);
    fimbriaeGeo.computeBoundingBox();
    fimbriaeGeo.computeBoundingSphere();

    const fimbriaeMesh = new THREE.Mesh(fimbriaeGeo, repMat.clone());
    fimbriaeMesh.position.set(side * 0.165, -0.422, 0.035);
    fimbriaeMesh.rotation.z = side * Math.PI * 0.65;
    fimbriaeMesh.userData = { subPartId: 'duct_network', organId: 'reproductive' };
    repGroup.add(fimbriaeMesh);
  });

  registerOrganGroup(
    'reproductive',
    'Mesh_Reproductive',
    'reproductive',
    repGroup,
    new THREE.Vector3(0, -0.44, 0.05),
    0.54,
    organRecords
  );
  reproductiveGroup.add(repGroup);

  // Center entire human model vertically around y=0
  rootGroup.position.set(0, -0.58, 0);

  const setShellMode = (_mode: 'xray' | 'solid' | 'hidden') => {
    // Pure Solo 3D Atlas: Mannequin body shell is permanently hidden
    bodyShellGroup.visible = false;
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
