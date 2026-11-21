import { fromKeyboardEvent, fromPointerEvent, type KeyEventData, type PointerEventData } from "./events";
import { point } from "./geometry";
import type { Display } from "./display";

/** Bridges DOM pointer/keyboard/wheel events into the view tree. */
export class InputManager {
  private readonly disposers: Array<() => void> = [];
  private downView: ReturnType<Display["hitTest"]> = null;
  private downAt = point(0, 0);

  constructor(
    private readonly element: HTMLCanvasElement,
    private readonly display: Display,
  ) {
    element.tabIndex = 0;
    element.style.touchAction = "none";

    this.listen(element, "pointerdown", (e) => this.pointer(e, "pointer-down"));
    this.listen(element, "pointerup", (e) => this.pointer(e, "pointer-up"));
    this.listen(element, "pointermove", (e) => this.pointer(e, "pointer-move"));
    this.listen(element, "pointerleave", (e) => this.pointer(e, "pointer-exit"));
    this.listen(element, "wheel", (e) => this.wheel(e), { passive: false });
    this.listen(element, "contextmenu", (e) => e.preventDefault());
    this.listen(window, "keydown", (e) => this.key(e, "key-down"));
    this.listen(window, "keyup", (e) => this.key(e, "key-up"));
    this.listen(window, "keypress", (e) => this.key(e, "key-press"));
  }

  shutdown(): void {
    for (const dispose of this.disposers) dispose();
    this.disposers.length = 0;
  }

  private listen<K extends keyof HTMLElementEventMap>(
    target: HTMLElement | Window,
    type: K,
    handler: (event: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ): void {
    const listener = handler as EventListener;
    target.addEventListener(type, listener, options);
    this.disposers.push(() => target.removeEventListener(type, listener, options));
  }

  private toLocal(e: MouseEvent): ReturnType<typeof point> {
    const bounds = this.element.getBoundingClientRect();
    const scaleX = bounds.width === 0 ? 1 : this.display.size.width / bounds.width;
    const scaleY = bounds.height === 0 ? 1 : this.display.size.height / bounds.height;
    return point((e.clientX - bounds.left) * scaleX, (e.clientY - bounds.top) * scaleY);
  }

  private pointer(e: PointerEvent, type: PointerEventData["type"]): void {
    const at = this.toLocal(e);
    const event: PointerEventData = {
      type,
      at,
      button: e.button,
      buttons: e.buttons,
      modifiers: fromPointerEvent(e),
    };

    if (type === "pointer-down") {
      this.downAt = at;
      this.downView = this.display.hitTest(at);
      if (this.downView?.acceptsKeyboardFocus) this.display.focus(this.downView);
      else this.display.focus(undefined);
    }

    if (type === "pointer-move") this.display.updateHover(at, event);

    const target = type === "pointer-up" ? (this.display.hitTest(at) ?? this.downView) : this.display.hitTest(at) ?? this.downView;
    if (target) this.display.dispatchPointer(target, event);

    if (type === "pointer-up" && this.downView && target === this.downView) {
      const distance = Math.hypot(at.x - this.downAt.x, at.y - this.downAt.y);
      if (distance < 8) this.display.dispatchPointer(this.downView, { ...event, type: "click" });
    }

    if (type === "pointer-up" || type === "pointer-exit") this.downView = null;
  }

  private wheel(e: WheelEvent): void {
    e.preventDefault();
    const target = this.display.hitTest(this.toLocal(e));
    if (!target) return;
    this.display.dispatchPointer(target, {
      type: "scroll",
      at: this.toLocal(e),
      button: 0,
      buttons: 0,
      modifiers: fromPointerEvent(e),
      deltaX: e.deltaX,
      deltaY: e.deltaY,
    });
  }

  private key(e: KeyboardEvent, type: KeyEventData["type"]): void {
    if (type === "key-press" && e.key.length !== 1) return;
    this.display.dispatchKey({
      type,
      key: e.key,
      code: e.code,
      modifiers: fromKeyboardEvent(e),
      repeat: e.repeat,
    });
  }
}
