import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { TOOL_DEFINITIONS } from "./tool-definitions.js";
import { SheetsClient } from "./client.js";

export class GoogleSheetsTools {
  private sheetsClient: SheetsClient | null = null;

  constructor(private readonly SheetsClientClass = SheetsClient) {}

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
        "Google Sheets認証が必要です。認証情報を設定してください。"
      );
    }
    throw error;
  }

  async handleListTools(request: typeof ListToolsRequestSchema._type) {
    return TOOL_DEFINITIONS;
  }

  async handleCallTool(request: typeof CallToolRequestSchema._type) {
    try {
      const client = await this.getSheetsClient();

      switch (request.params.name) {
        case "get_spreadsheet_info": {
          try {
            const args = request.params.arguments as { spreadsheetId: string };
            const info = await client.getSpreadsheetInfo(args.spreadsheetId);
            
            return {
              content: [
                {
                  type: "text",
                  text: `スプレッドシート情報:\n${JSON.stringify(info, null, 2)}`,
                },
              ],
            };
          } catch (error) {
            return this.handleAuthError(error);
          }
        }

        case "get_sheet_data": {
          try {
            const args = request.params.arguments as {
              spreadsheetId: string;
              range: string;
              valueRenderOption?: string;
            };
            const values = await client.getSheetData(
              args.spreadsheetId,
              args.range,
              args.valueRenderOption
            );
            const formattedData = client.formatSheetData(values);
            
            return {
              content: [
                {
                  type: "text",
                  text: `シートデータ (${args.range}):\n${formattedData}`,
                },
              ],
            };
          } catch (error) {
            return this.handleAuthError(error);
          }
        }

        case "update_sheet_data": {
          try {
            const args = request.params.arguments as {
              spreadsheetId: string;
              range: string;
              values: string[][];
              valueInputOption?: string;
            };
            const response = await client.updateSheetData(
              args.spreadsheetId,
              args.range,
              args.values,
              args.valueInputOption
            );
            
            return {
              content: [
                {
                  type: "text",
                  text: `データを更新しました: ${args.range}\n更新されたセル数: ${response.updatedCells}`,
                },
              ],
            };
          } catch (error) {
            return this.handleAuthError(error);
          }
        }

        case "append_sheet_data": {
          try {
            const args = request.params.arguments as {
              spreadsheetId: string;
              range: string;
              values: string[][];
              valueInputOption?: string;
              insertDataOption?: string;
            };
            const response = await client.appendSheetData(
              args.spreadsheetId,
              args.range,
              args.values,
              args.valueInputOption,
              args.insertDataOption
            );
            
            return {
              content: [
                {
                  type: "text",
                  text: `データを追加しました: ${args.range}\n更新されたセル数: ${response.updates?.updatedCells}`,
                },
              ],
            };
          } catch (error) {
            return this.handleAuthError(error);
          }
        }

        case "clear_sheet_data": {
          try {
            const args = request.params.arguments as {
              spreadsheetId: string;
              range: string;
            };
            await client.clearSheetData(args.spreadsheetId, args.range);
            
            return {
              content: [
                {
                  type: "text",
                  text: `データをクリアしました: ${args.range}`,
                },
              ],
            };
          } catch (error) {
            return this.handleAuthError(error);
          }
        }

        case "create_sheet": {
          try {
            const args = request.params.arguments as {
              spreadsheetId: string;
              title: string;
              rowCount?: number;
              columnCount?: number;
            };
            const newSheet = await client.createSheet(
              args.spreadsheetId,
              args.title,
              args.rowCount,
              args.columnCount
            );
            
            return {
              content: [
                {
                  type: "text",
                  text: `新しいシートを作成しました: ${args.title}\nシートID: ${newSheet?.properties?.sheetId}`,
                },
              ],
            };
          } catch (error) {
            return this.handleAuthError(error);
          }
        }

        case "delete_sheet": {
          try {
            const args = request.params.arguments as {
              spreadsheetId: string;
              sheetId: number;
            };
            await client.deleteSheet(args.spreadsheetId, args.sheetId);
            
            return {
              content: [
                {
                  type: "text",
                  text: `シートを削除しました: シートID ${args.sheetId}`,
                },
              ],
            };
          } catch (error) {
            return this.handleAuthError(error);
          }
        }

        case "search_spreadsheets": {
          try {
            const args = request.params.arguments as {
              query: string;
              maxResults?: number;
            };
            const results = await client.searchSpreadsheets(
              args.query,
              args.maxResults
            );
            
            return {
              content: [
                {
                  type: "text",
                  text: `検索結果 (${args.query}):\n${JSON.stringify(results, null, 2)}`,
                },
              ],
            };
          } catch (error) {
            return this.handleAuthError(error);
          }
        }

        default:
          throw new McpError(ErrorCode.MethodNotFound, `不明なツール: ${request.params.name}`);
      }
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `エラー: ${errorMessage}`,
          },
        ],
      };
    }
  }
}
