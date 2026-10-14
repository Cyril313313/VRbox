// 真石漆材质库 —— 依据《材料封样.docx》色卡系列
// SM1-0022 银白 / SM2-1465 深灰仿石 / SM3-1487 深色缝·基座；另含幕墙玻璃
import * as THREE from 'three';

export const STONE = {
  SM1_0022: { label: '真石漆 SM1-0022（银白）',     color: 0xe9e7e1, roughness: 0.92, metalness: 0.0 },
  SM2_1465: { label: '真石漆 SM2-1465（深灰仿石）', color: 0x565b5f, roughness: 0.94, metalness: 0.0 },
  SM3_1487: { label: '真石漆 SM3-1487（深色缝/基座）', color: 0x2f3336, roughness: 0.90, metalness: 0.0 },
  GLASS:     { label: '幕墙玻璃',                    color: 0x2b3b4a, roughness: 0.12, metalness: 0.55, transparent: true, opacity: 0.55 },
  GROUND:    { label: '场地铺地',                    color: 0x8f9b7a, roughness: 1.0,  metalness: 0.0 },
  ROAD:      { label: '园区道路',                    color: 0x6d6d72, roughness: 1.0,  metalness: 0.0 },
  WATER:     { label: '景观水景',                    color: 0x4a7d8c, roughness: 0.2,  metalness: 0.1, transparent: true, opacity: 0.85 },
};

const _cache = {};
export function getMaterial(key) {
  if (!_cache[key]) {
    const c = STONE[key];
    _cache[key] = new THREE.MeshStandardMaterial({
      color: c.color,
      roughness: c.roughness,
      metalness: c.metalness ?? 0,
      transparent: !!c.transparent,
      opacity: c.opacity ?? 1,
    });
  }
  return _cache[key];
}

// 真实模型接入时归类材质。**优先传材质名**（site.glb 的 44 个材质有明确命名，
// 而网格名多为「平台_001」这类通用名）。命中则返回 STONE 键，未命中返回 null → 保留原材质。
const RULES = [
  [/玻璃|幕墙|glass|curtain|window|窗|mullion|glazing/i, 'GLASS'],
  [/水景|水面|水池|water|pool|景观水/i, 'WATER'],
  [/石材铺地|铺装|铺地|广场|景石|paving|plaza|platform|平台/i, 'GROUND'],
  [/道路|柏油|沥青|车行道|人行道|路缘|road|asphalt|pavement|sidewalk|curb/i, 'ROAD'],
  [/基座|台基|勒脚|缝|plinth|base.?stone|foundation/i, 'SM3_1487'],
  [/深灰|仿石|花岗|石材|stone|granite/i, 'SM2_1465'],
  [/屋顶|屋面|roof/i, null],
];

export function classify(name = '') {
  for (const [re, key] of RULES) if (re.test(name)) return key;
  return null;
}
