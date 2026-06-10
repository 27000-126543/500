import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardCheck,
  BarChart3,
  LogOut,
  User,
  Bell,
  Flame,
  FlameKindling,
  Shield,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { UserRole, PermissionConst } from '../../types';
import { useState, useMemo } from 'react';

const roleLabels: Record<UserRole, string> = {
  merchant: '商户',
  admin: '管理员',
  director: '主任',
  supervisor: '食药监',
};

export default function TopBar() {
  const navigate = useNavigate();
  const {
    currentUser,
    logout,
    fireEmergencyActive,
    triggerFireAlarm,
    deactivateFireAlarm,
    hasPermission,
    getFilteredData,
    canAccessPage,
  } = useAppStore();
  const [showMenu, setShowMenu] = useState(false);

  const { filteredAlerts } = useMemo(() => getFilteredData(), [currentUser, getFilteredData]);
  const unreadAlerts = filteredAlerts.filter((a) => !a.acknowledged).length;
  const canTriggerFireDrill = hasPermission(PermissionConst.TRIGGER_FIRE_DRILL);

  const navItems = [
    { path: '/dashboard', label: '3D全景', icon: LayoutDashboard, visible: canAccessPage('dashboard') },
    { path: '/approvals', label: '审批中心', icon: ClipboardCheck, visible: canAccessPage('approvals') },
    { path: '/reports', label: '数据统计', icon: BarChart3, visible: canAccessPage('reports') },
  ].filter((item) => item.visible);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-bg-glass backdrop-blur-xl border-b border-accent-cyan/20 flex items-center justify-between px-6">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center shadow-glow-cyan">
            <BarChart3 size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-tech font-bold text-white tracking-wider">
              智慧农贸市场
            </h1>
            <p className="text-[10px] text-gray-400 -mt-0.5">综合运营与应急调度平台</p>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = window.location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-accent-cyan/20 text-accent-cyan shadow-glow-cyan'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {canTriggerFireDrill && (fireEmergencyActive ? (
          <button
            onClick={deactivateFireAlarm}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-red/30 text-accent-red border border-accent-red/50 animate-blink-red"
          >
            <FlameKindling size={18} />
            <span className="text-sm font-medium">消防应急中 · 点击解除</span>
          </button>
        ) : (
          <button
            onClick={triggerFireAlarm}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-red/10 text-accent-red hover:bg-accent-red/20 transition-colors border border-accent-red/30"
            title="模拟火灾报警"
          >
            <Flame size={16} />
            <span className="text-xs">消防演练</span>
          </button>
        ))}

        <button
          className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
          onClick={() => navigate('/approvals')}
        >
          <Bell size={20} className="text-gray-400" />
          {unreadAlerts > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-accent-red text-white text-[10px] flex items-center justify-center font-bold animate-pulse">
              {unreadAlerts}
            </span>
          )}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <div className="text-left">
              <p className="text-xs font-medium text-white">{currentUser?.name}</p>
              <p className="text-[10px] text-accent-cyan">
                {currentUser ? roleLabels[currentUser.role] : '未登录'}
              </p>
            </div>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-lg bg-bg-secondary border border-white/10 shadow-panel overflow-hidden">
              {currentUser && (
                <div className="px-4 py-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-accent-purple" />
                    <span className="text-xs text-gray-400">当前角色</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-accent-purple/20 text-accent-purple border border-accent-purple/30">
                      {roleLabels[currentUser.role]}
                    </span>
                    <span className="text-xs text-gray-300">{currentUser.name}</span>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-500">
                    权限: {currentUser.permissions.length} 项
                  </div>
                </div>
              )}
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors"
              >
                <LogOut size={16} />
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
