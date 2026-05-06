const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const loadingEl = document.getElementById('loading');
const uiEl = document.getElementById('ui');
const startBtn = document.getElementById('startBtn');

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

// --- Game State ---
let score = 0;
let timeLimitSetting = parseInt(localStorage.getItem('kidgame_time_limit') || '5');
let timeRemaining = timeLimitSetting === 999 ? 999999 : timeLimitSetting * 60;
let gameOver = false;
let gameStarted = false;
let fruits = [];
let particles = [];
let bladeTrail = []; 
let lastTimeUpdate = 0;
let currentThemeKey = null; // Store current theme for replay
let isCameraRunning = false;

// --- WebRTC Streaming (Removed, handled by Hub continuously) ---

// --- TTS Function ---
function speakText(text) {
    if (!window.speechSynthesis) return;
    // Cancel previous to not overlap too much if slicing fast
    // window.speechSynthesis.cancel(); 
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; 
    utterance.rate = 1.0; 
    window.speechSynthesis.speak(utterance);
}

// --- Video Element ---
const videoElement = document.createElement('video');
videoElement.width = WIDTH;
videoElement.height = HEIGHT;
videoElement.setAttribute('playsinline', '');
videoElement.style.display = 'none';

// --- MediaPipe Hands ---
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
});

let currentHands = [];
hands.onResults((results) => {
    if (!gameStarted) return;
    loadingEl.style.display = 'none';
    currentHands = results.multiHandLandmarks || [];
    
    const now = performance.now();
    currentHands.forEach(hand => {
        const finger = hand[8]; // Index finger tip
        if (finger) {
            const x = (1 - finger.x) * WIDTH;
            const y = finger.y * HEIGHT;
            bladeTrail.push({x, y, time: now});
        }
    });
});

const camera = new Camera(videoElement, {
    onFrame: async () => {
        if (gameStarted) {
            await hands.send({image: videoElement});
        }
    },
    width: 640,
    height: 480
});

// START CAMERA AND WEBRTC IMMEDIATELY IN BACKGROUND
camera.start();
isCameraRunning = true;
initWebRTC(); // Initialize streamer immediately
window.gameLoopRunning = true;
requestAnimationFrame(loop); // Start loop to render background feed

let ALL_SPAWN_TYPES = [];

function startGame() {
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    uiEl.style.display = 'block';
    loadingEl.style.display = 'block';
    
    // Init speech synthesis with dummy text to unlock it in browser
    speakText("Let's play!");

    // Reset game state
    score = 0;
    timeLimitSetting = parseInt(localStorage.getItem('kidgame_time_limit') || '5');
    timeRemaining = timeLimitSetting === 999 ? 999999 : timeLimitSetting * 60;
    gameOver = false;
    fruits = [];
    particles = [];
    bladeTrail = [];
    updateUI();

    gameStarted = true;
    lastTimeUpdate = performance.now();
}

// Function to process a list of theme items
const loadThemeItems = (items) => {
    items.forEach(item => {
        let imgObj = null;
        if (item.src) {
            imgObj = new Image();
            imgObj.src = item.src;
        }
        let audioObj = null;
        if (item.audio) {
            audioObj = new Audio(item.audio);
        }
        
        ALL_SPAWN_TYPES.push({
            emoji: item.emoji,
            img: imgObj,
            name: item.name,
            audio: audioObj,
            color: item.color || '#facc15',
            size: item.size || 50
        });
    });
};

// Handle Theme Cards
document.querySelectorAll('.theme-card').forEach(card => {
    card.addEventListener('click', () => {
        const theme = card.getAttribute('data-theme');
        ALL_SPAWN_TYPES = []; // Reset
        
        if (theme === 'mixed') {
            for (let key in THEMES) {
                loadThemeItems(THEMES[key]);
            }
        } else if (THEMES[theme]) {
            loadThemeItems(THEMES[theme]);
        }
        
        startGame();
    });
});

// Handle file/folder upload
const imageUpload = document.getElementById('imageUpload');
const uploadStatus = document.getElementById('uploadStatus');

