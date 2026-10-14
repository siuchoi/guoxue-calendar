import React, { useState } from 'react';
import { paiQimen, QimenResult } from '../lib/qimen';
import { interpretQimen } from '../lib/interpret';
import DateTimePicker, { formatDT, parseDT } from './DateTimePicker';
import InterpCard from './InterpCard';

const pad = (n: number) => String(n).padStart(2, '0');
const GONG_NAME: Record<number, string> = { 1: '坎一', 2: '坤二', 3: '震三', 4: '巽四', 5: '中五', 6: '乾六', 7: '兑七', 8: '艮八', 9: '离九' };

export default function QimenPage({ now }: { now: Date }) {
  const [dt, setDt] = useState(
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`,
  );
  const [r, setR] = useState<QimenResult | null>(() => paiQimen(new Date()));

  const cast = () => {
    const [d, t] = dt.split('T');
    const [y, m, day] = d.split('-').map(Number);
    const [hh, mm] = t.split(':').map(Number);
    setR(paiQimen(new Date(y, m - 1, day, hh, mm)));
  };

  return (
    <div className="page-stack">
      <div className="card">
        <div className="section-title">时家奇门 · 起局</div>
        <div className="mh-form">
          <DateTimePicker value={parseDT(dt, now)} onChange={(d) => setDt(formatDT(d))} label="时间" />
          <button className="ly-cast-btn" onClick={cast}>排盘</button>
          <span className="mh-hint">拆补法 · 转盘法</span>
        </div>

        {r && (
          <div className="ty-row" style={{ marginTop: 14, marginBottom: 0 }}>
            <span className="ty-chip ti">
              <span className={r.yang ? 'qm-yang' : 'qm-yin'}>{r.yang ? '阳遁' : '阴遁'}</span>
              <b style={{ fontSize: 17 }}>{Math.abs(r.ju)}</b> 局
            </span>
            <span className="ty-chip">旬首 <b>{r.xunShou}</b></span>
            <span className="ty-chip">值符 <b className="qm-hl">{r.zhifu.star}星</b> 落{GONG_NAME[r.zhifu.house]}宫</span>
            <span className="ty-chip dong">值使 <b className="qm-hl">{r.zhishi.door}门</b> 落{GONG_NAME[r.zhishi.house]}宫</span>
          </div>
        )}
      </div>

      {r && (
        <div className="card qm-pan-card">
          <div className="qm-grid">
            {r.layout.map((h) => {
              const c = r.grid[h];
              const isZf = r.zhifu.house === h;
              const isZs = r.zhishi.house === h;
              return (
                <div key={h} className={'qm-cell' + (h === 5 ? ' center' : '') + (isZf ? ' zf' : '') + (isZs ? ' zs' : '')}>
                  <div className="qm-cell-head">
                    <span className="qm-gong">{GONG_NAME[h]}</span>
                    <span className="qm-god">{c.god}</span>
                  </div>
                  {h === 5 ? (
                    <div className="qm-center-body">
                      <span className="qm-dgan big">{c.dgan}</span>
                      <span className="qm-ji">寄坤二宫</span>
                    </div>
                  ) : (
                    <>
                      <div className="qm-star">{c.star}</div>
                      <div className="qm-cell-foot">
                        <span className="qm-door">{c.door}</span>
                        <span className="qm-gans"><b className="qm-tgan">{c.tgan}</b><b className="qm-dgan">{c.dgan}</b></span>
                      </div>
                    </>
                  )}
                  {isZf && <span className="qm-badge zfb">符</span>}
                  {isZs && <span className="qm-badge zsb">使</span>}
                </div>
              );
            })}
          </div>
          <div className="qm-legend">
            <span><i className="qm-dot god" /> 八神（右上）</span>
            <span><i className="qm-dot star" /> 九星（中）</span>
            <span><i className="qm-dot door" /> 八门（左下）</span>
            <span><i className="qm-dot gan" /> 天盘干/地盘干（右下）</span>
          </div>
        </div>
      )}

      {r && (
        <InterpCard interp={interpretQimen(r)} />
      )}
    </div>
  );
}
