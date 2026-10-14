# -*- coding: utf-8 -*-
"""
园区模型俯视图（按材质着色）—— 用于与总平面图对照定位 19# 楼。
用法：python _tools/topview.py /tmp/site.obj _analysis/site_topview.png [px/m]
"""
import sys
import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# 材质 → 颜色（便于识别场地构成）
PALETTE = [
    ('石材铺地', (214, 198, 168)),
    ('场地道路', (120, 120, 126)),
    ('柏油路', (86, 86, 92)),
    ('人行道', (170, 170, 174)),
    ('地面绿化', (108, 162, 92)),
    ('周边草地', (78, 128, 70)),
    ('水面', (86, 148, 176)),
    ('屋顶', (172, 92, 74)),
    ('栏杆玻璃', (128, 176, 200)),
    ('GLASS', (120, 170, 205)),
    ('白色铝板', (232, 232, 228)),
    ('竖纹外墙', (198, 176, 150)),
    ('穿孔板', (150, 130, 118)),
    ('深色金属框', (74, 74, 80)),
    ('玫瑰金', (196, 152, 110)),
]
FALLBACK = (150, 150, 150)


def read_obj(path):
    V = []
    faces = []
    cur = None
    for line in open(path, 'r', errors='ignore'):
        if line.startswith('v '):
            p = line.split()
            V.append((float(p[1]), float(p[2]), float(p[3])))
        elif line.startswith('usemtl'):
            cur = line.split(None, 1)[1].strip() if len(line.split()) > 1 else None
        elif line.startswith('f '):
            idx = [int(t.split('/')[0]) - 1 for t in line.split()[1:]]
            for k in range(1, len(idx) - 1):
                faces.append((cur, idx[0], idx[k], idx[k + 1]))
    return np.array(V, dtype=np.float64), faces


def main(obj, out, ppm=6.0):
    V, faces = read_obj(obj)
    print('顶点 %d  面 %d' % (len(V), len(faces)))
    x0, x1 = V[:, 0].min(), V[:, 0].max()
    z0, z1 = V[:, 2].min(), V[:, 2].max()
    print('范围 X %.2f..%.2f  Z %.2f..%.2f' % (x0, x1, z0, z1))
    W = int((x1 - x0) * ppm) + 20
    H = int((z1 - z0) * ppm) + 20
    img = Image.new('RGB', (W, H), (24, 24, 28))
    d = ImageDraw.Draw(img)
    cmap = {n: c for n, c in PALETTE}

    def uv(x, z):
        return ((x - x0) * ppm + 10, (z - z0) * ppm + 10)

    stat = {}
    for mat, a, b, c in faces:
        col = cmap.get(mat, FALLBACK)
        stat[mat] = stat.get(mat, 0) + 1
        pts = [uv(V[a][0], V[a][2]), uv(V[b][0], V[b][2]), uv(V[c][0], V[c][2])]
        d.polygon(pts, fill=col)
    img.save(out)
    print('输出', out, img.size)
    # 世界坐标网格
    g = img.copy()
    dg = ImageDraw.Draw(g)
    try:
        f = ImageFont.truetype('/System/Library/Fonts/Hiragino Sans GB.ttc', 13)
    except Exception:
        f = ImageFont.load_default()
    for gx in range(int(math.floor(x0 / 20) * 20), int(x1) + 1, 20):
        u, _ = uv(gx, z0)
        dg.line([(u, 0), (u, H)], fill=(255, 60, 60), width=1)
        dg.text((u + 2, 2), '%.0f' % gx, fill=(255, 230, 60), font=f)
    for gz in range(int(math.floor(z0 / 20) * 20), int(z1) + 1, 20):
        _, v = uv(x0, gz)
        dg.line([(0, v), (W, v)], fill=(255, 60, 60), width=1)
        dg.text((2, v + 2), '%.0f' % gz, fill=(255, 230, 60), font=f)
    g.save(out.replace('.png', '_grid.png'))
    print('输出', out.replace('.png', '_grid.png'))
    for k, v in sorted(stat.items(), key=lambda t: -t[1])[:20]:
        print('   %-12s %d' % (k, v))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], float(sys.argv[3]) if len(sys.argv) > 3 else 6.0)
