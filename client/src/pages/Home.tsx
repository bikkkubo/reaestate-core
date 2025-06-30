import { useState } from "react";
import { KanbanBoard } from "@/components/KanbanBoard";
import { LineConnectionDashboard } from "@/components/LineConnectionDashboard";
import { AddDealModal } from "@/components/AddDealModal";
import { TemplateManagerModal } from "@/components/TemplateManagerModal";
import { Button } from "@/components/ui/button";
import { Building2, Settings, RefreshCw, Bell, Plus, CheckCircle, BarChart3, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [templateUpdateKey, setTemplateUpdateKey] = useState(0);
  const [currentView, setCurrentView] = useState<'kanban' | 'dashboard'>('kanban');

  // Fetch deals data for the dashboard
  const { data: deals = [], refetch: refetchDeals } = useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      const response = await fetch('/api/deals');
      if (!response.ok) throw new Error('Failed to fetch deals');
      return response.json();
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-40 shadow-lg shadow-slate-200/50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    不動産賃貸管理
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">案件進捗管理システム</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* View Toggle */}
              <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                <button
                  onClick={() => setCurrentView('kanban')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentView === 'kanban'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>案件管理</span>
                </button>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentView === 'dashboard'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>LINE連携</span>
                </button>
              </div>
              
              <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                <CheckCircle className="h-3 w-3 text-emerald-500" />
                <span className="text-xs font-medium text-emerald-700">同期完了</span>
              </div>
              
              <Button
                onClick={() => setIsTemplateManagerOpen(true)}
                variant="outline"
                size="sm"
                className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 shadow-sm"
              >
                <Settings className="h-4 w-4 mr-2" />
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
                size="sm"
                className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 shadow-sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
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
                size="sm"
                className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300 shadow-sm"
              >
                <Bell className="h-4 w-4 mr-2" />
                <span className="hidden sm:block">Slack通知テスト</span>
              </Button>
              
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:block font-medium">新規案件</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full">
        {currentView === 'kanban' ? (
          <KanbanBoard />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <LineConnectionDashboard 
              deals={deals} 
              onRefresh={() => refetchDeals()} 
            />
          </div>
        )}
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
