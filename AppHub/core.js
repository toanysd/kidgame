const videoElement = document.getElementById('videoElement');
const canvas = document.getElementById('renderCanvas');
const ctx = canvas.getContext('2d');
const webglCanvas = document.getElementById('webglCanvas');
const bgWebglCanvas = document.getElementById('bgWebglCanvas');
const loadingEl = document.getElementById('loading');
const pluginNameEl = document.getElementById('pluginName');
const pluginDescEl = document.getElementById('pluginDesc');

let WIDTH = window.innerWidth;
let HEIGHT = window.innerHeight;
canvas.width = WIDTH;
canvas.height = HEIGHT;
bgWebglCanvas.width = WIDTH;
bgWebglCanvas.height = HEIGHT;

// --- BACKGROUND WEBGL SETUP (For Video & Distortions) ---
const bgRenderer = new THREE.WebGLRenderer({ canvas: bgWebglCanvas, alpha: true, antialias: false });
bgRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
bgRenderer.setSize(WIDTH, HEIGHT);
const bgCamera = new THREE.OrthographicCamera(-WIDTH/2, WIDTH/2, HEIGHT/2, -HEIGHT/2, 0.1, 1000);
bgCamera.position.z = 1;
const bgScene = new THREE.Scene();
const videoTexture = new THREE.VideoTexture(videoElement);
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;
videoTexture.format = THREE.RGBFormat;

const bgUniforms = {
    tDiffuse: { value: videoTexture },
    uCanvasResolution: { value: new THREE.Vector2(WIDTH, HEIGHT) },
    uVideoResolution: { value: new THREE.Vector2(WIDTH, HEIGHT) },
    uFaceDetected: { value: 0.0 },
    uNumDistortions: { value: 0 },
    uDistortions: { value: [
        new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()
    ]},
    uSkinSmooth: { value: 0.0 } // For Beauty Plugin
};

const bgMaterial = new THREE.ShaderMaterial({
    uniforms: bgUniforms,
    vertexShader: `
        varying vec2 vVideoUv;
        uniform vec2 uCanvasResolution;
        uniform vec2 uVideoResolution;
        uniform float uFaceDetected;
        uniform vec4 uDistortions[4];
        uniform int uNumDistortions;

        void main() {
            vec2 texUv = uv;
            float vRatio = uVideoResolution.x / uVideoResolution.y;
            float cRatio = uCanvasResolution.x / uCanvasResolution.y;
            vec2 scale = vec2(1.0);
            
            if (vRatio > cRatio) {
                scale.x = cRatio / vRatio;
                texUv.x = (uv.x - 0.5) * scale.x + 0.5;
            } else {
                scale.y = vRatio / cRatio;
                texUv.y = (uv.y - 0.5) * scale.y + 0.5;
            }
            
            vec2 disp = vec2(0.0);
            
            if (uFaceDetected > 0.0) {
                for(int i = 0; i < 4; i++) {
                    if (i >= uNumDistortions) break;
                    
                    vec2 center = uDistortions[i].xy;
                    float radius = uDistortions[i].z;
                    float strength = uDistortions[i].w;
                    
                    vec2 aspect = vec2(vRatio, 1.0);
                    vec2 delta = (texUv - center) * aspect;
                    float dist = length(delta);
                    
                    if (dist < radius) {
                        float t = dist / radius;
                        float curve = 1.0 - smoothstep(0.0, 1.0, t);
                        vec2 dir = normalize(delta) / aspect;
                        
                        disp += dir * (strength * curve * dist);
                    }
                }
            }
            
            vVideoUv = texUv;
            
            vec3 pos = position;
            vec2 deltaUv = disp / scale;
            pos.x += deltaUv.x * uCanvasResolution.x;
            pos.y += deltaUv.y * uCanvasResolution.y;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2 uVideoResolution;
        uniform float uFaceDetected;
        uniform float uSkinSmooth;
        varying vec2 vVideoUv;

        void main() {
            vec4 texColor = texture2D(tDiffuse, vVideoUv);
            
            if (uSkinSmooth > 0.0 && uFaceDetected > 0.0) {
                vec2 pixel = 1.0 / uVideoResolution;
                vec4 blur = texture2D(tDiffuse, vVideoUv + vec2(pixel.x*2.0, 0.0)) +
                            texture2D(tDiffuse, vVideoUv - vec2(pixel.x*2.0, 0.0)) +
                            texture2D(tDiffuse, vVideoUv + vec2(0.0, pixel.y*2.0)) +
                            texture2D(tDiffuse, vVideoUv - vec2(0.0, pixel.y*2.0));
                blur = (blur + texColor) / 5.0;
                vec4 bright = blur + vec4(0.05, 0.03, 0.03, 0.0) * uSkinSmooth;
                texColor = mix(texColor, bright, uSkinSmooth * 0.7);
            }
            
            gl_FragColor = texColor;
        }
    `
});
const bgPlane = new THREE.Mesh(new THREE.PlaneGeometry(WIDTH, HEIGHT, 64, 64), bgMaterial);
bgScene.add(bgPlane);

videoElement.addEventListener('loadedmetadata', () => {
    const vWidth = videoElement.videoWidth;
    const vHeight = videoElement.videoHeight;
    bgMaterial.uniforms.uVideoResolution.value.set(vWidth, vHeight);
});

// --- THREE.JS INITIALIZATION (OPTIMIZED FOR MOBILE) ---
const renderer3D = new THREE.WebGLRenderer({ canvas: webglCanvas, alpha: true, antialias: false });
renderer3D.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Prevent 3x lag on iPhones
renderer3D.setSize(WIDTH, HEIGHT);
// Orthographic camera matches 2D canvas 1:1
const camera3D = new THREE.OrthographicCamera(-WIDTH/2, WIDTH/2, HEIGHT/2, -HEIGHT/2, 1, 1000);
camera3D.position.set(0, 0, 500);

const scene3D = new THREE.Scene();
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene3D.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(0, 100, 200);
scene3D.add(dirLight);

// A Group that will magically track the user's face in 3D space
const faceGroup3D = new THREE.Group();
scene3D.add(faceGroup3D);

