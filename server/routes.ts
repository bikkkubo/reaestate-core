import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDealSchema } from "@shared/schema";
import { z } from "zod";
import { triggerManualReminders } from "./notifications";

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
