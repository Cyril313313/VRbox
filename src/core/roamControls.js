// 第一人称漫游控制器（触屏 + 鼠标统一）
// 键盘 WASD/方向键移动；屏幕拖拽看视角；HUD 虚拟摇杆注入移动向量
import * as THREE from 'three';

export class RoamController {
  constructor(camera, dom) {
    this.camera = camera;
    this.dom = dom;
    this.enabled = false;
    this.locked = false;
    this.keys = {};
    this.yaw = 0;
    this.pitch = 0;
    this.eyeHeight = 1.7;
    this.joy = { x: 0, y: 0 };
    this._bind();
  }

  _bind() {
    addEventListener('keydown', (e) => { if (this.active) this.keys[e.code] = true; });
    addEventListener('keyup', (e) => { this.keys[e.code] = false; });

    let dragging = false, px = 0, py = 0;
    const down = (e) => {
      if (!this.active) return;
      dragging = true;
      const t = e.touches ? e.touches[0] : e;
      px = t.clientX; py = t.clientY;
    };
    const move = (e) => {
      if (!this.active || !dragging) return;
      const t = e.touches ? e.touches[0] : e;
      const dx = t.clientX - px, dy = t.clientY - py;
      px = t.clientX; py = t.clientY;
      this.yaw -= dx * 0.003;
      this.pitch = Math.max(-0.5, Math.min(0.6, this.pitch - dy * 0.003));
    };
    const up = () => { dragging = false; };
    this.dom.addEventListener('mousedown', down);
    addEventListener('mousemove', move);
    addEventListener('mouseup', up);
    this.dom.addEventListener('touchstart', down, { passive: true });
    addEventListener('touchmove', move, { passive: true });
    addEventListener('touchend', up);
  }

  setJoystick(x, y) { this.joy.x = x; this.joy.y = y; }

  // 全屏面板打开时锁定输入（不重置位置）
  lock() { this.locked = true; this.keys = {}; this.joy.x = 0; this.joy.y = 0; }
  unlock() { this.locked = false; }
  get active() { return this.enabled && !this.locked; }

  enter() {
    this.enabled = true;
    this.locked = false;
    this.camera.position.set(0, this.eyeHeight, 60);
    this.yaw = 0; this.pitch = 0;
  }

  exit() {
    this.enabled = false;
    this.locked = false;
    this.keys = {};
    this.joy.x = 0; this.joy.y = 0;
  }

  update(dt) {
    if (!this.active) return;
    const dir = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    let mx = 0, mz = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) mz += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) mz -= 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) mx -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) mx += 1;
    mx += this.joy.x; mz -= this.joy.y;

    const fwd = new THREE.Vector3();
    fwd.copy(dir).multiplyScalar(mz).add(right.multiplyScalar(mx));
    if (fwd.lengthSq() > 0) {
      fwd.normalize().multiplyScalar(18 * dt);
      this.camera.position.add(fwd);
    }
    this.camera.position.y = this.eyeHeight;

    const cp = this.pitch;
    const target = this.camera.position.clone().add(new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(cp),
      Math.sin(cp),
      Math.cos(this.yaw) * Math.cos(cp)
    ));
    this.camera.lookAt(target);
  }
}
