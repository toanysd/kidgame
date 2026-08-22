@echo off
echo Dang cai dat cac thu vien can thiet (Neu chua co)...
pip install websockets pydirectinput pyautogui >nul 2>&1
cd AIGamepad\server
python server.py
pause
