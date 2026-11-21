import { Color } from "./color";

/**
 * Doodle brand tokens — sourced from the upstream project, not invented:
 *   docs/img/doodle.svg   wordmark #000000, details #FFFFFF
 *   docs site stylesheet  --ifm-color-gray-100   #f5f6f7
 *                          --ifm-color-gray-900   #1c1e21
 *                          --ifm-color-gray-700   #606770
 *                          --ifm-color-gray-600   #8d949e
 *                          --ifm-color-gray-300   #dadde1
 *                          --ifm-color-gray-200   #ebedf0
 *                          --ifm-color-primary    #3578e5
 *                          --ifm-color-primary-dark #2d66c3
 *                          --ifm-color-primary-light #538ce9
 */
export const doodle = {
  paper: Color.fromHex("#f5f6f7"),
  white: Color.fromHex("#ffffff"),
  ink: Color.fromHex("#000000"),
  content: Color.fromHex("#1c1e21"),
  muted: Color.fromHex("#606770"),
  faint: Color.fromHex("#8d949e"),
  hairline: Color.fromHex("#dadde1"),
  surface: Color.fromHex("#ebedf0"),
  primary: Color.fromHex("#3578e5"),
  primaryDark: Color.fromHex("#2d66c3"),
  primaryLight: Color.fromHex("#538ce9"),
  primaryPale: Color.fromHex("#ebf2fc"),
} as const;
