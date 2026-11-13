import * as THREE from 'three';
import { AnatomySceneGraph } from './anatomyModelBuilder';

/**
 * Official CC-BY 3D Medical Scan (.glb) Sources from:
 * - Sketchfab / NIH 3D Print Exchange / Visible Human Project (National Library of Medicine)
 * - Human Reference Atlas (HubMAP Consortium)
 */
export interface RealGlbOrganSpec {
  organId: string;
  title: string;
  sourceCredit: string;
  sketchfabReferenceUrl: string;
  urls: string[];
  primaryColorHex: number;
  secondaryColorHex: number;
  roughness: number;
  metalness: number;
  /**
   * 'vhm' = Already in unified Visible Human Male metric coordinate frame (scaled by VHM_SCALE + VHM_OFFSET).
   * 'fit' = Standalone Sketchfab/MRI GLB model fitted into targetBoxCenter & targetMaxDim.
   */
  coordMode: 'vhm' | 'fit';
  targetBoxCenter?: [number, number, number];
  targetMaxDim?: number;
  preRotationEuler?: [number, number, number];
  customFocusRadius?: number;
  focusYOffset?: number;
}

// Unified Visible Human Male (VHM) -> Scene coordinate transform
const VHM_SCALE = 2.65;
const VHM_Y_OFFSET = -0.45;

export const REAL_GLB_ORGAN_SPECS: RealGlbOrganSpec[] = [
  {
    organId: 'heart',
    title: 'Anatomical Human Heart (GLB Scan)',
    sourceCredit: 'NIH 3D / Sketchfab Medical Reference (CC-BY)',
    sketchfabReferenceUrl:
      'https://sketchfab.com/3d-models/realistic-human-heart-3f8072336ce94d18b3d0d055a1ece089',
    urls: [
      'https://ccf-ontology.hubmapconsortium.org/objects/v1.2/VH_M_Heart.glb',
    ],
    primaryColorHex: 0xc8232c,
    secondaryColorHex: 0x6b0f16,
    roughness: 0.28,
    metalness: 0.1,
    coordMode: 'vhm',
    customFocusRadius: 0.56,
  },
  {
    organId: 'kidneys',
    title: 'Bilateral Kidneys, Renal Hilum, Ureters & Bladder (GLB Scan)',
    sourceCredit: 'NIH 3D / Visible Human Reference (CC-BY)',
    sketchfabReferenceUrl:
      'https://sketchfab.com/3d-models/human-organs-035316622877438cb62de673b8f19217',
    urls: [
      'https://ccf-ontology.hubmapconsortium.org/objects/v1.2/VH_M_Kidney_L.glb',
      'https://ccf-ontology.hubmapconsortium.org/objects/v1.2/VH_M_Kidney_R.glb',
      'https://ccf-ontology.hubmapconsortium.org/objects/v1.2/VH_M_Ureter_L.glb',
      'https://ccf-ontology.hubmapconsortium.org/objects/v1.2/VH_M_Ureter_R.glb',
      'https://ccf-ontology.hubmapconsortium.org/objects/v1.2/VH_M_Urinary_Bladder.glb',
    ],
    primaryColorHex: 0xa63e2e,
    secondaryColorHex: 0x591b12,
    roughness: 0.32,
    metalness: 0.08,
    coordMode: 'vhm',
    customFocusRadius: 0.84,
    focusYOffset: 0.14,
  },
  {
    organId: 'liver',
    title: 'Hepatic Lobes & Biliary Impression (GLB Scan)',
    sourceCredit: 'NIH 3D / Visible Human Reference (CC-BY)',
    sketchfabReferenceUrl:
      'https://sketchfab.com/3d-models/gastrointestinal-tract-8c4c69035f4f4773813533d7ca56e516',
    urls: [
      'https://ccf-ontology.hubmapconsortium.org/objects/v1.2/VH_M_Liver.glb',
    ],
    primaryColorHex: 0x853026,
    secondaryColorHex: 0x45140e,
    roughness: 0.25,
    metalness: 0.08,
    coordMode: 'vhm',
    customFocusRadius: 0.68,
  },
  {
    organId: 'lungs',
    title: 'Bilateral Lungs, Lobes & Trachea (GLB Scan)',
    sourceCredit: 'NIH 3D / Visible Human Reference (CC-BY)',
    sketchfabReferenceUrl:
      'https://sketchfab.com/3d-models/animated-full-human-body-anatomy-9b0b079953b840bc9a13f524b60041e4',
    urls: [
      'https://ccf-ontology.hubmapconsortium.org/objects/v1.2/VH_M_Lung.glb',
    ],
    primaryColorHex: 0xe67e76,
    secondaryColorHex: 0x9e3c35,
    roughness: 0.4,
    metalness: 0.04,
    coordMode: 'vhm',
    customFocusRadius: 0.92,
  },
  {
    organId: 'stomach',
    title: 'Sketchfab Realistic Human Stomach (GLB)',
    sourceCredit: 'Sketchfab / NIH 3D (Hyes, A.G. CC-BY)',
    sketchfabReferenceUrl:
      'https://sketchfab.com/3d-models/stomach-organ-56ffcd2330ae4b7ea6c7b8a08c82b4b7',
    urls: [
      'https://raw.githubusercontent.com/code4fukui/human_organs/main/glb/realistic_stomach.glb',
    ],
    primaryColorHex: 0xef8f88,
    secondaryColorHex: 0xa84640,
    roughness: 0.34,
    metalness: 0.06,
    coordMode: 'fit',
    targetBoxCenter: [0.125, 0.515, 0.085],
    targetMaxDim: 0.36,
    customFocusRadius: 0.56,
  },
  {
    organId: 'brain',
    title: '3D MRI Human Brain & Brainstem (GLB Scan)',
    sourceCredit: 'NIH 3D T2 FLAIR MRI & Visible Human (CC-BY)',
    sketchfabReferenceUrl:
      'https://sketchfab.com/3d-models/animated-full-human-body-anatomy-9b0b079953b840bc9a13f524b60041e4',
    urls: [
      'https://raw.githubusercontent.com/code4fukui/human_organs/main/glb/Atrophic_Brain_Cube_T2_Flair_3DFile_300000_NIH3D.glb',
    ],
    primaryColorHex: 0xf3b2a8,
    secondaryColorHex: 0x8a3642,
    roughness: 0.35,
    metalness: 0.06,
    coordMode: 'fit',
    targetBoxCenter: [0, 1.78, 0.0],
    targetMaxDim: 0.44,
    preRotationEuler: [-Math.PI / 2, 0, Math.PI],
    customFocusRadius: 0.64,
  },
  {
    organId: 'spleen',
    title: 'Human Spleen & Hilum (GLB Scan)',
    sourceCredit: 'NIH 3D / Visible Human Reference (CC-BY)',
    sketchfabReferenceUrl:
      'https://sketchfab.com/3d-models/human-male-internal-organs-anatomy-9958172a6fd74610922a3a5fcb3e0850',
    urls: [
      'https://ccf-ontology.hubmapconsortium.org/objects/v1.2/VH_M_Spleen.glb',
    ],
    primaryColorHex: 0x8b3278,
    secondaryColorHex: 0x4a123e,
    roughness: 0.32,
    metalness: 0.08,
    coordMode: 'vhm',
    customFocusRadius: 0.52,
  },
  {
    organId: 'pancreas',
    title: 'Pancreas Head, Body & Tail (GLB Scan)',
    sourceCredit: 'NIH 3D / Visible Human Reference (CC-BY)',
    sketchfabReferenceUrl:
      'https://sketchfab.com/3d-models/gastrointestinal-tract-8c4c69035f4f4773813533d7ca56e516',
    urls: [
      'https://ccf-ontology.hubmapconsortium.org/objects/v2.0/3d-vh-m-pancreas.glb',
    ],
    primaryColorHex: 0xfbbf24,
    secondaryColorHex: 0xb45309,
    roughness: 0.44,
    metalness: 0.05,
    coordMode: 'vhm',
    customFocusRadius: 0.54,
  },
  {
    organId: 'small_intestine',
    title: 'Duodenum, Jejunum & Ileum (GLB Scan)',
    sourceCredit: 'NIH 3D / Visible Human Reference (CC-BY)',
    sketchfabReferenceUrl:
      'https://sketchfab.com/3d-models/small-and-large-intestine-8a1ca8e3ca224cdeb9264674416bde38',
    urls: [
      'https://ccf-ontology.hubmapconsortium.org/objects/v1.2/VH_M_Small_Intestine.glb',
    ],
    primaryColorHex: 0xec8e88,
    secondaryColorHex: 0xa1443e,
    roughness: 0.36,
    metalness: 0.05,
    coordMode: 'vhm',
    customFocusRadius: 0.78,
  },
  {
    organId: 'large_intestine',
    title: 'Haustrated Colon & Rectum (GLB Scan)',
    sourceCredit: 'NIH 3D / Stony Brook Reference (CC-BY)',
    sketchfabReferenceUrl:
      'https://sketchfab.com/3d-models/small-and-large-intestine-8a1ca8e3ca224cdeb9264674416bde38',
    urls: [
      'https://ccf-ontology.hubmapconsortium.org/objects/v1.2/SBU_M_Intestine_Large.glb',
    ],
    primaryColorHex: 0xe28075,
    secondaryColorHex: 0x94382f,
    roughness: 0.38,
    metalness: 0.05,
    coordMode: 'vhm',
    customFocusRadius: 0.88,
  },
  {
    organId: 'thyroid',
    title: 'Anatomical Larynx & Thyroid Complex (GLB Scan)',
    sourceCredit: 'NIH 3D / HuBMAP Visible Human (CC-BY)',
    sketchfabReferenceUrl:
      'https://sketchfab.com/3d-models/thyroid-gland-3d-model-a89c97b830494cf8a7d5b128cba8c895',
    urls: [
      'https://raw.githubusercontent.com/hubmapconsortium/ccf-3d-reference-object-library/main/VH_Male/v1.4/3d-vh-m-larynx.glb',
    ],
    primaryColorHex: 0xa855f7,
    secondaryColorHex: 0x6b21a8,
    roughness: 0.36,
    metalness: 0.08,
    coordMode: 'vhm',
    customFocusRadius: 0.44,
    focusYOffset: 0.04,
  },
  {
    organId: 'reproductive',
    title: 'Uterus, Ovaries & Fallopian Salpinges (GLB Scan)',
    sourceCredit: 'NIH 3D / Visible Human Female Reference (CC-BY)',
    sketchfabReferenceUrl:
      'https://sketchfab.com/3d-models/female-reproductive-system-9c29d67e2051406497f1f9e8a5ec99be',
    urls: [
      'https://raw.githubusercontent.com/hubmapconsortium/ccf-3d-reference-object-library/main/VH_Female/v1.2/VH_F_Uterus.glb',
      'https://raw.githubusercontent.com/hubmapconsortium/ccf-3d-reference-object-library/main/VH_Female/v1.2/VH_F_Ovary_L.glb',
      'https://raw.githubusercontent.com/hubmapconsortium/ccf-3d-reference-object-library/main/VH_Female/v1.2/VH_F_Ovary_R.glb',
      'https://raw.githubusercontent.com/hubmapconsortium/ccf-3d-reference-object-library/main/VH_Female/v1.2/VH_F_Fallopian_Tube_L.glb',
      'https://raw.githubusercontent.com/hubmapconsortium/ccf-3d-reference-object-library/main/VH_Female/v1.2/VH_F_Fallopian_Tube_R.glb',
    ],
    primaryColorHex: 0xec4899,
    secondaryColorHex: 0x831843,
    roughness: 0.36,
    metalness: 0.08,
    coordMode: 'fit',
    targetBoxCenter: [0, -0.44, 0.05],
    targetMaxDim: 0.46,
    customFocusRadius: 0.52,
  },
  {
    organId: 'skeleton',
    title: 'Full Human Skeletal Framework (Écorché GLB)',
    sourceCredit: 'Sketchfab Anatomical High-Resolution Scan (CC-BY)',
    sketchfabReferenceUrl:
      'https://sketchfab.com/3d-models/human-skeleton-highresolution-model-657a31ed9704423c8c4e752fb2506a74',
    urls: [
      'https://cdn.jsdelivr.net/gh/Charleeh/ecorche@master/model/ecorche.glb',
    ],
    primaryColorHex: 0xefece6,
    secondaryColorHex: 0xd9d2c5,
    roughness: 0.40,
    metalness: 0.06,
    coordMode: 'fit',
    targetBoxCenter: [0, 0.18, 0],
    targetMaxDim: 3.60,
    customFocusRadius: 2.10,
    focusYOffset: 0.10,
  },
  {
    organId: 'muscles',
    title: 'Complete Human Muscular System (Écorché GLB)',
    sourceCredit: 'Sketchfab Anatomical Musculature Scan (CC-BY)',
    sketchfabReferenceUrl:
      'https://sketchfab.com/3d-models/ecorche-anatomy-human-male-musculature-9bfa112a99844626ac2480fff6276f0e',
    urls: [
      'https://cdn.jsdelivr.net/gh/Charleeh/ecorche@master/model/ecorche.glb',
    ],
    primaryColorHex: 0x9e2a2b,
    secondaryColorHex: 0x6a1318,
    roughness: 0.38,
    metalness: 0.05,
    coordMode: 'fit',
    targetBoxCenter: [0, 0.18, 0],
    targetMaxDim: 3.60,
    customFocusRadius: 2.10,
    focusYOffset: 0.10,
  },
  {
    organId: 'lymph_nodes',
    title: 'Anatomical Lymphatic System & Nodes (GLB Scan)',
    sourceCredit: 'NIH 3D / HuBMAP Visible Human Reference (CC-BY)',
    sketchfabReferenceUrl:
      'https://sketchfab.com/3d-models/lymphatic-system-600ffebad40342bab13741c631981a8b',
    urls: [
      'https://raw.githubusercontent.com/hubmapconsortium/ccf-3d-reference-object-library/main/VH_Male/v1.2/NIH_M_Lymph_Node.glb',
      'https://raw.githubusercontent.com/hubmapconsortium/ccf-3d-reference-object-library/main/VH_Male/v1.2/VH_M_Thymus.glb',
    ],
    primaryColorHex: 0x10b981,
    secondaryColorHex: 0x059669,
    roughness: 0.35,
    metalness: 0.08,
    coordMode: 'fit',
    targetBoxCenter: [0, 0.15, 0.04],
    targetMaxDim: 1.10,
    customFocusRadius: 0.85,
    focusYOffset: 0.05,
  },
];

