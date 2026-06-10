import * as XLSX from 'xlsx';
import { DailyReport, OperationReport, EmergencyReport, Stall, InspectionRecord, Alert, RestockRequest, RecallOrder, ColdStorage } from '../types';

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

interface RestockRow {
  申请编号: string;
  摊位名称: string;
  产品名称: string;
  申请数量: number;
  当前库存: number;
  安全阈值: number;
  申请时间: string;
  状态: string;
  当前处理人角色: string;
}

interface RecallRow {
  召回单号: string;
  摊位名称: string;
  产品名称: string;
  召回数量: number;
  已召回数量: number;
  货架状态: string;
  创建时间: string;
  状态: string;
  完成备注: string;
}

interface ColdStorageRow {
  冷库编号: string;
  冷库名称: string;
  当前温度: number;
  当前湿度: number;
  温度范围: string;
  湿度范围: string;
  主制冷状态: string;
  备制冷状态: string;
  状态: string;
  预警持续分钟: number;
}

export const exportOperationDaily = (
  report: OperationReport,
  stalls: Stall[],
  inspections: InspectionRecord[],
  restocks: RestockRequest[],
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

  const restockStatusMap: Record<string, string> = {
    pending_merchant: '待商户提交',
    pending_admin: '待管理员审批',
    pending_director: '待主任审批',
    approved: '已通过',
    rejected: '已驳回',
  };

  const roleMap: Record<string, string> = {
    merchant: '商户',
    admin: '管理员',
    director: '主任',
    supervisor: '食药监',
  };

  const scopeLabel = isAllScope ? '全市场' : `${report.merchantName || '商户'}专属`;

  const stallNameMap: Record<string, string> = {};
  stalls.forEach((s) => {
    stallNameMap[s.id] = s.name;
  });

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
  XLSX.utils.book_append_sheet(wb, ws1, '销售库存统计');

  const inspectionData: any[] = inspections.flatMap((ins) =>
    ins.items.map((item) => ({
      样品编号: ins.sampleNo,
      摊位名称: stallNameMap[ins.stallId] || ins.stallId,
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
  XLSX.utils.book_append_sheet(wb, ws2, '检测记录明细');

  const restockData: RestockRow[] = restocks.map((r) => ({
    申请编号: r.id,
    摊位名称: stallNameMap[r.stallId] || r.stallId,
    产品名称: r.productName,
    申请数量: r.quantity,
    当前库存: r.currentStock,
    安全阈值: r.safeThreshold,
    申请时间: new Date(r.createTime).toLocaleString('zh-CN'),
    状态: restockStatusMap[r.status] || r.status,
    当前处理人角色: roleMap[r.currentHandlerRole] || r.currentHandlerRole,
  }));
  const ws3 = XLSX.utils.json_to_sheet(restockData);
  ws3['!cols'] = [
    { wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 20 }, { wch: 14 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, '补货申请明细');

  const summary = [
    [`智慧农贸市场运营日报（${scopeLabel}）`],
    [],
    ['导出日期', report.date],
    report.merchantName ? ['商户名称', report.merchantName] : [],
    ['--- 销售与客流 ---', ''],
    ['总销售额（元）', report.totalSales.toLocaleString()],
    ['总客流量（人次）', report.totalPassenger.toLocaleString()],
    ['平均客流热度（%）', report.avgPassengerHeat],
    ['--- 摊位状态 ---', ''],
    ['正常营业摊位数', report.normalStallCount],
    ['库存不足摊位数', report.lowStockStallCount],
    ['--- 检测统计 ---', ''],
    ['检测样品数', report.inspectionCount],
    ['不合格样品数', report.unqualifiedCount],
    ['检测不合格率（%）', report.unqualifiedRate.toFixed(2)],
    ['--- 补货审批 ---', ''],
    ['补货申请数', report.restockRequestCount],
    ['补货通过数', report.restockApprovedCount],
  ].filter(Boolean);
  const ws4 = XLSX.utils.aoa_to_sheet(summary);
  ws4['!cols'] = [{ wch: 25 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, ws4, '运营日报概览');

  const merchantTag = report.merchantName ? `_${report.merchantName}` : '';
  const scopeTag = isAllScope ? '全市场' : '商户';
  const fileName = `运营日报_${report.date}_${scopeTag}${merchantTag}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

export const exportEmergencyDaily = (
  report: EmergencyReport,
  alerts: Alert[],
  recalls: RecallOrder[],
  coldStorages: ColdStorage[],
  isAllScope: boolean
) => {
  const wb = XLSX.utils.book_new();

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

  const recallStatusMap: Record<string, string> = {
    pending_inspector: '待食药监签收',
    pending_admin: '待管理员审批',
    pending_supervisor: '待食药监终审',
    completed: '已完成',
    cancelled: '已取消',
  };

  const shelfStatusMap: Record<string, string> = {
    on_shelf: '在架',
    taken_down: '已下架',
    recalled: '已召回',
    archived: '已归档',
  };

  const coolingStatusMap: Record<string, string> = {
    running: '运行中',
    stopped: '已停止',
    fault: '故障',
    standby: '待机',
  };

  const coldStorageStatusMap: Record<string, string> = {
    normal: '正常',
    warning: '预警',
    critical: '严重',
    resolved: '已解决',
    archived: '已归档',
  };

  const scopeLabel = isAllScope ? '全市场' : `${report.merchantName || '商户'}专属`;

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
  const ws1 = XLSX.utils.json_to_sheet(emergencyData);
  ws1['!cols'] = [
    { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 50 }, { wch: 20 },
    { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, '预警明细');

  const recallData: RecallRow[] = recalls.map((r) => ({
    召回单号: r.id,
    摊位名称: r.stallId,
    产品名称: r.productName,
    召回数量: r.quantity,
    已召回数量: r.recalledQuantity,
    货架状态: shelfStatusMap[r.shelfStatus] || r.shelfStatus,
    创建时间: new Date(r.createTime).toLocaleString('zh-CN'),
    状态: recallStatusMap[r.status] || r.status,
    完成备注: r.completeNote || '-',
  }));
  const ws2 = XLSX.utils.json_to_sheet(recallData);
  ws2['!cols'] = [
    { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 20 }, { wch: 14 }, { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, '召回明细');

  const coldStorageData: ColdStorageRow[] = coldStorages.map((cs) => ({
    冷库编号: cs.id,
    冷库名称: cs.name,
    当前温度: cs.temperature,
    当前湿度: cs.humidity,
    温度范围: `${cs.tempThreshold.min}~${cs.tempThreshold.max}℃`,
    湿度范围: `${cs.humidityThreshold.min}~${cs.humidityThreshold.max}%`,
    主制冷状态: coolingStatusMap[cs.mainCoolingStatus] || cs.mainCoolingStatus,
    备制冷状态: coolingStatusMap[cs.backupCoolingStatus] || cs.backupCoolingStatus,
    状态: coldStorageStatusMap[cs.status] || cs.status,
    预警持续分钟: cs.warningDuration,
  }));
  const ws3 = XLSX.utils.json_to_sheet(coldStorageData);
  ws3['!cols'] = [
    { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 14 },
    { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, '冷库明细');

  const summary = [
    [`智慧农贸市场应急日报（${scopeLabel}）`],
    [],
    ['导出日期', report.date],
    report.merchantName ? ['商户名称', report.merchantName] : [],
    ['--- 预警统计 ---', ''],
    ['预警总数', report.alertCount],
    ['待处理预警数', report.alertPendingCount],
    ['已处理预警数', report.alertResolvedCount],
    ['预警升级次数', report.alertEscalatedCount],
    ['平均处置时长（分钟）', report.alertAvgHandlingMinutes || '-'],
    ['消防应急事件数', report.emergencyCount],
    ['--- 召回统计 ---', ''],
    ['召回工单数', report.recallOrderCount],
    ['召回完成数', report.recallCompletedCount],
    ['召回总数量', report.recallTotalQuantity],
    ['实际召回数量', report.recallRecalledQuantity],
    ['--- 冷库统计 ---', ''],
    ['冷库预警总数', report.coldStorageAlertCount],
    ['冷库预警升级数', report.coldStorageEscalatedCount],
    ['正常冷库数', report.coldStorageNormalCount],
    ['预警中冷库数', report.coldStorageWarningCount],
    ['严重冷库数', report.coldStorageCriticalCount],
  ].filter(Boolean);
  const ws4 = XLSX.utils.aoa_to_sheet(summary);
  ws4['!cols'] = [{ wch: 25 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, ws4, '应急日报概览');

  const merchantTag = report.merchantName ? `_${report.merchantName}` : '';
  const scopeTag = isAllScope ? '全市场' : '商户';
  const fileName = `应急日报_${report.date}_${scopeTag}${merchantTag}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
