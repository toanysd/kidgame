// =========================================================
// DRAGON ARENA AR - KIDGAME
// Robot Hero vs Titan Dragon Boss AR Battle
// =========================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let WIDTH = window.innerWidth;
let HEIGHT = window.innerHeight;
canvas.width = WIDTH;
canvas.height = HEIGHT;

window.addEventListener('resize', () => {
    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
});

// Image Assets
const imgArenaBg = document.getElementById('imgArenaBg');
const imgBossDragon = document.getElementById('imgBossDragon');
const imgMinionDragon = document.getElementById('imgMinionDragon');
const imgRobotArmor = document.getElementById('imgRobotArmor');
const imgRobotFighter = document.getElementById('imgRobotFighter');

// DOM Elements
const bossHpFill = document.getElementById('bossHpFill');
const bossHpText = document.getElementById('bossHpText');
const bossNameLabel = document.getElementById('bossNameLabel');
const scoreBadge = document.getElementById('scoreBadge');
const comboText = document.getElementById('comboText');
const megaBarFill = document.getElementById('megaBarFill');
const cardPunch = document.getElementById('cardPunch');
const cardShield = document.getElementById('cardShield');
const cardMega = document.getElementById('cardMega');
const startModal = document.getElementById('startModal');
const victoryModal = document.getElementById('victoryModal');
const gameOverModal = document.getElementById('gameOverModal');
const victoryStats = document.getElementById('victoryStats');
const loadingOverlay = document.getElementById('loadingOverlay');
const btnStartGame = document.getElementById('btnStartGame');
const btnPlayAgain = document.getElementById('btnPlayAgain');
const btnRetry = document.getElementById('btnRetry');

// =========================================================
// WEB AUDIO SYNTHESIZER
// =========================================================
class SoundFX {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playLaser() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.18);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.18);
    }

    playShield() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.25);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
    }

    playMegaBeam() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        
        // Low rumble + high laser beam
        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.8);

        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(1200, now);
        osc2.frequency.exponentialRampToValueAtTime(300, now + 0.8);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc2.start(now);
        osc.stop(now + 0.8);
        osc2.stop(now + 0.8);
    }

    playHit() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);
    }

    playRoar() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(70, now + 0.6);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.6);
    }

    playVictory() {
        if (!this.ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
            const now = this.ctx.currentTime + i * 0.15;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.3);
        });
    }
}
const sfx = new SoundFX();

function speak(text) {
    if (!window.speechSynthesis) return;
    try {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'vi-VN';
        u.rate = 1.05;
        window.speechSynthesis.speak(u);
    } catch (e) {}
}

// =========================================================
// GAME STATE
// =========================================================
const GameState = {
    gameState: 'START', // 'START', 'PLAYING', 'VICTORY', 'GAMEOVER'
    wave: 1, // 1 = Minions, 2 = Dragon Boss, 3 = Enraged Boss
    score: 0,
    combo: 0,
    lastHitTime: 0,
    playerHP: 100,
    maxPlayerHP: 100,
    
    // Boss Stats
    bossMaxHP: 1000,
    bossHP: 1000,
    bossX: 0,
    bossY: 0,
    bossTargetX: 0,
    bossTargetY: 0,
    bossWidth: 260,
    bossHeight: 260,
    bossHurtTimer: 0,
    bossAttackTimer: 0,
    bossEnraged: false,

    // Gesture States
    isShieldActive: false,
    isChargingMega: false,
    megaChargeStart: 0,
    megaProgress: 0,
    megaBeamActiveUntil: 0,
    megaBeamOrigin: { x: 0, y: 0 },

    // Tracking
    prevLeftArmDist: 0,
    prevRightArmDist: 0,
    lastPunchTime: 0,
    rawLandmarks: null,
    emaPoints: {}
};

// Lists
let playerLasers = [];
let enemyFireballs = [];
let minions = [];
let particles = [];
let floatingTexts = [];

