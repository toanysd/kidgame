import { SCENE_WIDTH } from '../constants/stage.js';
import { LOGO_FLASH_DELAY } from '../constants/battle.js';
import { BattleScene } from './BattleScene.js';

export class StartScene {
	image = document.getElementById('Controls');
	logoImg = document.getElementById('Logo');

	text = 'CLICK ANYWHERE TO START';
	repeatTime = 3;
	position = 10;
	logoFlash = false;
	flashTimer = 0;
	brightness = 0;
	contrast = 3;
	sceneEnded = false;

	endStartScene = (mode) => {
		window.GAME_MODE = mode;
        const modeSelection = document.getElementById('modeSelection');
        if (modeSelection) modeSelection.style.display = 'none';

		this.changeScene(BattleScene);
	};

	constructor(changeScene) {
		this.changeScene = changeScene;
		window.GAME_MODE = '1P'; // Default
        
        const modeSelection = document.getElementById('modeSelection');
        if (modeSelection) modeSelection.style.display = 'flex';

        const btn1P = document.getElementById('btn1P');
        const btn2P = document.getElementById('btn2P');
        
        if (btn1P) {
            btn1P.onclick = () => this.endStartScene('1P');
        }
        if (btn2P) {
            btn2P.onclick = () => this.endStartScene('2P');
        }
	}

	updateLogo = (time) => {
		if (this.flashTimer > time.previous) return;
		this.flashTimer = time.previous + LOGO_FLASH_DELAY[Number(!this.logoFlash)];
		this.logoFlash = !this.logoFlash;
	};

	updateTextPosition = (time) => {
		this.position -= time.secondsPassed * 100;
	};

	update = (time) => {
		this.updateLogo(time);
		this.updateTextPosition(time);
	};

	drawText = (context) => {
		context.fillStyle = 'white';
		context.font = '12px Arial';
		context.textAlign = 'center';
		context.fillText("CHOOSE GAME MODE BELOW", SCENE_WIDTH / 2, 180);
		context.textAlign = 'left';
	};

	drawLogo = (context) => {
		if (this.logoFlash) {
			context.fillStyle = 'black';
			context.fillRect(112, 22, 170, 80);
			return;
		}
		context.drawImage(
			this.logoImg,
			0,
			0,
			this.logoImg.width,
			this.logoImg.height,
			112,
			22,
			170,
			80
		);
	};

	draw = (context) => {
		context.drawImage(this.image, 0, 0);
		this.drawLogo(context);
		this.drawText(context);
	};
}
