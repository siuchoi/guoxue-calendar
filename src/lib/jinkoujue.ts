/**
 * 金口诀排盘引擎（移植自 metaphysics-steward/scripts/core/jinkoujue.py，MIT）
 * https://github.com/superzhang21/metaphysics-steward
 *
 * 口径（与对方 130 图实测语料对齐）：
 * - 民用时间起课；>=23:00 晚子换日、占时=子
 * - 月将按「节」换将（小寒子/立春亥/惊蛰戌/清明酉/立夏申/芒种未/小暑午/
 *   立秋巳/白露辰/寒露卯/立冬寅/大雪丑）——与六壬中气换将不同
 * - 人元=五鼠遁(日干)于地分；将神=月将加时天盘(地分位)
 * - 贵神=日干贵支按 g0∈{亥子丑寅卯}顺/否则逆布圈取地分位，贵神支=固定座支表
 * - 日空=旬空；四大空亡：甲子/甲午旬水、甲寅/甲申旬金、甲辰/甲戌旬无
 */
import { Lunar, Solar } from 'lunar-typescript';

const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const GAN_ELEM: Record<string, string> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
};
const ZHI_ELEM: Record<string, string> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火',
  午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水',
};

// 昼夜贵（昼, 夜）
const GUI: Record<string, [string, string]> = {
  甲: ['丑', '未'], 戊: ['丑', '未'], 庚: ['丑', '未'],
  乙: ['子', '申'], 己: ['子', '申'],
  丙: ['亥', '酉'], 丁: ['亥', '酉'],
  壬: ['巳', '卯'], 癸: ['巳', '卯'],
  辛: ['午', '寅'],
};

// 节 -> 月将（金口诀按节换将）
const JIE_JIANG: [string, string][] = [
  ['小寒', '子'], ['立春', '亥'], ['惊蛰', '戌'], ['清明', '酉'],
  ['立夏', '申'], ['芒种', '未'], ['小暑', '午'], ['立秋', '巳'],
  ['白露', '辰'], ['寒露', '卯'], ['立冬', '寅'], ['大雪', '丑'],
];

// 五鼠遁起干：日干 -> 子时天干 index
const WUSHU: Record<string, number> = {
  甲: 0, 己: 0, 乙: 2, 庚: 2, 丙: 4, 辛: 4, 丁: 6, 壬: 6, 戊: 8, 癸: 8,
};

// 十二将名（按支序）
const JIANG = ['神后', '大吉', '功曹', '太冲', '天罡', '太乙', '胜光', '小吉', '传送', '从魁', '河魁', '登明'];

// 贵神序列
const GODS = ['贵人', '腾蛇', '朱雀', '六合', '勾陈', '青龙', '天空', '白虎', '太常', '玄武', '太阴', '天后'];

// 贵神座支（固定表）
const GUI_ZHI_FIX = [1, 5, 6, 3, 4, 2, 10, 8, 7, 0, 9, 11];

function hourZhiIdx(h: number): number {
  if (h >= 23 || h < 1) return 0;
  return Math.floor((h + 1) / 2) % 12;
}

function dun(dayGan: string, zhiIdx: number): string {
  return TIANGAN[(WUSHU[dayGan] + zhiIdx) % 10];
}

function xun(dayGan: string, dayZhi: string): [number, number[]] {
  const head = ((DIZHI.indexOf(dayZhi) - TIANGAN.indexOf(dayGan)) % 12 + 12) % 12;
  return [head, [(head + 10) % 12, (head + 11) % 12]];
}

export interface JinKouJueResult {
  yearGz: string; monthGz: string; dayGan: string; dayZhi: string;
  hourGan: string; hourZhi: string;
  yueJiang: string;
  kong: [string, string];
  bigKong: string;
  difen: string; difenEl: string;
  renyuan: { gan: string; el: string };
  guishen: { gan: string; zhi: string; star: string; el: string; dn: string; gz: string };
  jiangshen: { gan: string; zhi: string; star: string; el: string; gz: string };
  rolled: boolean; // 是否晚子换日
}

