import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ApprovalsPage from '@/pages/ApprovalsPage';
import ReportsPage from '@/pages/ReportsPage';
import AuditPage from '@/pages/AuditPage';
import { useAppStore } from '@/store/useAppStore';
import { Lock, ArrowLeft, ShieldAlert } from 'lucide-react';

type PageName = 'dashboard' | 'approvals' | 'reports' | 'audit';

function PrivateRoute({ children, page }: { children: React.ReactNode; page: PageName }) {
  const currentUser = useAppStore((s) => s.currentUser);
  const canAccessPage = useAppStore((s) => s.canAccessPage);
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  if (!canAccessPage(page)) {
    return <Navigate to="/403" replace />;
  }
  return <>{children}</>;
}

function ForbiddenPage() {
  const navigate = useNavigate();
  const logout = useAppStore((s) => s.logout);
  const handleBackToLogin = () => {
    logout();
    navigate('/login', { replace: true });
  };
  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-red-500/10 blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-accent-purple/10 blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
      </div>
      <div className="absolute inset-0 opacity-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 80, 80, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 80, 80, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      </div>
      <div className="relative z-10 w-full max-w-md px-6 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-red-500/30 to-red-600/20 border border-red-500/30 shadow-lg shadow-red-500/20 mb-8">
          <ShieldAlert size={48} className="text-red-400" />
        </div>
        <div className="text-8xl font-tech font-bold text-red-500/80 mb-4 tracking-widest">403</div>
        <h1 className="text-2xl font-tech font-bold text-white mb-3">访问被拒绝</h1>
        <p className="text-gray-400 mb-2">您当前账号没有权限访问此页面</p>
        <p className="text-gray-500 text-sm mb-10">请联系管理员获取相应权限，或切换其他账号登录</p>
        <div className="space-y-3">
          <button
            onClick={handleBackToLogin}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-purple text-white font-medium text-sm shadow-glow-cyan hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            返回登录页面
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3.5 rounded-xl border border-white/10 bg-bg-glass/50 text-gray-300 font-medium text-sm hover:border-white/20 hover:bg-bg-glass transition-all flex items-center justify-center gap-2"
          >
            <Lock size={16} />
            返回上一页
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-600 mt-10">
          © 2025 智慧农贸市场综合运营与应急调度可视化平台
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/403" element={<ForbiddenPage />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute page="dashboard">
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/approvals"
          element={
            <PrivateRoute page="approvals">
              <ApprovalsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <PrivateRoute page="reports">
              <ReportsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/audit"
          element={
            <PrivateRoute page="audit">
              <AuditPage />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
