import { Deal, PRIORITY_COLORS } from "@shared/schema";
import { format, isAfter, differenceInDays } from "date-fns";
import { ja } from "date-fns/locale";

interface DealCardProps {
  deal: Deal;
  isCompleted?: boolean;
}

export function DealCard({ deal, isCompleted = false }: DealCardProps) {
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

  return (
    <div className={`border rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing ${
      isCompleted 
        ? "bg-gray-50 border-gray-200 opacity-75" 
        : "bg-white border-gray-200"
    }`}>
      <div className="flex">
        <div className={`w-1 rounded-sm mr-3 ${getPriorityColor(deal.priority)}`}></div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h4 className={`font-medium text-sm text-gray-900 ${
              isCompleted ? "line-through text-gray-600" : ""
            }`}>
              {deal.title}
            </h4>
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
            
            {deal.client && (
              <div className="flex items-center">
                <i className="fas fa-user mr-1"></i>
                <span>{deal.client}</span>
              </div>
            )}
            
            {!isCompleted && (
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded text-xs ${
                  isOverdue 
                    ? "bg-red-50 text-red-600" 
                    : "text-gray-500"
                }`}>
                  {getRelativeTime()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
