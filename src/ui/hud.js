// HUD：副标题、日夜时间面板、漫游虚拟摇杆
import { TIMES } from '../core/dayNight.js';

export class Hud {
  constructor(stage) {
    this.stage = stage;
    this.sub = document.getElementById('subtitle');
    this.joy = document.getElementById('joystick');
    this.joyKnob = document.getElementById('joystick-knob');
    this.timePanel = document.getElementById('time-panel');
    this._joyBound = false;
    this._activeKey = 'noon';
  }

  setSubtitle(t) { this.sub.textContent = '当前模块：' + t; }

  // —— 日夜时间面板 ——
  showTimePanel() {
    this.timePanel.innerHTML = '';
    Object.keys(TIMES).forEach((key) => {
      const b = document.createElement('button');
      b.textContent = TIMES[key].label;
      if (key === this.stage.timeName) b.classList.add('active');
      b.onclick = () => {
        this.stage.setTime(key);
        [...this.timePanel.children].forEach((c) => c.classList.remove('active'));
        b.classList.add('active');
      };
      this.timePanel.appendChild(b);
    });
    this.timePanel.classList.add('show');
  }
  hideTimePanel() { this.timePanel.classList.remove('show'); }

  // —— 漫游虚拟摇杆 ——
  showJoystick(rc) {
    this.joy.classList.add('show');
    if (this._joyBound) return;
    this._joyBound = true;
    const max = () => this.joy.clientWidth / 2;
    const onMove = (e) => {
      const r = this.joy.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const t = e.touches ? e.touches[0] : e;
      const m = max();
      const nx = Math.max(-1, Math.min(1, (t.clientX - cx) / m));
      const ny = Math.max(-1, Math.min(1, (t.clientY - cy) / m));
      this.joyKnob.style.transform = `translate(${nx * m}px, ${ny * m}px)`;
      rc.setJoystick(nx, ny);
    };
    const onEnd = () => {
      this.joyKnob.style.transform = 'translate(0,0)';
      rc.setJoystick(0, 0);
    };
    this.joy.addEventListener('touchstart', onMove, { passive: true });
    this.joy.addEventListener('touchmove', (e) => { e.preventDefault(); onMove(e); }, { passive: false });
    this.joy.addEventListener('touchend', onEnd);
    this.joy.addEventListener('mousedown', onMove);
    this.joy.addEventListener('mousemove', (e) => { if (e.buttons) onMove(e); });
    addEventListener('mouseup', onEnd);
  }
  hideJoystick() { this.joy.classList.remove('show'); }
}
