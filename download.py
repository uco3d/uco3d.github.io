import os
import requests
from xml.etree import ElementTree as ET

def download_file(url, local_filename):
    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        os.makedirs(os.path.dirname(local_filename), exist_ok=True)
        with open(local_filename, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192): 
                f.write(chunk)

def main():
    bucket_url = "https://storage.googleapis.com/mf_gaussian_splats"
    
    # 下载XML文件
    xml_url = bucket_url
    xml_str = requests.get(xml_url).text
    
    # 解析XML
    root = ET.fromstring(xml_str)
    
    # 创建下载目录
    download_dir = "gaussian_splats"
    os.makedirs(download_dir, exist_ok=True)
    
    # 遍历XML中的文件
    for contents in root.findall("{http://doc.s3.amazonaws.com/2006-03-01}Contents"):
        key = contents.find("{http://doc.s3.amazonaws.com/2006-03-01}Key").text
        
        if key.endswith(".png") or key.endswith(".ply"):
            file_url = f"{bucket_url}/{key}"
            local_filename = os.path.join(download_dir, key)
            
            print(f"Downloading {file_url} to {local_filename}")
            download_file(file_url, local_filename)

if __name__ == "__main__":
    main()