import { useState, useMemo } from 'react';
import TopBar from '../components/layout/TopBar';
import ApprovalCard from '../components/ui/ApprovalCard';
import { useAppStore } from '../store/useAppStore';
import { Package, ClipboardX, Clock, Archive } from 'lucide-react';
import { RESTOCK_STEP_ROLES, RECALL_STEP_ROLES } from '../utils/approvalEngine';
import { UserRole } from '../types';

type MainTab = 'restock' | 'recall';
type SubTab = 'todo' | 'history';

const RESTOCK_FINAL_STATUSES = ['approved', 'rejected'] as const;
const RECALL_FINAL_STATUSES = ['completed', 'cancelled'] as const;

export default function ApprovalsPage() {
  const { currentUser, getFilteredData } = useAppStore();
  const { filteredRestockRequests: restockRequests, filteredRecallOrders: recallOrders } = getFilteredData();
  const [mainTab, setMainTab] = useState<MainTab>('restock');
  const [subTab, setSubTab] = useState<SubTab>('todo');

  const userRole = currentUser?.role as UserRole | undefined;

  const isRestockTodo = useMemo(() => {
    if (!userRole) return [];
    return restockRequests.filter((r) => {
      if (RESTOCK_FINAL_STATUSES.includes(r.status as any)) return false;
      if (userRole === 'supervisor') return false;
      if (userRole === 'merchant') {
        return r.currentHandlerRole === userRole && r.merchantId === currentUser?.id;
      }
      return r.currentHandlerRole === userRole;
    });
  }, [restockRequests, userRole, currentUser]);

  const isRestockHistory = useMemo(() => {
    if (!userRole) return [];
    return restockRequests.filter((r) => {
      if (userRole === 'supervisor') return false;
      const isFinal = RESTOCK_FINAL_STATUSES.includes(r.status as any);
      if (userRole === 'director') {
        const directorHandled = r.approvalLogs?.some((log) => log.role === 'director');
        if (isFinal) return directorHandled;
        return directorHandled && r.currentHandlerRole !== userRole;
      }
      const movedAway = !isFinal && r.currentHandlerRole !== userRole;
      if (userRole === 'merchant') {
        return (isFinal || movedAway) && r.merchantId === currentUser?.id;
      }
      return isFinal || movedAway;
    });
  }, [restockRequests, userRole, currentUser]);

  const isRecallTodo = useMemo(() => {
    if (!userRole) return [];
    return recallOrders.filter((r) => {
      if (RECALL_FINAL_STATUSES.includes(r.status as any)) return false;
      if (userRole === 'merchant' || userRole === 'director') return false;
      if (userRole === 'supervisor') {
        return r.status === 'pending_inspector' || r.status === 'pending_supervisor';
      }
      return r.currentHandlerRole === userRole;
    });
  }, [recallOrders, userRole]);

  const isRecallHistory = useMemo(() => {
    if (!userRole) return [];
    return recallOrders.filter((r) => {
      if (userRole === 'merchant') {
        const isFinal = RECALL_FINAL_STATUSES.includes(r.status as any);
        const movedAway = !isFinal && r.currentHandlerRole !== userRole;
        return (isFinal || movedAway) && r.merchantId === currentUser?.id;
      }
      if (userRole === 'director') {
        return RECALL_FINAL_STATUSES.includes(r.status as any);
      }
      const isFinal = RECALL_FINAL_STATUSES.includes(r.status as any);
      const movedAway = !isFinal && r.currentHandlerRole !== userRole;
      return isFinal || movedAway;
    });
  }, [recallOrders, userRole, currentUser]);

  const todoCount = useMemo(() => {
    return isRestockTodo.length + isRecallTodo.length;
  }, [isRestockTodo, isRecallTodo]);

  const restockTodoCount = isRestockTodo.length;
  const recallTodoCount = isRecallTodo.length;

  const visibleRestock = subTab === 'todo' ? isRestockTodo : isRestockHistory;
  const visibleRecall = subTab === 'todo' ? isRecallTodo : isRecallHistory;

  return (
    <div className="min-h-screen bg-bg-primary text-white">
      <TopBar />
      <div className="pt-20 pb-10 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-tech font-bold text-white mb-1">审批中心</h1>
            <p className="text-sm text-gray-400">补货申请审批与召回工单会签管理</p>
          </div>

          <div className="flex flex-col gap-3 mb-6">
            <div className="flex gap-2 bg-bg-secondary/50 rounded-xl p-1.5 w-fit">
              <button
                onClick={() => setMainTab('restock')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm transition-all ${
                  mainTab === 'restock'
                    ? 'bg-accent-cyan/20 text-accent-cyan shadow-glow-cyan'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Package size={16} />
                补货申请
                {restockTodoCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-accent-orange/30 text-accent-orange text-[10px] font-medium">
                    {restockTodoCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setMainTab('recall')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm transition-all ${
                  mainTab === 'recall'
                    ? 'bg-accent-red/20 text-accent-red'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <ClipboardX size={16} />
                召回工单
                {recallTodoCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-accent-red/30 text-accent-red text-[10px] font-medium">
                    {recallTodoCount}
                  </span>
                )}
              </button>
            </div>

            <div className="flex gap-2 bg-bg-secondary/30 rounded-xl p-1.5 w-fit">
              <button
                onClick={() => setSubTab('todo')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition-all ${
                  subTab === 'todo'
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Clock size={14} />
                待办
                {todoCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-accent-green/30 text-accent-green text-[10px] font-medium">
                    {todoCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setSubTab('history')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition-all ${
                  subTab === 'history'
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Archive size={14} />
                历史归档
              </button>
            </div>
          </div>

          {mainTab === 'restock' ? (
            visibleRestock.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {visibleRestock.map((req) => (
                  <ApprovalCard key={req.id} item={req} type="restock" />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500">
                <Package size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">{subTab === 'todo' ? '暂无待办补货申请' : '暂无历史补货申请'}</p>
              </div>
            )
          ) : visibleRecall.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {visibleRecall.map((order) => (
                <ApprovalCard key={order.id} item={order} type="recall" />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">
              <ClipboardX size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">{subTab === 'todo' ? '暂无待办召回工单' : '暂无历史召回工单'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
