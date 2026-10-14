import React, { useEffect, useMemo, useState } from 'react';
import { PROVINCES, DEFAULT_CITY, City } from './lib/cities';
import { fetchWeather, WeatherData } from './lib/weather';
import { trueSolarTime } from './lib/truesolar';
import CalendarPage from './components/CalendarPage';
import ClockPage from './components/ClockPage';
import LiuRenPage from './components/LiuRenPage';
import MeiHuaPage from './components/MeiHuaPage';
import LiuYaoPage from './components/LiuYaoPage';
import JinKouJuePage from './components/JinKouJuePage';
import QimenPage from './components/QimenPage';
import ZiweiPage from './components/ZiweiPage';
import BaziPage from './components/BaziPage';

type TabKey = 'calendar' | 'clock' | 'liuren' | 'meihua' | 'liuyao' | 'jinkoujue' | 'qimen' | 'ziwei' | 'bazi';

function findCity(prov: string, city: string): City {
  const p = PROVINCES.find((x) => x.name === prov);
  const c = p?.cities.find((x) => x.name === city);
  return c ?? DEFAULT_CITY;
}

export default function App() {
  const [tab, setTab] = useState<TabKey>('calendar');
  const [now, setNow] = useState(new Date());
  const [provName, setProvName] = useState(() => localStorage.getItem('gx.prov') ?? '广东省');
  const [cityName, setCityName] = useState(() => localStorage.getItem('gx.city') ?? '深圳市');
  const [weather, setWeather] = useState<WeatherData | null>(null);

  const city = useMemo(() => findCity(provName, cityName), [provName, cityName]);
  const prov = PROVINCES.find((p) => p.name === provName) ?? PROVINCES[0];

  useEffect(() => {
    // 对齐真实秒边界，避免 setInterval 漂移导致读数与秒针不同步
    let t: number;
    const tick = () => {
      setNow(new Date());
      t = window.setTimeout(tick, 1000 - (Date.now() % 1000));
    };
    t = window.setTimeout(tick, 1000 - (Date.now() % 1000));
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    localStorage.setItem('gx.prov', provName);
    localStorage.setItem('gx.city', cityName);
    setWeather(null);
    fetchWeather(city.lng, city.lat).then(setWeather).catch(() => setWeather(null));
  }, [provName, cityName, city]);

  const trueTime = trueSolarTime(now, city.lng);

  return (
    <>
      <header className="app-header">
        <div className="brand">
          <h1>观玄 · 国学日历</h1>
          <span className="seal">观玄</span>
        </div>
        <div className="header-right">
          <div className="loc-selects">
            <select
              value={provName}
              onChange={(e) => {
                setProvName(e.target.value);
                const p = PROVINCES.find((x) => x.name === e.target.value)!;
                setCityName(p.cities[0].name);
              }}
            >
              {PROVINCES.map((p) => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
            <select value={cityName} onChange={(e) => setCityName(e.target.value)}>
              {prov.cities.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <span className="weather-chip">
            {weather
              ? <>{weather.icon} {city.name} <b>{weather.temp}°C</b> {weather.text} {weather.low}~{weather.high}° 风 {weather.wind}km/h</>
              : <>☁️ {city.name} 天气加载中…</>}
          </span>
        </div>
      </header>

      <nav className="tabs">
        <button className={tab === 'calendar' ? 'active' : ''} onClick={() => setTab('calendar')}>国学日历</button>
        <button className={tab === 'clock' ? 'active' : ''} onClick={() => setTab('clock')}>地支时钟</button>
        <button className={tab === 'liuren' ? 'active' : ''} onClick={() => setTab('liuren')}>六壬排盘</button>
        <button className={tab === 'meihua' ? 'active' : ''} onClick={() => setTab('meihua')}>梅花易数</button>
        <button className={tab === 'liuyao' ? 'active' : ''} onClick={() => setTab('liuyao')}>六爻排盘</button>
        <button className={tab === 'jinkoujue' ? 'active' : ''} onClick={() => setTab('jinkoujue')}>金口诀</button>
        <button className={tab === 'qimen' ? 'active' : ''} onClick={() => setTab('qimen')}>奇门遁甲</button>
        <button className={tab === 'ziwei' ? 'active' : ''} onClick={() => setTab('ziwei')}>紫微斗数</button>
        <button className={tab === 'bazi' ? 'active' : ''} onClick={() => setTab('bazi')}>八字合婚</button>
      </nav>

      {tab === 'calendar' && <CalendarPage now={now} city={city} />}
      {tab === 'clock' && <ClockPage now={now} city={city} trueTime={trueTime} />}
      {tab === 'liuren' && <LiuRenPage now={now} />}
      {tab === 'meihua' && <MeiHuaPage now={now} />}
      {tab === 'liuyao' && <LiuYaoPage now={now} />}
      {tab === 'jinkoujue' && <JinKouJuePage now={now} />}
      {tab === 'qimen' && <QimenPage now={now} />}
      {tab === 'ziwei' && <ZiweiPage now={now} />}
      {tab === 'bazi' && <BaziPage now={now} />}

      <footer className="footer-note">
        观玄 · 历法数据由 lunar-typescript 推算 · 天气由 Open-Meteo 提供 · 真太阳时含经度与均时差修正
      </footer>
    </>
  );
}
