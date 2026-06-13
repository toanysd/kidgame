# Antigravity Core Rules

Đây là bộ quy tắc cốt lõi điều hướng cách AI Antigravity hoạt động trong dự án.

## 1. Quy tắc Lõi (Bắt buộc)
- **Luôn mở đầu câu trả lời với dòng:** "ĐÃ ÁP DỤNG QUY TẮC CHO PHẦN TRẢ LỜI DƯỚI ĐÂY"
Điều này đảm bảo mỗi khi bạn trả lời mà không có dòng chữ đó thì tức là bạn đã không áp dụng quy tắc, và các quy tắc khác cũng bị bỏ qua.

## 2. Quy tắc Quản lý và Đồng bộ Phiên bản (Multi-Session Sync / Local Context)
Đây là quy tắc TỐI QUAN TRỌNG để chặn đứng lỗi ghi đè ký ức khi AI làm việc đa dự án trong Workspace chung. Toàn bộ Trí nhớ (Context) phải được ghim cứng vào thư mục lõi của từng dự án thông qua cơ chế `.ai/` Local Box.
- Tại **CUỐI PHIÊN LÀM VIỆC** (hoặc khi lưu lịch sử, save-session): AI BẮT BUỘC KHÔNG XUẤT file `SESSION_CONTEXT.md` hay Artifacts ra thư mục gốc `f:\AntiGravity` vì sẽ gây ghi đè. Thay vào đó, AI phải trút toàn bộ Kế hoạch, Task, Roadmap, Walkthrough và Context vào thư mục con `.ai/` của đúng dự án đang thao tác.
  - Cú pháp chuẩn: `[Workspace_Root]\[Tên_Dự_Án]\.ai\SESSION_CONTEXT.md` (Vd: `f:\AntiGravity\ysdms-nextgen\.ai\SESSION_CONTEXT.md`).
- Tại **ĐẦU PHIÊN LÀM VIỆC** (hoặc khi resume-session): AI chỉ cần đọc file Ký ức bằng lệnh `view_file` trong chính thư mục `.ai/` của Repo đang kéo về (qua Git). Nếu cần thiết, dùng Native Tool `write_to_file` (với `IsArtifact: true`) để "bừng sáng" lại UI Artifacts trên Nền tảng AI cục bộ. Cơ chế này đảm bảo tự động đồng bộ chéo giữa nhiều máy khi User dùng Git để Sync.

## 3. Quy tắc Quản lý Bản Đồ Tổng Thể (Master Blueprint)
Hệ thống Kế hoạch (`implementation_plan.md`) trên giao diện IDE chỉ mang tính chiến thuật (Tactical) dùng để giải quyết từng chức năng nhỏ (ghi đè liên tục). Để User có tầm nhìn Toàn cục (Strategic), AI bắt buộc duy trì một **Sổ Cái Thiết Kế (Master Blueprint)**.
- **Vị trí Sổ Cái:** Lõi kiến trúc nằm ở `g:\AntiGravity\.agents\mempalace\blueprints\[Tên_Dự_Án]_MASTER.md`.
- **Hành động bắt buộc:** Mỗi khi chức năng (Phase/Feature) nhỏ đang thảo luận tại `implementation_plan.md` được User **Phê duyệt thao tác (Approve) hoặc Code xong**, AI PHẢI dùng lệnh chỉnh sửa file hoặc ghi chèn, thêm Tóm tắt nhanh rẽ nhánh logic vào phía cuối (Append) của file `[Tên_Dự_Án]_MASTER.md`.
- Tuyệt đối **không được chép đè/xóa bỏ** lịch sử xây dựng cũ trong Sổ Cái. Mọi thay đổi kiến trúc đều phải được lưu trữ dạng dòng thời gian.

## 4. Chiến thuật Phối hợp YSDMS (Perplexity ↔ Antigravity)
Nguyên tắc cốt lõi: Phân chia theo khả năng mạnh nhất của mỗi AI để tối ưu luồng công việc.
- **Perplexity phụ trách (Cloud/DB):** Giao tiếp Supabase qua MCP (đọc schema, chạy migration thật), chuyển đổi dữ liệu Python Script, đọc log lỗi server, audit bảo mật.
- **Antigravity phụ trách (IDE/Ổ cứng):** Đọc/ghi file nội bộ dự án, viết toàn bộ ứng dụng Next.js/TypeScript (UI, Server Actions), viết kịch bản SQL Migration thô để Perplexity thực thi, dọn dẹp mã và Push lên GitHub.

**SOP Giao Tiếp Giai Đoạn Mới**:
1. **[SCHEMA SNAPSHOT]** Perplexity quét DB thực tế, gởi TypeScript/DDL cho Antigravity làm căn cứ.
2. **[MIGRATION REQUEST]** Antigravity thiết kế ra file `.sql`. User copy gởi Perplexity thực thi. Perplexity xác nhận chạy thành công.
3. Antigravity code Frontend/UI tương thích. User chạy thử.
4. Sau khi chốt mọi thứ thành công, Antigravity lưu phiên và Push GitHub.

## 5. Bức Tường Lửa Cung Điện & Cloud (BẮT BUỘC BẬT)
- **Tối Quan Trọng L0:** Bất kể bạn có nhớ quy tắc nào hay không, ở đầu mỗi phiên BẠN BẮT BUỘC PHẢI CHẠY `view_file` lên `f:\AntiGravity\.agents\mempalace\identity.txt` để lấy hồn cốt Hệ sinh thái.
- **Tường Lửa GitHub:** KHÔNG BAO GIỜ ĐƯỢC CHẠY GÕ TRỰC TIẾP `git commit`, `git push` từ thư mục `Projects`. BẮT BUỘC phải đọc Workflow `/deploy-github.md` trước khi deploy để đồng bộ qua trạm `syncs`. Hành động vượt rào/push thẳng sẽ bóp méo lịch sử Server.
