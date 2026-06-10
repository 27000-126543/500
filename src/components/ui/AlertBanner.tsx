import { Alert, PermissionConst } from '../../types';
import { getAlertColor } from '../../utils/alertEngine';
import { Package, Thermometer, ClipboardList, Car, Flame, X, Check, Clock, ArrowUpCircle, User } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useState } from 'react';

const iconMap = {
  inventory: Package,
  coldstorage: Thermometer,
  inspection: ClipboardList,
  parking: Car,
  fire: Flame,
};

const typeLabelMap: Record<string, string> = {
  inventory: '库存',
  coldstorage: '冷库',
  inspection: '检测',
  parking: '停车',
  fire: '消防',
};

const levelLabelMap: Record<string, string> = {
  info: '提示',
  warning: '警告',
  critical: '严重',
};

const roleLabelMap: Record<string, string> = {
  merchant: '商户',
  admin: '管理员',
  director: '主任',
  supervisor: '主管',
};

interface AlertBannerProps {
  alert: Alert;
}

const TIMEOUT_THRESHOLD: Record<string, number> = {
  critical: 10,
  warning: 30,
  info: 60,
};

export default function AlertBanner({ alert }: AlertBannerProps) {
  const acknowledgeAlert = useAppStore((s) => s.acknowledgeAlert);
  const resolveColdStorageAlert = useAppStore((s) => s.resolveColdStorageAlert);
  const hasPermission = useAppStore((s) => s.hasPermission);
  const color = getAlertColor(alert.level);
  const Icon = iconMap[alert.type];
  const [showEscalationDetails, setShowEscalationDetails] = useState(false);

  const elapsedMinutes = Math.floor((Date.now() - new Date(alert.createTime).getTime()) / 60000);
  const threshold = TIMEOUT_THRESHOLD[alert.level] || 30;
  const isTimeout = !alert.resolved && elapsedMinutes > threshold;

  const canResolveColdStorage = hasPermission(PermissionConst.MANAGE_COLDSTORAGE) && alert.type === 'coldstorage' && !alert.resolved;

  return (
    <div
      className={`relative rounded-lg p-3 mb-2 border backdrop-blur-md transition-all ${
        alert.resolved ? 'opacity-60' : alert.acknowledged ? 'opacity-80' : ''
      } ${
        !alert.resolved && alert.level === 'critical' ? 'animate-blink-red' : !alert.resolved && alert.level === 'warning' ? 'animate-blink-orange' : ''
      }`}
      style={{
        backgroundColor: `${color}15`,
        borderColor: `${color}60`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="p-1.5 rounded shrink-0"
          style={{ backgroundColor: `${color}30` }}
        >
          <Icon size={16} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-xs font-bold" style={{ color }}>
              【{levelLabelMap[alert.level]}】{typeLabelMap[alert.type]}预警
            </span>
            <span className="text-[10px] text-gray-400">
              {new Date(alert.createTime).toLocaleTimeString('zh-CN')}
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                isTimeout ? 'bg-red-500/40 text-red-300 font-bold' : 'bg-gray-500/20 text-gray-400'
              }`}
            >
              <Clock size={10} />
              {alert.resolved ? (
                <span>已处置 {alert.handlingDurationMinutes ?? elapsedMinutes}分钟</span>
              ) : (
                <span>处置中 {elapsedMinutes}分钟</span>
              )}
            </span>
            {alert.escalationCount > 0 && (
              <button
                onClick={() => setShowEscalationDetails(!showEscalationDetails)}
                className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 bg-red-500/30 text-red-400 hover:bg-red-500/40 transition-colors`}
              >
                <ArrowUpCircle size={10} />
                已升级{alert.escalationCount}次
              </button>
            )}
            {alert.resolved && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/30 text-green-400 flex items-center gap-0.5">
                <Check size={10} />
                已解决
              </span>
            )}
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">{alert.message}</p>

          {showEscalationDetails && alert.escalationCount > 0 && (
            <div className="mt-2 p-2 rounded bg-red-500/10 border border-red-500/20">
              <div className="text-[10px] text-red-400 font-bold mb-1">升级记录：</div>
              {alert.escalationRecords.map((record, index) => (
                <div key={index} className="text-[10px] text-gray-400 py-0.5 border-b border-gray-700/30 last:border-0">
                  <span className="text-red-400">#{index + 1}</span>
                  <span className="mx-1">【{levelLabelMap[record.level]}】</span>
                  <span className="mx-1">通知{roleLabelMap[record.notifiedRole] || record.notifiedRole}</span>
                  <span className="text-gray-500">
                    {new Date(record.escalateTime).toLocaleTimeString('zh-CN')}
                  </span>
                  <div className="text-gray-500 ml-4">{record.reason}</div>
                </div>
              ))}
            </div>
          )}

          {(alert.acknowledgedBy || alert.resolvedBy) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {alert.acknowledgedBy && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 flex items-center gap-0.5">
                  <User size={10} />
                  确认人：{alert.acknowledgedBy}
                  {alert.acknowledgedTime && (
                    <span className="text-gray-500 ml-1">
                      {new Date(alert.acknowledgedTime).toLocaleTimeString('zh-CN')}
                    </span>
                  )}
                </span>
              )}
              {alert.resolvedBy && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 flex items-center gap-0.5">
                  <Check size={10} />
                  解决人：{alert.resolvedBy}
                  {alert.resolvedTime && (
                    <span className="text-gray-500 ml-1">
                      {new Date(alert.resolvedTime).toLocaleTimeString('zh-CN')}
                    </span>
                  )}
                </span>
              )}
              {alert.resolved && alert.handlingDurationMinutes !== undefined && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 flex items-center gap-0.5">
                  <Clock size={10} />
                  处置时长：{alert.handlingDurationMinutes}分钟
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          {!alert.acknowledged && !alert.resolved && (
            <button
              onClick={() => acknowledgeAlert(alert.id)}
              className="p-1 rounded hover:bg-white/10 transition-colors"
              title="确认预警"
            >
              <Check size={14} style={{ color }} />
            </button>
          )}
          {canResolveColdStorage && (
            <button
              onClick={() => resolveColdStorageAlert(alert.targetId)}
              className="p-1 rounded hover:bg-green-500/20 transition-colors bg-green-500/10 border border-green-500/30"
              title="解决冷库预警"
            >
              <Thermometer size={14} className="text-green-400" />
            </button>
          )}
          {alert.resolved && (
            <div className="p-1">
              <Check size={14} className="text-green-500" />
            </div>
          )}
          {alert.acknowledged && !alert.resolved && (
            <div className="p-1">
              <X size={14} className="text-gray-500" />
            </div>
          )}
        </div>
      </div>
      {canResolveColdStorage && (
        <div className="mt-2 pt-2 border-t border-gray-700/30">
          <button
            onClick={() => resolveColdStorageAlert(alert.targetId)}
            className="w-full text-xs py-1.5 px-3 rounded bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 transition-colors flex items-center justify-center gap-1"
          >
            <Thermometer size={12} />
            解决冷库预警
          </button>
        </div>
      )}
    </div>
  );
}
