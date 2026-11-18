"""Build a small named glTF2 graybox for Stage 1 in the absence of final Blender art.

Run: python source-assets/levels/generate-graybox.py
Requires trimesh (asset authoring only; not a web runtime dependency).
Blender export replacements must preserve REQUIRED_MESH_IDS in src/gameplay/Stage1Layout.ts.
"""
from pathlib import Path
import json
import struct
import trimesh

root = Path(__file__).resolve().parents[2]
out = root / 'public/content/l01/geometry.glb'
scene = trimesh.Scene()


def piece(name, center, size, rgba):
    mesh = trimesh.creation.box(extents=size)
    mesh.apply_translation(center)
    mesh.visual.vertex_colors = list(rgba)
    scene.add_geometry(mesh, geom_name=name, node_name=name)

piece('l01_wall_west_south', (2, .9, -2), (.18, 1.8, 2), (191, 190, 168, 255))
piece('l01_wall_west_north', (2, .9, .5), (.18, 1.8, 1), (191, 190, 168, 255))
piece('l01_wall_east', (4, .9, -1), (.18, 1.8, 4), (156, 161, 149, 255))
piece('l01_wall_north', (3, .9, 1), (2, 1.8, .18), (174, 184, 174, 255))
piece('l01_wall_south', (3, .9, -3), (2, 1.8, .18), (174, 184, 174, 255))
piece('l01_door_main', (2, .9, -.5), (.21, 1.8, 1), (77, 93, 101, 255))
piece('l01_fence', (-1, .53, -.5), (.18, 1.06, 3), (116, 94, 76, 255))
piece('l01_mailbox', (-2.5, .58, .5), (.55, 1.15, .6), (225, 172, 103, 255))
piece('l01_sign', (1.61, 1.73, 1.4), (.68, .36, .16), (127, 200, 189, 255))

out.parent.mkdir(parents=True, exist_ok=True)
blob = scene.export(file_type='glb')
out.write_bytes(blob)
assert blob[:4] == b'glTF' and struct.unpack('<I', blob[4:8])[0] == 2
length = struct.unpack('<I', blob[8:12])[0]
assert length == len(blob), (length, len(blob))
json_size, json_type = struct.unpack('<II', blob[12:20])
assert json_type == 0x4E4F534A
obj = json.loads(blob[20:20+json_size])
names = [n.get('name') for n in obj['nodes']]
assert all(n in names for n in [
    'l01_wall_west_south', 'l01_wall_west_north', 'l01_wall_east', 'l01_wall_north',
    'l01_wall_south', 'l01_door_main', 'l01_fence', 'l01_mailbox', 'l01_sign'
]), names
print(f'{out}: {len(blob)} bytes, {len(obj["nodes"])} nodes, {len(obj["meshes"])} meshes')
