const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const loadingEl = document.getElementById('loading');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// --- Game State ---
let score = 0;
let lives = 3;
let gameOver = false;
let fruits = [];
let particles = [];
let bladeTrail = []; // Array of {x, y, time}

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
    modelComplexity: 1, // Low spec
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
});

let currentHands = [];

hands.onResults((results) => {
    loadingEl.style.display = 'none';
    currentHands = results.multiHandLandmarks || [];
    
    // Update blade trail based on index finger tip (landmark 8)
    const now = performance.now();
    currentHands.forEach(hand => {
        const finger = hand[8]; // Index finger tip
        if (finger) {
            // Mirror X because camera is mirrored
            const x = (1 - finger.x) * WIDTH;
            const y = finger.y * HEIGHT;
            bladeTrail.push({x, y, time: now});
        }
    });
});

// Start Camera
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({image: videoElement});
    },
    width: 640,
    height: 480
});
camera.start();

// --- Game Logic ---
const FRUIT_TYPES = [
    { color: '#ef4444', name: 'Apple', radius: 30 },
    { color: '#22c55e', name: 'Watermelon', radius: 40 },
    { color: '#f97316', name: 'Orange', radius: 35 },
    { color: '#eab308', name: 'Banana', radius: 25 },
    { color: '#111827', name: 'Bomb', radius: 35, isBomb: true }
];

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
        this.vy += 0.2; // Gravity
        this.life -= 0.02;
    }
    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

class Fruit {
    constructor(isHalf = false, parentType = null, x = 0, y = 0, vx = 0, vy = 0) {
        this.isHalf = isHalf;
        if (!isHalf) {
            // Spawn new fruit
            this.type = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
            // Less bombs
            if (this.type.isBomb && Math.random() > 0.3) {
                this.type = FRUIT_TYPES[0]; // fallback to apple
            }
            this.radius = this.type.radius;
            this.x = Math.random() * (WIDTH - 100) + 50;
            this.y = HEIGHT + this.radius;
            
            // Aim towards center
            const targetX = WIDTH / 2 + (Math.random() - 0.5) * 200;
            this.vx = (targetX - this.x) / 60;
            this.vy = -14 - Math.random() * 4; // Jump up
            this.rotation = 0;
            this.spin = (Math.random() - 0.5) * 0.2;
        } else {
            // Half fruit spawned from slice
            this.type = parentType;
            this.radius = parentType.radius;
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
        this.vy += 0.25; // Gravity
        this.rotation += this.spin;

        if (this.y > HEIGHT + this.radius + 50) {
            this.toRemove = true;
            if (!this.isHalf && !this.type.isBomb && !this.sliced) {
                // Dropped a whole fruit -> lose life
                loseLife();
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        if (this.type.isBomb) {
            // Draw Bomb
            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            // Fuse
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, -this.radius);
            ctx.quadraticCurveTo(15, -this.radius - 15, 20, -this.radius - 5);
            ctx.stroke();
            // Spark
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(20, -this.radius - 5, 4 + Math.random() * 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Red warning aura
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 15;
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            // Draw Fruit (Simple colored circle for now)
            ctx.fillStyle = this.type.color;
            ctx.beginPath();
            if (this.isHalf) {
                ctx.arc(0, 0, this.radius, 0, Math.PI); // Draw half circle
            } else {
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            }
            ctx.fill();
            
            // Rind / Inner color
            if (this.isHalf) {
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.ellipse(0, 0, this.radius, this.radius * 0.3, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }
}

function loseLife() {
    if (gameOver) return;
    lives--;
    updateUI();
    if (lives <= 0) {
        gameOver = true;
        setTimeout(resetGame, 3000);
    }
}

function updateUI() {
    scoreEl.innerText = `Điểm: ${score}`;
    let hearts = '';
    for(let i=0; i<lives; i++) hearts += '🍎';
    livesEl.innerText = `Mạng: ${hearts}`;
}

function resetGame() {
    score = 0;
    lives = 3;
    fruits = [];
    particles = [];
    gameOver = false;
    updateUI();
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

function loop() {
    requestAnimationFrame(loop);

    // 1. Draw Camera Feed
    if (videoElement.readyState >= 2) {
        ctx.save();
        ctx.translate(WIDTH, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoElement, 0, 0, WIDTH, HEIGHT);
        ctx.restore();
        
        // Dim the camera slightly
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
    } else {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    if (gameOver) {
        ctx.fillStyle = 'white';
        ctx.font = '50px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', WIDTH/2, HEIGHT/2);
        ctx.font = '30px Outfit, sans-serif';
        ctx.fillText(`Điểm của bạn: ${score}`, WIDTH/2, HEIGHT/2 + 50);
        return;
    }

    const now = performance.now();

    // Remove old blade trails (fade out quickly)
    bladeTrail = bladeTrail.filter(p => now - p.time < 150);

    // Spawn Fruits
    if (now - lastSpawn > 1500 - Math.min(score * 10, 1000)) { // Speed up as score increases
        const count = 1 + Math.floor(Math.random() * 3); // 1-3 fruits at once
        for(let i=0; i<count; i++) {
            fruits.push(new Fruit());
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
                        
                        if (f.type.isBomb) {
                            loseLife();
                            loseLife(); // Bomb does extra damage or instant game over
                            loseLife(); // Instant Game Over
                        } else {
                            score++;
                            updateUI();
                            // Spawn Halves
                            fruits.push(new Fruit(true, f.type, f.x, f.y, f.vx - 3, f.vy));
                            fruits.push(new Fruit(true, f.type, f.x, f.y, f.vx + 3, f.vy));
                            // Spawn Particles
                            for(let j=0; j<15; j++) {
                                particles.push(new Particle(f.x, f.y, f.type.color));
                            }
                        }
                    }
                }
            });
        }
    }

    // Update & Draw Fruits
    fruits = fruits.filter(f => !f.toRemove);
    fruits.forEach(f => {
        f.update();
        f.draw(ctx);
    });

    // Update & Draw Particles
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
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = '#3b82f6';
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
    }
    
    // Also draw glowing hands just to show tracking
    currentHands.forEach(hand => {
        const finger = hand[8]; // Index tip
        if (finger) {
            const x = (1 - finger.x) * WIDTH;
            const y = finger.y * HEIGHT;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, Math.PI*2);
            ctx.fill();
        }
    });
}

// Start loop
updateUI();
loop();
