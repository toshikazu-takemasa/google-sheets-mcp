// ツール定義を分離（認証不要な部分）
export const TOOL_DEFINITIONS = {
  tools: [
    {
      name: "google_sheets_auth_setup",
      description: "Google Sheets認証のセットアップを行います。認証エラーが発生した場合に実行してください。",
      inputSchema: {
        type: "object",
        properties: {}
      }
    },
    {
      name: "sheets_list",
      description: "スプレッドシート内の全シート情報を取得",
      inputSchema: {
        type: "object",
        properties: {
          doc_id: {
            type: "string",
            description: "スプレッドシートのID",
          },
        },
        required: ["doc_id"],
      },
    },
    {
      name: "sheets_read_range",
      description: "スプレッドシートの指定範囲のデータを読み取り",
      inputSchema: {
        type: "object",
        properties: {
          doc_id: {
            type: "string",
            description: "スプレッドシートのID",
          },
          sheet_name: {
            type: "string",
            description: "シート名（オプション）",
          },
          range: {
            type: "string",
            description: "読み取り範囲（例：A1:D10）",
          },
          row_limit: {
            type: "number",
            description: "取得する最大行数",
            default: 100,
            maximum: 1000,
          },
        },
        required: ["doc_id", "range"],
      },
    },
    {
      name: "sheets_write_range",
      description: "スプレッドシートの指定位置にデータを書き込み",
      inputSchema: {
        type: "object",
        properties: {
          doc_id: {
            type: "string",
            description: "スプレッドシートのID",
          },
          sheet_name: {
            type: "string",
            description: "シート名（オプション）",
          },
          start_position: {
            oneOf: [
              {
                type: "string",
                description: "書き込み開始位置（A1形式、例：A1）",
              },
              {
                type: "object",
                properties: {
                  row: {
                    type: "number",
                    description: "開始行（0始まり）",
                  },
                  col: {
                    type: "number",
                    description: "開始列（0始まり）",
                  },
                },
                required: ["row", "col"],
              },
            ],
          },
          values: {
            type: "array",
            items: {
              type: "array",
              items: {
                oneOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }],
              },
            },
            description: "書き込むデータ（2次元配列）",
          },
        },
        required: ["doc_id", "start_position", "values"],
      },
    },
    {
      name: "sheets_create_sheet",
      description: "既存のスプレッドシートに新しいシートを作成",
      inputSchema: {
        type: "object",
        properties: {
          doc_id: {
            type: "string",
            description: "スプレッドシートのID",
          },
          title: {
            type: "string",
            description: "新しいシートの名前",
          },
          rows: {
            type: "number",
            description: "行数（オプション、デフォルト: 1000）",
            default: 1000,
          },
          cols: {
            type: "number",
            description: "列数（オプション、デフォルト: 26）",
            default: 26,
          },
        },
        required: ["doc_id", "title"],
      },
    },
    {
      name: "sheets_create_spreadsheet",
      description: "新規スプレッドシートを作成",
      inputSchema: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "スプレッドシートのタイトル",
          },
          folder_id: {
            type: "string",
            description:
              "作成先フォルダのID（オプション、GOOGLE_DRIVE_DEFAULT_FOLDER_IDが設定されている場合はそちらが使用されます）",
          },
          sheets: {
            type: "array",
            description: "作成するシートの設定（オプション、指定しない場合は'Sheet1'という名前のシートが作成されます）",
            items: {
              type: "object",
              properties: {
                title: { type: "string", description: "シート名" },
                rows: { type: "number", description: "行数（オプション）" },
                cols: { type: "number", description: "列数（オプション）" },
              },
              required: ["title"],
            },
          },
        },
        required: ["title"],
      },
    },
  ],
};
