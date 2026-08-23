// =========================================================
// VIRTUAL AI GAMEPAD
// Converts Body Gestures to PC Keyboard Inputs via WebSocket
// =========================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const videoElement = document.getElementById('videoElement');

const btnConnect = document.getElementById('btnConnect');
const setupModal = document.getElementById('setupModal');
const connStatus = document.getElementById('connStatus');
const connText = document.getElementById('connText');
const hudKeys = document.getElementById('hudKeys');

// Resize Canvas
function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// =========================================================
// WEBSOCKET CLIENT
// =========================================================
let ws = null;
let isConnected = false;

function connectWebSocket() {
    connText.innerText = "Đang kết nối...";
    ws = new WebSocket('ws://localhost:8765');
    
    ws.onopen = () => {
        isConnected = true;
        connStatus.classList.add('connected');
        connText.innerText = "Đã Kết Nối Server";
        setupModal.style.display = 'none';
        const st = document.getElementById('steeringConfig');
        if (st) st.style.display = 'flex';
        
        // Show context mapping
        const mj = document.getElementById('map-jump'); if (mj) mj.style.display = 'flex';
        const md = document.getElementById('map-duck'); if (md) md.style.display = 'flex';
        const ml = document.getElementById('map-left'); if (ml) ml.style.display = 'flex';
        const mr = document.getElementById('map-right'); if (mr) mr.style.display = 'flex';
        const mpl = document.getElementById('map-punchL'); if (mpl) mpl.style.display = 'flex';
        const mpr = document.getElementById('map-punchR'); if (mpr) mpr.style.display = 'flex';
        
        initCamera();
    };
    
    ws.onclose = () => {
        isConnected = false;
        connStatus.classList.remove('connected');
        connText.innerText = "Máº¥t Káº¿t Ná»‘i Server";
        // Try reconnecting after 3 seconds
        setTimeout(connectWebSocket, 3000);
    };
    
    ws.onerror = (e) => {
        console.error("WebSocket Error:", e);
    };
}

// Key State Tracker
const activeKeys = new Set();

function sendKey(action, keyChar) {
    if (!isConnected || !ws) return;
    
    // Update Set & HUD
    if (action === 'keydown') {
        if (activeKeys.has(keyChar)) return; // Already pressed
        activeKeys.add(keyChar);
    } else {
        if (!activeKeys.has(keyChar)) return; // Already released
        activeKeys.delete(keyChar);
    }
    
    updateHUD();

    // Send to Server
    ws.send(JSON.stringify({
        action: action,
        key: keyChar
    }));
}

function updateHUD() {
    hudKeys.innerHTML = '';
    activeKeys.forEach(k => {
        const span = document.createElement('span');
        span.className = 'key-badge';
        span.innerText = k;
        hudKeys.appendChild(span);
    });
}

// =========================================================
// =========================================================
// KEY MAPPING LOGIC
// =========================================================
const mapping = {
    jump: 'w',
    duck: 's',
    left: 'a',
    right: 'd',
    punchL: 'j',
    punchR: 'k'
};

// Load saved mapping from localStorage if exists
try {
    const saved = localStorage.getItem('aigamepad_custom_keys');
    if (saved) {
        Object.assign(mapping, JSON.parse(saved));
    }
} catch (e) {}

const inputs = document.querySelectorAll('.key-input');
let activeInput = null;

inputs.forEach(input => {
    // Load initial mapping
    const id = input.id.replace('key-', '');
    if (mapping[id] !== undefined) {
        input.value = mapping[id];
    }

    input.addEventListener('click', (e) => {
        if (activeInput) activeInput.classList.remove('recording');
        activeInput = input;
        input.classList.add('recording');
        input.value = 'Bấm phím...';
    });
});

window.addEventListener('keydown', (e) => {
    if (activeInput) {
        e.preventDefault();
        let key = e.key.toLowerCase();
        if (key === ' ') key = 'space';
        if (key.includes('arrow')) key = key.replace('arrow', '');
        
        activeInput.value = key;
        activeInput.classList.remove('recording');
        
        const id = activeInput.id.replace('key-', '');
        mapping[id] = key;
        activeInput = null;
        
        try {
            localStorage.setItem('aigamepad_custom_keys', JSON.stringify(mapping));
        } catch (err) {}

        const presetEl = document.getElementById('gamePreset');
        if (presetEl) presetEl.value = 'custom';
    }
});

