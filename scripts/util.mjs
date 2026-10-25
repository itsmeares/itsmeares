import { readFileSync } from "node:fs";

export const asset = (file) => readFileSync(new URL(`../assets/src/${file}`, import.meta.url));

export const dataUri = (buf, mime) => `data:${mime};base64,${Buffer.from(buf).toString("base64")}`;

export const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function rng(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

// k is the average glyph width as a fraction of the font size.
export function fitText(text, maxWidth, size, minSize, k) {
  let s = size;
  while (s > minSize && text.length * s * k > maxWidth) s--;
  if (text.length * s * k <= maxWidth) return { text, size: s };
  const n = Math.max(1, Math.floor(maxWidth / (s * k)) - 1);
  return { text: text.slice(0, n).trimEnd() + "…", size: s };
}

// Long titles first lose a trailing "(...)" or " - ..." part, then get cut with an ellipsis.
export function fitTitle(text, maxWidth, size, minSize, k) {
  const full = fitText(text, maxWidth, size, minSize, k);
  if (!full.text.endsWith("…")) return full;
  const short = text.replace(/\s*[([].*$/, "").replace(/\s+[-–—]\s+.*$/, "").trim();
  return short && short !== text ? fitText(short, maxWidth, size, minSize, k) : full;
}

export const THEMES = {
  dark: {
    tx: "#e6edf3", title: "#ffffff", sub: "#c9d1d9", mu: "#8b949e", faint: "#6e7681",
    cells: ["#1c2230", "#3b2a78", "#5b3fb3", "#7c4ddd", "#a78bfa"],
  },
  light: {
    tx: "#1f2328", title: "#1f2328", sub: "#424a53", mu: "#656d76", faint: "#8c959f",
    cells: ["#ebedf0", "#d8ccfb", "#b79bf5", "#8b5cf6", "#6d3fd9"],
  },
};

export const PURPLE = "#8b5cf6";

export function svgOpen(w, h, extra = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img"${extra}>`;
}
