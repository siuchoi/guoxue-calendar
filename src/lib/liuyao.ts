/**
 * 六爻纳甲排盘引擎（移植自 metaphysics-steward/scripts/core/liuyao.py，MIT）
 * https://github.com/superzhang21/metaphysics-steward
 *
 * 爻值：6=老阴(动) 7=少阳 8=少阴 9=老阳(动)
 * 装卦：定卦名、定宫、安世应、纳甲、配六亲、装六神
 * 口径与对方黄金案例对齐（变卦六亲按主卦宫五行安）
 */

// ── 基础表 ──
export const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const GAN_WX: Record<string, string> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
};
const ZHI_WX: Record<string, string> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火',
  午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水',
};
const SHENG: Record<string, string> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const KE: Record<string, string> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };

export const BAGUA_NAME = ['', '乾', '兑', '离', '震', '巽', '坎', '艮', '坤'];
export const GUA_SYM = ['', '☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'];
const GUA_WUXING: Record<string, string> = { 乾: '金', 兑: '金', 离: '火', 震: '木', 巽: '木', 坎: '水', 艮: '土', 坤: '土' };

// 先天数 -> (初,二,三)爻阳值（1 阳 0 阴）
const XIAN_BITS: Record<number, [number, number, number]> = {
  1: [1, 1, 1], 2: [1, 1, 0], 3: [1, 0, 1], 4: [1, 0, 0],
  5: [0, 1, 1], 6: [0, 1, 0], 7: [0, 0, 1], 8: [0, 0, 0],
};
const BITS_TO_NUM: Record<string, number> = {};
Object.entries(XIAN_BITS).forEach(([k, v]) => { BITS_TO_NUM[v.join(',')] = Number(k); });

// 64 卦信息表：key = 上卦数*10+下卦数 -> [卦名, 宫, 世爻位]
const GUA_64_INFO: Record<number, [string, string, number]> = {
  11: ['乾为天', '乾', 6], 15: ['天风姤', '乾', 1], 17: ['天山遁', '乾', 2],
  18: ['天地否', '乾', 3], 58: ['风地观', '乾', 4], 78: ['山地剥', '乾', 5],
  38: ['火地晋', '乾', 4], 31: ['火天大有', '乾', 3],
  22: ['兑为泽', '兑', 6], 26: ['泽水困', '兑', 1], 28: ['泽地萃', '兑', 2],
  27: ['泽山咸', '兑', 3], 67: ['水山蹇', '兑', 4], 87: ['地山谦', '兑', 5],
  47: ['雷山小过', '兑', 4], 42: ['雷泽归妹', '兑', 3],
  33: ['离为火', '离', 6], 37: ['火山旅', '离', 1], 35: ['火风鼎', '离', 2],
  36: ['火水未济', '离', 3], 76: ['山水蒙', '离', 4], 56: ['风水涣', '离', 5],
  16: ['天水讼', '离', 4], 13: ['天火同人', '离', 3],
  44: ['震为雷', '震', 6], 48: ['雷地豫', '震', 1], 46: ['雷水解', '震', 2],
  45: ['雷风恒', '震', 3], 85: ['地风升', '震', 4], 65: ['水风井', '震', 5],
  25: ['泽风大过', '震', 4], 24: ['泽雷随', '震', 3],
  55: ['巽为风', '巽', 6], 51: ['风天小畜', '巽', 1], 53: ['风火家人', '巽', 2],
  54: ['风雷益', '巽', 3], 14: ['天雷无妄', '巽', 4], 34: ['火雷噬嗑', '巽', 5],
  74: ['山雷颐', '巽', 4], 75: ['山风蛊', '巽', 3],
  66: ['坎为水', '坎', 6], 62: ['水泽节', '坎', 1], 64: ['水雷屯', '坎', 2],
  63: ['水火既济', '坎', 3], 23: ['泽火革', '坎', 4], 43: ['雷火丰', '坎', 5],
  83: ['地火明夷', '坎', 4], 86: ['地水师', '坎', 3],
  77: ['艮为山', '艮', 6], 73: ['山火贲', '艮', 1], 71: ['山天大畜', '艮', 2],
  72: ['山泽损', '艮', 3], 32: ['火泽睽', '艮', 4], 12: ['天泽履', '艮', 5],
  52: ['风泽中孚', '艮', 4], 57: ['风山渐', '艮', 3],
  88: ['坤为地', '坤', 6], 84: ['地雷复', '坤', 1], 82: ['地泽临', '坤', 2],
  81: ['地天泰', '坤', 3], 41: ['雷天大壮', '坤', 4], 21: ['泽天夬', '坤', 5],
  61: ['水天需', '坤', 4], 68: ['水地比', '坤', 3],
};

