# Architecture

## The one decision everything follows from

Doodle draws to a canvas; React reconciles the DOM. They cannot be mapped component-for-component, because they do not share a rendering target. So the port keeps Doodle's model intact and exposes a single seam:

```
React page  ──mounts──>  <DoodleCanvas>  ──owns──>  <canvas>  ──drawn by──>  Display
```

React owns the page. Doodle owns its rectangle. The React binding never reaches into the view tree except through explicit hooks.

## Layers

```
site/ + demo/            example applications
        │
src/react/               DoodleCanvas, useView, useDoodleView, useViewProperty
        │
src/widgets/             Label, Button, Checkbox, Slider, TextField, Panel, Divider
        │
src/core/                view, canvas, layout, input, animation, display
        └── geometry, color, events, tokens
```

Dependencies point down only. `src/core` has no React import. `src/widgets` has no React import. This keeps the engine usable from vanilla TypeScript and makes it testable headlessly.

## Rendering

`View.draw()` applies the view transform, global alpha and clip, paints the background, calls the `render` hook, then recurses into children. The `render` hook receives a `Canvas` — it never touches the DOM.

There are three `Canvas` implementations:

- `Canvas2D` — browser backend, DPR-aware, used by `mountApplication`
- `MeasuringCanvas` — no-op backend used for text measurement and tests
- `SvgCanvas` — headless backend that records the same draw calls as SVG, used by tests and the preview generator

Because all three implement the same contract, the whole demo website can be rendered without a browser and asserted on as text.

## Layout

Views carry a `layoutManager`. `Display` sets root bounds on resize, then `View.doLayout()` runs each view's `layout()` hook and its layout manager before descending. `StackLayout`, `FillLayout` and `CenterLayout` cover the common cases; complex sections override `layout()` directly.

## Input

`InputManager` translates DOM pointer/keyboard/wheel events into `PointerEventData` / `KeyEventData`, converting client coordinates into canvas coordinates. `Display` hit-tests the view tree, dispatches to the deepest target, then bubbles up until a handler returns `true`. Focus is tracked centrally; key events start at the focused view.

## Scroll in the demo site

The site is a tall content view inside a clipped viewport. Wheel and keyboard input set a scroll target; a `Clock` callback lerps toward it and updates `content.transform`. Hit testing applies the inverse transform, so clicks keep working while scrolled. This is a demonstration of the engine's transform-aware hit testing, not a browser scroll.

## Brand tokens

`src/core/tokens.ts` holds values copied from Doodle's logo and docs stylesheet. Nothing in `src/widgets/` or `site/` hard-codes a palette color. See the token table in the [README](../README.md#brand-tokens).

## What is deliberately missing

- A React reconciler: today React hosts a canvas; it does not author views in JSX.
- An accessibility tree: canvas content is opaque to assistive technology.
- Native text input semantics: IME, spellcheck and autofill are not inherited from the DOM.
- Full upstream widget parity.

These are explicit gaps, not hidden limitations.
