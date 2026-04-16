@echo off
title KidGame Local Server
color 0A

echo ===================================================
echo     KHOI DONG SERVER CHO KIDGAME (FIGHTER MODE)
echo ===================================================
echo.
echo Dang khoi tao may chu cuc bo... Vui long doi vai giay!

:: Chạy http-server với npx. Tùy chọn -c-1 để tắt cache, -o để tự động mở tab trình duyệt.
npx http-server -p 8080 -c-1 -o

:: Đề phòng máy Sếp không có npx (Node.js) thì nó sẽ báo lỗi và rớt xuống dòng này, em báo thêm thông tin.
if %ERRORLEVEL% NEQ 0 (
    echo.
    color 0C
    echo [LOI] Khong tim thay 'npx'. May tinh cua Sep chua cai dat Node.js hoac mang bi chan.
    echo Thu dung Python server thay the...
    python -m http.server 8080
    if %ERRORLEVEL% NEQ 0 (
        echo [LOI] Cung khong co Python tren may tinh luon.
        echo Sep hay cai dat Node.js tai https://nodejs.org/ nhe!
    )
)

pause
