import Phaser from 'phaser';
import AudioManager from '../audio/AudioManager';
import { BlobPerson } from '../entities/BlobPerson';
import { ConnectionSystem } from '../systems/ConnectionSystem';

export default class Chapter1Scene extends Phaser.Scene {
  private audio!: AudioManager;
  private player!: BlobPerson;
  private friends: BlobPerson[] = [];
  private connectionSystem!: ConnectionSystem;
  private promptText!: Phaser.GameObjects.Text;
  private completed = false;
  private bloom?: Phaser.GameObjects.Ellipse;

  constructor() {
    super('Chapter1Scene');
  }

  create() {
    this.audio = new AudioManager();
    this.createEnvironment();
    this.createPlayerAndFriends();
    this.createCamera();
    this.createPrompt();
    this.createPointerDrag();
    this.registerEvents();

    this.input.once('pointerdown', async () => {
      await this.audio.resume();
      this.audio.startAmbient();
    });
  }

  update(time: number, delta: number) {
    this.player.update(time, delta);
    this.friends.forEach((friend) => friend.update(time, delta));
    this.connectionSystem.update(time, delta);

    if (this.completed && this.bloom) {
      this.bloom.y -= delta * 0.01;
      this.bloom.alpha = Phaser.Math.Clamp(this.bloom.alpha - delta * 0.0003, 0.12, 0.45);
    }
  }

  private createEnvironment() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.cameras.main.setBackgroundColor('#ffffff');
    this.matter.world.setBounds(0, 0, width, height, 48, true, true, true, true);

    this.add.circle(width * 0.25, height * 0.22, 140, 0xfff0f4, 0.5);
    this.add.circle(width * 0.72, height * 0.18, 100, 0xe8f6ff, 0.42);
    this.add.circle(width * 0.55, height * 0.72, 160, 0xf7f4e5, 0.36);

    this.add.rectangle(width * 0.5, height + 24, width * 0.95, 64, 0x111111, 0.03).setDepth(-2);
  }

  private createPlayerAndFriends() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.player = new BlobPerson(this, {
      x: width * 0.5,
      y: height * 0.64,
      color: 0xfff8ed,
      accent: 0xf0b899,
      label: 'player',
      isPlayer: true,
      emotion: 'calm'
    });

    const friendA = new BlobPerson(this, {
      x: width * 0.28,
      y: height * 0.38,
      color: 0xe8f5ff,
      accent: 0x9dc7ff,
      label: 'friendA',
      emotion: 'lonely'
    });

    const friendB = new BlobPerson(this, {
      x: width * 0.72,
      y: height * 0.34,
      color: 0xfff3dc,
      accent: 0xf5c79c,
      label: 'friendB',
      emotion: 'lonely'
    });

    this.friends = [friendA, friendB];
    this.connectionSystem = new ConnectionSystem(this, this.player, this.friends);
  }

  private createCamera() {
    this.cameras.main.startFollow(this.player.graphics, false, 0.08, 0.08);
    this.cameras.main.setZoom(1);
    this.cameras.main.setLerp(0.08, 0.08);
  }

  private createPointerDrag() {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const hitDistance = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, this.player.body.position.x, this.player.body.position.y);
      if (hitDistance < this.player.radius + 8) {
        this.player.startDrag(pointer.worldX, pointer.worldY);
      }
    });

    this.player.graphics.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.player.startDrag(pointer.worldX, pointer.worldY);
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.player.isDragging) {
        this.player.updateDrag(pointer.worldX, pointer.worldY);
      }
    });

    this.input.on('pointerup', () => {
      if (this.player.isDragging) {
        this.player.stopDrag();
      }
    });
  }

  private createPrompt() {
    this.promptText = this.add
      .text(this.scale.width * 0.5, this.scale.height * 0.1, 'Drag your plug toward another blob.', {
        fontFamily: 'Helvetica, Arial, sans-serif',
        fontSize: '18px',
        color: '#272727',
        align: 'center'
      })
      .setOrigin(0.5);
  }

  private registerEvents() {
    this.events.on('connection-made', (blob: BlobPerson) => {
      if (!this.completed) {
        blob.setEmotion('warm');
        this.player.setEmotion('listening');
        this.audio.playConnect();
        this.audio.playPulse();
        this.promptText.setText('A quiet connection begins to glow.');
        this.showBloom(blob);
        this.completed = true;
      } else {
        this.audio.playPulse();
        this.promptText.setText('The room feels less empty.');
      }
    });
  }

  private showBloom(target: BlobPerson) {
    this.bloom = this.add
      .ellipse(target.body.position.x, target.body.position.y, 240, 160, 0xffe3df, 0.32)
      .setDepth(-1);

    this.tweens.add({
      targets: this.bloom,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
}
