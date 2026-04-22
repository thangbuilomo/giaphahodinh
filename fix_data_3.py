import json

with open("gia_pha_ho_dinh.json", "r", encoding="utf-8") as f:
    data = json.load(f)

vinh_phuc = "Thôn Lực Điền, xã Hoàng Lấu, huyện Tam Dương, tỉnh Vĩnh Phúc. Nay là thôn Đồng Lực, xã Hoàng An, tỉnh Phú Thọ"
hai_phong_names = ["Nguyễn Văn Thanh", "Nguyễn Văn Đức", "Nguyễn Hoàng Bách"]

for d in data:
    if d['name'] in hai_phong_names:
        d['hometown'] = "Hải Phòng"
    else:
        # Previously we set some to Hai Phong, now reset to Vinh Phuc except if it was empty, we can set Vinh Phuc.
        d['hometown'] = vinh_phuc

with open("gia_pha_ho_dinh.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=4)

print("JSON Data Hometown Fixed")