// =========================================================
// PARTICLE & EFFECTS SYSTEM
// =========================================================
class Particle {
    constructor(x, y, color, speed = 4, size = 5, life = 1) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * speed;
        this.vx = Math.cos(angle) * spd;
        this.vy = Math.sin(angle) * spd;
        this.color = color;
        this.size = size;
        this.life = life;
        this.maxLife = life;
    }

    update(dt) {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= dt;
    }

    draw(context) {
        if (this.life <= 0) return;
        const alpha = Math.max(0, this.life / this.maxLife);
        context.save();
        context.globalAlpha = alpha;
        context.fillStyle = this.color;
        context.beginPath();
        context.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
        context.fill();
        context.restore();
    }
}

function spawnExplosion(x, y, count = 20, color = '#f97316') {
    for (let i = 0; i < count; i++) {
        const colors = [color, '#facc15', '#ef4444', '#ffffff'];
        const chosen = colors[Math.floor(Math.random() * colors.length)];
        particles.push(new Particle(x, y, chosen, 8, 6, 0.4 + Math.random() * 0.4));
    }
}

function spawnFloatingText(text, x, y, color = '#fde047', size = 22) {
    floatingTexts.push({
        text: text,
        x: x,
        y: y,
        color: color,
        size: size,
        life: 0.8,
        maxLife: 0.8
    });
}

// =========================================================
// PROJECTILES & ENTITIES
// =========================================================
class LaserBullet {
    constructor(x, y, targetX, targetY) {
        this.x = x;
        this.y = y;
        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.hypot(dx, dy) || 1;
        this.speed = 18;
        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;
        this.radius = 12;
        this.life = 2.5;
        this.color = '#38bdf8';
    }

    update(dt) {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= dt;
        
        // Spawn trail particles
        if (Math.random() < 0.6) {
            particles.push(new Particle(this.x, this.y, '#06b6d4', 2, 4, 0.2));
        }
    }

    draw(context) {
        context.save();
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        const grad = context.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.5, '#38bdf8');
        grad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        context.fillStyle = grad;
        context.fill();
        context.restore();
    }
}

class Fireball {
    constructor(x, y, targetX, targetY, speed = 5, isBig = false) {
        this.x = x;
        this.y = y;
        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.hypot(dx, dy) || 1;
        this.speed = speed;
        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;
        this.radius = isBig ? 24 : 14;
        this.isBig = isBig;
        this.damage = isBig ? 25 : 12;
        this.life = 6;
    }

    update(dt) {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= dt;

        // Trail
        particles.push(new Particle(this.x, this.y, this.isBig ? '#dc2626' : '#ea580c', 3, this.isBig ? 6 : 4, 0.25));
    }

    draw(context) {
        context.save();
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        const grad = context.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(0.4, '#f97316');
        grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        context.fillStyle = grad;
        context.fill();
        context.restore();
    }
}

class Minion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 100;
        this.height = 100;
        this.hp = 60;
        this.maxHp = 60;
        this.shootTimer = 2 + Math.random() * 2;
        this.hoverOffset = Math.random() * 10;
        this.alive = true;
    }

    update(dt, now) {
        this.hoverOffset += dt * 3;
        this.y += Math.sin(this.hoverOffset) * 0.8;
        
        this.shootTimer -= dt;
        if (this.shootTimer <= 0) {
            this.shootTimer = 2.5 + Math.random() * 2;
            // Shoot fireball towards player center
            const targetX = WIDTH * 0.35;
            const targetY = HEIGHT * 0.6;
            enemyFireballs.push(new Fireball(this.x + 30, this.y + 30, targetX, targetY, 4));
        }
    }

    draw(context) {
        if (!this.alive) return;
        context.save();
        context.drawImage(imgMinionDragon, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        
        // Mini HP bar
        const hpPercent = Math.max(0, this.hp / this.maxHp);
        context.fillStyle = 'rgba(0, 0, 0, 0.6)';
        context.fillRect(this.x - 30, this.y - this.height / 2 - 12, 60, 6);
        context.fillStyle = '#4ade80';
        context.fillRect(this.x - 30, this.y - this.height / 2 - 12, 60 * hpPercent, 6);
        context.restore();
    }
}

