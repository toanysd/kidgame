/**
 * App — Main Controller for KidGame
 * 
 * Manages screen transitions, initializes engines,
 * and runs the main game loop.
 */

import { PoseEngine } from './detection/pose-engine.js';
import { MotionAnalyzer } from './detection/motion-analyzer.js';
import { SoundManager } from './audio/sound-manager.js';
import { FruitNinjaGame } from './games/fruit-ninja.js';
import { FighterGame } from './games/fighter.js';

class App {
  constructor() {
    // Core engines
    this.poseEngine = new PoseEngine();
    this.motionAnalyzer = new MotionAnalyzer();
    this.sound = new SoundManager();

    // Current game
    this.currentGame = null;

    // DOM references
    this.screens = {
      loading: document.getElementById('screen-loading'),
      menu: document.getElementById('screen-menu'),
      game: document.getElementById('screen-game'),
      results: document.getElementById('screen-results'),
    };
    this.videoElement = document.getElementById('camera-feed');
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Animation frame
    this._rafId = null;
    this._isRunning = false;

    // Bind methods
    this._gameLoop = this._gameLoop.bind(this);
  }

  /**
   * Boot the application
   */
  async boot() {
    this._showScreen('loading');
    this._setupEventListeners();

    try {
      // Status updates during loading
      this.poseEngine.onStatusUpdate((msg) => {
        const el = document.getElementById('loading-status');
        if (el) el.textContent = msg;
      });

      // Initialize everything
      await this.poseEngine.init(this.videoElement);
      this.sound.init();

      // Show menu
      this._showScreen('menu');
      this._spawnMenuParticles();

    } catch (error) {
      console.error('Boot failed:', error);
      const el = document.getElementById('loading-status');
      if (el) {
        el.textContent = `❌ ${error.message}`;
        el.style.color = '#ff1744';
      }
    }
  }

