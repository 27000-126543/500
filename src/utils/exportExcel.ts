import * as XLSX from 'xlsx';
import { DailyReport, Stall, InspectionRecord, Alert } from '../types';

interface SalesRow {
  摊位编号: string;
  摊位名称: string;
  商户: string;
  类别: string;
  今日销售额: number;
  库存: number;
  安全库存: number;
  客流热度: number;
  状态: string;
}

interface InspectionRow {
  样品编号: string;
  摊位名称: string;
  产品名称: string;
  检测员: string;
  检测时间: string;
  检测项目: string;
  检测结果: string;
  综合结果: string;
}

interface EmergencyRow {
  预警类型: string;
  预警级别: string;
  目标对象: string;
  预警内容: string;
  发生时间: string;
  是否确认: string;
  是否解决: string;
  处置时长分钟: number | string;
  升级次数: number;
  确认人: string;
  解决人: string;
}

export const generateDailyReportData = (
  stalls: Stall[],
  inspections: InspectionRecord[],
  alerts: Alert[]
): DailyReport => {
  const totalSales = stalls.reduce((sum, s) => sum + s.salesToday, 0);
  const totalPassenger = Math.round(stalls.reduce((sum, s) => sum + s.passengerHeat * 10, 0));
  const unqualified = inspections.filter((i) => i.overallResult === 'fail');

  const resolvedAlerts = alerts.filter((a) => a.resolved && a.handlingDurationMinutes);
  const alertAvgHandlingMinutes = resolvedAlerts.length > 0
    ? Math.round(resolvedAlerts.reduce((sum, a) => sum + (a.handlingDurationMinutes || 0), 0) / resolvedAlerts.length)
    : 0;

  return {
    date: new Date().toISOString().split('T')[0],
    scope: 'all',
    totalSales,
    totalPassenger,
    inspectionCount: inspections.length,
    unqualifiedCount: unqualified.length,
    unqualifiedRate: inspections.length > 0 ? (unqualified.length / inspections.length) * 100 : 0,
    emergencyCount: alerts.filter((a) => a.level === 'critical' && a.type === 'fire').length,
    alertCount: alerts.length,
    alertEscalatedCount: alerts.filter((a) => a.escalationCount > 0).length,
    alertAvgHandlingMinutes,
    restockRequestCount: 0,
    restockApprovedCount: 0,
    recallOrderCount: 0,
    recallCompletedCount: 0,
    recallTotalQuantity: 0,
    recallRecalledQuantity: 0,
    coldStorageAlertCount: 0,
    coldStorageEscalatedCount: 0,
  };
};

