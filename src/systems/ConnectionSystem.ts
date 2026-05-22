import Phaser from 'phaser';
import { BlobPerson } from '../entities/BlobPerson';
import { lerpPoint } from '../physics/MatterHelpers';

interface ActiveConnection {
  from: BlobPerson;
  to: BlobPerson;
  constraint: MatterJS.ConstraintType;
}

export class ConnectionSystem {
  private scene: Phaser.Scene;
  private player: BlobPerson;
  private targets: BlobPerson[];
  private cableGraphics: Phaser.GameObjects.Graphics;
  private activeConnection: ActiveConnection | null = null;
  private pulse = 0;
  private releaseProgress = 0;
  private releaseFrom = new Phaser.Math.Vector2();
  private releaseTo = new Phaser.Math.Vector2();

  constructor(scene: Phaser.Scene, player: BlobPerson, targets: BlobPerson[]) {
    this.scene = scene;
    this.player = player;
    this.targets = targets;
    this.cableGraphics = scene.add.graphics({ x: 0, y: 0 });
    this.cableGraphics.setDepth(-1);
  }

  update(time: number, delta: number) {
    if (!this.activeConnection) {
      this.attemptAutoConnect();
    } else {
      const from = this.activeConnection.from;
      const to = this.activeConnection.to;
      const distance = Phaser.Math.Distance.BetweenPoints(from.plugPoint, to.socketPoint);
      if (distance > 180) {
        this.disconnect();
      }
    }

    this.drawCable(delta);
    this.pulse = Math.max(0, this.pulse - delta * 0.005);
    this.releaseProgress = Math.max(0, this.releaseProgress - delta * 0.0025);
  }

  private attemptAutoConnect() {
    if (!this.player.isDragging) {
      return;
    }

    for (const target of this.targets) {
      if (target.isConnected) {
        continue;
      }

      const distance = Phaser.Math.Distance.BetweenPoints(this.player.plugPoint, target.socketPoint);
      if (distance < 78) {
        this.connect(this.player, target);
        return;
      }

      if (distance < 180) {
        const force = Phaser.Math.Clamp((180 - distance) * 0.0000022, 0, 0.00008);
        this.applyMagnet(this.player, target, force);
      }
    }
  }

  private applyMagnet(from: BlobPerson, to: BlobPerson, force: number) {
    const direction = new Phaser.Math.Vector2(to.body.position.x - from.body.position.x, to.body.position.y - from.body.position.y).normalize();
    this.scene.matter.applyForce(from.body, { x: direction.x * force, y: direction.y * force } as Phaser.Types.Math.Vector2Like);
    this.scene.matter.applyForce(to.body, { x: -direction.x * force * 0.35, y: -direction.y * force * 0.35 } as Phaser.Types.Math.Vector2Like);
  }

  private connect(from: BlobPerson, to: BlobPerson) {
    const constraint = this.scene.matter.add.constraint(from.body as MatterJS.BodyType, to.body as MatterJS.BodyType, 0, 0.008, {
      pointA: { x: from.plugLocal.x, y: from.plugLocal.y },
      pointB: { x: to.socketLocal.x, y: to.socketLocal.y }
    });
    from.isConnected = true;
    to.isConnected = true;
    from.pulseConnect();
    to.pulseConnect();
    this.activeConnection = { from, to, constraint };
    this.pulse = 1;
    this.scene.events.emit('connection-made', to);
  }

  private disconnect() {
    if (!this.activeConnection) {
      return;
    }

    this.scene.matter.world.removeConstraint(this.activeConnection.constraint);
    this.releaseFrom = this.activeConnection.from.plugPoint.clone();
    this.releaseTo = this.activeConnection.to.socketPoint.clone();
    this.releaseProgress = 1;
    this.activeConnection.from.isConnected = false;
    this.activeConnection.to.isConnected = false;
    this.activeConnection = null;
    this.pulse = 0.6;
  }

  private drawCable(delta: number) {
    const g = this.cableGraphics;
    g.clear();

    if (this.activeConnection) {
      const start = this.activeConnection.from.plugPoint;
      const end = this.activeConnection.to.socketPoint;
      const control = lerpPoint(start, end, 0.5);
      control.y -= 36 + Phaser.Math.Distance.BetweenPoints(start, end) * 0.08;

      g.lineStyle(18, 0xfad3e1, 0.95);
      g.lineBetween(start.x, start.y, end.x, end.y);

      g.lineStyle(10, 0x111111, 0.14);
      g.lineBetween(start.x, start.y, end.x, end.y);

      if (this.pulse > 0) {
        g.fillStyle(0xffffff, 0.6 * this.pulse);
        g.fillCircle(end.x, end.y, 10 + 18 * this.pulse);
      }

      g.fillStyle(0xfff5f7, 0.9);
      g.fillCircle(start.x, start.y, 6);
      g.fillCircle(end.x, end.y, 6);
      return;
    }

    if (this.releaseProgress > 0) {
      const start = lerpPoint(this.releaseFrom, this.releaseTo, 1 - this.releaseProgress);
      const end = lerpPoint(this.releaseFrom, this.releaseTo, this.releaseProgress);
      const control = lerpPoint(start, end, 0.5);
      control.y -= 24;
      const alpha = this.releaseProgress * 0.72;

      g.lineStyle(16, 0xfad3e1, alpha);
      g.lineBetween(start.x, start.y, end.x, end.y);
    }
  }
}
