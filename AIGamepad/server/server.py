import asyncio
import json
import logging
import sys

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

try:
    import websockets
except ImportError:
    print("[LOI] Thieu thu vien websockets.")
    input("Nhan Enter de thoat...")
    sys.exit(1)

try:
    import pydirectinput as kbd
    print("-> Su dung PyDirectInput (Tuong thich tot voi moi game PC, DirectX)")
    kbd.FAILSAFE = False
except ImportError:
    try:
        import pyautogui as kbd
        print("-> Su dung PyAutoGUI (Web game va gia lap co ban)")
        kbd.FAILSAFE = False
    except ImportError:
        print("[LOI] Thieu thu vien dieu khien (pydirectinput / pyautogui).")
        input("Nhan Enter de thoat...")
        sys.exit(1)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

pressed_keys = set()

async def handler(websocket):
    logging.info(f"Đã kết nối với Web AI Gamepad: {websocket.remote_address}")
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                action = data.get("action")
                key = data.get("key")
                
                if not key:
                    continue
                    
                key = str(key).lower()
                
                key_map = {
                    "space": "space",
                    "up": "up",
                    "down": "down",
                    "left": "left",
                    "right": "right",
                    "enter": "enter",
                    "return": "enter",
                    "shift": "shift",
                    "ctrl": "ctrl",
                    "alt": "alt",
                    "insert": "insert",
                    "delete": "delete",
                    "home": "home",
                    "end": "end",
                    "pageup": "pageup",
                    "pagedown": "pagedown",
                    "tab": "tab",
                    "esc": "escape",
                    "escape": "escape",
                    "backspace": "backspace"
                }
                
                mapped_key = key_map.get(key, key)
                
                if action == "keydown":
                    if mapped_key not in pressed_keys:
                        logging.info(f"Pressing: {mapped_key}")
                        kbd.keyDown(mapped_key)
                        pressed_keys.add(mapped_key)
                elif action == "keyup":
                    if mapped_key in pressed_keys:
                        logging.info(f"Releasing: {mapped_key}")
                        kbd.keyUp(mapped_key)
                        pressed_keys.remove(mapped_key)
                        
            except json.JSONDecodeError:
                logging.error("Lỗi parse JSON")
            except Exception as e:
                logging.error(f"Lỗi thực thi phím: {e}")
                
    except websockets.exceptions.ConnectionClosed:
        logging.info("Mất kết nối với AI Gamepad.")
    finally:
        for k in list(pressed_keys):
            try:
                kbd.keyUp(k)
            except:
                pass
        pressed_keys.clear()

async def main():
    print("==================================================")
    print("AI GAMEPAD SERVER DANG CHAY")
    print("==================================================")
    print("Dang lang nghe ket noi tu Web AI Gamepad (Port 8765)...")
    print("Hay giu nguyen cua so nay trong luc choi game!")
    print("Nhan Ctrl + C de thoat.")
    print("--------------------------------------------------")
    
    try:
        async with websockets.serve(handler, "localhost", 8765):
            await asyncio.Future()  # run forever
    except OSError as e:
        print(f"\n[LOI]: Khong the mo cong 8765. Co the mot Server khac dang chay.")
        print(f"Chi tiet loi: {e}")
        input("\nNhan Enter de thoat...")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nDa dong Server.")
    except Exception as e:
        print(f"\nDa xay ra loi he thong: {e}")
        input("\nNhan Enter de thoat...")