window.addEventListener('resize', () => {
    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    renderer3D.setSize(WIDTH, HEIGHT);
    camera3D.left = -WIDTH/2; camera3D.right = WIDTH/2;
    camera3D.top = HEIGHT/2; camera3D.bottom = -HEIGHT/2;
    camera3D.updateProjectionMatrix();
});

// Plugin System State
let plugins = [];
let currentPluginIndex = 0;
let lastResults = null;

function selectPlugin(index) {
    if (index === currentPluginIndex || index < 0 || index >= plugins.length) return;
    
    if (plugins[currentPluginIndex] && plugins[currentPluginIndex].onDeactivate) {
        plugins[currentPluginIndex].onDeactivate(scene3D, faceGroup3D);
    }

    currentPluginIndex = index;
    updateUI();
    
    // Cập nhật giao diện nút Carousel
    const carousel = document.getElementById('filterCarousel');
    if (carousel) {
        Array.from(carousel.children).forEach((btn, i) => {
            if (i === index) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        
        const activeBtn = carousel.children[index];
        if(activeBtn) {
            activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }
}

function populateCarousel() {
    const carousel = document.getElementById('filterCarousel');
    if (!carousel) return;
    carousel.innerHTML = '';
    plugins.forEach((p, index) => {
        const btn = document.createElement('div');
        btn.className = 'filter-btn' + (index === currentPluginIndex ? ' active' : '');
        // Lấy Emoji đầu tiên từ tên, hoặc icon mặc định
        const emoji = p.name.split(' ')[0] || '✨';
        btn.innerHTML = emoji;
        btn.onclick = () => {
            selectPlugin(index);
        };
        carousel.appendChild(btn);
    });
}

window.registerPlugins = (loadedPlugins) => {
    plugins = loadedPlugins;
    if (plugins.length > 0) {
        currentPluginIndex = -1; // Force active trigger
        selectPlugin(0);
        populateCarousel();
    }
};

function updateUI() {
    if (plugins.length > 0) {
        let p = plugins[currentPluginIndex];
        pluginNameEl.innerText = p.name;
        pluginDescEl.innerText = p.desc;
        
        // Clean up previous 3D objects and FREE MEMORY
        while(faceGroup3D.children.length > 0) { 
            let child = faceGroup3D.children[0];
            child.traverse((obj) => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
                    else obj.material.dispose();
                }
            });
            faceGroup3D.remove(child); 
        }
        
        if (p.onActivate) p.onActivate(scene3D, faceGroup3D);
    }
}


// Helper to map normalized coordinates to canvas coordinates
function mapPt(pt, layout) {
    return {
        x: pt.x * layout.drawW + layout.drawX,
        y: pt.y * layout.drawH + layout.drawY
    };
}

// --- DEFINE PLUGINS HERE TO AVOID LOADING ISSUES ---
plugins = [
    {
        name: "🌸 Beauty: Má Hồng",
        desc: "Làm đẹp cho Nữ - Filter má hồng & son môi",
        render: (ctx, results, layout) => {
            if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;
            const landmarks = results.multiFaceLandmarks[0];

            ctx.save();
            
            // 1. Lớp nền làm trắng & mịn da (Foundation / Whitening)
            const faceOval = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
            ctx.beginPath();
            faceOval.forEach((id, i) => {
                let pt = mapPt(landmarks[id], layout);
                if(i===0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
            });
            ctx.closePath();
            
            // Dùng soft-light để làm sáng da tự nhiên mà không mất chi tiết
            ctx.globalCompositeOperation = 'soft-light';
            ctx.fillStyle = 'rgba(255, 230, 240, 0.4)'; // Hồng phấn nhẹ nhàng
            if (typeof ctx.filter !== 'undefined') {
                ctx.filter = 'blur(4px)'; // Làm mịn (nếu trình duyệt hỗ trợ)
            }
            ctx.fill();
            ctx.filter = 'none';

            // 2. Má hồng tự nhiên (Natural Blush)
            ctx.globalCompositeOperation = 'multiply';
            ctx.globalAlpha = 0.25; // Rất nhẹ nhàng
            
            // Má trái (Right cheek on flipped image)
            const leftCheek = mapPt(landmarks[205], layout); // approximate
            // Má phải (Left cheek on flipped image)
            const rightCheek = mapPt(landmarks[425], layout);
            
            // Bán kính to hơn để tỏa đều
            const blushRadius = layout.drawW * 0.12; 
            
            const drawBlush = (pt) => {
                const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, blushRadius);
                grad.addColorStop(0, '#ff7eb3');
                grad.addColorStop(0.5, 'rgba(255, 126, 179, 0.5)');
                grad.addColorStop(1, 'rgba(255, 126, 179, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath(); ctx.arc(pt.x, pt.y, blushRadius, 0, Math.PI*2); ctx.fill();
            };
            drawBlush(leftCheek);
            drawBlush(rightCheek);

            // 3. Son môi trong trẻo (Lip tint)
            // Dùng soft-light/multiply để giữ nguyên vân môi
            ctx.globalCompositeOperation = 'soft-light';
            ctx.globalAlpha = 0.6; // Đậm hơn một chút nhưng dùng soft-light nên sẽ tệp vào da
            ctx.fillStyle = '#ff1493'; // Màu son thật rực (sẽ dịu đi nhờ soft-light)
            
            const upperLipOuter = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291];
            const upperLipInner = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308].reverse();
            
            ctx.beginPath();
            upperLipOuter.forEach((id, i) => {
                let pt = mapPt(landmarks[id], layout);
                if(i===0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
            });
            upperLipInner.forEach((id) => {
                let pt = mapPt(landmarks[id], layout);
                ctx.lineTo(pt.x, pt.y);
            });
            ctx.closePath();
            if (typeof ctx.filter !== 'undefined') ctx.filter = 'blur(1px)'; // Làm viền môi mềm mại
            ctx.fill();

            const lowerLipOuter = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];
            const lowerLipInner = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308].reverse();
            
            ctx.beginPath();
            lowerLipOuter.forEach((id, i) => {
                let pt = mapPt(landmarks[id], layout);
                if(i===0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
            });
            lowerLipInner.forEach((id) => {
                let pt = mapPt(landmarks[id], layout);
                ctx.lineTo(pt.x, pt.y);
            });
            ctx.closePath();
            ctx.fill();

            ctx.restore(); // Khôi phục lại trạng thái blend mode, alpha, filter
        }
    },
    {
        name: "🍩 Kids: Ăn Bánh Donut",
        desc: "Há miệng thật to để ăn bánh!",
        state: { donuts: [], score: 0 },
        onActivate: function() {
            this.state.score = 0;
            this.state.donuts = [];
            this.interval = setInterval(() => {
                this.state.donuts.push({
                    x: Math.random() * window.innerWidth * 0.8 + window.innerWidth * 0.1,
                    y: -50,
                    vy: 3 + Math.random() * 3
                });
            }, 1500);
        },
        onDeactivate: function() {
            clearInterval(this.interval);
        },
        render: function(ctx, results, layout) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.font = "bold 40px 'Be Vietnam Pro'";
            ctx.fillStyle = "#facc15";
            ctx.strokeStyle = "black";
            ctx.lineWidth = 4;
            ctx.textAlign = "center";
            ctx.strokeText(`Điểm: ${this.state.score}`, -layout.WIDTH/2, 120);
            ctx.fillText(`Điểm: ${this.state.score}`, -layout.WIDTH/2, 120);
            ctx.restore();

            let mouthOpen = false;
            let mouthCenter = {x: 0, y: 0};
            
            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                const landmarks = results.multiFaceLandmarks[0];
                const upperLip = mapPt(landmarks[13], layout);
                const lowerLip = mapPt(landmarks[14], layout);
                
                const distance = Math.abs(upperLip.y - lowerLip.y);
                mouthOpen = distance > 20;
                mouthCenter = { x: (upperLip.x + lowerLip.x)/2, y: (upperLip.y + lowerLip.y)/2 };
                
                // --- FAT CHEEKS EFFECT is now handled by WebGL Shader in main loop ---
            }

            for (let i = this.state.donuts.length - 1; i >= 0; i--) {
                let d = this.state.donuts[i];
                d.y += d.vy;
                
                ctx.font = "50px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("🍩", d.x, d.y);
                
                if (mouthOpen && Math.abs(d.x - mouthCenter.x) < 50 && Math.abs(d.y - mouthCenter.y) < 50) {
                    this.state.score += 10;
                    this.state.donuts.splice(i, 1);
                } else if (d.y > layout.HEIGHT + 50) {
                    this.state.donuts.splice(i, 1);
                }
            }
        }
    },
    {
        name: "😎 Beauty: Kính Râm Cool Ngầu",
        desc: "Kính râm thời trang bám theo chuyển động đầu",
        render: (ctx, results, layout) => {
            if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;
            const landmarks = results.multiFaceLandmarks[0];
            
            const leftEye = mapPt(landmarks[130], layout);
            const rightEye = mapPt(landmarks[359], layout);
            const nose = mapPt(landmarks[168], layout); // between eyes

            const eyeDist = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y);
            const glassWidth = eyeDist * 2.5;
            const glassHeight = glassWidth * 0.4;
            
            // Calculate angle
            const angle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);

            ctx.save();
            ctx.translate(nose.x, nose.y);
            ctx.rotate(angle);

            // Draw Glasses Frame
            ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
            ctx.beginPath();
            ctx.roundRect(-glassWidth/2, -glassHeight/2, glassWidth, glassHeight, 15);
            ctx.fill();
            
            // Draw highlight reflection
            ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
            ctx.beginPath();
            ctx.moveTo(-glassWidth/2 + 10, -glassHeight/2 + 5);
            ctx.lineTo(0, -glassHeight/2 + 5);
            ctx.lineTo(-20, glassHeight/2 - 5);
            ctx.lineTo(-glassWidth/2 + 10, glassHeight/2 - 5);
            ctx.fill();

            // Draw Bridge
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-15, 0);
            ctx.lineTo(15, 0);
            ctx.stroke();

            ctx.restore();
        }
    },
    {
        name: "🐱 Beauty: Mặt Mèo Đáng Yêu",
        desc: "Mũi mèo và râu mép dễ thương",
        render: (ctx, results, layout) => {
            if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;
            const landmarks = results.multiFaceLandmarks[0];
            
            const noseTip = mapPt(landmarks[4], layout);
            const leftCheek = mapPt(landmarks[205], layout);
            const rightCheek = mapPt(landmarks[425], layout);

            // Draw Cat Nose
            ctx.fillStyle = "#f43f5e";
            ctx.beginPath();
            ctx.ellipse(noseTip.x, noseTip.y, 12, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            // Draw Whiskers Left
            ctx.strokeStyle = "rgba(255,255,255,0.9)";
            ctx.lineWidth = 3;
            ctx.lineCap = "round";
            for(let i=-1; i<=1; i++) {
                ctx.beginPath();
                ctx.moveTo(noseTip.x - 20, noseTip.y + i*5);
                ctx.lineTo(leftCheek.x - 20, leftCheek.y + i*15);
                ctx.stroke();
            }
            // Draw Whiskers Right
            for(let i=-1; i<=1; i++) {
                ctx.beginPath();
                ctx.moveTo(noseTip.x + 20, noseTip.y + i*5);
                ctx.lineTo(rightCheek.x + 20, rightCheek.y + i*15);
                ctx.stroke();
            }
        }
    },
    {
        name: "👑 Beauty: Nữ Thần Hào Quang",
        desc: "Đội vương miện và tỏa sáng",
        render: (ctx, results, layout) => {
            if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;
            const landmarks = results.multiFaceLandmarks[0];
            const topHead = mapPt(landmarks[10], layout);
            const leftHead = mapPt(landmarks[21], layout);
            const rightHead = mapPt(landmarks[251], layout);
            const headWidth = Math.hypot(rightHead.x - leftHead.x, rightHead.y - leftHead.y);

            // Draw Aura
            let time = Date.now() / 500;
            ctx.globalAlpha = 0.5 + Math.sin(time)*0.2;
            const auraGrad = ctx.createRadialGradient(topHead.x, topHead.y, 0, topHead.x, topHead.y, headWidth * 2);
            auraGrad.addColorStop(0, "rgba(250, 204, 21, 0.8)");
            auraGrad.addColorStop(1, "transparent");
            ctx.fillStyle = auraGrad;
            ctx.beginPath(); ctx.arc(topHead.x, topHead.y, headWidth * 2, 0, Math.PI*2); ctx.fill();
            
            // Draw Crown
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = "#eab308";
            ctx.beginPath();
            let crownY = topHead.y - headWidth * 0.5;
            let hw = headWidth * 0.4;
            ctx.moveTo(topHead.x - hw, topHead.y - 20);
            ctx.lineTo(topHead.x - hw - 10, crownY);
            ctx.lineTo(topHead.x - hw/2, crownY + 20);
            ctx.lineTo(topHead.x, crownY - 15);
            ctx.lineTo(topHead.x + hw/2, crownY + 20);
            ctx.lineTo(topHead.x + hw + 10, crownY);
            ctx.lineTo(topHead.x + hw, topHead.y - 20);
            ctx.fill();
            // Crown jewels
            ctx.fillStyle = "#ef4444";
            ctx.beginPath(); ctx.arc(topHead.x, crownY - 15, 6, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "#3b82f6";
            ctx.beginPath(); ctx.arc(topHead.x - hw - 10, crownY, 5, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(topHead.x + hw + 10, crownY, 5, 0, Math.PI*2); ctx.fill();
        }
    },
    {
        name: "🏀 Kids: Đánh Bóng Bằng Đầu",
        desc: "Dùng trán để nảy quả bóng rổ",
        state: { ball: {x: 100, y: 100, vx: 5, vy: 5}, score: 0 },
        onActivate: function() {
            this.state.score = 0;
            this.state.ball.x = window.innerWidth / 2;
            this.state.ball.y = 50;
            this.state.ball.vx = 7; // faster speed
            this.state.ball.vy = 7; // faster speed
        },
        render: function(ctx, results, layout) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.font = "bold 40px 'Be Vietnam Pro'";
            ctx.fillStyle = "#f97316";
            ctx.strokeStyle = "white";
            ctx.lineWidth = 3;
            ctx.textAlign = "center";
            ctx.strokeText(`Tâng bóng: ${this.state.score}`, -layout.WIDTH/2, 120);
            ctx.fillText(`Tâng bóng: ${this.state.score}`, -layout.WIDTH/2, 120);
            ctx.restore();

            let b = this.state.ball;
            b.y += b.vy;
            b.x += b.vx;

            // Wall bounce
            if (b.x < 0 || b.x > layout.WIDTH) b.vx = -b.vx;
            if (b.y < 0) b.vy = -b.vy;
            if (b.y > layout.HEIGHT) { b.y = 50; b.vy = Math.abs(b.vy); this.state.score = 0; } // Reset

            // Forehead collision
            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                const forehead = mapPt(results.multiFaceLandmarks[0][10], layout);
                if (Math.abs(b.x - forehead.x) < 60 && Math.abs(b.y - forehead.y) < 60) {
                    b.vy = -Math.abs(b.vy) - 0.5; // Bounce up and speed up faster
                    b.vx += (Math.random() - 0.5) * 6;
                    b.y -= 10;
                    this.state.score++;
                }
            }

            // Draw ball
            ctx.font = "60px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            // Spin effect by rotating
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.rotate(Date.now() / 200 * Math.sign(b.vx));
            ctx.fillText("🏀", 0, 0);
            ctx.restore();
        }
    },
    {
        name: "👽 Kids: Người Ngoài Hành Tinh",
        desc: "Biến mặt thành Alien da xanh mắt đen to",
        render: (ctx, results, layout) => {
            if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;
            const landmarks = results.multiFaceLandmarks[0];
            
            // Draw green tint over face contour
            const faceContour = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
            ctx.fillStyle = "rgba(34, 197, 94, 0.5)"; // Green tint
            ctx.beginPath();
            faceContour.forEach((id, i) => {
                let pt = mapPt(landmarks[id], layout);
                if(i===0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
            });
            ctx.closePath();
            ctx.fill();

            // Draw Alien Eyes
            const leftEye = mapPt(landmarks[130], layout);
            const rightEye = mapPt(landmarks[359], layout);
            const eyeDist = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y);
            const rX = eyeDist * 0.4;
            const rY = eyeDist * 0.6;
            
            ctx.fillStyle = "#000";
            // Left Alien Eye (Rotated)
            ctx.save();
            ctx.translate(leftEye.x, leftEye.y);
            ctx.rotate(0.3);
            ctx.beginPath(); ctx.ellipse(0, 0, rX, rY, 0, 0, Math.PI*2); ctx.fill();
            ctx.restore();
            // Right Alien Eye (Rotated)
            ctx.save();
            ctx.translate(rightEye.x, rightEye.y);
            ctx.rotate(-0.3);
            ctx.beginPath(); ctx.ellipse(0, 0, rX, rY, 0, 0, Math.PI*2); ctx.fill();
            ctx.restore();
        }
    },
    {
        name: "🎩 Đồ Họa 3D: Mũ Ảo Thuật Gia",
        desc: "Mũ 3D thực tế bám sát độ nghiêng của đầu (Three.js)",
        onActivate: function(scene3D, faceGroup3D) {
            // Create a 3D Top Hat using Three.js
            const hatGroup = new THREE.Group();
            
            // Material
            const material = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7 });
            const bandMaterial = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
            
            // Cylinder (Top part)
            const topGeo = new THREE.CylinderGeometry(40, 45, 80, 32);
            const topMesh = new THREE.Mesh(topGeo, material);
            topMesh.position.y = 40;
            
            // Rim (Bottom part)
            const rimGeo = new THREE.CylinderGeometry(70, 70, 5, 32);
            const rimMesh = new THREE.Mesh(rimGeo, material);
            
            // Red Band
            const bandGeo = new THREE.CylinderGeometry(46, 46, 15, 32);
            const bandMesh = new THREE.Mesh(bandGeo, bandMaterial);
            bandMesh.position.y = 10;
            
            hatGroup.add(topMesh);
            hatGroup.add(rimMesh);
            hatGroup.add(bandMesh);
            
            // Position hat above the head tracking point (nose is origin)
            hatGroup.position.set(0, 100, -30);
            
            // Add to face tracking group
            faceGroup3D.add(hatGroup);
        },
        render: (ctx, results, layout) => {
            // No 2D rendering needed, Three.js handles it automatically!
        }
    },
    {
        name: "✨ Beauty: Bụi Tiên Lấp Lánh",
        desc: "Hạt sáng rơi ra từ xung quanh khuôn mặt",
        state: { particles: [] },
        render: function(ctx, results, layout) {
            if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;
            const landmarks = results.multiFaceLandmarks[0];
            const chin = mapPt(landmarks[152], layout);
            const forehead = mapPt(landmarks[10], layout);
            
            // Spawn particles randomly around face bounding box
            if (Math.random() > 0.5) {
                this.state.particles.push({
                    x: chin.x + (Math.random()-0.5)*200,
                    y: forehead.y + Math.random()*(chin.y - forehead.y),
                    vy: Math.random() * 2 + 1,
                    life: 1.0
                });
            }

            ctx.fillStyle = "#fef08a";
            for(let i = this.state.particles.length-1; i>=0; i--) {
                let p = this.state.particles[i];
                p.y += p.vy;
                p.life -= 0.02;
                ctx.globalAlpha = Math.max(0, p.life);
                ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fill();
                if (p.life <= 0) this.state.particles.splice(i, 1);
            }
            ctx.globalAlpha = 1.0;
        }
    },
    {
        name: "💎 Beauty: Khóc Kim Cương",
        desc: "Những viên kim cương rơi từ mắt",
        state: { drops: [] },
        render: function(ctx, results, layout) {
            if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;
            const landmarks = results.multiFaceLandmarks[0];
            const leftEye = mapPt(landmarks[145], layout); // bottom of left eye
            const rightEye = mapPt(landmarks[374], layout); // bottom of right eye

            if (Math.random() > 0.8) {
                this.state.drops.push({ x: leftEye.x, y: leftEye.y, vy: 0 });
                this.state.drops.push({ x: rightEye.x, y: rightEye.y, vy: 0 });
            }

            ctx.font = "20px Arial";
            for(let i = this.state.drops.length-1; i>=0; i--) {
                let d = this.state.drops[i];
                d.vy += 0.5; // gravity
                d.y += d.vy;
                ctx.fillText("💎", d.x - 10, d.y);
                if (d.y > layout.HEIGHT) this.state.drops.splice(i, 1);
            }
        }
    },
    {
        name: "🎭 Beauty: Mặt Nạ Cyberpunk",
        desc: "Đường viền Neon chạy dọc khuôn mặt",
        render: (ctx, results, layout) => {
            if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;
            const landmarks = results.multiFaceLandmarks[0];
            const contour = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
            
            ctx.strokeStyle = "#0ea5e9";
            ctx.shadowColor = "#0ea5e9";
            ctx.shadowBlur = 15;
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            contour.forEach((id, i) => {
                let pt = mapPt(landmarks[id], layout);
                if(i===0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
            });
            ctx.closePath();
            ctx.stroke();

            // Neon lines across cheeks
            ctx.strokeStyle = "#f43f5e";
            ctx.shadowColor = "#f43f5e";
            ctx.beginPath();
            let lc = mapPt(landmarks[205], layout);
            let rc = mapPt(landmarks[425], layout);
            ctx.moveTo(lc.x - 50, lc.y); ctx.lineTo(lc.x + 30, lc.y + 20);
            ctx.moveTo(rc.x + 50, rc.y); ctx.lineTo(rc.x - 30, rc.y + 20);
            ctx.stroke();

            ctx.shadowBlur = 0; // reset
        }
    },
    {
        name: "📸 Beauty: Polaroid Vintage",
        desc: "Màu phim cổ điển + Khung ảnh",
        render: (ctx, results, layout) => {
            // Vintage Tint
            ctx.fillStyle = "rgba(217, 119, 6, 0.2)"; // Sepia orange tint
            ctx.fillRect(layout.drawX, layout.drawY, layout.drawW, layout.drawH);
            
            // White Polaroid Border
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 30;
            ctx.strokeRect(layout.drawX + 15, layout.drawY + 15, layout.drawW - 30, layout.drawH - 100);
            
            // Bottom thick border
            ctx.fillStyle = "#fff";
            ctx.fillRect(layout.drawX + 15, layout.drawY + layout.drawH - 85, layout.drawW - 30, 70);
            
            ctx.save();
            ctx.scale(-1, 1);
            ctx.fillStyle = "#000";
            ctx.font = "bold 24px 'Be Vietnam Pro'";
            ctx.fillText("Summer 2026", -layout.WIDTH/2, layout.drawY + layout.drawH - 40);
            ctx.restore();
        }
    },
    {
        name: "🐶 Kids: Chó Corgi Lêu Lêu",
        desc: "Há miệng để thè lưỡi chó ra",
        render: (ctx, results, layout) => {
            if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;
            const landmarks = results.multiFaceLandmarks[0];
            const nose = mapPt(landmarks[4], layout);
            const upperLip = mapPt(landmarks[13], layout);
            const lowerLip = mapPt(landmarks[14], layout);
            
            // Dog Nose
            ctx.fillStyle = "#000";
            ctx.beginPath(); ctx.ellipse(nose.x, nose.y, 25, 15, 0, 0, Math.PI*2); ctx.fill();

            // Tongue if mouth open
            const mouthDist = Math.abs(lowerLip.y - upperLip.y);
            if (mouthDist > 20) {
                ctx.fillStyle = "#f43f5e";
                ctx.beginPath();
                ctx.roundRect(lowerLip.x - 20, lowerLip.y, 40, mouthDist * 2 + 30, 20);
                ctx.fill();
                // Tongue line
                ctx.strokeStyle = "#be123c";
                ctx.lineWidth = 3;
                ctx.beginPath(); ctx.moveTo(lowerLip.x, lowerLip.y + 10); ctx.lineTo(lowerLip.x, lowerLip.y + mouthDist * 2 + 20); ctx.stroke();
            }
        }
    },
    {
        name: "🔥 Kids: Phun Lửa Rồng",
        desc: "Há miệng to để phun lửa",
        state: { flames: [] },
        render: function(ctx, results, layout) {
            if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;
            const landmarks = results.multiFaceLandmarks[0];
            const upperLip = mapPt(landmarks[13], layout);
            const lowerLip = mapPt(landmarks[14], layout);
            
            const mouthDist = Math.abs(lowerLip.y - upperLip.y);
            const mouthCenter = {x: (upperLip.x + lowerLip.x)/2, y: (upperLip.y + lowerLip.y)/2};

            if (mouthDist > 25) {
                for(let i=0; i<3; i++) {
                    this.state.flames.push({
                        x: mouthCenter.x + (Math.random()-0.5)*40,
                        y: mouthCenter.y + 20,
                        vx: (Math.random()-0.5)*10,
                        vy: Math.random()*15 + 5,
                        life: 1.0,
                        size: Math.random()*20 + 10
                    });
                }
            }

            for(let i = this.state.flames.length-1; i>=0; i--) {
                let f = this.state.flames[i];
                f.x += f.vx;
                f.y += f.vy;
                f.life -= 0.05;
                f.size *= 0.95;
                
                ctx.globalAlpha = Math.max(0, f.life);
                ctx.fillStyle = f.life > 0.5 ? "#f97316" : "#ef4444";
                ctx.beginPath(); ctx.arc(f.x, f.y, f.size, 0, Math.PI*2); ctx.fill();
                
                if (f.life <= 0) this.state.flames.splice(i, 1);
            }
            ctx.globalAlpha = 1.0;
        }
    },
    {
        name: "🌈 Kids: Nhả Cầu Vồng",
        desc: "Há miệng để nhả dải cầu vồng",
        state: { rainbow: [] },
        render: function(ctx, results, layout) {
            if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;
            const landmarks = results.multiFaceLandmarks[0];
            const upperLip = mapPt(landmarks[13], layout);
            const lowerLip = mapPt(landmarks[14], layout);
            
            const mouthDist = Math.abs(lowerLip.y - upperLip.y);
            const mouthCenter = {x: (upperLip.x + lowerLip.x)/2, y: (upperLip.y + lowerLip.y)/2};

            if (mouthDist > 20) {
                this.state.rainbow.unshift({ x: mouthCenter.x, y: mouthCenter.y, width: mouthDist*1.5 });
                if (this.state.rainbow.length > 50) this.state.rainbow.pop();
            } else {
                if (this.state.rainbow.length > 0) this.state.rainbow.pop(); // shrink
            }

            const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7"];
            
            for(let i=0; i<this.state.rainbow.length; i++) {
                let segment = this.state.rainbow[i];
                segment.y += 15; // fall down
                
                let w = segment.width / colors.length;
                colors.forEach((c, cIdx) => {
                    ctx.fillStyle = c;
                    ctx.fillRect(segment.x - segment.width/2 + cIdx*w, segment.y, w + 1, 20);
                });
            }
        }
    },
    {
        name: "🎈 Kids: Đập Bóng Bay",
        desc: "Bóng bay bay lên, dùng trán để làm nổ",
        state: { balloons: [], particles: [], score: 0 },
        onActivate: function() {
            this.state.score = 0;
            this.state.balloons = [];
            this.state.particles = [];
            this.interval = setInterval(() => {
                this.state.balloons.push({
                    x: Math.random() * window.innerWidth * 0.8 + window.innerWidth * 0.1,
                    y: window.innerHeight + 50,
                    vy: -2 - Math.random() * 3,
                    color: `hsl(${Math.random()*360}, 100%, 60%)`
                });
            }, 1000);
        },
        onDeactivate: function() { clearInterval(this.interval); },
        render: function(ctx, results, layout) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.font = "bold 40px 'Be Vietnam Pro'";
            ctx.fillStyle = "#3b82f6";
            ctx.strokeStyle = "white";
            ctx.lineWidth = 3;
            ctx.textAlign = "center";
            ctx.strokeText(`Đã nổ: ${this.state.score}`, -layout.WIDTH/2, 120);
            ctx.fillText(`Đã nổ: ${this.state.score}`, -layout.WIDTH/2, 120);
            ctx.restore();

            let forehead = null;
            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                forehead = mapPt(results.multiFaceLandmarks[0][10], layout);
            }

            // Draw particles
            for (let i = this.state.particles.length - 1; i >= 0; i--) {
                let p = this.state.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.2; // gravity
                p.life -= 0.02;
                if (p.life <= 0) {
                    this.state.particles.splice(i, 1);
                } else {
                    ctx.globalAlpha = p.life;
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 5, 0, Math.PI*2);
                    ctx.fill();
                    ctx.globalAlpha = 1.0;
                }
            }

            for (let i = this.state.balloons.length - 1; i >= 0; i--) {
                let b = this.state.balloons[i];
                b.y += b.vy;
                
                // Draw balloon string
                ctx.strokeStyle = "white"; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(b.x, b.y+30); ctx.lineTo(b.x, b.y+80); ctx.stroke();
                
                // Draw balloon
                ctx.fillStyle = b.color;
                ctx.beginPath(); ctx.ellipse(b.x, b.y, 25, 35, 0, 0, Math.PI*2); ctx.fill();

                if (forehead && Math.abs(b.x - forehead.x) < 40 && Math.abs(b.y - forehead.y) < 50) {
                    this.state.score++;
                    // Create explosion particles
                    for (let p=0; p<15; p++) {
                        this.state.particles.push({
                            x: b.x, y: b.y,
                            vx: (Math.random()-0.5)*10,
                            vy: (Math.random()-0.5)*10,
                            life: 1.0,
                            color: b.color
                        });
                    }
                    this.state.balloons.splice(i, 1); // POP
                } else if (b.y < -100) {
                    this.state.balloons.splice(i, 1);
                }
            }
        }
    },
    {
        name: "🛸 Kids: Tránh Thiên Thạch",
        desc: "Nghiêng đầu trái phải để né thiên thạch",
        state: { rocks: [], score: 0, shipX: window.innerWidth/2 },
        onActivate: function() {
            this.state.score = 0;
            this.state.rocks = [];
            this.interval = setInterval(() => {
                this.state.rocks.push({ x: Math.random() * window.innerWidth, y: -50, vy: 5 + Math.random()*5 });
            }, 800);
        },
        onDeactivate: function() { clearInterval(this.interval); },
        render: function(ctx, results, layout) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.font = "bold 40px 'Be Vietnam Pro'"; ctx.fillStyle = "#22c55e"; ctx.strokeStyle = "black"; ctx.lineWidth = 3;
            ctx.textAlign = "center";
            ctx.strokeText(`Điểm: ${this.state.score}`, -layout.WIDTH/2, 120);
            ctx.fillText(`Điểm: ${this.state.score}`, -layout.WIDTH/2, 120);
            ctx.restore();

            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                const nose = mapPt(results.multiFaceLandmarks[0][1], layout);
                this.state.shipX = nose.x; // Ship follows nose
                this.state.score++; // Score goes up as long as alive
            }

            // Draw Ship
            ctx.font = "60px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText("🚀", this.state.shipX, layout.HEIGHT - 100);

            for (let i = this.state.rocks.length - 1; i >= 0; i--) {
                let r = this.state.rocks[i];
                r.y += r.vy;
                ctx.fillText("☄️", r.x, r.y);
                
                if (Math.abs(r.x - this.state.shipX) < 40 && Math.abs(r.y - (layout.HEIGHT - 100)) < 40) {
                    this.state.score = 0; // Hit! Reset score
                    this.state.rocks = [];
                    break;
                }
                if (r.y > layout.HEIGHT + 50) this.state.rocks.splice(i, 1);
            }
        }
    }
];

