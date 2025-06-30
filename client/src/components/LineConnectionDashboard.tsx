import { useState, useEffect } from "react";
import { Deal } from "@shared/schema";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { 
  Users, 
  Link2, 
  MessageCircle, 
  QrCode, 
  Zap, 
  Edit3, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  BarChart3
} from "lucide-react";

interface LineConnectionDashboardProps {
  deals: Deal[];
  onRefresh?: () => void;
}

interface ConnectionStats {
  total: number;
  connected: number;
  unconnected: number;
  qrConnections: number;
  autoConnections: number;
  manualConnections: number;
  recentConnections: Deal[];
}

export function LineConnectionDashboard({ deals, onRefresh }: LineConnectionDashboardProps) {
  const [stats, setStats] = useState<ConnectionStats>({
    total: 0,
    connected: 0,
    unconnected: 0,
    qrConnections: 0,
    autoConnections: 0,
    manualConnections: 0,
    recentConnections: []
  });

  useEffect(() => {
    calculateStats();
  }, [deals]);

  const calculateStats = () => {
    const connectedDeals = deals.filter(deal => deal.lineUserId);
    const unconnectedDeals = deals.filter(deal => !deal.lineUserId);
    
    const qrConnections = connectedDeals.filter(deal => deal.lineConnectionMethod === 'qr');
    const autoConnections = connectedDeals.filter(deal => deal.lineConnectionMethod === 'auto');
    const manualConnections = connectedDeals.filter(deal => deal.lineConnectionMethod === 'manual');
    
    // Recent connections in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentConnections = connectedDeals
      .filter(deal => deal.lineConnectedAt && new Date(deal.lineConnectedAt) > sevenDaysAgo)
      .sort((a, b) => new Date(b.lineConnectedAt!).getTime() - new Date(a.lineConnectedAt!).getTime())
      .slice(0, 5);

    setStats({
      total: deals.length,
      connected: connectedDeals.length,
      unconnected: unconnectedDeals.length,
      qrConnections: qrConnections.length,
      autoConnections: autoConnections.length,
      manualConnections: manualConnections.length,
      recentConnections
    });
  };

  const connectionRate = stats.total > 0 ? Math.round((stats.connected / stats.total) * 100) : 0;

  const getConnectionMethodIcon = (method: string | null) => {
    switch (method) {
      case 'qr':
        return <QrCode className="h-4 w-4 text-blue-600" />;
      case 'auto':
        return <Zap className="h-4 w-4 text-emerald-600" />;
      case 'manual':
        return <Edit3 className="h-4 w-4 text-orange-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-slate-400" />;
    }
  };

  const getConnectionMethodText = (method: string | null) => {
    switch (method) {
      case 'qr':
        return 'QRコード';
      case 'auto':
        return '自動認識';
      case 'manual':
        return '手動登録';
      default:
        return '未連携';
    }
  };

  const getConnectionMethodBadgeColor = (method: string | null) => {
    switch (method) {
      case 'qr':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'auto':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'manual':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">LINE連携ダッシュボード</h2>
            <p className="text-slate-600">顧客とのLINE連携状況を管理</p>
          </div>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <TrendingUp className="h-4 w-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">更新</span>
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">総案件数</p>
              <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-200 rounded-xl">
              <BarChart3 className="h-6 w-6 text-blue-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-2xl border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-600 text-sm font-medium">連携済み</p>
              <p className="text-3xl font-bold text-emerald-900">{stats.connected}</p>
              <p className="text-emerald-700 text-sm">{connectionRate}%</p>
            </div>
            <div className="p-3 bg-emerald-200 rounded-xl">
              <CheckCircle2 className="h-6 w-6 text-emerald-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">未連携</p>
              <p className="text-3xl font-bold text-orange-900">{stats.unconnected}</p>
            </div>
            <div className="p-3 bg-orange-200 rounded-xl">
              <AlertCircle className="h-6 w-6 text-orange-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">連携率</p>
              <p className="text-3xl font-bold text-purple-900">{connectionRate}%</p>
            </div>
            <div className="p-3 bg-purple-200 rounded-xl">
              <TrendingUp className="h-6 w-6 text-purple-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Connection Methods Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">連携方法別統計</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <QrCode className="h-8 w-8 text-blue-600" />
            <div>
              <p className="font-semibold text-blue-900">QRコード</p>
              <p className="text-2xl font-bold text-blue-800">{stats.qrConnections}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <Zap className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="font-semibold text-emerald-900">自動認識</p>
              <p className="text-2xl font-bold text-emerald-800">{stats.autoConnections}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-xl border border-orange-200">
            <Edit3 className="h-8 w-8 text-orange-600" />
            <div>
              <p className="font-semibold text-orange-900">手動登録</p>
              <p className="text-2xl font-bold text-orange-800">{stats.manualConnections}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Connections */}
      {stats.recentConnections.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">最近の連携（7日以内）</h3>
          <div className="space-y-3">
            {stats.recentConnections.map((deal) => (
              <div key={deal.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {getConnectionMethodIcon(deal.lineConnectionMethod)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getConnectionMethodBadgeColor(deal.lineConnectionMethod)}`}>
                      {getConnectionMethodText(deal.lineConnectionMethod)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{deal.client}</p>
                    <p className="text-sm text-slate-600">{deal.title}</p>
                  </div>
                </div>
                <div className="text-right">
                  {deal.lineDisplayName && (
                    <p className="text-sm font-medium text-slate-900">{deal.lineDisplayName}</p>
                  )}
                  <p className="text-xs text-slate-500">
                    {deal.lineConnectedAt && format(new Date(deal.lineConnectedAt), "MM/dd HH:mm", { locale: ja })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Deals List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">全案件の連携状況</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {deals.map((deal) => (
            <div key={deal.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {deal.lineUserId ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getConnectionMethodBadgeColor(deal.lineConnectionMethod)}`}>
                    {getConnectionMethodText(deal.lineConnectionMethod)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">{deal.client}</p>
                  <p className="text-sm text-slate-600">{deal.title}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-700">{deal.phase}</p>
                {deal.lineDisplayName && (
                  <p className="text-xs text-emerald-600">{deal.lineDisplayName}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}