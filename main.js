// Hesed's Inversion Quest - main.js
// All scenes in one file. No build step. Phaser 3.90.0 + Rex VirtualJoystick.

let questData = null;

// ============================================================
// CONSTANTS
// ============================================================
const TILE = 16;
const SCALE = 3;
const TS = TILE * SCALE; // 48px per tile on screen
const MAP_W = 25; // tiles
const MAP_H = 25;
const PLAYER_SPEED = 120;
const COLORS = {
  grass: 0x4a8c3f,
  path: 0x8b7355,
  stone: 0x666666,
  shrine: 0x9966cc,
  water: 0x3366aa,
  wall: 0x555555,
  lava: 0xcc3300,
  sand: 0xccbb77,
  dark: 0x333344,
  garden: 0x33aa55,
  fog: 0x8888aa
};

// ============================================================
// SAVE SYSTEM
// ============================================================
const SaveState = {
  data: { shards: [] },
  load() {
    try {
      const raw = localStorage.getItem('hesed-quest-save');
      if (raw) this.data = JSON.parse(raw);
    } catch (e) { /* Private Browsing fallback */ }
  },
  save() {
    try {
      localStorage.setItem('hesed-quest-save', JSON.stringify(this.data));
    } catch (e) { /* silently fail */ }
  },
  hasShard(id) { return this.data.shards.includes(id); },
  addShard(id) {
    if (!this.hasShard(id)) {
      this.data.shards.push(id);
      this.save();
    }
  },
  shardCount() { return this.data.shards.length; },
  reset() { this.data = { shards: [] }; this.save(); }
};

// ============================================================
// BOOT SCENE - loads data, creates textures
// ============================================================
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    this.load.json('quests', 'data/quests.json');
  }

  create() {
    questData = this.cache.json.get('quests');
    SaveState.load();
    this.generateTextures();
    this.scene.start('Title');
  }

  generateTextures() {
    // Player sprite (simple red ninja, 16x16)
    this.createPlayerTexture();
    // NPC
    this.createNPCTexture();
    // Shard
    this.createShardTexture();
    // Action button
    this.createButtonTexture();
    // Tiles are drawn procedurally in each scene
    // Encouragement word pickup
    this.createPickupTexture();
    // Block (for Safe Cave)
    this.createBlockTexture();
    // Pedestal
    this.createPedestalTexture();
  }

  createPlayerTexture() {
    const g = this.make.graphics({ add: false });
    // 4 frames: down, left, right, up (static for now)
    const dirs = [
      // down
      () => {
        g.fillStyle(0xcc0000); g.fillRect(2, 0, 12, 4); // headband
        g.fillStyle(0xffcc99); g.fillRect(4, 4, 8, 5); // face
        g.fillStyle(0x111111); g.fillRect(5, 5, 2, 2); g.fillRect(9, 5, 2, 2); // eyes
        g.fillStyle(0xcc0000); g.fillRect(2, 9, 12, 6); // body
        g.fillStyle(0x222222); g.fillRect(3, 15, 4, 1); g.fillRect(9, 15, 4, 1); // feet
      },
      // left
      () => {
        g.fillStyle(0xcc0000); g.fillRect(2, 0, 10, 4);
        g.fillStyle(0xffcc99); g.fillRect(2, 4, 8, 5);
        g.fillStyle(0x111111); g.fillRect(3, 5, 2, 2);
        g.fillStyle(0xcc0000); g.fillRect(2, 9, 12, 6);
        g.fillStyle(0x222222); g.fillRect(2, 15, 4, 1); g.fillRect(8, 15, 4, 1);
      },
      // right
      () => {
        g.fillStyle(0xcc0000); g.fillRect(4, 0, 10, 4);
        g.fillStyle(0xffcc99); g.fillRect(6, 4, 8, 5);
        g.fillStyle(0x111111); g.fillRect(11, 5, 2, 2);
        g.fillStyle(0xcc0000); g.fillRect(2, 9, 12, 6);
        g.fillStyle(0x222222); g.fillRect(4, 15, 4, 1); g.fillRect(10, 15, 4, 1);
      },
      // up
      () => {
        g.fillStyle(0xcc0000); g.fillRect(2, 0, 12, 4);
        g.fillStyle(0xcc0000); g.fillRect(4, 4, 8, 5); // back of head
        g.fillStyle(0xcc0000); g.fillRect(2, 9, 12, 6);
        g.fillStyle(0x222222); g.fillRect(3, 15, 4, 1); g.fillRect(9, 15, 4, 1);
      }
    ];

    for (let i = 0; i < 4; i++) {
      g.clear();
      dirs[i]();
      g.generateTexture('player_' + i, 16, 16);
    }
    g.destroy();
  }

  createNPCTexture() {
    const g = this.make.graphics({ add: false });
    g.fillStyle(0x6688cc); g.fillRect(2, 0, 12, 4);
    g.fillStyle(0xffcc99); g.fillRect(4, 4, 8, 5);
    g.fillStyle(0x111111); g.fillRect(5, 5, 2, 2); g.fillRect(9, 5, 2, 2);
    g.fillStyle(0x6688cc); g.fillRect(2, 9, 12, 6);
    g.fillStyle(0x222222); g.fillRect(3, 15, 4, 1); g.fillRect(9, 15, 4, 1);
    g.generateTexture('npc', 16, 16);
    g.destroy();
  }

  createShardTexture() {
    const g = this.make.graphics({ add: false });
    g.fillStyle(0xffffff);
    // Diamond shape
    g.fillTriangle(8, 0, 0, 8, 8, 16);
    g.fillTriangle(8, 0, 16, 8, 8, 16);
    g.generateTexture('shard', 16, 16);
    g.destroy();
  }

  createButtonTexture() {
    const g = this.make.graphics({ add: false });
    g.fillStyle(0xcc0000, 0.8);
    g.fillCircle(24, 24, 24);
    g.fillStyle(0xff4444, 0.9);
    g.fillCircle(24, 22, 20);
    g.generateTexture('action_btn', 48, 48);
    g.destroy();
  }

  createPickupTexture() {
    const g = this.make.graphics({ add: false });
    g.fillStyle(0xffff44);
    g.fillCircle(8, 8, 7);
    g.fillStyle(0xffffff);
    g.fillCircle(8, 8, 4);
    g.generateTexture('pickup', 16, 16);
    g.destroy();
  }

  createBlockTexture() {
    const g = this.make.graphics({ add: false });
    g.fillStyle(0x886644);
    g.fillRect(0, 0, 16, 16);
    g.fillStyle(0x775533);
    g.fillRect(0, 0, 16, 2);
    g.fillRect(0, 0, 2, 16);
    g.generateTexture('block', 16, 16);
    g.destroy();
  }

  createPedestalTexture() {
    const g = this.make.graphics({ add: false });
    g.fillStyle(0x888888);
    g.fillRect(2, 8, 12, 8);
    g.fillStyle(0xaaaaaa);
    g.fillRect(0, 6, 16, 4);
    g.generateTexture('pedestal', 16, 16);
    g.destroy();
  }
}