// Initialize UI immediately
populateCarousel();
updateUI();

// MediaPipe Face Mesh Setup
const faceMesh = new FaceMesh({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
}});
faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: false, // Turned OFF for massive mobile performance boost (60fps)
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

faceMesh.onResults((results) => {
    loadingEl.style.display = 'none';
    lastResults = results;
    
    ctx.save();
    ctx.translate(WIDTH, 0);
    ctx.scale(-1, 1);
    
    const vRatio = results.image.width / results.image.height;
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

    // Xóa nền Canvas 2D để nhìn xuyên qua WebGL Canvas bên dưới
    ctx.restore(); // Restore the save() from above
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    // --- UPDATE BACKGROUND WEBGL ---
    let numDist = 0;
    let dists = bgMaterial.uniforms.uDistortions.value;
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        bgMaterial.uniforms.uFaceDetected.value = 1.0;
        const lm = results.multiFaceLandmarks[0];
        
        // Check if Donut game is active for WebGL Fat cheeks
        if (plugins[activeIndex].name.includes("Donut")) {
            let fatLevel = Math.min(plugins[activeIndex].state.score / 100, 1.0);
            if (fatLevel > 0) {
                let leftCheek = lm[234];
                let rightCheek = lm[454];
                dists[numDist++].set(leftCheek.x, leftCheek.y, 0.15, 0.4 * fatLevel);
                dists[numDist++].set(rightCheek.x, rightCheek.y, 0.15, 0.4 * fatLevel);
            }
        }
    } else {
        bgMaterial.uniforms.uFaceDetected.value = 0.0;
    }
    bgMaterial.uniforms.uNumDistortions.value = numDist;
    bgRenderer.render(bgScene, bgCamera);
    
    ctx.save();
    ctx.translate(WIDTH, 0);
    ctx.scale(-1, 1);
    // --- UPDATE THREE.JS 3D FACE TRACKING ---
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const lm = results.multiFaceLandmarks[0];
        
        // Map nose tip (landmark 4) to center of screen coordinates
        const nose = lm[4];
        faceGroup3D.position.x = -(nose.x * drawW + drawX - WIDTH/2); // Negative because canvas is flipped horizontally
        faceGroup3D.position.y = -(nose.y * drawH + drawY - HEIGHT/2); // Negative because WebGL Y is up
        faceGroup3D.position.z = -nose.z * drawW; // Approximate depth scaling

        // Calculate rotation using 3 points: left cheek (234), right cheek (454), chin (152), top (10)
        const left = lm[234]; const right = lm[454]; const top = lm[10]; const bottom = lm[152];
        
        const vecX = new THREE.Vector3(-(right.x - left.x), -(right.y - left.y), -(right.z - left.z)).normalize();
        const vecY = new THREE.Vector3(-(top.x - bottom.x), -(top.y - bottom.y), -(top.z - bottom.z)).normalize();
        const vecZ = new THREE.Vector3().crossVectors(vecX, vecY).normalize();
        
        const rotationMatrix = new THREE.Matrix4().makeBasis(vecX, vecY, vecZ);
        faceGroup3D.rotation.setFromRotationMatrix(rotationMatrix);
        
        // Scale dynamically based on face size in frame
        const faceWidth = Math.hypot((right.x - left.x)*drawW, (right.y - left.y)*drawH);
        const scaleFactor = faceWidth / 150; // 150 is baseline width
        faceGroup3D.scale.set(scaleFactor, scaleFactor, scaleFactor);
    } else {
        // Move off-screen if no face
        faceGroup3D.position.set(0, 9999, 0);
    }
    
    // Render 3D Scene
    renderer3D.render(scene3D, camera3D);

    if (plugins.length > 0) {
        plugins[currentPluginIndex].render(ctx, results, {drawX, drawY, drawW, drawH, WIDTH, HEIGHT});
    }

    ctx.restore();
});

