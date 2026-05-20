window.addEventListener('DOMContentLoaded', function () {
  function showGameError(message) {
    var errorMessage = document.getElementById('error-message');
    var errorText = document.getElementById('error-text');
    if (errorMessage && errorText) {
      errorText.textContent = message;
      errorMessage.style.display = 'block';
    }
  }

  try {
    if (typeof Phaser === 'undefined') {
      throw new Error('Phaser failed to load. Check that phaser.min.js is available and is not blocked.');
    }

    class BlobPerson {
      constructor(scene, config) {
        this.scene = scene;
        this.radius = 48;
        this.plugSide = config.flip ? -1 : 1;
        this.socketSide = -this.plugSide;
        this.color = config.color;
        this.accent = config.accent;
        this.wiggleSeed = Phaser.Math.FloatBetween(0, Math.PI * 2);
        this.isConnected = false;
        this.pulse = 0;
        this.graphics = scene.add.graphics();
        this.container = scene.add.container(config.x, config.y, [this.graphics]);
        this.createBody(config.x, config.y, config.label);
        this.drawBlob();
      }

      createBody(x, y, label) {
        this.body = this.scene.matter.add.circle(x, y, this.radius * 0.86, {
          frictionAir: 0.08,
          restitution: 0.78,
          friction: 0.06,
          density: 0.0019
        });
        this.body.label = label;
        Object.assign(this.body, { gameObject: this.container });
      }

      get plugLocal() {
        return new Phaser.Math.Vector2(this.plugSide * (this.radius * 0.94), 2);
      }

      get socketLocal() {
        return new Phaser.Math.Vector2(this.socketSide * (this.radius * 0.72), 2);
      }

      get plugPoint() {
        const local = this.plugLocal;
        return new Phaser.Math.Vector2(
          this.body.position.x + local.x * this.container.scaleX,
          this.body.position.y + local.y * this.container.scaleY
        );
      }

      get socketPoint() {
        const local = this.socketLocal;
        return new Phaser.Math.Vector2(
          this.body.position.x + local.x * this.container.scaleX,
          this.body.position.y + local.y * this.container.scaleY
        );
      }

      update(time, delta) {
        const breath = Math.sin(time * 0.0025 + this.wiggleSeed) * 0.02;
        const motion = Phaser.Math.Clamp(this.body.speed * 0.18, 0, 0.14);
        const scaleX = 1 - motion * 0.22 + breath * 0.14;
        const scaleY = 1 + motion * 0.5 - breath * 0.08;

        const width = this.scene.scale.width;
        const height = this.scene.scale.height;
        const minX = this.radius;
        const maxX = width - this.radius;
        const minY = this.radius;
        const maxY = height - this.radius;
        let x = this.body.position.x;
        let y = this.body.position.y;

        if (x < minX) {
          x = minX;
        } else if (x > maxX) {
          x = maxX;
        }

        if (y < minY) {
          y = minY;
        } else if (y > maxY) {
          y = maxY;
        }

        if (x !== this.body.position.x || y !== this.body.position.y) {
          this.scene.matter.body.setPosition(this.body, { x, y });
          this.body.velocity.x = 0;
          this.body.velocity.y = 0;
        }

        this.container.setPosition(this.body.position.x, this.body.position.y);
        this.container.setScale(scaleX, scaleY);

        if (this.pulse > 0) {
          this.pulse = Math.max(0, this.pulse - delta * 0.004);
        }

        this.drawBlob();
      }

      drawBlob() {
        this.graphics.clear();
        this.graphics.fillStyle(0x111111, 0.08);
        this.graphics.fillEllipse(0, this.radius * 0.62, this.radius * 1.4, 16);
        this.graphics.fillStyle(this.color, 1);
        this.graphics.lineStyle(8, 0x111111, 1);
        this.graphics.fillCircle(0, 0, this.radius);
        this.graphics.strokeCircle(0, 0, this.radius);
        this.graphics.fillCircle(-18, -12, 22);
        this.graphics.fillCircle(14, -18, 18);
        this.graphics.fillCircle(18, 20, 16);

        const plugX = this.plugSide * (this.radius * 0.92);
        this.graphics.lineStyle(10, 0x111111, 1);
        this.graphics.beginPath();
        this.graphics.moveTo(this.plugSide * 18, 10);
        this.graphics.lineTo(plugX - this.plugSide * 6, 0);
        this.graphics.strokePath();

        this.graphics.fillStyle(0xffffff, 1);
        this.graphics.fillCircle(plugX, 0, 12);
        this.graphics.lineStyle(4, 0x111111, 1);
        this.graphics.strokeCircle(plugX, 0, 12);

        const socketX = this.socketSide * (this.radius * 0.72);
        this.graphics.fillStyle(0xffffff, 1);
        this.graphics.fillCircle(socketX, 0, 16);
        this.graphics.lineStyle(6, 0x111111, 1);
        this.graphics.strokeCircle(socketX, 0, 16);
        this.graphics.lineStyle(5, this.accent, 1);
        this.graphics.strokeCircle(socketX, 0, 10);

        this.graphics.fillStyle(0x111111, 1);
        this.graphics.fillCircle(-12, -14, 5);
        this.graphics.fillCircle(12, -16, 5);
        this.graphics.fillStyle(this.accent, 0.4);
        this.graphics.fillCircle(-10, 18, 10);

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

    class ConnectionSystem {
      constructor(scene, blobA, blobB) {
        this.scene = scene;
        this.blobA = blobA;
        this.blobB = blobB;
        this.cableGraphics = scene.add.graphics({ x: 0, y: 0 });
        this.cableGraphics.setDepth(-1);
        this.connection = null;
        this.activeFrom = null;
        this.activeTo = null;
        this.releaseProgress = 0;
        this.releaseFrom = new Phaser.Math.Vector2();
        this.releaseTo = new Phaser.Math.Vector2();
        this.pulse = 0;
        this.snapCooldown = 0;
      }

      update(time, delta) {
        const target = this.findClosestLink();
        const canSnap = target && target.distance < 48;
        if (!this.connection && canSnap && this.snapCooldown <= 0) {
          this.connect(target.from, target.to);
        }
        if (this.connection) {
          const currentDistance = Phaser.Math.Distance.BetweenPoints(
            this.activeFrom.plugPoint,
            this.activeTo.socketPoint
          );
          if (currentDistance > 180) {
            this.disconnect();
          }
        }
        this.drawCable(delta);
        this.snapCooldown = Math.max(0, this.snapCooldown - delta * 0.004);
        this.pulse = Math.max(0, this.pulse - delta * 0.005);
      }

      findClosestLink() {
        const distanceA = Phaser.Math.Distance.BetweenPoints(this.blobA.plugPoint, this.blobB.socketPoint);
        const distanceB = Phaser.Math.Distance.BetweenPoints(this.blobB.plugPoint, this.blobA.socketPoint);
        return distanceA < distanceB
          ? { from: this.blobA, to: this.blobB, distance: distanceA }
          : { from: this.blobB, to: this.blobA, distance: distanceB };
      }

      connect(from, to) {
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

      disconnect() {
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

      drawCable(delta) {
        const g = this.cableGraphics;
        g.clear();
        if (this.connection && this.activeFrom && this.activeTo) {
          const start = this.activeFrom.plugPoint;
          const end = this.activeTo.socketPoint;
          const control = this.lerpPoint(start, end, 0.5);
          control.y -= 36 + Phaser.Math.Distance.BetweenPoints(start, end) * 0.08;
          g.lineStyle(18, 0xfad3e1, 0.95);
          g.beginPath();
          g.moveTo(start.x, start.y);
          g.quadraticBezierTo(control.x, control.y, end.x, end.y);
          g.strokePath();
          g.lineStyle(10, 0x111111, 0.15);
          g.beginPath();
          g.moveTo(start.x, start.y);
          g.quadraticBezierTo(control.x, control.y, end.x, end.y);
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
          const start = this.lerpPoint(this.releaseFrom, this.releaseTo, 1 - this.releaseProgress);
          const end = this.lerpPoint(this.releaseFrom, this.releaseTo, this.releaseProgress);
          const control = this.lerpPoint(start, end, 0.5);
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

      lerpPoint(a, b, t) {
        return new Phaser.Math.Vector2(
          Phaser.Math.Linear(a.x, b.x, t),
          Phaser.Math.Linear(a.y, b.y, t)
        );
      }
    }

    class MainScene extends Phaser.Scene {
      constructor() {
        super('MainScene');
        this.blobA = null;
        this.blobB = null;
        this.connectionSystem = null;
      }

      create() {
        const width = this.scale.width;
        const height = this.scale.height;
        this.cameras.main.setBackgroundColor('#ffffff');
        this.matter.world.setBounds(0, 0, width, height, 32, true, true, true, true);
        this.scale.on('resize', (gameSize) => {
          const { width, height } = gameSize;
          this.matter.world.setBounds(0, 0, width, height, 32, true, true, true, true);
        });
        this.matter.add.rectangle(width * 0.5, height - 28, width * 0.9, 48, {
          isStatic: true,
          friction: 0.8,
          restitution: 0.2,
          label: 'floor'
        });
        this.blobA = new BlobPerson(this, {
          x: width * 0.34,
          y: height * 0.42,
          color: 0xf7c6d5,
          accent: 0xffb3c7,
          flip: false,
          label: 'pinkBlob'
        });
        this.blobB = new BlobPerson(this, {
          x: width * 0.66,
          y: height * 0.44,
          color: 0xd0e8f9,
          accent: 0x93c8ff,
          flip: true,
          label: 'blueBlob'
        });
        this.connectionSystem = new ConnectionSystem(this, this.blobA, this.blobB);
        this.matter.add.pointerConstraint({
          constraint: {
            stiffness: 0.02,
            angularStiffness: 0.25,
            damping: 0.18,
            render: { visible: false }
          },
          label: 'dragConstraint'
        });
      }

      update(time, delta) {
        if (this.blobA) this.blobA.update(time, delta);
        if (this.blobB) this.blobB.update(time, delta);
        if (this.connectionSystem) this.connectionSystem.update(time, delta);
      }
    }

    const config = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#ffffff',
      parent: 'app',
      physics: {
        default: 'matter',
        matter: {
          gravity: { y: 0.9 },
          debug: false
        }
      },
      scene: [MainScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };

    new Phaser.Game(config);
  } catch (error) {
    if (window.showGameError) {
      window.showGameError(error.stack || String(error));
    }
    console.error(error);
  }
});
