import Phaser from 'phaser';

type BlobBody = MatterJS.BodyType & {
  position: { x: number; y: number };
  speed: number;
  collisionFilter?: { group?: number };
};

export type BlobEmotion = 'calm' | 'lonely' | 'warm' | 'listening';

export interface BlobPersonOptions {
  x: number;
  y: number;
  color: number;
  accent: number;
  label: string;
  isPlayer?: boolean;
  emotion?: BlobEmotion;
}

export class BlobPerson {
  scene: Phaser.Scene;
  graphics: Phaser.GameObjects.Graphics;
  body: BlobBody;
  readonly radius = 46;
  readonly plugSide: number;
  readonly socketSide: number;
  readonly isPlayer: boolean;
  emotion: BlobEmotion;
  isConnected = false;
  pulse = 0;
  dragTarget = new Phaser.Math.Vector2();
  isDragging = false;
  private blinkTimer = 0;
  private wiggleSeed: number;

  constructor(scene: Phaser.Scene, options: BlobPersonOptions) {
    this.scene = scene;
    this.isPlayer = !!options.isPlayer;
    this.emotion = options.emotion || (this.isPlayer ? 'calm' : 'lonely');
    this.plugSide = this.isPlayer ? 1 : -1;
    this.socketSide = -this.plugSide;
    this.wiggleSeed = Phaser.Math.FloatBetween(0, Math.PI * 2);

    this.graphics = scene.add.graphics();
    this.graphics.setDepth(1);
    this.graphics.setInteractive(new Phaser.Geom.Circle(0, 0, this.radius), Phaser.Geom.Circle.Contains);

    this.body = scene.matter.add.circle(options.x, options.y, this.radius * 0.9, {
      frictionAir: 0.08,
      restitution: 0.75,
      friction: 0.08,
      density: 0.0024,
      label: options.label
    }) as BlobBody;


    this.syncGraphics();
  }