const gamePreset = document.getElementById('gamePreset');
if (gamePreset) {
    gamePreset.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'roadrash_punch') {
            // Ga Up, Phanh Down, Trái Left, Phải Right, Đấm Space (Backhand), Đá Enter (Kick)
            setKeyMapping({
                jump: 'up',
                duck: 'down',
                left: 'left',
                right: 'right',
                punchL: 'space',
                punchR: 'enter'
            });
        } else if (val === 'roadrash_swing') {
            // Ga Up, Phanh Down, Trái Left, Phải Right, Vung gậy Insert (Swing), Tăng tốc N (Nitro)
            setKeyMapping({
                jump: 'up',
                duck: 'down',
                left: 'left',
                right: 'right',
                punchL: 'insert',
                punchR: 'n'
            });
        } else if (val === 'supertuxkart') {
            setKeyMapping({
                jump: 'w',
                duck: 's',
                left: 'a',
                right: 'd',
                punchL: 'j',
                punchR: 'k'
            });
        } else if (val === 'roblox') {
            setKeyMapping({
                jump: 'w',
                duck: 's',
                left: 'a',
                right: 'd',
                punchL: 'space',
                punchR: 'e'
            });
        } else if (val === 'arcade_racing') {
            setKeyMapping({
                jump: 'up',
                duck: 'down',
                left: 'left',
                right: 'right',
                punchL: 'space',
                punchR: 'enter'
            });
        } else if (val === 'arcade_claw' || val === 'arcade_tetris') {
            setKeyMapping({
                jump: 'w',
                duck: 's',
                left: 'a',
                right: 'd',
                punchL: 'space',
                punchR: 'enter'
            });
        }
    });
}

function setKeyMapping(newMap) {
    for (let k in newMap) {
        mapping[k] = newMap[k];
        const el = document.getElementById('key-' + k);
        if (el) el.value = newMap[k];
    }
    try {
        localStorage.setItem('aigamepad_custom_keys', JSON.stringify(mapping));
    } catch (err) {}
}

// =========================================================
// MEDIAPIPE POSE & GESTURE RECOGNITION
// =========================================================
let poseDetector = null;
let isCameraInitialized = false;

