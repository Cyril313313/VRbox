// 模块5：户型 3D 展示（4 层商务单元 · 外观 + 功能分层 · 分层标注）
// 进入时隐藏园区场景，聚焦单体；退出时恢复园区
import * as THREE from 'three';
import { getMaterial } from '../core/materials.js';
import { makeLabel } from '../ui/label.js';
import { PROJECT } from '../data/project.js';

export function createApartment(stage, world) {
  const root = new THREE.Group();
  root.name = 'apartment';
  const labels = new THREE.Group();
  const w = 20, d = 16;
  let baseY = 0;
  PROJECT.villaFloors.forEach((f) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, f.h, d), getMaterial(f.mat));
    m.position.set(0, baseY + f.h / 2, 0);
    m.castShadow = true; m.receiveShadow = true;
    root.add(m);
    const lb = makeLabel(f.name);
    lb.position.set(w / 2 + 1, baseY + f.h / 2, 0);
    labels.add(lb);
    baseY += f.h;
  });
  root.add(labels);

  return {
    name: '户型展示',
    enter() {
      stage.orbit.enabled = true;
      stage.orbit.minDistance = 10;
      world.visible = false;
      root.visible = true;
      stage.scene.add(root);
      stage.camera.position.set(46, 30, 46);
      stage.orbit.target.set(0, baseY / 2, 0);
      stage.orbit.update();
    },
    exit() {
      root.visible = false;
      stage.scene.remove(root);
      world.visible = true;
      stage.orbit.minDistance = 8;
    },
    update() {},
  };
}
