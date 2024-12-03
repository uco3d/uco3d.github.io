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
            for _ in range(element_count):
                element_line = data[current_index:data.find(b'\n', current_index)]
                element_data.append(element_line)
                current_index += len(element_line) + 1
            body_data[element_type] = element_data
        
        return header, body_data

# 使用示例
file_path = './uCO3D/3-96994-66765.ply'
header, body_data = read_ply(file_path)

print("Header:")
print('\n'.join(header))

print("Body Data:")
for element_type, data in body_data.items():
    print(f"{element_type}: {len(data)} elements")
    #print(data[:5])  # 打印前5行数据