if (imageUpload) {
    imageUpload.addEventListener('change', (e) => {
        const files = e.target.files;
        let fileDict = {};

        // Group files by base name
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            let name = file.name.split('.').slice(0, -1).join('.');
            
            if (!fileDict[name]) fileDict[name] = {};
            
            if (file.type.startsWith('image/')) {
                fileDict[name].image = URL.createObjectURL(file);
            } else if (file.type.startsWith('audio/') || file.name.endsWith('.mp3') || file.name.endsWith('.wav')) {
                fileDict[name].audio = URL.createObjectURL(file);
            }
        }

        // Push to game library
        ALL_SPAWN_TYPES = []; // Reset
        let count = 0;
        for (const [name, data] of Object.entries(fileDict)) {
            if (data.image) {
                const img = new Image();
                img.src = data.image;
                
                let audioObj = null;
                if (data.audio) {
                    audioObj = new Audio(data.audio);
                }

                ALL_SPAWN_TYPES.push({
                    emoji: '?',
                    img: img,
                    name: name,
                    audio: audioObj,
                    color: '#facc15',
                    size: 60
                });
                count++;
            }
        }
        
        if (count > 0) {
            startGame();
        } else {
            uploadStatus.innerText = "Không tìm thấy ảnh hợp lệ trong thư mục!";
        }
    });
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 1.0;
        this.color = color;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2; 
        this.life -= 0.02;
    }
    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

