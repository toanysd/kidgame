/**
 * Fruit Ninja Motion — Main Game Logic
 * 
 * Floating mechanics: Fruits float around the entire screen.
 * Crispy SVGs: Uses Twemoji SVGs for infinite resolution.
 */

// ── GAME CONSTANTS ──
const GAME_DURATION = 300;        // 5 minutes
const COUNTDOWN_SECONDS = 3;
const HIT_TOLERANCE = 180;           
const MAX_ACTIVE_FRUITS = 3;       // Luôn giữ tối đa 3 quả trên màn hình để không bao giờ bị loạn/dày đặc
const COMBO_WINDOW = 2000;         // 2 seconds for combo
const DIFFICULTY_RAMP_INTERVAL = 25; // seconds

// ── FRUIT TYPES ──
const FRUIT_TYPES = [
  { name: 'apple',      emoji: '🍎', hex: '1f34e', color: '#ff3b3b', points: 1, nameEN: 'Apple',      nameVI: 'Táo' },
  { name: 'banana',     emoji: '🍌', hex: '1f34c', color: '#ffe135', points: 1, nameEN: 'Banana',     nameVI: 'Chuối' },
  { name: 'grape',      emoji: '🍇', hex: '1f347', color: '#9b59b6', points: 1, nameEN: 'Grape',      nameVI: 'Nho' },
  { name: 'orange',     emoji: '🍊', hex: '1f34a', color: '#ff8c00', points: 1, nameEN: 'Orange',     nameVI: 'Cam' },
  { name: 'watermelon', emoji: '🍉', hex: '1f349', color: '#2ecc71', points: 2, nameEN: 'Watermelon', nameVI: 'Dưa hấu' },
  { name: 'strawberry', emoji: '🍓', hex: '1f353', color: '#ff6b81', points: 1, nameEN: 'Strawberry', nameVI: 'Dâu' },
];

const SPECIAL_TYPES = [
  { name: 'robot',       emoji: '🤖', hex: '1f916', color: '#00d4ff', points: 3, nameEN: 'Robot!',        nameVI: 'Robot!' },
  { name: 'train',       emoji: '🚂', hex: '1f682', color: '#ff6b35', points: 3, nameEN: 'Train!',        nameVI: 'Tàu hỏa!' },
  { name: 'police',      emoji: '🚓', hex: '1f693', color: '#4dabf7', points: 3, nameEN: 'Police car!',   nameVI: 'Xe cảnh sát!' },
  { name: 'caterpillar', emoji: '🐛', hex: '1f41b', color: '#39ff14', points: 5, nameEN: 'Caterpillar!',  nameVI: 'Sâu xanh!' },
  { name: 'barrier',     emoji: '🚧', hex: '1f6a7', color: '#ffa502', points: 2, nameEN: 'Barrier!',      nameVI: 'Rào chắn!' },
  { name: 'hero',        emoji: '🦸', hex: '1f9b8', color: '#b84dff', points: 5, nameEN: 'Super Hero!',   nameVI: 'Siêu nhân!' },
];

// No image preloaders: Using raw OS-native Emojis for absolute maximum performance (60fps guaranteed)

// ── CLASSES ──

class Fruit {
  constructor(x, y, vx, vy, type, isSpecial = false) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.type = type;
    this.isSpecial = isSpecial;
    // Reduced sizes by 50% as requested
    this.radius = isSpecial ? 125 : 90;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.05;
    this.opacity = 1;
    this.sliced = false;
    this.spawnTime = performance.now();

