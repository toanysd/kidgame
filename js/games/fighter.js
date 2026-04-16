/**
 * Fighter Motion — 2 Player Fighting Game
 * 
 * Tracks fast wrist movements to detect punches.
 * Punches that intersect the opponent's body hitbox reduce their HP.
 */

const GAME_DURATION = 300; // 5 minutes max
const COUNTDOWN_SECONDS = 3;
const HIT_COOLDOWN = 800; // ms between taking damage (800ms)
const DAMAGE_PER_HIT = 2; // Giảm damage cực thấp để hiệp đấu kéo dài 1-2 phút

export class FighterGame {
  constructor(canvas, soundManager, mode, analyzer, toCanvasCoords) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sound = soundManager;
    this.mode = mode; // 'fighter-ai' or 'fighter-p2p'
    this.analyzer = analyzer;
    this.toCanvasCoords = toCanvasCoords;

    this.state = 'idle';
    this.hp = [100, 100]; // P1, P2
    this.maxHp = 100;
    this.lastHitTime = [0, 0]; // Last time P1/P2 took damage
    
    this.timeRemaining = GAME_DURATION;
    this.gameStartTime = 0;
    this.countdownValue = COUNTDOWN_SECONDS;

    this.onGameEnd = null;
    
    // AI State
    this.ai = {
      x: canvas.clientWidth * 0.75, // Default right side
      y: canvas.clientHeight * 0.5,
      width: 150,
      height: 250,
      vx: 3,
      vy: 2,
      lastAttack: 0,
      isAttacking: false,
      gloveX: 0,
      gloveY: 0
    };

    this.particles = [];
    this.hitTexts = [];
    this.explosions = [];
    
    // UI elements to show/hide
    this.hudP1 = null;
    this.hudP2 = null;

