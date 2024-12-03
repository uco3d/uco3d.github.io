import struct
import os

def read_ply(file_path):
    with open(file_path, 'rb') as file:
        data = file.read()

        # 解析Header
        header_end_index = data.find(b'end_header') + len(b'end_header')
        header_data = data[:header_end_index]
        header = header_data.decode('ascii').split('\n')
        
        elements = {}
        for line in header:
            if line.startswith('element'):
                _, element_type, element_count = line.split()
                elements[element_type] = int(element_count)
        
        # 解析Body
        body_data = {}
        current_index = header_end_index + 1
        for element_type, element_count in elements.items():
            element_data = []
            if element_type == 'vertex':
                for _ in range(element_count):
                    x, y, z, r, g, b = struct.unpack('<fffBBB', data[current_index:current_index+15])
                    element_data.append((x, y, z, r, g, b))
                    current_index += 15
            else:
                for _ in range(element_count):
                    element_line = data[current_index:data.find(b'\n', current_index)]
                    element_data.append(element_line)
                    current_index += len(element_line) + 1
            body_data[element_type] = element_data
        
        return header, body_data

def write_splat(file_path, header, body_data):
    with open(file_path, 'wb') as file:
        # 写入Splat Header
        file.write(b'SPLAT')
        file.write(struct.pack('<I', 1))  # 版本号
        
        vertex_count = len(body_data['vertex'])
        file.write(struct.pack('<I', vertex_count))
        
        # 写入Splat Body
        for vertex in body_data['vertex']:
            x, y, z, r, g, b = vertex
            file.write(struct.pack('<fff', x, y, z))
            file.write(struct.pack('<BBB', r, g, b))

# 使用示例
input_file = './uCO3D/429-47972-52705.ply'
output_file = './uCO3D/429-47972-52705.splat'

header, body_data = read_ply(input_file)
write_splat(output_file, header, body_data)

print(f"Conversion complete. Output file: {output_file}")