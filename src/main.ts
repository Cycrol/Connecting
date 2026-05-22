import Phaser from 'phaser';
import MainScene from './scenes/MainScene';
import Chapter1Scene from './levels/Chapter1Scene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#ffffff',
  parent: 'app',
  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: 0 },
      debug: false,
      enableSleeping: false,
      positionIterations: 6,
      velocityIterations: 4
    }
  },
  scene: [MainScene, Chapter1Scene],
  scale: {
    mode: Phaser.Scale.ScaleModes.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

new Phaser.Game(config);
