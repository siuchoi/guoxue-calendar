/**
 * 紫微斗数排盘引擎（移植自 metaphysics-steward/scripts/core/ziwei.py，MIT）
 * https://github.com/superzhang21/metaphysics-steward
 *
 * 口径（与对方 12 组黄金案例 + 五局149点全表对齐）：
 * - 农历（真太阳时）为准：年干支按正月初一换年；时支取真太阳时时辰
 * - 真太阳时 >= 23:00 晚子换日（农历日+1，时按子）
 * - 命宫支 = (2 + 农历月 - 时辰序) % 12；身宫支 = (农历月 + 时辰序) % 12
 * - 五行局 = 命宫干支纳音五行；紫微定位用五局基准序列
 */
import { Solar, LunarUtil } from 'lunar-typescript';

const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

export const PALACE_NAMES = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '交友', '官禄', '田宅', '福德', '父母'];
const JU_NAMES: Record<number, string> = { 2: '水二局', 3: '木三局', 4: '金四局', 5: '土五局', 6: '火六局' };
const NAYIN_TO_JU: Record<string, number> = { 金: 4, 木: 3, 水: 2, 火: 6, 土: 5 };
// 紫微定位基准序列（火六局初一组 = 酉午亥辰丑寅），各局取尾部 j 个
const ZIWEI_BASE = [9, 6, 11, 4, 1, 2];

const MINGZHU: Record<string, string> = {
  子: '贪狼', 丑: '巨门', 寅: '禄存', 卯: '文曲', 辰: '廉贞', 巳: '武曲',
  午: '破军', 未: '武曲', 申: '廉贞', 酉: '文曲', 戌: '禄存', 亥: '巨门',
};
const SHENZHU: Record<string, string> = {
  子: '火星', 丑: '天相', 寅: '天梁', 卯: '天同', 辰: '文昌', 巳: '天机',
  午: '火星', 未: '天相', 申: '天梁', 酉: '天同', 戌: '文昌', 亥: '天机',
};
// 年干四化（禄权科忌）
const SIHUA: Record<string, string[]> = {
  甲: ['廉贞', '破军', '武曲', '太阳'], 乙: ['天机', '天梁', '紫微', '太阴'],
  丙: ['天同', '天机', '文昌', '廉贞'], 丁: ['太阴', '天同', '天机', '巨门'],
  戊: ['贪狼', '太阴', '右弼', '天机'], 己: ['武曲', '贪狼', '天梁', '文曲'],
  庚: ['太阳', '武曲', '太阴', '天同'], 辛: ['巨门', '太阳', '文曲', '文昌'],
  壬: ['天梁', '紫微', '左辅', '武曲'], 癸: ['破军', '巨门', '太阴', '贪狼'],
};

