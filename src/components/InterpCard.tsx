import React from 'react';
import type { Interp } from '../lib/interpret';

/**
 * 白话解读卡：将排盘结果翻译成人话。
 * 每行一个小标题 + 一段白话，tone 决定左侧色条（好/坏/中性）。
 */
export default function InterpCard({ interp }: { interp: Interp }) {
  return (
    <div className="card interp-card">
      <div className="section-title">{interp.title}</div>
      <div className="interp-lines">
        {interp.lines.map((ln, i) => (
          <div key={i} className={'interp-line ' + ln.tone}>
            <span className="interp-k">{ln.k}</span>
            <span className="interp-v">{ln.v}</span>
          </div>
        ))}
      </div>
      <div className="mh-hint" style={{ marginTop: 10 }}>以上为传统术数规则的白话转述，仅供文化参考，不作现实决策依据。</div>
    </div>
  );
}