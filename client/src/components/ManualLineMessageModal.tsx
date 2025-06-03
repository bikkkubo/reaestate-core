import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Deal } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ManualLineMessageModalProps {
  deal: Deal | null;
  open: boolean;
  onClose: () => void;
}

interface SendLineNotificationRequest {
  dealId: number;
  phase: string;
  message: string;
  lineUserId?: string;
}

// 利用可能なプレースホルダー
const AVAILABLE_PLACEHOLDERS = [
  { key: "{clientName}", description: "顧客名", example: "田中太郎様" },
  { key: "{propertyName}", description: "物件名", example: "○○マンション101号室" },
  { key: "{dueDate}", description: "期限日", example: "2025年5月30日" },
  { key: "{phase}", description: "現在のフェーズ", example: "②内見調整" },
  { key: "{priority}", description: "優先度", example: "高" },
  { key: "{customerChecklistUrl}", description: "顧客チェックリストURL", example: "https://example.com/checklist" },
];

// 定型テンプレート
const MESSAGE_TEMPLATES = [
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

export function ManualLineMessageModal({ deal, open, onClose }: ManualLineMessageModalProps) {
  const [message, setMessage] = useState("");
  const [lineUserId, setLineUserId] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // プレースホルダーを実際の値に置換
  const replacePlaceholders = (text: string, dealData: Deal): string => {
    let result = text;
    result = result.replace(/{clientName}/g, dealData.client || "お客様");
    result = result.replace(/{propertyName}/g, dealData.title || "物件");
    result = result.replace(/{dueDate}/g, new Date(dealData.dueDate).toLocaleDateString('ja-JP'));
    result = result.replace(/{phase}/g, dealData.phase || "");
    result = result.replace(/{priority}/g, dealData.priority || "");
    result = result.replace(/{customerChecklistUrl}/g, dealData.customerChecklistUrl || "");
    return result;
  };

  // テンプレート選択時の処理
  const handleTemplateSelect = (templateName: string) => {
    setSelectedTemplate(templateName);
    const template = MESSAGE_TEMPLATES.find(t => t.name === templateName);
    if (template && deal) {
      const processedMessage = replacePlaceholders(template.template, deal);
      setMessage(processedMessage);
    }
  };

  // プレースホルダー挿入
  const insertPlaceholder = (placeholder: string) => {
    setMessage(prev => prev + placeholder);
  };

  useEffect(() => {
    if (deal && open) {
      setLineUserId(deal.lineUserId || "");
      setMessage("");
      setSelectedTemplate("");
    }
  }, [deal, open]);

  // LINE通知送信
  const sendNotificationMutation = useMutation({
    mutationFn: async (data: SendLineNotificationRequest) => {
      console.log('📱 手動LINE通知送信中:', data);
      const response = await fetch("/api/line/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "LINE通知送信完了",
        description: "顧客にLINE通知を送信しました",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "送信エラー",
        description: "LINE通知の送信に失敗しました",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!deal || !message.trim() || !lineUserId.trim()) {
      toast({
        title: "入力エラー",
        description: "メッセージとLINE User IDを入力してください",
        variant: "destructive",
      });
      return;
    }

    sendNotificationMutation.mutate({
      dealId: deal.id,
      phase: deal.phase,
      message: message.trim(),
      lineUserId: lineUserId.trim(),
    });
  };

  if (!deal) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <i className="fab fa-line text-green-600"></i>
            <span>LINE手動送信 - {deal.client}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* テンプレート選択 */}
          <div className="space-y-2">
            <Label htmlFor="template">メッセージテンプレート</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="テンプレートを選択してください" />
              </SelectTrigger>
              <SelectContent>
                {MESSAGE_TEMPLATES.map((template) => (
                  <SelectItem key={template.name} value={template.name}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* LINE User ID */}
          <div className="space-y-2">
            <Label htmlFor="lineUserId">LINE User ID</Label>
            <Input
              id="lineUserId"
              value={lineUserId}
              onChange={(e) => setLineUserId(e.target.value)}
              placeholder="LINE User IDを入力"
            />
          </div>

          {/* プレースホルダーヘルプ */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Label>プレースホルダー</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHelp(!showHelp)}
                className="text-xs"
              >
                <i className="fas fa-question-circle mr-1"></i>
                ヘルプ
              </Button>
            </div>
            
            {showHelp && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-sm text-gray-600 mb-3">以下のプレースホルダーがデータベースから自動で置換されます：</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {AVAILABLE_PLACEHOLDERS.map((placeholder) => (
                    <div key={placeholder.key} className="flex items-center justify-between bg-white p-2 rounded border">
                      <div className="flex-1">
                        <code className="text-blue-600 font-mono text-xs">{placeholder.key}</code>
                        <p className="text-xs text-gray-600">{placeholder.description} (例: {placeholder.example})</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => insertPlaceholder(placeholder.key)}
                        className="text-xs ml-2"
                      >
                        挿入
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* メッセージ入力 */}
          <div className="space-y-2">
            <Label htmlFor="message">送信メッセージ</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="メッセージを入力してください"
              className="min-h-[200px]"
            />
            <p className="text-xs text-gray-500">{message.length} 文字</p>
          </div>

          {/* アクション */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button 
              onClick={handleSend}
              disabled={sendNotificationMutation.isPending || !message.trim() || !lineUserId.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {sendNotificationMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  送信中...
                </>
              ) : (
                <>
                  <i className="fab fa-line mr-2"></i>
                  LINE送信
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}