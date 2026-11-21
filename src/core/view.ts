import type { Canvas } from "./canvas";
import type { Paint, Stroke } from "./color";
import type { EventHandlers, FocusEventData, KeyEventData, PointerEventData } from "./events";
import {
  atOrigin,
  contains,
  point,
  Transform,
  type Point,
  type Rectangle,
  type Size,
  size,
} from "./geometry";
import type { Layout } from "./layout";

/** A property whose writes invalidate its owning view. */
export class RenderProperty<T> {
  constructor(
    private readonly owner: View,
    private current: T,
  ) {}

  get value(): T {
    return this.current;
  }

  set value(next: T) {
    if (this.current === next) return;
    this.current = next;
    this.owner.invalidate();
  }
}

export function renderProperty<T>(owner: View, initial: T): RenderProperty<T> {
  return new RenderProperty(owner, initial);
}

/** The retained-mode node of a Doodle scene graph. Bounds are relative to the parent. */
export class View implements EventHandlers {
  bounds: Rectangle;
  background?: Paint;
  border?: Stroke;
  cornerRadius = 0;
  alpha = 1;
  visible = true;
  clipToBounds = false;
  transform = Transform.identity;
  cursor = "default";
  acceptsKeyboardFocus = false;
  focused = false;
  layoutManager?: Layout;
  name?: string;
  /** Root views resize with the display by default. */
  fillsDisplay = true;

  /** Called by the renderer above this view whenever a frame must be produced. */
  onInvalidate?: () => void;

  private readonly _children: View[] = [];
  private _parent: View | undefined;
  private _needsLayout = true;

  constructor(bounds: Rectangle = { x: 0, y: 0, width: 0, height: 0 }) {
    this.bounds = bounds;
  }

  get parent(): View | undefined {
    return this._parent;
  }

  get children(): readonly View[] {
    return this._children;
  }

  get x(): number {
    return this.bounds.x;
  }

  get y(): number {
    return this.bounds.y;
  }

  get width(): number {
    return this.bounds.width;
  }

  get height(): number {
    return this.bounds.height;
  }

  get position(): Point {
    return point(this.bounds.x, this.bounds.y);
  }

  set position(value: Point) {
    this.bounds = { ...this.bounds, x: value.x, y: value.y };
    this.invalidate();
  }

  setSize(width: number, height: number): void {
    if (this.bounds.width === width && this.bounds.height === height) return;
    this.bounds = { ...this.bounds, width, height };
    this.setNeedsLayout();
    this.invalidate();
  }

  /** Override to draw custom vector content. */
  render(_canvas: Canvas): void {}

  /** Override to position children manually; a layoutManager is applied afterwards. */
  layout(): void {}

  /** Override to report the natural size this view wants. */
  preferredSize(): Size {
    return size(0, 0);
  }

  /** Final paint pass: transform, background, custom content, children. */
  draw(canvas: Canvas): void {
    if (!this.visible || this.alpha <= 0 || this.bounds.width <= 0 || this.bounds.height <= 0) return;

    canvas.save();
    canvas.transform(Transform.translate(this.bounds.x, this.bounds.y));
    canvas.transform(this.transform);
    canvas.setAlpha(this.alpha);

    const local = atOrigin(this.bounds);
    if (this.clipToBounds) {
      canvas.clip(local, (c) => this.paintContent(c, local));
    } else {
      this.paintContent(canvas, local);
    }

    canvas.restore();
  }

  private paintContent(canvas: Canvas, local: Rectangle): void {
    if (this.background) canvas.fill(local, this.background);
    this.render(canvas);
    if (this.border) canvas.rect(local, undefined, this.border, this.cornerRadius);
    for (const child of this._children) child.draw(canvas);
  }

  addChild(...views: View[]): this {
    for (const view of views) {
      if (view._parent === this) continue;
      view._parent?._children.splice(view._parent._children.indexOf(view), 1);
      view._parent = this;
      this._children.push(view);
    }
    this.setNeedsLayout();
    this.invalidate();
    return this;
  }

  removeChild(view: View): boolean {
    const index = this._children.indexOf(view);
    if (index < 0) return false;
    this._children.splice(index, 1);
    view._parent = undefined;
    this.setNeedsLayout();
    this.invalidate();
    return true;
  }

  removeAllChildren(): this {
    for (const child of this._children) child._parent = undefined;
    this._children.length = 0;
    this.setNeedsLayout();
    this.invalidate();
    return this;
  }

  /** Request a repaint. Bubbles to the display, which schedules a frame. */
  invalidate(): void {
    this.onInvalidate?.();
    this._parent?.invalidate();
  }

  setNeedsLayout(): void {
    this._needsLayout = true;
    this._parent?.setNeedsLayout();
  }

  /** Resolve layout for this subtree. */
  doLayout(): void {
    if (this._needsLayout) {
      this.layout();
      this.layoutManager?.layout(this);
      this._needsLayout = false;
    }
    for (const child of this._children) child.doLayout();
  }

  /** Returns the topmost view at `at` (a point in this view's parent coordinate space). */
  hitTest(at: Point): View | null {
    if (!this.visible || this.alpha <= 0 || !contains(this.bounds, at)) return null;

    const local = this.transform.inverse().apply(point(at.x - this.bounds.x, at.y - this.bounds.y));
    for (let i = this._children.length - 1; i >= 0; i--) {
      const hit = this._children[i].hitTest(local);
      if (hit) return hit;
    }
    return this;
  }

  /** Convert a point in this view's parent space into this view's local content space. */
  toLocal(at: Point): Point {
    return this.transform.inverse().apply(point(at.x - this.bounds.x, at.y - this.bounds.y));
  }

  // ----- Event handlers (set these to respond to input) -----
  pointerDown?: (event: PointerEventData) => boolean;
  pointerUp?: (event: PointerEventData) => boolean;
  pointerMove?: (event: PointerEventData) => boolean;
  pointerEnter?: (event: PointerEventData) => boolean;
  pointerExit?: (event: PointerEventData) => boolean;
  click?: (event: PointerEventData) => boolean;
  scroll?: (event: PointerEventData) => boolean;
  keyDown?: (event: KeyEventData) => boolean;
  keyUp?: (event: KeyEventData) => boolean;
  keyPress?: (event: KeyEventData) => boolean;
  focus?: (event: FocusEventData) => boolean;
  blur?: (event: FocusEventData) => boolean;
}

/** Chainable View builder, mirroring Doodle's `view { ... }` idiom. */
export function view(configure: (v: View) => void = () => {}): View {
  const v = new View();
  configure(v);
  return v;
}