function initCamera() {
    if (isCameraInitialized) return;
    isCameraInitialized = true;
    poseDetector = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    poseDetector.setOptions({
        modelComplexity: 0, // Lite model for speed
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    poseDetector.onResults(onPoseResults);

    if (window.parent && window.parent.globalCameraStream) {
        videoElement.srcObject = window.parent.globalCameraStream;
        videoElement.play();
        startCameraLoop();
    } else {
        const cam = new Camera(videoElement, {
            onFrame: async () => {
                await poseDetector.send({ image: videoElement });
            },
            width: 480,
            height: 360
        });
        cam.start();
    }
}

function startCameraLoop() {
    let lastTime = -1;
    let isProcessing = false;
    const loop = async () => {
        if (!isProcessing && videoElement.readyState >= 2 && videoElement.currentTime !== lastTime) {
            isProcessing = true;
            lastTime = videoElement.currentTime;
            try {
                await poseDetector.send({ image: videoElement });
            } catch (e) {}
            isProcessing = false;
        }
        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
}

// Gesture State Trackers
const GState = {
    isJumping: false,
    isDucking: false,
    isLeaningLeft: false,
    isLeaningRight: false,
    isPunchingL: false,
    isPunchingR: false,
    
    // EMA smoothers
    baselineY: 0,
    calibratingFrames: 0,
    emaPoints: {}
};

function onPoseResults(results) {
    // 1. Draw Camera Feed
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let targetX = 0;
    let targetY = 0;
    let targetW = canvas.width;
    let targetH = canvas.height;

    // In Arcade mode, draw camera as a small PiP in the bottom right corner
    if (window.arcadeMode) {
        targetW = 320;
        targetH = 240;
        targetX = canvas.width - targetW - 20;
        targetY = canvas.height - targetH - 20;
        
        // Draw PiP border/background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.roundRect ? ctx.roundRect(targetX, targetY, targetW, targetH, 16) : ctx.fillRect(targetX, targetY, targetW, targetH);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#38bdf8';
        ctx.stroke();
    }
    
    if (results.image) {
        ctx.save();
        
        // Clip to rounded rect if supported, else normal rect
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(targetX, targetY, targetW, targetH, 16);
        else ctx.rect(targetX, targetY, targetW, targetH);
        ctx.clip();

        ctx.translate(targetX + targetW, targetY);
        ctx.scale(-1, 1); // Mirror
        
        // Fit image into target rect (cover)
        const vRatio = results.image.width / results.image.height;
        const cRatio = targetW / targetH;
        let dWidth = targetW;
        let dHeight = targetH;
        
        if (vRatio > cRatio) {
            dWidth = targetH * vRatio;
        } else {
            dHeight = targetW / vRatio;
        }
        
        const offsetX = (targetW - dWidth) / 2;
        const offsetY = (targetH - dHeight) / 2;
        
        ctx.drawImage(results.image, offsetX, offsetY, dWidth, dHeight);
        ctx.restore();
    }

    if (!results.poseLandmarks) {
        // Release all keys if nobody is in frame
        releaseAllGestures();
        return;
    }

    const pl = results.poseLandmarks;
    
    // Draw Skeleton
    drawSkeleton(pl, targetX, targetY, targetW, targetH);
    
    // 2. Gesture Logic
    processGestures(pl);
}

function drawSkeleton(landmarks, tx, ty, tw, th) {
    ctx.save();
    
    // Clip region
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(tx, ty, tw, th, 16);
    else ctx.rect(tx, ty, tw, th);
    ctx.clip();

    ctx.translate(tx + tw, ty);
    ctx.scale(-1, 1);
    
    // Transform coordinates
    const vRatio = 640 / 480;
    const cRatio = tw / th;
    let dWidth = tw;
    let dHeight = th;
    if (vRatio > cRatio) dWidth = th * vRatio;
    else dHeight = tw / vRatio;
    
    const offsetX = (tw - dWidth)/2;
    const offsetY = (th - dHeight)/2;

    const getX = (x) => offsetX + x * dWidth;
    const getY = (y) => offsetY + y * dHeight;

    // Draw joints
    ctx.fillStyle = '#38bdf8';
    [11, 12, 13, 14, 15, 16, 23, 24].forEach(idx => {
        const pt = landmarks[idx];
        if (pt && pt.visibility > 0.5) {
            ctx.beginPath();
            ctx.arc(getX(pt.x), getY(pt.y), 6, 0, 2*Math.PI);
            ctx.fill();
        }
    });

    // Draw Connectors
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = 4;
    const connections = [[11,12], [11,13], [13,15], [12,14], [14,16], [11,23], [12,24], [23,24]];
    
    connections.forEach(([i, j]) => {
        const p1 = landmarks[i];
        const p2 = landmarks[j];
        if (p1 && p2 && p1.visibility > 0.5 && p2.visibility > 0.5) {
            ctx.beginPath();
            ctx.moveTo(getX(p1.x), getY(p1.y));
            ctx.lineTo(getX(p2.x), getY(p2.y));
            ctx.stroke();
        }
    });

    ctx.restore();
}

function processGestures(pl) {
    const nose = pl[0];
    const leftShoulder = pl[11];
    const rightShoulder = pl[12];
    const leftWrist = pl[15];
    const rightWrist = pl[16];
    const leftHip = pl[23];
    const rightHip = pl[24];
    
    if (!leftShoulder || !rightShoulder) return;

    const leftAnkle = pl[27];
    const rightAnkle = pl[28];
    // Current State for Hysteresis
    const isSteeringLeft = activeKeys.has('left');
    const isSteeringRight = activeKeys.has('right');
    const isJumping = activeKeys.has('jump');
    const isDucking = activeKeys.has('duck');
    
    // 1. GESTURE RECOGNITION (W, S, THẢ TRÔI, A, D, J, K)
    let shouldGas = false;
    let shouldBrake = false;
    let isPunchL = false; // Phím J (Bắn)
    let isPunchR = false; // Phím K (Nitro)
    let steerCmd = 0;     // -1: D (Phải), 1: A (Trái)

    const isAutoGas = document.getElementById('autoGas') ? document.getElementById('autoGas').checked : false;
    const steerMode = document.getElementById('steerMode')?.value || 'all';

    let shoulderW = 0.3;
    let shoulderMidY = 0.5;
    if (leftShoulder && rightShoulder) {
        shoulderW = Math.hypot(leftShoulder.x - rightShoulder.x, leftShoulder.y - rightShoulder.y) || 0.3;
        shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
    }

    const leftVisible = leftWrist && leftWrist.visibility > 0.5;
    const rightVisible = rightWrist && rightWrist.visibility > 0.5;

    // A. TRƯỜNG HỢP 1: KHÔNG THẤY TAY (Thả trôi - Không W, Không S)
    if (!leftVisible && !rightVisible) {
        shouldGas = false;
        shouldBrake = false;
    }
    // B. TRƯỜNG HỢP 2: CẢ 2 TAY ĐỀU TRONG MÀN HÌNH (Lái xe, Ga, Phanh)
    else if (leftVisible && rightVisible) {
        const handsMidY = (leftWrist.y + rightWrist.y) / 2;

        // 1. Giơ cả 2 tay lên cao hơn hoặc ngang vai -> TIẾN (W)
        if (handsMidY < shoulderMidY + 0.05) {
            shouldGas = true;
            shouldBrake = false;

            // Bẻ lái Vô Lăng (A / D) khi đang giơ 2 tay lái
            if (steerMode === 'wheel' || steerMode === 'all') {
                const dy = leftWrist.y - rightWrist.y;
                const normalizedTilt = dy / shoulderW; // Dương = tay trái thấp hơn -> Rẽ Trái A

                const baseThresh = parseFloat(document.getElementById('steerSensSlider')?.value) || 0.08;
                const thresh = isSteeringLeft ? (baseThresh * 2.0 - 0.04) : (baseThresh * 2.0);
                const threshR = isSteeringRight ? (baseThresh * 2.0 - 0.04) : (baseThresh * 2.0);

                if (normalizedTilt > thresh) steerCmd = 1;      // A (Trái)
                else if (normalizedTilt < -threshR) steerCmd = -1; // D (Phải)
            }
        } 
        // 2. Hạ cả 2 tay xuống dưới vai (ngang ngực/bụng) -> PHANH / LÙI (S)
        else {
            shouldGas = false;
            shouldBrake = true;
        }
    }
    // C. TRƯỜNG HỢP 3: CHỈ THẤY 1 TAY (Kích hoạt Vũ khí J / K nếu giơ cao, hoặc Thả trôi)
    else if (leftVisible && !rightVisible) {
        const nose = pl[0];
        const headTopY = nose ? nose.y : (shoulderMidY - 0.15);
        if (leftWrist.y < headTopY) {
            isPunchL = true; // Phím J
        }
    }
    else if (rightVisible && !leftVisible) {
        const nose = pl[0];
        const headTopY = nose ? nose.y : (shoulderMidY - 0.15);
        if (rightWrist.y < headTopY) {
            isPunchR = true; // Phím K
        }
    }

    triggerAction('jump', shouldGas);  // Phím W
    triggerAction('duck', shouldBrake); // Phím S
    triggerAction('punchL', isPunchL);  // Phím J
    triggerAction('punchR', isPunchR);  // Phím K

    // 2. Nghiêng người (Lean)
    if ((steerMode === 'lean' || steerMode === 'all') && steerCmd === 0) {
        const shoulderX = (leftShoulder.x + rightShoulder.x) / 2;
        const hipX = (leftHip && rightHip) ? (leftHip.x + rightHip.x) / 2 : shoulderX;
        const leanDelta = shoulderX - hipX;

        const baseThresh = parseFloat(document.getElementById('steerSensSlider')?.value) || 0.08;
        const thresh = isSteeringLeft ? (baseThresh - 0.02) : baseThresh;
        const threshR = isSteeringRight ? (baseThresh - 0.02) : baseThresh;

        if (leanDelta > thresh) steerCmd = 1;
        else if (leanDelta < -threshR) steerCmd = -1;
    }

    // 3. Nghiêng đầu (Head)
    if ((steerMode === 'head' || steerMode === 'all') && steerCmd === 0) {
        const leftEar = pl[7];
        const rightEar = pl[8];
        if (leftEar && rightEar) {
            const earDelta = leftEar.y - rightEar.y;
            const baseThresh = parseFloat(document.getElementById('steerSensSlider')?.value) || 0.08;
            const thresh = isSteeringLeft ? (baseThresh * 0.5 - 0.01) : (baseThresh * 0.5);
            const threshR = isSteeringRight ? (baseThresh * 0.5 - 0.01) : (baseThresh * 0.5);

            if (earDelta > thresh) steerCmd = 1;
            else if (earDelta < -threshR) steerCmd = -1;
        }
    }

    if (steerCmd === 1) {
        triggerAction('left', true);
        triggerAction('right', false);
    } else if (steerCmd === -1) {
        triggerAction('right', true);
        triggerAction('left', false);
    } else {
        triggerAction('left', false);
        triggerAction('right', false);
    }
}

function triggerAction(actionName, isTriggered) {
    const stateKey = 'is' + actionName.charAt(0).toUpperCase() + actionName.slice(1);
    const keyBind = mapping[actionName];
    
    if (isTriggered && !GState[stateKey]) {
        GState[stateKey] = true;
        sendKey('keydown', keyBind);
    } else if (!isTriggered && GState[stateKey]) {
        GState[stateKey] = false;
        sendKey('keyup', keyBind);
    }
}

function releaseAllGestures() {
    triggerAction('jump', false);
    triggerAction('duck', false);
    triggerAction('left', false);
    triggerAction('right', false);
    triggerAction('punchL', false);
    triggerAction('punchR', false);
}

// Start
btnConnect.addEventListener('click', () => {
    // Check if arcade frame is active
    if (document.getElementById('arcadeFrame').style.display !== 'none') {
        setupModal.style.display = 'none';
        initCamera();
    } else {
        connectWebSocket();
    }
});

function startArcade(gameUrl) {
    const frame = document.getElementById('arcadeFrame');
    frame.src = gameUrl;
    frame.style.display = 'block';
    document.body.classList.add('arcade-mode');
    
    // Switch HUD & Modals
    setupModal.style.display = 'none';
    connStatus.classList.add('connected');
    connText.innerText = "Chế độ Arcade";

    // Contextual UI Configuration
    const mapJump = document.getElementById('map-jump');
    const mapDuck = document.getElementById('map-duck');
    const mapLeft = document.getElementById('map-left');
    const mapRight = document.getElementById('map-right');
    const mapPunchL = document.getElementById('map-punchL');
    const mapPunchR = document.getElementById('map-punchR');
    const steerConfig = document.getElementById('steeringConfig');

    const gamePresetSelect = document.getElementById('gamePreset');

    if (gameUrl.includes('racing.html')) {
        if (gamePresetSelect) gamePresetSelect.value = 'arcade_racing';
        setKeyMapping({ jump: 'up', duck: 'down', left: 'left', right: 'right', punchL: 'space', punchR: 'enter' });
        if (steerConfig) steerConfig.style.display = 'flex';
        if (mapJump) mapJump.style.display = 'flex';
        if (mapDuck) mapDuck.style.display = 'flex';
        if (mapLeft) mapLeft.style.display = 'flex';
        if (mapRight) mapRight.style.display = 'flex';
        if (mapPunchL) mapPunchL.style.display = 'none';
        if (mapPunchR) mapPunchR.style.display = 'none';
    } else if (gameUrl.includes('claw.html')) {
        if (gamePresetSelect) gamePresetSelect.value = 'arcade_claw';
        setKeyMapping({ jump: 'w', duck: 's', left: 'a', right: 'd', punchL: 'space', punchR: 'enter' });
        if (steerConfig) steerConfig.style.display = 'none';
        if (mapJump) mapJump.style.display = 'flex';
        if (mapDuck) mapDuck.style.display = 'flex';
        if (mapLeft) mapLeft.style.display = 'flex';
        if (mapRight) mapRight.style.display = 'flex';
        if (mapPunchL) mapPunchL.style.display = 'flex';
        if (mapPunchR) mapPunchR.style.display = 'flex';
    } else if (gameUrl.includes('tetris.html')) {
        if (gamePresetSelect) gamePresetSelect.value = 'arcade_tetris';
        setKeyMapping({ jump: 'w', duck: 's', left: 'a', right: 'd', punchL: 'space', punchR: 'enter' });
        if (steerConfig) steerConfig.style.display = 'none';
        if (mapJump) mapJump.style.display = 'flex';
        if (mapDuck) mapDuck.style.display = 'flex';
        if (mapLeft) mapLeft.style.display = 'flex';
        if (mapRight) mapRight.style.display = 'flex';
        if (mapPunchL) mapPunchL.style.display = 'flex';
        if (mapPunchR) mapPunchR.style.display = 'flex';
    } else if (gameUrl.includes('drum.html')) {
        if (steerConfig) steerConfig.style.display = 'none';
        if (mapJump) mapJump.style.display = 'none';
        if (mapDuck) mapDuck.style.display = 'none';
        if (mapLeft) mapLeft.style.display = 'none';
        if (mapRight) mapRight.style.display = 'none';
        if (mapPunchL) mapPunchL.style.display = 'flex';
        if (mapPunchR) mapPunchR.style.display = 'flex';
    } else {
        if (steerConfig) steerConfig.style.display = 'none';
        if (mapJump) mapJump.style.display = 'flex';
        if (mapDuck) mapDuck.style.display = 'flex';
        if (mapLeft) mapLeft.style.display = 'flex';
        if (mapRight) mapRight.style.display = 'flex';
        if (mapPunchL) mapPunchL.style.display = 'flex';
        if (mapPunchR) mapPunchR.style.display = 'flex';
    }

    initCamera();

    // In Arcade mode, we send KeyboardEvents directly to the iframe instead of WebSocket
    window.arcadeMode = true;
    setTimeout(sendAvatarToGame, 500);
}

// Modify sendKey to support Arcade mode
const originalSendKey = sendKey;
sendKey = function(action, keyChar) {
    if (window.arcadeMode) {
        // Send synthetic event to iframe
        const frame = document.getElementById('arcadeFrame');
        if (frame && frame.contentWindow) {
            // Update HUD
            if (action === 'keydown') {
                if (activeKeys.has(keyChar)) return;
                activeKeys.add(keyChar);
            } else {
                if (!activeKeys.has(keyChar)) return;
                activeKeys.delete(keyChar);
            }
            updateHUD();

            // Dispatch via postMessage to avoid CORS/file:// protocol errors
            frame.contentWindow.postMessage({
                type: 'keyboard',
                action: action,
                key: keyChar
            }, '*');
        }
    } else {
        originalSendKey(action, keyChar);
    }
};

// Forward physical keyboard keys to iframe if in arcade mode
window.addEventListener('keydown', (e) => {
    if (!activeInput && window.arcadeMode) {
        let key = e.key.toLowerCase();
        if (key === ' ') key = 'space';
        sendKey('keydown', key);
    }
});
window.addEventListener('keyup', (e) => {
    if (!activeInput && window.arcadeMode) {
        let key = e.key.toLowerCase();
        if (key === ' ') key = 'space';
        sendKey('keyup', key);
    }
});

// Virtual Controller Buttons
window.vBtn = function(actionName, isPressed) {
    if (window.event) window.event.preventDefault();
    let keyChar = actionName === 'space' ? 'space' : mapping[actionName];
    if (!keyChar) keyChar = actionName; // fallback

    const el = window.event && window.event.target ? window.event.target : null;
    if (isPressed) {
        sendKey('keydown', keyChar);
        if (el) el.classList.add('pressed');
    } else {
        sendKey('keyup', keyChar);
        if (el) el.classList.remove('pressed');
    }
};

const toggleVCBtn = document.getElementById('toggleVCBtn');
const virtualController = document.getElementById('virtualController');
if (toggleVCBtn) {
    toggleVCBtn.addEventListener('click', () => {
        if (virtualController.style.display === 'flex') {
            virtualController.style.display = 'none';
        } else {
            virtualController.style.display = 'flex';
        }
    });
}


// Speed Slider Logic
const speedSlider = document.getElementById('speedSlider');
if (speedSlider) {
    speedSlider.addEventListener('input', (e) => {
        const frame = document.getElementById('arcadeFrame');
        if (frame && frame.contentWindow && window.arcadeMode) {
            frame.contentWindow.postMessage({ type: 'setSpeed', speed: parseFloat(e.target.value) }, '*');
        }
    });
}

// Listen for speed updates from iframe
window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'speedUpdated') {
        if (speedSlider) speedSlider.value = e.data.speed;
    }
});



