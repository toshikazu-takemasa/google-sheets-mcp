// セルの値の型
export type CellValue = string | number | boolean;

// シート情報
export interface SheetInfo {
  title: string;
  sheetId: number;
  rowCount: number;
  columnCount: number;
  index: number;
}

// スプレッドシート内のシート一覧取得パラメータ
export interface ListSheetsParams {
  spreadsheetId: string;
}

// 範囲読み取りパラメータ
export interface ReadRangeParams {
  spreadsheetId: string;
  range: string;
  sheetName?: string;
  rowLimit?: number;
}

// 範囲書き込みパラメータ
export interface WriteRangeParams {
  spreadsheetId: string;
  startPosition: string | { row: number; col: number };
  values: CellValue[][];
  sheetName?: string;
}

// シート作成パラメータ
export interface CreateSheetParams {
  spreadsheetId: string;
  title: string;
  rows?: number;
  cols?: number;
}

// スプレッドシート作成パラメータ
export interface CreateSpreadsheetParams {
  title: string;
  folderId?: string;
  sheets?: Array<{
    title: string;
    rows?: number;
    cols?: number;
  }>;
}

// シート拡張パラメータ（内部使用）
export interface ExpandSheetParams {
  spreadsheetId: string;
  sheetId: number;
  requiredRows: number;
  requiredCols: number;
}

// エラーメッセージ
export const ERROR_MESSAGES = {
  SPREADSHEET_NOT_FOUND: (id: string) => `スプレッドシートが見つかりません: ${id}`,
  SHEET_NOT_FOUND: (name: string) => `シートが見つかりません: ${name}`,
  PERMISSION_DENIED: "アクセス権限がありません。スプレッドシートの共有設定を確認してください。",
  ROW_LIMIT_EXCEEDED: (limit: number) => `行数制限を超えています。最大${limit}行まで取得可能です。`,
  SHEET_SIZE_LIMIT: (maxRows: number, maxCols: number) => 
    `シートサイズの制限を超えています。最大${maxRows}行、${maxCols}列まで対応しています。`,
  FOLDER_NOT_FOUND: (id: string) => `フォルダが見つかりません: ${id}`,
};

// 制限値
export const LIMITS = {
  DEFAULT_ROW_LIMIT: 100,
  MAX_ROW_LIMIT: 1000,
  DEFAULT_NEW_SHEET_ROWS: 1000,
  DEFAULT_NEW_SHEET_COLS: 26,
  MAX_SHEET_ROWS: 10000,
  MAX_SHEET_COLS: 1000,
};
