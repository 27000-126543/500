import { RestockRequest, RecallOrder } from '../../types';
import { getRestockProgress, getRecallProgress, canApproveRestock, canSignRecall, ROLE_LABELS } from '../../utils/approvalEngine';
import { useAppStore } from '../../store/useAppStore';
import { User, Check, X, Clock, ChevronRight, Package, AlertTriangle, Calendar, FileText, Box } from 'lucide-react';

interface ApprovalCardProps {
  item: RestockRequest | RecallOrder;
  type: 'restock' | 'recall';
}

const restockStatusLabels: Record<string, string> = {
  pending_merchant: '待商户确认',
  pending_admin: '待管理员审核',
  pending_director: '待主任终审',
  approved: '已完成',
  rejected: '已驳回',
};

const recallStatusLabels: Record<string, string> = {
  pending_inspector: '待检测员确认',
  pending_admin: '待管理员审核',
  pending_supervisor: '待食药监会签',
  completed: '已完成',
  cancelled: '已取消',
};

const statusColors: Record<string, string> = {
  pending_merchant: '#FFD93D',
  pending_admin: '#FFD93D',
  pending_inspector: '#FFD93D',
  pending_director: '#FF8C00',
  pending_supervisor: '#FF8C00',
  approved: '#00C48C',
  completed: '#00C48C',
  rejected: '#FF3D57',
  cancelled: '#FF3D57',
};

const shelfStatusLabels: Record<string, { label: string; color: string }> = {
  on_shelf: { label: '上架中', color: '#00C48C' },
  taken_down: { label: '已下架', color: '#FF8C00' },
  recalled: { label: '已召回', color: '#6366F1' },
  archived: { label: '已归档', color: '#6B7280' },
};

