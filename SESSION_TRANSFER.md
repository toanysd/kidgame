# KidGame (Fruit Ninja Motion) — Session Transfer

## 1. Trạng Thái Dự Án (Project State)
Dự án đã được đồng bộ hóa hoàn toàn lên GitHub tại: `https://github.com/toanysd/kidgame/` nhánh `main`.
Bản cập nhật cuối cùng (v1.0.0) bao gồm các tối ưu hóa tối đa về hiệu năng WebAudio, thiết lập bắt điểm AI và Mật độ xuất hiện (Reactive Density).

## 2. Các Thiết Lập Cốt Lõi (Core Technical Pillars)

### A. Cơ chế AI & Camera (pose-engine.js & motion-analyzer.js)
1. **Camera Constraints**: 
   - Đã gỡ bỏ ràng buộc HD (`1280x720, 30fps`) để tránh lỗi `OverconstrainedError` trên trình duyệt cũ.
   - Thêm phương thức fallback tự động xuống mức cấu hình thấp nhất để vượt qua lỗi chặn quyền (Permission block) từ môi trường máy tính bảng/Tivi.
2. **Motion Tracking (Bộ Quét Nhạy Bén)**:
   - Hệ thống quét đã xóa 2 điểm ngón tay (Index, Pinky) chỉ giữ lại 1 điểm cổ tay mỗi bên để loại bỏ nhiễu thị giác nhưng cấu hình lại `HIT_TOLERANCE = 180` để khoảng quẹt RẤT RỘNG. 
   - `VELOCITY_THRESHOLD = 0.005` (siêu nhạy), khiến bất kỳ một cú lướt nhẹ nào cũng kích hoạt chém đứt đồ vật, tối giản hóa trải nghiệm cho trẻ 3-5 tuổi.

### B. Vòng Lặp Trò Chơi (fruit-ninja.js)
1. **Reactive Density Spawning (Mật độ xuất hiện chủ động)**:
   - Dùng vòng lặp động đếm số `activeCount < MAX_ACTIVE_FRUITS` thay vì đếm thủ công theo giây (`spawnInterval`).
   - Cố định trên màn hình luôn chỉ có đúng **3 quả**, trải dài qua 3 dải băng chuyền độc lập. Nếu bé chém nhanh, bóng sẽ tự mọc lại nhanh. Nếu nhìn chậm, bóng sẽ tự trôi đi hết rồi bù bóng mới.
2. **Backdrop GPU Optimization**:
   - Thay thế toàn bộ viền bóng mượt (CSS-like) bằng Canvas primitives góc vuông `ctx.rect` để cứu cánh cho lỗi `roundRect` treo máy trên thiết bị Android TV cổ.
3. **Pre-warm Logic**:
   - Ngay khoảnh khắc "LET'S PLAY", hệ thống sẽ đẩy thẳng 3 quả chia đều lên màn hình chứ không bắt trẻ phải chờ bóng ngoi lên từ từ dưới mép hố rỗng tuếch.

### C. Máy Phát Âm Thanh (sound-manager.js & app.js)
1. **Audio Throttle (Xử lý dội âm máy khâu)**:
   - Vòng tua hiệu ứng "Vút" ở tay đã được chặn đứng/giới hạn xuống 400ms (`_lastSlashSound`), hoặc vô hiệu hóa hẳn để nhường chỗ cho âm báo điểm.
2. **Chiptune BGM (Nhạc nền cơ sở)**:
   - Bơm thẳng một đoạn Pentatonic (Ngũ cung) được khởi tạo bằng `Oscillator` (WebAudio API) trực tiếp, chu kỳ 280ms, ngân rải rất êm với độ Gain thấp nhịp nhàng. Không sử dụng một thư viện Mp3 nặng nề nào.
3. **SpeechSynthesis Queue (TTS)**:
   - Khi chém từ vựng, tính năng Web Speech API mặc định đưa vào hàng đợi liên tục. Chém 3 quả thì máy đọc 3 chữ tuần tự đầy đủ, không bao giờ có hiện tượng đọc chồng chéo hay bị nghẽn tiếng.

## 3. Quy trình Tái Khởi Động tại Máy Mới
1. **Clone repository**: `git clone https://github.com/toanysd/kidgame.git`
2. **Lưu trữ Kiến thức**: Mở ứng dụng AI trên máy mới và cung cấp lại file `SESSION_TRANSFER.md` này để AI lập tức nạp đủ bối cảnh (Context).
3. **Chạy Live Server**: Dùng `python -m http.server 5500` hoặc VS Code Live Server extension. Truy cập trực tiếp qua IPv4 (Vd: `http://192.168.1.5:5500`) trên các thiết bị máy tính bảng chung Wi-Fi thay vì github.io để tránh giới hạn HTTPS trên in-app browser của máy tính bảng.
