import * as THREE from 'three';
import { AnatomySceneGraph } from './anatomyModelBuilder';
import { partitionOrganMeshesBySubParts } from '../data/organSubParts';

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
  },
  {
    organId: 'kidneys',
    title: 'Bilateral Kidneys, Ureters & Bladder (GLB Scan)',
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
  },
  {
    organId: 'brain',
    title: '3D MRI Human Brain & Spinal Cord (GLB Scan)',
    sourceCredit: 'NIH 3D T2 FLAIR MRI & Visible Human (CC-BY)',
    sketchfabReferenceUrl:
      'https://sketchfab.com/3d-models/animated-full-human-body-anatomy-9b0b079953b840bc9a13f524b60041e4',
    urls: [
      'https://raw.githubusercontent.com/code4fukui/human_organs/main/glb/Atrophic_Brain_Cube_T2_Flair_3DFile_3DFile_300000_NIH3D.glb'.replace(
        '_3DFile_3DFile_',
        '_3DFile_'
      ),
    ],
    primaryColorHex: 0xf3b2a8,
    secondaryColorHex: 0x8a3642,
    roughness: 0.35,
    metalness: 0.06,
    coordMode: 'fit',
    targetBoxCenter: [0, 1.78, 0.0],
    targetMaxDim: 0.44,
    preRotationEuler: [-Math.PI / 2, 0, Math.PI],
  },
  {
    organId: 'lungs',
    title: 'Bilateral Lungs, Lobes & Trachea (GLB Scan)',
    sourceCredit: 'NIH 3D / Visible Human Reference (CC-BY)',
    sketchfabReferenceUrl:
      'https://sketchfab.com/3d-models/animated-full-human-body-anatomy-9b0b079953b840bc9a13f524b60041e4',
    urls: [
      'https://ccf-ontology.hubmapconsortium.org/objects/v1.4/3d-vh-m-trachea.glb',
      'https://ccf-ontology.hubmapconsortium.org/objects/v1.4/3d-vh-m-lung.glb',
    ],
    primaryColorHex: 0xe67e76,
    secondaryColorHex: 0x9e3c35,
    roughness: 0.4,
    metalness: 0.04,
    coordMode: 'vhm',
  },
];

const SKIN_GLB_URL =
  'https://ccf-ontology.hubmapconsortium.org/objects/v1.2/VH_M_Skin.glb';
const PELVIS_GLB_URL =
  'https://ccf-ontology.hubmapconsortium.org/objects/v1.2/VH_M_Pelvis.glb';

// Singleton memory cache so parsed GLB geometries are never downloaded twice
const rawBufferCache = new Map<string, ArrayBuffer>();

interface ParsedPrimitive {
  positions: Float32Array;
  normals: Float32Array | null;
  indices: Uint16Array | Uint32Array | null;
  baseColor: [number, number, number, number];
  nodeName: string;
}

/**
 * Pure TypeScript Binary GLTF 2.0 (.glb) Parser for React Native / Expo GL.
 * Avoids DOM Image / Blob / URL.createObjectURL so it runs natively on Android Hermes.
 */
