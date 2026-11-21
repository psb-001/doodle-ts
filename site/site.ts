import {
  Application,
  ApplicationContext,
  Button,
  Canvas,
  Clock,
  Color,
  Font,
  LinearGradient,
  doodle,
  point,
  rect,
  stroke,
  Transform,
  View,
  wrapText,
  clamp,
} from "../src/index";

/** Doodle's own palette lives in src/core/tokens.ts; the site only aliases it. */
const C = doodle;

const mono: Font = { family: "ui-monospace, SFMono-Regular, Menlo, monospace", size: 12 };
const sans: Font = { family: "ui-sans-serif, system-ui, -apple-system, sans-serif", size: 15 };

function drawLines(
  canvas: Canvas,
  lines: readonly string[],
  x: number,
  y: number,
  lineHeight: number,
  options: { color?: Color; font?: Font; align?: CanvasTextAlign } = {},
): void {
  lines.forEach((line, index) => {
    canvas.text(line, point(x, y + index * lineHeight), {
      font: options.font ?? sans,
      color: options.color ?? C.ink,
      align: options.align ?? "left",
      baseline: "alphabetic",
    });
  });
}

function paragraph(canvas: Canvas, text: string, x: number, y: number, maxWidth: number, lineHeight: number, color: Color, font: Font = sans): number {
  const lines = wrapText(canvas, text, font, maxWidth);
  drawLines(canvas, lines, x, y, lineHeight, { color, font });
  return lines.length * lineHeight;
}

abstract class Section extends View {
  abstract measure(width: number): number;
}

/** Docs-style primary hero: Doodle wordmark, official tagline, Start Creating. */
class HeroSection extends Section {
  t = 0;
  px = 0;
  py = 0;
  readonly cta: Button;

  constructor(onStart: () => void) {
    super();
    this.cta = new Button({
      label: "Start Creating",
      background: C.white,
      hoverBackground: C.primaryPale,
      pressedBackground: C.surface,
      textColor: C.primary,
      font: { size: 14, weight: 700 },
      padding: 16,
    });
    this.cta.onPressed = onStart;
    this.addChild(this.cta);
  }

  override measure(width: number): number {
    return width >= 900 ? 560 : 680;
  }

  override layout(): void {
    const pad = this.width >= 900 ? 64 : 24;
    this.cta.bounds = rect(pad, (this.width >= 900 ? 420 : 500), this.cta.preferredSize().width, 46);
  }

  override render(canvas: Canvas): void {
    const w = this.width;
    const wide = w >= 900;
    const pad = wide ? 64 : 24;

    canvas.fill({ x: 0, y: 0, width: w, height: this.height }, new LinearGradient(point(0, 0), point(w, this.height), [
      { offset: 0, color: C.primary },
      { offset: 1, color: C.primaryDark },
    ]));

    // Brand art: white concentric orbits on the primary field.
    const c = point(wide ? w * 0.74 : w / 2, wide ? 270 : this.height - 190);
    const cx = c.x + this.px;
    const cy = c.y + this.py;
    for (let i = 0; i < 4; i++) {
      const radius = 120 + i * 42;
      canvas.ellipse(point(cx, cy), radius, radius * 0.55, this.t * (0.12 + i * 0.05), undefined, stroke(C.white.withAlpha(0.28), 1.2));
      const angle = this.t * (0.4 + i * 0.14) + i;
      canvas.circle(point(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius * 0.55), 5, C.white.withAlpha(0.8));
    }
    canvas.circle(point(cx, cy), 6, C.white);

    canvas.text("doodle", point(pad, 96), { font: { size: 20, weight: 800 }, color: C.white });
    canvas.text("A pure Kotlin, UI framework", point(pad, wide ? 230 : 190), {
      font: { size: Math.min(62, Math.max(36, w * 0.048)), weight: 800 },
      color: C.white,
    });
    paragraph(
      canvas,
      "Build beautiful, modern apps entirely in Kotlin. Its render model is intuitive yet powerful, making it easy to achieve complex UIs with pixel level precision and layouts.",
      pad,
      wide ? 292 : 250,
      wide ? 470 : Math.max(240, w - 2 * pad),
      24,
      C.white.withAlpha(0.92),
      { size: 15, family: sans.family },
    );
  }
}

