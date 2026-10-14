/**
 * 八字合婚引擎（移植自 metaphysics-steward/scripts/core/hehun.py，MIT）
 * https://github.com/superzhang21/metaphysics-steward
 *
 * 维度：生肖关系 / 年命纳音 / 日干五合 / 夫妻宫 / 五行互补 / 喜用神互补 /
 *       神煞警示 / 大运同频；基线 60，截断 [0,100]。
 * 仅供传统文化参考，不构成婚恋决策建议。
 */
import {
  GAN_WX, ZHI_WX, SHENG, KE, HIDDEN_GANS, BaziResult,
} from './bazi';
import { LunarUtil } from 'lunar-typescript';

const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const ZHI_LIUHE: Record<string, string> = { 子: '丑', 丑: '子', 寅: '亥', 亥: '寅', 卯: '戌', 戌: '卯', 辰: '酉', 酉: '辰', 巳: '申', 申: '巳', 午: '未', 未: '午' };
const ZHI_CHONG: Record<string, string> = { 子: '午', 午: '子', 丑: '未', 未: '丑', 寅: '申', 申: '寅', 卯: '酉', 酉: '卯', 辰: '戌', 戌: '辰', 巳: '亥', 亥: '巳' };
const ZHI_HAI: Record<string, string> = { 子: '未', 未: '子', 丑: '午', 午: '丑', 寅: '巳', 巳: '寅', 卯: '辰', 辰: '卯', 申: '亥', 亥: '申', 酉: '戌', 戌: '酉' };
const ZHI_XING_3: string[][] = [['寅', '巳', '申'], ['丑', '戌', '未']];
const ZHI_SANHE: Record<string, string[]> = {
  申: ['子', '辰'], 子: ['申', '辰'], 辰: ['申', '子'],
  寅: ['午', '戌'], 午: ['寅', '戌'], 戌: ['寅', '午'],
  巳: ['酉', '丑'], 酉: ['巳', '丑'], 丑: ['巳', '酉'],
  亥: ['卯', '未'], 卯: ['亥', '未'], 未: ['亥', '卯'],
};
const TIANGAN_WUHE: Record<string, string> = {
  甲己: '土', 己甲: '土', 乙庚: '金', 庚乙: '金', 丙辛: '水', 辛丙: '水', 丁壬: '木', 壬丁: '木', 戊癸: '火', 癸戊: '火',
};
export const SHENGXIAO: Record<string, string> = { 子: '鼠', 丑: '牛', 寅: '虎', 卯: '兔', 辰: '龙', 巳: '蛇', 午: '马', 未: '羊', 申: '猴', 酉: '鸡', 戌: '狗', 亥: '猪' };

// 神煞速查
const TAOHUA_POS: Record<string, string> = { 申子辰: '酉', 寅午戌: '卯', 巳酉丑: '午', 亥卯未: '子' };
const HUAGAI_POS: Record<string, string> = { 申子辰: '辰', 寅午戌: '戌', 巳酉丑: '丑', 亥卯未: '未' };
const YIMA_POS: Record<string, string> = { 申子辰: '寅', 寅午戌: '申', 巳酉丑: '亥', 亥卯未: '巳' };
const GUCHEN_POS: Record<string, string> = { 亥子丑: '寅', 寅卯辰: '巳', 巳午未: '申', 申酉戌: '亥' };
const GUASU_POS: Record<string, string> = { 亥子丑: '戌', 寅卯辰: '丑', 巳午未: '辰', 申酉戌: '未' };
const YANGREN_POS: Record<string, string> = { 甲: '卯', 丙: '午', 戊: '午', 庚: '酉', 壬: '子' };
const KUI_GANG_DAYS = new Set(['庚辰', '庚戌', '壬辰', '戊戌']);
const YINCHA_YANGCUO_DAYS = new Set(['丙子', '丙午', '丁丑', '丁未', '戊寅', '戊申', '辛卯', '辛酉', '壬辰', '壬戌', '癸巳', '癸亥']);