// Avatar Logic
const avatarUpload = document.getElementById('avatarUpload');
const btnCaptureAvatar = document.getElementById('btnCaptureAvatar');
const avatarPreview = document.getElementById('avatarPreview');
const avatarPlaceholder = document.getElementById('avatarPlaceholder');
const enableAvatar = document.getElementById('enableAvatar');

let currentAvatarData = localStorage.getItem('playerAvatar') || null;

function updateAvatarUI() {
    if (currentAvatarData) {
        if (avatarPreview) {
            avatarPreview.src = currentAvatarData;
            avatarPreview.style.display = 'block';
        }
        if (avatarPlaceholder) avatarPlaceholder.style.display = 'none';
    }
    sendAvatarToGame();
}
if (currentAvatarData) setTimeout(updateAvatarUI, 100);

if (avatarUpload) {
    avatarUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                currentAvatarData = ev.target.result;
                localStorage.setItem('playerAvatar', currentAvatarData);
                updateAvatarUI();
            };
            reader.readAsDataURL(file);
        }
    });
}

if (btnCaptureAvatar) {
    btnCaptureAvatar.addEventListener('click', () => {
        const camVideo = document.getElementById('cameraVideo');
        if (!camVideo || !camVideo.videoWidth) {
            alert("Vui lòng d?i Camera b?t lên!");
            return;
        }
        const c = document.createElement('canvas');
        const size = Math.min(camVideo.videoWidth, camVideo.videoHeight);
        c.width = 128;
        c.height = 128;
        const ctx = c.getContext('2d');
        
        ctx.translate(128, 0);
        ctx.scale(-1, 1);
        
        const sx = (camVideo.videoWidth - size) / 2;
        const sy = (camVideo.videoHeight - size) / 2;
        
        ctx.drawImage(camVideo, sx, sy, size, size, 0, 0, 128, 128);
        currentAvatarData = c.toDataURL('image/jpeg', 0.8);
        localStorage.setItem('playerAvatar', currentAvatarData);
        updateAvatarUI();
    });
}

