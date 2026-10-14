// FBX → OBJ(+MTL)：过滤配景/坏几何，Z-up→Y-up，厘米→米，顶点去重
// 用法: node _tools/fbx_to_obj.mjs <input.fbx> <output.obj>
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

globalThis.document = {
  createElementNS: () => ({ addEventListener() {}, removeEventListener() {}, set src(_v) {}, get src() { return ''; }, style: {}, width: 1, height: 1 }),
  createElement: () => ({ style: {}, getContext: () => null }),
};

const IN = process.argv[2] || '/Users/solarmatrix/Desktop/6.0.fbx';
const OUT = process.argv[3] || '/tmp/site.obj';

// 配景排除：车辆(car*)、后视镜(side_*)、块标记(tgg_*)
const EXCLUDE = /^(car|side_|tgg)/i;

const buf = fs.readFileSync(IN);
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
console.log('解析 FBX (%s MB)...', (buf.length / 1048576).toFixed(1));
const t0 = Date.now();
const root = new FBXLoader().parse(ab, path.dirname(IN));
root.updateMatrixWorld(true);
console.log('解析完成 %s ms', Date.now() - t0);

// 变换：厘米→米(0.01) + Z-up→Y-up(绕 X -90°)
const FIX = new THREE.Matrix4().makeRotationX(-Math.PI / 2)
  .premultiply(new THREE.Matrix4().makeScale(0.01, 0.01, 0.01));
const world = new THREE.Matrix4();
const nm = new THREE.Matrix3();

const chunks = [];
const mtlNames = new Map();
let kept = 0, droppedEnt = 0, droppedNaN = 0, tris = 0, verts = 0;
const box = new THREE.Box3();

root.traverse((o) => {
  if (!o.isMesh) return;
  const name = (o.name || 'mesh').replace(/\s+/g, '_');
  if (EXCLUDE.test(name)) { droppedEnt++; return; }

  const g = o.geometry;
  const pos = g.attributes.position;
  if (!pos) return;
  const nor = g.attributes.normal;
  const uv = g.attributes.uv;
  const idx = g.index;

  world.multiplyMatrices(FIX, o.matrixWorld);
  nm.getNormalMatrix(world);

  const v = new THREE.Vector3(), n = new THREE.Vector3();
  const vLines = [], nLines = [], tLines = [];
  const vMap = new Map(), nMap = new Map(), tMap = new Map();
  const faces = []; // [{v,t,n} ×3]，均为本对象内局部下标(1-based，缺失为 0)

  const triCount = idx ? idx.count / 3 : pos.count / 3;
  let badTri = 0;

  const emit = (i) => {
    const vi = idx ? idx.getX(i) : i;
    v.fromBufferAttribute(pos, vi);
    if (!Number.isFinite(v.x) || !Number.isFinite(v.y) || !Number.isFinite(v.z)) return null;
    v.applyMatrix4(world);
    box.expandByPoint(v);
    const kv = `${Math.round(v.x * 10000)},${Math.round(v.y * 10000)},${Math.round(v.z * 10000)}`;
    let id = vMap.get(kv);
    if (id === undefined) { id = vLines.length + 1; vMap.set(kv, id); vLines.push(`v ${v.x.toFixed(4)} ${v.y.toFixed(4)} ${v.z.toFixed(4)}`); }

    let tid = 0;
    if (uv) {
      const u = uv.getX(vi), w = uv.getY(vi);
      if (Number.isFinite(u) && Number.isFinite(w)) {
        const kt = `${Math.round(u * 10000)},${Math.round(w * 10000)}`;
        let got = tMap.get(kt);
        if (got === undefined) { got = tLines.length + 1; tMap.set(kt, got); tLines.push(`vt ${u.toFixed(5)} ${w.toFixed(5)}`); }
        tid = got;
      }
    }
    let nid = 0;
    if (nor) {
      n.fromBufferAttribute(nor, vi);
      if (Number.isFinite(n.x) && Number.isFinite(n.y) && Number.isFinite(n.z)) {
        n.applyMatrix3(nm).normalize();
        const kn = `${Math.round(n.x * 1000)},${Math.round(n.y * 1000)},${Math.round(n.z * 1000)}`;
        let got = nMap.get(kn);
        if (got === undefined) { got = nLines.length + 1; nMap.set(kn, got); nLines.push(`vn ${n.x.toFixed(4)} ${n.y.toFixed(4)} ${n.z.toFixed(4)}`); }
        nid = got;
      }
    }
    return { v: id, t: tid, n: nid };
  };

  for (let t = 0; t < triCount; t++) {
    const a = emit(t * 3), b = emit(t * 3 + 1), c = emit(t * 3 + 2);
    if (!a || !b || !c) { badTri++; continue; }
    faces.push([a, b, c]);
  }
  if (!faces.length) { droppedNaN++; return; }

  const mat = Array.isArray(o.material) ? o.material[0] : o.material;
  const rawMat = mat && mat.name ? mat.name : 'default';
  const mtlKey = rawMat.replace(/[^\w\u4e00-\u9fa5]+/g, '_') || 'default';
  if (!mtlNames.has(mtlKey)) {
    const c = mat && mat.color ? mat.color : new THREE.Color(0xcccccc);
    mtlNames.set(mtlKey, { kd: [c.r, c.g, c.b], d: mat && mat.transparent ? (mat.opacity ?? 1) : 1 });
  }

  chunks.push({ name, mtl: mtlKey, v: vLines, n: nLines, t: tLines, faces, badTri });
  kept++; tris += faces.length; verts += vLines.length;
});