  get plugLocal(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.plugSide * (this.radius * 0.94), -4);
  }

  get socketLocal(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.socketSide * (this.radius * 0.72), 6);
  }

  get plugPoint(): Phaser.Math.Vector2 {
    const local = this.plugLocal;
    return new Phaser.Math.Vector2(this.body.position.x + local.x, this.body.position.y + local.y);
  }

  get socketPoint(): Phaser.Math.Vector2 {
    const local = this.socketLocal;
    return new Phaser.Math.Vector2(this.body.position.x + local.x, this.body.position.y + local.y);
  }

  update(time: number, delta: number) {
    const breath = Math.sin(time * 0.0027 + this.wiggleSeed) * 0.02;
    const speed = Phaser.Math.Clamp(this.body.speed * 0.15, 0, 0.22);
    const scaleX = 1 + breath * 0.06 - speed * 0.08;
    const scaleY = 1 - breath * 0.08 + speed * 0.12;

    if (this.isDragging) {
      this.applyDrag();
    } else if (!this.isPlayer && !this.isConnected) {
      this.applyWander();
    }

    this.syncGraphics();
    this.graphics.setScale(scaleX, scaleY);
    this.drawBlob(scaleX, scaleY);

    if (this.pulse > 0) {
      this.pulse = Math.max(0, this.pulse - delta * 0.0035);
    }

    if (this.blinkTimer <= 0) {
      this.blinkTimer = Phaser.Math.Between(1400, 2600);
    }
    this.blinkTimer -= delta;
  }

  pulseConnect() {
    this.pulse = 1;
  }

  setEmotion(emotion: BlobEmotion) {
    this.emotion = emotion;
  }

  private applyDrag() {
    const target = this.dragTarget;
    const position = this.body.position;
    const direction = new Phaser.Math.Vector2(target.x - position.x, target.y - position.y);
    const distance = Phaser.Math.Clamp(direction.length(), 0, 320);
    if (distance === 0) {
      return;
    }

    direction.normalize();
    const force = 0.0014 + distance * 0.000012;
    const applied = { x: direction.x * force, y: direction.y * force };
    this.scene.matter.applyForce(this.body, applied as Phaser.Types.Math.Vector2Like);
  }

  private applyWander() {
    if (Phaser.Math.Between(0, 1000) > 995) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const force = Phaser.Math.FloatBetween(0.00002, 0.00008);
      this.scene.matter.applyForce(this.body, { x: Math.cos(angle) * force, y: Math.sin(angle) * force } as Phaser.Types.Math.Vector2Like);
    }
  }

  startDrag(x: number, y: number) {
    this.isDragging = true;
    this.dragTarget.set(x, y);
  }

  updateDrag(x: number, y: number) {
    if (!this.isDragging) {
      return;
    }
    this.dragTarget.set(x, y);
  }

  stopDrag() {
    this.isDragging = false;
  }

  private syncGraphics() {
    this.graphics.setPosition(this.body.position.x, this.body.position.y);
  }

  private drawBlob(scaleX: number, scaleY: number) {
    this.graphics.clear();
    const mood = this.emotion;
    const accentAlpha = mood === 'warm' ? 0.45 : 0.28;

    this.graphics.fillStyle(0x111111, 0.08);
    this.graphics.fillEllipse(0, this.radius * 0.62, this.radius * 1.4, 16);

    const fillColor = mood === 'lonely' ? 0xf7e8f1 : mood === 'warm' ? 0xfdf1e5 : 0xf4f9ff;
    const strokeColor = 0x111111;

    this.graphics.fillStyle(fillColor, 1);
    this.graphics.lineStyle(8, strokeColor, 1);
    this.graphics.fillCircle(0, 0, this.radius);
    this.graphics.strokeCircle(0, 0, this.radius);

    this.graphics.fillStyle(fillColor, 1);
    this.graphics.fillCircle(-18, -10, 18);
    this.graphics.fillCircle(14, -16, 16);
    this.graphics.fillCircle(20, 18, 14);

    const plugX = this.plugSide * (this.radius * 0.94);
    this.graphics.lineStyle(10, strokeColor, 1);
    this.graphics.beginPath();
    this.graphics.moveTo(this.plugSide * 18, 10);
    this.graphics.lineTo(plugX - this.plugSide * 6, 0);
    this.graphics.lineTo(plugX, 0);
    this.graphics.strokePath();
    this.graphics.fillStyle(0xffffff, 1);
    this.graphics.fillCircle(plugX, 0, 12);
    this.graphics.lineStyle(4, strokeColor, 1);
    this.graphics.strokeCircle(plugX, 0, 12);

    const socketX = this.socketSide * (this.radius * 0.72);
    this.graphics.fillStyle(0xffffff, 1);
    this.graphics.fillCircle(socketX, 0, 16);
    this.graphics.lineStyle(6, strokeColor, 1);
    this.graphics.strokeCircle(socketX, 0, 16);
    this.graphics.lineStyle(5, 0xfad3e1, 1);
    this.graphics.strokeCircle(socketX, 0, 10);

    this.graphics.fillStyle(0x111111, 1);
    this.graphics.fillCircle(-12, -16, 5);
    this.graphics.fillCircle(12, -18, 5);

    if (mood === 'lonely') {
      this.graphics.lineStyle(4, 0x111111, 1);
      this.graphics.beginPath();
      this.graphics.moveTo(-8, 12);
      this.graphics.lineTo(8, 12);
      this.graphics.strokePath();
    } else {
      this.graphics.lineStyle(6, 0x111111, 1);
      this.graphics.beginPath();
      this.graphics.moveTo(-12, 10);
      this.graphics.lineTo(0, 18 + this.pulse * 6);
      this.graphics.lineTo(12, 10);
      this.graphics.strokePath();
    }

    this.graphics.fillStyle(0xffd9de, accentAlpha);
    this.graphics.fillCircle(this.socketSide * 4, 16, 10);

    if (this.pulse > 0) {
      const alpha = this.pulse * 0.55;
      this.graphics.fillStyle(0xffd9de, alpha);
      this.graphics.fillCircle(plugX, 0, 18 + this.pulse * 8);
    }
  }
}
