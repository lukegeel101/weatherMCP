import assert from "node:assert/strict";
import test from "node:test";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

test("stdio server advertises the forecast and alert tools", async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["build/index.js"],
    stderr: "pipe",
  });
  const client = new Client({ name: "weather-mcp-test", version: "1.0.0" });

  try {
    await client.connect(transport);
    const response = await client.listTools();
    const tools = new Map(response.tools.map((tool) => [tool.name, tool]));

    assert.deepEqual([...tools.keys()].sort(), ["get-alerts", "get-forecast"]);
    assert.deepEqual(tools.get("get-alerts").inputSchema.required, ["state"]);
    assert.deepEqual(tools.get("get-forecast").inputSchema.required.sort(), [
      "latitude",
      "longitude",
    ]);
  } finally {
    await client.close();
  }
});
