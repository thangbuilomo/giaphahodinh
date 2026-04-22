import json

with open("gia_pha_ho_dinh.json", "r", encoding="utf-8") as f:
    data = json.load(f)

for d in data:
    # Update Hometown
    if d['id'] not in ['1', '2', '3', '60']:
        d['hometown'] = "Hải Phòng"
        
    # Update Names
    name = d['name']
    if name == "Bùi Thị Phương Anh": d['name'] = "Bùi Phương Anh"
    if "Nguyễn Bính Hà" in name: d['name'] = "Nguyễn Bích Hà"
    if name == "Trương Kế Nguyên": d['name'] = "Trương Kế Nguyên Domome Chung"
    if name == "Trương Nguyễn Minh Trung": d['name'] = "Trương Nguyễn Minh Trung Dustin"

with open("gia_pha_ho_dinh.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=4)

print("JSON Fixed")
