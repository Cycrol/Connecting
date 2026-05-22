import Phaser from 'phaser';

export function lerpPoint(
  a: Phaser.Math.Vector2,
  b: Phaser.Math.Vector2,
  t: number
): Phaser.Math.Vector2 {
  return new Phaser.Math.Vector2(
    Phaser.Math.Linear(a.x, b.x, t),
    Phaser.Math.Linear(a.y, b.y, t)
  );
}

export function clampPoint(value: Phaser.Math.Vector2, min: number, max: number) {
  const length = Phaser.Math.Clamp(value.length(), min, max);
  return value.normalize().scale(length);
}