/** The three feature columns from the Doodle docs home page, verbatim. */
class FeaturesSection extends Section {
  private readonly items = [
    {
      title: "One Language",
      body: "Write your app once, entirely in Kotlin and forget about the underlying platform.",
    },
    {
      title: "Many Platforms",
      body: "Deploy the same app to the Web (via JavaScript or WASM) or Desktop (via the JVM).",
    },
    {
      title: "Your Creativity",
      body: "Build beautiful, modern apps with pixel perfect UIs, fully customizable layouts and simple user input.",
    },
  ];

  override measure(width: number): number {
    return width >= 900 ? 280 : 640;
  }

  override render(canvas: Canvas): void {
    canvas.fill({ x: 0, y: 0, width: this.width, height: this.height }, C.paper);
    const pad = this.width >= 900 ? 64 : 24;
    const wide = this.width >= 900;
    const gap = 24;
    const col = wide ? (this.width - 2 * pad - 2 * gap) / 3 : this.width - 2 * pad;

    this.items.forEach((item, index) => {
      const x = wide ? pad + index * (col + gap) : pad;
      const y = wide ? 56 : 20 + index * 205;
      canvas.rect({ x, y, width: col, height: wide ? 190 : 185 }, C.white, stroke(C.hairline), 8);
      canvas.rect({ x: x + 20, y: y + 22, width: 28, height: 3 }, C.primary, undefined, 2);
      canvas.text(item.title, point(x + 20, y + 66), { font: { size: 21, weight: 700 }, color: C.ink });
      paragraph(canvas, item.body, x + 20, y + 98, col - 40, 22, C.muted, { size: 14, family: sans.family });
    });
  }
}

/** The README Hello World sample, drawn as a code card. */
class CodeSection extends Section {
  private readonly lines = [
    "import io.nacular.doodle.application.application",
    "import io.nacular.doodle.core.view",
    "import io.nacular.doodle.drawing.Color.Companion.Black",
    "import io.nacular.doodle.drawing.text",
    "",
    "fun main() {",
    "    application {",
    "        display += view {",
    "            size   = display.size",
    "            render = {",
    "                text(\"Hello, world!\", color = Black)",
    "            }",
    "        }",
    "    }",
    "}",
  ];

  override measure(width: number): number {
    return width >= 900 ? 520 : 700;
  }

  override render(canvas: Canvas): void {
    canvas.fill({ x: 0, y: 0, width: this.width, height: this.height }, C.white);
    const pad = this.width >= 900 ? 64 : 24;
    canvas.text("HELLO WORLD", point(pad, 60), { font: mono, color: C.primary });
    canvas.text("Start creating in a few lines", point(pad, 100), { font: { size: 34, weight: 800 }, color: C.ink });

    const cardX = pad;
    const cardY = 132;
    const cardW = this.width - 2 * pad;
    const cardH = this.lines.length * 19 + 36;
    canvas.rect({ x: cardX, y: cardY, width: cardW, height: cardH }, C.content, undefined, 8);
    canvas.text("HELLO WORLD.KT", point(cardX + 18, cardY + 24), { font: mono, color: C.faint });
    this.lines.forEach((line, index) => {
      const y = cardY + 52 + index * 19;
      const isCall = line.includes("application") || line.includes("render") || line.includes("display +=");
      canvas.text(line, point(cardX + 18, y), { font: mono, color: isCall ? C.primaryLight : C.paper });
    });
  }
}

/** The platforms named in the README badges and docs (JS, WASM, JVM). */
class PlatformsSection extends Section {
  private readonly items = [
    { title: "Web", sub: "JavaScript" },
    { title: "Web", sub: "WebAssembly" },
    { title: "Desktop", sub: "JVM" },
  ];

