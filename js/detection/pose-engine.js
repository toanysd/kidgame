/**
 * PoseEngine — MediaPipe Pose Landmarker Wrapper
 * Handles camera initialization and body tracking
 * 
 * Uses @mediapipe/tasks-vision for real-time pose detection
 * Returns 33 body landmarks per frame
 */

// MediaPipe landmark indices for quick reference
export const LANDMARKS = {
  NOSE: 0,
  LEFT_EYE: 2,
  RIGHT_EYE: 5,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
};

export class PoseEngine {
  constructor() {
    this.poseLandmarker = null;
    this.videoElement = null;
    this.stream = null;
    this.isReady = false;
    this.lastResults = null;
    this.lastTimestamp = -1;
    this.videoWidth = 0;
    this.videoHeight = 0;
    this._onStatusUpdate = null;
  }

  /**
   * Set a callback for status updates during initialization
   */
  onStatusUpdate(callback) {
    this._onStatusUpdate = callback;
  }

  _updateStatus(message) {
    if (this._onStatusUpdate) {
      this._onStatusUpdate(message);
    }
  }

  /**
   * Initialize camera and MediaPipe model
   * @returns {Promise<void>}
   */
  async init(videoElement) {
    this.videoElement = videoElement;

    // Step 1: Start camera
    this._updateStatus('Requesting camera access / Đang mở camera...');
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });
    } catch (err) {
      throw new Error('Camera access denied. Please allow camera access to play! / Vui lòng cho phép truy cập camera!');
    }

    this.videoElement.srcObject = this.stream;

    // Wait for video to be ready
    await new Promise((resolve) => {
      this.videoElement.onloadedmetadata = () => {
        this.videoWidth = this.videoElement.videoWidth;
        this.videoHeight = this.videoElement.videoHeight;
        resolve();
      };
    });

    await this.videoElement.play();

    // Step 2: Load MediaPipe
    this._updateStatus('Loading AI body tracking model... / Đang tải mô hình AI...');

    try {
      const { PoseLandmarker, FilesetResolver } = await import(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs'
      );

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
    } catch (err) {
      // Fallback to CPU if GPU fails
      console.warn('GPU delegate failed, falling back to CPU:', err.message);
      this._updateStatus('Retrying with CPU mode...');

      const { PoseLandmarker, FilesetResolver } = await import(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs'
      );

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
          delegate: 'CPU'
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
    }

    this._updateStatus('Ready! / Sẵn sàng!');
    this.isReady = true;
  }

  /**
   * Run pose detection on current video frame
   * @returns {Array|null} Array of 33 landmarks or null
   */
  detect() {
    if (!this.isReady || !this.poseLandmarker || !this.videoElement) {
      return null;
    }

    const nowMs = performance.now();

    // MediaPipe requires increasing timestamps
    if (nowMs <= this.lastTimestamp) {
      return this.lastResults;
    }

    try {
      const results = this.poseLandmarker.detectForVideo(this.videoElement, nowMs);
      this.lastTimestamp = nowMs;

      if (results && results.landmarks && results.landmarks.length > 0) {
        // Return first person's landmarks (normalized 0-1)
        this.lastResults = results.landmarks[0];
        return this.lastResults;
      }
    } catch (err) {
      // Silently handle detection errors (common during rapid frame processing)
    }

    return this.lastResults;
  }

  /**
   * Get video dimensions
   */
  getVideoDimensions() {
    return {
      width: this.videoWidth,
      height: this.videoHeight
    };
  }

  /**
   * Convert normalized landmark to canvas coordinates (mirrored)
   * @param {Object} landmark {x, y, z}
   * @param {number} canvasWidth
   * @param {number} canvasHeight
   * @returns {{x: number, y: number}}
   */
  toCanvasCoords(landmark, canvasWidth, canvasHeight) {
    return {
      x: (1 - landmark.x) * canvasWidth,  // Mirror X
      y: landmark.y * canvasHeight
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.poseLandmarker) {
      this.poseLandmarker.close();
      this.poseLandmarker = null;
    }
    this.isReady = false;
  }
}
