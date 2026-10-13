import React, { useMemo, useState } from 'react';
import { Solar } from 'lunar-typescript';
import { GAN, ZHI, YUE_JIANG_NAME, getYueJiang, paiLiuRen } from '../lib/liuren';

const pad = (n: number) => String(n).padStart(2, '0');

function gzIndexOf(gz: string): number {
  const g = GAN.indexOf(gz[0] as any);
  const z = ZHI.indexOf(gz[1] as any);
  for (let i = 0; i < 60; i++) if (i % 10 === g && i % 12 === z) return i;
  return 0;
}

/** 天地盘经典布局：巳午未申 / 辰 酉 / 卯 戌 / 寅丑子亥 */
const PAN_LAYOUT: Array<Array<number | null>> = [
  [5, 6, 7, 8],
  [4, null, null, 9],
  [3, null, null, 10],
  [2, 1, 0, 11],
];

interface Props { now: Date }

export default function LiuRenPage({ now }: Props) {
  const [dateStr, setDateStr] = useState(() =>
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  );
  const [hour, setHour] = useState(now.getHours());
  const [minute, setMinute] = useState(now.getMinutes());

  const result = useMemo(() => {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return null;
    const solar = Solar.fromYmdHms(y, m, d, hour, minute, 0);
    const lunar = solar.getLunar();
    const dayGZ = lunar.getDayInGanZhiExact();
    const timeGZ = lunar.getTimeInGanZhi();

    // 节气时间表（含上年冬至）
    const jqTable = lunar.getJieQiTable();
    const jqTimes = Object.entries(jqTable).map(([name, s]) => {
      const so = s as Solar;
      return { name, time: new Date(so.getYear(), so.getMonth() - 1, so.getDay(), so.getHour(), so.getMinute(), so.getSecond()) };
    });
    const at = new Date(y, m - 1, d, hour, minute);
    const yueJiang = getYueJiang(jqTimes, at);
    const zhanShiZhi = ZHI.indexOf(timeGZ[1] as any);

    const r = paiLiuRen({
      dayGanZhiIndex: gzIndexOf(dayGZ),
      zhanShiZhi,
      yueJiang,
    });
    return { r, dayGZ, timeGZ, lunar, at };
  }, [dateStr, hour, minute]);

  if (!result) return <div className="card">请输入有效日期</div>;
  const { r, dayGZ, timeGZ, lunar } = result;

  return (
    <div>
      <div className="card" style={{ marginBottom: 18 }}>
        <h2>六壬排盘</h2>
        <div className="lr-form">
          <label>占日 <input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} /></label>
          <label>占时 <input type="number" min={0} max={23} value={hour} onChange={(e) => setHour(Number(e.target.value))} style={{ width: 70 }} /> 时</label>
          <label><input type="number" min={0} max={59} value={minute} onChange={(e) => setMinute(Number(e.target.value))} style={{ width: 70 }} /> 分</label>
          <button onClick={() => { const n = new Date(); setDateStr(`${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`); setHour(n.getHours()); setMinute(n.getMinutes()); }}>用当下</button>
        </div>
        <div style={{ fontSize: 14, lineHeight: 2 }}>
          日柱 <b style={{ color: 'var(--cinnabar)' }}>{dayGZ}</b> ｜ 时柱 <b style={{ color: 'var(--cinnabar)' }}>{timeGZ}</b> ｜
          月将 <b style={{ color: 'var(--cinnabar)' }}>{ZHI[r.yueJiang]}（{r.yueJiangName}）</b> ｜
          旬空 <b style={{ color: 'var(--cinnabar)' }}>{r.xunKong.map((z) => ZHI[z]).join('、')}</b> ｜
          {r.isDayGui ? '旦' : '暮'}贵 <b style={{ color: 'var(--cinnabar)' }}>{ZHI[r.guiRen]}</b>
          <span style={{ marginLeft: 16 }} className="keti-badge">{r.keTi}</span>
        </div>
      </div>

      <div className="liuren-layout">
        {/* 天地盘 */}
        <div className="card">
          <h2>天地盘</h2>
          <div className="tiandipan">
            {PAN_LAYOUT.flat().map((earth, i) => {
              if (earth === null) {
                return i === 5 ? (
                  <div key="c" className="pan-cell center">
                    <div className="c-title">大六壬</div>
                    <div className="c-line">{dayGZ}日 {timeGZ}时</div>
                    <div className="c-line">{ZHI[r.yueJiang]}将加{ZHI[r.zhanShi]}时</div>
                    <div className="c-line">{lunar.getYearInGanZhiExact()}年</div>
                  </div>
                ) : null;
              }
              const hv = r.heaven[earth];
              const hl = [r.sanChuan.chu, r.sanChuan.zhong, r.sanChuan.mo].includes(hv);
              return (
                <div key={earth} className={'pan-cell' + (hl ? ' hl' : '')}>
                  <div className="jn">{r.jiangAtEarth[earth]}</div>
                  <div className="hv">{ZHI[hv]}</div>
                  <div className="ev">{ZHI[earth]}</div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-light)', marginTop: 10, textAlign: 'center' }}>
            上：天将 / 中：天盘 / 下：地盘 · 朱框为三传所临
          </div>
        </div>

        <div>
          {/* 三传 */}
          <div className="card" style={{ marginBottom: 18 }}>
            <h2>三传</h2>
            <div className="sanchuan">
              {[
                { lbl: '初传', z: r.sanChuan.chu, j: r.sanChuan.chuJiang, q: r.sanChuan.chuQin, d: r.sanChuan.chuDun },
                { lbl: '中传', z: r.sanChuan.zhong, j: r.sanChuan.zhongJiang, q: r.sanChuan.zhongQin, d: r.sanChuan.zhongDun },
                { lbl: '末传', z: r.sanChuan.mo, j: r.sanChuan.moJiang, q: r.sanChuan.moQin, d: r.sanChuan.moDun },
              ].map((c) => (
                <div className="chuan-item" key={c.lbl}>
                  <div className="c-lbl">{c.lbl}</div>
                  <div className="c-zhi" style={{ color: 'var(--cinnabar)' }}>{c.d === '空亡' ? '○' + ZHI[c.z] : ZHI[c.z]}</div>
                  <div className="c-info">
                    {c.j} · {c.q}<br />遁干：{c.d}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 四课 */}
          <div className="card">
            <h2>四课</h2>
            <table className="sike-table">
              <thead>
                <tr>
                  <th></th><th>第一课（干上）</th><th>第二课</th><th>第三课（支上）</th><th>第四课</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>天将</th>
                  {r.siKe.map((k, i) => <td key={i} style={{ color: 'var(--gold)' }}>{k.jiang}</td>)}
                </tr>
                <tr>
                  <th>上神</th>
                  {r.siKe.map((k, i) => (
                    <td key={i} style={{ fontSize: 20, fontWeight: 700 }}>
                      {ZHI[k.up]}
                      <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 400 }}>{k.qin}</div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th>下神</th>
                  {r.siKe.map((k, i) => (
                    <td key={i}>{k.isGan ? GAN[r.dayGan] + '（寄' + ZHI[k.down] + '）' : ZHI[k.down]}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
