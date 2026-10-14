// 文字标注：Canvas → Sprite（无需额外渲染器）
import * as THREE from 'three';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function makeLabel(text, fs = 34, pad = 16, scale = 0.06) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  ctx.font = `bold ${fs}px "PingFang SC","Microsoft YaHei",sans-serif`;
  const w = ctx.measureText(text).width;
  c.width = w + pad * 2;
  c.height = fs + pad;
  ctx.font = `bold ${fs}px "PingFang SC","Microsoft YaHei",sans-serif`;
  ctx.fillStyle = 'rgba(20,30,45,0.82)';
  roundRect(ctx, 0, 0, c.width, c.height, 12);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, pad, c.height / 2);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, depthTest: false, transparent: true,
  }));
  sp.scale.set(c.width * scale, c.height * scale, 1);
  sp.renderOrder = 999;
  return sp;
}
