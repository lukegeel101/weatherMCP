export const NWS_API_BASE = "https://api.weather.gov";
export const USER_AGENT = "weather-mcp-server/1.0 (+https://github.com/lukegeel101/weatherMCP)";
export function normalizeStateCode(state) {
    const stateCode = state.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(stateCode)) {
        throw new Error("State must be a two-letter US state or territory code");
    }
    return stateCode;
}
export function buildAlertsUrl(state) {
    return `${NWS_API_BASE}/alerts?area=${normalizeStateCode(state)}`;
}
export function buildPointsUrl(latitude, longitude) {
    return `${NWS_API_BASE}/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`;
}
export async function makeNWSRequest(url, fetchImplementation = fetch) {
    try {
        const response = await fetchImplementation(url, {
            headers: {
                "User-Agent": USER_AGENT,
                Accept: "application/geo+json",
            },
        });
        if (!response.ok) {
            throw new Error(`NWS request failed with status ${response.status}`);
        }
        return (await response.json());
    }
    catch (error) {
        console.error("Error making NWS request:", error);
        return null;
    }
}
export function formatAlert(feature) {
    const props = feature.properties;
    return [
        `Event: ${props.event ?? "Unknown"}`,
        `Area: ${props.areaDesc ?? "Unknown"}`,
        `Severity: ${props.severity ?? "Unknown"}`,
        `Status: ${props.status ?? "Unknown"}`,
        `Headline: ${props.headline ?? "No headline"}`,
        "---",
    ].join("\n");
}
export function formatForecastPeriod(period) {
    return [
        `${period.name ?? "Unknown"}:`,
        `Temperature: ${period.temperature ?? "Unknown"}°${period.temperatureUnit ?? "F"}`,
        `Wind: ${period.windSpeed ?? "Unknown"} ${period.windDirection ?? ""}`.trimEnd(),
        period.shortForecast ?? "No forecast available",
        "---",
    ].join("\n");
}
