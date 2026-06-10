import { useState, useMemo } from 'react';
import TopBar from '../components/layout/TopBar';
import { useAppStore } from '../store/useAppStore';
import { AuditLog, UserRole } from '../types';
import {
  ShieldCheck,
  LogIn,
  LogOut,
  Eye,
  FileDown,
  CheckCircle2,
  XCircle,
  ClipboardCheck,
  ClipboardX,
  Bell,
  CheckSquare,
  AlertTriangle,
  Filter,
  Clock,
  User,
  FileText,
} from 'lucide-react';

const roleLabels: Record<UserRole, string> = {
  merchant: '商户',
  admin: '管理员',
  director: '主任',
  supervisor: '食药监',
};

const roleColors: Record<UserRole, string> = {
  merchant: 'bg-accent-green/20 text-accent-green border-accent-green/30',
  admin: 'bg-accent-cyan/20 text-accent-cyan border-accent-cyan/30',
  director: 'bg-accent-purple/20 text-accent-purple border-accent-purple/30',
  supervisor: 'bg-accent-orange/20 text-accent-orange border-accent-orange/30',
};

const actionLabels: Record<string, string> = {
  login: '登录',
  logout: '退出',
  view_page: '页面访问',
  export_report: '导出报表',
  approve_restock: '审批补货',
  reject_restock: '驳回补货',
  sign_recall: '签收召回',
  reject_recall: '取消召回',
  acknowledge_alert: '确认预警',
  resolve_alert: '处理预警',
  escalate_alert: '升级预警',
};

const actionIcons: Record<string, any> = {
  login: LogIn,
  logout: LogOut,
  view_page: Eye,
  export_report: FileDown,
  approve_restock: CheckCircle2,
  reject_restock: XCircle,
  sign_recall: ClipboardCheck,
  reject_recall: ClipboardX,
  acknowledge_alert: Bell,
  resolve_alert: CheckSquare,
  escalate_alert: AlertTriangle,
};

const actionColors: Record<string, string> = {
  login: 'text-accent-green',
  logout: 'text-gray-400',
  view_page: 'text-accent-cyan',
  export_report: 'text-accent-purple',
  approve_restock: 'text-accent-green',
  reject_restock: 'text-accent-red',
  sign_recall: 'text-accent-orange',
  reject_recall: 'text-accent-red',
  acknowledge_alert: 'text-accent-yellow',
  resolve_alert: 'text-accent-green',
  escalate_alert: 'text-accent-red',
};

function formatTime(date: Date): string {
  const d = new Date(date);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

type RoleFilter = 'all' | UserRole;

export default function AuditPage() {
  const { getAuditLogs, currentUser } = useAppStore();
  const logs = getAuditLogs();
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  const filteredLogs = useMemo(() => {
    if (roleFilter === 'all') return logs;
    return logs.filter((log) => log.role === roleFilter);
  }, [logs, roleFilter]);

  const availableRoles = useMemo(() => {
    const roles = new Set<UserRole>();
    logs.forEach((log) => roles.add(log.role));
    return Array.from(roles);
  }, [logs]);

  return (
    <div className="min-h-screen bg-bg-primary text-white">
      <TopBar />
      <div className="pt-20 pb-10 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-tech font-bold text-white mb-1 flex items-center gap-2">
                <ShieldCheck size={24} className="text-accent-cyan" />
                权限审计
              </h1>
              <p className="text-sm text-gray-400">系统操作日志与权限审计记录</p>
            </div>

            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <div className="flex gap-1.5 bg-bg-secondary/50 rounded-xl p-1">
                <button
                  onClick={() => setRoleFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                    roleFilter === 'all'
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  全部
                </button>
                {availableRoles.map((role) => (
                  <button
                    key={role}
                    onClick={() => setRoleFilter(role)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                      roleFilter === role
                        ? 'bg-white/10 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {roleLabels[role]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-4 text-xs text-gray-500">
            共 {filteredLogs.length} 条记录
            {currentUser?.role === 'merchant' && '（仅显示您自己的操作记录）'}
            {currentUser?.role === 'supervisor' && '（显示召回相关操作及您的记录）'}
          </div>

          {filteredLogs.length > 0 ? (
            <div className="space-y-3">
              {filteredLogs.map((log: AuditLog) => {
                const ActionIcon = actionIcons[log.action] || FileText;
                return (
                  <div
                    key={log.id}
                    className="bg-bg-secondary/40 backdrop-blur border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-bg-glass flex items-center justify-center border border-white/5">
                        <ActionIcon size={18} className={actionColors[log.action] || 'text-gray-400'} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2 mb-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${roleColors[log.role]}`}>
                            {roleLabels[log.role]}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-bg-glass ${actionColors[log.action] || 'text-gray-400'}`}>
                            {actionLabels[log.action] || log.action}
                          </span>
                          {log.targetId && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/5 text-gray-300 border border-white/5">
                              {log.targetType === 'restock' ? '补货单' : log.targetType === 'recall' ? '召回单' : log.targetType === 'alert' ? '预警' : '单据'}: {log.targetId}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 mb-2 text-sm">
                          <div className="flex items-center gap-1.5 text-gray-300">
                            <User size={14} className="text-gray-500" />
                            <span>{log.userName}</span>
                            <span className="text-gray-600">({log.userId})</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <Clock size={14} className="text-gray-500" />
                            <span className="font-mono text-xs">{formatTime(log.time)}</span>
                          </div>
                        </div>

                        {log.detail && (
                          <div className="text-sm text-gray-300 bg-white/5 rounded-lg px-3 py-2">
                            {log.detail}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">
              <ShieldCheck size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">暂无审计日志记录</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
