import { SheetsClient } from "./client.js";
import { ReadRangeParams, WriteRangeParams } from "./types.js";
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from "@modelcontextprotocol/sdk/types.js";
import { TOOL_DEFINITIONS } from "./tool-definitions.js";
import { AuthenticationManager } from "./auth-manager.js";

export class GoogleSheetsTools {
  private sheetsClient: SheetsClient | null = null;

  constructor(
    private readonly SheetsClientClass = SheetsClient,
  ) {}

  private async getSheetsClient(): Promise<SheetsClient> {
    if (!this.sheetsClient) {
      this.sheetsClient = new this.SheetsClientClass();
    }
    return this.sheetsClient;
  }

  private handleAuthError(error: unknown): never {
    if (error instanceof Error && error.message.includes("No refresh token found")) {
      throw new McpError(
        ErrorCode.InternalError,
        "Google Sheets認証が必要です。google_sheets_auth_setupツールを実行してください。"
      );
    }
    throw error;
  }

  async handleCallTool(request: typeof CallToolRequestSchema._type) {
    try {
      switch (request.params.name) {
        case "google_sheets_auth_setup": {
          const authManager = new AuthenticationManager([
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive.file",
          ]);
          const result = await authManager.startAuthServer();
          const response = {
            content: [
              {
                type: "text",
                text: result,
              },
            ],
          };
          return response;
        }

        case "sheets_list": {
          try {
            const client = await this.getSheetsClient();
            const args = request.params.arguments as Record<string, unknown>;
            const result = await client.listSheets({
              spreadsheetId: args.doc_id as string,
            });
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          } catch (error) {
            return this.handleAuthError(error);
          }
        }

        case "sheets_read_range": {
          try {
            const client = await this.getSheetsClient();
            const args = request.params.arguments as Record<string, unknown>;
            const params: ReadRangeParams = {
              spreadsheetId: args.doc_id as string,
              range: args.range as string,
              sheetName: args.sheet_name as string | undefined,
              rowLimit: args.row_limit as number | undefined,
            };
            const result = await client.readRange(params);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          } catch (error) {
            return this.handleAuthError(error);
          }
        }

        case "sheets_write_range": {
          try {
            const client = await this.getSheetsClient();
            const args = request.params.arguments as Record<string, unknown>;
            const params: WriteRangeParams = {
              spreadsheetId: args.doc_id as string,
              startPosition: args.start_position as string | { row: number; col: number },
              values: args.values as Array<Array<string | number | boolean>>,
              sheetName: args.sheet_name as string | undefined,
            };
            await client.writeRange(params);
            return {
              content: [{ type: "text", text: "データの書き込みが完了しました" }],
            };
          } catch (error) {
            return this.handleAuthError(error);
          }
        }

        case "sheets_create_sheet": {
          try {
            const client = await this.getSheetsClient();
            const args = request.params.arguments as Record<string, unknown>;
            const result = await client.createSheet({
              spreadsheetId: args.doc_id as string,
              title: args.title as string,
              rows: args.rows as number | undefined,
              cols: args.cols as number | undefined,
            });
            return {
              content: [
                {
                  type: "text",
                  text: `新しいシート「${result.title}」を作成しました。シートID: ${result.sheetId}`,
                },
              ],
            };
          } catch (error) {
            return this.handleAuthError(error);
          }
        }

        case "sheets_create_spreadsheet": {
          try {
            const client = await this.getSheetsClient();
            const args = request.params.arguments as Record<string, unknown>;
            const spreadsheetId = await client.createSpreadsheet({
              title: args.title as string,
              folderId: args.folder_id as string | undefined,
              sheets: args.sheets as Array<{ title: string; rows?: number; cols?: number }> | undefined,
            });
            return {
              content: [
                {
                  type: "text",
                  text: `スプレッドシートを作成しました: https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
                },
              ],
            };
          } catch (error) {
            return this.handleAuthError(error);
          }
        }

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
      }
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      this.handleAuthError(error);
    }
  }
}

// シングルトンインスタンスを管理
let tools: GoogleSheetsTools | null = null;

// ツール一覧を返す関数（認証不要）
export async function handleListTools() {
  return TOOL_DEFINITIONS;
}

export function handleListToolsRequest(request: typeof ListToolsRequestSchema._type) {
  return handleListTools();
}

// 認証が必要な操作を行う関数
export async function handleCallTool(request: typeof CallToolRequestSchema._type) {
  if (!tools) {
    tools = new GoogleSheetsTools();
  }
  return tools.handleCallTool(request);
}

export function handleCallToolRequest(request: typeof CallToolRequestSchema._type) {
  return handleCallTool(request);
}

// ツール定義をエクスポート（テスト用）
export { TOOL_DEFINITIONS } from "./tool-definitions.js";

// 後方互換性のためのエクスポート
export { SheetsClient } from "./client.js";
export * from "./types.js";
export * from "./utils.js";
