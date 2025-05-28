# Google Sheets API 認証設定ガイド

このプロジェクトでGoogle Sheets APIを使用するために必要な認証情報の取得方法を説明します。

## 1. Google Cloud Projectの作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成するか、既存のプロジェクトを選択
3. プロジェクト名を設定（例：`my-sheets-mcp-project`）

## 2. Google Sheets APIの有効化

1. Google Cloud Consoleで「APIとサービス」→「ライブラリ」に移動
2. 「Google Sheets API」を検索して選択
3. 「有効にする」をクリック
4. 同様に「Google Drive API」も有効にする

## 3. サービスアカウントの作成

1. 「APIとサービス」→「認証情報」に移動
2. 「認証情報を作成」→「サービスアカウント」を選択
3. サービスアカウント名を入力（例：`sheets-mcp-service`）
4. 「作成して続行」をクリック
5. ロールは「編集者」または「Google Sheets API」の適切な権限を選択
6. 「完了」をクリック

## 4. サービスアカウントキーの生成

1. 作成したサービスアカウントをクリック
2. 「キー」タブに移動
3. 「鍵を追加」→「新しい鍵を作成」を選択
4. 「JSON」形式を選択して「作成」をクリック
5. JSONファイルがダウンロードされます

## 5. 環境変数の設定

### 方法1: GOOGLE_CREDENTIALS環境変数を使用

ダウンロードしたJSONファイルの内容を環境変数として設定：

```bash
# JSONファイルの内容を1行にして設定
export GOOGLE_CREDENTIALS='{"type":"service_account","project_id":"your-project-id",...}'
```

### 方法2: GOOGLE_KEY_FILE環境変数を使用

JSONファイルのパスを環境変数として設定：

```bash
# JSONファイルのパスを設定
export GOOGLE_KEY_FILE="/path/to/your/service-account-key.json"
```

## 6. Dev Container環境での設定

### .devcontainer/devcontainer.jsonに環境変数を追加

```json
{
  "remoteEnv": {
    "CONTAINER_WORKSPACE_FOLDER": "${containerWorkspaceFolder}",
    "LOCAL_WORKSPACE_FOLDER": "${localWorkspaceFolder}",
    "GOOGLE_KEY_FILE": "/workspace/credentials/service-account-key.json"
  },
  "mounts": [
    {
      "source": "${localWorkspaceFolder}/credentials",
      "target": "${containerWorkspaceFolder}/credentials",
      "type": "bind"
    }
  ]
}
```

### credentialsフォルダの作成

```bash
# プロジェクトルートにcredentialsフォルダを作成
mkdir credentials
# JSONファイルをcredentialsフォルダにコピー
cp /path/to/downloaded-key.json credentials/service-account-key.json
```

### .gitignoreに追加

```gitignore
# Google認証情報
credentials/
*.json
!package*.json
!tsconfig.json
```

## 7. スプレッドシートの共有設定

作成したサービスアカウントでスプレッドシートにアクセスするには：

1. Google Sheetsでスプレッドシートを開く
2. 「共有」ボタンをクリック
3. サービスアカウントのメールアドレス（`your-service@project-id.iam.gserviceaccount.com`）を追加
4. 適切な権限（編集者または閲覧者）を設定

## 8. 動作確認

MCPサーバーを起動して動作確認：

```bash
npm run build
npm start
```

## セキュリティ注意事項

- サービスアカウントキーは機密情報です
- GitHubなどのパブリックリポジトリにコミットしないでください
- 本番環境では環境変数やシークレット管理サービスを使用してください
- 定期的にキーをローテーションすることを推奨します

## トラブルシューティング

### よくあるエラー

1. **"Google API が初期化されていません"**
   - 環境変数が正しく設定されているか確認
   - JSONファイルのパスが正しいか確認

2. **"Permission denied"**
   - スプレッドシートがサービスアカウントと共有されているか確認
   - APIが有効になっているか確認

3. **"Invalid credentials"**
   - JSONファイルの内容が正しいか確認
   - プロジェクトIDが正しいか確認
