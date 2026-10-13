/** Open-Meteo 免费天气 API（无需 key） */

export interface WeatherData {
  temp: number;
  code: number;
  wind: number;
  high: number;
  low: number;
  text: string;
  icon: string;
}

const WMO_MAP: Record<number, [string, string]> = {
  0: ['晴', '☀️'], 1: ['大部晴朗', '🌤️'], 2: ['局部多云', '⛅'], 3: ['阴', '☁️'],
  45: ['雾', '🌫️'], 48: ['冻雾', '🌫️'],
  51: ['小毛毛雨', '🌦️'], 53: ['毛毛雨', '🌦️'], 55: ['浓毛毛雨', '🌧️'],
  56: ['冻毛毛雨', '🌨️'], 57: ['浓冻毛毛雨', '🌨️'],
  61: ['小雨', '🌧️'], 63: ['中雨', '🌧️'], 65: ['大雨', '🌧️'],
  66: ['冻雨', '🌨️'], 67: ['大冻雨', '🌨️'],
  71: ['小雪', '🌨️'], 73: ['中雪', '❄️'], 75: ['大雪', '❄️'], 77: ['雪粒', '❄️'],
  80: ['小阵雨', '🌦️'], 81: ['阵雨', '🌧️'], 82: ['强阵雨', '⛈️'],
  85: ['小阵雪', '🌨️'], 86: ['大阵雪', '❄️'],
  95: ['雷暴', '⛈️'], 96: ['雷暴伴冰雹', '⛈️'], 99: ['强雷暴伴冰雹', '⛈️'],
};

export async function fetchWeather(lng: number, lat: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FShanghai&forecast_days=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('weather fetch failed');
  const j = await res.json();
  const code: number = j.current.weather_code;
  const [text, icon] = WMO_MAP[code] ?? ['未知', '🌡️'];
  return {
    temp: Math.round(j.current.temperature_2m),
    code,
    wind: Math.round(j.current.wind_speed_10m),
    high: Math.round(j.daily.temperature_2m_max[0]),
    low: Math.round(j.daily.temperature_2m_min[0]),
    text,
    icon,
  };
}
