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

/**
 * 时辰表：早子 00-01 … 亥 21-23 … 晚子 23-24。
 * 13 项——晚子（23 点）单独成项，保八字/金口诀的晚子换日逻辑（hour>=23）。
 */
const SHICHEN = ['早子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '晚子'] as const;
const SHICHEN_RANGE = ['00-01', '01-03', '03-05', '05-07', '07-09', '09-11', '11-13', '13-15', '15-17', '17-19', '19-21', '21-23', '23-24'] as const;
/** Date.getHours() → 时辰索引 */
const hourToShi = (h: number) => (h >= 23 ? 12 : h === 0 ? 0 : Math.floor((h + 1) / 2));
/** 时辰索引 → 代表小时（时辰中点；晚子=23） */
const shiToHour = (i: number) => (i >= 12 ? 23 : i * 2);

/** 农历年月（含闰月，负数表闰）→ 公历 Date，保留钟表时刻 */
const lunarToDate = (y: number, mRaw: number, d: number, hh: number, mm: number): Date => {
  const solar = Lunar.fromYmd(y, mRaw, d).getSolar();
  return new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay(), hh, mm);
};

/** 公历某年月的日数（m 取 1-12） */
const solarDayCount = (y: number, m: number) => new Date(y, m, 0).getDate();

const YEAR_START = 1900;
const YEAR_END = 2100;
const YEARS = Array.from({ length: YEAR_END - YEAR_START + 1 }, (_, i) => YEAR_START + i);

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
 * 两种模式同构：年/月/日三段下拉 + 时辰下拉（选择即生效，日数随年月自动收敛）。
 * 农历月含闰月；底部始终显示另一制式的换算结果。
 */
