import { svgOpen, THEMES } from "./util.mjs";

const W = 860;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CSS = `
@keyframes in{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:none}}
@keyframes sh{0%,100%{opacity:1}50%{opacity:.45}}
.q{transform-box:fill-box;transform-origin:center;animation:in .5s ease-out calc(var(--d)*28ms) both,sh 8s ease-in-out calc(3s + var(--d)*90ms) infinite}
@media(prefers-reduced-motion:reduce){*{animation:none!important}}`;

export function monthLabels(weeks) {
  const out = [];
  let last = -1;
  weeks.forEach((w, i) => {
    const m = Number(w[0].date.slice(5, 7)) - 1;
    if (m !== last && i < weeks.length - 2) {
      if (out.length && i - out[out.length - 1].week < 3) out.pop();
      out.push({ week: i, name: MONTHS[m] });
      last = m;
    }
  });
  return out;
}

export function renderGraph({ theme, weeks }) {
  const c = THEMES[theme];
  const pitch = (W - 44) / weeks.length;
  const cell = pitch - 3;
  const max = Math.max(1, ...weeks.flat().map((d) => d.contributionCount));
  const level = (n) => (n === 0 ? 0 : 1 + Math.min(3, Math.floor((4 * (n - 1)) / max)));
  let s = `${monthLabels(weeks).map((m) => `<text x="${(44 + m.week * pitch).toFixed(1)}" y="12" font-size="11" fill="${c.mu}">${m.name}</text>`).join("")}`;
  [["Mon", 1], ["Wed", 3], ["Fri", 5]].forEach(([n, i]) => {
    s += `<text x="36" y="${(20 + i * pitch + pitch * 0.72).toFixed(1)}" text-anchor="end" font-size="11" fill="${c.mu}">${n}</text>`;
  });
  weeks.forEach((w, wi) =>
    w.forEach((d, di) => {
      s += `<rect class="q" style="--d:${wi}" x="${(44 + wi * pitch).toFixed(1)}" y="${(20 + di * pitch).toFixed(1)}" width="${cell.toFixed(1)}" height="${cell.toFixed(1)}" rx="2.5" fill="${c.cells[level(d.contributionCount)]}"/>`;
    }),
  );
  const ly = 20 + 7 * pitch + 10;
  s += `<text x="700" y="${(ly + 9).toFixed(1)}" font-size="11" fill="${c.mu}">Less</text>`;
  c.cells.forEach((col, i) => (s += `<rect x="${730 + i * 14}" y="${ly.toFixed(1)}" width="11" height="11" rx="2" fill="${col}"/>`));
  s += `<text x="${730 + 5 * 14 + 4}" y="${(ly + 9).toFixed(1)}" font-size="11" fill="${c.mu}">More</text>`;
  return `${svgOpen(W, Math.round(ly + 22), ' aria-label="Contributions in the last 12 months"')}
<title>Contributions in the last 12 months</title>
<style>${CSS}</style>
${s}
</svg>
`;
}
