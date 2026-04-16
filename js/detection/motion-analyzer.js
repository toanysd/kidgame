/**
 * MotionAnalyzer — Velocity & Gesture Detection
 * Tracks joint movement history and determines "slash" actions
 * 
 * A "slash" = fast hand/foot movement that can hit game objects
 * Updated for Multi-pose (up to 2 players)
 */

import { LANDMARKS } from './pose-engine.js';

// Which joints can "slash" (hit objects)
const SLASH_JOINTS = [
  { id: LANDMARKS.LEFT_WRIST, label: 'Left Hand', color: '#00d4ff' },
  { id: LANDMARKS.RIGHT_WRIST, label: 'Right Hand', color: '#ff2eea' },
  { id: LANDMARKS.LEFT_ANKLE, label: 'Left Foot', color: '#39ff14' },
  { id: LANDMARKS.RIGHT_ANKLE, label: 'Right Foot', color: '#ffe600' },
];

const HISTORY_LENGTH = 10;  // Number of frames to keep for trail
const VELOCITY_THRESHOLD = 0.005; // Độ nhạy siêu cao: Chỉ cần lướt nhẹ là tính "chém" (tối ưu cho trải nghiệm chạm/phá của bé 3 tuổi)

export class MotionAnalyzer {
  constructor() {
    // Array of histories for up to 2 people
    this.histories = [{}, {}];
    for (let p = 0; p < 2; p++) {
      for (const joint of SLASH_JOINTS) {
        this.histories[p][joint.id] = [];
      }
    }
  }

  /**
   * Update joint tracking with new landmarks (Array from Multi-pose)
   * @param {Array} landmarksArray - Array of normalized landmarks from PoseEngine
   * @param {number} canvasWidth
   * @param {number} canvasHeight
   * @param {Function} toCanvasCoords - coordinate converter
   */
  update(landmarksArray, canvasWidth, canvasHeight, toCanvasCoords) {
    if (!landmarksArray) return;
    
    // Convert to array if it's a single pose (backward compatibility)
    const poses = Array.isArray(landmarksArray[0]) ? landmarksArray : [landmarksArray];

    const now = performance.now();

    for (let p = 0; p < Math.min(poses.length, 2); p++) {
      const landmarks = poses[p];
      if (!landmarks) continue;

      for (const joint of SLASH_JOINTS) {
        const lm = landmarks[joint.id];
        if (!lm || lm.visibility < 0.5) continue;

        const pos = toCanvasCoords(lm, canvasWidth, canvasHeight);
        const entry = {
          x: pos.x,
          y: pos.y,
          timestamp: now,
          normalizedX: 1 - lm.x, // mirrored
          normalizedY: lm.y
        };

        this.histories[p][joint.id].push(entry);

        // Keep only last N entries
        if (this.histories[p][joint.id].length > HISTORY_LENGTH) {
          this.histories[p][joint.id].shift();
        }
      }
    }
  }

  /**
   * Get current velocity of a joint (pixels per millisecond)
   * Uses average of last few frames for stability
   */
  getVelocity(jointId, personIndex = 0) {
    const hist = this.histories[personIndex][jointId];
    if (!hist || hist.length < 2) return 0;

    const latest = hist[hist.length - 1];
    const prev = hist[hist.length - 2];
    const dt = latest.timestamp - prev.timestamp;

    if (dt <= 0) return 0;

    // Normalized velocity (position units per ms)
    const dx = latest.normalizedX - prev.normalizedX;
    const dy = latest.normalizedY - prev.normalizedY;
    return Math.sqrt(dx * dx + dy * dy) / dt;
  }

  /**
   * Get active slash points — joints moving fast enough to "hit"
   * @returns {Array<{x, y, jointId, velocity, color, label, personIndex}>}
   */
  getActiveSlashes() {
    const slashes = [];

    for (let p = 0; p < 2; p++) {
      for (const joint of SLASH_JOINTS) {
        const velocity = this.getVelocity(joint.id, p);
        const hist = this.histories[p][joint.id];

        if (velocity > VELOCITY_THRESHOLD && hist.length > 0) {
          const latest = hist[hist.length - 1];
          slashes.push({
            x: latest.x,
            y: latest.y,
            jointId: joint.id,
            velocity,
            color: joint.color,
            label: joint.label,
            personIndex: p
          });
        }
      }
    }

    return slashes;
  }

  /**
   * Get trail points for rendering slash effects
   * @returns {Array<{jointId, color, personIndex, points: Array<{x, y, age}>}>}
   */
  getSlashTrails() {
    const trails = [];

    for (let p = 0; p < 2; p++) {
      for (const joint of SLASH_JOINTS) {
        const hist = this.histories[p][joint.id];
        if (hist.length < 2) continue;

        const velocity = this.getVelocity(joint.id, p);
        if (velocity < VELOCITY_THRESHOLD * 0.5) continue; // Show trail even at lower velocity

        const now = performance.now();
        const points = hist.map(h => ({
          x: h.x,
          y: h.y,
          age: (now - h.timestamp) / 200 // normalize age (0 = new, 1+ = old)
        }));

        trails.push({
          jointId: joint.id,
          color: joint.color,
          personIndex: p,
          points
        });
      }
    }

    return trails;
  }

  /**
   * Get position of all tracked joints (for debug visualization or games like Fighter)
   * @returns {Array<{x, y, label, color, jointId, personIndex}>}
   */
  getAllPositions() {
    const positions = [];

    for (let p = 0; p < 2; p++) {
      for (const joint of SLASH_JOINTS) {
        const hist = this.histories[p][joint.id];
        if (hist.length === 0) continue;

        const latest = hist[hist.length - 1];
        positions.push({
          x: latest.x,
          y: latest.y,
          label: joint.label,
          jointId: joint.id,
          color: joint.color,
          personIndex: p
        });
      }
    }

    return positions;
  }

  /**
   * Get the center of body (average of shoulders/hips)
   * Useful for Fighter mode Hitbox
   */
  getBodyCenter(landmarks, canvasWidth, canvasHeight, toCanvasCoords) {
    if (!landmarks) return null;

    const leftShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER];
    const leftHip = landmarks[LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[LANDMARKS.RIGHT_HIP];

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return null;

    const ls = toCanvasCoords(leftShoulder, canvasWidth, canvasHeight);
    const rs = toCanvasCoords(rightShoulder, canvasWidth, canvasHeight);
    const lh = toCanvasCoords(leftHip, canvasWidth, canvasHeight);
    const rh = toCanvasCoords(rightHip, canvasWidth, canvasHeight);

    // Center of torso
    return {
      x: (ls.x + rs.x + lh.x + rh.x) / 4,
      y: (ls.y + rs.y + lh.y + rh.y) / 4,
      width: Math.abs(ls.x - rs.x) * 0.9, // approximate width
      height: Math.abs(ls.y - lh.y) * 0.9 // approximate height
    };
  }

  /**
   * Reset all tracked history
   */
  reset() {
    for (let p = 0; p < 2; p++) {
      for (const joint of SLASH_JOINTS) {
        this.histories[p][joint.id] = [];
      }
    }
  }
}
