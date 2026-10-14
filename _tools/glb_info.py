#!/usr/bin/env python3
"""GLB 结构体检：读 public/models/site.glb，输出尺寸/面数/材质名/是否 Draco 压缩。

用法：
  /Users/solarmatrix/.workbuddy/binaries/python/envs/default/bin/python _tools/glb_info.py [glb路径]
"""
import collections
import json
import struct
import sys

GLB_MAGIC = 0x46546C67
CHUNK_JSON = 0x4E4F534A


def read_glb(path):
    buf = open(path, "rb").read()
    magic, _ver, total = struct.unpack("<III", buf[:12])
    if magic != GLB_MAGIC:
        raise SystemExit(f"{path} 不是合法 GLB")
    off, js = 12, None
    while off < total:
        clen, ctype = struct.unpack("<II", buf[off : off + 8])
        if ctype == CHUNK_JSON:
            js = json.loads(buf[off + 8 : off + 8 + clen])
        off += 8 + clen
    return buf, js


def main(path):
    buf, j = read_glb(path)
    acc = j["accessors"]
    mn, mx = [1e9] * 3, [-1e9] * 3
    verts = tris = 0
    per_mat = collections.Counter()
    for mesh in j["meshes"]:
        for prim in mesh["primitives"]:
            a = acc[prim["attributes"]["POSITION"]]
            for i in range(3):
                mn[i] = min(mn[i], a["min"][i])
                mx[i] = max(mx[i], a["max"][i])
            verts += a["count"]
            if "indices" in prim:
                tris += acc[prim["indices"]]["count"] // 3
            if "material" in prim:
                per_mat[j["materials"][prim["material"]].get("name", "?")] += 1

    size = [mx[i] - mn[i] for i in range(3)]
    print(f"文件        {path}  {len(buf) / 1048576:.2f} MB")
    print(f"扩展        要求 {j.get('extensionsRequired')}")
    print(f"规模        mesh {len(j['meshes'])} · 三角面 {tris:,} · 顶点 {verts:,} · 材质 {len(j['materials'])}")
    print(f"包围盒      min {[round(v, 2) for v in mn]}  max {[round(v, 2) for v in mx]}")
    print(f"尺寸        X {size[0]:.2f} m × Y {size[1]:.2f} m × Z {size[2]:.2f} m（水平占地 {size[0] * size[2]:.0f} ㎡）")
    print(f"最高点      {mx[1]:.2f} m")
    print("材质清单    " + "、".join(m.get("name", "?") for m in j["materials"]))
    print("占比最高    " + "，".join(f"{n}({c})" for n, c in per_mat.most_common(8)))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "public/models/site.glb")
