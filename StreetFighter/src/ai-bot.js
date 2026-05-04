export class AIBot {
    constructor(scene, fighterIndex) {
        this.scene = scene;
        this.fighterIndex = fighterIndex; // usually 1 (Ken)
        window.AI_OPPONENT_INPUT = {
            left: false, right: false, up: false, down: false,
            lightPunch: false, mediumPunch: false, heavyPunch: false,
            lightKick: false, mediumKick: false, heavyKick: false
        };
        this.decisionTimer = 0;
    }

    update(time) {
        if (window.GAME_MODE === '2P') return;

        if (!this.scene || !this.scene.fighters) return;
        const me = this.scene.fighters[this.fighterIndex];
        const opponent = this.scene.fighters[1 - this.fighterIndex];
        
        if (!me || !opponent || me.hitPoints <= 0 || opponent.hitPoints <= 0) {
            window.AI_OPPONENT_INPUT = { left: false, right: false, up: false, down: false, lightPunch: false, mediumPunch: false, heavyPunch: false, lightKick: false, mediumKick: false, heavyKick: false };
            return;
        }

        if (time.previous < this.decisionTimer) {
            return; 
        }

        const inputs = {
            left: false, right: false, up: false, down: false,
            lightPunch: false, mediumPunch: false, heavyPunch: false,
            lightKick: false, mediumKick: false, heavyKick: false
        };

        const distanceX = Math.abs(me.position.x - opponent.position.x);
        
        if (distanceX > 80) {
            // Walk towards opponent
            if (me.position.x < opponent.position.x) inputs.right = true;
            else inputs.left = true;
            
            // Randomly jump
            if (Math.random() < 0.05) inputs.up = true;
        } else {
            // In attack range
            const attackChance = Math.random();
            if (attackChance < 0.2) inputs.lightPunch = true;
            else if (attackChance < 0.4) inputs.mediumPunch = true;
            else if (attackChance < 0.6) inputs.heavyPunch = true;
            else if (attackChance < 0.8) inputs.heavyKick = true;
            else {
                // retreat
                if (me.position.x < opponent.position.x) inputs.left = true;
                else inputs.right = true;
                inputs.down = Math.random() < 0.5; // maybe crouch
            }
        }

        window.AI_OPPONENT_INPUT = inputs;
        this.decisionTimer = time.previous + 150 + Math.random() * 400; // Fast decision 150-550ms
    }
}