    this.processedRobotImg = null;
    if (this.mode === 'fighter-ai') {
      this._initRobotImage();
    }
  }

  _initRobotImage() {
    this.robotImg = new Image();
    this.robotImg.src = 'img/robot.png';
    this.robotImg.onload = () => {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = this.robotImg.width;
      offCanvas.height = this.robotImg.height;
      const offCtx = offCanvas.getContext('2d');
      offCtx.drawImage(this.robotImg, 0, 0);
      
      const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        // Lọc màu đen (xóa nền black do DALL-E tạo ra)
        if (data[i] < 30 && data[i+1] < 30 && data[i+2] < 30) {
          data[i+3] = 0; 
        }
      }
      offCtx.putImageData(imgData, 0, 0);
      this.processedRobotImg = offCanvas;
    };
  }

  start() {
    this._setupHUD();
    this.state = 'countdown';
    this.countdownValue = COUNTDOWN_SECONDS;
    this._doCountdown();
  }

  _setupHUD() {
    // Inject HP Bars if they don't exist
    let hud = document.getElementById('fighter-hud');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'fighter-hud';
      hud.innerHTML = `
        <div class="hp-container p1-hp">
          <div class="hp-label">PLAYER 1 🔵</div>
          <div class="hp-bar"><div class="hp-fill" id="hp-fill-0"></div></div>
        </div>
        <div class="vs-badge">VS</div>
        <div class="hp-container p2-hp">
          <div class="hp-label" id="p2-label">PLAYER 2 🔴</div>
          <div class="hp-bar right"><div class="hp-fill" id="hp-fill-1"></div></div>
        </div>
      `;
      document.getElementById('screen-game').appendChild(hud);
    }
    hud.style.display = 'flex';
    if (this.mode === 'fighter-ai') {
      document.getElementById('p2-label').textContent = 'ROBOT AI 🤖';
    } else {
      document.getElementById('p2-label').textContent = 'PLAYER 2 🔴';
    }
    
    // Hide Fruit Ninja specific HUDs just in case
    const scores = document.getElementById('hud-score');
    if(scores) scores.parentElement.style.display = 'none';
    
    this.hudP1 = document.getElementById('hp-fill-0');
    this.hudP2 = document.getElementById('hp-fill-1');
    this._updateHUD();
  }

  hideHUD() {
    const hud = document.getElementById('fighter-hud');
    if (hud) hud.style.display = 'none';
    const scores = document.getElementById('hud-score');
    if(scores) scores.parentElement.style.display = 'flex';
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
        countdownEl.textContent = 'FIGHT!';
        countdownEl.style.animation = 'none';
        countdownEl.offsetHeight;
        countdownEl.style.animation = 'countdown-pop 0.8s';
        setTimeout(() => { countdownEl.textContent = ''; }, 800);
      }
      this.state = 'playing';
      this.gameStartTime = performance.now();
      
      // Chế độ Fighter sử dụng âm thanh đánh đấm riêng, không xài nhạc nền êm ái
      this.sound.startBGM();
    }
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
    } else if (this.state === 'paused') {
      this.state = 'playing';
    }
  }

  update(slashes, trails, positions, landmarksArray) {
    if (this.state === 'countdown' || this.state !== 'playing') {
      this._render(trails, positions);
      return;
    }

    const now = performance.now();
    const elapsed = (now - this.gameStartTime) / 1000;
    this.timeRemaining = Math.max(0, GAME_DURATION - elapsed);

    if (this.timeRemaining <= 0 || this.hp[0] <= 0 || this.hp[1] <= 0) {
      this._endGame();
      return;
    }

    // Prepare Hitboxes
    const bodies = [];
    if (landmarksArray) {
      const poses = Array.isArray(landmarksArray[0]) ? landmarksArray : [landmarksArray];
      for (let i = 0; i < Math.min(poses.length, 2); i++) {
        const center = this.analyzer.getBodyCenter(poses[i], this.canvas.clientWidth, this.canvas.clientHeight, this.toCanvasCoords);
        if (center) {
          // Khắc phục vị trí nếu 2 người đứng sát: Tự động dồn P0 sang trái, P1 sang phải cho chuẩn
          bodies[i] = center;
        }
      }
      
      this.bodies = bodies;
      
      this.p1Index = 0;
      this.p2Index = 1;

      // Auto assign P1 to left, P2 to right based on X coordinate
      if (bodies[0] && bodies[1] && bodies[0].x > bodies[1].x) {
        this.p1Index = 1;
        this.p2Index = 0;
      }
    }

    // Update AI if vs Computer
    if (this.mode === 'fighter-ai') {
      this._updateAI(now);
      // AI Hitbox
      this.bodies[1] = { x: this.ai.x, y: this.ai.y, width: this.ai.width, height: this.ai.height };
    }

    // Tele-punch (Bluetooth collision)
    // Cú đấm từ xa: Chỉ cần đấm mạnh thẳng xải tay về phía trước, nếu đúng tầm độ cao thân tự động trúng đối thủ!
    for (const slash of slashes) {
      if (this.mode === 'fighter-p2p') {
        const isP1 = slash.personIndex === this.p1Index;
        const myBody = isP1 ? this.bodies[this.p1Index] : this.bodies[this.p2Index];
        const enemyBody = isP1 ? this.bodies[this.p2Index] : this.bodies[this.p1Index];
        const targetPlayerHpIndex = isP1 ? 1 : 0;
        
        if (this._checkBluetoothCollision(slash, myBody, enemyBody, isP1)) {
          this._applyDamage(targetPlayerHpIndex, now, this.lastImpactX, this.lastImpactY);
        }
      } else {
        // VS AI
        if (slash.personIndex === 0 && this.bodies[1] && this._checkBluetoothCollision(slash, this.bodies[0], this.bodies[1], true)) {
          this._applyDamage(1, now, this.lastImpactX, this.lastImpactY);
        }
      }
    }
    
    // Check AI Attack vs P1
    if (this.mode === 'fighter-ai' && this.ai.isAttacking && this.bodies[0]) {
      // Nếu AI đang ra đòn hù doạ, và găng tay AI trúng ngực bé
      const dist = Math.hypot(this.ai.gloveX - this.bodies[0].x, this.ai.gloveY - this.bodies[0].y);
      if (dist < this.bodies[0].width) {
        this._applyDamage(0, now, this.bodies[0].x, this.bodies[0].y);
        this.ai.isAttacking = false; // Một đòn chỉ trúng 1 lần
      }
    }

    // Update Particles
    for (const p of this.particles) p.update();
    for (const t of this.hitTexts) t.update();
    for (const e of this.explosions) e.update();
    
    this.particles = this.particles.filter(p => !p.isDead());
    this.hitTexts = this.hitTexts.filter(t => !t.isDead());
    this.explosions = this.explosions.filter(e => !e.isDead());

    this._updateHUD();
    this._updateTimerHUD();
    this._render(trails, positions);
  }

  _updateAI(now) {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    
    // Di chuyển lượn lờ
    this.ai.x += this.ai.vx;
    this.ai.y += Math.sin(now / 500) * 3; // Lên xuống lơ lửng

    if (this.ai.x > w - this.ai.width) this.ai.vx *= -1;
    if (this.ai.x < w / 2) this.ai.vx *= -1; // Không cho qua nửa sân bên trái

    // Tấn công ngẫu nhiên
    if (now - this.ai.lastAttack > 2500 && Math.random() < 0.02 && !this.ai.isAttacking) {
      this.ai.isAttacking = true;
      this.ai.lastAttack = now;
      this.ai.gloveX = this.ai.x - 50; // Vung găng về phía người chơi (trái)
      this.ai.gloveY = this.ai.y;
      
      // Play woosh sound
      this.sound.playSlash?.();
    }
    
    if (this.ai.isAttacking) {
      // Đấm lao tới bên trái
      this.ai.gloveX -= 25;
      if (this.ai.gloveX < 0 || now - this.ai.lastAttack > 500) {
        this.ai.isAttacking = false;
      }
    } else {
      this.ai.gloveX = this.ai.x - 60;
      this.ai.gloveY = this.ai.y + 20;
    }
  }

  _checkCollision(slash, body) {
    const dx = Math.abs(slash.x - body.x);
    const dy = Math.abs(slash.y - body.y);
    return dx < (body.width * 0.5) && dy < (body.height * 0.5);
  }

  _checkBluetoothCollision(slash, myBody, enemyBody, isP1) {
    if (!myBody || !enemyBody) return false;
    
    // Đang đấm về phía trước so với thân mình
    const reachingForward = isP1 
         ? (slash.x > myBody.x + myBody.width * 0.3) 
         : (slash.x < myBody.x - myBody.width * 0.3);
         
    if (reachingForward) {
      // Y bù trừ: Giữ đúng độ cao tương đối của cú đấm rùi map lên người địch
      const offsetY = slash.y - myBody.y;
      const targetY = enemyBody.y + offsetY;
      
      this.lastImpactX = enemyBody.x;
      this.lastImpactY = targetY;

      // Trúng nếu địch không né (ngụp quá thấp / nhảy quá cao)
      return Math.abs(targetY - enemyBody.y) < (enemyBody.height * 0.6);
    }
    return false;
  }

  _applyDamage(playerIndex, now, x, y) {
    if (now - this.lastHitTime[playerIndex] < HIT_COOLDOWN) return;
    
    this.hp[playerIndex] -= DAMAGE_PER_HIT;
    this.lastHitTime[playerIndex] = now;
    
    this.sound.playExplosion();
    
    // Spawn Điện, Lửa và Vụ Nổ siêu nhân!
    this.explosions.push(new HeroExplosion(x, y));
    
    // Tung toé tia lửa (Sparks) thay vì giọt máu
    for (let i = 0; i < 20; i++) {
        const colors = ['#ffe135', '#ff6b35', '#ffffff', '#00d4ff'];
        const sparkColor = colors[Math.floor(Math.random() * colors.length)];
        this.particles.push(new FighterParticle(x, y, sparkColor));
    }
    
    // Text dame nhấp nháy mạnh
    this.hitTexts.push(new HitText(x, y - 50, "-" + DAMAGE_PER_HIT + " HP!"));
    
    // Rung màn hình
    const hudBar = playerIndex === 0 ? this.hudP1 : this.hudP2;
    if(hudBar && hudBar.parentElement) {
      hudBar.parentElement.style.animation = 'none';
      hudBar.parentElement.offsetHeight;
      hudBar.parentElement.style.animation = 'shake 0.3s';
    }
  }

  _endGame() {
    this.state = 'ended';
    this.sound.stopBGM();
    this.hideHUD();
    
    let winner = 0;
    let title = "";
    if (this.hp[0] > this.hp[1]) {
      winner = 1; // P1 wins
      title = "PLAYER 1 WINS! 🎉";
      this.sound.speak("Player one wins!", "en-US");
    } else if (this.hp[1] > this.hp[0]) {
      winner = 2; // P2 wins
      title = this.mode === 'fighter-ai' ? "ROBOT WINS! 🤖" : "PLAYER 2 WINS! 🎉";
      this.sound.speak(this.mode === 'fighter-ai' ? "Robot wins!" : "Player two wins!", "en-US");
    } else {
      title = "DRAW! 🤝";
      this.sound.speak("It's a draw!", "en-US");
    }
    
    // Tận dụng lại Results screen
    if (this.onGameEnd) {
      this.onGameEnd({
        score: this.hp[0], // Pass HP instead of score
        totalHits: 100 - this.hp[1], // Tổng dame đã gây
        maxCombo: winner === 1 ? 99 : 0, // Fake stats cho vui
        stars: winner === 1 ? 5 : (winner === 2 ? 1 : 3),
      });
      
      // Override title manually
      setTimeout(() => {
        const tEl = document.getElementById('results-title');
        const sEl = document.getElementById('results-subtitle');
        if(tEl) tEl.textContent = title;
        if(sEl) sEl.textContent = "Tuyệt vời cục cưng!";
        
        // Hide fruit ninja stats, show custom text
        const statEls = document.querySelectorAll('.stat-card');
        if(statEls.length > 0) {
            statEls[0].querySelector('.stat-label').textContent = 'P1 HP Left';
            statEls[0].querySelector('.stat-value').textContent = Math.max(0, this.hp[0]);
            statEls[2].querySelector('.stat-label').textContent = 'P2 HP Left';
            statEls[2].querySelector('.stat-value').textContent = Math.max(0, this.hp[1]);
        }
      }, 50);
    }
  }

  _updateHUD() {
    if (this.hudP1) this.hudP1.style.width = `${Math.max(0, this.hp[0])}%`;
    if (this.hudP2) this.hudP2.style.width = `${Math.max(0, this.hp[1])}%`;
    
    // Low HP Warning
    if(this.hp[0] <= 30 && this.hudP1) this.hudP1.style.backgroundColor = '#ff0000';
    if(this.hp[1] <= 30 && this.hudP2) this.hudP2.style.backgroundColor = '#ff0000';
  }

  _updateTimerHUD() {
      const timerEl = document.getElementById('hud-timer');
      if (timerEl) {
        const m = Math.floor(this.timeRemaining / 60);
        const s = Math.floor(this.timeRemaining % 60);
        timerEl.textContent = `${m}:${s.toString().padStart(2, '0')}`;
      }
  }

  _render(trails, positions) {
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    // Vẽ lớp phủ màn hình mờ tối để làm nổi bật Hitbox
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, w, h);

    // Vẽ Vùng ngực (Shield) của người chơi
    if (this.bodies && this.mode === 'fighter-p2p') {
      const p1Body = this.bodies[this.p1Index];
      const p2Body = this.bodies[this.p2Index];
      
      if (p1Body) this._drawShield(ctx, p1Body, 0);
      if (p2Body) this._drawShield(ctx, p2Body, 1);
    } else if (this.bodies && this.mode === 'fighter-ai') {
      // P1 only
      if (this.bodies[0]) this._drawShield(ctx, this.bodies[0], 0);
    }

    // Vẽ AI Avatar
    if (this.mode === 'fighter-ai') {
        const aiColor = '#ff2eea';
        ctx.save();
        if (this.processedRobotImg) {
          const ratio = this.processedRobotImg.height / this.processedRobotImg.width;
          const drawW = 220; // Kích thước robot bự hơn chút cho oai
          const drawH = 220 * ratio;
          ctx.drawImage(this.processedRobotImg, this.ai.x - drawW/2, this.ai.y - drawH/2, drawW, drawH);
        } else {
          ctx.font = '100px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🤖', this.ai.x, this.ai.y);
        }
        
        // Vẽ găng đấm của AI
        ctx.font = '80px serif';
        ctx.save();
        // Xoay găng nếu đang tấn công
        if (this.ai.isAttacking) {
          ctx.translate(this.ai.gloveX, this.ai.gloveY);
          ctx.rotate(-Math.PI / 4);
          ctx.fillText('🥊', 0, 0);
        } else {
          ctx.translate(this.ai.gloveX, this.ai.gloveY);
          ctx.fillText('🥊', 0, 0);
        }
        ctx.restore();
        ctx.restore();
    }

    // Vẽ Găng Boxing lên khớp cổ tay thực của người chơi
    if (positions) {
      for (const pos of positions) {
        // Chỉ vẽ lên tay hoặc chân
        if (pos.label.includes('Hand') || pos.label.includes('Foot')) {
           ctx.save();
           ctx.translate(pos.x, pos.y);
           ctx.font = '60px serif';
           ctx.textAlign = 'center';
           ctx.textBaseline = 'middle';
           // Vẽ găng boxing (tay) hoặc giày (chân)
           const icon = pos.label.includes('Hand') ? '🥊' : '👟';
           ctx.fillText(icon, 0, 0);
           
           // Aura
           ctx.beginPath();
           ctx.arc(0, 0, 45, 0, Math.PI * 2);
           ctx.strokeStyle = pos.personIndex === 0 ? 'rgba(0, 212, 255, 0.8)' : 'rgba(255, 46, 234, 0.8)';
           ctx.lineWidth = 5;
           ctx.stroke();
           ctx.restore();
        }
      }
    }
    
    // Draw Particles & Texts
    for (const e of this.explosions) e.draw(ctx);
    for (const p of this.particles) p.draw(ctx);
    for (const t of this.hitTexts) t.draw(ctx);
    
    // Draw Slash trails on top (Optional for punch trails)
    if(trails) {
      for(const trail of trails) {
        if(trail.points.length < 2) continue;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.beginPath();
        for(let i=1; i<trail.points.length; i++) {
          const progress = i / trail.points.length;
          ctx.moveTo(trail.points[i-1].x, trail.points[i-1].y);
          ctx.lineTo(trail.points[i].x, trail.points[i].y);
          ctx.strokeStyle = trail.color;
          ctx.lineWidth = progress * 15;
          ctx.globalAlpha = progress * 0.8;
          ctx.stroke();
        }
        ctx.restore();
      }
    }
    
    if (this.state === 'paused') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = 'bold 5rem Fredoka, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('⏸️ PAUSED', w / 2, h / 2);
    }
  }

  _drawShield(ctx, body, playerIndex) {
    if (!body) return;
    const color = playerIndex === 0 ? 'rgba(0, 212, 255, 0.25)' : 'rgba(255, 46, 234, 0.25)';
    const borderColor = playerIndex === 0 ? '#00d4ff' : '#ff2eea';
    
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(body.x, body.y, body.width/2, body.height/2, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = borderColor;
    ctx.stroke();
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Fredoka';
    ctx.textAlign = 'center';
    ctx.fillText(playerIndex === 0 ? "P1" : "P2", body.x, body.y - body.height/2 - 10);
    ctx.restore();
  }
}

