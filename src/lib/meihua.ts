/**
 * 梅花易数引擎
 * 时间起卦 / 数字起卦 → 本卦 · 互卦 · 变卦 · 体用生克
 * 口径参考 metaphysics-steward（MIT）：先天八卦数起卦，动爻取余。
 */

export interface BaGua {
  name: string;   // 乾
  symbol: string; // ☰
  wuxing: '金' | '木' | '水' | '火' | '土';
  nature: string; // 天/泽/火/雷/风/水/山/地
}

/** 先天八卦数 1-8 */
export const BAGUA: BaGua[] = [
  { name: '乾', symbol: '☰', wuxing: '金', nature: '天' }, // 1
  { name: '兑', symbol: '☱', wuxing: '金', nature: '泽' }, // 2
  { name: '离', symbol: '☲', wuxing: '火', nature: '火' }, // 3
  { name: '震', symbol: '☳', wuxing: '木', nature: '雷' }, // 4
  { name: '巽', symbol: '☴', wuxing: '木', nature: '风' }, // 5
  { name: '坎', symbol: '☵', wuxing: '水', nature: '水' }, // 6
  { name: '艮', symbol: '☶', wuxing: '土', nature: '山' }, // 7
  { name: '坤', symbol: '☷', wuxing: '土', nature: '地' }, // 8
];

/** 卦数 → 爻位（上,中,下），1 阳 0 阴 */
const BITS: Record<number, [number, number, number]> = {
  1: [1, 1, 1], 2: [0, 1, 1], 3: [1, 0, 1], 4: [0, 0, 1],
  5: [1, 1, 0], 6: [0, 1, 0], 7: [1, 0, 0], 8: [0, 0, 0],
};
const BITS_REV: Record<string, number> = Object.fromEntries(
  Object.entries(BITS).map(([k, v]) => [v.join(','), Number(k)])
);

/** 64 卦名：key = 上卦数*10+下卦数（转自 metaphysics-steward，MIT） */
const GUA_64: Record<number, string> = {
  11: '乾为天', 15: '天风姤', 17: '天山遁', 18: '天地否', 58: '风地观', 78: '山地剥', 38: '火地晋', 31: '火天大有',
  22: '兑为泽', 26: '泽水困', 28: '泽地萃', 27: '泽山咸', 67: '水山蹇', 87: '地山谦', 47: '雷山小过', 42: '雷泽归妹',
  33: '离为火', 37: '火山旅', 35: '火风鼎', 36: '火水未济', 76: '山水蒙', 56: '风水涣', 16: '天水讼', 13: '天火同人',
  44: '震为雷', 48: '雷地豫', 46: '雷水解', 45: '雷风恒', 85: '地风升', 65: '水风井', 25: '泽风大过', 24: '泽雷随',
  55: '巽为风', 51: '风天小畜', 53: '风火家人', 54: '风雷益', 14: '天雷无妄', 34: '火雷噬嗑', 74: '山雷颐', 75: '山风蛊',
  66: '坎为水', 62: '水泽节', 64: '水雷屯', 63: '水火既济', 23: '泽火革', 43: '雷火丰', 83: '地火明夷', 86: '地水师',
  77: '艮为山', 73: '山火贲', 71: '山天大畜', 72: '山泽损', 32: '火泽睽', 12: '天泽履', 52: '风泽中孚', 57: '风山渐',
  88: '坤为地', 84: '地雷复', 82: '地泽临', 81: '地天泰', 41: '雷天大壮', 21: '泽天夬', 61: '水天需', 68: '水地比',
};

export const guaName = (upper: number, lower: number): string =>
  GUA_64[upper * 10 + lower] ?? `${BAGUA[upper - 1].name}${BAGUA[lower - 1].name}`;

export interface GuaInfo {
  upper: number; lower: number;
  name: string;
  /** 六爻，初爻在前（index 0 = 初爻），1 阳 0 阴 */
  lines: number[];
}

