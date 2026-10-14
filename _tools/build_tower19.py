# -*- coding: utf-8 -*-
"""
19# 博宏大厦 —— 实体生成（OBJ + MTL）
=====================================
依据：19# 地上部分平面图（像素级拟合）+ 建筑总说明层高 + 园区效果图立面做法。
输出：_tools/out/tower19.obj / tower19.mtl
约定：X 向东、Y 向上、Z 向南；原点 = 外皮西北角，Y=0 = 室外地面（绝对 80.70）。

立面做法（按效果图）：
  8 层玻璃幕墙（竖明横隐），三道外挑檐（3F / 6F / 8F 楼面标高 8.90 / 20.60 / 28.40）
  挑檐白色铝板饰面 + 檐底黄绿（chartreuse）色带；挑檐之上那一层幕墙整层内退 0.90 m
  屋顶圆角挑檐 + 女儿墙（屋面 32.05 → 女儿墙顶 33.80，高 1.75 m）
"""
import os
import sys
import math

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tower19_geom import outline, LEVEL, area, perimeter  # noqa: E402

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
os.makedirs(OUT, exist_ok=True)

# ── 立面参数（m） ────────────────────────────────────────────
D_PLINTH = 0.45      # 基座外挑
D_GF = 0.05          # 首层幕墙
D_MAIN = 0.00        # 标准层幕墙
D_RECESS = -0.90     # 挑檐之上那层：整层内退
SLAB_OUT = 1.40      # 大挑檐外挑
SLAB_T = 0.55        # 大挑檐板厚
ACC_OUT = 1.30       # 檐底色带外挑
ACC_T = 0.14         # 檐底色带高
RING_OUT = 0.18      # 楼板线（浅挑）
RING_T = 0.30
ROOF_OUT = 0.55      # 屋面挑檐外挑
ROOF_T = 0.60
PARAPET_T = 1.15     # 女儿墙（32.65 → 33.80）
MULLION_W = 0.10     # 竖挺宽
MULLION_D = 0.12     # 竖挺出挑
MULLION_GAP = 1.50   # 竖挺间距
INNER = -1.60        # 首层室内内壳

# 分段幕墙：(名称, y0, y1, 外扩量)
GLASS_SEGMENTS = [
    ('GF', LEVEL['F1'], LEVEL['F2'], D_GF),
    ('F2', LEVEL['F2'], LEVEL['F3'], D_MAIN),
    ('F3', LEVEL['F3'], LEVEL['F4'], D_RECESS),
    ('F4', LEVEL['F4'], LEVEL['F5'], D_MAIN),
    ('F5', LEVEL['F5'], LEVEL['F6'], D_MAIN),
    ('F6', LEVEL['F6'], LEVEL['F7'], D_RECESS),
    ('F7', LEVEL['F7'], LEVEL['F8'], D_MAIN),
    ('F8', LEVEL['F8'], LEVEL['屋面'], D_RECESS),
]
RING_LEVELS = [LEVEL['F2'], LEVEL['F4'], LEVEL['F5'], LEVEL['F7']]
BAND_LEVELS = [LEVEL['F3'], LEVEL['F6'], LEVEL['F8']]

MAT = {
    'TOWER_STONE':  (0.30, 0.31, 0.32),
    'TOWER_GLASS_GF': (0.34, 0.38, 0.40),
    'TOWER_GLASS':  (0.14, 0.20, 0.27),
    'TOWER_METAL':  (0.12, 0.13, 0.14),
    'TOWER_ALU':    (0.84, 0.84, 0.82),
    'TOWER_ACCENT': (0.74, 0.85, 0.20),
    'TOWER_ROOF':   (0.28, 0.29, 0.30),
    'TOWER_INNER':  (0.86, 0.80, 0.68),
}

V = []   # 顶点
VN = []  # 法向
F = []   # (mat, [(vi, ni), ...])


def _v(p):
    V.append(p)
    return len(V)


def _n(p):
    VN.append(p)
    return len(VN)


def _face(mat, idx):
    F.append((mat, idx))