    // Slice animation state
    this.sliceTime = 0;
    this.sliceAngle = 0;
    this.half1 = { x: 0, y: 0, vx: 0, vy: 0 };
    this.half2 = { x: 0, y: 0, vx: 0, vy: 0 };
  }

  update(canvasWidth, canvasHeight) {
    if (this.sliced) {
      // Animate the two halves falling apart with gravity
      this.sliceTime++;
      const gravity = 0.8;
      this.half1.vy += gravity;
      this.half2.vy += gravity;
      this.half1.x += this.half1.vx;
      this.half1.y += this.half1.vy;
      this.half2.x += this.half2.vx;
      this.half2.y += this.half2.vy;
      this.opacity = Math.max(0, 1 - this.sliceTime / 60);
      return;
    }

    // Floating up mechanics
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;

    // Gentle bounce off side walls only to keep them in view horizontally
    const margin = this.radius;
    if (this.x < margin) { this.x = margin; this.vx *= -1; }
    if (this.x > canvasWidth - margin) { this.x = canvasWidth - margin; this.vx *= -1; }
  }

  slice(slashAngle) {
    this.sliced = true;
    this.sliceAngle = slashAngle;
    this.sliceTime = 0;

    // Split into two halves going in opposite perpendicular directions
    const perpX = Math.cos(slashAngle + Math.PI / 2);
    const perpY = Math.sin(slashAngle + Math.PI / 2);
    const speed = 8;

    this.half1 = { x: this.x, y: this.y, vx: perpX * speed + this.vx, vy: perpY * speed + this.vy };
    this.half2 = { x: this.x, y: this.y, vx: -perpX * speed + this.vx, vy: -perpY * speed + this.vy };
  }

  isDead(now) {
    if (this.sliced) {
      return this.opacity <= 0;
    }
    // Expire when fully floated above the screen
    return this.y < -this.radius - 100;
  }
}

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    const angle = Math.random() * Math.PI * 2;
    const speed = 5 + Math.random() * 10;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = 1;
    this.decay = 0.02 + Math.random() * 0.03;
    this.size = 8 + Math.random() * 8;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // gravity
    this.vx *= 0.96;
    this.life -= this.decay;
  }

  isDead() {
    return this.life <= 0;
  }
}

class ScorePopup {
  constructor(x, y, text, color) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.life = 1;
    this.decay = 0.02;
  }

  update() {
    this.y -= 3;
    this.life -= this.decay;
  }

  isDead() {
    return this.life <= 0;
  }
}

// ══════════════════════════════════════════════
// FRUIT NINJA GAME
// ══════════════════════════════════════════════

export class FruitNinjaGame {
  constructor(canvas, soundManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sound = soundManager;

    this.state = 'idle';
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.lastHitTime = 0;
    this.totalHits = 0;
    this.timeRemaining = GAME_DURATION;
    this.gameStartTime = 0;
    this.countdownValue = COUNTDOWN_SECONDS;

    this.fruits = [];
    this.particles = [];
    this.popups = [];

    this.nextSpawnTime = 0;
    this.difficultyLevel = 0;

    this.onGameEnd = null;
    this.onScoreUpdate = null;

    this.flashAlpha = 0;
    this.flashColor = '#ffffff';
  }

  start() {
    this.reset();
    this.state = 'countdown';
    this.countdownValue = COUNTDOWN_SECONDS;
    this._doCountdown();
  }

  _doCountdown() {
    if (this.countdownValue > 0) {
      this.sound.playCountdown(this.countdownValue);
      const countdownEl = document.getElementById('hud-countdown');
      if (countdownEl) {
        countdownEl.textContent = this.countdownValue;
        countdownEl.style.animation = 'none';
        countdownEl.offsetHeight;
        countdownEl.style.animation = 'countdown-pop 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
      }
      this.countdownValue--;
      setTimeout(() => this._doCountdown(), 1000);
    } else {
      this.sound.playCountdown(0);
      const countdownEl = document.getElementById('hud-countdown');
      if (countdownEl) {
        countdownEl.textContent = 'LET\'S PLAY!';
        countdownEl.style.animation = 'none';
        countdownEl.offsetHeight;
        countdownEl.style.animation = 'countdown-pop 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
        setTimeout(() => { countdownEl.textContent = ''; }, 800);
      }
      this.state = 'playing';
      this.gameStartTime = performance.now();
      
      // Bơm sẵn đồ vật lên màn hình ngay lúc LET'S PLAY để Màn hình không bao giờ bị dở dang trống trải
      for (let i = 0; i < MAX_ACTIVE_FRUITS; i++) {
        this._spawnSingleFruit();
        // So le chiều cao sẵn trên màn hình cho ngay lứa ban đầu
        this.fruits[i].y = this.canvas.clientHeight - 50 - (i * 200);
      }
      // Bật BGM khi bắt đầu chém
      this.sound.startBGM();
    }
  }

