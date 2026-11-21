import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");

document.body.style.margin = "0";
document.body.style.background = "#0e0b09";
document.documentElement.style.scrollBehavior = "auto";

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
