import { deals, type Deal, type InsertDeal, PHASES } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getAllDeals(): Promise<Deal[]>;
  getDeal(id: number): Promise<Deal | undefined>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDealPhase(id: number, phase: string): Promise<Deal | undefined>;
  updateDeal(id: number, updates: Partial<InsertDeal>): Promise<Deal | undefined>;
  deleteDeal(id: number): Promise<boolean>;
  syncWithGoogleSheets(): Promise<{ synced: number; errors: string[] }>;
  getMetadata(): Promise<{ phases: string[] }>;
}

export class MemStorage implements IStorage {
  private deals: Map<number, Deal>;
  private currentId: number;

  constructor() {
    this.deals = new Map();
    this.currentId = 1;
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Add some sample data for demonstration
    const sampleDeals: InsertDeal[] = [
      {
        title: "渋谷区マンション 3LDK",
        client: "田中太郎様",
        priority: "高",
        phase: "②内見調整",
        dueDate: "2025-05-30",
        notes: "内見希望日: 5/30(金) 14:00〜",
        rentPrice: 180000,
        managementFee: 18000,
        deposit: 360000,
        keyMoney: 180000,
        brokerage: 180000,
        adFee: 90000,
        tenantName: "田中太郎",
        landlordName: "株式会社管理",
        realEstateAgent: "株式会社不動産",
      },
      {
        title: "新宿区オフィスビル 5階",
        client: "佐藤花子様", 
        priority: "中",
        phase: "④重要事項説明",
        dueDate: "2025-06-01",
        notes: "重要事項説明: 6/1(土) 10:00〜",
        rentPrice: 150000,
        managementFee: 15000,
        deposit: 300000,
        keyMoney: 150000,
        brokerage: 150000,
        adFee: 75000,
        tenantName: "佐藤花子",
        landlordName: "山田不動産",
        realEstateAgent: "株式会社不動産",
      },
      {
        title: "港区高級マンション 20階",
        client: "山田一郎様",
        priority: "高", 
        phase: "⑤契約手続き",
        dueDate: "2025-06-05",
        notes: "契約書準備中、印鑑証明書待ち",
        rentPrice: 220000,
        managementFee: 22000,
        deposit: 440000,
        keyMoney: 220000,
        brokerage: 220000,
        adFee: 110000,
        tenantName: "山田一郎",
        landlordName: "港区管理株式会社",
        realEstateAgent: "株式会社不動産",
      },
      {
        title: "品川区駅近アパート 1K",
        client: "鈴木美保様",
        priority: "中",
        phase: "③入居審査", 
        dueDate: "2025-06-10",
        notes: "審査書類提出済み、結果待ち",
        rentPrice: 130000,
        managementFee: 13000,
        deposit: 260000,
        keyMoney: 130000,
        brokerage: 130000,
        adFee: 65000,
        tenantName: "鈴木美保",
        landlordName: "品川管理",
        realEstateAgent: "株式会社不動産",
      },
      {
        title: "",
        client: "高橋健二様",
        priority: "低",
        phase: "⑪フォローアップ",
        dueDate: "2025-06-15", 
        notes: "ガス開栓サポート完了",
      },
      {
        title: "目黒区ワンルーム A202",
        client: "小林恵子様",
        priority: "低",
        phase: "⑫AD請求/着金",
        dueDate: "2025-05-15",
        notes: "請求書送付済み",
      },
    ];

    sampleDeals.forEach(deal => {
      this.createDeal(deal);
    });
  }

  async getAllDeals(): Promise<Deal[]> {
    return Array.from(this.deals.values());
  }

  async getDeal(id: number): Promise<Deal | undefined> {
    return this.deals.get(id);
  }

  async createDeal(insertDeal: InsertDeal): Promise<Deal> {
    const id = this.currentId++;
    const now = new Date();
    const deal: Deal = {
      ...insertDeal,
      id,
      client: insertDeal.client || null,
      notes: insertDeal.notes || null,
      sheetRowIndex: null,
      createdAt: now,
      updatedAt: now,
    };
    this.deals.set(id, deal);
    
    // Simulate Google Sheets API call
    this.simulateGoogleSheetsSync("create", deal);
    
    return deal;
  }

