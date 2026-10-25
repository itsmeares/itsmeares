import { asset, dataUri, rng, svgOpen, PURPLE } from "./util.mjs";

const W = 860;
const H = 265;

const CSS = `
.n{font-family:N,-apple-system,'Segoe UI',Arial,sans-serif;font-weight:700}
.t{font-family:T,-apple-system,'Segoe UI',Arial,sans-serif;font-weight:500}
.u{animation:u .7s ease-out both}@keyframes u{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.g{transform-box:fill-box;transform-origin:left;animation:g .9s .5s ease-out both}@keyframes g{from{transform:scaleX(0)}}
@keyframes pan{from{transform:translateX(0) scale(1.05)}to{transform:translateX(-26px) scale(1.05)}}
.pan{transform-origin:430px 132px;animation:pan 46s ease-in-out infinite alternate}
@keyframes rn{from{transform:translate(0,-40px)}to{transform:translate(-44px,330px)}}
.rn{animation:rn var(--t) linear infinite;animation-delay:var(--d)}
@keyframes sn{from{transform:translate(0,-12px)}50%{transform:translate(16px,150px)}to{transform:translate(-8px,285px)}}
.sn{animation:sn var(--t) linear infinite;animation-delay:var(--d)}
@keyframes fa{from{transform:translateX(-380px)}to{transform:translateX(420px)}}
@keyframes fb{from{transform:translateX(420px)}to{transform:translateX(-380px)}}
.fa{animation:fa 44s ease-in-out infinite alternate}.fb{animation:fb 58s ease-in-out infinite alternate}
@keyframes lg{0%,86%,100%{opacity:0}87%{opacity:.55}88.5%{opacity:.05}90%{opacity:.4}93%{opacity:0}}
.lg{animation:lg 9s linear infinite}
@media(prefers-reduced-motion:reduce){*{animation:none!important}}`;

const TINT = {
  day: `<rect width="${W}" height="${H}" fill="#000" opacity=".4"/>`,
  golden: `<rect width="${W}" height="${H}" fill="#000" opacity=".36"/><rect width="${W}" height="${H}" fill="#ff7a2e" opacity=".17"/>`,
  night: `<rect width="${W}" height="${H}" fill="#000" opacity=".55"/><rect width="${W}" height="${H}" fill="#0a1a44" opacity=".38"/>`,
};

function sky(kind) {
  const r = rng(7);
  const full = (fill, op) => `<rect width="${W}" height="${H}" fill="${fill}" opacity="${op}"/>`;
  let o = "";
  if (kind === "rain" || kind === "heavy" || kind === "storm") {
    const n = kind === "rain" ? 90 : 150;
    o += full("#5b6b8a", ".2");
    for (let i = 0; i < n; i++) {
      const x = -20 + r() * 920, len = 12 + r() * 14, t = 0.55 + r() * 0.4, d = -r();
      const op = 0.2 + r() * 0.3, sw = r() < 0.66 ? 1 : 1.3;
      o += `<line class="rn" style="--t:${t.toFixed(2)}s;--d:${d.toFixed(2)}s" x1="${x.toFixed(0)}" y1="0" x2="${(x - len * 0.1).toFixed(0)}" y2="${len.toFixed(0)}" stroke="#c7d4ff" stroke-opacity="${op.toFixed(2)}" stroke-width="${sw}"/>`;
    }
    if (kind === "storm") o += `<rect class="lg" width="${W}" height="${H}" fill="#e9f0ff"/>`;
  } else if (kind === "fog") {
    o += full("#c9d1db", ".2");
    for (const [cls, y, h, w] of [["fa", 20, 90, 760], ["fb", 100, 100, 820], ["fa", 165, 90, 700]])
      o += `<g class="${cls}"><rect x="40" y="${y}" width="${w}" height="${h}" fill="url(#fg)" filter="url(#bl)"/></g>`;
  } else if (kind === "snow") {
    o += full("#9fb0c8", ".12");
    for (let i = 0; i < 70; i++) {
      const x = r() * 860, rad = 1 + r() * 1.7, t = 6 + r() * 6, d = -r() * 12, op = 0.5 + r() * 0.4;
      o += `<circle class="sn" style="--t:${t.toFixed(1)}s;--d:${d.toFixed(1)}s" cx="${x.toFixed(0)}" cy="0" r="${rad.toFixed(1)}" fill="#fff" fill-opacity="${op.toFixed(2)}"/>`;
    }
  } else if (kind === "cloud") {
    o += full("#8a96aa", ".16");
  }
  return o;
}

export function renderBanner({ kind = "clear", tod = "day" } = {}) {
  const font = (family, weight, file) =>
    `@font-face{font-family:${family};font-weight:${weight};src:url(${dataUri(asset(file), "font/woff2")}) format('woff2')}`;
  const photo = dataUri(asset("glory-box-strip.jpg"), "image/jpeg");
  return `${svgOpen(W, H, ' aria-label="Aras, Web developer, London"')}
<title>Aras</title>
<style>${font("N", 700, "outfit-700-aras.woff2")}${font("T", 500, "inter-500-banner.woff2")}${CSS}</style>
<defs>
<clipPath id="r"><rect width="${W}" height="${H}" rx="12"/></clipPath>
<radialGradient id="v" cx=".5" cy=".5" r=".75"><stop offset=".35" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".7"/></radialGradient>
<filter id="g" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="3" seed="4"><animate attributeName="seed" values="1;6;2;9;4;11;3;8;5;12;7;10" dur="1s" calcMode="discrete" repeatCount="indefinite"/></feTurbulence><feColorMatrix type="matrix" values=".33 .33 .33 0 0 .33 .33 .33 0 0 .33 .33 .33 0 0 0 0 0 1 0"/><feComponentTransfer><feFuncR type="linear" slope="2.4" intercept="-.7"/><feFuncG type="linear" slope="2.4" intercept="-.7"/><feFuncB type="linear" slope="2.4" intercept="-.7"/></feComponentTransfer></filter>
<filter id="g2" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".5" numOctaves="2" seed="21"/><feColorMatrix type="saturate" values="0"/></filter>
<filter id="bl" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="14"/></filter>
<linearGradient id="fg"><stop offset="0" stop-color="#e8edf3" stop-opacity="0"/><stop offset=".5" stop-color="#e8edf3" stop-opacity=".36"/><stop offset="1" stop-color="#e8edf3" stop-opacity="0"/></linearGradient>
</defs>
<g clip-path="url(#r)">
<g class="pan"><image width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice" href="${photo}"/></g>
${TINT[tod] ?? TINT.day}
<rect width="${W}" height="${H}" fill="url(#v)"/>
<rect width="${W}" height="${H}" filter="url(#g2)" opacity=".07" style="mix-blend-mode:overlay"/>
<rect width="${W}" height="${H}" filter="url(#g)" opacity=".26" style="mix-blend-mode:overlay"/>
${sky(kind)}
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="none" stroke="#fff" stroke-opacity=".14"/>
<text class="n u" x="459" y="116" font-size="84" letter-spacing="-2" fill="#fff">Aras</text>
<rect class="g" x="462" y="134" width="44" height="4" fill="${PURPLE}"/>
<text class="t u" style="animation-delay:.2s" x="462" y="178" font-size="22" fill="#fff">Web developer  ·  London</text>
</svg>
`;
}
