import { useState } from "react";
import { KanbanBoard } from "@/components/KanbanBoard";
import { AddDealModal } from "@/components/AddDealModal";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
      <main className="max-w-7xl mx-auto">
        <KanbanBoard />
      </main>

      {/* Add Deal Modal */}
      <AddDealModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