  /**
   * Setup all event listeners
   */
  _setupEventListeners() {
    // Menu: Start Fruit Ninja
    const btnFruitNinja = document.getElementById('btn-fruit-ninja');
    if (btnFruitNinja) {
      btnFruitNinja.addEventListener('click', () => {
        this.sound.resume();
        this._startGame('fruit-ninja');
      });
    }

    const btnFighterAI = document.getElementById('btn-fighter-ai');
    if (btnFighterAI) {
      btnFighterAI.addEventListener('click', () => {
        this.sound.resume();
        this._startGame('fighter-ai');
      });
    }

    const btnFighterP2P = document.getElementById('btn-fighter-p2p');
    if (btnFighterP2P) {
      btnFighterP2P.addEventListener('click', () => {
        this.sound.resume();
        this._startGame('fighter-p2p');
      });
    }

    // Game: Pause
    const btnPause = document.getElementById('btn-pause');
    if (btnPause) {
      btnPause.addEventListener('click', () => {
        if (this.currentGame) {
          this.currentGame.togglePause();
        }
      });
    }

    // Game: Home (Back to menu)
    const btnHome = document.getElementById('btn-home');
    if (btnHome) {
      btnHome.addEventListener('click', () => {
        if (this.currentGame) {
          this.currentGame.state = 'ended';
          this.sound.stopBGM();
          if (typeof this.currentGame.hideHUD === 'function') {
            this.currentGame.hideHUD();
          }
           // Xóa combo/strikes overlay nếu bị kẹt
          const comboEl = document.getElementById('hud-combo');
          if (comboEl) comboEl.classList.remove('visible');
        }
        this._stopGameLoop();
        this._showScreen('menu');
      });
    }

    // Results: Play Again
    const btnPlayAgain = document.getElementById('btn-play-again');
    if (btnPlayAgain) {
      btnPlayAgain.addEventListener('click', () => {
        this.sound.resume();
        this._startGame(this.currentMode || 'fruit-ninja');
      });
    }

    // Results: Back to Menu
    const btnMenu = document.getElementById('btn-back-menu');
    if (btnMenu) {
      btnMenu.addEventListener('click', () => {
        this._showScreen('menu');
        this._stopGameLoop();
      });
    }

    // Handle canvas resize
    window.addEventListener('resize', () => this._resizeCanvas());

    // Fullscreen on double-tap (for tablet)
    document.addEventListener('dblclick', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      }
    });
  }

  /**
   * Start a game mode
   */
  _startGame(mode) {
    this._showScreen('game');
    this._resizeCanvas();
    this.currentMode = mode;

    // Reset motion analyzer
    this.motionAnalyzer.reset();

    if (mode === 'fruit-ninja') {
      this.currentGame = new FruitNinjaGame(this.canvas, this.sound);
      this.currentGame.onGameEnd = (results) => this._showResults(results);
      this.currentGame.start();
    } else if (mode === 'fighter-ai' || mode === 'fighter-p2p') {
      this.currentGame = new FighterGame(this.canvas, this.sound, mode, this.motionAnalyzer, this.poseEngine.toCanvasCoords.bind(this.poseEngine));
      this.currentGame.onGameEnd = (results) => this._showResults(results);
      this.currentGame.start();
    }

    this._startGameLoop();
  }

  /**
   * Main game loop
   */
  _gameLoop() {
    if (!this._isRunning) return;

    // 1. Detect pose
    const landmarks = this.poseEngine.detect();

    // 2. Analyze motion
    this.motionAnalyzer.update(
      landmarks,
      this.canvas.clientWidth,
      this.canvas.clientHeight,
      this.poseEngine.toCanvasCoords.bind(this.poseEngine)
    );

    const slashes = this.motionAnalyzer.getActiveSlashes();
    const trails = this.motionAnalyzer.getSlashTrails();
    const positions = this.motionAnalyzer.getAllPositions();

    // Play slash sound when slashing (Disabled by request)
    // if (slashes.length > 0) { ... playSlash() ... }

    // 3. Update & render game
    if (this.currentGame) {
      this.currentGame.update(slashes, trails, positions, landmarks);
    }

    // Continue loop
    this._rafId = requestAnimationFrame(this._gameLoop);
  }

  _startGameLoop() {
    this._isRunning = true;
    this._lastSlashSound = 0;
    this._rafId = requestAnimationFrame(this._gameLoop);
  }

  _stopGameLoop() {
    this._isRunning = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  /**
   * Resize canvas to match container
   */
  _resizeCanvas() {
    const container = this.screens.game;
    if (!container) return;

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = container.clientWidth * dpr;
    this.canvas.height = container.clientHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /**
   * Switch visible screen
   */
  _showScreen(name) {
    for (const [key, el] of Object.entries(this.screens)) {
      if (el) {
        el.classList.toggle('active', key === name);
      }
    }
  }

  /**
   * Show results screen with game stats
   */
  _showResults(results) {
    this._showScreen('results');

    // Stars
    const starsEl = document.getElementById('results-stars');
    if (starsEl) {
      starsEl.innerHTML = '';
      for (let i = 0; i < 5; i++) {
        const star = document.createElement('span');
        star.className = 'results-star';
        star.textContent = i < results.stars ? '⭐' : '☆';
        star.style.animationDelay = `${i * 0.15}s`;
        if (i >= results.stars) {
          star.style.opacity = '0.3';
          star.style.filter = 'grayscale(100%)';
        }
        starsEl.appendChild(star);
      }
    }

    // Title based on performance
    const titleEl = document.getElementById('results-title');
    const subEl = document.getElementById('results-subtitle');
    if (results.stars >= 4) {
      titleEl.textContent = 'AMAZING! 🎉🏆';
      subEl.textContent = 'Xuất sắc! Con giỏi quá!';
    } else if (results.stars >= 2) {
      titleEl.textContent = 'Great Job! 🎉';
      subEl.textContent = 'Giỏi lắm con!';
    } else {
      titleEl.textContent = 'Good Try! 💪';
      subEl.textContent = 'Cố lên con nhé!';
    }

    // Stats
    document.getElementById('stat-score').textContent = results.score;
    document.getElementById('stat-combo').textContent = `x${results.maxCombo}`;
    document.getElementById('stat-hits').textContent = results.totalHits;

    // Confetti!
    this._spawnConfetti(results.stars);

    // Speak encouragement
    setTimeout(() => {
      if (results.stars >= 3) {
        this.sound.speak('Amazing! You did great!', 'en-US');
      } else {
        this.sound.speak('Good try! Let\'s play again!', 'en-US');
      }
    }, 1500);
  }

  /**
   * Spawn confetti particles on results screen
   */
  _spawnConfetti(starCount) {
    const container = document.getElementById('confetti');
    if (!container) return;
    container.innerHTML = '';

    const colors = ['#ff3b3b', '#ffe135', '#00d4ff', '#39ff14', '#ff2eea', '#b84dff', '#ff6b35'];
    const count = 30 + starCount * 15;

    for (let i = 0; i < count; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      piece.style.width = `${6 + Math.random() * 8}px`;
      piece.style.height = `${6 + Math.random() * 8}px`;
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      piece.style.animationDuration = `${2 + Math.random() * 3}s`;
      piece.style.animationDelay = `${Math.random() * 2}s`;
      container.appendChild(piece);
    }
  }

  /**
   * Animated particles on menu screen
   */
  _spawnMenuParticles() {
    const container = document.getElementById('menu-particles');
    if (!container) return;

    const emojis = ['🍎', '🍌', '🍇', '🤖', '🚂', '🚓', '⭐', '🐛', '🍊', '🍉'];
    
    setInterval(() => {
      if (!this.screens.menu.classList.contains('active')) return;

      const emoji = document.createElement('span');
      emoji.className = 'float-emoji';
      emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      emoji.style.setProperty('--x', `${Math.random() * 100}%`);
      emoji.style.setProperty('--delay', '0s');
      emoji.style.fontSize = `${2 + Math.random() * 2}rem`;
      container.appendChild(emoji);

      // Remove after animation
      setTimeout(() => emoji.remove(), 6000);
    }, 800);
  }
}

// ── BOOT ──
const app = new App();
app.boot().catch(console.error);
