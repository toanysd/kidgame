import {
	SCENE_WIDTH,
	STAGE_MID_POINT,
	STAGE_PADDING,
} from '../constants/stage.js';
import {
	FighterAttackBaseData,
	FighterAttackStrength,
	FighterId,
	FighterState,
	FighterStruckDelay,
} from '../constants/fighter.js';
import { FRAME_TIME, GAME_SPEED } from '../constants/game.js';
import { Camera } from '../engine/Camera.js';
import { EntityList } from '../engine/EntityList.js';
import { Ken, Ryu } from '../entitites/fighters/index.js';
import {
	HeavyHitSplash,
	LightHitSplash,
	MediumHitSplash,
	Shadow,
} from '../entitites/fighters/shared/index.js';
import { Fireball } from '../entitites/fighters/special/Fireball.js';
import { FpsCounter } from '../entitites/overlays/FpsCounter.js';
import { StatusBar } from '../entitites/overlays/StatusBar.js';
import { KenStage } from '../entitites/stage/KenStage.js';
import { gameState, resetGameState } from '../states/gameState.js';
import { StartScene } from './StartScene.js';
import { ARFighter } from '../ar-fighter.js';
import { AIBot } from '../ai-bot.js';
import { networkManager } from '../network/NetworkManager.js';

export class BattleScene {
	image = document.getElementById('Winner');
	fighters = [];
	camera = undefined;
	shadows = [];
	FighterDrawOrder = [0, 1];
	hurtTimer = 0;
	battleEnded = false;
	winnerId = undefined;
	syncTimer = 0;

	constructor(changeScene) {
		this.changeScene = changeScene;
		this.stage = new KenStage();
		this.entities = new EntityList();
		this.overlays = [
			new StatusBar(this.fighters, this.onTimeEnd),
			new FpsCounter(),
		];
		window.SF_BATTLE_SCENE = this;
		resetGameState();
		this.startRound();
		this.setupNetworkSync();
	}

	setupNetworkSync = () => {
		if (window.GAME_MODE !== '2P_ONLINE') return;

		networkManager.onStateSync = (state) => {
			if (!state || window.IS_ONLINE_HOST) return;
			// Guest synchronizes state received from Host
			if (gameState.fighters[0] && state.p1_hp !== undefined) {
				gameState.fighters[0].hitPoints = state.p1_hp;
				gameState.fighters[0].score = state.p1_score || 0;
			}
			if (gameState.fighters[1] && state.p2_hp !== undefined) {
				gameState.fighters[1].hitPoints = state.p2_hp;
				gameState.fighters[1].score = state.p2_score || 0;
			}
			if (this.fighters[0] && state.p1_x !== undefined) {
				if (Math.abs(this.fighters[0].position.x - state.p1_x) > 15) {
					this.fighters[0].position.x = state.p1_x;
				}
			}
			if (this.fighters[1] && state.p2_x !== undefined) {
				if (Math.abs(this.fighters[1].position.x - state.p2_x) > 15) {
					this.fighters[1].position.x = state.p2_x;
				}
			}
		};

		networkManager.onGameEvent = (event) => {
			if (!event) return;
			if (event.type === 'HADOUKEN') {
				const f = this.fighters[event.fighterIndex];
				if (f) f.changeState(FighterState.SPECIAL_1_HEAVY, { previous: performance.now() });
			} else if (event.type === 'HIT' && !window.IS_ONLINE_HOST) {
				this.handleAttackHit(
					{ previous: performance.now() },
					event.playerId,
					event.opponentId,
					null,
					event.strength
				);
			}
		};
	};

	getFighterClass = (id) => {
		switch (id) {
			case FighterId.KEN:
				return Ken;
			case FighterId.RYU:
				return Ryu;
			default:
				return new Error('Invalid Fighter Id');
		}
	};

	getFighterEntitiy = (id, index) => {
		const FighterClass = this.getFighterClass(id);
		return new FighterClass(index, this.handleAttackHit, this.entities);
	};

	getFighterEntities = () => {
		const fighterEntities = gameState.fighters.map(({ id }, index) => {
			const fighterEntity = this.getFighterEntitiy(id, index);
			gameState.fighters[index].instance = fighterEntity;
			return fighterEntity;
		});

		fighterEntities[0].opponent = fighterEntities[1];
		fighterEntities[1].opponent = fighterEntities[0];

		return fighterEntities;
	};

	updateFighters = (time, context) => {
		this.fighters.map((fighter) => {
			if (this.hurtTimer > time.previous) {
				fighter.updateHurtShake(time, this.hurtTimer);
			} else fighter.update(time, this.camera);
		});
	};

	getHitSplashClass = (strength) => {
		switch (strength) {
			case FighterAttackStrength.LIGHT:
				return LightHitSplash;
			case FighterAttackStrength.MEDIUM:
				return MediumHitSplash;
			case FighterAttackStrength.HEAVY:
				return HeavyHitSplash;
			default:
				return new Error('Invalid Strength Splash requested');
		}
	};

