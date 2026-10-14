# -*- coding: utf-8 -*-
"""极简 z-buffer 光栅渲染（无依赖），用于快速目视核对 OBJ 体量。
用法：python _tools/preview.py <obj> <out.png> [azimuth_deg] [elev_deg] [dist] [cx] [cy] [cz] [ymin]
"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont


def read_obj(path):
    V = []
    F = []      # (mat, i0,i1,i2)
    cur = None
    for line in open(path, errors='ignore'):
        if line.startswith('v '):
            p = line.split()
            V.append((float(p[1]), float(p[2]), float(p[3])))
        elif line.startswith('usemtl'):
            cur = line.split(None, 1)[1].strip() if len(line.split()) > 1 else None
        elif line.startswith('f '):
            idx = [int(t.split('/')[0]) - 1 for t in line.split()[1:]]
            for k in range(1, len(idx) - 1):
                F.append((cur, idx[0], idx[k], idx[k + 1]))
    return np.array(V, dtype=np.float64), F


def render(obj, out, az=40.0, el=25.0, dist=None, center=None, ymin=-1e9, W=1000, H=640,
           bg=((226, 236, 246), (255, 255, 255))):
    V, F = read_obj(obj)
    if center is None:
        center = (V[:, 0].mean(), V[:, 1].mean(), V[:, 2].mean())
    V = V - np.array(center)
    if dist is None:
        dist = max(V[:, 0].ptp(), V[:, 2].ptp()) * 2.2
    a, e = np.radians(az), np.radians(el)
    eye = np.array([np.cos(e) * np.sin(a), np.sin(e), np.cos(e) * np.cos(a)]) * dist
    fwd = -eye / np.linalg.norm(eye)
    up = np.array([0.0, 1.0, 0.0])
    right = np.cross(fwd, up); right /= np.linalg.norm(right)
    up2 = np.cross(right, fwd)
    f = 1.0 / np.tan(np.radians(25.0))
    R = np.stack([right, up2, -fwd])
    P = V @ R.T
    P = P + np.array([0, 0, 0])
    # 透视
    z = -P[:, 2]
    z = np.maximum(z, 0.1)
    sx = P[:, 0] / z * f * (H / 2) + W / 2
    sy = -P[:, 1] / z * f * (H / 2) + H / 2
    zc = P[:, 2] + eye @ R.T[2] * 0
    depth = -P[:, 2]
    # 背景渐变
    img = np.zeros((H, W, 3), dtype=np.uint8)
    for i in range(H):
        t = i / H
        img[i, :] = [int(bg[0][c] * (1 - t) + bg[1][c] * t) for c in range(3)]
    zbuf = np.full((H, W), 1e9, dtype=np.float32)

    # 平行光（与 sRGB 无关，仅示意）
    L = np.array([0.5, 0.8, 0.35]); L /= np.linalg.norm(L)

    cnt = 0
    for mat, i0, i1, i2 in F:
        idx = (i0, i1, i2)
        if max(V[i0][1], V[i1][1], V[i2][1]) < ymin:
            continue
        x = sx[list(idx)]; y = sy[list(idx)]; d = depth[list(idx)]
        if z[list(idx)].min() <= 0.5:
            continue
        if np.abs(x).max() > 4000 or np.abs(y).max() > 4000:
            continue
        xmin = max(int(np.floor(x.min())), 0); xmax = min(int(np.ceil(x.max())), W - 1)
        ymin_ = max(int(np.floor(y.min())), 0); ymax = min(int(np.ceil(y.max())), H - 1)
        if xmax < xmin or ymax < ymin_:
            continue
        gx, gy = np.meshgrid(np.arange(xmin, xmax + 1) + 0.5, np.arange(ymin_, ymax + 1) + 0.5)

        def edge(p, q):
            return (gx - p[0]) * (q[1] - p[1]) - (gy - p[1]) * (q[0] - p[0])
        e0 = edge((x[0], y[0]), (x[1], y[1]))
        e1 = edge((x[1], y[1]), (x[2], y[2]))
        e2 = edge((x[2], y[2]), (x[0], y[0]))
        inside = ((e0 >= 0) & (e1 >= 0) & (e2 >= 0)) | ((e0 <= 0) & (e1 <= 0) & (e2 <= 0))
        if not inside.any():
            continue
        # 透视校正重心插值深度
        w0, w1, w2 = 1 / z[i0], 1 / z[i1], 1 / z[i2]
        area = e0 + e1 + e2
        with np.errstate(divide='ignore', invalid='ignore'):
            b0 = np.where(area != 0, e1 / area, 0)
            b1 = np.where(area != 0, e2 / area, 0)
            b2 = np.where(area != 0, e0 / area, 0)
        wsum = b0 * w0 + b1 * w1 + b2 * w2
        dd = np.where(wsum != 0, 1.0 / wsum, 1e9)
        # 色彩（按材质）
        col = MATCOL.get(mat, (170, 170, 170))
        pa, pb, pc = V[i0], V[i1], V[i2]
        n = np.cross(pb - pa, pc - pa)
        ln = np.linalg.norm(n)
        if ln > 1e-9:
            n = n / ln
            sh = 0.45 + 0.55 * abs(float(n @ L))
        else:
            sh = 1.0
        c = np.array([min(255, int(v * sh)) for v in col], dtype=np.uint8)
        sub = zbuf[ymin_:ymax + 1, xmin:xmax + 1]
        m = inside & (dd < sub)
        sub[m] = dd[m]
        sub_img = img[ymin_:ymax + 1, xmin:xmax + 1]
        sub_img[m] = c
        cnt += 1
    im = Image.fromarray(img)
    d = ImageDraw.Draw(im)
    d.text((8, 6), 'az %.0f°  el %.0f° 中心 (%.1f, %.1f, %.1f)  dist %.1f' % (az, el, center[0], center[1], center[2], dist), fill=(40, 40, 40))
    im.save(out)
    print('渲染 %d 面 → %s' % (cnt, out))


MATCOL = {
    'TOWER_STONE': (58, 58, 60), 'TOWER_GLASS_GF': (120, 150, 165), 'TOWER_GLASS': (44, 66, 88),
    'TOWER_METAL': (36, 36, 40), 'TOWER_ALU': (232, 232, 228), 'TOWER_ACCENT': (198, 222, 45),
    'TOWER_ROOF': (80, 80, 82), 'TOWER_INNER': (224, 205, 175),
    '石材铺地': (206, 190, 160), '场地道路': (128, 128, 132), '柏油路': (96, 96, 100),
    '人行道': (176, 176, 180), '地面绿化': (118, 168, 96), '周边草地': (86, 136, 74),
    '水面': (96, 156, 186), '屋顶': (150, 150, 152), 'GLASS': (120, 170, 205),
    '白色铝板': (232, 232, 228), '竖纹外墙': (198, 176, 150), '穿孔板': (150, 130, 118),
    '深色金属框': (70, 70, 76), '玫瑰金': (196, 152, 110),
}

if __name__ == '__main__':
    a = sys.argv
    obj, out = a[1], a[2]
    kw = {}
    if len(a) > 3: kw['az'] = float(a[3])
    if len(a) > 4: kw['el'] = float(a[4])
    if len(a) > 5: kw['dist'] = float(a[5])
    if len(a) > 8: kw['center'] = (float(a[6]), float(a[7]), float(a[8]))
    if len(a) > 9: kw['ymin'] = float(a[9])
    render(obj, out, **kw)
