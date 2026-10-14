import React, { useEffect, useState } from 'react';
import { Solar } from 'lunar-typescript';
import { City } from '../lib/cities';
import { SHI_CHEN_INFO, hourToShiChen } from '../lib/truesolar';
import { ZHI } from '../lib/liuren';

/** 二十四节气（自冬至起，每 15° 一个）：n=名称，t=节/气 */
const JIE_QI: { n: string; t: '节' | '气' }[] = [
  { n: '冬至', t: '气' }, { n: '小寒', t: '节' }, { n: '大寒', t: '气' },
  { n: '立春', t: '节' }, { n: '雨水', t: '气' }, { n: '惊蛰', t: '节' },
  { n: '春分', t: '气' }, { n: '清明', t: '节' }, { n: '谷雨', t: '气' },
  { n: '立夏', t: '节' }, { n: '小满', t: '气' }, { n: '芒种', t: '节' },
  { n: '夏至', t: '气' }, { n: '小暑', t: '节' }, { n: '大暑', t: '气' },
  { n: '立秋', t: '节' }, { n: '处暑', t: '气' }, { n: '白露', t: '节' },
  { n: '秋分', t: '气' }, { n: '寒露', t: '节' }, { n: '霜降', t: '气' },
  { n: '立冬', t: '节' }, { n: '小雪', t: '气' }, { n: '大雪', t: '节' },
];

interface Props { now: Date; city: City; trueTime: Date }

const pad = (n: number) => String(n).padStart(2, '0');

/** 十二时辰配色：日行一周 —— 夜蓝 → 晓绿 → 午红 → 暮紫 → 夜阑 */
const SC_COLORS = [
  '#4A5D7E', // 子 黛蓝
  '#5C7186', // 丑 苍蓝
  '#5E8575', // 寅 松绿
  '#7A9E6E', // 卯 竹青
  '#A89B58', // 辰 藤黄
  '#C08A3E', // 巳 琥珀
  '#B5482E', // 午 朱砂
  '#B26B45', // 未 赭石
  '#C08B52', // 申 杏黄
  '#96708A', // 酉 紫檀
  '#665E7A', // 戌 玄紫
  '#3F4A63', // 亥 玄青
];

const KAITI = '"Kaiti SC", "STKaiti", "KaiTi", serif';

