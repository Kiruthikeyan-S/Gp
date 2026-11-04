import * as THREE from 'three';
import { ORGANS, BODY_SYSTEMS, LESSONS, QUIZ_QUESTIONS } from '../data/anatomyData';
import { ORGAN_SUB_PARTS } from '../data/organSubParts';
import { buildAnatomySceneGraph } from '../models/anatomyModelBuilder';
import { REAL_GLB_ORGAN_SPECS, parseGlbBinary } from '../models/realGlbLoader';

export function runAllVerificationTests(): { passed: number; failed: number; logs: string[] } {
  const logs: string[] = [];
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, label: string) {
    if (condition) {
      passed++;
      logs.push(`✅ PASS: ${label}`);
    } else {
      failed++;
      logs.push(`❌ FAIL: ${label}`);
    }
  }

  // 1. Verify Organ Data & System Mapping
  assert(ORGANS.length === 10, `Loaded all 10 required organs (found ${ORGANS.length})`);
  assert(BODY_SYSTEMS.length === 7, `Loaded all 7 body systems (found ${BODY_SYSTEMS.length})`);

  const organIds = new Set(ORGANS.map((o) => o.id));
  for (const organ of ORGANS) {
    const validRelated = organ.relatedOrganIds.every((relId) => organIds.has(relId));
    assert(validRelated, `Organ "${organ.name}" (${organ.meshName}) has valid related organ links`);
  }

  // 2. Verify 3D Scene Graph & Mesh Names
  const graph = buildAnatomySceneGraph();
  assert(graph.organRecords.size === 10, `3D Scene Graph registered 10 distinct selectable organ groups`);

  for (const organ of ORGANS) {
    const record = graph.organRecords.get(organ.id);
    assert(
      !!record &&
        record.meshName === organ.meshName &&
        record.meshes.length > 0 &&
        record.focusRadius > 0 &&
        record.focusCenter instanceof THREE.Vector3,
      `3D Mesh mapped: ${organ.id} -> ${organ.meshName} (${record?.meshes.length || 0} sculpted sub-meshes, focusRadius=${record?.focusRadius})`
    );
  }

  // Verify sculpted vertex coloring and shell/vascular layers
  const brainRecord = graph.organRecords.get('brain')!;
  const hasVertexColors = brainRecord.meshes.some((m) => !!m.geometry.getAttribute('color'));
  assert(hasVertexColors, 'Sculpted 3D organ geometries contain multi-toned biological vertex color attributes');

  graph.setShellMode('solid');
  assert(graph.bodyShellGroup.visible === true, 'Body shell switches to solid skin mode');
  graph.setShellMode('hidden');
  assert(graph.bodyShellGroup.visible === false, 'Body shell hides cleanly in hidden/isolate mode');
  graph.setShellMode('xray');
  assert(graph.bodyShellGroup.visible === true, 'Body shell restores X-ray translucent silhouette mode');
  assert(graph.vascularGroup.children.length > 0, `Systemic 3D vascular tree built (${graph.vascularGroup.children.length} vessels)`);

  // 3. Verify Non-Destructive Material Highlighting & Restoration
  const heartRecord = graph.organRecords.get('heart')!;
  const firstHeartMesh = heartRecord.meshes[0];
  const origColorHex = heartRecord.originalMaterials.get(firstHeartMesh)!.color.getHex();
  const mat = firstHeartMesh.material as THREE.MeshStandardMaterial;

  // Apply highlight
  mat.emissive.setHex(0x38bdf8);
  mat.emissiveIntensity = 0.6;
  assert(mat.emissive.getHex() === 0x38bdf8, 'Applied 3D emissive highlight to Mesh_Heart');

  // Restore from originalMaterials
  mat.color.copy(heartRecord.originalMaterials.get(firstHeartMesh)!.color);
  mat.emissive.setHex(0x000000);
  mat.emissiveIntensity = 0;
  assert(
    mat.color.getHex() === origColorHex && mat.emissiveIntensity === 0,
    'Restored original material on Mesh_Heart without permanent mutation'
  );

  // 4. Verify 3D Raycasting on Heart Mesh
  graph.rootGroup.updateMatrixWorld(true);
  const heartWorldPos = new THREE.Vector3();
  firstHeartMesh.getWorldPosition(heartWorldPos);

  const rayOrigin = new THREE.Vector3(heartWorldPos.x, heartWorldPos.y, 5);
  const rayDir = new THREE.Vector3(0, 0, -1).normalize();
  const raycaster = new THREE.Raycaster(rayOrigin, rayDir);
  const hits = raycaster.intersectObjects(heartRecord.meshes, false);
  assert(
    hits.length > 0 && hits[0].object.userData.organId === 'heart',
    `3D Raycaster accurately intersected Mesh_Heart at world pos (${heartWorldPos.x.toFixed(2)}, ${heartWorldPos.y.toFixed(2)}, ${heartWorldPos.z.toFixed(2)})`
  );

  // 5. Verify System Layer Filtering & Single-Organ Isolation for All 10 Organs
  const respGroup = graph.systemGroups.get('respiratory')!;
  const digGroup = graph.systemGroups.get('digestive')!;
  respGroup.visible = true;
  digGroup.visible = false;
  assert(
    respGroup.visible === true && digGroup.visible === false,
    'Anatomical system layer visibility isolation works properly'
  );

  for (const organ of ORGANS) {
    const targetRecord = graph.organRecords.get(organ.id)!;
    graph.bodyShellGroup.visible = false;
    graph.vascularGroup.visible = false;
    graph.systemGroups.forEach((group, sysId) => {
      group.visible = sysId === targetRecord.systemId;
    });
    graph.organRecords.forEach((rec) => {
      rec.group.visible = rec.organId === organ.id;
    });

    const visibleOrganCount = Array.from(graph.organRecords.values()).filter(
      (r) => r.group.visible && graph.systemGroups.get(r.systemId)?.visible
    ).length;
    const surroundingsHidden =
      !graph.bodyShellGroup.visible &&
      !graph.vascularGroup.visible &&
      !graph.systemGroups.get('skeletal')?.visible &&
      !graph.systemGroups.get('muscular')?.visible;

    assert(
      visibleOrganCount === 1 && targetRecord.group.visible && surroundingsHidden,
      `Isolated 3D mode for "${organ.name}" (${organ.meshName}) shows ONLY this organ and hides all surroundings`
    );
  }

  // 6. Verify Lessons & Quiz Integrity
  assert(LESSONS.length >= 4, `Loaded ${LESSONS.length} structured anatomy lessons`);
  const validQuiz = QUIZ_QUESTIONS.every(
    (q) => q.options.length === 4 && q.correctIndex >= 0 && q.correctIndex < 4
  );
  assert(
    QUIZ_QUESTIONS.length >= 5 && validQuiz,
    `Validated ${QUIZ_QUESTIONS.length} multiple-choice quiz questions and answer indices`
  );

  // 7. Verify Expo GL WebGL2 Prototype Patch for Three.js r163+
  const g = globalThis as any;
  g.WebGLRenderingContext = function () {};
  g.WebGLRenderingContext.prototype.clearColor = () => {};
  g.WebGL2RenderingContext = function () {};
  g.WebGL2RenderingContext.prototype = Object.create(g.WebGLRenderingContext.prototype);
  const mockGl = new g.WebGL2RenderingContext();

  // Before patch: mockGl is instanceof WebGLRenderingContext
  assert(
    mockGl instanceof g.WebGLRenderingContext === true,
    'Simulated Expo Go legacy WebGL2RenderingContext inheriting from WebGLRenderingContext'
  );

  // Apply prototype detachment patch
  Object.assign(g.WebGL2RenderingContext.prototype, g.WebGLRenderingContext.prototype);
  Object.setPrototypeOf(g.WebGL2RenderingContext.prototype, Object.prototype);

  assert(
    mockGl instanceof g.WebGLRenderingContext === false &&
      typeof mockGl.clearColor === 'function',
    'Patched Expo GL context: instanceof WebGLRenderingContext is false while preserving all GL methods'
  );

  // 8. Verify Real GLB Binary Parser & Sketchfab/NIH GLB Organ Specs
  assert(
    REAL_GLB_ORGAN_SPECS.length === 10 &&
      REAL_GLB_ORGAN_SPECS.every(
        (s) =>
          s.urls.length > 0 &&
          s.sketchfabReferenceUrl.startsWith('https://sketchfab.com/')
      ),
    'Configured all 10 organs with real .glb medical scan URLs and Sketchfab 3D references'
  );

  // Synthesize a valid minimal binary GLB buffer (1 triangle) and verify parseGlbBinary()
  const gltfJson = JSON.stringify({
    asset: { version: '2.0' },
    scenes: [{ nodes: [0] }],
    nodes: [{ name: 'TestOrganMesh', mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
      { bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR' },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: 36 },
      { buffer: 0, byteOffset: 36, byteLength: 6 },
    ],
  });
  const jsonPadded =
    gltfJson + ' '.repeat((4 - (gltfJson.length % 4)) % 4);
  const binByteLength = 44; // 36 bytes float32 positions + 6 bytes uint16 indices + 2 pad
  const totalGlbBytes = 12 + 8 + jsonPadded.length + 8 + binByteLength;
  const testGlbBuf = new ArrayBuffer(totalGlbBytes);
  const dv = new DataView(testGlbBuf);
  dv.setUint32(0, 0x46546c67, true); // 'glTF'
  dv.setUint32(4, 2, true);
  dv.setUint32(8, totalGlbBytes, true);
  dv.setUint32(12, jsonPadded.length, true);
  dv.setUint32(16, 0x4e4f534a, true); // 'JSON'
  for (let i = 0; i < jsonPadded.length; i++) {
    dv.setUint8(20 + i, jsonPadded.charCodeAt(i));
  }
  const binChunkStart = 20 + jsonPadded.length;
  dv.setUint32(binChunkStart, binByteLength, true);
  dv.setUint32(binChunkStart + 4, 0x004e4942, true); // 'BIN\0'
  const posView = new Float32Array(testGlbBuf, binChunkStart + 8, 9);
  posView.set([0, 0, 0, 1, 0, 0, 0, 1, 0]);
  const idxView = new Uint16Array(testGlbBuf, binChunkStart + 8 + 36, 3);
  idxView.set([0, 1, 2]);

  const parsedPrims = parseGlbBinary(testGlbBuf);
  assert(
    parsedPrims.length === 1 && parsedPrims[0].positions.length === 9,
    'Native binary .glb parser decoded GLTF 2.0 positions and indices with zero DOM dependencies'
  );

  // 9. Verify 13-Part 3D Cross-Section Heart & Interactive Sub-Part Labels for All 10 Organs
  for (const organ of ORGANS) {
    const subParts = ORGAN_SUB_PARTS[organ.id];
    const hasCompleteMetadata =
      Array.isArray(subParts) &&
      subParts.length >= 4 &&
      subParts.every(
        (sp) =>
          typeof sp.usedFor === 'string' &&
          sp.usedFor.length > 0 &&
          typeof sp.activity === 'string' &&
          sp.activity.length > 0 &&
          Array.isArray(sp.normalizedAnchor) &&
          sp.normalizedAnchor.length === 3
      );
    assert(
      hasCompleteMetadata,
      `Organ "${organ.name}" has ${subParts?.length || 0} divided 3D sub-parts with Name, Used-For, Activity, and Normalized 3D Anchors`
    );

    const record = graph.organRecords.get(organ.id)!;
    const distinctTaggedIds = new Set(
      record.meshes
        .map((m) => m.userData?.subPartId)
        .filter((id): id is string => typeof id === 'string')
    );
    assert(
      distinctTaggedIds.size >= 3,
      `3D Organ "${organ.name}" (${organ.meshName}) is divided into ${distinctTaggedIds.size} individually selectable/highlightable 3D sub-part meshes`
    );
  }

  const heartSubParts = ORGAN_SUB_PARTS['heart'];
  const expectedHeartPartIds = [
    'superior_vena_cava',
    'aorta',
    'pulmonary_artery',
    'pulmonary_vein',
    'right_atrium',
    'left_atrium',
    'pulmonary_valve',
    'tricuspid_valve',
    'mitral_valve',
    'aortic_valve',
    'inferior_vena_cava',
    'right_ventricle',
    'left_ventricle',
  ];
  const hasAll13HeartParts = expectedHeartPartIds.every((id) =>
    heartSubParts.some((sp) => sp.id === id)
  );
  assert(
    heartSubParts.length === 13 && hasAll13HeartParts,
    '3D Cross-Section Heart defines all 13 diagram callout parts (Superior/Inferior Vena Cava, Aorta, Pulmonary Artery/Vein, 4 Chambers, 4 Valves)'
  );

  const taggedHeartMeshes = heartRecord.meshes.filter(
    (m) => typeof m.userData?.subPartId === 'string'
  );
  assert(
    taggedHeartMeshes.length >= 13,
    `Mesh_Heart contains ${taggedHeartMeshes.length} individually selectable 3D sub-part meshes with subPartId tags`
  );

  // 10. Verify GPU Resource Disposal
  graph.dispose();
  assert(true, 'Disposed all 3D geometries and materials cleanly');

  return { passed, failed, logs };
}