const shengMe = (el: string): string => Object.keys(SHENG).find((k) => SHENG[k] === el)!;
const keMe = (el: string): string => Object.keys(KE).find((k) => KE[k] === el)!;
const groupOf = (zhi: string): string | null => Object.keys(TAOHUA_POS).find((g) => g.includes(zhi)) ?? null;
const nayin = (gz: string): string => ((LunarUtil as any).NAYIN[gz] ?? '') as string;

export interface ShenSha { name: string; at: string; detail: string }
export interface YongShen { verdict: string; element: string; label?: string; reason: string }

function countWuxing(bz: BaziResult): Record<string, number> {
  const wc: Record<string, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  (['Year', 'Month', 'Day', 'Hour'] as const).forEach((k) => {
    const p = bz.pillars[k];
    wc[GAN_WX[p.gan]] += 1;
    wc[ZHI_WX[p.zhi]] += 1;
    if (p.hidden.length) wc[GAN_WX[p.hidden[0].gan]] += 0.5;
  });
  return wc;
}

function strengthOf(bz: BaziResult, wc?: Record<string, number>): { verdict: string; ratio: number; dmEl: string } {
  wc = wc ?? countWuxing(bz);
  const dmEl = GAN_WX[bz.pillars.Day.gan];
  const tong = wc[dmEl] + wc[shengMe(dmEl)];
  const yi = wc[SHENG[dmEl]] + wc[keMe(dmEl)] + wc[KE[dmEl]];
  const total = tong + yi;
  const ratio = total ? tong / total : 0.5;
  if (ratio >= 0.62) return { verdict: '身强', ratio, dmEl };
  if (ratio <= 0.38) return { verdict: '身弱', ratio, dmEl };
  return { verdict: '中和', ratio, dmEl };
}

function yongshenOf(bz: BaziResult): YongShen {
  const wc = countWuxing(bz);
  const { verdict, ratio, dmEl } = strengthOf(bz, wc);
  if (verdict === '中和') {
    const weakest = Object.keys(wc).reduce((a, b) => (wc[a] <= wc[b] ? a : b));
    return { verdict, element: weakest, reason: `日主中和，取全局最缺之${weakest}调候` };
  }
  const cand: Record<string, string> = verdict === '身强'
    ? { [keMe(dmEl)]: '官杀', [SHENG[dmEl]]: '食伤', [KE[dmEl]]: '财' }
    : { [shengMe(dmEl)]: '印', [dmEl]: '比劫' };
  const el = Object.keys(cand).reduce((a, b) => (wc[a] <= wc[b] ? a : b));
  const action = verdict === '身强' ? '克泄耗以制身' : '生扶以助身';
  return { verdict, element: el, label: cand[el], reason: `日主${verdict}(占比${Math.round(ratio * 100)}%)，用神${el}(${cand[el]})以${action}` };
}

