import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";

export interface SheetsClientConfig {
  credentials?: any;
  keyFile?: string;
  scopes?: string[];
}

export class SheetsClient {
  private sheets: any = null;
  private drive: any = null;
  private config: SheetsClientConfig;

  constructor(config?: SheetsClientConfig) {
    this.config = {
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.readonly'
      ],
      credentials: process.env.GOOGLE_CREDENTIALS ? JSON.parse(process.env.GOOGLE_CREDENTIALS) : null,
      keyFile: process.env.GOOGLE_KEY_FILE || undefined,
      ...config
    };
  }

  async initialize(): Promise<void> {
    try {
      let auth: GoogleAuth;
      
      // Google Cloud SDKの認証情報を優先的に使用
      if (process.env.GOOGLE_CLOUD_PROJECT) {
        console.error(`Using Google Cloud SDK authentication for project: ${process.env.GOOGLE_CLOUD_PROJECT}`);
        auth = new GoogleAuth({
          scopes: this.config.scopes,
          projectId: process.env.GOOGLE_CLOUD_PROJECT,
        });
      } else if (this.config.credentials) {
        // サービスアカウントキーを直接使用
        console.error("Using service account credentials from environment variable");
        auth = new GoogleAuth({
          credentials: this.config.credentials,
          scopes: this.config.scopes,
        });
      } else if (this.config.keyFile) {
        // キーファイルを使用
        console.error(`Using service account key file: ${this.config.keyFile}`);
        auth = new GoogleAuth({
          keyFile: this.config.keyFile,
          scopes: this.config.scopes,
        });
      } else {
        // デフォルトの認証を使用
        console.error("Using default Google Cloud authentication");
        auth = new GoogleAuth({
          scopes: this.config.scopes,
        });
      }

      const authClient = await auth.getClient();
      
      this.sheets = google.sheets({ version: 'v4', auth: auth });
      this.drive = google.drive({ version: 'v3', auth: auth });
      
      console.error("Google Sheets API initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Google Sheets API:", error);
      throw error;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.sheets || !this.drive) {
      await this.initialize();
    }
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
    await this.ensureInitialized();
    const id = this.parseSpreadsheetId(spreadsheetId);
    
    const response = await this.sheets.spreadsheets.get({
      spreadsheetId: id,
    });
    
    const spreadsheet = response.data;
    return {
      title: spreadsheet.properties?.title,
      spreadsheetId: spreadsheet.spreadsheetId,
      sheets: spreadsheet.sheets?.map((sheet: any) => ({
        title: sheet.properties?.title,
        sheetId: sheet.properties?.sheetId,
        rowCount: sheet.properties?.gridProperties?.rowCount,
        columnCount: sheet.properties?.gridProperties?.columnCount,
      })),
    };
  }

  async getSheetData(spreadsheetId: string, range: string, valueRenderOption: string = 'FORMATTED_VALUE'): Promise<any> {
    await this.ensureInitialized();
    const id = this.parseSpreadsheetId(spreadsheetId);
    
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: id,
      range: range,
      valueRenderOption: valueRenderOption,
    });
    
    return response.data.values;
  }

  async updateSheetData(spreadsheetId: string, range: string, values: string[][], valueInputOption: string = 'USER_ENTERED'): Promise<any> {
    await this.ensureInitialized();
    const id = this.parseSpreadsheetId(spreadsheetId);
    
    const response = await this.sheets.spreadsheets.values.update({
      spreadsheetId: id,
      range: range,
      valueInputOption: valueInputOption,
      requestBody: {
        values: values,
      },
    });
    
    return response.data;
  }

  async appendSheetData(spreadsheetId: string, range: string, values: string[][], valueInputOption: string = 'USER_ENTERED', insertDataOption: string = 'INSERT_ROWS'): Promise<any> {
    await this.ensureInitialized();
    const id = this.parseSpreadsheetId(spreadsheetId);
    
    const response = await this.sheets.spreadsheets.values.append({
      spreadsheetId: id,
      range: range,
      valueInputOption: valueInputOption,
      insertDataOption: insertDataOption,
      requestBody: {
        values: values,
      },
    });
    
    return response.data;
  }

  async clearSheetData(spreadsheetId: string, range: string): Promise<void> {
    await this.ensureInitialized();
    const id = this.parseSpreadsheetId(spreadsheetId);
    
    await this.sheets.spreadsheets.values.clear({
      spreadsheetId: id,
      range: range,
    });
  }

  async createSheet(spreadsheetId: string, title: string, rowCount: number = 1000, columnCount: number = 26): Promise<any> {
    await this.ensureInitialized();
    const id = this.parseSpreadsheetId(spreadsheetId);
    
    const response = await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId: id,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: title,
                gridProperties: {
                  rowCount: rowCount,
                  columnCount: columnCount,
                },
              },
            },
          },
        ],
      },
    });
    
    return response.data.replies?.[0]?.addSheet;
  }

  async deleteSheet(spreadsheetId: string, sheetId: number): Promise<void> {
    await this.ensureInitialized();
    const id = this.parseSpreadsheetId(spreadsheetId);
    
    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId: id,
      requestBody: {
        requests: [
          {
            deleteSheet: {
              sheetId: sheetId,
            },
          },
        ],
      },
    });
  }

  async searchSpreadsheets(query: string, maxResults: number = 10): Promise<any[]> {
    await this.ensureInitialized();
    
    const response = await this.drive.files.list({
      q: `mimeType='application/vnd.google-apps.spreadsheet' and name contains '${query}'`,
      pageSize: maxResults,
      fields: 'files(id, name, createdTime, modifiedTime, webViewLink)',
    });
    
    const files = response.data.files || [];
    return files.map((file: any) => ({
      id: file.id,
      name: file.name,
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
      webViewLink: file.webViewLink,
    }));
  }
}
