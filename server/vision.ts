import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface MyosokuData {
  tenantName?: string;
  tenantAddress?: string;
  contractDate?: string;
  rentPrice?: number;
  managementFee?: number;
  deposit?: number;
  keyMoney?: number;
  brokerage?: number;
  adFee?: number;
  landlordName?: string;
  landlordAddress?: string;
  realEstateAgent?: string;
  otherNotes?: string;
}

export async function analyzeMyosokuImage(imagePath: string): Promise<MyosokuData> {
  try {
    // 画像をbase64エンコード
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = path.extname(imagePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `このマイソク（不動産情報シート）の画像から以下の情報を抽出してください。抽出できない項目は空文字または0を返してください。JSONフォーマットで返答してください。

必要な情報：
- tenantName: 入居者名（借主名）
- tenantAddress: 入居者住所（借主住所）
- contractDate: 契約日（YYYY-MM-DD形式）
- rentPrice: 賃料（数値のみ、単位は円）
- managementFee: 管理費・共益費（数値のみ、単位は円）
- deposit: 敷金（数値のみ、単位は円）
- keyMoney: 礼金（数値のみ、単位は円）
- brokerage: 仲介手数料（数値のみ、単位は円）
- adFee: AD費用（数値のみ、単位は円）
- landlordName: 貸主名
- landlordAddress: 貸主住所
- realEstateAgent: 仲介業者名
- otherNotes: その他特記事項

レスポンス例：
{
  "tenantName": "田中太郎",
  "tenantAddress": "東京都渋谷区...",
  "contractDate": "2024-01-15",
  "rentPrice": 80000,
  "managementFee": 5000,
  "deposit": 160000,
  "keyMoney": 80000,
  "brokerage": 88000,
  "adFee": 50000,
  "landlordName": "山田花子",
  "landlordAddress": "東京都新宿区...",
  "realEstateAgent": "○○不動産",
  "otherNotes": "ペット可、楽器演奏可"
}`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("AI応答が空です");
    }

    // JSONを抽出
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("JSONフォーマットの応答が見つかりません");
    }

    const extractedData = JSON.parse(jsonMatch[0]) as MyosokuData;
    
    // 数値フィールドを確実に数値に変換
    const numericFields = ['rentPrice', 'managementFee', 'deposit', 'keyMoney', 'brokerage', 'adFee'] as const;
    numericFields.forEach(field => {
      if (extractedData[field]) {
        const value = extractedData[field];
        if (typeof value === 'string') {
          const parsed = parseInt(value.replace(/[^\d]/g, ''));
          extractedData[field] = isNaN(parsed) ? 0 : parsed;
        }
      }
    });

    return extractedData;
  } catch (error) {
    console.error("マイソク画像解析エラー:", error);
    throw new Error(`画像解析に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
}