console.log('保留 Mesh: %d | 剔除配景: %d | 剔除空/全NaN: %d', kept, droppedEnt, droppedNaN);
console.log('三角面: %d | 去重后顶点: %d', tris, verts);
console.log('包围盒(m) min: %s', box.min.toArray().map((x) => x.toFixed(2)).join(', '));
console.log('包围盒(m) max: %s', box.max.toArray().map((x) => x.toFixed(2)).join(', '));
const sz = box.getSize(new THREE.Vector3());
console.log('尺寸(m): X=%s  Y(高)=%s  Z=%s', sz.x.toFixed(2), sz.y.toFixed(2), sz.z.toFixed(2));

const mtlPath = OUT.replace(/\.obj$/, '.mtl');
const mtlLines = ['# 颜色取自 SketchUp 材质'];
for (const [k, m] of mtlNames) {
  mtlLines.push(`newmtl ${k}`, `Kd ${m.kd.map((x) => x.toFixed(4)).join(' ')}`, 'Ka 0 0 0', 'Ks 0 0 0', `d ${m.d}`, 'illum 1', '');
}
fs.writeFileSync(mtlPath, mtlLines.join('\n'));
console.log('材质写出: %d 个 → %s', mtlNames.size, mtlPath);

const out = fs.createWriteStream(OUT);
out.write(`mtllib ${path.basename(mtlPath)}\n# 源: ${path.basename(IN)}\n`);
let vBase = 0, tBase = 0, nBase = 0;
const fmt = (p) => {
  const s = `${p.v + vBase}`;
  return (p.t || p.n) ? `${s}/${p.t ? p.t + tBase : ''}/${p.n ? p.n + nBase : ''}` : s;
};
for (const c of chunks) {
  out.write(`\ng ${c.name}\nusemtl ${c.mtl}\n`);
  out.write(c.v.join('\n') + '\n');
  if (c.t.length) out.write(c.t.join('\n') + '\n');
  if (c.n.length) out.write(c.n.join('\n') + '\n');
  out.write(c.faces.map((f) => `f ${f.map(fmt).join(' ')}`).join('\n') + '\n');
  vBase += c.v.length; tBase += c.t.length; nBase += c.n.length;
}
out.end();
out.on('close', () => {
  console.log('OBJ 写出: %s (%s MB)', OUT, (fs.statSync(OUT).size / 1048576).toFixed(1));
});
