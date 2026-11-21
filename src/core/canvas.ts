import { applyPaint, type Paint, type Stroke } from "./color";
import { type Point, type Rectangle, type Size, size, Transform } from "./geometry";

export interface Font {
  readonly family?: string;
  readonly size?: number;
  readonly weight?: number | string;
  readonly style?: "normal" | "italic" | "oblique";
}

export const defaultFont: Required<Font> = {
  family: "ui-sans-serif, system-ui, sans-serif",
  size: 14,
  weight: 400,
  style: "normal",
};

export function fontCss(font: Font = {}): string {
  const f = { ...defaultFont, ...font };
  return `${f.style} ${f.weight} ${f.size}px ${f.family}`;
}

export interface TextOptions {
  readonly font?: Font;
  readonly color?: Paint;
  readonly align?: CanvasTextAlign;
  readonly baseline?: CanvasTextBaseline;
  readonly maxWidth?: number;
}

export interface TextMetricsValue {
  readonly width: number;
  readonly ascent: number;
  readonly descent: number;
  readonly height: number;
}

/** Word-wrap text to a pixel width using the canvas' own metrics. */
export function wrapText(canvas: Canvas, value: string, font: Font | undefined, maxWidth: number): string[] {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && canvas.measureText(candidate, font).width > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** The drawing surface handed to `View.render`. Vector-oriented, DPR-aware. */
export interface Canvas {
  readonly size: Size;
  save(): void;
  restore(): void;
  /** Multiplies the current global alpha (canvas save/restore brackets each view). */
  setAlpha(alpha: number): void;
  transform(t: Transform): void;
  clip(region: Rectangle, draw: (canvas: Canvas) => void): void;
  clear(paint?: Paint): void;
  fill(region: Rectangle, paint: Paint): void;
  rect(region: Rectangle, fill?: Paint, stroke?: Stroke, radius?: number): void;
  circle(center: Point, radius: number, fill?: Paint, stroke?: Stroke): void;
  ellipse(center: Point, radiusX: number, radiusY: number, rotation: number, fill?: Paint, stroke?: Stroke): void;
  line(from: Point, to: Point, stroke: Stroke): void;
  path(points: readonly Point[], close: boolean, fill?: Paint, stroke?: Stroke): void;
  text(value: string, at: Point, options?: TextOptions): void;
  measureText(value: string, font?: Font): TextMetricsValue;
}

/** Canvas2D backend. All public coordinates are CSS pixels; DPR is applied internally. */
export class Canvas2D implements Canvas {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly dpr: number;
  private _size: Size;

  constructor(
    public readonly element: HTMLCanvasElement,
    devicePixelRatio = 1,
  ) {
    const ctx = element.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    this.ctx = ctx;
    this.dpr = devicePixelRatio || 1;
    this._size = size(element.clientWidth || 1, element.clientHeight || 1);
    this.resize(this._size.width, this._size.height);
  }

  get size(): Size {
    return this._size;
  }

  resize(width: number, height: number): void {
    this._size = size(Math.max(1, width), Math.max(1, height));
    this.element.width = Math.round(this._size.width * this.dpr);
    this.element.height = Math.round(this._size.height * this.dpr);
    this.element.style.width = `${this._size.width}px`;
    this.element.style.height = `${this._size.height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  save(): void {
    this.ctx.save();
  }

  restore(): void {
    this.ctx.restore();
  }

  setAlpha(alpha: number): void {
    this.ctx.globalAlpha = this.ctx.globalAlpha * alpha;
  }

  transform(t: Transform): void {
    this.ctx.transform(t.a, t.b, t.c, t.d, t.e, t.f);
  }

  clip(region: Rectangle, draw: (canvas: Canvas) => void): void {
    this.save();
    this.ctx.beginPath();
    this.ctx.rect(region.x, region.y, region.width, region.height);
    this.ctx.clip();
    try {
      draw(this);
    } finally {
      this.restore();
    }
  }

  clear(paint?: Paint): void {
    if (paint) {
      this.fill({ x: 0, y: 0, width: this._size.width, height: this._size.height }, paint);
    } else {
      this.ctx.clearRect(0, 0, this._size.width, this._size.height);
    }
  }

  fill(region: Rectangle, paint: Paint): void {
    applyPaint(this.ctx, paint, "");
    this.ctx.fillRect(region.x, region.y, region.width, region.height);
  }

  rect(region: Rectangle, fill?: Paint, outline?: Stroke, radius = 0): void {
    this.ctx.beginPath();
    if (radius > 0) {
      this.ctx.roundRect(region.x, region.y, region.width, region.height, radius);
    } else {
      this.ctx.rect(region.x, region.y, region.width, region.height);
    }
    if (fill) {
      applyPaint(this.ctx, fill, "");
      this.ctx.fill();
    }
    if (outline) this.strokePath(outline);
  }

  circle(center: Point, radius: number, fill?: Paint, outline?: Stroke): void {
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    if (fill) {
      applyPaint(this.ctx, fill, "");
      this.ctx.fill();
    }
    if (outline) this.strokePath(outline);
  }

  ellipse(center: Point, radiusX: number, radiusY: number, rotation: number, fill?: Paint, outline?: Stroke): void {
    this.ctx.beginPath();
    this.ctx.ellipse(center.x, center.y, Math.abs(radiusX), Math.abs(radiusY), rotation, 0, Math.PI * 2);
    if (fill) {
      applyPaint(this.ctx, fill, "");
      this.ctx.fill();
    }
    if (outline) this.strokePath(outline);
  }

  line(from: Point, to: Point, outline: Stroke): void {
    this.ctx.beginPath();
    this.ctx.moveTo(from.x, from.y);
    this.ctx.lineTo(to.x, to.y);
    this.strokePath(outline);
  }

  path(points: readonly Point[], close: boolean, fill?: Paint, outline?: Stroke): void {
    if (points.length === 0) return;
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) this.ctx.lineTo(points[i].x, points[i].y);
    if (close) this.ctx.closePath();
    if (fill) {
      applyPaint(this.ctx, fill, "");
      this.ctx.fill();
    }
    if (outline) this.strokePath(outline);
  }

  text(value: string, at: Point, options: TextOptions = {}): void {
    this.ctx.font = fontCss(options.font);
    this.ctx.textAlign = options.align ?? "left";
    this.ctx.textBaseline = options.baseline ?? "alphabetic";
    if (options.color) applyPaint(this.ctx, options.color, "");
    if (options.maxWidth !== undefined) this.ctx.fillText(value, at.x, at.y, options.maxWidth);
    else this.ctx.fillText(value, at.x, at.y);
  }

  measureText(value: string, font?: Font): TextMetricsValue {
    this.ctx.font = fontCss(font);
    const m = this.ctx.measureText(value);
    const ascent = m.actualBoundingBoxAscent ?? (font?.size ?? defaultFont.size) * 0.8;
    const descent = m.actualBoundingBoxDescent ?? (font?.size ?? defaultFont.size) * 0.2;
    return { width: m.width, ascent, descent, height: ascent + descent };
  }

  private strokePath(outline: Stroke): void {
    applyPaint(this.ctx, outline.paint, "");
    this.ctx.lineWidth = outline.width;
    this.ctx.stroke();
  }
}

/** Headless canvas for tests and layout measurement (no DOM required). */
export class MeasuringCanvas implements Canvas {
  readonly size: Size = size(0, 0);
  save(): void {}
  restore(): void {}
  setAlpha(): void {}
  transform(): void {}
  clip(_region: Rectangle, draw: (canvas: Canvas) => void): void {
    draw(this);
  }
  clear(): void {}
  fill(): void {}
  rect(): void {}
  circle(): void {}
  ellipse(): void {}
  line(): void {}
  path(): void {}
  text(): void {}
  measureText(value: string, font?: Font): TextMetricsValue {
    const fontSize = font?.size ?? defaultFont.size;
    return { width: value.length * fontSize * 0.6, ascent: fontSize * 0.8, descent: fontSize * 0.2, height: fontSize };
  }
}

/** Convenience: run a draw pass with an identity transform. */
export function renderToCanvas(canvas: Canvas, draw: (canvas: Canvas) => void): void {
  canvas.save();
  canvas.transform(Transform.identity);
  try {
    draw(canvas);
  } finally {
    canvas.restore();
  }
}
