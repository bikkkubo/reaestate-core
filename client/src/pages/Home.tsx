import { useState } from "react";
import { KanbanBoard } from "@/components/KanbanBoard";
import { AddDealModal } from "@/components/AddDealModal";
import { TemplateManagerModal } from "@/components/TemplateManagerModal";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [templateUpdateKey, setTemplateUpdateKey] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <i className="fas fa-building text-blue-600 text-xl"></i>
                <h1 className="text-xl font-semibold text-gray-900">不動産賃貸管理</h1>
              </div>
              <span className="text-sm text-gray-500 hidden sm:block">案件進捗管理システム</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>同期完了</span>
              </div>
              <Button
                onClick={() => setIsTemplateManagerOpen(true)}
                variant="outline"
                className="text-purple-600 border-purple-600 hover:bg-purple-50"
              >
                <i className="fas fa-cog text-sm mr-2"></i>
                <span className="hidden sm:block">テンプレート管理</span>
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/ledger/sync-all', { method: 'POST' });
                    const result = await response.json();
                    alert(`契約完了案件の取引台帳同期完了: ${result.sentCount}件送信、${result.skippedCount}件スキップ`);
                  } catch (error) {
                    alert('取引台帳同期に失敗しました');
                  }
                }}
                variant="outline"
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                <i className="fas fa-sync text-sm mr-2"></i>
                <span className="hidden sm:block">取引台帳同期</span>
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/notifications/test', { method: 'POST' });
                    const result = await response.json();
                    alert(`Slack通知テスト完了: ${result.sentCount}件の案件に通知を送信しました`);
                  } catch (error) {
                    alert('Slack通知の送信に失敗しました');
                  }
                }}
                variant="outline"
                className="text-orange-600 border-orange-600 hover:bg-orange-50"
              >
                <i className="fas fa-bell text-sm mr-2"></i>
                <span className="hidden sm:block">Slack通知テスト</span>
              </Button>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <i className="fas fa-plus text-sm"></i>
                <span className="hidden sm:block">新規案件</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full">
        <KanbanBoard />
      </main>

      {/* Add Deal Modal */}
      <AddDealModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Template Manager Modal */}
      <TemplateManagerModal
        open={isTemplateManagerOpen}
        onClose={() => setIsTemplateManagerOpen(false)}
        onTemplateUpdate={() => setTemplateUpdateKey(prev => prev + 1)}
      />
    </div>
  );
}