export function personShensha(bz: BaziResult): ShenSha[] {
  const p = bz.pillars;
  const yz = p.Year.zhi;
  const dayGz = p.Day.gz;
  const dg = dayGz[0];
  const zhis: Record<string, string> = { 年支: yz, 月支: p.Month.zhi, 日支: p.Day.zhi, 时支: p.Hour.zhi };
  const out: ShenSha[] = [];
  const has = (z: string) => Object.keys(zhis).find((k) => zhis[k] === z) ?? null;
  const grp = groupOf(yz);

  if (grp) {
    const tp = has(TAOHUA_POS[grp]);
    if (tp) out.push({ name: '桃花(咸池)', at: tp, detail: `年支${grp}局之桃花在${TAOHUA_POS[grp]}` });
    const hg = has(HUAGAI_POS[grp]);
    if (hg) out.push({ name: '华盖', at: hg, detail: `年支${grp}局之华盖在${HUAGAI_POS[grp]}` });
    const ym = has(YIMA_POS[grp]);
    if (ym) out.push({ name: '驿马', at: ym, detail: `年支${grp}局之驿马在${YIMA_POS[grp]}` });
  }
  const gzGroup = Object.keys(GUCHEN_POS).find((g) => g.includes(yz));
  if (gzGroup) {
    const at = has(GUCHEN_POS[gzGroup]);
    if (at) out.push({ name: '孤辰', at, detail: `孤辰星现于${at}` });
    const at2 = has(GUASU_POS[gzGroup]);
    if (at2) out.push({ name: '寡宿', at: at2, detail: `寡宿星现于${at2}` });
  }
  if (YANGREN_POS[dg]) {
    const at = has(YANGREN_POS[dg]);
    if (at) out.push({ name: '羊刃', at, detail: `日主${dg}羊刃在${YANGREN_POS[dg]}` });
  }
  if (KUI_GANG_DAYS.has(dayGz)) out.push({ name: '魁罡', at: '日柱', detail: `魁罡日 ${dayGz}，性刚果断` });
  if (YINCHA_YANGCUO_DAYS.has(dayGz)) out.push({ name: '阴差阳错', at: '日柱', detail: `阴差阳错日 ${dayGz}，婚缘多有波折` });
  const yzIdx = DIZHI.indexOf(yz);
  const hl = DIZHI[(((3 - yzIdx) % 12) + 12) % 12];
  const tx = DIZHI[(((3 - yzIdx + 6) % 12) + 12) % 12];
  const atHl = has(hl);
  if (atHl) out.push({ name: '红鸾', at: atHl, detail: '红鸾入命，主姻缘喜庆' });
  const atTx = has(tx);
  if (atTx) out.push({ name: '天喜', at: atTx, detail: '天喜入命，主喜事临门' });
  return out;
}

export interface HehunSection { title: string; notes: string[]; score: number }
export interface HehunPerson {
  tag: string; gz: string[]; dayMaster: string; dayMasterWx: string;
  nayinYear: string; shengxiao: string;
  yongshen: YongShen; shensha: ShenSha[];
  wuxingCount: Record<string, number>;
}
export interface HehunResult {
  male: HehunPerson; female: HehunPerson;
  sections: HehunSection[];
  score: number; verdict: string;
}

function xingRel(a: string, b: string): boolean {
  if ((a === '子' && b === '卯') || (a === '卯' && b === '子')) return true;
  return ZHI_XING_3.some((g) => g.includes(a) && g.includes(b) && a !== b);
}

function fmtWx(wc: Record<string, number>): string {
  return Object.entries(wc).map(([k, v]) => `${k}${Math.round(v * 10) / 10}`).join(' ');
}

