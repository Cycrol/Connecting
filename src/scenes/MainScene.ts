import Phaser from 'phaser';
import { BlobPerson } from '../entities/BlobPerson';
import { ConnectionSystem } from '../systems/ConnectionSystem';

export default class MainScene extends Phaser.Scene {
  private blobA!: BlobPerson;
  private blobB!: BlobPerson;
  private connectionSystem!: ConnectionSystem;

  constructor() {
    super('MainScene');
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.cameras.main.setBackgroundColor('#ffffff');
    this.matter.world.setBounds(0, 0, width, height, 32, true, true, true, true);
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

  update(time: number, delta: number) {
    this.blobA.update(time, delta);
    this.blobB.update(time, delta);
    this.connectionSystem.update(time, delta);
  }
}
