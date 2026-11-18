# -*- coding: utf-8 -*-
# 3Dプリンターがネームプレートを1層ずつ作る連番画像を書き出す（Blender 5.x、バックグラウンド実行）
#   blender --background --factory-startup --python print_anim.py -- <出力フォルダ> [test]
import bpy, sys, math, os
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if argv else '/tmp/print_anim'
TEST = len(argv) > 1 and argv[1] == 'test'
MODELS = '/Users/ishi/repos/coreshift/CoreShift-forchildren-web/models'
FRAMES = 72

os.makedirs(OUT, exist_ok=True)
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)

def import_glb(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    return [o for o in bpy.data.objects if o not in before]

printer = import_glb(f'{MODELS}/3Dプリンター.glb')
plate_objs = import_glb(f'{MODELS}/ネームプレート.glb')

def world_bbox(objs):
    pts = [o.matrix_world @ Vector(c) for o in objs if o.type == 'MESH' for c in o.bound_box]
    mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return mn, mx

bpy.context.view_layer.update()
by_name = {o.name: o for o in printer}
bed = by_name.get('平面')
head = by_name.get('立方体')
bed_mn, bed_mx = world_bbox([bed])
bed_c = (bed_mn + bed_mx) / 2

# ネームプレートを造形台の中央に置く
root = bpy.data.objects.new('nameplate_root', None)
bpy.context.collection.objects.link(root)
for o in plate_objs:
    if o.parent is None:
        o.parent = root
bpy.context.view_layer.update()
np_mn, np_mx = world_bbox(plate_objs)
np_size = np_mx - np_mn
scale = (bed_mx.x - bed_mn.x) * 0.55 / max(np_size.x, np_size.y)
root.scale = (scale, scale, scale)
bpy.context.view_layer.update()
np_mn, np_mx = world_bbox(plate_objs)
np_c = (np_mn + np_mx) / 2
root.location += Vector((bed_c.x - np_c.x, bed_c.y - np_c.y, bed_mx.z - np_mn.z + 0.002))
bpy.context.view_layer.update()
np_mn, np_mx = world_bbox(plate_objs)
height = np_mx.z - np_mn.z

# 1層ずつ現れる: 素材の側で「造形中の高さより上は透明」にし、その高さを上げていく
cut_holder = bpy.data.objects.new('cut_height', None)
bpy.context.collection.objects.link(cut_holder)
def add_cut(mat):
    mat.use_nodes = True
    nt = mat.node_tree
    out = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL')
    src = out.inputs['Surface'].links[0].from_socket if out.inputs['Surface'].links else None
    geo = nt.nodes.new('ShaderNodeNewGeometry')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    nt.links.new(geo.outputs['Position'], sep.inputs[0])
    val = nt.nodes.new('ShaderNodeValue'); val.name = 'cut'
    d = val.outputs[0].driver_add('default_value')
    var = d.driver.variables.new(); var.name = 'z'; var.type = 'TRANSFORMS'
    var.targets[0].id = cut_holder; var.targets[0].transform_type = 'LOC_Z'; var.targets[0].transform_space = 'WORLD_SPACE'
    d.driver.expression = 'z'
    gt = nt.nodes.new('ShaderNodeMath'); gt.operation = 'GREATER_THAN'
    nt.links.new(sep.outputs['Z'], gt.inputs[0]); nt.links.new(val.outputs[0], gt.inputs[1])
    # 造形中の高さのすぐ下を光らせる（溶けた樹脂の線）
    sub = nt.nodes.new('ShaderNodeMath'); sub.operation = 'SUBTRACT'
    nt.links.new(val.outputs[0], sub.inputs[0]); nt.links.new(sep.outputs['Z'], sub.inputs[1])
    band = nt.nodes.new('ShaderNodeMath'); band.operation = 'LESS_THAN'; band.inputs[1].default_value = 0.012
    nt.links.new(sub.outputs[0], band.inputs[0])
    emi = nt.nodes.new('ShaderNodeEmission'); emi.inputs['Color'].default_value = (1.0, 0.55, 0.15, 1); emi.inputs['Strength'].default_value = 6
    mix_e = nt.nodes.new('ShaderNodeMixShader')
    nt.links.new(band.outputs[0], mix_e.inputs[0])
    if src: nt.links.new(src, mix_e.inputs[1])
    nt.links.new(emi.outputs[0], mix_e.inputs[2])
    tr = nt.nodes.new('ShaderNodeBsdfTransparent')
    mix = nt.nodes.new('ShaderNodeMixShader')
    nt.links.new(gt.outputs[0], mix.inputs[0])
    nt.links.new(mix_e.outputs[0], mix.inputs[1]); nt.links.new(tr.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs['Surface'])
    for attr in ('blend_method',):
        if hasattr(mat, attr):
            try: setattr(mat, attr, 'HASHED')
            except Exception: pass
seen = set()
for o in plate_objs:
    if o.type != 'MESH': continue
    for slot in o.material_slots:
        if slot.material and slot.material.name not in seen:
            seen.add(slot.material.name); add_cut(slot.material)
def set_cut(frame, t):
    cut_holder.location.z = np_mn.z + height * t + (0.001 if t > 0 else -0.01)
    cut_holder.keyframe_insert('location', frame=frame)

# ノズル（ヘッド）: 造形中の高さのすぐ上で、ジグザグに動かす
head_home = head.location.copy() if head else None
head_home_wz = head.matrix_world.translation.z if head else 0
door = by_name.get('door')
if door:
    door.hide_render = True
    door.hide_viewport = True
def set_head(frame, t):
    if not head:
        return
    zig = math.sin(frame * 0.9)
    zag = math.cos(frame * 0.37)
    target_world_z = np_mn.z + height * t + 0.35
    dz = target_world_z - head_home_wz
    head.location = head_home + Vector((zig * (np_mx.x - np_mn.x) * 0.45, zag * (np_mx.y - np_mn.y) * 0.4, dz))
    head.keyframe_insert('location', frame=frame)

scene = bpy.context.scene
scene.frame_start, scene.frame_end = 1, FRAMES
for f in range(1, FRAMES + 1):
    t = (f - 1) / (FRAMES - 1)
    set_cut(f, t)
    set_head(f, t)

# カメラと光
bpy.context.view_layer.update()
all_mn, all_mx = world_bbox([o for o in printer if o.type == 'MESH'])
center = (all_mn + all_mx) / 2
cam_data = bpy.data.cameras.new('cam')
cam_data.lens = 50
cam = bpy.data.objects.new('cam', cam_data)
scene.collection.objects.link(cam)
# 扉（+X 側）の正面やや左上から、庫内の造形台をのぞく
target = Vector((bed_c.x, bed_c.y, bed_mx.z + 3.0))
dist = (all_mx - all_mn).length * 1.32
cam.location = target + Vector((dist * 0.88, -dist * 0.28, dist * 0.40))
direction = target - cam.location
cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
scene.camera = cam

sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = 3.0
so = bpy.data.objects.new('sun', sun); scene.collection.objects.link(so)
so.rotation_euler = (math.radians(50), math.radians(10), math.radians(35))
area = bpy.data.lights.new('fill', 'AREA'); area.energy = 800; area.size = 8
ao = bpy.data.objects.new('fill', area); scene.collection.objects.link(ao)
ao.location = center + Vector((-dist * 0.5, -dist * 0.6, dist * 0.5))
ao.rotation_euler = (center - ao.location).to_track_quat('-Z', 'Y').to_euler()
inner = bpy.data.lights.new('inner', 'POINT'); inner.energy = 600; inner.shadow_soft_size = 1.0
io = bpy.data.objects.new('inner', inner); scene.collection.objects.link(io)
io.location = (bed_c.x + 0.8, bed_c.y, bed_mx.z + 3.0)
front = bpy.data.lights.new('front', 'AREA'); front.energy = 1500; front.size = 5
fo = bpy.data.objects.new('front', front); scene.collection.objects.link(fo)
fo.location = cam.location + Vector((0, 0, 2))
fo.rotation_euler = (target - fo.location).to_track_quat('-Z', 'Y').to_euler()
if scene.world is None:
    scene.world = bpy.data.worlds.new('w')
scene.world.use_nodes = True
bg = scene.world.node_tree.nodes.get('Background')
if bg:
    bg.inputs[0].default_value = (0.8, 0.85, 0.9, 1)
    bg.inputs[1].default_value = 0.6

r = scene.render
r.engine = 'BLENDER_EEVEE'
r.film_transparent = True
r.resolution_x = r.resolution_y = 720
r.resolution_percentage = 100
r.image_settings.file_format = 'WEBP'
r.image_settings.quality = 82
r.image_settings.color_mode = 'RGBA'

frames = [1, FRAMES // 2, FRAMES] if TEST else range(1, FRAMES + 1)
for f in frames:
    scene.frame_set(f)
    r.filepath = os.path.join(OUT, f'frame_{f:03d}.webp')
    bpy.ops.render.render(write_still=True)
print('DONE', OUT, list(frames)[:3], 'height', round(height, 3), 'scale', round(scale, 3), 'head', bool(head))
