import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  client: text("client"),
  priority: text("priority").notNull(), // "高", "中", "低"
  phase: text("phase").notNull(), // Current phase name
  dueDate: text("due_date").notNull(), // ISO date string
  notes: text("notes"),
  lineUserId: text("line_user_id"), // LINE User ID for notifications
  sheetRowIndex: integer("sheet_row_index"), // Google Sheets row number
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDealSchema = createInsertSchema(deals).pick({
  title: true,
  client: true,
  priority: true,
  phase: true,
  dueDate: true,
  notes: true,
  lineUserId: true,
}).extend({
  title: z.string().min(3, "案件名は3文字以上で入力してください"),
  priority: z.enum(["高", "中", "低"], { required_error: "緊急度を選択してください" }),
  phase: z.string().default("①申込連絡"),
  dueDate: z.string().min(1, "期日を選択してください"),
  client: z.string().optional(),
  notes: z.string().optional(),
  lineUserId: z.string().optional(),
});

export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Deal = typeof deals.$inferSelect;

// Phase constants
export const PHASES = [
  "①申込連絡",
  "②内見調整", 
  "③入居審査",
  "④重要事項説明",
  "⑤契約手続き",
  "⑥初期費用入金確認",
  "⑦鍵渡し準備",
  "⑧入居開始",
  "⑨管理開始",
  "⑩契約終了",
  "⑪フォローアップ",
  "⑫AD請求/着金"
] as const;

export type Phase = typeof PHASES[number];

export const PRIORITY_COLORS = {
  "高": "bg-red-500",
  "中": "bg-yellow-500", 
  "低": "bg-gray-500"
} as const;
