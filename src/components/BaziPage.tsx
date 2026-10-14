import React, { useState } from 'react';
import { paiBazi, BaziResult, GAN_WX, ZHI_WX } from '../lib/bazi';
import { hehun, HehunResult } from '../lib/hehun';
import { PROVINCES, DEFAULT_CITY } from '../lib/cities';

const pad = (n: number) => String(n).padStart(2, '0');
const EL_CLASS: Record<string, string> = { 木: 'el-mu', 火: 'el-huo', 土: 'el-tu', 金: 'el-jin', 水: 'el-shui' };
const PILLAR_KEYS = ['Year', 'Month', 'Day', 'Hour'] as const;
const PILLAR_LABELS: Record<string, string> = { Year: '年柱', Month: '月柱', Day: '日柱', Hour: '时柱' };

interface PersonInput {
  dt: string; sex: number; prov: string; city: string;
}

function useCity(prov: string, city: string) {
  const p = PROVINCES.find((x) => x.name === prov) ?? PROVINCES[0];
  return p.cities.find((c) => c.name === city) ?? p.cities[0] ?? DEFAULT_CITY;
}

function PersonForm({ label, v, onChange }: { label: string; v: PersonInput; onChange: (x: PersonInput) => void }) {
  const prov = PROVINCES.find((p) => p.name === v.prov) ?? PROVINCES[0];
  return (
    <div className="bz-form">
      <div className="bz-form-title">{label}</div>
      <div className="mh-form">
        <input type="datetime-local" value={v.dt} onChange={(e) => onChange({ ...v, dt: e.target.value })} />
        <select value={v.sex} onChange={(e) => onChange({ ...v, sex: Number(e.target.value) })} className="jkj-select">
          <option value={1}>乾造（男）</option>
          <option value={0}>坤造（女）</option>
        </select>
      </div>
      <div className="mh-form" style={{ marginTop: 8 }}>
        <select value={v.prov} onChange={(e) => { const p = PROVINCES.find((x) => x.name === e.target.value)!; onChange({ ...v, prov: e.target.value, city: p.cities[0].name }); }} className="jkj-select">
          {PROVINCES.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
        </select>
        <select value={v.city} onChange={(e) => onChange({ ...v, city: e.target.value })} className="jkj-select">
          {prov.cities.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
      </div>
    </div>
  );
}

function PillarTable({ bz }: { bz: BaziResult }) {
  return (
    <table className="bz-table">
      <thead>
        <tr><th></th>{PILLAR_KEYS.map((k) => <th key={k}>{PILLAR_LABELS[k]}</th>)}</tr>
      </thead>
      <tbody>
        <tr>
          <td className="bz-row-label">十神</td>
          {PILLAR_KEYS.map((k) => <td key={k} className="bz-shishen">{bz.pillars[k].shishen}</td>)}
        </tr>
        <tr className="bz-gz-row">
          <td className="bz-row-label">干支</td>
          {PILLAR_KEYS.map((k) => (
            <td key={k}>
              <span className={`bz-gan ${EL_CLASS[GAN_WX[bz.pillars[k].gan]]}`}>{bz.pillars[k].gan}</span>
              <span className={`bz-zhi ${EL_CLASS[ZHI_WX[bz.pillars[k].zhi]]}`}>{bz.pillars[k].zhi}</span>
            </td>
          ))}
        </tr>
        <tr>
          <td className="bz-row-label">纳音</td>
          {PILLAR_KEYS.map((k) => <td key={k} className="bz-small">{bz.pillars[k].nayin}</td>)}
        </tr>
        <tr>
          <td className="bz-row-label">藏干</td>
          {PILLAR_KEYS.map((k) => (
            <td key={k} className="bz-small">
              {bz.pillars[k].hidden.map((h) => `${h.gan}${h.shishen.slice(0, 1)}`).join(' ')}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

function DaYunBar({ bz }: { bz: BaziResult }) {
  return (
    <div className="bz-dayun">
      <div className="bz-dayun-head">{bz.yun.startDesc}（{bz.yun.startTime.slice(0, 10)}）</div>
      <div className="bz-dayun-list">
        {bz.yun.list.slice(0, 8).map((dy) => (
          <div key={dy.index} className="bz-dayun-item">
            <b>{dy.pillar}</b>
            <span>{dy.startAge}岁 · {dy.startYear}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BaziPage({ now }: { now: Date }) {
  const [mode, setMode] = useState<'single' | 'hehun'>('single');
  const defDt = `${now.getFullYear() - 30}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T12:00`;
  const [p1, setP1] = useState<PersonInput>({ dt: defDt, sex: 1, prov: '广东省', city: '深圳市' });
  const [p2, setP2] = useState<PersonInput>({ dt: defDt, sex: 0, prov: '广东省', city: '深圳市' });
  const [bz, setBz] = useState<BaziResult | null>(null);
  const [hh, setHh] = useState<HehunResult | null>(null);

  const parse = (v: PersonInput) => {
    const [d, t] = v.dt.split('T');
    const [y, m, day] = d.split('-').map(Number);
    const [hh2, mm] = t.split(':').map(Number);
    return { date: new Date(y, m - 1, day, hh2, mm), lng: useCity(v.prov, v.city).lng };
  };

  const castSingle = () => {
    const { date, lng } = parse(p1);
    setBz(paiBazi(date, p1.sex, lng, true));
  };

  const castHehun = () => {
    const a = parse(p1);
    const b = parse(p2);
    setHh(hehun(paiBazi(a.date, 1, a.lng, true), paiBazi(b.date, 0, b.lng, true)));
  };

  return (
    <div>
      <div className="card">
        <div className="mh-mode">
          <button className={mode === 'single' ? 'on' : ''} onClick={() => setMode('single')}>八字排盘</button>
          <button className={mode === 'hehun' ? 'on' : ''} onClick={() => setMode('hehun')}>八字合婚</button>
        </div>
        {mode === 'single' ? (
          <>
            <PersonForm label="命主" v={p1} onChange={setP1} />
            <div className="mh-form" style={{ marginTop: 10 }}>
              <button className="ly-cast-btn" onClick={castSingle}>排盘</button>
              <span className="mh-hint">按真太阳时校正日柱与时柱</span>
            </div>
          </>
        ) : (
          <>
            <div className="bz-forms-2col">
              <PersonForm label="男方" v={p1} onChange={setP1} />
              <PersonForm label="女方" v={p2} onChange={setP2} />
            </div>
            <div className="mh-form" style={{ marginTop: 10 }}>
              <button className="ly-cast-btn" onClick={castHehun}>合婚</button>
              <span className="mh-hint">供传统文化参考，不构成婚恋决策建议</span>
            </div>
          </>
        )}
      </div>

      {/* ── 单人排盘结果 ── */}
      {mode === 'single' && bz && (
        <div className="card">
          <div className="section-title">{bz.sex === 1 ? '乾造' : '坤造'} · 四柱{bz.rolled && <em className="jkj-roll">（晚子时已换日）</em>}</div>
          <div className="mh-hint" style={{ marginBottom: 10 }}>真太阳时 {bz.trueSolarText}</div>
          <PillarTable bz={bz} />
          <div className="section-title">大运</div>
          <DaYunBar bz={bz} />
        </div>
      )}

      {/* ── 合婚结果 ── */}
      {mode === 'hehun' && hh && (
        <>
          <div className="card hh-score-card">
            <div className="hh-score">
              <div className="hh-score-num">{hh.score}</div>
              <div className="hh-score-label">综合评分 / 100</div>
            </div>
            <div className="hh-verdict">
              <div className="hh-verdict-text">{hh.verdict}</div>
              <div className="hh-gz-line">
                <span>男 {hh.male.gz.join(' ')}（{hh.male.shengxiao} · {hh.male.nayinYear}）</span>
                <span>女 {hh.female.gz.join(' ')}（{hh.female.shengxiao} · {hh.female.nayinYear}）</span>
              </div>
            </div>
          </div>
          <div className="hh-sections">
            {hh.sections.map((s) => (
              <div key={s.title} className="card hh-section">
                <div className="hh-section-head">
                  <span className="section-title" style={{ margin: 0 }}>{s.title}</span>
                  <span className={'hh-sec-score' + (s.score > 0 ? ' pos' : s.score < 0 ? ' neg' : '')}>
                    {s.score > 0 ? `+${s.score}` : s.score}
                  </span>
                </div>
                <ul className="hh-notes">
                  {s.notes.map((n, i) => <li key={i}>{n}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
