export type UserRole = 'merchant' | 'admin' | 'director' | 'supervisor';

export const PermissionConst = {
  VIEW_DASHBOARD_ALL: 'view_dashboard_all',
  VIEW_DASHBOARD_OWN: 'view_dashboard_own',
  VIEW_REPORTS_ALL: 'view_reports_all',
  VIEW_REPORTS_OWN: 'view_reports_own',
  VIEW_APPROVALS_ALL: 'view_approvals_all',
  VIEW_APPROVALS_OWN: 'view_approvals_own',
  EXPORT_REPORT_ALL: 'export_report_all',
  EXPORT_REPORT_OWN: 'export_report_own',
  APPROVE_RESTOCK_MERCHANT: 'approve_restock_merchant',
  APPROVE_RESTOCK_ADMIN: 'approve_restock_admin',
  APPROVE_RESTOCK_DIRECTOR: 'approve_restock_director',
  SIGN_RECALL_INSPECTOR: 'sign_recall_inspector',
  SIGN_RECALL_ADMIN: 'sign_recall_admin',
  SIGN_RECALL_SUPERVISOR: 'sign_recall_supervisor',
  MANAGE_COLDSTORAGE: 'manage_coldstorage',
  ACKNOWLEDGE_ALERT: 'acknowledge_alert',
  TRIGGER_FIRE_DRILL: 'trigger_fire_drill',
  VIEW_EMERGENCY_STATS: 'view_emergency_stats',
} as const;

export type PermissionKey = typeof PermissionConst[keyof typeof PermissionConst];

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  permissions: PermissionKey[];
}

export type StallCategory = 'vegetable' | 'meat' | 'seafood' | 'fruit' | 'grain';
export type StallStatus = 'normal' | 'lowStock' | 'unqualified' | 'closed';

export interface Stall {
  id: string;
  name: string;
  merchantName: string;
  merchantId: string;
  category: StallCategory;
  position: { x: number; y: number; z: number };
  inventory: number;
  safeInventoryThreshold: number;
  passengerHeat: number;
  salesToday: number;
  status: StallStatus;
}

export type CoolingStatus = 'running' | 'stopped' | 'fault' | 'standby';
export type ColdStorageStatus = 'normal' | 'warning' | 'critical' | 'resolved' | 'archived';

export interface EscalationRecord {
  level: AlertLevel;
  escalateTime: Date;
  reason: string;
  notifiedRole: UserRole;
}

export interface ColdStorageAlert {
  alertId: string;
  startTime: Date;
  acknowledgeTime?: Date;
  resolveTime?: Date;
  escalationCount: number;
  escalationRecords: EscalationRecord[];
  exceedType: 'temperature' | 'humidity' | 'both';
  maxExceedValue: number;
  handlingDurationMinutes?: number;
  archived: boolean;
}

export interface ColdStorage {
  id: string;
  name: string;
  temperature: number;
  humidity: number;
  tempThreshold: { min: number; max: number };
  humidityThreshold: { min: number; max: number };
  mainCoolingStatus: CoolingStatus;
  backupCoolingStatus: CoolingStatus;
  status: ColdStorageStatus;
  warningDuration: number;
  escalationThresholdMinutes: number;
  currentAlert?: ColdStorageAlert;
  alertHistory: ColdStorageAlert[];
}

export interface InspectionItem {
  name: string;
  result: 'pass' | 'fail';
  value?: number;
}

export interface InspectionRecord {
  id: string;
  stallId: string;
  productName: string;
  sampleNo: string;
  inspector: string;
  inspectTime: Date;
  items: InspectionItem[];
  overallResult: 'pass' | 'fail';
  handled: boolean;
}

export interface ParkingSpot {
  id: string;
  zone: 'main' | 'backup';
  position: { x: number; y: number; z: number };
  occupied: boolean;
  vehiclePlate?: string;
}

export type RestockStatus =
  | 'pending_merchant'
  | 'pending_admin'
  | 'pending_director'
  | 'approved'
  | 'rejected';

export interface ApprovalLog {
  approver: string;
  role: UserRole;
  comment?: string;
  time: Date;
}

export const RESTOCK_STEP_ROLES: Record<RestockStatus, UserRole | null> = {
  pending_merchant: 'merchant',
  pending_admin: 'admin',
  pending_director: 'director',
  approved: null,
  rejected: null,
};

export interface RestockRequest {
  id: string;
  stallId: string;
  merchantId: string;
  productName: string;
  quantity: number;
  currentStock: number;
  safeThreshold: number;
  createTime: Date;
  status: RestockStatus;
  currentHandlerRole: UserRole;
  approvalLogs: ApprovalLog[];
  archived: boolean;
}

export type RecallStatus =
  | 'pending_inspector'
  | 'pending_admin'
  | 'pending_supervisor'
  | 'completed'
  | 'cancelled';

export type RecallShelfStatus = 'on_shelf' | 'taken_down' | 'recalled' | 'archived';

export const RECALL_STEP_ROLES: Record<RecallStatus, UserRole | null> = {
  pending_inspector: 'supervisor',
  pending_admin: 'admin',
  pending_supervisor: 'supervisor',
  completed: null,
  cancelled: null,
};

export interface RecallOrder {
  id: string;
  inspectionId: string;
  stallId: string;
  merchantId: string;
  productName: string;
  quantity: number;
  recalledQuantity: number;
  shelfStatus: RecallShelfStatus;
  takeDownTime?: Date;
  createTime: Date;
  status: RecallStatus;
  currentHandlerRole: UserRole;
  signLogs: ApprovalLog[];
  archived: boolean;
  completeNote?: string;
}

export type AlertType = 'inventory' | 'coldstorage' | 'inspection' | 'parking' | 'fire';
export type AlertLevel = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  type: AlertType;
  level: AlertLevel;
  targetId: string;
  message: string;
  createTime: Date;
  acknowledged: boolean;
  acknowledgedTime?: Date;
  acknowledgedBy?: string;
  resolved: boolean;
  resolvedTime?: Date;
  resolvedBy?: string;
  escalated: boolean;
  escalationCount: number;
  escalationRecords: EscalationRecord[];
  handlingDurationMinutes?: number;
  visibleToRoles: UserRole[];
  archived: boolean;
}

export interface PathPoint {
  x: number;
  y: number;
  z: number;
}

export interface EvacuationPath {
  start: PathPoint;
  end: PathPoint;
}

export interface FireAlarm {
  id: string;
  zone: string;
  position: PathPoint;
  triggerTime: Date;
  sprinklerActive: boolean;
  evacuationPaths: EvacuationPath[];
  fireLanePath: PathPoint[];
}

export interface DailyReport {
  date: string;
  scope: 'all' | 'merchant';
  merchantId?: string;
  merchantName?: string;
  totalSales: number;
  totalPassenger: number;
  inspectionCount: number;
  unqualifiedCount: number;
  unqualifiedRate: number;
  emergencyCount: number;
  alertCount: number;
  alertEscalatedCount: number;
  alertAvgHandlingMinutes: number;
  restockRequestCount: number;
  restockApprovedCount: number;
  recallOrderCount: number;
  recallCompletedCount: number;
  recallTotalQuantity: number;
  recallRecalledQuantity: number;
  coldStorageAlertCount: number;
  coldStorageEscalatedCount: number;
}

export type ViewMode = 'overview' | 'stalls' | 'coldstorage' | 'inspection' | 'parking' | 'monitor';
