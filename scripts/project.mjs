import { asset, dataUri, esc, THEMES, PURPLE } from "./util.mjs";

const W = 860;
const TEXT_LEFT = 120;
const CSS = `text{font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif}
.ot{font-family:OT,-apple-system,'Segoe UI',Arial,sans-serif;font-weight:700}`;

const ICONS = {
  star: `<path d="M8 1.5l1.9 4.1 4.4.5-3.3 3 .9 4.4L8 11.2l-3.9 2.3.9-4.4-3.3-3 4.4-.5z" fill="currentColor"/>`,
  fork: `<circle cx="4" cy="3" r="1.6" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="12" cy="3" r="1.6" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="8" cy="13" r="1.6" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M4 4.6v1.4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V4.6M8 8v3.4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`,
  pulls: `<path d="M8 2v8M4.8 7L8 10.2 11.2 7M3 13.2h10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  release: `<path d="M2 8.2V2h6.2l6 6.2-6 6z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><circle cx="5.2" cy="5.2" r="1" fill="currentColor"/>`,
  license: `<path d="M8 1.8l5.2 2v4.2c0 3-2.2 5.2-5.2 6.2-3-1-5.2-3.2-5.2-6.2V3.8z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>`,
};

export function wrap(text, maxChars, maxLines = 2) {
  const lines = [];
  let line = "";
  for (const w of text.split(/\s+/)) {
    if ((line + " " + w).trim().length > maxChars && line) {
      lines.push(line);
      line = w;
    } else line = (line + " " + w).trim();
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = kept[maxLines - 1].replace(/[\s.,;:]*$/, "").slice(0, maxChars - 1) + "…";
  return kept;
}

export function renderProject({ theme, project }) {
  const c = THEMES[theme];
  const title = project.name.charAt(0).toUpperCase() + project.name.slice(1);
  const lines = wrap(project.description, 92);
  const items = [
    project.language && { dot: project.languageColor, text: project.language },
    { icon: "star", text: project.stars.toLocaleString("en-US") },
    { icon: "fork", text: project.forks.toLocaleString("en-US") },
    project.pulls && { icon: "pulls", text: `${project.pulls} pulls` },
    project.release && { icon: "release", text: project.release },
    project.license && { icon: "license", text: project.license },
  ].filter(Boolean);

  const statsY = 62 + lines.length * 22 + 14;
  let x = TEXT_LEFT;
  let stats = "";
  for (const it of items) {
    const w = it.text.length * 7 + 30;
    stats += it.dot
      ? `<circle cx="${x + 5}" cy="${statsY + 8}" r="5" fill="${it.dot}"/><text x="${x + 16}" y="${statsY + 13}" font-size="13" fill="${c.mu}">${esc(it.text)}</text>`
      : `<g transform="translate(${x} ${statsY})" color="${c.mu}">${ICONS[it.icon]}</g><text x="${x + 21}" y="${statsY + 13}" font-size="13" fill="${c.mu}">${esc(it.text)}</text>`;
    x += w + 8;
  }
  const H = statsY + 34;
  const iconY = Math.round((H - 88) / 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(project.name)}: ${esc(project.description)}">
<title>${esc(project.name)}</title>
<style>@font-face{font-family:OT;font-weight:700;src:url(${dataUri(asset("outfit-700-latin.woff2"), "font/woff2")}) format('woff2')}${CSS}</style>
<image x="0" y="${iconY}" width="88" height="88" href="${dataUri(asset("staaash-icon.png"), "image/png")}"/>
<rect x=".5" y="${iconY + 0.5}" width="87" height="87" rx="20" fill="none" stroke="${theme === "dark" ? "#fff" : "#000"}" stroke-opacity="${theme === "dark" ? 0.16 : 0.1}"/>
<text class="ot" x="${TEXT_LEFT}" y="38" font-size="28" letter-spacing="-.6" fill="${c.title}">${esc(title)}<tspan fill="${PURPLE}" dx="8" font-size="20">↗</tspan></text>
${lines.map((l, i) => `<text x="${TEXT_LEFT}" y="${68 + i * 22}" font-size="15" fill="${c.sub}">${esc(l)}</text>`).join("\n")}
${stats}
</svg>
`;
}