  override measure(width: number): number {
    return width >= 900 ? 230 : 520;
  }

  override render(canvas: Canvas): void {
    canvas.fill({ x: 0, y: 0, width: this.width, height: this.height }, C.paper);
    const pad = this.width >= 900 ? 64 : 24;
    const wide = this.width >= 900;
    const gap = 16;
    const col = wide ? (this.width - 2 * pad - 2 * gap) / 3 : this.width - 2 * pad;
    this.items.forEach((item, index) => {
      const x = wide ? pad + index * (col + gap) : pad;
      const y = wide ? 50 : 20 + index * 160;
      canvas.rect({ x, y, width: col, height: wide ? 140 : 148 }, C.white, stroke(C.hairline), 8);
      canvas.text(item.title, point(x + 20, y + 58), { font: { size: 26, weight: 800 }, color: C.primary });
      canvas.text(item.sub, point(x + 20, y + 96), { font: mono, color: C.muted });
    });
  }
}

/** Capabilities listed in the project README. */
class CapabilitiesSection extends Section {
  private readonly items = [
    "Pixel level precision",
    "Fully customizable layouts",
    "Simple user input",
    "Drag and drop",
    "Powerful animation",
    "Write once, run everywhere",
  ];

  override measure(width: number): number {
    return width >= 900 ? 420 : 660;
  }

  override render(canvas: Canvas): void {
    canvas.fill({ x: 0, y: 0, width: this.width, height: this.height }, C.white);
    const pad = this.width >= 900 ? 64 : 24;
    canvas.text("BUILT FOR", point(pad, 60), { font: mono, color: C.primary });
    canvas.text("Everything you need", point(pad, 104), { font: { size: 38, weight: 800 }, color: C.ink });

    const cols = this.width >= 900 ? 2 : 1;
    const colW = (this.width - 2 * pad) / cols;
    this.items.forEach((item, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = pad + col * colW;
      const y = 170 + row * 66;
      canvas.rect({ x, y, width: colW - 20, height: 52 }, C.paper, stroke(C.hairline), 6);
      canvas.circle(point(x + 28, y + 26), 10, C.primaryPale);
      canvas.text("✓", point(x + 28, y + 27), { font: { size: 13, weight: 700 }, color: C.primary, align: "center", baseline: "middle" });
      canvas.text(item, point(x + 50, y + 27), { font: { size: 15, weight: 600 }, color: C.content, baseline: "middle" });
    });
  }
}

class StartSection extends Section {
  readonly cta: Button;

  constructor(onStart: () => void) {
    super();
    this.cta = new Button({
      label: "Start Creating →",
      background: C.primary,
      hoverBackground: C.primaryDark,
      pressedBackground: C.ink,
      textColor: C.white,
      font: { size: 14, weight: 700 },
      padding: 16,
    });
    this.cta.onPressed = onStart;
    this.addChild(this.cta);
  }

  override measure(): number {
    return 240;
  }

  override layout(): void {
    this.cta.bounds = rect(this.width / 2 - this.cta.preferredSize().width / 2, 128, this.cta.preferredSize().width, 46);
  }

  override render(canvas: Canvas): void {
    canvas.fill({ x: 0, y: 0, width: this.width, height: this.height }, C.primaryPale);
    canvas.text("Ready to build?", point(this.width / 2, 76), {
      font: { size: 34, weight: 800 },
      color: C.ink,
      align: "center",
    });
  }
}

class FooterSection extends Section {
  override measure(): number {
    return 110;
  }

  override render(canvas: Canvas): void {
    canvas.fill({ x: 0, y: 0, width: this.width, height: this.height }, C.ink);
    const pad = this.width >= 900 ? 64 : 24;
    canvas.text("doodle", point(pad, 44), { font: { size: 18, weight: 800 }, color: C.white });
    canvas.text("A pure Kotlin, UI framework for the Web and Desktop", point(pad, 72), { font: { size: 13 }, color: C.faint });
    canvas.text("Copyright © 2026 Nacular", point(this.width - pad, 58), { font: { size: 12 }, color: C.faint, align: "right" });
  }
}

