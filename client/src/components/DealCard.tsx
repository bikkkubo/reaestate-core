import { Deal, PRIORITY_COLORS } from "@shared/schema";
import { format, isAfter, differenceInDays } from "date-fns";
import { ja } from "date-fns/locale";
import { Calendar, ExternalLink, Edit3, MessageCircle, CheckCircle2, AlertTriangle, User } from "lucide-react";

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
      className={`group relative rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-grab active:cursor-grabbing border backdrop-blur-sm ${
        isCompleted 
          ? "bg-slate-100/60 border-slate-200/60 opacity-80" 
          : "bg-white/80 border-white/60 hover:bg-white/90"
      }`}
      onClick={handleCardClick}
    >
      <div className="flex">
        <div className={`w-1.5 rounded-full mr-4 ${getPriorityColor(deal.priority)} shadow-sm`}></div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <User className="h-4 w-4 text-slate-500" />
                <h4 className={`font-bold text-slate-900 ${
                  isCompleted ? "line-through text-slate-600" : ""
                }`}>
                  {deal.client || "未設定の顧客"}
                </h4>
              </div>
              {deal.title && (
                <p className={`text-sm text-slate-600 ml-6 ${
                  isCompleted ? "line-through" : ""
                }`}>
                  {deal.title}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2 ml-2">
              {!isCompleted && (
                <>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border ${
                    deal.priority === "高" 
                      ? "bg-red-100/80 text-red-800 border-red-200"
                      : deal.priority === "中"
                      ? "bg-amber-100/80 text-amber-800 border-amber-200" 
                      : "bg-slate-100/80 text-slate-700 border-slate-200"
                  }`}>
                    {deal.priority}
                  </span>
                  {isOverdue && (
                    <div className="p-1.5 bg-orange-100 rounded-full">
                      <AlertTriangle className="h-3 w-3 text-orange-600" />
                    </div>
                  )}
                </>
              )}
              {isCompleted && (
                <div className="p-1.5 bg-emerald-100 rounded-full">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="absolute top-3 right-3 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {deal.lineUserId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSendLineMessage) onSendLineMessage(deal);
                }}
                className="p-2 bg-emerald-100/80 hover:bg-emerald-200/80 rounded-xl transition-colors border border-emerald-200"
                title="LINE送信"
              >
                <MessageCircle className="h-3 w-3 text-emerald-700" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onEdit) onEdit(deal);
              }}
              className="p-2 bg-slate-100/80 hover:bg-slate-200/80 rounded-xl transition-colors border border-slate-200"
              title="編集"
            >
              <Edit3 className="h-3 w-3 text-slate-700" />
            </button>
          </div>
          
          <div className="text-xs text-slate-600 space-y-3 mt-4">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-100/60 rounded-lg">
                <Calendar className="h-3 w-3 text-blue-600" />
              </div>
              <span className="text-sm font-bold text-slate-800">
                {isCompleted 
                  ? `${format(dueDate, "yyyy/MM/dd", { locale: ja })} 完了`
                  : format(dueDate, "yyyy/MM/dd", { locale: ja })
                }
              </span>
            </div>
            
            {deal.phase === "⑩フォローアップ" && (
              <div className="bg-gradient-to-br from-blue-50/80 to-blue-100/60 p-3 rounded-xl border border-blue-200/50 backdrop-blur-sm">
                <div className="font-bold text-blue-900 mb-2 text-sm">フォローアップ内容:</div>
                <div className="text-blue-800 space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className={`h-3 w-3 ${deal.followUpContractPayment === "true" ? "text-emerald-600" : "text-slate-400"}`} />
                    <span className="text-xs">契約金</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className={`h-3 w-3 ${deal.followUpResidentCard === "true" ? "text-emerald-600" : "text-slate-400"}`} />
                    <span className="text-xs">住民票</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className={`h-3 w-3 ${deal.followUpMyNumber === "true" ? "text-emerald-600" : "text-slate-400"}`} />
                    <span className="text-xs">マイナンバー</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className={`h-3 w-3 ${deal.followUpUtilities === "true" ? "text-emerald-600" : "text-slate-400"}`} />
                    <span className="text-xs">ライフラインの連絡</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className={`h-3 w-3 ${deal.followUpGift === "true" ? "text-emerald-600" : "text-slate-400"}`} />
                    <span className="text-xs">引っ越し祝い送付</span>
                  </div>
                  {deal.followUpOther && (
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                      <span className="text-xs">{deal.followUpOther}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {deal.phase === "⑪AD請求/着金" && (
              <div className="bg-gradient-to-br from-emerald-50/80 to-emerald-100/60 p-3 rounded-xl border border-emerald-200/50 backdrop-blur-sm">
                <div className="font-bold text-emerald-900 mb-2 text-sm">AD請求/着金情報:</div>
                <div className="text-emerald-800 space-y-2">
                  {deal.adAmount && (
                    <div className="flex items-center space-x-2">
                      <div className="p-1 bg-emerald-200/60 rounded">
                        <span className="text-xs">¥</span>
                      </div>
                      <span className="text-xs">金額: {deal.adAmount.toLocaleString()}円</span>
                    </div>
                  )}
                  {deal.invoiceDate && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3 text-emerald-700" />
                      <span className="text-xs">請求日: {format(new Date(deal.invoiceDate), "yyyy/MM/dd", { locale: ja })}</span>
                    </div>
                  )}
                  {deal.expectedPaymentDate && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3 text-emerald-700" />
                      <span className="text-xs">入金予定: {format(new Date(deal.expectedPaymentDate), "yyyy/MM/dd", { locale: ja })}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className={`h-3 w-3 ${deal.paymentConfirmed === "true" ? "text-emerald-600" : "text-orange-500"}`} />
                    <span className="text-xs">着金確認</span>
                    {deal.paymentConfirmed === "true" && <span className="text-xs bg-emerald-200/60 px-2 py-0.5 rounded-full">完了</span>}
                  </div>
                </div>
              </div>
            )}



            {deal.lineUserId && (
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-emerald-100/60 rounded-lg">
                  <MessageCircle className="h-3 w-3 text-emerald-600" />
                </div>
                <span className="text-xs text-emerald-700 font-medium">LINE連携済み</span>
              </div>
            )}

            {deal.customerChecklistUrl && (
              <div className="mt-3">
                <a
                  href={deal.customerChecklistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-xs text-blue-700 hover:text-blue-800 bg-blue-50/80 hover:bg-blue-100/80 px-3 py-2 rounded-xl border border-blue-200/50 transition-all duration-200 backdrop-blur-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>顧客チェックリスト</span>
                </a>
              </div>
            )}
            
            {!isCompleted && (
              <div className="mt-3">
                <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold border backdrop-blur-sm ${
                  isOverdue 
                    ? "bg-red-50/80 text-red-700 border-red-200/50" 
                    : daysUntilDue <= 3
                    ? "bg-orange-50/80 text-orange-700 border-orange-200/50"
                    : "bg-slate-50/80 text-slate-700 border-slate-200/50"
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isOverdue 
                      ? "bg-red-500" 
                      : daysUntilDue <= 3
                      ? "bg-orange-500"
                      : "bg-slate-500"
                  }`}></div>
                  <span>{getRelativeTime()}</span>
                </div>
                {!isOverdue && (
                  <p className="text-xs text-slate-500 mt-2 ml-1">
                    {daysUntilDue === 0 ? "今日が期限" : 
                     daysUntilDue === 1 ? "明日が期限" :
                     `あと${daysUntilDue}日`}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
