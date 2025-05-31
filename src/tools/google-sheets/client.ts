import { google } from "googleapis";
import type { sheets_v4, drive_v3 } from "googleapis";
import {
  CellValue,
  CreateSheetParams,
  CreateSpreadsheetParams,
  ExpandSheetParams,
  ERROR_MESSAGES,
  LIMITS,
  ListSheetsParams,
  ReadRangeParams,
  SheetInfo,
  WriteRangeParams,
} from "./types.js";
import { toA1Notation, calculateEndPosition, generateRange } from "./utils.js";
import { AuthenticationManager } from "./auth-manager.js";

export class SheetsClient {
  private sheets: sheets_v4.Sheets;
  private drive: drive_v3.Drive;
  private defaultFolderId: string | undefined;
  private authManager: AuthenticationManager;

  constructor() {
    this.authManager = new AuthenticationManager([
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.file",
    ]);
    const oauth2Client = this.authManager.getOAuth2Client();
    this.sheets = google.sheets({ version: "v4", auth: oauth2Client });
    this.drive = google.drive({ version: "v3", auth: oauth2Client });
    this.defaultFolderId = process.env.GOOGLE_DRIVE_DEFAULT_FOLDER_ID;
  }

  /**
   * 認証を初期化
   */
  async authenticate(): Promise<void> {
    await this.authManager.setupAuth();
  }

