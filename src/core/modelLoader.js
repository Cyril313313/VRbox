// 真实模型接入：加载 GLB（Draco 压缩）→ 单位判定 + 居中落地 → 按材质名归类真石漆
// 由 _tools/fbx_to_obj.mjs + obj2gltf + gltf-pipeline 生成 public/models/site.glb
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { classify, getMaterial } from './materials.js';

const BASE = import.meta.env.BASE_URL || './';

// 相对 base 拼接，兼容任意子路径部署
export const asset = (p) => new URL(p.replace(/^\//, ''), new URL(BASE, location.href)).href;

let _draco = null;
export function getDraco() {
  if (!_draco) {
    _draco = new DRACOLoader();
    _draco.setDecoderPath(asset('draco/gltf/'));
    _draco.setDecoderConfig({ type: 'wasm' });
  }
  return _draco;
}

export async function loadSiteModel(url = 'models/site.glb') {
  try {
    const loader = new GLTFLoader();
    loader.setDRACOLoader(getDraco());
    const gltf = await loader.loadAsync(asset(url));
    const root = gltf.scene;

    // —— 隐藏模型内自带的 19# 矮体量（将由 tower19.glb 真塔替换）——
    // 该楔形体量在园区西北角，原始模型坐标 X 297~315 / Z −113~−101，高约 13.7（=33.8m 的缩尺）
    root.updateWorldMatrix(true, true);
    const KILL = { x0: 297.0, x1: 315.5, z0: -113.5, z1: -100.5, yMin: 3.0, maxSpan: 30 };
    const _bb = new THREE.Box3();
    let hidden = 0;
    root.traverse((o) => {
      if (!o.isMesh || !o.geometry) return;
      o.geometry.computeBoundingBox();
      _bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
      const c = _bb.getCenter(new THREE.Vector3());
      const s = _bb.getSize(new THREE.Vector3());
      if (
        c.x > KILL.x0 && c.x < KILL.x1 && c.z > KILL.z0 && c.z < KILL.z1 &&
        _bb.max.y > KILL.yMin && s.x < KILL.maxSpan && s.z < KILL.maxSpan
      ) {
        o.visible = false;
        hidden += 1;
      }
    });
    console.info(`[modelLoader] 隐藏模型内 19# 矮体量网格 ${hidden} 个`);

    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // 单位判定：按最大边自动识别 mm / cm / m，不再假设“最高楼=33.8m”
    // 园区模型尺度 190×216 m，故：>10000 视为 mm，>1000 视为 cm，其余为 m
    const maxDim = Math.max(size.x, size.y, size.z);
    const unit = maxDim > 10000 ? 0.001 : maxDim > 1000 ? 0.01 : 1;
    if (unit !== 1) root.scale.setScalar(unit);

    // 落地 + 居中：把底面放到 y=0，平面中心对齐原点
    root.position.set(-center.x * unit, -box.min.y * unit, -center.z * unit);

    let meshes = 0;
    root.traverse((o) => {
      if (!o.isMesh) return;
      meshes += 1;
      const key = classify(o.material?.name || '') || classify(o.name || '');
      if (key) o.material = getMaterial(key);
      o.castShadow = true;
      o.receiveShadow = true;
      o.frustumCulled = true;
    });

    const out = new THREE.Vector3(size.x * unit, size.y * unit, size.z * unit);
    console.info(
      `[modelLoader] site.glb ok · ${meshes} mesh · ${out.x.toFixed(1)}×${out.z.toFixed(1)} m 占地 · 高 ${out.y.toFixed(2)} m（unit ×${unit}）`
    );
    return { root, size: out };
  } catch (e) {
    console.warn('[modelLoader] site model not loaded:', e.message);
    return null;
  }
}
