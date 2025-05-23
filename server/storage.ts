import { deals, type Deal, type InsertDeal, PHASES } from "@shared/schema";

export interface IStorage {
  getAllDeals(): Promise<Deal[]>;
  getDeal(id: number): Promise<Deal | undefined>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDealPhase(id: number, phase: string): Promise<Deal | undefined>;
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
        title: "渋谷区マンション A301号室",
        client: "田中様",
        priority: "高",
        phase: "①申込連絡",
        dueDate: "2024-05-20",
        notes: "緊急対応が必要",
      },
      {
        title: "新宿区オフィスビル 5階",
        client: "佐藤様", 
        priority: "中",
        phase: "①申込連絡",
        dueDate: "2024-05-25",
        notes: "",
      },
      {
        title: "港区高級マンション 20階",
        client: "山田様",
        priority: "高", 
        phase: "②内見調整",
        dueDate: "2024-05-28",
        notes: "",
      },
      {
        title: "品川区駅近アパート",
        client: "鈴木様",
        priority: "中",
        phase: "③入居審査", 
        dueDate: "2024-06-10",
        notes: "",
      },
      {
        title: "銀座エリア商業物件",
        client: "高橋様",
        priority: "高",
        phase: "⑤契約手続き",
        dueDate: "2024-06-15", 
        notes: "",
      },
      {
        title: "目黒区ワンルーム A202",
        client: "小林様",
        priority: "低",
        phase: "⑩契約終了",
        dueDate: "2024-05-15",
        notes: "契約完了",
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

export const storage = new MemStorage();
