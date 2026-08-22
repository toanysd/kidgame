import { SCENE_WIDTH } from '../constants/stage.js';
import { LOGO_FLASH_DELAY } from '../constants/battle.js';
import { BattleScene } from './BattleScene.js';
import { networkManager } from '../network/NetworkManager.js';

export class StartScene {
	image = document.getElementById('Controls');
	logoImg = document.getElementById('Logo');

	text = 'CLICK ANYWHERE TO START';
	repeatTime = 3;
	position = 10;
	logoFlash = false;
	flashTimer = 0;
	brightness = 0;
	contrast = 3;
	sceneEnded = false;

	endStartScene = (mode) => {
		window.GAME_MODE = mode;
		const modeSelection = document.getElementById('modeSelection');
		if (modeSelection) modeSelection.style.display = 'none';

		const onlineModal = document.getElementById('onlineModal');
		if (onlineModal) onlineModal.style.display = 'none';

		this.changeScene(BattleScene);
	};

	constructor(changeScene) {
		this.changeScene = changeScene;
		window.GAME_MODE = '1P'; // Default mode
		window.IS_ONLINE_HOST = true;

		this.initUI();
	}

	initUI() {
		const modeSelection = document.getElementById('modeSelection');
		if (modeSelection) modeSelection.style.display = 'flex';

		const btn1P = document.getElementById('btn1P');
		const btn2PLocal = document.getElementById('btn2PLocal');
		const btn2POnline = document.getElementById('btn2POnline');

		const onlineModal = document.getElementById('onlineModal');
		const closeOnlineModal = document.getElementById('closeOnlineModal');
		const btnCreateRoom = document.getElementById('btnCreateRoom');
		const btnJoinRoom = document.getElementById('btnJoinRoom');
		const btnCopyRoomLink = document.getElementById('btnCopyRoomLink');
		const inputRoomCode = document.getElementById('inputRoomCode');
		const roomCreatedInfo = document.getElementById('roomCreatedInfo');
		const createdRoomCode = document.getElementById('createdRoomCode');
		const onlineStatusMessage = document.getElementById('onlineStatusMessage');

		// 1P Mode (vs CPU)
		if (btn1P) {
			btn1P.onclick = () => this.endStartScene('1P');
		}

		// 2P Local Mode (1 Camera - 2 Players)
		if (btn2PLocal) {
			btn2PLocal.onclick = () => this.endStartScene('2P_LOCAL');
		}

		// 2P Online Mode (WebRTC 2 Devices)
		if (btn2POnline) {
			btn2POnline.onclick = () => {
				if (onlineModal) onlineModal.style.display = 'flex';
			};
		}

		if (closeOnlineModal) {
			closeOnlineModal.onclick = () => {
				if (onlineModal) onlineModal.style.display = 'none';
			};
		}

		// Network status callback
		networkManager.onStatusChange = (msg, isErr) => {
			if (onlineStatusMessage) {
				onlineStatusMessage.textContent = msg;
				onlineStatusMessage.style.color = isErr ? '#f87171' : '#38bdf8';
			}
		};

		// Connected callback
		networkManager.onConnected = ({ isHost, roomId }) => {
			if (onlineStatusMessage) {
				onlineStatusMessage.textContent = 'Đối thủ đã sẵn sàng! Đang tải trận đấu...';
				onlineStatusMessage.style.color = '#4ade80';
			}
			setTimeout(() => {
				this.endStartScene('2P_ONLINE');
			}, 1000);
		};

		// Create Room
		if (btnCreateRoom) {
			btnCreateRoom.onclick = () => {
				window.IS_ONLINE_HOST = true;
				const localStream = window.parent?.globalCameraStream || null;
				const roomId = networkManager.createRoom(localStream);
				if (roomCreatedInfo) roomCreatedInfo.style.display = 'block';
				if (createdRoomCode) createdRoomCode.textContent = roomId;
			};
		}

		// Copy Link
		if (btnCopyRoomLink) {
			btnCopyRoomLink.onclick = () => {
				const roomId = createdRoomCode?.textContent || '';
				const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
				navigator.clipboard.writeText(shareUrl).then(() => {
					btnCopyRoomLink.textContent = '✓ Đã Copy!';
					setTimeout(() => {
						btnCopyRoomLink.textContent = '📋 Copy Link';
					}, 2000);
				});
			};
		}

		// Join Room
		if (btnJoinRoom) {
			btnJoinRoom.onclick = () => {
				const code = inputRoomCode?.value?.trim() || '';
				if (!code) {
					if (onlineStatusMessage) onlineStatusMessage.textContent = 'Vui lòng nhập mã phòng!';
					return;
				}
				window.IS_ONLINE_HOST = false;
				const localStream = window.parent?.globalCameraStream || null;
				networkManager.joinRoom(code, localStream);
			};
		}

		// Auto check URL query param ?room=xxxx
		const urlParams = new URLSearchParams(window.location.search);
		const autoRoom = urlParams.get('room');
		if (autoRoom) {
			if (onlineModal) onlineModal.style.display = 'flex';
			if (inputRoomCode) inputRoomCode.value = autoRoom;
		}
	}

	updateLogo = (time) => {
		if (this.flashTimer > time.previous) return;
		this.flashTimer = time.previous + LOGO_FLASH_DELAY[Number(!this.logoFlash)];
		this.logoFlash = !this.logoFlash;
	};

	updateTextPosition = (time) => {
		this.position -= time.secondsPassed * 100;
	};

	update = (time) => {
		this.updateLogo(time);
		this.updateTextPosition(time);
	};

	drawText = (context) => {
		context.fillStyle = '#00f0ff';
		context.font = 'bold 11px sans-serif';
		context.textAlign = 'center';
		context.fillText("CHOOSE YOUR BATTLE MODE BELOW", SCENE_WIDTH / 2, 178);
		context.textAlign = 'left';
	};

	drawLogo = (context) => {
		if (this.logoFlash) {
			context.fillStyle = 'black';
			context.fillRect(112, 22, 170, 80);
			return;
		}
		context.drawImage(
			this.logoImg,
			0,
			0,
			this.logoImg.width,
			this.logoImg.height,
			112,
			22,
			170,
			80
		);
	};

	draw = (context) => {
		context.drawImage(this.image, 0, 0);
		this.drawLogo(context);
		this.drawText(context);
	};
}
