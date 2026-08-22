import { FighterState, FighterAttackStrength } from './constants/fighter.js';
import { FRAME_TIME } from './constants/game.js';
import { gameState } from './states/gameState.js';
import { networkManager } from './network/NetworkManager.js';

// Standard skeleton structure
const SKELETON_CONNECTIONS = [
    ['leftShoulder', 'rightShoulder'],
    ['leftHip', 'rightHip'],
    ['leftShoulder', 'leftHip'],
    ['rightShoulder', 'rightHip'],
    ['leftShoulder', 'leftElbow'],
    ['leftElbow', 'leftWrist'],
    ['rightShoulder', 'rightElbow'],
    ['rightElbow', 'rightWrist'],
    ['leftHip', 'leftKnee'],
    ['leftKnee', 'leftAnkle'],
    ['rightHip', 'rightKnee'],
    ['rightKnee', 'rightAnkle']
];

export class PlayerCombatTracker {
    constructor(scene, fighterIndex) {
        this.scene = scene;
        this.fighterIndex = fighterIndex; // 0 for Ryu, 1 for Ken
        this.emaLandmarks = null;
        
        this.prevLeftArmDist = 0;
        this.prevRightArmDist = 0;
        this.prevHipY = 0;
        this.baseNoseX = 0;
        
        this.isChargingHadouken = false;
        this.chargeStartTime = 0;
        this.hadoukenFired = 0;

        this.inputTimers = {};
        this.inputFlags = {};
        this.lastSeenTime = 0;
    }

    triggerInput(key, duration = 30) {
        if (this.inputFlags[key]) return;
        this.inputFlags[key] = true;

        const targetObj = (this.fighterIndex === 0) ? window.AI_FRAME_INPUT : window.AI_OPPONENT_INPUT;
        if (targetObj) targetObj[key] = true;

        // In 2P_ONLINE mode, send local inputs across WebRTC network
        if (window.GAME_MODE === '2P_ONLINE' && networkManager && networkManager.isConnected) {
            const isLocal = (window.IS_ONLINE_HOST && this.fighterIndex === 0) || (!window.IS_ONLINE_HOST && this.fighterIndex === 1);
            if (isLocal) {
                const inputs = Object.assign({}, targetObj);
                inputs[key] = true;
                networkManager.sendInput(inputs);
            }
        }

        if (this.inputTimers[key]) clearTimeout(this.inputTimers[key]);
        
        this.inputTimers[key] = setTimeout(() => {
            if (targetObj) targetObj[key] = false;
            
            if (window.GAME_MODE === '2P_ONLINE' && networkManager && networkManager.isConnected) {
                const isLocal = (window.IS_ONLINE_HOST && this.fighterIndex === 0) || (!window.IS_ONLINE_HOST && this.fighterIndex === 1);
                if (isLocal) {
                    const inputs = Object.assign({}, targetObj);
                    inputs[key] = false;
                    networkManager.sendInput(inputs);
                }
            }

            setTimeout(() => {
                this.inputFlags[key] = false;
            }, 350); 
        }, duration);
    }

    updateLandmarks(rawLandmarks, now) {
        this.lastSeenTime = now;
        const alpha = 0.6;

        if (!this.emaLandmarks) {
            this.emaLandmarks = {};
            for (const key in rawLandmarks) {
                this.emaLandmarks[key] = {
                    x: rawLandmarks[key].x,
                    y: rawLandmarks[key].y,
                    score: rawLandmarks[key].score || 1
                };
            }
        } else {
            for (const key in rawLandmarks) {
                if (!this.emaLandmarks[key]) {
                    this.emaLandmarks[key] = {
                        x: rawLandmarks[key].x,
                        y: rawLandmarks[key].y,
                        score: rawLandmarks[key].score || 1
                    };
                } else {
                    this.emaLandmarks[key].x = rawLandmarks[key].x * alpha + this.emaLandmarks[key].x * (1 - alpha);
                    this.emaLandmarks[key].y = rawLandmarks[key].y * alpha + this.emaLandmarks[key].y * (1 - alpha);
                    this.emaLandmarks[key].score = rawLandmarks[key].score || 1;
                }
            }
        }

        this.processCombatLogic(now);
    }

