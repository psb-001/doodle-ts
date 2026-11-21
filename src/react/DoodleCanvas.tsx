"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type DependencyList, type ReactNode } from "react";
import { Display, mountApplication, type Application, type ApplicationContext } from "../core/display";
import type { Canvas } from "../core/canvas";
import type { View } from "../core/view";

export type { Application, ApplicationContext } from "../core/display";

export interface DoodleApp extends Application, ApplicationContext {
  display: Display;
  canvas: Canvas;
}

interface DoodleBridge {
  app: DoodleApp | null;
  display: Display | null;
}

const DoodleContext = createContext<DoodleBridge>({ app: null, display: null });

export function useDoodle(): DoodleBridge {
  return useContext(DoodleContext);
}

export function useDoodleDisplay(): Display | null {
  return useContext(DoodleContext).display;
}

export interface DoodleCanvasProps {
  /** Factory that builds your Doodle application. Keep it referentially stable (useCallback). */
  create: (context: ApplicationContext) => Application;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/** React host for a Doodle application. React owns the page; Doodle owns the canvas. */
export function DoodleCanvas({ create, className, style, children }: DoodleCanvasProps): React.JSX.Element {
  const ref = useRef<HTMLCanvasElement>(null);
  const [app, setApp] = useState<DoodleApp | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const mounted = mountApplication(element, create) as DoodleApp;
    setApp(mounted);
    return () => {
      mounted.shutdown();
      setApp(null);
    };
  }, [create]);

  const bridge = useMemo<DoodleBridge>(() => ({ app, display: app?.display ?? null }), [app]);

  return (
    <DoodleContext.Provider value={bridge}>
      <canvas
        ref={ref}
        className={className}
        style={{ display: "block", width: "100%", height: "100%", outline: "none", ...style }}
      />
      {children}
    </DoodleContext.Provider>
  );
}

/** Create a stable view instance from a factory. */
export function useView<T extends View>(factory: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}

/** Create a view and attach it to the Doodle display for the component's lifetime. */
export function useDoodleView<T extends View>(factory: () => T, deps: DependencyList): T | null {
  const display = useDoodleDisplay();
  const view = useView(factory, deps);

  useEffect(() => {
    if (!display) return;
    display.add(view);
    return () => {
      display.remove(view);
    };
  }, [display, view]);

  return display ? view : null;
}

/** Push a React value into a view property whenever it changes. */
export function useViewProperty<T extends View, K extends keyof T>(view: T | null, key: K, value: T[K]): void {
  useEffect(() => {
    if (!view) return;
    if (view[key] === value) return;
    (view as Record<string, unknown>)[key as string] = value;
    view.setNeedsLayout();
    view.invalidate();
  }, [view, key, value]);
}
