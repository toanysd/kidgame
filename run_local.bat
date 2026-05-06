@echo off
echo ==============================================
echo Khởi động Server thử nghiệm nội bộ cho KidGame
echo ==============================================
echo.
echo De test tinh nang Camera va WebRTC truc tiep tren may,
echo ban KHONG DUOC mo file index.html truc tiep bang Chrome.
echo Ban phai chay thong qua mot Server noi bo (localhost).
echo.
echo Dang khoi dong Python HTTP Server tai port 8000...
echo.
echo Vui long mo trinh duyet va truy cap dung 2 duong link sau:
echo.
echo 1. Man hinh cho Be choi:    http://127.0.0.1:8000
echo 2. Man hinh giam sat (Monitor): http://127.0.0.1:8000/monitor/index.html
echo.
python -m http.server 8000
pause
