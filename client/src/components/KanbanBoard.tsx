import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Deal, PHASES, Phase } from "@shared/schema";
import { DealCard } from "./DealCard";
import { LoadingOverlay } from "./LoadingOverlay";
import { EditDealModal } from "./EditDealModal";
import { LineNotificationModal } from "./LineNotificationModal";
import { ManualLineMessageModal } from "./ManualLineMessageModal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, Clock, AlertTriangle, Heart, CheckCircle } from "lucide-react";

export function KanbanBoard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [lineNotificationData, setLineNotificationData] = useState<{
    deal: Deal;
    newPhase: string;
  } | null>(null);
  const [manualLineMessageDeal, setManualLineMessageDeal] = useState<Deal | null>(null);

  const { data: deals = [], isLoading } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
    refetchInterval: 5000, // 5秒ごとにデータを更新
    refetchIntervalInBackground: true, // バックグラウンドでも更新
    refetchOnWindowFocus: true, // ウィンドウフォーカス時に更新
  });

  // LINE連携の状態変化を監視
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
    }, 3000); // 3秒ごとにキャッシュを無効化

    return () => clearInterval(interval);
  }, [queryClient]);

  const updatePhaseMutation = useMutation({
    mutationFn: async ({ id, phase }: { id: number; phase: Phase }) => {
      const response = await apiRequest("PATCH", `/api/deals/${id}`, { phase });
      return response.json();
    },
    onSuccess: (updatedDeal, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      toast({
        title: "成功",
        description: `案件が「${variables.phase}」に移動しました`,
      });
      
      // フェーズ移動時にLINE通知ポップアップを表示
      const deal = deals.find(d => d.id === variables.id);
      if (deal) {
        setLineNotificationData({
          deal: { ...deal, phase: variables.phase },
          newPhase: variables.phase
        });
      }
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
    const deal = deals.find(d => d.id === dealId);

    if (!deal) return;

    // まずフェーズを更新
    updatePhaseMutation.mutate({ id: dealId, phase: newPhase });

    // LINE User IDが設定されている場合、LINE通知確認画面を表示
    if (deal.lineUserId) {
      setLineNotificationData({ deal, newPhase });
    }
  };

  const getDealsByPhase = (phase: Phase): Deal[] => {
    return deals.filter(deal => deal.phase === phase);
  };

  const getPhaseStats = () => {
    const total = deals.length;
    const inProgress = deals.filter(deal => !["⑩契約終了", "⑪フォローアップ", "⑫AD請求/着金"].includes(deal.phase)).length;
    const overdue = deals.filter(deal => {
      const dueDate = new Date(deal.dueDate);
      const today = new Date();
      return dueDate < today && !["⑩契約終了", "⑪フォローアップ", "⑫AD請求/着金"].includes(deal.phase);
    }).length;
    const followUp = deals.filter(deal => deal.phase === "⑪フォローアップ").length;
    const completed = deals.filter(deal => deal.phase === "⑫AD請求/着金").length;

    return { total, inProgress, overdue, followUp, completed };
  };

  const stats = getPhaseStats();

  if (isLoading) {
    return <LoadingOverlay message="データを読み込み中..." />;
  }

  return (
    <div className="w-full">
      {/* Stats Bar */}
      <div className="px-4 py-6">
        <div className="mb-8 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-white/50 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">総顧客数</p>
                <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-white/50 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">進行中</p>
                <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl shadow-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-white/50 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">期限超過</p>
                <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-white/50 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">フォローアップ</p>
                <p className="text-3xl font-bold text-purple-600">{stats.followUp}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <Heart className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-white/50 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">完了</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.completed}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="w-full overflow-x-auto pb-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex space-x-6 min-w-max px-4">
            {PHASES.map((phase) => {
              const phaseDeals = getDealsByPhase(phase);
              const isCompleted = phase === "⑫AD請求/着金";
              const isFollowUp = phase === "⑪フォローアップ";
              const isContractEnd = phase === "⑩契約終了";
              
              return (
                <div
                  key={phase}
                  className="flex-shrink-0 w-80 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/50 border border-white/50"
                >
                  <div className={`p-5 border-b border-white/30 rounded-t-2xl ${
                    isCompleted ? "bg-gradient-to-r from-emerald-100/80 to-emerald-50/80" : 
                    isFollowUp ? "bg-gradient-to-r from-purple-100/80 to-purple-50/80" :
                    isContractEnd ? "bg-gradient-to-r from-blue-100/80 to-blue-50/80" : "bg-gradient-to-r from-slate-100/80 to-slate-50/80"
                  }`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-sm">{phase}</h3>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                        isCompleted 
                          ? "bg-emerald-200/80 text-emerald-800 border border-emerald-300/50" 
                          : isFollowUp
                          ? "bg-purple-200/80 text-purple-800 border border-purple-300/50"
                          : isContractEnd
                          ? "bg-blue-200/80 text-blue-800 border border-blue-300/50"
                          : "bg-slate-200/80 text-slate-700 border border-slate-300/50"
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
                        className={`p-4 space-y-4 min-h-96 transition-all duration-300 rounded-b-2xl ${
                          snapshot.isDraggingOver ? "bg-blue-100/30 backdrop-blur-sm" : ""
                        }`}
                      >
                        {phaseDeals.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-32 text-slate-500 text-sm">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                              <div className="w-6 h-6 border-2 border-dashed border-slate-400 rounded"></div>
                            </div>
                            <p className="font-medium">
                              {isCompleted ? "完了済み案件はありません" : "カードをここにドロップ"}
                            </p>
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
                                  className={`transform transition-all duration-200 ${
                                    snapshot.isDragging ? "rotate-6 scale-105 shadow-2xl z-50" : "hover:scale-102"
                                  }`}
                                >
                                  <DealCard 
                                    deal={deal} 
                                    isCompleted={isCompleted} 
                                    onEdit={setEditingDeal}
                                    onSendLineMessage={setManualLineMessageDeal}
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
        </DragDropContext>
      </div>

      {/* Edit Deal Modal */}
      <EditDealModal
        deal={editingDeal}
        open={!!editingDeal}
        onClose={() => setEditingDeal(null)}
      />

      {/* LINE Notification Modal */}
      <LineNotificationModal
        deal={lineNotificationData?.deal || null}
        newPhase={lineNotificationData?.newPhase || null}
        open={!!lineNotificationData}
        onClose={() => setLineNotificationData(null)}
      />

      {/* Manual LINE Message Modal */}
      <ManualLineMessageModal
        deal={manualLineMessageDeal}
        open={!!manualLineMessageDeal}
        onClose={() => setManualLineMessageDeal(null)}
      />
    </div>
  );
}
