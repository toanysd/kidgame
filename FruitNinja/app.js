const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const loadingEl = document.getElementById('loading');
const uiEl = document.getElementById('ui');
const startBtn = document.getElementById('startBtn');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// --- Game State ---
let score = 0;
let timeRemaining = 180; // 3 minutes = 180 seconds
let gameOver = false;
let gameStarted = false;
let fruits = [];
let particles = [];
let bladeTrail = []; 
let lastTimeUpdate = 0;

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

// --- Game Logic ---
const SPAWN_TYPES = [
    { emoji: '🍎', name: 'Apple', color: '#ef4444', size: 40 },
    { emoji: '🍉', name: 'Watermelon', color: '#22c55e', size: 45 },
    { emoji: '🤖', name: 'Robot', color: '#6b7280', size: 50 },
    { emoji: '🚆', name: 'Train', color: '#3b82f6', size: 50 },
    { emoji: '🚅', name: 'Shinkansen', color: '#f8fafc', size: 55 },
    { emoji: '🚧', name: 'Barrier', color: '#eab308', size: 40 },
    { emoji: '🦸‍♂️', name: 'Hero', color: '#ef4444', size: 45 }, // Anpanman representation
    { emoji: '🔴', name: 'Red', color: '#ef4444', size: 35 },
    { emoji: '🔵', name: 'Blue', color: '#3b82f6', size: 35 },
    { emoji: '🟡', name: 'Yellow', color: '#eab308', size: 35 },
    { emoji: '🟢', name: 'Green', color: '#22c55e', size: 35 }
];

let ALL_SPAWN_TYPES = [...SPAWN_TYPES];

// Load static library if exists
if (typeof CUSTOM_LIBRARY !== 'undefined') {
    CUSTOM_LIBRARY.forEach(item => {
        const img = new Image();
        img.src = item.src;
        ALL_SPAWN_TYPES.push({
            img: img,
            name: item.name,
            color: '#facc15',
            size: item.size || 50
        });
    });
}

// Handle file upload
const imageUpload = document.getElementById('imageUpload');
const uploadStatus = document.getElementById('uploadStatus');

if (imageUpload) {
    imageUpload.addEventListener('change', (e) => {
        const files = e.target.files;
        let count = 0;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type.startsWith('image/')) {
                const url = URL.createObjectURL(file);
                const img = new Image();
                img.src = url;
                let name = file.name.split('.').slice(0, -1).join('.');
                ALL_SPAWN_TYPES.push({
                    img: img,
                    name: name,
                    color: '#facc15',
                    size: 60
                });
                count++;
            }
        }
        uploadStatus.innerText = `Đã thêm ${count} ảnh vào game! (Sẽ xuất hiện ngẫu nhiên)`;
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
    scoreEl.innerText = `Điểm: ${score}`;
    const m = Math.floor(timeRemaining / 60);
    const s = timeRemaining % 60;
    timeEl.innerText = `Thời gian: ${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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

    if (!gameStarted) return;

    // Timer Update
    if (!gameOver && timestamp - lastTimeUpdate >= 1000) {
        timeRemaining--;
        updateUI();
        lastTimeUpdate = timestamp;
        if (timeRemaining <= 0) {
            gameOver = true;
        }
    }

    // 1. Draw Camera Feed
    if (videoElement.readyState >= 2) {
        ctx.save();
        ctx.translate(WIDTH, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoElement, 0, 0, WIDTH, HEIGHT);
        ctx.restore();
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
    } else {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    if (gameOver) {
        ctx.fillStyle = 'white';
        ctx.font = '50px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('HẾT GIỜ!', WIDTH/2, HEIGHT/2);
        ctx.font = '30px Outfit, sans-serif';
        ctx.fillText(`Tuyệt vời! Bé đạt được: ${score} điểm`, WIDTH/2, HEIGHT/2 + 60);
        return;
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
                        speakText(f.type.name);

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
startBtn.addEventListener('click', () => {
    startScreen.style.display = 'none';
    uiEl.style.display = 'block';
    loadingEl.style.display = 'block';
    
    // Init speech synthesis with dummy text to unlock it in browser
    speakText("Let's play!");

    gameStarted = true;
    lastTimeUpdate = performance.now();
    camera.start();
    requestAnimationFrame(loop);
});
