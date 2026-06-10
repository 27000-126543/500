import { useState } from 'react';
import TopBar from '../components/layout/TopBar';
import ApprovalCard from '../components/ui/ApprovalCard';
import { useAppStore } from '../store/useAppStore';
import { Package, ClipboardX } from 'lucide-react';

export default function ApprovalsPage() {
  const { getFilteredData } = useAppStore();
  const { filteredRestockRequests: restockRequests, filteredRecallOrders: recallOrders } = getFilteredData();
  const [tab, setTab] = useState<'restock' | 'recall'>('restock');

  return (
    <div className="min-h-screen bg-bg-primary text-white">
      <TopBar />
      <div className="pt-20 pb-10 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-tech font-bold text-white mb-1">审批中心</h1>
            <p className="text-sm text-gray-400">补货申请审批与召回工单会签管理</p>
          </div>

          <div className="flex gap-2 mb-6 bg-bg-secondary/50 rounded-xl p-1.5 w-fit">
            <button
              onClick={() => setTab('restock')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm transition-all ${
                tab === 'restock'
                  ? 'bg-accent-cyan/20 text-accent-cyan shadow-glow-cyan'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Package size={16} />
              补货申请
              {restockRequests.filter((r) => r.status !== 'approved' && r.status !== 'rejected').length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-accent-orange/30 text-accent-orange text-[10px] font-medium">
                  {restockRequests.filter((r) => r.status !== 'approved' && r.status !== 'rejected').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab('recall')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm transition-all ${
                tab === 'recall'
                  ? 'bg-accent-red/20 text-accent-red'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <ClipboardX size={16} />
              召回工单
              {recallOrders.filter((r) => r.status !== 'completed' && r.status !== 'cancelled').length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-accent-red/30 text-accent-red text-[10px] font-medium">
                  {recallOrders.filter((r) => r.status !== 'completed' && r.status !== 'cancelled').length}
                </span>
              )}
            </button>
          </div>

          {tab === 'restock' ? (
            restockRequests.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {restockRequests.map((req) => (
                  <ApprovalCard key={req.id} item={req} type="restock" />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500">
                <Package size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">暂无补货申请</p>
              </div>
            )
          ) : recallOrders.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {recallOrders.map((order) => (
                <ApprovalCard key={order.id} item={order} type="recall" />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">
              <ClipboardX size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">暂无召回工单</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
