import { asset, dataUri, esc, fitText, svgOpen, THEMES, PURPLE } from "./util.mjs";

const W = 860;
const H = 246;
const CX = 262, CY = 118, R = 100;
const RAMP = ["#8b5cf6", "#a78bfa", "#c4b5fd", "#6d4bc4", "#4c3a8f"];

const CSS = `
text{font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif}
@keyframes e0{from{transform:scaleY(.3)}to{transform:scaleY(1)}}
@keyframes e1{from{transform:scaleY(1)}to{transform:scaleY(.35)}}
@keyframes e2{from{transform:scaleY(.5)}to{transform:scaleY(.9)}}
@keyframes disc{0%,8%{transform:rotate(0)}20%{transform:rotate(120deg);animation-timing-function:linear}92%{transform:rotate(2040deg);animation-timing-function:ease-out}100%{transform:rotate(2160deg)}}
@keyframes arm{0%,6%{transform:rotate(-35deg);animation-timing-function:cubic-bezier(.5,0,.3,1)}18%{transform:rotate(0)}91%{transform:rotate(0);animation-timing-function:ease-in-out}100%{transform:rotate(-35deg)}}
.arm{transform-origin:392px 36px;animation:arm 14s infinite}
.disc{transform-box:fill-box;transform-origin:center;animation:disc 14s infinite}
.eq{transform-box:fill-box;transform-origin:bottom}
.eq0{animation:e0 1s ease-in-out infinite alternate}.eq1{animation:e1 1s ease-in-out infinite alternate}.eq2{animation:e2 1s ease-in-out infinite alternate}
.ot{font-family:OT,-apple-system,'Segoe UI',Arial,sans-serif;font-weight:700}
@media(prefers-reduced-motion:reduce){*{animation:none!important}}`;

const eq = (x, y) =>
  [0, 1, 2].map((j) => `<rect class="eq eq${j}" x="${x + j * 7}" y="${y}" width="3.5" height="13" rx="1" fill="${PURPLE}"/>`).join("");

