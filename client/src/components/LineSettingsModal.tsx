import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LineSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function LineSettingsModal({ open, onClose }: LineSettingsModalProps) {
  const [webhookUrl] = useState(() => {
    const currentUrl = window.location.origin;
    return `${currentUrl}/api/line/webhook`;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <i className="fab fa-line text-green-500 text-xl"></i>
            <span>LINE連携設定</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Webhook URL設定 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">1. Webhook URL設定</CardTitle>
              <CardDescription>
                LINE Developersコンソールで以下のURLを設定してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <div className="flex space-x-2">
                  <Input 
                    value={webhookUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => copyToClipboard(webhookUrl)}
                  >
                    <i className="fas fa-copy mr-2"></i>
                    コピー
                  </Button>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">設定手順：</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                  <li>LINE Developersコンソールにアクセス</li>
                  <li>作成したチャンネルの「Messaging API」タブを開く</li>
                  <li>「Webhook URL」に上記URLを設定</li>
                  <li>「Webhookの利用」を有効にする</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* 顧客登録フロー */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">2. 顧客登録フロー</CardTitle>
              <CardDescription>
                顧客がLINEで名前を送信すると自動で案件に紐付けされます
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="outline" className="bg-green-100 text-green-700">
                      ステップ1
                    </Badge>
                  </div>
                  <h4 className="font-medium mb-2">名前送信</h4>
                  <p className="text-sm text-gray-600">
                    顧客がLINEで自分の名前を送信
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="outline" className="bg-blue-100 text-blue-700">
                      ステップ2
                    </Badge>
                  </div>
                  <h4 className="font-medium mb-2">自動マッチング</h4>
                  <p className="text-sm text-gray-600">
                    システムが既存案件から名前を検索
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="outline" className="bg-purple-100 text-purple-700">
                      ステップ3
                    </Badge>
                  </div>
                  <h4 className="font-medium mb-2">自動紐付け</h4>
                  <p className="text-sm text-gray-600">
                    LINE User IDが案件に自動登録
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* メッセージサンプル */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">3. 自動応答メッセージ例</CardTitle>
              <CardDescription>
                顧客の状況に応じて自動で適切なメッセージを送信
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                  <div className="font-medium text-green-800 mb-1">
                    ✅ 案件が見つかった場合
                  </div>
                  <div className="text-sm text-green-700">
                    "田中太郎様、ご登録ありがとうございます！<br/>
                    現在のお手続き状況：②入居審査<br/>
                    今後、進捗状況をLINEでお知らせいたします。"
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                  <div className="font-medium text-yellow-800 mb-1">
                    ⚠️ 複数案件が見つかった場合
                  </div>
                  <div className="text-sm text-yellow-700">
                    "田中様、複数の案件が見つかりました。<br/>
                    該当する番号を送信してください：<br/>
                    1. 田中太郎様 - 新宿区マンション<br/>
                    2. 田中花子様 - 渋谷区アパート"
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <div className="font-medium text-blue-800 mb-1">
                    📝 案件が見つからない場合
                  </div>
                  <div className="text-sm text-blue-700">
                    "お疲れ様です！<br/>
                    お客様の情報を紐づけいたします。<br/>
                    Q.1 お客様のお名前（フルネーム）をお教えください"
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 注意事項 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-orange-600">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                重要な注意事項
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                <li>Webhook URLは必ずHTTPS（SSL）で設定してください</li>
                <li>LINE Developersで「自動応答メッセージ」は無効にしてください</li>
                <li>「Webhook検証」で正常に動作することを確認してください</li>
                <li>本番環境でのテスト前に、必ず開発環境で動作確認を行ってください</li>
              </ul>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={onClose}>
              <i className="fas fa-check mr-2"></i>
              設定完了
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}