// 19# 博宏大厦（真塔）接入
// 源：public/models/tower19.glb（图纸尺寸参数化建模，8 层玻璃幕墙 + 三道挑檐，高 33.80 m）
// 放置：用真实轮廓拟合园区模型内的 19# 矮体量（_analysis 拟合 IoU 0.90），
//       解出 缩放 0.375 / 旋转 −13° / 西北角原点 (299.933, −112.336)（园区模型原始坐标）。
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { getDraco, asset } from './modelLoader.js';

// —— 放置参数（园区模型原始坐标：X 东 / Y 上 / Z 南，单位=模型单位）——
export const TOWER19 = {
  url: 'models/tower19.glb',
  originXi: 299.933,   // 真塔西北角（外皮理论角点）落点 X
  originZi: -112.336,  // 落点 Z
  scale: 0.375,        // 真实米 → 模型单位
  rotationY: (-13.0 * Math.PI) / 180,
};

export async function loadTower19() {
  try {
    const loader = new GLTFLoader();
    loader.setDRACOLoader(getDraco());
    const gltf = await loader.loadAsync(asset(TOWER19.url));
    const root = gltf.scene;
    root.name = 'Tower19_Bohong';
    let meshes = 0;
    root.traverse((o) => {
      if (!o.isMesh) return;
      meshes += 1;
      o.castShadow = true;
      o.receiveShadow = true;
      o.frustumCulled = true;
    });
    // 保持 GLB 自带 PBR 材质（TOWER_* 已在生成阶段配好），不做 classify 覆盖
    root.position.set(TOWER19.originXi, 0, TOWER19.originZi);
    root.rotation.y = TOWER19.rotationY;
    root.scale.setScalar(TOWER19.scale);
    console.info(
      `[tower19] ok · ${meshes} mesh · 缩放 ×${TOWER19.scale} · 旋转 ${(-TOWER19.rotationY * 180 / Math.PI).toFixed(1)}° · ` +
      `原点 (${TOWER19.originXi}, ${TOWER19.originZi})`
    );
    return root;
  } catch (e) {
    console.warn('[tower19] load failed:', e.message);
    return null;
  }
}
