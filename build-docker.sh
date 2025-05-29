#!/bin/bash

# Google Sheets MCP Dockerイメージビルドスクリプト

echo "Google Sheets MCP Dockerイメージをビルドしています..."

# プロジェクトをビルド
echo "プロジェクトをビルド中..."
npm run build

if [ $? -ne 0 ]; then
    echo "ビルドに失敗しました"
    exit 1
fi

# Dockerイメージをビルド
echo "Dockerイメージをビルド中..."
docker build -t google-sheets-mcp:latest .

if [ $? -ne 0 ]; then
    echo "Dockerイメージのビルドに失敗しました"
    exit 1
fi

echo "Dockerイメージのビルドが完了しました！"
echo ""
echo "使用方法:"
echo "1. 本番環境用:"
echo "   docker-compose up google-sheets-mcp"
echo ""
echo "2. 開発環境用:"
echo "   docker-compose --profile dev up google-sheets-mcp-dev"
echo ""
echo "3. 直接実行:"
echo "   docker run -p 3000:3000 -e GOOGLE_CREDENTIALS='\$GOOGLE_CREDENTIALS' google-sheets-mcp:latest"
