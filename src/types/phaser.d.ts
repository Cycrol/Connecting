declare namespace Phaser {
  namespace Types {
    namespace Core {
      interface GameConfig {
        type?: string;
        width?: number;
        height?: number;
        backgroundColor?: string;
        parent?: string;
        physics?: any;
        scene?: any[];
        scale?: any;
      }
    }
    namespace Physics {
      namespace Matter {
        type MatterConstraint = any;
      }
    }
  }

  namespace Scale {
    enum ScaleModes {
      RESIZE = 'RESIZE'
    }
    const CENTER_BOTH: number;
  }

  namespace Physics {
    namespace Matter {
      type MatterBody = any;
    }
  }

  namespace GameObjects {
    class Graphics {
      clear(): this;
      fillStyle(color: number, alpha?: number): this;
      strokeStyle(color: number, alpha?: number): this;
      lineStyle(width: number, color: number, alpha?: number): this;
      fillEllipse(x: number, y: number, width: number, height: number): this;
      fillCircle(x: number, y: number, radius: number): this;
      strokeCircle(x: number, y: number, radius: number): this;
      beginPath(): this;
      moveTo(x: number, y: number): this;
      quadraticCurveTo(cx: number, cy: number, x: number, y: number): this;
      strokePath(): this;
      setDepth(depth: number): this;
    }

    class Container {
      x: number;
      y: number;
      scaleX: number;
      scaleY: number;
      constructor(x: number, y: number, children?: any[]);
      setPosition(x: number, y: number): this;
      setScale(x: number, y: number): this;
      setScale(x: number, y: number): this;
    }
  }

  class Game {
    constructor(config: Types.Core.GameConfig);
  }

  class Scene {
    constructor(key?: string);
    scale: { width: number; height: number };
    cameras: { main: { setBackgroundColor(color: string): void } };
    matter: any;
    add: {
      graphics(config?: any): GameObjects.Graphics;
      container(x: number, y: number, children?: any[]): GameObjects.Container;
    };
    cameras: any;
  }

  namespace Math {
    class Vector2 {
      x: number;
      y: number;
      constructor(x?: number, y?: number);
      clone(): Vector2;
    }
    function FloatBetween(min: number, max: number): number;
    function Clamp(value: number, min: number, max: number): number;
    function Linear(a: number, b: number, t: number): number;
    namespace Distance {
      function BetweenPoints(a: Vector2, b: Vector2): number;
    }
  }
}

declare module 'phaser' {
  export default Phaser;
  export = Phaser;
}
