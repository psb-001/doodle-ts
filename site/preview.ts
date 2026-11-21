import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Display, SvgCanvas } from "../src/index";
import { createSite, siteDebug } from "./site";

function render(width: number, height: number, scroll: number, file: string): void {
  const canvas = SvgCanvas.of(width, height);
  const display = new Display(canvas);
  createSite({ display, canvas });
  display.resize(width, height);
  display.layout();
  siteDebug.scrollTo?.(scroll);
  display.render();
  const out = resolve(__dirname, file);
  writeFileSync(out, canvas.svg, "utf8");
  console.log(`${file}: ${canvas.svg.length} bytes`);
}

render(1440, 900, 0, "preview-fold.svg");
render(1440, 900, 600, "preview-features.svg");
render(1440, 900, 900, "preview-code.svg");
render(1440, 900, 1500, "preview-platforms.svg");
