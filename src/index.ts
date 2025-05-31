#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { handleListToolsRequest, handleCallToolRequest } from "./tools/google-sheets/index.js";

// サーバーの初期化
const server = new Server(
  {
    name: "google-sheets-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ツール一覧の取得
server.setRequestHandler(ListToolsRequestSchema, async (request) => {
  return await handleListToolsRequest(request);
});

// ツール実行の処理
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  return await handleCallToolRequest(request);
});

// サーバーの起動
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Google Sheets MCP Server started");
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
