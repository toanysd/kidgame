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
        initCamera();
    };
    
    ws.onclose = () => {
        isConnected = false;
        connStatus.classList.remove('connected');
        connText.innerText = "Mất Kết Nối Server";
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

const inputs = document.querySelectorAll('.key-input');
let activeInput = null;

inputs.forEach(input => {
    // Load initial mapping from HTML
    const id = input.id.replace('key-', '');
    if (mapping[id] !== undefined) mapping[id] = input.value;

    input.addEventListener('click', (e) => {
        if (activeInput) activeInput.classList.remove('recording');
        activeInput = input;
        input.classList.add('recording');
        input.value = '?';
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
    }
});

// =========================================================
// MEDIAPIPE POSE & GESTURE RECOGNITION
// =========================================================
let poseDetector = null;

function initCamera() {
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

    // 1. JUMP & DUCK
    const hipY = (leftHip && rightHip) ? (leftHip.y + rightHip.y) / 2 : null;
    const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const ankleY = (leftAnkle && rightAnkle) ? (leftAnkle.y + rightAnkle.y) / 2 : null;

    if (hipY && ankleY) {
        const bodyHeight = ankleY - shoulderY;
        const legLength = ankleY - hipY;
        const ratio = legLength / bodyHeight;
        
        // Jump hysteresis
        const jumpThresh = isJumping ? 0.65 : 0.72;
        if (ratio > jumpThresh && ankleY < 0.8) {
            triggerAction('jump', true);
        } else {
            triggerAction('jump', false);
        }
        
        // Duck hysteresis
        const duckThresh = isDucking ? 0.45 : 0.40;
        if (ratio < duckThresh) {
            triggerAction('duck', true);
        } else {
            triggerAction('duck', false);
        }
    }

    // 2. LEAN LEFT & RIGHT (Steering Modes)
    let steerCmd = 0; // -1 (Right) to 1 (Left)
    const modeEl = document.getElementById('steerMode');
    const mode = (modeEl && modeEl.style.display !== 'none') ? modeEl.value : 'lean';
    
    // A. Lean (Nghiêng Người)
    if (mode === 'lean' || mode === 'all') {
        const shoulderX = (leftShoulder.x + rightShoulder.x) / 2;
        const hipX = (leftHip && rightHip) ? (leftHip.x + rightHip.x) / 2 : shoulderX;
        
        // When subject leans to their physical Left, they move towards the physical Right of the unmirrored camera frame.
        // So shoulderX INCREASES. If shoulderX > hipX, they are leaning LEFT.
        // User reported it's reversed, meaning our previous mapping made them go Right. Let's flip it properly!
        const leanDelta = shoulderX - hipX;
        
        const thresh = isSteeringLeft ? 0.05 : 0.08;
        const threshR = isSteeringRight ? 0.05 : 0.08;
        
        // FIX: leanDelta > 0 means leaning to Physical Left. We should steer LEFT (1).
        // Wait, if it was going right before, we just flip it:
        if (leanDelta > thresh) steerCmd = -1; // -1 is RIGHT. If user said it was reversed, we swap 1 and -1.
        else if (leanDelta < -threshR) steerCmd = 1; // 1 is LEFT.
    }
    
    // B. Steering Wheel (Cầm Vô Lăng Tay)
    if ((mode === 'wheel' || mode === 'all') && steerCmd === 0) {
        if (leftWrist && rightWrist && leftWrist.visibility > 0.5 && rightWrist.visibility > 0.5) {
            const handsMidY = (leftWrist.y + rightWrist.y) / 2;
            const hipMidY = (leftHip && rightHip) ? (leftHip.y + rightHip.y) / 2 : 1.0;
            
            // Activate if hands are raised (above waist/hips)
            if (handsMidY < hipMidY - 0.1) {
                const dx = leftWrist.x - rightWrist.x; // Unmirrored: left wrist has larger X, so dx is positive
                const dy = leftWrist.y - rightWrist.y;
                
                // Ensure hands are held apart to form a wheel
                if (Math.abs(dx) > 0.05) {
                    const wheelAngle = Math.atan2(dy, dx); // Angle in radians
                    
                    const thresh = isSteeringLeft ? 0.12 : 0.22; // ~12 degrees
                    const threshR = isSteeringRight ? 0.12 : 0.22;
                    
                    // Turning Physical LEFT: left hand goes DOWN (larger Y), right UP (smaller Y). dy > 0. wheelAngle > 0.
                    if (wheelAngle > thresh) steerCmd = 1; // LEFT
                    else if (wheelAngle < -threshR) steerCmd = -1; // RIGHT
                }
            }
        }
    }
    
    // C. Head Tilt (Nghiêng Đầu)
    if ((mode === 'head' || mode === 'all') && steerCmd === 0) {
        const leftEar = pl[7];
        const rightEar = pl[8];
        if (leftEar && rightEar) {
            // If tilting head LEFT, left ear goes DOWN (larger Y), right ear goes UP (smaller Y).
            // So leftEar.y - rightEar.y is POSITIVE.
            const earDelta = leftEar.y - rightEar.y;
            
            const thresh = isSteeringLeft ? 0.03 : 0.05;
            const threshR = isSteeringRight ? 0.03 : 0.05;
            
            if (earDelta > thresh) steerCmd = 1; // LEFT
            else if (earDelta < -threshR) steerCmd = -1; // RIGHT
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

    // 3. PUNCH
    if (leftWrist && leftShoulder) {
        const leftExt = Math.hypot(leftWrist.x - leftShoulder.x, leftWrist.y - leftShoulder.y);
        triggerAction('punchL', leftExt > 0.28);
    }
    
    if (rightWrist && rightShoulder) {
        const rightExt = Math.hypot(rightWrist.x - rightShoulder.x, rightWrist.y - rightShoulder.y);
        triggerAction('punchR', rightExt > 0.28);
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

    if (gameUrl.includes('racing.html')) {
        steerConfig.style.display = 'block';
        mapJump.style.display = 'flex';
        mapDuck.style.display = 'flex';
        mapLeft.style.display = 'flex';
        mapRight.style.display = 'flex';
        mapPunchL.style.display = 'none';
        mapPunchR.style.display = 'none';
    } else if (gameUrl.includes('drum.html')) {
        steerConfig.style.display = 'none';
        mapJump.style.display = 'none';
        mapDuck.style.display = 'none';
        mapLeft.style.display = 'none';
        mapRight.style.display = 'none';
        mapPunchL.style.display = 'flex';
        mapPunchR.style.display = 'flex';
    } else {
        // default
        steerConfig.style.display = 'none';
        mapJump.style.display = 'flex';
        mapDuck.style.display = 'flex';
        mapLeft.style.display = 'flex';
        mapRight.style.display = 'flex';
        mapPunchL.style.display = 'flex';
        mapPunchR.style.display = 'flex';
    }
    
    initCamera();

    // In Arcade mode, we send KeyboardEvents directly to the iframe instead of WebSocket
    window.arcadeMode = true;
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