    processCombatLogic(now) {
        if (!this.emaLandmarks) return;
        const lm = this.emaLandmarks;
        const leftWrist = lm.leftWrist;
        const rightWrist = lm.rightWrist;
        const leftShoulder = lm.leftShoulder;
        const rightShoulder = lm.rightShoulder;
        const leftHip = lm.leftHip;
        const rightHip = lm.rightHip;
        const leftAnkle = lm.leftAnkle;
        const rightAnkle = lm.rightAnkle;
        const leftKnee = lm.leftKnee;
        const rightKnee = lm.rightKnee;
        const nose = lm.nose;

        if (!leftShoulder || !rightShoulder || !leftHip || !rightHip || !leftWrist || !rightWrist) return;

        // 1. Kamehameha / Hadouken Energy Mechanic
        const wristDist = Math.sqrt(Math.pow(leftWrist.x - rightWrist.x, 2) + Math.pow(leftWrist.y - rightWrist.y, 2));
        if (wristDist < 0.12 && now - this.hadoukenFired > 3000) {
            if (!this.isChargingHadouken) {
                this.isChargingHadouken = true;
                this.chargeStartTime = now;
            } else if (now - this.chargeStartTime > 1500) {
                this.fireHadouken(now);
            }
            return; // Skip other attacks while charging Hadouken
        } else {
            this.isChargingHadouken = false;
        }

        // 2. Punching (Arm extension on 2D plane)
        const leftArmDist = Math.sqrt(Math.pow(leftWrist.x - leftShoulder.x, 2) + Math.pow(leftWrist.y - leftShoulder.y, 2));
        const rightArmDist = Math.sqrt(Math.pow(rightWrist.x - rightShoulder.x, 2) + Math.pow(rightWrist.y - rightShoulder.y, 2));

        if (leftArmDist > 0.23 && leftArmDist - this.prevLeftArmDist > 0.015) {
            this.triggerInput('lightPunch');
        } else if (rightArmDist > 0.23 && rightArmDist - this.prevRightArmDist > 0.015) {
            this.triggerInput('heavyPunch');
        }
        this.prevLeftArmDist = leftArmDist;
        this.prevRightArmDist = rightArmDist;

        // 3. Kicking (Ankle raised high relative to knee)
        if (leftAnkle && leftKnee && leftAnkle.y < leftKnee.y - 0.02) {
            this.triggerInput('lightKick');
        } else if (rightAnkle && rightKnee && rightAnkle.y < rightKnee.y - 0.02) {
            this.triggerInput('heavyKick');
        }

        // 4. Jumping & Crouching (Hip Y velocity)
        const avgHipY = (leftHip.y + rightHip.y) / 2;
        if (this.prevHipY > 0) {
            if (avgHipY < this.prevHipY - 0.035) { // Rapid movement up
                this.triggerInput('up', 100);
            } else if (avgHipY > this.prevHipY + 0.045) { // Rapid movement down
                this.triggerInput('down', 50);
            }
        }
        this.prevHipY = avgHipY * 0.1 + (this.prevHipY > 0 ? this.prevHipY : avgHipY) * 0.9;

        // 5. Movement (Leaning body based on Nose X)
        if (nose) {
            if (!this.baseNoseX) this.baseNoseX = nose.x;
            this.baseNoseX = nose.x * 0.01 + this.baseNoseX * 0.99;
            
            if (nose.x < this.baseNoseX - 0.07) {
                this.triggerInput('right', 30);
            } else if (nose.x > this.baseNoseX + 0.07) {
                this.triggerInput('left', 30);
            }
        }

        // 6. Blocking (Wrists raised near face level and crossed)
        if (leftWrist.y < leftShoulder.y && rightWrist.y < rightShoulder.y && wristDist < 0.2) {
            const blockDir = (this.fighterIndex === 0) ? 'left' : 'right';
            this.triggerInput(blockDir);
        }
    }

