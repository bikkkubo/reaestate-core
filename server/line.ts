import { Deal } from "../shared/schema";

// LINE Messaging API client setup
const LINE_API_URL = 'https://api.line.me/v2/bot/message/push';

/**
 * フェーズごとのLINEメッセージテンプレート
 */
export const LINE_MESSAGE_TEMPLATES: Record<string, string> = {
  "①申込": `🏠 お申込みありがとうございます！

{clientName}様のお申込みを受付いたしました。
次のステップは入居審査となります。

📋 必要書類：
• 身分証明書のコピー
• 収入証明書（給与明細3ヶ月分または源泉徴収票）
• 印鑑証明書

何かご不明点がございましたら、お気軽にお声かけください。`,

  "②入居審査": `📋 入居審査が開始されました

{clientName}様の入居審査を開始いたします。
通常3〜4営業日で結果が出ますので、結果が出ましたらお伝えします。

📄 審査中にご用意いただきたい書類：
• 保証人の同意書
• 住民票（3ヶ月以内発行）

審査結果をお待ちください。`,

  "③審査結果": `✅ 審査結果のお知らせ

{clientName}様、審査が完了いたしました！
結果についてご連絡いたします。

📞 次のステップについてお電話でご説明いたしますので、
ご都合の良いお時間をお教えください。`,

  "④重要事項説明": `📝 重要事項説明のご案内

{clientName}様、重要事項説明を実施いたします。

📅 説明日時：調整中
📍 場所：弊社オフィスまたはオンライン
⏰ 所要時間：約30分

詳細は別途ご連絡いたします。`,

  "⑤契約": `📋 ご契約手続きのご案内

{clientName}様、いよいよご契約となります！

🏠 契約物件：{propertyName}
📅 契約日：調整中
💰 必要費用の最終確認をいたします

契約当日の流れについて詳しくご説明いたします。`,

  "⑥初期費用入金": `💰 初期費用のお支払いについて

{clientName}様、初期費用のお支払いをお願いいたします。

💳 お支払い金額：確認中
📅 お支払い期限：{dueDate}
🏦 振込先：別途ご案内

ご不明点がございましたらお気軽にご連絡ください。`,

  "⑦鍵渡し準備": `🔑 お鍵のお渡し準備中

{clientName}様、お鍵のお渡し準備を進めております。

📅 お渡し予定日：調整中
📍 場所：弊社オフィスまたは現地
📝 必要なもの：身分証明書

詳細な日時を調整させていただきます。`,

  "⑧鍵渡し": `🎉 お鍵のお渡し完了

{clientName}様、お疲れ様でした！
無事にお鍵をお渡しできました。

🏠 新生活の始まりですね！
何かお困りことがございましたら、いつでもご連絡ください。

今後ともよろしくお願いいたします。`,

  "⑨入居開始": `🌟 ご入居おめでとうございます！

{clientName}様、新居での生活はいかがですか？

🔧 何かお困りのことがございましたら：
• 水漏れ・電気トラブル
• 設備の不具合
• その他ご質問

24時間サポート対応いたします。`,

  "⑩契約終了": `📋 契約期間満了のお知らせ

{clientName}様、契約期間が満了となります。

✅ 次のステップ：
• 更新手続き、または
• 退去手続き

今後のご希望について確認させていただきます。`,

  "⑪フォローアップ": `💡 アフターサービスのご案内

{clientName}様、いつもお世話になっております。

🔌 おすすめサービス：
• 電気・ガス・水道の契約サポート
• インターネット回線のご紹介
• 引越し業者のご紹介

🎁 お住まいいただきありがとうございます！
心ばかりの品をお送りいたします。`,

  "⑫AD請求/着金": `💰 お取引完了のお知らせ

{clientName}様とのお取引が正式に完了いたしました。

✅ 全ての手続きが完了
💳 お支払いも確認いたしました

今後ともどうぞよろしくお願いいたします。`
};

/**
 * LINE push message を送信
 */
export async function sendLinePushMessage(
  userId: string, 
  message: string
): Promise<boolean> {
  try {
    if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
      console.log('LINE_CHANNEL_ACCESS_TOKEN not configured, skipping LINE notification');
      return false;
    }

    const response = await fetch(LINE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        to: userId,
        messages: [{
          type: 'text',
          text: message
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`LINE API error: ${response.status}`);
    }

    console.log(`LINE message sent to user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error sending LINE message:', error);
    return false;
  }
}

/**
 * フェーズ変更時のLINE通知を送信
 */
export async function sendPhaseChangeNotification(
  deal: Deal, 
  newPhase: string,
  customMessage?: string
): Promise<boolean> {
  try {
    // 顧客のLINE User IDが設定されているかチェック
    if (!deal.lineUserId) {
      console.log(`No LINE User ID for deal ${deal.id}, skipping notification`);
      return false;
    }

    // カスタムメッセージがある場合はそれを使用、なければテンプレートを使用
    let message = customMessage || LINE_MESSAGE_TEMPLATES[newPhase];
    
    if (!message) {
      console.log(`No template found for phase: ${newPhase}`);
      return false;
    }

    // メッセージ内の変数を置換
    message = message
      .replace('{clientName}', deal.client || '')
      .replace('{propertyName}', deal.title || '')
      .replace('{dueDate}', deal.dueDate || '');

    return await sendLinePushMessage(deal.lineUserId, message);
  } catch (error) {
    console.error('Error sending phase change notification:', error);
    return false;
  }
}

/**
 * メッセージテンプレートを取得
 */
export function getMessageTemplate(phase: string): string {
  return LINE_MESSAGE_TEMPLATES[phase] || '';
}

/**
 * メッセージテンプレートを更新
 */
export function updateMessageTemplate(phase: string, template: string): void {
  LINE_MESSAGE_TEMPLATES[phase] = template;
}