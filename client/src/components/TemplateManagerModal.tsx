import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface TemplateManagerModalProps {
  open: boolean;
  onClose: () => void;
  onTemplateUpdate: () => void;
}

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
  }
];

export function TemplateManagerModal({ open, onClose, onTemplateUpdate }: TemplateManagerModalProps) {
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [editingTemplate, setEditingTemplate] = useState("");
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateContent, setNewTemplateContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // ローカルストレージからテンプレートを読み込み
  useEffect(() => {
    const savedTemplates = localStorage.getItem('lineMessageTemplates');
    if (savedTemplates) {
      try {
        const parsed = JSON.parse(savedTemplates);
        setTemplates(parsed);
      } catch (error) {
        console.error('Failed to parse saved templates:', error);
      }
    }
  }, [open]);

  // テンプレートをローカルストレージに保存
  const saveTemplates = (updatedTemplates: Template[]) => {
    localStorage.setItem('lineMessageTemplates', JSON.stringify(updatedTemplates));
    setTemplates(updatedTemplates);
    onTemplateUpdate();
  };

  // テンプレート選択
  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setEditingTemplate(template.template);
    setIsCreating(false);
  };

  // テンプレート更新
  const handleUpdateTemplate = () => {
    if (!selectedTemplate) return;

    const updatedTemplates = templates.map(t => 
      t.name === selectedTemplate.name 
        ? { ...t, template: editingTemplate }
        : t
    );

    saveTemplates(updatedTemplates);
    
    toast({
      title: "テンプレート更新完了",
      description: `「${selectedTemplate.name}」を更新しました`,
    });
  };

  // 新規テンプレート作成
  const handleCreateTemplate = () => {
    if (!newTemplateName.trim() || !newTemplateContent.trim()) {
      toast({
        title: "入力エラー",
        description: "テンプレート名と内容を入力してください",
        variant: "destructive",
      });
      return;
    }

    // 同名チェック
    if (templates.some(t => t.name === newTemplateName.trim())) {
      toast({
        title: "重複エラー",
        description: "同じ名前のテンプレートが既に存在します",
        variant: "destructive",
      });
      return;
    }

    const newTemplate: Template = {
      name: newTemplateName.trim(),
      template: newTemplateContent.trim(),
    };

    const updatedTemplates = [...templates, newTemplate];
    saveTemplates(updatedTemplates);

    // リセット
    setNewTemplateName("");
    setNewTemplateContent("");
    setIsCreating(false);

    toast({
      title: "テンプレート作成完了",
      description: `「${newTemplate.name}」を作成しました`,
    });
  };

  // テンプレート削除
  const handleDeleteTemplate = (templateName: string) => {
    if (DEFAULT_TEMPLATES.some(t => t.name === templateName)) {
      toast({
        title: "削除エラー",
        description: "デフォルトテンプレートは削除できません",
        variant: "destructive",
      });
      return;
    }

    const updatedTemplates = templates.filter(t => t.name !== templateName);
    saveTemplates(updatedTemplates);

    if (selectedTemplate?.name === templateName) {
      setSelectedTemplate(null);
      setEditingTemplate("");
    }

    toast({
      title: "テンプレート削除完了",
      description: `「${templateName}」を削除しました`,
    });
  };

  // デフォルトにリセット
  const handleResetToDefault = () => {
    saveTemplates(DEFAULT_TEMPLATES);
    setSelectedTemplate(null);
    setEditingTemplate("");
    setIsCreating(false);

    toast({
      title: "リセット完了",
      description: "テンプレートをデフォルトに戻しました",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <i className="fas fa-cog text-blue-600"></i>
            <span>LINEメッセージテンプレート管理</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* テンプレート一覧 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">テンプレート一覧</h3>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreating(true)}
                  className="text-green-600"
                >
                  <i className="fas fa-plus mr-1"></i>
                  新規作成
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetToDefault}
                  className="text-orange-600"
                >
                  <i className="fas fa-undo mr-1"></i>
                  デフォルトに戻す
                </Button>
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {templates.map((template) => (
                <div
                  key={template.name}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedTemplate?.name === template.name
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{template.name}</span>
                    {!DEFAULT_TEMPLATES.some(dt => dt.name === template.name) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(template.name);
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <i className="fas fa-trash text-xs"></i>
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {template.template.substring(0, 100)}...
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* テンプレート編集・作成 */}
          <div className="space-y-4">
            {isCreating ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-green-600">新規テンプレート作成</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="newTemplateName">テンプレート名</Label>
                  <Input
                    id="newTemplateName"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="例：⑧お客様フォロー"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newTemplateContent">テンプレート内容</Label>
                  <Textarea
                    id="newTemplateContent"
                    value={newTemplateContent}
                    onChange={(e) => setNewTemplateContent(e.target.value)}
                    placeholder={`{clientName}様

こちらにメッセージを入力してください。

プレースホルダー：
{clientName} - 顧客名
{propertyName} - 物件名
{dueDate} - 期限日
{phase} - フェーズ
{priority} - 優先度`}
                    className="min-h-[300px]"
                  />
                  <p className="text-xs text-gray-500">{newTemplateContent.length} 文字</p>
                </div>

                <div className="flex space-x-2">
                  <Button onClick={handleCreateTemplate} className="bg-green-600 hover:bg-green-700">
                    <i className="fas fa-save mr-2"></i>
                    作成
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    キャンセル
                  </Button>
                </div>
              </div>
            ) : selectedTemplate ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-blue-600">
                  テンプレート編集：{selectedTemplate.name}
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="editingTemplate">テンプレート内容</Label>
                  <Textarea
                    id="editingTemplate"
                    value={editingTemplate}
                    onChange={(e) => setEditingTemplate(e.target.value)}
                    className="min-h-[300px]"
                  />
                  <p className="text-xs text-gray-500">{editingTemplate.length} 文字</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">利用可能なプレースホルダー：</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <code className="bg-white p-1 rounded">{"{clientName}"}</code>
                    <span className="text-gray-500">顧客名</span>
                    <code className="bg-white p-1 rounded">{"{propertyName}"}</code>
                    <span className="text-gray-500">物件名</span>
                    <code className="bg-white p-1 rounded">{"{dueDate}"}</code>
                    <span className="text-gray-500">期限日</span>
                    <code className="bg-white p-1 rounded">{"{phase}"}</code>
                    <span className="text-gray-500">フェーズ</span>
                    <code className="bg-white p-1 rounded">{"{priority}"}</code>
                    <span className="text-gray-500">優先度</span>
                  </div>
                </div>

                <Button onClick={handleUpdateTemplate} className="bg-blue-600 hover:bg-blue-700">
                  <i className="fas fa-save mr-2"></i>
                  更新
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <i className="fas fa-arrow-left text-2xl mb-2"></i>
                  <p>左側からテンプレートを選択してください</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}