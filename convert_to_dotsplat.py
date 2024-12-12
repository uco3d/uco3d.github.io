# You can use this to convert a .ply file to a .splat file programmatically in python
# Alternatively you can drag and drop a .ply file into the viewer at https://antimatter15.com/splat

import argparse

import glob
import os
import shutil
import struct
import xml.etree.ElementTree as ET
from io import BytesIO

import numpy as np
from plyfile import PlyData


def process_ply_to_splat(ply_file_path):
    plydata = PlyData.read(ply_file_path)
    vert = plydata["vertex"]
    sorted_indices = np.argsort(
        -np.exp(vert["scale_0"] + vert["scale_1"] + vert["scale_2"])
        / (1 + np.exp(-vert["opacity"]))
    )
    buffer = BytesIO()
    for idx in sorted_indices:
        v = plydata["vertex"][idx]
        position = np.array([v["x"], v["y"], v["z"]], dtype=np.float32)
        scales = np.exp(
            np.array(
                [v["scale_0"], v["scale_1"], v["scale_2"]],
                dtype=np.float32,
            )
        )
        rot = np.array(
            [v["rot_0"], v["rot_1"], v["rot_2"], v["rot_3"]],
            dtype=np.float32,
        )
        SH_C0 = 0.28209479177387814
        color = np.array(
            [
                0.5 + SH_C0 * v["f_dc_0"],
                0.5 + SH_C0 * v["f_dc_1"],
                0.5 + SH_C0 * v["f_dc_2"],
                1 / (1 + np.exp(-v["opacity"])),
            ]
        )
        buffer.write(position.tobytes())
        buffer.write(scales.tobytes())
        buffer.write((color * 255).clip(0, 255).astype(np.uint8).tobytes())
        buffer.write(
            ((rot / np.linalg.norm(rot)) * 128 + 128)
            .clip(0, 255)
            .astype(np.uint8)
            .tobytes()
        )

    return buffer.getvalue()


def save_splat_file(splat_data, output_path):
    with open(output_path, "wb") as f:
        f.write(splat_data)


# First sync the gaussians:
# rsyncgai '/opt/hpcaas/.mounts/fs-0663e2d3c38211883/home/dnovotny/uco3d/internal/webpage_gaussians/*' ./uCO3D/

splat_dir = "uCO3D/"
output_splat_dir = "uCO3D_splat/"
outxml = "list_ply_uco3d.xml"
os.makedirs(output_splat_dir, exist_ok=True)
splats = sorted(glob.glob(os.path.join(splat_dir, "*.ply")))


xml_root = ET.Element("splats")

for input_file in splats:
    seq_name = os.path.splitext(os.path.basename(input_file))[0]
    input_file_thumb = input_file.replace(".ply", ".png")
    input_file_caption = input_file.replace(".ply", ".caption")
    if False:
        # no thumb
        input_file_thumb = os.path.join(splat_dir, "default_thumb.png")

    output_file = os.path.join(output_splat_dir, seq_name, "splat.splat")
    output_file_thumb = output_file.replace("splat.splat", "input.png")
    output_file_caption = output_file.replace("splat.splat", "caption.caption")

    splat_data = process_ply_to_splat(input_file)

    print(output_file)
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    save_splat_file(splat_data, output_file)
    shutil.copyfile(input_file_thumb, output_file_thumb)
    shutil.copyfile(input_file_caption, output_file_caption)

    xml_splat_el = ET.SubElement(xml_root, "Key")
    xml_splat_el.text = os.path.join(output_splat_dir, seq_name, "splat.splat")
    xml_splat_el = ET.SubElement(xml_root, "Key")
    xml_splat_el.text = os.path.join(output_splat_dir, seq_name, "input.png")

# Create an ElementTree object from the root element
tree = ET.ElementTree(xml_root)

# Write the xml so that it has indentation:
tree.write(outxml)
with open(outxml, "r") as f:
    print(f.read())
