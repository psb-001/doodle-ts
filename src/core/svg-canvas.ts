import { fontCss, type Canvas, type Font, type TextMetricsValue, type TextOptions } from "./canvas";
import { Color, isGradient, type Paint, type Stroke } from "./color";
import { point, size, Transform, type Point, type Rectangle, type Size } from "./geometry";

const esc = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

/**
 * Headless SVG renderer implementing the same Canvas contract as Canvas2D.
 * Useful for SSR thumbnails, snapshots and testing without a browser.
 */
export class SvgCanvas implements Canvas {
  private parts: string[] = [];
  private defs: string[] = [];
  private readonly stack: Array<{ transform: Transform; alpha: number }> = [];
  private current = Transform.identity;
  private alpha = 1;
  private counter = 0;

  constructor(public readonly size: Size) {}

  static of(width: number, height: number): SvgCanvas {
    return new SvgCanvas(size(width, height));
  }

  get svg(): string {
    const width = Math.round(this.size.width);
    const height = Math.round(this.size.height);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${this.defs.join("")}</defs>${this.parts.join("")}</svg>`;
  }

  save(): void {
    this.stack.push({ transform: this.current, alpha: this.alpha });
  }

  restore(): void {
    const state = this.stack.pop();
    if (!state) return;
    this.current = state.transform;
    this.alpha = state.alpha;
  }

  setAlpha(alpha: number): void {
    this.alpha *= alpha;
  }

  transform(t: Transform): void {
    this.current = this.current.then(t);
  }

  clear(paint?: Paint): void {
    this.parts = [];
    this.defs = [];
    if (paint) this.fill({ x: 0, y: 0, width: this.size.width, height: this.size.height }, paint);
  }

  clip(region: Rectangle, draw: (canvas: Canvas) => void): void {
    const id = this.nextId("clip");
    const box = this.mapRect(region);
    this.defs.push(`<clipPath id="${id}"><rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}"/></clipPath>`);
    this.parts.push(`<g clip-path="url(#${id})">`);
    draw(this);
    this.parts.push("</g>");
  }

  fill(region: Rectangle, paint: Paint): void {
    this.emit(this.rectElement(region, paint, undefined, 0));
  }

  rect(region: Rectangle, fill?: Paint, outline?: Stroke, radius = 0): void {
    this.emit(this.rectElement(region, fill, outline, radius));
  }

  circle(center: Point, radius: number, fill?: Paint, outline?: Stroke): void {
    this.emit(`<circle cx="${n(center.x)}" cy="${n(center.y)}" r="${n(radius)}" ${this.style(fill, outline)}/>`);
  }

  ellipse(center: Point, radiusX: number, radiusY: number, rotation: number, fill?: Paint, outline?: Stroke): void {
    this.emit(
      `<ellipse cx="${n(center.x)}" cy="${n(center.y)}" rx="${n(Math.abs(radiusX))}" ry="${n(Math.abs(radiusY))}" transform="rotate(${n((rotation * 180) / Math.PI)} ${n(center.x)} ${n(center.y)})" ${this.style(fill, outline)}/>`,
    );
  }

  line(from: Point, to: Point, outline: Stroke): void {
    this.emit(`<line x1="${n(from.x)}" y1="${n(from.y)}" x2="${n(to.x)}" y2="${n(to.y)}" ${this.style(undefined, outline)}/>`);
  }

  path(points: readonly Point[], close: boolean, fill?: Paint, outline?: Stroke): void {
    if (points.length === 0) return;
    const d = `M ${points.map((p) => `${n(p.x)} ${n(p.y)}`).join(" L ")}${close ? " Z" : ""}`;
    this.emit(`<path d="${d}" ${this.style(fill, outline)}/>`);
  }

  text(value: string, at: Point, options: TextOptions = {}): void {
    const align = options.align ?? "left";
    const anchor = align === "center" ? "middle" : align === "right" ? "end" : "start";
    const baseline = options.baseline === "middle" ? "central" : options.baseline === "top" ? "hanging" : "alphabetic";
    const fill = this.paintAttr(options.color ?? Color.Black);
    this.emit(
      `<text x="${n(at.x)}" y="${n(at.y)}" font-family="${esc(this.fontFamily(options.font))}" font-size="${n(options.font?.size ?? 14)}" font-weight="${options.font?.weight ?? 400}" font-style="${options.font?.style ?? "normal"}" text-anchor="${anchor}" dominant-baseline="${baseline}" ${fill}>${esc(value)}</text>`,
    );
  }

  measureText(value: string, font?: Font): TextMetricsValue {
    const fontSize = font?.size ?? 14;
    const ratio = font?.family?.includes("mono") ? 0.62 : 0.55;
    const width = value.length * fontSize * ratio;
    return { width, ascent: fontSize * 0.8, descent: fontSize * 0.2, height: fontSize };
  }

  private fontFamily(font?: Font): string {
    return (font?.family ?? fontCss({}).split(" ").slice(-1)[0]).replace(/^["']|["']$/g, "");
  }

  private rectElement(region: Rectangle, fill?: Paint, outline?: Stroke, radius = 0): string {
    const rx = radius ? ` rx="${n(radius)}"` : "";
    return `<rect x="${n(region.x)}" y="${n(region.y)}" width="${n(region.width)}" height="${n(region.height)}"${rx} ${this.style(fill, outline)}/>`;
  }

  private style(fill?: Paint, outline?: Stroke): string {
    const fillAttr = fill ? this.paintAttr(fill) : 'fill="none"';
    const strokeAttr = outline ? ` stroke="${this.paintValue(outline.paint)}" stroke-width="${n(outline.width)}"` : "";
    return `${fillAttr}${strokeAttr}`;
  }

  private paintAttr(paint: Paint, attribute = "fill"): string {
    return `${attribute}="${this.paintValue(paint)}"`;
  }

  private paintValue(paint: Paint): string {
    if (!isGradient(paint)) return paint.toCss();
    const id = this.nextId("grad");
    const from = paint.from;
    const to = paint.to;
    const stops = paint.stops
      .map((stop) => `<stop offset="${n(stop.offset)}" stop-color="${stop.color.toCss()}"/>`)
      .join("");
    this.defs.push(
      `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${n(from.x)}" y1="${n(from.y)}" x2="${n(to.x)}" y2="${n(to.y)}">${stops}</linearGradient>`,
    );
    return `url(#${id})`;
  }

  private mapRect(region: Rectangle): Rectangle {
    const corners = [
      point(region.x, region.y),
      point(region.x + region.width, region.y),
      point(region.x, region.y + region.height),
      point(region.x + region.width, region.y + region.height),
    ].map((p) => this.current.apply(p));
    const xs = corners.map((p) => p.x);
    const ys = corners.map((p) => p.y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
  }

  private emit(element: string): void {
    this.parts.push(`<g transform="${matrix(this.current)}" opacity="${n(this.alpha)}">${element}</g>`);
  }

  private nextId(prefix: string): string {
    this.counter += 1;
    return `${prefix}-${this.counter}`;
  }
}

function n(value: number): string {
  return Number.isFinite(value) ? String(Math.round(value * 100) / 100) : "0";
}

function matrix(t: Transform): string {
  return `matrix(${n(t.a)} ${n(t.b)} ${n(t.c)} ${n(t.d)} ${n(t.e)} ${n(t.f)})`;
}
