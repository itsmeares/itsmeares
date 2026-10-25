const NO_ART = "2a96cbd8b46e442fc41c2b86b821562f";
const MAX_COVER_BYTES = 400_000;

export function ago(uts, nowMs = Date.now()) {
  const m = Math.max(1, Math.round((nowMs - uts * 1000) / 60_000));
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} ${h === 1 ? "hour" : "hours"} ago`;
  const d = Math.round(h / 24);
  return `${d} days ago`;
}

export async function fetchLastfm(user, key, f = fetch) {
  const url =
    "https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&limit=1&format=json" +
    `&user=${encodeURIComponent(user)}&api_key=${encodeURIComponent(key)}`;
  const res = await f(url);
  const j = await res.json();
  if (j.error) throw new Error(`last.fm ${j.error}: ${j.message}`);
  const list = j.recenttracks.track;
  const t = Array.isArray(list) ? list[0] : list;
  if (!t) throw new Error("last.fm returned no tracks");
  const nowPlaying = t["@attr"]?.nowplaying === "true";
  const art = [...(t.image ?? [])].reverse().find((i) => i["#text"] && !i["#text"].includes(NO_ART));
  return {
    name: t.name,
    artist: t.artist["#text"],
    album: t.album["#text"],
    nowPlaying,
    ago: nowPlaying ? "" : ago(Number(t.date.uts)),
    cover: art ? await fetchCover(art["#text"], f) : null,
  };
}

async function fetchCover(url, f) {
  try {
    const res = await f(url);
    if (!res.ok) return null;
    const mime = res.headers.get("content-type")?.split(";")[0] ?? "";
    if (!["image/jpeg", "image/png"].includes(mime)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length <= MAX_COVER_BYTES ? { mime, buf } : null;
  } catch {
    return null;
  }
}
