import { Deal } from "../shared/schema";

// LINE Messaging API client setup
const LINE_API_URL = 'https://api.line.me/v2/bot/message/push';

/**
 * フェーズごとのLINEメッセージテンプレート
 */
export const LINE_MESSAGE_TEMPLATES: Record<string, string> = {
  "①申込": `{clientName}様

この度は、お申し込みをいただきありがとうございます。
書類を確認させていただき、内覧の調整をいたします。

お忙しい中恐れ入りますが、今しばらくお待ちください。`,

  "②内見調整": `{clientName}様

お世話になっております。
内覧の調整が完了いたしました。

詳細は以下になります。
日時：
内覧の順番
◯時◯分　住所に集合、物件1を内覧
◯時◯分　住所に移動、物件2を内覧
◯時◯分　住所に移動、物件3を内覧

内覧前に測っておくと便利な項目をお送りします。
- 冷蔵庫、洗濯機の縦、横、奥行き
- ベッドの縦、横、奥行き
- 食洗機等、特定の家具で必ず持っていきたいもの縦、横、奥行き

{clientName}様に当日お会いできることを楽しみにしております。

お気をつけてお越しくださいませ。`,

  "③入居審査": `{clientName}様

先日はお忙しい中、内覧をいただきありがとうございました。

現在、以下の物件の審査を進めております。
物件名：

通常ですと、審査の結果は3〜5営業日で行われます。
結果がわかり次第、すぐにご連絡をいたします。

引き続き、よろしくお願いします。`,

  "④重要事項説明": `{clientName}様

お世話になっております。
無事、審査が通りました。おめでとうございます！

ここからの流れなのですが、重要事項説明と契約を行い、初期費用の入金をいただきます。
その後、鍵の引き渡しを行い、完了となります。

重要事項説明と契約の実施住所：
Google Map：

初期費用のご請求書は以下です。

契約が完了しましたら、まずはライフラインの変更 / 新規回線手続きをおすすめいたします。

もしもご入居や退去の際にわからないことがありましたら、いつでもお気軽にお問い合わせください。

よろしくお願いします。`,

  "⑤契約": `{clientName}様

契約手続きに関するご連絡です。

詳細について別途ご連絡いたします。`,

  "⑥初期費用入金確認": `{clientName}様

お世話になっております。
初期費用の着金確認が取れました。
お忙しい中、ありがとうございます。

ここからの流れなのですが、重要事項説明と契約を行い、その後、鍵の引き渡しを行い、完了となります。

重要事項説明と契約の実施住所：
Google Map：

契約が完了しましたら、まずはライフラインの変更 / 新規回線手続きをおすすめいたします。

もしもご入居や退去の際にわからないことがありましたら、いつでもお気軽にお問い合わせください。

よろしくお願いします。`,

  "⑦鍵渡し準備": `{clientName}様

お世話になっております。

本日管理会社から連絡があり、鍵の引き渡し日が決定しました。
日時：

場所に関しては物件下、もしくは{clientName}様のご希望の場所にてお渡しができるのですが、いかがいたしましょうか。

お返事、お待ちしております。`,

  "⑧鍵渡し": `{clientName}様

鍵の引き渡しが完了いたしました。

何かご不明な点がございましたら、お気軽にご連絡ください。`,

  "⑨入居開始": `🌟 ご入居おめでとうございます！

{clientName}様、新居での生活はいかがですか？

🔧 何かお困りのことがございましたら：
• 水漏れ・電気トラブル
• 設備の不具合
• その他ご質問

24時間サポート対応いたします。`,

  "⑩契約終了": `{clientName}様

本日ご入居、おめでとうございます！

私からささやかなお祝いをお送りさせていただきます。

もしもわからないこと等ありましたら、いつでもお気軽にご連絡ください。

今後とも、よろしくお願いします。`,

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