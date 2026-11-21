import { Canvas2D, type Canvas } from "./canvas";
import type { Paint } from "./color";
import type { FocusEventData, KeyEventData, PointerEventData } from "./events";
import { contains, point, rect, type Point, type Rectangle, type Size, size } from "./geometry";
import { InputManager } from "./input";
import type { View } from "./view";

/** Root of the scene graph. Owns the canvas, layout, render scheduling and input routing. */
export class Display {
  private readonly roots: View[] = [];
  private frameRequested = false;
  private needsLayout = true;
  private background?: Paint;
  private hovered: View | null = null;
  private _focused: View | undefined;

  input?: InputManager;

  constructor(public readonly canvas: Canvas) {}

  get size(): Size {
    return this.canvas.size;
  }

  get focused(): View | undefined {
    return this._focused;
  }

  get views(): readonly View[] {
    return this.roots;
  }

  setBackground(background: Paint): void {
    this.background = background;
    this.requestFrame();
  }

  add(...views: View[]): this {
    for (const view of views) {
      view.onInvalidate = () => this.requestFrame();
      if (view.fillsDisplay && (view.width === 0 || view.height === 0)) {
        view.bounds = rect(0, 0, this.size.width, this.size.height);
      }
      this.roots.push(view);
    }
    this.needsLayout = true;
    this.requestFrame();
    return this;
  }

  remove(view: View): boolean {
    const index = this.roots.indexOf(view);
    if (index < 0) return false;
    this.roots.splice(index, 1);
    view.onInvalidate = undefined;
    this.requestFrame();
    return true;
  }

  resize(width: number, height: number): void {
    if (this.canvas instanceof Canvas2D) this.canvas.resize(width, height);
    for (const root of this.roots) {
      if (root.fillsDisplay) root.bounds = rect(0, 0, width, height);
      root.setNeedsLayout();
    }
    this.needsLayout = true;
    this.requestFrame();
  }

  requestFrame(): void {
    if (this.frameRequested || typeof requestAnimationFrame === "undefined") return;
    this.frameRequested = true;
    requestAnimationFrame(() => {
      this.frameRequested = false;
      this.render();
    });
  }

  render(): void {
    if (this.needsLayout) {
      for (const root of this.roots) root.doLayout();
      this.needsLayout = false;
    }
    if (this.background) this.canvas.fill({ x: 0, y: 0, width: this.size.width, height: this.size.height }, this.background);
    else this.canvas.clear();
    for (const root of this.roots) root.draw(this.canvas);
  }

  hitTest(at: Point): View | null {
    for (let i = this.roots.length - 1; i >= 0; i--) {
      const hit = this.roots[i].hitTest(at);
      if (hit) return hit;
    }
    return null;
  }

  focus(view: View | undefined): void {
    if (this._focused === view) return;
    const previous = this._focused;
    if (previous) {
      previous.focused = false;
      this.dispatchDirect(previous, { type: "blur" });
    }
    this._focused = view;
    if (view) {
      view.focused = true;
      this.dispatchDirect(view, { type: "focus" });
    }
  }

  /** Tracks pointer enter/exit as the pointer moves between views. */
  updateHover(at: Point, event: PointerEventData): void {
    const next = this.hitTest(at);
    if (next === this.hovered) {
      if (next) this.dispatchPointer(next, event);
      return;
    }
    if (this.hovered) this.dispatchPointer(this.hovered, { ...event, type: "pointer-exit" });
    this.hovered = next;
    if (next) this.dispatchPointer(next, { ...event, type: "pointer-enter" });
    if (this.element) this.element.style.cursor = next?.cursor ?? "default";
  }

  private get element(): HTMLCanvasElement | undefined {
    return this.canvas instanceof Canvas2D ? this.canvas.element : undefined;
  }

  /** Dispatch a pointer event to a view, then bubble up until consumed. */
  dispatchPointer(target: View, event: PointerEventData): void {
    let current: View | undefined = target;
    while (current) {
      const handler = eventHandlers[event.type]?.(current);
      if (handler?.(this.relativeEvent(current, event, event.at))) return;
      current = current.parent;
    }
  }

  dispatchKey(event: KeyEventData): void {
    let current: View | undefined = this._focused;
    while (current) {
      const handler = keyHandlers[event.type](current);
      if (handler?.(event)) return;
      current = current.parent;
    }
  }

  private dispatchDirect(target: View, event: FocusEventData): void {
    target[event.type]?.(event);
  }

  private relativeEvent(target: View, event: PointerEventData, at: Point): PointerEventData {
    let p = at;
    let current: View | undefined = target;
    while (current) {
      p = current.toLocal(p);
      current = current.parent;
    }
    return { ...event, at: p };
  }

  /** Test hook: render using an explicit layout pass. */
  layout(): void {
    for (const root of this.roots) root.doLayout();
    this.needsLayout = false;
  }
}

const eventHandlers = {
  "pointer-down": (v: View) => v.pointerDown,
  "pointer-up": (v: View) => v.pointerUp,
  "pointer-move": (v: View) => v.pointerMove,
  "pointer-enter": (v: View) => v.pointerEnter,
  "pointer-exit": (v: View) => v.pointerExit,
  click: (v: View) => v.click,
  scroll: (v: View) => v.scroll,
} satisfies Record<string, (view: View) => ((event: PointerEventData) => boolean) | undefined>;

const keyHandlers = {
  "key-down": (v: View) => v.keyDown,
  "key-up": (v: View) => v.keyUp,
  "key-press": (v: View) => v.keyPress,
} satisfies Record<string, (view: View) => ((event: KeyEventData) => boolean) | undefined>;

export interface Application {
  shutdown(): void;
}

export interface ApplicationContext {
  display: Display;
  canvas: Canvas;
}

/** Mounts a Doodle application onto a canvas element. */
export function mountApplication(
  element: HTMLCanvasElement,
  create: (context: ApplicationContext) => Application,
): Application & ApplicationContext & { display: Display; canvas: Canvas } {
  const canvas = new Canvas2D(element, window.devicePixelRatio || 1);
  const display = new Display(canvas);
  const input = new InputManager(element, display);
  display.input = input;

  const app = create({ display, canvas });
  const observer = typeof ResizeObserver !== "undefined"
    ? new ResizeObserver((entries) => {
        const box = entries[0]?.contentRect;
        if (box) display.resize(box.width, box.height);
      })
    : undefined;
  observer?.observe(element);
  display.resize(element.clientWidth, element.clientHeight);

  return {
    display,
    canvas,
    shutdown() {
      observer?.disconnect();
      input.shutdown();
      for (const root of [...display.views]) display.remove(root);
      app.shutdown();
    },
  };
}

export { contains, point, rect, size, type Point, type Rectangle, type Size };
