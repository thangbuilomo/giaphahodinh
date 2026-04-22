import json
import re

with open("gia_pha_ho_dinh.json", "r", encoding="utf-8") as f:
    data = json.load(f)

node_map = {d['id']: d for d in data}

# Gather all descendants of node 3 (Vệ) and 60 (Loan)
hp_nodes = set(['3', '60'])
queue = ['3', '60']
while queue:
    curr = queue.pop()
    # add all children
    for d in data:
        if d.get('pid') == curr and d['id'] not in hp_nodes:
            hp_nodes.add(d['id'])
            queue.append(d['id'])
    # add spouses of current person into HP too (optional, but "nhà bà Vệ" implies everyone in the branch)
    curr_node = node_map.get(curr)
    if curr_node:
        for sp in curr_node.get('pids', []):
            if sp not in hp_nodes:
                hp_nodes.add(sp)

for d in data:
    # Set hometown
    if d['id'] in hp_nodes:
        d['hometown'] = "Hải Phòng"
    else:
        d['hometown'] = "Thôn Lực Điền, xã Hoàng Lấu, huyện Tam Dương, tỉnh Vĩnh Phúc. Nay là thôn Đồng Lực, xã Hoàng An, tỉnh Phú Thọ"

    # Fix notes for Deaths
    notes = d.get('notes', '')
    if notes:
        # Standardize known death string formats based on exact strings from JSON
        if "11/02/1988" in notes: d['notes'] = "Mất: ngày 11 tháng 02 năm 1988"
        elif "19 tháng chạp năm 2010" in notes: d['notes'] = "Mất: ngày 19 tháng 12 năm 2010 (AL)"
        elif "25/7/1950" in notes: d['notes'] = "Mất: ngày 25 tháng 07 năm 1950"
        elif "Mất 1952" in notes: d['notes'] = "Mất: năm 1952"
        elif "16/5/1959" in notes: d['notes'] = "Mất: ngày 16 tháng 05 năm 1959"
        elif "4 tháng giêng năm 2013" in notes: d['notes'] = "Mất: ngày 04 tháng 01 năm 2013 (AL)"
        elif "17/2/2022" in notes: d['notes'] = "Mất: ngày 17 tháng 02 năm 2022 (AL)"
        elif "mới sinh" in notes: d['notes'] = "Mất: khi mới sinh"
        elif "sinh non" in notes: d['notes'] = "Mất: khi sinh non"
        elif "16/5/1989" in notes: d['notes'] = "Mất: ngày 16 tháng 05 năm 1989"
        elif d['id'] == '15': d['notes'] = "Mất: ngày 25 tháng 07 năm 1950"
        elif d['id'] == '16': d['notes'] = "Mất: năm 1952"
        elif d['id'] == '17': d['notes'] = "Mất: ngày 16 tháng 05 năm 1959"

with open("gia_pha_ho_dinh.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=4)

print("JSON Fixed 2")
