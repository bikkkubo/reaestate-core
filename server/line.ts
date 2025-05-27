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

/**
 * LINE Webhook処理 - 顧客からのメッセージを受信
 */
export async function handleLineWebhook(body: any): Promise<boolean> {
  try {
    const events = body.events;
    
    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const userId = event.source.userId;
        const messageText = event.message.text.trim();
        
        // 顧客登録プロセスを処理
        await processCustomerRegistration(userId, messageText);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error handling LINE webhook:', error);
    return false;
  }
}

/**
 * 顧客登録プロセス - 名前から案件を検索して紐付け
 */
async function processCustomerRegistration(userId: string, messageText: string): Promise<void> {
  try {
    const { storage } = await import('./storage');
    
    // 既に登録済みかチェック
    const deals = await storage.getAllDeals();
    const existingDeal = deals.find(deal => deal.lineUserId === userId);
    
    if (existingDeal) {
      // 既に登録済みの場合、現在のステータスを通知
      await sendLinePushMessage(userId, 
        `${existingDeal.client}様、いつもお世話になっております。\n\n` +
        `現在のお手続き状況：${existingDeal.phase}\n\n` +
        `何かご不明点がございましたら、お気軽にお声かけください。`
      );
      return;
    }
    
    // 名前で案件を検索（部分一致）
    const matchingDeals = deals.filter(deal => 
      deal.client && deal.client.includes(messageText)
    );
    
    if (matchingDeals.length === 1) {
      // 1件だけマッチした場合、自動で紐付け
      const deal = matchingDeals[0];
      console.log(`🔗 LINE連携: ${deal.client}様 (ID: ${deal.id}) にUser ID ${userId} を紐付け中...`);
      
      const updatedDeal = await storage.updateDeal(deal.id, { lineUserId: userId });
      
      if (updatedDeal) {
        console.log(`✅ LINE連携完了: ${deal.client}様のLine User IDが正常に更新されました`);
      } else {
        console.error(`❌ LINE連携失敗: Deal ${deal.id} の更新に失敗しました`);
      }
      
      await sendLinePushMessage(userId,
        `${deal.client}様、ご登録ありがとうございます！\n\n` +
        `お客様の案件情報を確認いたしました。\n` +
        `現在のお手続き状況：${deal.phase}\n\n` +
        `今後、お手続きの進捗状況をこちらのLINEでお知らせいたします。\n` +
        `よろしくお願いいたします。`
      );
      
    } else if (matchingDeals.length > 1) {
      // 複数マッチした場合、選択肢を提示
      let message = `${messageText}様、ありがとうございます。\n\n` +
        `複数の案件が見つかりました。該当する番号を送信してください：\n\n`;
      
      matchingDeals.forEach((deal, index) => {
        message += `${index + 1}. ${deal.client}様 - ${deal.title || '物件情報準備中'}\n`;
      });
      
      await sendLinePushMessage(userId, message);
      
      // 一時的に選択待ち状態を保存（実装簡略化のため、ここでは省略）
      
    } else {
      // マッチしなかった場合、登録案内
      await sendLinePushMessage(userId,
        `お疲れ様です！\n\n` +
        `お客様の情報を紐づけいたしますので、いくつかご質問をさせていただきます。\n\n` +
        `Q.1 お客様のお名前（フルネーム）をお教えください\n\n` +
        `例：田中太郎\n\n` +
        `※既にお申込み済みのお名前をご入力ください。`
      );
    }
    
  } catch (error) {
    console.error('Error processing customer registration:', error);
    await sendLinePushMessage(userId,
      `申し訳ございません。システムエラーが発生いたしました。\n` +
      `お手数をおかけしますが、直接お電話にてお問い合わせください。`
    );
  }
}

/**
 * LINE Webhook署名検証
 */
export function verifyLineSignature(body: string, signature: string): boolean {
  try {
    if (!process.env.LINE_CHANNEL_SECRET) {
      console.log('LINE_CHANNEL_SECRET not configured');
      return false;
    }
    
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('SHA256', process.env.LINE_CHANNEL_SECRET)
      .update(body)
      .digest('base64');
    
    return hash === signature;
  } catch (error) {
    console.error('Error verifying LINE signature:', error);
    return false;
  }
}