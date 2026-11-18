"""Produce the Stage 1 post-office graybox with Blender and export a named glTF2 GLB.
Run: blender --background --factory-startup --python source-assets/levels/generate-graybox-blender.py
The input tuples are Three.js (X,Y,Z); Blender uses (X,-Z,Y) before glTF Y-up export.
"""
import sys
# Ubuntu Blender 4.0 may omit distro Python packages from its embedded sys.path.
sys.path.append('/usr/lib/python3/dist-packages')
import bpy
from pathlib import Path

root = Path(__file__).resolve().parents[2]
out = root / "public/content/l01/geometry.glb"
out.parent.mkdir(parents=True, exist_ok=True)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

def piece(name, xyz, dims, rgb):
    x, y, z = xyz
    width, height, depth = dims
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, -z, y))
    obj = bpy.context.object
    obj.name = name
    obj.data.name = name
    obj.dimensions = (width, depth, height)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    mat = bpy.data.materials.new(name + "_mat")
    mat.diffuse_color = (*rgb, 1)
    mat.use_nodes = True
    principled = mat.node_tree.nodes.get("Principled BSDF")
    principled.inputs["Base Color"].default_value = (*rgb, 1)
    principled.inputs["Roughness"].default_value = 0.86
    obj.data.materials.append(mat)

piece("l01_wall_west_south", (2, .9, -2), (.18, 1.8, 2), (.75, .74, .66))
piece("l01_wall_west_north", (2, .9, .5), (.18, 1.8, 1), (.75, .74, .66))
piece("l01_wall_east", (4, .9, -1), (.18, 1.8, 4), (.61, .63, .59))
piece("l01_wall_north", (3, .9, 1), (2, 1.8, .18), (.69, .72, .68))
piece("l01_wall_south", (3, .9, -3), (2, 1.8, .18), (.69, .72, .68))
piece("l01_door_main", (2, .9, -.5), (.21, 1.8, 1), (.30, .36, .40))
piece("l01_fence", (-1, .53, -.5), (.18, 1.06, 3), (.46, .37, .30))
piece("l01_mailbox", (-2.5, .58, .5), (.55, 1.15, .6), (.88, .67, .40))
piece("l01_sign", (1.61, 1.73, 1.4), (.68, .36, .16), (.50, .78, .74))

bpy.ops.export_scene.gltf(filepath=str(out), export_format="GLB", export_yup=True)
print("Blender graybox export:", out, out.stat().st_size)