    fireHadouken(now) {
        this.isChargingHadouken = false;
        this.hadoukenFired = now;

        const fighter = this.scene && this.scene.fighters && this.scene.fighters[this.fighterIndex];
        if (fighter) {
            fighter.changeState(FighterState.SPECIAL_1_HEAVY, { previous: now });
        }

        const opponentId = 1 - this.fighterIndex;
        if (this.scene && this.scene.handleAttackHit) {
            this.scene.handleAttackHit(
                { previous: now },
                this.fighterIndex,
                opponentId,
                null,
                FighterAttackStrength.HEAVY
            );
            if (gameState && gameState.fighters && gameState.fighters[opponentId]) {
                gameState.fighters[opponentId].hitPoints -= 80;
            }
        }

        if (window.GAME_MODE === '2P_ONLINE' && networkManager && networkManager.isConnected) {
            networkManager.sendGameEvent({
                type: 'HADOUKEN',
                fighterIndex: this.fighterIndex,
                timestamp: now
            });
        }
    }

    draw(context, colorPrimary, colorSecondary, auraColor) {
        if (!this.emaLandmarks) return;
        const now = performance.now();
        if (now - this.lastSeenTime > 500) return; // Hide if pose lost

        const scaleW = 384;
        const scaleH = 224;
        const lm = this.emaLandmarks;

        const drawPoint = (p, color = 'white', radius = 2) => {
            if (!p) return;
            const x = (1 - p.x) * scaleW;
            const y = p.y * scaleH;
            context.fillStyle = color;
            context.beginPath();
            context.arc(x, y, radius, 0, 2 * Math.PI);
            context.fill();
        };

        const drawLine = (p1, p2, color = colorPrimary, width = 1.5) => {
            if (!p1 || !p2) return;
            context.beginPath();
            context.moveTo((1 - p1.x) * scaleW, p1.y * scaleH);
            context.lineTo((1 - p2.x) * scaleW, p2.y * scaleH);
            context.strokeStyle = color;
            context.lineWidth = width;
            context.stroke();
        };

        // Draw Torso
        drawLine(lm.leftShoulder, lm.rightShoulder, colorPrimary, 2);
        drawLine(lm.leftHip, lm.rightHip, colorPrimary, 2);
        drawLine(lm.leftShoulder, lm.leftHip, colorPrimary, 1.5);
        drawLine(lm.rightShoulder, lm.rightHip, colorPrimary, 1.5);

        // Draw Left Arm & Leg (Primary Color)
        drawLine(lm.leftShoulder, lm.leftElbow, colorPrimary, 2);
        drawLine(lm.leftElbow, lm.leftWrist, colorPrimary, 2);
        drawLine(lm.leftHip, lm.leftKnee, colorPrimary, 2);
        drawLine(lm.leftKnee, lm.leftAnkle, colorPrimary, 2);

        // Draw Right Arm & Leg (Secondary Color)
        drawLine(lm.rightShoulder, lm.rightElbow, colorSecondary, 2);
        drawLine(lm.rightElbow, lm.rightWrist, colorSecondary, 2);
        drawLine(lm.rightHip, lm.rightKnee, colorSecondary, 2);
        drawLine(lm.rightKnee, lm.rightAnkle, colorSecondary, 2);

        // Draw Joints
        for (const key in lm) {
            drawPoint(lm[key], '#ffffff', 2.5);
        }

        // Draw Player Label over Head / Nose
        if (lm.nose) {
            const nx = (1 - lm.nose.x) * scaleW;
            const ny = Math.max(10, lm.nose.y * scaleH - 18);
            context.fillStyle = colorPrimary;
            context.font = 'bold 9px sans-serif';
            context.textAlign = 'center';
            context.fillText(this.fighterIndex === 0 ? 'P1 RYU' : 'P2 KEN', nx, ny);
        }

        // Draw Hadouken Charge VFX
        if (this.isChargingHadouken && lm.leftWrist && lm.rightWrist) {
            const cx = (1 - (lm.leftWrist.x + lm.rightWrist.x) / 2) * scaleW;
            const cy = ((lm.leftWrist.y + lm.rightWrist.y) / 2) * scaleH;
            
            const elapsed = now - this.chargeStartTime;
            const progress = Math.min(elapsed / 1500, 1);
            
            context.beginPath();
            context.arc(cx, cy, 8 + progress * 35, 0, 2 * Math.PI);
            const gradient = context.createRadialGradient(cx, cy, 0, cx, cy, 8 + progress * 35);
            gradient.addColorStop(0, auraColor);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            context.fillStyle = gradient;
            context.fill();
        }
    }
}