class NavLink extends View {
  hovered = false;
  constructor(readonly label: string, readonly action: () => void) {
    super();
    this.cursor = "pointer";
  }

  override render(canvas: Canvas): void {
    canvas.text(this.label, point(this.width / 2, this.height / 2), {
      font: { size: 13, weight: 600 },
      color: this.hovered ? C.primary : C.muted,
      align: "center",
      baseline: "middle",
    });
  }

  override pointerEnter = (): boolean => {
    this.hovered = true;
    this.invalidate();
    return true;
  };

  override pointerExit = (): boolean => {
    this.hovered = false;
    this.invalidate();
    return true;
  };

  override click = (): boolean => {
    this.action();
    return true;
  };
}

class NavBar extends View {
  private readonly links: NavLink[];
  private readonly cta: Button;

  constructor(actions: Record<string, () => void>) {
    super();
    this.links = [
      new NavLink("Features", actions.features),
      new NavLink("Example", actions.example),
      new NavLink("Platforms", actions.platforms),
    ];
    this.cta = new Button({
      label: "Docs",
      background: C.primary,
      hoverBackground: C.primaryDark,
      pressedBackground: C.ink,
      textColor: C.white,
      font: { size: 12, weight: 700 },
      padding: 10,
    });
    this.cta.onPressed = actions.start;
    this.addChild(...this.links, this.cta);
  }

  override layout(): void {
    const pad = this.width >= 900 ? 64 : 20;
    const ctaWidth = this.cta.preferredSize().width;
    this.cta.bounds = rect(this.width - pad - ctaWidth, 18, ctaWidth, 32);
    const linkWidth = 84;
    const end = this.width < 700 ? this.cta.bounds.x - 12 : this.width - pad - ctaWidth - 36;
    this.links.forEach((link, index) => {
      link.bounds = rect(end - (this.links.length - index) * linkWidth, 12, linkWidth, 44);
    });
  }

  override render(canvas: Canvas): void {
    canvas.fill({ x: 0, y: 0, width: this.width, height: this.height }, C.paper);
    canvas.line(point(0, this.height - 1), point(this.width, this.height - 1), stroke(C.hairline));
    const pad = this.width >= 900 ? 64 : 20;
    canvas.text("doodle", point(pad, this.height / 2), {
      font: { size: 18, weight: 800 },
      color: C.ink,
      baseline: "middle",
    });
  }
}

class ToastView extends View {
  message = "";
  alpha = 0;
  private hold = 0;

  show(message: string): void {
    this.message = message;
    this.alpha = 1;
    this.hold = 2.6;
    this.invalidate();
  }

  update(delta: number): void {
    if (this.hold > 0) {
      this.hold -= delta;
      if (this.hold <= 0) this.alpha = 0.001;
    } else if (this.alpha > 0) {
      this.alpha = Math.max(0, this.alpha - delta * 2.2);
    } else return;
    this.invalidate();
  }

  override layout(): void {
    const width = Math.min(420, this.width - 32);
    this.bounds = rect((this.width - width) / 2, this.height - 92, width, 54);
  }

  override render(canvas: Canvas): void {
    if (this.alpha <= 0) return;
    canvas.save();
    canvas.setAlpha(clamp(this.alpha, 0, 1));
    canvas.rect({ x: 0, y: 0, width: this.width, height: this.height }, C.white, stroke(C.primary), 8);
    canvas.circle(point(26, this.height / 2), 6, C.primary);
    canvas.text(this.message, point(44, this.height / 2), { font: { size: 13, weight: 600 }, color: C.content, baseline: "middle" });
    canvas.restore();
  }
}

/** Test hook used by the headless preview renderer to capture a given scroll position. */
export const siteDebug: { scrollTo?: (y: number) => void } = {};