// =========================================================
// MEDIAPIPE POSE & CAMERA
// =========================================================
const videoElement = document.createElement('video');
videoElement.style.display = 'none';
videoElement.setAttribute('playsinline', '');
videoElement.setAttribute('autoplay', '');
videoElement.setAttribute('muted', '');
videoElement.muted = true;
document.body.appendChild(videoElement);

let poseDetector = null;

function initCamera() {
    poseDetector = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    poseDetector.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6
    });

    poseDetector.onResults(onPoseResults);

    if (window.parent && window.parent.globalCameraStream) {
        videoElement.srcObject = window.parent.globalCameraStream;
        videoElement.play().catch(e => console.log('Video error:', e));
        startCameraLoop();
    } else {
        const cam = new Camera(videoElement, {
            onFrame: async () => {
                await poseDetector.send({ image: videoElement });
            },
            width: 640,
            height: 480
        });
        cam.start();
    }

    loadingOverlay.style.display = 'none';
}

function startCameraLoop() {
    let lastTime = -1;
    const loop = async () => {
        if (videoElement.readyState >= 2 && videoElement.currentTime !== lastTime) {
            lastTime = videoElement.currentTime;
            try {
                await poseDetector.send({ image: videoElement });
            } catch (e) {}
        }
        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
}

function onPoseResults(results) {
    if (!results.poseLandmarks) return;
    const now = performance.now();
    const pl = results.poseLandmarks;

    // Exponential Moving Average (EMA)
    const alpha = 0.55;
    [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].forEach(idx => {
        const raw = pl[idx];
        if (!raw) return;
        if (!GameState.emaPoints[idx]) {
            GameState.emaPoints[idx] = { x: raw.x, y: raw.y, z: raw.z };
        } else {
            GameState.emaPoints[idx].x = raw.x * alpha + GameState.emaPoints[idx].x * (1 - alpha);
            GameState.emaPoints[idx].y = raw.y * alpha + GameState.emaPoints[idx].y * (1 - alpha);
            GameState.emaPoints[idx].z = raw.z * alpha + GameState.emaPoints[idx].z * (1 - alpha);
        }
    });

    if (GameState.gameState === 'PLAYING') {
        processCombatGestures(now);
    }
}

// =========================================================
// COMBAT GESTURE RECOGNITION
// =========================================================
function processCombatGestures(now) {
    const ep = GameState.emaPoints;
    const leftWrist = ep[15];
    const rightWrist = ep[16];
    const leftShoulder = ep[11];
    const rightShoulder = ep[12];
    const leftHip = ep[23];
    const rightHip = ep[24];

    if (!leftShoulder || !rightShoulder || !leftWrist || !rightWrist) return;

    const wristDist = Math.hypot(leftWrist.x - rightWrist.x, leftWrist.y - rightWrist.y);

    // 1. MEGA BUSTER CHARGING (Wrists together < 0.12)
    if (wristDist < 0.12) {
        cardMega.classList.add('active');
        if (!GameState.isChargingMega) {
            GameState.isChargingMega = true;
            GameState.megaChargeStart = now;
        } else {
            const elapsed = (now - GameState.megaChargeStart) / 1000;
            GameState.megaProgress = Math.min(1, elapsed / 1.5);
            megaBarFill.style.width = `${GameState.megaProgress * 100}%`;

            if (GameState.megaProgress >= 1) {
                // FIRE MEGA BUSTER!
                fireMegaBuster(now, (1 - (leftWrist.x + rightWrist.x) / 2) * WIDTH, ((leftWrist.y + rightWrist.y) / 2) * HEIGHT);
            }
        }
        return; // Don't trigger punches/shields while charging
    } else {
        cardMega.classList.remove('active');
        GameState.isChargingMega = false;
        GameState.megaProgress = 0;
        megaBarFill.style.width = '0%';
    }

    // 2. SHIELD ACTIVATION (Wrists crossed in front of chest)
    if (leftWrist.y < leftShoulder.y + 0.1 && rightWrist.y < rightShoulder.y + 0.1 && wristDist < 0.22) {
        if (!GameState.isShieldActive) {
            GameState.isShieldActive = true;
            cardShield.classList.add('active');
            sfx.playShield();
        }
    } else {
        GameState.isShieldActive = false;
        cardShield.classList.remove('active');
    }

    // 3. PUNCH / LASER CANNON (Arm extension)
    const leftArmDist = Math.hypot(leftWrist.x - leftShoulder.x, leftWrist.y - leftShoulder.y);
    const rightArmDist = Math.hypot(rightWrist.x - rightShoulder.x, rightWrist.y - rightShoulder.y);

    if (now - GameState.lastPunchTime > 280) {
        if (leftArmDist > 0.24 && leftArmDist - GameState.prevLeftArmDist > 0.018) {
            firePlayerLaser((1 - leftWrist.x) * WIDTH, leftWrist.y * HEIGHT);
            GameState.lastPunchTime = now;
            cardPunch.classList.add('active');
            setTimeout(() => cardPunch.classList.remove('active'), 200);
        } else if (rightArmDist > 0.24 && rightArmDist - GameState.prevRightArmDist > 0.018) {
            firePlayerLaser((1 - rightWrist.x) * WIDTH, rightWrist.y * HEIGHT);
            GameState.lastPunchTime = now;
            cardPunch.classList.add('active');
            setTimeout(() => cardPunch.classList.remove('active'), 200);
        }
    }

    GameState.prevLeftArmDist = leftArmDist;
    GameState.prevRightArmDist = rightArmDist;
}

function firePlayerLaser(originX, originY) {
    sfx.playLaser();
    
    // Target Boss or Nearest Minion
    let targetX = GameState.bossX;
    let targetY = GameState.bossY;

    if (GameState.wave === 1 && minions.length > 0) {
        const aliveMinions = minions.filter(m => m.alive);
        if (aliveMinions.length > 0) {
            targetX = aliveMinions[0].x;
            targetY = aliveMinions[0].y;
        }
    }

    playerLasers.push(new LaserBullet(originX, originY, targetX, targetY));
    spawnExplosion(originX, originY, 6, '#38bdf8');
}

function fireMegaBuster(now, originX, originY) {
    GameState.isChargingMega = false;
    GameState.megaProgress = 0;
    megaBarFill.style.width = '0%';
    GameState.megaBeamActiveUntil = now + 900;
    GameState.megaBeamOrigin = { x: originX, y: originY };

    sfx.playMegaBeam();
    speak("Đại bác Mega Buster!");

    // Deal huge damage to Boss
    const damage = 220;
    damageBoss(damage, originX, originY, true);
    spawnExplosion(GameState.bossX, GameState.bossY, 40, '#38bdf8');
    spawnFloatingText(`MEGA CRIT! -${damage}`, GameState.bossX, GameState.bossY - 40, '#38bdf8', 32);

    // Destroy all fireballs on screen!
    enemyFireballs.forEach(fb => spawnExplosion(fb.x, fb.y, 8, '#f97316'));
    enemyFireballs = [];

    // Screen Shake effect
    triggerScreenShake();
}

function damageBoss(damage, hitX, hitY, isMega = false) {
    GameState.bossHP = Math.max(0, GameState.bossHP - damage);
    GameState.bossHurtTimer = performance.now() + 250;
    sfx.playHit();

    // Update Combo & Score
    GameState.combo++;
    GameState.lastHitTime = performance.now();
    GameState.score += damage * 10 * Math.min(GameState.combo, 10);
    updateHUD();

    if (!isMega) {
        spawnExplosion(hitX, hitY, 15, '#f59e0b');
        spawnFloatingText(`-${damage}`, hitX, hitY - 20, '#fbbf24', 24);
    }

    // Check Phase Enrage
    if (GameState.bossHP <= 400 && !GameState.bossEnraged) {
        GameState.bossEnraged = true;
        sfx.playRoar();
        speak("Cảnh báo! Rồng Lửa Cuồng Nộ!");
        spawnFloatingText('🔥 CUỒNG NỘ RỰC LỬA! 🔥', WIDTH / 2, HEIGHT * 0.35, '#ef4444', 36);
    }

    // Check Victory
    if (GameState.bossHP <= 0) {
        onVictory();
    }
}

let screenShakeTimer = 0;
function triggerScreenShake(duration = 400) {
    screenShakeTimer = performance.now() + duration;
}

// =========================================================
// GAME LOOP & RENDERING
// =========================================================
let lastFrameTime = performance.now();

function gameLoop(now) {
    requestAnimationFrame(gameLoop);
    const dt = Math.min((now - lastFrameTime) / 1000, 0.1);
    lastFrameTime = now;

    // Clear Canvas
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Apply Screen Shake if active
    ctx.save();
    if (now < screenShakeTimer) {
        const shakeX = (Math.random() - 0.5) * 12;
        const shakeY = (Math.random() - 0.5) * 12;
        ctx.translate(shakeX, shakeY);
    }

    // 1. Draw Background (Cyber Arena Stage + Webcam feed blend)
    drawBackground();

    // 2. Draw Player Avatar & Robot Armor AR
    drawPlayerAvatar(now);

    // 3. Update & Draw Enemies (Minions / Dragon Boss)
    if (GameState.gameState === 'PLAYING') {
        updateEnemies(dt, now);
    }
    drawEnemies(now);

    // 4. Update & Draw Projectiles & Mega Buster Beam
    updateAndDrawProjectiles(dt, now);

    // 5. Draw Particle VFX & Floating Texts
    particles.forEach((p, idx) => {
        p.update(dt);
        p.draw(ctx);
        if (p.life <= 0) particles.splice(idx, 1);
    });

    floatingTexts.forEach((ft, idx) => {
        ft.y -= dt * 40;
        ft.life -= dt;
        const alpha = Math.max(0, ft.life / ft.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = ft.color;
        ctx.font = `900 ${ft.size}px 'Be Vietnam Pro', sans-serif`;
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 8;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
        if (ft.life <= 0) floatingTexts.splice(idx, 1);
    });

    // Combo timer decay
    if (now - GameState.lastHitTime > 3000 && GameState.combo > 0) {
        GameState.combo = 0;
        comboText.classList.remove('active');
    }

    ctx.restore();
}

function drawBackground() {
    // Draw Cyber Arena Background
    if (imgArenaBg && imgArenaBg.complete) {
        ctx.drawImage(imgArenaBg, 0, 0, WIDTH, HEIGHT);
    }

    // Blend mirrored camera feed softly in the background
    if (videoElement && videoElement.readyState >= 2) {
        ctx.save();
        ctx.globalAlpha = 0.28;
        ctx.translate(WIDTH, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoElement, 0, 0, WIDTH, HEIGHT);
        ctx.restore();
    }
}

function drawPlayerAvatar(now) {
    const ep = GameState.emaPoints;
    if (!ep || !ep[11] || !ep[12]) return;

    const leftShoulder = ep[11];
    const rightShoulder = ep[12];
    const leftHip = ep[23];
    const rightHip = ep[24];
    const leftWrist = ep[15];
    const rightWrist = ep[16];

    // Chest center in Canvas pixels (mirrored X)
    const chestX = (1 - (leftShoulder.x + rightShoulder.x) / 2) * WIDTH;
    const chestY = ((leftShoulder.y + rightShoulder.y) / 2) * HEIGHT;
    const shoulderDistPx = Math.abs(leftShoulder.x - rightShoulder.x) * WIDTH;

    // Draw Robot Armor Suit overlay onto Player Torso
    if (imgRobotArmor && imgRobotArmor.complete && shoulderDistPx > 40) {
        const armorWidth = shoulderDistPx * 2.3;
        const armorHeight = armorWidth * (imgRobotArmor.height / imgRobotArmor.width);
        
        ctx.save();
        ctx.drawImage(
            imgRobotArmor,
            chestX - armorWidth / 2,
            chestY - armorHeight * 0.28,
            armorWidth,
            armorHeight
        );
        ctx.restore();
    }

    // Draw Glowing Cyber Gauntlets on Wrists
    [leftWrist, rightWrist].forEach((w, idx) => {
        if (!w) return;
        const wx = (1 - w.x) * WIDTH;
        const wy = w.y * HEIGHT;

        ctx.save();
        ctx.beginPath();
        ctx.arc(wx, wy, 14, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(wx, wy, 0, wx, wy, 14);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.5, '#06b6d4');
        grad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
    });

    // Draw Energy Shield if Active
    if (GameState.isShieldActive) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(chestX, chestY, shoulderDistPx * 1.8, 0, Math.PI * 2);
        const shieldGrad = ctx.createRadialGradient(chestX, chestY, 0, chestX, chestY, shoulderDistPx * 1.8);
        shieldGrad.addColorStop(0, 'rgba(56, 189, 248, 0.15)');
        shieldGrad.addColorStop(0.8, 'rgba(14, 165, 233, 0.45)');
        shieldGrad.addColorStop(1, 'rgba(255, 255, 255, 0.9)');
        ctx.fillStyle = shieldGrad;
        ctx.fill();

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 20;
        ctx.stroke();
        ctx.restore();
    }

    // Draw Mega Buster Charging Aura
    if (GameState.isChargingMega && leftWrist && rightWrist) {
        const cx = (1 - (leftWrist.x + rightWrist.x) / 2) * WIDTH;
        const cy = ((leftWrist.y + rightWrist.y) / 2) * HEIGHT;
        const radius = 20 + GameState.megaProgress * 50;

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        const auraGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        auraGrad.addColorStop(0, '#ffffff');
        auraGrad.addColorStop(0.5, '#38bdf8');
        auraGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = auraGrad;
        ctx.fill();
        ctx.restore();
    }
}

function updateEnemies(dt, now) {
    if (GameState.wave === 1) {
        // Wave 1: Minions
        minions.forEach(m => m.update(dt, now));
        const allMinionsDead = minions.length > 0 && minions.every(m => !m.alive);
        if (allMinionsDead) {
            // Transition to Boss Wave!
            GameState.wave = 2;
            sfx.playRoar();
            speak("Rồng Lửa Titan xuất hiện!");
            spawnFloatingText("🐉 RỒNG LỬA TITAN XUẤT HIỆN! 🐉", WIDTH / 2, HEIGHT * 0.3, "#f43f5e", 32);
            GameState.bossX = WIDTH * 0.75;
            GameState.bossY = HEIGHT * 0.45;
        }
    } else {
        // Wave 2 & 3: Dragon Boss
        // Floating hover movement
        GameState.bossTargetX = WIDTH * 0.75 + Math.sin(now / 1200) * 60;
        GameState.bossTargetY = HEIGHT * 0.45 + Math.cos(now / 900) * 45;
        GameState.bossX += (GameState.bossTargetX - GameState.bossX) * 0.05;
        GameState.bossY += (GameState.bossTargetY - GameState.bossY) * 0.05;

        // Boss Attack Cycle
        if (now > GameState.bossAttackTimer) {
            const attackInterval = GameState.bossEnraged ? 1800 : 2800;
            GameState.bossAttackTimer = now + attackInterval;

            const playerTargetX = WIDTH * 0.35;
            const playerTargetY = HEIGHT * 0.55;

            if (GameState.bossEnraged && Math.random() < 0.5) {
                // Shoot 3 Fireballs in Fan Pattern!
                enemyFireballs.push(new Fireball(GameState.bossX - 80, GameState.bossY - 20, playerTargetX, playerTargetY - 80, 6, true));
                enemyFireballs.push(new Fireball(GameState.bossX - 80, GameState.bossY, playerTargetX, playerTargetY, 6, true));
                enemyFireballs.push(new Fireball(GameState.bossX - 80, GameState.bossY + 20, playerTargetX, playerTargetY + 80, 6, true));
            } else {
                // Standard Fireball
                enemyFireballs.push(new Fireball(GameState.bossX - 80, GameState.bossY, playerTargetX, playerTargetY, 5, GameState.bossEnraged));
            }
            sfx.playRoar();
        }
    }
}

function drawEnemies(now) {
    if (GameState.wave === 1) {
        minions.forEach(m => m.draw(ctx));
    } else {
        // Draw Dragon Boss
        if (!imgBossDragon || !imgBossDragon.complete) return;

        ctx.save();
        const isHurt = now < GameState.bossHurtTimer;
        if (isHurt) {
            ctx.filter = 'brightness(2) drop-shadow(0 0 25px #ef4444)';
        } else if (GameState.bossEnraged) {
            ctx.filter = 'drop-shadow(0 0 30px #f97316)';
        }

        const bw = GameState.bossWidth * (GameState.bossEnraged ? 1.15 : 1);
        const bh = GameState.bossHeight * (GameState.bossEnraged ? 1.15 : 1);
        ctx.drawImage(imgBossDragon, GameState.bossX - bw / 2, GameState.bossY - bh / 2, bw, bh);
        ctx.restore();
    }
}

function updateAndDrawProjectiles(dt, now) {
    // 1. Player Lasers
    playerLasers.forEach((laser, lIdx) => {
        laser.update(dt);
        laser.draw(ctx);

        // Check hit with Boss
        if (GameState.wave >= 2) {
            const dist = Math.hypot(laser.x - GameState.bossX, laser.y - GameState.bossY);
            if (dist < GameState.bossWidth * 0.45) {
                damageBoss(35, laser.x, laser.y);
                playerLasers.splice(lIdx, 1);
                return;
            }
        } else {
            // Check hit with Minions
            minions.forEach(m => {
                if (!m.alive) return;
                const dist = Math.hypot(laser.x - m.x, laser.y - m.y);
                if (dist < m.width * 0.45) {
                    m.hp -= 35;
                    spawnExplosion(laser.x, laser.y, 10, '#38bdf8');
                    sfx.playHit();
                    if (m.hp <= 0) {
                        m.alive = false;
                        spawnExplosion(m.x, m.y, 25, '#fbbf24');
                        spawnFloatingText('+500', m.x, m.y, '#fde047', 24);
                        GameState.score += 500;
                        updateHUD();
                    }
                    playerLasers.splice(lIdx, 1);
                }
            });
        }

        // Out of screen
        if (laser.x < 0 || laser.x > WIDTH || laser.y < 0 || laser.y > HEIGHT || laser.life <= 0) {
            playerLasers.splice(lIdx, 1);
        }
    });

    // 2. Enemy Fireballs
    const ep = GameState.emaPoints;
    const playerChestX = ep && ep[11] && ep[12] ? (1 - (ep[11].x + ep[12].x) / 2) * WIDTH : WIDTH * 0.35;
    const playerChestY = ep && ep[11] && ep[12] ? ((ep[11].y + ep[12].y) / 2) * HEIGHT : HEIGHT * 0.55;

    enemyFireballs.forEach((fb, fbIdx) => {
        fb.update(dt);
        fb.draw(ctx);

        // Check hit with Player
        const distToPlayer = Math.hypot(fb.x - playerChestX, fb.y - playerChestY);
        if (distToPlayer < 90) {
            if (GameState.isShieldActive) {
                // DEFLECTED BY SHIELD!
                spawnExplosion(fb.x, fb.y, 18, '#38bdf8');
                spawnFloatingText('🛡️ ĐỠ THÀNH CÔNG!', fb.x, fb.y - 20, '#38bdf8', 20);
                sfx.playShield();
                GameState.score += 150;
                updateHUD();
                enemyFireballs.splice(fbIdx, 1);
                return;
            } else {
                // HIT PLAYER!
                GameState.playerHP = Math.max(0, GameState.playerHP - fb.damage);
                spawnExplosion(playerChestX, playerChestY, 20, '#ef4444');
                spawnFloatingText(`-${fb.damage} HP`, playerChestX, playerChestY - 30, '#ef4444', 26);
                sfx.playHit();
                triggerScreenShake();
                enemyFireballs.splice(fbIdx, 1);

                if (GameState.playerHP <= 0) {
                    onGameOver();
                }
                return;
            }
        }

        if (fb.life <= 0 || fb.x < -50 || fb.x > WIDTH + 50 || fb.y < -50 || fb.y > HEIGHT + 50) {
            enemyFireballs.splice(fbIdx, 1);
        }
    });

    // 3. Mega Buster Laser Beam
    if (now < GameState.megaBeamActiveUntil) {
        ctx.save();
        const startX = GameState.megaBeamOrigin.x;
        const startY = GameState.megaBeamOrigin.y;
        const endX = WIDTH + 100;
        const endY = GameState.bossY;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
        ctx.lineWidth = 45;
        ctx.lineCap = 'round';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 35;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 18;
        ctx.stroke();
        ctx.restore();
    }
}

// =========================================================
// HUD & STATE HANDLERS
// =========================================================
function updateHUD() {
    scoreBadge.textContent = `⭐ ĐIỂM: ${GameState.score}`;
    const hpPercent = Math.max(0, (GameState.bossHP / GameState.bossMaxHP) * 100);
    bossHpFill.style.width = `${hpPercent}%`;
    bossHpText.textContent = `HP: ${GameState.bossHP} / ${GameState.bossMaxHP}`;

    if (GameState.combo > 1) {
        comboText.textContent = `🔥 ${GameState.combo}x COMBO!`;
        comboText.classList.add('active');
    }
}

function startBattle() {
    sfx.init();
    startModal.style.display = 'none';
    victoryModal.style.display = 'none';
    gameOverModal.style.display = 'none';

    GameState.gameState = 'PLAYING';
    GameState.wave = 1;
    GameState.score = 0;
    GameState.combo = 0;
    GameState.playerHP = 100;
    GameState.bossHP = 1000;
    GameState.bossEnraged = false;
    GameState.bossX = WIDTH * 0.75;
    GameState.bossY = HEIGHT * 0.45;

    playerLasers = [];
    enemyFireballs = [];
    particles = [];
    floatingTexts = [];

    // Spawn Wave 1 Minions
    minions = [
        new Minion(WIDTH * 0.7, HEIGHT * 0.25),
        new Minion(WIDTH * 0.85, HEIGHT * 0.5),
        new Minion(WIDTH * 0.7, HEIGHT * 0.75)
    ];

    updateHUD();
    speak("Đấu trường bắt đầu! Hãy tiêu diệt quái thú!");
}

function onVictory() {
    GameState.gameState = 'VICTORY';
    sfx.playVictory();
    speak("Chúc mừng dũng sĩ! Bé đã chiến thắng!");
    victoryStats.innerHTML = `Bé đã đánh bại Rồng Lửa Titan!<br><br><strong>Tổng Điểm: ${GameState.score}</strong>`;
    victoryModal.style.display = 'flex';
}

function onGameOver() {
    GameState.gameState = 'GAMEOVER';
    speak("Hết máu rồi! Hãy thử lại nhé!");
    gameOverModal.style.display = 'flex';
}

// Button Listeners
btnStartGame.addEventListener('click', startBattle);
btnPlayAgain.addEventListener('click', startBattle);
btnRetry.addEventListener('click', startBattle);

// Start
initCamera();
requestAnimationFrame(gameLoop);
