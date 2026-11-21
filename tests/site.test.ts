import { describe, expect, it } from "vitest";
import { Color, Display, point, rect, stroke, SvgCanvas, Transform } from "../src/index";
import { Button } from "../src/widgets/widgets";
import { createSite } from "../site/site";

describe("SVG backend", () => {
  it("emits valid, transform-aware SVG shapes", () => {
    const canvas = SvgCanvas.of(200, 100);
    canvas.fill(rect(0, 0, 200, 100), Color.fromHex("#0e0b09"));
    canvas.save();
    canvas.transform(Transform.translate(10, 20));
    canvas.rect(rect(0, 0, 40, 30), Color.Acid);
    canvas.line(point(0, 0), point(40, 30), stroke(Color.White));
    canvas.restore();
    canvas.text("Hello", point(10, 50));
    const svg = canvas.svg;
    expect(svg).toContain("<svg");
    expect(svg).toContain('matrix(1 0 0 1 10 20)');
    expect(svg).toContain("<line");
    expect(svg).toContain("Hello");
    expect(svg.match(/fill=/g)?.length).toBeGreaterThan(3);
  });
});

describe("button", () => {
  it("renders its label as a child view", () => {
    const button = new Button({ label: "Press me" });
    expect(button.children).toHaveLength(1);
    expect(button.label).toBe("Press me");
  });
});

describe("demo website", () => {
  it("renders all sections through the port into a single SVG", () => {
    const canvas = SvgCanvas.of(1440, 2400);
    const display = new Display(canvas);
    const app = createSite({ display, canvas });
    display.resize(1440, 2400);
    display.render();

    const svg = canvas.svg;
    expect(svg).toContain("A native TypeScript UI framework");
    expect(svg).toContain("One Language");
    expect(svg).toContain("Web First");
    expect(svg).toContain("Hello, world!");
    expect(svg).toContain("doodle-ts, MIT licensed");
    expect(svg).toContain("rgba(53, 120, 229, 1)");
    expect(display.views).toHaveLength(1);
    expect(svg.length).toBeGreaterThan(20000);
    app.shutdown();
  });
});