export default function DateTimePicker({ value, onChange, label = '时间' }: Props) {
  const [mode, setMode] = useState<'solar' | 'lunar'>('solar');
  // 公历
  const [sy, setSy] = useState(value.getFullYear());
  const [sm, setSm] = useState(value.getMonth() + 1);
  const [sd, setSd] = useState(value.getDate());
  const [shi, setShi] = useState(() => hourToShi(value.getHours()));
  // 农历
  const l0 = useMemo(() => Lunar.fromDate(value), []);
  const [ly, setLy] = useState(l0.getYear());
  const [lmRaw, setLmRaw] = useState(l0.getMonth()); // 负 = 闰月
  const [ld, setLd] = useState(l0.getDay());

  // 跟随父级 value（如「用当下」→ 同步显示）。
  // 父级可能高频重渲染（顶层 now 每秒 tick）且 value 是新建 Date，
  // 绝不能按对象身份比较——只在意“选中时间本身”是否变化，用格式化串对比。
  const fmtKey = formatDT(value);
  useEffect(() => {
    setSy(value.getFullYear());
    setSm(value.getMonth() + 1);
    setSd(value.getDate());
    setShi(hourToShi(value.getHours()));
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
  const lunarDayCount = selMonth?.getDayCount() ?? 30;

  const hh = shiToHour(shi);

  // 农历 → 公历 文本（供提示行）
  const gongliText = useMemo(() => {
    if (!selMonth) return '';
    const d = lunarToDate(ly, lmRaw, ld, hh, 0);
    if (!Number.isFinite(d.getTime())) return '';
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${SHICHEN[shi]}时`;
  }, [ly, lmRaw, ld, hh, shi, selMonth]);

  // 公历 → 农历 文本
  const nongliText = useMemo(() => {
    const d = new Date(sy, sm - 1, Math.min(sd, solarDayCount(sy, sm)), hh, 0);
    const l = Lunar.fromDate(d);
    return `${l.getYear()}年${l.getMonth() < 0 ? '闰' : ''}${MONTH_CN[Math.abs(l.getMonth()) - 1]}${dayCn(l.getDay())} ${SHICHEN[shi]}时`;
  }, [sy, sm, sd, hh, shi]);

  // ── 公历：提交（日随年月超界收敛，如 1月31 → 2月29/28）──
  const applySolar = (y: number = sy, m: number = sm, d: number = sd, s: number = shi) => {
    const dd = Math.min(d, solarDayCount(y, m));
    if (dd !== d) setSd(dd);
    onChange(new Date(y, m - 1, dd, shiToHour(s), 0));
  };
  const onSolarYear = (y: number) => { setSy(y); applySolar(y, sm, sd, shi); };
  const onSolarMonth = (m: number) => { setSm(m); applySolar(sy, m, sd, shi); };
  const onSolarDay = (d: number) => { setSd(d); applySolar(sy, sm, d, shi); };

  // ── 农历：提交（显式传导最新参数，避免闭包读到旧 state）──
  const applyLunar = (y: number = ly, raw: number = lmRaw, d: number = ld, s: number = shi) => {
    onChange(lunarToDate(y, raw, d, shiToHour(s), 0));
  };
  const onLunarYear = (y: number) => {
    setLy(y);
    const ms = LunarYear.fromYear(y).getMonthsInYear();
    if (ms.length) {
      const m0 = ms[0];
      setLmRaw(rawOf(m0));
      setLd(1);
      applyLunar(y, rawOf(m0), 1, shi); // 年切换即回落到该年正月
    }
  };
  const onLunarMonth = (raw: number) => {
    setLmRaw(raw);
    const m = months.find((x) => rawOf(x) === raw);
    const d = m && ld > m.getDayCount() ? m.getDayCount() : ld;
    setLd(d);
    applyLunar(ly, raw, d, shi);
  };
  const onLunarDay = (d: number) => { setLd(d); applyLunar(ly, lmRaw, d, shi); };

  const onShi = (s: number) => {
    setShi(s);
    if (mode === 'solar') applySolar(sy, sm, sd, s);
    else applyLunar(ly, lmRaw, ld, s);
  };

  const shichenSelect = (
    <select className="dtp-shichen" value={shi} onChange={(e) => onShi(Number(e.target.value))}>
      {SHICHEN.map((s, i) => (
        <option key={s} value={i}>{s}时 {SHICHEN_RANGE[i]}点</option>
      ))}
    </select>
  );

  return (
    <div className="dtp">
      <div className="dtp-head">
        <span className="dtp-label">{label}</span>
        <div className="dtp-seg">
          <button className={mode === 'solar' ? 'on' : ''} onClick={() => setMode('solar')}>公历</button>
          <button className={mode === 'lunar' ? 'on' : ''} onClick={() => setMode('lunar')}>农历</button>
        </div>
      </div>

      <div className="dtp-body">
        {mode === 'solar' ? (
          <>
            <select value={sy} onChange={(e) => onSolarYear(Number(e.target.value))}>
              {YEARS.map((y) => <option key={y} value={y}>{y}年</option>)}
            </select>
            <select value={sm} onChange={(e) => onSolarMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{m}月</option>
              ))}
            </select>
            <select value={sd} onChange={(e) => onSolarDay(Number(e.target.value))}>
              {Array.from({ length: solarDayCount(sy, sm) }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{d}日</option>
              ))}
            </select>
            {shichenSelect}
          </>
        ) : (
          <>
            <select value={ly} onChange={(e) => onLunarYear(Number(e.target.value))}>
              {YEARS.map((y) => <option key={y} value={y}>{y}年</option>)}
            </select>
            <select value={lmRaw} onChange={(e) => onLunarMonth(Number(e.target.value))}>
              {months.map((m) => {
                const raw = rawOf(m);
                return <option key={raw} value={raw}>{m.isLeap() ? '闰' : ''}{MONTH_CN[Math.abs(m.getMonth()) - 1]}</option>;
              })}
            </select>
            <select value={ld} onChange={(e) => onLunarDay(Number(e.target.value))}>
              {Array.from({ length: lunarDayCount }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{dayCn(d)}</option>
              ))}
            </select>
            {shichenSelect}
          </>
        )}
      </div>

      <div className="dtp-hint">
        <span className="dtp-hint-mark">☯</span>
        <span className="dtp-hint-text">
          {mode === 'solar' ? <>农历 <b>{nongliText}</b></> : <>公历 <b>{gongliText}</b></>}
        </span>
      </div>
    </div>
  );
}