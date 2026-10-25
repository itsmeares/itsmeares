import test from "node:test";
import assert from "node:assert/strict";
import { skyKind, timeOfDay } from "../scripts/weather.mjs";
import { ago, fetchLastfm } from "../scripts/lastfm.mjs";
import { fetchGithub } from "../scripts/github.mjs";
import { fitText, fitTitle } from "../scripts/util.mjs";
import { renderBanner } from "../scripts/banner.mjs";
import { renderActivity } from "../scripts/activity.mjs";
import { renderGraph, monthLabels } from "../scripts/graph.mjs";

const day = (date, n) => ({ date, contributionCount: n });
const weeks = Array.from({ length: 53 }, (_, w) =>
  Array.from({ length: 7 }, (_, d) => day(`2026-${String(1 + Math.floor(w / 5)).padStart(2, "0")}-0${d + 1}`, (w * d) % 11)),
);
const stats = {
  contributions: 3595, commits: 1112, prs: 357, issues: 66,
  langs: [{ name: "TypeScript", share: 0.92 }, { name: "JavaScript", share: 0.03 }],
};
const track = { name: "Teardrop", artist: "Massive Attack", album: "Mezzanine", nowPlaying: true, ago: "", cover: null };
const clean = (svg) => assert.doesNotMatch(svg, /NaN|undefined|\[object/);

test("weather codes map to a sky", () => {
  assert.equal(skyKind(1), "clear");
  assert.equal(skyKind(3), "cloud");
  assert.equal(skyKind(45), "fog");
  assert.equal(skyKind(63), "rain");
  assert.equal(skyKind(65), "heavy");
  assert.equal(skyKind(73), "snow");
  assert.equal(skyKind(95), "storm");
});

test("time of day follows sunrise and sunset", () => {
  const sr = "2026-10-25T06:41", ss = "2026-10-25T16:46";
  assert.equal(timeOfDay("2026-10-25T13:30", sr, ss), "day");
  assert.equal(timeOfDay("2026-10-25T16:00", sr, ss), "golden");
  assert.equal(timeOfDay("2026-10-25T07:10", sr, ss), "golden");
  assert.equal(timeOfDay("2026-10-25T22:00", sr, ss), "night");
  assert.equal(timeOfDay("2026-10-25T03:00", sr, ss), "night");
});

test("text is shrunk, then cut with an ellipsis", () => {
  assert.deepEqual(fitText("Teardrop", 190, 34, 20, 0.55), { text: "Teardrop", size: 34 });
  const mid = fitText("Weird Fishes / Arpeggi", 190, 34, 20, 0.55);
  assert.ok(mid.size < 34 && mid.size >= 20);
  const long = fitText("An extremely long track title that cannot possibly fit", 190, 34, 20, 0.55);
  assert.equal(long.size, 20);
  assert.ok(long.text.endsWith("…") && long.text.length < 20);
});

test("a long title loses its bracket part before it is cut", () => {
  const t = fitTitle("Street Spirit (Fade Out)", 190, 34, 20, 0.55);
  assert.equal(t.text, "Street Spirit");
  assert.ok(t.size >= 20);
  assert.equal(fitTitle("Teardrop", 190, 34, 20, 0.55).text, "Teardrop");
  assert.ok(fitTitle("Nothing to remove but far too long to fit here", 190, 34, 20, 0.55).text.endsWith("…"));
});

test("time since a play is readable", () => {
  const now = 1_000_000 * 1000;
  assert.equal(ago(1_000_000 - 120, now), "2 min ago");
  assert.equal(ago(1_000_000 - 3600, now), "1 hour ago");
  assert.equal(ago(1_000_000 - 7200, now), "2 hours ago");
  assert.equal(ago(1_000_000 - 86400 * 3, now), "3 days ago");
});

const lastfmFetch = (track) => async (url) => {
  if (url.includes("audioscrobbler")) return { json: async () => ({ recenttracks: { track: [track] } }) };
  return { ok: true, headers: { get: () => "image/jpeg" }, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer };
};

test("last.fm: a playing track and a cover", async () => {
  const t = await fetchLastfm("u", "k", lastfmFetch({
    name: "Teardrop", artist: { "#text": "Massive Attack" }, album: { "#text": "Mezzanine" },
    image: [{ "#text": "https://x/small.jpg" }, { "#text": "https://x/big.jpg" }], "@attr": { nowplaying: "true" },
  }));
  assert.equal(t.nowPlaying, true);
  assert.equal(t.artist, "Massive Attack");
  assert.equal(t.cover.mime, "image/jpeg");
});

test("last.fm: a finished track with no real cover", async () => {
  const t = await fetchLastfm("u", "k", lastfmFetch({
    name: "Roads", artist: { "#text": "Portishead" }, album: { "#text": "" },
    image: [{ "#text": "https://x/2a96cbd8b46e442fc41c2b86b821562f.png" }], date: { uts: String(Math.floor(Date.now() / 1000) - 7200) },
  }));
  assert.equal(t.nowPlaying, false);
  assert.equal(t.ago, "2 hours ago");
  assert.equal(t.cover, null);
});

test("last.fm: an API error is thrown", async () => {
  await assert.rejects(fetchLastfm("u", "bad", async () => ({ json: async () => ({ error: 10, message: "Invalid API key" }) })), /Invalid API key/);
});

test("github: totals and language shares", async () => {
  const f = async (url, opts) => {
    if (url.endsWith("/graphql"))
      return { json: async () => ({ data: { user: { contributionsCollection: {
        totalCommitContributions: 5, totalPullRequestContributions: 2, totalIssueContributions: 1,
        contributionCalendar: { totalContributions: 9, weeks: [{ contributionDays: [day("2026-01-01", 1)] }] } } } } }) };
    if (url.includes("/repos")) return { json: async () => [{ fork: false, languages_url: "https://a/l" }, { fork: true, languages_url: "https://a/f" }] };
    return { json: async () => ({ TypeScript: 90, CSS: 10 }) };
  };
  const g = await fetchGithub("u", "t", f);
  assert.equal(g.contributions, 9);
  assert.equal(g.langs[0].name, "TypeScript");
  assert.equal(g.langs[0].share, 0.9);
});

test("banner renders every sky and time of day", () => {
  for (const kind of ["clear", "cloud", "rain", "heavy", "storm", "fog", "snow"])
    for (const tod of ["day", "golden", "night"]) {
      const s = renderBanner({ kind, tod });
      clean(s);
      assert.match(s, /Aras/);
      assert.ok(s.length < 150_000);
    }
});

test("activity renders playing and idle, dark and light", () => {
  for (const theme of ["dark", "light"]) {
    const on = renderActivity({ theme, track, stats });
    clean(on);
    assert.match(on, /NOW PLAYING/);
    assert.match(on, /Teardrop/);
    assert.match(on, /3,595/);
    const off = renderActivity({ theme, track: { ...track, nowPlaying: false, ago: "2 hours ago" }, stats });
    assert.match(off, /LAST PLAYED/);
    assert.match(off, /2 hours ago/);
    assert.doesNotMatch(off, /class="arm"/);
  }
});

test("every text in the activity and graph files has a sans font", () => {
  for (const svg of [renderActivity({ theme: "dark", track, stats }), renderGraph({ theme: "dark", weeks })])
    assert.match(svg, /text\{font-family:-apple-system/);
});

test("activity escapes track text", () => {
  const s = renderActivity({ theme: "dark", track: { ...track, name: "A & B <3" }, stats });
  assert.match(s, /A &amp; B &lt;3/);
});

test("graph draws every day and avoids touching month labels", () => {
  const s = renderGraph({ theme: "dark", weeks });
  clean(s);
  assert.equal(s.match(/class="q"/g).length, 53 * 7);
  const labels = monthLabels(weeks);
  for (let i = 1; i < labels.length; i++) assert.ok(labels[i].week - labels[i - 1].week >= 3);
});
