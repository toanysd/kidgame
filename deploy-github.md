---
description: Deploy/Update code sạch (Clean Deploy) lên GitHub tự động do AI điều khiển
---

# Quy trình đẩy code lên GitHub tự động (Clean Deployment)

**NGUYÊN TẮC TỐI THƯỢNG:** 
- KHÔNG TỰ Ý git push/deploy lên GitHub khi người dùng chưa có yêu cầu. 
- BẮT BUỘC đợi người dùng xác nhận code đã chạy đúng trên máy tính (local) rồi, nếu người dùng yêu cầu đưa lên github thì mới được làm.

Khi User yêu cầu "cập nhật lên github", "đưa code lên github" hoặc gọi lệnh `/deploy-github`, AI **BẮT BUỘC** thực hiện các bước sau để đảm bảo không rò rỉ (leak) dữ liệu AI, Lịch sử Chat, Agent Config lên Kho lưu trữ Công khai:

// turbo-all

1. **Tìm & Chuẩn bị Trạm Trung Chuyển (Syncs):**
   - Trạm trung chuyển Git KHÔNG BAO GIỜ nằm trong thư mục `Releases\`. Theo quy tắc Đại Cung Điện, bạn PHẢI sử dụng cấu trúc `G:\AntiGravity\syncs\[Tên_Dự_Án_Hiện_Tại]_syncs`. (VD: `G:\AntiGravity\syncs\MoldCutterSearch_syncs`).
   - Nếu thư mục Sync này chưa tồn tại, hãy chạy `git clone https://github.com/toanysd/[Tên_Dự_Án] "G:\AntiGravity\syncs\[Tên_Dự_Án]_syncs"`.
   - **HIỆU LỆNH CẤM KỴ:** KHÔNG BAO GIỜ dùng lệnh xóa (Remove/Force wipe) toàn bộ thư mục Sync hoặc biến repo thành mới hoàn toàn (phá vỡ lịch sử `git init` mới). Các thư mục tồn tại trên Remote (ví dụ: `moldcutter-backend`, ...) tuyệt đối không được xóa bỏ chỉ vì chúng không xuất hiện trong thư mục Front-End làm việc hiện tại.

2. **Chép Đè Lọc Lõi (Smart Copy):** 
   - Đọc file `index.html` của thư mục làm việc hiện tại (`Projects`), lập danh sách thư mục và file tinh khiết (các file `.js`, `.css`, `plastic`, vv. phục vụ chạy app).
   - Chỉ dùng lệnh `Copy-Item ... -Force` để chép chính xác những thư mục/file mã nguồn vừa được lập danh sách đè sang `syncs\[Tên_Dự_Án]_syncs`. Tuyệt đối không copy file rác/backup/ảnh nháp.

3. **Kiểm tra trạng thái cấu trúc (Git Status) tại Trạm Trung Chuyển:**
   - Đổi hướng (cd) sang `G:\AntiGravity\syncs\[Tên_Dự_Án]_syncs`.
   - Chạy `git status` và `git diff --stat` để kiểm tra chính xác những file mã nguồn CÓ SỰ THAY ĐỔI THỰC SỰ so với Remote. Điều này đảm bảo minh bạch, không commit dư thừa.

4. **Giao tiếp & Đề xuất Message:** Tạo tóm tắt ngắn gọn (ví dụ: "Update Plastic Manager UI, Fix logic"). Hỏi User: "Mình chuẩn bị commit các file đã thay đổi với lời nhắn: [XXX]. Bạn đồng ý chứ?"
   
5. **Dừng và chờ phản hồi từ User.**

6. **Commit & Push:** Khi User đồng ý:
   - Tại `G:\AntiGravity\syncs\[Tên_Dự_Án]_syncs`:
     - Chạy `git add .` (Đảm bảo lệnh báo cáo không dính líu đến xóa thư mục độc lập trên server).
     - Chạy `git commit -m "[Lời nhắn đã được duyệt]"`
     - Chạy `git push origin main`

7. **Báo cáo:** Thông báo hoàn tất và gửi link repo https://github.com/toanysd/[Tên_Dự_Án]