def _outline_normals(pts):
    """各点的水平外法向（2D）。凸形：与「点−形心」同侧。"""
    cx = sum(p[0] for p in pts) / len(pts)
    cy = sum(p[1] for p in pts) / len(pts)
    m = len(pts)
    out = []
    for i in range(m):
        p0 = pts[(i - 1) % m]
        p1 = pts[i]
        p2 = pts[(i + 1) % m]
        d0 = (p1[0] - p0[0], p1[1] - p0[1])
        d1 = (p2[0] - p1[0], p2[1] - p1[1])
        n0 = (d0[1], -d0[0])
        n1 = (d1[1], -d1[0])
        l0 = math.hypot(*n0) or 1.0
        l1 = math.hypot(*n1) or 1.0
        nx = n0[0] / l0 + n1[0] / l1
        ny = n0[1] / l0 + n1[1] / l1
        L = math.hypot(nx, ny) or 1.0
        nx, ny = nx / L, ny / L
        if nx * (p1[0] - cx) + ny * (p1[1] - cy) < 0:
            nx, ny = -nx, -ny
        out.append((nx, ny))
    return out


def extrude(mat, pts, y0, y1, cap_bottom=True, cap_top=True, cap_mat=None):
    """按轮廓挤出：侧墙 + 可选上下盖（扇形三角）。"""
    m = len(pts)
    nm = _outline_normals(pts)
    cap_mat = cap_mat or mat
    # 侧墙顶点（底/顶各一套，法向 = 水平外法向）
    base, top = [], []
    for i, (x, z) in enumerate(pts):
        ni = _n((nm[i][0], 0.0, nm[i][1]))
        base.append(_v((x, y0, z)))
        top.append(_v((x, y1, z)))
    # 侧墙：保证外法向朝外（用首条边判定绕向）
    p0, p1 = pts[0], pts[1]
    ax, az = p1[0] - p0[0], p1[1] - p0[1]
    # 面法向（b0,b1,t1,t0）的 y 分量符号 = -(ax*nz - az*nx)
    cross = ax * nm[0][1] - az * nm[0][0]
    order = [0, 1, 2, 3] if cross < 0 else [0, 3, 2, 1]
    for i in range(m):
        j = (i + 1) % m
        quad = [(base[i], nm[i]), (base[j], nm[j]), (top[j], nm[j]), (top[i], nm[i])]
        quad = [quad[k] for k in order]
        idx = []
        for vv, nn in quad:
            # 复用已登记的法向索引
            ni = _n((nn[0], 0.0, nn[1]))
            idx.append((vv, ni))
        _face(mat, idx)
    cx = sum(p[0] for p in pts) / m
    cz = sum(p[1] for p in pts) / m
    if cap_bottom:
        nidx = _n((0.0, -1.0, 0.0))
        c = _v((cx, y0, cz))
        ring = [_v((p[0], y0, p[1])) for p in pts]
        for i in range(m):
            j = (i + 1) % m
            _face(cap_mat, [(c, nidx), (ring[j], nidx), (ring[i], nidx)])
    if cap_top:
        nidx = _n((0.0, 1.0, 0.0))
        c = _v((cx, y1, cz))
        ring = [_v((p[0], y1, p[1])) for p in pts]
        for i in range(m):
            j = (i + 1) % m
            _face(cap_mat, [(c, nidx), (ring[i], nidx), (ring[j], nidx)])


def box(mat, cx, cz, y0, y1, w, dpt, rot=0.0):
    """水平截面为 w×dpt 的竖挺（绕 Y 轴 rot 弧度）。"""
    hw, hd = w / 2, dpt / 2
    ca, sa = math.cos(rot), math.sin(rot)
    pts = []
    for sx, sz in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        x, z = sx * hw, sz * hd
        pts.append((cx + x * ca - z * sa, cz + x * sa + z * ca))
    extrude(mat, pts, y0, y1, True, True)


def sample_perimeter(pts, gap):
    """沿闭合轮廓按弧长等距取点，返回 [(x,z,切向角)]。"""
    m = len(pts)
    segs = []
    total = 0.0
    for i in range(m):
        a = pts[i]
        b = pts[(i + 1) % m]
        L = math.hypot(b[0] - a[0], b[1] - a[1])
        segs.append((a, b, L, total))
        total += L
    out = []
    n = max(2, int(round(total / gap)))
    for k in range(n):
        s = total * k / n
        for a, b, L, acc in segs:
            if acc + L >= s - 1e-9:
                t = (s - acc) / L if L > 0 else 0.0
                x = a[0] + (b[0] - a[0]) * t
                z = a[1] + (b[1] - a[1]) * t
                ang = math.atan2(b[1] - a[1], b[0] - a[0])
                out.append((x, z, ang))
                break
    return out


