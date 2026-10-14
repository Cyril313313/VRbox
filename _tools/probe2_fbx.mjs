// 确认：世界坐标最高点（判断博宏大厦 33.8m 是否在模型内）+ 单位推定
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

const recs = [];
root.traverse((o) => {
  if (!o.isMesh) return;
  const p = o.geometry.attributes.position;
  const v = new THREE.Vector3();
  let zmin = Infinity, zmax = -Infinity, n = 0;
  let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld);
    if (!Number.isFinite(v.x) || !Number.isFinite(v.y) || !Number.isFinite(v.z)) continue;
    n++;
    if (v.z < zmin) zmin = v.z; if (v.z > zmax) zmax = v.z;
    if (v.x < xmin) xmin = v.x; if (v.x > xmax) xmax = v.x;
    if (v.y < ymin) ymin = v.y; if (v.y > ymax) ymax = v.y;
  }
  const mat = Array.isArray(o.material) ? o.material[0] : o.material;
  recs.push({ name: o.name, mat: (mat && mat.name) || '-', zmin, zmax, xmin, xmax, ymin, ymax, n,
    tris: (o.geometry.index ? o.geometry.index.count : p.count) / 3 });
});

console.log('=== 世界坐标 Z 最高的 12 个 Mesh ===');
recs.slice().sort((a, b) => b.zmax - a.zmax).slice(0, 12).forEach((r) => {
  console.log(`zmax=${r.zmax.toFixed(0).padStart(7)}  zmin=${r.zmin.toFixed(0).padStart(7)}  ${String(r.name).slice(0, 20).padEnd(22)} ${String(r.mat).slice(0, 14).padEnd(16)} tris=${r.tris}`);
});

const gz = recs.filter((r) => r.n);
const Zmax = Math.max(...gz.map((r) => r.zmax));
const Zmin = Math.min(...gz.map((r) => r.zmin));
const Xmin = Math.min(...gz.map((r) => r.xmin)), Xmax = Math.max(...gz.map((r) => r.xmax));
const Ymin = Math.min(...gz.map((r) => r.ymin)), Ymax = Math.max(...gz.map((r) => r.ymax));
console.log('\n=== 全场（仅有效顶点）===');
console.log('X: %s ~ %s  (跨度 %s)', Xmin.toFixed(0), Xmax.toFixed(0), (Xmax - Xmin).toFixed(0));
console.log('Y: %s ~ %s  (跨度 %s)', Ymin.toFixed(0), Ymax.toFixed(0), (Ymax - Ymin).toFixed(0));
console.log('Z: %s ~ %s  (跨度 %s)', Zmin.toFixed(0), Zmax.toFixed(0), (Zmax - Zmin).toFixed(0));
console.log('\n=== 单位推定 ===');
const planA = (Xmax - Xmin), planB = (Ymax - Ymin);
[['厘米 /100', 100], ['英寸 /2.54', 2.54], ['毫米 /1000', 1000], ['米 /1', 1]].forEach(([lab, d]) => {
  console.log(`${lab.padEnd(10)} 场地≈ ${(planA / d).toFixed(0)} × ${(planB / d).toFixed(0)} m  最高=${((Zmax - Zmin) / d).toFixed(1)} m`);
});
console.log('\n参照：用地 49.06 亩 = 32707 ㎡（≈181×181 m）；4层商务楼高 14.9 m；博宏大厦高 33.8 m');

// 建筑主体（图块+单体+平台+道路）按名称第二段分组，看栋数与高度
const arch = recs.filter((r) => /^(图块|单体|平台|道路|地形)/.test(r.name) && r.n);
const grp = {};
arch.forEach((r) => {
  const k = (r.name.match(/^([^_]+_[^_]+)/) || [null, r.name])[1];
  const g = (grp[k] ||= { n: 0, tris: 0, zmax: -Infinity, zmin: Infinity });
  g.n++; g.tris += r.tris; g.zmax = Math.max(g.zmax, r.zmax); g.zmin = Math.min(g.zmin, r.zmin);
});
console.log('\n=== 建筑/场地分组（按组，前 25）===');
Object.entries(grp).sort((a, b) => b[1].tris - a[1].tris).slice(0, 25).forEach(([k, g]) => {
  console.log(`${k.padEnd(16)} ${String(g.n).padStart(4)} mesh ${String(g.tris).padStart(7)} 面   Z ${g.zmin.toFixed(0)}~${g.zmax.toFixed(0)}  (高 ${(g.zmax - g.zmin).toFixed(0)})`);
});
