import { Deal, PRIORITY_COLORS } from "@shared/schema";
import { format, isAfter, differenceInDays } from "date-fns";
import { ja } from "date-fns/locale";

interface DealCardProps {
  deal: Deal;
  isCompleted?: boolean;
  onEdit?: (deal: Deal) => void;
  onSendLineMessage?: (deal: Deal) => void;
}

export function DealCard({ deal, isCompleted = false, onEdit, onSendLineMessage }: DealCardProps) {
  const dueDate = new Date(deal.dueDate);
  const today = new Date();
  const isOverdue = isAfter(today, dueDate) && !isCompleted;
  const daysUntilDue = differenceInDays(dueDate, today);

  const getPriorityColor = (priority: string) => {
    return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || "bg-gray-500";
  };

  const getRelativeTime = () => {
    if (isOverdue) return "期限超過";
    if (daysUntilDue === 0) return "今日";
    if (daysUntilDue === 1) return "明日";
    if (daysUntilDue <= 7) return `${daysUntilDue}日後`;
    if (daysUntilDue <= 30) return `${Math.ceil(daysUntilDue / 7)}週間後`;
    return `${Math.ceil(daysUntilDue / 30)}ヶ月後`;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Only trigger edit if clicking on the card itself, not during drag
    if (onEdit && !e.defaultPrevented) {
      onEdit(deal);
    }
  };

  return (
    <div 
      className={`group border rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing ${
        isCompleted 
          ? "bg-gray-50 border-gray-200 opacity-75" 
          : "bg-white border-gray-200"
      }`}
      onClick={handleCardClick}
    >
      <div className="flex">
        <div className={`w-1 rounded-sm mr-3 ${getPriorityColor(deal.priority)}`}></div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className={`font-semibold text-base text-gray-900 ${
                isCompleted ? "line-through text-gray-600" : ""
              }`}>
                {deal.client || "未設定の顧客"}
              </h4>
              {deal.title && (
                <p className={`text-sm text-gray-600 mt-1 ${
                  isCompleted ? "line-through" : ""
                }`}>
                  {deal.title}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-1 ml-2">
              {!isCompleted && (
                <>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    deal.priority === "高" 
                      ? "bg-red-100 text-red-800"
                      : deal.priority === "中"
                      ? "bg-yellow-100 text-yellow-800" 
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {deal.priority}
                  </span>
                  {isOverdue && (
                    <i className="fas fa-exclamation-triangle text-orange-500 text-xs" title="期限超過"></i>
                  )}
                </>
              )}
              {isCompleted && (
                <i className="fas fa-check-circle text-green-500 text-sm"></i>
              )}
              {deal.lineUserId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSendLineMessage) onSendLineMessage(deal);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-green-100"
                  title="LINE送信"
                >
                  <i className="fab fa-line text-xs text-green-600 hover:text-green-800"></i>
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEdit) onEdit(deal);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100"
                title="編集"
              >
                <i className="fas fa-edit text-xs text-gray-500 hover:text-blue-600"></i>
              </button>
            </div>
          </div>
          
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex items-center">
              <i className={`fas mr-1 ${isCompleted ? "fa-check" : "fa-calendar-alt"}`}></i>
              <span className="text-sm font-bold text-gray-800">
                {isCompleted 
                  ? `${format(dueDate, "yyyy/MM/dd", { locale: ja })} 完了`
                  : format(dueDate, "yyyy/MM/dd", { locale: ja })
                }
              </span>
            </div>
            
            {deal.phase === "⑪フォローアップ" && (
              <div className="bg-blue-50 p-2 rounded text-xs mb-2">
                <div className="font-medium text-blue-900 mb-1">フォローアップ内容:</div>
                <div className="text-blue-800 space-y-1">
                  <div>• ライフライン契約サポート</div>
                  <div>• 引っ越し祝い送付</div>
                  {deal.notes && <div>• {deal.notes}</div>}
                </div>
              </div>
            )}

            {deal.title && (
              <div className="flex items-center">
                <i className="fas fa-building mr-1"></i>
                <span className="text-sm text-gray-600">{deal.title}</span>
              </div>
            )}

            {deal.lineUserId && (
              <div className="flex items-center">
                <i className="fab fa-line mr-1 text-green-600"></i>
                <span className="text-xs text-green-600">LINE連携済み</span>
              </div>
            )}
            
            {!isCompleted && (
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    isOverdue 
                      ? "bg-red-50 text-red-600" 
                      : daysUntilDue <= 3
                      ? "bg-orange-50 text-orange-600"
                      : "bg-gray-50 text-gray-600"
                  }`}>
                    {getRelativeTime()}
                  </span>
                  {!isOverdue && (
                    <span className="text-xs text-gray-500 mt-1">
                      {daysUntilDue === 0 ? "今日が期限" : 
                       daysUntilDue === 1 ? "明日が期限" :
                       `あと${daysUntilDue}日`}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
