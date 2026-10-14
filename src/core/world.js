// 占位世界：实例化别墅 + 博宏大厦 + 设备房 + 道路 + 景观水景
// 真实 SKP 模型接入后由 modelLoader 替换（隐藏本组）
import * as THREE from 'three';
import { getMaterial } from './materials.js';
import { BUILDINGS } from '../data/project.js';

export function createWorld() {
  const root = new THREE.Group();
  root.name = 'world';

  // 地面
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), getMaterial('GROUND'));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  root.add(ground);

  // 园区主干道
  const road = new THREE.Mesh(new THREE.PlaneGeometry(760, 26), getMaterial('ROAD'));
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.03, 0);
  road.receiveShadow = true;
  root.add(road);

  // 中央景观水景（占位）
  const pond = new THREE.Mesh(new THREE.CircleGeometry(40, 48), getMaterial('WATER'));
  pond.rotation.x = -Math.PI / 2;
  pond.position.set(0, 0.05, -70);
  root.add(pond);

  // 24 栋别墅（InstancedMesh，性能关键）
  const { villaHeight: vH, villaFoot: vF } = BUILDINGS;
  const geo = new THREE.BoxGeometry(vF, vH, vF);
  const inst = new THREE.InstancedMesh(geo, getMaterial('SM1_0022'), 24);
  inst.castShadow = true;
  inst.receiveShadow = true;
  const cols = 6, rows = 4, gx = 22, gz = 24, ox = -80, oz = -55;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
  const villaPositions = [];
  let idx = 0;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      p.set(ox + i * gx, vH / 2, oz + j * gz);
      m.compose(p, q, sc);
      inst.setMatrixAt(idx++, m);
      villaPositions.push([p.x, p.z]);
    }
  }
  inst.instanceMatrix.needsUpdate = true;
  root.add(inst);

  // 博宏大厦（8 层，深灰仿石主体 + 玻璃幕墙翼）
  const tower = new THREE.Mesh(
    new THREE.BoxGeometry(BUILDINGS.towerFoot, BUILDINGS.towerHeight, BUILDINGS.towerFoot),
    getMaterial('SM2_1465')
  );
  tower.position.set(80, BUILDINGS.towerHeight / 2, 45);
  tower.castShadow = true; tower.receiveShadow = true;
  tower.name = '博宏大厦';
  root.add(tower);

  const wing = new THREE.Mesh(
    new THREE.BoxGeometry(BUILDINGS.towerFoot * 0.9, BUILDINGS.towerHeight * 0.96, 4),
    getMaterial('GLASS')
  );
  wing.position.set(80, BUILDINGS.towerHeight / 2, 45 - BUILDINGS.towerFoot / 2 - 2);
  root.add(wing);

  // 设备房
  const equip = new THREE.Mesh(
    new THREE.BoxGeometry(BUILDINGS.equipFoot, BUILDINGS.equipHeight, BUILDINGS.equipFoot),
    getMaterial('SM3_1487')
  );
  equip.position.set(80, BUILDINGS.equipHeight / 2, -45);
  equip.castShadow = true; equip.receiveShadow = true;
  root.add(equip);

  root.userData = { villaPositions, inst, tower, pond };
  return root;
}
