import { centerX, centerY, point, rect, right, bottom, size, type Size } from "./geometry";
import type { View } from "./view";

export interface Layout {
  layout(parent: View): void;
}

function naturalSize(child: View): Size {
  const preferred = child.preferredSize();
  return {
    width: preferred.width > 0 ? preferred.width : child.bounds.width,
    height: preferred.height > 0 ? preferred.height : child.bounds.height,
  };
}

/** Every child fills the parent (minus optional padding). */
export class FillLayout implements Layout {
  constructor(public padding = 0) {}

  layout(parent: View): void {
    const p = this.padding;
    for (const child of parent.children) {
      child.bounds = rect(p, p, Math.max(0, parent.width - 2 * p), Math.max(0, parent.height - 2 * p));
    }
  }
}

export const fillLayout = (padding = 0): FillLayout => new FillLayout(padding);

/** Center each child at its preferred size. */
export class CenterLayout implements Layout {
  constructor(public padding = 0) {}

  layout(parent: View): void {
    for (const child of parent.children) {
      const s = naturalSize(child);
      child.bounds = rect(centerX(parent.bounds) - s.width / 2, centerY(parent.bounds) - s.height / 2, s.width, s.height);
    }
  }
}

export const centerLayout = (padding = 0): CenterLayout => new CenterLayout(padding);

export type StackDirection = "horizontal" | "vertical";
export type StackAlignment = "start" | "center" | "end" | "stretch";

/** Lays children out in a row or column using their preferred sizes. */
export class StackLayout implements Layout {
  constructor(
    public direction: StackDirection = "vertical",
    public spacing = 0,
    public alignment: StackAlignment = "start",
    public padding = 0,
  ) {}

  layout(parent: View): void {
    const vertical = this.direction === "vertical";
    const sizes = parent.children.map(naturalSize);
    const mainTotal =
      sizes.reduce((sum, s) => sum + (vertical ? s.height : s.width), 0) + this.spacing * Math.max(0, parent.children.length - 1);
    const availableMain = Math.max(0, (vertical ? parent.height : parent.width) - this.padding * 2);
    let cursor = this.padding + (this.alignment === "center" ? (availableMain - mainTotal) / 2 : this.alignment === "end" ? availableMain - mainTotal : 0);

    parent.children.forEach((child, index) => {
      const s = sizes[index];
      let cross = this.padding;
      let crossSize = vertical ? s.width : s.height;
      const availableCross = Math.max(0, (vertical ? parent.width : parent.height) - this.padding * 2);
      if (this.alignment === "center") cross += (availableCross - crossSize) / 2;
      else if (this.alignment === "end") cross += availableCross - crossSize;
      else if (this.alignment === "stretch") crossSize = availableCross;

      child.bounds = vertical
        ? rect(cross, cursor, crossSize, s.height)
        : rect(cursor, cross, s.width, crossSize);
      cursor += (vertical ? s.height : s.width) + this.spacing;
    });
  }

  preferredSize(children: readonly View[]): Size {
    const sizes = children.map(naturalSize);
    const main = sizes.reduce((sum, s) => sum + (this.direction === "vertical" ? s.height : s.width), 0) + this.spacing * Math.max(0, sizes.length - 1);
    const cross = sizes.reduce((max, s) => Math.max(max, this.direction === "vertical" ? s.width : s.height), 0);
    return this.direction === "vertical" ? size(cross, main) : size(main, cross);
  }
}

/** Local helper used by widgets that need a position + size tuple. */
export const boundsAt = (x: number, y: number, s: Size) => rect(x, y, s.width, s.height);
export const farEdge = (r: { x: number; y: number; width: number; height: number }) => point(right(r), bottom(r));
