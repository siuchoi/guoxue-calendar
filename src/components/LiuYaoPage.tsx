import React, { useMemo, useRef, useState } from 'react';
import { Solar } from 'lunar-typescript';
import {
  paiLiuYao, linesFromNumbers, linesFromTime, coinToValue,
  GUA_SYM, YONG_SHEN_HINT, LiuYaoResult,
} from '../lib/liuyao';
import { interpretLiuYao } from '../lib/interpret';
import DateTimePicker, { formatDT, parseDT } from './DateTimePicker';
import InterpCard from './InterpCard';
import GuideCard from './GuideCard';

type Mode = 'coin' | 'time' | 'num';

const YAO_NAME = ['', '初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];
const VALUE_TEXT: Record<number, string> = { 6: '老阴 ⚋ (动)', 7: '少阳 ⚊', 8: '少阴 ⚋', 9: '老阳 ⚊ (动)' };

/** 三枚铜钱组件 */
function Coins({ backs, spinning }: { backs: number[]; spinning: boolean }) {
  return (
    <div className="ly-coins">
      {backs.map((b, i) => (
        <div key={i} className={'ly-coin' + (spinning ? ' spinning' : '')} style={{ animationDelay: `${i * 0.12}s` }}>
          <div className="ly-coin-face">{spinning ? '' : b ? '背' : '字'}</div>
        </div>
      ))}
    </div>
  );
}

/** 爻画 */
function YaoLine({ yang, dong, big }: { yang: number; dong?: boolean; big?: boolean }) {
  return (
    <span className={'ly-yao' + (big ? ' big' : '') + (dong ? ' dong' : '')}>
      {yang ? <i /> : <><i /><i /></>}
      {dong && <em className="ly-dong-dot">○</em>}
    </span>
  );
}

export default function LiuYaoPage({ now }: { now: Date }) {
  const [mode, setMode] = useState<Mode>('coin');
  // 摇铜钱状态
  const [lines, setLines] = useState<number[]>([]); // 已摇爻值（初→上）
  const [coins, setCoins] = useState<number[]>([0, 0, 0]);
  const [spinning, setSpinning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 时间/数字起卦
  const pad = (n: number) => String(n).padStart(2, '0');
  const [dt, setDt] = useState(
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`,
  );
  const [nums, setNums] = useState<[string, string, string]>(['', '', '']);
  const [result, setResult] = useState<LiuYaoResult | null>(null);
  const [usedTime, setUsedTime] = useState<Date>(now);

  const doPai = (values: number[], method: string, date: Date) => {
    const lunar = Solar.fromYmdHms(
      date.getFullYear(), date.getMonth() + 1, date.getDate(),
      date.getHours(), date.getMinutes(), 0,
    ).getLunar();
    const dayGZ = lunar.getDayInGanZhi();
    setResult(paiLiuYao(values, {
      method,
      dayGan: dayGZ[0],
      dayZhi: dayGZ[1],
      monthZhi: lunar.getMonthInGanZhi()[1],
    }));
    setUsedTime(date);
  };

  /** 摇一爻 */
  const castOnce = () => {
    if (spinning || lines.length >= 6) return;
    setSpinning(true);
    // 动画期间随机闪动
    const flicker = setInterval(() => {
      setCoins([0, 0, 0].map(() => (Math.random() < 0.5 ? 1 : 0)));
    }, 90);
    timerRef.current = setTimeout(() => {
      clearInterval(flicker);
      const final: number[] = [0, 0, 0].map(() => (Math.random() < 0.5 ? 1 : 0));
      setCoins(final);
      setSpinning(false);
      const backs = final.reduce((a, b) => a + b, 0);
      setLines((prev) => [...prev, coinToValue(backs)]);
    }, 900);
  };

  // 摇满 6 次自动排盘
  React.useEffect(() => {
    if (lines.length === 6) doPai(lines, '铜钱起卦', new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines]);

  const reset = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLines([]);
    setSpinning(false);
    setResult(null);
  };

  const castByTime = () => {
    const [d, t] = dt.split('T');
    const [y, m, day] = d.split('-').map(Number);
    const [hh, mm] = t.split(':').map(Number);
    const date = new Date(y, m - 1, day, hh, mm);
    const lunar = Solar.fromYmdHms(y, m, day, hh, mm, 0).getLunar();
    const yearZhiIdx = '子丑寅卯辰巳午未申酉戌亥'.indexOf(lunar.getYearZhi()) + 1;
    const timeZhiIdx = '子丑寅卯辰巳午未申酉戌亥'.indexOf(lunar.getTimeZhi()) + 1;
    doPai(linesFromTime(yearZhiIdx, Math.abs(lunar.getMonth()), lunar.getDay(), timeZhiIdx), '时间起卦', date);
  };

  const castByNums = () => {
    const [a, b, c] = nums.map((s) => parseInt(s, 10));
    if ([a, b, c].some((n) => !Number.isFinite(n) || n <= 0)) return;
    doPai(linesFromNumbers(a, b, c), '数字起卦', new Date());
  };

  return (
    <div className="page-stack">
      {/* 起卦 */}
      <div className="card">
        <div className="section-title" style={{ marginTop: 0 }}>六爻 · 摇卦</div>
        <GuideCard id="liuyao" />
        <div className="mh-mode">
          <button className={mode === 'coin' ? 'on' : ''} onClick={() => setMode('coin')}>摇铜钱</button>
          <button className={mode === 'time' ? 'on' : ''} onClick={() => setMode('time')}>时间起卦</button>
          <button className={mode === 'num' ? 'on' : ''} onClick={() => setMode('num')}>数字起卦</button>
        </div>

        {mode === 'coin' && (
          <div className="ly-coin-area">
            <Coins backs={coins} spinning={spinning} />
            <div className="ly-coin-btns">
              <button className="ly-cast-btn" onClick={castOnce} disabled={spinning || lines.length >= 6}>
                {lines.length >= 6 ? '六爻已成' : spinning ? '摇卦中…' : `摇第${['', '一', '二', '三', '四', '五', '六'][lines.length + 1]}爻`}
              </button>
              {(lines.length > 0 || result) && <button className="ly-reset-btn" onClick={reset}>重摇</button>}
            </div>
            {lines.length > 0 && (
              <div className="ly-cast-history">
                {lines.map((v, i) => (
                  <div key={i} className="ly-cast-item">
                    <b>{YAO_NAME[i + 1]}</b> {VALUE_TEXT[v]}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

{mode === 'time' && (
            <div className="mh-form">
              <DateTimePicker value={parseDT(dt, now)} onChange={(d) => setDt(formatDT(d))} label="起卦时间" />
              <button className="ly-cast-btn" onClick={castByTime}>起卦排盘</button>
              <div className="mh-hint">以农历年月日时起卦（梅花数法）</div>
            </div>
          )}

        {mode === 'num' && (
          <div className="mh-form">
            <input placeholder="上卦数" value={nums[0]} onChange={(e) => setNums([e.target.value, nums[1], nums[2]])} />
            <input placeholder="下卦数" value={nums[1]} onChange={(e) => setNums([nums[0], e.target.value, nums[2]])} />
            <input placeholder="动爻数" value={nums[2]} onChange={(e) => setNums([nums[0], nums[1], e.target.value])} />
            <button className="ly-cast-btn" onClick={castByNums}>起卦排盘</button>
          </div>
        )}
      </div>

      {/* 卦盘 */}
      {result ? (
        <>
          <div className="card ly-pan">
            <div className="ly-pan-head">
              <div>
                <span className="ly-gua-name">{GUA_SYM[result.ben.upperNum]}{GUA_SYM[result.ben.lowerNum]} {result.ben.name}</span>
                <span className="ly-gua-gong">{result.ben.gong}宫 · {result.ben.gongWuxing}</span>
                {result.bian && (
                  <>
                    <span className="ly-arrow">→</span>
                    <span className="ly-gua-name bian">{GUA_SYM[result.bian.upperNum]}{GUA_SYM[result.bian.lowerNum]} {result.bian.name}</span>
                    <span className="ly-gua-gong">{result.bian.gong}宫</span>
                  </>
                )}
              </div>
              <div className="mh-hint">
                {result.method} · {usedTime.getFullYear()}-{pad(usedTime.getMonth() + 1)}-{pad(usedTime.getDate())} · 日辰 {result.dayGan}{result.dayZhi} · 月建 {result.monthZhi}
              </div>
            </div>

            <div className="ly-lines">
              {[5, 4, 3, 2, 1, 0].map((i) => {
                const pos = i + 1;
                const isShi = result.ben.shi === pos;
                const isYing = result.ben.ying === pos;
                const isDong = result.moving.includes(pos);
                return (
                  <div key={pos} className={'ly-line' + (isDong ? ' dong' : '')}>
                    <span className="ly-shen">{result.liushen[i]}</span>
                    <YaoLine yang={result.yangs[i]} dong={isDong} big />
                    <span className="ly-qin">{result.ben.liuqin[i]}</span>
                    <span className="ly-na">{result.ben.najia[i]}</span>
                    <span className="ly-mark">
                      {isShi && <b className="shi">世</b>}
                      {isYing && <b className="ying">应</b>}
                    </span>
                    {result.bian && (
                      <span className="ly-bian-part">
                        {isDong ? '→' : ''}
                        <YaoLine yang={result.bian.yangs[i]} />
                        <span className="ly-qin dim">{result.bian.liuqin[i]}</span>
                        <span className="ly-na dim">{result.bian.najia[i]}</span>
                        <span className="ly-mark">
                          {result.bian.shi === pos && <b className="shi dim">世</b>}
                          {result.bian.ying === pos && <b className="ying dim">应</b>}
                        </span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="section-title">卦断参考</div>
            <div className="ly-summary">
              <div>世爻在{YAO_NAME[result.ben.shi]}，应爻在{YAO_NAME[result.ben.ying]}，世持<b>{result.ben.liuqin[result.ben.shi - 1]}</b></div>
              <div className="mh-hint">用神参考：{YONG_SHEN_HINT[result.ben.liuqin[result.ben.shi - 1]]}</div>
              {result.moving.length > 0 && (
                <div>动爻：{result.moving.map((m) => YAO_NAME[m]).join('、')}，之卦 {result.bian?.name}</div>
              )}
            </div>
          </div>

          <InterpCard interp={interpretLiuYao(result)} />
        </>
      ) : (
        <div className="card ly-empty">
          <div>☯</div>
          <p>心诚则灵。默念所问之事，开始摇卦。</p>
        </div>
      )}
    </div>
  );
}
