import asyncio
import json
import logging
import sys

try:
    import websockets
except ImportError:
    print("Lỗi: Thiếu thư viện websockets.")
    input("Nhấn Enter để thoát...")
    sys.exit(1)

try:
    import pydirectinput as kbd
    print("Sử dụng PyDirectInput (Tương thích tốt với mọi game PC, DirectX)")
    kbd.FAILSAFE = False
except ImportError:
    try:
        import pyautogui as kbd
        print("Sử dụng PyAutoGUI (Dành cho web game và giả lập cơ bản)")
        kbd.FAILSAFE = False
    except ImportError:
        print("Lỗi: Thiếu thư viện điều khiển (pydirectinput / pyautogui).")
        input("Nhấn Enter để thoát...")
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
                    "shift": "shift"
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
    print("🚀 AI GAMEPAD SERVER ĐANG CHẠY")
    print("==================================================")
    print("Đang lắng nghe kết nối từ Web AI Gamepad (Port 8765)...")
    print("Hãy giữ nguyên cửa sổ này trong lúc chơi game!")
    print("Nhấn Ctrl + C để thoát.")
    print("--------------------------------------------------")
    
    try:
        async with websockets.serve(handler, "localhost", 8765):
            await asyncio.Future()  # run forever
    except OSError as e:
        print(f"\n❌ LỖI: Không thể mở cổng 8765. Có thể một Server khác đang chạy.")
        print(f"Chi tiết lỗi: {e}")
        input("\nNhấn Enter để thoát...")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nĐã đóng Server.")
    except Exception as e:
        print(f"\nĐã xảy ra lỗi hệ thống: {e}")
        input("\nNhấn Enter để thoát...")
