// 定位：最高体块、博宏大厦是否存在、NaN 成因、材质清单
import fs from 'node:fs';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

globalThis.document = {
  createElementNS: () => ({ addEventListener() {}, removeEventListener() {}, set src(_v) {}, get src() { return ''; }, style: {}, width: 1, height: 1 }),
  createElement: () => ({ style: {}, getContext: () => null }),
};

const buf = fs.readFileSync('/Users/solarmatrix/Desktop/6.0.fbx');
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const root = new FBXLoader().parse(ab, '/Users/solarmatrix/Desktop/');
root.updateMatrixWorld(true);

// 手动求包围盒（用世界矩阵变换顶点，跳过 NaN）
function realBox(o) {
  const pos = o.geometry.attributes.position;
  const v = new THREE.Vector3();
  const b = new THREE.Box3();
  let n = 0;
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
    if (Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z)) { b.expandByPoint(v); n++; }
  }
  return { box: b, n, total: pos.count };
}

const recs = [];
root.traverse((o) => {
  if (!o.isMesh) return;
  const { box, n, total } = realBox(o);
  const mat = Array.isArray(o.material) ? o.material[0] : o.material;
  recs.push({
    name: o.name || '(无名)',
    mat: (mat && mat.name) || '(无材质)',
    color: mat && mat.color ? '#' + mat.color.getHexString() : '-',
    tris: (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3,
    valid: n === total,
    badVerts: total - n,
    box,
    h: box.max.z - box.min.z,
  });
});

console.log('=== 最高的 15 个 Mesh（按 Z 高度，单位=FBX 原始）===');
recs.slice().sort((a, b) => b.h - a.h).slice(0, 15).forEach((r) => {
  console.log(`h=${r.h.toFixed(0).padStart(6)}  名称=${String(r.name).slice(0, 22).padEnd(24)} 材质=${String(r.mat).slice(0, 14).padEnd(16)} 三角面=${r.tris}`);
});

const kw = /博宏|大厦|商务楼|19|tower|Tower/i;
console.log('\n=== 名称/材质命中「博宏|大厦|商务楼」===');
const hit = recs.filter((r) => kw.test(r.name) || kw.test(r.mat));
if (!hit.length) console.log('（无命中）');
hit.slice(0, 20).forEach((r) => console.log(`${r.name} | ${r.mat} | h=${r.h.toFixed(0)} | tris=${r.tris}`));

console.log('\n=== 材质清单（44 项：名称 | 色值 | Mesh 数 | 三角面）===');
const mm = {};
recs.forEach((r) => {
  const a = (mm[r.mat] ||= { n: 0, tris: 0, color: r.color });
  a.n++; a.tris += r.tris;
});
Object.entries(mm).sort((a, b) => b[1].tris - a[1].tris)
  .forEach(([k, a]) => console.log(`${String(k).slice(0, 20).padEnd(22)} ${a.color.padEnd(9)} ${String(a.n).padStart(5)} 个  ${String(a.tris).padStart(7)} 面`));

console.log('\n=== NaN 样本（前 3 个含坏顶点的 Mesh）===');
recs.filter((r) => r.badVerts > 0).slice(0, 3).forEach((r) => {
  console.log(`名称=${r.name} 材质=${r.mat} 坏顶点=${r.badVerts}/${r.badVerts + (r.valid ? 1 : 0)} 总顶点≈${r.tris * 3}`);
});
let o2 = null;
root.traverse((o) => {
  if (!o2 && o.isMesh) {
    const p = o.geometry.attributes.position;
    let bad = 0;
    for (let i = 0; i < p.count; i++) if (!Number.isFinite(p.getX(i)) || !Number.isFinite(p.getY(i)) || !Number.isFinite(p.getZ(i))) bad++;
    if (bad > 0) o2 = o;
  }
});
if (o2) {
  const p = o2.geometry.attributes.position;
  console.log('首个坏 Mesh:', o2.name, '| 顶点数', p.count);
  console.log('前 9 个顶点原始值:', Array.from(p.array.slice(0, 27)).map((x) => (Number.isFinite(x) ? x.toFixed(1) : 'NaN')).join(', '));
  console.log('世界矩阵:', o2.matrixWorld.elements.map((x) => (Number.isFinite(x) ? x.toFixed(2) : 'NaN')).join(', '));
  console.log('父链:', (() => { const a = []; let q = o2; while (q) { a.push(q.name || q.type); q = q.parent; } return a.join(' < '); })());
}