	handleAttackHit = (time, playerId, opponentId, position, strength) => {
		this.FighterDrawOrder = [opponentId, playerId];
		gameState.fighters[playerId].score += FighterAttackBaseData[strength].score;

		gameState.fighters[opponentId].hitPoints -=
			FighterAttackBaseData[strength].damage;

		const HitSplashClass = this.getHitSplashClass(strength);

		if (gameState.fighters[opponentId].hitPoints <= 0) {
			this.fighters[opponentId].changeState(FighterState.KO, time);
		}

		this.fighters[opponentId].direction =
			this.fighters[playerId].direction * -1;

		position &&
			this.entities.add(HitSplashClass, position.x, position.y, playerId);

		this.hurtTimer = time.previous + FighterStruckDelay * FRAME_TIME;

		// If Host in Online mode, broadcast hit event
		if (window.GAME_MODE === '2P_ONLINE' && window.IS_ONLINE_HOST && networkManager.isConnected) {
			networkManager.sendGameEvent({
				type: 'HIT',
				playerId,
				opponentId,
				strength
			});
		}
	};

	updateShadows = (time) => {
		this.shadows.map((shadow) => shadow.update(time));
	};

	startRound = () => {
		this.fighters = this.getFighterEntities();
		this.camera = new Camera(
			STAGE_PADDING + STAGE_MID_POINT - SCENE_WIDTH / 2,
			16,
			this.fighters
		);

		this.shadows = this.fighters.map((fighter) => new Shadow(fighter));
		
		if (!this.arFighter) {
			this.arFighter = new ARFighter(this);
		}
		if (!this.aiBot) {
			this.aiBot = new AIBot(this, 1);
		}
	};

	goToStartScene = () => {
		setTimeout(() => {
			this.changeScene(StartScene);
		}, 6000);
	};

	drawWinnerText = (context, id) => {
		context.drawImage(this.image, 0, 11 * id, 70, 9, 120, 60, 140, 30);
	};

	onTimeEnd = (time) => {
		if (gameState.fighters[0].hitPoints >= gameState.fighters[1].hitPoints) {
			this.fighters[0].victory = true;
			this.fighters[1].changeState(FighterState.KO, time);
			this.winnerId = 0;
		} else {
			this.fighters[1].victory = true;
			this.fighters[0].changeState(FighterState.KO, time);
			this.winnerId = 1;
		}
		this.goToStartScene();
	};

	updateOverlays = (time) => {
		this.overlays.map((overlay) => overlay.update(time));
	};

	updateFighterHP = (time) => {
		gameState.fighters.map((fighter, index) => {
			if (fighter.hitPoints <= 0 && !this.battleEnded) {
				this.fighters[index].opponent.victory = true;
				this.winnerId = 1 - index;
				this.battleEnded = true;
				this.goToStartScene();
			}
		});
	};

	update = (time) => {
		this.updateFighters(time);
		if (this.aiBot) this.aiBot.update(time);
		this.updateShadows(time);
		this.stage.update(time);
		this.entities.update(time, this.camera);
		this.camera.update(time);
		this.updateOverlays(time);
		this.updateFighterHP(time);

		// Host broadcasts state sync periodically (20Hz)
		if (window.GAME_MODE === '2P_ONLINE' && window.IS_ONLINE_HOST && networkManager.isConnected) {
			if (time.previous > this.syncTimer) {
				this.syncTimer = time.previous + 50;
				networkManager.sendStateSync({
					p1_hp: gameState.fighters[0].hitPoints,
					p2_hp: gameState.fighters[1].hitPoints,
					p1_score: gameState.fighters[0].score,
					p2_score: gameState.fighters[1].score,
					p1_x: this.fighters[0].position.x,
					p2_x: this.fighters[1].position.x,
					p1_y: this.fighters[0].position.y,
					p2_y: this.fighters[1].position.y
				});
			}
		}
	};

	drawFighters(context) {
		this.FighterDrawOrder.map((id) =>
			this.fighters[id].draw(context, this.camera)
		);
	}

	drawShadows(context) {
		this.shadows.map((shadow) => shadow.draw(context, this.camera));
	}

	drawOverlays(context) {
		this.overlays.map((overlay) => overlay.draw(context, this.camera));
		if (this.winnerId !== undefined) {
			this.drawWinnerText(context, this.winnerId);
		}
	}

	draw = (context) => {
		if (this.arFighter && this.arFighter.videoElement && this.arFighter.videoElement.readyState >= 2) {
			// Draw Camera Feed as AR Background
			context.save();
			context.translate(384, 0); // Mirror horizontally for 384x224 canvas
			context.scale(-1, 1);
			context.drawImage(this.arFighter.videoElement, 0, 0, 384, 224);
			context.restore();
		} else {
			this.stage.drawBackground(context, this.camera);
		}
		
		this.drawShadows(context);
		this.drawFighters(context);
		this.entities.draw(context, this.camera);
		this.stage.drawForeground(context, this.camera);
		if (this.arFighter) this.arFighter.draw(context, this.camera);
		this.drawOverlays(context);
	};
}
