import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Deal } from "../../../shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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

  // メッセージテンプレートを取得
  const getTemplateMessage = async (phase: string) => {
    try {
      const response = await apiRequest(`/api/line/template/${encodeURIComponent(phase)}`);
      return response;
    } catch (error) {
      console.error("Failed to get template:", error);
      return { template: "" };
    }
  };

  // LINE通知送信
  const sendNotificationMutation = useMutation({
    mutationFn: async (data: SendLineNotificationRequest) => {
      console.log('📱 LINE通知送信中:', data);
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

  // モーダルが開かれた時にテンプレートを読み込み
  useEffect(() => {
    if (open && newPhase && deal) {
      // LINE連携済みの場合は即座にUser IDを入力
      if (deal.lineUserId) {
        setLineUserId(deal.lineUserId);
      } else {
        setLineUserId("");
      }
      
      getTemplateMessage(newPhase).then((data) => {
        let template = data.template || "";
        
        // 変数を置換
        template = template
          .replace(/{clientName}/g, deal.client || "")
          .replace(/{propertyName}/g, deal.title || "")
          .replace(/{dueDate}/g, deal.dueDate || "");
        
        setMessage(template);
      });
    }
  }, [open, newPhase, deal]);

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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <i className="fab fa-line text-green-500 text-xl"></i>
            <span>LINE通知確認・編集</span>
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
              <div>
                <span className="font-medium text-gray-600">物件:</span>
                <span className="ml-2">{deal.title}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">期日:</span>
                <span className="ml-2">{deal.dueDate}</span>
              </div>
            </div>
          </div>

          {/* LINE User ID入力 */}
          <div className="space-y-2">
            <Label htmlFor="lineUserId">LINE User ID</Label>
            <Input
              id="lineUserId"
              value={lineUserId}
              onChange={(e) => setLineUserId(e.target.value)}
              placeholder="顧客のLINE User IDを入力"
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500">
              ※ LINE Messaging APIから取得したUser IDを入力してください
            </p>
          </div>

          {/* メッセージ編集 */}
          <div className="space-y-2">
            <Label htmlFor="message">送信メッセージ</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={12}
              className="font-sans"
              placeholder="送信するメッセージを入力してください"
            />
            <p className="text-xs text-gray-500">
              変数: {"{clientName}"}, {"{propertyName}"}, {"{dueDate}"}
            </p>
          </div>

          {/* プレビュー */}
          <div className="space-y-2">
            <Label>プレビュー</Label>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <i className="fab fa-line text-green-500"></i>
                <span className="font-medium text-green-700">LINE Bot</span>
              </div>
              <div className="whitespace-pre-wrap text-sm text-gray-800">
                {message || "メッセージを入力してください"}
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex justify-between space-x-4">
            <Button variant="outline" onClick={handleSkip}>
              <i className="fas fa-times mr-2"></i>
              通知をスキップ
            </Button>
            
            <div className="flex space-x-2">
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
                    LINE通知を送信
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}