export const exportDailyReport = (
  report: DailyReport,
  stalls: Stall[],
  inspections: InspectionRecord[],
  alerts: Alert[],
  isAllScope: boolean
) => {
  const wb = XLSX.utils.book_new();

  const categoryMap: Record<string, string> = {
    vegetable: '蔬菜',
    meat: '肉类',
    seafood: '海鲜',
    fruit: '水果',
    grain: '粮油',
  };

  const statusMap: Record<string, string> = {
    normal: '正常',
    lowStock: '库存不足',
    unqualified: '检测不合格',
    closed: '已关闭',
  };

  const scopeLabel = isAllScope ? '全市场' : `${report.merchantName || '商户'}专属`;

  const salesData: SalesRow[] = stalls.map((s) => ({
    摊位编号: s.id,
    摊位名称: s.name,
    商户: s.merchantName,
    类别: categoryMap[s.category] || s.category,
    今日销售额: s.salesToday,
    库存: s.inventory,
    安全库存: s.safeInventoryThreshold,
    客流热度: s.passengerHeat,
    状态: statusMap[s.status] || s.status,
  }));
  const ws1 = XLSX.utils.json_to_sheet(salesData);
  ws1['!cols'] = [
    { wch: 10 }, { wch: 18 }, { wch: 10 }, { wch: 8 }, { wch: 12 },
    { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, '销售统计');

  const inspectionData: any[] = inspections.flatMap((ins) =>
    ins.items.map((item) => ({
      样品编号: ins.sampleNo,
      摊位名称: stalls.find((s) => s.id === ins.stallId)?.name || ins.stallId,
      产品名称: ins.productName,
      检测员: ins.inspector,
      检测时间: new Date(ins.inspectTime).toLocaleString('zh-CN'),
      检测项目: item.name,
      检测数值: item.value || '-',
      检测结果: item.result === 'pass' ? '合格' : '不合格',
      综合结果: ins.overallResult === 'pass' ? '合格' : '不合格',
      是否处理: ins.handled ? '是' : '否',
    }))
  );
  const ws2 = XLSX.utils.json_to_sheet(inspectionData);
  ws2['!cols'] = [
    { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 20 },
    { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, '检测记录');

  const typeMap: Record<string, string> = {
    inventory: '库存预警',
    coldstorage: '冷库预警',
    inspection: '检测预警',
    parking: '停车预警',
    fire: '消防预警',
  };
  const levelMap: Record<string, string> = {
    info: '提示',
    warning: '警告',
    critical: '严重',
  };
  const emergencyData: EmergencyRow[] = alerts.map((a) => ({
    预警类型: typeMap[a.type] || a.type,
    预警级别: levelMap[a.level] || a.level,
    目标对象: a.targetId,
    预警内容: a.message,
    发生时间: new Date(a.createTime).toLocaleString('zh-CN'),
    是否确认: a.acknowledged ? '是' : '否',
    是否解决: a.resolved ? '是' : '否',
    处置时长分钟: a.handlingDurationMinutes ?? '-',
    升级次数: a.escalationCount || 0,
    确认人: a.acknowledgedBy || '-',
    解决人: a.resolvedBy || '-',
  }));
  const ws3 = XLSX.utils.json_to_sheet(emergencyData);
  ws3['!cols'] = [
    { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 50 }, { wch: 20 },
    { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, '应急统计');

  const summary = [
    [`智慧农贸市场运营日报（${scopeLabel}）`],
    [],
    ['导出日期', report.date],
    report.merchantName ? ['商户名称', report.merchantName] : [],
    ['--- 核心指标 ---', ''],
    ['总销售额（元）', report.totalSales.toLocaleString()],
    ['总客流量（人次）', report.totalPassenger.toLocaleString()],
    ['检测样品数', report.inspectionCount],
    ['不合格样品数', report.unqualifiedCount],
    ['检测不合格率（%）', report.unqualifiedRate.toFixed(2)],
    ['--- 预警统计 ---', ''],
    ['预警总数', report.alertCount],
    ['预警升级次数', report.alertEscalatedCount],
    ['平均处置时长（分钟）', report.alertAvgHandlingMinutes || '-'],
    ['消防应急事件数', report.emergencyCount],
    ['--- 审批统计 ---', ''],
    ['补货申请数', report.restockRequestCount],
    ['补货通过数', report.restockApprovedCount],
    ['召回工单数', report.recallOrderCount],
    ['召回完成数', report.recallCompletedCount],
    ['召回总数量', report.recallTotalQuantity],
    ['实际召回数量', report.recallRecalledQuantity],
    ['--- 冷库统计 ---', ''],
    ['冷库预警总数', report.coldStorageAlertCount],
    ['冷库预警升级数', report.coldStorageEscalatedCount],
  ].filter(Boolean);
  const ws4 = XLSX.utils.aoa_to_sheet(summary);
  ws4['!cols'] = [{ wch: 25 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, ws4, '日报概览');

  const merchantTag = report.merchantName ? `_${report.merchantName}` : '';
  const scopeTag = isAllScope ? '全市场' : '商户';
  const fileName = `农贸市场日报_${report.date}_${scopeTag}${merchantTag}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