/** 与对方 calendar.py 一致的真太阳时（EoT 简单公式 + 经度修正） */
function trueSolar(dt: Date, lon: number): Date {
  const start = new Date(dt.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((dt.getTime() - start.getTime()) / 86400000);
  const b = (2 * Math.PI * (dayOfYear - 81)) / 365;
  const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
  return new Date(dt.getTime() + (eot + 4 * (lon - 120)) * 60000);
}

function wuhuStart(yearGan: string): number {
  return (TIANGAN.indexOf(yearGan) % 5) * 2 + 2;
}

function nayinJu(gz: string): number {
  const n = (LunarUtil as any).NAYIN[gz] ?? '';
  for (const el of Object.keys(NAYIN_TO_JU)) if (n.includes(el)) return NAYIN_TO_JU[el];
  return 2;
}

function ziweiIdx(ju: number, day: number): number {
  const base = ZIWEI_BASE.slice(-ju);
  return (base[(day - 1) % ju] + Math.floor((day - 1) / ju)) % 12;
}

export interface ZiweiResult {
  minggong: string;       // 命宫支
  minggongGz: string;     // 命宫干支
  shengong: string;       // 身宫支
  ju: string; juNum: number;
  mingzhu: string; shenzhu: string;
  stars: Record<string, string>;           // 星名 -> 宫支
  palaces: Record<string, string>;         // 宫名 -> 宫支
  palaceGanzhi: Record<string, string>;    // 宫支 -> 干支
  sihua: { star: string; hua: string }[];
  lunarText: string;
  yearGan: string; yearZhi: string;
  rolled: boolean;
}

export function paiZiwei(dt: Date, lon = 120): ZiweiResult {
  const ts = trueSolar(dt, lon);
  // 农历全程以真太阳时为基准；晚子（真太阳时>=23:00）换日，时按子时
  let rolled = false;
  let tsDate = ts;
  if (ts.getHours() >= 23) {
    rolled = true;
    tsDate = new Date(ts.getTime() + 86400000);
  }
  const lunar = Solar.fromYmdHms(
    tsDate.getFullYear(), tsDate.getMonth() + 1, tsDate.getDate(),
    rolled ? 0 : tsDate.getHours(), rolled ? 30 : tsDate.getMinutes(), 0,
  ).getLunar();

  const month = Math.abs(lunar.getMonth());
  const day = lunar.getDay();
  // 时支序（子=1…亥=12），晚子按子时
  const hourIdx = rolled ? 1 : lunar.getTimeZhiIndex() + 1;
  const yearGan = lunar.getYearGan();
  const yearZhi = lunar.getYearZhi();

  const mingIdx = (((2 + month - hourIdx) % 12) + 12) % 12;
  const shenIdx = (month + hourIdx) % 12;
  const mingGan = TIANGAN[(((wuhuStart(yearGan) + ((mingIdx - 2) % 12 + 12) % 12) % 10) + 10) % 10];
  const mingGz = mingGan + DIZHI[mingIdx];
  const ju = nayinJu(mingGz);

  // 十四主星
  const z = ziweiIdx(ju, day);
  const stars: Record<string, string> = {
    紫微: DIZHI[z],
    天机: DIZHI[(((z - 1) % 12) + 12) % 12],
    太阳: DIZHI[(((z - 3) % 12) + 12) % 12],
    武曲: DIZHI[(((z - 4) % 12) + 12) % 12],
    天同: DIZHI[(((z - 5) % 12) + 12) % 12],
    廉贞: DIZHI[(((z - 8) % 12) + 12) % 12],
  };
  const t = (((4 - z) % 12) + 12) % 12;
  stars['天府'] = DIZHI[t];
  ([['太阴', 1], ['贪狼', 2], ['巨门', 3], ['天相', 4], ['天梁', 5], ['七杀', 6], ['破军', 10]] as [string, number][])
    .forEach(([name, off]) => { stars[name] = DIZHI[(t + off) % 12]; });

  // 十二宫（自命宫逆布）
  const palaces: Record<string, string> = {};
  PALACE_NAMES.forEach((name, i) => {
    palaces[name] = DIZHI[(((mingIdx - i) % 12) + 12) % 12];
  });

  // 各宫干支（五虎遁顺推）
  const palaceGanzhi: Record<string, string> = {};
  for (const zhi of DIZHI) {
    const zi = DIZHI.indexOf(zhi);
    const gan = TIANGAN[(((wuhuStart(yearGan) + ((zi - 2) % 12 + 12) % 12) % 10) + 10) % 10];
    palaceGanzhi[zhi] = gan + zhi;
  }

  const sihua = (SIHUA[yearGan] ?? ['', '', '', '']).map((s, i) => ({ star: s, hua: ['禄', '权', '科', '忌'][i] }));

  return {
    minggong: DIZHI[mingIdx], minggongGz: mingGz,
    shengong: DIZHI[shenIdx],
    ju: JU_NAMES[ju], juNum: ju,
    mingzhu: MINGZHU[DIZHI[mingIdx]], shenzhu: SHENZHU[yearZhi],
    stars, palaces, palaceGanzhi, sihua,
    lunarText: `${yearGan}${yearZhi}年 ${month}月${day}日`,
    yearGan, yearZhi, rolled,
  };
}
