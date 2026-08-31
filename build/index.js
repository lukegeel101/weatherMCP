#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { buildAlertsUrl, buildPointsUrl, formatAlert, formatForecastPeriod, makeNWSRequest, normalizeStateCode, } from "./weather.js";
const server = new McpServer({ name: "weather", version: "1.0.0" }, { capabilities: { resources: {}, tools: {} } });
server.registerTool("get-alerts", {
    description: "Get active National Weather Service alerts for a US state",
    inputSchema: {
        state: z
            .string()
            .trim()
            .regex(/^[A-Za-z]{2}$/)
            .describe("Two-letter US state or territory code, such as CA or NY"),
    },
    annotations: { readOnlyHint: true, openWorldHint: true },
}, async ({ state }) => {
    const stateCode = normalizeStateCode(state);
    const alertsData = await makeNWSRequest(buildAlertsUrl(stateCode));
    if (!alertsData) {
        return { content: [{ type: "text", text: "Failed to retrieve alerts data" }] };
    }
    const features = alertsData.features ?? [];
    if (features.length === 0) {
        return {
            content: [{ type: "text", text: `No active alerts for ${stateCode}` }],
        };
    }
    return {
        content: [
            {
                type: "text",
                text: `Active alerts for ${stateCode}:\n\n${features.map(formatAlert).join("\n")}`,
            },
        ],
    };
});
server.registerTool("get-forecast", {
    description: "Get a National Weather Service forecast for US coordinates",
    inputSchema: {
        latitude: z.number().min(-90).max(90).describe("Latitude of the location"),
        longitude: z.number().min(-180).max(180).describe("Longitude of the location"),
    },
    annotations: { readOnlyHint: true, openWorldHint: true },
}, async ({ latitude, longitude }) => {
    const pointsData = await makeNWSRequest(buildPointsUrl(latitude, longitude));
    if (!pointsData) {
        return {
            content: [
                {
                    type: "text",
                    text: `Failed to retrieve grid point data for coordinates: ${latitude}, ${longitude}. The NWS API supports US locations only.`,
                },
            ],
        };
    }
    const forecastUrl = pointsData.properties?.forecast;
    if (!forecastUrl) {
        return {
            content: [
                { type: "text", text: "Failed to get forecast URL from grid point data" },
            ],
        };
    }
    const forecastData = await makeNWSRequest(forecastUrl);
    if (!forecastData) {
        return {
            content: [{ type: "text", text: "Failed to retrieve forecast data" }],
        };
    }
    const periods = forecastData.properties?.periods ?? [];
    if (periods.length === 0) {
        return {
            content: [{ type: "text", text: "No forecast periods available" }],
        };
    }
    return {
        content: [
            {
                type: "text",
                text: `Forecast for ${latitude}, ${longitude}:\n\n${periods.map(formatForecastPeriod).join("\n")}`,
            },
        ],
    };
});
async function main() {
    await server.connect(new StdioServerTransport());
    console.error("Weather MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
