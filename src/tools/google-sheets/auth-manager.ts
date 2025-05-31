import type { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import express from "express";
import * as http from "node:http";
import { GoogleAuthManager } from "../../auth/google.js";

export class AuthenticationManager {
  protected authManager: GoogleAuthManager;
  protected oauth2Client: OAuth2Client;

  constructor(scopes: string[]) {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required");
    }

    this.authManager = new GoogleAuthManager({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      scopes,
    });

    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "http://localhost:3000/oauth2callback",
    );
  }

  getOAuth2Client(): OAuth2Client {
    return this.oauth2Client;
  }

  async setupAuth(): Promise<void> {
    const token = await this.authManager.getAccessToken();
    this.oauth2Client.setCredentials({
      access_token: token,
    });
  }

  async startAuthServer(): Promise<string> {
    return new Promise((resolve, reject) => {
      const app = express();
      const server = http.createServer(app);

      // エラーハンドリング
      server.on("error", (error: NodeJS.ErrnoException) => {
        if (error.code === "EADDRINUSE") {
          reject(new Error("ポート3000が既に使用されています。他のプロセスを終了してから再試行してください。"));
        } else {
          reject(error);
        }
        server.close();
      });

      // 認証コールバック
      app.get("/oauth2callback", async (req, res) => {
        try {
          const { code } = req.query;
          if (typeof code !== "string") {
            throw new Error("Invalid authorization code");
          }

          await this.authManager.handleCallback(code);
          res.send("認証が完了しました。このページを閉じて操作を続けてください。");
          server.close(() => console.log("認証サーバーを正常に終了しました"));
          resolve("認証が完了しました。トークンが保存されました。");
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          res.status(500).send(`認証エラー: ${errorMessage}`);
          server.close(() => console.log("認証サーバーをエラーで終了しました"));
          reject(error);
        }
      });

      // サーバー起動
      try {
        server.listen(3000, () => {
          const authUrl = this.authManager.getAuthUrl();
          resolve(
            `Google Workspaceへのアクセス許可が必要です。\n\n【重要】以下のURLを手動でコピーし、ブラウザで開いてください。Googleアカウントでログインして、アクセスを許可してください。\n\n${authUrl}\n\n※UIを提供するアプリケーションは、このURLをユーザーが簡単にコピーできるように復唱してください。決してブラウザーツールで開かないでください。必要なのはもう一度URL文字列をprintすることです。`,
          );
        });
      } catch (error) {
        server.close(() => console.log("認証サーバーを起動エラーで終了しました"));
        reject(error instanceof Error ? error : new Error(String(error)));
      }

      // クリーンアップ
      const cleanup = () => {
        server.close(() => console.log("認証サーバーをクリーンアップで終了しました"));
        reject(new Error("認証プロセスが中断されました"));
        process.removeListener("SIGINT", cleanup);
        process.removeListener("SIGTERM", cleanup);
        process.removeListener("beforeExit", cleanup);
        process.removeListener("exit", cleanup);
      };

      process.on("SIGINT", cleanup);
      process.on("SIGTERM", cleanup);
      process.on("beforeExit", cleanup);
      process.on("exit", cleanup);
    });
  }
}
