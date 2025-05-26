import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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

export function LineNotificationModal({ deal, newPhase, open, onClose }: LineNotificationModalProps) {
  const [message, setMessage] = useState("");
  const [lineUserId, setLineUserId] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      return apiRequest("/api/line/send", {
        method: "POST",
        body: JSON.stringify(data),
      });
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
  useState(() => {
    if (open && newPhase && deal) {
      getTemplateMessage(newPhase).then((data) => {
        let template = data.template || "";
        
        // 変数を置換
        template = template
          .replace(/{clientName}/g, deal.client || "")
          .replace(/{propertyName}/g, deal.title || "")
          .replace(/{dueDate}/g, deal.dueDate || "");
        
        setMessage(template);
        // LINE連携済みの場合は自動でUser IDを入力
        setLineUserId(deal.lineUserId || "");
      });
    }
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