export function createSite({ display }: ApplicationContext): Application {
  const clock = new Clock();
  let time = 0;
  let scroll = 0;
  let target = 0;
  let maxScroll = 0;
  const offsets: Record<string, number> = { features: 0, example: 0, platforms: 0, start: 0 };

  const toast = new ToastView();
  const content = new View();
  const viewport = new View();
  viewport.clipToBounds = true;
  viewport.addChild(content);

  const hero = new HeroSection(() => scrollTo("start"));
  const features = new FeaturesSection();
  const code = new CodeSection();
  const platforms = new PlatformsSection();
  const capabilities = new CapabilitiesSection();
  const start = new StartSection(() => toast.show("Docs: nacular.github.io/doodle"));
  const footer = new FooterSection();
  const sections: Section[] = [hero, features, code, platforms, capabilities, start, footer];
  content.addChild(...sections);

  const nav = new NavBar({
    features: () => scrollTo("features"),
    example: () => scrollTo("example"),
    platforms: () => scrollTo("platforms"),
    start: () => scrollTo("start"),
  });

  const root = new View();
  root.background = C.paper;
  root.acceptsKeyboardFocus = true;
  root.addChild(viewport, nav, toast);
  display.add(root);
  display.focus(root);

  root.layout = () => {
    viewport.bounds = rect(0, 0, root.width, root.height);
    nav.bounds = rect(0, 0, root.width, 68);
    toast.bounds = rect(0, 0, root.width, root.height);
    viewport.setNeedsLayout();
    nav.setNeedsLayout();
    toast.setNeedsLayout();
  };

  content.layout = () => {
    const width = root.width;
    let y = 0;
    for (const section of sections) {
      const height = section.measure(width);
      section.setNeedsLayout();
      section.bounds = rect(0, y, width, height);
      y += height;
    }
    content.bounds = rect(0, 0, width, Math.max(y, root.height));
    offsets.features = sections[1] ? sections[0].bounds.height : 0;
    offsets.example = offsets.features + sections[1].bounds.height;
    offsets.platforms = offsets.example + sections[2].bounds.height;
    offsets.start = offsets.platforms + sections[3].bounds.height + sections[4].bounds.height;
    maxScroll = Math.max(0, y - root.height);
    target = clamp(target, 0, maxScroll);
    scroll = clamp(scroll, 0, maxScroll);
    content.transform = Transform.translate(0, -scroll);
  };

  function scrollTo(id: string): void {
    target = clamp((offsets[id] ?? 0) - 68, 0, maxScroll);
  }

  siteDebug.scrollTo = (y: number) => {
    target = clamp(y, 0, maxScroll);
    scroll = target;
    content.transform = Transform.translate(0, -scroll);
    content.invalidate();
  };

  root.scroll = (event) => {
    target = clamp(target + (event.deltaY ?? 0) * 1.15, 0, maxScroll);
    return true;
  };

  root.pointerMove = (event) => {
    hero.px = clamp((event.at.x / Math.max(1, root.width) - 0.5) * 26, -13, 13);
    hero.py = clamp((event.at.y / Math.max(1, root.height) - 0.5) * 16, -8, 8);
    hero.invalidate();
    return false;
  };

  root.keyDown = (event) => {
    const page = root.height * 0.85;
    if (event.key === "ArrowDown" || event.key === "PageDown" || event.key === " ") target = clamp(target + page, 0, maxScroll);
    else if (event.key === "ArrowUp" || event.key === "PageUp") target = clamp(target - page, 0, maxScroll);
    else if (event.key === "Home") target = 0;
    else if (event.key === "End") target = maxScroll;
    else return false;
    return true;
  };

  const off = clock.onFrame((frame) => {
    time += frame.delta;
    hero.t = time;
    hero.invalidate();
    toast.update(frame.delta);

    const diff = target - scroll;
    if (Math.abs(diff) > 0.4) scroll += diff * Math.min(1, frame.delta * 9);
    else if (diff !== 0) scroll = target;
    else return;
    content.transform = Transform.translate(0, -scroll);
    content.invalidate();
  });

  return {
    shutdown() {
      off();
      clock.stop();
      display.remove(root);
    },
  };
}
