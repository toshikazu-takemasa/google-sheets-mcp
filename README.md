# Google Sheets MCP Server

Google Sheetsを操作するためのMCP（Model Context Protocol）サーバーです。

## 機能

- スプレッドシートの基本情報取得
- シートデータの読み取り
- シートデータの更新・追加
- データのクリア
- 新しいシートの作成・削除
- Google Driveでのスプレッドシート検索

## セットアップ

### 1. Google Cloud Console での設定

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. Google Sheets API と Google Drive API を有効化
3. サービスアカウントを作成し、JSONキーをダウンロード

### 2. 認証設定

以下のいずれかの方法で認証を設定してください：

#### 方法1: Google Cloud SDK認証（推奨）
Google Cloud SDKがインストールされている場合、以下の手順で認証を設定できます：

1. **Google Cloud SDKの認証設定**:
   ```bash
   # アプリケーションデフォルト認証を設定
   gcloud auth application-default login
   ```

2. **環境変数の設定**:
   ```bash
   # Windows
   set GOOGLE_CLOUD_PROJECT=sprocket-op
   
   # Linux/Mac
   export GOOGLE_CLOUD_PROJECT=sprocket-op
   ```

3. **認証情報の保存場所**:
   - Windows: `%APPDATA%\gcloud\application_default_credentials.json`
   - Linux/Mac: `~/.config/gcloud/application_default_credentials.json`

この方法では、Google Cloud SDKで設定された認証情報が自動的に使用され、サービスアカウントキーファイルを管理する必要がありません。

#### 方法2: 環境変数でサービスアカウントキーを設定
```bash
export GOOGLE_CREDENTIALS='{"type":"service_account","project_id":"your-project",...}'
```

#### 方法3: キーファイルのパスを指定
```bash
export GOOGLE_KEY_FILE="/path/to/service-account-key.json"
```

### 3. インストールと実行

```bash
# 依存関係のインストール
npm install

# ビルド
npm run build

# 実行
npm start

# 開発モード
npm run dev
```

## Docker での実行

```bash
# ビルド
docker build -t google-sheets-mcp .

# 実行（環境変数で認証情報を渡す）
docker run -e GOOGLE_CREDENTIALS='{"type":"service_account",...}' -p 3000:3000 google-sheets-mcp
```

## 利用可能なツール

### get_spreadsheet_info
スプレッドシートの基本情報を取得します。

**パラメータ:**
- `spreadsheetId`: スプレッドシートのID（URLまたはID）

### get_sheet_data
指定したシートのデータを取得します。

**パラメータ:**
- `spreadsheetId`: スプレッドシートのID
- `range`: 取得する範囲（例: 'Sheet1!A1:C10'）
- `valueRenderOption`: 値の表示形式（オプション）

### update_sheet_data
指定したシートのデータを更新します。

**パラメータ:**
- `spreadsheetId`: スプレッドシートのID
- `range`: 更新する範囲
- `values`: 更新するデータ（2次元配列）
- `valueInputOption`: 入力値の解釈方法（オプション）

### append_sheet_data
シートにデータを追加します。

**パラメータ:**
- `spreadsheetId`: スプレッドシートのID
- `range`: 追加する範囲
- `values`: 追加するデータ（2次元配列）
- `valueInputOption`: 入力値の解釈方法（オプション）
- `insertDataOption`: データの挿入方法（オプション）

### clear_sheet_data
指定した範囲のデータをクリアします。

**パラメータ:**
- `spreadsheetId`: スプレッドシートのID
- `range`: クリアする範囲

### create_sheet
新しいシートを作成します。

**パラメータ:**
- `spreadsheetId`: スプレッドシートのID
- `title`: 新しいシートのタイトル
- `rowCount`: 行数（オプション、デフォルト: 1000）
- `columnCount`: 列数（オプション、デフォルト: 26）

### delete_sheet
シートを削除します。

**パラメータ:**
- `spreadsheetId`: スプレッドシートのID
- `sheetId`: 削除するシートのID

### search_spreadsheets
Google Driveでスプレッドシートを検索します。

**パラメータ:**
- `query`: 検索クエリ
- `maxResults`: 最大結果数（オプション、デフォルト: 10）

## 使用例

```javascript
// スプレッドシート情報の取得
{
  "name": "get_spreadsheet_info",
  "arguments": {
    "spreadsheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
  }
}

// データの取得
{
  "name": "get_sheet_data",
  "arguments": {
    "spreadsheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "range": "Sheet1!A1:C10"
  }
}

// データの更新
{
  "name": "update_sheet_data",
  "arguments": {
    "spreadsheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "range": "Sheet1!A1:B2",
    "values": [["名前", "年齢"], ["田中", "30"]]
  }
}
```

## 注意事項

- Google Sheets APIの利用制限に注意してください
- サービスアカウントには適切なスプレッドシートへのアクセス権限が必要です
- 認証情報は安全に管理してください

## ライセンス

MIT License