// ============================================================
// TITLE SCENE
// ============================================================
class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    this.cameras.main.setBackgroundColor('#111122');

    this.add.text(cx, cy - 100, questData.title.heading, {
      fontSize: '28px', fontFamily: 'monospace', color: '#ff4444',
      align: 'center', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(cx, cy, questData.title.subtitle, {
      fontSize: '16px', fontFamily: 'monospace', color: '#cccccc',
      align: 'center', wordWrap: { width: 300 }, lineSpacing: 6
    }).setOrigin(0.5);

    const btn = this.add.text(cx, cy + 120, questData.title.startButton, {
      fontSize: '24px', fontFamily: 'monospace', color: '#ffffff',
      backgroundColor: '#cc0000', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive();

    this.tweens.add({
      targets: btn, alpha: 0.5, duration: 800,
      yoyo: true, repeat: -1
    });

    btn.on('pointerdown', () => {
      // iOS audio unlock
      if (this.sound && this.sound.context && this.sound.context.state === 'suspended') {
        this.sound.context.resume();
      }
      this.scene.start('Hub');
    });

    // Show shard count if returning
    if (SaveState.shardCount() > 0) {
      this.add.text(cx, cy + 180, `${SaveState.shardCount()}/5 Shards Collected`, {
        fontSize: '14px', fontFamily: 'monospace', color: '#ffdd00'
      }).setOrigin(0.5);
    }

    // Check win state
    if (SaveState.shardCount() >= 5) {
      this.add.text(cx, cy + 200, 'All shards found! Enter the shrine.', {
        fontSize: '14px', fontFamily: 'monospace', color: '#44ff44'
      }).setOrigin(0.5);
    }
  }
}

// ============================================================
// DIALOGUE SYSTEM (reusable)
// ============================================================
class DialogueBox {
  constructor(scene) {
    this.scene = scene;
    this.lines = [];
    this.lineIndex = 0;
    this.active = false;
    this.onComplete = null;

    const cam = scene.cameras.main;
    const bw = cam.width - 20;
    const bh = 80;
    const bx = cam.width / 2;
    const by = cam.height - 50;

    this.bg = scene.add.rectangle(bx, by, bw, bh, 0x000000, 0.85)
      .setScrollFactor(0).setDepth(100).setVisible(false);
    this.border = scene.add.rectangle(bx, by, bw, bh)
      .setStrokeStyle(2, 0xffffff).setScrollFactor(0).setDepth(100).setVisible(false);
    this.nameText = scene.add.text(bx - bw/2 + 10, by - bh/2 + 5, '', {
      fontSize: '12px', fontFamily: 'monospace', color: '#ffdd00', fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(101).setVisible(false);
    this.text = scene.add.text(bx - bw/2 + 10, by - bh/2 + 22, '', {
      fontSize: '13px', fontFamily: 'monospace', color: '#ffffff',
      wordWrap: { width: bw - 20 }, lineSpacing: 4
    }).setScrollFactor(0).setDepth(101).setVisible(false);
    this.tapHint = scene.add.text(bx + bw/2 - 15, by + bh/2 - 15, '>', {
      fontSize: '14px', fontFamily: 'monospace', color: '#aaaaaa'
    }).setScrollFactor(0).setDepth(101).setVisible(false);
  }

  show(name, lines, onComplete) {
    this.lines = lines;
    this.lineIndex = 0;
    this.onComplete = onComplete;
    this.active = true;
    this.nameText.setText(name);
    this.showLine();
    this.setVisible(true);
  }

  showLine() {
    this.text.setText(this.lines[this.lineIndex]);
  }

  advance() {
    if (!this.active) return false;
    this.lineIndex++;
    if (this.lineIndex >= this.lines.length) {
      this.hide();
      if (this.onComplete) this.onComplete();
      return true;
    }
    this.showLine();
    return true;
  }

  hide() {
    this.active = false;
    this.setVisible(false);
  }

  setVisible(v) {
    this.bg.setVisible(v);
    this.border.setVisible(v);
    this.nameText.setVisible(v);
    this.text.setVisible(v);
    this.tapHint.setVisible(v);
  }
}

// ============================================================
// CHOICE DIALOGUE (for branching quests)
// ============================================================
class ChoiceBox {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.buttons = [];

    const cam = scene.cameras.main;
    const bw = cam.width - 20;

    this.bg = scene.add.rectangle(cam.width / 2, cam.height / 2, bw, 200, 0x000000, 0.9)
      .setScrollFactor(0).setDepth(100).setVisible(false);
    this.border = scene.add.rectangle(cam.width / 2, cam.height / 2, bw, 200)
      .setStrokeStyle(2, 0xffffff).setScrollFactor(0).setDepth(100).setVisible(false);
    this.questionText = scene.add.text(cam.width / 2, cam.height / 2 - 80, '', {
      fontSize: '13px', fontFamily: 'monospace', color: '#ffdd00',
      wordWrap: { width: bw - 30 }, align: 'center'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101).setVisible(false);
  }

  show(question, choices, onChoice) {
    this.active = true;
    this.questionText.setText(question);
    this.setVisible(true);

    const cam = this.scene.cameras.main;
    const startY = cam.height / 2 - 20;

    this.buttons.forEach(b => b.destroy());
    this.buttons = [];

    choices.forEach((c, i) => {
      const btn = this.scene.add.text(cam.width / 2, startY + i * 40, c.text, {
        fontSize: '12px', fontFamily: 'monospace', color: '#ffffff',
        backgroundColor: '#444466', padding: { x: 10, y: 6 },
        wordWrap: { width: cam.width - 60 }, align: 'center'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setInteractive();

      btn.on('pointerdown', () => {
        this.hide();
        onChoice(c, i);
      });
      this.buttons.push(btn);
    });
  }

  hide() {
    this.active = false;
    this.setVisible(false);
    this.buttons.forEach(b => b.destroy());
    this.buttons = [];
  }

  setVisible(v) {
    this.bg.setVisible(v);
    this.border.setVisible(v);
    this.questionText.setVisible(v);
  }
}

// ============================================================
// HUB SCENE
// ============================================================
class HubScene extends Phaser.Scene {
  constructor() { super('Hub'); }

  create() {
    this.cameras.main.setBackgroundColor('#2a4a2a');

    // Draw ground
    const groundG = this.add.graphics();
    for (let x = 0; x < MAP_W; x++) {
      for (let y = 0; y < MAP_H; y++) {
        const px = x * TS; const py = y * TS;
        const cx = MAP_W >> 1; const cy = MAP_H >> 1;
        const dist = Math.abs(x - cx) + Math.abs(y - cy);

        // Shrine center
        if (dist <= 2) {
          groundG.fillStyle(COLORS.shrine, 1); groundG.fillRect(px, py, TS, TS);
        }
        // Paths (cardinal spokes)
        else if ((x === cx && (y < cy - 2 || y > cy + 2)) ||
                 (y === cy && (x < cx - 2 || x > cx + 2)) ||
                 (x === cx - 6 && y < cy - 2) ||
                 (x === cx + 6 && y < cy - 2)) {
          groundG.fillStyle(COLORS.path, 1); groundG.fillRect(px, py, TS, TS);
        }
        // Grass
        else {
          const shade = 0.9 + Math.random() * 0.2;
          groundG.fillStyle(COLORS.grass, shade); groundG.fillRect(px, py, TS, TS);
          // Grid lines
          groundG.lineStyle(1, 0x3a7a2f, 0.3);
          groundG.strokeRect(px, py, TS, TS);
        }
      }
    }

    // Place 5 pedestals around shrine
    const cx = (MAP_W >> 1) * TS + TS/2;
    const cy = (MAP_H >> 1) * TS + TS/2;
    const pedestalPositions = [
      { x: cx, y: cy - TS * 3, quest: 'presence' },     // north
      { x: cx - TS * 3, y: cy, quest: 'strength' },      // west
      { x: cx + TS * 3, y: cy, quest: 'encouragement' }, // east
      { x: cx, y: cy + TS * 3, quest: 'truth' },          // south
      { x: cx - TS * 2, y: cy + TS * 2, quest: 'listening' } // SW
    ];

    pedestalPositions.forEach(p => {
      const ped = this.add.image(p.x, p.y, 'pedestal').setScale(SCALE);
      if (SaveState.hasShard(p.quest)) {
        const quest = questData.quests.find(q => q.id === p.quest);
        const shard = this.add.image(p.x, p.y - 10, 'shard').setScale(SCALE)
          .setTint(parseInt(quest.shardColor));
        this.tweens.add({ targets: shard, y: p.y - 18, duration: 1000, yoyo: true, repeat: -1 });
      }
    });

    // Zone labels and entry triggers
    const zones = [
      { x: cx, y: TS * 2, label: 'Practice Yard', quest: 'presence' },
      { x: TS * 2, y: cy, label: 'Safe Cave', quest: 'strength' },
      { x: (MAP_W - 3) * TS, y: cy, label: 'Banner Hill', quest: 'encouragement' },
      { x: cx, y: (MAP_H - 3) * TS, label: 'Glitch Portal', quest: 'truth' },
      { x: TS * 3, y: (MAP_H - 3) * TS, label: 'Listening Garden', quest: 'listening' }
    ];

    this.zoneColliders = [];
    zones.forEach(z => {
      this.add.text(z.x, z.y - 20, z.label, {
        fontSize: '10px', fontFamily: 'monospace', color: '#ffffff',
        backgroundColor: '#00000088', padding: { x: 4, y: 2 }
      }).setOrigin(0.5).setDepth(10);

      // Zone trigger area
      const trigger = this.add.zone(z.x, z.y, TS * 2, TS * 2);
      this.physics.add.existing(trigger, true);
      trigger.questId = z.quest;
      this.zoneColliders.push(trigger);

      // Visual indicator
      if (!SaveState.hasShard(z.quest)) {
        const indicator = this.add.circle(z.x, z.y, 12, 0xffdd00, 0.6).setDepth(5);
        this.tweens.add({ targets: indicator, alpha: 0.2, duration: 800, yoyo: true, repeat: -1 });
      } else {
        this.add.text(z.x, z.y, 'DONE', {
          fontSize: '10px', fontFamily: 'monospace', color: '#44ff44'
        }).setOrigin(0.5).setDepth(5);
      }
    });

    // Player
    this.player = this.physics.add.image(cx, cy, 'player_0').setScale(SCALE).setDepth(20);
    this.player.setCollideWorldBounds(true);
    this.physics.world.setBounds(0, 0, MAP_W * TS, MAP_H * TS);
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setBounds(0, 0, MAP_W * TS, MAP_H * TS);

    // Controls
    this.setupControls();

    // Shard counter UI
    this.shardCountText = this.add.text(10, 10, `Shards: ${SaveState.shardCount()}/5`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#ffdd00',
      backgroundColor: '#00000088', padding: { x: 6, y: 3 }
    }).setScrollFactor(0).setDepth(50);

    // Win check
    if (SaveState.shardCount() >= 5) {
      // Shrine glow
      const glow = this.add.circle(cx, cy, TS * 2, 0xffdd00, 0.3).setDepth(1);
      this.tweens.add({ targets: glow, alpha: 0.1, scaleX: 1.2, scaleY: 1.2, duration: 1500, yoyo: true, repeat: -1 });

      const shrineZone = this.add.zone(cx, cy, TS * 2, TS * 2);
      this.physics.add.existing(shrineZone, true);
      this.physics.add.overlap(this.player, shrineZone, () => {
        this.scene.start('Badge');
      });
    }

    // Overlap detection for quest zones
    this.zoneColliders.forEach(z => {
      this.physics.add.overlap(this.player, z, () => {
        if (!this.enteringQuest) {
          this.enteringQuest = true;
          const qid = z.questId;
          if (SaveState.hasShard(qid)) {
            // Already done, don't re-enter
            this.enteringQuest = false;
          } else {
            this.scene.start('Quest', { questId: qid });
          }
        }
      });
    });
    this.enteringQuest = false;

    // Dialogue
    this.dialogue = new DialogueBox(this);

    // Intro hint
    if (SaveState.shardCount() === 0) {
      this.dialogue.show('Dad', [
        'Welcome, Fire Ninja.',
        'Five Inversion Shards are hidden in the world around you.',
        'Each one holds a lesson about becoming a good dad.',
        'Walk to the glowing markers to begin each quest.'
      ], null);
    }

    // Tap to advance dialogue
    this.input.on('pointerdown', () => {
      if (this.dialogue.active) this.dialogue.advance();
    });
  }

  setupControls() {
    // Virtual joystick
    this.joyStick = this.plugins.get('rexvirtualjoystickplugin').add(this, {
      x: 80, y: this.cameras.main.height - 80,
      radius: 40,
      base: this.add.circle(0, 0, 40, 0x888888, 0.4).setScrollFactor(0).setDepth(50),
      thumb: this.add.circle(0, 0, 20, 0xcccccc, 0.7).setScrollFactor(0).setDepth(51),
      enable: true
    });

    // Keyboard fallback (for testing in browser)
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update() {
    if (this.dialogue && this.dialogue.active) {
      this.player.setVelocity(0, 0);
      return;
    }

    let vx = 0, vy = 0;

    // Joystick
    if (this.joyStick && (this.joyStick.force > 0)) {
      const angle = this.joyStick.angle * (Math.PI / 180);
      vx = Math.cos(angle) * PLAYER_SPEED;
      vy = Math.sin(angle) * PLAYER_SPEED;
    }

    // Keyboard
    if (this.cursors.left.isDown) vx = -PLAYER_SPEED;
    if (this.cursors.right.isDown) vx = PLAYER_SPEED;
    if (this.cursors.up.isDown) vy = -PLAYER_SPEED;
    if (this.cursors.down.isDown) vy = PLAYER_SPEED;

    this.player.setVelocity(vx, vy);

    // Update player direction sprite
    if (Math.abs(vy) > Math.abs(vx)) {
      this.player.setTexture(vy < 0 ? 'player_3' : 'player_0');
    } else if (Math.abs(vx) > 0) {
      this.player.setTexture(vx < 0 ? 'player_1' : 'player_2');
    }
  }
}

// ============================================================
// QUEST SCENE (handles all 5 quest types)
// ============================================================
class QuestScene extends Phaser.Scene {
  constructor() { super('Quest'); }

  init(data) {
    this.questId = data.questId;
    this.quest = questData.quests.find(q => q.id === this.questId);
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a2a1a');
    this.questComplete = false;
    this.shardCollected = false;

    // Ground
    this.drawQuestGround();

    // Player
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY + 60;
    this.player = this.physics.add.image(cx, cy, 'player_0').setScale(SCALE).setDepth(20);
    this.player.setCollideWorldBounds(true);

    // Controls
    this.setupControls();

    // Dialogue
    this.dialogue = new DialogueBox(this);
    this.choiceBox = new ChoiceBox(this);

    // Shard counter
    this.add.text(10, 10, `Shards: ${SaveState.shardCount()}/5`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#ffdd00',
      backgroundColor: '#00000088', padding: { x: 6, y: 3 }
    }).setScrollFactor(0).setDepth(50);

    // Quest name
    this.add.text(this.cameras.main.centerX, 30, this.quest.name, {
      fontSize: '16px', fontFamily: 'monospace', color: '#ff4444',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(50);

    // Back button
    const backBtn = this.add.text(this.cameras.main.width - 10, 10, 'Back', {
      fontSize: '12px', fontFamily: 'monospace', color: '#aaaaaa',
      backgroundColor: '#333333', padding: { x: 6, y: 3 }
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(50).setInteractive();
    backBtn.on('pointerdown', () => this.scene.start('Hub'));

    // Show intro dialogue, then start mechanic
    this.dialogue.show(this.quest.npcName, this.quest.npcDialogue, () => {
      this.startMechanic();
    });

    // Tap to advance dialogue
    this.input.on('pointerdown', () => {
      if (this.dialogue.active) this.dialogue.advance();
    });
  }

  drawQuestGround() {
    const g = this.add.graphics();
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    let bgColor = COLORS.grass;
    if (this.questId === 'strength') bgColor = COLORS.stone;
    if (this.questId === 'truth') bgColor = COLORS.dark;
    if (this.questId === 'listening') bgColor = COLORS.garden;

    for (let x = 0; x < w; x += TS) {
      for (let y = 0; y < h; y += TS) {
        const shade = 0.85 + Math.random() * 0.15;
        g.fillStyle(bgColor, shade);
        g.fillRect(x, y, TS, TS);
        g.lineStyle(1, 0x000000, 0.1);
        g.strokeRect(x, y, TS, TS);
      }
    }
  }

  setupControls() {
    this.joyStick = this.plugins.get('rexvirtualjoystickplugin').add(this, {
      x: 80, y: this.cameras.main.height - 80,
      radius: 40,
      base: this.add.circle(0, 0, 40, 0x888888, 0.4).setScrollFactor(0).setDepth(50),
      thumb: this.add.circle(0, 0, 20, 0xcccccc, 0.7).setScrollFactor(0).setDepth(51),
      enable: true
    });
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  startMechanic() {
    switch (this.quest.mechanic) {
      case 'timer': this.startPresenceMechanic(); break;
      case 'escort': this.startEscortMechanic(); break;
      case 'collect': this.startCollectMechanic(); break;
      case 'maze_dialogue': this.startMazeDialogueMechanic(); break;
      case 'quiz': this.startQuizMechanic(); break;
    }
  }

  // ----- PRESENCE (timer) -----
  startPresenceMechanic() {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY - 40;

    // NPC
    this.add.image(cx, cy - 30, 'npc').setScale(SCALE).setDepth(10);

    // Duty circle
    const circle = this.add.circle(cx, cy, TS * 2, 0xffdd00, 0.15).setDepth(1);
    this.add.circle(cx, cy, TS * 2).setStrokeStyle(2, 0xffdd00, 0.5).setDepth(1);

    // Presence meter bar (bg)
    const barX = cx - 60;
    const barY = 60;
    this.add.rectangle(barX + 60, barY, 120, 16, 0x333333).setScrollFactor(0).setDepth(50);
    this.presenceBar = this.add.rectangle(barX + 1, barY, 0, 14, 0xffdd00)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(51);
    this.add.text(cx, barY - 14, 'PRESENCE', {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffdd00'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);

    this.presenceTimer = 0;
    this.presenceDuration = this.quest.mechanicConfig.duration;
    this.presenceZoneCenter = { x: cx, y: cy };
    this.presenceZoneRadius = TS * 2;
    this.presenceActive = true;
  }

  // ----- ESCORT (Safe Cave) -----
  startEscortMechanic() {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    // Creature to escort
    this.creature = this.add.image(cx - 100, cy - 60, 'npc').setScale(SCALE * 0.8).setDepth(10).setTint(0x88ff88);

    // Blocks to clear
    this.blocksRemaining = 3;
    this.blocks = [];
    const blockPositions = [
      { x: cx - 40, y: cy - 80 },
      { x: cx + 60, y: cy - 30 },
      { x: cx + 20, y: cy + 40 }
    ];

    blockPositions.forEach((bp, i) => {
      const block = this.add.image(bp.x, bp.y, 'block').setScale(SCALE).setDepth(10).setInteractive();
      block.cleared = false;
      block.on('pointerdown', () => {
        if (!block.cleared) {
          // Check player speed - if moving too fast, fire spreads
          const speed = Math.sqrt(this.player.body.velocity.x ** 2 + this.player.body.velocity.y ** 2);
          if (speed > this.quest.mechanicConfig.sprintThreshold) {
            this.showFireSpread(block.x, block.y);
            return;
          }
          block.cleared = true;
          this.tweens.add({ targets: block, alpha: 0, duration: 300, onComplete: () => block.destroy() });
          this.blocksRemaining--;
          if (this.blocksRemaining <= 0) {
            this.completeQuest();
          }
        }
      });
      this.blocks.push(block);
    });

    // Action button for clearing blocks
    const abtn = this.add.image(this.cameras.main.width - 60, this.cameras.main.height - 80, 'action_btn')
      .setScrollFactor(0).setDepth(50).setInteractive().setScale(1.3);
    abtn.on('pointerdown', () => {
      // Find nearest block
      let nearest = null;
      let minDist = Infinity;
      this.blocks.forEach(b => {
        if (!b.cleared) {
          const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, b.x, b.y);
          if (d < minDist) { minDist = d; nearest = b; }
        }
      });
      if (nearest && minDist < TS * 2) {
        const speed = Math.sqrt(this.player.body.velocity.x ** 2 + this.player.body.velocity.y ** 2);
        if (speed > this.quest.mechanicConfig.sprintThreshold) {
          this.showFireSpread(nearest.x, nearest.y);
        } else {
          nearest.cleared = true;
          this.tweens.add({ targets: nearest, alpha: 0, duration: 300 });
          this.blocksRemaining--;
          if (this.blocksRemaining <= 0) this.completeQuest();
        }
      }
    });

    this.add.text(cx, this.cameras.main.height - 130, 'Tap blocks gently (stand still!)\nSprinting makes fire spread!', {
      fontSize: '11px', fontFamily: 'monospace', color: '#ff8844', align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(50);
  }

  showFireSpread(x, y) {
    const fire = this.add.circle(x, y, 30, 0xff3300, 0.6).setDepth(15);
    this.add.text(x, y - 30, 'Too fast! Fire spreads!', {
      fontSize: '10px', fontFamily: 'monospace', color: '#ff4444'
    }).setOrigin(0.5).setDepth(15);
    this.tweens.add({ targets: fire, alpha: 0, scaleX: 2, scaleY: 2, duration: 1000 });
  }

  // ----- ENCOURAGEMENT (collect) -----
  startCollectMechanic() {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;
    this.itemsCollected = 0;
    this.totalItems = this.quest.mechanicConfig.items.length;

    // Cursed dummy at center
    this.dummy = this.add.image(cx, cy - 60, 'npc').setScale(SCALE).setDepth(10).setTint(0x440044);
    this.add.text(cx, cy - 100, 'Cursed', {
      fontSize: '10px', fontFamily: 'monospace', color: '#ff0066'
    }).setOrigin(0.5).setDepth(11);

    // Scatter pickups
    const positions = [
      { x: cx - 120, y: cy + 80 },
      { x: cx + 130, y: cy - 20 },
      { x: cx - 50, y: cy + 140 }
    ];

    positions.forEach((p, i) => {
      const pickup = this.physics.add.image(p.x, p.y, 'pickup').setScale(SCALE).setDepth(10);
      this.tweens.add({ targets: pickup, y: p.y - 8, duration: 600, yoyo: true, repeat: -1 });

      // Label
      this.add.text(p.x, p.y + 25, this.quest.mechanicConfig.items[i], {
        fontSize: '9px', fontFamily: 'monospace', color: '#ffff44',
        backgroundColor: '#00000088', padding: { x: 3, y: 1 }
      }).setOrigin(0.5).setDepth(10);

      this.physics.add.overlap(this.player, pickup, () => {
        if (!pickup.collected) {
          pickup.collected = true;
          pickup.destroy();
          this.itemsCollected++;
          if (this.itemsCollected >= this.totalItems) {
            // Deliver to dummy
            this.dummy.clearTint();
            this.tweens.add({
              targets: this.dummy, scaleX: SCALE * 1.2, scaleY: SCALE * 1.2,
              duration: 300, yoyo: true,
              onComplete: () => this.completeQuest()
            });
          }
        }
      });
    });

    this.add.text(cx, this.cameras.main.height - 130, 'Find all 3 Encouragement Words!', {
      fontSize: '11px', fontFamily: 'monospace', color: '#ffff44', align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(50);
  }

  // ----- TRUTH + PATIENCE (maze then dialogue) -----
  startMazeDialogueMechanic() {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    // Simplified: walk through fog zone carefully (not a full maze, just visual fog + slow zone)
    this.fogCleared = false;

    // Fog overlay
    this.fogParticles = [];
    for (let i = 0; i < 20; i++) {
      const fog = this.add.circle(
        cx + (Math.random() - 0.5) * 200,
        cy - 80 + (Math.random() - 0.5) * 100,
        15 + Math.random() * 20,
        COLORS.fog, 0.3 + Math.random() * 0.2
      ).setDepth(5);
      this.tweens.add({
        targets: fog, x: fog.x + (Math.random() - 0.5) * 40,
        alpha: 0.1, duration: 2000 + Math.random() * 1000,
        yoyo: true, repeat: -1
      });
      this.fogParticles.push(fog);
    }

    // Guardian NPC at end of fog
    this.guardian = this.add.image(cx, cy - 100, 'npc').setScale(SCALE).setDepth(10).setTint(0xaa44ff);
    this.add.text(cx, cy - 140, 'Fog Guardian', {
      fontSize: '10px', fontFamily: 'monospace', color: '#aa88ff'
    }).setOrigin(0.5).setDepth(10);

    // Trigger zone near guardian
    const triggerZone = this.add.zone(cx, cy - 100, TS * 3, TS * 3);
    this.physics.add.existing(triggerZone, true);
    this.physics.add.overlap(this.player, triggerZone, () => {
      if (!this.fogCleared && !this.choiceBox.active) {
        this.showTruthChoice();
      }
    });

    this.add.text(cx, this.cameras.main.height - 130, 'Walk through the fog to the Guardian', {
      fontSize: '11px', fontFamily: 'monospace', color: '#aa88ff', align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(50);
  }

  showTruthChoice() {
    const config = this.quest.mechanicConfig;
    this.choiceBox.show(config.question, config.choices, (choice) => {
      if (choice.correct) {
        // Clear fog
        this.fogCleared = true;
        this.fogParticles.forEach(f => {
          this.tweens.add({ targets: f, alpha: 0, duration: 500, onComplete: () => f.destroy() });
        });
        this.dialogue.show('Fog Guardian', [choice.response], () => {
          this.completeQuest();
        });
      } else {
        // Fog thickens
        this.fogParticles.forEach(f => { f.setAlpha(Math.min(f.alpha + 0.1, 0.7)); });
        this.dialogue.show('Fog Guardian', [choice.response, 'Try again...'], null);
      }
    });
  }

  // ----- LISTENING (quiz) -----
  startQuizMechanic() {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    // Garden Keeper NPC
    this.add.image(cx, cy - 60, 'npc').setScale(SCALE).setDepth(10).setTint(0x44aa44);

    // Show story first, then ask question
    this.time.delayedCall(500, () => {
      this.dialogue.show(this.quest.npcName, this.quest.npcDialogue, () => {
        this.showQuizQuestion();
      });
    });
  }

  showQuizQuestion() {
    const config = this.quest.mechanicConfig;
    this.choiceBox.show(config.question, config.choices, (choice) => {
      if (choice.correct) {
        this.dialogue.show(this.quest.npcName, ['Yes! That\'s exactly right. You were really listening.'], () => {
          this.completeQuest();
        });
      } else {
        this.dialogue.show(this.quest.npcName, [
          config.retryMessage,
          ...this.quest.npcDialogue
        ], () => {
          this.showQuizQuestion();
        });
      }
    });
  }

  // ----- QUEST COMPLETION -----
  completeQuest() {
    if (this.questComplete) return;
    this.questComplete = true;

    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    // Shard appears
    const shard = this.add.image(cx, cy, 'shard').setScale(0).setDepth(30)
      .setTint(parseInt(this.quest.shardColor));
    this.tweens.add({
      targets: shard, scaleX: SCALE * 2, scaleY: SCALE * 2, duration: 600,
      ease: 'Back.easeOut'
    });

    // Show completion + lesson
    this.time.delayedCall(800, () => {
      this.dialogue.show('Inversion Shard', [
        this.quest.completionMessage,
        this.quest.shardLesson
      ], () => {
        SaveState.addShard(this.questId);
        this.scene.start('Hub');
      });
    });
  }

  update() {
    if ((this.dialogue && this.dialogue.active) || (this.choiceBox && this.choiceBox.active)) {
      this.player.setVelocity(0, 0);
      return;
    }

    let vx = 0, vy = 0;

    if (this.joyStick && this.joyStick.force > 0) {
      const angle = this.joyStick.angle * (Math.PI / 180);
      vx = Math.cos(angle) * PLAYER_SPEED;
      vy = Math.sin(angle) * PLAYER_SPEED;
    }

    if (this.cursors.left.isDown) vx = -PLAYER_SPEED;
    if (this.cursors.right.isDown) vx = PLAYER_SPEED;
    if (this.cursors.up.isDown) vy = -PLAYER_SPEED;
    if (this.cursors.down.isDown) vy = PLAYER_SPEED;

    this.player.setVelocity(vx, vy);

    // Direction sprite
    if (Math.abs(vy) > Math.abs(vx)) {
      this.player.setTexture(vy < 0 ? 'player_3' : 'player_0');
    } else if (Math.abs(vx) > 0) {
      this.player.setTexture(vx < 0 ? 'player_1' : 'player_2');
    }

    // Presence mechanic update
    if (this.presenceActive && !this.questComplete) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        this.presenceZoneCenter.x, this.presenceZoneCenter.y
      );
      if (dist < this.presenceZoneRadius) {
        this.presenceTimer += this.game.loop.delta / 1000;
        const pct = Math.min(this.presenceTimer / this.presenceDuration, 1);
        this.presenceBar.width = 118 * pct;
        if (pct >= 1) {
          this.presenceActive = false;
          this.completeQuest();
        }
      } else {
        // Reset if player leaves
        if (this.presenceTimer > 0) {
          this.presenceTimer = Math.max(0, this.presenceTimer - this.game.loop.delta / 1000 * 2);
          const pct = this.presenceTimer / this.presenceDuration;
          this.presenceBar.width = 118 * pct;
        }
      }
    }
  }
}

// ============================================================
// BADGE SCENE (win state)
// ============================================================
class BadgeScene extends Phaser.Scene {
  constructor() { super('Badge'); }

  create() {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    this.cameras.main.setBackgroundColor('#0a0a1a');

    // Badge icon (large shard composite)
    const badge = this.add.image(cx, 80, 'shard').setScale(SCALE * 3).setTint(0xffdd00).setDepth(10);
    this.tweens.add({
      targets: badge, angle: 360, duration: 4000, repeat: -1
    });

    // Glow
    const glow = this.add.circle(cx, 80, 50, 0xffdd00, 0.2);
    this.tweens.add({ targets: glow, alpha: 0.05, scaleX: 1.5, scaleY: 1.5, duration: 2000, yoyo: true, repeat: -1 });

    // Title
    this.add.text(cx, 140, questData.badge.title, {
      fontSize: '22px', fontFamily: 'monospace', color: '#ffdd00',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Message
    this.add.text(cx, cy + 40, questData.badge.message, {
      fontSize: '14px', fontFamily: 'monospace', color: '#ffffff',
      wordWrap: { width: this.cameras.main.width - 40 },
      lineSpacing: 8, align: 'center'
    }).setOrigin(0.5);

    // Replay button at bottom
    const replay = this.add.text(cx, this.cameras.main.height - 40, 'Play Again', {
      fontSize: '14px', fontFamily: 'monospace', color: '#aaaaaa',
      backgroundColor: '#333333', padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setInteractive();
    replay.on('pointerdown', () => {
      SaveState.reset();
      this.scene.start('Title');
    });
  }
}

// ============================================================
// GAME CONFIG
// ============================================================
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%'
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: [BootScene, TitleScene, HubScene, QuestScene, BadgeScene],
  plugins: {
    global: [{
      key: 'rexvirtualjoystickplugin',
      plugin: rexvirtualjoystickplugin,
      start: true
    }]
  },
  input: {
    activePointers: 3
  },
  render: {
    pixelArt: true,
    antialias: false
  }
};

const game = new Phaser.Game(config);
