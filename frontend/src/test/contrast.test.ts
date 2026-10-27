import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type Rgb = [number, number, number];
type Theme = Record<string, Rgb>;

const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");

function block(selector: string): Theme {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`Missing block ${selector}`);
  const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
  const theme: Theme = {};
  for (const match of body.matchAll(/--([\w-]+):\s*(\d+) (\d+) (\d+);/g)) {
    theme[match[1]!] = [Number(match[2]), Number(match[3]), Number(match[4])];
  }
  return theme;
}

function luminance([r, g, b]: Rgb): number {
  const [lr, lg, lb] = [r, g, b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

export function contrast(a: Rgb, b: Rgb): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

const TEXT_PAIRS: Array<[string, string]> = [
  ["ink", "bg"],
  ["ink", "surface"],
  ["ink", "mint"],
  ["muted", "bg"],
  ["muted", "surface"],
  ["muted", "mint"],
  ["brand", "bg"],
  ["brand", "surface"],
  ["on-brand", "brand"],
  ["danger", "bg"],
  ["danger", "surface"],
];

const GRAPHIC_PAIRS: Array<[string, string]> = [
  ["control", "bg"],
  ["control", "surface"],
  ["brand", "bg"],
  ["brand", "surface"],
  ["ink", "bg"],
];

const themes: Record<string, Theme> = {
  light: block(":root"),
  "dark (explicit)": block(':root[data-theme="dark"]'),
  "dark (system)": block(':root:not([data-theme="light"])'),
};

describe.each(Object.entries(themes))("%s theme", (_name, theme) => {
  it.each(TEXT_PAIRS)("text %s on %s reaches 4.5:1", (foreground, background) => {
    expect(contrast(theme[foreground]!, theme[background]!)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(GRAPHIC_PAIRS)("component %s against %s reaches 3:1", (foreground, background) => {
    expect(contrast(theme[foreground]!, theme[background]!)).toBeGreaterThanOrEqual(3);
  });
});

describe("dark theme definitions", () => {
  it("stay identical between the explicit and the system variant", () => {
    expect(themes["dark (explicit)"]).toEqual(themes["dark (system)"]);
  });
});
