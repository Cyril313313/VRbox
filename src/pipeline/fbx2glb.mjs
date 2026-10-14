// FBX → GLB（自包含，依赖项目根 three）
// 用法: node src/pipeline/fbx2glb.mjs <input.fbx> <output.glb>
import { readFileSync, writeFileSync } from 'fs';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error('用法: node src/pipeline/fbx2glb.mjs <in.fbx> <out.glb>');
  process.exit(1);
}

const buffer = readFileSync(input);
const loader = new FBXLoader();
const object = loader.parse(buffer, '');

const exporter = new GLTFExporter();
exporter.parse(
  object,
  (result) => {
    const buf = Buffer.from(result);
    writeFileSync(output, buf);
    let meshes = 0, tris = 0;
    object.traverse((o) => {
      if (o.isMesh) {
        meshes++;
        const g = o.geometry;
        if (g) tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
      }
    });
    console.log(`[fbx2glb] OK -> ${output}  meshes=${meshes}  tris≈${Math.round(tris)}  bytes=${buf.length}`);
  },
  (err) => { console.error('[fbx2glb] 导出失败:', err); process.exit(1); },
  { binary: true }
);
