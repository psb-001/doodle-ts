# doodle-ts

A **native TypeScript port** of [Doodle](https://github.com/nacular/doodle) — the pure-Kotlin UI framework. Same architecture, no Kotlin runtime: a retained view tree drawn through a vector canvas abstraction, with layout, hit-tested input, animation, a widget catalog and React bindings.

> This is an independent implementation, **not a fork** of `nacular/doodle`. The upstream Kotlin project is untouched. It is a separate repository because the audience, language, release cycle and issue tracker are different. Architecture and brand tokens are credited to upstream below.

![Doodle docs-style demo rendered entirely on the port's canvas](docs/previews/hero.svg)

## Why this exists

Doodle's render model is powerful but lives in Kotlin and targets JS/Wasm/JVM. This port brings the same model to TypeScript so it can be used directly in web projects — and most naturally from React, via a single `<DoodleCanvas>` host.

The important thing to understand: **Doodle does not render the DOM**. It draws vectors to a canvas. React owns the page; Doodle owns its rectangle. That is the integration seam, and it is why the React binding stays thin.

## Install

```bash
npm install doodle-ts react react-dom
```

## Quick start (vanilla)

```ts
import { Display, SvgCanvas, View, rect, Color, point } from "doodle-ts";

const canvas = SvgCanvas.of(800, 400); // or Canvas2D on an HTMLCanvasElement
const display = new Display(canvas);

const app = new View(rect(0, 0, 800, 400));
app.background = Color.fromHex("#f5f6f7");
app.render = (c) => {
  c.circle(point(400, 200), 60, Color.fromHex("#3578e5"));
  c.text("Hello from doodle·ts", point(400, 290), {
    color: Color.fromHex("#000000"),
    align: "center",
  });
};
display.add(app);
display.render();
```

## Quick start (React)

```tsx
import { useCallback } from "react";
import { DoodleCanvas, type ApplicationContext } from "doodle-ts/react";
import { Panel, Label, Button, StackLayout, doodle, type Application } from "doodle-ts";

const createApp = ({ display }: ApplicationContext): Application => {
  const root = new Panel(doodle.paper);
  root.layoutManager = new StackLayout("vertical", 12, "center", 24);

  root.addChild(
    new Label({ text: "Hello, world!", font: { size: 32, weight: 700 }, color: doodle.ink }),
    new Button({
      label: "Click me",
      background: doodle.primary,
      textColor: doodle.white,
      onClick: () => console.log("clicked"),
    }),
  );

  display.add(root);
  return { shutdown() {} };
};

export function App() {
  const create = useCallback((context: ApplicationContext) => createApp(context), []);
  return <DoodleCanvas create={create} style={{ width: "100vw", height: "100vh" }} />;
}
```

The complete, working version of this pattern is in [`site/App.tsx`](site/App.tsx) and [`site/site.ts`](site/site.ts).

## What is implemented

| Layer | Contents |
| --- | --- |
| Geometry | `Point`, `Size`, `Rectangle`, inset/union/containment, affine `Transform` with inverse |
| Drawing | `Color`, `LinearGradient`, `Stroke`, `Canvas` interface, DPR-aware `Canvas2D`, headless `MeasuringCanvas` and `SvgCanvas` |
| Scene graph | `View` tree, render hook, `renderProperty`, invalidation bubbling, hit testing, focus |
| Layout | `FillLayout`, `CenterLayout`, `StackLayout` (axis, spacing, alignment, padding) |
| Input | Pointer, keyboard and wheel events, coordinate conversion, focus routing, hover enter/exit, click synthesis |
| Animation | `Clock`, seek-safe `Animator`, easings, number + color interpolation, looping |
| Widgets | `Label`, `Button`, `Checkbox`, `Slider`, `TextField`, `Panel`, `Divider` |
| React | `<DoodleCanvas>`, `useView`, `useDoodleView`, `useViewProperty` |

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the layering rules and the design decisions behind them.

## Demo website

The `site/` folder is a full landing page rendered **entirely through one `<DoodleCanvas>`** — no DOM UI, no CSS layout. It uses Doodle's own headline, feature copy, Hello World sample and brand palette.

```bash
npm install
npm run dev:site      # http://localhost:5173
npm run dev           # component/engine demo
```

![Features](docs/previews/features.svg)
![Code example](docs/previews/code.svg)
![Platforms](docs/previews/platforms.svg)

## Brand tokens

The port deliberately uses Doodle's real palette, centralized in [`src/core/tokens.ts`](src/core/tokens.ts):

| Token | Value | Source |
| --- | --- | --- |
| Wordmark / ink | `#000000` | `docs/img/doodle.svg` |
| Paper (off-white) | `#f5f6f7` | docs stylesheet `--ifm-color-gray-100` |
| Content | `#1c1e21` | `--ifm-color-gray-900` |
| Muted / faint | `#606770` / `#8d949e` | `--ifm-color-gray-700` / `-600` |
| Hairline | `#dadde1` | `--ifm-color-gray-300` |
| Primary | `#3578e5` | `--ifm-color-primary` |

## Verification

```bash
npm run check
```

Runs the strict TypeScript check, the unit suite (including a full headless render of the demo site), the library build and the site build.

## Status and roadmap

This is a working foundation, not full upstream parity. Still open:

- Accessibility layer (semantic tree, keyboard traversal, screen-reader bridge)
- Text input parity: IME composition, spellcheck, autofill, mobile keyboards
- More widgets: tabs, menus, lists, dialogs, scrollbars, tooltips
- A React reconciler so JSX can declare the scene graph directly
- Publishing, API docs and a broader example gallery

Issues and PRs are welcome — see [`CONTRIBUTING.md`](CONTRIBUTING.md).

## License and credit

MIT. The original [Doodle](https://github.com/nacular/doodle) project is © Nacular and licensed MIT. This repository is an independent TypeScript implementation and is not affiliated with or endorsed by Nacular. Architecture, example copy and brand values are credited to the upstream project and its documentation.
