# Hướng dẫn Phát triển Webapp Gia Phả (Family Tree)

Dựa trên yêu cầu của bạn, đây là một tài liệu hướng dẫn chi tiết về các chức năng, công nghệ đề xuất (Tech Stack) và tiến trình phát triển (Roadmap) dành cho ứng dụng Web Gia Phả.

## 1. Danh sách Chức năng (Features)

### 1.1 Tính năng Dành cho Người dùng (User/Viewer)
- **Sơ đồ cây tương tác**: Hiển thị gia phả dưới dạng cây. Người dùng có thể zoom, pan, cuộn để xem.
- **Hiển thị Người Liên quan**: 
  - Chọn một người làm điểm nhấn trên sơ đồ.
  - Ứng dụng sẽ tự động làm nổi bật (highlight) các thành viên có liên quan trực tiếp (như: Cha mẹ, Vợ chồng, Con cái) xung quanh người đó, đồng thời làm mờ (focus outline) các nhánh không liên quan. Mối quan hệ gọi xưng hô sẽ được cập nhật sau.
- **Xem Chi tiết Thông tin**: Hiển thị popup chứa ngày sinh, tên hiệu, quê quán (tính năng hiển thị ảnh chân dung tạm thời bỏ để tinh giản tối đa dự án).
- **Xuất PDF**: Cho phép xuất toàn bộ cây gia phả hoặc vẽ lại và xuất riêng phần của một nhánh/cành cụ thể ra file PDF. Xuất ra chỉ cần thông tin là họ tên đầy đủ và ngày tháng năm sinh

### 1.2 Tính năng Admin (Quản lý)
- **Thêm/Sửa/Xóa thành viên thủ công**: Form nhập các trường thông tin cơ bản: Tên, Tên hiệu, Ngày sinh, Quê quán, Cha/Mẹ là ai, Vợ/Chồng là ai.
- **Đăng nhập/Đăng ký**: Cho phép người dùng đăng ký tài khoản và đăng nhập để sử dụng các tính năng của ứng dụng. Chỉ có admin mới có quyền thêm/sửa/xóa thành viên. Admin có thể thêm người dùng và phân quyền cho người dùng.
- **Số hóa dữ liệu từ file Word (.doc/.docx)**: Bạn có thể đưa file bản in của bác bạn cho AI (như ChatGPT, Gemini) để nó tự động đọc hiểu và chuyển đổi thành cấu trúc chuẩn (JSON/SQL). Việc này sẽ sinh ra thẳng bộ database mà không cần người nhập liệu tay.
- **Import dữ liệu tự động**: Cung cấp công cụ import hàng loạt từ file JSON hoặc Markdown sau khi được AI xử lý ở trên.

---

## 2. Công nghệ Đề xuất (Tech Stack)

### 2.1 Backend (Xử lý Data)
- **Ngôn ngữ / Framework**: **Node.js (viết gộp ngay trong rễ Next.js API Routes)**. Lựa chọn này vô cùng nhẹ, giúp ứng dụng trở thành 1 khối fullstack cực kỳ gọn gàng.
- **Cơ sở dữ liệu (Database)**: **SQLite**. 
  - Đây là cấu hình lý tưởng nhất cho việc chạy trên **Raspberry Pi 3**. Bạn không cần phải cài các server DB cồng kềnh ngốn RAM như PostgreSQL, cũng chẳng cần thuật toán đồ thị của Neo4j ở giai đoạn này. Dữ liệu chỉ lưu trong 1 file nhỏ, dễ backup, di chuyển, mà vẫn đủ tải hàng nghìn bản ghi dòng họ.

### 2.2 Frontend (Giao diện Web)
- **Framework**: **Next.js (React)** - Tối ưu SEO, tạo trang load nhanh.
- **Thư viện Vẽ Sơ đồ (Tree Diagram)**: 
  - **d3-org-chart** kết hợp **D3.js**: Thư viện mạnh mẽ nhất để làm cái cây đẹp, mượt và rất hợp cho sờ đồ tổ chức / gia phả.
  - **ReactFlow** hoặc **balkan family tree js**: Nếu muốn làm theo dạng node linh hoạt có thể kéo thả.
- **Giao diện (Minimalist UI)**: Thiết kế giao diện theo phong cách tối giản (Minimalist), tận dụng không gian trắng và chỉ hiển thị thông tin bằng **Tailwind CSS**. Dùng các tông màu sáng, nhạt, loại bỏ các chi tiết phức tạp che khuất sơ đồ.
- **Xuất PDF**: 
  - Dùng **html2canvas** + **jsPDF** (client-side) để chụp khung hình tree lại thành PDF.
  - Hoặc dùng **Puppeteer** (server-side) để in PDF chất lượng cao.

---

