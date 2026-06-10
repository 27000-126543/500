import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, User, ShieldCheck, Building2, Eye, UserCog, Crown, Store } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { mockUsers } from '../data/mockData';
import { UserRole } from '../types';

const roleIconMap: Record<UserRole, any> = {
  merchant: Store,
  admin: UserCog,
  director: Crown,
  supervisor: ShieldCheck,
};

const roleLabelMap: Record<UserRole, string> = {
  merchant: '商户',
  admin: '管理员',
  director: '主任',
  supervisor: '食药监',
};

const roleDescMap: Record<UserRole, string> = {
  merchant: '摊位运营与库存管理',
  admin: '日常运营与审批管理',
  director: '全局调度与终审决策',
  supervisor: '食品安全监管与会签',
};

const users = mockUsers.map((u) => ({
  id: u.id,
  name: u.name,
  role: u.role,
  label: roleLabelMap[u.role],
  desc: roleDescMap[u.role],
  icon: roleIconMap[u.role],
}));

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAppStore((s) => s.login);
  const [selectedUserId, setSelectedUserId] = useState<string>('u3');
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const handleLogin = () => {
    if (scanning) return;
    setScanning(true);
    const selectedUser = users.find((u) => u.id === selectedUserId);
    setTimeout(() => {
      login(selectedUser?.role || 'admin', selectedUserId);
      navigate('/dashboard');
    }, 1200);
    let p = 0;
    const iv = window.setInterval(() => {
      p = Math.min(100, p + 8);
      setScanProgress(p);
      if (p >= 100) window.clearInterval(iv);
    }, 100);
  };

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-accent-cyan/10 blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-accent-purple/10 blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-accent-cyan/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-accent-cyan/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-accent-cyan/15" />
      </div>

      <div className="absolute inset-0 opacity-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 229, 255, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 229, 255, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-4xl px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-cyan to-accent-purple shadow-glow-cyan mb-4">
            <Building2 size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-tech font-bold text-white tracking-wider mb-2">
            智慧农贸市场综合运营平台
          </h1>
          <p className="text-gray-400">3D可视化 · 智能预警 · 应急调度</p>
        </div>

        <div className="grid grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-xs font-tech text-accent-cyan mb-4 tracking-widest">FACE RECOGNITION · 人脸识别登录</p>

            <div className="relative bg-bg-glass backdrop-blur-xl rounded-2xl border border-accent-cyan/30 p-6 shadow-glow-cyan">
              <div className="relative aspect-square max-w-[280px] mx-auto">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-accent-cyan/50" />
                <div className="absolute inset-4 rounded-full border border-accent-cyan/30" />
                <div className="absolute inset-0 overflow-hidden rounded-full">
                  <div
                    className="absolute left-0 right-0 h-0.5 bg-accent-cyan shadow-lg shadow-accent-cyan/80"
                    style={{
                      top: `${scanning ? scanProgress : 20}%`,
                      opacity: scanning ? 1 : 0.5,
                      transition: 'top 0.05s linear',
                    }}
                  />
                  <div
                    className="absolute left-0 right-0 h-8 -mt-4 opacity-30"
                    style={{
                      top: `${scanning ? scanProgress : 20}%`,
                      background: 'linear-gradient(to bottom, transparent, #00E5FF, transparent)',
                    }}
                  />
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-b from-accent-cyan/30 to-accent-purple/30 flex items-center justify-center">
                    <User size={48} className="text-white/70" />
                  </div>
                </div>

                <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-accent-cyan" />
                <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-accent-cyan" />
                <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-accent-cyan" />
                <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-accent-cyan" />
              </div>

              {selectedUser && (
                <div className="mt-4 text-center">
                  <p className="text-sm font-medium text-white">
                    {selectedUser.name}
                    <span className="text-accent-cyan ml-2">({selectedUser.id})</span>
                  </p>
                  <p className="text-xs text-gray-500">{selectedUser.label}</p>
                </div>
              )}

              <div className="mt-6">
                {scanning ? (
                  <div>
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                      <span>正在识别...</span>
                      <span>{scanProgress}%</span>
                    </div>
                    <div className="h-1 bg-bg-tertiary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-purple transition-all"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                    <Camera size={14} />
                    <span>请将面部对准摄像头</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-tech text-accent-cyan mb-4 tracking-widest">SELECT USER · 选择用户</p>

            <div className="space-y-3 mb-6 max-h-[420px] overflow-y-auto pr-2">
              {users.map((u) => {
                const Icon = u.icon;
                const selected = selectedUserId === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                      selected
                        ? 'bg-accent-cyan/15 border-accent-cyan/60 shadow-glow-cyan'
                        : 'bg-bg-glass/50 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                        selected ? 'bg-accent-cyan/30' : 'bg-white/5'
                      }`}
                    >
                      <Icon size={22} className={selected ? 'text-accent-cyan' : 'text-gray-400'} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${selected ? 'text-white' : 'text-gray-300'}`}>
                        {u.name}
                        <span className={`ml-2 text-xs ${selected ? 'text-accent-cyan' : 'text-gray-500'}`}>
                          {u.id}
                        </span>
                      </p>
                      <p className="text-[11px] text-gray-500">{u.label} · {u.desc}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selected ? 'border-accent-cyan bg-accent-cyan' : 'border-gray-600'
                      }`}
                    >
                      {selected && <Eye size={12} className="text-bg-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleLogin}
              disabled={scanning}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-purple text-white font-medium text-sm shadow-glow-cyan hover:shadow-lg transition-all disabled:opacity-50"
            >
              {scanning ? '识别中...' : '人脸识别登录'}
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-600 mt-8">
          © 2025 智慧农贸市场综合运营与应急调度可视化平台
        </p>
      </div>
    </div>
  );
}
