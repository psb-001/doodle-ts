import { MeasuringCanvas, type Canvas, type Font } from "../core/canvas";
import { stroke, type Paint } from "../core/color";
import { doodle } from "../core/tokens";
import type { FocusEventData, KeyEventData, PointerEventData } from "../core/events";
import { point, rect, type Size, size } from "../core/geometry";
import { View } from "../core/view";

const measurer = new MeasuringCanvas();

export interface LabelOptions {
  text?: string;
  font?: Font;
  color?: Paint;
  align?: CanvasTextAlign;
}

/** A vector-drawn, left/center/right aligned text view. */
export class Label extends View {
  private _text: string;
  private _font: Font;
  private _color: Paint;
  align: CanvasTextAlign;
  baseline: CanvasTextBaseline = "middle";
  padding = 0;

  constructor(options: LabelOptions = {}) {
    super();
    this._text = options.text ?? "";
    this._font = options.font ?? {};
    this._color = options.color ?? doodle.ink;
    this.align = options.align ?? "left";
  }

  get text(): string {
    return this._text;
  }

  set text(value: string) {
    if (this._text === value) return;
    this._text = value;
    this.setNeedsLayout();
    this.invalidate();
  }

  get font(): Font {
    return this._font;
  }

  set font(value: Font) {
    this._font = value;
    this.setNeedsLayout();
    this.invalidate();
  }

  get color(): Paint {
    return this._color;
  }

  set color(value: Paint) {
    this._color = value;
    this.invalidate();
  }

  override preferredSize(): Size {
    const m = measurer.measureText(this._text, this._font);
    return size(m.width + this.padding * 2, m.height + this.padding * 2);
  }

  override render(canvas: Canvas): void {
    const x = this.align === "center" ? this.width / 2 : this.align === "right" ? this.width : 0;
    canvas.text(this._text, point(x, this.height / 2), {
      font: this._font,
      color: this._color,
      align: this.align,
      baseline: this.baseline,
    });
  }
}

export interface ButtonOptions {
  label?: string;
  background?: Paint;
  hoverBackground?: Paint;
  pressedBackground?: Paint;
  textColor?: Paint;
  font?: Font;
  radius?: number;
  padding?: number;
  onClick?: () => void;
}

/** Clickable vector button with hover and pressed states. */
export class Button extends View {
  readonly labelView: Label;
  private hovered = false;
  private pressed = false;
  private readonly padding: number;
  background: Paint;
  hoverBackground: Paint;
  pressedBackground: Paint;
  disabled = false;
  onPressed?: () => void;

  constructor(options: ButtonOptions = {}) {
    super();
    this.padding = options.padding ?? 12;
    this.background = options.background ?? doodle.white;
    this.hoverBackground = options.hoverBackground ?? doodle.surface;
    this.pressedBackground = options.pressedBackground ?? doodle.primaryPale;
    this.cornerRadius = options.radius ?? 6;
    this.labelView = new Label({ text: options.label ?? "Button", font: options.font, color: options.textColor ?? doodle.ink, align: "center" });
    this.addChild(this.labelView);
    this.onPressed = options.onClick;
    this.cursor = "pointer";
    this.acceptsKeyboardFocus = true;
    this.clipToBounds = true;
  }

  get label(): string {
    return this.labelView.text;
  }

  set label(value: string) {
    this.labelView.text = value;
    this.setNeedsLayout();
    this.invalidate();
  }

  override preferredSize(): Size {
    const s = this.labelView.preferredSize();
    return size(s.width + this.padding * 2, s.height + this.padding * 1.5);
  }

  override layout(): void {
    const s = this.labelView.preferredSize();
    this.labelView.bounds = rect((this.width - s.width) / 2, (this.height - s.height) / 2, s.width, s.height);
  }

  override render(canvas: Canvas): void {
    const fill = this.disabled
      ? doodle.faint.withAlpha(0.35)
      : this.pressed
        ? this.pressedBackground
        : this.hovered
          ? this.hoverBackground
          : this.background;
    canvas.rect({ x: 0, y: 0, width: this.width, height: this.height }, fill, stroke(doodle.hairline), this.cornerRadius);
  }

