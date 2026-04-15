/**
 * MotionAnalyzer — Velocity & Gesture Detection
 * Tracks joint movement history and determines "slash" actions
 * 
 * A "slash" = fast hand/foot movement that can hit game objects
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
    // History of positions for each tracked joint: { x, y, timestamp }[]
    this.history = {};
    for (const joint of SLASH_JOINTS) {
      this.history[joint.id] = [];
    }
  }

  /**
   * Update joint tracking with new landmarks
   * @param {Array} landmarks - 33 normalized landmarks from PoseEngine
   * @param {number} canvasWidth
   * @param {number} canvasHeight
   * @param {Function} toCanvasCoords - coordinate converter
   */
  update(landmarks, canvasWidth, canvasHeight, toCanvasCoords) {
    if (!landmarks) return;

    const now = performance.now();

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

      this.history[joint.id].push(entry);

      // Keep only last N entries
      if (this.history[joint.id].length > HISTORY_LENGTH) {
        this.history[joint.id].shift();
      }
    }
  }

  /**
   * Get current velocity of a joint (pixels per millisecond)
   * Uses average of last few frames for stability
   */
  getVelocity(jointId) {
    const hist = this.history[jointId];
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
   * @returns {Array<{x, y, jointId, velocity, color, label}>}
   */
  getActiveSlashes() {
    const slashes = [];

    for (const joint of SLASH_JOINTS) {
      const velocity = this.getVelocity(joint.id);
      const hist = this.history[joint.id];

      if (velocity > VELOCITY_THRESHOLD && hist.length > 0) {
        const latest = hist[hist.length - 1];
        slashes.push({
          x: latest.x,
          y: latest.y,
          jointId: joint.id,
          velocity,
          color: joint.color,
          label: joint.label
        });
      }
    }

    return slashes;
  }

  /**
   * Get trail points for rendering slash effects
   * @returns {Array<{jointId, color, points: Array<{x, y, age}>}>}
   */
  getSlashTrails() {
    const trails = [];

    for (const joint of SLASH_JOINTS) {
      const hist = this.history[joint.id];
      if (hist.length < 2) continue;

      const velocity = this.getVelocity(joint.id);
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
        points
      });
    }

    return trails;
  }

  /**
   * Get position of all tracked joints (for debug visualization)
   * @returns {Array<{x, y, label, color}>}
   */
  getAllPositions() {
    const positions = [];

    for (const joint of SLASH_JOINTS) {
      const hist = this.history[joint.id];
      if (hist.length === 0) continue;

      const latest = hist[hist.length - 1];
      positions.push({
        x: latest.x,
        y: latest.y,
        label: joint.label,
        color: joint.color
      });
    }

    return positions;
  }

  /**
   * Get the center of body (average of hips)
   * Useful for zone detection in Magic Zone mode
   */
  getBodyCenter(landmarks, canvasWidth, canvasHeight, toCanvasCoords) {
    if (!landmarks) return null;

    const leftHip = landmarks[LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[LANDMARKS.RIGHT_HIP];

    if (!leftHip || !rightHip) return null;

    const left = toCanvasCoords(leftHip, canvasWidth, canvasHeight);
    const right = toCanvasCoords(rightHip, canvasWidth, canvasHeight);

    return {
      x: (left.x + right.x) / 2,
      y: (left.y + right.y) / 2
    };
  }

  /**
   * Reset all tracked history
   */
  reset() {
    for (const joint of SLASH_JOINTS) {
      this.history[joint.id] = [];
    }
  }
}