// 六神与起例（日干）
export const LIU_SHEN = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'];
const LIU_SHEN_START: Record<string, number> = {
  甲: 0, 乙: 0, 丙: 1, 丁: 1, 戊: 2, 己: 3, 庚: 4, 辛: 4, 壬: 5, 癸: 5,
};

// 纳甲表：八纯卦六爻（初→上）
const NAJIA: Record<string, string[]> = {
  乾: ['甲子', '甲寅', '甲辰', '壬午', '壬申', '壬戌'],
  坤: ['乙未', '乙巳', '乙卯', '癸丑', '癸亥', '癸酉'],
  震: ['庚子', '庚寅', '庚辰', '庚午', '庚申', '庚戌'],
  巽: ['辛丑', '辛亥', '辛酉', '辛未', '辛巳', '辛卯'],
  坎: ['戊寅', '戊辰', '戊午', '戊申', '戊戌', '戊子'],
  离: ['己卯', '己丑', '己亥', '己酉', '己未', '己巳'],
  艮: ['丙辰', '丙午', '丙申', '丙戌', '丙子', '丙寅'],
  兑: ['丁巳', '丁卯', '丁丑', '丁亥', '丁酉', '丁未'],
};

// 用神提示
export const YONG_SHEN_HINT: Record<string, string> = {
  妻财: '求财/交易/妻事/失物(财物)',
  官鬼: '事业/官非/疾病/盗贼/夫星',
  父母: '文书/房产/长辈/车辆/房屋',
  子孙: '子女/福神/解忧/医药/平安',
  兄弟: '朋友/同事/竞争/破财/同辈',
};

// ── 起卦 ──
/** 铜钱背数(0-3) -> 爻值：三背9 两背8 一背7 零背6 */
export function coinToValue(backs: number): number {
  return [6, 7, 8, 9][backs];
}

/** 三数起卦（梅花式） */
export function linesFromNumbers(n1: number, n2: number, n3: number): number[] {
  const upper = ((n1 - 1) % 8 + 8) % 8 + 1;
  const lower = ((n2 - 1) % 8 + 8) % 8 + 1;
  const moving = ((n3 - 1) % 6 + 6) % 6 + 1;
  return linesFromTrigrams(upper, lower, moving);
}

/** 时间起卦：农历年月日时（年支序+月+日 → 上卦；+时支序 → 下卦；总和 → 动爻） */
export function linesFromTime(yearZhiIdx: number, month: number, day: number, timeZhiIdx: number): number[] {
  const s = yearZhiIdx + month + day;
  let upper = s % 8; if (upper === 0) upper = 8;
  let lower = (s + timeZhiIdx) % 8; if (lower === 0) lower = 8;
  let moving = (s + timeZhiIdx) % 6; if (moving === 0) moving = 6;
  return linesFromTrigrams(upper, lower, moving);
}

function linesFromTrigrams(upper: number, lower: number, moving: number): number[] {
  const yangs = [...XIAN_BITS[lower], ...XIAN_BITS[upper]];
  return yangs.map((y, i) => (i + 1 === moving ? (y === 0 ? 6 : 9) : y === 1 ? 7 : 8));
}

