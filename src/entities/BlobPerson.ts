import Phaser from 'phaser';

export interface BlobPersonConfig {
  x: number;
  y: number;
  color: number;
  accent: number;
  flip: boolean;
  label: string;
}

export class BlobPerson {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container;
  graphics: Phaser.GameObjects.Graphics;
  body: Phaser.Physics.Matter.MatterBody;
  readonly radius = 48;
  readonly plugSide: number;
  readonly socketSide: number;
  private wiggleSeed: number;
  private color: number;
  private accent: number;
  isConnected = false;
  pulse = 0;

  constructor(scene: Phaser.Scene, config: BlobPersonConfig) {
    this.scene = scene;
    this.plugSide = config.flip ? -1 : 1;
    this.socketSide = -this.plugSide;
    this.color = config.color;
    this.accent = config.accent;
    this.wiggleSeed = Phaser.Math.FloatBetween(0, Math.PI * 2);

    this.graphics = scene.add.graphics();
    this.container = scene.add.container(config.x, config.y, [this.graphics]);
    this.createBody(config.x, config.y, config.label);
    this.drawBlob(0, 1);
  }

  private createBody(x: number, y: number, label: string) {
    this.body = this.scene.matter.add.circle(x, y, this.radius * 0.86, {
      frictionAir: 0.08,
      restitution: 0.78,
      friction: 0.06,
      density: 0.0019
    }) as Phaser.Physics.Matter.MatterBody;
    this.body.label = label;
    Object.assign(this.body, { gameObject: this.container });
  }

  get plugLocal(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.plugSide * (this.radius * 0.94), 2);
  }

  get socketLocal(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.socketSide * (this.radius * 0.72), 2);
  }

  get plugPoint(): Phaser.Math.Vector2 {
    const local = this.plugLocal;
    return new Phaser.Math.Vector2(
      this.body.position.x + local.x * this.container.scaleX,
      this.body.position.y + local.y * this.container.scaleY
    );
  }

  get socketPoint(): Phaser.Math.Vector2 {
    const local = this.socketLocal;
    return new Phaser.Math.Vector2(
      this.body.position.x + local.x * this.container.scaleX,
      this.body.position.y + local.y * this.container.scaleY
    );
  }

  update(time: number, delta: number) {
    const breath = Math.sin(time * 0.0025 + this.wiggleSeed) * 0.02;
    const motion = Phaser.Math.Clamp(this.body.speed * 0.18, 0, 0.14);
    const scaleX = 1 - motion * 0.22 + breath * 0.14;
    const scaleY = 1 + motion * 0.5 - breath * 0.08;

    this.container.setPosition(this.body.position.x, this.body.position.y);
    this.container.setScale(scaleX, scaleY);

    if (this.pulse > 0) {
      this.pulse = Math.max(0, this.pulse - delta * 0.004);
    }

    this.drawBlob(motion, scaleY);
  }

  private drawBlob(speedFactor: number, scaleY: number) {
    this.graphics.clear();

    // soft shadow under the blob
    this.graphics.fillStyle(0x111111, 0.08);
    this.graphics.fillEllipse(0, this.radius * 0.62, this.radius * 1.4, 16);

    // main body shape
    this.graphics.fillStyle(this.color, 1);
    this.graphics.lineStyle(8, 0x111111, 1);
    this.graphics.fillCircle(0, 0, this.radius);
    this.graphics.strokeCircle(0, 0, this.radius);

    // blob bumps for organic doodle feel
    this.graphics.fillCircle(-18, -12, 22);
    this.graphics.fillCircle(14, -18, 18);
    this.graphics.fillCircle(18, 20, 16);

    // plug arm and tip
    const plugX = this.plugSide * (this.radius * 0.92);
    this.graphics.lineStyle(10, 0x111111, 1);
    this.graphics.beginPath();
    this.graphics.moveTo(this.plugSide * 18, 10);
    this.graphics.quadraticCurveTo(this.plugSide * 24, 2, plugX - this.plugSide * 6, 0);
    this.graphics.strokePath();
    this.graphics.fillStyle(0xffffff, 1);
    this.graphics.fillCircle(plugX, 0, 12);
    this.graphics.lineStyle(4, 0x111111, 1);
    this.graphics.strokeCircle(plugX, 0, 12);

    // socket port on opposite side
    const socketX = this.socketSide * (this.radius * 0.72);
    this.graphics.fillStyle(0xffffff, 1);
    this.graphics.fillCircle(socketX, 0, 16);
    this.graphics.lineStyle(6, 0x111111, 1);
    this.graphics.strokeCircle(socketX, 0, 16);
    this.graphics.lineStyle(5, this.accent, 1);
    this.graphics.strokeCircle(socketX, 0, 10);

    // tiny eyes
    this.graphics.fillStyle(0x111111, 1);
    this.graphics.fillCircle(-12, -14, 5);
    this.graphics.fillCircle(12, -16, 5);

    // small accent blush
    this.graphics.fillStyle(this.accent, 0.4);
    this.graphics.fillCircle(-10, 18, 10);

    // connection pulse highlight
    if (this.pulse > 0) {
      const alpha = this.pulse * 0.6;
      this.graphics.fillStyle(this.accent, alpha);
      this.graphics.fillCircle(plugX, 0, 18 + this.pulse * 8);
    }
  }

  pulseConnect() {
    this.pulse = 1;
  }
}
