import { Color } from "./color";

export type Easing = (t: number) => number;

export const easing = {
  linear: (t: number): number => t,
  easeInQuad: (t: number): number => t * t,
  easeOutQuad: (t: number): number => t * (2 - t),
  easeInOutCubic: (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  easeOutCubic: (t: number): number => 1 - Math.pow(1 - t, 3),
  easeOutBack: (t: number): number => {
    const c = 1.70158;
    return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
  },
  easeOutElastic: (t: number): number => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  },
} satisfies Record<string, Easing>;

export interface ClockFrame {
  readonly time: number;
  readonly delta: number;
}

/** Drives animation and repaint frames from requestAnimationFrame. */
export class Clock {
  private readonly listeners = new Set<(frame: ClockFrame) => void>();
  private handle: number | undefined;
  private last: number | undefined;
  private _time = 0;
  private _delta = 0;

  get running(): boolean {
    return this.handle !== undefined;
  }

  get time(): number {
    return this._time;
  }

  get delta(): number {
    return this._delta;
  }

  onFrame(listener: (frame: ClockFrame) => void): () => void {
    this.listeners.add(listener);
    this.start();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) this.stop();
    };
  }

  start(): void {
    if (this.handle !== undefined || typeof requestAnimationFrame === "undefined") return;
    this.last = undefined;
    const tick = (now: number) => {
      this._delta = this.last === undefined ? 0 : (now - this.last) / 1000;
      this.last = now;
      this._time += this._delta;
      for (const listener of [...this.listeners]) listener({ time: this._time, delta: this._delta });
      if (this.handle !== undefined) this.handle = requestAnimationFrame(tick);
    };
    this.handle = requestAnimationFrame(tick);
  }

  stop(): void {
    if (this.handle !== undefined) cancelAnimationFrame(this.handle);
    this.handle = undefined;
    this.last = undefined;
  }

  /** Advance all listeners manually, useful in tests and headless renders. */
  tick(deltaSeconds: number): void {
    this._delta = deltaSeconds;
    this._time += deltaSeconds;
    for (const listener of [...this.listeners]) listener({ time: this._time, delta: this._delta });
  }
}

export interface AnimatorOptions<T> {
  from: T;
  to: T;
  duration: number;
  easing?: Easing;
  delay?: number;
  loop?: boolean;
  onUpdate: (value: T) => void;
  onComplete?: () => void;
  interpolate?: (from: T, to: T, t: number) => T;
}

function defaultInterpolate<T>(from: T, to: T, t: number): T {
  if (typeof from === "number" && typeof to === "number") return (from + (to - from) * t) as T;
  if (from instanceof Color && to instanceof Color) {
    return new Color(
      from.red + (to.red - from.red) * t,
      from.green + (to.green - from.green) * t,
      from.blue + (to.blue - from.blue) * t,
      from.alpha + (to.alpha - from.alpha) * t,
    ) as T;
  }
  return t < 1 ? from : to;
}

/** A seek-safe tween that can be advanced by a Clock or stepped manually. */
export class Animator<T> {
  private elapsed = 0;
  private active = false;
  private readonly ease: Easing;
  private readonly lerp: (from: T, to: T, t: number) => T;

  constructor(private readonly options: AnimatorOptions<T>) {
    this.ease = options.easing ?? easing.easeInOutCubic;
    this.lerp = options.interpolate ?? defaultInterpolate;
  }

  get running(): boolean {
    return this.active;
  }

  start(): this {
    this.elapsed = -(this.options.delay ?? 0);
    this.active = true;
    this.options.onUpdate(this.options.from);
    return this;
  }

  stop(): this {
    this.active = false;
    return this;
  }

  reset(): this {
    this.elapsed = 0;
    this.active = false;
    return this;
  }

  update(delta: number): void {
    if (!this.active) return;
    this.elapsed += delta;
    if (this.elapsed < 0) return;
    const progress = this.options.duration <= 0 ? 1 : Math.min(1, this.elapsed / this.options.duration);
    this.options.onUpdate(this.lerp(this.options.from, this.options.to, this.ease(progress)));
    if (progress < 1) return;
    if (this.options.loop) {
      this.elapsed = 0;
      return;
    }
    this.active = false;
    this.options.onComplete?.();
  }

  attach(clock: Clock): () => void {
    const off = clock.onFrame((frame) => this.update(frame.delta));
    this.start();
    return () => {
      off();
      this.stop();
    };
  }
}

export function animate<T>(clock: Clock, options: AnimatorOptions<T>): Animator<T> {
  const animator = new Animator(options);
  animator.attach(clock);
  return animator;
}

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
