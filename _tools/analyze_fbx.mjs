// FBX 深度统计：按名称前缀汇总三角面/包围盒，定位 NaN 与配景垃圾
import fs from 'node:fs';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

globalThis.document = {
  createElementNS: () => ({ addEventListener() {}, removeEventListener() {}, set src(_v) {}, get src() { return ''; }, style: {}, width: 1, height: 1 }),
  createElement: () => ({ style: {}, getContext: () => null }),
};

const FILE = '/Users/solarmatrix/Desktop/6.0.fbx';
const buf = fs.readFileSync(FILE);
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const root = new FBXLoader().parse(ab, '/Users/solarmatrix/Desktop/');
root.updateMatrixWorld(true);

const rows = [];
root.traverse((o) => {
  if (!o.isMesh) return;
  const g = o.geometry;
  const pos = g.attributes.position;
  if (!pos) return;
  const tris = g.index ? g.index.count / 3 : pos.count / 3;
  g.computeBoundingBox();
  const bb = g.boundingBox.clone().applyMatrix4(o.matrixWorld);
  const valid = Number.isFinite(bb.min.x) && Number.isFinite(bb.max.x) &&
                Number.isFinite(bb.min.y) && Number.isFinite(bb.max.y);
  const mat = Array.isArray(o.material) ? o.material[0] : o.material;
  rows.push({
    name: o.name || '(无名)',
    mat: (mat && mat.name) || '(无材质)',
    tris,
    verts: pos.count,
    indexed: !!g.index,
    valid,
    bb,
    hasUV: !!g.attributes.uv,
    hasNormal: !!g.attributes.normal,
  });
});

const bad = rows.filter((r) => !r.valid);
console.log('总 Mesh: %d | NaN/无效包围盒: %d | 有效: %d', rows.length, bad.length, rows.length - bad.length);
console.log('无效项材质分布:', JSON.stringify(Object.entries(bad.reduce((m, r) => { m[r.mat] = (m[r.mat] || 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 10)));

// 按前缀聚合（取名称第一段）
const key = (n) => {
  const m = String(n).match(/^[^_\-\s]+/);
  return m ? m[0] : n;
};
const agg = {};
rows.forEach((r) => {
  const k = key(r.name);
  const a = (agg[k] ||= { n: 0, tris: 0, verts: 0, bad: 0, mats: new Set() });
  a.n++; a.tris += r.tris; a.verts += r.verts;
  if (!r.valid) a.bad++;
  a.mats.add(r.mat);
});
const list = Object.entries(agg).sort((a, b) => b[1].tris - a[1].tris);
console.log('\n=== 按名称前缀聚合（前 30，按三角面排序）===');
console.log('前缀'.padEnd(16), '个数'.padStart(6), '三角面'.padStart(9), '顶点'.padStart(9), 'NaN'.padStart(5), ' 材质');
list.slice(0, 30).forEach(([k, a]) => {
  console.log(String(k).padEnd(16), String(a.n).padStart(6), String(a.tris).padStart(9), String(a.verts).padStart(9), String(a.bad).padStart(5), ' ', [...a.mats].slice(0, 3).join(','));
});

// 有效包围盒（整体）
const box = new THREE.Box3();
rows.filter((r) => r.valid).forEach((r) => box.union(r.bb));
const s = box.getSize(new THREE.Vector3());
console.log('\n=== 有效几何整体包围盒（FBX 原始单位）===');
console.log('min:', box.min.toArray().map((v) => v.toFixed(1)).join(', '));
console.log('max:', box.max.toArray().map((v) => v.toFixed(1)).join(', '));
console.log('尺寸 X×Y×Z: %s × %s × %s', s.x.toFixed(1), s.y.toFixed(1), s.z.toFixed(1));
console.log('（若单位为厘米：除以 100 → %s × %s × %s m）', (s.x / 100).toFixed(1), (s.y / 100).toFixed(1), (s.z / 100).toFixed(1));
console.log('（若单位为毫米：除以 1000 → %s × %s × %s m）', (s.x / 1000).toFixed(1), (s.y / 1000).toFixed(1), (s.z / 1000).toFixed(1));

// 只保留建筑类（排除 car/图块/side/p/tgg）后的包围盒
const excl = /^(car|图块|side|p|tgg)/i;
const box2 = new THREE.Box3();
let tris2 = 0, n2 = 0;
rows.filter((r) => r.valid && !excl.test(r.name)).forEach((r) => { box2.union(r.bb); tris2 += r.tris; n2++; });
const s2 = box2.getSize(new THREE.Vector3());
console.log('\n=== 排除配景(car/图块/side/p/tgg)后 ===');
console.log('Mesh: %d | 三角面: %d', n2, tris2);
console.log('尺寸 X×Y×Z: %s × %s × %s', s2.x.toFixed(1), s2.y.toFixed(1), s2.z.toFixed(1));

console.log('\nUV: %d/%d 有 | 法线: %d/%d 有 | 索引化: %d/%d',
  rows.filter((r) => r.hasUV).length, rows.length,
  rows.filter((r) => r.hasNormal).length, rows.length,
  rows.filter((r) => r.indexed).length, rows.length);