/** 秒针轨道：rAF 逐帧驱动，彗星拖尾匀速绕圈 */
function SecondsOrbit({ cx, cy, orbit }: { cx: number; cy: number; orbit: number }) {
  const [sec, setSec] = useState(() => Date.now() / 1000);
  useEffect(() => {
    let raf: number;
    const tick = () => {
      setSec(Date.now() / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const s = sec % 60;
  const headA = (s / 60) * Math.PI * 2 - Math.PI / 2;
  const dots = [];
  const N = 22;
  for (let i = N; i >= 1; i--) {
    const a = headA - i * (Math.PI * 2 / 60) * 0.4; // 每颗尾点落后 0.4s
    const t = 1 - i / N;
    dots.push(
      <circle
        key={i}
        cx={cx + orbit * Math.cos(a)} cy={cy + orbit * Math.sin(a)}
        r={1 + 2.4 * t}
        fill="var(--cinnabar)" fillOpacity={0.05 + 0.45 * t * t}
      />
    );
  }
  const hx = cx + orbit * Math.cos(headA), hy = cy + orbit * Math.sin(headA);
  return (
    <g>
      {dots}
      <circle cx={hx} cy={hy} r={7.5} fill="var(--cinnabar)" fillOpacity={0.18} />
      <circle cx={hx} cy={hy} r={3.8} fill="var(--cinnabar)" stroke="#fff" strokeWidth={1.2} />
    </g>
  );
}

/** 十二时辰 SVG 罗盘 */
export default function ClockPage({ now, city, trueTime }: Props) {
  const bjSC = hourToShiChen(now.getHours());
  const trueSC = hourToShiChen(trueTime.getHours());
  const lunar = Solar.fromDate(now).getLunar();
  const curJieQi = lunar.getPrevJieQi(true).getName();
  const isDay = trueTime.getHours() >= 6 && trueTime.getHours() < 18;

  const R = 200, cx = 230, cy = 230, R0 = 116;
  // 子时正中=正上方，每时辰 30°
  const angleOf = (zhi: number) => zhi * 30 * (Math.PI / 180);

  const sector = (zhi: number) => {
    const a0 = angleOf(zhi) - Math.PI / 12 - Math.PI / 2;
    const a1 = angleOf(zhi) + Math.PI / 12 - Math.PI / 2;
    const p = (a: number, r: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    const [x0, y0] = p(a0, R0), [x1, y1] = p(a0, R), [x2, y2] = p(a1, R), [x3, y3] = p(a1, R0);
    return `M ${x0} ${y0} L ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${R0} ${R0} 0 0 0 ${x0} ${y0} Z`;
  };

  return (
    <div className="clock-layout">
      <div className="card">
        <h2>地支时钟</h2>
        <div className="dial-wrap">
          <svg viewBox="0 0 460 460" style={{ width: '100%', maxWidth: 620, height: 'auto' }}>
            {/* 外圈双环 + 刻度 */}
            <circle cx={cx} cy={cy} r={R + 14} fill="none" stroke="var(--line)" strokeWidth={1.5} />
            <circle cx={cx} cy={cy} r={R + 4} fill="var(--card)" stroke="var(--line)" strokeWidth={1} />
            {Array.from({ length: 24 }).map((_, k) => {
              const a = k * 15 * (Math.PI / 180) - Math.PI / 2;
              const long = k % 2 === 1; // 时辰分界处长刻度
              const r1 = R + 4, r2 = R + (long ? 14 : 9);
              return (
                <line
                  key={k}
                  x1={cx + r1 * Math.cos(a)} y1={cy + r1 * Math.sin(a)}
                  x2={cx + r2 * Math.cos(a)} y2={cy + r2 * Math.sin(a)}
                  stroke="var(--ink-light)" strokeWidth={long ? 1.5 : 0.8}
                />
              );
            })}

            {/* 秒针轨道：彗星级拖尾（外圈双环之间） */}
            <SecondsOrbit cx={cx} cy={cy} orbit={R + 9} />

            {/* 十二时辰扇区：默认统一暗色素底，仅当前时辰亮彩色 */}
            {SHI_CHEN_INFO.map((sc) => {
              const isTrue = sc.zhi === trueSC;
              const isBj = sc.zhi === bjSC && !isTrue;
              const color = SC_COLORS[sc.zhi];
              const a = angleOf(sc.zhi) - Math.PI / 2;
              const tx = cx + 162 * Math.cos(a);
              const ty = cy + 162 * Math.sin(a);
              return (
                <g key={sc.zhi}>
                  <path
                    d={sector(sc.zhi)}
                    fill={isTrue ? color : '#8F8674'}
                    fillOpacity={isTrue ? 0.95 : isBj ? 0.32 : 0.13}
                    stroke={isTrue ? color : 'none'}
                    strokeWidth={isTrue ? 2.5 : 0}
                  />
                  <text
                    x={tx} y={ty + 4} textAnchor="middle"
                    fontSize={isTrue ? 27 : 19} fontWeight={700} fontFamily={KAITI}
                    fill={isTrue ? '#fff' : 'var(--ink)'}
                  >
                    {sc.name[0]}
                  </text>
                </g>
              );
            })}

            {/* 24 小时数字：放在扇区之后绘制，满色高亮也不遮挡；白描边保证亮底可读 */}
            {Array.from({ length: 24 }).map((_, h) => {
              const a = h * 15 * (Math.PI / 180) - Math.PI / 2;
              const r = 186;
              return (
                <text
                  key={h}
                  x={cx + r * Math.cos(a)} y={cy + r * Math.sin(a)}
                  textAnchor="middle" dominantBaseline="central" fontSize={9.5}
                  fill="var(--ink-light)"
                  style={{ fontVariantNumeric: 'tabular-nums', paintOrder: 'stroke', stroke: 'var(--card)', strokeWidth: 2.5 }}
                >
                  {pad(h)}
                </text>
              );
            })}

            {/* 二十四节气环：按天文角度排布（冬至=子正、夏至=午正），节红气绿，当前节气加粗 */}
            {JIE_QI.map((jq, i) => {
              const a = i * 15 * (Math.PI / 180) - Math.PI / 2;
              const r = 131;
              const isCur = jq.n === curJieQi;
              return (
                <text
                  key={jq.n}
                  x={cx + r * Math.cos(a)} y={cy + r * Math.sin(a)}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={isCur ? 12.5 : 10.5} fontWeight={isCur ? 700 : 400} fontFamily={KAITI}
                  fill={isCur ? 'var(--cinnabar)' : jq.t === '节' ? '#B5482E' : '#5E8575'}
                  fillOpacity={1}
                  style={{ paintOrder: 'stroke', stroke: 'var(--card)', strokeWidth: 2 }}
                >
                  {jq.n}
                </text>
              );
            })}

            {/* 中心白盘 */}
            <circle cx={cx} cy={cy} r={R0} fill="var(--paper)" stroke="var(--line)" strokeWidth={1.5} />

            {/* 罗盘心无针，以满色扇区指示当前时辰 */}

            {/* 中心读数（全部收在圆心内） */}
            <text x={cx} y={cy - 56} textAnchor="middle" fontSize={12.5} letterSpacing={3} fill="var(--ink-light)">真太阳时</text>
            <text x={cx} y={cy - 26} textAnchor="middle" fontSize={25} fontWeight={700} fill="var(--cinnabar)" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {pad(trueTime.getHours())}:{pad(trueTime.getMinutes())}:{pad(trueTime.getSeconds())}
            </text>
            <line x1={cx - 64} y1={cy - 8} x2={cx + 64} y2={cy - 8} stroke="var(--line)" strokeDasharray="3 3" />
            <text x={cx} y={cy + 18} textAnchor="middle" fontSize={12.5} letterSpacing={3} fill="var(--ink-light)">北京时间</text>
            <text x={cx} y={cy + 48} textAnchor="middle" fontSize={25} fontWeight={700} fill="var(--ink)" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
            </text>
          </svg>
        </div>
        <div className="time-readout">
          <div className="sc">
            {lunar.getYearInGanZhi()}年 · {lunar.getMonthInGanZhi()}月 · <b style={{ color: 'var(--cinnabar)' }}>{curJieQi}</b> · {isDay ? '昼' : '夜'}
          </div>
          <div className="sc">
            北京 {SHI_CHEN_INFO[bjSC].name}（{ZHI[bjSC]}） · 真太阳 {SHI_CHEN_INFO[trueSC].name}（{ZHI[trueSC]}）
          </div>
        </div>
      </div>

      <div className="card">
        <h2>时辰养生</h2>
        {SHI_CHEN_INFO.map((sc) => (
          <div
            key={sc.zhi}
            className="tip-box"
            style={{
              marginBottom: 8,
              borderLeft: `4px solid ${SC_COLORS[sc.zhi]}`,
              border: sc.zhi === trueSC ? `1px solid ${SC_COLORS[sc.zhi]}` : '1px solid transparent',
              borderLeftWidth: 4,
              borderLeftColor: SC_COLORS[sc.zhi],
            }}
          >
            <b>{sc.name}</b> <span style={{ color: 'var(--ink-light)', fontSize: 12 }}>{sc.range}</span>
            <div style={{ fontSize: 13 }}>{sc.tip}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
