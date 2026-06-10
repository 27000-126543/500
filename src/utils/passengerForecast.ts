interface WeatherInput {
  isHoliday: boolean;
  nextDayHoliday: boolean;
  temperature: number;
  weather: string;
}

export interface ForecastZone {
  name: string;
  level: 'high' | 'medium' | 'low';
  suggestion: string;
  heat: number;
}

export const forecastPassengers = (weather: WeatherInput, basePassengers = 15000): number => {
  let multiplier = 1;
  if (weather.isHoliday) multiplier *= 1.5;
  if (weather.nextDayHoliday) multiplier *= 1.2;
  if (weather.weather === '雨' || weather.weather === '雪') multiplier *= 0.7;
  if (weather.weather === '晴') multiplier *= 1.1;
  if (weather.temperature > 30 || weather.temperature < 0) multiplier *= 0.85;
  return Math.round(basePassengers * multiplier);
};

export const getZoneForecast = (): ForecastZone[] => {
  return [
    { name: 'A区（蔬菜/水果）', level: 'high', suggestion: '建议增开临时通道，增加人手', heat: 85 },
    { name: 'B区（肉类/海鲜）', level: 'medium', suggestion: '正常运营，关注客流变化', heat: 60 },
    { name: 'C区（粮油）', level: 'low', suggestion: '可适当关闭部分区域，节省人力', heat: 28 },
    { name: 'D区（综合）', level: 'medium', suggestion: '正常运营', heat: 55 },
  ];
};

export const getHeatColor = (level: 'high' | 'medium' | 'low'): string => {
  switch (level) {
    case 'high':
      return '#FF3D57';
    case 'medium':
      return '#FFD93D';
    case 'low':
      return '#00C48C';
  }
};

export const getHourlyForecast = (baseHourly: number[] = [800, 1200, 1500, 1800, 2100, 1900, 1500, 1000]) => {
  const isHoliday = new Date().getDay() === 0 || new Date().getDay() === 6;
  return baseHourly.map((v) => Math.round(v * (isHoliday ? 1.3 : 1) + (Math.random() - 0.5) * 200));
};
