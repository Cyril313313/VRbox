// 模块2：建筑立面赏析（典型别墅近景 + 博宏大厦，带文字标注）
import * as THREE from 'three';
import { makeLabel } from '../ui/label.js';

export function createFacade(stage, world) {
  const v = world.userData.villaPositions[0];
  const labels = new THREE.Group();

  const l1 = makeLabel('4层商务单元 · 真石漆 SM1-0022 / SM2-1465');
  l1.position.set(v[0], 17, v[1]);
  labels.add(l1);

  const t = world.userData.tower;
  const l2 = makeLabel('博宏大厦 · 8层 · 幕墙玻璃');
  l2.position.set(t.position.x, 37, t.position.z);
  labels.add(l2);

  return {
    name: '建筑立面',
    enter() {
      stage.orbit.enabled = true;
      stage.camera.position.set(v[0] + 34, 16, v[1] + 38);
      stage.orbit.target.set(v[0], 8, v[1]);
      stage.orbit.minDistance = 14;
      stage.orbit.update();
      world.add(labels);
    },
    exit() {
      stage.orbit.minDistance = 8;
      world.remove(labels);
    },
    update() {},
  };
}
