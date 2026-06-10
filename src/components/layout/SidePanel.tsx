import { useAppStore } from '../../store/useAppStore';
import StatCard from '../ui/StatCard';
import AlertBanner from '../ui/AlertBanner';
import { passengerForecast as mockPassengerForecast } from '../../data/mockData';
import {
  DollarSign,
  Users,
  ClipboardCheck,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState, useMemo } from 'react';

export default function SidePanel() {
  const { stalls, inspections, alerts, currentUser, getFilteredData } = useAppStore();
  const passengerForecast = mockPassengerForecast;
  const [collapsed, setCollapsed] = useState(false);

  const { filteredStalls, filteredAlerts } = useMemo(() => getFilteredData(), [getFilteredData]);

  const filteredInspections = useMemo(() => {
    if (!currentUser) return inspections;
    if (currentUser.role === 'merchant') {
      const ownStallIds = new Set(filteredStalls.map((s) => s.id));
      return inspections.filter((i) => ownStallIds.has(i.stallId));
    }
    return inspections;
  }, [currentUser, filteredStalls, inspections]);

  const totalSales = filteredStalls.reduce((sum, s) => sum + s.salesToday, 0);
  const totalPassenger = passengerForecast?.current || Math.round(filteredStalls.reduce((sum, s) => sum + s.passengerHeat * 10, 0));
  const passRate = filteredInspections.length > 0
    ? ((filteredInspections.filter((i) => i.overallResult === 'pass').length / filteredInspections.length) * 100).toFixed(1)
    : '100';
  const activeAlerts = filteredAlerts.filter((a) => !a.acknowledged).length;
  const unacknowledgedAlerts = filteredAlerts.filter((a) => !a.acknowledged).slice(0, 5);

  return (
    <div
      className={`fixed right-0 top-16 bottom-14 z-30 transition-all duration-300 ${
        collapsed ? 'w-12' : 'w-80'
      }`}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-16 rounded-l-lg bg-bg-glass backdrop-blur-md border border-r-0 border-accent-cyan/20 flex items-center justify-center text-gray-400 hover:text-accent-cyan transition-colors z-10"
      >
        {collapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {!collapsed && (
        <div className="w-full h-full bg-bg-glass/80 backdrop-blur-xl border-l border-accent-cyan/20 overflow-y-auto p-4 space-y-4">
          <div>
            <h3 className="text-xs font-tech text-accent-cyan mb-3 tracking-wider">
              REAL-TIME DATA · 实时数据
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                title="今日销售额"
                value={`¥${totalSales.toLocaleString()}`}
                change="12.5%"
                changePositive
                icon={DollarSign}
                color="#00C48C"
              />
              <StatCard
                title="实时客流"
                value={totalPassenger.toLocaleString()}
                change={passengerForecast?.vsYesterday || '8.2%'}
                changePositive
                icon={Users}
                color="#00E5FF"
              />
              <StatCard
                title="检测合格率"
                value={`${passRate}%`}
                icon={ClipboardCheck}
                color="#7B61FF"
              />
              <StatCard
                title="活动预警"
                value={activeAlerts}
                icon={AlertTriangle}
                color={activeAlerts > 0 ? '#FF3D57' : '#FF8C00'}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-tech text-accent-cyan tracking-wider">
                ALERT CENTER · 预警中心
              </h3>
              <span className="text-[10px] text-gray-500">
                共 {filteredAlerts.length} 条
              </span>
            </div>
            <div className="space-y-2">
              {unacknowledgedAlerts.length > 0 ? (
                unacknowledgedAlerts.map((alert) => (
                  <AlertBanner key={alert.id} alert={alert} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 text-xs">
                  暂无待处理预警
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-tech text-accent-cyan mb-3 tracking-wider">
              FORECAST · 客流预测分区
            </h3>
            <div className="space-y-2">
              {passengerForecast?.zones?.map((zone: any) => {
                const levelColors: Record<string, string> = {
                  high: '#FF3D57',
                  medium: '#FFD93D',
                  low: '#00C48C',
                };
                const levelLabels: Record<string, string> = {
                  high: '高',
                  medium: '中',
                  low: '低',
                };
                const color = levelColors[zone.level] || '#888';
                return (
                  <div
                    key={zone.name}
                    className="rounded-lg bg-bg-tertiary/50 p-3 border border-white/5"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-white">{zone.name}</span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded font-medium"
                        style={{
                          backgroundColor: `${color}25`,
                          color,
                        }}
                      >
                        客流{levelLabels[zone.level]}
                      </span>
                    </div>
                    <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden mb-1.5">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${zone.level === 'high' ? 85 : zone.level === 'medium' ? 55 : 25}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400">{zone.suggestion}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