export interface MeiHuaResult {
  ben: GuaInfo;      // 本卦
  hu: GuaInfo;       // 互卦
  bian: GuaInfo;     // 变卦
  dongYao: number;   // 动爻 1-6
  tiPos: '上' | '下';
  tiGua: BaGua;      // 体卦
  yongGua: BaGua;    // 用卦
  relation: string;  // 体用关系断语
  relationShort: string; // 体克用/用生体…
}

const SHENG: Record<string, string> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const KE: Record<string, string> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };

function buildGua(upper: number, lower: number): GuaInfo {
  const [ut, um, ub] = BITS[upper];
  const [lt, lm, lb] = BITS[lower];
  return { upper, lower, name: guaName(upper, lower), lines: [lb, lm, lt, ub, um, ut] };
}

export function analyzeMeiHua(upperNum: number, lowerNum: number, dongYao: number): MeiHuaResult {
  const ben = buildGua(upperNum, lowerNum);
  // 互卦：二三四爻为下互，三四五爻为上互
  const l = ben.lines;
  const huLower = BITS_REV[[l[3], l[2], l[1]].join(',')];
  const huUpper = BITS_REV[[l[4], l[3], l[2]].join(',')];
  const hu = buildGua(huUpper, huLower);
  // 变卦：动爻翻转
  const bl = [...l];
  bl[dongYao - 1] = 1 - bl[dongYao - 1];
  const bianLower = BITS_REV[[bl[2], bl[1], bl[0]].join(',')];
  const bianUpper = BITS_REV[[bl[5], bl[4], bl[3]].join(',')];
  const bian = buildGua(bianUpper, bianLower);

  // 体用：动爻在下卦 → 上卦为体；动爻在上卦 → 下卦为体
  const tiNum = dongYao <= 3 ? upperNum : lowerNum;
  const yongNum = dongYao <= 3 ? lowerNum : upperNum;
  const tiGua = BAGUA[tiNum - 1];
  const yongGua = BAGUA[yongNum - 1];

  let relationShort: string;
  let relation: string;
  if (tiGua.wuxing === yongGua.wuxing) {
    relationShort = '比和';
    relation = '体用比和——同心协力，诸事顺遂。';
  } else if (KE[tiGua.wuxing] === yongGua.wuxing) {
    relationShort = '体克用';
    relation = '体克用——我强敌弱，事虽可成，需费心力。';
  } else if (KE[yongGua.wuxing] === tiGua.wuxing) {
    relationShort = '用克体';
    relation = '用克体——彼强我弱，事宜守不宜进，防有损耗。';
  } else if (SHENG[tiGua.wuxing] === yongGua.wuxing) {
    relationShort = '体生用';
    relation = '体生用——我泄于彼，费力耗神，宜量入为出。';
  } else {
    relationShort = '用生体';
    relation = '用生体——彼来助我，顺遂有得，可积极进取。';
  }

  return {
    ben, hu, bian, dongYao,
    tiPos: dongYao <= 3 ? '上' : '下',
    tiGua, yongGua, relation, relationShort,
  };
}

/** 数字起卦：三数（上卦数、下卦数、动爻数） */
export function qiGuaByNumbers(n1: number, n2: number, n3: number): MeiHuaResult {
  const upper = ((n1 - 1) % 8 + 8) % 8 + 1;
  const lower = ((n2 - 1) % 8 + 8) % 8 + 1;
  const dong = ((n3 - 1) % 6 + 6) % 6 + 1;
  return analyzeMeiHua(upper, lower, dong);
}

/** 时间起卦：年支序(子=1…)、农历月、农历日、时支序(子=1…) */
export function qiGuaByTime(yearZhi: number, lunarMonth: number, lunarDay: number, hourZhi: number): MeiHuaResult {
  const y = yearZhi + 1, h = hourZhi + 1;
  const m = Math.abs(lunarMonth), d = lunarDay;
  const upper = (y + m + d) % 8 || 8;
  const lower = (y + m + d + h) % 8 || 8;
  const dong = (y + m + d + h) % 6 || 6;
  return analyzeMeiHua(upper, lower, dong);
}
