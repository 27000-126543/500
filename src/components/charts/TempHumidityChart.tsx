import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';

export default function TempHumidityChart() {
  const coldStorages = useAppStore((s) => s.coldStorages);

  const { times, tempData, humidityData } = useMemo(() => {
    const times: string[] = [];
    const tempData: number[] = [];
    const humidityData: number[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const t = new Date(now.getTime() - i * 5 * 60 * 1000);
      times.push(t.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
      const base = coldStorages[0] || { temperature: -15, humidity: 75 };
      tempData.push(base.temperature + (Math.random() - 0.5) * 2);
      humidityData.push(Math.min(95, Math.max(60, base.humidity + (Math.random() - 0.5) * 10)));
    }
    return { times, tempData, humidityData };
  }, [coldStorages]);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10, 22, 40, 0.9)',
      borderColor: '#00E5FF',
      textStyle: { color: '#fff', fontSize: 12 },
    },
    legend: {
      data: ['温度(℃)', '湿度(%)'],
      textStyle: { color: '#94a3b8', fontSize: 11 },
      top: 0,
      right: 0,
    },
    grid: {
      left: 45,
      right: 45,
      top: 30,
      bottom: 25,
    },
    xAxis: {
      type: 'category',
      data: times,
      axisLine: { lineStyle: { color: '#1e3a5f' } },
      axisLabel: { color: '#94a3b8', fontSize: 10 },
    },
    yAxis: [
      {
        type: 'value',
        name: '℃',
        nameTextStyle: { color: '#FF8C00', fontSize: 10 },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#1e2a45', type: 'dashed' } },
        axisLabel: { color: '#94a3b8', fontSize: 10 },
      },
      {
        type: 'value',
        name: '%',
        nameTextStyle: { color: '#00E5FF', fontSize: 10 },
        axisLine: { show: false },
        splitLine: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 10 },
        min: 50,
        max: 100,
      },
    ],
    series: [
      {
        name: '温度(℃)',
        type: 'line',
        smooth: true,
        data: tempData,
        yAxisIndex: 0,
        lineStyle: { color: '#FF8C00', width: 2 },
        itemStyle: { color: '#FF8C00' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#FF8C0040' },
              { offset: 1, color: '#FF8C0000' },
            ],
          },
        },
      },
      {
        name: '湿度(%)',
        type: 'line',
        smooth: true,
        data: humidityData,
        yAxisIndex: 1,
        lineStyle: { color: '#00E5FF', width: 2 },
        itemStyle: { color: '#00E5FF' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#00E5FF40' },
              { offset: 1, color: '#00E5FF00' },
            ],
          },
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
}
