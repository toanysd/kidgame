(() => {
  // src/constants/controls.js
  var Control = {
    LEFT: "left",
    RIGHT: "right",
    UP: "up",
    DOWN: "down",
    LIGHT_PUNCH: "lightPunch",
    MEDIUM_PUNCH: "mediumPunch",
    HEAVY_PUNCH: "heavyPunch",
    LIGHT_KICK: "lightKick",
    MEDIUM_KICK: "mediumKick",
    HEAVY_KICK: "heavyKick"
  };
  var SpecialMovesControls = {
    FORWARD: "forward",
    BACKWARD: "backward",
    UP: "up",
    DOWN: "down",
    FORWARD_DOWN: "forwardDown",
    FORWARD_UP: "forwardUp",
    BACKWARD_UP: "backwardUp",
    BACKWARD_DOWN: "backwardDown",
    LIGHT_PUNCH: "lightPunch",
    MEDIUM_PUNCH: "mediumPunch",
    HEAVY_PUNCH: "heavyPunch",
    LIGHT_KICK: "lightKick",
    MEDIUM_KICK: "mediumKick",
    HEAVY_KICK: "heavyKick"
  };
  var POLLING_RATE = 30;
  var POLLING_DELAY = 1e3 / POLLING_RATE;
  var MINIMUM_REPOLL_TIME = 200;

  // src/config/controls.js
  var PSControls = {
    X: 0,
    O: 1,
    SQ: 2,
    TR: 3,
    L1: 4,
    R1: 5,
    L2: 6,
    R2: 7,
    L3: 10,
    R3: 11,
    UP: 12,
    DOWN: 13,
    LEFT: 14,
    RIGHT: 15
  };
  var controls = [
    {
      gamepad: {
        [Control.LEFT]: PSControls.LEFT,
        [Control.RIGHT]: PSControls.RIGHT,
        [Control.UP]: PSControls.UP,
        [Control.DOWN]: PSControls.DOWN,
        [Control.LIGHT_PUNCH]: PSControls.X,
        [Control.MEDIUM_PUNCH]: PSControls.SQ,
        [Control.HEAVY_PUNCH]: PSControls.L1,
        [Control.LIGHT_KICK]: PSControls.O,
        [Control.MEDIUM_KICK]: PSControls.TR,
        [Control.HEAVY_KICK]: PSControls.R1
      },
      keyboard: {
        [Control.LEFT]: "KeyA",
        [Control.RIGHT]: "KeyD",
        [Control.UP]: "KeyW",
        [Control.DOWN]: "KeyS",
        [Control.LIGHT_PUNCH]: "KeyQ",
        [Control.MEDIUM_PUNCH]: "KeyE",
        [Control.HEAVY_PUNCH]: "KeyR",
        [Control.LIGHT_KICK]: "KeyF",
        [Control.MEDIUM_KICK]: "KeyV",
        [Control.HEAVY_KICK]: "KeyG"
      }
    },
    {
      gamepad: {
        [Control.LEFT]: PSControls.LEFT,
        [Control.RIGHT]: PSControls.RIGHT,
        [Control.UP]: PSControls.UP,
        [Control.DOWN]: PSControls.DOWN,
        [Control.LIGHT_PUNCH]: PSControls.X,
        [Control.MEDIUM_PUNCH]: PSControls.SQ,
        [Control.HEAVY_PUNCH]: PSControls.L1,
        [Control.LIGHT_KICK]: PSControls.O,
        [Control.MEDIUM_KICK]: PSControls.TR,
        [Control.HEAVY_KICK]: PSControls.R1
      },
      keyboard: {
        [Control.LEFT]: "ArrowLeft",
        [Control.RIGHT]: "ArrowRight",
        [Control.UP]: "ArrowUp",
        [Control.DOWN]: "ArrowDown",
        [Control.LIGHT_PUNCH]: "Slash",
        [Control.MEDIUM_PUNCH]: "ControlRight",
        [Control.HEAVY_PUNCH]: "Period",
        [Control.LIGHT_KICK]: "ShiftRight",
        [Control.MEDIUM_KICK]: "Quote",
        [Control.HEAVY_KICK]: "Enter"
      }
    }
  ];
  var CONTROLLER_DEADZONE = 0.4;

  // src/constants/game.js
  var GAME_SPEED = 1;
  var FPS = 60;
  var FRAME_TIME = 1e3 / FPS;

  // src/constants/fighter.js
  var FIGHTER_START_DISTANCE = 88;
  var FIGHTER_DEFAULT_WIDTH = 40;
  var FighterDirection = {
    LEFT: -1,
    RIGHT: 1
  };
  var FighterState = {
    IDLE: "idle",
    WALK_FORWARD: "walkForwards",
    WALK_BACKWARD: "walkBackwards",
    JUMP_START: "jumpStart",
    JUMP_UP: "jumpUp",
    JUMP_FORWARD: "jumpForwards",
    JUMP_BACKWARD: "jumpBackwards",
    JUMP_LAND: "jumpLand",
    CROUCH: "crouch",
    CROUCH_UP: "crouchUp",
    CROUCH_DOWN: "crouchDown",
    IDLE_TURN: "idleTurn",
    CROUCH_TURN: "crouchTurn",
    LIGHT_PUNCH: "lightPunch",
    MEDIUM_PUNCH: "mediumPunch",
    HEAVY_PUNCH: "heavyPunch",
    LIGHT_KICK: "lightKick",
    MEDIUM_KICK: "mediumKick",
    HEAVY_KICK: "heavyKick",
    HURT_HEAD_LIGHT: "hurtHeadLight",
    HURT_HEAD_MEDIUM: "hurtHeadMedium",
    HURT_HEAD_HEAVY: "hurtHeadHeavy",
    HURT_BODY_LIGHT: "hurtBodyLight",
    HURT_BODY_MEDIUM: "hurtBodyMedium",
    HURT_BODY_HEAVY: "hurtBodyHeavy",
    SPECIAL_1_LIGHT: "special1Light",
    SPECIAL_1_MEDIUM: "special1Medium",
    SPECIAL_1_HEAVY: "special1Heavy",
    VICTORY: "victory",
    KO: "ko"
  };
  var FighterStruckDelay = 15;
  var FrameDelay = {
    FREEZE: 0,
    TRANSITION: -1
  };
  var FighterId = {
    KEN: "Ken",
    RYU: "Ryu"
  };
  var PushBox = {
    IDLE: [-16, -80, 32, 78],
    JUMP: [-16, -91, 32, 66],
    BEND: [-16, -58, 32, 58],
    CROUCH: [-16, -50, 32, 50]
  };
  var FighterHurtArea = {
    HEAD: "head",
    BODY: "body",
    LEGS: "legs"
  };
  var HurtBox = {
    INVINCLIBLE: [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    IDLE: [
      [-8, -88, 24, 16],
      [-26, -74, 40, 42],
      [-26, -31, 40, 32]
    ],
    BACKWARD: [
      [-19, -88, 24, 16],
      [-26, -74, 40, 42],
      [-26, -31, 40, 32]
    ],
    FORWARD: [
      [-3, -88, 24, 16],
      [-26, -74, 40, 42],
      [-26, -31, 40, 32]
    ],
    JUMP: [
      [-13, -106, 28, 18],
      [-26, -90, 40, 42],
      [-22, -66, 38, 18]
    ],
    BEND: [
      [-2, -68, 24, 18],
      [-16, -53, 44, 24],
      [-16, -24, 44, 24]
    ],
    CROUCH: [
      [6, -61, 24, 18],
      [-16, -46, 44, 24],
      [-16, -24, 44, 24]
    ],
    PUNCH: [
      [11, -94, 24, 18],
      [-7, -77, 40, 43],
      [-7, -33, 40, 33]
    ]
  };
  var FIGHTER_PUSH_FRICTION = 66;
  var FighterAttackType = {
    PUNCH: "punch",
    KICK: "kick"
  };
  var FighterAttackStrength = {
    LIGHT: "light",
    MEDIUM: "medium",
    HEAVY: "heavy"
  };
  var FighterAttackBaseData = {
    [FighterAttackStrength.LIGHT]: {
      score: 100,
      damage: 12,
      slide: {
        velocity: 12 * FRAME_TIME,
        friction: 600
      }
    },
    [FighterAttackStrength.MEDIUM]: {
      score: 300,
      damage: 20,
      slide: {
        velocity: 16 * FRAME_TIME,
        friction: 600
      }
    },
    [FighterAttackStrength.HEAVY]: {
      score: 100,
      damage: 28,
      slide: {
        velocity: 22 * FRAME_TIME,
        friction: 800
      }
    }
  };
  var FighterHurtStates = [
    FighterState.IDLE,
    FighterState.IDLE_TURN,
    FighterState.WALK_FORWARD,
    FighterState.WALK_BACKWARD,
    FighterState.JUMP_START,
    FighterState.JUMP_LAND,
    FighterState.LIGHT_PUNCH,
    FighterState.MEDIUM_PUNCH,
    FighterState.HEAVY_PUNCH,
    FighterState.LIGHT_KICK,
    FighterState.MEDIUM_KICK,
    FighterState.HEAVY_KICK,
    FighterState.HURT_HEAD_LIGHT,
    FighterState.HURT_HEAD_MEDIUM,
    FighterState.HURT_HEAD_HEAVY,
    FighterState.HURT_BODY_LIGHT,
    FighterState.HURT_BODY_MEDIUM,
    FighterState.HURT_BODY_HEAVY,
    FighterState.SPECIAL_1_LIGHT,
    FighterState.SPECIAL_1_MEDIUM,
    FighterState.SPECIAL_1_HEAVY,
    FighterState.CROUCH,
    FighterState.CROUCH_UP,
    FighterState.CROUCH_DOWN
  ];

  // src/engine/InputHandler.js
  var mappedButtons = new Set(
    controls.map(({ gamepad }) => Object.values(gamepad)).flat()
  );
  var heldGamepadButtons = [/* @__PURE__ */ new Set(), /* @__PURE__ */ new Set()];
  var pressedGamepadButtons = [/* @__PURE__ */ new Set(), /* @__PURE__ */ new Set()];
  var gamepadThumbstickAxes = [
    {
      x: 0,
      y: 0
    },
    {
      x: 0,
      y: 0
    }
  ];
  var heldKeys = /* @__PURE__ */ new Set();
  var pressedKeys = /* @__PURE__ */ new Set();
  var pressedKeysControlHistory = [/* @__PURE__ */ new Set(), /* @__PURE__ */ new Set()];
  var mappedKeys = controls.map(({ keyboard }) => Object.values(keyboard)).flat();
  var isButtonPressed = (id, code) => {
    if (heldGamepadButtons[id].has(code) && !pressedGamepadButtons[id].has(code)) {
      pressedGamepadButtons[id].add(code);
      return true;
    }
    return false;
  };
  var isPressed = (code) => {
    if (heldKeys.has(code) && !pressedKeys.has(code)) {
      pressedKeys.add(code);
      return true;
    }
    return false;
  };
  var isPressedControlHistory = (id, code) => {
    const controlKeyId = controls[id].keyboard[code];
    const controlButtonId = controls[id].gamepad[code];
    if (heldKeys.has(controlKeyId) && !pressedKeysControlHistory[id].has(controlKeyId)) {
      pressedKeysControlHistory[id].add(controlKeyId);
      return true;
    } else if (heldGamepadButtons[id].has(controlButtonId) && !pressedKeysControlHistory[id].has(controlButtonId)) {
      pressedKeysControlHistory[id].add(controlButtonId);
      return true;
    }
    return false;
  };
  var handleKeyDown = (event) => {
    if (!mappedKeys.includes(event.code))
      return;
    event.preventDefault();
    if (!heldKeys.has(event.code)) {
      heldKeys.add(event.code);
    }
  };
  var handleKeyUp = (event) => {
    event.preventDefault();
    if (heldKeys.has(event.code)) {
      heldKeys.delete(event.code);
      pressedKeys.delete(event.code);
      if (Object.values(controls[0].keyboard).includes(event.code))
        pressedKeysControlHistory[0].delete(event.code);
      else
        pressedKeysControlHistory[1].delete(event.code);
    }
  };
  var registerKeyboardEvents = () => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
  };
  var handleGamepadConnected = (event) => {
    const gamepad = event.gamepad;
    console.log(
      `gamepad named ${gamepad.id} connected for player ${gamepad.index + 1}`
    );
  };
  var handleGamepadDisconnected = (event) => {
    const gamepad = event.gamepad;
    console.log(
      `gamepad named ${gamepad.id} disconnected for player ${gamepad.index + 1}`
    );
  };
  var updateGamepadButtons = (gamePadIndex, gamePad) => {
    if (!gamePad)
      return;
    gamePad.buttons.forEach((button, index) => {
      if (!mappedButtons.has(index))
        return;
      if (button.pressed) {
        heldGamepadButtons[gamePadIndex].add(index);
      } else {
        heldGamepadButtons[gamePadIndex].delete(index);
        pressedGamepadButtons[gamePadIndex].delete(index);
        pressedKeysControlHistory[gamePadIndex].delete(index);
      }
    });
  };
  var updateGamepadAxes = (gamePadIndex, gamePad) => {
    if (!gamePad)
      return;
    gamepadThumbstickAxes[gamePadIndex].x = gamePad.axes[0];
    gamepadThumbstickAxes[gamePadIndex].y = gamePad.axes[1];
  };
  var updateGamePads = () => {
    const gamepadList = navigator.getGamepads();
    for (const [gamePadIndex, gamePad] of gamepadList.entries()) {
      updateGamepadButtons(gamePadIndex, gamePad);
      updateGamepadAxes(gamePadIndex, gamePad);
    }
  };
  var registerGamepadEvents = () => {
    window.addEventListener("gamepadconnected", handleGamepadConnected);
    window.addEventListener("gamepaddisconnected", handleGamepadDisconnected);
  };
  var isLeft = (id) => {
    if (id === 0 && window.AI_FRAME_INPUT && window.AI_FRAME_INPUT.left)
      return true;
    if (id === 1 && window.AI_OPPONENT_INPUT && window.AI_OPPONENT_INPUT.left)
      return true;
    if (gamepadThumbstickAxes[id].x < -1 * CONTROLLER_DEADZONE)
      return true;
    return heldKeys.has(controls[id].keyboard[Control.LEFT]) || heldGamepadButtons[id].has(controls[id].gamepad[Control.LEFT]);
  };
  var isUp = (id) => {
    if (id === 0 && window.AI_FRAME_INPUT && window.AI_FRAME_INPUT.up)
      return true;
    if (id === 1 && window.AI_OPPONENT_INPUT && window.AI_OPPONENT_INPUT.up)
      return true;
    if (gamepadThumbstickAxes[id].y < -1 * CONTROLLER_DEADZONE)
      return true;
    return heldKeys.has(controls[id].keyboard[Control.UP]) || heldGamepadButtons[id].has(controls[id].gamepad[Control.UP]);
  };
  var isRight = (id) => {
    if (id === 0 && window.AI_FRAME_INPUT && window.AI_FRAME_INPUT.right)
      return true;
    if (id === 1 && window.AI_OPPONENT_INPUT && window.AI_OPPONENT_INPUT.right)
      return true;
    if (gamepadThumbstickAxes[id].x > CONTROLLER_DEADZONE)
      return true;
    return heldKeys.has(controls[id].keyboard[Control.RIGHT]) || heldGamepadButtons[id].has(controls[id].gamepad[Control.RIGHT]);
  };
  var isDown = (id) => {
    if (id === 0 && window.AI_FRAME_INPUT && window.AI_FRAME_INPUT.down)
      return true;
    if (id === 1 && window.AI_OPPONENT_INPUT && window.AI_OPPONENT_INPUT.down)
      return true;
    if (gamepadThumbstickAxes[id].y > CONTROLLER_DEADZONE)
      return true;
    return heldKeys.has(controls[id].keyboard[Control.DOWN]) || heldGamepadButtons[id].has(controls[id].gamepad[Control.DOWN]);
  };
  var isForward = (id, direction) => {
    return direction === FighterDirection.RIGHT ? isRight(id) : isLeft(id);
  };
  var isBackward = (id, direction) => {
    return direction === FighterDirection.RIGHT ? isLeft(id) : isRight(id);
  };
  var isKeyPressed = (id, code, forControlHistory) => {
    if (forControlHistory)
      return isPressedControlHistory(id, code);
    return isButtonPressed(id, controls[id].gamepad[code]) || isPressed(controls[id].keyboard[code]);
  };
  var isLightPunch = (id, forControlHistory = false) => {
    if (id === 0 && window.AI_FRAME_INPUT && window.AI_FRAME_INPUT.lightPunch)
      return true;
    if (id === 1 && window.AI_OPPONENT_INPUT && window.AI_OPPONENT_INPUT.lightPunch)
      return true;
    return isKeyPressed(id, Control.LIGHT_PUNCH, forControlHistory);
  };
  var isMediumPunch = (id, forControlHistory = false) => {
    if (id === 0 && window.AI_FRAME_INPUT && window.AI_FRAME_INPUT.mediumPunch)
      return true;
    if (id === 1 && window.AI_OPPONENT_INPUT && window.AI_OPPONENT_INPUT.mediumPunch)
      return true;
    return isKeyPressed(id, Control.MEDIUM_PUNCH, forControlHistory);
  };
  var isHeavyPunch = (id, forControlHistory = false) => {
    if (id === 0 && window.AI_FRAME_INPUT && window.AI_FRAME_INPUT.heavyPunch)
      return true;
    if (id === 1 && window.AI_OPPONENT_INPUT && window.AI_OPPONENT_INPUT.heavyPunch)
      return true;
    return isKeyPressed(id, Control.HEAVY_PUNCH, forControlHistory);
  };
  var isLightKick = (id, forControlHistory = false) => {
    if (id === 0 && window.AI_FRAME_INPUT && window.AI_FRAME_INPUT.lightKick)
      return true;
    if (id === 1 && window.AI_OPPONENT_INPUT && window.AI_OPPONENT_INPUT.lightKick)
      return true;
    return isKeyPressed(id, Control.LIGHT_KICK, forControlHistory);
  };
  var isMediumKick = (id, forControlHistory = false) => {
    if (id === 0 && window.AI_FRAME_INPUT && window.AI_FRAME_INPUT.mediumKick)
      return true;
    if (id === 1 && window.AI_OPPONENT_INPUT && window.AI_OPPONENT_INPUT.mediumKick)
      return true;
    return isKeyPressed(id, Control.MEDIUM_KICK, forControlHistory);
  };
  var isHeavyKick = (id, forControlHistory = false) => {
    if (id === 0 && window.AI_FRAME_INPUT && window.AI_FRAME_INPUT.heavyKick)
      return true;
    if (id === 1 && window.AI_OPPONENT_INPUT && window.AI_OPPONENT_INPUT.heavyKick)
      return true;
    return isKeyPressed(id, Control.HEAVY_KICK, forControlHistory);
  };

  // src/utils/context.js
  var drawFrame = (context, image, dimensions, x, y, direction = 1) => {
    const [sourceX, sourceY, sourceWidth, sourceHeight] = dimensions;
    context.scale(direction, 1);
    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      x * direction,
      y,
      sourceWidth,
      sourceHeight
    );
    context.setTransform(1, 0, 0, 1, 0, 0);
  };
  var getContext = () => {
    const canvasEL = document.querySelector("canvas");
    const context = canvasEL.getContext("2d");
    context.imageSmoothingEnabled = false;
    return context;
  };

  // src/constants/stage.js
  var STAGE_FLOOR = 218;
  var STAGE_WIDTH = 768;
  var STAGE_HEIGHT = 256;
  var STAGE_MID_POINT = STAGE_WIDTH / 2;
  var STAGE_PADDING = 256;
  var SCENE_WIDTH = 382;
  var SCENE_HEIGHT = 224;
  var SCROLL_BOUNDARY = 100;

  // src/engine/Camera.js
  var Camera2 = class {
    constructor(x, y, fighters) {
      this.position = { x, y };
      this.fighters = fighters;
      this.speed = 100;
    }
    updateY = () => {
      this.position.y = -4 + Math.floor(
        Math.min(this.fighters[1].position.y, this.fighters[0].position.y) / 10
      );
      if (this.position.y < 0)
        this.position.y = 0;
      if (this.position.y > STAGE_HEIGHT - SCENE_HEIGHT)
        this.position.y = STAGE_HEIGHT - SCENE_HEIGHT;
    };
    updateX = (time) => {
      const lowX = Math.min(
        ...this.fighters.map((fighter) => fighter.position.x)
      );
      const highX = Math.max(
        ...this.fighters.map((fighter) => fighter.position.x)
      );
      if (highX - lowX > SCENE_WIDTH - SCROLL_BOUNDARY * 2) {
        const midPoint = (highX - lowX) / 2;
        this.position.x = lowX + midPoint - SCENE_WIDTH / 2;
      } else {
        for (const fighter of this.fighters) {
          if (fighter.position.x < this.position.x + SCROLL_BOUNDARY) {
            this.position.x = fighter.position.x - SCROLL_BOUNDARY;
          } else if (fighter.position.x > this.position.x + SCENE_WIDTH - SCROLL_BOUNDARY) {
            this.position.x = fighter.position.x + SCROLL_BOUNDARY - SCENE_WIDTH;
          }
        }
      }
      if (this.position.x <= STAGE_PADDING)
        this.position.x = STAGE_PADDING;
      if (this.position.x > STAGE_WIDTH + STAGE_PADDING - SCENE_WIDTH)
        this.position.x = STAGE_WIDTH + STAGE_PADDING - SCENE_WIDTH;
    };
    update = (time, context) => {
      this.updateY(time);
      this.updateX(time);
    };
  };

  // src/engine/EntityList.js
  var EntityList = class {
    entitiesList = [];
    add = (EntityClass, ...args) => {
      this.entitiesList.push(new EntityClass(...args, this));
    };
    // Either use arrow function as i keeps the 'this' reference of parent always and doesnt have own 'this'
    // Or use normal function and use this.removeEntity.bind(this)
    remove = (entity) => {
      this.entitiesList = this.entitiesList.filter(
        (thisEntity) => thisEntity !== entity
      );
    };
    update = (time, camera) => {
      for (const entity of this.entitiesList) {
        entity.update(time, camera);
      }
    };
    draw = (context, camera) => {
      this.entitiesList.map((entity) => entity.draw(context, camera));
    };
  };

  // src/constants/sounds.js
  var soundAttackIds = {
    LIGHT: "sound-fighter-light-attack",
    MEDIUM: "sound-fighter-medium-attack",
    HEAVY: "sound-fighter-heavy-attack"
  };
  var soundHadoukenId = {
    [FighterId.KEN]: "sound-ken-hadouken",
    [FighterId.RYU]: "sound-ryu-hadouken"
  };
  var soundLandId = "sound-fighter-land";
  var soundHitIds = {
    LIGHT: {
      PUNCH: "sound-fighter-light-punch-hit",
      KICK: "sound-fighter-light-kick-hit"
    },
    MEDIUM: {
      PUNCH: "sound-fighter-medium-punch-hit",
      KICK: "sound-fighter-medium-kick-hit"
    },
    HEAVY: {
      PUNCH: "sound-fighter-heavy-punch-hit",
      KICK: "sound-fighter-heavy-kick-hit"
    }
  };
  var GLOBAL_VOLUME = 0.7;

  // src/engine/ControlHistory.js
  var ControlHistory = class {
    historyTimerCap = 2e3;
    history = [];
    historyTimer = 0;
    controlToButton = [
      [isLightPunch, SpecialMovesControls.LIGHT_PUNCH],
      [isMediumPunch, SpecialMovesControls.MEDIUM_PUNCH],
      [isHeavyPunch, SpecialMovesControls.HEAVY_PUNCH],
      [isLightKick, SpecialMovesControls.LIGHT_KICK],
      [isMediumKick, SpecialMovesControls.MEDIUM_KICK],
      [isHeavyKick, SpecialMovesControls.HEAVY_KICK]
    ];
    constructor(fighter) {
      this.fighter = fighter;
      this.playerId = fighter.playerId;
    }
    getMove = () => {
      if (isForward(this.playerId, this.fighter.direction)) {
        if (isUp(this.playerId, this.fighter.direction))
          return SpecialMovesControls.FORWARD_UP;
        else if (isDown(this.playerId, this.fighter.direction))
          return SpecialMovesControls.FORWARD_DOWN;
        return SpecialMovesControls.FORWARD;
      } else if (isBackward(this.playerId, this.fighter.direction)) {
        if (isUp(this.playerId, this.fighter.direction))
          return SpecialMovesControls.BACKWARD_UP;
        else if (isDown(this.playerId, this.fighter.direction))
          return SpecialMovesControls.BACKWARD_DOWN;
        return SpecialMovesControls.BACKWARD;
      } else if (isUp(this.playerId, this.fighter.direction))
        return SpecialMovesControls.UP;
      else if (isDown(this.playerId, this.fighter.direction))
        return SpecialMovesControls.DOWN;
      else if (isLightPunch(this.playerId, this.fighter.direction))
        return SpecialMovesControls.LIGHT_PUNCH;
      else if (isMediumPunch(this.playerId, this.fighter.direction))
        return SpecialMovesControls.MEDIUM_PUNCH;
      else
        return null;
    };
    getButton = () => {
      for (const [isButton, buttonName] of this.controlToButton) {
        if (isButton(this.playerId, true)) {
          return buttonName;
        }
      }
      return false;
    };
    isValidAddition = (control, time) => {
      if (this.history.length === 0 || this.history[0][0] !== control)
        return true;
      if (time.previous - this.history[0][1] > MINIMUM_REPOLL_TIME)
        return true;
      return false;
    };
    handleAdd = (time) => {
      if (this.historyTimer > time.previous)
        return;
      this.historyTimer = time.previous + POLLING_DELAY;
      const button = this.getButton();
      const move = this.getMove();
      if (button && this.isValidAddition(button, time)) {
        this.history.unshift([button, time.previous]);
        this.updateSpecialMoveSequences(time);
      }
      if (move && this.isValidAddition(move, time)) {
        this.history.unshift([move, time.previous]);
        this.updateSpecialMoveSequences(time);
      }
    };
    handleRemove = (time) => {
      for (let i = this.history.length - 1; i >= 0; i--) {
        if (this.history[i][1] <= time.previous - this.historyTimerCap) {
          this.history.splice(i, 1);
        } else {
          return;
        }
      }
      if (this.history.length === 0)
        this.resetCursors();
    };
    print() {
      let historyWithNamesOnly = [];
      for (const [name] of this.history)
        historyWithNamesOnly.push(name);
      console.log(historyWithNamesOnly);
    }
    // older version which work with 	specialMoveSequence = {
    // 	[FighterState.SPECIAL_1_LIGHT]: [
    // 		SpecialMovesControls.DOWN,
    // 		SpecialMovesControls.FORWARD_DOWN,
    // 		SpecialMovesControls.FORWARD,
    // 		SpecialMovesControls.LIGHT_PUNCH,
    // 	],
    // 	[FighterState.SPECIAL_1_MEDIUM]: [
    // 		SpecialMovesControls.DOWN,
    // 		SpecialMovesControls.FORWARD_DOWN,
    // 		SpecialMovesControls.FORWARD,
    // 		SpecialMovesControls.MEDIUM_PUNCH,
    // 	],
    // 	[FighterState.SPECIAL_1_HEAVY]: [
    // 		SpecialMovesControls.DOWN,
    // 		SpecialMovesControls.FORWARD_DOWN,
    // 		SpecialMovesControls.FORWARD,
    // 		SpecialMovesControls.HEAVY_PUNCH,
    // 	],
    // };
    // NOT Used
    OLD_VERSION_TO_CHECK_SEQUENCE = () => {
      checkSequences = (time) => {
        for (const [state, sequence] of Object.entries(
          this.fighter.specialMoveSequence
        )) {
          if (this.isMoveSequenceMade(state)) {
            this.fighter.changeState(state, time);
          }
        }
      };
      matchMovesinArrays = (sequence, history) => {
        if (history.length < sequence.length)
          return false;
        for (let i = 0; i < sequence.length; i++) {
          if (history[i][0] !== sequence[i])
            return false;
        }
        this.history = [];
        return true;
      };
      isMoveSequenceMade = (fighterState) => {
        const sequence = this.fighter.specialMoveSequence[fighterState].slice().reverse();
        return this.matchMovesinArrays(sequence, this.history) || this.matchMovesinArrays(sequence, this.history.slice(1)) || this.matchMovesinArrays(sequence, this.history.slice(2)) || this.matchMovesinArrays(sequence, this.history.slice(3));
      };
    };
    resetCursors = () => {
      this.fighter.specialMoves.forEach((move) => {
        move.cursor = 0;
      });
    };
    checkSequence = (time, move) => {
      if (move.cursor === move.sequence.length) {
        this.fighter.changeState(move.state, time);
        move.cursor = 0;
      }
    };
    updateSpecialMoveSequences = (time) => {
      this.fighter.specialMoves.forEach((move) => {
        if (this.history[0][0] === move.sequence[move.cursor]) {
          move.cursor++;
          this.checkSequence(time, move);
        } else
          move.cursor = 0;
      });
    };
    update = (time) => {
      this.handleAdd(time);
      this.handleRemove(time);
    };
  };

  // src/engine/SoundHandler.js
  var playSound = (sound, volume = GLOBAL_VOLUME) => {
    sound.volume = volume;
    if (!sound.paused && sound.currentTime > 0 && !sound.ended && sound.readyState > sound.HAVE_CURRENT_DATA) {
      sound.currentTime = 0;
      sound.play();
    } else {
      sound.play();
    }
  };
  var stopSound = (sound) => {
    sound.pause();
    sound.currentTime = 0;
  };

  // src/utils/collisions.js
  var rectsOverlap = (x1, y1, width1, height1, x2, y2, width2, height2) => {
    return x1 < x2 + width2 && x1 + width1 > x2 && y1 < y2 + height2 && y1 + height1 > y2;
  };
  var boxOverlap = (box1, box2) => {
    return rectsOverlap(
      box1.x,
      box1.y,
      box1.width,
      box1.height,
      box2.x,
      box2.y,
      box2.width,
      box2.height
    );
  };
  var getActualBoxDimensions = (position, direction, box) => {
    const x1 = position.x + box.x * direction;
    const x2 = x1 + box.width * direction;
    return {
      x: Math.min(x1, x2),
      y: position.y + box.y,
      width: box.width,
      height: box.height
    };
  };

  // src/constants/battle.js
  var BATTLE_TIME = 99;
  var TIME_DELAY = 120 * FRAME_TIME;
  var TIME_FLASH_DELAY = 3 * FRAME_TIME;
  var TIME_FRAME_KEYS = ["time", "time-flash"];
  var KO_FLASH_DELAY = [4 * FRAME_TIME, 7 * FRAME_TIME];
  var KO_FLASH_KEYS = ["ko-white", "ko-black"];
  var LOGO_FLASH_DELAY = [100 * FRAME_TIME, 20 * FRAME_TIME];
  var HEALTH_MAX_HIT_POINTS = 500;
  var HEALTH_CRITICAL_HIT_POINTS_PERCENTAGE = 0.4;
  var HEALTH_CRITICAL_HIT_POINTS = HEALTH_CRITICAL_HIT_POINTS_PERCENTAGE * HEALTH_MAX_HIT_POINTS;
  var HEALTH_DAMAGE_COLOR = "#f30000";
  var HIT_SPLASH_RANDOMNESS = 10;
  var DRAW_DEBUG = false;

  // src/utils/fighterDebug.js
  var drawOriginCross = (context, camera, position) => {
    context.beginPath();
    context.strokeStyle = "white";
    context.moveTo(
      Math.floor(position.x - camera.position.x) + 5,
      Math.floor(position.y - camera.position.y) - 0.5
    );
    context.lineTo(
      Math.floor(position.x - camera.position.x) - 4,
      Math.floor(position.y - camera.position.y) - 0.5
    );
    context.moveTo(
      Math.floor(position.x - camera.position.x) + 0.5,
      Math.floor(position.y - camera.position.y) - 5
    );
    context.lineTo(
      Math.floor(position.x - camera.position.x) + 0.5,
      Math.floor(position.y - camera.position.y) + 4
    );
    context.stroke();
  };
  var drawDebugBox = (context, camera, position, direction, dimensions, color) => {
    if (!Array.isArray(dimensions))
      return;
    const [x, y, width, height] = dimensions;
    context.lineWidth = 1;
    context.beginPath();
    context.strokeStyle = color;
    context.fillStyle = color + "33";
    context.fillRect(
      Math.floor(position.x - camera.position.x + x * direction) + 0.5,
      Math.floor(position.y + y - camera.position.y) + 0.5,
      width * direction,
      height
    );
    context.rect(
      Math.floor(position.x - camera.position.x + x * direction) + 0.5,
      Math.floor(position.y + y - camera.position.y) + 0.5,
      width * direction,
      height
    );
    context.stroke();
  };
  function DEBUG_drawCollisionInfo(fighter, context, camera) {
    const { position, direction, boxes } = fighter;
    drawDebugBox(
      context,
      camera,
      position,
      direction,
      Object.values(boxes.push),
      "#55ff55"
    );
    Object.values(boxes.hurt).map((box) => {
      drawDebugBox(context, camera, position, direction, box, "#5555ff");
    });
    drawDebugBox(
      context,
      camera,
      position,
      direction,
      Object.values(boxes.hit),
      "#ff0000"
    );
    drawOriginCross(context, camera, position);
  }

  // src/entitites/fighters/Fighter.js
  var Fighter = class {
    velocity = {
      x: 0,
      y: 0
    };
    initialVelocity = {};
    gravity = 0;
    image = new Image();
    frames = /* @__PURE__ */ new Map();
    animationFrame = 0;
    animationTimer = 0;
    animations = {};
    slideVelocity = 0;
    slideFriction = 0;
    attackStruckDelay = 0;
    hurtShakeTimer = 0;
    hurtShake = 0;
    victory = false;
    opponent = void 0;
    boxes = {
      push: { pushX: 0, pushY: 0, pushWidth: 0, pushHeight: 0 },
      hurt: {
        [FighterHurtArea.HEAD]: [0, 0, 0, 0],
        [FighterHurtArea.BODY]: [0, 0, 0, 0],
        [FighterHurtArea.LEGS]: [0, 0, 0, 0]
      },
      hit: { x: 0, y: 0, width: 0, height: 0 }
    };
    currentState = FighterState.IDLE;
    attackStruck = false;
    soundAttacks = {
      [FighterAttackStrength.LIGHT]: document.getElementById(
        soundAttackIds.LIGHT
      ),
      [FighterAttackStrength.MEDIUM]: document.getElementById(
        soundAttackIds.MEDIUM
      ),
      [FighterAttackStrength.HEAVY]: document.getElementById(
        soundAttackIds.HEAVY
      )
    };
    specialMoves = null;
    soundHits = {
      [FighterAttackStrength.LIGHT]: {
        [FighterAttackType.PUNCH]: document.getElementById(
          soundHitIds.LIGHT.PUNCH
        ),
        [FighterAttackType.KICK]: document.getElementById(soundHitIds.LIGHT.KICK)
      },
      [FighterAttackStrength.MEDIUM]: {
        [FighterAttackType.PUNCH]: document.getElementById(
          soundHitIds.MEDIUM.PUNCH
        ),
        [FighterAttackType.KICK]: document.getElementById(
          soundHitIds.MEDIUM.KICK
        )
      },
      [FighterAttackStrength.HEAVY]: {
        [FighterAttackType.PUNCH]: document.getElementById(
          soundHitIds.HEAVY.PUNCH
        ),
        [FighterAttackType.KICK]: document.getElementById(soundHitIds.HEAVY.KICK)
      }
    };
    soundLand = document.getElementById(soundLandId);
    constructor(playerId, onAttackHit, entityList) {
      this.playerId = playerId;
      this.onAttackHit = onAttackHit;
      this.entityList = entityList;
      this.position = {
        x: STAGE_MID_POINT + STAGE_PADDING + (playerId === 0 ? -1 : 1) * FIGHTER_START_DISTANCE,
        STAGE_FLOOR,
        y: STAGE_FLOOR
      };
      this.direction = playerId === 0 ? FighterDirection.RIGHT : FighterDirection.LEFT;
      this.states = {
        [FighterState.IDLE]: {
          init: this.handleIdleInit,
          update: this.handleIdle,
          validFrom: [
            void 0,
            FighterState.IDLE,
            FighterState.WALK_FORWARD,
            FighterState.WALK_BACKWARD,
            FighterState.JUMP_UP,
            FighterState.JUMP_FORWARD,
            FighterState.JUMP_BACKWARD,
            FighterState.CROUCH_UP,
            FighterState.JUMP_LAND,
            FighterState.IDLE_TURN,
            FighterState.LIGHT_PUNCH,
            FighterState.MEDIUM_PUNCH,
            FighterState.HEAVY_PUNCH,
            FighterState.LIGHT_KICK,
            FighterState.MEDIUM_KICK,
            FighterState.HEAVY_KICK,
            FighterState.HURT_HEAD_LIGHT,
            FighterState.HURT_HEAD_HEAVY,
            FighterState.HURT_HEAD_MEDIUM,
            FighterState.HURT_BODY_LIGHT,
            FighterState.HURT_BODY_MEDIUM,
            FighterState.HURT_BODY_HEAVY
          ]
        },
        [FighterState.WALK_FORWARD]: {
          init: this.handleMoveInit,
          update: this.handleWalkForward,
          validFrom: [
            FighterState.IDLE,
            FighterState.JUMP_FORWARD,
            FighterState.WALK_BACKWARD,
            FighterState.JUMP_LAND
          ]
        },
        [FighterState.WALK_BACKWARD]: {
          init: this.handleMoveInit,
          update: this.handleWalkBackward,
          validFrom: [
            FighterState.IDLE,
            FighterState.WALK_FORWARD,
            FighterState.JUMP_BACKWARD,
            FighterState.JUMP_LAND
          ]
        },
        [FighterState.JUMP_START]: {
          init: this.resetVelocities,
          update: this.handleJumpStartState,
          validFrom: [
            FighterState.IDLE,
            FighterState.WALK_FORWARD,
            FighterState.WALK_BACKWARD,
            FighterState.JUMP_LAND
          ]
        },
        [FighterState.JUMP_LAND]: {
          init: this.resetVelocities,
          update: this.handleJumpLandState,
          validFrom: [
            FighterState.JUMP_UP,
            FighterState.JUMP_FORWARD,
            FighterState.JUMP_BACKWARD
          ]
        },
        [FighterState.JUMP_UP]: {
          init: this.handleJumpInit,
          update: this.handleJump,
          validFrom: [FighterState.IDLE, FighterState.JUMP_START]
        },
        [FighterState.JUMP_FORWARD]: {
          init: this.handleJumpInit,
          update: this.handleJump,
          validFrom: [FighterState.JUMP_START, FighterState.WALK_FORWARD]
        },
        [FighterState.JUMP_BACKWARD]: {
          init: this.handleJumpInit,
          update: this.handleJump,
          validFrom: [FighterState.JUMP_START, FighterState.WALK_BACKWARD]
        },
        [FighterState.CROUCH_DOWN]: {
          init: this.resetVelocities,
          update: this.handleCrouchDownUpdate,
          validFrom: [
            FighterState.IDLE,
            FighterState.WALK_FORWARD,
            FighterState.WALK_BACKWARD,
            FighterState.JUMP_LAND
          ]
        },
        [FighterState.CROUCH]: {
          init: () => {
          },
          update: this.handleCrouch,
          validFrom: [FighterState.CROUCH_DOWN, FighterState.CROUCH_TURN]
        },
        [FighterState.CROUCH_UP]: {
          init: () => {
          },
          update: this.handleCrouchUpUpdate,
          validFrom: [FighterState.CROUCH]
        },
        [FighterState.IDLE_TURN]: {
          init: () => {
          },
          update: this.handleIdleTurnState,
          validFrom: [
            FighterState.IDLE,
            FighterState.JUMP_LAND,
            FighterState.WALK_FORWARD,
            FighterState.WALK_BACKWARD
          ]
        },
        [FighterState.CROUCH_TURN]: {
          init: () => {
          },
          update: this.handleCrouchTurn,
          validFrom: [FighterState.CROUCH]
        },
        [FighterState.LIGHT_PUNCH]: {
          attackType: FighterAttackType.PUNCH,
          attackStrength: FighterAttackStrength.LIGHT,
          init: this.handleAttackInit,
          update: this.handleLightKick,
          validFrom: [
            FighterState.IDLE,
            FighterState.WALK_FORWARD,
            FighterState.WALK_BACKWARD
          ]
        },
        [FighterState.MEDIUM_PUNCH]: {
          attackType: FighterAttackType.PUNCH,
          attackStrength: FighterAttackStrength.MEDIUM,
          init: this.handleAttackInit,
          update: this.handleMedKick,
          validFrom: [
            FighterState.IDLE,
            FighterState.WALK_FORWARD,
            FighterState.WALK_BACKWARD
          ]
        },
        [FighterState.HEAVY_PUNCH]: {
          attackType: FighterAttackType.PUNCH,
          attackStrength: FighterAttackStrength.HEAVY,
          init: this.handleAttackInit,
          update: this.handleHeavyKick,
          validFrom: [
            FighterState.IDLE,
            FighterState.WALK_FORWARD,
            FighterState.WALK_BACKWARD
          ]
        },
        [FighterState.LIGHT_KICK]: {
          attackType: FighterAttackType.KICK,
          attackStrength: FighterAttackStrength.LIGHT,
          init: this.handleAttackInit,
          update: this.handleLightPunch,
          validFrom: [
            FighterState.IDLE,
            FighterState.WALK_FORWARD,
            FighterState.WALK_BACKWARD
          ]
        },
        [FighterState.MEDIUM_KICK]: {
          attackType: FighterAttackType.KICK,
          attackStrength: FighterAttackStrength.MEDIUM,
          init: this.handleAttackInit,
          update: this.handleMedPunch,
          validFrom: [
            FighterState.IDLE,
            FighterState.WALK_FORWARD,
            FighterState.WALK_BACKWARD
          ]
        },
        [FighterState.HEAVY_KICK]: {
          attackType: FighterAttackType.KICK,
          attackStrength: FighterAttackStrength.HEAVY,
          init: this.handleAttackInit,
          update: this.handleHeavyPunch,
          validFrom: [
            FighterState.IDLE,
            FighterState.WALK_FORWARD,
            FighterState.WALK_BACKWARD
          ]
        },
        [FighterState.HURT_HEAD_LIGHT]: {
          init: this.handleAttackHitInit,
          update: this.handleHeadBodyHit,
          validFrom: FighterHurtStates
        },
        [FighterState.HURT_HEAD_MEDIUM]: {
          init: this.handleAttackHitInit,
          update: this.handleHeadBodyHit,
          validFrom: FighterHurtStates
        },
        [FighterState.HURT_HEAD_HEAVY]: {
          init: this.handleAttackHitInit,
          update: this.handleHeadBodyHit,
          validFrom: FighterHurtStates
        },
        [FighterState.HURT_BODY_LIGHT]: {
          init: this.handleAttackHitInit,
          update: this.handleHeadBodyHit,
          validFrom: FighterHurtStates
        },
        [FighterState.HURT_BODY_MEDIUM]: {
          init: this.handleAttackHitInit,
          update: this.handleHeadBodyHit,
          validFrom: FighterHurtStates
        },
        [FighterState.HURT_BODY_HEAVY]: {
          init: this.handleAttackHitInit,
          update: this.handleHeadBodyHit,
          validFrom: FighterHurtStates
        },
        [FighterState.VICTORY]: {
          init: this.resetVelocities,
          update: () => {
          },
          validFrom: Object.values(FighterState)
        },
        [FighterState.KO]: {
          init: this.resetVelocities,
          update: this.handleFallBack,
          shadow: [2.4, 1, 0, 0],
          validFrom: Object.values(FighterState)
        }
      };
      this.controlHistory = new ControlHistory(this);
    }
    hasCollidedWithOpponent = () => rectsOverlap(
      this.position.x + this.boxes.push.pushX,
      this.position.y + this.boxes.push.pushY,
      this.boxes.push.pushWidth,
      this.boxes.push.pushHeight,
      this.opponent.position.x + this.opponent.boxes.push.pushX,
      this.opponent.position.y + this.opponent.boxes.push.pushY,
      this.opponent.boxes.push.pushWidth,
      this.opponent.boxes.push.pushHeight
    );
    getDirection = () => {
      if (this.position.x + this.boxes.push.pushX + this.boxes.push.pushWidth >= this.opponent.position.x + this.opponent.boxes.push.pushX + this.opponent.boxes.push.pushWidth) {
        return FighterDirection.LEFT;
      } else if (this.position.x + this.boxes.push.pushX <= this.opponent.position.x + this.opponent.boxes.push.pushX + this.opponent.boxes.push.pushWidth) {
        return FighterDirection.RIGHT;
      }
      return this.direction;
    };
    getBoxes = (frameKey) => {
      const [
        ,
        [pushX, pushY, pushWidth, pushHeight] = [0, 0, 0, 0],
        [head, body, legs] = [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0]
        ],
        [hitX, hitY, hitWidth, hitHeight] = [0, 0, 0, 0]
      ] = this.frames.get(frameKey);
      return {
        push: { pushX, pushY, pushWidth, pushHeight },
        hurt: {
          [FighterHurtArea.HEAD]: head,
          [FighterHurtArea.BODY]: body,
          [FighterHurtArea.LEGS]: legs
        },
        hit: { x: hitX, y: hitY, width: hitWidth, height: hitHeight }
      };
    };
    isAnimationCompleted = () => {
      return this.animations[this.currentState][this.animationFrame][1] === FrameDelay.TRANSITION;
    };
    changeState = (newState, time) => {
      if (!this.states[newState].validFrom.includes(this.currentState)) {
        console.log(`Illegal move from ${this.currentState} to ${newState}`);
        return;
      }
      this.currentState = newState;
      this.setAnimationFrame(0, time);
      this.states[this.currentState].init(time);
    };
    updateStageConstraints = (time, camera) => {
      const fightersDistance = Math.abs(
        this.position.x - this.opponent.position.x
      );
      if (this.position.x - camera.position.x + FIGHTER_DEFAULT_WIDTH > SCENE_WIDTH) {
        this.position.x = camera.position.x + SCENE_WIDTH - FIGHTER_DEFAULT_WIDTH;
        fightersDistance < 150 && this.resetSlide(true);
      } else if (this.position.x - camera.position.x - FIGHTER_DEFAULT_WIDTH < 0) {
        this.position.x = camera.position.x + FIGHTER_DEFAULT_WIDTH;
        fightersDistance < 150 && this.resetSlide(true);
      }
      if (this.hasCollidedWithOpponent()) {
        if (this.position.x < this.opponent.position.x) {
          this.position.x = Math.max(
            this.opponent.position.x + this.opponent.boxes.push.pushX - (this.boxes.push.pushX + this.boxes.push.pushWidth),
            this.boxes.push.pushWidth - 1
          );
          if ([
            FighterState.IDLE,
            FighterState.CROUCH,
            FighterState.JUMP_UP,
            FighterState.JUMP_BACKWARD,
            FighterState.JUMP_FORWARD
          ].includes(this.opponent.currentState)) {
            this.opponent.position.x += FIGHTER_PUSH_FRICTION * time.secondsPassed;
          }
        } else if (this.position.x >= this.opponent.position.x) {
          this.position.x = Math.min(
            camera.position.x + SCENE_WIDTH - this.boxes.push.pushWidth,
            this.opponent.position.x + this.opponent.boxes.push.pushWidth
          );
          if ([
            FighterState.IDLE,
            FighterState.CROUCH,
            FighterState.JUMP_UP,
            FighterState.JUMP_BACKWARD,
            FighterState.JUMP_FORWARD
          ].includes(this.opponent.currentState)) {
            this.opponent.position.x -= FIGHTER_PUSH_FRICTION * time.secondsPassed;
          }
        }
      }
    };
    resetVelocities = () => {
      this.velocity = { x: 0, y: 0 };
    };
    handleIdleInit = () => {
      this.resetVelocities();
      this.opponent.attackStruck = false;
    };
    handleIdle = (time) => {
      if (this.victory) {
        this.changeState(FighterState.VICTORY, time);
        return;
      }
      if (isUp(this.playerId, this.direction))
        this.changeState(FighterState.JUMP_START, time);
      else if (isDown(this.playerId))
        this.changeState(FighterState.CROUCH_DOWN, time);
      else if (isForward(this.playerId, this.direction))
        this.changeState(FighterState.WALK_FORWARD, time);
      else if (isBackward(this.playerId, this.direction))
        this.changeState(FighterState.WALK_BACKWARD, time);
      else if (isLightPunch(this.playerId))
        this.changeState(FighterState.LIGHT_PUNCH, time);
      else if (isMediumPunch(this.playerId))
        this.changeState(FighterState.MEDIUM_PUNCH, time);
      else if (isHeavyPunch(this.playerId))
        this.changeState(FighterState.HEAVY_PUNCH, time);
      else if (isLightKick(this.playerId))
        this.changeState(FighterState.LIGHT_KICK, time);
      else if (isMediumKick(this.playerId))
        this.changeState(FighterState.MEDIUM_KICK, time);
      else if (isHeavyKick(this.playerId))
        this.changeState(FighterState.HEAVY_KICK, time);
      const newDirection = this.getDirection();
      if (newDirection !== this.direction) {
        this.direction = newDirection;
        this.changeState(FighterState.IDLE_TURN, time);
      }
    };
    handleWalkForward = (time) => {
      if (!isForward(this.playerId, this.direction))
        this.changeState(FighterState.IDLE, time);
      else if (isUp(this.playerId))
        this.changeState(FighterState.JUMP_FORWARD, time);
      else if (isDown(this.playerId))
        this.changeState(FighterState.CROUCH_DOWN, time);
      else if (isLightPunch(this.playerId))
        this.changeState(FighterState.LIGHT_PUNCH, time);
      else if (isMediumPunch(this.playerId))
        this.changeState(FighterState.MEDIUM_PUNCH, time);
      else if (isHeavyPunch(this.playerId))
        this.changeState(FighterState.HEAVY_PUNCH, time);
      else if (isLightKick(this.playerId))
        this.changeState(FighterState.LIGHT_KICK, time);
      else if (isMediumKick(this.playerId))
        this.changeState(FighterState.MEDIUM_KICK, time);
      else if (isHeavyKick(this.playerId))
        this.changeState(FighterState.HEAVY_KICK, time);
    };
    handleWalkBackward = (time) => {
      if (!isBackward(this.playerId, this.direction))
        this.changeState(FighterState.IDLE, time);
      else if (isUp(this.playerId))
        this.changeState(FighterState.JUMP_BACKWARD, time);
      else if (isDown(this.playerId))
        this.changeState(FighterState.CROUCH_DOWN, time);
      else if (isLightPunch(this.playerId))
        this.changeState(FighterState.LIGHT_PUNCH, time);
      else if (isMediumPunch(this.playerId))
        this.changeState(FighterState.MEDIUM_PUNCH, time);
      else if (isHeavyPunch(this.playerId))
        this.changeState(FighterState.HEAVY_PUNCH, time);
      else if (isLightKick(this.playerId))
        this.changeState(FighterState.LIGHT_KICK, time);
      else if (isMediumKick(this.playerId))
        this.changeState(FighterState.MEDIUM_KICK, time);
      else if (isHeavyKick(this.playerId))
        this.changeState(FighterState.HEAVY_KICK, time);
    };
    handleCrouchDownUpdate = (time) => {
      if (this.isAnimationCompleted()) {
        this.changeState(FighterState.CROUCH, time);
      }
      if (!isDown(this.playerId)) {
        this.currentState = FighterState.CROUCH_UP;
        this.setAnimationFrame(
          Math.max(
            0,
            this.animations[FighterState.CROUCH_UP][this.animationFrame].length - this.animationFrame
          ),
          time
        );
      }
    };
    handleCrouch = (time) => {
      !isDown(this.playerId) && this.changeState(FighterState.CROUCH_UP, time);
      const newDirection = this.getDirection();
      if (newDirection !== this.direction) {
        this.direction = newDirection;
        this.changeState(FighterState.CROUCH_TURN, time);
      }
    };
    handleCrouchUpUpdate = (time) => {
      if (this.isAnimationCompleted()) {
        this.changeState(FighterState.IDLE, time);
      }
    };
    handleCrouchTurn = (time) => {
      if (this.isAnimationCompleted()) {
        this.changeState(FighterState.CROUCH, time);
      }
    };
    handleMoveInit = () => {
      this.velocity.x = this.initialVelocity.x[this.currentState] ?? 0;
    };
    handleJumpStartState = (time) => {
      if (this.isAnimationCompleted()) {
        if (isBackward(this.playerId, this.direction))
          this.changeState(FighterState.JUMP_BACKWARD, time);
        else if (isForward(this.playerId, this.direction))
          this.changeState(FighterState.JUMP_FORWARD, time);
        else
          this.changeState(FighterState.JUMP_UP, time);
      }
    };
    handleJumpLandState = (time) => {
      if (this.animationFrame == 0) {
        playSound(this.soundLand);
        return;
      }
      this.handleIdle(time);
      if (this.isAnimationCompleted())
        this.changeState(FighterState.IDLE, time);
    };
    handleJumpInit = () => {
      this.velocity.y = this.initialVelocity.jump;
      this.handleMoveInit();
    };
    handleJump = (time) => {
      this.velocity.y += time.secondsPassed * this.gravity;
      if (this.position.y > STAGE_FLOOR) {
        this.position.y = STAGE_FLOOR;
        this.changeState(FighterState.JUMP_LAND, time);
      }
    };
    handleIdleTurnState = (time) => {
      if (this.isAnimationCompleted()) {
        this.changeState(FighterState.IDLE, time);
      }
    };
    handleAttackInit = (time) => {
      this.resetVelocities();
      playSound(this.soundAttacks[this.states[this.currentState].attackStrength]);
    };
    handleLightAttackReset = (time) => {
      this.setAnimationFrame(0, time);
      this.attackStruck = false;
      this.handleAttackInit();
    };
    handleLightPunch = (time) => {
      if (this.animationFrame < 2)
        return;
      if (isLightPunch(this.playerId))
        this.handleLightAttackReset(time);
      if (!this.isAnimationCompleted())
        return;
      this.changeState(FighterState.IDLE, time);
    };
    handleAttackHitInit = (time) => {
      this.resetVelocities();
      this.hurtShake = 2;
      this.hurtShakeTimer = time.previous;
    };
    getAttackHurtState = (attackStrength, hurtArea) => {
      switch (hurtArea) {
        case FighterHurtArea.HEAD:
          switch (attackStrength) {
            case FighterAttackStrength.LIGHT:
              return FighterState.HURT_HEAD_LIGHT;
            case FighterAttackStrength.MEDIUM:
              return FighterState.HURT_HEAD_MEDIUM;
            case FighterAttackStrength.HEAVY:
              return FighterState.HURT_HEAD_HEAVY;
            default:
              break;
          }
          break;
        case FighterHurtArea.BODY:
          switch (attackStrength) {
            case FighterAttackStrength.LIGHT:
              return FighterState.HURT_BODY_LIGHT;
            case FighterAttackStrength.MEDIUM:
              return FighterState.HURT_BODY_MEDIUM;
            case FighterAttackStrength.HEAVY:
              return FighterState.HURT_BODY_HEAVY;
            default:
              break;
          }
          break;
        default:
          switch (attackStrength) {
            case FighterAttackStrength.LIGHT:
              return FighterState.HURT_HEAD_LIGHT;
            case FighterAttackStrength.MEDIUM:
              return FighterState.HURT_HEAD_MEDIUM;
            case FighterAttackStrength.HEAVY:
              return FighterState.HURT_HEAD_HEAVY;
            default:
              break;
          }
          break;
      }
    };
    handleAttackHit = (time, attackStrength, hurtArea, attackType, hitPosition) => {
      if (this.currentState === FighterState.KO)
        return;
      const newState = this.getAttackHurtState(attackStrength, hurtArea);
      this.slideVelocity = FighterAttackBaseData[attackStrength].slide.velocity;
      this.slideFriction = FighterAttackBaseData[attackStrength].slide.friction;
      playSound(this.soundHits[attackStrength][attackType]);
      this.opponent.attackStruck = true;
      this.onAttackHit(
        time,
        this.opponent.playerId,
        this.playerId,
        hitPosition,
        attackStrength
      );
      this.changeState(newState, time);
    };
    handleHeadBodyHit = (time) => {
      if (!this.isAnimationCompleted())
        return;
      this.hurtShake = 0;
      this.hurtShakeTimer = 0;
      this.opponent.attackStruck = false;
      this.changeState(FighterState.IDLE, time);
    };
    handleFallBack = (time) => {
      if (this.animationFrame === 2 && this.position.y >= STAGE_FLOOR) {
        this.animationFrame++;
        this.velocity.y = 0;
        this.position.y = STAGE_FLOOR;
      } else if (this.animationFrame === 2)
        this.velocity.y = 120;
      if (!this.isAnimationCompleted())
        return;
      this.hurtShake = 0;
      this.hurtShakeTimer = 0;
      this.opponent.attackStruck = false;
      this.changeState(FighterState.IDLE, time);
    };
    handleMedPunch = (time) => {
      if (this.isAnimationCompleted()) {
        this.changeState(FighterState.IDLE, time);
      }
    };
    handleHeavyPunch = (time) => {
      if (this.isAnimationCompleted()) {
        this.changeState(FighterState.IDLE, time);
      }
    };
    handleLightKick = (time) => {
      if (this.animationFrame < 2)
        return;
      if (isLightKick(this.playerId))
        this.handleLightAttackReset(time);
      if (!this.isAnimationCompleted())
        return;
      this.changeState(FighterState.IDLE, time);
    };
    handleMedKick = (time) => {
      if (this.isAnimationCompleted()) {
        this.changeState(FighterState.IDLE, time);
      }
    };
    handleHeavyKick = (time) => {
      if (this.isAnimationCompleted()) {
        this.changeState(FighterState.IDLE, time);
      }
    };
    setAnimationFrame = (animationFrame, time) => {
      const animation = this.animations[this.currentState];
      this.animationFrame = animationFrame;
      if (this.animationFrame >= animation.length)
        this.animationFrame = 0;
      const [frameKey, frameDelay] = animation[this.animationFrame];
      this.boxes = this.getBoxes(frameKey);
      this.animationTimer = time.previous + frameDelay * FRAME_TIME;
    };
    updateAnimation = (time) => {
      const animation = this.animations[this.currentState];
      if (animation[this.animationFrame][1] <= FrameDelay.FREEZE || time.previous <= this.animationTimer)
        return;
      this.setAnimationFrame(this.animationFrame + 1, time);
    };
    updateAttackBoxCollided = (time) => {
      if (!this.states[this.currentState].attackType || this.attackStruck)
        return;
      const actualHitBox = getActualBoxDimensions(
        this.position,
        this.direction,
        this.boxes.hit
      );
      for (const [hurtArea, hurtBox] of Object.entries(
        this.opponent.boxes.hurt
      )) {
        if (this.attackStruck)
          return;
        const [x, y, width, height] = hurtBox;
        const actualOpponentHurtBox = getActualBoxDimensions(
          this.opponent.position,
          this.opponent.direction,
          { x, y, width, height }
        );
        if (!boxOverlap(actualHitBox, actualOpponentHurtBox))
          return;
        const { attackStrength, attackType } = this.states[this.currentState];
        stopSound(this.soundAttacks[attackStrength]);
        const hitPosition = {
          x: (actualHitBox.x + actualHitBox.width / 2 + actualOpponentHurtBox.x + actualOpponentHurtBox.width / 2) / 2,
          y: (actualHitBox.y + actualOpponentHurtBox.y + actualHitBox.height / 2 + actualOpponentHurtBox.width / 2) / 2
        };
        hitPosition.x += 4 - Math.random() * HIT_SPLASH_RANDOMNESS;
        hitPosition.y += 4 - Math.random() * HIT_SPLASH_RANDOMNESS;
        this.opponent.handleAttackHit(
          time,
          attackStrength,
          hurtArea,
          attackType,
          hitPosition
        );
      }
    };
    updatePositions = (time) => {
      this.position.x += (this.velocity.x - this.slideVelocity) * this.direction * time.secondsPassed;
      this.position.y += this.velocity.y * time.secondsPassed;
    };
    resetSlide = (transfer = false) => {
      if (transfer) {
        this.opponent.slideVelocity = this.slideVelocity;
        this.opponent.slideFriction = this.slideFriction;
      }
      this.slideVelocity = 0;
      this.slideFriction = 0;
    };
    updateSlide = (time) => {
      if (this.slideVelocity <= 0) {
        this.resetSlide();
        return;
      }
      this.slideVelocity = this.slideVelocity - this.slideFriction * time.secondsPassed;
    };
    updateHurtShake = (time, delay) => {
      if (this.hurtShakeTimer + FRAME_TIME < time.previous && !this.attackStruck) {
        const shakeAmount = delay - time.previous >= FighterStruckDelay * FRAME_TIME / 2 ? 2 : 1;
        this.hurtShake = shakeAmount - this.hurtShake;
        this.hurtShakeTimer = time.previous;
      }
    };
    update = (time, camera) => {
      this.states[this.currentState].update(time);
      this.updatePositions(time);
      this.updateSlide(time);
      this.updateAnimation(time);
      this.updateStageConstraints(time, camera);
      this.updateAttackBoxCollided(time);
      this.controlHistory.update(time);
    };
    draw = (context, camera) => {
      const frameKey = this.animations[this.currentState][this.animationFrame][0];
      const [[[x, y, width, height], [originX, originY]]] = this.frames.get(frameKey);
      context.scale(this.direction, 1);
      context.drawImage(
        this.image,
        x - this.hurtShake,
        y,
        width,
        height,
        Math.floor((this.position.x - camera.position.x) * this.direction) - originX,
        Math.floor(this.position.y - camera.position.y) - originY,
        width,
        height
      );
      context.setTransform(1, 0, 0, 1, 0, 0);
      DRAW_DEBUG && DEBUG_drawCollisionInfo(this, context, camera);
    };
  };

  // src/constants/fireball.js
  var fireballVelocity = {
    [FighterAttackStrength.LIGHT]: 150,
    [FighterAttackStrength.MEDIUM]: 220,
    [FighterAttackStrength.HEAVY]: 300
  };
  var FireballCollisionType = {
    OPPONENT: "opponent",
    FIREBALL: "fireball"
  };
  var FireballState = {
    ACTIVE: "active",
    COLLIDED: "collided"
  };

  // src/entitites/fighters/special/Fireball.js
  var Fireball = class _Fireball {
    image = document.getElementById("KenImage");
    animationFrame = 0;
    animationTimer = 0;
    frames = /* @__PURE__ */ new Map([
      [
        "hadouken-fireball-1",
        [
          [
            [400, 2756, 43, 32],
            [25, 16]
          ],
          [-15, -13, 30, 24],
          [-28, -20, 56, 38]
        ]
      ],
      [
        "hadouken-fireball-2",
        [
          [
            [460, 2761, 56, 28],
            [37, 14]
          ],
          [-15, -13, 30, 24],
          [-28, -20, 56, 38]
        ]
      ],
      [
        "hadouken-fireball-3",
        [
          [
            [0, 0, 0, 0],
            [0, 0]
          ],
          [-15, -13, 30, 24],
          [-28, -20, 56, 38]
        ]
      ],
      [
        "hadouken-collide-1",
        [
          [
            [543, 2767, 26, 20],
            [13, 10]
          ],
          [0, 0, 0, 0]
        ]
      ],
      [
        "hadouken-collide-2",
        [
          [
            [590, 2766, 15, 25],
            [9, 13]
          ],
          [0, 0, 0, 0]
        ]
      ],
      [
        "hadouken-collide-3",
        [
          [
            [625, 2764, 28, 28],
            [26, 14]
          ],
          [0, 0, 0, 0]
        ]
      ]
    ]);
    animations = {
      [FireballState.ACTIVE]: [
        ["hadouken-fireball-1", 5],
        ["hadouken-fireball-3", 2],
        ["hadouken-fireball-2", 5],
        ["hadouken-fireball-3", 1]
      ],
      [FireballState.COLLIDED]: [
        ["hadouken-collide-1", 13],
        ["hadouken-collide-2", 3],
        ["hadouken-collide-3", 7]
      ]
    };
    currentState = FireballState.ACTIVE;
    constructor(fighter, strength, time, entities) {
      this.fighter = fighter;
      this.direction = this.fighter.direction;
      this.strength = strength;
      this.velocity = fireballVelocity[strength];
      this.entities = entities;
      this.position = {
        x: this.fighter.position.x + 76 * this.direction,
        y: this.fighter.position.y - 57
      };
      this.animationTimer = time.previous;
    }
    endFireball = () => {
      this.entities.remove(this);
      this.fighter.fireballInstance = void 0;
    };
    handleCollidedInit = (time, speed = 0.333) => {
      this.velocity *= speed;
      this.currentState = FireballState.COLLIDED;
      this.animationFrame = 0;
      this.animationTimer = time.previous + this.animations[this.currentState][this.animationFrame][1] * FRAME_TIME;
    };
    updateAnimation = (time) => {
      if (this.animationTimer > time.previous)
        return;
      this.animationFrame++;
      if (this.animationFrame >= this.animations[this.currentState].length) {
        this.animationFrame = 0;
        if (this.currentState === FireballState.COLLIDED)
          this.endFireball();
      }
      this.animationTimer = time.previous + this.animations[this.currentState][this.animationFrame][1] * FRAME_TIME;
    };
    updateMovement = (time, camera) => {
      this.position.x += this.velocity * this.direction * time.secondsPassed;
      if (this.position.x - camera.position.x >= SCENE_WIDTH + 56 || this.position.x - camera.position.x <= -56) {
        this.endFireball();
      }
      if (this.currentState === FireballState.COLLIDED)
        return;
      const collided = this.hasFireballCollided(time);
      if (!collided)
        return;
      if (collided.collisionType === FireballCollisionType.OPPONENT)
        this.handleCollisionWithOpponent(time, collided.hurtArea);
      else
        this.handleCollisionWithFireball(time, collided.otherFireball);
    };
    handleCollisionWithFireball = (time, otherFireball) => {
      this.handleCollidedInit(time, 0.1);
      otherFireball.handleCollidedInit(time, 0.1);
      this.currentState = FireballState.COLLIDED;
      otherFireball.currentState = FireballState.COLLIDED;
    };
    handleCollisionWithOpponent = (time, hurtArea) => {
      this.handleCollidedInit(time, 0.33);
      this.fighter.opponent.handleAttackHit(
        time,
        this.strength,
        hurtArea,
        FighterAttackType.PUNCH,
        void 0
      );
    };
    hasCollidedWithOtherFireball = (actualFireballDimensions, otherFireball) => {
      const [x, y, width, height] = otherFireball.frames.get(
        otherFireball.animations[otherFireball.currentState][otherFireball.animationFrame][0]
      )[1];
      const actualOtherFireballDimensions = getActualBoxDimensions(
        otherFireball.position,
        otherFireball.direction,
        { x, y, width, height }
      );
      if (!boxOverlap(actualFireballDimensions, actualOtherFireballDimensions))
        return false;
      return {
        collisionType: FireballCollisionType.FIREBALL,
        otherFireball
      };
    };
    hasFireballCollidedWithOpponent = (actualFireballDimensions, opponent) => {
      for (const [hurtArea, dimensions] of Object.entries(opponent.boxes.hurt)) {
        const [x, y, width, height] = dimensions;
        const actualHurtDimensions = getActualBoxDimensions(
          this.fighter.opponent.position,
          this.fighter.opponent.direction,
          { x, y, width, height }
        );
        if (boxOverlap(actualFireballDimensions, actualHurtDimensions)) {
          return {
            collisionType: FireballCollisionType.OPPONENT,
            hurtArea
          };
        }
      }
      return false;
    };
    hasFireballCollided = () => {
      var [x, y, width, height] = this.frames.get(
        this.animations[this.currentState][this.animationFrame][0]
      )[1];
      const actualFireballDimensions = getActualBoxDimensions(
        this.position,
        this.direction,
        { x, y, width, height }
      );
      for (const entity of this.entities.entitiesList) {
        if (entity instanceof _Fireball && entity !== this) {
          const hasCollidedWithOtherFireball = this.hasCollidedWithOtherFireball(
            actualFireballDimensions,
            entity
          );
          if (hasCollidedWithOtherFireball)
            return hasCollidedWithOtherFireball;
        }
      }
      const hasCollidedWithOpponent = this.hasFireballCollidedWithOpponent(
        actualFireballDimensions,
        this.fighter.opponent
      );
      if (hasCollidedWithOpponent)
        return hasCollidedWithOpponent;
    };
    update = (time, camera) => {
      this.updateAnimation(time);
      this.updateMovement(time, camera);
    };
    drawFireball = (context, camera) => {
      const frameKey = this.animations[this.currentState][this.animationFrame][0];
      const [[[x, y, width, height], [originX, originY]]] = this.frames.get(frameKey);
      context.scale(this.direction, 1);
      context.drawImage(
        this.image,
        x,
        y,
        width,
        height,
        Math.floor(this.position.x - camera.position.x) * this.direction - originX,
        Math.floor(this.position.y - camera.position.y) - originY,
        width,
        height
      );
      context.setTransform(1, 0, 0, 1, 0, 0);
    };
    draw = (context, camera) => {
      this.drawFireball(context, camera);
      DRAW_DEBUG && drawDebugBox(
        context,
        camera,
        this.position,
        this.direction,
        this.frames.get(
          this.animations[this.currentState][this.animationFrame][0]
        )[1],
        "#ff0000"
      );
    };
  };

  // src/entitites/fighters/Ken.js
  var Ken = class extends Fighter {
    image = document.getElementById("KenImage");
    soundHadouken = document.getElementById(soundHadoukenId[FighterId.KEN]);
    fireballFired = false;
    frames = /* @__PURE__ */ new Map([
      // Idle
      // [
      // 	[Frames, origin],
      // 	pushbox = [originX from Origin, originY from Origin, Width, Height],
      // 	[
      // 		HurtHead = [originX from Origin, originY from Origin, Width, Height], HurtTorso,
      // 		HurtFeet
      // 	],
      // 	Hitbox = [originX from Origin, originY from Origin, Width, Height
      // 	]
      // ]
      [
        "idle-1",
        [
          [
            [346, 688, 60, 89],
            [34, 86]
          ],
          PushBox.IDLE,
          HurtBox.IDLE
        ]
      ],
      [
        "idle-2",
        [
          [
            [2, 687, 59, 90],
            [33, 87]
          ],
          PushBox.IDLE,
          HurtBox.IDLE
        ]
      ],
      [
        "idle-3",
        [
          [
            [72, 685, 58, 92],
            [32, 89]
          ],
          PushBox.IDLE,
          HurtBox.IDLE
        ]
      ],
      [
        "idle-4",
        [
          [
            [142, 684, 55, 93],
            [31, 90]
          ],
          PushBox.IDLE,
          HurtBox.IDLE
        ]
      ],
      // Forward
      [
        "forwards-1",
        [
          [
            [8, 872, 53, 83],
            [27, 82]
          ],
          PushBox.IDLE,
          HurtBox.FORWARD
        ]
      ],
      [
        "forwards-2",
        [
          [
            [70, 867, 60, 88],
            [35, 86]
          ],
          PushBox.IDLE,
          HurtBox.FORWARD
        ]
      ],
      [
        "forwards-3",
        [
          [
            [140, 866, 64, 90],
            [35, 87]
          ],
          PushBox.IDLE,
          HurtBox.FORWARD
        ]
      ],
      [
        "forwards-4",
        [
          [
            [215, 865, 63, 89],
            [29, 88]
          ],
          PushBox.IDLE,
          HurtBox.FORWARD
        ]
      ],
      [
        "forwards-5",
        [
          [
            [288, 866, 54, 89],
            [25, 87]
          ],
          PushBox.IDLE,
          HurtBox.FORWARD
        ]
      ],
      [
        "forwards-6",
        [
          [
            [357, 867, 50, 89],
            [25, 86]
          ],
          PushBox.IDLE,
          HurtBox.FORWARD
        ]
      ],
      // Backward
      [
        "backwards-1",
        [
          [
            [417, 868, 61, 87],
            [35, 85]
          ],
          PushBox.IDLE,
          HurtBox.BACKWARD
        ]
      ],
      [
        "backwards-2",
        [
          [
            [487, 866, 59, 90],
            [36, 87]
          ],
          PushBox.IDLE,
          HurtBox.BACKWARD
        ]
      ],
      [
        "backwards-3",
        [
          [
            [558, 865, 57, 90],
            [36, 88]
          ],
          PushBox.IDLE,
          HurtBox.BACKWARD
        ]
      ],
      [
        "backwards-4",
        [
          [
            [629, 864, 58, 90],
            [38, 89]
          ],
          PushBox.IDLE,
          HurtBox.BACKWARD
        ]
      ],
      [
        "backwards-5",
        [
          [
            [702, 865, 58, 91],
            [36, 88]
          ],
          PushBox.IDLE,
          HurtBox.BACKWARD
        ]
      ],
      [
        "backwards-6",
        [
          [
            [773, 866, 57, 89],
            [36, 87]
          ],
          PushBox.IDLE,
          HurtBox.BACKWARD
        ]
      ],
      [
        "jump-start/land",
        [
          [
            [660, 1060, 55, 85],
            [29, 83]
          ],
          PushBox.IDLE,
          HurtBox.IDLE
        ]
      ],
      [
        "jump-up-1",
        [
          [
            [724, 1036, 56, 104],
            [32, 107]
          ],
          PushBox.JUMP,
          HurtBox.JUMP
        ]
      ],
      [
        "jump-up-2",
        [
          [
            [792, 995, 50, 89],
            [25, 103]
          ],
          PushBox.JUMP,
          HurtBox.JUMP
        ]
      ],
      [
        "jump-up-3",
        [
          [
            [853, 967, 54, 77],
            [25, 103]
          ],
          PushBox.JUMP,
          HurtBox.JUMP
        ]
      ],
      [
        "jump-up-4",
        [
          [
            [911, 966, 48, 70],
            [28, 101]
          ],
          PushBox.JUMP,
          HurtBox.JUMP
        ]
      ],
      [
        "jump-up-5",
        [
          [
            [975, 977, 48, 86],
            [25, 103]
          ],
          PushBox.JUMP,
          HurtBox.JUMP
        ]
      ],
      [
        "jump-up-6",
        [
          [
            [1031, 1008, 55, 103],
            [32, 107]
          ],
          PushBox.JUMP,
          HurtBox.JUMP
        ]
      ],
      // Jump Forward
      [
        "jump-roll-1",
        [
          [
            [1237, 1037, 55, 103],
            [25, 106]
          ],
          PushBox.JUMP,
          [
            [-11, -106, 24, 16],
            [-26, -90, 40, 42],
            [-26, -31, 40, 32]
          ]
        ]
      ],
      [
        "jump-roll-2",
        [
          [
            [1301, 990, 61, 78],
            [22, 90]
          ],
          PushBox.JUMP,
          [
            [17, -90, 24, 16],
            [-14, -91, 40, 42],
            [-22, -66, 38, 18]
          ]
        ]
      ],
      [
        "jump-roll-3",
        [
          [
            [1363, 994, 104, 42],
            [61, 76]
          ],
          PushBox.JUMP,
          [
            [22, -51, 24, 16],
            [-14, -81, 40, 42],
            [-22, -66, 38, 18]
          ]
        ]
      ],
      [
        "jump-roll-4",
        [
          [
            [1468, 957, 53, 82],
            [42, 111]
          ],
          PushBox.JUMP,
          [
            [-39, -46, 24, 16],
            [-30, -88, 40, 42],
            [-34, -118, 44, 48]
          ]
        ]
      ],
      [
        "jump-roll-5",
        [
          [
            [1541, 988, 122, 44],
            [71, 81]
          ],
          PushBox.JUMP,
          [
            [-72, -56, 24, 16],
            [-54, -77, 52, 40],
            [-14, -82, 48, 34]
          ]
        ]
      ],
      [
        "jump-roll-6",
        [
          [
            [1664, 976, 71, 87],
            [53, 98]
          ],
          PushBox.JUMP,
          [
            [-55, -100, 24, 16],
            [-48, -87, 44, 38],
            [-22, -66, 38, 18]
          ]
        ]
      ],
      [
        "jump-roll-7",
        [
          [
            [1748, 977, 55, 103],
            [32, 107]
          ],
          PushBox.JUMP,
          [
            [-11, -106, 24, 16],
            [-26, -90, 40, 42],
            [-26, -31, 40, 32]
          ]
        ]
      ],
      // Crouch
      [
        "crouch-1",
        [
          [
            [8, 779, 53, 83],
            [27, 81]
          ],
          PushBox.IDLE,
          HurtBox.IDLE
        ]
      ],
      [
        "crouch-2",
        [
          [
            [79, 794, 57, 69],
            [25, 66]
          ],
          PushBox.BEND,
          HurtBox.BEND
        ]
      ],
      [
        "crouch-3",
        [
          [
            [148, 802, 61, 61],
            [25, 58]
          ],
          PushBox.CROUCH,
          HurtBox.CROUCH
        ]
      ],
      // Stand Turn
      [
        "idle-turn-1",
        [
          [
            [420, 682, 54, 95],
            [29, 92]
          ],
          PushBox.IDLE,
          [
            [-10, -89, 28, 18],
            [-14, -74, 40, 42],
            [-14, -31, 40, 32]
          ]
        ]
      ],
      [
        "idle-turn-2",
        [
          [
            [488, 678, 58, 98],
            [30, 95]
          ],
          PushBox.IDLE,
          [
            [-16, -96, 28, 18],
            [-14, -74, 40, 42],
            [-14, -31, 40, 32]
          ]
        ]
      ],
      [
        "idle-turn-3",
        [
          [
            [560, 683, 54, 94],
            [27, 90]
          ],
          PushBox.IDLE,
          [
            [-16, -96, 28, 18],
            [-14, -74, 40, 42],
            [-14, -31, 40, 32]
          ]
        ]
      ],
      // Crouch Turn
      [
        "crouch-turn-1",
        [
          [
            [356, 802, 53, 61],
            [26, 58]
          ],
          PushBox.CROUCH,
          [
            [-7, -60, 24, 18],
            [-28, -46, 44, 24],
            [-28, -24, 44, 24]
          ]
        ]
      ],
      [
        "crouch-turn-2",
        [
          [
            [424, 802, 52, 61],
            [27, 58]
          ],
          PushBox.CROUCH,
          [
            [-7, -60, 24, 18],
            [-28, -46, 44, 24],
            [-28, -24, 44, 24]
          ]
        ]
      ],
      [
        "crouch-turn-3",
        [
          [
            [486, 802, 53, 61],
            [29, 58]
          ],
          PushBox.CROUCH,
          [
            [-26, -61, 24, 18],
            [-28, -46, 44, 24],
            [-28, -24, 44, 24]
          ]
        ]
      ],
      // Light Punch
      [
        "light-punch-1",
        [
          [
            [3, 1152, 64, 91],
            [32, 88]
          ],
          PushBox.IDLE,
          HurtBox.IDLE
        ]
      ],
      [
        "light-punch-2",
        [
          [
            [72, 1152, 92, 91],
            [32, 88]
          ],
          PushBox.IDLE,
          HurtBox.IDLE,
          [11, -85, 50, 18]
        ]
      ],
      // Medium/Heavy Punch
      [
        "med-punch-1",
        [
          [
            [517, 1149, 60, 94],
            [28, 91]
          ],
          PushBox.IDLE,
          HurtBox.IDLE
        ]
      ],
      [
        "med-punch-2",
        [
          [
            [650, 1148, 74, 95],
            [29, 92]
          ],
          PushBox.IDLE,
          HurtBox.PUNCH
        ]
      ],
      [
        "med-punch-3",
        [
          [
            [736, 1148, 108, 94],
            [24, 92]
          ],
          PushBox.IDLE,
          HurtBox.PUNCH,
          [17, -85, 68, 14]
        ]
      ],
      // Heavy Punch
      [
        "heavy-punch-1",
        [
          [
            [736, 1148, 108, 94],
            [24, 92]
          ],
          PushBox.IDLE,
          HurtBox.PUNCH,
          [17, -85, 76, 14]
        ]
      ],
      // Light Kick
      [
        "light-kick-1",
        [
          [
            [62, 1565, 66, 92],
            [46, 93]
          ],
          PushBox.IDLE,
          [
            [-33, -96, 30, 18],
            [-41, -79, 42, 38],
            [-32, -52, 44, 50]
          ]
        ]
      ],
      [
        "light-kick-2",
        [
          [
            [143, 1565, 114, 92],
            [68, 93]
          ],
          PushBox.IDLE,
          [
            [-65, -96, 30, 18],
            [-57, -79, 42, 38],
            [-32, -52, 44, 50]
          ],
          [-17, -98, 66, 28]
        ]
      ],
      // Medium Kick
      [
        "med-kick-1",
        [
          [
            [143, 1565, 114, 92],
            [68, 93]
          ],
          PushBox.IDLE,
          [
            [-65, -96, 30, 18],
            [-57, -79, 42, 38],
            [-32, -52, 44, 50]
          ],
          [-18, -98, 80, 28]
        ]
      ],
      // Heavy Kick
      [
        "heavy-kick-1",
        [
          [
            [683, 1571, 61, 90],
            [37, 87]
          ],
          PushBox.IDLE,
          [
            [-41, -78, 20, 20],
            [-25, -78, 42, 42],
            [-11, -50, 42, 50]
          ]
        ]
      ],
      [
        "heavy-kick-2",
        [
          [
            [763, 1567, 95, 94],
            [45, 91]
          ],
          PushBox.IDLE,
          [
            [12, -90, 34, 34],
            [-25, -78, 42, 42],
            [-11, -50, 42, 50]
          ],
          [15, -99, 40, 32]
        ]
      ],
      [
        "heavy-kick-3",
        [
          [
            [870, 1567, 120, 94],
            [42, 91]
          ],
          PushBox.IDLE,
          [
            [13, -91, 62, 34],
            [-25, -78, 42, 42],
            [-11, -50, 42, 50]
          ],
          [21, -97, 62, 24]
        ]
      ],
      [
        "heavy-kick-4",
        [
          [
            [1005, 1584, 101, 77],
            [39, 74]
          ],
          PushBox.IDLE,
          [
            [-41, -78, 20, 20],
            [-25, -78, 42, 42],
            [-11, -50, 42, 50]
          ]
        ]
      ],
      [
        "heavy-kick-5",
        [
          [
            [1147, 1580, 64, 81],
            [38, 78]
          ],
          PushBox.IDLE,
          [
            [-41, -78, 20, 20],
            [-25, -78, 42, 42],
            [-11, -50, 42, 50]
          ]
        ]
      ],
      // Hit Face
      [
        "hit-face-1",
        [
          [
            [325, 3275, 62, 91],
            [41, 88]
          ],
          PushBox.IDLE,
          [
            [-25, -89, 20, 20],
            [-33, -74, 40, 46],
            [-30, -37, 40, 38]
          ]
        ]
      ],
      [
        "hit-face-2",
        [
          [
            [400, 3279, 68, 88],
            [47, 85]
          ],
          PushBox.IDLE,
          [
            [-42, -88, 20, 20],
            [-46, -74, 40, 46],
            [-33, -37, 40, 38]
          ]
        ]
      ],
      [
        "hit-face-3",
        [
          [
            [484, 3279, 73, 88],
            [54, 85]
          ],
          PushBox.IDLE,
          [
            [-52, -87, 20, 20],
            [-53, -71, 40, 46],
            [-33, -37, 40, 38]
          ]
        ]
      ],
      [
        "hit-face-4",
        [
          [
            [575, 3274, 83, 93],
            [58, 90]
          ],
          PushBox.IDLE,
          [
            [-57, -88, 20, 20],
            [-53, -71, 40, 46],
            [-33, -37, 40, 38]
          ]
        ]
      ],
      // Hit Stomach
      [
        "hit-stomach-1",
        [
          [
            [1, 3279, 58, 85],
            [37, 83]
          ],
          PushBox.IDLE,
          [
            [-15, -85, 28, 18],
            [-31, -69, 42, 42],
            [-30, -34, 42, 34]
          ]
        ]
      ],
      [
        "hit-stomach-2",
        [
          [
            [74, 3282, 66, 82],
            [39, 80]
          ],
          PushBox.IDLE,
          [
            [-17, 82, 28, 18],
            [-33, -65, 38, 36],
            [-34, -34, 42, 34]
          ]
        ]
      ],
      [
        "hit-stomach-3",
        [
          [
            [149, 3287, 71, 78],
            [47, 75]
          ],
          PushBox.IDLE,
          [
            [-17, 82, 28, 18],
            [-41, -59, 38, 30],
            [-34, -34, 42, 34]
          ]
        ]
      ],
      [
        "hit-stomach-4",
        [
          [
            [231, 3293, 75, 72],
            [50, 69]
          ],
          PushBox.IDLE,
          [
            [-28, -67, 28, 18],
            [-41, -59, 38, 30],
            [-40, -34, 42, 34]
          ]
        ]
      ],
      [
        // Stunned
        "stun-1",
        [
          [
            [149, 3370, 77, 87],
            [28, 85]
          ],
          PushBox.IDLE,
          [
            [8, -87, 28, 18],
            [-16, -75, 40, 46],
            [-26, -31, 40, 32]
          ]
        ]
      ],
      [
        "stun-2",
        [
          [
            [77, 3368, 65, 89],
            [28, 87]
          ],
          PushBox.IDLE,
          [
            [-9, -89, 28, 18],
            [-23, -75, 40, 46],
            [-26, -31, 40, 32]
          ]
        ]
      ],
      [
        "stun-3",
        [
          [
            [1, 3367, 67, 90],
            [35, 88]
          ],
          PushBox.IDLE,
          [
            [-22, -91, 28, 18],
            [-30, -72, 42, 40],
            [-26, -31, 40, 32]
          ]
        ]
      ],
      // Ha doo ken
      [
        "special-1",
        [
          [
            [3, 2741, 74, 90],
            [28, 89]
          ],
          PushBox.IDLE,
          HurtBox.IDLE
        ]
      ],
      [
        "special-2",
        [
          [
            [91, 2747, 85, 83],
            [25, 83]
          ],
          PushBox.IDLE,
          HurtBox.IDLE
        ]
      ],
      [
        "special-3",
        [
          [
            [188, 2750, 90, 81],
            [25, 80]
          ],
          PushBox.IDLE,
          HurtBox.PUNCH
        ]
      ],
      [
        "special-4",
        [
          [
            [293, 2754, 106, 77],
            [23, 76]
          ],
          PushBox.IDLE,
          [
            [38, -79, 26, 18],
            [21, -65, 40, 38],
            [-12, -30, 78, 30]
          ]
        ]
      ],
      // Victor
      [
        "victory-1",
        [
          [
            [71, 3625, 60, 89],
            [30, 88]
          ],
          PushBox.IDLE,
          HurtBox.IDLE
        ]
      ],
      [
        "victory-2",
        [
          [
            [140, 3617, 60, 97],
            [30, 96]
          ],
          PushBox.IDLE,
          HurtBox.IDLE
        ]
      ],
      [
        "victory-3",
        [
          [
            [207, 3601, 57, 113],
            [33, 112]
          ],
          PushBox.IDLE,
          HurtBox.IDLE
        ]
      ],
      [
        "victory-4",
        [
          [
            [272, 3616, 56, 99],
            [34, 98]
          ],
          PushBox.IDLE,
          HurtBox.IDLE
        ]
      ],
      [
        "victory-5",
        [
          [
            [344, 3622, 61, 94],
            [32, 92]
          ],
          PushBox.IDLE,
          HurtBox.IDLE
        ]
      ],
      // Falling
      [
        "fall-1",
        [
          [
            [1, 3504, 82, 68],
            [50, 80]
          ],
          PushBox.IDLE,
          HurtBox.INVINCLIBLE
        ]
      ],
      [
        "fall-2",
        [
          [
            [84, 3460, 102, 45],
            [50, 80]
          ],
          PushBox.IDLE,
          HurtBox.INVINCLIBLE
        ]
      ],
      [
        "fall-3",
        [
          [
            [188, 3465, 77, 80],
            [40, 80]
          ],
          PushBox.IDLE,
          HurtBox.INVINCLIBLE
        ]
      ],
      [
        "fall-4",
        [
          [
            [340, 3477, 124, 48],
            [60, 45]
          ],
          PushBox.IDLE,
          HurtBox.INVINCLIBLE
        ]
      ],
      [
        "fall-5",
        [
          [
            [709, 3568, 128, 31],
            [60, 30]
          ],
          PushBox.IDLE,
          HurtBox.INVINCLIBLE
        ]
      ]
    ]);
    animations = {
      [FighterState.JUMP_START]: [
        ["jump-start/land", 3],
        ["jump-start/land", FrameDelay.TRANSITION]
      ],
      [FighterState.JUMP_LAND]: [
        ["jump-start/land", 2],
        ["jump-start/land", 5],
        ["jump-start/land", FrameDelay.TRANSITION]
      ],
      [FighterState.JUMP_FORWARD]: [
        ["jump-roll-1", 13],
        ["jump-roll-2", 5],
        ["jump-roll-3", 3],
        ["jump-roll-4", 3],
        ["jump-roll-5", 3],
        ["jump-roll-6", 5],
        ["jump-roll-7", FrameDelay.FREEZE]
      ],
      [FighterState.JUMP_BACKWARD]: [
        ["jump-roll-7", 15],
        ["jump-roll-6", 3],
        ["jump-roll-5", 3],
        ["jump-roll-4", 3],
        ["jump-roll-3", 3],
        ["jump-roll-2", 3],
        ["jump-roll-1", FrameDelay.FREEZE]
      ],
      [FighterState.IDLE]: [
        ["idle-1", 4],
        ["idle-2", 4],
        ["idle-3", 4],
        ["idle-4", 4],
        ["idle-3", 4],
        ["idle-2", 4]
      ],
      [FighterState.WALK_FORWARD]: [
        ["forwards-1", 3],
        ["forwards-2", 6],
        ["forwards-3", 4],
        ["forwards-4", 4],
        ["forwards-5", 4],
        ["forwards-6", 6]
      ],
      [FighterState.WALK_BACKWARD]: [
        ["backwards-1", 3],
        ["backwards-2", 6],
        ["backwards-3", 4],
        ["backwards-4", 4],
        ["backwards-5", 4],
        ["backwards-6", 6]
      ],
      [FighterState.JUMP_UP]: [
        ["jump-up-1", 8],
        ["jump-up-2", 8],
        ["jump-up-3", 8],
        ["jump-up-4", 8],
        ["jump-up-5", 8],
        ["jump-up-6", FrameDelay.FREEZE]
      ],
      [FighterState.CROUCH_DOWN]: [
        ["crouch-1", 2],
        ["crouch-2", 2],
        ["crouch-3", 2],
        ["crouch-3", FrameDelay.TRANSITION]
      ],
      [FighterState.CROUCH]: [["crouch-3", FrameDelay.TRANSITION]],
      [FighterState.CROUCH_UP]: [
        ["crouch-3", 2],
        ["crouch-2", 2],
        ["crouch-1", 2],
        ["crouch-1", FrameDelay.TRANSITION]
      ],
      [FighterState.IDLE_TURN]: [
        ["idle-turn-3", 2],
        ["idle-turn-2", 2],
        ["idle-turn-1", 2],
        ["idle-turn-1", FrameDelay.TRANSITION]
      ],
      [FighterState.CROUCH_TURN]: [
        ["crouch-turn-3", 2],
        ["crouch-turn-2", 2],
        ["crouch-turn-1", 2],
        ["crouch-turn-1", FrameDelay.TRANSITION]
      ],
      [FighterState.LIGHT_PUNCH]: [
        ["light-punch-1", 2],
        ["light-punch-2", 4],
        ["light-punch-1", 4],
        ["light-punch-1", FrameDelay.TRANSITION]
      ],
      [FighterState.MEDIUM_PUNCH]: [
        ["med-punch-1", 1],
        ["med-punch-2", 2],
        ["med-punch-3", 4],
        ["med-punch-2", 3],
        ["med-punch-1", 3],
        ["med-punch-1", FrameDelay.TRANSITION]
      ],
      [FighterState.HEAVY_PUNCH]: [
        ["med-punch-1", 3],
        ["med-punch-2", 2],
        ["heavy-punch-1", 6],
        ["med-punch-2", 10],
        ["med-punch-1", 12],
        ["med-punch-1", FrameDelay.TRANSITION]
      ],
      [FighterState.LIGHT_KICK]: [
        ["med-punch-1", 3],
        ["light-kick-1", 3],
        ["light-kick-2", 8],
        ["light-kick-1", 4],
        ["med-punch-1", 1],
        ["med-punch-1", FrameDelay.TRANSITION]
      ],
      [FighterState.MEDIUM_KICK]: [
        ["med-punch-1", 5],
        ["light-kick-1", 6],
        ["med-kick-1", 12],
        ["light-kick-1", 7],
        ["light-kick-1", FrameDelay.TRANSITION]
      ],
      [FighterState.HEAVY_KICK]: [
        ["heavy-kick-1", 2],
        ["heavy-kick-2", 4],
        ["heavy-kick-3", 8],
        ["heavy-kick-4", 10],
        ["heavy-kick-5", 7],
        ["heavy-kick-5", FrameDelay.TRANSITION]
      ],
      [FighterState.HURT_HEAD_LIGHT]: [
        ["hit-face-1", FighterStruckDelay],
        ["hit-face-1", 3],
        ["hit-face-2", 8],
        ["hit-face-2", FrameDelay.TRANSITION]
      ],
      [FighterState.HURT_HEAD_MEDIUM]: [
        ["hit-face-1", FighterStruckDelay],
        ["hit-face-1", 3],
        ["hit-face-2", 4],
        ["hit-face-3", 9],
        ["hit-face-3", FrameDelay.TRANSITION]
      ],
      [FighterState.HURT_HEAD_HEAVY]: [
        ["hit-face-3", FighterStruckDelay],
        ["hit-face-3", 7],
        ["hit-face-4", 4],
        ["stun-3", 9],
        ["stun-3", FrameDelay.TRANSITION]
      ],
      [FighterState.HURT_BODY_LIGHT]: [
        ["hit-stomach-1", FighterStruckDelay],
        ["hit-stomach-1", 11],
        ["hit-stomach-1", FrameDelay.TRANSITION]
      ],
      [FighterState.HURT_BODY_MEDIUM]: [
        ["hit-stomach-1", FighterStruckDelay],
        ["hit-stomach-1", 7],
        ["hit-stomach-2", 9],
        ["hit-stomach-2", FrameDelay.TRANSITION]
      ],
      [FighterState.HURT_BODY_HEAVY]: [
        ["hit-stomach-2", FighterStruckDelay],
        ["hit-stomach-2", 3],
        ["hit-stomach-3", 4],
        ["hit-stomach-4", 4],
        ["stun-3", 9],
        ["stun-3", FrameDelay.TRANSITION]
      ],
      [FighterState.SPECIAL_1_LIGHT]: [
        ["special-1", 2],
        ["special-2", 8],
        ["special-3", 2],
        ["special-4", 40],
        ["special-4", FrameDelay.TRANSITION]
      ],
      [FighterState.SPECIAL_1_MEDIUM]: [
        ["special-1", 4],
        ["special-2", 10],
        ["special-3", 4],
        ["special-4", 46],
        ["special-4", FrameDelay.TRANSITION]
      ],
      [FighterState.SPECIAL_1_HEAVY]: [
        ["special-1", 5],
        ["special-2", 10],
        ["special-3", 5],
        ["special-4", 60],
        ["special-4", FrameDelay.TRANSITION]
      ],
      [FighterState.VICTORY]: [
        ["idle-1", 60],
        ["victory-1", 20],
        ["victory-2", 10],
        ["victory-3", 15],
        ["victory-4", 15],
        ["victory-5", FrameDelay.FREEZE]
      ],
      [FighterState.KO]: [
        ["hit-stomach-2", 9],
        ["fall-1", 15],
        ["fall-2", FrameDelay.FREEZE],
        ["fall-3", 12],
        ["fall-4", 15],
        ["fall-5", FrameDelay.FREEZE]
      ]
    };
    specialMoves = [
      {
        state: FighterState.SPECIAL_1_LIGHT,
        sequence: [
          SpecialMovesControls.DOWN,
          SpecialMovesControls.FORWARD_DOWN,
          SpecialMovesControls.FORWARD,
          SpecialMovesControls.LIGHT_PUNCH
        ],
        cursor: 0
      },
      {
        state: FighterState.SPECIAL_1_MEDIUM,
        sequence: [
          SpecialMovesControls.DOWN,
          SpecialMovesControls.FORWARD_DOWN,
          SpecialMovesControls.FORWARD,
          SpecialMovesControls.MEDIUM_PUNCH
        ],
        cursor: 0
      },
      {
        state: FighterState.SPECIAL_1_HEAVY,
        sequence: [
          SpecialMovesControls.DOWN,
          SpecialMovesControls.FORWARD_DOWN,
          SpecialMovesControls.FORWARD,
          SpecialMovesControls.HEAVY_PUNCH
        ],
        cursor: 0
      }
    ];
    initialVelocity = {
      x: {
        [FighterState.WALK_FORWARD]: 3 * 60,
        [FighterState.WALK_BACKWARD]: -(2 * 60),
        [FighterState.JUMP_FORWARD]: 168,
        [FighterState.JUMP_BACKWARD]: -180,
        [FighterState.JUMP_UP]: 0
      },
      jump: -420
    };
    gravity = 1e3;
    constructor(playerId, onAttackHit, entityList) {
      super(playerId, onAttackHit, entityList);
      this.states[FighterState.SPECIAL_1_LIGHT] = {
        attackStrength: FighterAttackStrength.LIGHT,
        init: this.handleHadoukenInit,
        update: this.handleHadouken,
        shadow: [1.6, 1, 22, 0],
        validFrom: [
          FighterState.IDLE,
          FighterState.IDLE_TURN,
          FighterState.WALK_FORWARD,
          FighterState.CROUCH_UP,
          FighterState.CROUCH_DOWN,
          FighterState.CROUCH,
          FighterState.CROUCH_TURN,
          FighterState.LIGHT_PUNCH,
          FighterState.MEDIUM_PUNCH,
          FighterState.HEAVY_PUNCH
        ]
      };
      this.states[FighterState.SPECIAL_1_MEDIUM] = {
        attackStrength: FighterAttackStrength.MEDIUM,
        init: this.handleHadoukenInit,
        update: this.handleHadouken,
        shadow: [1.6, 1, 22, 0],
        validFrom: [
          FighterState.IDLE,
          FighterState.IDLE_TURN,
          FighterState.WALK_FORWARD,
          FighterState.CROUCH_UP,
          FighterState.CROUCH_DOWN,
          FighterState.CROUCH,
          FighterState.CROUCH_TURN,
          FighterState.LIGHT_PUNCH,
          FighterState.MEDIUM_PUNCH,
          FighterState.HEAVY_PUNCH
        ]
      };
      this.states[FighterState.SPECIAL_1_HEAVY] = {
        attackStrength: FighterAttackStrength.HEAVY,
        init: this.handleHadoukenInit,
        update: this.handleHadouken,
        shadow: [1.6, 1, 22, 0],
        validFrom: [
          FighterState.IDLE,
          FighterState.IDLE_TURN,
          FighterState.WALK_FORWARD,
          FighterState.CROUCH_UP,
          FighterState.CROUCH_DOWN,
          FighterState.CROUCH,
          FighterState.CROUCH_TURN,
          FighterState.LIGHT_PUNCH,
          FighterState.MEDIUM_PUNCH,
          FighterState.HEAVY_PUNCH
        ]
      };
      this.states[FighterState.IDLE].validFrom = [
        ...this.states[FighterState.IDLE].validFrom,
        FighterState.SPECIAL_1_LIGHT,
        FighterState.SPECIAL_1_MEDIUM,
        FighterState.SPECIAL_1_HEAVY
      ];
    }
    handleHadoukenInit = () => {
      this.resetVelocities();
      this.fireballFired = false;
      playSound(this.soundHadouken);
    };
    handleHadouken = (time) => {
      if (this.animationFrame === 3 && !this.fireballFired) {
        this.entityList.add(
          Fireball,
          this,
          this.states[this.currentState].attackStrength,
          time
        );
        this.fireballFired = true;
      }
      if (!this.isAnimationCompleted())
        return;
      this.fireballFired = false;
      this.changeState(FighterState.IDLE, time);
    };
  };

  // src/entitites/fighters/Ryu.js
  var Ryu = class extends Fighter {
    image = document.getElementById("RyuImage");
    soundHadouken = document.getElementById(soundHadoukenId[FighterId.RYU]);
    fireballFired = false;
    fireballInstance = void 0;
    frames = /* @__PURE__ */ new Map([
      // IDLE
      [
        "idle-1",
        [
          [
            [75, 14, 60, 89],
            [34, 86]
          ],
          PushBox.IDLE,
          HurtBox.IDLE
        ]
      ],
      [
        "idle-2",
        [
          [
            [7, 14, 59, 90],
            [33, 87]
          ],
          PushBox.IDLE,
          HurtBox.IDLE
        ]
      ],
      [
        "idle-3",
        [
          [
            [142, 13, 59, 90],
            [33, 88]
          ],
          PushBox.IDLE,
          HurtBox.IDLE
        ]
      ],
      [
        "idle-4",
        [
          [
            [211, 10, 55, 93],
            [31, 90]
          ],
          PushBox.IDLE,
          HurtBox.IDLE
        ]
      ],
      [
        // Forward
        "forwards-1",
        [
          [
            [9, 136, 53, 83],
            [27, 81]
          ],
          PushBox.IDLE,
          HurtBox.FORWARD
        ]
      ],
      [
        "forwards-2",
        [
          [
            [78, 131, 60, 88],
            [35, 86]
          ],
          PushBox.IDLE,
          HurtBox.FORWARD
        ]
      ],
      [
        "forwards-3",
        [
          [
            [152, 128, 64, 92],
            [35, 89]
          ],
          PushBox.IDLE,
          HurtBox.FORWARD
        ]
      ],
      [
        "forwards-4",
        [
          [
            [229, 130, 63, 90],
            [29, 89]
          ],
          PushBox.IDLE,
          HurtBox.FORWARD
        ]
      ],
      [
        "forwards-5",
        [
          [
            [307, 128, 54, 91],
            [25, 89]
          ],
          PushBox.IDLE,
          HurtBox.FORWARD
        ]
      ],
      [
        "forwards-6",
        [
          [
            [371, 128, 50, 89],
            [25, 86]
          ],
          PushBox.IDLE,
          HurtBox.FORWARD
        ]
      ],
      // Backward
      [
        "backwards-1",
        [
          [
            [777, 128, 61, 87],
            [35, 85]
          ],
          PushBox.IDLE,
          HurtBox.BACKWARD
        ]
      ],
      [
        "backwards-2",
        [
          [
            [430, 124, 59, 90],
            [36, 87]
          ],
          PushBox.IDLE,
          HurtBox.BACKWARD
        ]
      ],
      [
        "backwards-3",
        [
          [
            [495, 124, 57, 90],
            [36, 88]
          ],
          PushBox.IDLE,
          HurtBox.BACKWARD
        ]
      ],
      [
        "backwards-4",
        [
          [
            [559, 124, 58, 90],
            [38, 89]
          ],
          PushBox.IDLE,
          HurtBox.BACKWARD
        ]
      ],
      [
        "backwards-5",
        [
          [
            [631, 125, 58, 91],
            [36, 88]
          ],
          PushBox.IDLE,
          HurtBox.BACKWARD
        ]
      ],
      [
        "backwards-6",
        [
          [
            [707, 126, 57, 89],
            [36, 87]
          ],
          PushBox.IDLE,
          HurtBox.BACKWARD
        ]
      ],
      [
        "jump-start/land",
        [
          [
            [7, 268, 55, 85],
            [29, 83]
          ],
          PushBox.IDLE,
          HurtBox.IDLE
        ]
      ],
      [
        "jump-up-1",
        [
          [
            [67, 244, 56, 104],
            [32, 107]
          ],
          PushBox.JUMP,
          HurtBox.JUMP
        ]
      ],
      [
        "jump-up-2",
        [
          [
            [138, 233, 50, 89],
            [24, 103]
          ],
          PushBox.JUMP,
          HurtBox.JUMP
        ]
      ],
      [
        "jump-up-3",
        [
          [
            [197, 233, 54, 77],
            [25, 103]
          ],
          PushBox.JUMP,
          HurtBox.JUMP
        ]
      ],
      [
        "jump-up-4",
        [
          [
            [259, 240, 48, 70],
            [28, 101]
          ],
          PushBox.JUMP,
          HurtBox.JUMP
        ]
      ],
      [
        "jump-up-5",
        [
          [
            [319, 234, 48, 89],
            [25, 106]
          ],
          PushBox.JUMP,
          HurtBox.JUMP
        ]
      ],
      [
        "jump-up-6",
        [
          [
            [375, 244, 55, 109],
            [31, 113]
          ],
          PushBox.JUMP,
          HurtBox.JUMP
        ]
      ],
      // Jump Roll
      [
        "jump-roll-1",
        [
          [
            [375, 244, 55, 109],
            [25, 106]
          ],
          PushBox.JUMP,
          [
            [-11, -106, 24, 16],
            [-26, -90, 40, 42],
            [-26, -31, 40, 32]
          ]
        ]
      ],
      [
        "jump-roll-2",
        [
          [
            [442, 261, 61, 78],
            [22, 90]
          ],
          PushBox.JUMP,
          [
            [17, -90, 24, 16],
            [-14, -91, 40, 42],
            [-22, -66, 38, 18]
          ]
        ]
      ],
      [
        "jump-roll-3",
        [
          [
            [507, 259, 104, 42],
            [61, 76]
          ],
          PushBox.JUMP,
          [
            [22, -51, 24, 16],
            [-14, -81, 40, 42],
            [-22, -66, 38, 18]
          ]
        ]
      ],
      [
        "jump-roll-4",
        [
          [
            [617, 240, 53, 82],
            [42, 111]
          ],
          PushBox.JUMP,
          [
            [-39, -46, 24, 16],
            [-30, -88, 40, 42],
            [-34, -118, 44, 48]
          ]
        ]
      ],
      [
        "jump-roll-5",
        [
          [
            [676, 257, 122, 44],
            [71, 81]
          ],
          PushBox.JUMP,
          [
            [-72, -56, 24, 16],
            [-54, -77, 52, 40],
            [-14, -82, 48, 34]
          ]
        ]
      ],
      [
        "jump-roll-6",
        [
          [
            [804, 258, 71, 87],
            [53, 98]
          ],
          PushBox.JUMP,
          [
            [-55, -100, 24, 16],
            [-48, -87, 44, 38],
            [-22, -66, 38, 18]
          ]
        ]
      ],
      [
        "jump-roll-7",
        [
          [
            [883, 261, 54, 109],
            [31, 113]
          ],
          PushBox.JUMP,
          [
            [-11, -106, 24, 16],
            [-26, -90, 40, 42],
            [-26, -31, 40, 32]
          ]
        ]
      ],
      // Crouch
      [
        "crouch-1",
        [
          [
            [551, 21, 53, 83],
            [27, 81]
          ],
          PushBox.IDLE,
          HurtBox.IDLE
        ]
      ],
      [
        "crouch-2",
        [
          [
            [611, 36, 57, 69],
            [25, 66]
          ],
          PushBox.BEND,
          HurtBox.BEND
        ]
      ],
      [
        "crouch-3",
        [
          [
            [679, 44, 61, 61],
            [25, 58]
          ],
          PushBox.CROUCH,
          HurtBox.CROUCH
        ]
      ],
      // Stand Turn
      [
        "idle-turn-1",
        [
          [
            [348, 8, 54, 95],
            [29, 92]
          ],
          PushBox.IDLE,
          [
            [-10, -89, 28, 18],
            [-14, -74, 40, 42],
            [-14, -31, 40, 32]
          ]
        ]
      ],
      [
        "idle-turn-2",
        [
          [
            [414, 6, 58, 97],
            [30, 94]
          ],
          PushBox.IDLE,
          [
            [-16, -96, 28, 18],
            [-14, -74, 40, 42],
            [-14, -31, 40, 32]
          ]
        ]
      ],
      [
        "idle-turn-3",
        [
          [
            [486, 10, 54, 94],
            [27, 90]
          ],
          PushBox.IDLE,
          [
            [-16, -96, 28, 18],
            [-14, -74, 40, 42],
            [-14, -31, 40, 32]
          ]
        ]
      ],
      // Crouch Turn
      [
        "crouch-turn-1",
        [
          [
            [751, 46, 53, 61],
            [26, 58]
          ],
          PushBox.CROUCH,
          [
            [-7, -60, 24, 18],
            [-28, -46, 44, 24],
            [-28, -24, 44, 24]
          ]
        ]
      ],
      [
        "crouch-turn-2",
        [
          [
            [816, 46, 52, 61],
            [27, 58]
          ],
          PushBox.CROUCH,
          [
            [-7, -60, 24, 18],
            [-28, -46, 44, 24],
            [-28, -24, 44, 24]
          ]
        ]
      ],
      [
        "crouch-turn-3",
        [
          [
            [878, 46, 53, 61],
            [29, 58]
          ],
          PushBox.CROUCH,
          [
            [-26, -61, 24, 18],
            [-28, -46, 44, 24],
            [-28, -24, 44, 24]
          ]
        ]
      ],
      // Light Punch
      [
        "light-punch-1",
        [
          [
            [9, 365, 64, 91],
            [32, 88]
          ],
          PushBox.IDLE,
          HurtBox.IDLE
        ]
      ],
      [
        "light-punch-2",
        [
          [
            [98, 365, 92, 91],
            [32, 88]
          ],
          PushBox.IDLE,
          HurtBox.IDLE,
          [11, -85, 50, 18]
        ]
      ],
      // Medium/Heavy Punch
      [
        "med-punch-1",
        [
          [
            [6, 466, 60, 94],
            [29, 92]
          ],
          PushBox.IDLE,
          HurtBox.IDLE
        ]
      ],
      [
        "med-punch-2",
        [
          [
            [86, 465, 74, 95],
            [29, 92]
          ],
          PushBox.IDLE,
          HurtBox.PUNCH
        ]
      ],
      [
        "med-punch-3",
        [
          [
            [175, 465, 108, 94],
            [24, 92]
          ],
          PushBox.IDLE,
          HurtBox.PUNCH,
          [17, -85, 68, 14]
        ]
      ],
      // Heavy Punch
      [
        "heavy-punch-1",
        [
          [
            [175, 465, 108, 94],
            [24, 92]
          ],
          PushBox.IDLE,
          HurtBox.PUNCH,
          [17, -85, 76, 14]
        ]
      ],
      // Light/Medium Kick
      [
        "light-kick-1",
        [
          [
            [87, 923, 66, 92],
            [46, 93]
          ],
          PushBox.IDLE,
          [
            [-33, -96, 30, 18],
            [-41, -79, 42, 38],
            [-32, -52, 44, 50]
          ]
        ]
      ],
      [
        "light-kick-2",
        [
          [
            [162, 922, 114, 94],
            [68, 95]
          ],
          PushBox.IDLE,
          [
            [-65, -96, 30, 18],
            [-57, -79, 42, 38],
            [-32, -52, 44, 50]
          ],
          [-17, -98, 66, 28]
        ]
      ],
      // Medium Kick
      [
        "med-kick-1",
        [
          [
            [162, 922, 114, 94],
            [68, 95]
          ],
          PushBox.IDLE,
          [
            [-65, -96, 30, 18],
            [-57, -79, 42, 38],
            [-32, -52, 44, 50]
          ],
          [-18, -98, 80, 28]
        ]
      ],
      // Heavy Kick
      [
        "heavy-kick-1",
        [
          [
            [5, 1196, 61, 90],
            [37, 87]
          ],
          PushBox.IDLE,
          [
            [-41, -78, 20, 20],
            [-25, -78, 42, 42],
            [-11, -50, 42, 50]
          ]
        ]
      ],
      [
        "heavy-kick-2",
        [
          [
            [72, 1192, 94, 94],
            [44, 91]
          ],
          PushBox.IDLE,
          [
            [12, -90, 34, 34],
            [-25, -78, 42, 42],
            [-11, -50, 42, 50]
          ],
          [15, -99, 40, 32]
        ]
      ],
      [
        "heavy-kick-3",
        [
          [
            [176, 1191, 120, 94],
            [42, 91]
          ],
          PushBox.IDLE,
          [
            [13, -91, 62, 34],
            [-25, -78, 42, 42],
            [-11, -50, 42, 50]
          ],
          [21, -97, 62, 24]
        ]
      ],
      [
        "heavy-kick-4",
        [
          [
            [306, 1208, 101, 77],
            [39, 74]
          ],
          PushBox.IDLE,
          [
            [-41, -78, 20, 20],
            [-25, -78, 42, 42],
            [-11, -50, 42, 50]
          ]
        ]
      ],
      [
        "heavy-kick-5",
        [
          [
            [418, 1204, 64, 81],
            [38, 78]
          ],
          PushBox.IDLE,
          [
            [-41, -78, 20, 20],
            [-25, -78, 42, 42],
            [-11, -50, 42, 50]
          ]
        ]
      ],
      // Hit Face
      [
        "hit-face-1",
        [
          [
            [169, 2152, 62, 90],
            [41, 87]
          ],
          PushBox.IDLE,
          [
            [-25, -89, 20, 20],
            [-33, -74, 40, 46],
            [-30, -37, 40, 38]
          ]
        ]
      ],
      [
        "hit-face-2",
        [
          [
            [238, 2153, 68, 89],
            [47, 86]
          ],
          PushBox.IDLE,
          [
            [-42, -88, 20, 20],
            [-46, -74, 40, 46],
            [-33, -37, 40, 38]
          ]
        ]
      ],
      [
        "hit-face-3",
        [
          [
            [314, 2153, 72, 88],
            [53, 85]
          ],
          PushBox.IDLE,
          [
            [-52, -87, 20, 20],
            [-53, -71, 40, 46],
            [-33, -37, 40, 38]
          ]
        ]
      ],
      [
        "hit-face-4",
        [
          [
            [314, 2153, 72, 88],
            [53, 85]
          ],
          PushBox.IDLE,
          [
            [-52, -87, 20, 20],
            [-53, -71, 40, 46],
            [-33, -37, 40, 38]
          ]
        ]
      ],
      // Hit Stomach
      [
        "hit-stomach-1",
        [
          [
            [398, 2156, 58, 85],
            [37, 83]
          ],
          PushBox.IDLE,
          [
            [-15, -85, 28, 18],
            [-31, -69, 42, 42],
            [-30, -34, 42, 34]
          ]
        ]
      ],
      [
        "hit-stomach-2",
        [
          [
            [470, 2160, 66, 82],
            [41, 80]
          ],
          PushBox.IDLE,
          [
            [-17, 82, 28, 18],
            [-33, -65, 38, 36],
            [-34, -34, 42, 34]
          ]
        ]
      ],
      [
        "hit-stomach-3",
        [
          [
            [544, 2167, 68, 84],
            [40, 81]
          ],
          PushBox.IDLE,
          [
            [-17, 82, 28, 18],
            [-41, -59, 38, 30],
            [-34, -34, 42, 34]
          ]
        ]
      ],
      [
        "hit-stomach-4",
        [
          [
            [544, 2167, 68, 84],
            [40, 81]
          ],
          PushBox.IDLE,
          [
            [-17, 82, 28, 18],
            [-41, -59, 38, 30],
            [-34, -34, 42, 34]
          ]
        ]
      ],
      // Stunned
      [
        "stun-1",
        [
          [
            [7, 2047, 77, 87],
            [28, 85]
          ],
          PushBox.IDLE,
          [
            [8, -87, 28, 18],
            [-16, -75, 40, 46],
            [-26, -31, 40, 32]
          ]
        ]
      ],
      [
        "stun-2",
        [
          [
            [93, 2045, 65, 89],
            [28, 87]
          ],
          PushBox.IDLE,
          [
            [-9, -89, 28, 18],
            [-23, -75, 40, 46],
            [-26, -31, 40, 32]
          ]
        ]
      ],
      [
        "stun-3",
        [
          [
            [170, 2044, 67, 90],
            [35, 88]
          ],
          PushBox.IDLE,
          [
            [-22, -91, 28, 18],
            [-30, -72, 42, 40],
            [-26, -31, 40, 32]
          ]
        ]
      ],
      // Ha dooo ken
      [
        "special-1",
        [
          [
            [16, 1790, 74, 90],
            [28, 89]
          ],
          PushBox.IDLE,
          HurtBox.IDLE
        ]
      ],
      [
        "special-2",
        [
          [
            [111, 1796, 85, 84],
            [25, 83]
          ],
          PushBox.IDLE,
          HurtBox.IDLE
        ]
      ],
      [
        "special-3",
        [
          [
            [209, 1798, 90, 83],
            [25, 82]
          ],
          PushBox.IDLE,
          HurtBox.PUNCH
        ]
      ],
      [
        "special-4",
        [
          [
            [314, 1804, 106, 77],
            [23, 76]
          ],
          PushBox.IDLE,
          [
            [38, -79, 26, 18],
            [21, -65, 40, 38],
            [-12, -30, 78, 30]
          ]
        ]
      ],
      // VICTORY
      [
        "victory-1",
        [
          [
            [431, 1929, 60, 88],
            [30, 87]
          ],
          PushBox.IDLE,
          HurtBox.IDLE
        ]
      ],
      [
        "victory-2",
        [
          [
            [503, 1920, 60, 97],
            [30, 95]
          ],
          PushBox.IDLE,
          HurtBox.IDLE
        ]
      ],
      [
        "victory-3",
        [
          [
            [576, 1894, 55, 122],
            [34, 120]
          ],
          PushBox.IDLE,
          HurtBox.IDLE
        ]
      ],
      [
        "victory-4",
        [
          [
            [637, 1903, 57, 113],
            [32, 111]
          ],
          PushBox.IDLE,
          HurtBox.IDLE
        ]
      ],
      // Falling
      [
        "fall-1",
        [
          [
            [636, 2164, 82, 77],
            [50, 80]
          ],
          PushBox.IDLE,
          HurtBox.INVINCLIBLE
        ]
      ],
      [
        "fall-2",
        [
          [
            [726, 2197, 102, 45],
            [50, 80]
          ],
          PushBox.IDLE,
          HurtBox.INVINCLIBLE
        ]
      ],
      [
        "fall-3",
        [
          [
            [828, 2164, 78, 80],
            [40, 80]
          ],
          PushBox.IDLE,
          HurtBox.INVINCLIBLE
        ]
      ],
      [
        "fall-4",
        [
          [
            [911, 2193, 120, 53],
            [60, 45]
          ],
          PushBox.IDLE,
          HurtBox.INVINCLIBLE
        ]
      ],
      [
        "fall-5",
        [
          [
            [1040, 2217, 128, 31],
            [60, 30]
          ],
          PushBox.IDLE,
          HurtBox.INVINCLIBLE
        ]
      ]
    ]);
    animations = {
      [FighterState.JUMP_START]: [
        ["jump-start/land", 3],
        ["jump-start/land", FrameDelay.TRANSITION]
      ],
      [FighterState.JUMP_LAND]: [
        ["jump-start/land", 2],
        ["jump-start/land", 5],
        ["jump-start/land", FrameDelay.TRANSITION]
      ],
      [FighterState.JUMP_FORWARD]: [
        ["jump-roll-1", 13],
        ["jump-roll-2", 5],
        ["jump-roll-3", 3],
        ["jump-roll-4", 3],
        ["jump-roll-5", 3],
        ["jump-roll-6", 5],
        ["jump-roll-7", FrameDelay.FREEZE]
      ],
      [FighterState.JUMP_BACKWARD]: [
        ["jump-roll-7", 15],
        ["jump-roll-6", 3],
        ["jump-roll-5", 3],
        ["jump-roll-4", 3],
        ["jump-roll-3", 3],
        ["jump-roll-2", 3],
        ["jump-roll-1", FrameDelay.FREEZE]
      ],
      [FighterState.IDLE]: [
        ["idle-1", 4],
        ["idle-2", 4],
        ["idle-3", 4],
        ["idle-4", 4],
        ["idle-3", 4],
        ["idle-2", 4]
      ],
      [FighterState.WALK_FORWARD]: [
        ["forwards-1", 3],
        ["forwards-2", 6],
        ["forwards-3", 4],
        ["forwards-4", 4],
        ["forwards-5", 4],
        ["forwards-6", 6]
      ],
      [FighterState.WALK_BACKWARD]: [
        ["backwards-1", 3],
        ["backwards-2", 6],
        ["backwards-3", 4],
        ["backwards-4", 4],
        ["backwards-5", 4],
        ["backwards-6", 6]
      ],
      [FighterState.JUMP_UP]: [
        ["jump-up-1", 8],
        ["jump-up-2", 8],
        ["jump-up-3", 8],
        ["jump-up-4", 8],
        ["jump-up-5", 8],
        ["jump-up-6", FrameDelay.FREEZE]
      ],
      [FighterState.CROUCH_DOWN]: [
        ["crouch-1", 2],
        ["crouch-2", 2],
        ["crouch-3", 2],
        ["crouch-3", FrameDelay.TRANSITION]
      ],
      [FighterState.CROUCH]: [["crouch-3", FrameDelay.TRANSITION]],
      [FighterState.CROUCH_UP]: [
        ["crouch-3", 2],
        ["crouch-2", 2],
        ["crouch-1", 2],
        ["crouch-1", FrameDelay.TRANSITION]
      ],
      [FighterState.IDLE_TURN]: [
        ["idle-turn-3", 2],
        ["idle-turn-2", 2],
        ["idle-turn-1", 2],
        ["idle-turn-1", FrameDelay.TRANSITION]
      ],
      [FighterState.CROUCH_TURN]: [
        ["crouch-turn-3", 2],
        ["crouch-turn-2", 2],
        ["crouch-turn-1", 2],
        ["crouch-turn-1", FrameDelay.TRANSITION]
      ],
      [FighterState.LIGHT_PUNCH]: [
        ["light-punch-1", 2],
        ["light-punch-2", 4],
        ["light-punch-1", 4],
        ["light-punch-1", FrameDelay.TRANSITION]
      ],
      [FighterState.MEDIUM_PUNCH]: [
        ["med-punch-1", 1],
        ["med-punch-2", 2],
        ["med-punch-3", 4],
        ["med-punch-2", 3],
        ["med-punch-1", 3],
        ["med-punch-1", FrameDelay.TRANSITION]
      ],
      [FighterState.HEAVY_PUNCH]: [
        ["med-punch-1", 3],
        ["med-punch-2", 2],
        ["heavy-punch-1", 6],
        ["med-punch-2", 10],
        ["med-punch-1", 12],
        ["med-punch-1", FrameDelay.TRANSITION]
      ],
      [FighterState.LIGHT_KICK]: [
        ["med-punch-1", 3],
        ["light-kick-1", 3],
        ["light-kick-2", 8],
        ["light-kick-1", 4],
        ["med-punch-1", 1],
        ["med-punch-1", FrameDelay.TRANSITION]
      ],
      [FighterState.MEDIUM_KICK]: [
        ["med-punch-1", 5],
        ["light-kick-1", 6],
        ["med-kick-1", 12],
        ["light-kick-1", 7],
        ["light-kick-1", FrameDelay.TRANSITION]
      ],
      [FighterState.HEAVY_KICK]: [
        ["heavy-kick-1", 2],
        ["heavy-kick-2", 4],
        ["heavy-kick-3", 8],
        ["heavy-kick-4", 10],
        ["heavy-kick-5", 7],
        ["heavy-kick-5", FrameDelay.TRANSITION]
      ],
      [FighterState.HURT_HEAD_LIGHT]: [
        ["hit-face-1", FighterStruckDelay],
        ["hit-face-1", 3],
        ["hit-face-2", 8],
        ["hit-face-2", FrameDelay.TRANSITION]
      ],
      [FighterState.HURT_HEAD_MEDIUM]: [
        ["hit-face-1", FighterStruckDelay],
        ["hit-face-1", 3],
        ["hit-face-2", 4],
        ["hit-face-3", 9],
        ["hit-face-3", FrameDelay.TRANSITION]
      ],
      [FighterState.HURT_HEAD_HEAVY]: [
        ["hit-face-3", FighterStruckDelay],
        ["hit-face-3", 7],
        ["hit-face-4", 4],
        ["stun-3", 9],
        ["stun-3", FrameDelay.TRANSITION]
      ],
      [FighterState.HURT_BODY_LIGHT]: [
        ["hit-stomach-1", FighterStruckDelay],
        ["hit-stomach-1", 11],
        ["hit-stomach-1", FrameDelay.TRANSITION]
      ],
      [FighterState.HURT_BODY_MEDIUM]: [
        ["hit-stomach-1", FighterStruckDelay],
        ["hit-stomach-1", 7],
        ["hit-stomach-2", 9],
        ["hit-stomach-2", FrameDelay.TRANSITION]
      ],
      [FighterState.HURT_BODY_HEAVY]: [
        ["hit-stomach-2", FighterStruckDelay],
        ["hit-stomach-2", 3],
        ["hit-stomach-3", 4],
        ["hit-stomach-4", 4],
        ["stun-3", 9],
        ["stun-3", FrameDelay.TRANSITION]
      ],
      [FighterState.SPECIAL_1_LIGHT]: [
        ["special-1", 2],
        ["special-2", 8],
        ["special-3", 2],
        ["special-4", 40],
        ["special-4", FrameDelay.TRANSITION]
      ],
      [FighterState.SPECIAL_1_MEDIUM]: [
        ["special-1", 4],
        ["special-2", 10],
        ["special-3", 4],
        ["special-4", 46],
        ["special-4", FrameDelay.TRANSITION]
      ],
      [FighterState.SPECIAL_1_HEAVY]: [
        ["special-1", 5],
        ["special-2", 10],
        ["special-3", 5],
        ["special-4", 60],
        ["special-4", FrameDelay.TRANSITION]
      ],
      [FighterState.VICTORY]: [
        ["idle-1", 60],
        ["victory-1", 20],
        ["victory-2", 10],
        ["victory-3", 15],
        ["victory-4", 15],
        ["victory-3", FrameDelay.FREEZE]
      ],
      [FighterState.KO]: [
        ["hit-stomach-2", 9],
        ["fall-1", 15],
        ["fall-2", FrameDelay.FREEZE],
        ["fall-3", 12],
        ["fall-4", 15],
        ["fall-5", FrameDelay.FREEZE]
      ]
    };
    initialVelocity = {
      x: {
        [FighterState.WALK_FORWARD]: 3 * 60,
        [FighterState.WALK_BACKWARD]: -(2 * 60),
        [FighterState.JUMP_FORWARD]: 168,
        [FighterState.JUMP_BACKWARD]: -180,
        [FighterState.JUMP_UP]: 0
      },
      jump: -420
    };
    specialMoves = [
      {
        state: FighterState.SPECIAL_1_LIGHT,
        sequence: [
          SpecialMovesControls.DOWN,
          SpecialMovesControls.FORWARD_DOWN,
          SpecialMovesControls.FORWARD,
          SpecialMovesControls.LIGHT_PUNCH
        ],
        cursor: 0
      },
      {
        state: FighterState.SPECIAL_1_MEDIUM,
        sequence: [
          SpecialMovesControls.DOWN,
          SpecialMovesControls.FORWARD_DOWN,
          SpecialMovesControls.FORWARD,
          SpecialMovesControls.MEDIUM_PUNCH
        ],
        cursor: 0
      },
      {
        state: FighterState.SPECIAL_1_HEAVY,
        sequence: [
          SpecialMovesControls.DOWN,
          SpecialMovesControls.FORWARD_DOWN,
          SpecialMovesControls.FORWARD,
          SpecialMovesControls.HEAVY_PUNCH
        ],
        cursor: 0
      }
    ];
    gravity = 1e3;
    constructor(playerId, onAttackHit, entityList) {
      super(playerId, onAttackHit, entityList);
      this.states[FighterState.SPECIAL_1_LIGHT] = {
        attackStrength: FighterAttackStrength.LIGHT,
        init: this.handleHadoukenInit,
        update: this.handleHadouken,
        shadow: [1.6, 1, 22, 0],
        validFrom: [
          FighterState.IDLE,
          FighterState.IDLE_TURN,
          FighterState.WALK_FORWARD,
          FighterState.CROUCH_UP,
          FighterState.CROUCH_DOWN,
          FighterState.CROUCH,
          FighterState.CROUCH_TURN,
          FighterState.LIGHT_PUNCH,
          FighterState.MEDIUM_PUNCH,
          FighterState.HEAVY_PUNCH
        ]
      };
      this.states[FighterState.SPECIAL_1_MEDIUM] = {
        attackStrength: FighterAttackStrength.MEDIUM,
        init: this.handleHadoukenInit,
        update: this.handleHadouken,
        shadow: [1.6, 1, 22, 0],
        validFrom: [
          FighterState.IDLE,
          FighterState.IDLE_TURN,
          FighterState.WALK_FORWARD,
          FighterState.CROUCH_UP,
          FighterState.CROUCH_DOWN,
          FighterState.CROUCH,
          FighterState.CROUCH_TURN,
          FighterState.LIGHT_PUNCH,
          FighterState.MEDIUM_PUNCH,
          FighterState.HEAVY_PUNCH
        ]
      };
      this.states[FighterState.SPECIAL_1_HEAVY] = {
        attackStrength: FighterAttackStrength.HEAVY,
        init: this.handleHadoukenInit,
        update: this.handleHadouken,
        shadow: [1.6, 1, 22, 0],
        validFrom: [
          FighterState.IDLE,
          FighterState.IDLE_TURN,
          FighterState.WALK_FORWARD,
          FighterState.CROUCH_UP,
          FighterState.CROUCH_DOWN,
          FighterState.CROUCH,
          FighterState.CROUCH_TURN,
          FighterState.LIGHT_PUNCH,
          FighterState.MEDIUM_PUNCH,
          FighterState.HEAVY_PUNCH
        ]
      };
      this.states[FighterState.IDLE].validFrom = [
        ...this.states[FighterState.IDLE].validFrom,
        FighterState.SPECIAL_1_LIGHT,
        FighterState.SPECIAL_1_MEDIUM,
        FighterState.SPECIAL_1_HEAVY
      ];
    }
    handleHadoukenInit = () => {
      this.resetVelocities();
      this.fireballFired = false;
      playSound(this.soundHadouken);
    };
    handleHadouken = (time) => {
      if (this.animationFrame === 3 && !this.fireballFired) {
        this.entityList.add(
          Fireball,
          this,
          this.states[this.currentState].attackStrength,
          time
        );
        this.fireballFired = true;
      }
      if (!this.isAnimationCompleted())
        return;
      this.fireballFired = false;
      this.changeState(FighterState.IDLE, time);
    };
  };

  // src/entitites/fighters/shared/Shadow.js
  var Shadow = class {
    constructor(fighter) {
      this.fighter = fighter;
      this.image = document.getElementById("ShadowImage");
      this.frame = [
        [0, 0, 43, 9],
        [21, 7]
      ];
    }
    getScale = () => {
      if (this.fighter.position.y < STAGE_FLOOR) {
        const scale = 1.2 - (200 - this.fighter.position.y) / 300;
        return [scale, scale, 0, 0];
      } else if (this.fighter.states[this.fighter.currentState].shadow) {
        const [scaleX, scaleY, offsetX, offsetY] = this.fighter.states[this.fighter.currentState].shadow;
        return [scaleX, scaleY, offsetX * this.fighter.direction * -1, offsetY];
      }
      return [1.2, 1.2, 0, 0];
    };
    update = () => {
    };
    draw = (context, camera) => {
      const [[x, y, width, height], [originX, originY]] = this.frame;
      const [scaleX, scaleY, offsetX, offsetY] = this.getScale() || [
        1.2,
        1.2,
        0,
        0
      ];
      context.globalAlpha = 0.5;
      context.drawImage(
        this.image,
        x,
        y,
        width,
        height,
        Math.floor(
          this.fighter.position.x - camera.position.x - originX * scaleX - offsetX
        ),
        Math.floor(STAGE_FLOOR - camera.position.y - originY * scaleY - offsetY),
        Math.floor(width * scaleX),
        Math.floor(height * scaleY)
      );
      context.globalAlpha = 1;
      context.setTransform(1, 0, 0, 1, 0, 0);
    };
  };

  // src/entitites/fighters/shared/HitSplash.js
  var HitSplash = class {
    constructor(x, y, playerId, entities) {
      this.entities = entities;
      this.position = { x, y };
      this.playerId = playerId;
      this.image = document.getElementById("Decals");
      this.frames = /* @__PURE__ */ new Map();
      this.animationFrame = 0;
      this.animationTimer = 0;
      this.hasSplashEnded = false;
    }
    update = (time) => {
      if (this.animationTimer + FRAME_TIME * 4 > time.previous)
        return;
      this.animationTimer = time.previous;
      this.animationFrame++;
      if (this.animationFrame >= this.frames[this.playerId].length)
        this.entities.remove(this);
    };
    draw = (context, camera) => {
      const [[sourceX, sourceY, sourceWidth, sourceHeight], [originX, originY]] = this.frames[this.playerId][this.animationFrame];
      context.drawImage(
        this.image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        Math.floor(this.position.x - camera.position.x - originX),
        Math.floor(this.position.y - camera.position.y - originY),
        sourceWidth,
        sourceHeight
      );
    };
  };

  // src/entitites/fighters/shared/HeavyHitSplash.js
  var HeavyHitSplash = class extends HitSplash {
    constructor(x, y, playerId, removeSplash) {
      super(x, y, playerId, removeSplash);
      this.frames = [
        //Plauer id =  1
        [
          [
            [14, 68, 15, 21],
            [7, 10]
          ],
          [
            [38, 70, 27, 23],
            [13, 11]
          ],
          [
            [73, 70, 27, 23],
            [13, 11]
          ],
          [
            [106, 66, 32, 31],
            [16, 15]
          ]
        ],
        // Player 2
        [
          [
            [160, 68, 15, 21],
            [7, 10]
          ],
          [
            [185, 70, 27, 23],
            [13, 11]
          ],
          [
            [222, 70, 27, 23],
            [13, 11]
          ],
          [
            [255, 66, 32, 31],
            [16, 15]
          ]
        ]
      ];
    }
    update() {
      super.update();
    }
    draw() {
      super.draw();
    }
  };

  // src/entitites/fighters/shared/MediumHitSplash.js
  var MediumHitSplash = class extends HitSplash {
    constructor(x, y, playerId, removeSplash) {
      super(x, y, playerId, removeSplash);
      this.frames = [
        //Plauer id =  1
        [
          [
            [13, 41, 14, 15],
            [7, 7]
          ],
          [
            [34, 39, 21, 19],
            [10, 9]
          ],
          [
            [64, 39, 21, 19],
            [10, 9]
          ],
          [
            [90, 35, 27, 25],
            [13, 12]
          ]
        ],
        // Player 2
        [
          [
            [159, 41, 14, 15],
            [7, 7]
          ],
          [
            [182, 39, 21, 19],
            [10, 9]
          ],
          [
            [211, 39, 21, 19],
            [10, 9]
          ],
          [
            [239, 35, 27, 25],
            [13, 12]
          ]
        ]
      ];
    }
    update() {
      super.update();
    }
    draw() {
      super.draw();
    }
  };

  // src/entitites/fighters/shared/LightHitSplash.js
  var LightHitSplash = class extends HitSplash {
    constructor(x, y, playerId, removeSplash) {
      super(x, y, playerId, removeSplash);
      this.frames = [
        //Plauer id =  1
        [
          [
            [14, 16, 9, 10],
            [6, 7]
          ],
          [
            [34, 15, 13, 11],
            [7, 7]
          ],
          [
            [55, 15, 13, 11],
            [7, 7]
          ],
          [
            [75, 10, 20, 19],
            [11, 11]
          ]
        ],
        // Player id = 2
        [
          [
            [160, 16, 9, 10],
            [6, 7]
          ],
          [
            [178, 15, 13, 11],
            [7, 7]
          ],
          [
            [199, 15, 13, 11],
            [7, 7]
          ],
          [
            [219, 10, 20, 19],
            [11, 11]
          ]
        ]
      ];
    }
    update() {
      super.update();
    }
    draw() {
      super.draw();
    }
  };

  // src/entitites/overlays/FpsCounter.js
  var FpsCounter = class {
    constructor() {
      this.fps = 0;
    }
    update(time) {
      this.fps = Math.trunc(1 / time.secondsPassed);
    }
    draw(context) {
      context.font = "10px Arial";
      context.fillStyle = "yellow";
      context.fillText(`FPS: ${this.fps}`, 10, 222);
    }
  };

  // src/states/fighterState.js
  var createDefaultFighterState = (id) => {
    return {
      instance: void 0,
      id,
      score: 1,
      battles: 0,
      hitPoints: HEALTH_MAX_HIT_POINTS
    };
  };

  // src/states/gameState.js
  var gameState = {
    fighters: [
      createDefaultFighterState(FighterId.RYU),
      createDefaultFighterState(FighterId.KEN)
    ]
  };
  window.SF_GAME_STATE = gameState;
  var resetGameState = () => {
    gameState = {
      fighters: [
        createDefaultFighterState(FighterId.RYU),
        createDefaultFighterState(FighterId.KEN)
      ]
    };
    window.SF_GAME_STATE = gameState;
  };

  // src/entitites/overlays/StatusBar.js
  var StatusBar = class {
    time = BATTLE_TIME;
    timeTimer = 0;
    timeFlashTimer = 0;
    useFlashFrames = false;
    koFlashTimer = 0;
    koFrame = 0;
    healthBars = [
      {
        timer: 0,
        hitPoints: 0
        //HEALTH_MAX_HIT_POINTS,
      },
      {
        timer: 0,
        hitPoints: 0
        //HEALTH_MAX_HIT_POINTS,
      }
    ];
    startingHealthRollUpDone = false;
    frames = /* @__PURE__ */ new Map([
      ["health-bar", [16, 18, 145, 11]],
      ["ko-white", [161, 16, 32, 14]],
      ["ko-black", [161, 1, 32, 14]],
      //Time
      [`${TIME_FRAME_KEYS[0]}-0`, [16, 32, 14, 16]],
      [`${TIME_FRAME_KEYS[0]}-1`, [32, 32, 14, 16]],
      [`${TIME_FRAME_KEYS[0]}-2`, [48, 32, 14, 16]],
      [`${TIME_FRAME_KEYS[0]}-3`, [64, 32, 14, 16]],
      [`${TIME_FRAME_KEYS[0]}-4`, [80, 32, 14, 16]],
      [`${TIME_FRAME_KEYS[0]}-5`, [96, 32, 14, 16]],
      [`${TIME_FRAME_KEYS[0]}-6`, [112, 32, 14, 16]],
      [`${TIME_FRAME_KEYS[0]}-7`, [128, 32, 14, 16]],
      [`${TIME_FRAME_KEYS[0]}-8`, [144, 32, 14, 16]],
      [`${TIME_FRAME_KEYS[0]}-9`, [160, 32, 14, 16]],
      // Time Flash
      [`${TIME_FRAME_KEYS[1]}-0`, [16, 192, 14, 16]],
      [`${TIME_FRAME_KEYS[1]}-1`, [32, 192, 14, 16]],
      [`${TIME_FRAME_KEYS[1]}-2`, [48, 192, 14, 16]],
      [`${TIME_FRAME_KEYS[1]}-3`, [64, 192, 14, 16]],
      [`${TIME_FRAME_KEYS[1]}-4`, [80, 192, 14, 16]],
      [`${TIME_FRAME_KEYS[1]}-5`, [96, 192, 14, 16]],
      [`${TIME_FRAME_KEYS[1]}-6`, [112, 192, 14, 16]],
      [`${TIME_FRAME_KEYS[1]}-7`, [128, 192, 14, 16]],
      [`${TIME_FRAME_KEYS[1]}-8`, [144, 192, 14, 16]],
      [`${TIME_FRAME_KEYS[1]}-9`, [160, 192, 14, 16]],
      // NUmbers
      ["score-0", [17, 101, 10, 10]],
      ["score-1", [29, 101, 10, 10]],
      ["score-2", [41, 101, 10, 10]],
      ["score-3", [53, 101, 10, 10]],
      ["score-4", [65, 101, 11, 10]],
      ["score-5", [77, 101, 10, 10]],
      ["score-6", [89, 101, 10, 10]],
      ["score-7", [101, 101, 10, 10]],
      ["score-8", [113, 101, 10, 10]],
      ["score-9", [125, 101, 10, 10]],
      // Alphabets
      ["score-@", [17, 113, 10, 10]],
      ["score-A", [29, 113, 11, 10]],
      ["score-B", [41, 113, 10, 10]],
      ["score-C", [53, 113, 10, 10]],
      ["score-D", [65, 113, 10, 10]],
      ["score-E", [77, 113, 10, 10]],
      ["score-F", [89, 113, 10, 10]],
      ["score-G", [101, 113, 10, 10]],
      ["score-H", [113, 113, 10, 10]],
      ["score-I", [125, 113, 9, 10]],
      ["score-J", [136, 113, 10, 10]],
      ["score-K", [149, 113, 10, 10]],
      ["score-L", [161, 113, 10, 10]],
      ["score-M", [173, 113, 10, 10]],
      ["score-N", [185, 113, 11, 10]],
      ["score-0", [197, 113, 10, 10]],
      ["score-P", [17, 125, 10, 10]],
      ["score-Q", [29, 125, 10, 10]],
      ["score-R", [41, 125, 10, 10]],
      ["score-S", [53, 125, 10, 10]],
      ["score-T", [65, 125, 10, 10]],
      ["score-U", [77, 125, 10, 10]],
      ["score-V", [89, 125, 10, 10]],
      ["score-W", [101, 125, 10, 10]],
      ["score-X", [113, 125, 10, 10]],
      ["score-Y", [125, 125, 10, 10]],
      ["score-Z", [136, 125, 10, 10]],
      // Name tags
      ["tag-ken", [128, 56, 30, 9]],
      ["tag-ryu", [16, 56, 28, 9]]
    ]);
    constructor(fighters, onTimeEnd) {
      this.onTimeEnd = onTimeEnd;
      this.image = document.getElementById("hud");
      this.nameTags = gameState.fighters.map(
        ({ id }) => `tag-${id.toLowerCase()}`
      );
    }
    drawFrame(context, frameKey, x, y, direction = 1) {
      drawFrame(context, this.image, this.frames.get(frameKey), x, y, direction);
    }
    updateHealthBarRollUp = (time, hitPoints, index) => {
      if (hitPoints >= gameState.fighters[index].hitPoints) {
        this.startingHealthRollUpDone = true;
      }
      this.healthBars[index].hitPoints = Math.min(
        gameState.fighters[index].hitPoints,
        this.healthBars[index].hitPoints + 2 * FPS * time.secondsPassed
      );
    };
    updateHealthBars = (time) => {
      this.healthBars.map(({ hitPoints }, index) => {
        if (!this.startingHealthRollUpDone) {
          this.updateHealthBarRollUp(time, hitPoints, index);
          return;
        }
        if (hitPoints <= gameState.fighters[index].hitPoints) {
          this.updateHealthBarRollUp(time, hitPoints, index);
        } else {
          this.healthBars[index].hitPoints = Math.max(
            0,
            this.healthBars[index].hitPoints - FPS * time.secondsPassed
          );
        }
      });
    };
    updateKo = (time) => {
      if (!this.startingHealthRollUpDone || this.healthBars.every(
        ({ hitPoints }) => hitPoints > HEALTH_CRITICAL_HIT_POINTS
      ))
        return;
      if (this.koFlashTimer + KO_FLASH_DELAY[this.koFrame] > time.previous)
        return;
      this.koFlashTimer = time.previous;
      this.koFrame = 1 - this.koFrame;
    };
    drawKo = (context) => {
      const frameKey = KO_FLASH_KEYS[this.koFrame];
      this.drawFrame(context, frameKey, 176, 18 - this.koFrame);
    };
    drawHealthBar(context) {
      this.drawFrame(context, "health-bar", 31, 20);
      this.drawFrame(context, "health-bar", 353, 20, -1);
      context.fillStyle = HEALTH_DAMAGE_COLOR;
      context.fillRect(
        32,
        21,
        Math.floor(
          144 * (HEALTH_MAX_HIT_POINTS - this.healthBars[0].hitPoints) / HEALTH_MAX_HIT_POINTS
        ),
        9
      );
      context.fillRect(
        208 + Math.ceil(144 * this.healthBars[1].hitPoints / HEALTH_MAX_HIT_POINTS),
        21,
        Math.floor(
          144 * (HEALTH_MAX_HIT_POINTS - this.healthBars[1].hitPoints) / HEALTH_MAX_HIT_POINTS
        ),
        9
      );
    }
    drawTime(context) {
      const timeString = String(Math.max(this.time, 0)).padStart(2, "0");
      const timeFrame = TIME_FRAME_KEYS[Number(this.useFlashFrames)];
      this.drawFrame(context, `${timeFrame}-${timeString.charAt(0)}`, 178, 33);
      this.drawFrame(context, `${timeFrame}-${timeString.charAt(1)}`, 194, 33);
    }
    drawNames(context) {
      this.drawFrame(context, this.nameTags[0], 32, 33);
      this.drawFrame(context, this.nameTags[1], 322, 33);
    }
    updateTime(time) {
      if (time.previous > this.timeTimer + TIME_DELAY) {
        this.time -= 1;
        this.timeTimer = time.previous;
      }
      if (this.time < 15 && this.time > -1 && time.previous > this.timeFlashTimer + TIME_FLASH_DELAY) {
        this.timeFlashTimer = time.previous;
        this.useFlashFrames = !this.useFlashFrames;
      }
      if (this.time === -2)
        this.onTimeEnd(time);
    }
    update(time) {
      this.updateTime(time);
      this.updateKo(time);
      this.updateHealthBars(time);
    }
    drawScoreLabel(context, label, x) {
      for (const index in label) {
        this.drawFrame(
          context,
          `score-${label.charAt(index).toUpperCase()}`,
          x + 12 * index,
          1
        );
      }
    }
    drawScore(context, score, x) {
      const scoreStr = new String(score);
      const padding = 6 * 12 - scoreStr.length * 12;
      this.drawScoreLabel(context, scoreStr, x + padding);
    }
    drawScores(context) {
      this.drawScoreLabel(context, "P1", 4);
      this.drawScore(context, gameState.fighters[0].score, 45);
      this.drawScoreLabel(context, "May", 133);
      this.drawScore(context, 5e4, 177);
      this.drawScoreLabel(context, "P2", 269);
      this.drawScore(context, gameState.fighters[1].score, 309);
    }
    draw(context) {
      this.drawScores(context);
      this.drawKo(context);
      this.drawHealthBar(context);
      this.drawTime(context);
      this.drawNames(context);
    }
  };

  // src/entitites/stage/shared/BackgroundAnimation.js
  var BackgroundAnimation = class {
    constructor(name, image, frames, animation, startFrame = 0) {
      this.name = name;
      this.image = image;
      this.frames = new Map(frames);
      this.animation = animation;
      this.animationTimer = 0;
      this.animationFrame = startFrame;
      this.frameDelay = animation[this.animationFrame][1];
    }
    update = (time) => {
      if (time.previous > this.animationTimer + this.frameDelay) {
        this.animationFrame++;
        if (this.animationFrame >= this.animation.length) {
          this.animationFrame = 0;
        }
        this.frameDelay = this.animation[this.animationFrame][1];
        this.animationTimer = time.previous;
      }
    };
    draw = (context, camera, x = 0, y = 0) => {
      const dimensions = this.frames.get(this.animation[this.animationFrame][0]);
      const height = dimensions[3];
      drawFrame(
        context,
        this.image,
        dimensions,
        x,
        -height + y - camera.position.y
      );
    };
  };

  // src/entitites/stage/shared/SkewedFloor.js
  var SkewedFloor = class {
    constructor(image, dimensions) {
      this.image = image;
      this.dimensions = dimensions;
    }
    draw = (context, camera, y) => {
      const [sourceX, sourceY, width, height] = this.dimensions;
      context.save();
      context.setTransform(
        1,
        0,
        -5.15 - (camera.position.x - (STAGE_WIDTH + STAGE_PADDING)) / 112,
        1,
        32 - camera.position.x / 1.55,
        y - camera.position.y
      );
      context.drawImage(
        this.image,
        sourceX,
        sourceY,
        width,
        height,
        0,
        0,
        width,
        height
      );
      context.restore();
    };
  };

  // src/entitites/stage/KenStage.js
  var KenStage = class {
    image = document.getElementById("KenStage");
    backgroundMusic = document.getElementById("kensTheme");
    frames = /* @__PURE__ */ new Map([
      ["stage-background", [72, 208, 768, 176]],
      ["stage-boat", [8, 16, 521, 180]],
      ["stage-floor-bottom", [8, 448, 896, 16]],
      // Ballard type
      ["ballard-small", [800, 184, 21, 16]],
      ["ballard-large", [760, 176, 31, 24]],
      // Barrels
      ["side-barrels", [560, 472, 151, 96]]
    ]);
    floor = new SkewedFloor(this.image, [8, 392, 896, 56]);
    boat = {
      position: {
        x: 0,
        y: 0
      },
      animationFrame: 0,
      animationDelay: 22,
      animationTimer: 0,
      animation: [0, -1, -2, -3, -4, -3, -2, -1]
    };
    flag = new BackgroundAnimation(
      "Flag",
      this.image,
      [
        ["flag-1", [848, 208, 40, 40]],
        ["flag-2", [848, 256, 40, 40]],
        ["flag-3", [848, 304, 40, 40]]
      ],
      [
        ["flag-1", 133],
        ["flag-2", 133],
        ["flag-3", 133]
      ],
      0
    );
    backgroundPeople = {
      shineGuy: [
        new BackgroundAnimation(
          "shineGuy",
          this.image,
          [
            ["shiny-guy-1", [552, 8, 40, 64]],
            ["shiny-guy-2", [552, 80, 40, 56]],
            ["shiny-guy-3", [552, 144, 40, 56]]
          ],
          [
            ["shiny-guy-1", 100],
            ["shiny-guy-2", 133],
            ["shiny-guy-3", 664],
            ["shiny-guy-2", 133]
          ],
          0
        ),
        [278, 157]
      ],
      hatGuy: [
        new BackgroundAnimation(
          "HatGuy",
          this.image,
          [
            ["hat-guy-1", [600, 24, 16, 48]],
            ["hat-guy-2", [600, 88, 16, 48]]
          ],
          [
            ["hat-guy-1", 1e3],
            ["hat-guy-2", 1e3]
          ],
          0
        ),
        [318, 157]
      ],
      girl: [
        new BackgroundAnimation(
          "girl",
          this.image,
          [
            ["girl-1", [624, 16, 32, 56]],
            ["girl-2", [624, 80, 32, 56]],
            ["girl-3", [624, 144, 32, 56]]
          ],
          [
            ["girl-1", 216],
            ["girl-2", 216],
            ["girl-3", 216],
            ["girl-2", 216]
          ],
          0
        ),
        [342, 157]
      ],
      greenGuy: [
        new BackgroundAnimation(
          "greenGuy",
          this.image,
          [
            ["green-guy-1", [664, 16, 32, 56]],
            ["green-guy-2", [664, 80, 32, 56]]
          ],
          [
            ["green-guy-1", 664],
            ["green-guy-2", 498],
            ["green-guy-1", 133],
            ["green-guy-2", 133]
          ],
          0
        ),
        [374, 157]
      ],
      blueCoatGuy: [
        new BackgroundAnimation(
          "blueCoatGuy",
          this.image,
          [
            ["blue-coat-1", [704, 16, 48, 56]],
            ["blue-coat-2", [704, 80, 48, 56]],
            ["blue-coat-3", [704, 144, 48, 56]]
          ],
          [
            ["blue-coat-1", 996],
            ["blue-coat-2", 133],
            ["blue-coat-3", 100],
            ["blue-coat-2", 133],
            ["blue-coat-1", 249],
            ["blue-coat-2", 133],
            ["blue-coat-3", 100],
            ["blue-coat-2", 133]
          ],
          0
        ),
        [438, 149]
      ],
      brownCoatGuy: [
        new BackgroundAnimation(
          "brownCoatGuy",
          this.image,
          [
            ["brown-coat-1", [760, 16, 40, 40]],
            ["brown-coat-2", [760, 64, 40, 40]],
            ["brown-coat-3", [760, 112, 40, 40]]
          ],
          [
            ["brown-coat-1", 133],
            ["brown-coat-2", 133],
            ["brown-coat-3", 133],
            ["brown-coat-2", 133]
          ],
          0
        ),
        [238, 61]
      ],
      pinkCoatGuy: [
        new BackgroundAnimation(
          "pinkCoatGuy",
          this.image,
          [
            ["pink-coat-1", [808, 24, 48, 32]],
            ["pink-coat-2", [808, 72, 48, 32]],
            ["pink-coat-3", [808, 120, 48, 32]]
          ],
          [
            ["pink-coat-1", 1992],
            ["pink-coat-2", 166],
            ["pink-coat-3", 166],
            ["pink-coat-2", 166],
            ["pink-coat-1", 664],
            ["pink-coat-2", 166],
            ["pink-coat-3", 166],
            ["pink-coat-2", 166],
            ["pink-coat-3", 166],
            ["pink-coat-2", 166]
          ],
          0
        ),
        [278, 53]
      ]
    };
    constructor() {
      playSound(this.backgroundMusic, 0.2);
    }
    drawFrame = (context, frameKey, x, y, direction = 1) => {
      drawFrame(context, this.image, this.frames.get(frameKey), x, y, direction);
    };
    drawBoat = (context, camera) => {
      this.boat.position = {
        x: Math.floor(150 - camera.position.x / 1.613445),
        y: -3 - camera.position.y - this.boat.animation[this.boat.animationFrame]
      };
      this.drawFrame(
        context,
        "stage-boat",
        this.boat.position.x,
        this.boat.position.y
      );
    };
    updateBoat = (time, context) => {
      if (time.previous > this.boat.animationTimer + this.boat.animationDelay * FRAME_TIME) {
        this.boat.animationTimer = time.previous;
        this.boat.animationFrame++;
        this.boat.animationDelay = 22 + (Math.random() * 16 - 8);
        if (this.boat.animationFrame >= this.boat.animation.length) {
          this.boat.animationFrame = 0;
        }
      }
    };
    drawSkyOcean = (context, camera) => {
      this.drawFrame(
        context,
        "stage-background",
        Math.floor(16 - camera.position.x / 2.157303),
        -camera.position.y
      );
      this.flag.draw(
        context,
        camera,
        Math.floor(576 - camera.position.x / 2.157303),
        48
      );
    };
    updateBoatPersons(time, context, camera) {
      Object.keys(this.backgroundPeople).forEach((name) => {
        this.backgroundPeople[name][0].update(time);
      });
    }
    drawPeople = (context, camera) => {
      Object.keys(this.backgroundPeople).forEach((name) => {
        this.backgroundPeople[name][0].draw(
          context,
          camera,
          Math.floor(
            this.backgroundPeople[name][1][0] - camera.position.x / 1.613445
          ),
          this.backgroundPeople[name][1][1] - this.boat.animation[this.boat.animationFrame]
        );
      });
    };
    drawFloor = (context, camera) => {
      this.floor.draw(context, camera, 176);
      this.drawFrame(
        context,
        "stage-floor-bottom",
        STAGE_PADDING - camera.position.x * 1.1,
        232 - camera.position.y
      );
    };
    drawSmallBallards = (context, camera) => {
      const cameraXOffset = camera.position.x / 1.54;
      this.drawFrame(
        context,
        "ballard-small",
        468 - 92 - cameraXOffset,
        166 - camera.position.y
      );
      this.drawFrame(
        context,
        "ballard-small",
        468 + 92 - cameraXOffset,
        166 - camera.position.y
      );
    };
    drawBarrels = (context, camera) => {
      this.drawFrame(
        context,
        "side-barrels",
        STAGE_PADDING + STAGE_WIDTH - 152 - camera.position.x,
        120 - camera.position.y
      );
    };
    drawLargeBallard = (context, camera) => {
      const cameraXOffset = camera.position.x / 0.958;
      this.drawFrame(
        context,
        "ballard-large",
        STAGE_MID_POINT + STAGE_PADDING - 147 - cameraXOffset,
        200 - camera.position.y
      );
      this.drawFrame(
        context,
        "ballard-large",
        STAGE_MID_POINT + STAGE_PADDING + 147 - cameraXOffset,
        200 - camera.position.y
      );
    };
    update = (time, context, camera) => {
      this.updateBoat(time, context);
      this.updateBoatPersons(time, context);
      this.flag.update(time);
    };
    drawBackground = (context, camera) => {
      this.drawSkyOcean(context, camera);
      this.drawBoat(context, camera);
      this.drawPeople(context, camera);
      this.drawFloor(context, camera);
      this.drawSmallBallards(context, camera);
      this.drawBarrels(context, camera);
    };
    drawForeground = (context, camera) => {
      this.drawLargeBallard(context, camera);
    };
    draw = (context, camera) => {
      this.drawBackground(context, camera);
      this.drawForeground(context, camera);
    };
  };

  // src/scenes/StartScene.js
  var StartScene = class {
    image = document.getElementById("Controls");
    logoImg = document.getElementById("Logo");
    text = "CLICK ANYWHERE TO START";
    repeatTime = 3;
    position = 10;
    logoFlash = false;
    flashTimer = 0;
    brightness = 0;
    contrast = 3;
    sceneEnded = false;
    endStartScene = (mode) => {
      window.GAME_MODE = mode;
      const modeSelection = document.getElementById("modeSelection");
      if (modeSelection)
        modeSelection.style.display = "none";
      this.changeScene(BattleScene);
    };
    constructor(changeScene) {
      this.changeScene = changeScene;
      window.GAME_MODE = "1P";
      const modeSelection = document.getElementById("modeSelection");
      if (modeSelection)
        modeSelection.style.display = "flex";
      const btn1P = document.getElementById("btn1P");
      const btn2P = document.getElementById("btn2P");
      if (btn1P) {
        btn1P.onclick = () => this.endStartScene("1P");
      }
      if (btn2P) {
        btn2P.onclick = () => this.endStartScene("2P");
      }
    }
    updateLogo = (time) => {
      if (this.flashTimer > time.previous)
        return;
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
      context.fillStyle = "white";
      context.font = "12px Arial";
      context.textAlign = "center";
      context.fillText("CHOOSE GAME MODE BELOW", SCENE_WIDTH / 2, 180);
      context.textAlign = "left";
    };
    drawLogo = (context) => {
      if (this.logoFlash) {
        context.fillStyle = "black";
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
  };

  // src/ar-fighter.js
  var ARFighter = class {
    constructor(scene, fighterIndex) {
      this.scene = scene;
      this.fighterIndex = fighterIndex;
      this.emaPoints = {};
      this.prevLeftArmDist = 0;
      this.prevRightArmDist = 0;
      this.prevHipY = 0;
      this.baseNoseX = 0;
      this.isChargingHadouken = false;
      this.chargeStartTime = 0;
      this.hadoukenFired = 0;
      window.AI_FRAME_INPUT = {
        up: false,
        down: false,
        left: false,
        right: false,
        lightPunch: false,
        mediumPunch: false,
        heavyPunch: false,
        lightKick: false,
        mediumKick: false,
        heavyKick: false
      };
      this.inputTimers = {};
      this.inputFlags = {};
      this.initMediapipe();
    }
    initMediapipe() {
      const videoElement = document.createElement("video");
      videoElement.style.display = "none";
      videoElement.autoplay = true;
      document.body.appendChild(videoElement);
      const pose = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
      });
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.75,
        minTrackingConfidence: 0.75
      });
      pose.onResults(this.onPoseResults.bind(this));
      const camera = new Camera(videoElement, {
        onFrame: async () => {
          await pose.send({ image: videoElement });
        },
        width: 640,
        height: 480
      });
      camera.start();
      this.videoElement = videoElement;
    }
    onPoseResults(results) {
      if (!results.poseLandmarks)
        return;
      const alpha = 0.6;
      results.poseLandmarks.forEach((lm, index) => {
        if (!this.emaPoints[index]) {
          this.emaPoints[index] = { x: lm.x, y: lm.y, z: lm.z };
        } else {
          this.emaPoints[index].x = lm.x * alpha + this.emaPoints[index].x * (1 - alpha);
          this.emaPoints[index].y = lm.y * alpha + this.emaPoints[index].y * (1 - alpha);
          this.emaPoints[index].z = lm.z * alpha + this.emaPoints[index].z * (1 - alpha);
        }
      });
      this.processCombatLogic(performance.now());
    }
    triggerInput(key, duration = 30) {
      if (this.inputFlags[key])
        return;
      this.inputFlags[key] = true;
      window.AI_FRAME_INPUT[key] = true;
      if (this.inputTimers[key])
        clearTimeout(this.inputTimers[key]);
      this.inputTimers[key] = setTimeout(() => {
        window.AI_FRAME_INPUT[key] = false;
        setTimeout(() => {
          this.inputFlags[key] = false;
        }, 350);
      }, duration);
    }
    processCombatLogic(now) {
      const leftWrist = this.emaPoints[15];
      const rightWrist = this.emaPoints[16];
      const leftShoulder = this.emaPoints[11];
      const rightShoulder = this.emaPoints[12];
      const leftHip = this.emaPoints[23];
      const rightHip = this.emaPoints[24];
      const leftAnkle = this.emaPoints[27];
      const rightAnkle = this.emaPoints[28];
      const leftKnee = this.emaPoints[25];
      const rightKnee = this.emaPoints[26];
      const nose = this.emaPoints[0];
      if (!leftShoulder || !rightShoulder || !leftHip || !rightHip || !leftWrist || !rightWrist)
        return;
      const wristDist = Math.sqrt(Math.pow(leftWrist.x - rightWrist.x, 2) + Math.pow(leftWrist.y - rightWrist.y, 2));
      if (wristDist < 0.1 && now - this.hadoukenFired > 3e3) {
        if (!this.isChargingHadouken) {
          this.isChargingHadouken = true;
          this.chargeStartTime = now;
        } else if (now - this.chargeStartTime > 1500) {
          this.fireHadouken(now);
        }
        return;
      } else {
        this.isChargingHadouken = false;
      }
      const leftArmDist = Math.sqrt(Math.pow(leftWrist.x - leftShoulder.x, 2) + Math.pow(leftWrist.y - leftShoulder.y, 2));
      const rightArmDist = Math.sqrt(Math.pow(rightWrist.x - rightShoulder.x, 2) + Math.pow(rightWrist.y - rightShoulder.y, 2));
      if (leftArmDist > 0.25 && leftArmDist - this.prevLeftArmDist > 0.015) {
        this.triggerInput("lightPunch");
      } else if (rightArmDist > 0.25 && rightArmDist - this.prevRightArmDist > 0.015) {
        this.triggerInput("heavyPunch");
      }
      this.prevLeftArmDist = leftArmDist;
      this.prevRightArmDist = rightArmDist;
      if (leftAnkle && leftKnee && leftAnkle.y < leftKnee.y - 0.02) {
        this.triggerInput("lightKick");
      } else if (rightAnkle && rightKnee && rightAnkle.y < rightKnee.y - 0.02) {
        this.triggerInput("heavyKick");
      }
      const avgHipY = (leftHip.y + rightHip.y) / 2;
      if (this.prevHipY > 0) {
        if (avgHipY < this.prevHipY - 0.04) {
          this.triggerInput("up", 100);
        } else if (avgHipY > this.prevHipY + 0.05) {
          this.triggerInput("down", 50);
        }
      }
      this.prevHipY = avgHipY * 0.1 + (this.prevHipY > 0 ? this.prevHipY : avgHipY) * 0.9;
      if (nose) {
        if (!this.baseNoseX)
          this.baseNoseX = nose.x;
        this.baseNoseX = nose.x * 0.01 + this.baseNoseX * 0.99;
        if (nose.x < this.baseNoseX - 0.08) {
          this.triggerInput("right", 30);
        } else if (nose.x > this.baseNoseX + 0.08) {
          this.triggerInput("left", 30);
        }
      }
      if (leftWrist.y < leftShoulder.y && rightWrist.y < rightShoulder.y && wristDist < 0.2) {
        this.triggerInput("left");
      }
    }
    fireHadouken(now) {
      this.isChargingHadouken = false;
      this.hadoukenFired = now;
      const opponentId = 1 - this.fighterIndex;
      if (this.scene && this.scene.handleAttackHit) {
        this.scene.handleAttackHit(
          { previous: now },
          this.fighterIndex,
          opponentId,
          null,
          FighterAttackStrength.HEAVY
        );
        gameState.fighters[opponentId].hitPoints -= 120;
      }
    }
    draw(context, camera) {
      if (!this.emaPoints || Object.keys(this.emaPoints).length === 0)
        return;
      const scaleW = 384;
      const scaleH = 224;
      const drawPoint = (lm, color = "white") => {
        if (!lm)
          return;
        const x = (1 - lm.x) * scaleW;
        const y = lm.y * scaleH;
        context.fillStyle = color;
        context.beginPath();
        context.arc(x, y, 2, 0, 2 * Math.PI);
        context.fill();
      };
      const drawLine = (i, j, color = "rgba(0, 255, 0, 0.8)") => {
        const p1 = this.emaPoints[i];
        const p2 = this.emaPoints[j];
        if (!p1 || !p2)
          return;
        context.beginPath();
        context.moveTo((1 - p1.x) * scaleW, p1.y * scaleH);
        context.lineTo((1 - p2.x) * scaleW, p2.y * scaleH);
        context.strokeStyle = color;
        context.lineWidth = 1;
        context.stroke();
      };
      drawLine(11, 12);
      drawLine(23, 24);
      drawLine(11, 23);
      drawLine(12, 24);
      drawLine(11, 13, "cyan");
      drawLine(13, 15, "cyan");
      drawLine(12, 14, "magenta");
      drawLine(14, 16, "magenta");
      drawLine(23, 25, "cyan");
      drawLine(25, 27, "cyan");
      drawLine(24, 26, "magenta");
      drawLine(26, 28, "magenta");
      [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].forEach((idx) => drawPoint(this.emaPoints[idx]));
      if (this.isChargingHadouken) {
        const leftWrist = this.emaPoints[15];
        const rightWrist = this.emaPoints[16];
        if (leftWrist && rightWrist) {
          const cx = (1 - (leftWrist.x + rightWrist.x) / 2) * scaleW;
          const cy = (leftWrist.y + rightWrist.y) / 2 * scaleH;
          const now = performance.now();
          const elapsed = now - this.chargeStartTime;
          const progress = Math.min(elapsed / 1500, 1);
          context.beginPath();
          context.arc(cx, cy, 10 + progress * 40, 0, 2 * Math.PI);
          const gradient = context.createRadialGradient(cx, cy, 0, cx, cy, 10 + progress * 40);
          gradient.addColorStop(0, `rgba(100, 200, 255, ${0.5 + progress * 0.5})`);
          gradient.addColorStop(1, "rgba(0, 100, 255, 0)");
          context.fillStyle = gradient;
          context.fill();
        }
      }
    }
  };

  // src/ai-bot.js
  var AIBot = class {
    constructor(scene, fighterIndex) {
      this.scene = scene;
      this.fighterIndex = fighterIndex;
      window.AI_OPPONENT_INPUT = {
        left: false,
        right: false,
        up: false,
        down: false,
        lightPunch: false,
        mediumPunch: false,
        heavyPunch: false,
        lightKick: false,
        mediumKick: false,
        heavyKick: false
      };
      this.decisionTimer = 0;
    }
    update(time) {
      if (window.GAME_MODE === "2P")
        return;
      if (!this.scene || !this.scene.fighters)
        return;
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
        left: false,
        right: false,
        up: false,
        down: false,
        lightPunch: false,
        mediumPunch: false,
        heavyPunch: false,
        lightKick: false,
        mediumKick: false,
        heavyKick: false
      };
      const distanceX = Math.abs(me.position.x - opponent.position.x);
      if (distanceX > 80) {
        if (me.position.x < opponent.position.x)
          inputs.right = true;
        else
          inputs.left = true;
        if (Math.random() < 0.05)
          inputs.up = true;
      } else {
        const attackChance = Math.random();
        if (attackChance < 0.2)
          inputs.lightPunch = true;
        else if (attackChance < 0.4)
          inputs.mediumPunch = true;
        else if (attackChance < 0.6)
          inputs.heavyPunch = true;
        else if (attackChance < 0.8)
          inputs.heavyKick = true;
        else {
          if (me.position.x < opponent.position.x)
            inputs.left = true;
          else
            inputs.right = true;
          inputs.down = Math.random() < 0.5;
        }
      }
      window.AI_OPPONENT_INPUT = inputs;
      this.decisionTimer = time.previous + 150 + Math.random() * 400;
    }
  };

  // src/scenes/BattleScene.js
  var BattleScene = class {
    image = document.getElementById("Winner");
    fighters = [];
    camera = void 0;
    shadows = [];
    FighterDrawOrder = [0, 1];
    hurtTimer = 0;
    battleEnded = false;
    winnerId = void 0;
    constructor(changeScene) {
      this.changeScene = changeScene;
      this.stage = new KenStage();
      this.entities = new EntityList();
      this.overlays = [
        new StatusBar(this.fighters, this.onTimeEnd),
        new FpsCounter()
      ];
      window.SF_BATTLE_SCENE = this;
      resetGameState();
      this.startRound();
    }
    getFighterClass = (id) => {
      switch (id) {
        case FighterId.KEN:
          return Ken;
        case FighterId.RYU:
          return Ryu;
        default:
          return new Error("Invalid Fighter Id");
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
        } else
          fighter.update(time, this.camera);
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
          return new Error("Invalid Strength Splash requested");
      }
    };
    handleAttackHit = (time, playerId, opponentId, position, strength) => {
      this.FighterDrawOrder = [opponentId, playerId];
      gameState.fighters[playerId].score += FighterAttackBaseData[strength].score;
      gameState.fighters[opponentId].hitPoints -= FighterAttackBaseData[strength].damage;
      const HitSplashClass = this.getHitSplashClass(strength);
      if (gameState.fighters[opponentId].hitPoints <= 0) {
        this.fighters[opponentId].changeState(FighterState.KO, time);
      }
      this.fighters[opponentId].direction = this.fighters[playerId].direction * -1;
      position && this.entities.add(HitSplashClass, position.x, position.y, playerId);
      this.hurtTimer = time.previous + FighterStruckDelay * FRAME_TIME;
    };
    updateShadows = (time) => {
      this.shadows.map((shadow) => shadow.update(time));
    };
    startRound = () => {
      this.fighters = this.getFighterEntities();
      this.camera = new Camera2(
        STAGE_PADDING + STAGE_MID_POINT - SCENE_WIDTH / 2,
        16,
        this.fighters
      );
      this.shadows = this.fighters.map((fighter) => new Shadow(fighter));
      if (!this.arFighter) {
        this.arFighter = new ARFighter(this, 0);
      }
      if (!this.aiBot) {
        this.aiBot = new AIBot(this, 1);
      }
    };
    goToStartScene = () => {
      setTimeout(() => {
        this.changeScene(StartScene);
      }, 6e3);
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
      if (this.aiBot)
        this.aiBot.update(time);
      this.updateShadows(time);
      this.stage.update(time);
      this.entities.update(time, this.camera);
      this.camera.update(time);
      this.updateOverlays(time);
      this.updateFighterHP(time);
    };
    drawFighters(context) {
      this.FighterDrawOrder.map(
        (id) => this.fighters[id].draw(context, this.camera)
      );
    }
    drawShadows(context) {
      this.shadows.map((shadow) => shadow.draw(context, this.camera));
    }
    drawOverlays(context) {
      this.overlays.map((overlay) => overlay.draw(context, this.camera));
      if (this.winnerId !== void 0) {
        this.drawWinnerText(context, this.winnerId);
      }
    }
    draw = (context) => {
      if (this.arFighter && this.arFighter.videoElement && this.arFighter.videoElement.readyState >= 2) {
        context.save();
        context.translate(384, 0);
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
      if (this.arFighter)
        this.arFighter.draw(context, this.camera);
      this.drawOverlays(context);
    };
  };

  // src/engine/ContextHandler.js
  var ContextHandler = class {
    brightness = 1;
    contrast = 1;
    minBrightness = 0;
    maxContrast = 2;
    dimDown = false;
    glowUp = false;
    constructor(context) {
      this.context = context;
    }
    startGlowUp = () => {
      this.glowUp = true;
      this.brightness = this.minBrightness;
      this.contrast = this.maxContrast;
    };
    startDimDown = () => {
      this.dimDown = true;
    };
    updateGlowUp = (time) => {
      if (this.brightness === 1 && this.contrast === 1)
        return true;
      this.brightness = Math.min(1, this.brightness + 1 * time.secondsPassed);
      this.contrast = Math.max(1, this.contrast - 2 * time.secondsPassed);
      return false;
    };
    updateDimDown = (time) => {
      if (this.brightness === this.minBrightness && this.contrast === this.maxContrast) {
        this.dimDown = false;
        return;
      }
      this.brightness = Math.max(
        this.minBrightness,
        this.brightness - 1 * time.secondsPassed
      );
      this.contrast = Math.min(
        this.contrast + 2 * time.secondsPassed,
        this.maxContrast
      );
    };
    update = (time) => {
      if (this.dimDown)
        this.updateDimDown(time);
      else if (this.glowUp)
        this.updateGlowUp(time);
    };
    draw = () => {
    };
  };

  // src/StreetFighterGame.js
  var StreetFighterGame = class {
    context = getContext();
    frameTime = {
      secondsPassed: 0,
      previous: 0
    };
    timeStarted = 0;
    sceneStarted = false;
    nextScene = void 0;
    contextHandler = new ContextHandler(this.context);
    changeScene = (SceneClass) => {
      this.contextHandler.startDimDown();
      this.sceneStarted = false;
      this.nextScene = SceneClass;
    };
    startScene = (SceneClass) => {
      this.contextHandler.startGlowUp();
      this.scene = new SceneClass(this.changeScene);
      this.sceneStarted = true;
    };
    constructor() {
      this.startScene(StartScene);
    }
    updateScenes = () => {
      this.scene.draw(this.context);
      if (this.contextHandler.dimDown)
        return;
      if (!this.sceneStarted)
        this.startScene(this.nextScene);
      this.scene.update(this.frameTime);
    };
    frame = (time) => {
      window.requestAnimationFrame(this.frame.bind(this));
      if (this.timeStarted === 0) {
        this.timeStarted = time;
      }
      time -= this.timeStarted;
      time = time * GAME_SPEED;
      this.frameTime = {
        secondsPassed: (time - this.frameTime.previous) / 1e3,
        previous: time
      };
      updateGamePads();
      this.contextHandler.update(this.frameTime);
      this.context.filter = `brightness(${this.contextHandler.brightness}) contrast(${this.contextHandler.contrast})`;
      this.updateScenes();
    };
    start() {
      registerKeyboardEvents();
      registerGamepadEvents();
      window.requestAnimationFrame(this.frame.bind(this));
    }
  };

  // src/index.js
  window.onload = () => {
    new StreetFighterGame().start();
  };
})();
