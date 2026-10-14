// 模块1：项目三维沙盘（上帝视角 · 触屏/鼠标轨道 · 正午光照）
export function createSandtable(stage) {
  return {
    name: '三维沙盘',
    enter() {
      stage.orbit.enabled = true;
      stage.camera.position.set(90, 70, 110);
      stage.orbit.target.set(0, 8, 0);
      stage.orbit.update();
    },
    exit() {},
    update() {},
  };
}
