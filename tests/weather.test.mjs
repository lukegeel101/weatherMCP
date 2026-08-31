import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAlertsUrl,
  buildPointsUrl,
  formatAlert,
  formatForecastPeriod,
  makeNWSRequest,
  normalizeStateCode,
} from "../build/weather.js";

test("state codes are normalized and validated", () => {
  assert.equal(normalizeStateCode(" ma "), "MA");
  assert.equal(buildAlertsUrl("ny"), "https://api.weather.gov/alerts?area=NY");
  assert.throws(() => normalizeStateCode("Massachusetts"), /two-letter/);
});

test("coordinates are rounded to the NWS grid endpoint format", () => {
  assert.equal(
    buildPointsUrl(42.360082, -71.05888),
    "https://api.weather.gov/points/42.3601,-71.0589",
  );
});

test("alerts are formatted with safe fallbacks", () => {
  assert.equal(
    formatAlert({ properties: { event: "Flood Warning", severity: "Severe" } }),
    [
      "Event: Flood Warning",
      "Area: Unknown",
      "Severity: Severe",
      "Status: Unknown",
      "Headline: No headline",
      "---",
    ].join("\n"),
  );
});

test("zero-degree forecasts remain valid values", () => {
  assert.match(
    formatForecastPeriod({ name: "Tonight", temperature: 0, temperatureUnit: "F" }),
    /Temperature: 0°F/,
  );
});

test("NWS requests send required headers and parse JSON", async () => {
  let captured;
  const response = await makeNWSRequest("https://api.weather.gov/example", async (...args) => {
    captured = args;
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });

  assert.deepEqual(response, { ok: true });
  assert.equal(captured[0], "https://api.weather.gov/example");
  assert.equal(captured[1].headers.Accept, "application/geo+json");
  assert.match(captured[1].headers["User-Agent"], /^weather-mcp-server\/1\.0/);
});

test("failed NWS responses return null", async () => {
  const originalError = console.error;
  console.error = () => {};
  try {
    const response = await makeNWSRequest(
      "https://api.weather.gov/example",
      async () => new Response("Unavailable", { status: 503 }),
    );
    assert.equal(response, null);
  } finally {
    console.error = originalError;
  }
});
