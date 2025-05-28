import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  
  // 基本情報
  title: text("title").notNull(),
  client: text("client"),
  priority: text("priority").notNull(), // "高", "中", "低"
  phase: text("phase").notNull(), // Current phase name
  dueDate: text("due_date").notNull(), // ISO date string
  notes: text("notes"),
  
  // 取引台帳項目
  dealNumber: text("deal_number"), // 案件番号 (R2025-001)
  dealType: text("deal_type").default("rental"), // 取引形態
  tenantName: text("tenant_name"), // 借主名
  tenantAddress: text("tenant_address"), // 借主住所
  contractDate: text("contract_date"), // 契約日
  rentPrice: integer("rent_price"), // 賃料
  managementFee: integer("management_fee"), // 管理費
  deposit: integer("deposit"), // 敷金
  keyMoney: integer("key_money"), // 礼金
  brokerage: integer("brokerage"), // 仲介手数料
  adFee: integer("ad_fee"), // AD料
  landlordName: text("landlord_name"), // 貸主名
  landlordAddress: text("landlord_address"), // 貸主住所
  realEstateAgent: text("real_estate_agent"), // 仲介会社
  
  // システム項目
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
  // 取引台帳項目
  dealNumber: true,
  dealType: true,
  tenantName: true,
  tenantAddress: true,
  contractDate: true,
  rentPrice: true,
  managementFee: true,
  deposit: true,
  keyMoney: true,
  brokerage: true,
  adFee: true,
  landlordName: true,
  landlordAddress: true,
  realEstateAgent: true,
}).extend({
  title: z.string().min(3, "案件名は3文字以上で入力してください"),
  priority: z.enum(["高", "中", "低"], { required_error: "緊急度を選択してください" }),
  phase: z.string().default("①申込連絡"),
  dueDate: z.string().min(1, "期日を選択してください"),
  client: z.string().optional(),
  notes: z.string().optional(),
  lineUserId: z.string().optional(),
  // 取引台帳項目のバリデーション
  dealNumber: z.string().optional(),
  dealType: z.string().optional(),
  tenantName: z.string().optional(),
  tenantAddress: z.string().optional(),
  contractDate: z.string().optional(),
  rentPrice: z.number().optional(),
  managementFee: z.number().optional(),
  deposit: z.number().optional(),
  keyMoney: z.number().optional(),
  brokerage: z.number().optional(),
  adFee: z.number().optional(),
  landlordName: z.string().optional(),
  landlordAddress: z.string().optional(),
  realEstateAgent: z.string().optional(),
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
