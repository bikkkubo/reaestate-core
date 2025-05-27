import { Deal } from "@shared/schema";

const LEDGER_API_BASE = "https://transaction-ledger.replit.app";

/**
 * カンバンボードのDealデータを取引台帳フォーマットに変換
 */
function convertDealToLedgerFormat(deal: Deal) {
  const rentPrice = estimateRentFromTitle(deal.title);
  const managementFee = Math.round(rentPrice * 0.1);
  
  return {
    deal_number: `R${new Date().getFullYear()}-${String(deal.id).padStart(3, '0')}`,
    deal_type: "rental",
    tenant_name: deal.client || "未設定",
    tenant_address: "",
    important_explanation_date: null,
    contract_date: deal.phase === "⑩契約終了" ? new Date(deal.dueDate).toISOString() : null,
    rent_price: rentPrice,
    management_fee: managementFee,
    total_rent: rentPrice + managementFee,
    deposit: null,
    key_money: null,
    brokerage: rentPrice,
    contract_start_date: null,
    contract_end_date: null,
    landlord_name: "管理会社",
    landlord_address: null,
    real_estate_agent: null,
    other_notes: `Kanban案件ID: ${deal.id}, 優先度: ${deal.priority}, 備考: ${deal.notes || "なし"}`,
    kanban_deal_id: deal.id
  };
}

/**
 * 案件タイトルから賃料を推定
 */
function estimateRentFromTitle(title: string): number {
  // 簡易的な推定ロジック（実際の運用では正確なデータを使用）
  if (title.includes("渋谷") || title.includes("表参道")) return 180000;
  if (title.includes("新宿") || title.includes("池袋")) return 150000;
  if (title.includes("港区") || title.includes("タワー")) return 220000;
  if (title.includes("3LDK")) return 160000;
  if (title.includes("2LDK")) return 130000;
  if (title.includes("1LDK")) return 100000;
  return 120000; // デフォルト値
}

/**
 * カンバンボードのフェーズを取引台帳のステータスにマッピング
 */
function mapPhaseToStatus(phase: string): string {
  const statusMap: Record<string, string> = {
    "①申込連絡": "申込受付",
    "②内見調整": "内見対応",
    "③入居審査": "審査中",
    "④重要事項説明": "契約準備",
    "⑤契約手続き": "契約手続き",
    "⑥初期費用入金確認": "入金確認",
    "⑦鍵渡し準備": "鍵渡し準備",
    "⑧入居開始": "入居済み",
    "⑨管理開始": "管理中",
    "⑩契約終了": "契約完了",
    "⑪フォローアップ": "フォローアップ",
    "⑫AD請求/着金": "AD請求"
  };
  
  return statusMap[phase] || "処理中";
}

/**
 * 取引台帳システムに案件データを送信
 */
export async function sendDealToLedger(deal: Deal): Promise<{ success: boolean; message: string; ledgerId?: string }> {
  try {
    const ledgerData = convertDealToLedgerFormat(deal);
    
    const response = await fetch(`${LEDGER_API_BASE}/api/ledger/kanban`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ledgerData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`取引台帳API呼び出しエラー: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      message: "取引台帳に正常に登録されました",
      ledgerId: result.id
    };
    
  } catch (error) {
    console.error('取引台帳送信エラー:', error);
    return {
      success: false,
      message: `送信エラー: ${error.message}`
    };
  }
}

/**
 * 取引台帳システムの案件データを更新
 */
export async function updateDealInLedger(deal: Deal, ledgerId: string): Promise<{ success: boolean; message: string }> {
  try {
    const ledgerData = convertDealToLedgerFormat(deal);
    
    const response = await fetch(`${LEDGER_API_BASE}/api/ledger/${ledgerId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ledgerData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`取引台帳更新エラー: ${response.status} - ${errorText}`);
    }

    return {
      success: true,
      message: "取引台帳を正常に更新しました"
    };
    
  } catch (error) {
    console.error('取引台帳更新エラー:', error);
    return {
      success: false,
      message: `更新エラー: ${error.message}`
    };
  }
}

/**
 * ⑩契約完了ステータスの案件のみを取引台帳に一括送信
 */
export async function syncCompletedDealsToLedger(deals: Deal[]): Promise<{ sent: number; errors: string[]; skipped: number }> {
  let sentCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  // ⑩契約完了ステータスの案件のみをフィルタリング
  const completedDeals = deals.filter(deal => deal.phase === "⑩契約終了");

  for (const deal of completedDeals) {
    try {
      const result = await sendDealToLedger(deal);
      if (result.success) {
        sentCount++;
        console.log(`契約完了案件 ${deal.id} (${deal.client}) を取引台帳に送信完了`);
      } else {
        errors.push(`案件 ${deal.id}: ${result.message}`);
      }
      
      // API呼び出し間隔を調整（レート制限回避）
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      errors.push(`案件 ${deal.id}: ${(error as Error).message}`);
    }
  }

  skippedCount = deals.length - completedDeals.length;

  return { sent: sentCount, errors, skipped: skippedCount };
}