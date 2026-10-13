import React from 'react';
import { City } from '../lib/cities';
import { SHI_CHEN_INFO, hourToShiChen } from '../lib/truesolar';
import { ZHI } from '../lib/liuren';

interface Props { now: Date; city: City; trueTime: Date }

const pad = (n: number) => String(n).padStart(2, '0');

/** 十二时辰 SVG 表盘 */
export default function ClockPage({ now, city, trueTime }: Props) {
  const bjSC = hourToShiChen(now.getHours());
  const trueSC = hourToShiChen(trueTime.getHours());

  const R = 200, cx = 230, cy = 230;
  // 表盘起始角：子时（23-01点）在正上方。每个时辰占 30°，子正中=0°
  const angleOf = (zhi: number) => (zhi * 30 - 0) * (Math.PI / 180);

  const sector = (zhi: number) => {
    // 该时辰扇区：中心角 angleOf(zhi)，±15°
    const a0 = angleOf(zhi) - Math.PI / 12 - Math.PI / 2;
    const a1 = angleOf(zhi) + Math.PI / 12 - Math.PI / 2;
    const r0 = 108, r1 = R;
    const p = (a: number, r: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    const [x0, y0] = p(a0, r0), [x1, y1] = p(a0, r1), [x2, y2] = p(a1, r1), [x3, y3] = p(a1, r0);
    return `M ${x0} ${y0} L ${x1} ${y1} A ${r1} ${r1} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${r0} ${r0} 0 0 0 ${x0} ${y0} Z`;
  };

  // 指针角度：按分钟插值。北京时针对应当前小时分钟 → 在时辰内的进度
  const handAngle = (t: Date) => {
    const mins = ((t.getHours() + 1) % 24) * 60 + t.getMinutes();
    return (mins / 120) * 30 * (Math.PI / 180) - Math.PI / 2;
  };

  return (
    <div className="clock-layout">
      <div className="card">
        <h2>地支时钟</h2>
        <div className="dial-wrap">
          <svg width={460} height={460} viewBox="0 0 460 460">
            <circle cx={cx} cy={cy} r={R + 8} fill="none" stroke="var(--line)" strokeWidth={2} />
            {SHI_CHEN_INFO.map((sc) => {
              const isBj = sc.zhi === bjSC;
              const isTrue = sc.zhi === trueSC;
              const a = angleOf(sc.zhi) - Math.PI / 2;
              const tx = cx + 156 * Math.cos(a);
              const ty = cy + 156 * Math.sin(a);
              return (
                <g key={sc.zhi}>
                  <path
                    d={sector(sc.zhi)}
                    fill={isTrue ? '#f3dfc8' : isBj ? '#f7ece2' : 'transparent'}
                    stroke="var(--line)"
                    strokeWidth={1}
                  />
                  <text
                    x={tx} y={ty - 6} textAnchor="middle"
                    fontSize={19} fontWeight={700}
                    fill={isTrue ? 'var(--cinnabar)' : 'var(--ink)'}
                  >
                    {sc.name[0]}
                  </text>
                  <text x={tx} y={ty + 14} textAnchor="middle" fontSize={10.5} fill="var(--ink-light)">
                    {sc.range.slice(0, 5)}
                  </text>
                </g>
              );
            })}
            {/* 时针（按真太阳时） */}
            <line
              x1={cx} y1={cy}
              x2={cx + 96 * Math.cos(handAngle(trueTime))}
              y2={cy + 96 * Math.sin(handAngle(trueTime))}
              stroke="var(--cinnabar)" strokeWidth={3} strokeLinecap="round"
            />
            <circle cx={cx} cy={cy} r={6} fill="var(--cinnabar)" />
            {/* 中心读数 */}
            <text x={cx} y={cy - 130} textAnchor="middle" fontSize={13} fill="var(--ink-light)">真太阳时</text>
            <text x={cx} y={cy - 108} textAnchor="middle" fontSize={22} fontWeight={700} fill="var(--ink)" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {pad(trueTime.getHours())}:{pad(trueTime.getMinutes())}
            </text>
            <text x={cx} y={cy + 128} textAnchor="middle" fontSize={13} fill="var(--ink-light)">北京时间</text>
            <text x={cx} y={cy + 152} textAnchor="middle" fontSize={22} fontWeight={700} fill="var(--ink)" style={{ fontVariantNumeric: 'tabular-nums' }}>
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
              border: sc.zhi === trueSC ? '1px solid var(--cinnabar)' : '1px solid transparent',
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
