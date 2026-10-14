import cv2, os, sys
base = "/Users/solarmatrix/WorkBuddy/VR探索/_analysis/frames"
srcs = {
  "guiyue": "/Users/solarmatrix/Desktop/数字硅谷园资产库/样例/桂月云峯.mp4",
  "zhonghai": "/Users/solarmatrix/Desktop/数字硅谷园资产库/样例/中海叁号院.mp4",
}
N = 14
for key, path in srcs.items():
    cap = cv2.VideoCapture(path)
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    dur = total/fps if fps else 0
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"[{key}] frames={total} fps={fps:.2f} dur={dur:.1f}s size={w}x{h}")
    os.makedirs(f"{base}/{key}", exist_ok=True)
    idxs = [int(total*i/(N-1)) for i in range(N)]
    for i, fi in enumerate(idxs):
        cap.set(cv2.CAP_PROP_POS_FRAMES, fi)
        ok, frame = cap.read()
        if ok:
            cv2.imwrite(f"{base}/{key}/f{i:02d}_{fi}.jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 82])
    cap.release()
print("done")
