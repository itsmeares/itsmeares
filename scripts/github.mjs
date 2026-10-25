const QUERY = `query($login: String!) { user(login: $login) { contributionsCollection {
  totalCommitContributions totalPullRequestContributions totalIssueContributions
  contributionCalendar { totalContributions weeks { contributionDays { contributionCount date } } } } } }`;

export async function fetchGithub(login, token, f = fetch) {
  const headers = { Authorization: `Bearer ${token}`, "User-Agent": "itsmeares-profile" };
  const gql = await f("https://api.github.com/graphql", {
    method: "POST",
    headers,
    body: JSON.stringify({ query: QUERY, variables: { login } }),
  });
  const g = await gql.json();
  if (g.errors) throw new Error(`github graphql: ${g.errors[0].message}`);
  const c = g.data.user.contributionsCollection;

  const repos = await (await f(`https://api.github.com/users/${login}/repos?type=owner&per_page=100`, { headers })).json();
  if (!Array.isArray(repos)) throw new Error("github repos request failed");
  const bytes = {};
  for (const r of repos.filter((r) => !r.fork)) {
    const l = await (await f(r.languages_url, { headers })).json();
    for (const [k, v] of Object.entries(l)) bytes[k] = (bytes[k] ?? 0) + v;
  }
  const total = Object.values(bytes).reduce((a, b) => a + b, 0) || 1;
  const langs = Object.entries(bytes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, v]) => ({ name, share: v / total }));

  return {
    contributions: c.contributionCalendar.totalContributions,
    commits: c.totalCommitContributions,
    prs: c.totalPullRequestContributions,
    issues: c.totalIssueContributions,
    weeks: c.contributionCalendar.weeks.map((w) => w.contributionDays),
    langs,
  };
}

const LANG_COLORS = { TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572a5", Lua: "#000080", HTML: "#e34c26" };

export async function fetchProject(owner, repo, token, f = fetch) {
  const headers = { Authorization: `Bearer ${token}`, "User-Agent": "itsmeares-profile" };
  const api = (path) => f(`https://api.github.com/repos/${owner}/${repo}${path}`, { headers });
  const r = await (await api("")).json();
  if (!r.name) throw new Error(`github repo ${owner}/${repo} not found`);
  const rel = await api("/releases/latest");
  const tag = rel.ok ? (await rel.json()).tag_name : null;
  return {
    name: r.name,
    description: r.description ?? "",
    stars: r.stargazers_count,
    forks: r.forks_count,
    license: r.license?.spdx_id && r.license.spdx_id !== "NOASSERTION" ? r.license.spdx_id : null,
    language: r.language,
    languageColor: LANG_COLORS[r.language] ?? "#8b949e",
    release: tag,
    pulls: await fetchPulls(owner, repo, f),
  };
}

// The container download count is only shown on the package page, so it is read from there.
export async function fetchPulls(owner, repo, f = fetch) {
  try {
    const res = await f(`https://github.com/${owner}/${repo}/pkgs/container/${repo}`, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return null;
    const m = (await res.text()).match(/Total downloads<\/span>\s*<h3 title="(\d+)"/);
    return m ? compact(Number(m[1])) : null;
  } catch {
    return null;
  }
}

export function compact(n) {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 2 : 1).replace(/\.?0+$/, "")}K`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.?0+$/, "")}M`;
}
