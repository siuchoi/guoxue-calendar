/**
 * 奇门遁甲排盘引擎（移植自 metaphysics-steward/scripts/core/qimen.py，MIT）
 * https://github.com/superzhang21/metaphysics-steward
 *
 * 时家奇门 · 拆补法 · 转盘法：
 * - 局窗 = 最近一个 24 节气（节与中气均按精确时刻切换）
 * - 符头定元：最近甲/己日，子午卯酉上元/寅申巳亥中元/辰戌丑未下元
 * - 值符星/值使门/八神(阳顺阴逆)/九星八门/天盘(星随值符)/地盘(六仪三奇)
 * - 天禽寄坤二宫；落中五寄坤
 */
import { Solar } from 'lunar-typescript';

const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const JU_MAP: Record<string, number[]> = {
  冬至: [1, 7, 4], 小寒: [2, 8, 5], 大寒: [3, 9, 6],
  立春: [8, 5, 2], 雨水: [9, 6, 3], 惊蛰: [1, 4, 7],
  春分: [3, 9, 6], 清明: [4, 1, 7], 谷雨: [5, 2, 8],
  立夏: [4, 1, 7], 小满: [5, 2, 8], 芒种: [6, 3, 9],
  夏至: [-9, -3, -6], 小暑: [-8, -2, -5], 大暑: [-7, -1, -4],
  立秋: [-2, -5, -8], 处暑: [-1, -4, -7], 白露: [-9, -3, -6],
  秋分: [-7, -1, -4], 寒露: [-6, -9, -3], 霜降: [-5, -8, -2],
  立冬: [-6, -9, -3], 小雪: [-5, -8, -2], 大雪: [-4, -7, -1],
};

const STAR_MAP: Record<number, string> = { 1: '蓬', 2: '芮', 3: '冲', 4: '辅', 5: '禽', 6: '心', 7: '柱', 8: '任', 9: '英' };
const DOOR_MAP: Record<number, string> = { 1: '休', 2: '死', 3: '伤', 4: '杜', 6: '开', 7: '惊', 8: '生', 9: '景' };
const G_FULL: Record<string, string> = { 符: '直符', 蛇: '螣蛇', 阴: '太阴', 合: '六合', 虎: '白虎', 武: '玄武', 地: '九地', 天: '九天' };

export interface PalaceCell {
  god: string; star: string; door: string; tgan: string; dgan: string;
}

export interface QimenResult {
  ju: number; yang: boolean;
  xunShou: string;
  zhifu: { star: string; house: number };
  zhishi: { door: string; house: number };
  grid: Record<number, PalaceCell>; // 宫数 1-9，5=中宫（只有 dgan）
  layout: number[];                 // 洛书布局 [4,9,2,3,5,7,8,1,6]
}

