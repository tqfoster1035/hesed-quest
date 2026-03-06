// Hesed's Inversion Quest - main.js
// All scenes in one file. No build step. Phaser 3.90.0 + Rex VirtualJoystick.

let questData = null;

// ============================================================
// CONSTANTS
// ============================================================
const TILE = 16;
const SCALE = 4; // Bigger sprites for Minecraft-y feel
const TS = TILE * SCALE; // 64px per tile on screen
const MAP_W = 21; // tiles - tighter map
const MAP_H = 21;
const PLAYER_SPEED = 140;
const COLORS = {
  grass: 0x4a8c3f,
  grassDark: 0x3a7a2f,
  path: 0x8b7355,
  pathEdge: 0x7a6244,
  stone: 0x666666,
  shrine: 0x9966cc,
  shrineDark: 0x7744aa,
  water: 0x3366aa,
  wall: 0x555555,
  lava: 0xcc3300,
  sand: 0xccbb77,
  dark: 0x333344,
  garden: 0x33aa55,
  fog: 0x8888aa
};

// Star geometry: 5 points evenly spaced, first point at top (north)
// Angles: -90, -18, 54, 126, 198 degrees
const STAR_ANGLES = [
  -90,   // 0: North - Bedrock (Practice Yard)
  -18,   // 1: Upper-right - Regulated Strength (Safe Cave)
  54,    // 2: Lower-right - Connector (Banner Hill)
  126,   // 3: Lower-left - Truth-Bearer (Glitch Portal)
  198    // 4: Upper-left - Eternal Student (Listening Garden)
];
const STAR_RADIUS = 9; // tiles from center to star tip
const QUEST_IDS = ['bedrock', 'strength', 'connector', 'truth', 'student'];

