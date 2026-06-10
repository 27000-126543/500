import Scene from '../components/3d/Scene';
import TopBar from '../components/layout/TopBar';
import BottomBar from '../components/layout/BottomBar';
import SidePanel from '../components/layout/SidePanel';
import SalesChart from '../components/charts/SalesChart';
import TempHumidityChart from '../components/charts/TempHumidityChart';
import {
  Thermometer,
  Wind,
  CloudSun,
  Calendar,
  Snowflake,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { weatherForecast, passengerForecast } from '../data/mockData';
import { useAppStore } from '../store/useAppStore';
import { PermissionConst } from '../types';
import { useEffect, useMemo, useState } from 'react';

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours}小时`);
  if (minutes > 0) parts.push(`${minutes}分`);
  parts.push(`${seconds}秒`);
  return parts.join('');
}

export default function DashboardPage() {
  const selectedObjectId = useAppStore((s) => s.selectedObjectId);
  const stalls = useAppStore((s) => s.stalls);
  const coldStorages = useAppStore((s) => s.coldStorages);
  const getFilteredData = useAppStore((s) => s.getFilteredData);
  const hasPermission = useAppStore((s) => s.hasPermission);
  const resolveColdStorageAlert = useAppStore((s) => s.resolveColdStorageAlert);
  const setSelectedObject = useAppStore((s) => s.setSelectedObject);

  const { filteredStalls } = useMemo(() => getFilteredData(), [getFilteredData]);
  const canManageColdStorage = hasPermission(PermissionConst.MANAGE_COLDSTORAGE);
  const canViewColdStorage = canManageColdStorage || hasPermission(PermissionConst.VIEW_EMERGENCY_STATS);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedStall = filteredStalls.find((s) => s.id === selectedObjectId);

  useEffect(() => {
    if (selectedObjectId) {
      const isOwnStall = filteredStalls.some((s) => s.id === selectedObjectId);
      if (!isOwnStall) {
        setSelectedObject(null);
      }
    }
  }, [selectedObjectId, filteredStalls, setSelectedObject]);

  const warningColdStorages = useMemo(
    () =>
      coldStorages.filter(
        (cs) => (cs.status === 'warning' || cs.status === 'critical') && cs.currentAlert && !cs.currentAlert.archived
      ),
    [coldStorages, now]
  );

  const categoryMap: Record<string, string> = {
    vegetable: '蔬菜',
    meat: '肉类',
    seafood: '海鲜',
    fruit: '水果',
    grain: '粮油',
  };

  return (
    <div className="min-h-screen bg-bg-primary text-white">
      <TopBar />
      <BottomBar />
      <SidePanel />

      <div className="pt-16 pb-14 pr-80 min-h-screen relative">
        <div className="absolute top-20 left-6 z-20 w-72 space-y-3">
          <div className="rounded-lg bg-bg-glass backdrop-blur-md border border-accent-cyan/20 p-4">
            <p className="text-[10px] font-tech text-accent-cyan tracking-widest mb-3">ENVIRONMENT · 环境信息</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <CloudSun size={18} className="text-accent-yellow" />
                <div>
                  <p className="text-[10px] text-gray-400">天气</p>
                  <p className="text-sm font-medium">{weatherForecast.today}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Thermometer size={18} className="text-accent-orange" />
                <div>
                  <p className="text-[10px] text-gray-400">温度</p>
                  <p className="text-sm font-medium">{weatherForecast.temp}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Wind size={18} className="text-accent-cyan" />
                <div>
                  <p className="text-[10px] text-gray-400">风力</p>
                  <p className="text-sm font-medium">{weatherForecast.wind}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-accent-purple" />
                <div>
                  <p className="text-[10px] text-gray-400">明日</p>
                  <p className="text-sm font-medium">
                    {weatherForecast.nextDayHoliday ? (
                      <span className="text-accent-orange">节假日</span>
                    ) : (
                      '工作日'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {canViewColdStorage && warningColdStorages.length > 0 && (
            <div className="rounded-lg bg-bg-glass backdrop-blur-md border border-accent-orange/40 shadow-glow-orange p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-accent-orange" />
                  <p className="text-[10px] font-tech text-accent-orange tracking-widest">
                    COLD STORAGE ALERT · 冷库处置闭环
                  </p>
                </div>
                <span className="text-[10px] text-accent-red">{warningColdStorages.length} 个预警</span>
              </div>
              <div className="space-y-2">
                {warningColdStorages.map((cs) => {
                  const alert = cs.currentAlert!;
                  const elapsed = now - new Date(alert.startTime).getTime();
                  const isCritical = cs.status === 'critical';
                  return (
                    <div
                      key={cs.id}
                      className={`rounded p-3 border ${
                        isCritical
                          ? 'bg-accent-red/10 border-accent-red/30'
                          : 'bg-accent-orange/10 border-accent-orange/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <Snowflake size={12} className={isCritical ? 'text-accent-red' : 'text-accent-orange'} />
                          <span className="text-xs font-medium text-white">{cs.name}</span>
                        </div>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                          style={{
                            backgroundColor: isCritical ? '#FF3D5730' : '#FF8C0030',
                            color: isCritical ? '#FF3D57' : '#FF8C00',
                          }}
                        >
                          {isCritical ? '严重' : '预警'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="bg-bg-tertiary/50 rounded p-1.5">
                          <div className="flex items-center gap-1 text-[9px] text-gray-400 mb-0.5">
                            <Clock size={10} />
                            <span>处置计时</span>
                          </div>
                          <p className={`text-xs font-bold ${isCritical ? 'text-accent-red' : 'text-accent-orange'}`}>
                            {formatDuration(elapsed)}
                          </p>
                        </div>
                        <div className="bg-bg-tertiary/50 rounded p-1.5">
                          <div className="flex items-center gap-1 text-[9px] text-gray-400 mb-0.5">
                            <TrendingUp size={10} />
                            <span>升级次数</span>
                          </div>
                          <p className={`text-xs font-bold ${alert.escalationCount > 0 ? 'text-accent-red' : 'text-white'}`}>
                            {alert.escalationCount}
                          </p>
                        </div>
                      </div>

                      <div className="text-[10px] text-gray-400 mb-2">
                        超标的{alert.exceedType === 'both' ? '温度/湿度' : alert.exceedType === 'temperature' ? '温度' : '湿度'}：
                        超出限值 <span className="text-accent-orange font-medium">{alert.maxExceedValue}</span>
                      </div>

                      {canManageColdStorage && (
                        <button
                          onClick={() => resolveColdStorageAlert(cs.id)}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-accent-green/20 border border-accent-green/40 text-accent-green text-[10px] font-medium hover:bg-accent-green/30 transition-colors"
                        >
                          <CheckCircle2 size={12} />
                          RESOLVE · 处置完成
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="rounded-lg bg-bg-glass backdrop-blur-md border border-accent-cyan/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-tech text-accent-cyan tracking-widest">SALES · 分类销售</p>
              <span className="text-[10px] text-accent-green">今日</span>
            </div>
            <div className="h-48">
              <SalesChart />
            </div>
          </div>

          <div className="rounded-lg bg-bg-glass backdrop-blur-md border border-accent-cyan/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-tech text-accent-cyan tracking-widest">COLD STORAGE · 冷库监测</p>
              <span className="text-[10px] text-accent-cyan">实时</span>
            </div>
            <div className="h-48">
              <TempHumidityChart />
            </div>
          </div>
        </div>

        {selectedStall && (
          <div className="absolute bottom-20 left-6 z-20 w-80 rounded-lg bg-bg-glass backdrop-blur-md border border-accent-cyan/40 shadow-glow-cyan p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-white">{selectedStall.name}</p>
                <p className="text-[11px] text-gray-400">商户: {selectedStall.merchantName}</p>
              </div>
              <span
                className="text-[10px] px-2 py-0.5 rounded"
                style={{
                  backgroundColor:
                    selectedStall.status === 'unqualified'
                      ? '#FF3D5730'
                      : selectedStall.status === 'lowStock'
                      ? '#FF8C0030'
                      : '#00C48C30',
                  color:
                    selectedStall.status === 'unqualified'
                      ? '#FF3D57'
                      : selectedStall.status === 'lowStock'
                      ? '#FF8C00'
                      : '#00C48C',
                }}
              >
                {selectedStall.status === 'unqualified'
                  ? '检测不合格'
                  : selectedStall.status === 'lowStock'
                  ? '库存预警'
                  : '正常营业'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-bg-tertiary/50 rounded p-2">
                <p className="text-[10px] text-gray-400">品类</p>
                <p className="text-sm font-medium text-white">{categoryMap[selectedStall.category]}</p>
              </div>
              <div className="bg-bg-tertiary/50 rounded p-2">
                <p className="text-[10px] text-gray-400">今日销售额</p>
                <p className="text-sm font-medium text-accent-green">¥{selectedStall.salesToday.toLocaleString()}</p>
              </div>
              <div className="bg-bg-tertiary/50 rounded p-2">
                <p className="text-[10px] text-gray-400">当前库存</p>
                <p
                  className="text-sm font-medium"
                  style={{
                    color:
                      selectedStall.inventory < selectedStall.safeInventoryThreshold
                        ? '#FF8C00'
                        : '#ffffff',
                  }}
                >
                  {selectedStall.inventory}
                  <span className="text-[10px] text-gray-500 ml-1">/ 安全值 {selectedStall.safeInventoryThreshold}</span>
                </p>
              </div>
              <div className="bg-bg-tertiary/50 rounded p-2">
                <p className="text-[10px] text-gray-400">客流热度</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-bg-primary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${selectedStall.passengerHeat}%`,
                        backgroundColor:
                          selectedStall.passengerHeat < 30
                            ? '#00C48C'
                            : selectedStall.passengerHeat < 60
                            ? '#FFD93D'
                            : selectedStall.passengerHeat < 80
                            ? '#FF8C00'
                            : '#FF3D57',
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-white">{selectedStall.passengerHeat}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="w-full h-[calc(100vh-120px)]">
          <Scene />
        </div>
      </div>
    </div>
  );
}
