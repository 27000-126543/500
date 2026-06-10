import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changePositive?: boolean;
  icon: LucideIcon;
  color?: string;
  subInfo?: ReactNode;
}

export default function StatCard({
  title,
  value,
  change,
  changePositive,
  icon: Icon,
  color = '#00E5FF',
  subInfo,
}: StatCardProps) {
  return (
    <div
      className="relative rounded-lg bg-bg-glass backdrop-blur-md p-4 border overflow-hidden"
      style={{
        borderColor: `${color}40`,
        boxShadow: `0 4px 20px ${color}15, inset 0 0 20px ${color}08`,
      }}
    >
      <div
        className="absolute top-0 right-0 w-24 h-24 opacity-10"
        style={{
          background: `radial-gradient(circle at top right, ${color}, transparent 70%)`,
        }}
      />
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-gray-400 mb-1">{title}</p>
          <p
            className="text-2xl font-tech font-bold mb-1"
            style={{ color }}
          >
            {value}
          </p>
          {change && (
            <p
              className="text-xs"
              style={{ color: changePositive ? '#00C48C' : '#FF3D57' }}
            >
              {changePositive ? '↑' : '↓'} {change}
            </p>
          )}
          {subInfo}
        </div>
        <div
          className="p-2.5 rounded-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon size={24} style={{ color }} />
        </div>
      </div>
      <div
        className="absolute bottom-0 left-0 h-0.5 w-full animate-glow-flow"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}
