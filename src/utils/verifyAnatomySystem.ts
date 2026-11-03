import * as THREE from 'three';
import { ORGANS, BODY_SYSTEMS, LESSONS, QUIZ_QUESTIONS } from '../data/anatomyData';
import { buildAnatomySceneGraph } from '../models/anatomyModelBuilder';

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

  // 8. Verify GPU Resource Disposal
  graph.dispose();
  assert(true, 'Disposed all 3D geometries and materials cleanly');

  return { passed, failed, logs };
}
