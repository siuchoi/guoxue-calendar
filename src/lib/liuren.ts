/**
 * 大六壬排盘引擎
 * 实现：月将加时 → 天地盘 → 四课 → 三传（九宗门）→ 十二天将 → 旬遁干/空亡 → 六亲
 * 参考《大六壬指南》《课经》通行规则。
 */

export const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
export const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

export type WuXing = '木' | '火' | '土' | '金' | '水';

export const GAN_WUXING: WuXing[] = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水'];
export const ZHI_WUXING: WuXing[] = ['水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水'];

// 五行相克：a 克 b ?
const KE_MAP: Record<WuXing, WuXing> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
export const wuxingKe = (a: WuXing, b: WuXing) => KE_MAP[a] === b;
// 五行相生：a 生 b ?
const SHENG_MAP: Record<WuXing, WuXing> = { 木: '火', 火: '土', '土': '金', 金: '水', 水: '木' };
export const wuxingSheng = (a: WuXing, b: WuXing) => SHENG_MAP[a] === b;

export const isYangGan = (gan: number) => gan % 2 === 0;
export const isYangZhi = (zhi: number) => zhi % 2 === 0;

/** 干寄宫：甲寄寅 乙寄辰 丙戊寄巳 丁己寄未 庚寄申 辛寄戌 壬寄亥 癸寄丑 */
export const GAN_JI_GONG: number[] = [2, 4, 5, 7, 5, 7, 8, 10, 11, 1];

/** 月将名称（按将支索引） */
export const YUE_JIANG_NAME = ['神后', '大吉', '功曹', '太冲', '天罡', '太乙', '胜光', '小吉', '传送', '从魁', '河魁', '登明'];

/** 中气 → 月将：中气过后用该将 */
const ZHONG_QI_TO_JIANG: Array<[string, number]> = [
  ['雨水', 11], // 亥将 登明
  ['春分', 10], // 戌将 河魁
  ['谷雨', 9],  // 酉将 从魁
  ['小满', 8],  // 申将 传送
  ['夏至', 7],  // 未将 小吉
  ['大暑', 6],  // 午将 胜光
  ['处暑', 5],  // 巳将 太乙
  ['秋分', 4],  // 辰将 天罡
  ['霜降', 3],  // 卯将 太冲
  ['小雪', 2],  // 寅将 功曹
  ['冬至', 1],  // 丑将 大吉
  ['大寒', 0],  // 子将 神后
];

export const TIAN_JIANG = ['贵人', '螣蛇', '朱雀', '六合', '勾陈', '青龙', '天空', '白虎', '太常', '玄武', '太阴', '天后'] as const;

/** 昼夜贵人表 [gan][昼, 夜] */
const GUI_REN: Array<[number, number]> = [
  [1, 7],   // 甲: 昼丑 夜未
  [0, 8],   // 乙: 昼子 夜申
  [11, 9],  // 丙: 昼亥 夜酉
  [11, 9],  // 丁: 昼亥 夜酉
  [1, 7],   // 戊: 昼丑 夜未
  [0, 8],   // 己: 昼子 夜申
  [1, 7],   // 庚: 昼丑 夜未
  [6, 2],   // 辛: 昼午 夜寅
  [5, 3],   // 壬: 昼巳 夜卯
  [5, 3],   // 癸: 昼巳 夜卯
];

/** 地支相刑链：刑[a] = b 表示 a 刑 b */
const XING: number[] = (() => {
  const m = new Array(12).fill(-1);
  m[0] = 3; m[3] = 0;             // 子卯相刑
  m[2] = 5; m[5] = 8; m[8] = 2;   // 寅巳申
  m[1] = 10; m[10] = 7; m[7] = 1; // 丑戌未
  m[4] = 4; m[6] = 6; m[9] = 9; m[11] = 11; // 辰午酉亥自刑
  return m;
})();
const isZiXing = (z: number) => XING[z] === z;

/** 驿马：申子辰马在寅，巳酉丑马在亥，寅午戌马在申，亥卯未马在巳 */
const YI_MA = (zhi: number) => [2, 11, 8, 5][zhi % 4];

export interface SiKe {
  /** 天盘神（上神） */
  up: number;
  /** 下神：课一、课三为干支，课二、课四为支 */
  down: number;
  /** 第一课下神为日干 */
  isGan: boolean;
  /** 天将 */
  jiang: string;
  /** 六亲（对日干） */
  qin: string;
}