export default function ApprovalCard({ item, type }: ApprovalCardProps) {
  const { currentUser, approveRestock, rejectRestock, signRecall, rejectRecall } = useAppStore();
  const isRestock = type === 'restock';
  const progress = isRestock
    ? getRestockProgress((item as RestockRequest).status)
    : getRecallProgress((item as RecallOrder).status);
  const canAct = currentUser
    ? isRestock
      ? canApproveRestock(item as RestockRequest, currentUser)
      : canSignRecall(item as RecallOrder, currentUser)
    : false;
  const statusLabel = isRestock
    ? restockStatusLabels[(item as RestockRequest).status]
    : recallStatusLabels[(item as RecallOrder).status];
  const statusColor = statusColors[item.status] || '#888';
  const title = isRestock
    ? `补货申请：${(item as RestockRequest).productName}`
    : `召回工单：${(item as RecallOrder).productName}`;
  const subInfo = isRestock
    ? `数量：${(item as RestockRequest).quantity}`
    : `数量：${(item as RecallOrder).quantity}`;

  const currentHandlerRole = item.currentHandlerRole;
  const currentHandlerLabel = ROLE_LABELS[currentHandlerRole] || '-';
  const isTerminalStatus = isRestock
    ? (item.status === 'approved' || item.status === 'rejected')
    : (item.status === 'completed' || item.status === 'cancelled');

  const handleApprove = () => {
    if (isRestock) approveRestock(item.id);
    else signRecall(item.id);
  };

  const handleReject = () => {
    if (isRestock) rejectRestock(item.id);
    else rejectRecall(item.id);
  };

  const restockItem = item as RestockRequest;
  const recallItem = item as RecallOrder;

  return (
    <div
      className="rounded-lg bg-bg-glass backdrop-blur-md p-4 border hover:border-accent-cyan/50 transition-all"
      style={{ borderColor: `${statusColor}40` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-white mb-1">{title}</p>
          <p className="text-xs text-gray-400">{subInfo}</p>
          <p className="text-[10px] text-gray-500 mt-1">
            创建时间：{new Date(item.createTime).toLocaleString('zh-CN')}
          </p>
        </div>
        <span
          className="text-[11px] px-2 py-1 rounded font-medium"
          style={{
            backgroundColor: `${statusColor}20`,
            color: statusColor,
          }}
        >
          {statusLabel}
        </span>
      </div>

      {isRestock ? (
        <div className="mb-3 p-2.5 rounded-md bg-bg-tertiary/50 space-y-1.5">
          <div className="flex items-center gap-2 text-[11px]">
            <Box size={12} className="text-accent-cyan shrink-0" />
            <span className="text-gray-400">当前库存：</span>
            <span className={`font-medium ${restockItem.currentStock < restockItem.safeThreshold ? 'text-accent-orange' : 'text-white'}`}>
              {restockItem.currentStock}
            </span>
            <span className="text-gray-500">/</span>
            <span className="text-gray-400">安全阈值：</span>
            <span className="font-medium text-white">{restockItem.safeThreshold}</span>
            {restockItem.currentStock < restockItem.safeThreshold && (
              <AlertTriangle size={12} className="text-accent-orange ml-1" />
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <User size={12} className="text-accent-purple shrink-0" />
            <span className="text-gray-400">当前处理人：</span>
            {isTerminalStatus ? (
              <span className="text-gray-500">流程已结束</span>
            ) : canAct ? (
              <span className="font-medium text-accent-yellow">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-yellow mr-1.5 animate-pulse" />
                轮到您处理
              </span>
            ) : (
              <span className="font-medium text-gray-300">
                等待{currentHandlerLabel}处理
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-3 p-2.5 rounded-md bg-bg-tertiary/50 space-y-1.5">
          <div className="flex items-center gap-2 text-[11px]">
            <Package size={12} className="text-accent-red shrink-0" />
            <span className="text-gray-400">下架状态：</span>
            <span
              className="font-medium px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: `${shelfStatusLabels[recallItem.shelfStatus]?.color || '#888'}20`,
                color: shelfStatusLabels[recallItem.shelfStatus]?.color || '#888',
              }}
            >
              {shelfStatusLabels[recallItem.shelfStatus]?.label || '未知'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <Check size={12} className="text-accent-green shrink-0" />
            <span className="text-gray-400">召回进度：</span>
            <span className="font-medium text-white">
              {recallItem.recalledQuantity} / {recallItem.quantity}
            </span>
            <span className="text-gray-500">
              ({recallItem.quantity > 0 ? Math.round((recallItem.recalledQuantity / recallItem.quantity) * 100) : 0}%)
            </span>
          </div>
          {recallItem.takeDownTime && (
            <div className="flex items-center gap-2 text-[11px]">
              <Calendar size={12} className="text-accent-orange shrink-0" />
              <span className="text-gray-400">下架时间：</span>
              <span className="font-medium text-white">
                {new Date(recallItem.takeDownTime).toLocaleString('zh-CN')}
              </span>
            </div>
          )}
          {recallItem.completeNote && (
            <div className="flex items-start gap-2 text-[11px]">
              <FileText size={12} className="text-accent-cyan shrink-0 mt-0.5" />
              <span className="text-gray-400">归档备注：</span>
              <span className="font-medium text-gray-200">{recallItem.completeNote}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-[11px] pt-1 border-t border-gray-700/50">
            <User size={12} className="text-accent-purple shrink-0" />
            <span className="text-gray-400">当前处理人：</span>
            {isTerminalStatus ? (
              <span className="text-gray-500">流程已结束</span>
            ) : canAct ? (
              <span className="font-medium text-accent-yellow">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-yellow mr-1.5 animate-pulse" />
                轮到您处理
              </span>
            ) : (
              <span className="font-medium text-gray-300">
                等待{currentHandlerLabel}处理
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
          <span>审批进度</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: statusColor }}
          />
        </div>
      </div>

      <div className="space-y-1.5 mb-3">
        {(isRestock ? restockItem.approvalLogs : recallItem.signLogs).map((log, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px]">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${statusColor}20` }}
            >
              <User size={10} style={{ color: statusColor }} />
            </div>
            <span className="text-gray-300">{log.approver}</span>
            <span className="text-[10px] text-gray-500 px-1 py-0.5 rounded bg-bg-tertiary/50">
              {ROLE_LABELS[log.role]}
            </span>
            <ChevronRight size={10} className="text-gray-500" />
            <span className="text-gray-400">{log.comment || '已通过'}</span>
            <span className="text-gray-600 ml-auto">
              {new Date(log.time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        {canAct && (
          <div className="flex items-center gap-2 text-[11px] animate-pulse bg-accent-yellow/10 rounded p-1.5 border border-accent-yellow/30">
            <Clock size={10} className="text-accent-yellow" />
            <span className="text-accent-yellow font-medium">轮到您处理，请尽快操作</span>
          </div>
        )}
      </div>

      {canAct && (
        <div className="flex gap-2">
          <button
            onClick={handleApprove}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded text-xs font-medium bg-accent-green/20 text-accent-green hover:bg-accent-green/30 transition-colors border border-accent-green/40"
          >
            <Check size={14} /> 通过
          </button>
          <button
            onClick={handleReject}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded text-xs font-medium bg-accent-red/20 text-accent-red hover:bg-accent-red/30 transition-colors border border-accent-red/40"
          >
            <X size={14} /> 驳回
          </button>
        </div>
      )}
    </div>
  );
}
