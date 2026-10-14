# -*- coding: utf-8 -*-
"""
19# 博宏大厦 —— 几何内核（平面轮廓 + 竖向分层）
================================================
坐标约定（与园区模型一致）：X 向东、Y 向上、Z 向南。
局部原点 = 外皮西北理论角点，Y=0 = 室外地面（绝对标高 80.70）。

平面轮廓（外皮，mm→m）：左上圆角 R2000/内皮 R1800、北外皮水平、西外皮竖直、
右下斜边、右上弧 R5300、左下弧 R4000。总长 39.82 m × 总高 27.09 m（外接矩形）。
"""
import math

# —— 轴网（自西北角起算，mm） ——
AX_X = {'19-1': 200, '19-2': 6500, '19-3': 11500, '19-4': 19500, '19-5': 27500, '19-6': 34320, '19-7': 39820}
AX_Y = {'19-F': 200, '19-E': 2000, '19-D': 8000, '19-C': 16000, '19-B': 23095}

# —— 平面基本量（m） ——
TOTAL_X = 39.820          # 总长（19-1 轴外皮 → 19-7 轴）
TOTAL_Y = 27.095          # 总高
CORNER = (2.000, 2.000)   # 左上圆角圆心
R_CORNER = 2.000          # 外皮 R2 000 / 内皮 R1 800（标注 R1800 指内皮）
C1 = (34.320, 5.500)      # 右上弧圆心（19-6 轴）
R1 = 5.500                # 外皮 R5 500 / 内皮 R5 300（标注 R5300 指内皮，与左上角同例）
C2 = (4.000, 23.095)      # 左下弧圆心（19-B 轴）
R2 = 4.000                # 外皮 R4 000 / 内皮 R3 800（标注 R4000 指外皮）
SLANT_deg = None          # 由相切条件解出

# 斜边：与两圆弧同时相切 → n·(C1-C2) = -(R1-R2)
import numpy as np
_d = np.array(C1) - np.array(C2)
_L = float(np.linalg.norm(_d))
_th0 = math.atan2(_d[1], _d[0])
_alpha = math.acos(-(R1 - R2) / _L)
T_N = _th0 + _alpha          # 法向角（指向东南，即建筑外侧）
N_SLANT = np.array([math.cos(T_N), math.sin(T_N)])
C_SLANT = float(N_SLANT @ np.array(C1) + R1)   # 斜边直线 n·P = c
SLANT_deg = math.degrees(T_N) - 90.0           # 斜边与水平夹角
INNER_deg = 180.0 - abs(SLANT_deg)             # 与北外皮的内角

T1 = (C1[0], 0.0)                              # 北外皮 ↔ 右上弧切点
T2 = tuple(np.array(C1) + R1 * N_SLANT)        # 右上弧 ↔ 斜边切点
T3 = tuple(np.array(C2) + R2 * N_SLANT)        # 左下弧 ↔ 斜边切点
T4 = (0.0, C2[1])                              # 西外皮 ↔ 左下弧切点


def outline(d=0.0, arc_step=0.25):
    """外扩 d 米的轮廓点列（闭合，逆时针/顺时针不影响挤出）。
    凸形外扩：圆弧半径 +d、圆心不动；直线各自外移 d、角度不变。"""
    pts = []
    Rc = R_CORNER + d
    r1 = R1 + d
    r2 = R2 + d
    pts.append((CORNER[0], -d))                       # 圆角 ↔ 北外皮切点
    pts.append((C1[0], -d))                           # 北外皮 → 右上弧切点
    for a in _arc(np.degrees(T_N) - 90.0, math.degrees(T_N), r1, arc_step):
        pts.append((C1[0] + r1 * math.cos(a), C1[1] + r1 * math.sin(a)))
    pts.append(tuple(np.array(C2) + r2 * N_SLANT))    # 斜边 → 左下弧切点
    for a in _arc(math.degrees(T_N), 180.0, r2, arc_step):
        pts.append((C2[0] + r2 * math.cos(a), C2[1] + r2 * math.sin(a)))
    pts.append((-d, CORNER[1]))                       # 西外皮顶（左下弧 ↔ 西外皮切点）
    for a in _arc(180.0, 270.0, Rc, arc_step):
        pts.append((CORNER[0] + Rc * math.cos(a), CORNER[1] + Rc * math.sin(a)))
    # 闭合：末点 = 首点，去掉重复
    if pts[-1] == pts[0]:
        pts.pop()
    return pts


def _arc(a0, a1, r, step):
    """返回从 a0 到 a1（度）的角度序列（含端点），弧长步长 ≈ step 米。"""
    n = max(2, int(math.ceil(r * math.radians(a1 - a0) / step)) + 1)
    return [math.radians(a0 + (a1 - a0) * i / (n - 1)) for i in range(n)]


def area(d=0.0):
    """轮廓面积（m²），鞋带公式。"""
    P = outline(d)
    s = 0.0
    for i in range(len(P)):
        x0, y0 = P[i]
        x1, y1 = P[(i + 1) % len(P)]
        s += x0 * y1 - x1 * y0
    return abs(s) / 2.0


def perimeter(d=0.0):
    P = outline(d)
    s = 0.0
    for i in range(len(P)):
        x0, y0 = P[i]
        x1, y1 = P[(i + 1) % len(P)]
        s += math.hypot(x1 - x0, y1 - y0)
    return s


# —— 竖向分层（自室外地面 y=0 起算，m） ——
LEVEL = {
    '室外地面': 0.00,
    'F1': 0.80,      # ±0.000 = 81.50（室内外高差 0.80）
    'F2': 5.00,      # 1F 层高 4.20
    'F3': 8.90,      # 2F 3.90
    'F4': 12.80,
    'F5': 16.70,
    'F6': 20.60,
    'F7': 24.50,
    'F8': 28.40,
    '屋面': 32.05,    # 8F 3.65；绝对 112.75
    '女儿墙顶': 33.80,  # 绝对 114.50；H = 33.80 − 80.70 ✓
}
BANDS = [8.90, 20.60, 28.40]     # 三道大挑檐（3F / 6F / 8F 楼面）


if __name__ == '__main__':
    print('斜边法向角 %.4f°  斜边与水平夹角 %.4f°  内角 %.4f° = %.0f°%02.0f′' % (
        math.degrees(T_N), SLANT_deg, INNER_deg,
        int(INNER_deg), round((INNER_deg - int(INNER_deg)) * 60)))
    print('斜边直段 = %.1f mm  （图纸 35 000）' % (np.linalg.norm(np.array(T3) - np.array(T2)) * 1000))
    print('T2 = (%.3f, %.3f)   T3 = (%.3f, %.3f)' % (T2[0], T2[1], T3[0], T3[1]))
    print('两弧最远点距 = %.3f m  （总图 44.55）' % (_L + R1 + R2))
    print('外接矩形 = %.3f × %.3f m' % (TOTAL_X, TOTAL_Y))
    print('占地（外皮）= %.2f m²   周长 = %.2f m' % (area(0), perimeter(0)))
    print('轮廓点数 = %d' % len(outline(0)))
    print('轴线校核：19-1→19-7 = %d mm' % (AX_X['19-7'] - AX_X['19-1']))
    print('          19-F→19-B = %d mm' % (AX_Y['19-B'] - AX_Y['19-F']))
