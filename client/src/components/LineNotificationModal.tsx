import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Deal } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface LineNotificationModalProps {
  deal: Deal | null;
  newPhase: string | null;
  open: boolean;
  onClose: () => void;
}

interface SendLineNotificationRequest {
  dealId: number;
  phase: string;
  message: string;
  lineUserId?: string;
}

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

export function LineNotificationModal({ deal, newPhase, open, onClose }: LineNotificationModalProps) {
  const [message, setMessage] = useState("");
  const [lineUserId, setLineUserId] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
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

  useEffect(() => {
    if (deal && newPhase && open) {
      setLineUserId(deal.lineUserId || "");
      // 現在のフェーズに対応するテンプレートを自動選択
      const phaseTemplate = MESSAGE_TEMPLATES.find(t => t.name === newPhase);
      if (phaseTemplate) {
        setSelectedTemplate(newPhase);
        const processedMessage = replacePlaceholders(phaseTemplate.template, deal);
        setMessage(processedMessage);
      } else {
        // フェーズに対応するテンプレートがない場合は、カスタムを選択
        setSelectedTemplate("カスタム");
        const customMessage = replacePlaceholders(MESSAGE_TEMPLATES.find(t => t.name === "カスタム")?.template || "", deal);
        setMessage(customMessage);
      }
    }
  }, [deal, newPhase, open]);

  // LINE通知送信
  const sendNotificationMutation = useMutation({
    mutationFn: async (data: SendLineNotificationRequest) => {
      console.log('📱 フェーズ変更LINE通知送信中:', data);
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
    if (!deal || !newPhase) return;

    // LINE User IDが設定されていない場合の警告
    if (!lineUserId.trim()) {
      toast({
        title: "LINE User ID未設定",
        description: "LINE User IDを入力してください",
        variant: "destructive",
      });
      return;
    }

    sendNotificationMutation.mutate({
      dealId: deal.id,
      phase: newPhase,
      message: message.trim(),
      lineUserId: lineUserId.trim(),
    });
  };

  const handleSkip = () => {
    toast({
      title: "通知をスキップ",
      description: "LINE通知を送信せずにフェーズを更新しました",
    });
    onClose();
  };

  if (!deal || !newPhase) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <i className="fab fa-line text-green-500 text-xl"></i>
            <span>フェーズ変更通知 - {deal.client}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 案件情報 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">顧客名:</span>
                <span className="ml-2">{deal.client}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">新フェーズ:</span>
                <span className="ml-2 font-medium text-blue-600">{newPhase}</span>
              </div>
            </div>
          </div>

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
              className="font-mono"
            />
            {!lineUserId && (
              <p className="text-sm text-amber-600">
                <i className="fas fa-exclamation-triangle mr-1"></i>
                LINE通知を送信するにはLINE User IDが必要です
              </p>
            )}
          </div>

          {/* メッセージプレビュー */}
          <div className="space-y-2">
            <Label htmlFor="message">送信メッセージ</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="メッセージを確認・編集してください"
              className="min-h-[200px]"
            />
            <p className="text-xs text-gray-500">{message.length} 文字</p>
          </div>

          {/* アクション */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleSkip}>
              スキップ
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