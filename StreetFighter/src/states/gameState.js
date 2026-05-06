import { FighterId } from '../constants/fighter.js';
import { createDefaultFighterState } from './fighterState.js';

export var gameState = {
	fighters: [
		createDefaultFighterState(FighterId.RYU),
		createDefaultFighterState(FighterId.KEN),
	],
};
window.SF_GAME_STATE = gameState;

export const resetGameState = () => {
	gameState = {
		fighters: [
			createDefaultFighterState(FighterId.RYU),
			createDefaultFighterState(FighterId.KEN),
		],
	};
    window.SF_GAME_STATE = gameState;
};