  override pointerEnter = (): boolean => {
    this.hovered = true;
    this.invalidate();
    return true;
  };

  override pointerExit = (): boolean => {
    this.hovered = false;
    this.pressed = false;
    this.invalidate();
    return true;
  };

  override pointerDown = (): boolean => {
    if (this.disabled) return true;
    this.pressed = true;
    this.invalidate();
    return true;
  };

  override pointerUp = (): boolean => {
    this.pressed = false;
    this.invalidate();
    return true;
  };

  override click = (_event: PointerEventData): boolean => {
    if (!this.disabled) this.onPressed?.();
    return true;
  };

  override keyDown = (event: KeyEventData): boolean => {
    if (event.key === "Enter" || event.key === " ") {
      this.onPressed?.();
      return true;
    }
    return false;
  };
}

export interface CheckboxOptions {
  label?: string;
  checked?: boolean;
  onChanged?: (checked: boolean) => void;
  color?: Paint;
}

/** Checkbox with a vector box, checkmark and label. */
export class Checkbox extends View {
  private _checked: boolean;
  private readonly labelView: Label;
  private readonly color: Paint;
  onChanged?: (checked: boolean) => void;

  constructor(options: CheckboxOptions = {}) {
    super();
    this._checked = options.checked ?? false;
    this.color = options.color ?? doodle.primary;
    this.labelView = new Label({ text: options.label ?? "" });
    this.addChild(this.labelView);
    this.onChanged = options.onChanged;
    this.cursor = "pointer";
  }

  get checked(): boolean {
    return this._checked;
  }

  set checked(value: boolean) {
    if (this._checked === value) return;
    this._checked = value;
    this.invalidate();
  }

  override preferredSize(): Size {
    const s = this.labelView.preferredSize();
    return size(20 + 8 + s.width, Math.max(20, s.height));
  }

  override layout(): void {
    const s = this.labelView.preferredSize();
    this.labelView.bounds = rect(28, (this.height - s.height) / 2, s.width, s.height);
  }

  override render(canvas: Canvas): void {
    canvas.rect(rect(1, (this.height - 18) / 2, 18, 18), this._checked ? this.color : undefined, stroke(doodle.muted), 3);
    if (this._checked) {
      canvas.path(
        [point(6, this.height / 2), point(10, this.height / 2 + 4), point(15, this.height / 2 - 4)],
        false,
        undefined,
        stroke(doodle.white, 2.5),
      );
    }
  }

  override click = (): boolean => {
    this.checked = !this._checked;
    this.onChanged?.(this._checked);
    return true;
  };
}

export interface SliderOptions {
  value?: number;
  min?: number;
  max?: number;
  onChanged?: (value: number) => void;
  color?: Paint;
}

/** Draggable horizontal slider reporting values between min and max. */
export class Slider extends View {
  private _value: number;
  readonly min: number;
  readonly max: number;
  private dragging = false;
  private readonly color: Paint;
  onChanged?: (value: number) => void;

  constructor(options: SliderOptions = {}) {
    super();
    this.min = options.min ?? 0;
    this.max = options.max ?? 1;
    this._value = options.value ?? this.min;
    this.color = options.color ?? doodle.primary;
    this.onChanged = options.onChanged;
    this.cursor = "pointer";
    this.preferredHeight = 24;
  }

  private preferredHeight: number;

  get value(): number {
    return this._value;
  }

  set value(next: number) {
    const clamped = Math.min(this.max, Math.max(this.min, next));
    if (this._value === clamped) return;
    this._value = clamped;
    this.invalidate();
  }

  override preferredSize(): Size {
    return size(160, this.preferredHeight);
  }

  override render(canvas: Canvas): void {
    const y = this.height / 2;
    const track = rect(4, y - 3, this.width - 8, 6);
    canvas.rect(track, doodle.surface, undefined, 3);
    const progress = (this._value - this.min) / (this.max - this.min || 1);
    const px = 4 + (this.width - 8) * progress;
    canvas.rect(rect(4, y - 3, Math.max(0, px - 4), 6), this.color, undefined, 3);
    canvas.circle(point(px, y), 9, this.color, stroke(doodle.white, 2));
  }

