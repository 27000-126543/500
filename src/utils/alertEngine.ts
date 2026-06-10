import { Stall, ColdStorage, Alert, UserRole } from '../types';

export const checkInventoryAlerts = (stalls: Stall[]): Alert[] => {
  const alerts: Alert[] = [];
  stalls.forEach((stall) => {
    if (stall.inventory < stall.safeInventoryThreshold && stall.status !== 'unqualified') {
      alerts.push({
        id: `inv_${stall.id}`,
        type: 'inventory',
        level: 'warning',
        targetId: stall.id,
        message: `${stall.name}库存(${stall.inventory})低于安全阈值(${stall.safeInventoryThreshold})，请及时补货`,
        createTime: new Date(),
        acknowledged: false,
        resolved: false,
        escalated: false,
        escalationCount: 0,
        escalationRecords: [],
        visibleToRoles: ['merchant', 'admin', 'director'] as UserRole[],
        archived: false,
      });
    }
  });
  return alerts;
};

export const checkColdStorageAlerts = (storages: ColdStorage[]): Alert[] => {
  const alerts: Alert[] = [];
  storages.forEach((cs) => {
    const tempOutOfRange = cs.temperature < cs.tempThreshold.min || cs.temperature > cs.tempThreshold.max;
    const humidityOutOfRange = cs.humidity < cs.humidityThreshold.min || cs.humidity > cs.humidityThreshold.max;
    if (tempOutOfRange || humidityOutOfRange) {
      alerts.push({
        id: `cs_${cs.id}`,
        type: 'coldstorage',
        level: cs.status === 'critical' ? 'critical' : 'warning',
        targetId: cs.id,
        message: `${cs.name} ${tempOutOfRange ? `温度${cs.temperature}℃` : ''} ${humidityOutOfRange ? `湿度${cs.humidity}%` : ''} 超标`,
        createTime: new Date(),
        acknowledged: false,
        resolved: false,
        escalated: cs.warningDuration > 600,
        escalationCount: cs.currentAlert?.escalationCount || 0,
        escalationRecords: cs.currentAlert?.escalationRecords || [],
        visibleToRoles: ['admin', 'director', 'supervisor'] as UserRole[],
        archived: false,
      });
    }
  });
  return alerts;
};

export const heatToColor = (heat: number): string => {
  if (heat < 30) return '#00C48C';
  if (heat < 60) return '#FFD93D';
  if (heat < 80) return '#FF8C00';
  return '#FF3D57';
};

export const getAlertColor = (level: Alert['level']): string => {
  switch (level) {
    case 'critical':
      return '#FF3D57';
    case 'warning':
      return '#FF8C00';
    case 'info':
      return '#00E5FF';
  }
};

export const getAlertIcon = (type: Alert['type']): string => {
  switch (type) {
    case 'inventory':
      return 'Package';
    case 'coldstorage':
      return 'Thermometer';
    case 'inspection':
      return 'ClipboardList';
    case 'parking':
      return 'Car';
    case 'fire':
      return 'Flame';
  }
};
