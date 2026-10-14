import React, { useState } from 'react';
import { paiZiwei, ZiweiResult, PALACE_NAMES } from '../lib/ziwei';
import { PROVINCES, DEFAULT_CITY } from '../lib/cities';
import DateTimePicker, { formatDT, parseDT } from './DateTimePicker';

const pad = (n: number) => String(n).padStart(2, '0');
// 传统命盘支位布局：宫支 -> [gridRow, gridCol]（4x4，中心 2x2 为信息区）
const ZHI_POS: Record<string, [number, number]> = {
  巳: [1, 1], 午: [1, 2], 未: [1, 3], 申: [1, 4],
  辰: [2, 1], 酉: [2, 4],
  卯: [3, 1], 戌: [3, 4],
  寅: [4, 1], 丑: [4, 2], 子: [4, 3], 亥: [4, 4],
};

export default function ZiweiPage({ now }: { now: Date }) {
  const [dt, setDt] = useState(
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`,
  );
  const [prov, setProv] = useState('北京市');
  const [city, setCity] = useState('北京市');
  const [r, setR] = useState<ZiweiResult | null>(null);

  const curProv = PROVINCES.find((p) => p.name === prov) ?? PROVINCES[0];
  const curCity = curProv.cities.find((c) => c.name === city) ?? curProv.cities[0] ?? DEFAULT_CITY;

  const cast = () => {
    const [d, t] = dt.split('T');
    const [y, m, day] = d.split('-').map(Number);
    const [hh, mm] = t.split(':').map(Number);
    setR(paiZiwei(new Date(y, m - 1, day, hh, mm), curCity.lng));
  };

  // 宫支 -> 宫名
  const palaceNameOf = (zhi: string): string => {
    if (!r) return '';
    return PALACE_NAMES.find((n) => r.palaces[n] === zhi) ?? '';
  };
  // 宫支 -> 星曜列表（含四化标记）
  const starsOf = (zhi: string) => {
    if (!r) return [];
    return Object.entries(r.stars)
      .filter(([, z]) => z === zhi)
      .map(([s]) => ({ name: s, hua: r.sihua.find((x) => x.star === s)?.hua ?? '' }));
  };

  return (
    <div className="page-stack">
      <div className="card">
        <div className="section-title">紫微斗数 · 排盘</div>
        <div className="mh-form">
          <DateTimePicker value={parseDT(dt, now)} onChange={(d) => setDt(formatDT(d))} label="出生时间" />
          <label>出生地
            <select value={prov} onChange={(e) => { setProv(e.target.value); const p = PROVINCES.find((x) => x.name === e.target.value)!; setCity(p.cities[0].name); }} className="jkj-select">
              {PROVINCES.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="jkj-select">
              {curProv.cities.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </label>
          <button className="ly-cast-btn" onClick={cast}>排命盘</button>
          <span className="mh-hint">按真太阳时排盘（含经度与均时差修正），23 点后晚子时换日</span>
        </div>

        {r && (
          <div className="ty-row" style={{ marginTop: 14, marginBottom: 0 }}>
            <span className="ty-chip ti">农历 {r.lunarText}{r.rolled && <em className="jkj-roll">（晚子已换日）</em>}</span>
            <span className="ty-chip"><b>{r.ju}</b></span>
            <span className="ty-chip">命宫<b>{r.minggong}</b>（{r.minggongGz}） · 身宫<b>{r.shengong}</b></span>
            <span className="ty-chip">命主 {r.mingzhu} · 身主 {r.shenzhu}</span>
            <span className="ty-chip dong">四化：{r.sihua.map((x) => `${x.star}${x.hua}`).join(' ')}</span>
          </div>
        )}
      </div>

      {r ? (
        <div className="card zw-pan-card">
          <div className="zw-grid">
            {/* 中心 2x2 信息区 */}
            <div className="zw-center" style={{ gridArea: '2 / 2 / 4 / 4' }}>
              <div className="zw-center-title">{r.yearGan}{r.yearZhi}年命</div>
              <div className="zw-center-ju">{r.ju}</div>
              <div className="zw-center-line">命宫 {r.minggong} · 身宫 {r.shengong}</div>
              <div className="zw-center-line">命主 {r.mingzhu} · 身主 {r.shenzhu}</div>
            </div>
            {Object.entries(ZHI_POS).map(([zhi, [row, col]]) => {
              const isMing = r.minggong === zhi;
              const isShen = r.shengong === zhi;
              return (
                <div key={zhi} className={'zw-cell' + (isMing ? ' ming' : '')} style={{ gridArea: `${row} / ${col}` }}>
                  <div className="zw-cell-head">
                    <span className="zw-palace">{palaceNameOf(zhi)}</span>
                    <span className="zw-badges">
                      {isMing && <b className="zw-badge ming-b">命</b>}
                      {isShen && <b className="zw-badge shen-b">身</b>}
                    </span>
                  </div>
                  <div className="zw-stars">
                    {starsOf(zhi).map((s) => (
                      <span key={s.name} className="zw-star">
                        {s.name}
                        {s.hua && <em className={`zw-hua hua-${s.hua}`}>{s.hua}</em>}
                      </span>
                    ))}
                  </div>
                  <div className="zw-gz">{r.palaceGanzhi[zhi]}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card ly-empty">
          <div>☯</div>
          <p>输入出生时间与出生地，排紫微命盘。</p>
        </div>
      )}
    </div>
  );
}