  private updateFromPointer(event: PointerEventData): void {
    const progress = Math.min(1, Math.max(0, (event.at.x - 4) / (this.width - 8 || 1)));
    this.value = this.min + progress * (this.max - this.min);
    this.onChanged?.(this._value);
  }

  override pointerDown = (event: PointerEventData): boolean => {
    this.dragging = true;
    this.updateFromPointer(event);
    return true;
  };

  override pointerMove = (event: PointerEventData): boolean => {
    if (this.dragging) this.updateFromPointer(event);
    return this.dragging;
  };

  override pointerUp = (event: PointerEventData): boolean => {
    if (this.dragging) this.updateFromPointer(event);
    this.dragging = false;
    return true;
  };
}

export interface TextFieldOptions {
  text?: string;
  placeholder?: string;
  onChanged?: (text: string) => void;
}

/** Focusable single-line text field with a caret and placeholder. */
export class TextField extends View {
  private _text: string;
  private caretVisible = false;
  onChanged?: (text: string) => void;

  constructor(options: TextFieldOptions = {}) {
    super();
    this._text = options.text ?? "";
    this.placeholder = options.placeholder ?? "";
    this.onChanged = options.onChanged;
    this.acceptsKeyboardFocus = true;
    this.cursor = "text";
  }

  placeholder: string;

  get text(): string {
    return this._text;
  }

  set text(value: string) {
    if (this._text === value) return;
    this._text = value;
    this.invalidate();
  }

  override preferredSize(): Size {
    return size(180, 38);
  }

  override render(canvas: Canvas): void {
    const active = this.focused;
    canvas.rect(
      { x: 0, y: 0, width: this.width, height: this.height },
      doodle.white,
      stroke(active ? doodle.primary : doodle.hairline, active ? 2 : 1),
      6,
    );
    const display = this._text || this.placeholder;
    const color = this._text ? doodle.ink : doodle.faint;
    canvas.text(display, point(10, this.height / 2), { color, baseline: "middle" });
    if (active && this.caretVisible) {
      const w = measurer.measureText(this._text).width;
      canvas.line(point(10 + w, 8), point(10 + w, this.height - 8), stroke(doodle.primary, 2));
    }
  }

  private changed(): void {
    this.onChanged?.(this._text);
    this.invalidate();
  }

  override focus = (_event: FocusEventData): boolean => {
    this.caretVisible = true;
    this.invalidate();
    return true;
  };

  override blur = (_event: FocusEventData): boolean => {
    this.caretVisible = false;
    this.invalidate();
    return true;
  };

  override keyPress = (event: KeyEventData): boolean => {
    this._text += event.key;
    this.changed();
    return true;
  };

  override keyDown = (event: KeyEventData): boolean => {
    if (event.key === "Backspace") {
      this._text = this._text.slice(0, -1);
      this.changed();
      return true;
    }
    return false;
  };
}

/** Plain container, useful with a Layout manager. */
export class Panel extends View {
  constructor(fill?: Paint, radius = 0) {
    super();
    this.background = fill;
    this.cornerRadius = radius;
  }
}

export class Divider extends View {
  color: Paint;
  constructor(public thickness = 1, color?: Paint) {
    super();
    this.color = color ?? doodle.hairline;
  }

  override preferredSize(): Size {
    return size(1, this.thickness);
  }

  override render(canvas: Canvas): void {
    canvas.rect({ x: 0, y: (this.height - this.thickness) / 2, width: this.width, height: this.thickness }, this.color);
  }
}

export function label(text: string, options: Omit<LabelOptions, "text"> = {}): Label {
  return new Label({ ...options, text });
}

export function button(labelText: string, onClick?: () => void, options: Omit<ButtonOptions, "label" | "onClick"> = {}): Button {
  return new Button({ ...options, label: labelText, onClick });
}
