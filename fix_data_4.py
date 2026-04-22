import json

with open("gia_pha_ho_dinh.json", "r", encoding="utf-8") as f:
    data = json.load(f)

node_map = {d['id']: d for d in data}

vinh_phuc = "Thôn Lực Điền, xã Hoàng Lấu, huyện Tam Dương, tỉnh Vĩnh Phúc. Nay là thôn Đồng Lực, xã Hoàng An, tỉnh Phú Thọ"
hai_phong_names = ["Nguyễn Văn Thanh", "Nguyễn Văn Đức", "Nguyễn Hoàng Bách"]

# Gather descendants of 3 and 60
hp_descendants = set()
queue = ['3', '60']
while queue:
    curr = queue.pop()
    for d in data:
        if d.get('pid') == curr and d['id'] not in hp_descendants:
            hp_descendants.add(d['id'])
            queue.append(d['id'])
    
    # Add spouses of descendants (or if "toàn bộ con cháu", spouses too)
    curr_node = node_map.get(curr)
    if curr_node:
        for p in curr_node.get('pids', []):
            if p not in hp_descendants and curr not in ['3', '60']:
                hp_descendants.add(p)
                
# Spouses of 3 and 60: 4, 61. Should they be HP or VP? "Nhà bà Vệ" -> usually spouses are included. 
# But user said "Toàn bộ con cháu bà Loan và Bà Vệ quê quán ở Hải Phòng". Meaning ID 4 and 61 could be HP. I'll add them to hp_descendants.
for idx in ['3', '60']:
    for p in node_map[idx].get('pids', []):
        hp_descendants.add(p)

for d in data:
    d['hometown'] = vinh_phuc
    if d['id'] in hp_descendants:
        d['hometown'] = "Hải Phòng"
    if d['name'] in hai_phong_names:
        d['hometown'] = "Hải Phòng"

with open("gia_pha_ho_dinh.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=4)

print("Data Fixed 4")