if (enableAvatar) {
    enableAvatar.addEventListener('change', sendAvatarToGame);
}

function sendAvatarToGame() {
    const frame = document.getElementById('arcadeFrame');
    if (frame && frame.contentWindow && window.arcadeMode) {
        frame.contentWindow.postMessage({
            type: 'setAvatar',
            avatarData: currentAvatarData,
            enabled: enableAvatar ? enableAvatar.checked : false
        }, '*');
    }
}

// Sidebar Tab Switcher
window.switchSidebarTab = function(tabName) {
    const tabKeys = document.getElementById('tabContentKeys');
    const tabSettings = document.getElementById('tabContentSettings');
    const btnKeys = document.getElementById('tabBtnKeys');
    const btnSettings = document.getElementById('tabBtnSettings');

    if (tabName === 'keys') {
        if (tabKeys) tabKeys.style.display = 'flex';
        if (tabSettings) tabSettings.style.display = 'none';
        if (btnKeys) {
            btnKeys.style.background = '#38bdf8';
            btnKeys.style.color = '#0f172a';
        }
        if (btnSettings) {
            btnSettings.style.background = '#334155';
            btnSettings.style.color = '#94a3b8';
        }
    } else {
        if (tabKeys) tabKeys.style.display = 'none';
        if (tabSettings) tabSettings.style.display = 'flex';
        if (btnSettings) {
            btnSettings.style.background = '#38bdf8';
            btnSettings.style.color = '#0f172a';
        }
        if (btnKeys) {
            btnKeys.style.background = '#334155';
            btnKeys.style.color = '#94a3b8';
        }
    }
};

