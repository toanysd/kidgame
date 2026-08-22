@echo off
echo ==============================================
echo KHOI DONG SERVER MAY CHU CUC BO - KIDGAME
echo ==============================================
echo Chuyen huong den trinh duyet...
start http://localhost:8080/index.html
echo Dang lang nghe tren cong 8080. Khong tat cua so nay.
python -m http.server 8080
pause
