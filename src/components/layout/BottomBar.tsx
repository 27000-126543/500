import { Eye, EyeOff, Maximize2, RotateCcw, Map } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function BottomBar() {
  const { heatmapVisible, toggleHeatmap, setCurrentView, currentView } = useAppStore();

  const views = [
    { key: 'overview', label: '全景' },
    { key: 'stalls', label: '摊位' },
    { key: 'coldstorage', label: '冷库' },
    { key: 'inspection', label: '检测' },
    { key: 'parking', label: '停车' },
    { key: 'monitor', label: '监控' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 h-14 bg-bg-glass backdrop-blur-xl border-t border-accent-cyan/20 flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 mr-2">场景视图:</span>
        {views.map((v) => (
          <button
            key={v.key}
            onClick={() => setCurrentView(v.key as any)}
            className={`px-3 py-1.5 rounded text-xs transition-all ${
              currentView === v.key
                ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40'
                : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleHeatmap}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-all ${
            heatmapVisible
              ? 'bg-accent-orange/20 text-accent-orange border border-accent-orange/40'
              : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          {heatmapVisible ? <Eye size={14} /> : <EyeOff size={14} />}
          客流热力图
        </button>

        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent">
          <Map size={14} />
          导览
        </button>

        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent">
          <RotateCcw size={14} />
          重置视角
        </button>

        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent">
          <Maximize2 size={14} />
          全屏
        </button>
      </div>
    </div>
  );
}
