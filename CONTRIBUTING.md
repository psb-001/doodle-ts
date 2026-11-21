# Contributing

## Setup

```bash
npm install
npm run check
```

`npm run check` is the gate: strict typecheck, unit tests, library build and demo-site build. Please make it pass before opening a pull request.

## Where things go

| Change | Location |
| --- | --- |
| Engine (geometry, canvas, view, layout, input, animation) | `src/core/` |
| Brand tokens | `src/core/tokens.ts` — do not hard-code palette values elsewhere |
| Widgets | `src/widgets/` |
| React host and hooks | `src/react/` |
| Engine tests | `tests/engine.test.ts` |
| Full-site render test | `tests/site.test.ts` |
| Component demo | `demo/` |
| Doodle-branded demo website | `site/` |

## Rules of thumb

- Keep the dependency direction one-way: widgets depend on core; the React host mounts a `Display`; core imports neither widgets nor React.
- Every new canvas backend must implement the full `Canvas` contract. `SvgCanvas` is the headless reference used by tests and preview generation.
- Visual work should be checked with the headless preview renderer:
  ```bash
  npm run preview:site
  ```
  It writes SVG snapshots of several scroll positions into `site/`.
- Use the tokens in `src/core/tokens.ts` for any Doodle-branded surface. They are copied from upstream assets, not designed here.

## Scope

This is a young port. High-value contributions: accessibility layer, IME/autofill support in `TextField`, additional widgets, and a React reconciler. Please open an issue before starting a large refactor so we can agree on the direction.

## Credit

Do not remove the upstream attribution in `LICENSE` or `README.md`. This project is not affiliated with Nacular.
