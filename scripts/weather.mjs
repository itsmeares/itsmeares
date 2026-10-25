const MIN = 60_000;

export function skyKind(code) {
  if (code === 0 || code === 1) return "clear";
  if (code === 2 || code === 3) return "cloud";
  if (code === 45 || code === 48) return "fog";
  if ([65, 66, 67, 82].includes(code)) return "heavy";
  if ([51, 53, 55, 56, 57, 61, 63, 80, 81].includes(code)) return "rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "storm";
  return "cloud";
}

// Inputs are local London times like "2026-10-25T13:30"; they are compared as plain numbers.
export function timeOfDay(now, sunrise, sunset) {
  const t = (s) => Date.parse(`${s}Z`);
  const n = t(now), sr = t(sunrise), ss = t(sunset);
  if (n < sr - 30 * MIN || n > ss + 30 * MIN) return "night";
  if (n < sr + 60 * MIN || n > ss - 60 * MIN) return "golden";
  return "day";
}

export async function fetchSky(f = fetch) {
  const url =
    "https://api.open-meteo.com/v1/forecast?latitude=51.5072&longitude=-0.1276" +
    "&current=weather_code&daily=sunrise,sunset&timezone=Europe%2FLondon&forecast_days=1";
  const res = await f(url);
  if (!res.ok) throw new Error(`weather ${res.status}`);
  const j = await res.json();
  return {
    kind: skyKind(j.current.weather_code),
    tod: timeOfDay(j.current.time, j.daily.sunrise[0], j.daily.sunset[0]),
  };
}
