// 日夜时间预设 —— 正午为当前交付档；其余为预留接口（机制已可运行）
import * as THREE from 'three';

export const TIMES = {
  noon: {
    label: '正午',
    sky: 0xaecbe6, sun: 0xfff4e6, sunInt: 2.6,
    hemiSky: 0xbfd8ff, hemiGround: 0x6b6b5a, hemiInt: 0.65,
    amb: 0.22, fog: [350, 900], sunPos: [120, 200, 80],
  },
  dawn: {
    label: '清晨',
    sky: 0xf2c9a8, sun: 0xffd9b0, sunInt: 1.4,
    hemiSky: 0xffd9c0, hemiGround: 0x6b5a4a, hemiInt: 0.5,
    amb: 0.28, fog: [200, 700], sunPos: [-160, 60, 120],
  },
  dusk: {
    label: '黄昏',
    sky: 0xe79a5a, sun: 0xffb070, sunInt: 1.8,
    hemiSky: 0xffb080, hemiGround: 0x4a3a2a, hemiInt: 0.5,
    amb: 0.22, fog: [200, 800], sunPos: [180, 50, -120],
  },
  night: {
    label: '夜景',
    sky: 0x0b1626, sun: 0x9fb4d6, sunInt: 0.35,
    hemiSky: 0x223046, hemiGround: 0x05080c, hemiInt: 0.25,
    amb: 0.10, fog: [150, 600], sunPos: [80, 120, -60],
  },
};

export function applyTime(scene, sun, hemi, amb, cfg) {
  scene.background = new THREE.Color(cfg.sky);
  if (scene.fog) {
    scene.fog.color.set(cfg.sky);
    scene.fog.near = cfg.fog[0];
    scene.fog.far = cfg.fog[1];
  }
  sun.color.set(cfg.sun);
  sun.intensity = cfg.sunInt;
  sun.position.set(...cfg.sunPos);
  hemi.color.set(cfg.hemiSky);
  hemi.groundColor.set(cfg.hemiGround);
  hemi.intensity = cfg.hemiInt;
  amb.intensity = cfg.amb;
}
