// 模块3：景观第一人称浏览（主干道 + 植被水景 · 触屏摇杆 + 鼠标）
import { RoamController } from '../core/roamControls.js';

export function createRoaming(stage, hud) {
  const rc = new RoamController(stage.camera, stage.renderer.domElement);
  return {
    name: '景观漫游',
    enter() {
      stage.orbit.enabled = false;
      rc.unlock();
      rc.enter();
      hud.showJoystick(rc);
    },
    exit() {
      rc.exit();
      hud.hideJoystick();
    },
    update(dt) { rc.update(dt); },
    // 供全屏面板（如效果图画廊）临时接管输入
    lock() { rc.lock(); hud.hideJoystick(); },
    unlock() { rc.unlock(); },
    controller() { return rc; },
  };
}