function wedge(a0, a1, r) {
  const p = (a) => [CX + r * Math.cos((a * Math.PI) / 180), CY + r * Math.sin((a * Math.PI) / 180)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M${CX} ${CY} L${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z`;
}

function coverSymbol(cover) {
  const inner = cover
    ? `<image width="100" height="100" preserveAspectRatio="xMidYMid slice" href="${dataUri(cover.buf, cover.mime)}"/>`
    : `<rect width="100" height="100" fill="#1c2230"/><circle cx="50" cy="50" r="30" fill="none" stroke="#3b2a78" stroke-width="6"/><circle cx="50" cy="50" r="6" fill="#3b2a78"/>`;
  return `<symbol id="cv" viewBox="0 0 100 100">${inner}</symbol>`;
}

export function renderActivity({ theme, track, stats }) {
  const c = THEMES[theme];
  const playing = track.nowPlaying;
  const grooves = Array.from({ length: 19 }, (_, i) => 96 - i * 3)
    .map((r, i) => `<circle cx="${CX}" cy="${CY}" r="${r}" fill="none" stroke="#fff" stroke-opacity="${i % 2 ? 0.05 : 0.02}"/>`)
    .join("");
  const title = fitText(track.name, 190, 34, 20, 0.55);
  const artist = fitText(track.artist, 190, 17, 17, 0.5);
  const sub = fitText(playing ? track.album : [track.album, track.ago].filter(Boolean).join("  ·  "), 190, 13, 13, 0.5);

  let s = `${svgOpen(W, H, ` aria-label="${esc(playing ? "Now playing" : "Last played")}: ${esc(track.name)} by ${esc(track.artist)}"`)}
<title>${esc(track.name)} by ${esc(track.artist)}</title>
<style>@font-face{font-family:OT;font-weight:700;src:url(${dataUri(asset("outfit-700-latin.woff2"), "font/woff2")}) format('woff2')}${CSS}</style>
<defs>
${coverSymbol(track.cover)}
<radialGradient id="dk" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#16181d"/><stop offset=".45" stop-color="#0c0d10"/><stop offset="1" stop-color="#050506"/></radialGradient>
<filter id="bl" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter>
<filter id="ds" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="8" stdDeviation="9" flood-color="#000" flood-opacity="${theme === "dark" ? 0.7 : 0.35}"/></filter>
<clipPath id="lbl"><circle cx="${CX}" cy="${CY}" r="36"/></clipPath>
<clipPath id="slv"><rect x="0" y="24" width="190" height="190" rx="12"/></clipPath>
<clipPath id="lb"><rect x="640" y="202" width="220" height="8" rx="4"/></clipPath>
</defs>
<g${playing ? ' class="disc"' : ""}><circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#dk)"/>${grooves}<g filter="url(#bl)"><path d="${wedge(-50, -20, 94)}" fill="#fff" fill-opacity=".2"/><path d="${wedge(130, 160, 94)}" fill="#fff" fill-opacity=".2"/></g><circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="#fff" stroke-opacity=".12"/><g clip-path="url(#lbl)"><use href="#cv" x="${CX - 36}" y="${CY - 36}" width="72" height="72"/></g><circle cx="${CX}" cy="${CY}" r="36" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="2"/><circle cx="${CX}" cy="${CY}" r="4.5" fill="${theme === "dark" ? "#0d1117" : "#fff"}"/></g>
<rect x="0" y="24" width="190" height="190" rx="12" fill="#000" filter="url(#ds)"/>
<g clip-path="url(#slv)"><use href="#cv" x="0" y="24" width="190" height="190"/></g>
<rect x=".5" y="24.5" width="189" height="189" rx="12" fill="none" stroke="#fff" stroke-opacity=".1"/>
<g${playing ? ' class="arm"' : ' transform="rotate(-35 392 36)"'}><line x1="392" y1="36" x2="322" y2="150" stroke="#c9d1d9" stroke-width="4" stroke-linecap="round"/><line x1="392" y1="36" x2="406" y2="12" stroke="#8b949e" stroke-width="6" stroke-linecap="round"/><circle cx="392" cy="36" r="15" fill="#1b1f27" stroke="#30363d" stroke-width="2"/><circle cx="392" cy="36" r="5" fill="#8b949e"/><path d="M314 144 L330 152 L326 160 L312 152 Z" fill="#e6edf3"/><circle cx="321" cy="156" r="1.6" fill="${PURPLE}"/></g>
`;
  s += playing
    ? `${eq(440, 60)}<text x="466" y="71" font-size="11" font-weight="700" letter-spacing="2.4" fill="${PURPLE}">NOW PLAYING</text>`
    : `<text x="440" y="71" font-size="11" font-weight="700" letter-spacing="2.4" fill="${c.faint}">LAST PLAYED</text>`;
  s += `<text class="ot" x="438" y="124" font-size="${title.size}" letter-spacing="-1" fill="${c.title}">${esc(title.text)}</text>`;
  s += `<text x="440" y="152" font-size="${artist.size}" fill="${c.sub}">${esc(artist.text)}</text>`;
  if (sub.text) s += `<text x="440" y="176" font-size="${sub.size}" fill="${c.mu}">${esc(sub.text)}</text>`;

  const nums = [["Contributions", stats.contributions], ["Commits", stats.commits], ["Pull requests", stats.prs], ["Issues", stats.issues]];
  s += `<text x="640" y="40" font-size="12" font-weight="600" letter-spacing="2" fill="${c.faint}">LAST 12 MONTHS</text>`;
  nums.forEach(([label, v], i) => {
    const x = 640 + (i % 2) * 115, y = 88 + Math.floor(i / 2) * 72;
    s += `<text x="${x}" y="${y}" font-size="30" font-weight="700" letter-spacing="-1" fill="${c.tx}">${v.toLocaleString("en-US")}</text><text x="${x + 1}" y="${y + 22}" font-size="12" fill="${c.mu}">${label}</text>`;
  });
  let x = 640;
  s += `<g clip-path="url(#lb)">`;
  stats.langs.forEach((l, i) => {
    const w = 220 * l.share;
    s += `<rect x="${x.toFixed(1)}" y="202" width="${Math.max(w, 3).toFixed(1)}" height="8" fill="${RAMP[i]}"/>`;
    x += w;
  });
  s += `</g><text x="640" y="233" font-size="12" fill="${c.mu}">`;
  stats.langs.slice(0, 2).forEach((l, i) => {
    s += `<tspan fill="${RAMP[i]}" dx="${i ? 12 : 0}">●</tspan><tspan fill="${c.tx}" dx="4">${esc(l.name)}</tspan><tspan dx="4">${Math.round(l.share * 100)}%</tspan>`;
  });
  return s + `</text>\n</svg>\n`;
}
