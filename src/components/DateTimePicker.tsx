import React, { useEffect, useMemo, useState } from 'react';
import { Lunar, LunarYear, LunarMonth } from 'lunar-typescript';

const pad = (n: number) => String(n).padStart(2, '0');
const MONTH_CN = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];
const CN_NUM = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

const dayCn = (d: number) => {
  if (d === 10) return '初十';
  if (d === 20) return '二十';
  if (d === 30) return '三十';
  return (d < 10 ? '初' : d < 20 ? '十' : '廿') + CN_NUM[d % 10 === 0 ? 10 : d % 10];
};

/** 农历年月（含闰月，负数表闰）→ 公历 Date，保留钟表时刻 */
const lunarToDate = (y: number, mRaw: number, d: number, hh: number, mm: number): Date => {
  const solar = Lunar.fromYmd(y, mRaw, d).getSolar();
  return new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay(), hh, mm);
};

/** 农历数值年（public 用不到，内部方便年列表） */
const YEAR_START = 1900;
const YEAR_END = 2100;

export const formatDT = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

export const parseDT = (s: string, fallback: Date = new Date()): Date => {
  const d = new Date(s);
  return isNaN(d.getTime()) ? fallback : d;
};

interface Props {
  value: Date;
  onChange: (d: Date) => void;
  /** 显示为「出生时间」等语义文案，默认「时间」 */
  label?: string;
}

/**
 * 公历 / 农历双制式时间选择器。
 * 公历模式：日期 + 时分；农历模式：农历年月日（含闰月）+ 时分（自动换算，选择即生效）。
 * 底部始终显示另一制式的换算结果，方便核对。
 */
export default function DateTimePicker({ value, onChange, label = '时间' }: Props) {
  const [mode, setMode] = useState<'solar' | 'lunar'>('solar');
  const [solarDate, setSolarDate] = useState(() => formatDT(value).slice(0, 10));
  const [time, setTime] = useState(() => formatDT(value).slice(11));
  const l0 = useMemo(() => Lunar.fromDate(value), []);
  const [ly, setLy] = useState(l0.getYear());
  const [lmRaw, setLmRaw] = useState(l0.getMonth()); // 负 = 闰月
  const [ld, setLd] = useState(l0.getDay());

  // 跟随父级 value（如「用当下」→ 同步显示）。
  // 父级可能高频重渲染（顶层 now 每秒 tick）且 value 是新建 Date，
  // 绝不能按对象身份比较——只在意“选中时间本身”是否变化，用格式化串对比。
  const fmtKey = formatDT(value);
  useEffect(() => {
    const f = formatDT(value);
    setSolarDate(f.slice(0, 10));
    setTime(f.slice(11));
    const l = Lunar.fromDate(value);
    setLy(l.getYear());
    setLmRaw(l.getMonth());
    setLd(l.getDay());
  }, [fmtKey]);

  const months = useMemo(() => {
    try { return LunarYear.fromYear(ly).getMonthsInYear(); } catch { return []; }
  }, [ly]);
  // 月 raw 编码：正 = 平月，负 = 闰月（LunarMonth.getMonth() 对闰月返回负值，统一归一）
  const rawOf = (m: LunarMonth) => (m.isLeap() ? -1 : 1) * Math.abs(m.getMonth());
  const selMonth = months.find((m) => rawOf(m) === lmRaw) ?? months[0] ?? null;
  const dayCount = selMonth?.getDayCount() ?? 30;

  const [hh, mm] = (time || '00:00').split(':').map(Number);

  // 农历 → 公历 文本（供提示行）
  const gongliText = useMemo(() => {
    if (!selMonth) return '';
    const d = lunarToDate(ly, lmRaw, ld, hh, mm);
    if (!Number.isFinite(d.getTime())) return '';
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }, [ly, lmRaw, ld, hh, mm, selMonth]);

  // 公历 → 农历 文本
  const nongliText = useMemo(() => {
    const d = new Date(`${solarDate}T${time || '00:00'}`);
    if (isNaN(d.getTime())) return '';
    const l = Lunar.fromDate(d);
    return `${l.getYear()}年${l.getMonth() < 0 ? '闰' : ''}${MONTH_CN[Math.abs(l.getMonth()) - 1]}${dayCn(l.getDay())}`;
  }, [solarDate, time]);

  const setSolar = (dateStr: string, hhmm: string) => {
    setSolarDate(dateStr);
    setTime(hhmm);
    const d = new Date(`${dateStr}T${hhmm || '00:00'}`);
    if (!isNaN(d.getTime())) onChange(d);
  };

  const handleYear = (y: number) => {
    setLy(y);
    const ms = LunarYear.fromYear(y).getMonthsInYear();
    if (ms.length) {
      const m0 = ms[0];
      setLmRaw(rawOf(m0));
      setLd(1);
      setTime(time);
      applyLunar(y, rawOf(m0), 1, time); // 年切换即回落到该年正月，直接提交
    }
  };
  const handleMonth = (raw: number) => {
    setLmRaw(raw);
    const m = months.find((x) => rawOf(x) === raw);
    const d = m && ld > m.getDayCount() ? m.getDayCount() : ld;
    setLd(d);
    applyLunar(ly, raw, d, time); // 月切换即提交
  };
  // 提交农历选择（显式传导最新参数，避免闭包读到旧 state）
  const applyLunar = (y: number = ly, raw: number = lmRaw, d: number = ld, t: string = time) => {
    const [h, mi] = (t || '00:00').split(':').map(Number);
    onChange(lunarToDate(y, raw, d, h, mi));
  };

  return (
    <div className="dtp">
      <div className="dtp-head">
        <span className="dtp-label">{label}</span>
        <button className={mode === 'solar' ? 'on' : ''} onClick={() => setMode('solar')}>公历</button>
        <button className={mode === 'lunar' ? 'on' : ''} onClick={() => setMode('lunar')}>农历</button>
      </div>

      <div className="dtp-body">
        {mode === 'solar' ? (
          <>
            <input type="date" value={solarDate} onChange={(e) => e.target.value && setSolar(e.target.value, time)} />
            <input type="time" value={time} onChange={(e) => e.target.value && setSolar(solarDate, e.target.value)} />
          </>
        ) : (
          <>
            <select value={ly} onChange={(e) => handleYear(Number(e.target.value))}>
              {Array.from({ length: YEAR_END - YEAR_START + 1 }, (_, i) => YEAR_START + i).map((y) => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>
            <select value={lmRaw} onChange={(e) => handleMonth(Number(e.target.value))}>
              {months.map((m) => {
                const raw = rawOf(m);
                return <option key={raw} value={raw}>{m.isLeap() ? '闰' : ''}{MONTH_CN[Math.abs(m.getMonth()) - 1]}</option>;
              })}
            </select>
            <select value={ld} onChange={(e) => { const d = Number(e.target.value); setLd(d); applyLunar(ly, lmRaw, d, time); }}>
              {Array.from({ length: dayCount }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{dayCn(d)}</option>
              ))}
            </select>
            <input type="time" value={time} onChange={(e) => { if (e.target.value) { setTime(e.target.value); applyLunar(ly, lmRaw, ld, e.target.value); } }} />
          </>
        )}
      </div>

      <div className="dtp-hint">
        {mode === 'solar' ? <>农历 <b>{nongliText}</b></> : <>公历 <b>{gongliText}</b></>}
      </div>
    </div>
  );
}