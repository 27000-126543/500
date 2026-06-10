import ReactECharts from 'echarts-for-react';
import { passengerForecast } from '../../data/mockData';

export default function PassengerForecast() {
  const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10, 22, 40, 0.9)',
      borderColor: '#00E5FF',
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: (params: any) => {
        const p = params[0];
        return `${p.name}<br/>客流: ${p.value.toLocaleString()}人`;
      },
    },
    grid: {
      left: 50,
      right: 20,
      top: 20,
      bottom: 25,
    },
    xAxis: {
      type: 'category',
      data: hours,
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
      },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        data: passengerForecast.hourly,
        lineStyle: {
          width: 3,
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#00C48C' },
              { offset: 0.5, color: '#FFD93D' },
              { offset: 1, color: '#FF3D57' },
            ],
          },
        },
        itemStyle: { color: '#00E5FF' },
        symbol: 'circle',
        symbolSize: 8,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#00E5FF60' },
              { offset: 1, color: '#00E5FF00' },
            ],
          },
        },
        markLine: {
          silent: true,
          lineStyle: { color: '#FF3D57', type: 'dashed' },
          data: [{ yAxis: 2000, label: { formatter: '预警值', color: '#FF3D57', fontSize: 10 } }],
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
}