export function paiQimen(dt: Date): QimenResult {
  const solar = Solar.fromYmdHms(dt.getFullYear(), dt.getMonth() + 1, dt.getDate(), dt.getHours(), dt.getMinutes(), 0);
  const lunar = solar.getLunar();
  const dayGanzhi = lunar.getDayInGanZhi();
  const hourGanzhi = lunar.getTimeInGanZhi();

  // ── 定局：节/中气取较近者为局窗 ──
  const pj = lunar.getPrevJie();
  const pq = lunar.getPrevQi();
  const key = (j: { getSolar(): { getYear(): number; getMonth(): number; getDay(): number } }) => {
    const s = j.getSolar();
    return s.getYear() * 10000 + s.getMonth() * 100 + s.getDay();
  };
  const jq = key(pj) > key(pq) ? pj : pq;
  const baseJus = JU_MAP[jq.getName()] ?? [1, 7, 4];

  // 符头定元：回溯最近甲/己日
  let temp = lunar;
  while (!['甲', '己'].includes(temp.getDayGan())) temp = temp.next(-1);
  const futouZhi = temp.getDayZhi();
  const yuanIdx = ['子', '午', '卯', '酉'].includes(futouZhi) ? 0 : ['寅', '申', '巳', '亥'].includes(futouZhi) ? 1 : 2;
  const ju = baseJus[yuanIdx];
  const isYang = ju > 0;
  const absJu = Math.abs(ju);

  // ── 地盘：六仪三奇 ──
  const order = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'];
  const path = isYang ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : [9, 8, 7, 6, 5, 4, 3, 2, 1];
  const diPan: Record<number, string> = {};
  let cur = absJu;
  for (const stem of order) {
    diPan[cur] = stem;
    cur = path[(path.indexOf(cur) + 1) % 9];
  }

  // ── 旬首 ──
  const XUN_SHOU: Record<string, string> = { 甲子: '戊', 甲戌: '己', 甲申: '庚', 甲午: '辛', 甲辰: '壬', 甲寅: '癸' };
  const hg = hourGanzhi[0];
  const hz = hourGanzhi[1];
  const hIdx = TIANGAN.indexOf(hg);
  const zIdx = DIZHI.indexOf(hz);
  const xunStartZhi = DIZHI[(((zIdx - hIdx) % 12) + 12) % 12];
  const shouStem = XUN_SHOU['甲' + xunStartZhi] ?? '戊';

  const shouHouse = Number(Object.keys(diPan).find((k) => diPan[Number(k)] === shouStem));
  const zhiFuStar = STAR_MAP[shouHouse];
  const zhiShiDoor = DOOR_MAP[shouHouse] ?? '死';

  // ── 值符落宫（时干宫，甲时则旬首仪宫；中五寄坤二）──
  const targetStem = hg !== '甲' ? hg : shouStem;
  const targetHouseRaw = Number(Object.keys(diPan).find((k) => diPan[Number(k)] === targetStem));
  const targetHouse = targetHouseRaw === 5 ? 2 : targetHouseRaw;

  const rim = [1, 8, 3, 4, 9, 2, 7, 6];
  const shouIdx = shouHouse !== 5 ? rim.indexOf(shouHouse) : rim.indexOf(2);
  const targetIdx = rim.indexOf(targetHouse);
  const diff = (((targetIdx - shouIdx) % 8) + 8) % 8;

  // 天盘 + 九星（随值符转）
  const heavenPan: Record<number, string> = {};
  const stars: Record<number, string> = {};
  rim.forEach((house, i) => {
    const oldHouse = rim[(((i - diff) % 8) + 8) % 8];
    stars[house] = STAR_MAP[oldHouse];
    heavenPan[house] = diPan[oldHouse];
  });

  // ── 八门（值使随时干飞）──
  const hourOffset = hIdx;
  const shiIdx = path.indexOf(shouHouse);
  const shiTargetRaw = path[(shiIdx + hourOffset) % 9];
  const shiTargetHouse = shiTargetRaw === 5 ? 2 : shiTargetRaw;
  const dShouIdx = shouHouse !== 5 ? rim.indexOf(shouHouse) : rim.indexOf(2);
  const dTargetIdx = rim.indexOf(shiTargetHouse);
  const dDiff = (((dTargetIdx - dShouIdx) % 8) + 8) % 8;

  const doors: Record<number, string> = {};
  rim.forEach((house, i) => {
    const oldHouse = rim[(((i - dDiff) % 8) + 8) % 8];
    doors[house] = DOOR_MAP[oldHouse] ?? '';
  });

  // ── 八神（阳顺阴逆，从值符宫起）──
  const godsList = isYang
    ? ['符', '蛇', '阴', '合', '虎', '武', '地', '天']
    : ['符', '天', '地', '武', '虎', '合', '阴', '蛇'];
  const gods: Record<number, string> = {};
  rim.forEach((house, i) => {
    gods[house] = godsList[(((i - targetIdx) % 8) + 8) % 8];
  });

  // ── 组装 ──
  const layout = [4, 9, 2, 3, 5, 7, 8, 1, 6];
  const grid: Record<number, PalaceCell> = {};
  for (const h of layout) {
    grid[h] = h === 5
      ? { god: '', star: '', door: '', tgan: '', dgan: diPan[5] }
      : { god: G_FULL[gods[h]], star: stars[h], door: doors[h], tgan: heavenPan[h], dgan: diPan[h] };
  }

  return {
    ju, yang: isYang, xunShou: shouStem,
    zhifu: { star: zhiFuStar, house: targetHouseRaw },
    zhishi: { door: zhiShiDoor, house: shiTargetRaw },
    grid, layout,
  };
}
