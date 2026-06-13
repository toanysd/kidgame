const videoElement = document.getElementById('videoElement');
const webglCanvas = document.getElementById('webglCanvas');
const uiCanvas = document.getElementById('uiCanvas');
const notificationBanner = document.getElementById('notificationBanner');

let width = window.innerWidth;
let height = window.innerHeight;
webglCanvas.width = width;
webglCanvas.height = height;
uiCanvas.width = width;
uiCanvas.height = height;

const uiCtx = uiCanvas.getContext('2d');

// --- SLIDER ELEMENTS ---
const sliderVline = document.getElementById('slider-vline');
const sliderEyes = document.getElementById('slider-eyes');
const sliderNose = document.getElementById('slider-nose');
const sliderFat = document.getElementById('slider-fat');
const sliderSkin = document.getElementById('slider-skin');
const sliderLips = document.getElementById('slider-lips');

const valVline = document.getElementById('val-vline');
const valEyes = document.getElementById('val-eyes');
const valNose = document.getElementById('val-nose');
const valFat = document.getElementById('val-fat');
const valSkin = document.getElementById('val-skin');
const valLips = document.getElementById('val-lips');

function updateSliderLabel(slider, label) {
    slider.addEventListener('input', (e) => {
        label.innerText = e.target.value + '%';
    });
}
updateSliderLabel(sliderVline, valVline);
updateSliderLabel(sliderEyes, valEyes);
updateSliderLabel(sliderNose, valNose);
updateSliderLabel(sliderFat, valFat);
updateSliderLabel(sliderSkin, valSkin);
updateSliderLabel(sliderLips, valLips);

