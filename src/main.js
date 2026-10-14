// 硅谷科技园 · VR 数字沙盘 入口
import * as THREE from 'three';
import { Stage } from './core/stage.js';
import { createWorld } from './core/world.js';
import { loadSiteModel } from './core/modelLoader.js';
import { loadTower19 } from './core/tower19.js';
import { createSandtable } from './modules/sandtable.js';
import { createFacade } from './modules/facade.js';
import { createRoaming } from './modules/roaming.js';
import { createDayNight } from './modules/daynight.js';
import { createApartment } from './modules/apartment.js';
import { Nav } from './ui/nav.js';
import { Hud } from './ui/hud.js';
import { Gallery } from './ui/gallery.js';
import { InfoPanel } from './ui/infopanel.js';

const canvas = document.getElementById('scene');
const stage = new Stage(canvas);

// 占位世界（真实模型到位后隐藏）
const world = createWorld();
stage.scene.add(world);

// 真实模型：若 public/models/site.glb 存在则接入并隐藏占位
loadSiteModel().then(async (res) => {
  if (!res) return;
  world.visible = false;
  stage.scene.add(res.root);
  world.userData.model = res.root;
  stage.frameTo(res.size); // 按实际占地自动取景

  // 19# 博宏大厦真塔：挂到园区根节点下（用同一套“模型原始坐标”），替换模型内矮体量
  const tower = await loadTower19();
  if (tower) {
    res.root.add(tower);
    res.root.userData.tower19 = tower;
  }
});

const hud = new Hud(stage);

const modules = {
  sandtable: createSandtable(stage),
  facade: createFacade(stage, world),
  roaming: createRoaming(stage, hud),
  daynight: createDayNight(stage, hud),
  apartment: createApartment(stage, world),
};
const order = ['sandtable', 'facade', 'roaming', 'daynight', 'apartment'];
const titles = {
  sandtable: '项目三维沙盘',
  facade: '建筑立面赏析',
  roaming: '景观第一人称浏览',
  daynight: '日夜时间切换',
  apartment: '户型3D展示',
};

let active = null;
let activeKey = null;
let galleryRef = null;
function switchTo(key) {
  if (galleryRef && galleryRef.open) galleryRef.close();
  if (active) active.exit();
  active = modules[key];
  activeKey = key;
  active.enter();
  hud.setSubtitle(titles[key]);
}
new Nav(order, titles, switchTo);
switchTo('sandtable');

// —— 效果图画廊：打开时锁定漫游/轨道控制，关闭时恢复 ——
const gallery = new Gallery({
  onOpen: () => {
    stage.orbit.enabled = false;
    hud.hideJoystick();
    modules.roaming.lock();
  },
  onClose: () => {
    if (activeKey === 'roaming') {
      modules.roaming.unlock();
      hud.showJoystick(modules.roaming.controller());
    } else if (activeKey !== 'apartment') {
      stage.orbit.enabled = true;
    }
  },
});
const info = new InfoPanel();
galleryRef = gallery;

document.getElementById('btn-gallery').addEventListener('click', () => {
  gallery.open ? gallery.close() : gallery.showFor(activeKey);
});
document.getElementById('btn-info').addEventListener('click', () => info.toggle());

const clock = new THREE.Clock();
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (active) active.update(dt);
  if (stage.orbit.enabled) stage.orbit.update();
  stage.render();
}
loop();

// 调试挂钩（供后续自动化/测试使用）
window.__app = { stage, world, modules, switchTo, gallery, info };
