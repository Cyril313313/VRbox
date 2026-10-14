# -*- coding: utf-8 -*-
"""
把 obj2gltf 产出的 tower19 GLB 的材质按立面做法改写为 PBR，
并输出 public/models/tower19.glb。
用法：python _tools/patch_tower19_glb.py <in.glb> <out.glb>
"""
import json
import struct
import sys
import os

# name → (baseColor, metallic, roughness, alphaMode, alphaCutoff, emissive, doubleSided)
PBR = {
    'TOWER_STONE':    ((0.30, 0.31, 0.32), 0.05, 0.85, 'OPAQUE', 0.5, None, False),
    'TOWER_GLASS_GF': ((0.36, 0.42, 0.46), 0.35, 0.06, 'BLEND', 0.5, None, False),
    'TOWER_GLASS':    ((0.13, 0.19, 0.26), 0.92, 0.05, 'OPAQUE', 0.5, None, False),
    'TOWER_METAL':    ((0.11, 0.12, 0.13), 0.90, 0.35, 'OPAQUE', 0.5, None, False),
    'TOWER_ALU':      ((0.85, 0.85, 0.83), 0.35, 0.42, 'OPAQUE', 0.5, None, False),
    'TOWER_ACCENT':   ((0.76, 0.87, 0.18), 0.10, 0.52, 'OPAQUE', 0.5, (0.16, 0.19, 0.02), False),
    'TOWER_ROOF':     ((0.27, 0.28, 0.29), 0.05, 0.92, 'OPAQUE', 0.5, None, False),
    'TOWER_INNER':    ((0.88, 0.82, 0.70), 0.00, 0.90, 'OPAQUE', 0.5, (0.10, 0.09, 0.06), False),
}


def read_glb(path):
    raw = open(path, 'rb').read()
    magic, ver, ln = struct.unpack('<III', raw[:12])
    assert magic == 0x46546C67, 'not a glb'
    off, js, bin_ = 12, None, None
    while off < ln:
        clen, ctype = struct.unpack('<II', raw[off:off + 8])
        body = raw[off + 8:off + 8 + clen]
        if ctype == 0x4E4F534A:
            js = json.loads(body)
        elif ctype == 0x004E4942:
            bin_ = body
        off += 8 + clen
    return js, bin_


def write_glb(path, js, bin_):
    jsb = json.dumps(js, separators=(',', ':')).encode()
    jsb += b' ' * ((4 - len(jsb) % 4) % 4)
    bb = bin_ + b'\x00' * ((4 - len(bin_) % 4) % 4)
    total = 12 + 8 + len(jsb) + (8 + len(bb) if bb else 0)
    out = struct.pack('<III', 0x46546C67, 2, total)
    out += struct.pack('<II', len(jsb), 0x4E4F534A) + jsb
    if bb:
        out += struct.pack('<II', len(bb), 0x004E4942) + bb
    open(path, 'wb').write(out)


def main(src, dst):
    js, bin_ = read_glb(src)
    names = [m.get('name', '') for m in js.get('materials', [])]
    hit = 0
    for m in js.get('materials', []):
        rule = PBR.get(m.get('name', ''))
        if not rule:
            continue
        col, met, rough, amode, acut, emis, ds = rule
        m['pbrMetallicRoughness'] = {
            'baseColorFactor': [col[0], col[1], col[2], 1.0],
            'metallicFactor': met,
            'roughnessFactor': rough,
        }
        m['alphaMode'] = amode
        if amode == 'MASK':
            m['alphaCutoff'] = acut
        if emis:
            m['emissiveFactor'] = list(emis)
        m['doubleSided'] = ds
        hit += 1
    js.pop('extensionsUsed', None)
    js.pop('extensionsRequired', None)
    write_glb(dst, js, bin_)
    print('材质命中 %d / %d：%s' % (hit, len(names), names))
    print('输出 %s  %.1f KB' % (dst, os.path.getsize(dst) / 1024))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
