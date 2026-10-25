import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fetchSky } from "./weather.mjs";
import { fetchLastfm } from "./lastfm.mjs";
import { fetchGithub } from "./github.mjs";
import { renderBanner } from "./banner.mjs";
import { renderActivity } from "./activity.mjs";
import { renderGraph } from "./graph.mjs";

const out = process.argv[2] ?? "dist";
const user = process.env.PROFILE_USER ?? "itsmeares";
mkdirSync(out, { recursive: true });

const [sky, track, gh] = await Promise.allSettled([
  fetchSky(),
  fetchLastfm(user, process.env.LASTFM_API_KEY ?? ""),
  fetchGithub(user, process.env.GITHUB_TOKEN ?? ""),
]);

let written = 0;
const put = (name, svg) => {
  writeFileSync(join(out, name), svg);
  written++;
  console.log(`wrote ${name} (${svg.length} bytes)`);
};
const skip = (what, r) => console.warn(`skipped ${what}: ${r.reason?.message ?? r.reason}`);

if (sky.status === "fulfilled") put("banner.svg", renderBanner(sky.value));
else skip("banner", sky);

if (gh.status === "fulfilled") {
  for (const theme of ["dark", "light"]) put(`graph-${theme}.svg`, renderGraph({ theme, weeks: gh.value.weeks }));
} else skip("graph", gh);

if (track.status === "fulfilled" && gh.status === "fulfilled") {
  for (const theme of ["dark", "light"])
    put(`activity-${theme}.svg`, renderActivity({ theme, track: track.value, stats: gh.value }));
} else skip("activity", track.status === "rejected" ? track : gh);

if (written === 0) process.exit(1);
