# Google Sheets MCP Dockerイメージ作成ガイド

このガイドでは、Google Sheets MCP サーバーのDockerイメージを作成する方法を説明します。

## 前提条件

- Docker がインストールされていること
- Node.js 22以上がインストールされていること
- Google Cloud認証情報が設定されていること

## ビルド手順

### 1. 自動ビルドスクリプトを使用する場合

```bash
./build-docker.sh
```

### 2. 手動でビルドする場合

```bash
# 1. プロジェクトをビルド
npm install
npm run build

# 2. Dockerイメージをビルド
docker build -t google-sheets-mcp:latest .

# 3. ビルド確認
docker images | grep google-sheets-mcp
```

## 実行方法

### Docker Composeを使用（推奨）

#### 本番環境用
```bash
docker-compose up google-sheets-mcp
```

#### 開発環境用
```bash
docker-compose --profile dev up google-sheets-mcp-dev
```

### 直接Dockerコマンドで実行

```bash
docker run -p 3000:3000 \
  -e GOOGLE_CREDENTIALS='{"type":"service_account",...}' \
  -e GOOGLE_CLOUD_PROJECT='your-project-id' \
  google-sheets-mcp:latest
```

## 環境変数

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `GOOGLE_CREDENTIALS` | サービスアカウントキーのJSON文字列 | いずれか一つ |
| `GOOGLE_KEY_FILE` | サービスアカウントキーファイルのパス | いずれか一つ |
| `GOOGLE_CLOUD_PROJECT` | Google CloudプロジェクトID | いずれか一つ |

## Dockerイメージの詳細

- **ベースイメージ**: node:22-slim
- **マルチステージビルド**: 本番用の軽量イメージを作成
- **ポート**: 3000
- **エントリーポイント**: socat経由でMCPサーバーを起動

## トラブルシューティング

### ビルドエラーが発生する場合

1. Node.jsの依存関係を確認
```bash
npm install
npm run build
```

2. TypeScriptコンパイルエラーを確認
```bash
npx tsc --noEmit
```

### 認証エラーが発生する場合

1. Google Cloud認証情報を確認
2. 必要なAPIが有効になっているか確認
   - Google Sheets API
   - Google Drive API

### コンテナが起動しない場合

1. ログを確認
```bash
docker logs <container-id>
```

2. 環境変数が正しく設定されているか確認
```bash
docker run --rm google-sheets-mcp:latest env
```

## セキュリティ注意事項

- 本番環境では、認証情報をSecretとして管理してください
- コンテナイメージに認証情報を含めないでください
- 必要最小限の権限でサービスアカウントを作成してください
