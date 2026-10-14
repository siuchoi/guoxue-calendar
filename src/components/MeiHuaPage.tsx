import React, { useMemo, useState } from 'react';
import { Lunar } from 'lunar-typescript';
import { qiGuaByNumbers, qiGuaByTime, MeiHuaResult, BAGUA } from '../lib/meihua';
import DateTimePicker, { formatDT, parseDT } from './DateTimePicker';

type Mode = 'time' | 'number';

/** 卦画：六爻线，初爻在下，动爻朱砂高亮 */
function GuaHua({ lines, dong, tiPos, upperFirst }: { lines: number[]; dong?: number; tiPos?: '上' | '下'; upperFirst?: boolean }) {
  return (
    <div className="gua-hua">
      {[5, 4, 3, 2, 1, 0].map((i) => {
        const isDong = dong === i + 1;
        const inUpper = i >= 3;
        const isTi = tiPos ? (tiPos === '上') === inUpper : false;
        return (
          <div key={i} className={'yao-row' + (isDong ? ' dong' : '')}>
            <span className={'yao ' + (lines[i] ? 'yang' : 'yin') + (isTi ? ' ti' : '')}>
              {lines[i] === 1 ? <i /> : <><i /><i /></>}
            </span>
            {isDong && <span className="dong-mark">动</span>}
          </div>
        );
      })}
    </div>
  );
}

function GuaCard({ title, gua, dong, tiPos, accent }: {
  title: string;
  gua: MeiHuaResult['ben'];
  dong?: number;
  tiPos?: '上' | '下';
  accent?: boolean;
}) {
  const up = BAGUA[gua.upper - 1], lo = BAGUA[gua.lower - 1];
  return (
    <div className={'gua-card' + (accent ? ' accent' : '')}>
      <div className="gua-title">{title}</div>
      <GuaHua lines={gua.lines} dong={dong} tiPos={tiPos} />
      <div className="gua-name">{gua.name}</div>
      <div className="gua-sub">{up.symbol} {up.name}{up.nature}（{up.wuxing}）上 · {lo.symbol} {lo.name}{lo.nature}（{lo.wuxing}）下</div>
    </div>
  );
}

export default function MeiHuaPage({ now }: { now: Date }) {
  const [mode, setMode] = useState<Mode>('time');
  const [customTime, setCustomTime] = useState('');
  const [useNow, setUseNow] = useState(true);
  const [nums, setNums] = useState<[string, string, string]>(['', '', '']);

  const result = useMemo<MeiHuaResult | null>(() => {
    if (mode === 'time') {
      const t = useNow || !customTime ? now : new Date(customTime);
      if (isNaN(t.getTime())) return null;
      const lunar = Lunar.fromDate(t);
      return qiGuaByTime(
        '子丑寅卯辰巳午未申酉戌亥'.indexOf(lunar.getYearZhi()),
        lunar.getMonth(),
        lunar.getDay(),
        '子丑寅卯辰巳午未申酉戌亥'.indexOf(lunar.getTimeZhi())
      );
    }
    const [a, b, c] = nums.map((s) => parseInt(s, 10));
    if ([a, b, c].some((n) => isNaN(n) || n < 1)) return null;
    return qiGuaByNumbers(a, b, c);
  }, [mode, useNow, customTime, nums, now]);

  const lunarNow = Lunar.fromDate(now);

  return (
    <div>
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="section-title">梅花易数 · 起卦</div>
        <div className="mh-mode">
          <button className={mode === 'time' ? 'on' : ''} onClick={() => setMode('time')}>时间起卦</button>
          <button className={mode === 'number' ? 'on' : ''} onClick={() => setMode('number')}>数字起卦</button>
        </div>
        {mode === 'time' ? (
          <div className="mh-form">
            <label>
              <input type="checkbox" checked={useNow} onChange={(e) => setUseNow(e.target.checked)} /> 用当下时间
            </label>
            {!useNow && (
              <DateTimePicker value={parseDT(customTime, now)} onChange={(d) => setCustomTime(formatDT(d))} />
            )}
            <span className="mh-hint">
              {useNow
                ? `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} · 农历${lunarNow.getMonthInChinese()}月${lunarNow.getDayInChinese()}`
                : '选择想起卦的时间'}
            </span>
          </div>
        ) : (
          <div className="mh-form">
            <input placeholder="上卦数" value={nums[0]} onChange={(e) => setNums([e.target.value, nums[1], nums[2]])} />
            <input placeholder="下卦数" value={nums[1]} onChange={(e) => setNums([nums[0], e.target.value, nums[2]])} />
            <input placeholder="动爻数" value={nums[2]} onChange={(e) => setNums([nums[0], nums[1], e.target.value])} />
            <span className="mh-hint">任意三个正整数，如 123、456、7</span>
          </div>
        )}
      </div>

      {result && (
        <>
          <div className="gua-grid">
            <GuaCard title="本卦" gua={result.ben} dong={result.dongYao} tiPos={result.tiPos} accent />
            <GuaCard title="互卦" gua={result.hu} />
            <GuaCard title="变卦" gua={result.bian} />
          </div>

          <div className="card" style={{ marginTop: 18 }}>
            <div className="section-title">体用分析</div>
            <div className="ty-row">
              <span className="ty-chip ti">体卦：{result.tiGua.symbol} {result.tiGua.name}（{result.tiGua.wuxing}）· {result.tiPos}卦</span>
              <span className="ty-chip">用卦：{result.yongGua.symbol} {result.yongGua.name}（{result.yongGua.wuxing}）· {result.tiPos === '上' ? '下' : '上'}卦</span>
              <span className="ty-chip dong">动爻：第 {result.dongYao} 爻</span>
            </div>
            <div className="ty-verdict">
              <b>{result.relationShort}</b>　{result.relation}
            </div>
            <div className="mh-hint" style={{ marginTop: 10 }}>
              本卦为事之始，互卦为事之中，变卦为事之终。体为己身，用为所占之事。
            </div>
          </div>
        </>
      )}
    </div>
  );
}
