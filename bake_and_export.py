"""
3Dプリンター.blend → ベイク → 3Dプリンター.glb
Blender 4.3 バックグラウンドモードで実行:
  blender --background "3Dプリンター.blend" --python bake_and_export.py
"""
import bpy
import os

OUTPUT_GLB = r"C:\Users\Owner\OneDrive\デスクトップ\CoreShift-forchildren-web\models\3Dプリンター.glb"
TEX_DIR    = r"C:\Users\taco0\OneDrive\デスクトップ\雑\3Dプリンター\3Dprinter_textures"
BAKE_SIZE  = 1024

os.makedirs(TEX_DIR, exist_ok=True)

# ── Cycles（ベイクに必須） ──
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 32

print("\n=== STEP 1: UV Smart Project ===")

mesh_objects = [o for o in bpy.data.objects if o.type == 'MESH']
print(f"対象メッシュ数: {len(mesh_objects)}")

for obj in mesh_objects:
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=66.0, island_margin=0.02)
    bpy.ops.object.mode_set(mode='OBJECT')
    print(f"  UV展開完了: {obj.name}")

print("\n=== STEP 2: ベイク用イメージ作成・マテリアル複製 ===")

bake_tasks = []  # (obj, slot_idx, img, img_node, new_mat, orig_mat_name)

for obj in mesh_objects:
    for i, slot in enumerate(obj.material_slots):
        if not slot.material:
            continue

        orig_mat      = slot.material
        orig_mat_name = orig_mat.name
        is_glass      = any(k in orig_mat_name.lower() for k in ['glass', 'smoked'])

        # マテリアルをこのオブジェクト専用に複製（他のオブジェクトへの影響を防ぐ）
        new_mat      = orig_mat.copy()
        new_mat.name = f"baked__{obj.name}__{orig_mat_name}"
        slot.material = new_mat

        # ベイク先イメージ
        img_name = f"{obj.name}__{orig_mat_name}"
        img = bpy.data.images.new(img_name, width=BAKE_SIZE, height=BAKE_SIZE, alpha=is_glass)
        img.filepath_raw = os.path.join(TEX_DIR, img_name + ".png")
        img.file_format  = 'PNG'

        # ノードツリーにイメージテクスチャノードを追加しアクティブに設定
        new_mat.use_nodes = True
        nodes = new_mat.node_tree.nodes
        for n in nodes:
            n.select = False

        img_node      = nodes.new('ShaderNodeTexImage')
        img_node.name  = 'BAKE_TARGET'
        img_node.image = img
        img_node.select = True
        nodes.active    = img_node

        bake_tasks.append((obj, i, img, img_node, new_mat, orig_mat_name))
        print(f"  {obj.name} / {orig_mat_name}")

print(f"\n=== STEP 3: ベイク（{len(bake_tasks)} タスク） ===")

for obj, slot_idx, img, img_node, mat, orig_name in bake_tasks:
    # アクティブノードを再確認
    nodes = mat.node_tree.nodes
    for n in nodes:
        n.select = False
    img_node.select = True
    nodes.active    = img_node

    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    obj.active_material_index = slot_idx

    try:
        bpy.ops.object.bake(
            type='DIFFUSE',
            pass_filter={'COLOR'},
            use_clear=True,
            margin=4,
            save_mode='INTERNAL',
        )
        img.save_render(img.filepath_raw)
        print(f"  ✓ {obj.name}/{orig_name} → {os.path.basename(img.filepath_raw)}")
    except Exception as e:
        print(f"  ✗ {obj.name}/{orig_name} ベイク失敗: {e}")

print("\n=== STEP 4: ベイクテクスチャを Base Color に接続 ===")

for obj, slot_idx, img, img_node, mat, orig_name in bake_tasks:
    nodes  = mat.node_tree.nodes
    links  = mat.node_tree.links

    principled = next((n for n in nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if not principled:
        print(f"  スキップ（Principled BSDFなし）: {mat.name}")
        continue

    # 既存の Base Color リンクを削除
    for link in list(links):
        if link.to_node == principled and link.to_socket.name == 'Base Color':
            links.remove(link)

    # ベイクテクスチャ → Base Color
    links.new(img_node.outputs['Color'], principled.inputs['Base Color'])

    # ガラス系：Alpha も接続
    if any(k in orig_name.lower() for k in ['glass', 'smoked']):
        for link in list(links):
            if link.to_node == principled and link.to_socket.name == 'Alpha':
                links.remove(link)
        links.new(img_node.outputs['Alpha'], principled.inputs['Alpha'])
        mat.blend_method = 'BLEND'

    print(f"  接続完了: {orig_name}")

print("\n=== STEP 5: GLB エクスポート ===")

bpy.ops.object.select_all(action='SELECT')

bpy.ops.export_scene.gltf(
    filepath=OUTPUT_GLB,
    export_format='GLB',
    export_texcoords=True,
    export_normals=True,
    export_materials='EXPORT',
    export_vertex_color='ACTIVE',
    export_animations=True,
    export_image_format='AUTO',
    use_active_scene=True,
)

print(f"\n=== 完了 ===")
print(f"出力先: {OUTPUT_GLB}")
