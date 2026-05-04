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

	endStartScene = (event) => {
		// Determine game mode based on click position
		if (event.clientX < window.innerWidth / 2) {
			window.GAME_MODE = '1P';
		} else {
			window.GAME_MODE = '2P';
		}
		this.changeScene(BattleScene);
		window.removeEventListener('click', this.endStartScene);
	};

	constructor(changeScene) {
		this.changeScene = changeScene;
		window.GAME_MODE = '1P'; // Default
		window.removeEventListener('click', this.endStartScene);
		window.addEventListener('click', this.endStartScene);
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
		context.font = '10px Arial';
		context.textAlign = 'center';
		
		// 1 Player
		context.fillStyle = 'cyan';
		context.fillText("<- 1 PLAYER (vs CPU)", SCENE_WIDTH / 4, 150);
		
		// 2 Players
		context.fillStyle = 'magenta';
		context.fillText("2 PLAYERS (vs Friend) ->", SCENE_WIDTH * 0.75, 150);

		// Reset
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
