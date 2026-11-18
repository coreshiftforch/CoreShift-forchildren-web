# -*- coding: utf-8 -*-
# アイコンの白い背景を透明にして、ヘッダー用の小さい画像を作る（Blender のバックグラウンドで実行）
import bpy, sys
import numpy as np
src, dst, size = sys.argv[sys.argv.index('--') + 1:][:3]
size = int(size)
img = bpy.data.images.load(src)
w, h = img.size
px = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)
# 白からの距離で透明度を決める（ふちはなめらかに）
whiteness = px[..., :3].min(axis=2)
alpha = np.clip((1.0 - whiteness) / 0.18, 0.0, 1.0)
px[..., 3] = np.minimum(px[..., 3], alpha)
# 余白を切り詰める
ys, xs = np.where(px[..., 3] > 0.02)
y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
crop = px[y0:y1, x0:x1]
ch, cw = crop.shape[:2]
out = bpy.data.images.new('out', cw, ch, alpha=True)
out.pixels[:] = crop.ravel()
scale = size / max(cw, ch)
out.scale(max(1, round(cw * scale)), max(1, round(ch * scale)))
out.filepath_raw = dst
out.file_format = 'PNG'
out.save()
print('DONE', out.size[:])