export interface SanChuan {
  chu: number;
  zhong: number;
  mo: number;
  chuJiang: string;
  zhongJiang: string;
  moJiang: string;
  chuQin: string;
  zhongQin: string;
  moQin: string;
  chuDun: string;  // 遁干（可能带"空"）
  zhongDun: string;
  moDun: string;
}

export interface LiuRenResult {
  yueJiang: number;        // 月将支
  yueJiangName: string;
  zhanShi: number;         // 占时支
  dayGan: number;
  dayZhi: number;
  /** 天盘：key=地盘支索引, value=天盘支索引 */
  heaven: number[];
  /** 天将：key=地盘支索引 */
  jiangAtEarth: string[];
  siKe: SiKe[];            // 四课（可能含重复）
  uniqueKeCount: number;
  sanChuan: SanChuan;
  keTi: string;            // 课体
  guiRen: number;          // 贵人支
  isDayGui: boolean;       // 旦贵/暮贵
  xunKong: number[];       // 旬空二支
  dunGan: (zhi: number) => string; // 旬遁干，空则为''
}

/** 由中气时间确定月将。jqTimes: {节气名: Date} 需包含前后年份边界 */
export function getYueJiang(jqTimes: Array<{ name: string; time: Date }>, at: Date): number {
  const zhongQi = jqTimes
    .filter((j) => ZHONG_QI_TO_JIANG.some(([n]) => n === j.name))
    .sort((a, b) => a.time.getTime() - b.time.getTime());
  let jiang = 1; // 默认丑将（冬至后）
  for (const j of zhongQi) {
    if (j.time.getTime() <= at.getTime()) {
      jiang = ZHONG_QI_TO_JIANG.find(([n]) => n === j.name)![1];
    }
  }
  return jiang;
}

function qinOf(dayGan: number, zhi: number): string {
  const me = GAN_WUXING[dayGan];
  const it = ZHI_WUXING[zhi];
  if (me === it) return '兄弟';
  if (wuxingSheng(it, me)) return '父母';
  if (wuxingSheng(me, it)) return '子孙';
  if (wuxingKe(me, it)) return '妻财';
  return '官鬼';
}

