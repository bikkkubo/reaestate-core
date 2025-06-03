import { pgTable, text, serial, integer, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const deals = pgTable("deals", {
  // 取引台帳システムの既存項目
  id: serial("id").primaryKey(),
  dealNumber: text("deal_number"),
  dealType: text("deal_type"),
  tenantName: text("tenant_name"),
  tenantAddress: text("tenant_address"),
  importantExplanationDate: date("important_explanation_date"),
  contractDate: date("contract_date"),
  rentPrice: integer("rent_price"),
  managementFee: integer("management_fee"),
  totalRent: integer("total_rent"),
  deposit: integer("deposit"),
  keyMoney: integer("key_money"),
  brokerage: integer("brokerage"),
  contractStartDate: date("contract_start_date"),
  contractEndDate: date("contract_end_date"),
  landlordName: text("landlord_name"),
  landlordAddress: text("landlord_address"),
  realEstateAgent: text("real_estate_agent"),
  otherNotes: text("other_notes"),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
  adFee: integer("ad_fee"),
  
  // カンバンシステム用追加項目
  title: text("title"),
  client: text("client"),
  priority: text("priority"),
  phase: text("phase"),
  dueDate: text("due_date"),
  notes: text("notes"),
  lineUserId: text("line_user_id"),
  sheetRowIndex: integer("sheet_row_index"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  kanbanDealId: integer("kanban_deal_id"),
  
  // ⑫AD請求/着金用項目
  adAmount: integer("ad_amount"),
  invoiceDate: date("invoice_date"),
  expectedPaymentDate: date("expected_payment_date"),
  paymentConfirmed: text("payment_confirmed").default("false"),
  
  // ⑩フォローアップ用項目
  followUpContractPayment: text("follow_up_contract_payment").default("false"),
  followUpResidentCard: text("follow_up_resident_card").default("false"),
  followUpMyNumber: text("follow_up_my_number").default("false"),
  followUpUtilities: text("follow_up_utilities").default("false"),
  followUpGift: text("follow_up_gift").default("false"),
  followUpOther: text("follow_up_other"),
  
  // 顧客チェックリスト項目
  customerChecklistUrl: text("customer_checklist_url"),
});

export const insertDealSchema = createInsertSchema(deals).pick({
  // カンバンシステム用項目
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
  // ⑫AD請求/着金用項目
  adAmount: z.number().optional(),
  invoiceDate: z.string().optional(),
  expectedPaymentDate: z.string().optional(),
  paymentConfirmed: z.string().optional(),
  // ⑩フォローアップ用項目
  followUpContractPayment: z.string().optional(),
  followUpResidentCard: z.string().optional(),
  followUpMyNumber: z.string().optional(),
  followUpUtilities: z.string().optional(),
  followUpGift: z.string().optional(),
  followUpOther: z.string().optional(),
  // 顧客チェックリスト項目
  customerChecklistUrl: z.string().optional(),
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
  "⑨契約終了",
  "⑩フォローアップ",
  "⑪AD請求/着金"
] as const;

export type Phase = typeof PHASES[number];

export const PRIORITY_COLORS = {
  "高": "bg-red-500",
  "中": "bg-yellow-500", 
  "低": "bg-gray-500"
} as const;
