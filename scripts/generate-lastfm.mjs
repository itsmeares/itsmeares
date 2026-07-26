import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const API_ROOT = "https://ws.audioscrobbler.com/2.0/";
const apiKey = process.env.LASTFM_API_KEY;
const username = process.env.LASTFM_USER ?? "itsmeares";
const outputDir = process.env.OUTPUT_DIR ?? "dist";
const outputPath = path.join(outputDir, "lastfm.svg");

if (!apiKey) {
  throw new Error("LASTFM_API_KEY is missing.");
}

const palette = {
  background: "#0d1117",
  panel: "#161b22",
  border: "#30363d",
  text: "#f0f6fc",
  muted: "#8b949e",
  purple: "#a78bfa",
  purpleStrong: "#8b5cf6",
  blue: "#60a5fa",
};

function escapeXml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function truncate(value, maxLength) {
  const text = String(value ?? "").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function imageUrl(images = []) {
  const candidates = [...images].reverse();
  return candidates.find((image) => image?.["#text"])?.["#text"] ?? "";
}

function fallbackCoverDataUri() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
      <rect width="320" height="320" rx="36" fill="${palette.panel}"/>
      <circle cx="160" cy="160" r="92" fill="${palette.background}" stroke="${palette.border}" stroke-width="6"/>
      <path d="M185 88v111.5a35 35 0 1 1-15-28.7V111l79-18v91.5a35 35 0 1 1-15-28.7V72z"
        fill="${palette.purple}"/>
    </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

async function fetchJson(method, params = {}) {
  const url = new URL(API_ROOT);
  url.search = new URLSearchParams({
    method,
    user: username,
    api_key: apiKey,
    format: "json",
    ...params,
  }).toString();

  const response = await fetch(url, {
    headers: {
      "User-Agent": "itsmeares-github-profile-lastfm-card/1.0",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`${method} returned HTTP ${response.status}.`);
  }

  const data = await response.json();
  if (data?.error) {
    throw new Error(`${method} failed: ${data.message ?? `Last.fm error ${data.error}`}`);
  }

  return data;
}

async function embedImage(url) {
  if (!url) return fallbackCoverDataUri();

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "itsmeares-github-profile-lastfm-card/1.0",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) return fallbackCoverDataUri();

    const contentType = response.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch {
    return fallbackCoverDataUri();
  }
}

function normaliseArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

const [recentResponse, tracksResponse, artistsResponse] = await Promise.all([
  fetchJson("user.getrecenttracks", { limit: "1", extended: "1" }),
  fetchJson("user.gettoptracks", { period: "7day", limit: "3" }),
  fetchJson("user.gettopartists", { period: "7day", limit: "3" }),
]);

const recentTrack = normaliseArray(recentResponse?.recenttracks?.track)[0];
if (!recentTrack) {
  throw new Error(`No recent tracks were returned for ${username}.`);
}

const topTracks = normaliseArray(tracksResponse?.toptracks?.track).slice(0, 3);
const topArtists = normaliseArray(artistsResponse?.topartists?.artist).slice(0, 3);

const nowPlaying = recentTrack?.["@attr"]?.nowplaying === "true";
const recentCover = await embedImage(imageUrl(recentTrack.image));

const topTrackCovers = await Promise.all(
  topTracks.map((track) => embedImage(imageUrl(track.image))),
);

const statusLabel = nowPlaying ? "NOW PLAYING" : "LAST PLAYED";
const playedAt = recentTrack?.date?.["#text"] ? ` · ${recentTrack.date["#text"]}` : "";

const width = 1000;
const height = 440;

const trackRows = topTracks
  .map((track, index) => {
    const y = 162 + index * 82;
    const artist = track?.artist?.name ?? track?.artist?.["#text"] ?? "Unknown artist";
    const playcount = track?.playcount ?? "0";
    const cover = topTrackCovers[index] ?? fallbackCoverDataUri();

    return `
      <image href="${cover}" x="405" y="${y - 35}" width="58" height="58"
        preserveAspectRatio="xMidYMid slice" clip-path="url(#small-cover-clip)"/>
      <text class="row-title" x="478" y="${y - 8}">${escapeXml(truncate(track?.name, 28))}</text>
      <text class="row-subtitle" x="478" y="${y + 16}">${escapeXml(truncate(artist, 28))}</text>
      <text class="playcount" x="650" y="${y + 16}" text-anchor="end">${escapeXml(playcount)} plays</text>`;
  })
  .join("");

const artistRows = topArtists
  .map((artist, index) => {
    const y = 154 + index * 82;
    const playcount = artist?.playcount ?? "0";

    return `
      <circle cx="725" cy="${y}" r="19" fill="${index === 0 ? palette.purpleStrong : palette.panel}"
        stroke="${palette.border}" stroke-width="1.5"/>
      <text class="rank" x="725" y="${y + 6}" text-anchor="middle">${index + 1}</text>
      <text class="artist-name" x="759" y="${y - 2}">${escapeXml(truncate(artist?.name, 21))}</text>
      <text class="artist-count" x="759" y="${y + 22}">${escapeXml(playcount)} plays</text>`;
  })
  .join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"
  viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">Last.fm listening activity for ${escapeXml(username)}</title>
  <desc id="desc">Current or last played track, top three tracks and top three artists from the last seven days.</desc>

  <defs>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${palette.purpleStrong}"/>
      <stop offset="55%" stop-color="${palette.purple}"/>
      <stop offset="100%" stop-color="${palette.blue}"/>
    </linearGradient>
    <clipPath id="cover-clip">
      <rect x="38" y="108" width="210" height="210" rx="18"/>
    </clipPath>
    <clipPath id="small-cover-clip">
      <rect x="405" y="0" width="58" height="58" rx="10"/>
    </clipPath>
    <style>
      text {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      }
      .heading { fill: ${palette.text}; font-size: 26px; font-weight: 700; }
      .eyebrow { fill: ${palette.purple}; font-size: 12px; font-weight: 700; letter-spacing: 1.6px; }
      .main-title { fill: ${palette.text}; font-size: 24px; font-weight: 700; }
      .main-artist { fill: ${palette.muted}; font-size: 17px; font-weight: 500; }
      .main-album { fill: ${palette.muted}; font-size: 14px; }
      .section-title { fill: ${palette.text}; font-size: 18px; font-weight: 700; }
      .row-title { fill: ${palette.text}; font-size: 15px; font-weight: 650; }
      .row-subtitle, .playcount, .artist-count { fill: ${palette.muted}; font-size: 12px; }
      .artist-name { fill: ${palette.text}; font-size: 15px; font-weight: 650; }
      .rank { fill: ${palette.text}; font-size: 14px; font-weight: 700; }
      .footer { fill: ${palette.muted}; font-size: 12px; }
    </style>
  </defs>

  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="20"
    fill="${palette.background}" stroke="${palette.border}" stroke-width="2"/>
  <rect x="0" y="0" width="${width}" height="5" rx="3" fill="url(#accent)"/>

  <text class="heading" x="36" y="53">On Repeat</text>
  <text class="footer" x="964" y="51" text-anchor="end">via Last.fm · last 7 days</text>

  <rect x="24" y="82" width="342" height="326" rx="18"
    fill="${palette.panel}" stroke="${palette.border}" stroke-width="1.5"/>
  <image href="${recentCover}" x="38" y="108" width="210" height="210"
    preserveAspectRatio="xMidYMid slice" clip-path="url(#cover-clip)"/>
  <rect x="38" y="108" width="210" height="210" rx="18"
    fill="none" stroke="${palette.border}" stroke-width="1.5"/>

  <text class="eyebrow" x="266" y="130">${statusLabel}</text>
  <text class="main-title" x="266" y="168">${escapeXml(truncate(recentTrack?.name, 15))}</text>
  <text class="main-artist" x="266" y="198">${escapeXml(truncate(recentTrack?.artist?.name ?? recentTrack?.artist?.["#text"], 18))}</text>
  <text class="main-album" x="266" y="226">${escapeXml(truncate(recentTrack?.album?.["#text"], 20))}</text>
  <circle cx="272" cy="268" r="4" fill="${nowPlaying ? "#3fb950" : palette.purple}"/>
  <text class="footer" x="284" y="272">${nowPlaying ? "scrobbling now" : `last scrobble${escapeXml(playedAt)}`}</text>

  <text class="section-title" x="405" y="103">Top Tracks</text>
  ${trackRows}

  <line x1="681" y1="94" x2="681" y2="388" stroke="${palette.border}" stroke-width="1"/>

  <text class="section-title" x="709" y="103">Top Artists</text>
  ${artistRows}

  <text class="footer" x="964" y="414" text-anchor="end">@${escapeXml(username)}</text>
</svg>`;

await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, svg, "utf8");
console.log(`Generated ${outputPath}`);
