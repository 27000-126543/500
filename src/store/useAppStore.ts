import { create } from 'zustand';
import {
  User,
  Stall,
  ColdStorage,
  InspectionRecord,
  ParkingSpot,
  RestockRequest,
  RecallOrder,
  Alert,
  FireAlarm,
  ViewMode,
  PermissionKey,
  PermissionConst,
  UserRole,
  ColdStorageAlert,
  EscalationRecord,
  DailyReport,
} from '../types';
import {
  mockUsers,
  mockStalls,
  mockColdStorages,
  mockInspections,
  mockParkingSpots,
  mockRestockRequests,
  mockRecallOrders,
  mockAlerts,
  mockFireAlarm,
} from '../data/mockData';
import {
  getNextRestockStatus,
  getNextRecallStatus,
  getNextHandlerRole,
  canApproveRestock,
  canSignRecall,
  canViewRestock,
  canViewRecall,
} from '../utils/approvalEngine';
import { exportDailyReport } from '../utils/exportExcel';

type FilteredData = {
  filteredStalls: Stall[];
  filteredRestockRequests: RestockRequest[];
  filteredRecallOrders: RecallOrder[];
  filteredAlerts: Alert[];
};

interface AppState {
  currentUser: User | null;
  stalls: Stall[];
  coldStorages: ColdStorage[];
  inspections: InspectionRecord[];
  parkingSpots: ParkingSpot[];
  restockRequests: RestockRequest[];
  recallOrders: RecallOrder[];
  alerts: Alert[];
  fireAlarms: FireAlarm[];
  selectedObjectId: string | null;
  currentView: ViewMode;
  heatmapVisible: boolean;
  fireEmergencyActive: boolean;

  hasPermission: (perm: PermissionKey) => boolean;
  getFilteredData: () => FilteredData;
  canAccessPage: (page: 'dashboard' | 'approvals' | 'reports') => boolean;

  login: (role: UserRole, userId?: string) => void;
  logout: () => void;
  setSelectedObject: (id: string | null) => void;
  setCurrentView: (view: ViewMode) => void;
  toggleHeatmap: () => void;

  approveRestock: (id: string, comment?: string) => void;
  rejectRestock: (id: string, comment?: string) => void;
  signRecall: (id: string, comment?: string, completeNote?: string) => void;
  rejectRecall: (id: string, comment?: string) => void;

  acknowledgeAlert: (id: string) => void;
  resolveAlert: (id: string) => void;
  escalateColdStorageAlert: (coldStorageId: string) => void;
  resolveColdStorageAlert: (coldStorageId: string) => void;
  checkAndEscalateColdStorage: () => void;

  triggerFireAlarm: () => void;
  deactivateFireAlarm: () => void;

  exportReport: () => DailyReport;
  simulateDataUpdate: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  stalls: mockStalls,
  coldStorages: mockColdStorages,
  inspections: mockInspections,
  parkingSpots: mockParkingSpots,
  restockRequests: mockRestockRequests,
  recallOrders: mockRecallOrders,
  alerts: mockAlerts,
  fireAlarms: [mockFireAlarm],
  selectedObjectId: null,
  currentView: 'overview',
  heatmapVisible: true,
  fireEmergencyActive: false,

  hasPermission: (perm) => {
    const user = get().currentUser;
    if (!user) return false;
    return user.permissions.includes(perm);
  },

  canAccessPage: (page) => {
    const user = get().currentUser;
    if (!user) return false;
    const { hasPermission } = get();
    if (page === 'dashboard') {
      return hasPermission(PermissionConst.VIEW_DASHBOARD_ALL) || hasPermission(PermissionConst.VIEW_DASHBOARD_OWN);
    }
    if (page === 'approvals') {
      return hasPermission(PermissionConst.VIEW_APPROVALS_ALL) || hasPermission(PermissionConst.VIEW_APPROVALS_OWN);
    }
    if (page === 'reports') {
      return hasPermission(PermissionConst.VIEW_REPORTS_ALL) || hasPermission(PermissionConst.VIEW_REPORTS_OWN);
    }
    return false;
  },

