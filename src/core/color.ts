import type { Point } from "./geometry";

/** RGBA color with 0–255 channels. */
export class Color {
  constructor(
    public readonly red: number,
    public readonly green: number,
    public readonly blue: number,
    public readonly alpha = 1,
  ) {}

  static readonly Black = new Color(0, 0, 0);
  static readonly White = new Color(255, 255, 255);
  static readonly Red = new Color(255, 0, 0);
  static readonly Green = new Color(0, 128, 0);
  static readonly Blue = new Color(0, 0, 255);
  static readonly Transparent = new Color(0, 0, 0, 0);
  static readonly Gray = new Color(128, 128, 128);
  static readonly Acid = new Color(255, 91, 46);
  static readonly Iris = new Color(74, 99, 255);
  static readonly Aqua = new Color(215, 255, 58);

  static fromHex(hex: string): Color {
    let h = hex.replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    if (h.length !== 6) throw new Error(`Invalid hex color: ${hex}`);
    return new Color(parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16));
  }

  withAlpha(alpha: number): Color {
    return new Color(this.red, this.green, this.blue, alpha);
  }

  lighten(amount: number): Color {
    const mix = (c: number) => Math.round(c + (255 - c) * amount);
    return new Color(mix(this.red), mix(this.green), mix(this.blue), this.alpha);
  }

  darken(amount: number): Color {
    return new Color(Math.round(this.red * (1 - amount)), Math.round(this.green * (1 - amount)), Math.round(this.blue * (1 - amount)), this.alpha);
  }

  toCss(): string {
    return `rgba(${this.red}, ${this.green}, ${this.blue}, ${this.alpha})`;
  }
}

export interface GradientStop {
  offset: number;
  color: Color;
}

export class LinearGradient {
  constructor(
    public readonly from: Point,
    public readonly to: Point,
    public readonly stops: readonly GradientStop[],
  ) {}
}

export type Paint = Color | LinearGradient;

export function isGradient(paint: Paint): paint is LinearGradient {
  return paint instanceof LinearGradient;
}

export class Stroke {
  constructor(
    public readonly paint: Paint,
    public readonly width = 1,
  ) {}
}

export const stroke = (paint: Paint, width = 1): Stroke => new Stroke(paint, width);

export function applyPaint(ctx: CanvasRenderingContext2D, paint: Paint, fallback: CanvasGradient | string): void {
  if (isGradient(paint)) {
    const gradient = ctx.createLinearGradient(paint.from.x, paint.from.y, paint.to.x, paint.to.y);
    for (const stop of paint.stops) gradient.addColorStop(Math.min(1, Math.max(0, stop.offset)), stop.color.toCss());
    ctx.fillStyle = gradient;
    ctx.strokeStyle = gradient;
  } else {
    ctx.fillStyle = paint.toCss();
    ctx.strokeStyle = paint.toCss();
    void fallback;
  }
}
