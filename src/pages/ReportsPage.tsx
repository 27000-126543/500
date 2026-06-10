import { useMemo } from 'react';
import TopBar from '../components/layout/TopBar';
import SalesChart from '../components/charts/SalesChart';
import PassengerForecast from '../components/charts/PassengerForecast';
import TempHumidityChart from '../components/charts/TempHumidityChart';
import StatCard from '../components/ui/StatCard';
import { useAppStore } from '../store/useAppStore';
import { PermissionConst } from '../types';
import {
  DollarSign,
  Users,
  ClipboardCheck,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Thermometer,
  Car,
  TrendingUp,
  Clock,
  Package,
  CheckCircle,
  Snowflake,
} from 'lucide-react';

export default function ReportsPage() {
  const { stalls, inspections, alerts, parkingSpots, coldStorages, exportOperationReport, exportEmergencyReport, hasPermission, getFilteredData, currentUser } = useAppStore();

  const scopeAll = hasPermission(PermissionConst.VIEW_REPORTS_ALL);
  const { filteredStalls, filteredAlerts, filteredRestockRequests, filteredRecallOrders } = getFilteredData();

  const workStalls = scopeAll ? stalls : filteredStalls;

  const scopeLabel = useMemo(() => {
    if (!currentUser) return '全市场';
    if (currentUser.role === 'merchant' && workStalls.length > 0) {
      return `${currentUser.name} · ${workStalls[0].name}`;
    }
    return '全市场';
  }, [currentUser, workStalls]);
  const workInspections = scopeAll
    ? inspections
    : inspections.filter((i) => workStalls.some((s) => s.id === i.stallId));
  const workAlerts = scopeAll ? alerts : filteredAlerts;
  const workRestocks = scopeAll ? (useAppStore.getState().restockRequests.filter((r) => !r.archived)) : filteredRestockRequests;
  const workRecalls = scopeAll ? (useAppStore.getState().recallOrders.filter((r) => !r.archived)) : filteredRecallOrders;
  const workColdStorages = scopeAll ? coldStorages : [];

  const totalSales = workStalls.reduce((sum, s) => sum + s.salesToday, 0);
  const totalPassenger = Math.round(workStalls.reduce((sum, s) => sum + s.passengerHeat * 10, 0));
  const passRate = workInspections.length > 0
    ? ((workInspections.filter((i) => i.overallResult === 'pass').length / workInspections.length) * 100).toFixed(1)
    : '100';
  const unqualifiedRate = (100 - parseFloat(passRate)).toFixed(1);
  const emergencyCount = workAlerts.filter((a) => a.level === 'critical').length;

  const totalParking = parkingSpots.length;
  const occupiedParking = parkingSpots.filter((p) => p.occupied).length;
  const avgTemp = workColdStorages.length > 0
    ? (workColdStorages.reduce((s, c) => s + c.temperature, 0) / workColdStorages.length).toFixed(1)
    : '0.0';

  const coldStorageAlertList = workColdStorages.flatMap((cs) => [
    ...cs.alertHistory,
    ...(cs.currentAlert ? [cs.currentAlert] : []),
  ]);
  const coldStorageAlertCount = coldStorageAlertList.length;
  const coldStorageEscalatedCount = coldStorageAlertList.reduce(
    (sum, a) => sum + (a.escalationRecords?.length || 0),
    0
  );
  const nonColdStorageEscalatedCount = workAlerts
    .filter((a) => a.type !== 'coldstorage')
    .reduce((sum, a) => sum + (a.escalationRecords?.length || 0), 0);

  const alertEscalatedCount = coldStorageEscalatedCount + nonColdStorageEscalatedCount;

  const resolvedAlertsWithDuration = workAlerts.filter((a) => a.resolved && a.handlingDurationMinutes);
  const coldResolvedWithDuration = coldStorageAlertList.filter((a) => a.handlingDurationMinutes);
  const allDurations = [
    ...resolvedAlertsWithDuration.map((a) => a.handlingDurationMinutes || 0),
    ...coldResolvedWithDuration.map((a) => a.handlingDurationMinutes || 0),
  ];
  const avgHandlingMinutes = allDurations.length > 0
    ? Math.round(allDurations.reduce((sum, d) => sum + d, 0) / allDurations.length)
    : 0;

  const restockApprovedCount = workRestocks.filter((r) => r.status === 'approved').length;
  const recallCompletedCount = workRecalls.filter((r) => r.status === 'completed').length;

  const canExportAll = hasPermission(PermissionConst.EXPORT_REPORT_ALL);
  const canExportOwn = hasPermission(PermissionConst.EXPORT_REPORT_OWN);
  const showExportButton = canExportAll || canExportOwn;
  const canViewEmergency = hasPermission(PermissionConst.VIEW_EMERGENCY_STATS) || canExportAll;
  const operationButtonText = canExportAll ? '导出全市场运营日报' : '导出我的摊位运营日报';
  const emergencyButtonText = canExportAll ? '导出全市场应急日报' : '导出我的摊位应急日报';

  return (
    <div className="min-h-screen bg-bg-primary text-white">
      <TopBar />
      <div className="pt-20 pb-10 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-tech font-bold text-white mb-1">数据统计中心</h1>
              <p className="text-sm text-gray-400">运营数据汇总、趋势分析与日报导出</p>
            </div>
            {showExportButton && (
              <div className="flex items-center gap-3">
                <button
                  onClick={exportOperationReport}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-green to-accent-cyan text-white font-medium text-sm shadow-glow-green hover:shadow-lg transition-all"
                >
                  <FileSpreadsheet size={18} />
                  {operationButtonText}
                  <Download size={16} />
                </button>
                {canViewEmergency && (
                  <button
                    onClick={exportEmergencyReport}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-orange to-accent-red text-white font-medium text-sm shadow-glow-orange hover:shadow-lg transition-all"
                  >
                    <AlertTriangle size={18} />
                    {emergencyButtonText}
                    <Download size={16} />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard
              title="今日总销售额"
              value={`¥${totalSales.toLocaleString()}`}
              change="12.5%"
              changePositive
              icon={DollarSign}
              color="#00C48C"
            />
            <StatCard
              title="今日总客流"
              value={totalPassenger.toLocaleString()}
              change="8.2%"
              changePositive
              icon={Users}
              color="#00E5FF"
            />
            <StatCard
              title="检测不合格率"
              value={`${unqualifiedRate}%`}
              change="0.3%"
              changePositive={false}
              icon={ClipboardCheck}
              color="#FF3D57"
            />
            <StatCard
              title="应急事件数"
              value={emergencyCount}
              icon={AlertTriangle}
              color={emergencyCount > 0 ? '#FF8C00' : '#7B61FF'}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatCard
              title="平均冷库温度"
              value={`${avgTemp}℃`}
              icon={Thermometer}
              color="#00E5FF"
            />
            <StatCard
              title="停车位占用率"
              value={`${((occupiedParking / totalParking) * 100).toFixed(0)}%`}
              subInfo={
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {occupiedParking} / {totalParking} 已占用
                </p>
              }
              icon={Car}
              color="#7B61FF"
            />
            <StatCard
              title="今日检测样品"
              value={workInspections.length}
              subInfo={
                <p className="text-[10px] text-gray-400 mt-0.5">
                  合格 {workInspections.filter((i) => i.overallResult === 'pass').length} · 不合格 {workInspections.filter((i) => i.overallResult === 'fail').length}
                </p>
              }
              icon={ClipboardCheck}
              color="#FFD93D"
            />
          </div>

          <div className="grid grid-cols-5 gap-4 mb-6">
            <StatCard
              title="预警升级次数"
              value={alertEscalatedCount}
              subInfo={
                <p className="text-[10px] text-gray-400 mt-0.5">
                其他预警 {nonColdStorageEscalatedCount} · 冷库 {coldStorageEscalatedCount}
                </p>
              }
              icon={TrendingUp}
              color="#FF8C00"
            />
            <StatCard
              title="平均处置时长"
              value={`${avgHandlingMinutes}分钟`}
              subInfo={
                <p className="text-[10px] text-gray-400 mt-0.5">
                  共 {allDurations.length} 条处置记录
                </p>
              }
              icon={Clock}
              color="#00C48C"
            />
            <StatCard
              title="补货审批数"
              value={restockApprovedCount}
              subInfo={
                <p className="text-[10px] text-gray-400 mt-0.5">
                  申请总数 {workRestocks.length}
                </p>
              }
              icon={Package}
              color="#7B61FF"
            />
            <StatCard
              title="召回完成数"
              value={recallCompletedCount}
              subInfo={
                <p className="text-[10px] text-gray-400 mt-0.5">
                  召回单总数 {workRecalls.length}
                </p>
              }
              icon={CheckCircle}
              color="#FF3D57"
            />
            <StatCard
              title="冷库预警数"
              value={coldStorageAlertCount}
              subInfo={
                <p className="text-[10px] text-gray-400 mt-0.5">
                  升级 {coldStorageEscalatedCount} · 处置中 {coldStorageAlertList.filter((a) => !a.archived).length}
                </p>
              }
              icon={Snowflake}
              color="#00E5FF"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="rounded-xl bg-bg-glass backdrop-blur-md border border-accent-cyan/20 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-tech text-accent-cyan tracking-widest mb-0.5">SALES TREND</p>
                  <h3 className="text-base font-medium text-white">分类销售统计</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">统计范围：{scopeLabel}</p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded bg-accent-green/20 text-accent-green">今日</span>
              </div>
              <div className="h-64">
                <SalesChart stalls={workStalls} scopeLabel={scopeLabel} />
              </div>
            </div>

            <div className="rounded-xl bg-bg-glass backdrop-blur-md border border-accent-cyan/20 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-tech text-accent-cyan tracking-widest mb-0.5">PASSENGER FORECAST</p>
                  <h3 className="text-base font-medium text-white">客流趋势预测</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">统计范围：{scopeLabel}</p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded bg-accent-orange/20 text-accent-orange">今日 +12.5%</span>
              </div>
              <div className="h-64">
                <PassengerForecast scopeLabel={scopeLabel} />
              </div>
            </div>
          </div>

          {scopeAll && (
            <div className="rounded-xl bg-bg-glass backdrop-blur-md border border-accent-cyan/20 p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-tech text-accent-cyan tracking-widest mb-0.5">COLD STORAGE MONITOR</p>
                  <h3 className="text-base font-medium text-white">冷库温湿度监测趋势</h3>
                </div>
                <div className="flex items-center gap-3">
                  {workColdStorages.map((cs) => (
                    <div
                      key={cs.id}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded border ${
                        cs.status === 'normal'
                          ? 'border-accent-green/40 bg-accent-green/10'
                          : cs.status === 'warning'
                          ? 'border-accent-orange/40 bg-accent-orange/10 animate-blink-orange'
                          : 'border-accent-red/40 bg-accent-red/10 animate-blink-red'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor:
                            cs.status === 'normal'
                              ? '#00C48C'
                              : cs.status === 'warning'
                              ? '#FF8C00'
                              : '#FF3D57',
                        }}
                      />
                      <span className="text-[11px] text-gray-300">{cs.name}</span>
                      <span className="text-[11px] text-gray-400">{cs.temperature}℃</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-56">
                <TempHumidityChart />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-bg-glass backdrop-blur-md border border-accent-cyan/20 p-5">
              <p className="text-xs font-tech text-accent-cyan tracking-widest mb-3">INSPECTION RECORDS · 检测记录</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {workInspections.map((ins) => (
                  <div
                    key={ins.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary/40 border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          ins.overallResult === 'pass' ? 'bg-accent-green/20' : 'bg-accent-red/20'
                        }`}
                      >
                        <ClipboardCheck
                          size={16}
                          className={ins.overallResult === 'pass' ? 'text-accent-green' : 'text-accent-red'}
                        />
                      </div>
                      <div>
                        <p className="text-sm text-white">{ins.productName}</p>
                        <p className="text-[10px] text-gray-500">
                          {ins.sampleNo} · {ins.inspector}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                          ins.overallResult === 'pass'
                            ? 'bg-accent-green/20 text-accent-green'
                            : 'bg-accent-red/20 text-accent-red'
                        }`}
                      >
                        {ins.overallResult === 'pass' ? '合格' : '不合格'}
                      </span>
                      <p className="text-[10px] text-gray-500 mt-1">
                        {new Date(ins.inspectTime).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-bg-glass backdrop-blur-md border border-accent-cyan/20 p-5">
              <p className="text-xs font-tech text-accent-cyan tracking-widest mb-3">ALERT HISTORY · 预警历史</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {workAlerts.map((alert) => {
                  const typeMap: Record<string, string> = {
                    inventory: '库存',
                    coldstorage: '冷库',
                    inspection: '检测',
                    parking: '停车',
                    fire: '消防',
                  };
                  const levelColors: Record<string, string> = {
                    info: 'text-accent-cyan bg-accent-cyan/20',
                    warning: 'text-accent-orange bg-accent-orange/20',
                    critical: 'text-accent-red bg-accent-red/20',
                  };
                  const levelLabels: Record<string, string> = {
                    info: '提示',
                    warning: '警告',
                    critical: '严重',
                  };
                  return (
                    <div
                      key={alert.id}
                      className={`flex items-start justify-between p-3 rounded-lg bg-bg-tertiary/40 border border-white/5 ${
                        !alert.acknowledged ? 'animate-pulse' : 'opacity-60'
                      }`}
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${levelColors[alert.level]}`}>
                            {levelLabels[alert.level]}
                          </span>
                          <span className="text-[10px] text-gray-500">{typeMap[alert.type]}预警</span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">{alert.message}</p>
                      </div>
                      <span className="text-[10px] text-gray-500 shrink-0">
                        {new Date(alert.createTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
