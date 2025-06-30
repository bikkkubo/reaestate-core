import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDealSchema } from "@shared/schema";
import { z } from "zod";
import { triggerManualReminders } from "./notifications";
import { sendDealToLedger, syncCompletedDealsToLedger } from "./ledger";
import { upload, serveUpload } from "./upload";
import { analyzeMyosokuImage } from "./vision";
import { generateDealQRCode, generateQRCodeDataURL, generateQRToken } from "./qrcode";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all deals
  app.get("/api/deals", async (req, res) => {
    try {
      const deals = await storage.getAllDeals();
      res.json(deals);
    } catch (error) {
      console.error("Error fetching deals:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create new deal
  app.post("/api/deals", async (req, res) => {
    try {
      const validatedData = insertDealSchema.parse(req.body);
      const deal = await storage.createDeal(validatedData);
      res.status(201).json(deal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      } else {
        console.error("Error creating deal:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Update deal
  app.patch("/api/deals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }

      // If only phase is provided, use the old updateDealPhase method
      if (req.body.phase && Object.keys(req.body).length === 1) {
        const deal = await storage.updateDealPhase(id, req.body.phase);
        if (!deal) {
          return res.status(404).json({ message: "Deal not found" });
        }

        // ⑨契約終了フェーズに移動した場合、取引台帳に自動送信
        if (req.body.phase === "⑨契約終了") {
          try {
            const { sendDealToLedger } = await import("./ledger");
            const ledgerResult = await sendDealToLedger(deal);
            
            if (ledgerResult.success) {
              console.log(`✅ 案件 ${deal.id} (${deal.client}) を取引台帳に自動送信完了`);
            } else {
              console.error(`❌ 取引台帳送信失敗: ${ledgerResult.message}`);
            }
          } catch (error) {
            console.error("取引台帳連携エラー:", error);
          }
        }

        return res.json(deal);
      }

      // Otherwise, update the full deal
      const validatedData = insertDealSchema.partial().parse(req.body);
      const deal = await storage.updateDeal(id, validatedData);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }

      res.json(deal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      } else {
        console.error("Error updating deal:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Delete deal
  app.delete("/api/deals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }

      const success = await storage.deleteDeal(id);
      if (!success) {
        return res.status(404).json({ message: "Deal not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting deal:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Sync with Google Sheets
  app.post("/api/sync", async (req, res) => {
    try {
      // This endpoint would trigger a sync with Google Sheets
      // Implementation would use Google Sheets API v4
      const result = await storage.syncWithGoogleSheets();
      res.json({ message: "Sync completed", result });
    } catch (error) {
      console.error("Error syncing with Google Sheets:", error);
      res.status(500).json({ message: "Sync failed" });
    }
  });

  // Get metadata (for phases, etc.)
  app.get("/api/metadata", async (req, res) => {
    try {
      const metadata = await storage.getMetadata();
      res.json(metadata);
    } catch (error) {
      console.error("Error fetching metadata:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Manual trigger for Slack reminders (for testing)
  app.post("/api/notifications/test", async (req, res) => {
    try {
      const result = await triggerManualReminders();
      res.json({ 
        message: "Test reminders sent", 
        sentCount: result.sent,
        deals: result.deals.map(d => ({ id: d.id, title: d.title, dueDate: d.dueDate }))
      });
    } catch (error) {
      console.error("Error sending test reminders:", error);
      res.status(500).json({ message: "Failed to send test reminders" });
    }
  });

  // LINE notification endpoints
  
  // Get LINE message template for a phase
  app.get("/api/line/template/:phase", async (req, res) => {
    try {
      const { getMessageTemplate } = await import("./line");
      const phase = decodeURIComponent(req.params.phase);
      const template = getMessageTemplate(phase);
      res.json({ template });
    } catch (error) {
      console.error("Error getting LINE template:", error);
      res.status(500).json({ error: "Failed to get template" });
    }
  });

  // Send LINE notification
  app.post("/api/line/send", async (req, res) => {
    try {
      const { sendLinePushMessage } = await import("./line");
      const { dealId, phase, message, lineUserId } = req.body;

      if (!dealId || !phase || !message || !lineUserId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Update deal with LINE User ID if provided
      if (lineUserId) {
        await storage.updateDeal(dealId, { lineUserId });
      }

      // Send LINE notification
      const success = await sendLinePushMessage(lineUserId, message);
      
      if (success) {
        res.json({ success: true, message: "LINE notification sent" });
      } else {
        res.status(500).json({ error: "Failed to send LINE notification" });
      }
    } catch (error) {
      console.error("Error sending LINE notification:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // 取引台帳連携 - 単一案件送信
  app.post("/api/ledger/sync/:id", async (req, res) => {
    try {
      const dealId = parseInt(req.params.id);
      const deal = await storage.getDeal(dealId);
      
      if (!deal) {
        return res.status(404).json({ error: "案件が見つかりません" });
      }

      const result = await sendDealToLedger(deal);
      
      if (result.success) {
        res.json({ 
          message: result.message,
          ledgerId: result.ledgerId,
          deal: { id: deal.id, client: deal.client, phase: deal.phase }
        });
      } else {
        res.status(500).json({ error: result.message });
      }
    } catch (error) {
      console.error("取引台帳送信エラー:", error);
      res.status(500).json({ error: "取引台帳への送信に失敗しました" });
    }
  });

  // 取引台帳連携 - 契約完了案件のみ一括送信
  app.post("/api/ledger/sync-all", async (req, res) => {
    try {
      const deals = await storage.getAllDeals();
      const result = await syncCompletedDealsToLedger(deals);
      
      res.json({
        message: "契約完了案件の取引台帳同期完了",
        sentCount: result.sent,
        totalDeals: deals.length,
        skippedCount: result.skipped,
        errors: result.errors
      });
    } catch (error) {
      console.error("取引台帳一括同期エラー:", error);
      res.status(500).json({ error: "取引台帳への一括送信に失敗しました" });
    }
  });

  // Debug endpoint to show current URL
  app.get("/api/line/webhook-info", (req, res) => {
    const host = req.get('host');
    const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
    const webhookUrl = `${protocol}://${host}/api/line/webhook`;
    
    res.json({
      webhookUrl,
      host,
      protocol,
      message: "Use this URL in LINE Developers"
    });
  });

  // マイソクアップロード関連エンドポイント
  
  // マイソク画像アップロードとAI解析（Base64対応）
  app.post("/api/myosoku/upload-base64", async (req, res) => {
    try {
      console.log("📤 Myosoku base64 upload request received");
      
      const { imageData, fileName, mimeType } = req.body;
      
      if (!imageData || !fileName) {
        return res.status(400).json({ error: "画像データまたはファイル名が提供されていません" });
      }

      // Base64データをBufferに変換
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      // ファイル拡張子の取得
      const ext = path.extname(fileName) || '.jpg';
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const finalFileName = `myosoku-${uniqueSuffix}${ext}`;
      
      // 一時的にファイルを保存（AI解析用）
      const isNetlify = process.env.NETLIFY === 'true';
      const tempDir = isNetlify ? '/tmp' : path.join(process.cwd(), "uploads");
      const tempFilePath = path.join(tempDir, finalFileName);
      
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      fs.writeFileSync(tempFilePath, buffer);
      console.log("📁 File saved temporarily:", tempFilePath);
      
      // AI解析を実行
      let analyzedData = {};
      try {
        console.log("🤖 Starting AI analysis...");
        
        if (!process.env.OPENAI_API_KEY) {
          console.warn("⚠️ OPENAI_API_KEY not configured, skipping AI analysis");
          analyzedData = { error: "AI解析はOpenAI API keyが設定されていないためスキップされました" };
        } else {
          analyzedData = await analyzeMyosokuImage(tempFilePath);
          console.log("✅ AI analysis completed:", analyzedData);
        }
      } catch (visionError) {
        console.warn("⚠️ AI解析エラー:", visionError);
        analyzedData = { 
          error: "AI解析に失敗しました", 
          details: visionError instanceof Error ? visionError.message : '不明なエラー'
        };
      } finally {
        // 一時ファイルを削除
        try {
          fs.unlinkSync(tempFilePath);
        } catch (cleanupError) {
          console.warn("Cleanup error:", cleanupError);
        }
      }

      res.json({
        success: true,
        fileName: finalFileName,
        imageData: `data:${mimeType};base64,${base64Data}`,
        analyzedData,
        message: "マイソクが処理されました" + (analyzedData.error ? "（AI解析はスキップされました）" : "（AI解析が完了しました）")
      });
    } catch (error) {
      console.error("❌ マイソクBase64アップロードエラー:", error);
      
      const errorMessage = error instanceof Error ? error.message : "画像の処理に失敗しました";
      res.status(500).json({ 
        error: errorMessage,
        type: "Base64UploadError"
      });
    }
  });

  // マイソク画像アップロードとAI解析（従来のmulter方式）
  app.post("/api/myosoku/upload", upload.single('myosoku'), async (req, res) => {
    try {
      console.log("📤 Myosoku upload request received");
      console.log("📄 File info:", req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : 'No file');

      if (!req.file) {
        console.error("❌ No file uploaded");
        return res.status(400).json({ error: "ファイルがアップロードされていません" });
      }

      const filePath = req.file.path;
      const fileName = req.file.filename;
      
      console.log("📁 File saved:", { filePath, fileName });
      
      // AI解析を実行
      let analyzedData = {};
      try {
        console.log("🤖 Starting AI analysis...");
        
        // OpenAI API keyチェック
        if (!process.env.OPENAI_API_KEY) {
          console.warn("⚠️ OPENAI_API_KEY not configured, skipping AI analysis");
          analyzedData = { error: "AI解析はOpenAI API keyが設定されていないためスキップされました" };
        } else {
          analyzedData = await analyzeMyosokuImage(filePath);
          console.log("✅ AI analysis completed:", analyzedData);
        }
      } catch (visionError) {
        console.warn("⚠️ AI解析エラー:", visionError);
        analyzedData = { 
          error: "AI解析に失敗しました", 
          details: visionError instanceof Error ? visionError.message : '不明なエラー'
        };
      }

      const fileUrl = `/api/uploads/${fileName}`;

      console.log("📋 Upload result:", { fileUrl, fileName, analyzedData });

      res.json({
        success: true,
        fileUrl,
        fileName,
        analyzedData,
        message: "マイソクがアップロードされました" + (analyzedData.error ? "（AI解析はスキップされました）" : "（AI解析が完了しました）")
      });
    } catch (error) {
      console.error("❌ マイソクアップロードエラー:", error);
      
      // より詳細なエラー情報を返す
      const errorMessage = error instanceof Error ? error.message : "ファイルのアップロードに失敗しました";
      const errorDetails = {
        error: errorMessage,
        type: error instanceof Error ? error.constructor.name : 'Unknown',
        details: error instanceof Error ? error.stack : String(error)
      };
      
      console.error("📊 Error details:", errorDetails);
      res.status(500).json(errorDetails);
    }
  });

  // アップロードされたファイルを提供
  app.get("/api/uploads/:filename", serveUpload);

  // QRコード画像を提供
  app.get("/api/uploads/qr/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), "uploads", "qr", filename);
    
    if (!require('fs').existsSync(filePath)) {
      return res.status(404).json({ error: "QRコードファイルが見つかりません" });
    }
    
    res.sendFile(filePath);
  });

  // 案件にマイソク情報を更新
  app.patch("/api/deals/:id/myosoku", async (req, res) => {
    try {
      const dealId = parseInt(req.params.id);
      const { myosokuImageUrl, myosokuImagePath, ...myosokuData } = req.body;

      if (isNaN(dealId)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }

      // 案件を更新（マイソクデータとファイル情報を含む）
      const updatedData = {
        ...myosokuData,
        myosokuImageUrl,
        myosokuImagePath,
        myosokuUploadedAt: new Date()
      };

      const deal = await storage.updateDeal(dealId, updatedData);
      res.json(deal);
    } catch (error) {
      console.error("マイソク情報更新エラー:", error);
      res.status(500).json({ message: "マイソク情報の更新に失敗しました" });
    }
  });

  // LINE連携QRコード生成
  app.post("/api/deals/:id/qrcode", async (req, res) => {
    try {
      const dealId = parseInt(req.params.id);
      
      if (isNaN(dealId)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }

      // 既存のQRコードトークンをチェック
      const existingDeal = await storage.getDealById(dealId);
      if (!existingDeal) {
        return res.status(404).json({ message: "案件が見つかりません" });
      }

      let token = existingDeal.qrCodeToken;
      
      // トークンが存在しない場合は新規生成
      if (!token) {
        token = generateQRToken();
      }

      // QRコードを生成
      const qrCodeData = await generateDealQRCode(dealId, token);
      
      // データベースに保存
      const updatedDeal = await storage.updateDeal(dealId, {
        qrCodeToken: qrCodeData.token,
        qrCodeUrl: qrCodeData.url,
        // qrCodeImagePathは内部的に保存するが、APIレスポンスには含めない
      });

      res.json({
        success: true,
        qrCodeUrl: qrCodeData.qrCodeImageUrl,
        lineUrl: qrCodeData.url,
        token: qrCodeData.token
      });
    } catch (error) {
      console.error("QRコード生成エラー:", error);
      res.status(500).json({ message: "QRコードの生成に失敗しました" });
    }
  });

  // QRコードをDataURLで取得（表示用）
  app.get("/api/deals/:id/qrcode", async (req, res) => {
    try {
      const dealId = parseInt(req.params.id);
      
      if (isNaN(dealId)) {
        return res.status(400).json({ message: "Invalid deal ID" });
      }

      const deal = await storage.getDealById(dealId);
      if (!deal) {
        return res.status(404).json({ message: "案件が見つかりません" });
      }

      let token = deal.qrCodeToken;
      
      // トークンが存在しない場合は新規生成
      if (!token) {
        token = generateQRToken();
        await storage.updateDeal(dealId, { qrCodeToken: token });
      }

      // QRコードをDataURLで生成
      const dataURL = await generateQRCodeDataURL(dealId, token);
      
      res.json({
        success: true,
        qrCodeDataURL: dataURL,
        token: token
      });
    } catch (error) {
      console.error("QRコード取得エラー:", error);
      res.status(500).json({ message: "QRコードの取得に失敗しました" });
    }
  });

  // 全リクエストをログ出力（完全デバッグ）
  app.use((req, res, next) => {
    // すべてのPOSTリクエストをログ
    if (req.method === 'POST') {
      console.log(`📨 [${new Date().toISOString()}] POST ${req.path}`);
      console.log('📨 Headers:', JSON.stringify(req.headers, null, 2));
      console.log('📨 Body:', JSON.stringify(req.body, null, 2));
    }
    
    // LINE関連のリクエストは特別にマーク
    if (req.path.includes('/api/line/')) {
      console.log(`🔍 [${new Date().toISOString()}] LINE ${req.method} ${req.path}`);
      console.log('🔍 Headers:', JSON.stringify(req.headers, null, 2));
      console.log('🔍 Body:', JSON.stringify(req.body, null, 2));
    }
    next();
  });

  // LINE Webhook endpoint - 顧客からのメッセージを受信
  app.post("/api/line/webhook", async (req, res) => {
    try {
      // アクセス可能なURLを出力
      const host = req.get('host');
      const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
      const webhookUrl = `${protocol}://${host}/api/line/webhook`;
      
      console.log(`🔥 LINE Webhook ACCESSED at: ${webhookUrl}`);
      console.log('🔥 Webhook headers:', req.headers);
      console.log('🔥 Webhook body:', req.body);
      
      const { verifyLineSignature, handleLineWebhook } = await import("./line");
      
      // LINE署名検証を完全にスキップしてテスト
      console.log('Processing webhook without signature verification for testing...');
      console.log('Request method:', req.method);
      console.log('Request path:', req.path);
      
      // Webhookイベントを処理
      const success = await handleLineWebhook(req.body);
      
      if (success) {
        res.status(200).json({ success: true });
      } else {
        res.status(500).json({ error: "Failed to process webhook" });
      }
    } catch (error) {
      console.error("Error handling LINE webhook:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