let hasCamera = true;

// Define a MOCK FACE so that plugins can render something in fallback mode
let mockFace = [];
for(let i=0; i<468; i++) {
    // Generate a generic oval for the whole face contour
    let angle = (i / 468) * Math.PI * 2;
    mockFace.push({
        x: 0.5 + Math.cos(angle) * 0.2, 
        y: 0.5 + Math.sin(angle) * 0.3, 
        z: 0
    });
}
// Eyes
mockFace[130] = {x: 0.4, y: 0.4, z: 0};
mockFace[359] = {x: 0.6, y: 0.4, z: 0};
// Nose
mockFace[168] = {x: 0.5, y: 0.45, z: 0};
mockFace[4] = {x: 0.5, y: 0.52, z: 0};
// Forehead
mockFace[10] = {x: 0.5, y: 0.2, z: 0};
// Cheeks
mockFace[205] = {x: 0.35, y: 0.5, z: 0};
mockFace[425] = {x: 0.65, y: 0.5, z: 0};

// Lips Outer
const outerLipId = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146];
outerLipId.forEach((id, idx) => {
    let angle = (idx / outerLipId.length) * Math.PI * 2;
    mockFace[id] = {x: 0.5 + Math.cos(angle)*0.08, y: 0.6 + Math.sin(angle)*0.04, z: 0};
});
// Lips Inner
const innerLipId = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95];
innerLipId.forEach((id, idx) => {
    let angle = (idx / innerLipId.length) * Math.PI * 2;
    mockFace[id] = {x: 0.5 + Math.cos(angle)*0.06, y: 0.6 + Math.sin(angle)*0.02, z: 0};
});

