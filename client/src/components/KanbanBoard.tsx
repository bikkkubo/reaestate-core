import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Deal, PHASES, Phase } from "@shared/schema";
import { DealCard } from "./DealCard";
import { LoadingOverlay } from "./LoadingOverlay";
import { EditDealModal } from "./EditDealModal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function KanbanBoard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  const { data: deals = [], isLoading } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
  });

  const updatePhaseMutation = useMutation({
    mutationFn: async ({ id, phase }: { id: number; phase: Phase }) => {
      const response = await apiRequest("PATCH", `/api/deals/${id}`, { phase });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      toast({
        title: "成功",
        description: "案件のフェーズを更新しました",
      });
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      toast({
        variant: "destructive",
        title: "エラー",
        description: "フェーズの更新に失敗しました",
      });
    },
    // Optimistic update
    onMutate: async ({ id, phase }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/deals"] });
      const previousDeals = queryClient.getQueryData<Deal[]>(["/api/deals"]);
      
      if (previousDeals) {
        queryClient.setQueryData<Deal[]>(["/api/deals"], 
          previousDeals.map(deal => 
            deal.id === id ? { ...deal, phase } : deal
          )
        );
      }
      
      return { previousDeals };
    },
    onError: (err, variables, context) => {
      if (context?.previousDeals) {
        queryClient.setQueryData(["/api/deals"], context.previousDeals);
      }
    },
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const dealId = parseInt(result.draggableId);
    const newPhase = result.destination.droppableId as Phase;
    
    updatePhaseMutation.mutate({ id: dealId, phase: newPhase });
  };

  const getDealsByPhase = (phase: Phase): Deal[] => {
    return deals.filter(deal => deal.phase === phase);
  };

  const getPhaseStats = () => {
    const total = deals.length;
    const inProgress = deals.filter(deal => deal.phase !== "⑩契約終了").length;
    const overdue = deals.filter(deal => {
      const dueDate = new Date(deal.dueDate);
      const today = new Date();
      return dueDate < today && deal.phase !== "⑩契約終了";
    }).length;
    const completed = deals.filter(deal => deal.phase === "⑩契約終了").length;

    return { total, inProgress, overdue, completed };
  };

  const stats = getPhaseStats();

  if (isLoading) {
    return <LoadingOverlay message="データを読み込み中..." />;
  }

  return (
    <div className="p-4">
      {/* Stats Bar */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">総案件数</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
            <i className="fas fa-clipboard-list text-blue-500 text-xl"></i>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">進行中</p>
              <p className="text-2xl font-semibold text-blue-600">{stats.inProgress}</p>
            </div>
            <i className="fas fa-clock text-blue-500 text-xl"></i>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">期限超過</p>
              <p className="text-2xl font-semibold text-red-600">{stats.overdue}</p>
            </div>
            <i className="fas fa-exclamation-triangle text-red-500 text-xl"></i>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">完了</p>
              <p className="text-2xl font-semibold text-green-600">{stats.completed}</p>
            </div>
            <i className="fas fa-check-circle text-green-500 text-xl"></i>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto pb-4">
          <div className="flex space-x-4 min-w-max">
            {PHASES.map((phase) => {
              const phaseDeals = getDealsByPhase(phase);
              const isCompleted = phase === "⑩契約終了";
              
              return (
                <div
                  key={phase}
                  className="flex-shrink-0 w-80 bg-white rounded-lg shadow-sm border border-gray-200"
                >
                  <div className={`p-4 border-b border-gray-200 rounded-t-lg ${
                    isCompleted ? "bg-green-50" : "bg-gray-50"
                  }`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{phase}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isCompleted 
                          ? "bg-green-200 text-green-800" 
                          : "bg-gray-200 text-gray-700"
                      }`}>
                        {phaseDeals.length}
                      </span>
                    </div>
                  </div>

                  <Droppable droppableId={phase}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`p-3 space-y-3 min-h-96 transition-colors ${
                          snapshot.isDraggingOver ? "bg-blue-50" : ""
                        }`}
                      >
                        {phaseDeals.length === 0 ? (
                          <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
                            {isCompleted ? "完了済み案件はありません" : "カードをここにドロップ"}
                          </div>
                        ) : (
                          phaseDeals.map((deal, index) => (
                            <Draggable
                              key={deal.id}
                              draggableId={deal.id.toString()}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`${
                                    snapshot.isDragging ? "rotate-3 opacity-80" : ""
                                  }`}
                                >
                                  <DealCard 
                                    deal={deal} 
                                    isCompleted={isCompleted} 
                                    onEdit={setEditingDeal}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </div>
      </DragDropContext>

      {/* Edit Deal Modal */}
      <EditDealModal
        deal={editingDeal}
        open={!!editingDeal}
        onClose={() => setEditingDeal(null)}
      />
    </div>
  );
}
