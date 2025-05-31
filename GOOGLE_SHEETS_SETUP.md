# Google Sheets MCP Server セットアップガイド

このガイドでは、改善されたGoogle Sheets MCPサーバーのセットアップ方法を説明します。

## 新機能

- **改善された認証システム**: OAuth2フローによる安全な認証
- **暗号化されたトークン保存**: リフレッシュトークンの安全な保存
- **包括的なエラーハンドリング**: 詳細なエラーメッセージと復旧手順
- **新しいツール**: 認証セットアップツールの追加

## 必要な環境変数

```bash
# Google OAuth2認証情報（必須）
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# オプション設定
GOOGLE_DRIVE_DEFAULT_FOLDER_ID=your-default-folder-id  # スプレッドシート作成時のデフォルト保存先
ENCRYPTION_KEY=your-encryption-key  # トークン暗号化用（省略可能、デフォルトキーが使用されます）
```

## Google Cloud Console設定

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクトを作成または選択
3. 以下のAPIを有効化：
   - Google Sheets API
   - Google Drive API
4. 「認証情報」→「認証情報を作成」→「OAuth 2.0 クライアントID」
5. アプリケーションの種類：「デスクトップアプリケーション」
6. 承認済みのリダイレクトURIに追加：`http://localhost:3000/oauth2callback`
7. クライアントIDとクライアントシークレットをコピー

## 利用可能なツール

### 1. google_sheets_auth_setup
認証のセットアップを行います。初回使用時や認証エラーが発生した場合に実行してください。

```json
{
  "name": "google_sheets_auth_setup",
  "arguments": {}
}
```

### 2. sheets_list
スプレッドシート内の全シート情報を取得します。

```json
{
  "name": "sheets_list",
  "arguments": {
    "doc_id": "スプレッドシートID"
  }
}
```

### 3. sheets_read_range
指定範囲のデータを読み取ります。

```json
{
  "name": "sheets_read_range",
  "arguments": {
    "doc_id": "スプレッドシートID",
    "range": "A1:D10",
    "sheet_name": "Sheet1",  // オプション
    "row_limit": 100  // オプション、最大1000
  }
}
```

### 4. sheets_write_range
指定位置にデータを書き込みます。

```json
{
  "name": "sheets_write_range",
  "arguments": {
    "doc_id": "スプレッドシートID",
    "start_position": "A1",  // または {"row": 0, "col": 0}
    "values": [
      ["名前", "年齢", "職業"],
      ["田中太郎", 30, "エンジニア"],
      ["佐藤花子", 25, "デザイナー"]
    ],
    "sheet_name": "Sheet1"  // オプション
  }
}
```

### 5. sheets_create_sheet
既存のスプレッドシートに新しいシートを作成します。

```json
{
  "name": "sheets_create_sheet",
  "arguments": {
    "doc_id": "スプレッドシートID",
    "title": "新しいシート",
    "rows": 1000,  // オプション
    "cols": 26     // オプション
  }
}
```

### 6. sheets_create_spreadsheet
新規スプレッドシートを作成します。

```json
{
  "name": "sheets_create_spreadsheet",
  "arguments": {
    "title": "新しいスプレッドシート",
    "folder_id": "フォルダID",  // オプション
    "sheets": [  // オプション
      {
        "title": "データシート",
        "rows": 1000,
        "cols": 26
      }
    ]
  }
}
```

## 初回セットアップ手順

1. 環境変数を設定
2. MCPサーバーを起動
3. `google_sheets_auth_setup`ツールを実行
4. 表示されたURLをブラウザで開いてGoogleアカウントでログイン
5. アクセスを許可
6. 認証完了後、他のツールが使用可能になります

## トラブルシューティング

### 認証エラーが発生する場合
- `google_sheets_auth_setup`ツールを再実行してください
- 環境変数`GOOGLE_CLIENT_ID`と`GOOGLE_CLIENT_SECRET`が正しく設定されているか確認してください

### ポート3000が使用中のエラー
- 他のプロセスがポート3000を使用している可能性があります
- 該当プロセスを終了してから再試行してください

### スプレッドシートが見つからないエラー
- スプレッドシートIDが正しいか確認してください
- スプレッドシートの共有設定で、認証したGoogleアカウントにアクセス権限があるか確認してください

### 権限エラー
- スプレッドシートの共有設定を確認してください
- 編集権限が必要な操作の場合は、編集権限があることを確認してください

## セキュリティ

- リフレッシュトークンは暗号化されて`~/.config/google-workspace-mcp/credentials/`に保存されます
- 本番環境では`ENCRYPTION_KEY`環境変数を設定することを推奨します
- 認証情報は適切に管理し、公開リポジトリにコミットしないでください

## Cline MCP設定例

```json
{
  "mcpServers": {
    "google-sheets": {
      "command": "node",
      "args": ["/path/to/google-sheets-mcp/dist/index.js"],
      "env": {
        "GOOGLE_CLIENT_ID": "your-google-client-id",
        "GOOGLE_CLIENT_SECRET": "your-google-client-secret",
        "GOOGLE_DRIVE_DEFAULT_FOLDER_ID": "your-default-folder-id"
      }
    }
  }
}