/** 金口诀起课：民用时间 + 地分（方位/任意支） */
export function paiJinKouJue(dt: Date, difen: string): JinKouJueResult {
  const h = dt.getHours() + dt.getMinutes() / 60;
  const rolled = h >= 23;
  let base = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  if (rolled) base = new Date(base.getTime() + 86400000);

  // 日柱按换日后的日期
  const lday = Solar.fromYmdHms(base.getFullYear(), base.getMonth() + 1, base.getDate(), 12, 0, 0).getLunar();
  const dayGan = lday.getDayGan();
  const dayZhi = lday.getDayZhi();

  // 年月柱按节气（用原时刻的 lunar）
  const lunar = Solar.fromYmdHms(dt.getFullYear(), dt.getMonth() + 1, dt.getDate(), dt.getHours(), dt.getMinutes(), 0).getLunar();
  const ec = lunar.getEightChar();
  const yearGz = ec.getYear();
  const monthGz = ec.getMonth();

  const hzIdx = hourZhiIdx(h);
  const hourZhi = DIZHI[hzIdx];
  const hourGan = dun(dayGan, hzIdx);

  // 月将：按节换将（getPrevJie 取最近已过的节）
  const prevJie = lunar.getPrevJie();
  const jieName = prevJie.getName();
  const jj = JIE_JIANG.find(([n]) => n === jieName);
  if (!jj) throw new Error('未知节: ' + jieName);
  const yueJiang = jj[1];

  const dfIdx = DIZHI.indexOf(difen);

  // 旬空 + 四大空亡
  const [head, kongIdx] = xun(dayGan, dayZhi);
  const kong: [string, string] = [DIZHI[kongIdx[0]], DIZHI[kongIdx[1]]];
  const bigKong = ({ 0: '水', 6: '水', 2: '金', 8: '金', 4: '无', 10: '无' } as Record<number, string>)[head % 12];

  // 昼夜贵（卯~申时 = 昼）
  const isDay = [3, 4, 5, 6, 7, 8].includes(hzIdx);
  const guiZhi = GUI[dayGan][isDay ? 0 : 1];

  // 人元
  const ry = dun(dayGan, dfIdx);

  // 将神：月将加时，天盘支 = (地分 + 月将 - 占时) mod 12
  const yj = DIZHI.indexOf(yueJiang);
  const jsZhi = ((dfIdx + yj - hzIdx) % 12 + 12) % 12;
  const jsGan = dun(dayGan, jsZhi);

  // 贵神：顺/逆布圈取地分位
  const g0 = DIZHI.indexOf(guiZhi);
  const k = [11, 0, 1, 2, 3].includes(g0)
    ? ((dfIdx - g0) % 12 + 12) % 12
    : ((g0 - dfIdx) % 12 + 12) % 12;
  const gsStar = GODS[k];
  const gsZhiIdx = GUI_ZHI_FIX[k];
  const gsGan = dun(dayGan, gsZhiIdx);

  return {
    yearGz, monthGz, dayGan, dayZhi, hourGan, hourZhi,
    yueJiang, kong, bigKong,
    difen, difenEl: ZHI_ELEM[difen],
    renyuan: { gan: ry, el: GAN_ELEM[ry] },
    guishen: { gan: gsGan, zhi: DIZHI[gsZhiIdx], star: gsStar, el: ZHI_ELEM[DIZHI[gsZhiIdx]], dn: isDay ? '昼贵' : '夜贵', gz: gsGan + DIZHI[gsZhiIdx] },
    jiangshen: { gan: jsGan, zhi: DIZHI[jsZhi], star: JIANG[jsZhi], el: ZHI_ELEM[DIZHI[jsZhi]], gz: jsGan + DIZHI[jsZhi] },
    rolled,
  };
}
