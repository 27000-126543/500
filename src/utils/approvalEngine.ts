import { RestockRequest, RecallOrder, User, UserRole, RESTOCK_STEP_ROLES, RECALL_STEP_ROLES } from '../types';

export const getNextRestockStatus = (
  currentStatus: RestockRequest['status'],
  role: UserRole
): RestockRequest['status'] | null => {
  const transitions: Record<RestockRequest['status'], Partial<Record<UserRole, RestockRequest['status']>>> = {
    pending_merchant: { merchant: 'pending_admin' },
    pending_admin: { admin: 'pending_director' },
    pending_director: { director: 'approved' },
    approved: {},
    rejected: {},
  };
  return transitions[currentStatus][role] ?? null;
};

export const getNextRecallStatus = (
  currentStatus: RecallOrder['status'],
  role: UserRole
): RecallOrder['status'] | null => {
  const transitions: Record<RecallOrder['status'], Partial<Record<UserRole, RecallOrder['status']>>> = {
    pending_inspector: { supervisor: 'pending_admin' },
    pending_admin: { admin: 'pending_supervisor' },
    pending_supervisor: { supervisor: 'completed' },
    completed: {},
    cancelled: {},
  };
  return transitions[currentStatus][role] ?? null;
};

export const getNextHandlerRole = (
  status: RestockRequest['status'] | RecallOrder['status'],
  type: 'restock' | 'recall'
): UserRole | null => {
  if (type === 'restock') {
    return RESTOCK_STEP_ROLES[status as RestockRequest['status']] ?? null;
  }
  return RECALL_STEP_ROLES[status as RecallOrder['status']] ?? null;
};

export const canApproveRestock = (request: RestockRequest, user: User): boolean => {
  if (!user || request.archived) return false;
  if (request.status === 'approved' || request.status === 'rejected') return false;
  if (request.status === 'pending_merchant') {
    return user.role === 'merchant' && user.id === request.merchantId;
  }
  return user.role === RESTOCK_STEP_ROLES[request.status];
};

export const canSignRecall = (order: RecallOrder, user: User): boolean => {
  if (!user || order.archived) return false;
  if (order.status === 'completed' || order.status === 'cancelled') return false;
  if (order.status === 'pending_inspector' || order.status === 'pending_supervisor') {
    return user.role === 'supervisor';
  }
  return user.role === RECALL_STEP_ROLES[order.status];
};

export const canViewRestock = (request: RestockRequest, user: User): boolean => {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'director') return true;
  if (user.role === 'merchant') return user.id === request.merchantId;
  return false;
};

export const canViewRecall = (order: RecallOrder, user: User): boolean => {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'director' || user.role === 'supervisor') return true;
  if (user.role === 'merchant') return user.id === order.merchantId;
  return false;
};

export const getRestockProgress = (status: RestockRequest['status']): number => {
  const progress: Record<RestockRequest['status'], number> = {
    pending_merchant: 0,
    pending_admin: 33,
    pending_director: 66,
    approved: 100,
    rejected: 0,
  };
  return progress[status];
};

export const getRecallProgress = (status: RecallOrder['status']): number => {
  const progress: Record<RecallOrder['status'], number> = {
    pending_inspector: 0,
    pending_admin: 33,
    pending_supervisor: 66,
    completed: 100,
    cancelled: 0,
  };
  return progress[status];
};

export const ROLE_LABELS: Record<UserRole, string> = {
  merchant: '商户',
  admin: '管理员',
  director: '主任',
  supervisor: '食药监',
};

export const getCurrentStepLabel = (item: RestockRequest | RecallOrder, type: 'restock' | 'recall'): string => {
  const status = item.status;
  if (type === 'restock') {
    const labels: Record<RestockRequest['status'], string> = {
      pending_merchant: '待商户确认',
      pending_admin: '待管理员审核',
      pending_director: '待主任终审',
      approved: '已完成审批',
      rejected: '已驳回',
    };
    return labels[status as RestockRequest['status']];
  }
  const labels: Record<RecallOrder['status'], string> = {
    pending_inspector: '待检测员确认',
    pending_admin: '待管理员审核',
    pending_supervisor: '待食药监会签',
    completed: '已完成',
    cancelled: '已取消',
  };
  return labels[status as RecallOrder['status']];
};
