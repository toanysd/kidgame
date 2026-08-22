@echo off
title AI Gamepad PC Server
echo ==================================================
echo   AI GAMEPAD SERVER (TU DONG CAI DAT VA CHAY)
echo ==================================================
echo.
echo [1/3] Dang kiem tra Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay Python tren may tinh cua ban!
    echo Vui long cai dat Python tu https://www.python.org/downloads/
    echo (Nho tick chon "Add python.exe to PATH" khi cai dat)
    echo.
    pause
    exit /b
)

echo [2/3] Dang cai dat cac thu vien can thiet (websockets, pydirectinput, pyautogui)...
python -m pip install websockets pydirectinput pyautogui >nul 2>&1

echo [3/3] Dang khoi dong Server...
echo.

:: Tao file python tam de chay
(
echo import asyncio
echo import json
echo import logging
echo import sys
echo.
echo try:
echo     import websockets
echo except ImportError:
echo     print^("[LOI] Thieu thu vien websockets."^)
echo     input^("Nhan Enter de thoat..."^)
echo     sys.exit^(1^)
echo.
echo try:
echo     import pydirectinput as kbd
echo     print^("-> Su dung PyDirectInput (Tuong thich tot voi SuperTuxKart, Roblox...)"^)
echo     kbd.FAILSAFE = False
echo except ImportError:
echo     try:
echo         import pyautogui as kbd
echo         print^("-> Su dung PyAutoGUI"^)
echo         kbd.FAILSAFE = False
echo     except ImportError:
echo         print^("[LOI] Thieu thu vien dieu khien."^)
echo         input^("Nhan Enter de thoat..."^)
echo         sys.exit^(1^)
echo.
echo logging.basicConfig^(level=logging.INFO, format='%%(asctime)s - %%(message)s'^)
echo pressed_keys = set^(^)
echo.
echo async def handler^(websocket^):
echo     logging.info^("DA KET NOI VOI WEB AI GAMEPAD!"^)
echo     try:
echo         async for message in websocket:
echo             try:
echo                 data = json.loads^(message^)
echo                 action = data.get^("action"^)
echo                 key = data.get^("key"^)
echo                 if not key: continue
echo                 key = str^(key^).lower^(^)
echo                 key_map = {"space":"space", "up":"up", "down":"down", "left":"left", "right":"right", "enter":"enter", "shift":"shift"}
echo                 mapped_key = key_map.get^(key, key^)
echo                 if action == "keydown":
echo                     if mapped_key not in pressed_keys:
echo                         logging.info^(f"[PHIM XUONG]: {mapped_key.upper^(^)}"^)
echo                         kbd.keyDown^(mapped_key^)
echo                         pressed_keys.add^(mapped_key^)
echo                 elif action == "keyup":
echo                     if mapped_key in pressed_keys:
echo                         logging.info^(f"[PHIM LEN]: {mapped_key.upper^(^)}"^)
echo                         kbd.keyUp^(mapped_key^)
echo                         pressed_keys.remove^(mapped_key^)
echo             except Exception as e:
echo                 pass
echo     except:
echo         logging.info^("Da ngat ket noi voi Web."^)
echo     finally:
echo         for k in list^(pressed_keys^):
echo             try: kbd.keyUp^(k^)
echo             except: pass
echo         pressed_keys.clear^(^)
echo.
echo async def main^(^):
echo     print^("=================================================="^)
echo     print^("  AI GAMEPAD SERVER DANG LANG NGHE PORT 8765"^)
echo     print^("=================================================="^)
echo     print^("1. Hay giu nguyen cua so den nay trong khi choi game."^)
echo     print^("2. Quay lai trinh duyet Web va bam 'Ket Noi PC Server'."^)
echo     print^("3. Mo game (SuperTuxKart, v.v...) va tan huong!"^)
echo     print^("--------------------------------------------------"^)
echo     try:
echo         async with websockets.serve^(handler, "localhost", 8765^):
echo             await asyncio.Future^(^)
echo     except Exception as e:
echo         print^(f"[LOI]: {e}"^)
echo         input^("Nhan Enter de thoat..."^)
echo.
echo if __name__ == "__main__":
echo     asyncio.run^(main^(^)^)
) > "%TEMP%\aigamepad_temp_server.py"

python "%TEMP%\aigamepad_temp_server.py"
pause
