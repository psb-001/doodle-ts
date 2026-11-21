/** Immutable 2D point. */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Mutable 2D size. */
export interface Size {
  width: number;
  height: number;
}

/** Axis-aligned rectangle. */
export interface Rectangle {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export const point = (x = 0, y = 0): Point => ({ x, y });
export const size = (width = 0, height = 0): Size => ({ width, height });
export const rect = (x = 0, y = 0, width = 0, height = 0): Rectangle => ({
  x,
  y,
  width,
  height,
});

export const origin: Point = point(0, 0);
export const emptyRectangle: Rectangle = rect(0, 0, 0, 0);

export function translate(p: Point, dx: number, dy: number): Point {
  return point(p.x + dx, p.y + dy);
}

export function inset(r: Rectangle, amount: number): Rectangle;
export function inset(r: Rectangle, top: number, right: number, bottom: number, left: number): Rectangle;
export function inset(r: Rectangle, a: number, b?: number, c?: number, d?: number): Rectangle {
  const top = a;
  const right = b ?? a;
  const bottom = c ?? a;
  const left = d ?? b ?? a;
  return rect(r.x + left, r.y + top, Math.max(0, r.width - left - right), Math.max(0, r.height - top - bottom));
}

export function union(a: Rectangle, b: Rectangle): Rectangle {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return rect(x, y, Math.max(a.x + a.width, b.x + b.width) - x, Math.max(a.y + a.height, b.y + b.height) - y);
}

export const right = (r: Rectangle): number => r.x + r.width;
export const bottom = (r: Rectangle): number => r.y + r.height;
export const centerX = (r: Rectangle): number => r.x + r.width / 2;
export const centerY = (r: Rectangle): number => r.y + r.height / 2;
export const center = (r: Rectangle): Point => point(centerX(r), centerY(r));

export function contains(r: Rectangle, p: Point): boolean {
  return p.x >= r.x && p.y >= r.y && p.x < r.x + r.width && p.y < r.y + r.height;
}

export function intersects(a: Rectangle, b: Rectangle): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

export const atOrigin = (r: Rectangle): Rectangle => rect(0, 0, r.width, r.height);

/** Affine 2D transform, compatible with the DOMMatrix a–f component order. */
export class Transform {
  constructor(
    public a = 1,
    public b = 0,
    public c = 0,
    public d = 1,
    public e = 0,
    public f = 0,
  ) {}

  static get identity(): Transform {
    return new Transform();
  }

  static translate(x: number, y: number): Transform {
    return new Transform(1, 0, 0, 1, x, y);
  }

  static scale(x: number, y = x): Transform {
    return new Transform(x, 0, 0, y, 0, 0);
  }

  static rotate(radians: number): Transform {
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return new Transform(cos, sin, -sin, cos, 0, 0);
  }

  /** Returns this ∘ other (apply other first). */
  then(other: Transform): Transform {
    return new Transform(
      this.a * other.a + this.c * other.b,
      this.b * other.a + this.d * other.b,
      this.a * other.c + this.c * other.d,
      this.b * other.c + this.d * other.d,
      this.a * other.e + this.c * other.f + this.e,
      this.b * other.e + this.d * other.f + this.f,
    );
  }

  apply(p: Point): Point {
    return point(this.a * p.x + this.c * p.y + this.e, this.b * p.x + this.d * p.y + this.f);
  }

  inverse(): Transform {
    const det = this.a * this.d - this.b * this.c;
    if (det === 0) return Transform.identity;
    return new Transform(
      this.d / det,
      -this.b / det,
      -this.c / det,
      this.a / det,
      (this.c * this.f - this.d * this.e) / det,
      (this.b * this.e - this.a * this.f) / det,
    );
  }

  equals(other: Transform): boolean {
    return (
      this.a === other.a && this.b === other.b && this.c === other.c &&
      this.d === other.d && this.e === other.e && this.f === other.f
    );
  }
}
