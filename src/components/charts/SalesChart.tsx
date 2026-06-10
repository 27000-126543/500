import ReactECharts from 'echarts-for-react';
import { useAppStore } from '../../store/useAppStore';
import { Stall } from '../../types';

interface SalesChartProps {
  stalls?: Stall[];
  scopeLabel?: string;
}

export default function SalesChart({ stalls: stallsProp, scopeLabel }: SalesChartProps) {
  const storeStalls = useAppStore((s) => s.stalls);
  const stalls = stallsProp ?? storeStalls;
  const categoryMap: Record<string, string> = {
    vegetable: '蔬菜',
    meat: '肉类',
    seafood: '海鲜',
    fruit: '水果',
    grain: '粮油',
  };

  const salesByCategory = stalls.reduce((acc, s) => {
    const cat = categoryMap[s.category] || s.category;
    acc[cat] = (acc[cat] || 0) + s.salesToday;
    return acc;
  }, {} as Record<string, number>);

  const option: any = {
    backgroundColor: 'transparent',
    ...(scopeLabel
      ? {
          title: {
            text: '',
            subtext: `统计范围：${scopeLabel}`,
            left: 0,
            top: 0,
            subtextStyle: {
              color: '#64748b',
              fontSize: 10,
            },
          },
        }
      : {}),
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10, 22, 40, 0.9)',
      borderColor: '#00E5FF',
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: (params: any) => {
        const p = params[0];
        return `${p.name}<br/>销售额: ¥${p.value.toLocaleString()}`;
      },
    },
    grid: {
      left: 50,
      right: 20,
      top: scopeLabel ? 35 : 20,
      bottom: 30,
    },
    xAxis: {
      type: 'category',
      data: Object.keys(salesByCategory),
      axisLine: { lineStyle: { color: '#1e3a5f' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#1e2a45', type: 'dashed' } },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 11,
        formatter: (v: number) => `¥${(v / 1000).toFixed(0)}k`,
      },
    },
    series: [
      {
        type: 'bar',
        data: Object.values(salesByCategory),
        barWidth: '50%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#00E5FF' },
              { offset: 1, color: '#00E5FF30' },
            ],
          },
        },
        emphasis: {
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#7B61FF' },
                { offset: 1, color: '#7B61FF30' },
              ],
            },
          },
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
}