function starPoint(index, centerX, centerY, radius) {
  const angle = STAR_ANGLES[index] * Math.PI / 180;
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius
  };
}

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
    this.createPlayerTextures();
    this.createNPCTexture('npc', 0x6688cc);
    this.createNPCTexture('npc_green', 0x44aa66);
    this.createNPCTexture('npc_purple', 0x8844cc);
    this.createNPCTexture('npc_gold', 0xccaa44);
    this.createShardTexture();
    this.createButtonTexture();
    this.createPickupTexture();
    this.createBlockTexture();
    this.createPedestalTexture();
    this.createShrineTexture();
  }

  createPlayerTextures() {
    // Bigger 24x24 sprite for visibility
    const size = 24;
    const dirs = [
      // down (facing camera)
      (g) => {
        // Headband/mask
        g.fillStyle(0xcc0000); g.fillRect(3, 0, 18, 6);
        g.fillStyle(0xaa0000); g.fillRect(3, 0, 18, 2); // darker top
        // Face
        g.fillStyle(0xffcc99); g.fillRect(5, 6, 14, 7);
        // Eyes
        g.fillStyle(0x111111); g.fillRect(7, 8, 3, 3); g.fillRect(14, 8, 3, 3);
        // Eye shine
        g.fillStyle(0xffffff); g.fillRect(8, 8, 1, 1); g.fillRect(15, 8, 1, 1);
        // Body (ninja gi)
        g.fillStyle(0xcc0000); g.fillRect(3, 13, 18, 8);
        g.fillStyle(0xaa0000); g.fillRect(3, 13, 3, 8); g.fillRect(18, 13, 3, 8); // sleeves darker
        // Belt
        g.fillStyle(0x222222); g.fillRect(3, 17, 18, 2);
        // Feet
        g.fillStyle(0x333333); g.fillRect(5, 21, 5, 3); g.fillRect(14, 21, 5, 3);
      },
      // left
      (g) => {
        g.fillStyle(0xcc0000); g.fillRect(2, 0, 16, 6);
        g.fillStyle(0xffcc99); g.fillRect(2, 6, 12, 7);
        g.fillStyle(0x111111); g.fillRect(4, 8, 3, 3);
        g.fillStyle(0xffffff); g.fillRect(5, 8, 1, 1);
        g.fillStyle(0xcc0000); g.fillRect(2, 13, 18, 8);
        g.fillStyle(0x222222); g.fillRect(2, 17, 18, 2);
        g.fillStyle(0x333333); g.fillRect(3, 21, 5, 3); g.fillRect(12, 21, 5, 3);
      },
      // right
      (g) => {
        g.fillStyle(0xcc0000); g.fillRect(6, 0, 16, 6);
        g.fillStyle(0xffcc99); g.fillRect(10, 6, 12, 7);
        g.fillStyle(0x111111); g.fillRect(17, 8, 3, 3);
        g.fillStyle(0xffffff); g.fillRect(18, 8, 1, 1);
        g.fillStyle(0xcc0000); g.fillRect(4, 13, 18, 8);
        g.fillStyle(0x222222); g.fillRect(4, 17, 18, 2);
        g.fillStyle(0x333333); g.fillRect(7, 21, 5, 3); g.fillRect(16, 21, 5, 3);
      },
      // up (back)
      (g) => {
        g.fillStyle(0xcc0000); g.fillRect(3, 0, 18, 6);
        g.fillStyle(0xaa0000); g.fillRect(3, 0, 18, 6); // all mask
        // Headband tails
        g.fillStyle(0xcc0000); g.fillRect(19, 2, 4, 2); g.fillRect(20, 4, 3, 2);
        g.fillStyle(0xcc0000); g.fillRect(3, 6, 18, 7); // back of head same as gi
        g.fillStyle(0xcc0000); g.fillRect(3, 13, 18, 8);
        g.fillStyle(0xaa0000); g.fillRect(3, 13, 3, 8); g.fillRect(18, 13, 3, 8);
        g.fillStyle(0x222222); g.fillRect(3, 17, 18, 2);
        g.fillStyle(0x333333); g.fillRect(5, 21, 5, 3); g.fillRect(14, 21, 5, 3);
      }
    ];

    const g = this.make.graphics({ add: false });
    for (let i = 0; i < 4; i++) {
      g.clear();
      dirs[i](g);
      g.generateTexture('player_' + i, size, size);
    }
    g.destroy();
  }

  createNPCTexture(key, color) {
    const g = this.make.graphics({ add: false });
    const size = 24;
    // Hood
    g.fillStyle(color); g.fillRect(3, 0, 18, 8);
    // Face
    g.fillStyle(0xffcc99); g.fillRect(6, 8, 12, 6);
    // Eyes
    g.fillStyle(0x111111); g.fillRect(8, 10, 2, 2); g.fillRect(14, 10, 2, 2);
    // Body
    g.fillStyle(color); g.fillRect(3, 14, 18, 7);
    // Feet
    g.fillStyle(0x333333); g.fillRect(5, 21, 5, 3); g.fillRect(14, 21, 5, 3);
    g.generateTexture(key, size, size);
    g.destroy();
  }

  createShardTexture() {
    const g = this.make.graphics({ add: false });
    const s = 24;
    g.fillStyle(0xffffff);
    // Larger diamond
    g.fillTriangle(s/2, 0, 0, s/2, s/2, s);
    g.fillTriangle(s/2, 0, s, s/2, s/2, s);
    // Inner shine
    g.fillStyle(0xffffff, 0.5);
    g.fillTriangle(s/2, 4, 4, s/2, s/2, s-4);
    g.generateTexture('shard', s, s);
    g.destroy();
  }

  createButtonTexture() {
    const g = this.make.graphics({ add: false });
    g.fillStyle(0xcc0000, 0.8);
    g.fillCircle(30, 30, 30);
    g.fillStyle(0xff4444, 0.9);
    g.fillCircle(30, 27, 24);
    // "A" label
    g.fillStyle(0xffffff, 0.9);
    g.fillRect(26, 18, 3, 14); g.fillRect(31, 18, 3, 14);
    g.fillRect(26, 18, 8, 3); g.fillRect(26, 25, 8, 3);
    g.generateTexture('action_btn', 60, 60);
    g.destroy();
  }

  createPickupTexture() {
    const g = this.make.graphics({ add: false });
    g.fillStyle(0xffff44);
    g.fillCircle(12, 12, 11);
    g.fillStyle(0xffffff);
    g.fillCircle(12, 12, 6);
    g.fillStyle(0xffff88);
    g.fillCircle(10, 10, 3);
    g.generateTexture('pickup', 24, 24);
    g.destroy();
  }

  createBlockTexture() {
    const g = this.make.graphics({ add: false });
    // Minecraft-style block: dark edges, lighter face, grid texture
    g.fillStyle(0x886644); g.fillRect(0, 0, 24, 24);
    g.fillStyle(0x997755); g.fillRect(2, 2, 20, 20);
    g.fillStyle(0x775533); g.fillRect(0, 0, 24, 3); g.fillRect(0, 0, 3, 24);
    // Wood grain
    g.lineStyle(1, 0x664422, 0.4);
    g.lineBetween(4, 8, 20, 8);
    g.lineBetween(4, 16, 20, 16);
    g.generateTexture('block', 24, 24);
    g.destroy();
  }

  createPedestalTexture() {
    const g = this.make.graphics({ add: false });
    // Stone pedestal - chunky Minecraft look
    g.fillStyle(0x777777); g.fillRect(2, 10, 20, 14);
    g.fillStyle(0x999999); g.fillRect(0, 8, 24, 4);
    g.fillStyle(0x888888); g.fillRect(4, 4, 16, 6);
    // Top slot
    g.fillStyle(0x444444); g.fillRect(8, 4, 8, 4);
    g.generateTexture('pedestal', 24, 24);
    g.destroy();
  }

  createShrineTexture() {
    const g = this.make.graphics({ add: false });
    // Center shrine tile - ornate stone
    g.fillStyle(0x7744aa); g.fillRect(0, 0, 24, 24);
    g.fillStyle(0x9966cc); g.fillRect(2, 2, 20, 20);
    // Rune marks
    g.lineStyle(2, 0xddaaff, 0.6);
    g.strokeCircle(12, 12, 8);
    g.lineBetween(12, 2, 12, 22);
    g.lineBetween(2, 12, 22, 12);
    g.generateTexture('shrine_tile', 24, 24);
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

    this.cameras.main.setBackgroundColor('#0a0a18');

    // Fire particle background
    for (let i = 0; i < 30; i++) {
      const spark = this.add.circle(
        Math.random() * this.cameras.main.width,
        Math.random() * this.cameras.main.height,
        1 + Math.random() * 2, 0xff4400, 0.3 + Math.random() * 0.3
      );
      this.tweens.add({
        targets: spark, y: -20, alpha: 0,
        duration: 3000 + Math.random() * 3000, repeat: -1,
        delay: Math.random() * 2000,
        onRepeat: () => {
          spark.x = Math.random() * this.cameras.main.width;
          spark.y = this.cameras.main.height + 20;
          spark.alpha = 0.3 + Math.random() * 0.3;
        }
      });
    }

    this.add.text(cx, cy - 120, questData.title.heading, {
      fontSize: '26px', fontFamily: 'monospace', color: '#ff4444',
      align: 'center', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(cx, cy - 10, questData.title.subtitle, {
      fontSize: '15px', fontFamily: 'monospace', color: '#cccccc',
      align: 'center', wordWrap: { width: 320 }, lineSpacing: 8
    }).setOrigin(0.5);

    const btn = this.add.text(cx, cy + 110, questData.title.startButton, {
      fontSize: '22px', fontFamily: 'monospace', color: '#ffffff',
      backgroundColor: '#cc0000', padding: { x: 24, y: 12 },
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setInteractive();

    this.tweens.add({
      targets: btn, scaleX: 1.05, scaleY: 1.05, duration: 600,
      yoyo: true, repeat: -1
    });

    btn.on('pointerdown', () => {
      if (this.sound && this.sound.context && this.sound.context.state === 'suspended') {
        this.sound.context.resume();
      }
      this.scene.start('Hub');
    });

    if (SaveState.shardCount() > 0) {
      this.add.text(cx, cy + 170, `${SaveState.shardCount()}/5 Shards Collected`, {
        fontSize: '14px', fontFamily: 'monospace', color: '#ffdd00'
      }).setOrigin(0.5);
    }

    if (SaveState.shardCount() >= 5) {
      this.add.text(cx, cy + 195, 'All shards found! Return to the Shrine.', {
        fontSize: '13px', fontFamily: 'monospace', color: '#44ff44'
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
    const bh = 90;
    const bx = cam.width / 2;
    const by = cam.height - 55;

    this.bg = scene.add.rectangle(bx, by, bw, bh, 0x000000, 0.88)
      .setScrollFactor(0).setDepth(100).setVisible(false);
    this.border = scene.add.rectangle(bx, by, bw, bh)
      .setStrokeStyle(2, 0xffdd00).setScrollFactor(0).setDepth(100).setVisible(false);
    this.nameText = scene.add.text(bx - bw/2 + 12, by - bh/2 + 6, '', {
      fontSize: '13px', fontFamily: 'monospace', color: '#ffdd00', fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(101).setVisible(false);
    this.text = scene.add.text(bx - bw/2 + 12, by - bh/2 + 24, '', {
      fontSize: '12px', fontFamily: 'monospace', color: '#ffffff',
      wordWrap: { width: bw - 24 }, lineSpacing: 4
    }).setScrollFactor(0).setDepth(101).setVisible(false);
    this.tapHint = scene.add.text(bx + bw/2 - 20, by + bh/2 - 18, 'TAP >', {
      fontSize: '11px', fontFamily: 'monospace', color: '#888888'
    }).setScrollFactor(0).setDepth(101).setVisible(false);

    this.scene.tweens.add({
      targets: this.tapHint, alpha: 0.3, duration: 500, yoyo: true, repeat: -1
    });
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

    this.bg = scene.add.rectangle(cam.width / 2, cam.height / 2, bw, 220, 0x000000, 0.92)
      .setScrollFactor(0).setDepth(100).setVisible(false);
    this.border = scene.add.rectangle(cam.width / 2, cam.height / 2, bw, 220)
      .setStrokeStyle(2, 0xffdd00).setScrollFactor(0).setDepth(100).setVisible(false);
    this.questionText = scene.add.text(cam.width / 2, cam.height / 2 - 90, '', {
      fontSize: '12px', fontFamily: 'monospace', color: '#ffdd00',
      wordWrap: { width: bw - 30 }, align: 'center'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101).setVisible(false);
  }

  show(question, choices, onChoice) {
    this.active = true;
    this.questionText.setText(question);
    this.setVisible(true);

    const cam = this.scene.cameras.main;
    const startY = cam.height / 2 - 10;

    this.buttons.forEach(b => b.destroy());
    this.buttons = [];

    choices.forEach((c, i) => {
      const btn = this.scene.add.text(cam.width / 2, startY + i * 44, c.text, {
        fontSize: '12px', fontFamily: 'monospace', color: '#ffffff',
        backgroundColor: '#334455', padding: { x: 12, y: 8 },
        wordWrap: { width: cam.width - 70 }, align: 'center'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setInteractive();

      btn.on('pointerover', () => btn.setBackgroundColor('#445566'));
      btn.on('pointerout', () => btn.setBackgroundColor('#334455'));
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
// HUB SCENE - Star-shaped map
// ============================================================
class HubScene extends Phaser.Scene {
  constructor() { super('Hub'); }

  create() {
    this.cameras.main.setBackgroundColor('#1a3a1a');

    const mapPxW = MAP_W * TS;
    const mapPxH = MAP_H * TS;
    const centerTX = MAP_W >> 1; // tile coords
    const centerTY = MAP_H >> 1;
    const cx = centerTX * TS + TS / 2; // pixel coords
    const cy = centerTY * TS + TS / 2;

    // Compute star tip positions (in tile coords)
    const tips = [];
    for (let i = 0; i < 5; i++) {
      tips.push(starPoint(i, centerTX, centerTY, STAR_RADIUS));
    }

    // Draw ground tiles
    const groundG = this.add.graphics();
    // First pass: determine which tiles are paths
    const isPath = new Set();
    const isShrine = new Set();

    // Shrine center (3x3)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        isShrine.add(`${centerTX + dx},${centerTY + dy}`);
      }
    }

    // Draw lines from center to each star tip (Bresenham-style)
    for (let i = 0; i < 5; i++) {
      const tip = tips[i];
      const steps = Math.max(Math.abs(tip.x - centerTX), Math.abs(tip.y - centerTY));
      for (let s = 0; s <= steps; s++) {
        const t = steps === 0 ? 0 : s / steps;
        const tx = Math.round(centerTX + (tip.x - centerTX) * t);
        const ty = Math.round(centerTY + (tip.y - centerTY) * t);
        isPath.add(`${tx},${ty}`);
        // Widen path to 2 tiles
        isPath.add(`${tx + 1},${ty}`);
        isPath.add(`${tx},${ty + 1}`);
      }
    }

    // Draw star outline (connecting tips: 0->2->4->1->3->0 for a 5-pointed star)
    const starOrder = [0, 2, 4, 1, 3, 0];
    for (let si = 0; si < starOrder.length - 1; si++) {
      const a = tips[starOrder[si]];
      const b = tips[starOrder[si + 1]];
      const steps = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
      for (let s = 0; s <= steps; s++) {
        const t = steps === 0 ? 0 : s / steps;
        const tx = Math.round(a.x + (b.x - a.x) * t);
        const ty = Math.round(a.y + (b.y - a.y) * t);
        isPath.add(`${tx},${ty}`);
      }
    }

    // Render tiles
    for (let x = 0; x < MAP_W; x++) {
      for (let y = 0; y < MAP_H; y++) {
        const px = x * TS;
        const py = y * TS;
        const key = `${x},${y}`;

        if (isShrine.has(key)) {
          groundG.fillStyle(COLORS.shrine, 1);
          groundG.fillRect(px, py, TS, TS);
          groundG.lineStyle(1, COLORS.shrineDark, 0.5);
          groundG.strokeRect(px, py, TS, TS);
        } else if (isPath.has(key)) {
          groundG.fillStyle(COLORS.path, 0.95);
          groundG.fillRect(px, py, TS, TS);
          groundG.lineStyle(1, COLORS.pathEdge, 0.4);
          groundG.strokeRect(px, py, TS, TS);
        } else {
          const shade = 0.88 + Math.random() * 0.12;
          groundG.fillStyle(COLORS.grass, shade);
          groundG.fillRect(px, py, TS, TS);
          groundG.lineStyle(1, COLORS.grassDark, 0.25);
          groundG.strokeRect(px, py, TS, TS);
        }
      }
    }

    // Draw star outline glow
    const starG = this.add.graphics().setDepth(2);
    starG.lineStyle(2, 0xffdd00, 0.2);
    for (let si = 0; si < starOrder.length - 1; si++) {
      const a = tips[starOrder[si]];
      const b = tips[starOrder[si + 1]];
      starG.lineBetween(
        a.x * TS + TS / 2, a.y * TS + TS / 2,
        b.x * TS + TS / 2, b.y * TS + TS / 2
      );
    }

    // Shrine center decoration
    this.add.image(cx, cy, 'shrine_tile').setScale(SCALE).setDepth(3);

    // Place pedestals per-leg with individual tuning
    // Index: 0=North(bedrock), 1=UpperRight(strength), 2=LowerRight(connector),
    //        3=LowerLeft(truth), 4=UpperLeft(student)
    const pedConfigs = [
      { radius: 3.0, yOff:  0.8 },  // 0: North - pull down (bottom flush)
      { radius: 3.5, yOff:  0.5 },  // 1: Upper-right - pull down slightly
      { radius: 3.5, yOff: -1.0 },  // 2: Lower-right - push up (top flush)
      { radius: 3.5, yOff: -1.0 },  // 3: Lower-left - push up (top flush)
      { radius: 3.5, yOff:  0.5 },  // 4: Upper-left - pull down slightly
    ];
    const pedestalPositions = [];
    for (let i = 0; i < 5; i++) {
      const cfg = pedConfigs[i];
      const pp = starPoint(i, cx / TS, cy / TS, cfg.radius);
      pedestalPositions.push({
        x: pp.x * TS + TS / 2,
        y: pp.y * TS + TS / 2 + cfg.yOff * TS,
        quest: QUEST_IDS[i]
      });
    }

    pedestalPositions.forEach(p => {
      this.add.image(p.x, p.y, 'pedestal').setScale(SCALE).setDepth(5);
      if (SaveState.hasShard(p.quest)) {
        const quest = questData.quests.find(q => q.id === p.quest);
        const shard = this.add.image(p.x, p.y - 12, 'shard').setScale(SCALE)
          .setTint(parseInt(quest.shardColor)).setDepth(6);
        this.tweens.add({ targets: shard, y: p.y - 22, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    });

    // Quest zones at star tips
    const questNames = ['Practice Yard', 'Safe Cave', 'Banner Hill', 'Glitch Portal', 'Listening Garden'];
    const questNpcTextures = ['npc', 'npc_green', 'npc', 'npc_purple', 'npc_gold'];

    this.zoneColliders = [];
    for (let i = 0; i < 5; i++) {
      const tip = tips[i];
      const zx = tip.x * TS + TS / 2;
      const zy = tip.y * TS + TS / 2;

      // Zone label
      this.add.text(zx, zy - TS * 1.2, questNames[i], {
        fontSize: '11px', fontFamily: 'monospace', color: '#ffffff',
        backgroundColor: '#000000aa', padding: { x: 5, y: 3 },
        stroke: '#000000', strokeThickness: 1
      }).setOrigin(0.5).setDepth(10);

      // NPC at zone
      this.add.image(zx, zy, questNpcTextures[i]).setScale(SCALE).setDepth(8);

      // Zone trigger
      const trigger = this.add.zone(zx, zy, TS * 2.5, TS * 2.5);
      this.physics.add.existing(trigger, true);
      trigger.questId = QUEST_IDS[i];
      this.zoneColliders.push(trigger);

      // Visual indicator
      if (!SaveState.hasShard(QUEST_IDS[i])) {
        const indicator = this.add.circle(zx, zy + TS * 0.6, 8, 0xffdd00, 0.7).setDepth(9);
        this.tweens.add({ targets: indicator, alpha: 0.15, duration: 900, yoyo: true, repeat: -1 });
        // Exclamation mark
        this.add.text(zx, zy - TS * 0.6, '!', {
          fontSize: '20px', fontFamily: 'monospace', color: '#ffdd00', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(9);
      } else {
        const check = this.add.text(zx, zy + TS * 0.6, 'COMPLETE', {
          fontSize: '9px', fontFamily: 'monospace', color: '#44ff44',
          backgroundColor: '#00000088', padding: { x: 3, y: 1 }
        }).setOrigin(0.5).setDepth(9);
      }
    }

    // Player at center
    this.player = this.physics.add.image(cx, cy, 'player_0').setScale(SCALE).setDepth(20);
    this.player.setCollideWorldBounds(true);
    this.physics.world.setBounds(0, 0, mapPxW, mapPxH);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, mapPxW, mapPxH);

    this.setupControls();

    // Shard counter
    this.add.text(10, 10, `Shards: ${SaveState.shardCount()}/5`, {
      fontSize: '15px', fontFamily: 'monospace', color: '#ffdd00',
      backgroundColor: '#000000aa', padding: { x: 8, y: 4 },
      stroke: '#000000', strokeThickness: 2
    }).setScrollFactor(0).setDepth(50);

    // Win state: shrine glow
    if (SaveState.shardCount() >= 5) {
      const glow = this.add.circle(cx, cy, TS * 2.5, 0xffdd00, 0.25).setDepth(1);
      this.tweens.add({ targets: glow, alpha: 0.05, scaleX: 1.3, scaleY: 1.3, duration: 2000, yoyo: true, repeat: -1 });

      this.add.text(cx, cy + TS * 1.5, 'Enter the Shrine', {
        fontSize: '13px', fontFamily: 'monospace', color: '#ffdd00',
        backgroundColor: '#000000aa', padding: { x: 6, y: 3 }
      }).setOrigin(0.5).setDepth(10);

      const shrineZone = this.add.zone(cx, cy, TS * 3, TS * 3);
      this.physics.add.existing(shrineZone, true);
      this.physics.add.overlap(this.player, shrineZone, () => {
        this.scene.start('Badge');
      });
    }

    // Quest zone overlaps
    this.enteringQuest = false;
    this.zoneColliders.forEach(z => {
      this.physics.add.overlap(this.player, z, () => {
        if (!this.enteringQuest) {
          this.enteringQuest = true;
          if (SaveState.hasShard(z.questId)) {
            this.enteringQuest = false;
          } else {
            this.scene.start('Quest', { questId: z.questId });
          }
        }
      });
    });

    // Dialogue
    this.dialogue = new DialogueBox(this);

    if (SaveState.shardCount() === 0) {
      this.dialogue.show('Dad', [
        'Welcome, Fire Ninja.',
        'Five Glitches of Misery corrupt the world around you.',
        'Each one represents a way a man can fail his people.',
        'Clear each glitch to earn an Inversion Shard.',
        'Follow the star paths to begin.'
      ], null);
    }

    this.input.on('pointerdown', () => {
      if (this.dialogue.active) this.dialogue.advance();
    });
  }

  setupControls() {
    this.joyStick = this.plugins.get('rexvirtualjoystickplugin').add(this, {
      x: 80, y: this.cameras.main.height - 90,
      radius: 44,
      base: this.add.circle(0, 0, 44, 0x888888, 0.35).setScrollFactor(0).setDepth(50),
      thumb: this.add.circle(0, 0, 22, 0xcccccc, 0.6).setScrollFactor(0).setDepth(51),
      enable: true
    });
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update() {
    if (this.dialogue && this.dialogue.active) {
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

    this.drawQuestGround();

    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY + 60;
    this.player = this.physics.add.image(cx, cy, 'player_0').setScale(SCALE).setDepth(20);
    this.player.setCollideWorldBounds(true);

    this.setupControls();
    this.dialogue = new DialogueBox(this);
    this.choiceBox = new ChoiceBox(this);

    // HUD
    this.add.text(10, 10, `Shards: ${SaveState.shardCount()}/5`, {
      fontSize: '15px', fontFamily: 'monospace', color: '#ffdd00',
      backgroundColor: '#000000aa', padding: { x: 8, y: 4 },
      stroke: '#000000', strokeThickness: 2
    }).setScrollFactor(0).setDepth(50);

    // Quest name + pillar
    this.add.text(this.cameras.main.centerX, 16, this.quest.pillar, {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffdd00'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(50);
    this.add.text(this.cameras.main.centerX, 34, this.quest.name, {
      fontSize: '16px', fontFamily: 'monospace', color: '#ff4444',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(50);

    // Back button
    const backBtn = this.add.text(this.cameras.main.width - 10, 10, 'X Back', {
      fontSize: '13px', fontFamily: 'monospace', color: '#aaaaaa',
      backgroundColor: '#222222', padding: { x: 8, y: 4 }
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(50).setInteractive();
    backBtn.on('pointerdown', () => this.scene.start('Hub'));

    // Start with NPC dialogue
    this.dialogue.show(this.quest.npcName, this.quest.npcDialogue, () => {
      this.startMechanic();
    });

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
    if (this.questId === 'student') bgColor = COLORS.garden;
    if (this.questId === 'connector') bgColor = 0x5a6a3f;

    for (let x = 0; x < w; x += TS) {
      for (let y = 0; y < h; y += TS) {
        const shade = 0.82 + Math.random() * 0.18;
        g.fillStyle(bgColor, shade);
        g.fillRect(x, y, TS, TS);
        g.lineStyle(1, 0x000000, 0.08);
        g.strokeRect(x, y, TS, TS);
      }
    }
  }

  setupControls() {
    this.joyStick = this.plugins.get('rexvirtualjoystickplugin').add(this, {
      x: 80, y: this.cameras.main.height - 90,
      radius: 44,
      base: this.add.circle(0, 0, 44, 0x888888, 0.35).setScrollFactor(0).setDepth(50),
      thumb: this.add.circle(0, 0, 22, 0xcccccc, 0.6).setScrollFactor(0).setDepth(51),
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
    const cy = this.cameras.main.centerY - 50;

    this.add.image(cx, cy - 40, 'npc').setScale(SCALE).setDepth(10);

    // Duty circle - bigger and more visible
    this.add.circle(cx, cy, TS * 2.5, 0xffdd00, 0.12).setDepth(1);
    this.add.circle(cx, cy, TS * 2.5).setStrokeStyle(3, 0xffdd00, 0.5).setDepth(1);
    this.add.text(cx, cy + TS * 2.5 + 10, 'DUTY CIRCLE', {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffdd00'
    }).setOrigin(0.5).setDepth(2);

    // Presence meter
    const barX = cx - 80;
    const barY = 70;
    this.add.rectangle(cx, barY, 160, 18, 0x222222).setScrollFactor(0).setDepth(50);
    this.add.rectangle(cx, barY, 160, 18).setStrokeStyle(1, 0xffdd00).setScrollFactor(0).setDepth(50);
    this.presenceBar = this.add.rectangle(barX + 1, barY, 0, 16, 0xffdd00)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(51);
    this.add.text(cx, barY - 16, 'PRESENCE METER', {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffdd00'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);

    this.presenceTimer = 0;
    this.presenceDuration = this.quest.mechanicConfig.duration;
    this.presenceZoneCenter = { x: cx, y: cy };
    this.presenceZoneRadius = TS * 2.5;
    this.presenceActive = true;
  }

  // ----- ESCORT (Safe Cave) -----
  startEscortMechanic() {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    this.creature = this.add.image(cx - 120, cy - 70, 'npc_green').setScale(SCALE * 0.8).setDepth(10);

    this.blocksRemaining = 3;
    this.blocks = [];
    const blockPositions = [
      { x: cx - 60, y: cy - 90 },
      { x: cx + 80, y: cy - 20 },
      { x: cx + 10, y: cy + 60 }
    ];

    // Fire particles near blocks
    blockPositions.forEach(bp => {
      for (let f = 0; f < 4; f++) {
        const fire = this.add.circle(
          bp.x + (Math.random() - 0.5) * 40,
          bp.y + (Math.random() - 0.5) * 40,
          4, 0xff4400, 0.4
        ).setDepth(9);
        this.tweens.add({ targets: fire, alpha: 0.1, y: fire.y - 15, duration: 600, yoyo: true, repeat: -1 });
      }
    });

    blockPositions.forEach((bp) => {
      const block = this.add.image(bp.x, bp.y, 'block').setScale(SCALE).setDepth(10).setInteractive();
      block.cleared = false;
      block.on('pointerdown', () => this.tryBlockClear(block));
      this.blocks.push(block);
    });

    // Action button
    const abtn = this.add.image(this.cameras.main.width - 65, this.cameras.main.height - 90, 'action_btn')
      .setScrollFactor(0).setDepth(50).setInteractive().setScale(1.2);
    abtn.on('pointerdown', () => {
      let nearest = null; let minDist = Infinity;
      this.blocks.forEach(b => {
        if (!b.cleared) {
          const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, b.x, b.y);
          if (d < minDist) { minDist = d; nearest = b; }
        }
      });
      if (nearest && minDist < TS * 2.5) this.tryBlockClear(nearest);
    });

    this.add.text(cx, 70, 'Clear blocks while standing still.\nMoving too fast spreads the fire!', {
      fontSize: '11px', fontFamily: 'monospace', color: '#ff8844',
      align: 'center', backgroundColor: '#000000aa', padding: { x: 6, y: 4 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(50);
  }

  tryBlockClear(block) {
    if (block.cleared) return;
    const speed = Math.sqrt(this.player.body.velocity.x ** 2 + this.player.body.velocity.y ** 2);
    if (speed > this.quest.mechanicConfig.sprintThreshold) {
      this.showFireSpread(block.x, block.y);
      return;
    }
    block.cleared = true;
    this.tweens.add({ targets: block, alpha: 0, scaleX: SCALE * 0.5, scaleY: SCALE * 0.5, duration: 400, onComplete: () => block.destroy() });
    this.blocksRemaining--;
    if (this.blocksRemaining <= 0) this.completeQuest();
  }

  showFireSpread(x, y) {
    const fire = this.add.circle(x, y, 40, 0xff3300, 0.6).setDepth(15);
    this.add.text(x, y - 35, 'Too fast! Fire spreads!', {
      fontSize: '11px', fontFamily: 'monospace', color: '#ff4444',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(15);
    this.tweens.add({ targets: fire, alpha: 0, scaleX: 2.5, scaleY: 2.5, duration: 1200 });
  }

  // ----- CONNECTOR (collect) -----
  startCollectMechanic() {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;
    this.itemsCollected = 0;
    this.totalItems = this.quest.mechanicConfig.items.length;

    // Isolated Brother NPC
    this.dummy = this.add.image(cx, cy - 70, 'npc').setScale(SCALE).setDepth(10).setTint(0x444466);
    this.add.text(cx, cy - 115, 'Wall of Isolation', {
      fontSize: '11px', fontFamily: 'monospace', color: '#ff4466',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(11);

    // Wall visual
    for (let wx = -2; wx <= 2; wx++) {
      const wallBlock = this.add.image(cx + wx * TS, cy - 40, 'block').setScale(SCALE).setDepth(8).setTint(0x555577);
      this.tweens.add({ targets: wallBlock, alpha: 0.7, duration: 1500, yoyo: true, repeat: -1 });
    }

    const positions = [
      { x: cx - 140, y: cy + 100 },
      { x: cx + 150, y: cy - 10 },
      { x: cx - 60, y: cy + 160 }
    ];

    positions.forEach((p, i) => {
      const pickup = this.physics.add.image(p.x, p.y, 'pickup').setScale(SCALE).setDepth(10);
      this.tweens.add({ targets: pickup, y: p.y - 12, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

      this.add.text(p.x, p.y + 35, this.quest.mechanicConfig.items[i], {
        fontSize: '11px', fontFamily: 'monospace', color: '#ffff44',
        backgroundColor: '#000000aa', padding: { x: 4, y: 2 },
        stroke: '#000000', strokeThickness: 1
      }).setOrigin(0.5).setDepth(10);

      this.physics.add.overlap(this.player, pickup, () => {
        if (!pickup.collected) {
          pickup.collected = true;
          pickup.destroy();
          this.itemsCollected++;
          if (this.itemsCollected >= this.totalItems) {
            this.dummy.clearTint();
            this.tweens.add({
              targets: this.dummy, scaleX: SCALE * 1.3, scaleY: SCALE * 1.3,
              duration: 400, yoyo: true,
              onComplete: () => this.completeQuest()
            });
          }
        }
      });
    });

    this.add.text(cx, 70, `Find: ${this.quest.mechanicConfig.items.join(', ')}`, {
      fontSize: '11px', fontFamily: 'monospace', color: '#ffff44',
      backgroundColor: '#000000aa', padding: { x: 6, y: 4 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(50);
  }

  // ----- TRUTH-BEARER (fog + dialogue) -----
  startMazeDialogueMechanic() {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;
    this.fogCleared = false;

    // Cloud of Deception
    this.fogParticles = [];
    for (let i = 0; i < 30; i++) {
      const fog = this.add.circle(
        cx + (Math.random() - 0.5) * 280,
        cy - 80 + (Math.random() - 0.5) * 140,
        12 + Math.random() * 25,
        COLORS.fog, 0.25 + Math.random() * 0.2
      ).setDepth(5);
      this.tweens.add({
        targets: fog, x: fog.x + (Math.random() - 0.5) * 50,
        alpha: 0.08, duration: 2500 + Math.random() * 1500,
        yoyo: true, repeat: -1
      });
      this.fogParticles.push(fog);
    }

    this.guardian = this.add.image(cx, cy - 110, 'npc_purple').setScale(SCALE).setDepth(10);
    this.add.text(cx, cy - 155, 'Fog Guardian', {
      fontSize: '11px', fontFamily: 'monospace', color: '#aa88ff',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(10);

    const triggerZone = this.add.zone(cx, cy - 110, TS * 3.5, TS * 3.5);
    this.physics.add.existing(triggerZone, true);
    this.physics.add.overlap(this.player, triggerZone, () => {
      if (!this.fogCleared && !this.choiceBox.active) {
        this.showTruthChoice();
      }
    });

    this.add.text(cx, 70, 'Walk through the Cloud of Deception\nto face the Guardian', {
      fontSize: '11px', fontFamily: 'monospace', color: '#aa88ff',
      align: 'center', backgroundColor: '#000000aa', padding: { x: 6, y: 4 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(50);
  }

  showTruthChoice() {
    const config = this.quest.mechanicConfig;
    this.choiceBox.show(config.question, config.choices, (choice) => {
      if (choice.correct) {
        this.fogCleared = true;
        this.fogParticles.forEach(f => {
          this.tweens.add({ targets: f, alpha: 0, duration: 600, onComplete: () => f.destroy() });
        });
        this.dialogue.show('Fog Guardian', [choice.response], () => {
          this.completeQuest();
        });
      } else {
        this.fogParticles.forEach(f => { f.setAlpha(Math.min(f.alpha + 0.15, 0.8)); });
        this.dialogue.show('Fog Guardian', [choice.response, 'Face me again when you are ready for truth.'], null);
      }
    });
  }

  // ----- ETERNAL STUDENT (quiz) -----
  startQuizMechanic() {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    this.add.image(cx, cy - 70, 'npc_gold').setScale(SCALE).setDepth(10);
    this.add.text(cx, cy - 115, 'The Silent Monk', {
      fontSize: '11px', fontFamily: 'monospace', color: '#ddaa44',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(10);

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
        this.dialogue.show(this.quest.npcName, ['You listened. You proved you can learn. That is the way.'], () => {
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

    // Shard appears with fanfare
    const shard = this.add.image(cx, cy, 'shard').setScale(0).setDepth(30)
      .setTint(parseInt(this.quest.shardColor));

    // Glow behind shard
    const glow = this.add.circle(cx, cy, 50, parseInt(this.quest.shardColor), 0.3).setDepth(29);
    this.tweens.add({ targets: glow, alpha: 0, scaleX: 2, scaleY: 2, duration: 1000 });

    this.tweens.add({
      targets: shard, scaleX: SCALE * 2.5, scaleY: SCALE * 2.5, duration: 700,
      ease: 'Back.easeOut'
    });

    this.time.delayedCall(900, () => {
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

    if (Math.abs(vy) > Math.abs(vx)) {
      this.player.setTexture(vy < 0 ? 'player_3' : 'player_0');
    } else if (Math.abs(vx) > 0) {
      this.player.setTexture(vx < 0 ? 'player_1' : 'player_2');
    }

    // Presence mechanic
    if (this.presenceActive && !this.questComplete) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        this.presenceZoneCenter.x, this.presenceZoneCenter.y
      );
      if (dist < this.presenceZoneRadius) {
        this.presenceTimer += this.game.loop.delta / 1000;
        const pct = Math.min(this.presenceTimer / this.presenceDuration, 1);
        this.presenceBar.width = 158 * pct;
        if (pct >= 1) {
          this.presenceActive = false;
          this.completeQuest();
        }
      } else {
        if (this.presenceTimer > 0) {
          this.presenceTimer = Math.max(0, this.presenceTimer - this.game.loop.delta / 1000 * 2);
          const pct = this.presenceTimer / this.presenceDuration;
          this.presenceBar.width = 158 * pct;
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
    const h = this.cameras.main.height;

    this.cameras.main.setBackgroundColor('#080810');

    // Animated fire particles
    for (let i = 0; i < 40; i++) {
      const spark = this.add.circle(
        Math.random() * this.cameras.main.width,
        Math.random() * h,
        1 + Math.random() * 2, 0xff6600, 0.2 + Math.random() * 0.3
      );
      this.tweens.add({
        targets: spark, y: -20, alpha: 0,
        duration: 2000 + Math.random() * 4000, repeat: -1,
        delay: Math.random() * 2000,
        onRepeat: () => {
          spark.x = Math.random() * this.cameras.main.width;
          spark.y = h + 20;
          spark.alpha = 0.2 + Math.random() * 0.3;
        }
      });
    }

    // Badge - five shards combine into star formation
    const starCenterY = 75;
    const starR = 45;
    const starOrder = [0, 2, 4, 1, 3]; // connects every other point to draw a star

    // Compute star tip positions
    const tips = [];
    for (let i = 0; i < 5; i++) {
      const angle = STAR_ANGLES[i] * Math.PI / 180;
      tips.push({
        x: cx + Math.cos(angle) * starR,
        y: starCenterY + Math.sin(angle) * starR
      });
    }

    // Star outline graphics (drawn after shards fly in)
    const starGfx = this.add.graphics().setDepth(8).setAlpha(0);

    // Shards start scattered off-screen, fly into star tips
    const shards = [];
    for (let i = 0; i < 5; i++) {
      const quest = questData.quests[i];
      const startX = cx + (Math.random() - 0.5) * 600;
      const startY = -60 - Math.random() * 100;
      const s = this.add.image(startX, startY, 'shard').setScale(SCALE * 1.0)
        .setTint(parseInt(quest.shardColor)).setDepth(10).setAlpha(0.7);
      shards.push(s);

      // Fly each shard to its star tip with staggered delay
      this.tweens.add({
        targets: s,
        x: tips[i].x, y: tips[i].y,
        alpha: 1, scale: SCALE * 1.0,
        duration: 800, delay: i * 300,
        ease: 'Back.easeOut',
        onComplete: () => {
          // Gentle hover after landing
          this.tweens.add({
            targets: s, y: tips[i].y - 4,
            duration: 1200 + i * 150, yoyo: true, repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }
      });
    }

    // After all shards land, draw the star connecting lines
    this.time.delayedCall(5 * 300 + 900, () => {
      // Draw star by connecting every other point
      starGfx.lineStyle(2, 0xffdd00, 0.6);
      starGfx.beginPath();
      starGfx.moveTo(tips[starOrder[0]].x, tips[starOrder[0]].y);
      for (let i = 1; i < 5; i++) {
        starGfx.lineTo(tips[starOrder[i]].x, tips[starOrder[i]].y);
      }
      starGfx.closePath();
      starGfx.strokePath();

      // Fade in the star lines
      this.tweens.add({ targets: starGfx, alpha: 1, duration: 600 });

      // Center glow pulse
      const glow = this.add.circle(cx, starCenterY, 55, 0xffdd00, 0).setDepth(7);
      this.tweens.add({
        targets: glow, alpha: 0.15, duration: 600,
        onComplete: () => {
          this.tweens.add({
            targets: glow, alpha: 0.03, scaleX: 1.6, scaleY: 1.6,
            duration: 2500, yoyo: true, repeat: -1
          });
        }
      });
    });

    // Title (appears after star forms)
    const titleText = this.add.text(cx, 165, questData.badge.title, {
      fontSize: '22px', fontFamily: 'monospace', color: '#ffdd00',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(20).setAlpha(0);

    this.time.delayedCall(5 * 300 + 1500, () => {
      this.tweens.add({ targets: titleText, alpha: 1, duration: 800 });
    });

    // Scrollable message area (fades in after title)
    const msgY = 195;
    const msg = this.add.text(cx, msgY, questData.badge.message, {
      fontSize: '13px', fontFamily: 'monospace', color: '#ffffff',
      wordWrap: { width: this.cameras.main.width - 40 },
      lineSpacing: 7, align: 'center'
    }).setOrigin(0.5, 0).setAlpha(0);

    this.time.delayedCall(5 * 300 + 2300, () => {
      this.tweens.add({ targets: msg, alpha: 1, duration: 1200 });
    });

    // Replay button
    const replayY = Math.max(msg.y + msg.height + 30, h - 50);
    const replay = this.add.text(cx, replayY, 'Play Again', {
      fontSize: '14px', fontFamily: 'monospace', color: '#888888',
      backgroundColor: '#222222', padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setInteractive().setAlpha(0);
    this.time.delayedCall(5 * 300 + 3500, () => {
      this.tweens.add({ targets: replay, alpha: 1, duration: 800 });
    });
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
