"use client";

import React, { useCallback, useEffect, useState } from "react";
import { DoodleCanvas } from "../src/react/DoodleCanvas";
import { demoBridge } from "./bridge";
import { demos } from "./examples";

const swatches = ["#0e0b09", "#1a1310", "#3a2b23", "#ff5b2e", "#4a63ff", "#d7ff3a"];

export function App(): React.JSX.Element {
  const [active, setActive] = useState<(typeof demos)[number]["id"]>("hello");
  const [events, setEvents] = useState<string[]>([]);
  const demo = demos.find((d) => d.id === active) ?? demos[0];

  useEffect(() => {
    demoBridge.log = (message: string) => {
      const stamp = new Date().toLocaleTimeString([], { hour12: false });
      setEvents((current) => [`${stamp}  ${message}`, ...current].slice(0, 6));
    };
  }, []);

  const create = useCallback(demo.create, [demo.create]);

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div style={styles.brand}>
          <span style={styles.mark}>D</span>
          <div>
            <div style={styles.title}>doodle<span style={{ color: "#ff5b2e" }}>·ts</span></div>
            <div style={styles.subtitle}>native TypeScript port · React host</div>
          </div>
        </div>
        <div style={styles.swatches}>
          {swatches.map((color) => (
            <span key={color} title={color} style={{ ...styles.swatch, background: color }} />
          ))}
        </div>
      </header>

      <nav style={styles.tabs} aria-label="Demos">
        {demos.map((d) => (
          <button
            key={d.id}
            onClick={() => {
              setActive(d.id);
              setEvents([]);
            }}
            style={{ ...styles.tab, ...(d.id === active ? styles.tabActive : {}) }}
            aria-pressed={d.id === active}
          >
            {d.label}
          </button>
        ))}
      </nav>

      <p style={styles.note}>{demo.note}</p>

      <section style={styles.stage}>
        <DoodleCanvas key={demo.id} create={create} />
      </section>

      <section style={styles.log}>
        <div style={styles.logTitle}>input events</div>
        {events.length === 0 ? (
          <div style={styles.logEmpty}>Interact with the canvas — clicks, drags and keystrokes land here.</div>
        ) : (
          events.map((event, index) => (
            <div key={`${event}-${index}`} style={styles.logRow}>
              <code>{event}</code>
            </div>
          ))
        )}
      </section>

      <footer style={styles.footer}>
        Engine: view tree · vector canvas · layout · input · animation · widgets · React bindings — all in <code>src/</code>.
      </footer>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 980, margin: "0 auto", padding: "32px 24px 64px", fontFamily: "ui-sans-serif, system-ui, sans-serif" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" },
  brand: { display: "flex", alignItems: "center", gap: 14 },
  mark: {
    width: 44,
    height: 44,
    borderRadius: 10,
    background: "#ff5b2e",
    color: "#0e0b09",
    display: "grid",
    placeItems: "center",
    fontWeight: 800,
    fontSize: 22,
  },
  title: { fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" },
  subtitle: { fontSize: 12, color: "#b6a394", fontFamily: "ui-monospace, monospace" },
  swatches: { display: "flex", gap: 6 },
  swatch: { width: 20, height: 20, borderRadius: 5, border: "1px solid #3a2b23" },
  tabs: { display: "flex", gap: 8, marginTop: 28, flexWrap: "wrap" },
  tab: {
    background: "#1a1310",
    color: "#b6a394",
    border: "1px solid #3a2b23",
    borderRadius: 6,
    padding: "8px 14px",
    cursor: "pointer",
    font: "inherit",
    fontSize: 14,
  },
  tabActive: { background: "#d7ff3a", color: "#0e0b09", borderColor: "#d7ff3a", fontWeight: 700 },
  note: { color: "#b6a394", fontSize: 14, margin: "14px 0" },
  stage: {
    height: 460,
    border: "1px solid #3a2b23",
    borderRadius: 10,
    overflow: "hidden",
    background: "#0e0b09",
  },
  log: {
    marginTop: 16,
    border: "1px solid #3a2b23",
    borderRadius: 10,
    padding: 14,
    minHeight: 92,
    background: "#1a1310",
  },
  logTitle: { fontFamily: "ui-monospace, monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#ff5b2e", marginBottom: 8 },
  logEmpty: { color: "#b6a394", fontSize: 13 },
  logRow: { fontSize: 13, padding: "3px 0", borderBottom: "1px dashed #3a2b23" },
  footer: { marginTop: 24, color: "#b6a394", fontSize: 12 },
};
