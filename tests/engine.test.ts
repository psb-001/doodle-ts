import { describe, expect, it, vi } from "vitest";
import { Animator, Clock, easing } from "../src/core/animation";
import { MeasuringCanvas } from "../src/core/canvas";
import { Color } from "../src/core/color";
import { noModifiers, type PointerEventData } from "../src/core/events";
import { contains, inset, intersects, point, rect, Transform } from "../src/core/geometry";
import { CenterLayout, FillLayout, StackLayout } from "../src/core/layout";
import { Button, Label, Slider } from "../src/widgets/widgets";
import { Display } from "../src/core/display";
import { View } from "../src/core/view";

const pointer = (type: PointerEventData["type"], x: number, y: number): PointerEventData => ({
  type,
  at: point(x, y),
  button: 0,
  buttons: 1,
  modifiers: noModifiers,
});

describe("geometry", () => {
  it("applies and inverts transforms", () => {
    const t = Transform.translate(10, 20).then(Transform.rotate(Math.PI / 2));
    const p = point(3, 4);
    const roundTrip = t.inverse().apply(t.apply(p));
    expect(roundTrip.x).toBeCloseTo(p.x);
    expect(roundTrip.y).toBeCloseTo(p.y);
  });

  it("computes insets, containment and intersection", () => {
    const r = rect(0, 0, 100, 80);
    expect(inset(r, 10)).toEqual(rect(10, 10, 80, 60));
    expect(contains(r, point(50, 40))).toBe(true);
    expect(contains(r, point(100, 40))).toBe(false);
    expect(intersects(r, rect(90, 70, 20, 20))).toBe(true);
    expect(intersects(r, rect(100, 80, 20, 20))).toBe(false);
  });
});

describe("view tree", () => {
  it("hit-tests the topmost child and converts coordinates", () => {
    const root = new View(rect(0, 0, 300, 200));
    const child = new View(rect(20, 30, 100, 50));
    const grandchild = new View(rect(10, 10, 20, 20));
    child.addChild(grandchild);
    root.addChild(child);

    expect(root.hitTest(point(200, 100))).toBe(root);
    expect(root.hitTest(point(60, 60))).toBe(child);
    expect(root.hitTest(point(35, 45))).toBe(grandchild);
    expect(grandchild.toLocal(point(20, 20))).toEqual(point(10, 10));
  });

  it("bubbles invalidation to the display", () => {
    const root = new View(rect(0, 0, 10, 10));
    const child = new View();
    root.addChild(child);
    const onInvalidate = vi.fn();
    root.onInvalidate = onInvalidate;
    child.invalidate();
    expect(onInvalidate).toHaveBeenCalledTimes(1);
  });

  it("detaches a child when re-parented", () => {
    const a = new View();
    const b = new View();
    const child = new View();
    a.addChild(child);
    b.addChild(child);
    expect(a.children).toHaveLength(0);
    expect(b.children).toHaveLength(1);
    expect(child.parent).toBe(b);
  });
});

describe("layout", () => {
  it("fills, centers and stacks children", () => {
    const root = new View(rect(0, 0, 200, 100));
    const a = new View(rect(0, 0, 10, 10));
    root.addChild(a);
    root.layoutManager = new FillLayout(5);
    root.doLayout();
    expect(a.bounds).toEqual(rect(5, 5, 190, 90));

    a.bounds = rect(0, 0, 10, 10);
    root.layoutManager = new CenterLayout();
    root.setNeedsLayout();
    root.doLayout();
    expect(a.bounds.x).toBeCloseTo(95);
    expect(a.bounds.y).toBeCloseTo(45);

    const b = new Label({ text: "ab" });
    const c = new Label({ text: "cd" });
    const stack = new View(rect(0, 0, 100, 100));
    stack.addChild(b, c);
    stack.layoutManager = new StackLayout("vertical", 10, "start", 5);
    stack.doLayout();
    expect(b.bounds.x).toBe(5);
    expect(c.bounds.y).toBeGreaterThan(b.bounds.y);
  });
});

describe("animation", () => {
  it("interpolates numbers and advances by delta", () => {
    const clock = new Clock();
    const values: number[] = [];
    const animator = new Animator({ from: 0, to: 10, duration: 1, easing: easing.linear, onUpdate: (v) => values.push(v) });
    animator.start();
    animator.update(0.5);
    animator.update(0.5);
    expect(values.at(-1)).toBeCloseTo(10);
    expect(animator.running).toBe(false);
    clock.stop();
  });

  it("interpolates colors", () => {
    let result = Color.Black;
    const animator = new Animator({ from: Color.Black, to: Color.White, duration: 1, easing: easing.linear, onUpdate: (v) => (result = v) });
    animator.start().update(0.5);
    expect(result.red).toBeCloseTo(127.5);
  });
});

describe("widgets", () => {
  it("measures and invokes a button click", () => {
    const onPressed = vi.fn();
    const button = new Button({ label: "Go", onClick: onPressed });
    expect(button.preferredSize().width).toBeGreaterThan(20);
    button.draw(new MeasuringCanvas());
    button.click?.(pointer("click", 1, 1));
    expect(onPressed).toHaveBeenCalledTimes(1);
  });

  it("toggles a slider value from a pointer drag", () => {
    const changed = vi.fn();
    const slider = new Slider({ min: 0, max: 100, onChanged: changed });
    slider.bounds = rect(0, 0, 200, 24);
    slider.pointerDown?.(pointer("pointer-down", 100, 12));
    expect(slider.value).toBe(50);
    expect(changed).toHaveBeenCalled();
  });
});

describe("display", () => {
  it("routes key events through the focused view", () => {
    const display = new Display(new MeasuringCanvas());
    const view = new View(rect(0, 0, 100, 100));
    view.acceptsKeyboardFocus = true;
    const onKey = vi.fn(() => true);
    view.keyDown = onKey;
    display.add(view);
    display.focus(view);
    display.dispatchKey({ type: "key-down", key: "Enter", code: "Enter", modifiers: noModifiers, repeat: false });
    expect(onKey).toHaveBeenCalledTimes(1);
  });
});
