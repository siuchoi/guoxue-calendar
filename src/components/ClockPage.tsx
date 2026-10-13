import React from 'react';
import { City } from '../lib/cities';
import { SHI_CHEN_INFO, hourToShiChen } from '../lib/truesolar';
import { ZHI } from '../lib/liuren';

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

/** 十二时辰 SVG 罗盘 */
export default function ClockPage({ now, city, trueTime }: Props) {
  const bjSC = hourToShiChen(now.getHours());
  const trueSC = hourToShiChen(trueTime.getHours());

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
          <svg width={460} height={460} viewBox="0 0 460 460">
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

            {/* 十二时辰扇区 */}
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
                    fill={color}
                    fillOpacity={isTrue ? 0.95 : isBj ? 0.5 : 0.24}
                    stroke={isTrue ? color : 'var(--card)'}
                    strokeWidth={isTrue ? 2.5 : 1.5}
                  />
                  <text
                    x={tx} y={ty - 4} textAnchor="middle"
                    fontSize={isTrue ? 22 : 19} fontWeight={700} fontFamily={KAITI}
                    fill={isTrue ? '#fff' : 'var(--ink)'}
                  >
                    {sc.name[0]}
                  </text>
                  <text
                    x={tx} y={ty + 15} textAnchor="middle" fontSize={10.5}
                    fill={isTrue ? 'rgba(255,255,255,0.9)' : 'var(--ink-light)'}
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {sc.range.slice(0, 5)}
                  </text>
                </g>
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