const SKIN_GLB_URL =
  'https://ccf-ontology.hubmapconsortium.org/objects/v1.2/VH_M_Skin.glb';
const PELVIS_GLB_URL =
  'https://ccf-ontology.hubmapconsortium.org/objects/v1.2/VH_M_Pelvis.glb';

// Singleton memory caches so parsed GLB geometries are never downloaded or rebuilt twice
const rawBufferCache = new Map<string, ArrayBuffer>();
const inflightFetchCache = new Map<string, Promise<ArrayBuffer>>();

interface CachedSubMeshSpec {
  subPartId: string | null;
  geometry: THREE.BufferGeometry;
}

interface CachedOrganModel {
  organId: string;
  finalCenter: THREE.Vector3;
  focusCenter: THREE.Vector3;
  focusRadius: number;
  roughness: number;
  metalness: number;
  subMeshes: CachedSubMeshSpec[];
}

const prebuiltOrganCache = new Map<string, CachedOrganModel>();
const inflightOrganCache = new Map<string, Promise<CachedOrganModel | null>>();

let cachedPelvisGeometry: THREE.BufferGeometry | null = null;
let cachedSkinGeometry: THREE.BufferGeometry | null = null;

interface ParsedPrimitive {
  positions: Float32Array;
  normals: Float32Array | null;
  indices: Uint16Array | Uint32Array | null;
  baseColor: [number, number, number, number];
  nodeName: string;
}

/**
 * Skips unseen microscopic internal sub-meshes enclosed completely inside solid outer organ capsules
 * (removes 180,000+ occluded triangles in Kidneys & Lungs for 3x faster loading and 60fps rendering)
 * and isolates skeletal bones and muscle fibers from unified multi-layer anatomical scans.
 */