def build():
    # 1) 基座
    extrude('TOWER_STONE', outline(D_PLINTH), LEVEL['室外地面'], 0.85)
    # 2) 分段幕墙
    for name, y0, y1, d in GLASS_SEGMENTS:
        mat = 'TOWER_GLASS_GF' if name == 'GF' else 'TOWER_GLASS'
        extrude(mat, outline(d), y0, y1, cap_bottom=(name == 'GF'), cap_top=False)
    # 3) 首层室内内壳（透过玻璃可见）
    extrude('TOWER_INNER', outline(INNER), LEVEL['F1'], LEVEL['F2'], True, True)
    # 4) 楼板线（浅挑）
    for y in RING_LEVELS:
        extrude('TOWER_METAL', outline(RING_OUT), y - RING_T / 2, y + RING_T / 2, True, True)
    # 5) 三道大挑檐 + 檐底黄绿色带
    for y in BAND_LEVELS:
        extrude('TOWER_ALU', outline(SLAB_OUT), y + 0.02, y + 0.02 + SLAB_T, True, True)
        extrude('TOWER_ACCENT', outline(ACC_OUT), y - ACC_T, y + 0.02, True, True)
    # 6) 屋面挑檐（板 + 檐底）+ 女儿墙 + 屋面
    y = LEVEL['屋面']
    extrude('TOWER_ALU', outline(ROOF_OUT), y, y + ROOF_T, True, True)
    extrude('TOWER_ACCENT', outline(ROOF_OUT - 0.10), y - ACC_T, y, True, True)
    extrude('TOWER_ALU', outline(ROOF_OUT), y + ROOF_T, LEVEL['女儿墙顶'], False, True)
    extrude('TOWER_ROOF', outline(ROOF_OUT - 0.10), y + 0.02, y + 0.10, True, True)
    # 7) 竖挺（逐段幕墙，跟随各自外扩量）
    for name, y0, y1, d in GLASS_SEGMENTS:
        pts = outline(d + MULLION_D / 2)
        for x, z, ang in sample_perimeter(pts, MULLION_GAP):
            box('TOWER_METAL', x, z, y0, y1, MULLION_W, MULLION_D, ang)


def write_obj():
    lines = ['# 19# 博宏大厦（博宏大厦）— 由 _tools/build_tower19.py 生成',
             '# 单位 m；X 向东、Y 向上、Z 向南；原点 = 外皮西北角，Y=0 = 室外地面(80.70)',
             'mtllib tower19.mtl']
    for p in V:
        lines.append('v %.4f %.4f %.4f' % p)
    for p in VN:
        lines.append('vn %.4f %.4f %.4f' % p)
    cur = None
    for i, (mat, idx) in enumerate(F):
        if mat != cur:
            lines.append('usemtl %s' % mat)
            lines.append('o %s_%04d' % (mat, i))
            cur = mat
        lines.append('f ' + ' '.join('%d//%d' % (vi, ni) for vi, ni in idx))
    with open(os.path.join(OUT, 'tower19.obj'), 'w') as f:
        f.write('\n'.join(lines) + '\n')
    with open(os.path.join(OUT, 'tower19.mtl'), 'w') as f:
        for k, (r, g, b) in MAT.items():
            f.write('newmtl %s\nKd %.3f %.3f %.3f\nKa 0.0 0.0 0.0\nKs 0.35 0.35 0.35\nNs 60\nillum 2\n\n' % (k, r, g, b))
    return len(V), len(F)


if __name__ == '__main__':
    build()
    nv, nf = write_obj()
    tri = sum(max(0, len(idx) - 2) for _, idx in F)
    print('轮廓点 %d ／ 分段幕墙 %d ／ 大挑檐 %d 道' % (len(outline(0)), len(GLASS_SEGMENTS), len(BAND_LEVELS)))
    print('顶点 %d   面 %d   三角面 %d' % (nv, nf, tri))
    print('外皮占地 %.2f m²   外皮周长 %.2f m' % (area(0), perimeter(0)))
    print('檐口高度 %.2f m ／ 女儿墙顶 %.2f m（H = %.2f m）' % (LEVEL['屋面'], LEVEL['女儿墙顶'], LEVEL['女儿墙顶']))
    print('输出 → %s/tower19.obj' % OUT)