  getFilteredData: () => {
    const user = get().currentUser;
    const { stalls, restockRequests, recallOrders, alerts, hasPermission } = get();

    let filteredStalls = stalls;
    let filteredRestockRequests = restockRequests;
    let filteredRecallOrders = recallOrders;
    let filteredAlerts = alerts;

    if (user) {
      if (user.role === 'merchant') {
        filteredStalls = stalls.filter((s) => s.merchantId === user.id);
        filteredRestockRequests = restockRequests.filter((r) => canViewRestock(r, user) && !r.archived);
        filteredRecallOrders = recallOrders.filter((r) => canViewRecall(r, user) && !r.archived);
        filteredAlerts = alerts.filter(
          (a) => !a.archived && a.visibleToRoles.includes(user.role) &&
            (a.type === 'inventory' || a.type === 'inspection')
        );
      } else {
        filteredRestockRequests = restockRequests.filter((r) => !r.archived);
        filteredRecallOrders = recallOrders.filter((r) => !r.archived);
        filteredAlerts = alerts.filter((a) => !a.archived && a.visibleToRoles.includes(user.role));
      }
    } else {
      filteredRestockRequests = restockRequests.filter((r) => !r.archived);
      filteredRecallOrders = recallOrders.filter((r) => !r.archived);
      filteredAlerts = alerts.filter((a) => !a.archived);
    }

    return {
      filteredStalls,
      filteredRestockRequests,
      filteredRecallOrders,
      filteredAlerts,
    };
  },

  login: (role, userId) => {
    let user = mockUsers.find((u) => u.role === role);
    if (userId) {
      user = mockUsers.find((u) => u.id === userId) || user;
    }
    if (user) set({ currentUser: user });
  },

  logout: () => set({ currentUser: null, selectedObjectId: null }),
  setSelectedObject: (id) => set({ selectedObjectId: id }),
  setCurrentView: (view) => set({ currentView: view }),
  toggleHeatmap: () => set((s) => ({ heatmapVisible: !s.heatmapVisible })),

  approveRestock: (id, comment) => {
    const user = get().currentUser;
    if (!user) return;
    const { hasPermission } = get();
    const permKey = user.role === 'merchant'
      ? PermissionConst.APPROVE_RESTOCK_MERCHANT
      : user.role === 'admin'
        ? PermissionConst.APPROVE_RESTOCK_ADMIN
        : PermissionConst.APPROVE_RESTOCK_DIRECTOR;
    if (!hasPermission(permKey)) return;

    set((state) => ({
      restockRequests: state.restockRequests.map((r) => {
        if (r.id !== id) return r;
        if (!canApproveRestock(r, user)) return r;
        const next = getNextRestockStatus(r.status, user.role);
        if (!next) return r;
        const nextHandler = getNextHandlerRole(next, 'restock');
        const updated: RestockRequest = {
          ...r,
          status: next,
          currentHandlerRole: nextHandler || r.currentHandlerRole,
          approvalLogs: [
            ...r.approvalLogs,
            { approver: user.name, role: user.role, comment, time: new Date() },
          ],
          archived: next === 'approved',
        };
        if (next === 'approved') {
          set({
            stalls: state.stalls.map((s) =>
              s.id === r.stallId
                ? {
                    ...s,
                    inventory: s.inventory + r.quantity,
                    status: (s.inventory + r.quantity) >= s.safeInventoryThreshold ? 'normal' : s.status,
                  }
                : s
            ),
          });
        }
        return updated;
      }),
    }));
  },

