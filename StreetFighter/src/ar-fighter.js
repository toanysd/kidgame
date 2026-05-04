import { FighterState, FighterAttackStrength } from './constants/fighter.js';
import { FRAME_TIME } from './constants/game.js';
import { gameState } from './states/gameState.js';

export class ARFighter {
    constructor(scene, fighterIndex) {
        this.scene = scene;
        this.fighterIndex = fighterIndex; // usually 0 for Ryu (Player)
        this.emaPoints = {};
        
        // Tracking state for 45-degree stance
        this.prevLeftArmDist = 0;
        this.prevRightArmDist = 0;
        this.prevHipY = 0;
        this.baseNoseX = 0;
        
        this.isChargingHadouken = false;
        this.chargeStartTime = 0;
        this.hadoukenFired = 0;

        // Initialize Virtual Input Hook for InputHandler.js
        window.AI_FRAME_INPUT = {
            up: false, down: false, left: false, right: false,
            lightPunch: false, mediumPunch: false, heavyPunch: false,
            lightKick: false, mediumKick: false, heavyKick: false
        };
        this.inputTimers = {};
        this.inputFlags = {}; // Prevent input spamming
        
        this.initMediapipe();
    }

    initMediapipe() {
        const videoElement = document.createElement('video');
        videoElement.style.display = 'none';
        videoElement.autoplay = true;
        document.body.appendChild(videoElement);

        const pose = new Pose({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });
        pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            minDetectionConfidence: 0.75,
            minTrackingConfidence: 0.75
        });

        pose.onResults(this.onPoseResults.bind(this));

        const camera = new Camera(videoElement, {
            onFrame: async () => {
                await pose.send({ image: videoElement });
            },
            width: 640,
            height: 480
        });
        camera.start();
        this.videoElement = videoElement;
    }

    onPoseResults(results) {
        if (!results.poseLandmarks) return;
        
        // Exponential Moving Average (EMA) for Smoothing
        const alpha = 0.6; 
        results.poseLandmarks.forEach((lm, index) => {
            if (!this.emaPoints[index]) {
                this.emaPoints[index] = { x: lm.x, y: lm.y, z: lm.z };
            } else {
                this.emaPoints[index].x = lm.x * alpha + this.emaPoints[index].x * (1 - alpha);
                this.emaPoints[index].y = lm.y * alpha + this.emaPoints[index].y * (1 - alpha);
                this.emaPoints[index].z = lm.z * alpha + this.emaPoints[index].z * (1 - alpha);
            }
        });

        this.processCombatLogic(performance.now());
    }

    triggerInput(key, duration = 30) {
        if (this.inputFlags[key]) return; // Prevent spamming / freezing
        this.inputFlags[key] = true;

        window.AI_FRAME_INPUT[key] = true;
        if (this.inputTimers[key]) clearTimeout(this.inputTimers[key]);
        
        this.inputTimers[key] = setTimeout(() => {
            window.AI_FRAME_INPUT[key] = false;
            // Add cooldown before this move can be triggered again
            setTimeout(() => {
                this.inputFlags[key] = false;
            }, 350); 
        }, duration);
    }

    processCombatLogic(now) {
        // Landmarks: 11(L.Shoulder), 12(R.Shoulder), 15(L.Wrist), 16(R.Wrist), 23(L.Hip), 24(R.Hip), 25/26(Knees), 27/28(Ankles)
        const leftWrist = this.emaPoints[15];
        const rightWrist = this.emaPoints[16];
        const leftShoulder = this.emaPoints[11];
        const rightShoulder = this.emaPoints[12];
        const leftHip = this.emaPoints[23];
        const rightHip = this.emaPoints[24];
        const leftAnkle = this.emaPoints[27];
        const rightAnkle = this.emaPoints[28];
        const leftKnee = this.emaPoints[25];
        const rightKnee = this.emaPoints[26];
        const nose = this.emaPoints[0];

        if (!leftShoulder || !rightShoulder || !leftHip || !rightHip || !leftWrist || !rightWrist) return;

        // 1. Kamehameha / Hadouken Energy Mechanic
        const wristDist = Math.sqrt(Math.pow(leftWrist.x - rightWrist.x, 2) + Math.pow(leftWrist.y - rightWrist.y, 2));
        if (wristDist < 0.1 && now - this.hadoukenFired > 3000) {
            if (!this.isChargingHadouken) {
                this.isChargingHadouken = true;
                this.chargeStartTime = now;
            } else if (now - this.chargeStartTime > 1500) {
                this.fireHadouken(now);
            }
            return; // Skip other moves while charging
        } else {
            this.isChargingHadouken = false;
        }

        // 2. Punching (Arm extension on 2D plane for front-facing stance)
        const leftArmDist = Math.sqrt(Math.pow(leftWrist.x - leftShoulder.x, 2) + Math.pow(leftWrist.y - leftShoulder.y, 2));
        const rightArmDist = Math.sqrt(Math.pow(rightWrist.x - rightShoulder.x, 2) + Math.pow(rightWrist.y - rightShoulder.y, 2));

        if (leftArmDist > 0.25 && leftArmDist - this.prevLeftArmDist > 0.015) {
            this.triggerInput('lightPunch');
        } else if (rightArmDist > 0.25 && rightArmDist - this.prevRightArmDist > 0.015) {
            this.triggerInput('heavyPunch');
        }
        this.prevLeftArmDist = leftArmDist;
        this.prevRightArmDist = rightArmDist;

        // 3. Kicking (Ankle raised high relative to knee, front facing)
        if (leftAnkle && leftKnee && leftAnkle.y < leftKnee.y - 0.02) {
            this.triggerInput('lightKick');
        } else if (rightAnkle && rightKnee && rightAnkle.y < rightKnee.y - 0.02) {
            this.triggerInput('heavyKick');
        }

        // 4. Jumping & Crouching (Hip Y movement)
        const avgHipY = (leftHip.y + rightHip.y) / 2;
        if (this.prevHipY > 0) {
            if (avgHipY < this.prevHipY - 0.04) { // Moved up rapidly
                this.triggerInput('up', 100); 
            } else if (avgHipY > this.prevHipY + 0.05) { // Moved down rapidly
                this.triggerInput('down', 50);
            }
        }
        // Smooth base hip tracking
        this.prevHipY = avgHipY * 0.1 + (this.prevHipY > 0 ? this.prevHipY : avgHipY) * 0.9;

        // 5. Movement (Leaning body forward/backward based on Nose X)
        if (nose) {
            if (!this.baseNoseX) this.baseNoseX = nose.x;
            // Smoothly adjust baseNoseX over time to recenter slowly
            this.baseNoseX = nose.x * 0.01 + this.baseNoseX * 0.99;
            
            // X is mirrored. Moving physically right decreases X.
            if (nose.x < this.baseNoseX - 0.08) {
                this.triggerInput('right', 30);
            } else if (nose.x > this.baseNoseX + 0.08) {
                this.triggerInput('left', 30);
            }
        }

        // 6. Blocking (Wrists raised near face level and crossed)
        if (leftWrist.y < leftShoulder.y && rightWrist.y < rightShoulder.y && wristDist < 0.2) {
            // In SF, walking backwards also acts as block, but we just trigger 'left' for P1
            this.triggerInput('left');
        }
    }

    fireHadouken(now) {
        this.isChargingHadouken = false;
        this.hadoukenFired = now;
        
        const opponentId = 1 - this.fighterIndex;
        // Trigger Hadouken visually and deduct HP directly as a super move
        if (this.scene && this.scene.handleAttackHit) {
            this.scene.handleAttackHit(
                { previous: now },
                this.fighterIndex,
                opponentId,
                null,
                FighterAttackStrength.HEAVY
            );
            gameState.fighters[opponentId].hitPoints -= 120;
        }
    }

    draw(context, camera) {
        // If no pose detected yet, stop here. Don't draw bones.
        if (!this.emaPoints || Object.keys(this.emaPoints).length === 0) return;

        // Full Screen Skeleton Overlay (matches the 384x224 background)
        const scaleW = 384;
        const scaleH = 224;

        const drawPoint = (lm, color = 'white') => {
            if (!lm) return;
            const x = (1 - lm.x) * scaleW;
            const y = lm.y * scaleH;
            context.fillStyle = color;
            context.beginPath();
            context.arc(x, y, 2, 0, 2 * Math.PI);
            context.fill();
        };

        const drawLine = (i, j, color = 'rgba(0, 255, 0, 0.8)') => {
            const p1 = this.emaPoints[i];
            const p2 = this.emaPoints[j];
            if (!p1 || !p2) return;
            context.beginPath();
            context.moveTo((1 - p1.x) * scaleW, p1.y * scaleH);
            context.lineTo((1 - p2.x) * scaleW, p2.y * scaleH);
            context.strokeStyle = color;
            context.lineWidth = 1;
            context.stroke();
        };

        // Draw Skeletal Lines
        drawLine(11, 12); // Shoulders
        drawLine(23, 24); // Hips
        drawLine(11, 23); // Left Torso
        drawLine(12, 24); // Right Torso
        
        drawLine(11, 13, 'cyan'); drawLine(13, 15, 'cyan'); // Left Arm
        drawLine(12, 14, 'magenta'); drawLine(14, 16, 'magenta'); // Right Arm
        
        drawLine(23, 25, 'cyan'); drawLine(25, 27, 'cyan'); // Left Leg
        drawLine(24, 26, 'magenta'); drawLine(26, 28, 'magenta'); // Right Leg

        // Draw Joints
        [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].forEach(idx => drawPoint(this.emaPoints[idx]));

        // Draw Hadouken Charge VFX on Main Canvas
        if (this.isChargingHadouken) {
            const leftWrist = this.emaPoints[15];
            const rightWrist = this.emaPoints[16];
            if (leftWrist && rightWrist) {
                const cx = (1 - (leftWrist.x + rightWrist.x) / 2) * scaleW;
                const cy = ((leftWrist.y + rightWrist.y) / 2) * scaleH;
                
                const now = performance.now();
                const elapsed = now - this.chargeStartTime;
                const progress = Math.min(elapsed / 1500, 1);
                
                context.beginPath();
                context.arc(cx, cy, 10 + progress * 40, 0, 2 * Math.PI);
                const gradient = context.createRadialGradient(cx, cy, 0, cx, cy, 10 + progress * 40);
                gradient.addColorStop(0, `rgba(100, 200, 255, ${0.5 + progress*0.5})`);
                gradient.addColorStop(1, 'rgba(0, 100, 255, 0)');
                context.fillStyle = gradient;
                context.fill();
            }
        }
    }
}
