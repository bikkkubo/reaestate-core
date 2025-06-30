import QRCode from "qrcode";
import { randomBytes } from "crypto";
import fs from "fs";
import path from "path";

// QRコード画像保存ディレクトリ
const qrCodeDir = path.join(process.cwd(), "uploads", "qr");
if (!fs.existsSync(qrCodeDir)) {
  fs.mkdirSync(qrCodeDir, { recursive: true });
}

export interface QRCodeData {
  token: string;
  url: string;
  qrCodeImagePath: string;
  qrCodeImageUrl: string;
}

/**
 * ランダムトークンを生成
 */
export function generateQRToken(): string {
  return randomBytes(16).toString('hex');
}

/**
 * 案件用のLINE友だち追加QRコードを生成
 */
export async function generateDealQRCode(dealId: number, token: string): Promise<QRCodeData> {
  try {
    // LINE友だち追加URL（パラメータ付き）
    const lineAddFriendUrl = `https://line.me/R/ti/p/${process.env.LINE_BOT_ID || '@your-bot-id'}?deal=${token}`;
    
    // QRコード画像ファイル名
    const fileName = `deal-${dealId}-${token}.png`;
    const qrCodeImagePath = path.join(qrCodeDir, fileName);
    const qrCodeImageUrl = `/api/uploads/qr/${fileName}`;

    // QRコードを生成
    await QRCode.toFile(qrCodeImagePath, lineAddFriendUrl, {
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256,
    });

    return {
      token,
      url: lineAddFriendUrl,
      qrCodeImagePath: fileName,
      qrCodeImageUrl
    };
  } catch (error) {
    console.error('QRコード生成エラー:', error);
    throw new Error(`QRコードの生成に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
}

/**
 * QRコードをBase64データURLとして生成（APIレスポンス用）
 */
export async function generateQRCodeDataURL(dealId: number, token: string): Promise<string> {
  try {
    const lineAddFriendUrl = `https://line.me/R/ti/p/${process.env.LINE_BOT_ID || '@your-bot-id'}?deal=${token}`;
    
    const dataURL = await QRCode.toDataURL(lineAddFriendUrl, {
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256,
    });

    return dataURL;
  } catch (error) {
    console.error('QRコードDataURL生成エラー:', error);
    throw new Error(`QRコードの生成に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
}

/**
 * QRコード画像ファイルを削除
 */
export function deleteQRCodeFile(fileName: string): boolean {
  try {
    const filePath = path.join(qrCodeDir, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('QRコードファイル削除エラー:', error);
    return false;
  }
}

/**
 * QRコードトークンから案件を特定
 */
export function parseQRToken(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const dealToken = urlObj.searchParams.get('deal');
    return dealToken;
  } catch (error) {
    console.error('QRトークン解析エラー:', error);
    return null;
  }
}