// テンプレートユーティリティ関数

interface Template {
  name: string;
  template: string;
}

const DEFAULT_TEMPLATES: Template[] = [
  {
    name: "①申込",
    template: `{clientName}様

この度は、お申し込みをいただきありがとうございます。
書類を確認させていただき、内覧の調整をいたします。

お忙しい中恐れ入りますが、今しばらくお待ちください。`
  },
  {
    name: "②内見調整",
    template: `{clientName}様

お世話になっております。
内覧の調整が完了いたしました。

詳細は以下になります。
日時：
内覧の順番
◯時◯分　住所に集合、物件1を内覧
◯時◯分　住所に移動、物件2を内覧
◯時◯分　住所に移動、物件3を内覧

{clientName}様に当日お会いできることを楽しみにしております。

お気をつけてお越しくださいませ。`
  },
  {
    name: "③入居審査",
    template: `{clientName}様

先日はお忙しい中、内覧をいただきありがとうございました。

現在、以下の物件の審査を進めております。
物件名：

通常ですと、審査の結果は3〜5営業日で行われます。
結果がわかり次第、すぐにご連絡をいたします。

引き続き、よろしくお願いします。`
  },
  {
    name: "④重要事項説明",
    template: `{clientName}様

お世話になっております。
無事、審査が通りました。おめでとうございます！

ここからの流れなのですが、重要事項説明と契約を行い、初期費用の入金をいただきます。
その後、鍵の引き渡しを行い、完了となります。

重要事項説明と契約の実施住所：
Google Map：

よろしくお願いします。`
  },
  {
    name: "⑥初期費用入金確認",
    template: `{clientName}様

お世話になっております。
初期費用の着金確認が取れました。
お忙しい中、ありがとうございます。

ここからの流れなのですが、重要事項説明と契約を行い、その後、鍵の引き渡しを行い、完了となります。

よろしくお願いします。`
  },
  {
    name: "⑦鍵渡し準備",
    template: `{clientName}様

お世話になっております。

本日管理会社から連絡があり、鍵の引き渡し日が決定しました。
日時：

場所に関しては物件下、もしくは{clientName}様のご希望の場所にてお渡しができるのですが、いかがいたしましょうか。

お返事、お待ちしております。`
  },
  {
    name: "⑩契約終了",
    template: `{clientName}様

本日ご入居、おめでとうございます！

私からささやかなお祝いをお送りさせていただきます。

もしもわからないこと等ありましたら、いつでもお気軽にご連絡ください。

今後とも、よろしくお願いします。`
  },
  {
    name: "カスタム",
    template: `{clientName}様

こちらにメッセージを入力してください。`
  }
];

/**
 * ローカルストレージからテンプレートを取得
 */
export function getTemplates(): Template[] {
  try {
    const savedTemplates = localStorage.getItem('lineMessageTemplates');
    if (savedTemplates) {
      return JSON.parse(savedTemplates);
    }
    return DEFAULT_TEMPLATES;
  } catch (error) {
    console.error('Failed to load templates:', error);
    return DEFAULT_TEMPLATES;
  }
}

/**
 * テンプレートをローカルストレージに保存
 */
export function saveTemplates(templates: Template[]): void {
  localStorage.setItem('lineMessageTemplates', JSON.stringify(templates));
}

/**
 * 特定の名前のテンプレートを取得
 */
export function getTemplateByName(name: string): Template | undefined {
  const templates = getTemplates();
  return templates.find(t => t.name === name);
}

/**
 * デフォルトテンプレートかどうかを判定
 */
export function isDefaultTemplate(name: string): boolean {
  return DEFAULT_TEMPLATES.some(t => t.name === name);
}

export type { Template };
export { DEFAULT_TEMPLATES };