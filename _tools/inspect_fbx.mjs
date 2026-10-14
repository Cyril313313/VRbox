// FBX 体检脚本（一次性）：解析几何/材质/包围盒，判断是否可直接接入
import fs from 'node:fs';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

// Node 端最小 DOM 存根：FBXLoader 会走 TextureLoader→ImageLoader 加载贴图，
// 此处只让它静默失败（我们只要几何与材质名，不需要贴图）。
globalThis.document = {
  createElementNS: () => ({
    addEventListener() {}, removeEventListener() {},
    set src(_v) {}, get src() { return ''; },
    style: {}, width: 1, height: 1,
  }),
  createElement: () => ({ style: {}, getContext: () => null }),
};

const FILE = '/Users/solarmatrix/Desktop/6.0.fbx';
const buf = fs.readFileSync(FILE);
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
console.log('文件大小: %d bytes (%s MB)', buf.length, (buf.length / 1048576).toFixed(2));

const t0 = Date.now();
const loader = new FBXLoader();
const root = loader.parse(ab, '/Users/solarmatrix/Desktop/');
console.log('解析耗时: %s ms', Date.now() - t0);

let meshCount = 0, triCount = 0, vertCount = 0, lineCount = 0, otherCount = 0;
const mats = new Map();
const names = [];
const box = new THREE.Box3();

root.traverse((o) => {
  if (o.isMesh) {
    meshCount++;
    const g = o.geometry;
    const pos = g.attributes.position;
    if (!pos) return;
    vertCount += pos.count;
    triCount += g.index ? g.index.count / 3 : pos.count / 3;
    g.computeBoundingBox();
    const bb = g.boundingBox.clone().applyMatrix4(o.matrixWorld);
    box.union(bb);
    const m = Array.isArray(o.material) ? o.material : [o.material];
    m.forEach((mm) => { if (mm) mats.set(mm.name || mm.uuid, mm.name || '(未命名)'); });
    if (names.length < 40) names.push(o.name || '(无名)');
  } else if (o.isLine || o.isLineSegments) lineCount++;
  else if (o.isObject3D) otherCount++;
});

root.updateMatrixWorld(true);
console.log('--- 结构 ---');
console.log('Mesh 数: %d | 三角形: %d | 顶点: %d | Line: %d | 其他节点: %d',
  meshCount, triCount, vertCount, lineCount, otherCount);
console.log('材质数: %d', mats.size);
console.log('材质名(前15):', [...mats.values()].slice(0, 15).join(' | '));
console.log('--- 包围盒(米，按 FBX 原始单位) ---');
console.log('min:', box.min.toArray().map((v) => v.toFixed(2)).join(', '));
console.log('max:', box.max.toArray().map((v) => v.toFixed(2)).join(', '));
const s = box.getSize(new THREE.Vector3());
console.log('尺寸 W×H×D: %s × %s × %s', s.x.toFixed(2), s.y.toFixed(2), s.z.toFixed(2));
console.log('--- Mesh 名(前40) ---');
console.log(names.join(' | '));

// 按名称聚合成"栋"的线索
const groups = {};
root.traverse((o) => { if (o.isMesh) { const k = (o.name || '').split(/[_\-\s]/)[0]; groups[k] = (groups[k] || 0) + 1; } });
const top = Object.entries(groups).sort((a, b) => b[1] - a[1]).slice(0, 20);
console.log('--- 名称前缀统计(前20) ---');
console.log(top.map(([k, v]) => `${k}:${v}`).join('  '));