// ── Helpers
class FighterParticle {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = 10 + Math.random() * 15;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1;
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        this.vx *= 0.9; this.vy *= 0.9;
        this.life -= 0.05;
    }
    isDead() { return this.life <= 0; }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class HitText {
    constructor(x, y, text) {
        this.x = x; this.y = y; this.text = text;
        this.life = 1;
    }
    update() {
        this.y -= 4; this.life -= 0.03;
    }
    isDead() { return this.life <= 0; }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.font = 'bold 50px Fredoka';
        ctx.fillStyle = '#ff1744';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.strokeText(this.text, this.x, this.y);
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

class HeroExplosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.life = 1;
        this.scale = 0.2;
        this.ringRadius = 10;
        this.rotation = (Math.random() - 0.5) * 0.5;
        this.emoji = Math.random() > 0.5 ? '💥' : '🔥';
    }
    update() {
        // Boom phóng to rất nhanh
        this.scale += (3.5 - this.scale) * 0.3; 
        this.ringRadius += 40; // Vòng chấn động loang nhanh ra
        this.life -= 0.04;
    }
    isDead() { return this.life <= 0; }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Vẽ vòng chấn động sóng âm (Shockwave)
        ctx.beginPath();
        ctx.arc(0, 0, this.ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 230, 0, ${this.life * 0.6})`;
        ctx.lineWidth = 20 * this.life;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, this.ringRadius * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 46, 234, ${this.life * 0.4})`;
        ctx.lineWidth = 30 * this.life;
        ctx.stroke();

        // Vẽ Emoji vụ nổ
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);
        ctx.font = '100px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = this.life;
        ctx.fillText(this.emoji, 0, 0);

        // Chữ "BAM!" truyện tranh
        if (this.life > 0.4) {
            ctx.font = 'bold 45px Fredoka';
            ctx.fillStyle = '#ffe600';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 8;
            ctx.strokeText("BÙM!", 0, -40);
            ctx.fillText("BÙM!", 0, -40);
        }

        ctx.restore();
    }
}