  async updateDealPhase(id: number, phase: string): Promise<Deal | undefined> {
    const deal = this.deals.get(id);
    if (!deal) return undefined;

    const updatedDeal: Deal = {
      ...deal,
      phase,
      updatedAt: new Date(),
    };
    this.deals.set(id, updatedDeal);
    
    // Simulate Google Sheets API call
    this.simulateGoogleSheetsSync("update", updatedDeal);
    
    return updatedDeal;
  }

  async updateDeal(id: number, updates: Partial<InsertDeal>): Promise<Deal | undefined> {
    const deal = this.deals.get(id);
    if (!deal) return undefined;

    const updatedDeal: Deal = {
      ...deal,
      ...updates,
      client: updates.client !== undefined ? updates.client : deal.client,
      notes: updates.notes !== undefined ? updates.notes : deal.notes,
      updatedAt: new Date(),
    };
    this.deals.set(id, updatedDeal);
    
    // Simulate Google Sheets API call
    this.simulateGoogleSheetsSync("update", updatedDeal);
    
    return updatedDeal;
  }

  async deleteDeal(id: number): Promise<boolean> {
    const deal = this.deals.get(id);
    if (!deal) return false;

    this.deals.delete(id);
    
    // Simulate Google Sheets API call
    this.simulateGoogleSheetsSync("delete", deal);
    
    return true;
  }

  async syncWithGoogleSheets(): Promise<{ synced: number; errors: string[] }> {
    // Simulate Google Sheets API sync
    const allDeals = await this.getAllDeals();
    
    // In real implementation, this would:
    // 1. Fetch data from Google Sheets API
    // 2. Compare with local data
    // 3. Resolve conflicts using ETag or last-modified timestamps
    // 4. Update both local storage and Google Sheets
    
    console.log(`Simulating sync of ${allDeals.length} deals with Google Sheets`);
    
    return {
      synced: allDeals.length,
      errors: [],
    };
  }

  async getMetadata(): Promise<{ phases: string[] }> {
    return {
      phases: [...PHASES],
    };
  }

  private simulateGoogleSheetsSync(operation: "create" | "update" | "delete", deal: Deal) {
    // In real implementation, this would make actual Google Sheets API calls
    // using service account authentication and batch operations
    console.log(`Google Sheets API simulation: ${operation} deal ${deal.id} - ${deal.title}`);
    
    // Simulated API call details:
    // - Use service account credentials from environment variables
    // - Batch operations to respect 60 calls/minute limit
    // - ETag-based conflict resolution
    // - Error handling with retry logic
  }
}

export class DatabaseStorage implements IStorage {
  async getAllDeals(): Promise<Deal[]> {
    const result = await db.select().from(deals);
    return result;
  }

  async getDeal(id: number): Promise<Deal | undefined> {
    const [deal] = await db.select().from(deals).where(eq(deals.id, id));
    return deal || undefined;
  }

  async createDeal(insertDeal: InsertDeal): Promise<Deal> {
    const [deal] = await db
      .insert(deals)
      .values({
        ...insertDeal,
        lineUserId: insertDeal.lineUserId || null,
      })
      .returning();
    return deal;
  }

  async updateDealPhase(id: number, phase: string): Promise<Deal | undefined> {
    const [deal] = await db
      .update(deals)
      .set({ phase, updatedAt: new Date() })
      .where(eq(deals.id, id))
      .returning();
    return deal || undefined;
  }

  async updateDeal(id: number, updates: Partial<InsertDeal>): Promise<Deal | undefined> {
    const [deal] = await db
      .update(deals)
      .set({
        ...updates,
        lineUserId: updates.lineUserId || null,
        updatedAt: new Date(),
      })
      .where(eq(deals.id, id))
      .returning();
    return deal || undefined;
  }

  async deleteDeal(id: number): Promise<boolean> {
    const result = await db.delete(deals).where(eq(deals.id, id));
    return result.rowCount > 0;
  }

  async syncWithGoogleSheets(): Promise<{ synced: number; errors: string[] }> {
    // Google Sheets同期はMemStorageと同様の実装を保持
    return { synced: 0, errors: ["Google Sheets sync not implemented for database storage"] };
  }

  async getMetadata(): Promise<{ phases: string[] }> {
    return { phases: PHASES.slice() };
  }
}

// 一時的にMemStorageを使用してシステムを復旧
export const storage = new MemStorage();
