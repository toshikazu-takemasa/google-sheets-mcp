import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as crypto from "node:crypto";

export interface GoogleAuthConfig {
  clientId: string;
  clientSecret: string;
  scopes: string[];
}

export class GoogleAuthManager {
  private readonly configDir: string;
  private readonly tokenPath: string;
  private oauth2Client: OAuth2Client;

  constructor(private config: GoogleAuthConfig) {
    this.configDir = path.join(os.homedir(), ".config", "google-workspace-mcp", "credentials");
    this.tokenPath = path.join(this.configDir, "refresh_token.enc");

    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      "http://localhost:3000/oauth2callback",
    );
  }

  private async encryptToken(token: string): Promise<string> {
    // 実際の実装では、システムのキーチェーンなどを使用して
    // より安全な方法で暗号化キーを管理する必要があります
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || "default-key", "salt", 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(token, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
  }

  private async decryptToken(encryptedToken: string): Promise<string> {
    const [ivHex, encrypted] = encryptedToken.split(":");
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || "default-key", "salt", 32);
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  async saveToken(token: string): Promise<void> {
    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true, mode: 0o700 });
    }

    const encryptedToken = await this.encryptToken(token);
    fs.writeFileSync(this.tokenPath, encryptedToken, { mode: 0o600 });
  }

  async loadToken(): Promise<string | null> {
    try {
      if (!fs.existsSync(this.tokenPath)) {
        return null;
      }
      const encryptedToken = fs.readFileSync(this.tokenPath, "utf8");
      return this.decryptToken(encryptedToken);
    } catch (error) {
      console.error("Error loading token:", error);
      return null;
    }
  }

  async getAccessToken(): Promise<string> {
    const refreshToken = await this.loadToken();
    if (!refreshToken) {
      throw new Error("No refresh token found. Please authenticate first.");
    }

    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    try {
      const { token } = await this.oauth2Client.getAccessToken();
      if (!token) {
        throw new Error("Failed to get access token");
      }
      return token;
    } catch (error) {
      throw new Error(`Failed to refresh access token: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: this.config.scopes,
      prompt: "consent",
    });
  }

  async handleCallback(code: string): Promise<void> {
    const { tokens } = await this.oauth2Client.getToken(code);
    if (!tokens.refresh_token) {
      throw new Error("No refresh token received");
    }
    await this.saveToken(tokens.refresh_token);
  }

  getOAuth2Client(): OAuth2Client {
    return this.oauth2Client;
  }
}

// シングルトンインスタンスを管理
let authManager: GoogleAuthManager | null = null;

export async function getAuth(scopes: string[]): Promise<OAuth2Client> {
  if (!authManager) {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required");
    }

    authManager = new GoogleAuthManager({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      scopes,
    });
  }

  // リフレッシュトークンの存在確認と取得を試みる
  await authManager.getAccessToken();
  return authManager.getOAuth2Client();
}