  rejectRestock: (id, comment) => {
    const user = get().currentUser;
    if (!user) return;
    const { hasPermission } = get();
    const permKey = user.role === 'merchant'
      ? PermissionConst.APPROVE_RESTOCK_MERCHANT
      : user.role === 'admin'
        ? PermissionConst.APPROVE_RESTOCK_ADMIN
        : PermissionConst.APPROVE_RESTOCK_DIRECTOR;
    if (!hasPermission(permKey)) return;

    set((state) => ({
      restockRequests: state.restockRequests.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'rejected',
              archived: true,
              approvalLogs: [
                ...r.approvalLogs,
                { approver: user.name, role: user.role, comment: comment || '驳回', time: new Date() },
              ],
            }
          : r
      ),
    }));
  },

  signRecall: (id, comment, completeNote) => {
    const user = get().currentUser;
    if (!user) return;
    const { hasPermission } = get();
    const permKey = user.role === 'supervisor'
      ? PermissionConst.SIGN_RECALL_SUPERVISOR
      : PermissionConst.SIGN_RECALL_ADMIN;
    if (!hasPermission(permKey) && user.role !== 'supervisor') return;

    set((state) => {
      let newRecallOrders = state.recallOrders.map((r) => {
        if (r.id !== id) return r;
        if (!canSignRecall(r, user)) return r;
        const next = getNextRecallStatus(r.status, user.role);
        if (!next) return r;
        const nextHandler = getNextHandlerRole(next, 'recall');
        return {
          ...r,
          status: next,
          currentHandlerRole: nextHandler || r.currentHandlerRole,
          recalledQuantity: next === 'completed' ? r.quantity : r.recalledQuantity,
          shelfStatus: next === 'pending_admin' ? 'taken_down' : next === 'completed' ? 'recalled' : r.shelfStatus,
          takeDownTime: next === 'pending_admin' ? (r.takeDownTime || new Date()) : r.takeDownTime,
          signLogs: [
            ...r.signLogs,
            { approver: user.name, role: user.role, comment, time: new Date() },
          ],
          archived: next === 'completed',
          completeNote: next === 'completed' ? (completeNote || '召回完成') : r.completeNote,
        };
      });
      let newStalls = state.stalls;
      const updatedRecall = newRecallOrders.find((r) => r.id === id);
      if (updatedRecall && updatedRecall.shelfStatus === 'taken_down') {
        newStalls = state.stalls.map((s) =>
          s.id === updatedRecall.stallId ? { ...s, status: 'unqualified' } : s
        );
      }
      return {
        recallOrders: newRecallOrders,
        stalls: newStalls,
      };
    });
  },

  rejectRecall: (id, comment) => {
    const user = get().currentUser;
    if (!user) return;
    set((state) => ({
      recallOrders: state.recallOrders.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'cancelled',
              archived: true,
              signLogs: [
                ...r.signLogs,
                { approver: user.name, role: user.role, comment: comment || '取消', time: new Date() },
              ],
            }
          : r
      ),
    }));
  },

  acknowledgeAlert: (id) => {
    const user = get().currentUser;
    if (!user) return;
    if (!get().hasPermission(PermissionConst.ACKNOWLEDGE_ALERT)) return;
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id && a.visibleToRoles.includes(user.role)
          ? { ...a, acknowledged: true, acknowledgedTime: new Date(), acknowledgedBy: user.name }
          : a
      ),
    }));
  },

  resolveAlert: (id) => {
    const user = get().currentUser;
    if (!user) return;
    if (!get().hasPermission(PermissionConst.ACKNOWLEDGE_ALERT)) return;
    set((state) => ({
      alerts: state.alerts.map((a) => {
        if (a.id !== id || !a.visibleToRoles.includes(user.role)) return a;
        const duration = a.createTime
          ? Math.round((Date.now() - new Date(a.createTime).getTime()) / 60000)
          : undefined;
        return {
          ...a,
          resolved: true,
          resolvedTime: new Date(),
          resolvedBy: user.name,
          acknowledged: true,
          acknowledgedTime: a.acknowledgedTime || new Date(),
          acknowledgedBy: a.acknowledgedBy || user.name,
          handlingDurationMinutes: duration,
          archived: true,
        };
      }),
    }));
  },

  escalateColdStorageAlert: (coldStorageId) => {
    const user = get().currentUser;
    set((state) => {
      const newColdStorages = state.coldStorages.map((cs) => {
        if (cs.id !== coldStorageId || !cs.currentAlert || cs.currentAlert.archived) return cs;
        const escalationRecord: EscalationRecord = {
          level: 'critical',
          escalateTime: new Date(),
          reason: `预警超时未处理（超过${cs.escalationThresholdMinutes}分钟），已升级推送给主任`,
          notifiedRole: 'director',
        };
        const newAlert: ColdStorageAlert = {
          ...cs.currentAlert,
          escalationCount: cs.currentAlert.escalationCount + 1,
          escalationRecords: [...cs.currentAlert.escalationRecords, escalationRecord],
        };
        return {
          ...cs,
          status: 'critical' as const,
          currentAlert: newAlert,
        } as ColdStorage;
      });
      const cs = newColdStorages.find((c) => c.id === coldStorageId);
      let newAlerts = state.alerts;
      if (cs?.currentAlert && cs.status === 'critical') {
        newAlerts = [
          {
            id: `cold_escalate_${Date.now()}`,
            type: 'coldstorage',
            level: 'critical',
            targetId: cs.id,
            message: `【已升级】${cs.name}温度超标超过${cs.escalationThresholdMinutes}分钟未处理，已自动升级并推送给主任`,
            createTime: new Date(),
            acknowledged: false,
            resolved: false,
            escalated: true,
            escalationCount: 1,
            escalationRecords: [
              {
                level: 'critical',
                escalateTime: new Date(),
                reason: '超时自动升级',
                notifiedRole: 'director',
              },
            ],
            visibleToRoles: ['admin', 'director', 'supervisor'],
            archived: false,
          },
          ...state.alerts,
        ];
      }
      return { coldStorages: newColdStorages, alerts: newAlerts };
    });
  },

  resolveColdStorageAlert: (coldStorageId) => {
    const user = get().currentUser;
    if (!user) return;
    if (!get().hasPermission(PermissionConst.MANAGE_COLDSTORAGE)) return;

    set((state) => {
      const newColdStorages = state.coldStorages.map((cs) => {
        if (cs.id !== coldStorageId || !cs.currentAlert) return cs;
        const duration = Math.round((Date.now() - new Date(cs.currentAlert.startTime).getTime()) / 60000);
        const historyAlert: ColdStorageAlert = {
          ...cs.currentAlert,
          acknowledgeTime: new Date(),
          resolveTime: new Date(),
          handlingDurationMinutes: duration,
          archived: true,
        };
        return {
          ...cs,
          status: 'resolved' as const,
          warningDuration: 0,
          mainCoolingStatus: 'running' as const,
          backupCoolingStatus: 'standby' as const,
          temperature: (cs.tempThreshold.min + cs.tempThreshold.max) / 2,
          humidity: (cs.humidityThreshold.min + cs.humidityThreshold.max) / 2,
          currentAlert: undefined,
          alertHistory: [...cs.alertHistory, historyAlert],
        } as ColdStorage;
      });
      const cs = newColdStorages.find((c) => c.id === coldStorageId);
      let newAlerts = state.alerts;
      if (cs) {
        newAlerts = state.alerts.map((a) => {
          if (a.targetId !== cs.id || a.type !== 'coldstorage') return a;
          const duration = a.createTime
            ? Math.round((Date.now() - new Date(a.createTime).getTime()) / 60000)
            : undefined;
          return {
            ...a,
            resolved: true,
            resolvedTime: new Date(),
            resolvedBy: user.name,
            acknowledged: true,
            acknowledgedTime: a.acknowledgedTime || new Date(),
            acknowledgedBy: a.acknowledgedBy || user.name,
            handlingDurationMinutes: duration,
            archived: true,
          };
        });
      }
      setTimeout(() => {
        set((st) => ({
          coldStorages: st.coldStorages.map((c) => (c.id === cs?.id ? { ...c, status: 'normal' as const } : c)),
        }));
      }, 2000);
      return { coldStorages: newColdStorages, alerts: newAlerts };
    });
  },

  checkAndEscalateColdStorage: () => {
    const { coldStorages } = get();
    coldStorages.forEach((cs) => {
      if (cs.currentAlert && !cs.currentAlert.archived) {
        const durationMin = (Date.now() - new Date(cs.currentAlert.startTime).getTime()) / 60000;
        if (durationMin > cs.escalationThresholdMinutes && cs.currentAlert.escalationCount === 0) {
          get().escalateColdStorageAlert(cs.id);
        }
      }
    });
  },

  triggerFireAlarm: () => {
    const fireAlarm = get().fireAlarms[0];
    const { hasPermission } = get();
    if (!hasPermission(PermissionConst.TRIGGER_FIRE_DRILL)) return;
    if (fireAlarm) {
      set({
        fireEmergencyActive: true,
        fireAlarms: [{ ...fireAlarm, sprinklerActive: true, triggerTime: new Date() }],
        alerts: [
          {
            id: 'fire_' + Date.now(),
            type: 'fire',
            level: 'critical',
            targetId: 'fire_zone',
            message: `火灾警报！${fireAlarm.zone}发现火情，喷淋系统已启动`,
            createTime: new Date(),
            acknowledged: false,
            resolved: false,
            escalated: false,
            escalationCount: 0,
            escalationRecords: [],
            visibleToRoles: ['admin', 'director', 'supervisor', 'merchant'],
            archived: false,
          },
          ...get().alerts,
        ],
      });
    }
  },

  deactivateFireAlarm: () => {
    const { hasPermission } = get();
    if (!hasPermission(PermissionConst.TRIGGER_FIRE_DRILL)) return;
    set({ fireEmergencyActive: false });
  },

  exportReport: () => {
    const user = get().currentUser;
    const { hasPermission, getFilteredData } = get();
    const { filteredStalls, filteredRestockRequests, filteredRecallOrders, filteredAlerts } = getFilteredData();
    const { stalls, inspections, alerts, coldStorages, recallOrders, restockRequests } = get();

    const scopeAll = hasPermission(PermissionConst.EXPORT_REPORT_ALL);
    const workStalls = scopeAll ? stalls : filteredStalls;
    const workInspections = scopeAll
      ? inspections
      : inspections.filter((i) => workStalls.some((s) => s.id === i.stallId));
    const workAlerts = scopeAll ? alerts : filteredAlerts;
    const workRestocks = scopeAll ? restockRequests : filteredRestockRequests;
    const workRecalls = scopeAll ? recallOrders : filteredRecallOrders;

    const totalSales = workStalls.reduce((sum, s) => sum + s.salesToday, 0);
    const totalPassenger = Math.round(workStalls.reduce((sum, s) => sum + s.passengerHeat * 10, 0));
    const inspectionCount = workInspections.length;
    const unqualifiedCount = workInspections.filter((i) => i.overallResult === 'fail').length;
    const unqualifiedRate = inspectionCount > 0 ? (unqualifiedCount / inspectionCount) * 100 : 0;

    const resolvedAlerts = workAlerts.filter((a) => a.resolved && a.handlingDurationMinutes);
    const alertAvgHandlingMinutes = resolvedAlerts.length > 0
      ? Math.round(resolvedAlerts.reduce((sum, a) => sum + (a.handlingDurationMinutes || 0), 0) / resolvedAlerts.length)
      : 0;

    const coldStorageAlerts = scopeAll
      ? coldStorages.reduce((sum, cs) => sum + cs.alertHistory.length + (cs.currentAlert ? 1 : 0), 0)
      : 0;
    const coldStorageEscalated = scopeAll
      ? coldStorages.reduce(
          (sum, cs) => sum + cs.alertHistory.filter((a) => a.escalationCount > 0).length +
            (cs.currentAlert?.escalationCount ? 1 : 0),
          0
        )
      : 0;

    const report: DailyReport = {
      date: new Date().toISOString().split('T')[0],
      scope: scopeAll ? 'all' : 'merchant',
      merchantId: scopeAll ? undefined : user?.id,
      merchantName: scopeAll ? undefined : user?.name,
      totalSales,
      totalPassenger,
      inspectionCount,
      unqualifiedCount,
      unqualifiedRate,
      emergencyCount: workAlerts.filter((a) => a.level === 'critical' && a.type === 'fire').length,
      alertCount: workAlerts.length,
      alertEscalatedCount: workAlerts.filter((a) => a.escalationCount > 0).length,
      alertAvgHandlingMinutes,
      restockRequestCount: workRestocks.length,
      restockApprovedCount: workRestocks.filter((r) => r.status === 'approved').length,
      recallOrderCount: workRecalls.length,
      recallCompletedCount: workRecalls.filter((r) => r.status === 'completed').length,
      recallTotalQuantity: workRecalls.reduce((sum, r) => sum + r.quantity, 0),
      recallRecalledQuantity: workRecalls.reduce((sum, r) => sum + r.recalledQuantity, 0),
      coldStorageAlertCount: coldStorageAlerts,
      coldStorageEscalatedCount: coldStorageEscalated,
    };

    exportDailyReport(report, workStalls, workInspections, workAlerts, scopeAll);
    return report;
  },

  simulateDataUpdate: () => {
    const { checkAndEscalateColdStorage } = get();
    checkAndEscalateColdStorage();
    set((state) => ({
      stalls: state.stalls.map((s) => ({
        ...s,
        passengerHeat: Math.max(0, Math.min(100, s.passengerHeat + Math.round((Math.random() - 0.5) * 10))),
        salesToday: s.salesToday + Math.round(Math.random() * 100),
      })),
      coldStorages: state.coldStorages.map((cs) => ({
        ...cs,
        temperature: cs.currentAlert
          ? +(cs.temperature + (Math.random() - 0.2) * 0.5).toFixed(1)
          : +(cs.temperature + (Math.random() - 0.5) * 0.5).toFixed(1),
        humidity: Math.max(30, Math.min(95, +(cs.humidity + (Math.random() - 0.5) * 2).toFixed(0))),
        warningDuration: cs.currentAlert ? cs.warningDuration + 3 : cs.warningDuration,
      })),
      parkingSpots: state.parkingSpots.map((p) =>
        Math.random() > 0.9
          ? { ...p, occupied: !p.occupied, vehiclePlate: !p.occupied ? `京A${Math.floor(10000 + Math.random() * 89999)}` : undefined }
          : p
      ),
    }));
  },
}));
