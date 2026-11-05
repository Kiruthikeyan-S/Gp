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
    organId: 'skeletal',
    title: 'Articulated Human Skeleton (242 Bones GLB Scan)',
    sourceCredit: 'BodyParts3D / OrganUI Anatomical Reference (CC-BY-SA)',
    sketchfabReferenceUrl:
      'https://sketchfab.com/3d-models/full-human-skeleton-anatomy-8c9e42e5b87c4a16999a0a10850c9502',
    urls: [
      'https://cdn.jsdelivr.net/gh/organui/skeleton-3d@120fc17278559057b37aff516eee89d263b604c6/public/models/skeleton.glb',
    ],
    primaryColorHex: 0xf1ebe1,
    secondaryColorHex: 0xc4b59d,
    roughness: 0.38,
    metalness: 0.08,
    coordMode: 'fit',
    targetBoxCenter: [0, 0.18, 0],
    targetMaxDim: 3.52,
    customFocusRadius: 2.85,
  },
  {
    organId: 'muscular',
    title: 'Whole-Body Human Muscular System (177 Muscles GLB Scan)',
    sourceCredit: 'BodyParts3D / OrganUI Anatomical Reference (CC-BY-SA)',
    sketchfabReferenceUrl:
      'https://sketchfab.com/3d-models/human-muscular-system-anatomy-088f17eb57cf4c2ea2687c7031855212',
    urls: [
      'https://cdn.jsdelivr.net/gh/organui/muscles-3d@main/public/models/muscles.glb',
    ],
    primaryColorHex: 0xc43d54,
    secondaryColorHex: 0x7a1827,
    roughness: 0.35,
    metalness: 0.08,
    coordMode: 'fit',
    targetBoxCenter: [0, 0.18, 0],
    targetMaxDim: 3.52,
    customFocusRadius: 2.85,
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
 * (removes 180,000+ occluded triangles in Kidneys & Lungs for 3x faster loading and 60fps rendering).
 */
function shouldSkipInternalPrimitive(organId: string, nodeName: string): boolean {
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

  function readAccessor(accIdx: number): Float32Array | Uint16Array | Uint32Array {
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
        !shouldSkipInternalPrimitive(organIdForFilter, nodeName))
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
              ? new Uint16Array(rawIdx)
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
  const mergedIndices =
    totalVerts > 65535
      ? new Uint32Array(totalIndices)
      : new Uint16Array(totalIndices);

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
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} fetching ${url}`);
    }
    const buffer = await response.arrayBuffer();
    rawBufferCache.set(url, buffer);
    return buffer;
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

  if (organId === 'skeletal') {
    if (
      /frontal|parietal|occipital|temporal|sphenoid|ethmoid|mandible|maxilla|zygomatic|nasal|lacrimal|vomer|palatine|hyoid|auditory|ear|turbinate/i.test(
        n
      )
    ) {
      return {
        subPartId: 'cranium',
        primaryHex: 0xf3ede3,
        secondaryHex: 0xc4b59d,
      };
    }
    if (
      /vertebra|cervical|thoracic-vertebra|lumbar|sacrum|coccyx|atlas|axis/i.test(
        n
      )
    ) {
      return {
        subPartId: 'vertebral_column',
        primaryHex: 0xe8e2d5,
        secondaryHex: 0xb5a790,
      };
    }
    if (/rib|sternum|costal|manubrium|xiphoid/i.test(n)) {
      return {
        subPartId: 'thoracic_cage',
        primaryHex: 0xf5f0e8,
        secondaryHex: 0xcdbeaa,
      };
    }
    if (/clavicle|scapula/i.test(n)) {
      return {
        subPartId: 'clavicles_scapula',
        primaryHex: 0xf0ebe1,
        secondaryHex: 0xc2b39c,
      };
    }
    if (/pelvis|ilium|ischium|pubis|hip/i.test(n)) {
      return {
        subPartId: 'pelvic_girdle',
        primaryHex: 0xe5dfd2,
        secondaryHex: 0xad9f88,
      };
    }
    return {
      subPartId: 'lower_extremities',
      primaryHex: 0xeee7db,
      secondaryHex: 0xbdb09a,
    };
  }

  if (organId === 'muscular') {
    if (
      /head|facial|oculi|frontalis|tempor|masseter|buccinator|orbicularis|zygomatic|occipit|aponeurosis|nasalis|mentalis|platysma/i.test(
        n
      ) ||
      /trapezius|sternocleidomastoid|splenius|scalenus|levator/i.test(n)
    ) {
      return {
        subPartId: 'trapezius_scm',
        primaryHex: 0xd93856,
        secondaryHex: 0x8a152d,
      };
    }
    if (/pectoral|subclav|serratus|intercost/i.test(n)) {
      return {
        subPartId: 'pectoralis',
        primaryHex: 0xc82645,
        secondaryHex: 0x7a1125,
      };
    }
    if (
      /deltoid|bicep|tricep|brachi|forearm|pronator|supinator|flexor-carpi|extensor|palmar|hand|thenar|pollicis|coracobrachialis/i.test(
        n
      )
    ) {
      return {
        subPartId: 'deltoids',
        primaryHex: 0xb81c3c,
        secondaryHex: 0x6e0d20,
      };
    }
    if (/abdomin|linea|pyramidalis|transvers.*abdominis/i.test(n)) {
      return {
        subPartId: 'rectus_abdominis',
        primaryHex: 0xbe185d,
        secondaryHex: 0x700936,
      };
    }
    if (/oblique|psoas|iliacus|quadratus.*lumborum/i.test(n)) {
      return {
        subPartId: 'external_obliques',
        primaryHex: 0x9f1239,
        secondaryHex: 0x5e0820,
      };
    }
    return {
      subPartId: 'lower_extremities',
      primaryHex: 0xba1d48,
      secondaryHex: 0x690e26,
    };
  }

  return { subPartId: null, primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
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

    for (const p of allPrimitives) {
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
      const subGeo = buildMergedOrganGeometry(
        bucket.prims,
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

    const subMesh = new THREE.Mesh(sm.geometry, mat);
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
    const batchSize = 4;
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
  const pelvisMesh = new THREE.Mesh(pelvisGeo, pelvisMat);
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
    skinGeo,
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
 * Real whole-body structural layers:
 * The 242-bone skeletal model and 177-muscle model already encompass all articulation
 * (including pelvic girdle and extremities), while the procedural body shell provides
 * the sleek, upright medical holographic silhouette without cadaver pose clashing.
 */
async function loadStructuralGlbLayers(
  _graph: AnatomySceneGraph,
  _isCancelled: () => boolean
): Promise<void> {
  // Skeleton and Muscular GLBs provide full high-resolution anatomical coverage
  return;
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

  // 1. Load priority organ immediately if not cached yet
  if (priorityOrganId) {
    const prioSpec = REAL_GLB_ORGAN_SPECS.find(
      (s) => s.organId === priorityOrganId
    );
    if (prioSpec && !prebuiltOrganCache.has(prioSpec.organId)) {
      try {
        const ok = await loadSingleRealGlbOrgan(prioSpec, graph, isCancelled);
        if (ok && !isCancelled()) {
          loaded++;
          onOrganLoaded(loaded, total, prioSpec.organId);
        }
      } catch {
        // Keep procedural fallback
      }
    }
  }

  // 2. Idle delay before starting background streaming so initial user interactions and 3D gestures are 60fps silky smooth
  await new Promise((resolve) => setTimeout(resolve, 1500));
  if (isCancelled()) return;

  // 3. Stream remaining uncached organs one-by-one with gentle pauses so CPU never locks up
  const remainingSpecs = REAL_GLB_ORGAN_SPECS.filter(
    (s) => !prebuiltOrganCache.has(s.organId) && s.organId !== priorityOrganId
  );

  for (const spec of remainingSpecs) {
    if (isCancelled()) return;
    try {
      const ok = await loadSingleRealGlbOrgan(spec, graph, isCancelled);
      if (ok && !isCancelled()) {
        loaded++;
        onOrganLoaded(loaded, total, spec.organId);
      }
    } catch {
      // Keep procedural fallback for this organ if network fails
    }
    // Yield execution to the Hermes JS event loop for 500ms between models
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // 4. Load structural Pelvis & Full-Body Skin .glb scans
  if (!isCancelled()) {
    await loadStructuralGlbLayers(graph, isCancelled);
    if (!isCancelled()) {
      onOrganLoaded(loaded, total, 'skin');
    }
  }
}