// --- THREE.JS WEBGL SETUP ---
const renderer = new THREE.WebGLRenderer({ canvas: webglCanvas, alpha: true, antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(width, height);

const camera = new THREE.OrthographicCamera(-width/2, width/2, height/2, -height/2, 0.1, 1000);
camera.position.z = 1;
const scene = new THREE.Scene();

// Video Texture
const videoTexture = new THREE.VideoTexture(videoElement);
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;
videoTexture.format = THREE.RGBFormat;

// Shader Material for Distortion & Beauty
const vertexShader = `
varying vec2 vVideoUv;

uniform vec2 uCanvasResolution;
uniform vec2 uVideoResolution;
uniform float uFaceDetected;

// Distortions: [x, y, radius, strength] in Video UV Space
uniform vec4 uDistortions[12];
uniform int uNumDistortions;

void main() {
    // 1. Map Canvas UV (uv) to Video UV (texUv) acting as object-fit: cover
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
    
    // 2. Mesh Liquify Deformation
    if (uFaceDetected > 0.0) {
        for(int i = 0; i < 12; i++) {
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
                
                // For bulge, push vertex outwards
                disp += dir * (strength * curve * dist);
            }
        }
    }
    
    // 3. Pass unchanged original video UV to fragment shader for texturing
    vVideoUv = texUv;
    
    // 4. Move Vertex Position
    vec3 pos = position;
    vec2 deltaUv = disp / scale;
    pos.x += deltaUv.x * uCanvasResolution.x;
    pos.y += deltaUv.y * uCanvasResolution.y;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const fragmentShader = `
uniform sampler2D tDiffuse;
uniform vec2 uVideoResolution;
uniform float uSkinSmooth;
uniform float uFaceDetected;

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
`;

const material = new THREE.ShaderMaterial({
    uniforms: {
        tDiffuse: { value: videoTexture },
        uCanvasResolution: { value: new THREE.Vector2(width, height) },
        uVideoResolution: { value: new THREE.Vector2(width, height) }, // updated on load
        uFaceDetected: { value: 0.0 },
        uNumDistortions: { value: 0 },
        uDistortions: { value: [
            new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4(),
            new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4(),
            new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4(),
            new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()
        ]},
        uSkinSmooth: { value: 0.0 }
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader
});

const planeGeo = new THREE.PlaneGeometry(width, height, 64, 64);
const plane = new THREE.Mesh(planeGeo, material);
scene.add(plane);

// Handle video aspect ratio
videoElement.addEventListener('loadedmetadata', () => {
    const vWidth = videoElement.videoWidth;
    const vHeight = videoElement.videoHeight;
    material.uniforms.uVideoResolution.value.set(vWidth, vHeight);
});

// --- MEDIAPIPE FACEMESH ---
let lastLandmarks = null;

const faceMesh = new FaceMesh({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
}});

faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

faceMesh.onResults((results) => {
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        lastLandmarks = results.multiFaceLandmarks[0];
        material.uniforms.uFaceDetected.value = 1.0;
    } else {
        lastLandmarks = null;
        material.uniforms.uFaceDetected.value = 0.0;
    }
});

// Calculate UV from FaceMesh (FaceMesh gives normalized 0-1 coords)
// Since video might be cropped due to object-fit: cover, we must map accurately.
function getUv(pt) {
    // MediaPipe returns x,y between 0 and 1. 
    // Video is drawn filling the plane.
    return new THREE.Vector2(pt.x, pt.y);
}

// Render loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update Distortions based on sliders
    let numDist = 0;
    let dists = material.uniforms.uDistortions.value;
    
    if (lastLandmarks) {
        // V-Line (Pinch jaw/chin inward)
        let vlineVal = parseFloat(sliderVline.value) / 100.0;
        if (vlineVal > 0) {
            let leftJaw = getUv(lastLandmarks[172]);
            let rightJaw = getUv(lastLandmarks[397]);
            let chin = getUv(lastLandmarks[152]);
            
            dists[numDist++].set(leftJaw.x, leftJaw.y, 0.08, -0.15 * vlineVal);
            dists[numDist++].set(rightJaw.x, rightJaw.y, 0.08, -0.15 * vlineVal);
            dists[numDist++].set(chin.x, chin.y, 0.08, -0.15 * vlineVal);
        }
        
        // Fat Cheeks (Bulge cheeks outward)
        let fatVal = parseFloat(sliderFat.value) / 100.0;
        if (fatVal > 0) {
            let leftCheek = getUv(lastLandmarks[234]);
            let rightCheek = getUv(lastLandmarks[454]);
            
            dists[numDist++].set(leftCheek.x, leftCheek.y, 0.1, 0.25 * fatVal);
            dists[numDist++].set(rightCheek.x, rightCheek.y, 0.1, 0.25 * fatVal);
        }
        
        // Big Eyes (Bulge eyes outward)
        let eyesVal = parseFloat(sliderEyes.value) / 100.0;
        if (eyesVal > 0) {
            let leftEye = getUv(lastLandmarks[159]);
            let rightEye = getUv(lastLandmarks[386]);
            
            dists[numDist++].set(leftEye.x, leftEye.y, 0.045, 0.25 * eyesVal);
            dists[numDist++].set(rightEye.x, rightEye.y, 0.045, 0.25 * eyesVal);
        }
        
        // Small Nose (Pinch nose inward)
        let noseVal = parseFloat(sliderNose.value) / 100.0;
        if (noseVal > 0) {
            let noseTip = getUv(lastLandmarks[4]);
            dists[numDist++].set(noseTip.x, noseTip.y, 0.06, -0.2 * noseVal);
        }
    }
    
    material.uniforms.uNumDistortions.value = numDist;
    material.uniforms.uSkinSmooth.value = parseFloat(sliderSkin.value) / 100.0;
    
    // Draw 3D/WebGL Plane
    renderer.render(scene, camera);
    
    // Draw Lipstick and UI Overlays on uiCanvas (Canvas 2D)
    uiCtx.clearRect(0, 0, width, height);
    if (lastLandmarks) {
        let lipVal = parseFloat(sliderLips.value) / 100.0;
        if (lipVal > 0) {
            drawLipstick(lastLandmarks, lipVal);
        }
    }
}

// Function to draw lipstick onto uiCanvas over the WebGL result
function drawLipstick(landmarks, strength) {
    uiCtx.save();
    // Video in WebGL is flipped horizontally (via css transform).
    // MediaPipe points are relative to the raw video.
    // We must flip x when drawing to uiCanvas
    uiCtx.scale(-1, 1);
    uiCtx.translate(-width, 0);

    uiCtx.globalCompositeOperation = 'soft-light';
    uiCtx.globalAlpha = strength * 0.8;
    uiCtx.fillStyle = '#ff1493'; 
    if (typeof uiCtx.filter !== 'undefined') uiCtx.filter = 'blur(1px)';
    
    const mapToCanvas = (pt) => ({ x: pt.x * width, y: pt.y * height });

    const upperLipOuter = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291];
    const upperLipInner = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308].reverse();
    uiCtx.beginPath();
    upperLipOuter.forEach((id, i) => {
        let pt = mapToCanvas(landmarks[id]);
        if(i===0) uiCtx.moveTo(pt.x, pt.y); else uiCtx.lineTo(pt.x, pt.y);
    });
    upperLipInner.forEach((id) => {
        let pt = mapToCanvas(landmarks[id]);
        uiCtx.lineTo(pt.x, pt.y);
    });
    uiCtx.closePath();
    uiCtx.fill();

    const lowerLipOuter = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];
    const lowerLipInner = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308].reverse();
    uiCtx.beginPath();
    lowerLipOuter.forEach((id, i) => {
        let pt = mapToCanvas(landmarks[id]);
        if(i===0) uiCtx.moveTo(pt.x, pt.y); else uiCtx.lineTo(pt.x, pt.y);
    });
    lowerLipInner.forEach((id) => {
        let pt = mapToCanvas(landmarks[id]);
        uiCtx.lineTo(pt.x, pt.y);
    });
    uiCtx.closePath();
    uiCtx.fill();

    uiCtx.restore();
}

// Start Camera
const cameraUtils = new Camera(videoElement, {
    onFrame: async () => {
        await faceMesh.send({image: videoElement});
    },
    width: 640,
    height: 480,
    facingMode: "user"
});

notificationBanner.classList.remove('hidden');
cameraUtils.start().then(() => {
    notificationBanner.classList.add('hidden');
    animate();
});

// Snapshot logic
function takeSnapshot() {
    // combine webgl and ui canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctx = tempCanvas.getContext('2d');
    
    // Draw webgl (needs to be flipped horizontally because css handles the flip normally)
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(webglCanvas, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Draw UI Canvas (lips) which is NOT flipped by CSS
    ctx.drawImage(uiCanvas, 0, 0);

    document.getElementById('snapshotImg').src = tempCanvas.toDataURL('image/png');
    document.getElementById('snapshotModal').classList.add('show');
}

function closeSnapshot() {
    document.getElementById('snapshotModal').classList.remove('show');
}
function toggleBeautyPanel() {
    document.getElementById('beautyPanel').classList.toggle('hidden');
}

function switchTab(tabName) {
    document.getElementById('tab-presets').classList.add('hidden');
    document.getElementById('tab-manual').classList.add('hidden');
    document.getElementById('btn-tab-presets').classList.remove('active');
    document.getElementById('btn-tab-manual').classList.remove('active');

    document.getElementById('tab-' + tabName).classList.remove('hidden');
    document.getElementById('btn-tab-' + tabName).classList.add('active');
}

function applyPreset(preset) {
    const config = {
        'natural': { vline: 10, eyes: 10, nose: 10, fat: 0, skin: 30, lips: 0 },
        'muse': { vline: 40, eyes: 30, nose: 20, fat: 0, skin: 60, lips: 40 },
        'edgy': { vline: 70, eyes: 10, nose: 50, fat: 0, skin: 50, lips: 80 },
        'baby': { vline: 0, eyes: 50, nose: 30, fat: 50, skin: 70, lips: 20 }
    };

    const c = config[preset];
    if(c) {
        setSlider('slider-vline', 'val-vline', c.vline);
        setSlider('slider-eyes', 'val-eyes', c.eyes);
        setSlider('slider-nose', 'val-nose', c.nose);
        setSlider('slider-fat', 'val-fat', c.fat);
        setSlider('slider-skin', 'val-skin', c.skin);
        setSlider('slider-lips', 'val-lips', c.lips);
    }
}

function setSlider(id, valId, value) {
    const slider = document.getElementById(id);
    const valText = document.getElementById(valId);
    if(slider && valText) {
        slider.value = value;
        valText.innerText = value + '%';
        // Dispatch input event so any listeners (though we calculate inline) could catch it,
        // but since our animate loop reads slider.value directly, setting the value is enough.
    }
}