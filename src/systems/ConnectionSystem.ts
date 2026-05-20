import Phaser from 'phaser';
import { BlobPerson } from '../entities/BlobPerson';
import { lerpPoint } from '../physics/MatterHelpers';

export class ConnectionSystem {
  private scene: Phaser.Scene;
  private blobA: BlobPerson;
  private blobB: BlobPerson;
  private cableGraphics: Phaser.GameObjects.Graphics;
  private connection: Phaser.Types.Physics.Matter.MatterConstraint | null = null;
  private activeFrom: BlobPerson | null = null;
  private activeTo: BlobPerson | null = null;
  private releaseProgress = 0;
  private releaseFrom = new Phaser.Math.Vector2();
  private releaseTo = new Phaser.Math.Vector2();
  private pulse = 0;
  private snapCooldown = 0;

  constructor(scene: Phaser.Scene, blobA: BlobPerson, blobB: BlobPerson) {
    this.scene = scene;
    this.blobA = blobA;
    this.blobB = blobB;
    this.cableGraphics = scene.add.graphics({ x: 0, y: 0 });
    this.cableGraphics.setDepth(-1);
  }

  update(time: number, delta: number) {
    const target = this.findClosestLink();
    const canSnap = target && target.distance < 48;

    if (!this.connection && canSnap && this.snapCooldown <= 0) {
      this.connect(target!.from, target!.to);
    }

    if (this.connection) {
      const currentDistance = Phaser.Math.Distance.BetweenPoints(
        this.activeFrom!.plugPoint,
        this.activeTo!.socketPoint
      );
      if (currentDistance > 180) {
        this.disconnect();
      }
    }

    this.drawCable(delta);
    this.snapCooldown = Math.max(0, this.snapCooldown - delta * 0.004);
    this.pulse = Math.max(0, this.pulse - delta * 0.005);
  }

  private findClosestLink() {
    const distanceA = Phaser.Math.Distance.BetweenPoints(this.blobA.plugPoint, this.blobB.socketPoint);
    const distanceB = Phaser.Math.Distance.BetweenPoints(this.blobB.plugPoint, this.blobA.socketPoint);
    return distanceA < distanceB
      ? { from: this.blobA, to: this.blobB, distance: distanceA }
      : { from: this.blobB, to: this.blobA, distance: distanceB };
  }

  private connect(from: BlobPerson, to: BlobPerson) {
    from.isConnected = true;
    to.isConnected = true;
    from.pulseConnect();
    to.pulseConnect();
    this.pulse = 1;
    this.snapCooldown = 120;
    this.activeFrom = from;
    this.activeTo = to;

    this.connection = this.scene.matter.add.constraint(
      from.body,
      to.body,
      0,
      0.008,
      {
        pointA: { x: from.plugLocal.x, y: from.plugLocal.y },
        pointB: { x: to.socketLocal.x, y: to.socketLocal.y }
      }
    );

    const force = 0.036;
    this.scene.matter.applyForce(
      from.body,
      { x: from.body.position.x, y: from.body.position.y },
      {
        x: (to.body.position.x - from.body.position.x) * force,
        y: (to.body.position.y - from.body.position.y) * force
      }
    );
  }

  private disconnect() {
    if (!this.connection || !this.activeFrom || !this.activeTo) {
      return;
    }

    this.scene.matter.world.removeConstraint(this.connection);

    this.releaseFrom = this.activeFrom.plugPoint.clone();
    this.releaseTo = this.activeTo.socketPoint.clone();
    this.releaseProgress = 1;

    this.activeFrom.isConnected = false;
    this.activeTo.isConnected = false;
    this.activeFrom = null;
    this.activeTo = null;
    this.connection = null;
    this.snapCooldown = 80;
    this.pulse = 0.6;
  }

  private drawCable(delta: number) {
    const g = this.cableGraphics;
    g.clear();

    if (this.connection && this.activeFrom && this.activeTo) {
      const start = this.activeFrom.plugPoint;
      const end = this.activeTo.socketPoint;
      const control = lerpPoint(start, end, 0.5);
      control.y -= 36 + Phaser.Math.Distance.BetweenPoints(start, end) * 0.08;

      const thickness = 18;
      g.lineStyle(thickness, 0xfad3e1, 0.95);
      g.beginPath();
      g.moveTo(start.x, start.y);
      g.quadraticCurveTo(control.x, control.y, end.x, end.y);
      g.strokePath();

      g.lineStyle(10, 0x111111, 0.15);
      g.beginPath();
      g.moveTo(start.x, start.y);
      g.quadraticCurveTo(control.x, control.y, end.x, end.y);
      g.strokePath();

      if (this.pulse > 0) {
        g.fillStyle(0xffffff, 0.6 * this.pulse);
        g.fillCircle(end.x, end.y, 10 + 18 * this.pulse);
      }

      g.fillStyle(0xfff5f7, 0.8);
      g.fillCircle(start.x, start.y, 6);
      g.fillCircle(end.x, end.y, 6);
      return;
    }

    if (this.releaseProgress > 0) {
      const start = lerpPoint(this.releaseFrom, this.releaseTo, 1 - this.releaseProgress);
      const end = lerpPoint(this.releaseFrom, this.releaseTo, this.releaseProgress);
      const control = lerpPoint(start, end, 0.5);
      control.y -= 24;
      const alpha = this.releaseProgress * 0.7;

      g.lineStyle(16, 0xfad3e1, alpha);
      g.beginPath();
      g.moveTo(start.x, start.y);
      g.quadraticCurveTo(control.x, control.y, end.x, end.y);
      g.strokePath();

      this.releaseProgress = Math.max(0, this.releaseProgress - delta * 0.0025);
    }
  }
}
