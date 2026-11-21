import React from "react";
import { DoodleCanvas } from "../src/react/DoodleCanvas";
import { createSite } from "./site";

/** The entire website is one DoodleCanvas, with no DOM UI beyond the host element. */
export function App(): React.JSX.Element {
  return <DoodleCanvas create={createSite} style={{ width: "100vw", height: "100vh" }} />;
}