export function hehun(male: BaziResult, female: BaziResult): HehunResult {
  const mw = countWuxing(male);
  const fw = countWuxing(female);
  const mUse = yongshenOf(male);
  const fUse = yongshenOf(female);
  const sections: HehunSection[] = [];

  // ── 生肖 + 年命纳音 ──
  {
    const my = male.pillars.Year.zhi, fy = female.pillars.Year.zhi;
    const msx = SHENGXIAO[my], fsx = SHENGXIAO[fy];
    const notes: string[] = [];
    let score = 0;
    if (ZHI_LIUHE[my] === fy) { notes.push(`生肖 ${msx}与${fsx} 六合，主相处和睦、家宅安顺（+10）`); score += 10; }
    else if (ZHI_CHONG[my] === fy) { notes.push(`生肖 ${msx}与${fsx} 相冲，易生分歧，宜以日柱/五行调和（-8）`); score -= 8; }
    else if (ZHI_HAI[my] === fy) { notes.push(`生肖 ${msx}与${fsx} 相害，易有暗耗口舌，需多包容（-5）`); score -= 5; }
    else if (ZHI_SANHE[my]?.includes(fy)) { notes.push(`生肖 ${msx}与${fsx} 三合，性情相投、互助（+4）`); score += 4; }
    else if (xingRel(my, fy)) { notes.push(`生肖 ${msx}与${fsx} 相刑，时有磨擦需忍让（-3）`); score -= 3; }
    else { notes.push(`生肖 ${msx}与${fsx} 无冲刑害，属平常（+2）`); score += 2; }

    const mn = nayin(male.pillars.Year.gz), fn = nayin(female.pillars.Year.gz);
    const mel = mn.slice(-1), fel = fn.slice(-1);
    notes.push(`年命纳音：男 ${mn} / 女 ${fn}`);
    if (mel && fel) {
      if (mel === fel) { notes.push(`年命同气(${mel})，性情相类（+3）`); score += 3; }
      else if (SHENG[mel] === fel) { notes.push(`男命${mel}生女命${fel}，纳音相生（+5）`); score += 5; }
      else if (SHENG[fel] === mel) { notes.push(`女命${fel}生男命${mel}，纳音相生（+5）`); score += 5; }
      else if (KE[mel] === fel || KE[fel] === mel) { notes.push(`年命相克(${mel}x${fel})，需五行补救（-4）`); score -= 4; }
    }
    sections.push({ title: '生肖与年命', notes, score });
  }

  // ── 日干 + 夫妻宫 ──
  {
    const md = male.pillars.Day, fd = female.pillars.Day;
    const notes: string[] = [];
    let score = 0;
    const wuhe = TIANGAN_WUHE[md.gan + fd.gan];
    if (wuhe) { notes.push(`日干五合：${md.gan}${fd.gan}合化${wuhe}，主情意相投（+10）`); score += 10; }
    else {
      const mwEl = GAN_WX[md.gan], fwEl = GAN_WX[fd.gan];
      if (mwEl === fwEl) { notes.push(`日主同气：男${md.gan}(${mwEl}) 女${fd.gan}(${fwEl})，志趣相合（+5）`); score += 5; }
      else if (SHENG[mwEl] === fwEl) { notes.push(`男日主${md.gan}(${mwEl})生女日主${fd.gan}(${fwEl})，男愿付出（+4）`); score += 4; }
      else if (SHENG[fwEl] === mwEl) { notes.push(`女日主${fd.gan}(${fwEl})生男日主${md.gan}(${mwEl})，女多包容（+4）`); score += 4; }
      else if (KE[mwEl] === fwEl) { notes.push(`男日主${md.gan}(${mwEl})克女日主${fd.gan}(${fwEl})，宜柔化（-4）`); score -= 4; }
      else if (KE[fwEl] === mwEl) { notes.push(`女日主${fd.gan}(${fwEl})克男日主${md.gan}(${mwEl})，需男让（-4）`); score -= 4; }
    }
    if (ZHI_LIUHE[md.zhi] === fd.zhi) { notes.push(`夫妻宫六合：男${md.zhi} 女${fd.zhi}，姻缘和美（+10）`); score += 10; }
    else if (ZHI_SANHE[md.zhi]?.includes(fd.zhi)) { notes.push(`夫妻宫三合：男${md.zhi} 女${fd.zhi}，相得益彰（+8）`); score += 8; }
    else if (ZHI_CHONG[md.zhi] === fd.zhi) { notes.push(`夫妻宫相冲：男${md.zhi} 女${fd.zhi}，易冲突，需磨合（-8）`); score -= 8; }
    else if (ZHI_HAI[md.zhi] === fd.zhi) { notes.push(`夫妻宫相害：男${md.zhi} 女${fd.zhi}，暗中别扭（-5）`); score -= 5; }
    else if (xingRel(md.zhi, fd.zhi)) { notes.push(`夫妻宫相刑：男${md.zhi} 女${fd.zhi}，时有磕绊（-4）`); score -= 4; }
    else { notes.push(`夫妻宫 ${md.zhi}/${fd.zhi} 关系平常（+2）`); score += 2; }
    sections.push({ title: '日干与夫妻宫', notes, score });
  }

  // ── 五行互补 ──
  {
    const notes: string[] = [];
    let score = 0;
    const weakM = Object.keys(mw).filter((k) => mw[k] <= 0.5);
    const weakF = Object.keys(fw).filter((k) => fw[k] <= 0.5);
    const hit = weakM.filter((w) => fw[w] >= 2.0);
    const hit2 = weakF.filter((w) => mw[w] >= 2.0);
    if (hit.length || hit2.length) {
      notes.push(`五行互补：男缺${weakM.join('') || '无'}，女缺${weakF.join('') || '无'}，互有补益（+6）`);
      score += 6;
    } else {
      notes.push(`男缺${weakM.join('') || '无'}、女缺${weakF.join('') || '无'}，互补一般（+1）`);
      score += 1;
    }
    notes.push(`男五行强度：${fmtWx(mw)}`);
    notes.push(`女五行强度：${fmtWx(fw)}`);
    sections.push({ title: '五行互补', notes, score });
  }

  // ── 喜用神互补 ──
  {
    const notes = [`男喜用神：${mUse.reason}`, `女喜用神：${fUse.reason}`];
    let score = 0;
    const me = mUse.element, fe = fUse.element;
    const fSupply = fw[me] >= 2.0;
    const mSupply = mw[fe] >= 2.0;
    if (fSupply && mSupply) { notes.push(`用神互补：女方补男方${me}、男方补女方${fe}，互为助益（+8）`); score += 8; }
    else if (fSupply) { notes.push(`用神互补：女方命局${me}较旺，可补男方用神（+4）`); score += 4; }
    else if (mSupply) { notes.push(`用神互补：男方命局${fe}较旺，可补女方用神（+4）`); score += 4; }
    else { notes.push('用神互补一般：双方需各自调候（+1）'); score += 1; }
    const fwMin = Object.keys(fw).reduce((a, b) => (fw[a] <= fw[b] ? a : b));
    const mwMin = Object.keys(mw).reduce((a, b) => (mw[a] <= mw[b] ? a : b));
    if (me === fwMin && fw[me] <= 0.5) { notes.push(`注意：男方用神${me}恰为女方最弱，需双方共同努力补足`); score -= 1; }
    if (fe === mwMin && mw[fe] <= 0.5) { notes.push(`注意：女方用神${fe}恰为男方最弱，需双方共同努力补足`); score -= 1; }
    sections.push({ title: '喜用神互补', notes, score });
  }

  // ── 神煞警示 ──
  const mShensha = personShensha(male);
  const fShensha = personShensha(female);
  {
    const all = [...mShensha, ...fShensha];
    const notes = [
      `男命神煞：${mShensha.map((s) => `${s.name}@${s.at}`).join('、') || '无明显神煞'}`,
      `女命神煞：${fShensha.map((s) => `${s.name}@${s.at}`).join('、') || '无明显神煞'}`,
    ];
    let score = 0;
    const hasS = (name: string) => all.some((s) => s.name === name);
    if (hasS('阴差阳错')) { notes.push('警示：有阴差阳错日，婚缘多波折、易聚少离多，需多经营（-3）'); score -= 3; }
    if (hasS('魁罡')) { notes.push('警示：有魁罡日，个性刚强好胜，相处需多包容退让（-2）'); score -= 2; }
    if (hasS('孤辰') || hasS('寡宿')) { notes.push('警示：有孤辰/寡宿，情感易有疏离感，宜主动维系（-2）'); score -= 2; }
    const nTh = all.filter((s) => s.name === '桃花(咸池)').length;
    if (nTh >= 2) notes.push(`提示：双方桃花共${nTh}处，异性缘旺，需自律专一`);
    else if (nTh === 1) notes.push('提示：有桃花入命，异性缘佳');
    if (hasS('红鸾') || hasS('天喜')) { notes.push('吉庆：红鸾/天喜入命，多主姻缘喜庆之象'); score += 1; }
    sections.push({ title: '神煞警示', notes, score });
  }

  // ── 大运同频 ──
  {
    const notes: string[] = [];
    let score = 0;
    const dyEval = (bz: BaziResult, useEl: string) =>
      bz.yun.list.map((dy) => {
        const gan = dy.pillar[0], zhi = dy.pillar[1];
        const ge = GAN_WX[gan], ze = ZHI_WX[zhi];
        const good = ge === useEl || SHENG[ge] === useEl || ze === useEl || SHENG[ze] === useEl;
        const bad = (ge !== useEl && KE[ge] === useEl) || (ze !== useEl && KE[ze] === useEl);
        const grade = good && !bad ? '吉' : bad && !good ? '忌' : '平';
        return { pillar: dy.pillar, startYear: dy.startYear, endYear: dy.endYear, grade };
      });
    const my = dyEval(male, mUse.element);
    const fy = dyEval(female, fUse.element);
    notes.push(`男大运评估(喜${mUse.element})：` + my.slice(0, 8).map((d) => `${d.pillar}(${d.grade})`).join(' '));
    notes.push(`女大运评估(喜${fUse.element})：` + fy.slice(0, 8).map((d) => `${d.pillar}(${d.grade})`).join(' '));

    const gradeAt = (lst: typeof my, year: number) => lst.find((d) => d.startYear <= year && year <= d.endYear)?.grade ?? '平';
    const myYr = new Set<number>();
    my.forEach((d) => { for (let y = d.startYear; y <= d.endYear; y++) myYr.add(y); });
    const fyYr = new Set<number>();
    fy.forEach((d) => { for (let y = d.startYear; y <= d.endYear; y++) fyYr.add(y); });
    let common = [...myYr].filter((y) => fyYr.has(y)).sort((a, b) => a - b);
    if (common.length && my.length && fy.length) {
      const start = Math.max(my[0].startYear, fy[0].startYear);
      const end = Math.min(Math.max(...myYr), Math.max(...fyYr), start + 49);
      common = common.filter((y) => start <= y && y <= end);
    }
    const bothGood = common.filter((y) => gradeAt(my, y) === '吉' && gradeAt(fy, y) === '吉');
    if (common.length) {
      const ratio = bothGood.length / common.length;
      const bonus = Math.round(6 * ratio);
      score += bonus;
      let txt = `大运同频：共同年份${common.length}年中双方同入喜用吉运 ${bothGood.length} 年（占比${Math.round(ratio * 100)}%），同频互补 +${bonus}`;
      if (bothGood.length) txt += `；约自 ${bothGood[0]} 年步入同频佳期`;
      notes.push(txt);
    } else {
      notes.push('大运同频：双方起运区间暂无共同可评年份');
    }
    sections.push({ title: '大运同频', notes, score });
  }

  const scoreAll = sections.reduce((a, s) => a + s.score, 0);
  const score = Math.max(0, Math.min(100, 60 + scoreAll));
  const verdict =
    score >= 85 ? '上等婚配：总体相合，多主和美。'
    : score >= 70 ? '中上婚配：较为相配，注意个别矛盾处磨合。'
    : score >= 55 ? '中等婚配：有合有冲，关键在经营与包容。'
    : '普通婚配：冲刑较多，若结缘需谨慎经营、多行补救。';

  const person = (bz: BaziResult, tag: string, wc: Record<string, number>, ys: YongShen, ss: ShenSha[]): HehunPerson => ({
    tag,
    gz: [bz.pillars.Year.gz, bz.pillars.Month.gz, bz.pillars.Day.gz, bz.pillars.Hour.gz],
    dayMaster: bz.pillars.Day.gan,
    dayMasterWx: GAN_WX[bz.pillars.Day.gan],
    nayinYear: nayin(bz.pillars.Year.gz),
    shengxiao: SHENGXIAO[bz.pillars.Year.zhi],
    yongshen: ys, shensha: ss, wuxingCount: wc,
  });

  return {
    male: person(male, '男', mw, mUse, mShensha),
    female: person(female, '女', fw, fUse, fShensha),
    sections, score, verdict,
  };
}
