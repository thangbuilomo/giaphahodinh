# Prompt Mẫu Để Xử Lý Gia Phả Bằng AI

Bạn hãy copy đoạn Prompt này cùng với việc đính kèm file PDF/Ảnh chụp của gia phả để đưa cho các AI (khuyên dùng **Google Gemini 1.5 Pro** hoặc **ChatGPT 4o** vì dải nhận biết ngữ cảnh rộng và đọc file mượt):

---

**[COPY TỪ ĐÂY ĐỂ ĐƯA CHO AI]**

Bạn là một chuyên gia về xử lý dữ liệu và cấu trúc hóa phả hệ (Family Tree). Tôi sẽ cung cấp cho bạn một đoạn nội dung (text/pdf/ảnh) được quét từ sách gia phả. Trong đó có các thông tin về Tên, Năm sinh, và các mối quan hệ (ai là cha, ai là con, ai là vợ/chồng,...).

Nhiệm vụ của bạn là đọc hiểu thông tin, suy luận logic mối quan hệ huyết thống và chuyển đổi TOÀN BỘ dữ liệu đó thành một mảng Array JSON tiêu chuẩn. TUYỆT ĐỐI KHÔNG được bỏ sót bất kỳ cá nhân nào có tên trong tài liệu.

Cấu trúc mỗi người (hiểu là một Node) trong JSON phải tuân thủ chính xác format sau đây:
```json
[
  {
    "id": "Mã tự sinh tự động (Ví dụ: 1, 2, 3... bắt buộc là string chữ số)",
    "name": "Họ và tên đầy đủ",
    "nick_name": "Tên hiệu, biệt danh, bí danh, tên thường gọi, tên tiếng Anh (nếu có)",
    "gender": "male hoặc female (tự suy luận qua giới tính/mối quan hệ)",
    "birth_date": "Năm sinh (hoặc ngày tháng năm sinh nếu có)",
    "hometown": "Quê quán (nếu có văn bản nhắc đến)",
    "title": "Tên hiệu / Thông tin vai vế (ví dụ: Con trưởng, Đời thứ 3... nếu có)",
    "pid": "ID của người Cha hoặc Mẹ ruột (nếu người này là Cụ Tổ đỉnh cây thì để trống)",
    "pids": ["ID của Vợ hoặc Chồng (nếu có)"],
    "notes": "Các ghi chú khác như: Năm mất, mộ táng tại đâu... (nếu có)"
  }
]
```

**Quy tắc logic bắt buộc:**
1. Hãy dựa vào văn bản để liên kết `pid` (thuộc về ai) và `pids` (kết hôn với ai) cho thật trúng.
2. Hai vợ chồng phải có ID riêng biệt. Chồng sẽ có ID của vợ trong mảng `pids`, và ngược lại Vợ cũng chứa lD của chồng trong mảng `pids`. 
3. Chỉ output ra định dạng JSON chuẩn. Không in thêm định dạng Markdown, không giải thích dài dòng để tôi thuận tiện Copy/Paste.

**Dữ liệu văn bản gia phả cần xử lý:**
[BẠN DÁN THÊM TEXT HOẶC ĐÍNH KÈM FILE PDF/SCAN Ở ĐÂY]

---
**[KẾT THÚC COPY]**
