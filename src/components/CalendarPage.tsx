import React, { useMemo, useState } from 'react';
import { Solar, Lunar } from 'lunar-typescript';
import { City } from '../lib/cities';
import { trueSolarTime, hourToShiChen, SHI_CHEN_INFO } from '../lib/truesolar';
import { getYueJiang, YUE_JIANG_NAME, ZHI } from '../lib/liuren';

const WEEK_HEADS = ['一', '二', '三', '四', '五', '六', '日'];

function gzIndex(gz: string, GAN: string[], ZHI: string[]): number {
  const g = GAN.indexOf(gz[0]);
  const z = ZHI.indexOf(gz[1]);
  for (let i = 0; i < 60; i++) if (i % 10 === g && i % 12 === z) return i;
  return 0;
}

interface Props { now: Date; city: City }

export default function CalendarPage({ now, city }: Props) {
  const [viewY, setViewY] = useState(now.getFullYear());
  const [viewM, setViewM] = useState(now.getMonth() + 1);
  const [selY, setSelY] = useState(now.getFullYear());
  const [selM, setSelM] = useState(now.getMonth() + 1);
  const [selD, setSelD] = useState(now.getDate());

  const moveMonth = (delta: number) => {
    let m = viewM + delta, y = viewY;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setViewY(y); setViewM(m);
  };

  // ── 月历网格数据 ──
  const cells = useMemo(() => {
    const first = new Date(viewY, viewM - 1, 1);
    const daysInMonth = new Date(viewY, viewM, 0).getDate();
    // 周一开头
    const startOffset = (first.getDay() + 6) % 7;
    const list: Array<{ y: number; m: number; d: number; dim: boolean }> = [];
    for (let i = startOffset - 1; i >= 0; i--) {
      const dt = new Date(viewY, viewM - 1, -i);
      list.push({ y: dt.getFullYear(), m: dt.getMonth() + 1, d: dt.getDate(), dim: true });
    }
    for (let d = 1; d <= daysInMonth; d++) list.push({ y: viewY, m: viewM, d, dim: false });
    while (list.length % 7 !== 0) {
      const last = list[list.length - 1];
      const dt = new Date(last.y, last.m - 1, last.d + 1);
      list.push({ y: dt.getFullYear(), m: dt.getMonth() + 1, d: dt.getDate(), dim: true });
    }
    return list;
  }, [viewY, viewM]);

  const cellInfo = (y: number, m: number, d: number) => {
    const solar = Solar.fromYmd(y, m, d);
    const lunar = solar.getLunar();
    const jieqi = lunar.getJieQi();
    const fests = [
      ...solar.getFestivals(),
      ...lunar.getFestivals(),
      ...lunar.getOtherFestivals(),
    ];
    return { lunar, jieqi, fests };
  };

  // ── 选中日详情 ──
  const selSolar = Solar.fromYmd(selY, selM, selD);
  const selLunar = selSolar.getLunar();
  const ec = selLunar.getEightChar();
  ec.setSect(2);

  const selInfo = cellInfo(selY, selM, selD);
  const trueTime = trueSolarTime(now, city.lng);
  const bjSC = hourToShiChen(now.getHours());
  const trueSC = hourToShiChen(trueTime.getHours());

  // 节气表（当月内的）
  const jqTable = selLunar.getJieQiTable();
  const monthJieQi = Object.entries(jqTable)
    .filter(([, s]) => (s as Solar).getYear() === viewY && (s as Solar).getMonth() === viewM)
    .map(([name, s]) => {
      const so = s as Solar;
      return { name, text: `${so.getYear()}年${so.getMonth()}月${so.getDay()}日 ${String(so.getHour()).padStart(2, '0')}:${String(so.getMinute()).padStart(2, '0')}` };
    });

  // 六壬月将（按选中日）
  const jqTimes = Object.entries(jqTable).map(([name, s]) => {
    const so = s as Solar;
    return { name, time: new Date(so.getYear(), so.getMonth() - 1, so.getDay(), so.getHour(), so.getMinute(), so.getSecond()) };
  });
  const yueJiang = getYueJiang(jqTimes, new Date(selY, selM - 1, selD, 12));

  const isToday = (y: number, m: number, d: number) =>
    y === now.getFullYear() && m === now.getMonth() + 1 && d === now.getDate();

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="cal-layout">
      {/* 左：月历 */}
      <div className="card">
        <div className="month-nav">
          <button onClick={() => moveMonth(-1)}>‹ 上月</button>
          <span className="ym">{viewY}年 {viewM}月</span>
          <button onClick={() => moveMonth(1)}>下月 ›</button>
        </div>
        <div className="month-grid">
          {WEEK_HEADS.map((w) => (
            <div key={w} className="week-head">周{w}</div>
          ))}
          {cells.map((c, i) => {
            const info = cellInfo(c.y, c.m, c.d);
            const selected = c.y === selY && c.m === selM && c.d === selD;
            const dow = i % 7;
            return (
              <div
                key={i}
                className={[
                  'day-cell',
                  c.dim ? 'dim' : '',
                  selected ? 'selected' : '',
                  isToday(c.y, c.m, c.d) ? 'today' : '',
                  dow >= 5 ? 'weekend' : '',
                ].join(' ')}
                onClick={() => { setSelY(c.y); setSelM(c.m); setSelD(c.d); if (c.dim) { setViewY(c.y); setViewM(c.m); } }}
              >
                <div className="gong">{c.d}</div>
                <div className="nong">
                  {info.jieqi ? <span className="jieqi">{info.jieqi}</span> : info.lunar.getDayInChinese()}
                </div>
                {info.fests.length > 0 && <span className="fest">{info.fests[0]}</span>}
                {!info.jieqi && <div className="gz">{info.lunar.getDayInGanZhi()}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* 右：当日详情 */}
      <div>
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="detail-date">
            <div className="big">{selM}月{selD}日</div>
            <div className="sub">
              {selY}年 · {selSolar.getWeekInChinese()}曜日 · 农历{selLunar.getMonthInChinese()}月{selLunar.getDayInChinese()}
            </div>
            <div className="gz-line">
              {selLunar.getYearInGanZhiExact()}年({selLunar.getYearShengXiaoExact()}) {selLunar.getMonthInGanZhiExact()}月 {selLunar.getDayInGanZhiExact()}日
            </div>
            <div className="sub" style={{ marginTop: 6 }}>
              {selLunar.getZhiXing()}日 · {selLunar.getXiu()}{selLunar.getZheng()}{selLunar.getAnimal()} · 纳音{selLunar.getDayNaYin()}
            </div>
            <div className="sub" style={{ marginTop: 4 }}>
              北京时间 {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}（{SHI_CHEN_INFO[bjSC].name}）
              ｜ 真太阳时 {pad(trueTime.getHours())}:{pad(trueTime.getMinutes())}:{pad(trueTime.getSeconds())}（{SHI_CHEN_INFO[trueSC].name}）
            </div>
          </div>

          <div className="yiji">
            <div className="tag yi">宜</div>
            <div className="items">{selLunar.getDayYi().map((s) => <span key={s}>{s}</span>)}</div>
            <div className="tag ji">忌</div>
            <div className="items">{selLunar.getDayJi().map((s) => <span key={s}>{s}</span>)}</div>
          </div>

          <div className="section-title">干支四柱</div>
          <div className="sizhu">
            {(['Year', 'Month', 'Day', 'Time'] as const).map((k, i) => {
              const gan = (ec as any)[`get${k}Gan`]();
              const zhi = (ec as any)[`get${k}Zhi`]();
              const ssG = k === 'Day' ? '元' : (ec as any)[`get${k}ShiShenGan`]();
              const ssZ = (ec as any)[`get${k}ShiShenZhi`]()[0];
              return (
                <div className="pillar" key={k}>
                  <div className="label">{['年柱', '月柱', '日柱', '时柱'][i]}</div>
                  <div className="gz-g">{gan}</div>
                  <div className="ss">{ssG}</div>
                  <div className="gz-z">{zhi}</div>
                  <div className="ss">{ssZ}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ marginBottom: 18 }}>
          <div className="section-title" style={{ marginTop: 0 }}>神煞方位</div>
          <div className="kv-grid">
            <div className="kv"><b>喜神</b><span>{selLunar.getDayPositionXi()}</span></div>
            <div className="kv"><b>福神</b><span>{selLunar.getDayPositionFu()}</span></div>
            <div className="kv"><b>财神</b><span>{selLunar.getDayPositionCai()}</span></div>
            <div className="kv"><b>阳贵</b><span>{selLunar.getDayPositionYangGui()}</span></div>
            <div className="kv"><b>阴贵</b><span>{selLunar.getDayPositionYinGui()}</span></div>
            <div className="kv"><b>胎神</b><span>{selLunar.getDayPositionTai()}</span></div>
            <div className="kv"><b>冲煞</b><span>{selLunar.getChongDesc()} 煞{selLunar.getDaySha()}</span></div>
            <div className="kv"><b>十二神</b><span>{selLunar.getDayTianShen()}（{selLunar.getDayTianShenLuck()}）</span></div>
            <div className="kv"><b>六壬月将</b><span>{ZHI[yueJiang]}将（{YUE_JIANG_NAME[yueJiang]}）</span></div>
            <div className="kv"><b>建除</b><span>{selLunar.getZhiXing()}日</span></div>
          </div>
          <div className="section-title">彭祖百忌</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.9 }}>
            {selLunar.getPengZuGan()}<br />{selLunar.getPengZuZhi()}
          </div>
          <div className="section-title">吉神宜趋</div>
          <div style={{ fontSize: 13, color: 'var(--ink-light)', lineHeight: 1.9 }}>{selLunar.getDayJiShen().join('　')}</div>
          <div className="section-title">凶煞宜忌</div>
          <div style={{ fontSize: 13, color: 'var(--ink-light)', lineHeight: 1.9 }}>{selLunar.getDayXiongSha().join('　')}</div>
        </div>

        <div className="card">
          <div className="section-title" style={{ marginTop: 0 }}>当月节气</div>
          {monthJieQi.map((j) => (
            <div key={j.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '6px 0', borderBottom: '1px dashed var(--line)' }}>
              <span style={{ color: 'var(--jade)', fontWeight: 700 }}>{j.name}</span>
              <span>{j.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
