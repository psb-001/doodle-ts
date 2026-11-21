import { animate, Clock, easing } from "../src/core/animation";
import type { Canvas } from "../src/core/canvas";
import { Color } from "../src/core/color";
import type { Application, ApplicationContext } from "../src/core/display";
import { center, point, rect, size, Transform } from "../src/core/geometry";
import { CenterLayout, StackLayout } from "../src/core/layout";
import { View } from "../src/core/view";
import { Button, Checkbox, Label, Panel, Slider, TextField } from "../src/widgets/widgets";
import { demoBridge } from "./bridge";

const ink = Color.fromHex("#0e0b09");
const acid = Color.fromHex("#ff5b2e");
const iris = Color.fromHex("#4a63ff");
const aqua = Color.fromHex("#d7ff3a");

/** Hello World equivalent: a label and a breathing vector circle. */
export function createHello(_context: ApplicationContext): Application {
  const root = new Panel(ink);
  root.layoutManager = new StackLayout("vertical", 16, "center", 24);

  const heading = new Label({ text: "Hello, world!", font: { size: 34, weight: 700 }, color: aqua, align: "center" });
  const sub = new Label({ text: "Native TypeScript · retained view tree · vector canvas", font: { size: 14 }, color: Color.fromHex("#b6a394"), align: "center" });

  const orb = new View();
  const state = { radius: 28, rotation: 0 };
  orb.preferredSize = () => size(140, 140);
  orb.render = (canvas: Canvas) => {
    const c = center(orb.bounds);
    canvas.save();
    canvas.transform(orb.transform.then(Transform.rotate(state.rotation)));
    canvas.circle(c, state.radius, acid);
    canvas.rect(rect(c.x - 70, c.y - 4, 140, 8), aqua, undefined, 4);
    canvas.restore();
  };

  const clock = new Clock();
  const animator = animate(clock, {
    from: 28,
    to: 60,
    duration: 1.1,
    easing: easing.easeInOutCubic,
    loop: true,
    onUpdate: (radius) => {
      state.radius = radius;
      orb.invalidate();
    },
  });
  const spin = animate(clock, {
    from: 0,
    to: Math.PI * 2,
    duration: 6,
    easing: easing.linear,
    loop: true,
    onUpdate: (rotation) => {
      state.rotation = rotation;
      orb.invalidate();
    },
  });

  root.addChild(heading, sub, orb);
  return {
    shutdown() {
      animator.stop();
      spin.stop();
      clock.stop();
    },
  };
}

/** The built-in widget catalog rendered on the same canvas backend. */
export function createWidgets(_context: ApplicationContext): Application {
  const root = new Panel(ink);
  root.layoutManager = new StackLayout("vertical", 14, "center", 28);

  const title = new Label({ text: "Widget catalog", font: { size: 26, weight: 700 }, color: aqua });
  const name = new TextField({ placeholder: "Type your name…", onChanged: (text) => demoBridge.log(`text: ${text || "∅"}`) });
  const agree = new Checkbox({ label: "I agree to the terms", onChanged: (checked) => demoBridge.log(`checkbox: ${checked}`) });
  const volume = new Slider({ value: 0.4, min: 0, max: 100, onChanged: (value) => demoBridge.log(`slider: ${Math.round(value)}`) });
  const action = new Button({
    label: "Say hello",
    onClick: () => demoBridge.log(`clicked · ${name.text || "anonymous"}`),
  });

  root.addChild(title, name, agree, volume, action);
  return { shutdown() {} };
}

/** Multiple independent animators sharing one clock. */
export function createMotion(_context: ApplicationContext): Application {
  const root = new Panel(ink);
  root.layoutManager = new CenterLayout();

  const field = new View(rect(0, 0, 360, 200));
  field.preferredSize = () => size(360, 200);
  const orbs: View[] = [];
  const palette = [acid, iris, aqua, Color.fromHex("#ff2d78")];
  const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];

  for (let i = 0; i < 4; i++) {
    const orb = new View();
    orb.render = (canvas: Canvas) => {
      const c = center(orb.bounds);
      const angle = angles[i];
      const p = point(c.x + Math.cos(angle) * 80, c.y + Math.sin(angle) * 48);
      canvas.circle(p, 14, palette[i]);
      canvas.circle(c, 4, Color.White.withAlpha(0.5));
    };
    orbs.push(orb);
    field.addChild(orb);
  }
  // Frame each orb within the field.
  field.layout = () => {
    for (const orb of orbs) orb.bounds = rect(0, 0, field.width, field.height);
  };

  const clock = new Clock();
  const off = clock.onFrame((frame) => {
    for (let i = 0; i < angles.length; i++) angles[i] += frame.delta * (0.6 + i * 0.25);
    for (const orb of orbs) orb.invalidate();
  });

  root.addChild(field);
  return {
    shutdown() {
      off();
      clock.stop();
    },
  };
}

export const demos = [
  { id: "hello", label: "Hello world", create: createHello, note: "A label, a custom View and two looping animators." },
  { id: "widgets", label: "Widget catalog", create: createWidgets, note: "TextField, Checkbox, Slider and Button, all drawn on canvas." },
  { id: "motion", label: "Motion", create: createMotion, note: "Four views sharing one clock, each with its own angle." },
] as const;
