const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const loadingEl = document.getElementById('loading');
const statusText = document.getElementById('statusText');
const filterBtns = document.querySelectorAll('.filter-btn');

let WIDTH = window.innerWidth;
let HEIGHT = window.innerHeight;
canvas.width = WIDTH;
canvas.height = HEIGHT;

window.addEventListener('resize', () => {
    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    maskCanvas.width = WIDTH;
    maskCanvas.height = HEIGHT;
});

// Offscreen canvas for segmentation mask
const maskCanvas = document.createElement('canvas');
maskCanvas.width = WIDTH;
maskCanvas.height = HEIGHT;
const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
let maskData = null;

// Video Element Setup
const videoElement = document.createElement('video');
videoElement.width = WIDTH;
videoElement.height = HEIGHT;
videoElement.setAttribute('playsinline', '');
videoElement.setAttribute('autoplay', '');
videoElement.muted = true;
videoElement.style.display = 'none';

let currentEffect = 'rain';
let isRaining = false;
let particles = [];
let handYHistory = [];

// --- Particles System ---
class RainParticle {
    constructor() {
        this.reset();
        this.y = Math.random() * HEIGHT; // Initial scatter
    }
    reset() {
        this.x = Math.random() * WIDTH;
        this.y = -20;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = 5 + Math.random() * 5;
        this.radius = 2 + Math.random() * 2;
        this.bounces = 0;
        this.color = `rgba(135, 206, 235, ${0.5 + Math.random() * 0.5})`;
    }
    update() {
        this.vy += 0.2; // Gravity
        let nextX = this.x + this.vx;
        let nextY = this.y + this.vy;

        // Collision with body
        if (isBody(nextX, nextY) && this.bounces < 3) {
            this.vy = -this.vy * 0.5; // Bounce up
            this.vx += (Math.random() - 0.5) * 4; // Scatter horizontally
            this.bounces++;
            this.y -= 2; // push out
        } else {
            this.x = nextX;
            this.y = nextY;
        }

        if (this.y > HEIGHT) this.reset();
        if (this.x < 0 || this.x > WIDTH) this.reset();
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

class AuraParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4 - 2; // Float up
        this.life = 1.0;
        this.size = Math.random() * 5 + 2;
        this.hue = Math.random() * 60 + 280; // Purple/Pink
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.02;
    }
    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = `hsl(${this.hue}, 100%, 70%)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

class SnowParticle {
    constructor() { this.reset(); this.y = Math.random() * HEIGHT; }
    reset() {
        this.x = Math.random() * WIDTH;
        this.y = -20;
        this.vx = (Math.random() - 0.5);
        this.vy = 1 + Math.random() * 2;
        this.radius = 2 + Math.random() * 2;
        this.stopped = false;
        this.angle = Math.random() * Math.PI * 2;
    }
    update() {
        if (this.stopped) return;
        this.angle += 0.05;
        this.x += Math.sin(this.angle) * 0.5;
        this.y += this.vy;
        if (isBody(this.x, this.y) && Math.random() < 0.1) this.stopped = true;
        if (this.y > HEIGHT) this.reset();
    }
    draw(ctx) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
    }
}

class ConfettiParticle {
    constructor(x, y) {
        this.x = x || (Math.random() < 0.5 ? 0 : WIDTH);
        this.y = y || HEIGHT;
        this.vx = (this.x === 0 ? 1 : -1) * (Math.random() * 5 + 5);
        this.vy = -(Math.random() * 10 + 10);
        this.size = Math.random() * 8 + 4;
        this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
        this.rotation = Math.random() * 360;
        this.dr = (Math.random() - 0.5) * 10;
    }
    update() {
        this.vy += 0.3; this.x += this.vx; this.y += this.vy; this.rotation += this.dr;
    }
    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rotation * Math.PI / 180);
        ctx.fillStyle = this.color; ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size); ctx.restore();
    }
}

class BubbleParticle {
    constructor() { this.reset(); this.y = Math.random() * HEIGHT; }
    reset() {
        this.x = Math.random() * WIDTH;
        this.y = HEIGHT + 20;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = -(Math.random() * 2 + 1);
        this.radius = Math.random() * 15 + 5;
        this.popped = false;
    }
    update() {
        if (this.popped) {
            if (Math.random() < 0.1) this.reset();
            return;
        }
        this.x += this.vx; this.y += this.vy;
        if (isBody(this.x, this.y)) this.popped = true;
        if (this.y < -50) this.reset();
    }
    draw(ctx) {
        if (this.popped) return;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)"; ctx.fillStyle = "rgba(255, 255, 255, 0.1)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.beginPath(); ctx.arc(this.x - this.radius*0.3, this.y - this.radius*0.3, this.radius*0.2, 0, Math.PI*2); ctx.fill();
    }
}

class HeartParticle {
    constructor(x, y) {
        this.x = x || Math.random() * WIDTH;
        this.y = y || HEIGHT + 20;
        this.vy = -(Math.random() * 3 + 2);
        this.vx = (Math.random() - 0.5) * 2;
        this.size = Math.random() * 15 + 10;
        this.opacity = 1.0;
        this.scale = 0.1;
    }
    update() {
        this.y += this.vy;
        this.x += Math.sin(this.y * 0.05) * 2;
        if (this.scale < 1) this.scale += 0.05;
        this.opacity -= 0.005;
        if (isBody(this.x, this.y)) this.opacity -= 0.05;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.opacity);
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("💖", 0, 0);
        ctx.restore();
    }
}

class ButterflyParticle {
    constructor() {
        this.x = Math.random() < 0.5 ? -20 : WIDTH + 20;
        this.y = Math.random() * HEIGHT;
        this.vx = (this.x < 0 ? 1 : -1) * (Math.random() * 3 + 2);
        this.vy = (Math.random() - 0.5) * 4;
        this.size = Math.random() * 20 + 20;
        this.angle = 0;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy + Math.sin(this.x * 0.05) * 2;
        this.angle += 0.2;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.vx > 0 ? -1 : 1, 1);
        ctx.rotate(Math.sin(this.angle) * 0.2);
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🦋", 0, 0);
        ctx.restore();
    }
}

class BatParticle {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() < 0.5 ? -100 : WIDTH + 100;
        this.y = Math.random() * HEIGHT * 0.7;
        this.vx = (this.x < 0 ? 1 : -1) * (Math.random() * 3 + 3);
        this.vy = (Math.random() - 0.5) * 2;
        this.flap = Math.random() * 10;
    }
    update() {
        this.x += this.vx; this.y += this.vy + Math.sin(this.x * 0.05) * 2; this.flap += 0.2;
        if (this.x < -150 || this.x > WIDTH + 150) this.reset();
    }
    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y); if (this.vx < 0) ctx.scale(-1, 1);
        ctx.fillStyle = "#111"; ctx.font = "40px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("🦇", 0, 0); ctx.restore();
    }
}

class FireworkParticle {
    constructor(x, y, color) {
        this.x = x; this.y = y;
        this.vx = (Math.random() - 0.5) * 10; this.vy = (Math.random() - 0.5) * 10;
        this.life = 1.0; this.color = color; this.size = Math.random() * 3 + 1;
    }
    update() { this.vy += 0.2; this.x += this.vx; this.y += this.vy; this.life -= 0.02; }
    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life); ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1.0;
    }
}

let fireworksMissiles = [];
class FireworkMissile {
    constructor() {
        this.x = Math.random() * WIDTH; this.y = HEIGHT;
        this.vy = -(Math.random() * 6 + 10); this.exploded = false;
        this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
    }
    update() {
        this.vy += 0.15; this.y += this.vy;
        if (this.vy >= 0 && !this.exploded) {
            this.exploded = true;
            for(let i=0; i<60; i++) particles.push(new FireworkParticle(this.x, this.y, this.color));
        }
    }
    draw(ctx) {
        if (!this.exploded) { ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, 4, 15); }
    }
}

function isBody(x, y) {
    if (!maskData) return false;
    let px = Math.floor(x);
    let py = Math.floor(y);
    if (px < 0 || px >= WIDTH || py < 0 || py >= HEIGHT) return false;
    
    // Check alpha channel or red channel of the mask
    let idx = (py * WIDTH + px) * 4;
    return maskData[idx] > 100; // Mask usually has high values where person is
}

// --- MediaPipe Setup ---
let isSegmentationReady = false;
let isHandsReady = false;

const selfieSegmentation = new SelfieSegmentation({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
}});
selfieSegmentation.setOptions({ modelSelection: 1 }); // 1 is landscape, 0 is general
selfieSegmentation.onResults((results) => {
    if (!isSegmentationReady) {
        isSegmentationReady = true;
        checkLoading();
    }
    
    // Draw flipped video
    ctx.save();
    ctx.translate(WIDTH, 0);
    ctx.scale(-1, 1);
    
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

    // Draw camera
    ctx.drawImage(results.image, drawX, drawY, drawW, drawH);
    
    // Draw Mask to offscreen
    maskCtx.clearRect(0, 0, WIDTH, HEIGHT);
    maskCtx.drawImage(results.segmentationMask, drawX, drawY, drawW, drawH);
    
    ctx.restore(); // Restore flip before drawing particles
    
    // Get Mask Data for physics (after drawing flipped, wait, mask is NOT flipped in offscreen if we didn't flip it.
    // Let's flip maskCtx before drawing too!)
    maskCtx.save();
    maskCtx.translate(WIDTH, 0);
    maskCtx.scale(-1, 1);
    maskCtx.clearRect(0, 0, WIDTH, HEIGHT);
    maskCtx.drawImage(results.segmentationMask, drawX, drawY, drawW, drawH);
    maskCtx.restore();
    
    maskData = maskCtx.getImageData(0, 0, WIDTH, HEIGHT).data;

    // Apply Filters / Effects
    if (currentEffect === 'aura') {
        spawnAura();
        particles = particles.filter(p => p.life > 0);
        particles.forEach(p => { p.update(); p.draw(ctx); });
    } else if (currentEffect === 'rain') {
        if (isRaining) particles.forEach(p => { p.update(); p.draw(ctx); });
    } else if (currentEffect === 'snow') {
        particles.forEach(p => { p.update(); p.draw(ctx); });
    } else if (currentEffect === 'fireworks') {
        if (Math.random() < 0.03) fireworksMissiles.push(new FireworkMissile());
        fireworksMissiles.forEach(m => { m.update(); m.draw(ctx); });
        fireworksMissiles = fireworksMissiles.filter(m => !m.exploded);
        particles = particles.filter(p => p.life > 0);
        particles.forEach(p => { p.update(); p.draw(ctx); });
    } else if (currentEffect === 'confetti') {
        if (Math.random() < 0.2) particles.push(new ConfettiParticle(0, HEIGHT));
        if (Math.random() < 0.2) particles.push(new ConfettiParticle(WIDTH, HEIGHT));
        particles = particles.filter(p => p.y < HEIGHT + 50);
        particles.forEach(p => { p.update(); p.draw(ctx); });
    } else if (currentEffect === 'bubbles') {
        particles.forEach(p => { p.update(); p.draw(ctx); });
    } else if (currentEffect === 'bats') {
        particles.forEach(p => { p.update(); p.draw(ctx); });
    } else if (currentEffect === 'hearts') {
        if (Math.random() < 0.1) particles.push(new HeartParticle());
        particles = particles.filter(p => p.opacity > 0);
        particles.forEach(p => { p.update(); p.draw(ctx); });
    } else if (currentEffect === 'butterflies') {
        if (Math.random() < 0.05 && particles.length < 15) particles.push(new ButterflyParticle());
        particles = particles.filter(p => p.x > -50 && p.x < WIDTH + 50);
        particles.forEach(p => { p.update(); p.draw(ctx); });
    }
});

const hands = new Hands({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});
hands.setOptions({ maxNumHands: 1, modelComplexity: 0, minDetectionConfidence: 0.7, minTrackingConfidence: 0.7 });
hands.onResults((results) => {
    if (!isHandsReady) {
        isHandsReady = true;
        checkLoading();
    }
    
    if (currentEffect === 'rain' && results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        let hand = results.multiHandLandmarks[0];
        let indexY = hand[8].y;
        let isClosed = hand[8].y > hand[5].y; // simple check: index below knuckle
        
        handYHistory.push(indexY);
        if (handYHistory.length > 10) handYHistory.shift();
        
        // Detect Pull Down Gesture
        if (isClosed && handYHistory.length === 10) {
            let startY = handYHistory[0];
            let endY = handYHistory[9];
            if (endY - startY > 0.15 && !isRaining) {
                isRaining = true;
                statusText.innerText = "Mưa Ảo Thuật! 🌧️";
                statusText.style.color = "#38bdf8";
                initRain();
            }
        }
        
        // Draw String
        if (!isRaining) {
            const vRatio = videoElement.videoWidth / videoElement.videoHeight || 1;
            const cRatio = WIDTH / HEIGHT;
            let drawW, drawH, drawX, drawY;
            if (vRatio > cRatio) {
                drawH = HEIGHT; drawW = HEIGHT * vRatio; drawX = (WIDTH - drawW) / 2; drawY = 0;
            } else {
                drawW = WIDTH; drawH = WIDTH / vRatio; drawX = 0; drawY = (HEIGHT - drawH) / 2;
            }
            
            const px = hand[8].x * drawW;
            const py = hand[8].y * drawH;
            
            let handX = WIDTH - (drawX + px);
            let handYPos = drawY + py;

            ctx.beginPath();
            ctx.moveTo(handX, 0);
            ctx.lineTo(handX, handYPos);
            ctx.strokeStyle = "rgba(255,255,255,0.8)";
            ctx.lineWidth = 4;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(handX, handYPos, 15, 0, Math.PI*2);
            ctx.fillStyle = "#facc15";
            ctx.fill();
        }
    }
});

function initRain() {
    particles = [];
    for (let i = 0; i < 200; i++) {
        particles.push(new RainParticle());
    }
}

function spawnAura() {
    // Basic edge detection on mask to spawn particles
    // Since scanning full canvas is slow, random sampling
    for(let i=0; i<30; i++) {
        let rx = Math.floor(Math.random() * WIDTH);
        let ry = Math.floor(Math.random() * HEIGHT);
        if (isBody(rx, ry)) {
            // Check if near edge (one of neighbors is not body)
            if (!isBody(rx-10, ry) || !isBody(rx+10, ry) || !isBody(rx, ry-10) || !isBody(rx, ry+10)) {
                particles.push(new AuraParticle(rx, ry));
            }
        }
    }
}

function checkLoading() {
    if (isSegmentationReady && isHandsReady) {
        loadingEl.style.display = 'none';
    }
}

// UI Controls
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentEffect = btn.getAttribute('data-effect');
        particles = [];
        isRaining = false;
        
        if (currentEffect === 'rain') {
            statusText.innerText = "Giơ tay lên để kéo rèm!";
            statusText.style.color = "#fff";
        } else if (currentEffect === 'aura') {
            statusText.innerText = "Hào Quang Năng Lượng! ✨";
            statusText.style.color = "#f472b6";
        } else if (currentEffect === 'snow') {
            statusText.innerText = "Tuyết Rơi Mùa Đông ❄️";
            statusText.style.color = "#bae6fd";
            for(let i=0; i<150; i++) particles.push(new SnowParticle());
        } else if (currentEffect === 'fireworks') {
            statusText.innerText = "Pháo Hoa Rực Rỡ 🎆";
            statusText.style.color = "#fef08a";
            fireworksMissiles = [];
        } else if (currentEffect === 'confetti') {
            statusText.innerText = "Lễ Hội Pháo Giấy 🎊";
            statusText.style.color = "#a7f3d0";
        } else if (currentEffect === 'bubbles') {
            statusText.innerText = "Bong Bóng Xà Phòng 🫧";
            statusText.style.color = "#ddd";
            for(let i=0; i<30; i++) particles.push(new BubbleParticle());
        } else if (currentEffect === 'bats') {
            statusText.innerText = "Đêm Hội Halloween 🦇";
            statusText.style.color = "#f97316";
            for(let i=0; i<10; i++) particles.push(new BatParticle());
        }
    });
});

// Start Camera Pipeline
let hasCamera = true;

async function startPipeline() {
    let stream = null;
    
    // 1. Thử lấy stream từ parent (Hub) - an toàn cho iOS
    try {
        if (window.parent && window.parent !== window && window.parent.globalCameraStream) {
            stream = window.parent.globalCameraStream;
            console.log('MagicRoom: Dùng Camera từ Hub.');
        }
    } catch (e) {
        console.warn('MagicRoom: Cross-frame access bị chặn:', e.message);
    }
    
    // 2. Tự xin quyền Camera nếu không có từ parent
    if (!stream) {
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
            });
            console.log('MagicRoom: Tự mở Camera thành công!');
        } catch (err) {
            console.warn('MagicRoom: Không tìm thấy Camera.', err);
        }
    }
    
    if (stream) {
        videoElement.srcObject = stream;
        try { await videoElement.play(); } catch(e) { console.log("Video play:", e); }
    } else {
        hasCamera = false;
        loadingEl.style.display = 'none';
        
        isSegmentationReady = true;
        isHandsReady = true;
        maskCtx.fillStyle = "#000";
        maskCtx.fillRect(0, 0, WIDTH, HEIGHT);
        maskData = maskCtx.getImageData(0, 0, WIDTH, HEIGHT).data;
        
        if (currentEffect === 'rain') {
            isRaining = true;
            initRain();
        }
    }

    let isProcessing = false;
    async function processVideo() {
        if (hasCamera) {
            if (!videoElement.paused && !videoElement.ended && !isProcessing) {
                isProcessing = true;
                try {
                    // Chạy tuần tự để tránh quá tải bộ nhớ trên Safari/iPhone
                    await selfieSegmentation.send({image: videoElement});
                    
                    // Chỉ chạy mô hình nhận diện tay (nặng) nếu đang ở chế độ Mưa Nảy
                    if (currentEffect === 'rain') {
                        await hands.send({image: videoElement});
                    }
                } catch (e) {
                    console.error("Pipeline error:", e);
                }
                isProcessing = false;
            }
            // Use setTimeout to give browser breathing room on mobile
            setTimeout(() => requestAnimationFrame(processVideo), 10);
        } else {
            // Fake rendering loop
            ctx.save();
            ctx.fillStyle = "#1e1e2e";
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
            ctx.fillStyle = "#fff";
            ctx.font = "20px 'Be Vietnam Pro'";
            ctx.textAlign = "center";
            ctx.fillText("Không phát hiện Camera - Chế độ mô phỏng UI", WIDTH/2, HEIGHT/2);
            
            if (currentEffect === 'aura') {
                for(let i=0; i<2; i++) particles.push(new AuraParticle(Math.random()*WIDTH, HEIGHT));
                particles = particles.filter(p => p.life > 0);
                particles.forEach(p => { p.update(); p.draw(ctx); });
            } else if (currentEffect === 'rain') {
                if (isRaining) particles.forEach(p => { p.update(); p.draw(ctx); });
            } else if (currentEffect === 'snow') {
                particles.forEach(p => { p.update(); p.draw(ctx); });
            } else if (currentEffect === 'fireworks') {
                if (Math.random() < 0.03) fireworksMissiles.push(new FireworkMissile());
                fireworksMissiles.forEach(m => { m.update(); m.draw(ctx); });
                fireworksMissiles = fireworksMissiles.filter(m => !m.exploded);
                particles = particles.filter(p => p.life > 0);
                particles.forEach(p => { p.update(); p.draw(ctx); });
            } else if (currentEffect === 'confetti') {
                if (Math.random() < 0.2) particles.push(new ConfettiParticle(0, HEIGHT));
                if (Math.random() < 0.2) particles.push(new ConfettiParticle(WIDTH, HEIGHT));
                particles = particles.filter(p => p.y < HEIGHT + 50);
                particles.forEach(p => { p.update(); p.draw(ctx); });
            } else if (currentEffect === 'bubbles') {
                particles.forEach(p => { p.update(); p.draw(ctx); });
            } else if (currentEffect === 'bats') {
                particles.forEach(p => { p.update(); p.draw(ctx); });
            }
            ctx.restore();
            requestAnimationFrame(processVideo);
        }
    }
    
    if (hasCamera) {
        requestAnimationFrame(processVideo);
    } else {
        processVideo();
    }
}

// iOS Safari: getUserMedia BẮT BUỘC gọi trong user gesture
let mrPipelineStarted = false;
function mrTryStart() {
    if (mrPipelineStarted) return;
    mrPipelineStarted = true;
    loadingEl.innerText = 'Đang bật Camera... 📸';
    startPipeline();
}

// Chờ user chạm để bật Camera (bắt buộc trên iOS)
loadingEl.innerText = 'Chạm vào màn hình để bắt đầu! 👆';
loadingEl.style.display = 'block';
document.body.addEventListener('click', function onTouch() {
    document.body.removeEventListener('click', onTouch);
    mrTryStart();
});
document.body.addEventListener('touchstart', function onTouch() {
    document.body.removeEventListener('touchstart', onTouch);
    mrTryStart();
});
// Fallback cho Desktop: tự bật sau 500ms
setTimeout(() => { if (!mrPipelineStarted) mrTryStart(); }, 500);