export class ARFighter {
    constructor(scene) {
        this.scene = scene;
        this.engineType = 'none'; // 'movenet' or 'mediapipe'
        this.detector = null;
        this.videoElement = null;
        this.remoteVideoElement = null;
        this.videoStream = null;

        // Initialize Virtual Input Hooks
        window.AI_FRAME_INPUT = {
            up: false, down: false, left: false, right: false,
            lightPunch: false, mediumPunch: false, heavyPunch: false,
            lightKick: false, mediumKick: false, heavyKick: false
        };
        window.AI_OPPONENT_INPUT = {
            up: false, down: false, left: false, right: false,
            lightPunch: false, mediumPunch: false, heavyPunch: false,
            lightKick: false, mediumKick: false, heavyKick: false
        };

        // Two Trackers for P1 and P2
        this.trackers = [
            new PlayerCombatTracker(scene, 0),
            new PlayerCombatTracker(scene, 1)
        ];

        this.initCamera();
    }

    async initCamera() {
        const videoElement = document.createElement('video');
        videoElement.style.display = 'none';
        videoElement.setAttribute('playsinline', '');
        videoElement.setAttribute('autoplay', '');
        videoElement.setAttribute('muted', '');
        videoElement.muted = true;
        document.body.appendChild(videoElement);
        this.videoElement = videoElement;

        // Check if Parent Hub has shared camera stream
        if (window.parent && window.parent.globalCameraStream) {
            this.videoStream = window.parent.globalCameraStream;
            videoElement.srcObject = this.videoStream;
            await videoElement.play().catch(e => console.log('Video play error:', e));
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
                    audio: false
                });
                this.videoStream = stream;
                videoElement.srcObject = stream;
                await videoElement.play().catch(e => console.log('Video play error:', e));
            } catch (err) {
                console.warn('[ARFighter] getUserMedia failed:', err);
            }
        }

        // Initialize Remote Video Element for WebRTC PiP
        this.remoteVideoElement = document.createElement('video');
        this.remoteVideoElement.style.display = 'none';
        this.remoteVideoElement.setAttribute('playsinline', '');
        this.remoteVideoElement.setAttribute('autoplay', '');
        this.remoteVideoElement.setAttribute('muted', '');
        this.remoteVideoElement.muted = true;
        document.body.appendChild(this.remoteVideoElement);

        networkManager.onRemoteStream = (stream) => {
            console.log('[ARFighter] Attaching remote stream to video element');
            this.remoteVideoElement.srcObject = stream;
            this.remoteVideoElement.play().catch(e => console.warn('Remote video play error:', e));
        };

        // Try initializing MoveNet MultiPose, fallback to MediaPipe Pose
        await this.initPoseEngine();
    }

    async initPoseEngine() {
        if (window.poseDetection && window.tf) {
            try {
                console.log('[ARFighter] Loading TensorFlow.js WebGL & MoveNet MultiPose...');
                await tf.setBackend('webgl');
                await tf.ready();
                this.detector = await poseDetection.createDetector(
                    poseDetection.SupportedModels.MoveNet,
                    {
                        modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING,
                        enableSmoothing: true,
                        minPoseScore: 0.2
                    }
                );
                this.engineType = 'movenet';
                console.log('[ARFighter] MoveNet MultiPose initialized successfully!');
                this.startMoveNetLoop();
                return;
            } catch (e) {
                console.warn('[ARFighter] MoveNet MultiPose init failed, fallback to MediaPipe Pose:', e);
            }
        }

        // Fallback to MediaPipe Pose
        this.initMediaPipe();
    }

    startMoveNetLoop() {
        const detectFrame = async () => {
            if (this.videoElement && this.videoElement.readyState >= 2 && this.detector) {
                try {
                    const poses = await this.detector.estimatePoses(this.videoElement);
                    this.onMultiPoseResults(poses);
                } catch (err) {
                    // Frame estimation error
                }
            }
            requestAnimationFrame(detectFrame);
        };
        requestAnimationFrame(detectFrame);
    }

    initMediaPipe() {
        if (typeof Pose === 'undefined') {
            console.warn('[ARFighter] MediaPipe Pose not available');
            return;
        }

        this.engineType = 'mediapipe';
        console.log('[ARFighter] Initializing MediaPipe Pose Engine (Single Pose)...');
        const pose = new Pose({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });
        pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            minDetectionConfidence: 0.65,
            minTrackingConfidence: 0.65
        });

        pose.onResults((results) => {
            this.onMediaPipeResults(results);
        });

        let lastTime = -1;
        const processFrame = async () => {
            if (this.videoElement && this.videoElement.readyState >= 2 && this.videoElement.currentTime !== lastTime) {
                lastTime = this.videoElement.currentTime;
                try {
                    await pose.send({ image: this.videoElement });
                } catch (e) {}
            }
            requestAnimationFrame(processFrame);
        };
        processFrame();
    }

    onMultiPoseResults(poses) {
        if (!poses || poses.length === 0) return;
        const now = performance.now();
        const vw = this.videoElement.videoWidth || 640;
        const vh = this.videoElement.videoHeight || 480;

        // Convert MoveNet poses to standard normalized landmarks
        const parsedPoses = [];
        for (const pose of poses) {
            if (pose.score < 0.2) continue;
            const kpMap = {};
            for (const kp of pose.keypoints) {
                kpMap[kp.name] = {
                    x: kp.x / vw,
                    y: kp.y / vh,
                    score: kp.score
                };
            }

            const standardLm = {
                nose: kpMap['nose'],
                leftShoulder: kpMap['left_shoulder'],
                rightShoulder: kpMap['right_shoulder'],
                leftElbow: kpMap['left_elbow'],
                rightElbow: kpMap['right_elbow'],
                leftWrist: kpMap['left_wrist'],
                rightWrist: kpMap['right_wrist'],
                leftHip: kpMap['left_hip'],
                rightHip: kpMap['right_hip'],
                leftKnee: kpMap['left_knee'],
                rightKnee: kpMap['right_knee'],
                leftAnkle: kpMap['left_ankle'],
                rightAnkle: kpMap['right_ankle']
            };

            // Calculate center X of this pose in mirrored coordinates
            const centerXRaw = ((standardLm.leftHip ? standardLm.leftHip.x : 0.5) + (standardLm.rightHip ? standardLm.rightHip.x : 0.5)) / 2;
            const mirroredCenterX = 1 - centerXRaw;

            parsedPoses.push({
                landmarks: standardLm,
                mirroredCenterX: mirroredCenterX,
                score: pose.score
            });
        }

        if (parsedPoses.length === 0) return;

        const mode = window.GAME_MODE || '1P';

        if (mode === '2P_LOCAL') {
            // Sort poses from left to right (mirroredCenterX ascending)
            parsedPoses.sort((a, b) => a.mirroredCenterX - b.mirroredCenterX);

            if (parsedPoses.length >= 2) {
                // Leftmost pose -> P1 (Ryu), Rightmost pose -> P2 (Ken)
                this.trackers[0].updateLandmarks(parsedPoses[0].landmarks, now);
                this.trackers[1].updateLandmarks(parsedPoses[parsedPoses.length - 1].landmarks, now);
            } else {
                // Only 1 person detected: Assign to P1 or P2 depending on which side they stand
                if (parsedPoses[0].mirroredCenterX < 0.5) {
                    this.trackers[0].updateLandmarks(parsedPoses[0].landmarks, now);
                } else {
                    this.trackers[1].updateLandmarks(parsedPoses[0].landmarks, now);
                }
            }
        } else if (mode === '2P_ONLINE') {
            // Online mode: only 1 player is local on this machine
            const localTrackerIndex = window.IS_ONLINE_HOST ? 0 : 1;
            this.trackers[localTrackerIndex].updateLandmarks(parsedPoses[0].landmarks, now);
        } else {
            // 1P Mode (vs CPU): Player controls P1 (Ryu)
            this.trackers[0].updateLandmarks(parsedPoses[0].landmarks, now);
        }
    }

    onMediaPipeResults(results) {
        if (!results.poseLandmarks) return;
        const now = performance.now();
        const pl = results.poseLandmarks;

        const standardLm = {
            nose: pl[0],
            leftShoulder: pl[11],
            rightShoulder: pl[12],
            leftElbow: pl[13],
            rightElbow: pl[14],
            leftWrist: pl[15],
            rightWrist: pl[16],
            leftHip: pl[23],
            rightHip: pl[24],
            leftKnee: pl[25],
            rightKnee: pl[26],
            leftAnkle: pl[27],
            rightAnkle: pl[28]
        };

        const mode = window.GAME_MODE || '1P';
        if (mode === '2P_ONLINE') {
            const localTrackerIndex = window.IS_ONLINE_HOST ? 0 : 1;
            this.trackers[localTrackerIndex].updateLandmarks(standardLm, now);
        } else {
            this.trackers[0].updateLandmarks(standardLm, now);
        }
    }

    draw(context, camera) {
        const mode = window.GAME_MODE || '1P';

        // Draw Player 1 (Ryu) Skeleton (Cyan / Blue)
        this.trackers[0].draw(context, '#00e5ff', '#0077ff', 'rgba(0, 200, 255, 0.7)');

        // Draw Player 2 (Ken) Skeleton in 2P_LOCAL mode (Magenta / Orange)
        if (mode === '2P_LOCAL') {
            this.trackers[1].draw(context, '#f43f5e', '#fb923c', 'rgba(255, 100, 0, 0.7)');
        }

        // Draw Remote Opponent Video Feed in PiP mode for 2P_ONLINE
        if (mode === '2P_ONLINE' && this.remoteVideoElement && this.remoteVideoElement.readyState >= 2) {
            const pipW = 80;
            const pipH = 50;
            const pipX = 384 - pipW - 10;
            const pipY = 10;

            context.save();
            // PiP Border
            context.fillStyle = 'rgba(0, 0, 0, 0.7)';
            context.fillRect(pipX - 2, pipY - 2, pipW + 4, pipH + 4);
            context.strokeStyle = window.IS_ONLINE_HOST ? '#f43f5e' : '#00e5ff';
            context.lineWidth = 1.5;
            context.strokeRect(pipX - 2, pipY - 2, pipW + 4, pipH + 4);

            // Draw Opponent Video Mirrored inside PiP
            context.translate(pipX + pipW, pipY);
            context.scale(-1, 1);
            context.drawImage(this.remoteVideoElement, 0, 0, pipW, pipH);
            context.restore();

            // Label on PiP
            context.fillStyle = 'white';
            context.font = 'bold 7px sans-serif';
            context.textAlign = 'center';
            context.fillText('OPPONENT CAM', pipX + pipW / 2, pipY + pipH + 8);
        }
    }
}