export function parseGlbBinary(arrayBuffer: ArrayBuffer): ParsedPrimitive[] {
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

    if (node.mesh !== undefined && gltf.meshes?.[node.mesh]) {
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
          nodeName: node.name || `Mesh_${nodeIdx}`,
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
      const nx = p.normals ? p.normals[i * 3] : 0;
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
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }
  const buffer = await response.arrayBuffer();
  rawBufferCache.set(url, buffer);
  return buffer;
}

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
    if (n.includes('right_cardiac_atrium')) {
      return { subPartId: 'right_atrium', primaryHex: 0x991b1b, secondaryHex: 0x580c12 };
    }
    if (n.includes('right_ventricle')) {
      return { subPartId: 'right_ventricle', primaryHex: 0xc8232c, secondaryHex: 0x6b0f16 };
    }
    return { subPartId: 'left_ventricle', primaryHex: 0xd92630, secondaryHex: 0x731018 };
  }

  if (organId === 'liver') {
    if (n.includes('caudate')) {
      return { subPartId: 'caudate_lobe', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
    }
    if (n.includes('porta') || n.includes('ligament') || n.includes('quadrate')) {
      return { subPartId: 'gallbladder', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
    }
    if (n.includes('left')) {
      return { subPartId: 'left_lobe', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
    }
    return { subPartId: 'right_lobe', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
  }

  if (organId === 'lungs') {
    if (n.includes('trachea') || n.includes('carina')) {
      return { subPartId: 'trachea', primaryHex: 0xe2d9f3, secondaryHex: 0x94a3b8 };
    }
    if (n.includes('bronch') && !n.includes('segment')) {
      return { subPartId: 'bronchi', primaryHex: 0xd8b4fe, secondaryHex: 0x7e22ce };
    }
    if (n.includes('left')) {
      if (n.includes('superior') || n.includes('apical') || n.includes('anterior')) {
        return { subPartId: 'left_upper_lobe', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
      }
      return { subPartId: 'left_lower_lobe', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
    }
    if (n.includes('middle') || n.includes('lateral') || n.includes('medial')) {
      return { subPartId: 'right_middle_lobe', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
    }
    if (n.includes('superior') || n.includes('apical')) {
      return { subPartId: 'right_upper_lobe', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
    }
    return { subPartId: 'right_lower_lobe', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
  }

  if (organId === 'kidneys') {
    if (n.includes('bladder') || n.includes('trigone') || n.includes('orifice')) {
      return { subPartId: 'urinary_bladder', primaryHex: 0xd97757, secondaryHex: 0x8c3b24 };
    }
    if (n.includes('ureter_l') || n.includes('pelvis_l') || n.includes('calyx_l')) {
      return { subPartId: 'left_ureter', primaryHex: 0xfde68a, secondaryHex: 0xb45309 };
    }
    if (n.includes('ureter_r') || n.includes('pelvis_r') || n.includes('calyx_r')) {
      return { subPartId: 'right_ureter', primaryHex: 0xfde68a, secondaryHex: 0xb45309 };
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
      return { subPartId: 'ileocecal_junction', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
    }
    return { subPartId: 'ileum', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
  }

  if (organId === 'large_intestine') {
    if (n.includes('caecum') || n.includes('appendix') || n.includes('ileocecal')) {
      return { subPartId: 'cecum_appendix', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
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
      return { subPartId: 'pancreatic_head', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
    }
    if (n.includes('neck')) {
      return { subPartId: 'pancreatic_neck', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
    }
    if (n.includes('body')) {
      return { subPartId: 'pancreatic_body', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
    }
    return { subPartId: 'pancreatic_tail', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
  }

  if (organId === 'spleen') {
    if (n.includes('diaphragmatic')) {
      return { subPartId: 'diaphragmatic_surface', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
    }
    if (n.includes('hilum')) {
      return { subPartId: 'splenic_hilum', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
    }
    if (n.includes('gastric')) {
      return { subPartId: 'anterior_extremity', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
    }
    return { subPartId: 'posterior_extremity', primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
  }

  return { subPartId: null, primaryHex: defaultPrimaryHex, secondaryHex: defaultSecondaryHex };
}

/**
 * Loads a single real .glb organ specification and replaces its procedural mesh inside the live AnatomySceneGraph,
 * preserving sub-part selectability and great vessels.
 */
export async function loadSingleRealGlbOrgan(
  spec: RealGlbOrganSpec,
  graph: AnatomySceneGraph,
  isCancelled: () => boolean
): Promise<boolean> {
  const record = graph.organRecords.get(spec.organId);
  if (!record) return false;

  const allPrimitives: ParsedPrimitive[] = [];
  for (const url of spec.urls) {
    if (isCancelled()) return false;
    const buf = await fetchGlbBuffer(url);
    if (isCancelled()) return false;
    const prims = parseGlbBinary(buf);
    allPrimitives.push(...prims);
  }

  if (allPrimitives.length === 0 || isCancelled()) return false;

  // Compute unified bounding box across all primitives first so sub-part meshes share the exact coordinate frame
  const combinedGeo = buildMergedOrganGeometry(
    allPrimitives,
    spec.primaryColorHex,
    spec.secondaryColorHex,
    spec.urls.length > 1
  );

  const rotMat = spec.preRotationEuler
    ? new THREE.Matrix4().makeRotationFromEuler(
        new THREE.Euler(
          spec.preRotationEuler[0],
          spec.preRotationEuler[1],
          spec.preRotationEuler[2]
        )
      )
    : null;

  if (rotMat) {
    combinedGeo.applyMatrix4(rotMat);
  }

  combinedGeo.computeBoundingBox();
  const bbox = combinedGeo.boundingBox!;
  const rawCenter = new THREE.Vector3();
  const rawSize = new THREE.Vector3();
  bbox.getCenter(rawCenter);
  bbox.getSize(rawSize);

  const finalCenter = new THREE.Vector3();
  let fitScaleFactor = 1;

  if (spec.coordMode === 'vhm') {
    combinedGeo.scale(VHM_SCALE, VHM_SCALE, VHM_SCALE);
    combinedGeo.translate(0, VHM_Y_OFFSET, 0);
    combinedGeo.computeBoundingBox();
    combinedGeo.boundingBox!.getCenter(finalCenter);
    combinedGeo.boundingBox!.getSize(rawSize);
  } else {
    const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z, 0.0001);
    fitScaleFactor = (spec.targetMaxDim || 0.38) / maxDim;
    combinedGeo.translate(-rawCenter.x, -rawCenter.y, -rawCenter.z);
    combinedGeo.scale(fitScaleFactor, fitScaleFactor, fitScaleFactor);
    combinedGeo.computeBoundingBox();
    combinedGeo.boundingBox!.getSize(rawSize);
    finalCenter.set(
      spec.targetBoxCenter?.[0] ?? 0,
      spec.targetBoxCenter?.[1] ?? 0.5,
      spec.targetBoxCenter?.[2] ?? 0
    );
  }
  combinedGeo.dispose();

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

  // Keep any complementary vessel meshes marked keepWithGlb (e.g., Aortic Arch, Vena Cava, Pulmonary Artery on Heart)
  const oldGroupPos = record.group.position.clone();
  const keptVesselMeshes: THREE.Mesh[] = [];
  const toRemove: THREE.Object3D[] = [];

  record.group.children.forEach((child) => {
    if ((child as THREE.Mesh).isMesh && child.userData?.keepWithGlb) {
      keptVesselMeshes.push(child as THREE.Mesh);
    } else {
      toRemove.push(child);
    }
  });

  for (const child of toRemove) {
    record.group.remove(child);
    if ((child as THREE.Mesh).isMesh) {
      (child as THREE.Mesh).geometry?.dispose();
    }
  }

  // Shift kept vessel meshes so they remain at their exact anatomical position relative to the new group center
  const posDelta = oldGroupPos.sub(finalCenter);
  record.meshes.length = 0;
  record.originalMaterials.clear();

  for (const vesselMesh of keptVesselMeshes) {
    vesselMesh.position.add(posDelta);
    record.meshes.push(vesselMesh);
    if (vesselMesh.material instanceof THREE.MeshStandardMaterial) {
      record.originalMaterials.set(vesselMesh, vesselMesh.material.clone());
    }
  }

  record.group.position.copy(finalCenter);
  record.group.rotation.set(0, 0, 0);
  record.group.scale.setScalar(1);

  for (const [, bucket] of groupedPrims) {
    const subGeo = buildMergedOrganGeometry(
      bucket.prims,
      bucket.primaryHex,
      bucket.secondaryHex,
      spec.urls.length > 1
    );

    if (rotMat) {
      subGeo.applyMatrix4(rotMat);
    }

    if (spec.coordMode === 'vhm') {
      subGeo.scale(VHM_SCALE, VHM_SCALE, VHM_SCALE);
      subGeo.translate(0, VHM_Y_OFFSET, 0);
      subGeo.translate(-finalCenter.x, -finalCenter.y, -finalCenter.z);
    } else {
      subGeo.translate(-rawCenter.x, -rawCenter.y, -rawCenter.z);
      subGeo.scale(fitScaleFactor, fitScaleFactor, fitScaleFactor);
    }

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: spec.roughness,
      metalness: spec.metalness,
    });

    const subMesh = new THREE.Mesh(subGeo, mat);
    subMesh.name = bucket.subPartId
      ? `${record.meshName}_${bucket.subPartId}`
      : record.meshName;
    subMesh.userData = {
      organId: record.organId,
      meshName: record.meshName,
      systemId: record.systemId,
      subPartId: bucket.subPartId,
      isRealGlbScan: true,
    };

    record.group.add(subMesh);
    record.meshes.push(subMesh);
    record.originalMaterials.set(subMesh, mat.clone());
  }

  // Partition any single-primitive GLB meshes (e.g. Brain, Stomach) into distinct anatomical sub-part meshes
  partitionOrganMeshesBySubParts(
    record.organId,
    record.meshName,
    record.systemId,
    record.group,
    record.meshes,
    record.originalMaterials
  );

  // Compute accurate focusCenter & focusRadius across the complete organ group (including vessels)
  record.group.updateMatrixWorld(true);
  const fullBox = new THREE.Box3().setFromObject(record.group);
  const fullSize = new THREE.Vector3();
  const fullCenter = new THREE.Vector3();
  fullBox.getSize(fullSize);
  fullBox.getCenter(fullCenter);

  record.focusCenter.copy(fullCenter);
  const maxOrganSpan = Math.max(fullSize.x, fullSize.y, fullSize.z);
  record.focusRadius = Math.max(0.62, Math.min(1.18, maxOrganSpan * 1.48));

  return true;
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
      const pelvisMat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.42,
        metalness: 0.06,
      });
      const pelvisMesh = new THREE.Mesh(pelvisGeo, pelvisMat);
      pelvisMesh.name = 'GLB_Pelvis';
      const skeletalGroup = graph.systemGroups.get('skeletal');
      if (skeletalGroup) {
        skeletalGroup.add(pelvisMesh);
      }
    }

    // 2. Real 3D Full Human Body Skin Scan (.glb)
    const skinBuf = await fetchGlbBuffer(SKIN_GLB_URL);
    if (isCancelled()) return;
    const skinPrims = parseGlbBinary(skinBuf);
    if (skinPrims.length > 0) {
      const skinGeo = buildMergedOrganGeometry(
        skinPrims,
        0x334155,
        0x1e293b,
        false
      );
      skinGeo.scale(VHM_SCALE, VHM_SCALE, VHM_SCALE);
      skinGeo.translate(0, VHM_Y_OFFSET, 0);

      // Reuse the shell material from bodyShellGroup so X-Ray / Solid / Hidden toggle controls the real GLB body scan!
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
        old.geometry?.dispose();
      }
      graph.bodyShellGroup.add(skinMesh);
    }
  } catch {
    // Keep procedural fallback if offline
  }
}

/**
 * Progressively loads all 10 real medical .glb organ models + structural .glb scans into the scene.
 */
export async function loadAllRealMedicalGlbModels(
  graph: AnatomySceneGraph,
  onOrganLoaded: (loadedCount: number, totalCount: number, organId: string) => void,
  isCancelled: () => boolean
): Promise<void> {
  const total = REAL_GLB_ORGAN_SPECS.length;
  let loaded = 0;

  // Stage 1: Load fast visceral organs in parallel batches of 3 for smooth mobile bandwidth & UI responsiveness
  const batchSize = 3;
  for (let i = 0; i < REAL_GLB_ORGAN_SPECS.length; i += batchSize) {
    if (isCancelled()) return;
    const batch = REAL_GLB_ORGAN_SPECS.slice(i, i + batchSize);
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
    onOrganLoaded(loaded, total, 'skin');
  }
}
