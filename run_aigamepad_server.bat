@echo off
title AI Gamepad PC Server
echo ==================================================
echo   AI GAMEPAD SERVER (TU DONG CAI DAT VA CHAY)
echo ==================================================
echo.

echo [1/3] Kiem tra Python...
python --version >nul 2>&1
if errorlevel 1 goto NO_PYTHON

echo [2/3] Cai dat thu vien can thiet (websockets, pydirectinput, pyautogui)...
python -m pip install websockets pydirectinput pyautogui >nul 2>&1

echo [3/3] Tai ma nguon Server moi nhat va khoi chay...
curl -s -L -o "%TEMP%\aigamepad_server.py" "https://raw.githubusercontent.com/toanysd/kidgame/main/AIGamepad/server/server.py?v=%random%%time:~6,2%"

if not exist "%TEMP%\aigamepad_server.py" (
    powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/toanysd/kidgame/main/AIGamepad/server/server.py?v=%random%' -OutFile '%TEMP%\aigamepad_server.py'"
)

cls
python "%TEMP%\aigamepad_server.py"
goto END

:NO_PYTHON
echo.
echo [LOI] Khong tim thay Python tren may tinh cua ban!
echo Vui long cai dat Python tu: https://www.python.org/downloads/
echo (Luu y: Nho tich chon o 'Add python.exe to PATH' khi cai dat)
echo.
pause
exit /b

:END
pause