let mouthSimulateOpen = false;
setInterval(() => { mouthSimulateOpen = !mouthSimulateOpen; }, 1000);

// Start Camera
async function startPipeline() {
    let stream = null;
    
    // 1. Thử lấy stream từ parent (Hub) - an toàn cho iOS
    try {
        if (window.parent && window.parent !== window && window.parent.globalCameraStream) {
            stream = window.parent.globalCameraStream;
            console.log('AppHub: Dùng Camera từ Hub.');
        }
    } catch (e) {
        console.warn('AppHub: Cross-frame access bị chặn:', e.message);
    }
    
    // 2. Tự xin quyền Camera nếu không có từ parent
    if (!stream) {
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
            });
            console.log('AppHub: Tự mở Camera thành công!');
        } catch (err) {
            console.warn('AppHub: Không tìm thấy Camera.', err);
        }
    }
    
    if (stream) {
        videoElement.srcObject = stream;
        try { await videoElement.play(); } catch(e) { console.log("Video play:", e); }
    } else {
        hasCamera = false;
        loadingEl.style.display = 'none';
    }

    let isProcessing = false;
    
    // Smooth Sync with Camera Hardware
    async function processVideo() {
        if (!hasCamera) return;
        if (!videoElement.paused && !videoElement.ended && !isProcessing) {
            isProcessing = true;
            await faceMesh.send({image: videoElement});
            isProcessing = false;
        }
        requestAnimationFrame(processVideo);
    }
    
    // Mock loop if camera fails
    async function renderMock() {
        if (!hasCamera) {
            ctx.save();
            ctx.fillStyle = "#1e1e2e"; // Dark background
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
            
            // Draw dummy face outline
            ctx.strokeStyle = "rgba(255,255,255,0.1)";
            ctx.beginPath();
            ctx.arc(WIDTH/2, HEIGHT/2 - 20, 150, 0, Math.PI*2);
            ctx.stroke();

            // Simulate mouth opening by modifying the mock Face inner lips
            if (mouthSimulateOpen) {
                mockFace[13].y = 0.58;
                mockFace[14].y = 0.65;
            } else {
                mockFace[13].y = 0.59;
                mockFace[14].y = 0.61;
            }

            let mockResults = { multiFaceLandmarks: [mockFace] };

            ctx.translate(WIDTH, 0);
            ctx.scale(-1, 1);
            
            ctx.save();
            ctx.scale(-1, 1);
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.font = "800 20px 'Be Vietnam Pro'";
            ctx.fillText("Chế Độ Mô Phỏng", WIDTH/2, 50);
            ctx.restore();

            if (plugins.length > 0) {
                plugins[currentPluginIndex].render(ctx, mockResults, {drawX: 0, drawY: 0, drawW: WIDTH, drawH: HEIGHT, WIDTH, HEIGHT});
            }
            
            // Render 3D Mock
            faceGroup3D.position.set(0, 50, 0); // Center roughly
            faceGroup3D.rotation.set(0, Math.sin(Date.now()/500)*0.2, 0); // Gentle turning
            renderer3D.render(scene3D, camera3D);
            
            ctx.restore();
            requestAnimationFrame(renderMock);
        }
    }

    if (hasCamera) {
        requestAnimationFrame(processVideo);
    } else {
        renderMock();
    }
}