export function paiLiuRen(opts: {
  dayGanZhiIndex: number; // 日柱在六十甲子中的序号 0-59
  zhanShiZhi: number;     // 占时支
  yueJiang: number;       // 月将支
  at?: Date;              // 占时（用于昼夜贵人，缺省按占时支定）
}): LiuRenResult {
  const { dayGanZhiIndex, zhanShiZhi, yueJiang } = opts;
  const dayGan = dayGanZhiIndex % 10;
  const dayZhi = dayGanZhiIndex % 12;

  // ── 天盘：月将加占时 ──
  const heaven = new Array(12);
  for (let e = 0; e < 12; e++) heaven[e] = (yueJiang + ((e - zhanShiZhi + 12) % 12)) % 12;

  // ── 旬遁干 / 旬空 ──
  const xunStart = dayGanZhiIndex - (dayGanZhiIndex % 10);
  const dunGan = (zhi: number): string => {
    for (let i = 0; i < 10; i++) {
      if ((xunStart + i) % 12 === zhi) return GAN[(xunStart + i) % 10];
    }
    return '';
  };
  const xunKong = [0, 1].map((i) => (xunStart + 10 + i) % 12);

  // ── 十二天将 ──
  // 昼：卯至申时，夜：酉至寅时（通行简化分法）
  const isDayGui = zhanShiZhi >= 3 && zhanShiZhi <= 8;
  const guiRen = GUI_REN[dayGan][isDayGui ? 0 : 1];
  const guiEarth = heaven.indexOf(guiRen); // 贵人天盘神所临地盘
  // 贵人临地盘亥至辰顺行，临巳至戌逆行
  const shunXing = guiEarth >= 11 || guiEarth <= 4;
  const jiangAtEarth = new Array<string>(12);
  for (let k = 0; k < 12; k++) {
    const pos = shunXing ? (guiEarth + k) % 12 : (guiEarth - k + 12) % 12;
    jiangAtEarth[pos] = TIAN_JIANG[k];
  }
  const jiangOfHeaven = (h: number) => jiangAtEarth[heaven.indexOf(h)];

  // ── 四课 ──
  // 注意：第一课的 down 记为干之寄宫支（与第三课干支同宫时可正确去重），克以日干五行论
  const jiGong = GAN_JI_GONG[dayGan];
  const keUp = [heaven[jiGong], 0, heaven[dayZhi], 0];
  keUp[1] = heaven[keUp[0]];
  keUp[3] = heaven[keUp[2]];
  const keDown = [jiGong, keUp[0], dayZhi, keUp[2]];
  const siKe: SiKe[] = [0, 1, 2, 3].map((i) => ({
    up: keUp[i],
    down: keDown[i],
    isGan: i === 0,
    jiang: jiangOfHeaven(keUp[i]),
    qin: qinOf(dayGan, keUp[i]),
  }));
  const uniqueKeCount = new Set(siKe.map((k) => k.down + '-' + k.up)).size;

  // ── 贼克判定：先取下贼上，无下贼上再取上克下（《课经》次序） ──
  type KeInfo = { idx: number; up: number; xiaKe: boolean }; // xiaKe: 下贼上
  const xiaZeList: KeInfo[] = [];  // 下贼上
  const shangKeList: KeInfo[] = []; // 上克下
  siKe.forEach((k, idx) => {
    const upWx = ZHI_WUXING[k.up];
    const downWx = k.isGan ? GAN_WUXING[dayGan] : ZHI_WUXING[k.down];
    if (wuxingKe(downWx, upWx)) xiaZeList.push({ idx, up: k.up, xiaKe: true });
    else if (wuxingKe(upWx, downWx)) shangKeList.push({ idx, up: k.up, xiaKe: false });
  });
  const hits: KeInfo[] = xiaZeList.length > 0 ? xiaZeList : shangKeList; // 取用的一类克
  const hasKe = hits.length > 0;

  /** 取克为初传：一克直取（贼克），多克比用，俱比俱不比涉害（临位孟仲季取浅，平级复等）。
   *  口径对齐 metaphysics-steward 144 例黄金语料：按课逐条计、不做上神去重。 */
  const pickByKe = (hits: KeInfo[]): { chu: number; keTi: string } => {
    const yang = isYangGan(dayGan);
    if (hits.length === 1) {
      return { chu: hits[0].up, keTi: hits[0].xiaKe ? '重审课' : '元首课' };
    }
    // 比用：上神与日干同阴阳
    const bi = hits.filter((k) => isYangZhi(k.up) === yang);
    const pool = bi.length > 0 ? bi : hits;
    if (pool.length === 1) {
      return { chu: pool[0].up, keTi: pool[0].xiaKe ? '知一课（重审）' : '知一课（元首）' };
    }
    // 涉害：按上神所临地盘支（K1 之临位为日干寄宫支）的孟仲季取浅者
    const mzj = (down: number) => ([2, 8, 5, 11].includes(down) ? 0 : [0, 6, 3, 9].includes(down) ? 1 : 2);
    const levels = pool.map((k) => mzj(siKe[k.idx].down));
    const best = Math.min(...levels);
    const pool3 = pool.filter((_, i) => levels[i] === best);
    if (pool3.length === 1) return { chu: pool3[0].up, keTi: '涉害课' };
    // 复等：阳日取干上神，阴日取支上神
    const pref = yang ? siKe[0].up : siKe[2].up;
    const hit = pool3.find((k) => k.up === pref);
    return { chu: hit ? hit.up : pool3[0].up, keTi: '涉害课' };
  };

  const isFuYin = yueJiang === zhanShiZhi;
  const isFanYin = (yueJiang - zhanShiZhi + 12) % 12 === 6;

  let keTi = '';
  let chu = -1, zhong = -1, mo = -1;

  const chong = (z: number) => (z + 6) % 12;

  // ── 伏吟 ──
  if (isFuYin) {
    const upGan = siKe[0].up, upZhi = siKe[2].up;
    if (hasKe) {
      chu = hits[0].up;
      keTi = '伏吟课（用刑冲）';
    } else {
      chu = isYangGan(dayGan) ? upGan : upZhi;
      keTi = isYangGan(dayGan) ? '伏吟课（自任格）' : '伏吟课（自信格）';
    }
    // 初自刑：发用于干则中取支上，发用于支则中取干上；末传自刑则冲、否则递刑
    if (isZiXing(chu)) {
      zhong = chu === upGan && chu !== upZhi ? upZhi : upGan;
    } else {
      zhong = XING[chu];
    }
    mo = isZiXing(zhong) ? chong(zhong) : XING[zhong];
  } else if (isFanYin) {
    // ── 返吟 ──
    if (hasKe) {
      chu = pickByKe(hits).chu;
      zhong = chong(chu);
      mo = chong(zhong);
      keTi = '返吟课';
    } else {
      chu = YI_MA(dayZhi);
      zhong = siKe[2].up;
      mo = siKe[0].up;
      keTi = '返吟课（井栏射）';
    }
  } else if (hasKe) {
    // ── 贼克 / 比用 / 涉害 ──
    const picked = pickByKe(hits);
    chu = picked.chu;
    zhong = heaven[chu];
    mo = heaven[zhong];
    keTi = picked.keTi;
  } else if (GAN_JI_GONG[dayGan] === dayZhi) {
    // ── 八专：干支同宫（优先于遥克） ──
    if (isYangGan(dayGan)) chu = (siKe[0].up + 2) % 12;  // 干上神顺数三位
    else chu = (siKe[3].up + 10) % 12;                    // 第四课上神逆数三位
    zhong = siKe[0].up;
    mo = siKe[0].up;
    keTi = '八专课';
  } else {
    // ── 遥克：蒿矢（神克干）先判，弹射（干克神）后备 ──
    // 候选恰一即用（不论阴阳）；多候选取与日干同阴阳者第一个；俱不比则整类弃用转另一类
    const yang = isYangGan(dayGan);
    const pickYao = (cands: KeInfo[]): KeInfo | null => {
      if (cands.length === 1) return cands[0];
      return cands.find((c) => isYangZhi(c.up) === yang) ?? null;
    };
    const haoShi = siKe
      .map((k, idx) => ({ idx, up: k.up, xiaKe: false }))
      .filter((x) => wuxingKe(ZHI_WUXING[x.up], GAN_WUXING[dayGan]));
    let pickedYao = pickYao(haoShi);
    let isHaoShi = true;
    if (!pickedYao) {
      const tanShe = siKe
        .map((k, idx) => ({ idx, up: k.up, xiaKe: false }))
        .filter((x) => wuxingKe(GAN_WUXING[dayGan], ZHI_WUXING[x.up]));
      pickedYao = pickYao(tanShe);
      isHaoShi = false;
    }
    if (pickedYao) {
      chu = pickedYao.up;
      zhong = heaven[chu];
      mo = heaven[zhong];
      keTi = isHaoShi ? '遥克课（蒿矢格）' : '遥克课（弹射格）';
    } else if (uniqueKeCount < 4) {
      // ── 别责：四课不全且无克 ──
      if (yang) {
        const heGan = (dayGan + 5) % 10; // 甲己合…
        chu = heaven[GAN_JI_GONG[heGan]];
      } else {
        chu = (dayZhi + 4) % 12; // 支前三合
      }
      zhong = siKe[0].up;
      mo = siKe[0].up;
      keTi = '别责课';
    } else {
      // ── 昴星 ──
      if (yang) {
        chu = heaven[9]; // 仰视酉上
        zhong = siKe[2].up;
        mo = siKe[0].up;
        keTi = '昴星课（虎视格）';
      } else {
        chu = heaven.indexOf(9); // 俯视酉下
        zhong = siKe[0].up;
        mo = siKe[2].up;
        keTi = '昴星课（冬蛇掩目格）';
      }
    }
  }

  const dun = (z: number) => {
    const g = dunGan(z);
    return g === '' ? '空亡' : g;
  };
  const sanChuan: SanChuan = {
    chu, zhong, mo,
    chuJiang: jiangOfHeaven(chu),
    zhongJiang: jiangOfHeaven(zhong),
    moJiang: jiangOfHeaven(mo),
    chuQin: qinOf(dayGan, chu),
    zhongQin: qinOf(dayGan, zhong),
    moQin: qinOf(dayGan, mo),
    chuDun: dun(chu),
    zhongDun: dun(zhong),
    moDun: dun(mo),
  };

  return {
    yueJiang,
    yueJiangName: YUE_JIANG_NAME[yueJiang],
    zhanShi: zhanShiZhi,
    dayGan, dayZhi,
    heaven,
    jiangAtEarth,
    siKe,
    uniqueKeCount,
    sanChuan,
    keTi,
    guiRen,
    isDayGui,
    xunKong,
    dunGan,
  };
}
