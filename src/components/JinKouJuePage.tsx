import React, { useState } from 'react';
import { paiJinKouJue, JinKouJueResult } from '../lib/jinkoujue';

const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const DIFEN_DIR: Record<string, string> = {
  子: '正北', 丑: '东北偏北', 寅: '东北偏东', 卯: '正东', 辰: '东南偏东', 巳: '东南偏南',
  午: '正南', 未: '西南偏南', 申: '西南偏西', 酉: '正西', 戌: '西北偏西', 亥: '西北偏北',
};
const EL_CLASS: Record<string, string> = { 木: 'el-mu', 火: 'el-huo', 土: 'el-tu', 金: 'el-jin', 水: 'el-shui' };

const pad = (n: number) => String(n).padStart(2, '0');

export default function JinKouJuePage({ now }: { now: Date }) {
  const [dt, setDt] = useState(
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`,
  );
  const [difen, setDifen] = useState('午');
  const [r, setR] = useState<JinKouJueResult | null>(() => paiJinKouJue(new Date(), '午'));

  const cast = () => {
    const [d, t] = dt.split('T');
    const [y, m, day] = d.split('-').map(Number);
    const [hh, mm] = t.split(':').map(Number);
    setR(paiJinKouJue(new Date(y, m - 1, day, hh, mm), difen));
  };

  const layers = r
    ? [
        { label: '人元', main: r.renyuan.gan, sub: '', el: r.renyuan.el, tag: '' },
        { label: '贵神', main: r.guishen.gz, sub: r.guishen.star, el: r.guishen.el, tag: r.guishen.dn },
        { label: '将神', main: r.jiangshen.gz, sub: r.jiangshen.star, el: r.jiangshen.el, tag: '' },
        { label: '地分', main: r.difen, sub: DIFEN_DIR[r.difen], el: r.difenEl, tag: '' },
      ]
    : [];

  return (
    <div className="jkj-layout">
      <div className="card">
        <div className="section-title">起课</div>
        <div className="mh-form">
          <label>时间 <input type="datetime-local" value={dt} onChange={(e) => setDt(e.target.value)} /></label>
          <label>地分
            <select value={difen} onChange={(e) => setDifen(e.target.value)} className="jkj-select">
              {DIZHI.map((z) => (
                <option key={z} value={z}>{z}（{DIFEN_DIR[z]}）</option>
              ))}
            </select>
          </label>
          <button className="ly-cast-btn" onClick={cast}>起课</button>
        </div>
        <div className="mh-hint" style={{ marginTop: 10 }}>
          地分取占问方位或来人方位；民用时间起课，23 点后自动晚子换日
        </div>

        {r && (
          <>
            <div className="section-title">课元信息</div>
            <div className="jkj-meta">
              <div>{r.yearGz}年 {r.monthGz}月 {r.dayGan}{r.dayZhi}日 {r.hourGan}{r.hourZhi}时{r.rolled && <em className="jkj-roll">（晚子时已换日）</em>}</div>
              <div>月将 <b>{r.yueJiang}</b>（{r.yueJiang && JIANG_FULL[r.yueJiang]}） · 日空 <b className="jkj-kong">{r.kong[0]}{r.kong[1]}</b> · 四大空亡 <b className="jkj-kong">{r.bigKong}</b></div>
            </div>
          </>
        )}
      </div>

      {r && (
        <div className="card jkj-pan">
          <div className="section-title">四位课式</div>
          <div className="jkj-layers">
            {layers.map((l, i) => (
              <React.Fragment key={l.label}>
                <div className="jkj-layer">
                  <span className="jkj-layer-label">{l.label}</span>
                  <span className={`jkj-layer-main ${EL_CLASS[l.el]}`}>{l.main}</span>
                  {l.sub && <span className="jkj-layer-sub">{l.sub}</span>}
                  <span className="jkj-layer-el">{l.el}{l.tag && ` · ${l.tag}`}</span>
                </div>
                {i < 3 && <div className="jkj-connector" />}
              </React.Fragment>
            ))}
          </div>
          <div className="jkj-summary">
            课式：{r.difen}方问事，人元{r.renyuan.gan}（{r.renyuan.el}），贵神{r.guishen.star}（{r.guishen.gz}），将神{r.jiangshen.star}（{r.jiangshen.gz}）。
          </div>
        </div>
      )}
    </div>
  );
}

const JIANG_FULL: Record<string, string> = {
  子: '神后', 丑: '大吉', 寅: '功曹', 卯: '太冲', 辰: '天罡', 巳: '太乙',
  午: '胜光', 未: '小吉', 申: '传送', 酉: '从魁', 戌: '河魁', 亥: '登明',
};