// iOS Safari: getUserMedia BẮT BUỘC phải gọi trong user gesture.
// AppHub chạy trong iframe → không có user gesture khi trang tải.
// Giải pháp: chờ user chạm vào bất kỳ đâu trên AppHub rồi mới bật Camera.
let pipelineStarted = false;
function tryStartPipeline() {
    if (pipelineStarted) return;
    pipelineStarted = true;
    loadingEl.innerText = 'Đang bật Camera... 📸';
    startPipeline();
}

// Thử bật ngay (sẽ hoạt động trên Desktop/Android)
// Nếu thất bại trên iOS, sẽ chờ user chạm
try {
    if (window.parent && window.parent !== window && window.parent.globalCameraStream) {
        // Có stream từ Hub → bật ngay, không cần user gesture
        tryStartPipeline();
    } else {
        // Cần getUserMedia → chờ user gesture trên iOS
        loadingEl.innerText = 'Chạm vào màn hình để bắt đầu! 👆';
        document.body.addEventListener('click', function onFirstTouch() {
            document.body.removeEventListener('click', onFirstTouch);
            tryStartPipeline();
        });
        document.body.addEventListener('touchstart', function onFirstTouch() {
            document.body.removeEventListener('touchstart', onFirstTouch);
            tryStartPipeline();
        });
        // Fallback: thử bật sau 500ms (Desktop browsers không cần user gesture)
        setTimeout(() => {
            if (!pipelineStarted) tryStartPipeline();
        }, 500);
    }
} catch(e) {
    // Cross-frame access lỗi trên iOS → chờ user gesture
    loadingEl.innerText = 'Chạm vào màn hình để bắt đầu! 👆';
    document.body.addEventListener('click', function onFirstTouch() {
        document.body.removeEventListener('click', onFirstTouch);
        tryStartPipeline();
    });
    document.body.addEventListener('touchstart', function onFirstTouch() {
        document.body.removeEventListener('touchstart', onFirstTouch);
        tryStartPipeline();
    });
}

window.takeSnapshot = () => {
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'AR_Snapshot.png';
    link.href = dataURL;
    link.click();
};

window.switchCamera = () => {
    alert("Tính năng đảo Camera đang phát triển cho thiết bị di động!");
};