  /**
   * スプレッドシート内の全シート情報を取得
   */
  async listSheets(params: ListSheetsParams): Promise<SheetInfo[]> {
    await this.authManager.setupAuth();
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: params.spreadsheetId,
        fields: "sheets.properties",
      });

      if (!response.data.sheets) {
        return [];
      }

      return response.data.sheets.map((sheet) => {
        const properties = sheet.properties;
        if (!properties) {
          throw new Error("シートのプロパティが取得できません");
        }
        return {
          title: properties.title || "",
          sheetId: properties.sheetId || 0,
          rowCount: properties.gridProperties?.rowCount || 0,
          columnCount: properties.gridProperties?.columnCount || 0,
          index: properties.index || 0,
        };
      });
    } catch (error) {
      if (this.isNotFoundError(error)) {
        throw new Error(ERROR_MESSAGES.SPREADSHEET_NOT_FOUND(params.spreadsheetId));
      }
      if (this.isPermissionError(error)) {
        throw new Error(ERROR_MESSAGES.PERMISSION_DENIED);
      }
      throw error;
    }
  }

  /**
   * 指定範囲のデータを読み取り
   */
  async readRange(params: ReadRangeParams): Promise<CellValue[][]> {
    await this.authManager.setupAuth();
    const rowLimit = params.rowLimit || LIMITS.DEFAULT_ROW_LIMIT;
    if (rowLimit > LIMITS.MAX_ROW_LIMIT) {
      throw new Error(ERROR_MESSAGES.ROW_LIMIT_EXCEEDED(LIMITS.MAX_ROW_LIMIT));
    }

    try {
      const range = params.sheetName ? `${params.sheetName}!${params.range}` : params.range;

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: params.spreadsheetId,
        range,
        majorDimension: "ROWS",
        valueRenderOption: "UNFORMATTED_VALUE",
      });

      if (!response.data.values) {
        return [];
      }

      // 行数制限を適用
      const values = response.data.values.slice(0, rowLimit);

      // 値の型を適切に変換
      return values.map((row: unknown[]) => row.map((cell: unknown) => this.convertCellValue(cell)));
    } catch (error) {
      if (this.isNotFoundError(error)) {
        throw new Error(ERROR_MESSAGES.SPREADSHEET_NOT_FOUND(params.spreadsheetId));
      }
      if (this.isPermissionError(error)) {
        throw new Error(ERROR_MESSAGES.PERMISSION_DENIED);
      }
      throw error;
    }
  }

  /**
   * 指定位置にデータを書き込み
   */
  async writeRange(params: WriteRangeParams): Promise<void> {
    await this.authManager.setupAuth();
    try {
      // シート情報を取得
      const sheets = await this.listSheets({ spreadsheetId: params.spreadsheetId });
      const targetSheet = params.sheetName ? sheets.find((s) => s.title === params.sheetName) : sheets[0];

      if (!targetSheet) {
        throw new Error(ERROR_MESSAGES.SHEET_NOT_FOUND(params.sheetName || "最初のシート"));
      }

      // 書き込み範囲を計算
      const startA1 = toA1Notation(params.startPosition);
      const endA1 = calculateEndPosition(params.startPosition, params.values);
      const range = params.sheetName
        ? `${params.sheetName}!${generateRange(startA1, endA1)}`
        : generateRange(startA1, endA1);

      // 必要に応じてシートを拡張
      await this.expandSheetIfNeeded({
        spreadsheetId: params.spreadsheetId,
        sheetId: targetSheet.sheetId,
        requiredRows: params.values.length,
        requiredCols: params.values[0].length,
      });

      // データを書き込み
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: params.spreadsheetId,
        range,
        valueInputOption: "RAW",
        requestBody: {
          values: params.values,
        },
      });
    } catch (error) {
      if (this.isNotFoundError(error)) {
        throw new Error(ERROR_MESSAGES.SPREADSHEET_NOT_FOUND(params.spreadsheetId));
      }
      if (this.isPermissionError(error)) {
        throw new Error(ERROR_MESSAGES.PERMISSION_DENIED);
      }
      throw error;
    }
  }

  /**
   * 新規シートを作成
   */
  async createSheet(params: CreateSheetParams): Promise<SheetInfo> {
    await this.authManager.setupAuth();
    try {
      const response = await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: params.spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: params.title,
                  gridProperties: {
                    rowCount: params.rows || LIMITS.DEFAULT_NEW_SHEET_ROWS,
                    columnCount: params.cols || LIMITS.DEFAULT_NEW_SHEET_COLS,
                  },
                },
              },
            },
          ],
        },
      });

      const addedSheet = response.data.replies?.[0].addSheet?.properties;
      if (!addedSheet) {
        throw new Error("シートの作成に失敗しました");
      }

      return {
        title: addedSheet.title || "",
        sheetId: addedSheet.sheetId || 0,
        rowCount: addedSheet.gridProperties?.rowCount || 0,
        columnCount: addedSheet.gridProperties?.columnCount || 0,
        index: addedSheet.index || 0,
      };
    } catch (error) {
      if (this.isNotFoundError(error)) {
        throw new Error(ERROR_MESSAGES.SPREADSHEET_NOT_FOUND(params.spreadsheetId));
      }
      if (this.isPermissionError(error)) {
        throw new Error(ERROR_MESSAGES.PERMISSION_DENIED);
      }
      throw error;
    }
  }

  /**
   * 新規スプレッドシートを作成
   */
  async createSpreadsheet(params: CreateSpreadsheetParams): Promise<string> {
    await this.authManager.setupAuth();
    try {
      // スプレッドシートを作成
      const response = await this.sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: params.title,
          },
          sheets: (params.sheets || [{ title: "Sheet1" }]).map((sheet) => ({
            properties: {
              title: sheet.title,
              gridProperties: {
                rowCount: sheet.rows || LIMITS.DEFAULT_NEW_SHEET_ROWS,
                columnCount: sheet.cols || LIMITS.DEFAULT_NEW_SHEET_COLS,
              },
            },
          })),
        },
      });

      const spreadsheetId = response.data.spreadsheetId;
      if (!spreadsheetId) {
        throw new Error("スプレッドシートの作成に失敗しました");
      }

      // パラメータで指定されたフォルダID、または環境変数のデフォルトフォルダID
      const targetFolderId = params.folderId || this.defaultFolderId;
      if (targetFolderId) {
        try {
          await this.drive.files.update({
            fileId: spreadsheetId,
            addParents: targetFolderId,
            removeParents: "root",
            supportsTeamDrives: true,
            fields: "id, parents",
          });
        } catch (error) {
          if (this.isNotFoundError(error)) {
            throw new Error(ERROR_MESSAGES.FOLDER_NOT_FOUND(targetFolderId));
          }
          throw error;
        }
      }

      return spreadsheetId;
    } catch (error) {
      if (this.isPermissionError(error)) {
        throw new Error(ERROR_MESSAGES.PERMISSION_DENIED);
      }
      throw error;
    }
  }

  /**
   * 必要に応じてシートを拡張
   */
  private async expandSheetIfNeeded(params: ExpandSheetParams): Promise<void> {
    await this.authManager.setupAuth();
    if (params.requiredRows > LIMITS.MAX_SHEET_ROWS || params.requiredCols > LIMITS.MAX_SHEET_COLS) {
      throw new Error(ERROR_MESSAGES.SHEET_SIZE_LIMIT(LIMITS.MAX_SHEET_ROWS, LIMITS.MAX_SHEET_COLS));
    }

    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: params.spreadsheetId,
        ranges: [],
        fields: "sheets.properties",
      });

      const sheet = response.data.sheets?.find((s) => s.properties?.sheetId === params.sheetId);

      if (!sheet || !sheet.properties?.gridProperties) {
        return;
      }

      const currentRows = sheet.properties.gridProperties.rowCount || 0;
      const currentCols = sheet.properties.gridProperties.columnCount || 0;
      const needsUpdate = params.requiredRows > currentRows || params.requiredCols > currentCols;

      if (needsUpdate) {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: params.spreadsheetId,
          requestBody: {
            requests: [
              {
                updateSheetProperties: {
                  properties: {
                    sheetId: params.sheetId,
                    gridProperties: {
                      rowCount: Math.max(currentRows, params.requiredRows),
                      columnCount: Math.max(currentCols, params.requiredCols),
                    },
                  },
                  fields: "gridProperties.rowCount,gridProperties.columnCount",
                },
              },
            ],
          },
        });
      }
    } catch (error) {
      if (this.isNotFoundError(error)) {
        throw new Error(ERROR_MESSAGES.SPREADSHEET_NOT_FOUND(params.spreadsheetId));
      }
      if (this.isPermissionError(error)) {
        throw new Error(ERROR_MESSAGES.PERMISSION_DENIED);
      }
      throw error;
    }
  }

  /**
   * APIレスポンスの値をCellValue型に変換
   */
  private convertCellValue(value: unknown): CellValue {
    if (typeof value === "string") return value;
    if (typeof value === "number") return value;
    if (typeof value === "boolean") return value;
    return String(value);
  }

  /**
   * NotFoundエラーかどうかを判定
   */
  private isNotFoundError(error: unknown): boolean {
    return (error as any)?.response?.status === 404;
  }

  /**
   * 権限エラーかどうかを判定
   */
  private isPermissionError(error: unknown): boolean {
    return (error as any)?.response?.status === 403;
  }

  // 後方互換性のためのメソッド
  async initialize(): Promise<void> {
    await this.authenticate();
  }

  parseSpreadsheetId(input: string): string {
    // URLからスプレッドシートIDを抽出
    const urlMatch = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch) {
      return urlMatch[1];
    }
    // 既にIDの場合はそのまま返す
    return input;
  }

  formatSheetData(values: any[][]): string {
    if (!values || values.length === 0) {
      return "データがありません";
    }
    
    return values.map(row => row.join('\t')).join('\n');
  }

  async getSpreadsheetInfo(spreadsheetId: string): Promise<any> {
    const id = this.parseSpreadsheetId(spreadsheetId);
    const sheets = await this.listSheets({ spreadsheetId: id });
    
    return {
      title: "スプレッドシート", // 実際のタイトルを取得する場合は別途APIコールが必要
      spreadsheetId: id,
      sheets: sheets.map(sheet => ({
        title: sheet.title,
        sheetId: sheet.sheetId,
        rowCount: sheet.rowCount,
        columnCount: sheet.columnCount,
      })),
    };
  }

  async getSheetData(spreadsheetId: string, range: string, valueRenderOption: string = 'FORMATTED_VALUE'): Promise<any> {
    const id = this.parseSpreadsheetId(spreadsheetId);
    return await this.readRange({
      spreadsheetId: id,
      range: range,
    });
  }

  async updateSheetData(spreadsheetId: string, range: string, values: string[][], valueInputOption: string = 'USER_ENTERED'): Promise<any> {
    const id = this.parseSpreadsheetId(spreadsheetId);
    await this.writeRange({
      spreadsheetId: id,
      startPosition: range.split(':')[0] || 'A1',
      values: values,
    });
    return { updatedCells: values.length * values[0]?.length || 0 };
  }
}
