/**
 * 八字排盘引擎（移植自 metaphysics-steward/scripts/core/bazi.py，MIT）
 * https://github.com/superzhang21/metaphysics-steward
 *
 * 口径（与对方 23 例临界语料对齐）：
 * - 年/月柱：按输入时间（北京时间）判节气换柱
 * - 日柱：useTrueSolar 时以真太阳时公历日期为准；真太阳时>=23:00 晚子换日
 * - 时柱：真太阳时时辰 + 日干五鼠遁；useTrueSolar=false 全按输入时间
 * - 大运：基于输入时间的节气与性别（lunar-typescript EightChar.getYun）
 */
import { Solar, LunarUtil } from 'lunar-typescript';

export const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

export const GAN_WX: Record<string, string> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
};
export const ZHI_WX: Record<string, string> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火',
  午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水',
};
const GAN_YY: Record<string, number> = {
  甲: 1, 丙: 1, 戊: 1, 庚: 1, 壬: 1, 乙: 0, 丁: 0, 己: 0, 辛: 0, 癸: 0,
};
export const SHENG: Record<string, string> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
export const KE: Record<string, string> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };

export const HIDDEN_GANS: Record<string, string[]> = {
  子: ['癸'], 丑: ['己', '癸', '辛'], 寅: ['甲', '丙', '戊'], 卯: ['乙'],
  辰: ['戊', '乙', '癸'], 巳: ['丙', '庚', '戊'], 午: ['丁', '己'], 未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'], 酉: ['辛'], 戌: ['戊', '辛', '丁'], 亥: ['壬', '甲'],
};

/** 十神：以日干为我求目标天干十神 */
export function getShishen(dayGan: string, targetGan: string): string {
  const w1 = GAN_WX[dayGan], w2 = GAN_WX[targetGan];
  const y1 = GAN_YY[dayGan], y2 = GAN_YY[targetGan];
  if (w1 === w2) return y1 === y2 ? '比肩' : '劫财';
  if (SHENG[w1] === w2) return y1 === y2 ? '食神' : '伤官';
  if (KE[w1] === w2) return y1 === y2 ? '偏财' : '正财';
  if (KE[w2] === w1) return y1 === y2 ? '七杀' : '正官';
  if (SHENG[w2] === w1) return y1 === y2 ? '偏印' : '正印';
  return '';
}

/** 与对方 calendar.py 一致的真太阳时（EoT 简单公式 + 经度修正） */
export function trueSolarDt(dt: Date, lon: number): Date {
  const start = new Date(dt.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((dt.getTime() - start.getTime()) / 86400000);
  const b = (2 * Math.PI * (dayOfYear - 81)) / 365;
  const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
  return new Date(dt.getTime() + (eot + 4 * (lon - 120)) * 60000);
}

function wushuStart(dayGan: string): string {
  return GAN[(GAN.indexOf(dayGan) % 5) * 2];
}
function hourZhiIndex(h: number): number {
  if (h >= 23 || h < 1) return 0;
  return Math.floor((h - 1) / 2 + 1);
}

export interface Pillar {
  gan: string; zhi: string; gz: string;
  shishen: string; nayin: string;
  hidden: { gan: string; shishen: string }[];
}

export interface DaYunItem {
  index: number; pillar: string; startAge: number; startYear: number; endYear: number;
}

export interface BaziResult {
  sex: number; // 1乾 0坤
  pillars: { Year: Pillar; Month: Pillar; Day: Pillar; Hour: Pillar };
  dayBaseDate: string;
  trueSolarText: string;
  yun: { startTime: string; startDesc: string; list: DaYunItem[] };
  rolled: boolean;
}

export function paiBazi(dt: Date, sex: number, lon = 120, useTrueSolar = true): BaziResult {
  const solarBj = Solar.fromYmdHms(dt.getFullYear(), dt.getMonth() + 1, dt.getDate(), dt.getHours(), dt.getMinutes(), dt.getSeconds());
  const lunarBj = solarBj.getLunar();
  const ecBj = lunarBj.getEightChar();

  const ts = useTrueSolar ? trueSolarDt(dt, lon) : dt;

  const yearGz = ecBj.getYear();
  const monthGz = ecBj.getMonth();
  let dayGz: string, hourGz: string;
  let baseDate = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  let rolled = false;

  if (!useTrueSolar) {
    dayGz = ecBj.getDay();
    hourGz = ecBj.getTime();
  } else {
    const tsH = ts.getHours() + ts.getMinutes() / 60 + ts.getSeconds() / 3600;
    baseDate = new Date(ts.getFullYear(), ts.getMonth(), ts.getDate());
    if (tsH >= 23) { baseDate = new Date(baseDate.getTime() + 86400000); rolled = true; }
    dayGz = Solar.fromYmdHms(baseDate.getFullYear(), baseDate.getMonth() + 1, baseDate.getDate(), 12, 0, 0).getLunar().getDayInGanZhi();
    const zi = hourZhiIndex(tsH);
    hourGz = GAN[(GAN.indexOf(wushuStart(dayGz[0])) + zi) % 10] + ZHI[zi];
  }

  const pillarsGz: Record<string, string> = { Year: yearGz, Month: monthGz, Day: dayGz, Hour: hourGz };
  const dayGan = dayGz[0];
  const mk = (key: string, gz: string): Pillar => ({
    gan: gz[0], zhi: gz[1], gz,
    shishen: key === 'Day' ? '日主' : getShishen(dayGan, gz[0]),
    nayin: ((LunarUtil as any).NAYIN[gz] ?? '') as string,
    hidden: HIDDEN_GANS[gz[1]].map((g) => ({ gan: g, shishen: getShishen(dayGan, g) })),
  });
  const pillars = { Year: mk('Year', yearGz), Month: mk('Month', monthGz), Day: mk('Day', dayGz), Hour: mk('Hour', hourGz) } as BaziResult['pillars'];

  // 大运
  const yun = ecBj.getYun(sex);
  const startSolar = yun.getStartSolar();
  const dys = yun.getDaYun();
  const list: DaYunItem[] = [];
  for (let i = 1; i < Math.min(11, dys.length); i++) {
    const dy = dys[i];
    list.push({ index: i, pillar: dy.getGanZhi(), startAge: dy.getStartAge(), startYear: dy.getStartYear(), endYear: dy.getEndYear() });
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    sex,
    pillars,
    dayBaseDate: `${baseDate.getFullYear()}-${pad(baseDate.getMonth() + 1)}-${pad(baseDate.getDate())}`,
    trueSolarText: `${ts.getFullYear()}-${pad(ts.getMonth() + 1)}-${pad(ts.getDate())} ${pad(ts.getHours())}:${pad(ts.getMinutes())}`,
    yun: {
      startTime: startSolar.toYmdHms(),
      startDesc: `${yun.getStartYear()}年${yun.getStartMonth()}个月${yun.getStartDay()}天起运`,
      list,
    },
    rolled,
  };
}
