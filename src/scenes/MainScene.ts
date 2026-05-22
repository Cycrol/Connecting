import Phaser from 'phaser';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;
    const titleStyle = {
      fontFamily: 'Helvetica, Arial, sans-serif',
      fontSize: '54px',
      color: '#111111',
      align: 'center' as const,
      fontStyle: '700'
    };

    this.cameras.main.setBackgroundColor('#ffffff');

    this.add.circle(width * 0.22, height * 0.28, 140, 0xffe7f0, 0.4);
    this.add.circle(width * 0.78, height * 0.24, 96, 0xd6f0ff, 0.35);
    this.add.circle(width * 0.5, height * 0.7, 180, 0xf7f4d8, 0.3);

    this.add.text(width * 0.5, height * 0.32, 'CONNECTING', titleStyle).setOrigin(0.5);
    this.add
      .text(width * 0.5, height * 0.48, 'A small emotional puzzle about finding a friend.', {
        fontFamily: 'Helvetica, Arial, sans-serif',
        fontSize: '18px',
        color: '#4b4b4b',
        align: 'center'
      })
      .setOrigin(0.5);

    const prompt = this.add
      .text(width * 0.5, height * 0.72, 'Tap to begin', {
        fontFamily: 'Helvetica, Arial, sans-serif',
        fontSize: '18px',
        color: '#111111',
        align: 'center'
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0.2,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.input.once('pointerdown', () => {
      this.scene.start('Chapter1Scene');
    });
  }
}
