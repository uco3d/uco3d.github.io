import re

# 读取log文件内容
with open('8192.log', 'r') as file:
    log_content = file.read()

# 使用正则表达式匹配每个epoch的测试结果
epoch_tests = re.findall(r'Test:.+?iou of the network on the \d+ test images: nan', log_content, re.DOTALL)

for i, epoch_test in enumerate(epoch_tests):
    # 从每个epoch的测试结果中提取IoU数值
    iou_values = re.findall(r'iou: (\d+\.\d+) \(', epoch_test)
    
    # 将IoU字符串转换为浮点数
    iou_values = [float(iou) for iou in iou_values]
    
    # 计算当前epoch的平均IoU
    avg_iou = sum(iou_values) / len(iou_values)
    
    print(f'Epoch [{i}] Average IoU: {avg_iou:.4f}')