import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const TOOL_DEFINITIONS: { tools: Tool[] } = {
  tools: [
    {
      name: "get_spreadsheet_info",
      description: "スプレッドシートの基本情報を取得します",
      inputSchema: {
        type: "object",
        properties: {
          spreadsheetId: {
            type: "string",
            description: "スプレッドシートのID",
          },
        },
        required: ["spreadsheetId"],
      },
    },
    {
      name: "get_sheet_data",
      description: "指定したシートのデータを取得します",
      inputSchema: {
        type: "object",
        properties: {
          spreadsheetId: {
            type: "string",
            description: "スプレッドシートのID",
          },
          range: {
            type: "string",
            description: "取得する範囲（例: 'Sheet1!A1:C10' または 'Sheet1'）",
          },
          valueRenderOption: {
            type: "string",
            description: "値の表示形式（FORMATTED_VALUE, UNFORMATTED_VALUE, FORMULA）",
            default: "FORMATTED_VALUE",
          },
        },
        required: ["spreadsheetId", "range"],
      },
    },
    {
      name: "update_sheet_data",
      description: "指定したシートのデータを更新します",
      inputSchema: {
        type: "object",
        properties: {
          spreadsheetId: {
            type: "string",
            description: "スプレッドシートのID",
          },
          range: {
            type: "string",
            description: "更新する範囲（例: 'Sheet1!A1:C3'）",
          },
          values: {
            type: "array",
            description: "更新するデータ（2次元配列）",
            items: {
              type: "array",
              items: {
                type: "string"
              }
            }
          },
          valueInputOption: {
            type: "string",
            description: "入力値の解釈方法（RAW, USER_ENTERED）",
            default: "USER_ENTERED",
          },
        },
        required: ["spreadsheetId", "range", "values"],
      },
    },
    {
      name: "append_sheet_data",
      description: "シートにデータを追加します",
      inputSchema: {
        type: "object",
        properties: {
          spreadsheetId: {
            type: "string",
            description: "スプレッドシートのID",
          },
          range: {
            type: "string",
            description: "追加する範囲（例: 'Sheet1!A:C'）",
          },
          values: {
            type: "array",
            description: "追加するデータ（2次元配列）",
            items: {
              type: "array",
              items: {
                type: "string"
              }
            }
          },
          valueInputOption: {
            type: "string",
            description: "入力値の解釈方法（RAW, USER_ENTERED）",
            default: "USER_ENTERED",
          },
          insertDataOption: {
            type: "string",
            description: "データの挿入方法（OVERWRITE, INSERT_ROWS）",
            default: "INSERT_ROWS",
          },
        },
        required: ["spreadsheetId", "range", "values"],
      },
    },
    {
      name: "clear_sheet_data",
      description: "指定した範囲のデータをクリアします",
      inputSchema: {
        type: "object",
        properties: {
          spreadsheetId: {
            type: "string",
            description: "スプレッドシートのID",
          },
          range: {
            type: "string",
            description: "クリアする範囲（例: 'Sheet1!A1:C10'）",
          },
        },
        required: ["spreadsheetId", "range"],
      },
    },
    {
      name: "create_sheet",
      description: "新しいシートを作成します",
      inputSchema: {
        type: "object",
        properties: {
          spreadsheetId: {
            type: "string",
            description: "スプレッドシートのID",
          },
          title: {
            type: "string",
            description: "新しいシートのタイトル",
          },
          rowCount: {
            type: "number",
            description: "行数（デフォルト: 1000）",
            default: 1000,
          },
          columnCount: {
            type: "number",
            description: "列数（デフォルト: 26）",
            default: 26,
          },
        },
        required: ["spreadsheetId", "title"],
      },
    },
    {
      name: "delete_sheet",
      description: "シートを削除します",
      inputSchema: {
        type: "object",
        properties: {
          spreadsheetId: {
            type: "string",
            description: "スプレッドシートのID",
          },
          sheetId: {
            type: "number",
            description: "削除するシートのID",
          },
        },
        required: ["spreadsheetId", "sheetId"],
      },
    },
    {
      name: "search_spreadsheets",
      description: "Google Driveでスプレッドシートを検索します",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "検索クエリ（ファイル名など）",
          },
          maxResults: {
            type: "number",
            description: "最大結果数（デフォルト: 10）",
            default: 10,
          },
        },
        required: ["query"],
      },
    },
  ],
};
