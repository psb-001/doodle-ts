import type { Point } from "./geometry";

export interface EventModifiers {
  readonly alt: boolean;
  readonly ctrl: boolean;
  readonly meta: boolean;
  readonly shift: boolean;
}

export interface PointerEventData {
  readonly type: "pointer-down" | "pointer-up" | "pointer-move" | "pointer-enter" | "pointer-exit" | "click" | "scroll";
  readonly at: Point;
  readonly button: number;
  readonly buttons: number;
  readonly modifiers: EventModifiers;
  readonly deltaX?: number;
  readonly deltaY?: number;
}

export interface KeyEventData {
  readonly type: "key-down" | "key-up" | "key-press";
  readonly key: string;
  readonly code: string;
  readonly modifiers: EventModifiers;
  readonly repeat: boolean;
}

export interface FocusEventData {
  readonly type: "focus" | "blur";
}

/** Handlers return true to consume the event and stop propagation. */
export type Handler<E> = (event: E) => boolean;

export interface EventHandlers {
  pointerDown?: Handler<PointerEventData>;
  pointerUp?: Handler<PointerEventData>;
  pointerMove?: Handler<PointerEventData>;
  pointerEnter?: Handler<PointerEventData>;
  pointerExit?: Handler<PointerEventData>;
  click?: Handler<PointerEventData>;
  scroll?: Handler<PointerEventData>;
  keyDown?: Handler<KeyEventData>;
  keyUp?: Handler<KeyEventData>;
  keyPress?: Handler<KeyEventData>;
  focus?: Handler<FocusEventData>;
  blur?: Handler<FocusEventData>;
}

export const noModifiers: EventModifiers = { alt: false, ctrl: false, meta: false, shift: false };

export function fromKeyboardEvent(e: KeyboardEvent): EventModifiers {
  return { alt: e.altKey, ctrl: e.ctrlKey, meta: e.metaKey, shift: e.shiftKey };
}

export function fromPointerEvent(e: MouseEvent): EventModifiers {
  return { alt: e.altKey, ctrl: e.ctrlKey, meta: e.metaKey, shift: e.shiftKey };
}