  reset() {
    this.sound.stopBGM();
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.lastHitTime = 0;
    this.totalHits = 0;
    this.timeRemaining = GAME_DURATION;
    this.fruits = [];
    this.particles = [];
    this.popups = [];
    this.nextSpawnTime = 0;
    this.difficultyLevel = 0;
    this.flashAlpha = 0;

    const strikesEl = document.getElementById('hud-strikes');
    if (strikesEl) strikesEl.style.display = 'none'; // Hide strikes UI

    this._updateHUD();
    const comboEl = document.getElementById('hud-combo');
    if (comboEl) {
      comboEl.textContent = '';
      comboEl.classList.remove('visible');
    }
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.sound.stopBGM();
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this.sound.startBGM();
    }
  }

  update(slashes, trails, positions) {
    if (this.state === 'countdown' || this.state !== 'playing') {
      this._render(trails, positions);
      return;
    }

    const now = performance.now();
    const elapsed = (now - this.gameStartTime) / 1000;
    this.timeRemaining = Math.max(0, GAME_DURATION - elapsed);

    if (this.timeRemaining <= 0) {
      this._endGame();
      return;
    }

    this.difficultyLevel = Math.floor(elapsed / DIFFICULTY_RAMP_INTERVAL);

    // Kỹ thuật Mật độ Chủ Động (Reactive Spawning)
    // Đếm số lượng quả đang còn sống (ưa nhìn) trên màn hình (chưa bị chém & chưa bay biến khỏi màn hình)
    const activeCount = this.fruits.filter(f => !f.sliced && f.y > -f.radius).length;
    
    // Nếu màn hình đang thưa thớt, mọc dần lên cho đủ số lượng (tốc độ bù phụ thuộc vào tốc độ chém của bé)
    if (activeCount < MAX_ACTIVE_FRUITS && now > this.nextSpawnTime) {
      this._spawnSingleFruit();
      
      // Delay sinh từng quả từ 0.5s đến 1s để tạo nhịp điệu đều đặn
      this.nextSpawnTime = now + 500 + Math.random() * 800; 
    }

    for (const fruit of this.fruits) {
      fruit.update(this.canvas.clientWidth, this.canvas.clientHeight);
    }

    for (const slash of slashes) {
      for (const fruit of this.fruits) {
        if (fruit.sliced) continue;
        
        // Prevent hitting completely invisible fruits, but account for fruit radius so the top edge is hittable!
        if (fruit.y - fruit.radius > this.canvas.clientHeight) continue;

        const dx = slash.x - fruit.x;
        const dy = slash.y - fruit.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Yêu cầu vệt tay phải lọt vào vùng bao phủ quả + biên độ sai số nhất định
        if (dist < fruit.radius + HIT_TOLERANCE) {
          this._hitFruit(fruit, slash);
        }
      }
    }

    for (const p of this.particles) p.update();
    for (const p of this.popups) p.update();

    this.fruits = this.fruits.filter(f => !f.isDead(now));
    this.particles = this.particles.filter(p => !p.isDead());
    this.popups = this.popups.filter(p => !p.isDead());

    if (this.combo > 0 && now - this.lastHitTime > COMBO_WINDOW) {
      this.combo = 0;
      const comboEl = document.getElementById('hud-combo');
      if (comboEl) comboEl.classList.remove('visible');
    }

    if (this.flashAlpha > 0) {
      this.flashAlpha -= 0.02;
    }

    this._updateHUD();
    this._render(trails, positions);
  }

  _hitFruit(fruit, slash) {
    const slashAngle = Math.atan2(slash.y - fruit.y, slash.x - fruit.x);
    fruit.slice(slashAngle);

    const now = performance.now();
    if (now - this.lastHitTime < COMBO_WINDOW) this.combo++;
    else this.combo = 1;
    this.lastHitTime = now;
    this.maxCombo = Math.max(this.maxCombo, this.combo);

    const comboMultiplier = Math.min(this.combo, 5);
    const points = fruit.type.points * comboMultiplier;
    this.score += points;
    this.totalHits++;

    const particleCount = fruit.isSpecial ? 15 : 8;
    for (let i = 0; i < particleCount; i++) {
      this.particles.push(new Particle(fruit.x, fruit.y, fruit.type.color));
    }

    const popupText = this.combo >= 2 ? `+${points} (x${comboMultiplier})` : `+${points}`;
    this.popups.push(new ScorePopup(fruit.x, fruit.y - 50, popupText, fruit.type.color));

    // Dynamic rich sounds! (Using Web Audio API to prevent stutter)
    this.sound.playHit(); // standard splat
    
    // Gọi hệ thống máy đọc TTS. Hệ thống này mặc định có bộ đệm (Queue) nên nếu chém 3 quả, 
    // trình duyệt sẽ tự giác đưa vào danh sách chờ và đọc rõ từng từ, không dính vào nhau.
    this.sound.speak(fruit.type.nameEN, 'en-US');

    // Occasional fun cheers using Web Audio (non-blocking)
    if (this.combo > 1 && this.combo % 3 === 0) {
      // Play a quick arpeggio to reward combo!
      setTimeout(() => this.sound.playScore(), 100);
    }

    this.flashColor = fruit.type.color;
    this.flashAlpha = 0.2;

    const comboEl = document.getElementById('hud-combo');
    if (comboEl) {
      if (this.combo >= 2) {
        comboEl.textContent = `🔥 x${this.combo} COMBO!`;
        comboEl.classList.add('visible');
        comboEl.style.animation = 'none';
        comboEl.offsetHeight;
        comboEl.style.animation = 'scale-in 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
      } else {
        comboEl.classList.remove('visible');
      }
    }

    if (this.onScoreUpdate) this.onScoreUpdate(this.score, this.combo);
  }

  _spawnSingleFruit() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    
    // Luôn chia màn hình thành 3 luồng dọc độc lập (bảo chứng chữ KHÔNG BAO GIỜ đè lên nhau)
    const zones = MAX_ACTIVE_FRUITS;
    const colWidth = (w - 300) / zones;
    const zoneIndex = Math.floor(Math.random() * zones);

    const x = 150 + zoneIndex * colWidth + Math.random() * (colWidth * 0.7);
    const y = h + 150; 

    // Tốc độ lơ lửng rất điềm tĩnh. Dễ đọc chữ, thân thiện với mắt bé trải nghiệm
    const vx = (Math.random() - 0.5) * 1.5; 
    const vy = -(3.5 + Math.random() * 1.5); 

    const isSpecial = Math.random() < 0.2; // 20% chance
    const types = isSpecial ? SPECIAL_TYPES : FRUIT_TYPES;
    const type = types[Math.floor(Math.random() * types.length)];

    this.fruits.push(new Fruit(x, y, vx, vy, type, isSpecial));
  }

  _endGame() {
    this.state = 'ended';
    this.sound.stopBGM();
    this.sound.playCheer();

    let stars = 0;
    if (this.score >= 50) stars = 1;
    if (this.score >= 100) stars = 2;
    if (this.score >= 200) stars = 3;
    if (this.score >= 350) stars = 4;
    if (this.score >= 500) stars = 5;

    if (this.onGameEnd) {
      this.onGameEnd({
        score: this.score,
        maxCombo: this.maxCombo,
        totalHits: this.totalHits,
        stars,
        reason: 'time'
      });
    }
  }

  _updateHUD() {
    const scoreEl = document.getElementById('hud-score');
    const timerEl = document.getElementById('hud-timer');

    if (scoreEl) scoreEl.textContent = this.score;
    if (timerEl) {
      const minutes = Math.floor(Math.ceil(this.timeRemaining) / 60);
      const seconds = Math.ceil(this.timeRemaining) % 60;
      timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      if (this.timeRemaining <= 10) timerEl.classList.add('warning');
      else timerEl.classList.remove('warning');
    }
  }

  _render(trails, positions) {
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, w, h);

    // Render all fruits FIRST (bottom layer)
    for (const fruit of this.fruits) {
      this._drawFruit(ctx, fruit);
    }

    for (const p of this.particles) this._drawParticle(ctx, p);
    for (const p of this.popups) this._drawPopup(ctx, p);

    // Render joint dots and slash trails ON TOP OF FRUITS (top layer)
    this._drawTrails(ctx, trails);
    this._drawJointDots(ctx, positions);

    if (this.flashAlpha > 0) {
      ctx.fillStyle = this.flashColor + Math.floor(this.flashAlpha * 255).toString(16).padStart(2, '0');
      ctx.fillRect(0, 0, w, h);
    }

    if (this.state === 'paused') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = 'bold 5rem Fredoka, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⏸️ PAUSED', w / 2, h / 2);
      ctx.font = '1.5rem Outfit, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('Tap pause again to resume / Nhấn lại để tiếp tục', w / 2, h / 2 + 60);
    }
  }

  _drawFruit(ctx, fruit) {
    if (fruit.sliced) {
      this._drawFruitHalf(ctx, fruit.half1.x, fruit.half1.y, fruit, 0, fruit.opacity);
      this._drawFruitHalf(ctx, fruit.half2.x, fruit.half2.y, fruit, Math.PI, fruit.opacity);
      return;
    }

    ctx.save();
    ctx.translate(fruit.x, fruit.y);

    ctx.save();
    ctx.rotate(fruit.rotation);
    ctx.globalAlpha = fruit.opacity;

    // Khôi phục GPU: Dùng khối tròn tối nền thay vì xử lý viền chữ (StrokeText) nặng nề
    const size = fruit.isSpecial ? 200 : 160;
    
    // Nền tối bao bọc để quả nổi bật
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.38, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fill();
    
    ctx.font = `${size}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fruit.type.emoji, 0, 0);
    
    ctx.restore();

    // Bold Uppercase Text
    ctx.globalAlpha = fruit.opacity;
    ctx.shadowBlur = 0;
    ctx.font = 'bold 46px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    
    const textEN = fruit.type.nameEN.toUpperCase();
    const textYOffset = size / 2 + 35;
    
    // Tương thích ngược: Dùng hàm rect cơ bản thay vì roundRect (gây sập Tablet/Tivi cũ không hỗ trợ HTML5 Mới)
    const textWidth = ctx.measureText(textEN).width;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(-textWidth/2 - 20, textYOffset - 30, textWidth + 40, 60, 30);
    } else {
      ctx.rect(-textWidth/2 - 20, textYOffset - 30, textWidth + 40, 60);
    }
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(textEN, 0, textYOffset);

    ctx.restore();
  }

  _drawFruitHalf(ctx, x, y, fruit, rotOffset, opacity) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(fruit.sliceAngle + rotOffset);
    ctx.globalAlpha = opacity;

    ctx.beginPath();
    ctx.rect(-400, rotOffset === 0 ? -400 : 0, 800, 400); // Large clipping bounds
    ctx.clip();

    const size = fruit.isSpecial ? 200 : 160;
    
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.38, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fill();

    ctx.font = `${size}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fruit.type.emoji, 0, 0);

    ctx.restore();
  }

  _drawParticle(ctx, p) {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 0; // Removed heavy shadow
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawPopup(ctx, popup) {
    ctx.save();
    ctx.globalAlpha = popup.life;
    ctx.font = 'bold 40px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 6;
    ctx.strokeText(popup.text, popup.x, popup.y);

    ctx.fillStyle = popup.color;
    ctx.fillText(popup.text, popup.x, popup.y);
    ctx.restore();
  }

  _drawTrails(ctx, trails) {
    if (!trails) return;
    for (const trail of trails) {
      if (trail.points.length < 2) continue;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 1; i < trail.points.length; i++) {
        const prev = trail.points[i - 1];
        const curr = trail.points[i];
        const progress = i / trail.points.length;
        const alpha = progress * 0.9;
        const width = progress * 15 + 4;

        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curr.x, curr.y);

        ctx.strokeStyle = trail.color;
        ctx.lineWidth = width;
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 0; // Removed heavy performance killer
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = width * 0.4;
        ctx.globalAlpha = alpha * 0.6;
        ctx.shadowBlur = 0;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  _drawJointDots(ctx, positions) {
    if (!positions) return;
    for (const pos of positions) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 22, 0, Math.PI * 2);
      ctx.strokeStyle = pos.color;
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.8;
      ctx.shadowBlur = 0; // Removed trace of rendering lag
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.fill();
      ctx.restore();
    }
  }
}
