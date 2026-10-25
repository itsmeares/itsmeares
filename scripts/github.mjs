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