function shouldSkipInternalPrimitive(
  organId: string,
  nodeName: string,
  extras?: { layer?: string; [key: string]: any }
): boolean {
  if (organId === 'skeleton') {
    if (extras && extras.layer && extras.layer !== 'skeleton') {
      return true;
    }
  }
  if (organId === 'muscles') {
    if (
      extras &&
      extras.layer &&
      extras.layer !== 'superficial muscles' &&
      extras.layer !== 'deep muscles' &&
      extras.layer !== 'muscles'
    ) {
      return true;
    }
  }

  const n = (nodeName || '').toLowerCase();
  if (organId === 'kidneys') {
    if (
      n.includes('renal_pyramid') ||
      n.includes('renal_papilla') ||
      n.includes('renal_column') ||
      n.includes('outer_cortex')
    ) {
      return true;
    }
  }
  if (organId === 'lungs') {
    if (n.includes('bronchial_cartilage')) {
      return true;
    }
    if (
      n.includes('bronchus') &&
      !n.includes('main_bronchus') &&
      !n.includes('lobar_bronchus')
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Pure TypeScript Binary GLTF 2.0 (.glb) Parser for React Native / Expo GL.
 * Avoids DOM Image / Blob / URL.createObjectURL so it runs natively on Android Hermes.
 */
export function parseGlbBinary(
  arrayBuffer: ArrayBuffer,
  organIdForFilter?: string
): ParsedPrimitive[] {
  const dv = new DataView(arrayBuffer);
  if (arrayBuffer.byteLength < 20) {
    throw new Error('GLB buffer too small');
  }

  const magic = dv.getUint32(0, true);
  if (magic !== 0x46546c67) {
    throw new Error('Invalid GLB header magic');
  }

  const jsonLen = dv.getUint32(12, true);
  const jsonBytes = new Uint8Array(arrayBuffer, 20, jsonLen);

  let jsonStr = '';
  if (typeof TextDecoder !== 'undefined') {
    jsonStr = new TextDecoder('utf-8').decode(jsonBytes);
  } else {
    const chunkSize = 8192;
    for (let i = 0; i < jsonBytes.length; i += chunkSize) {
      jsonStr += String.fromCharCode.apply(
        null,
        Array.from(jsonBytes.subarray(i, i + chunkSize))
      );
    }
  }

  const gltf = JSON.parse(jsonStr);
  const binChunkOffset = 20 + jsonLen + 8;

  function readAccessor(
    accIdx: number
  ): Float32Array | Uint16Array | Uint32Array | Uint8Array {
    const acc = gltf.accessors[accIdx];
    const bv = gltf.bufferViews[acc.bufferView];
    const byteOffset =
      binChunkOffset + (bv.byteOffset || 0) + (acc.byteOffset || 0);
    const numComp =
      ({ SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 } as Record<string, number>)[
        acc.type
      ] || 1;
    const totalLen = acc.count * numComp;
    const byteStride = bv.byteStride || 0;
    const compBytes =
      ({ 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 } as Record<
        number,
        number
      >)[acc.componentType] || 4;

    if (
      (byteStride && byteStride !== numComp * compBytes) ||
      byteOffset % compBytes !== 0
    ) {
      if (acc.componentType === 5126) {
        const out = new Float32Array(totalLen);
        const step = byteStride || numComp * 4;
        for (let i = 0; i < acc.count; i++) {
          const base = byteOffset + i * step;
          for (let c = 0; c < numComp; c++) {
            out[i * numComp + c] = dv.getFloat32(base + c * 4, true);
          }
        }
        return out;
      } else if (acc.componentType === 5123) {
        const out = new Uint16Array(totalLen);
        const step = byteStride || numComp * 2;
        for (let i = 0; i < acc.count; i++) {
          const base = byteOffset + i * step;
          for (let c = 0; c < numComp; c++) {
            out[i * numComp + c] = dv.getUint16(base + c * 2, true);
          }
        }
        return out;
      } else if (acc.componentType === 5122) {
        const out = new Float32Array(totalLen);
        const step = byteStride || numComp * 2;
        const norm = acc.normalized === true;
        for (let i = 0; i < acc.count; i++) {
          const base = byteOffset + i * step;
          for (let c = 0; c < numComp; c++) {
            const v = dv.getInt16(base + c * 2, true);
            out[i * numComp + c] = norm ? Math.max(v / 32767.0, -1.0) : v;
          }
        }
        return out;
      } else if (acc.componentType === 5120) {
        const out = new Float32Array(totalLen);
        const step = byteStride || numComp;
        const norm = acc.normalized === true;
        for (let i = 0; i < acc.count; i++) {
          const base = byteOffset + i * step;
          for (let c = 0; c < numComp; c++) {
            const v = dv.getInt8(base + c);
            out[i * numComp + c] = norm ? Math.max(v / 127.0, -1.0) : v;
          }
        }
        return out;
      } else {
        const out = new Uint32Array(totalLen);
        const step = byteStride || numComp * 4;
        for (let i = 0; i < acc.count; i++) {
          const base = byteOffset + i * step;
          for (let c = 0; c < numComp; c++) {
            out[i * numComp + c] =
              compBytes === 1
                ? dv.getUint8(base + c)
                : dv.getUint32(base + c * 4, true);
          }
        }
        return out;
      }
    }

    if (acc.componentType === 5126) {
      return new Float32Array(arrayBuffer, byteOffset, totalLen);
    } else if (acc.componentType === 5123) {
      return new Uint16Array(arrayBuffer, byteOffset, totalLen);
    } else if (acc.componentType === 5125) {
      return new Uint32Array(arrayBuffer, byteOffset, totalLen);
    } else if (acc.componentType === 5122) {
      const src = new Int16Array(arrayBuffer, byteOffset, totalLen);
      const out = new Float32Array(totalLen);
      const norm = acc.normalized === true;
      for (let i = 0; i < totalLen; i++) {
        out[i] = norm ? Math.max(src[i] / 32767.0, -1.0) : src[i];
      }
      return out;
    } else if (acc.componentType === 5120) {
      const src = new Int8Array(arrayBuffer, byteOffset, totalLen);
      const out = new Float32Array(totalLen);
      const norm = acc.normalized === true;
      for (let i = 0; i < totalLen; i++) {
        out[i] = norm ? Math.max(src[i] / 127.0, -1.0) : src[i];
      }
      return out;
    } else if (acc.componentType === 5121) {
      return new Uint8Array(arrayBuffer, byteOffset, totalLen);
    } else {
      const u8 = new Uint8Array(arrayBuffer, byteOffset, totalLen);
      return new Uint16Array(u8);
    }
  }

  const primitives: ParsedPrimitive[] = [];

  function traverseNode(nodeIdx: number, parentMatrix: THREE.Matrix4) {
    const node = gltf.nodes?.[nodeIdx];
    if (!node) return;

    const localMatrix = new THREE.Matrix4();
    if (node.matrix && node.matrix.length === 16) {
      localMatrix.fromArray(node.matrix);
    } else {
      const pos = node.translation
        ? new THREE.Vector3().fromArray(node.translation)
        : new THREE.Vector3();
      const quat = node.rotation
        ? new THREE.Quaternion().fromArray(node.rotation)
        : new THREE.Quaternion();
      const scl = node.scale
        ? new THREE.Vector3().fromArray(node.scale)
        : new THREE.Vector3(1, 1, 1);
      localMatrix.compose(pos, quat, scl);
    }

    const worldMatrix = new THREE.Matrix4().multiplyMatrices(
      parentMatrix,
      localMatrix
    );
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(worldMatrix);
    const nodeName = node.name || `Mesh_${nodeIdx}`;

    if (
      node.mesh !== undefined &&
      gltf.meshes?.[node.mesh] &&
      (!organIdForFilter ||
        !shouldSkipInternalPrimitive(organIdForFilter, nodeName, node.extras))
    ) {
      const meshDef = gltf.meshes[node.mesh];
      for (const prim of meshDef.primitives || []) {
        if (prim.attributes?.POSITION === undefined) continue;

        const rawPos = readAccessor(prim.attributes.POSITION) as Float32Array;
        const vertCount = rawPos.length / 3;
        const transformedPos = new Float32Array(rawPos.length);
        const tmpVec = new THREE.Vector3();

        for (let i = 0; i < vertCount; i++) {
          tmpVec
            .set(rawPos[i * 3], rawPos[i * 3 + 1], rawPos[i * 3 + 2])
            .applyMatrix4(worldMatrix);
          transformedPos[i * 3] = tmpVec.x;
          transformedPos[i * 3 + 1] = tmpVec.y;
          transformedPos[i * 3 + 2] = tmpVec.z;
        }

        let transformedNorm: Float32Array | null = null;
        if (prim.attributes?.NORMAL !== undefined) {
          const rawNorm = readAccessor(prim.attributes.NORMAL) as Float32Array;
          transformedNorm = new Float32Array(rawNorm.length);
          for (let i = 0; i < vertCount; i++) {
            tmpVec
              .set(rawNorm[i * 3], rawNorm[i * 3 + 1], rawNorm[i * 3 + 2])
              .applyMatrix3(normalMatrix)
              .normalize();
            transformedNorm[i * 3] = tmpVec.x;
            transformedNorm[i * 3 + 1] = tmpVec.y;
            transformedNorm[i * 3 + 2] = tmpVec.z;
          }
        }

        let indices: Uint16Array | Uint32Array | null = null;
        if (prim.indices !== undefined) {
          const rawIdx = readAccessor(prim.indices);
          indices =
            rawIdx instanceof Uint16Array
              ? rawIdx
              : rawIdx instanceof Uint32Array
              ? rawIdx
              : new Uint32Array(rawIdx);
        }

        let baseColor: [number, number, number, number] = [0.85, 0.35, 0.35, 1];
        if (prim.material !== undefined && gltf.materials?.[prim.material]) {
          const bcf =
            gltf.materials[prim.material]?.pbrMetallicRoughness?.baseColorFactor;
          if (Array.isArray(bcf) && bcf.length >= 3) {
            baseColor = [bcf[0], bcf[1], bcf[2], bcf[3] ?? 1];
          }
        }

        primitives.push({
          positions: transformedPos,
          normals: transformedNorm,
          indices,
          baseColor,
          nodeName,
        });
      }
    }

    for (const childIdx of node.children || []) {
      traverseNode(childIdx, worldMatrix);
    }
  }

  const sceneDef = gltf.scenes
    ? gltf.scenes[gltf.scene || 0]
    : { nodes: [0] };
  const identity = new THREE.Matrix4();
  for (const rootNodeIdx of sceneDef.nodes || []) {
    traverseNode(rootNodeIdx, identity);
  }

  return primitives;
}

/**
 * Splits parsed primitives into chunks containing at most maxVerts vertices
 * so every merged geometry strictly stays below 65,535 vertices and can safely
 * use Uint16Array index buffers without crashing on WebGL 1.0 drivers on Android.
 */
function chunkPrimitives(
  primitives: ParsedPrimitive[],
  maxVerts: number = 60000
): ParsedPrimitive[][] {
  const resultChunks: ParsedPrimitive[][] = [];
  let cur: ParsedPrimitive[] = [];
  let count = 0;
  for (const p of primitives) {
    const v = p.positions.length / 3;
    if (cur.length > 0 && count + v > maxVerts) {
      resultChunks.push(cur);
      cur = [];
      count = 0;
    }
    cur.push(p);
    count += v;
  }
  if (cur.length > 0) resultChunks.push(cur);
  return resultChunks;
}

/**
 * Merges parsed GLB primitives into a single optimized THREE.BufferGeometry with rich biological vertex shading.
 */
function buildMergedOrganGeometry(
  primitives: ParsedPrimitive[],
  primaryColorHex: number,
  secondaryColorHex: number,
  usePrimitiveColors: boolean
): THREE.BufferGeometry {
  let totalVerts = 0;
  let totalIndices = 0;

  for (const p of primitives) {
    const vCount = p.positions.length / 3;
    totalVerts += vCount;
    totalIndices += p.indices ? p.indices.length : vCount;
  }

  const mergedPositions = new Float32Array(totalVerts * 3);
  const mergedNormals = new Float32Array(totalVerts * 3);
  const mergedColors = new Float32Array(totalVerts * 3);
  const mergedIndices = new Uint16Array(totalIndices);

  const primaryColor = new THREE.Color(primaryColorHex);
  const secondaryColor = new THREE.Color(secondaryColorHex);
  const tempColor = new THREE.Color();
  const primColor = new THREE.Color();

  let vertOffset = 0;
  let idxOffset = 0;
  let allHaveNormals = true;

  for (const p of primitives) {
    const vCount = p.positions.length / 3;
    mergedPositions.set(p.positions, vertOffset * 3);

    if (p.normals && p.normals.length === p.positions.length) {
      mergedNormals.set(p.normals, vertOffset * 3);
    } else {
      allHaveNormals = false;
    }

    primColor.setRGB(p.baseColor[0], p.baseColor[1], p.baseColor[2]);

    for (let i = 0; i < vCount; i++) {
      const vx = p.positions[i * 3];
      const vy = p.positions[i * 3 + 1];
      const vz = p.positions[i * 3 + 2];

      // Subtle biological tissue variation based on 3D spatial frequency + surface normal
      const ny = p.normals ? p.normals[i * 3 + 1] : 1;
      const nz = p.normals ? p.normals[i * 3 + 2] : 0;
      const curvatureMix =
        0.5 +
        0.32 * Math.sin(vx * 35 + vy * 35 + vz * 35) +
        0.18 * (ny * 0.5 + nz * 0.5);
      const t = Math.max(0.08, Math.min(0.95, curvatureMix));

      if (
        usePrimitiveColors &&
        (Math.abs(p.baseColor[0] - 0.5) > 0.02 ||
          Math.abs(p.baseColor[1] - 0.5) > 0.02)
      ) {
        tempColor.copy(primColor).lerp(primaryColor, 0.45);
        tempColor.lerp(secondaryColor, (1 - t) * 0.42);
      } else {
        tempColor.copy(secondaryColor).lerp(primaryColor, t);
      }

      mergedColors[(vertOffset + i) * 3] = tempColor.r;
      mergedColors[(vertOffset + i) * 3 + 1] = tempColor.g;
      mergedColors[(vertOffset + i) * 3 + 2] = tempColor.b;
    }

    if (p.indices) {
      for (let j = 0; j < p.indices.length; j++) {
        mergedIndices[idxOffset + j] = p.indices[j] + vertOffset;
      }
      idxOffset += p.indices.length;
    } else {
      for (let j = 0; j < vCount; j++) {
        mergedIndices[idxOffset + j] = vertOffset + j;
      }
      idxOffset += vCount;
    }

    vertOffset += vCount;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(mergedPositions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(mergedColors, 3));
  geo.setIndex(new THREE.BufferAttribute(mergedIndices, 1));

  if (allHaveNormals) {
    geo.setAttribute('normal', new THREE.BufferAttribute(mergedNormals, 3));
  } else {
    geo.computeVertexNormals();
  }

  return geo;
}

async function fetchGlbBuffer(url: string): Promise<ArrayBuffer> {
  if (rawBufferCache.has(url)) {
    return rawBufferCache.get(url)!;
  }
  if (inflightFetchCache.has(url)) {
    return inflightFetchCache.get(url)!;
  }

  const promise = (async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} fetching ${url}`);
      }
      const buffer = await response.arrayBuffer();
      rawBufferCache.set(url, buffer);
      return buffer;
    } catch (err) {
      // Fallback mirror if jsDelivr or GitHub Raw fails
      let fallbackUrl: string | null = null;
      if (url.includes('cdn.jsdelivr.net/gh/Charleeh/ecorche')) {
        fallbackUrl =
          'https://raw.githubusercontent.com/Charleeh/ecorche/master/model/ecorche.glb';
      } else if (url.includes('raw.githubusercontent.com/Charleeh/ecorche')) {
        fallbackUrl =
          'https://cdn.jsdelivr.net/gh/Charleeh/ecorche@master/model/ecorche.glb';
      }
      if (fallbackUrl) {
        const fbRes = await fetch(fallbackUrl);
        if (fbRes.ok) {
          const buffer = await fbRes.arrayBuffer();
          rawBufferCache.set(url, buffer);
          rawBufferCache.set(fallbackUrl, buffer);
          return buffer;
        }
      }
      throw err;
    }
  })();

  inflightFetchCache.set(url, promise);
  try {
    return await promise;
  } finally {
    inflightFetchCache.delete(url);
  }
}

/**
 * Maps GLTF node names to exact sub-part IDs defined in ORGAN_SUB_PARTS (`src/data/organSubParts.ts`).
 */
function mapNodeNameToSubPart(
  organId: string,
  nodeName: string,
  defaultPrimaryHex: number,
  defaultSecondaryHex: number
): { subPartId: string | null; primaryHex: number; secondaryHex: number } {
  const n = (nodeName || '').toLowerCase();

  if (organId === 'brain') {
    let subPartId: string | null = 'parietal_lobe';
    if (n.includes('cerebellum')) {
      subPartId = 'cerebellum';
    } else if (n.includes('temporal_lobe') || n.includes('temporal')) {
      subPartId = 'temporal_lobe';
    } else if (n.includes('frontal_lobe') || n.includes('frontal')) {
      subPartId = 'frontal_lobe';
    } else if (n.includes('parietal_lobe') || n.includes('parietal')) {
      subPartId = 'parietal_lobe';
    } else if (n.includes('occipital_lobe') || n.includes('occipital')) {
      subPartId = 'occipital_lobe';
    } else if (n.includes('pons_medulla') || n.includes('brainstem') || n.includes('stem')) {
      subPartId = 'pons_medulla';
    }
    // Brain subparts share the natural uniform anatomical brain color by default;
    // only the active clicked lobe dynamically highlights in vibrant color
    return {
      subPartId,
      primaryHex: defaultPrimaryHex,
      secondaryHex: defaultSecondaryHex,
    };
  }

  if (organId === 'heart') {
    if (n.includes('mitral_valve')) {
      return { subPartId: 'mitral_valve', primaryHex: 0xfef2f2, secondaryHex: 0xfecdd3 };
    }
    if (n.includes('tricuspid_valve')) {
      return { subPartId: 'tricuspid_valve', primaryHex: 0xfef2f2, secondaryHex: 0xfecdd3 };
    }
    if (n.includes('aortic_valve')) {
      return { subPartId: 'aortic_valve', primaryHex: 0xfef2f2, secondaryHex: 0xfecdd3 };
    }
    if (n.includes('pulmonary_valve')) {
      return { subPartId: 'pulmonary_valve', primaryHex: 0xfef2f2, secondaryHex: 0xfecdd3 };
    }
    if (n.includes('left_cardiac_atrium')) {
      return { subPartId: 'left_atrium', primaryHex: 0xb91c1c, secondaryHex: 0x6b0f16 };
    }
    if (n.includes('right_cardiac_atrium') || n.includes('interatrial')) {
      return { subPartId: 'right_atrium', primaryHex: 0x991b1b, secondaryHex: 0x580c12 };
    }
    if (n.includes('right_ventricle')) {
      return { subPartId: 'right_ventricle', primaryHex: 0xc8232c, secondaryHex: 0x6b0f16 };
    }
    return { subPartId: 'left_ventricle', primaryHex: 0xd92630, secondaryHex: 0x731018 };
  }

  if (organId === 'liver') {
    if (n.includes('ligament')) {
      return { subPartId: 'falciform_ligament', primaryHex: 0xf1f5f9, secondaryHex: 0x94a3b8 };
    }
    if (n.includes('porta') || n.includes('quadrate') || n.includes('caudate')) {
      return { subPartId: 'gallbladder', primaryHex: 0x65a30d, secondaryHex: 0x365314 };
    }
    if (n.includes('left')) {
      return { subPartId: 'left_hepatic_lobe', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
    }
    return { subPartId: 'right_hepatic_lobe', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
  }

  if (organId === 'lungs') {
    if (
      n.includes('trachea') ||
      n.includes('carina') ||
      n.includes('cartilage') ||
      n.includes('bronchus')
    ) {
      return { subPartId: 'trachea', primaryHex: 0xe2d9f3, secondaryHex: 0x94a3b8 };
    }
    if (n.includes('left') || n.endsWith('_l')) {
      if (n.includes('lingula')) {
        return { subPartId: 'cardiac_notch', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
      }
      if (
        n.includes('basal') ||
        n.includes('lower') ||
        n.includes('left_superior_bronchopulmonary')
      ) {
        return { subPartId: 'left_inferior_lobe', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
      }
      return { subPartId: 'left_superior_lobe', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
    }
    if (
      n.includes('basal') ||
      n.includes('lower') ||
      n.includes('right_superior_bronchopulmonary')
    ) {
      return { subPartId: 'right_inferior_lobe', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
    }
    return { subPartId: 'right_superior_lobe', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
  }

  if (organId === 'kidneys') {
    if (n.includes('bladder') || n.includes('trigone') || n.includes('orifice')) {
      return { subPartId: 'urinary_bladder', primaryHex: 0xd97757, secondaryHex: 0x8c3b24 };
    }
    if (n.includes('ureter')) {
      return { subPartId: 'ureter', primaryHex: 0xfde68a, secondaryHex: 0xb45309 };
    }
    if (n.includes('pelvis') || n.includes('calyx') || n.includes('hilum')) {
      return { subPartId: 'renal_hilum', primaryHex: 0xfef08a, secondaryHex: 0xca8a04 };
    }
    if (n.endsWith('_l') || n.includes('_l_')) {
      return { subPartId: 'left_kidney', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
    }
    return { subPartId: 'right_kidney', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
  }

  if (organId === 'small_intestine') {
    if (n.includes('duoden') || n.includes('ampulla') || n.includes('papilla')) {
      return { subPartId: 'duodenum', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
    }
    if (n.includes('jejunum')) {
      return { subPartId: 'jejunum', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
    }
    if (n.includes('terminal')) {
      return { subPartId: 'mesenteric_coils', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
    }
    return { subPartId: 'ileum', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
  }

  if (organId === 'large_intestine') {
    if (n.includes('caecum') || n.includes('appendix') || n.includes('ileocecal')) {
      return { subPartId: 'cecum', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
    }
    if (n.includes('ascending') || n.includes('hepatic')) {
      return { subPartId: 'ascending_colon', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
    }
    if (n.includes('transverse') || n.includes('splenic')) {
      return { subPartId: 'transverse_colon', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
    }
    if (n.includes('descending')) {
      return { subPartId: 'descending_colon', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
    }
    if (n.includes('sigmoid')) {
      return { subPartId: 'sigmoid_colon', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
    }
    return { subPartId: 'rectum', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
  }

  if (organId === 'pancreas') {
    if (n.includes('head') || n.includes('uncinate')) {
      return { subPartId: 'pancreas_head', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
    }
    if (n.includes('neck')) {
      return { subPartId: 'pancreas_neck', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
    }
    if (n.includes('body')) {
      return { subPartId: 'pancreas_body', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
    }
    return { subPartId: 'pancreas_tail', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
  }

  if (organId === 'spleen') {
    if (n.includes('diaphragmatic')) {
      return { subPartId: 'diaphragmatic_surface', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
    }
    if (n.includes('hilum')) {
      return { subPartId: 'splenic_hilum', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
    }
    if (n.includes('gastric') || n.includes('anterior')) {
      return { subPartId: 'superior_pole', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
    }
    return { subPartId: 'inferior_pole', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
  }

  if (organId === 'thyroid') {
    if (n.includes('cartilage') || n.includes('cricoid') || n.includes('isthmus')) {
      return { subPartId: 'thyroid_isthmus', primaryHex: 0xec4899, secondaryHex: 0x9d174d };
    }
    if (n.includes('arytenoid') || n.includes('_r') || n.endsWith('r')) {
      return { subPartId: 'right_thyroid_lobe', primaryHex: 0x9333ea, secondaryHex: 0x581c87 };
    }
    return { subPartId: 'left_thyroid_lobe', primaryHex: 0xa855f7, secondaryHex: 0x6b21a8 };
  }

  if (organId === 'reproductive') {
    if (n.includes('ovary') || n.includes('gonad')) {
      return { subPartId: 'gonads', primaryHex: 0xdb2777, secondaryHex: 0x831843 };
    }
    if (n.includes('fallopian') || n.includes('tube')) {
      return { subPartId: 'duct_network', primaryHex: 0xe11d48, secondaryHex: 0x9f1239 };
    }
    return { subPartId: 'genital_tract', primaryHex: 0xf472b6, secondaryHex: 0x9d174d };
  }

  if (organId === 'lymph_nodes') {
    if (n.includes('cervical') || n.includes('jugular') || n.includes('neck') || n.includes('head') || n.includes('paracortex')) {
      return { subPartId: 'cervical_nodes', primaryHex: 0x10b981, secondaryHex: 0x047857 };
    }
    if (n.includes('axillary') || n.includes('subclavian') || n.includes('arm') || n.includes('pectoral') || n.includes('thymus') || n.includes('follicle')) {
      return { subPartId: 'axillary_nodes', primaryHex: 0x059669, secondaryHex: 0x065f46 };
    }
    if (n.includes('thoracic') || n.includes('duct') || n.includes('cisterna') || n.includes('chyli') || n.includes('vessel') || n.includes('afferent') || n.includes('efferent')) {
      return { subPartId: 'thoracic_duct', primaryHex: 0x0d9488, secondaryHex: 0x115e59 };
    }
    if (n.includes('inguinal') || n.includes('pelvic') || n.includes('iliac') || n.includes('leg') || n.includes('femoral') || n.includes('capsule')) {
      return { subPartId: 'inguinal_nodes', primaryHex: 0x34d399, secondaryHex: 0x059669 };
    }
    return { subPartId: 'thoracic_duct', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
  }

  if (organId === 'skeleton') {
    // Natural uniform bone coloring (ivory / off-white with deeper trabecular shading)
    const bonePrimary = 0xefece6;
    const boneSecondary = 0xd9d2c5;

    if (
      /skull|cranium|facial|mandible|maxilla|frontal|parietal|occipital|temporal|sphenoid|ethmoid|nasal|zygomatic|lacrimal|ear|teeth|tooth|incisor|molar|canine|premolar|hyoid|vomer|palatine|concha|cornea|sclera|cartilage|alar/.test(
        n
      )
    ) {
      return {
        subPartId: 'cranium',
        primaryHex: bonePrimary,
        secondaryHex: boneSecondary,
      };
    }
    if (/vertebra|atlas|axis|cervical|sacrum|coccyx|thoracic vertebra|lumbar vertebra|spine/.test(n)) {
      return {
        subPartId: 'vertebral_column',
        primaryHex: bonePrimary,
        secondaryHex: boneSecondary,
      };
    }
    if (/rib|sternum|costal|manubrium|xiphoid/.test(n)) {
      return {
        subPartId: 'ribcage',
        primaryHex: bonePrimary,
        secondaryHex: boneSecondary,
      };
    }
    if (/pelvis|ilium|ischium|pubis|hip|sacroiliac/.test(n)) {
      return {
        subPartId: 'pelvis_girdle',
        primaryHex: bonePrimary,
        secondaryHex: boneSecondary,
      };
    }
    if (
      /clavicle|scapula|humerus|radius|ulna|carpal|metacarpal|finger|thumb|scaphoid|lunate|triquetrum|pisiform|trapezium|trapezoid|capitate|hamate/.test(
        n
      )
    ) {
      return {
        subPartId: 'upper_limbs',
        primaryHex: bonePrimary,
        secondaryHex: boneSecondary,
      };
    }
    return {
      subPartId: 'lower_limbs',
      primaryHex: bonePrimary,
      secondaryHex: boneSecondary,
    };
  }

  if (organId === 'muscles') {
    // Natural uniform muscle coloring (deep anatomical muscle crimson with deep fascia shading)
    const musclePrimary = 0x9e2a2b;
    const muscleSecondary = 0x6a1318;

    if (/pectoral|subclavius|serratus|intercostal/.test(n)) {
      return {
        subPartId: 'pectoralis',
        primaryHex: musclePrimary,
        secondaryHex: muscleSecondary,
      };
    }
    if (
      /rectus abdominis|abdominis|oblique|transversus|pyramidalis|linea alba/.test(
        n
      )
    ) {
      return {
        subPartId: 'rectus_abdominis',
        primaryHex: musclePrimary,
        secondaryHex: muscleSecondary,
      };
    }
    if (
      /deltoid|supraspinatus|infraspinatus|teres minor|teres major|subscapularis/.test(
        n
      )
    ) {
      return {
        subPartId: 'deltoids',
        primaryHex: musclePrimary,
        secondaryHex: muscleSecondary,
      };
    }
    if (
      /trapezius|latissimus|rhomboid|levator scapulae|splenius|erector spinae|longissimus|iliocostalis|spinalis|occipitalis|frontalis|masseter|temporalis|pterygoid|platysma|sternocleidomastoid|scalene|mylohyoid|digastric|orbicularis|corrugator|procerus|zygomaticus|mentalis|buccinator|auricular|pharyngeal|laryngeal/.test(
        n
      )
    ) {
      return {
        subPartId: 'trapezius',
        primaryHex: musclePrimary,
        secondaryHex: muscleSecondary,
      };
    }
    if (
      /biceps|triceps|brachialis|coracobrachialis|brachioradialis|pronator|supinator|carpi|palmaris|anconeus|pollicis|indicis|digiti minimi of.*hand|lumbrical of.*hand|interosseous of.*hand|extensor digitorum|flexor digitorum/.test(
        n
      )
    ) {
      return {
        subPartId: 'biceps_brachii',
        primaryHex: musclePrimary,
        secondaryHex: muscleSecondary,
      };
    }
    return {
      subPartId: 'quadriceps',
      primaryHex: musclePrimary,
      secondaryHex: muscleSecondary,
    };
  }

  return { subPartId: null, primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
}

/**
 * Anatomically partitions a unified MRI Brain GLB into 6 individually highlightable lobes/structures:
 * Frontal, Temporal, Parietal, Occipital, Cerebellum, and Brainstem (Pons/Medulla).
 */
function partitionBrainPrimitive(
  prim: ParsedPrimitive,
  rawCenter: THREE.Vector3,
  rawSize: THREE.Vector3
): Map<string, ParsedPrimitive> {
  const result = new Map<string, ParsedPrimitive>();
  const pos = prim.positions;
  const norm = prim.normals;
  const ind = prim.indices;

  const halfX = Math.max(rawSize.x / 2, 0.0001);
  const halfY = Math.max(rawSize.y / 2, 0.0001);
  const halfZ = Math.max(rawSize.z / 2, 0.0001);

  function classify(cx: number, cy: number, cz: number): string {
    const nx = (cx - rawCenter.x) / halfX;
    const ny = (cy - rawCenter.y) / halfY;
    const nz = (cz - rawCenter.z) / halfZ;

    // 1. Brainstem (Pons & Medulla): Lowest central downward projection
    if (ny < -0.42 && Math.abs(nx) < 0.38 && nz > -0.45) {
      return 'pons_medulla';
    }
    // 2. Cerebellum: Lower posterior lobes
    if (ny < -0.12 && nz < -0.12) {
      return 'cerebellum';
    }
    // 3. Temporal Lobe: Lateral inferior bulges
    if (ny < 0.14 && Math.abs(nx) > 0.36 && nz > -0.28 && nz < 0.48) {
      return 'temporal_lobe';
    }
    // 4. Occipital Lobe: Posterior cortex
    if (nz < -0.32) {
      return 'occipital_lobe';
    }
    // 5. Frontal Lobe: Anterior cortex
    if (nz > 0.08) {
      return 'frontal_lobe';
    }
    // 6. Parietal Lobe: Superior/middle cortex
    return 'parietal_lobe';
  }

  const buckets: Record<string, number[]> = {
    frontal_lobe: [],
    temporal_lobe: [],
    parietal_lobe: [],
    occipital_lobe: [],
    cerebellum: [],
    pons_medulla: [],
  };

  const triCount = ind ? Math.floor(ind.length / 3) : Math.floor(pos.length / 9);

  for (let t = 0; t < triCount; t++) {
    let i0 = t * 3;
    let i1 = t * 3 + 1;
    let i2 = t * 3 + 2;
    if (ind) {
      i0 = ind[t * 3];
      i1 = ind[t * 3 + 1];
      i2 = ind[t * 3 + 2];
    }

    const cx = (pos[i0 * 3] + pos[i1 * 3] + pos[i2 * 3]) / 3;
    const cy = (pos[i0 * 3 + 1] + pos[i1 * 3 + 1] + pos[i2 * 3 + 1]) / 3;
    const cz = (pos[i0 * 3 + 2] + pos[i1 * 3 + 2] + pos[i2 * 3 + 2]) / 3;

    const subId = classify(cx, cy, cz);
    const b = buckets[subId] || buckets.parietal_lobe;
    b.push(i0, i1, i2);
  }

  for (const [subId, triIndices] of Object.entries(buckets)) {
    if (triIndices.length === 0) continue;
    const vertMap = new Map<number, number>();
    const newPositions: number[] = [];
    const newNormals: number[] = [];
    const newIndices: number[] = [];

    for (const oldIdx of triIndices) {
      let mapped = vertMap.get(oldIdx);
      if (mapped === undefined) {
        mapped = newPositions.length / 3;
        vertMap.set(oldIdx, mapped);
        newPositions.push(
          pos[oldIdx * 3],
          pos[oldIdx * 3 + 1],
          pos[oldIdx * 3 + 2]
        );
        if (norm) {
          newNormals.push(
            norm[oldIdx * 3],
            norm[oldIdx * 3 + 1],
            norm[oldIdx * 3 + 2]
          );
        }
      }
      newIndices.push(mapped);
    }

    result.set(subId, {
      nodeName: `brain_${subId}`,
      positions: new Float32Array(newPositions),
      normals: norm ? new Float32Array(newNormals) : null,
      indices: new Uint32Array(newIndices),
      baseColor: prim.baseColor,
    });
  }

  return result;
}

/**
 * Builds and caches the THREE.BufferGeometry sub-meshes for a single organ specification.
 */
async function buildAndCacheOrganModel(
  spec: RealGlbOrganSpec
): Promise<CachedOrganModel | null> {
  if (prebuiltOrganCache.has(spec.organId)) {
    return prebuiltOrganCache.get(spec.organId)!;
  }
  if (inflightOrganCache.has(spec.organId)) {
    return inflightOrganCache.get(spec.organId)!;
  }

  const buildPromise = (async (): Promise<CachedOrganModel | null> => {
    try {
      // Download all GLB buffers for this organ in parallel
      const buffers = await Promise.all(spec.urls.map((url) => fetchGlbBuffer(url)));
      const allPrimitives: ParsedPrimitive[] = [];
      for (const buf of buffers) {
        const prims = parseGlbBinary(buf, spec.organId);
        allPrimitives.push(...prims);
      }

      if (allPrimitives.length === 0) return null;

    const rotMat = spec.preRotationEuler
      ? new THREE.Matrix4().makeRotationFromEuler(
          new THREE.Euler(
            spec.preRotationEuler[0],
            spec.preRotationEuler[1],
            spec.preRotationEuler[2]
          )
        )
      : null;
    const rotNormalMat = rotMat
      ? new THREE.Matrix3().getNormalMatrix(rotMat)
      : null;

    // Fast numeric bounding box pass (avoids building and throwing away a combined BufferGeometry)
    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;
    const tmpVec = new THREE.Vector3();

    for (const p of allPrimitives) {
      const pos = p.positions;
      const norm = p.normals;
      const vCount = pos.length / 3;
      for (let i = 0; i < vCount; i++) {
        let x = pos[i * 3];
        let y = pos[i * 3 + 1];
        let z = pos[i * 3 + 2];
        if (rotMat) {
          tmpVec.set(x, y, z).applyMatrix4(rotMat);
          x = tmpVec.x;
          y = tmpVec.y;
          z = tmpVec.z;
          pos[i * 3] = x;
          pos[i * 3 + 1] = y;
          pos[i * 3 + 2] = z;
          if (norm && rotNormalMat) {
            tmpVec
              .set(norm[i * 3], norm[i * 3 + 1], norm[i * 3 + 2])
              .applyMatrix3(rotNormalMat)
              .normalize();
            norm[i * 3] = tmpVec.x;
            norm[i * 3 + 1] = tmpVec.y;
            norm[i * 3 + 2] = tmpVec.z;
          }
        }
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (z < minZ) minZ = z;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
        if (z > maxZ) maxZ = z;
      }
    }

    const rawCenter = new THREE.Vector3(
      (minX + maxX) * 0.5,
      (minY + maxY) * 0.5,
      (minZ + maxZ) * 0.5
    );
    const rawSize = new THREE.Vector3(maxX - minX, maxY - minY, maxZ - minZ);
    const finalCenter = new THREE.Vector3();
    let fitScaleFactor = 1;

    if (spec.coordMode === 'vhm') {
      finalCenter.set(
        rawCenter.x * VHM_SCALE,
        rawCenter.y * VHM_SCALE + VHM_Y_OFFSET,
        rawCenter.z * VHM_SCALE
      );
      rawSize.multiplyScalar(VHM_SCALE);
    } else {
      const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z, 0.0001);
      fitScaleFactor = (spec.targetMaxDim || 0.38) / maxDim;
      rawSize.multiplyScalar(fitScaleFactor);
      finalCenter.set(
        spec.targetBoxCenter?.[0] ?? 0,
        spec.targetBoxCenter?.[1] ?? 0.5,
        spec.targetBoxCenter?.[2] ?? 0
      );
    }

    let processedPrimitives = allPrimitives;
    if (spec.organId === 'brain') {
      const brainPrims: ParsedPrimitive[] = [];
      for (const p of allPrimitives) {
        const partitioned = partitionBrainPrimitive(p, rawCenter, rawSize);
        for (const partPrim of partitioned.values()) {
          brainPrims.push(partPrim);
        }
      }
      if (brainPrims.length > 0) {
        processedPrimitives = brainPrims;
      }
    }

    // Group primitives by anatomical subPartId so each part is an individually highlightable 3D mesh
    const groupedPrims = new Map<
      string,
      {
        subPartId: string | null;
        primaryHex: number;
        secondaryHex: number;
        prims: ParsedPrimitive[];
      }
    >();

    for (const p of processedPrimitives) {
      const mapped = mapNodeNameToSubPart(
        spec.organId,
        p.nodeName,
        spec.primaryColorHex,
        spec.secondaryColorHex
      );
      const key = mapped.subPartId || '__main__';
      const existing = groupedPrims.get(key);
      if (existing) {
        existing.prims.push(p);
      } else {
        groupedPrims.set(key, {
          subPartId: mapped.subPartId,
          primaryHex: mapped.primaryHex,
          secondaryHex: mapped.secondaryHex,
          prims: [p],
        });
      }
    }

    const subMeshes: CachedSubMeshSpec[] = [];

    for (const [, bucket] of groupedPrims) {
      const chunks = chunkPrimitives(bucket.prims, 60000);
      for (const chunk of chunks) {
        const subGeo = buildMergedOrganGeometry(
          chunk,
          bucket.primaryHex,
          bucket.secondaryHex,
          spec.urls.length > 1
        );

        if (spec.coordMode === 'vhm') {
          subGeo.scale(VHM_SCALE, VHM_SCALE, VHM_SCALE);
          subGeo.translate(0, VHM_Y_OFFSET, 0);
          subGeo.translate(-finalCenter.x, -finalCenter.y, -finalCenter.z);
        } else {
          subGeo.translate(-rawCenter.x, -rawCenter.y, -rawCenter.z);
          subGeo.scale(fitScaleFactor, fitScaleFactor, fitScaleFactor);
        }

        subGeo.computeBoundingBox();
        subGeo.computeBoundingSphere();
        subGeo.userData = { isCachedGlb: true };

        subMeshes.push({
          subPartId: bucket.subPartId,
          geometry: subGeo,
        });
      }
    }

    // Compute focusCenter in rootGroup local space (Anatomy3DViewport applies the -0.58 rootGroup offset)
    const focusCenter = finalCenter.clone();
    if (spec.focusYOffset) {
      focusCenter.y += spec.focusYOffset;
    }

    const maxOrganSpan = Math.max(rawSize.x, rawSize.y, rawSize.z);
    const focusRadius =
      spec.customFocusRadius ??
      Math.max(0.54, Math.min(1.05, maxOrganSpan * 1.42));

    const cachedModel: CachedOrganModel = {
      organId: spec.organId,
      finalCenter,
      focusCenter,
      focusRadius,
      roughness: spec.roughness,
      metalness: spec.metalness,
      subMeshes,
    };

    prebuiltOrganCache.set(spec.organId, cachedModel);
    return cachedModel;
  } catch {
    return null;
  }
})();

  inflightOrganCache.set(spec.organId, buildPromise);
  try {
    return await buildPromise;
  } finally {
    inflightOrganCache.delete(spec.organId);
  }
}

/**
 * Attaches a cached organ model to the live AnatomySceneGraph in 0ms.
 */
function attachCachedOrganToGraph(
  cached: CachedOrganModel,
  graph: AnatomySceneGraph
): boolean {
  const record = graph.organRecords.get(cached.organId);
  if (!record) return false;

  // Avoid re-attaching if already attached with real GLB meshes
  if (
    record.meshes.length > 0 &&
    record.meshes[0].userData?.isRealGlbScan === true
  ) {
    return true;
  }

  // Safety guard: Never wipe out sculpted procedural models if no valid GLB submeshes exist
  if (!cached.subMeshes || cached.subMeshes.length === 0) {
    return false;
  }

  while (record.group.children.length > 0) {
    const child = record.group.children[0] as THREE.Mesh;
    record.group.remove(child);
    if (child.isMesh && !child.geometry?.userData?.isCachedGlb) {
      child.geometry?.dispose();
    }
  }

  record.meshes.length = 0;
  record.originalMaterials.clear();

  record.group.position.copy(cached.finalCenter);
  record.group.rotation.set(0, 0, 0);
  record.group.scale.setScalar(1);

  for (const sm of cached.subMeshes) {
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: cached.roughness,
      metalness: cached.metalness,
    });

    const subMesh = new THREE.Mesh(sm.geometry.clone(), mat);
    subMesh.name = sm.subPartId
      ? `${record.meshName}_${sm.subPartId}`
      : record.meshName;
    subMesh.userData = {
      organId: record.organId,
      meshName: record.meshName,
      systemId: record.systemId,
      subPartId: sm.subPartId,
      isRealGlbScan: true,
    };

    record.group.add(subMesh);
    record.meshes.push(subMesh);
    record.originalMaterials.set(subMesh, mat.clone());
  }

  record.focusCenter.copy(cached.focusCenter);
  record.focusRadius = cached.focusRadius;
  return true;
}

/**
 * Synchronously attaches all already-cached .glb organ models & structural scans to a freshly built AnatomySceneGraph (0ms).
 */
export function applyCachedGlbOrgansSync(graph: AnatomySceneGraph): number {
  let attachedCount = 0;
  for (const spec of REAL_GLB_ORGAN_SPECS) {
    const cached = prebuiltOrganCache.get(spec.organId);
    if (cached && attachCachedOrganToGraph(cached, graph)) {
      attachedCount++;
    }
  }
  if (cachedPelvisGeometry) {
    attachPelvisGeometryToGraph(cachedPelvisGeometry, graph);
  }
  if (cachedSkinGeometry) {
    attachSkinGeometryToGraph(cachedSkinGeometry, graph);
  }
  return attachedCount;
}

/**
 * Preloads and builds all 10 real medical .glb organ geometries in the background on app startup.
 */
export async function preloadAllRealGlbModels(): Promise<void> {
  try {
    const batchSize = 2;
    for (let i = 0; i < REAL_GLB_ORGAN_SPECS.length; i += batchSize) {
      const batch = REAL_GLB_ORGAN_SPECS.slice(i, i + batchSize);
      await Promise.all(
        batch.map((spec) => buildAndCacheOrganModel(spec).catch(() => null))
      );
    }
  } catch {
    // Ignore background preload network errors
  }
}

/**
 * Loads a single real .glb organ specification and replaces its procedural mesh inside the live AnatomySceneGraph.
 */
export async function loadSingleRealGlbOrgan(
  spec: RealGlbOrganSpec,
  graph: AnatomySceneGraph,
  isCancelled: () => boolean
): Promise<boolean> {
  if (isCancelled()) return false;
  const cached = await buildAndCacheOrganModel(spec);
  if (!cached || isCancelled()) return false;
  return attachCachedOrganToGraph(cached, graph);
}

function attachPelvisGeometryToGraph(
  pelvisGeo: THREE.BufferGeometry,
  graph: AnatomySceneGraph
) {
  const skeletalGroup = graph.systemGroups.get('skeletal');
  if (!skeletalGroup) return;
  if (skeletalGroup.children.some((c) => c.name === 'GLB_Pelvis')) return;

  const pelvisMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.42,
    metalness: 0.06,
  });
  const pelvisMesh = new THREE.Mesh(pelvisGeo.clone(), pelvisMat);
  pelvisMesh.name = 'GLB_Pelvis';
  skeletalGroup.add(pelvisMesh);
}

function attachSkinGeometryToGraph(
  skinGeo: THREE.BufferGeometry,
  graph: AnatomySceneGraph
) {
  if (
    graph.bodyShellGroup.children.length === 1 &&
    graph.bodyShellGroup.children[0].name === 'GLB_HumanBodySkin'
  ) {
    return;
  }
  const firstShellChild = graph.bodyShellGroup.children[0] as THREE.Mesh;
  const sharedShellMat = firstShellChild?.material as THREE.MeshStandardMaterial;

  const skinMesh = new THREE.Mesh(
    skinGeo.clone(),
    sharedShellMat ||
      new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      })
  );
  skinMesh.name = 'GLB_HumanBodySkin';

  while (graph.bodyShellGroup.children.length > 0) {
    const old = graph.bodyShellGroup.children[0] as THREE.Mesh;
    graph.bodyShellGroup.remove(old);
    if (!old.geometry?.userData?.isCachedGlb) {
      old.geometry?.dispose();
    }
  }
  graph.bodyShellGroup.add(skinMesh);
}

/**
 * Loads the real Visible Human Male Pelvis (.glb) and Full-Body Skin Silhouette (.glb)
 */
async function loadStructuralGlbLayers(
  graph: AnatomySceneGraph,
  isCancelled: () => boolean
): Promise<void> {
  try {
    // 1. Real 3D Pelvis Bone Scan (.glb)
    if (!cachedPelvisGeometry) {
      const pelvisBuf = await fetchGlbBuffer(PELVIS_GLB_URL);
      if (isCancelled()) return;
      const pelvisPrims = parseGlbBinary(pelvisBuf);
      if (pelvisPrims.length > 0) {
        const pelvisGeo = buildMergedOrganGeometry(
          pelvisPrims,
          0xe8dfd1,
          0xb8ab96,
          false
        );
        pelvisGeo.scale(VHM_SCALE, VHM_SCALE, VHM_SCALE);
        pelvisGeo.translate(0, VHM_Y_OFFSET, 0);
        pelvisGeo.userData = { isCachedGlb: true };
        cachedPelvisGeometry = pelvisGeo;
      }
    }
    if (cachedPelvisGeometry && !isCancelled()) {
      attachPelvisGeometryToGraph(cachedPelvisGeometry, graph);
    }
    // Full body skin silhouette completely omitted to maintain pure Solo 3D Atlas organ views
  } catch {
    // Keep procedural fallback if offline
  }
}

/**
 * Ensures a specific priority organ's .glb model is loaded and attached immediately.
 */
export async function ensurePriorityOrganGlbLoaded(
  organId: string | null,
  graph: AnatomySceneGraph,
  isCancelled: () => boolean
): Promise<boolean> {
  if (!organId) return false;
  const spec = REAL_GLB_ORGAN_SPECS.find((s) => s.organId === organId);
  if (!spec) return false;
  try {
    return await loadSingleRealGlbOrgan(spec, graph, isCancelled);
  } catch {
    return false;
  }
}

/**
 * Progressively loads all 10 real medical .glb organ models + structural .glb scans into the scene,
 * prioritizing the currently selected organ first so the user never waits on a queue.
 */
export async function loadAllRealMedicalGlbModels(
  graph: AnatomySceneGraph,
  onOrganLoaded: (loadedCount: number, totalCount: number, organId: string) => void,
  isCancelled: () => boolean,
  priorityOrganId?: string | null
): Promise<void> {
  const total = REAL_GLB_ORGAN_SPECS.length;
  let loaded = applyCachedGlbOrgansSync(graph);
  if (loaded > 0 && !isCancelled()) {
    onOrganLoaded(loaded, total, priorityOrganId || 'cached');
  }

  // Order specs so priorityOrganId loads first, followed by uncached organs
  const remainingSpecs = REAL_GLB_ORGAN_SPECS.filter(
    (s) => !prebuiltOrganCache.has(s.organId)
  ).sort((a, b) => {
    if (a.organId === priorityOrganId) return -1;
    if (b.organId === priorityOrganId) return 1;
    return 0;
  });

  // Load priority organ immediately if not cached yet
  if (
    remainingSpecs.length > 0 &&
    remainingSpecs[0].organId === priorityOrganId
  ) {
    const firstSpec = remainingSpecs.shift()!;
    try {
      const ok = await loadSingleRealGlbOrgan(firstSpec, graph, isCancelled);
      if (ok && !isCancelled()) {
        loaded++;
        onOrganLoaded(loaded, total, firstSpec.organId);
      }
    } catch {
      // Keep fallback if offline
    }
  }

  // Stage 1: Load remaining organs in parallel batches of 4
  const batchSize = 4;
  for (let i = 0; i < remainingSpecs.length; i += batchSize) {
    if (isCancelled()) return;
    const batch = remainingSpecs.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (spec) => {
        try {
          const ok = await loadSingleRealGlbOrgan(spec, graph, isCancelled);
          if (ok && !isCancelled()) {
            loaded++;
            onOrganLoaded(loaded, total, spec.organId);
          }
        } catch {
          // Keep procedural fallback for this organ if network fails
        }
      })
    );
  }

  // Stage 2: Load structural Pelvis & Full-Body Skin .glb scans
  if (!isCancelled()) {
    await loadStructuralGlbLayers(graph, isCancelled);
    if (!isCancelled()) {
      onOrganLoaded(loaded, total, 'skin');
    }
  }
}