## 3. Quy trình Số hóa File Bản In bằng AI
Để không phải nhập tay dữ liệu từ cuốn sổ in của bác bạn, quy trình tiến hành sẽ gồm:
1. Bạn xin bản Word (.doc/.docx) hoặc quét text từ các trang bản in.
2. Bạn mở trực tiếp với AI (như Claude, LLM, Gemini) và truyền cho AI nội dung văn bản.
   - Viết prompt định dạng lại cấu trúc. Ví dụ: *"Tạo cho tôi một mảng JSON danh sách các gia đình, bao gồm Tên người lớn, Năm sinh, Tên các con..."*
3. AI trả lại file chuẩn (JSON hoặc SQL script).
4. Hệ thống Webapp của chúng ta chỉ việc đọc file JSON này và ghi xuống **SQLite** database, tự tạo ra sơ đồ hoàn chỉnh. Tiết kiệm 99% công sức nhập liệu!

---

## 4. Tiến trình Phát triển (Roadmap)

### Giai đoạn 1: Chuẩn bị & Database (7 - 10 ngày)
1. Thiết kế dữ liệu mẫu (Mock data) của một nhánh gia tộc tầm 10-20 người.
2. Xây dựng Database Schema (Bảng Người, Bảng Quan hệ: Cha Con, Vợ Chồng).
3. Làm Backend API CRUD (Tạo, Sửa, Xóa thông tin cá nhân).

### Giai đoạn 2: Thuật toán & Giao diện Cây (10 - 14 ngày)
1. Viết API lấy dữ liệu toàn bộ cây.
2. Tích hợp thư viện *d3-org-chart* trên Frontend để hiển thị sơ đồ theo thiết kế tối giản, loại bớt hiệu ứng màu mè.
3. Code tính năng "Highlight" người liên quan khi click: ẩn mờ những người ngoài lề, làm sáng nổi bật nhánh trực hệ.

### Giai đoạn 3: Module Admin (3 - 5 ngày)
1. Xây dựng trang Admin dùng thẻ bảo mật (Login).
2. Viết Form nhập thông tin cơ bản (Tạm thời bỏ hoàn toàn tính năng xử lý, upload hình ảnh).

### Giai đoạn 4: Import tự động & Xuất PDF (7 - 10 ngày)
1. Xây dựng parser (trình phân tích cú pháp) cho Markdown/HTML. Dùng Regex để tách tên, ngày sinh, quê quán và mối quan hệ từ file text đẩy ngược lên CSDL.
2. Cài đặt Server-side PDF generation (Puppeteer) hoặc dùng jsPDF để render Tree thành PDF tải xuống.

### Giai đoạn 5: Deploy trên Pi 3 và Cập nhật dữ liệu
1. Kiểm tra kĩ trên Mobile (cực kì quan trọng vì vẽ UI Tree trên Mobile cần tinh chỉnh kích cỡ node cho hợp lý, cảm ứng mượt).
2. Tối ưu code deploy lên trên máy **Raspberry Pi 3** trong mạng cục bộ nội bộ để vừa dùng tài khoản Admin kiểm tra, chỉnh sửa, thêm bớt thành viên.
3. Khi ưng ý, share tạm ra nội bộ cho gia đình xem qua **Cloudflare Tunnels**.
4. **Lưu trữ Trọn bộ lên Git**: Sau khi hoàn thiện hệ thống và dữ liệu Database, tiến hành đẩy (Git Commit & Push) một bản gốc gồm toàn bộ mã nguồn cũng như file SQLite `.db` lên kho chứa GitHub (Private Repo) để làm bản sao lưu an toàn vĩnh viễn.

### Giai đoạn 6: Đóng gói Tĩnh JSON & Deploy Github Pages
Sử dụng một nhánh khác (Branch) từ bộ code hoặc copy ra 1 phiên bản chỉ chuyên dùng để deploy.
1. **Chuyển đổi Dữ liệu**: Kết xuất bộ cơ sở dữ liệu (SQLite) thành 1 file tĩnh `data.json` duy nhất.
2. **Loại bỏ tính năng thừa**: Cấu hình bản này không cần dùng DB trực tiếp nữa, chỉ đọc từ file json. Tắt bỏ toàn bộ module Admin, Form thêm sửa xóa, chức năng Login.
3. **Build Static HTML**: Dùng file `data.json`, Next.js sẽ build dự án thành phiên bản Web tĩnh (chỉ còn HTML/CSS/JS thuần túy). Mọi thao tác Zoom, Click highlight của người xem vẫn hoạt động trơn tru.
4. **Đẩy lên GitHub Pages**: Đẩy thư mục tĩnh mới build sang nhánh dùng cho Github Pages. Chạy miễn phí trọn đời và có thể gắn domain gia phả của dòng họ vào (ví dụ: `ho-nguyen.vn`).
