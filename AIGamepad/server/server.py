import asyncio
import json
import logging

try:
    import websockets
except ImportError:
    print("Lỗi: Thiếu thư viện websockets. Vui lòng chạy lệnh: pip install websockets")
    exit(1)

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
        print("Lỗi: Thiếu thư viện điều khiển. Vui lòng chạy lệnh: pip install pydirectinput pyautogui")
        exit(1)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

# Set storing currently pressed keys to avoid spamming keydown
pressed_keys = set()

async def handle_client(websocket, path):
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
                
                # Ánh xạ một số phím đặc biệt
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
        # Nhả toàn bộ phím khi mất kết nối để tránh kẹt phím
        for k in list(pressed_keys):
            try:
                kbd.keyUp(k)
            except:
                pass
        pressed_keys.clear()

async def main():
    # Khởi động WebSocket server ở cổng 8765
    server = await websockets.serve(handle_client, "localhost", 8765)
    logging.info("=========================================")
    logging.info("🚀 AI GAMEPAD SERVER ĐANG CHẠY 🚀")
    logging.info("Đang lắng nghe kết nối tại: ws://localhost:8765")
    logging.info("Vui lòng mở web AI Gamepad để bắt đầu điều khiển.")
    logging.info("=========================================")
    await server.wait_closed()

if __name__ == "__main__":
    asyncio.run(main())
