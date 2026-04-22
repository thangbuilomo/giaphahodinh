# Gia Phả Họ Đinh

Dự án quản lý và hiển thị sơ đồ gia phả cho họ Đinh với nhiều chế độ hiển thị khác nhau.

## Các tính năng chính
- **Sơ đồ Ngang:** Hiển thị cây gia phả theo chiều ngang.
- **Sơ đồ Dọc:** Hiển thị cây gia phả theo chiều dọc.
- **Bản in (Compact):** Tối ưu hóa cho việc in ấn với thiết kế trắng đen, tinh gọn.
- **Compact 2:** Phiên bản siêu gọn với khả năng xếp chồng các thế hệ để tiết kiệm diện tích.

## Cách chạy dự án
Dự án là một trang web tĩnh kết hợp với dữ liệu JSON. Bạn có thể chạy nhanh bằng cách sử dụng Python:

1. Mở terminal tại thư mục dự án.
2. Chạy lệnh:
   ```bash
   python -m http.server 8000
   ```
3. Truy cập vào địa chỉ: `http://localhost:8000`

## Cấu trúc dữ liệu
Dữ liệu chính nằm trong tệp `gia_pha_ho_dinh.json`. Các tệp JavaScript (`script.js`, `compact-layout.js`, v.v.) sẽ đọc dữ liệu này và vẽ sơ đồ bằng thư viện D3.js.