class Spawnable {
    constructor(isHalf = false, parentType = null, x = 0, y = 0, vx = 0, vy = 0, halfSide = 1) {
        this.isHalf = isHalf;
        this.halfSide = halfSide; // 1 for right, -1 for left
        if (!isHalf) {
            this.type = ALL_SPAWN_TYPES[Math.floor(Math.random() * ALL_SPAWN_TYPES.length)];
            this.radius = this.type.size;
            this.x = Math.random() * (WIDTH - 150) + 75;
            this.y = HEIGHT + this.radius;
            
            const targetX = WIDTH / 2 + (Math.random() - 0.5) * 200;
            this.vx = (targetX - this.x) / 70;
            this.vy = -13 - Math.random() * 3; 
            this.rotation = 0;
            this.spin = (Math.random() - 0.5) * 0.1;
        } else {
            this.type = parentType;
            this.radius = parentType.size;
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.rotation = Math.random() * Math.PI * 2;
            this.spin = (Math.random() - 0.5) * 0.4;
        }
        this.sliced = false;
        this.toRemove = false;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.20; // Gravity
        this.rotation += this.spin;

        if (this.y > HEIGHT + this.radius + 50) {
            this.toRemove = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        if (this.isHalf) {
            // Draw half emoji by clipping
            ctx.beginPath();
            if (this.halfSide === 1) {
                ctx.rect(0, -this.radius*2, this.radius*2, this.radius*4);
            } else {
                ctx.rect(-this.radius*2, -this.radius*2, this.radius*2, this.radius*4);
            }
            ctx.clip();
        }

        if (this.type.img) {
            // Draw Custom Image
            const r = this.radius;
            // Optionally make it circular
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(this.type.img, -r, -r, r * 2, r * 2);
        } else {
            // Draw Emoji
            ctx.font = `${this.radius * 1.5}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.type.emoji, 0, 0);
        }

        ctx.restore();

        // Draw English Word below (only if not sliced)
        if (!this.isHalf) {
            ctx.save();
            ctx.font = `bold 24px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 4;
            ctx.strokeText(this.type.name, this.x, this.y + this.radius + 15);
            ctx.fillText(this.type.name, this.x, this.y + this.radius + 15);
            ctx.restore();
        }
    }
}

function updateUI() {
    const texts = window.langTexts || { score_t: "Điểm: ", time_t: "Thời gian: " };
    scoreEl.innerText = `${texts.score_t}${score}`;
    if (timeLimitSetting === 999) {
        timeEl.innerText = `${texts.time_t} Vô cực`;
    } else {
        const m = Math.floor(timeRemaining / 60);
        const s = timeRemaining % 60;
        timeEl.innerText = `${texts.time_t}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
}

// Line intersection with circle math
function lineIntersectsCircle(x1, y1, x2, y2, cx, cy, r) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const fx = x1 - cx;
    const fy = y1 - cy;
    
    const a = dx*dx + dy*dy;
    const b = 2 * (fx*dx + fy*dy);
    const c = (fx*fx + fy*fy) - r*r;
    
    let discriminant = b*b - 4*a*c;
    if (discriminant < 0) return false;
    
    discriminant = Math.sqrt(discriminant);
    const t1 = (-b - discriminant) / (2*a);
    const t2 = (-b + discriminant) / (2*a);
    
    if (t1 >= 0 && t1 <= 1) return true;
    if (t2 >= 0 && t2 <= 1) return true;
    return false;
}

// --- Main Loop ---
let lastSpawn = 0;

function loop(timestamp) {
    requestAnimationFrame(loop);

    // 1. Draw Camera Feed
    if (videoElement.readyState >= 2) {
        // Calculate Object-Fit: Cover
        const vRatio = videoElement.videoWidth / videoElement.videoHeight;
        const cRatio = WIDTH / HEIGHT;
        let drawW, drawH, drawX, drawY;
        
        if (vRatio > cRatio) {
            drawH = HEIGHT;
            drawW = HEIGHT * vRatio;
            drawX = (WIDTH - drawW) / 2;
            drawY = 0;
        } else {
            drawW = WIDTH;
            drawH = WIDTH / vRatio;
            drawX = 0;
            drawY = (HEIGHT - drawH) / 2;
        }

        ctx.save();
        ctx.translate(WIDTH, 0);
        ctx.scale(-1, 1);
        // Draw flipped correctly. drawX is already the correct positive offset for centered drawing.
        ctx.drawImage(videoElement, drawX, drawY, drawW, drawH);
        ctx.restore();
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
    } else {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    // Stop processing gameplay logic if game hasn't started or is over
    if (!gameStarted || gameOver) {
        return;
    }

    // Timer Update
    if (timestamp - lastTimeUpdate >= 1000) {
        timeRemaining--;
        updateUI();
        lastTimeUpdate = timestamp;
        if (timeRemaining <= 0) {
            gameOver = true;
            const texts = window.langTexts || { score_t: "Điểm: " };
            document.getElementById('gameOverScreen').style.display = 'flex';
            document.getElementById('finalScoreText').innerText = `${texts.score_t}${score}`;
        }
    }

    const now = performance.now();

    bladeTrail = bladeTrail.filter(p => now - p.time < 150);

    // Spawn 
    if (now - lastSpawn > 2000) { 
        const count = 1 + Math.floor(Math.random() * 2); 
        for(let i=0; i<count; i++) {
            fruits.push(new Spawnable());
        }
        lastSpawn = now;
    }

    // Process Slicing Logic
    if (bladeTrail.length > 1) {
        for (let i = 0; i < bladeTrail.length - 1; i++) {
            const p1 = bladeTrail[i];
            const p2 = bladeTrail[i+1];
            
            fruits.forEach(f => {
                if (!f.isHalf && !f.sliced && !f.toRemove) {
                    if (lineIntersectsCircle(p1.x, p1.y, p2.x, p2.y, f.x, f.y, f.radius)) {
                        f.sliced = true;
                        f.toRemove = true;
                        
                        score += 10;
                        updateUI();
                        
                        const sfxSetting = localStorage.getItem('kidgame_sfx') || 'on';
                        if (sfxSetting === 'on') {
                            if (f.type.audio) {
                                let sound = f.type.audio.cloneNode();
                                sound.play().catch(e => console.log(e));
                            } else {
                                speakText(f.type.name);
                            }
                        }

                        // Spawn Halves
                        fruits.push(new Spawnable(true, f.type, f.x, f.y, f.vx - 3, f.vy, -1));
                        fruits.push(new Spawnable(true, f.type, f.x, f.y, f.vx + 3, f.vy, 1));
                        
                        // Spawn Particles
                        for(let j=0; j<15; j++) {
                            particles.push(new Particle(f.x, f.y, f.type.color));
                        }
                    }
                }
            });
        }
    }

    // Update & Draw
    fruits = fruits.filter(f => !f.toRemove);
    fruits.forEach(f => {
        f.update();
        f.draw(ctx);
    });

    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
        p.update();
        p.draw(ctx);
    });

    // Draw Blade Trail
    if (bladeTrail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(bladeTrail[0].x, bladeTrail[0].y);
        for(let i=1; i<bladeTrail.length; i++) {
            ctx.lineTo(bladeTrail[i].x, bladeTrail[i].y);
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 20;
        ctx.stroke();
        ctx.shadowBlur = 0; 
    }
}

const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const replayBtn = document.getElementById('replayBtn');
const menuBtn = document.getElementById('menuBtn');

replayBtn.addEventListener('click', () => {
    startGame();
});

menuBtn.addEventListener('click', () => {
    gameOverScreen.style.display = 'none';
    uiEl.style.display = 'none';
    startScreen.style.display = 'flex';
    gameStarted = false;
});
