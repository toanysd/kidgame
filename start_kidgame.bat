@echo off
chcp 65001 >nul
echo ==============================================
echo Khoi dong Server cho KidGame (Auto Port)
echo ==============================================
echo.
echo He thong se tu dong tim port trong de tranh trung lap voi server khac.
echo Dang khoi dong va mo trinh duyet...
echo.

python -c "import http.server, socketserver, webbrowser; Handler = http.server.SimpleHTTPRequestHandler; httpd = socketserver.TCPServer(('', 0), Handler); port = httpd.server_address[1]; print(f'Da khoi tao server tai: http://127.0.0.1:{port}'); webbrowser.open(f'http://127.0.0.1:{port}/monitor/index.html'); webbrowser.open(f'http://127.0.0.1:{port}'); httpd.serve_forever()"

pause
