// 一键模型接入流水线
// 用法: node src/pipeline/ingest.mjs <input.(fbx|obj|glb|gltf)> [output.glb]
// 步骤: 转换为 GLB → Draco 压缩 → 输出到 public/models/site.glb（浏览器 modelLoader 会自动归一化）
import { existsSync, mkdirSync, copyFileSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const bin = (t) => path.join(root, 'node_modules', '.bin', t);
const ext = (p) => path.extname(p).toLowerCase();

const input = process.argv[2];
const outDir = path.join(root, 'public', 'models');
const finalOut = process.argv[3] || path.join(outDir, 'site.glb');
if (!input) { console.error('用法: node src/pipeline/ingest.mjs <input> [output.glb]'); process.exit(1); }
if (!existsSync(input)) { console.error('输入不存在:', input); process.exit(1); }
mkdirSync(outDir, { recursive: true });

const tmp = path.join(outDir, '_tmp.glb');
const e = ext(input);

if (e === '.glb') {
  copyFileSync(input, tmp);
} else if (e === '.obj') {
  execSync(`"${bin('obj2gltf')}" -i "${input}" -o "${tmp}" -b`, { stdio: 'inherit' });
} else if (e === '.fbx') {
  execSync(`node "${path.join(here, 'fbx2glb.mjs')}" "${input}" "${tmp}"`, { stdio: 'inherit' });
} else {
  console.error('不支持的输入格式(仅 fbx/obj/glb):', e);
  process.exit(1);
}

// Draco 压缩（手机/平板流畅运行的关键）
execSync(`"${bin('gltf-pipeline')}" -i "${tmp}" -o "${finalOut}" -d`, { stdio: 'inherit' });

try { execSync(`rm -f "${tmp}"`); } catch {}
console.log(`[ingest] 完成 -> ${finalOut}  (${(statSync(finalOut).size / 1048576).toFixed(2)} MB)`);
console.log('[ingest] 刷新浏览器即可在预览中看到真实模型（modelLoader 会自动按博宏 33.8m 归一化并套真石漆材质）。');