// ── 排盘 ──
export interface GuaInfo {
  name: string;
  gong: string;
  gongWuxing: string;
  shi: number; // 世爻位 1-6
  ying: number;
  najia: string[];   // 初→上
  liuqin: string[];  // 初→上
  upperNum: number;
  lowerNum: number;
  yangs: number[];   // 初→上 1阳0阴
}

export interface LiuYaoResult {
  method: string;
  lineValues: number[];   // 初→上
  yangs: number[];        // 初→上 1阳0阴
  moving: number[];       // 动爻位（1-6）
  ben: GuaInfo;
  bian: GuaInfo | null;
  liushen: string[];      // 初→上
  dayGan: string;
  dayZhi: string;
  monthZhi: string;
}

function toTrigramNums(yangs: number[]): [number, number] {
  const lower = BITS_TO_NUM[yangs.slice(0, 3).join(',')];
  const upper = BITS_TO_NUM[yangs.slice(3, 6).join(',')];
  return [upper, lower];
}

function najiaFor(yangs: number[]): string[] {
  const [u, l] = toTrigramNums(yangs);
  return [...NAJIA[BAGUA_NAME[l]].slice(0, 3), ...NAJIA[BAGUA_NAME[u]].slice(3, 6)];
}

function liuqinFor(gongWuxing: string, naList: string[]): string[] {
  return naList.map((gz) => {
    const zhiWx = ZHI_WX[gz[1]];
    if (zhiWx === gongWuxing) return '兄弟';
    if (SHENG[gongWuxing] === zhiWx) return '子孙';
    if (SHENG[zhiWx] === gongWuxing) return '父母';
    if (KE[gongWuxing] === zhiWx) return '妻财';
    return '官鬼';
  });
}

function guaInfo(yangs: number[], gongWuxingForLiuqin?: string): GuaInfo {
  const [u, l] = toTrigramNums(yangs);
  const [name, gong, shi] = GUA_64_INFO[u * 10 + l];
  const najia = najiaFor(yangs);
  const gongWx = GUA_WUXING[gong];
  return {
    name, gong, gongWuxing: gongWx,
    shi, ying: ((shi + 2) % 6) + 1,
    najia,
    liuqin: liuqinFor(gongWuxingForLiuqin ?? gongWx, najia),
    upperNum: u, lowerNum: l,
    yangs: [...yangs],
  };
}

/** 主排盘入口：六爻值 + 日干（六神用）+ 日辰月建（显示用） */
export function paiLiuYao(
  lineValues: number[],
  opts: { method?: string; dayGan?: string; dayZhi?: string; monthZhi?: string } = {},
): LiuYaoResult {
  const yangs = lineValues.map((v) => (v === 7 || v === 9 ? 1 : 0));
  const moving = lineValues.map((v, i) => (v === 6 || v === 9 ? i + 1 : 0)).filter(Boolean);

  const ben = guaInfo(yangs);
  let bian: GuaInfo | null = null;
  if (moving.length > 0) {
    const cy: number[] = [...yangs];
    moving.forEach((m) => { cy[m - 1] = 1 - cy[m - 1]; });
    // 变卦六亲仍按主卦宫五行安（与对方口径一致）
    bian = guaInfo(cy, ben.gongWuxing);
  }

  const dayGan = opts.dayGan ?? '甲';
  const start = LIU_SHEN_START[dayGan] ?? 0;
  const liushen = Array.from({ length: 6 }, (_, i) => LIU_SHEN[(start + i) % 6]);

  return {
    method: opts.method ?? '手工指定',
    lineValues,
    yangs,
    moving,
    ben,
    bian,
    liushen,
    dayGan,
    dayZhi: opts.dayZhi ?? '',
    monthZhi: opts.monthZhi ?? '',
  };
}
