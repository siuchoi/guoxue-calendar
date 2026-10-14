/**
 * 排盘结果「白话解读」规则库
 *
 * 全部内容基于排盘引擎产出的*真实字段*做查表/判定生成，
 * 不引入随机数或臆造内容；每条尽量对应盘上一处可见信息。
 * 仅供参考，不作决策依据。
 */
import type { MeiHuaResult } from './meihua';
import type { LiuYaoResult } from './liuyao';
import type { LiuRenResult } from './liuren';
import type { JinKouJueResult } from './jinkoujue';
import type { QimenResult } from './qimen';
import type { ZiweiResult } from './ziwei';
import type { BaziResult } from './bazi';

export interface InterpLine {
  k: string;              // 小标题，如「课体」「命宫主星」
  v: string;              // 白话内容
  tone: 'good' | 'bad' | 'neutral';
}

export interface Interp {
  title: string;
  lines: InterpLine[];
}

const L = (k: string, v: string, tone: InterpLine['tone'] = 'neutral'): InterpLine => ({ k, v, tone });

/* ═══════════ 通用五行生克 ═══════════ */
const SHENG: Record<string, string> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const KE: Record<string, string> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };

/* ═══════════ 梅花易数 ═══════════ */
const GUA_MIAN: Record<string, string> = {
  乾: '刚健进取，主动开拓', 兑: '喜悦口舌，沟通交流', 离: '光明附丽，文书消息',
  震: '震动变革，当机立断', 巽: '顺入渗透，细水长流', 坎: '险陷流动，波折反复',
  艮: '静止阻隔，宜缓勿急', 坤: '柔顺包容，以静制动',
};

export function interpretMeiHua(r: MeiHuaResult): Interp {
  const lines: InterpLine[] = [];
  const up = r.ben.upper, lo = r.ben.lower;
  lines.push(L('卦象', `本卦${r.ben.name}，互见${r.hu.name}，之卦${r.bian.name}。本卦为事之始，互卦为事之中，变卦为事之终。`));
  const tiN = (r.tiPos === '上' ? r.tiGua : r.yongGua);
  const yoN = (r.tiPos === '上' ? r.yongGua : r.tiGua);
  lines.push(L('卦德',
    `上卦${tiN.name}（${tiN.nature}）${GUA_MIAN[tiN.name] ?? ''}；下卦${yoN.name}（${yoN.nature}）${GUA_MIAN[yoN.name] ?? ''}。`,
    'neutral'));
  const relTone: InterpLine['tone'] =
    r.relationShort === '比和' || r.relationShort === '用生体' || r.relationShort === '体克用' ? 'good' : 'bad';
  lines.push(L('体用', r.relation, relTone));
  lines.push(L('动爻', `动在${r.dongYao}爻，事有变化之机，变化处看之卦。`));
  return { title: '梅花易数 · 白话解读', lines };
}

/* ═══════════ 六爻 ═══════════ */
const SHI_VERDICT: Record<string, string> = {
  兄弟: '主竞争与消耗：谋事多与同事朋友相关，易有开支；合作尚可，独行易受阻',
  妻财: '主财利：求财、经商、感情之事为重头；财旺身弱则防为财所累',
  官鬼: '主压力与是非：事业心强，也多操心劳神，防官非、疾病、小人',
  父母: '主文书与长辈：操心劳碌之象，多涉房屋、文书、长辈之事',
  子孙: '主福神与解忧：逢凶化吉，心情舒展，利医药、子女、平安',
};
const DONG_VERDICT: Record<string, string> = {
  兄弟: '兄弟爻发动，主竞争加剧或同辈介入',
  妻财: '妻财爻发动，主钱财感情之事有变化',
  官鬼: '官鬼爻发动，主压力官非疾病之事逼近',
  父母: '父母爻发动，主文书长辈房屋之事启动',
  子孙: '子孙爻发动，主福德解忧，事可化解',
  '': '无动爻，卦主安静，事未发起或宜守成',
};

export function interpretLiuYao(r: LiuYaoResult): Interp {
  const lines: InterpLine[] = [];
  const shi = r.ben.shi;
  const shiQin = r.ben.liuqin[shi - 1];
  lines.push(L('世应',
    `世爻在${['初', '二', '三', '四', '五', '上'][shi - 1]}爻，持${shiQin}；应爻在${['初', '二', '三', '四', '五', '上'][r.ben.ying - 1]}爻。世为己身，应为对方或所测之事。`));
  const sv = SHI_VERDICT[shiQin];
  if (sv) lines.push(L('世爻', sv, shiQin === '子孙' ? 'good' : shiQin === '妻财' ? 'good' : shiQin === '官鬼' ? 'bad' : 'neutral'));
  const dQin = r.moving.length ? r.ben.liuqin[r.moving[r.moving.length - 1] - 1] : '';
  const dv = DONG_VERDICT[dQin];
  if (dv) lines.push(L('动静', r.moving.length ? `动爻在${r.moving.map((m) => ['初', '二', '三', '四', '五', '上'][m - 1]).join('、')}爻（${dQin}），${dv}；之卦${r.bian?.name ?? ''}为变化后的趋势。` : dv, 'neutral'));
  if (r.bian) {
    const bianShiQin = r.bian.liuqin[r.bian.shi - 1];
    const bv = SHI_VERDICT[bianShiQin];
    if (bv && bianShiQin !== shiQin) lines.push(L('变卦', `变卦${r.bian.name}世爻持${bianShiQin}：${bv}`, 'neutral'));
  }
  return { title: '六爻 · 白话解读', lines };
}

/* ═══════════ 大六壬 ═══════════ */
const KETI_VERDICT: Record<string, string> = {
  '重审课': '下贼上，事由自身或内部引发，须反复审慎、多方商量',
  '元首课': '上克下，事由外部或尊长发起，来势直接，宜趁早处理',
  '知一课（重审）': '克神有二，取与日干同气者，事在两可之间，须识时务看趋势',
  '知一课（元首）': '克神有二，取与日干同气者，事在两可之间，须识时务看趋势',
  '涉害课': '齐克之神多、相涉为害，事有纠缠阻碍，须费周章方能定夺',
  '遥克课（蒿矢格）': '神克干，事从远方或他人处来，如蒿矢能伤远物，可成但较迂回费时',
  '遥克课（弹射格）': '干克神，己意向外投射，如弹丸击物，事发较快，宜主动出手',
  '昴星课（虎视格）': '四课无克又非别责，仰视酉上取传，静中求动，谋事迟发、防惊疑',
  '昴星课（冬蛇掩目格）': '四课无克又非别责，俯视酉下取传，事多藏匿不明，须细察内情',
  '八专课': '干支同宫、课体专一，事主单一执着，防钻牛角尖、偏听偏信',
  '别责课': '四课不全，借干支合处发传，事需借力他人、绕道而成',
  '伏吟课（自任格）': '阳日自任，凡事伏藏不动，宜守静待时、不宜妄动',
  '伏吟课（自信格）': '阴日自信，事多内省自持、循旧而行，变动有限',
  '伏吟课（用刑冲）': '伏吟用刑冲，事被牵制而不得不动，防刑伤纠葛',
  '返吟课': '月将与占时相冲，事主反复不定、往来奔波，去而复返',
  '返吟课（井栏射）': '返吟而无克，驿马发用，事主迁动往来，宜就事论事、不宜久拖',
};
const JIANG_VERDICT: Record<string, string> = {
  贵人: '贵人临初传，有人帮扶，逢凶化吉', 螣蛇: '初传见蛇，虚惊缠绕、心神不宁，防怪异之事',
  朱雀: '初传见朱雀，主口舌文书、信息往来', 六合: '初传见六合，和合喜庆，多主婚恋合作',
  勾陈: '初传见勾陈，主田土争执、拖沓纠缠', 青龙: '初传见青龙，喜庆财帛、酒食之欢',
  天空: '初传见天空，主虚诈落空，防承诺不实', 白虎: '初传见白虎，主凶速，防病伤、争斗、损失',
  太常: '初传见太常，主宴饮衣帛、饮食之事', 玄武: '初传见玄武，主盗贼暗昧，防失窃私情',
  太阴: '初传见太阴，主妇女阴私之事', 天后: '初传见天后，恩泽喜庆，多得庇佑',
};

export function interpretLiuRen(r: LiuRenResult): Interp {
  const lines: InterpLine[] = [];
  const kv = KETI_VERDICT[r.keTi] ?? null;
  if (kv) {
    const bad = /涉害|昴星|伏吟|返吟|遥克/.test(r.keTi);
    lines.push(L('课体', `${r.keTi}：${kv}`, bad ? 'bad' : 'good'));
  } else {
    lines.push(L('课体', `课体${r.keTi}，四课${r.uniqueKeCount}种，断事之纲领。`));
  }
  const chu = r.sanChuan.chuJiang;
  const jv = JIANG_VERDICT[chu];
  if (jv && !/贵人|六合|青龙|天后|太常/.test(chu)) {
    lines.push(L('初传', jv, 'bad'));
  } else if (jv) {
    lines.push(L('初传', jv, 'good'));
  }
  lines.push(L('三传',
    `初传${r.sanChuan.chuDun}${(['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'])[r.sanChuan.chu]}（${r.sanChuan.chuQin}）→ 中传${(['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'])[r.sanChuan.zhong]}（${r.sanChuan.zhongQin}）→ 末传${(['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'])[r.sanChuan.mo]}（${r.sanChuan.moQin}）。初传主事之开端，末传主事之结局。`));
  const emptyInChuan = [r.sanChuan.chuDun, r.sanChuan.zhongDun, r.sanChuan.moDun].includes('空亡');
  if (emptyInChuan) {
    lines.push(L('空亡', `旬空${r.xunKong.map((z) => ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][z]).join('、')}，三传中有空亡之神，主其段落事虚、防落空`, 'bad'));
  } else {
    lines.push(L('空亡', `旬空${r.xunKong.map((z) => ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][z]).join('、')}，为虚浮之支，所临之字主暂不成。`));
  }
  return { title: '大六壬 · 白话解读', lines };
}

/* ═══════════ 金口诀 ═══════════ */
const EL_FULL: Record<string, string> = { 木: '木', 火: '火', 土: '土', 金: '金', 水: '水' };

export function interpretJinKouJue(r: JinKouJueResult): Interp {
  const lines: InterpLine[] = [];
  lines.push(L('课体',
    `${r.difen}方问事。人元主外情官禄、贵神主福禄贵人、将神主自身妻财、地分主家宅田园。`));
  const g = EL_FULL[r.guishen.el] ?? '', j = EL_FULL[r.jiangshen.el] ?? '';
  let rel: string; let tone: InterpLine['tone'];
  if (g === j) { rel = `贵神（${g}）与将神（${j}）比和，同类同气，谋事平稳、助力相当`; tone = 'good'; }
  else if (SHENG[g] === j) { rel = `贵神（${g}）生将神（${j}），外有贵人助力，于我有利`; tone = 'good'; }
  else if (SHENG[j] === g) { rel = `将神（${j}）生贵神（${g}），我泄于外，费力耗神、宜量入为出`; tone = 'bad'; }
  else if (KE[g] === j) { rel = `贵神（${g}）克将神（${j}），外势压身，防人掣肘、谋事多阻`; tone = 'bad'; }
  else { rel = `将神（${j}）克贵神（${g}），我对外有主动权，事须费力、可成`; tone = 'neutral'; }
  lines.push(L('贵将', rel, tone));
  if (r.bigKong) lines.push(L('大空', `四大空亡为${r.bigKong}，所值主虚耗落空`, 'bad'));
  if (r.kong.includes(r.guishen.zhi)) lines.push(L('空亡', `贵神${r.guishen.star}临旬空（${r.kong.join('')}），主贵人助力不足、外援虚浮`, 'bad'));
  else if (r.kong.includes(r.jiangshen.zhi)) lines.push(L('空亡', `将神${r.jiangshen.star}临旬空（${r.kong.join('')}），主自身谋事落空、虚而不实`, 'bad'));
  return { title: '金口诀 · 白话解读', lines };
}

/* ═══════════ 奇门遁甲 ═══════════ */
const GONG_NAMES = ['', '坎', '坤', '震', '巽', '中', '乾', '兑', '艮', '离'];
const DOOR_MEAN: Record<string, string> = {
  休: '休门主休养生息、宜静待时', 生: '生门为吉门，利求财谋生、生机在望', 开: '开门主开创通行，利开工、远行、谋新事',
  伤: '伤门主损伤，防外伤争斗、当心破财', 杜: '杜门主闭塞不通，宜守门路、不与硬闯', 景: '景门主文书火光、消息传闻',
  死: '死门主阻滞不通，诸事宜避不宜行', 惊: '惊门主惊恐口舌，防官非、言语惹祸',
};
const STAR_MEAN: Record<string, string> = {
  蓬: '天蓬主盗贼、灵活多变', 芮: '天芮主病弱、迟缓', 冲: '天冲主冲动、行动力强', 辅: '天辅主文书文化、辅佐之人',
  禽: '天禽居中守正，主环境安定', 心: '天心主医药、谋略心机', 柱: '天柱主口舌、毁折', 任: '天任主任劳耐性、稍显固执', 英: '天英主急躁、火爆、声势在外',
};

export function interpretQimen(r: QimenResult): Interp {
  const lines: InterpLine[] = [];
  lines.push(L('局式', `${r.yang ? '阳遁' : '阴遁'}${Math.abs(r.ju)}局，${r.xunShou}时。阳遁主顺、对外进取；阴遁主静、宜内敛守成。`, r.yang ? 'good' : 'neutral'));
  const door1 = DOOR_MEAN[r.zhishi.door];
  if (door1) {
    const bad = /伤|死|惊/.test(r.zhishi.door);
    lines.push(L('值使门', `值使「${r.zhishi.door}门」落${GONG_NAMES[r.zhishi.house]}宫：${door1}。值使主人事执行、当下所为。`, bad ? 'bad' : 'good'));
  }
  const star1 = STAR_MEAN[r.zhifu.star];
  if (star1) {
    const bad = /蓬|芮|柱/.test(r.zhifu.star);
    lines.push(L('值符星', `值符「${r.zhifu.star}星」落${GONG_NAMES[r.zhifu.house]}宫：${star1}。值符主大局主事、统领全局。`, bad ? 'bad' : 'good'));
  }
  return { title: '奇门遁甲 · 白话解读', lines };
}

/* ═══════════ 紫微斗数 ═══════════ */
const MAIN_STAR: Record<string, string> = {
  紫微: '帝座主星，尊贵爱面子，重视地位名声', 天机: '智慧星，心思机敏、好动善变', 太阳: '光明之星，慷慨磊落、喜掌权发光',
  武曲: '正财星，刚毅果决、理财务实', 天同: '福星，随和安逸、乐天知命', 廉贞: '次桃花，才情与诱惑并存、性烈',
  天府: '库星，稳重保守、善守成蓄财', 太阴: '母星田宅，温柔细腻、主财帛收藏', 贪狼: '才艺桃花星，欲望强、人缘广',
  巨门: '口舌星，善辩亦多是非、性暗', 天相: '印星，温和正直、善协调辅佐', 天梁: '荫星寿星，逢凶化吉、老成持重',
  七杀: '肃杀之星，冲劲大、敢作敢当', 破军: '破耗变动之星，先破后立、宜动不宜静', 禄存: '财星，守财之禄、稳重积蓄',
  文昌: '文星，文书才艺、科甲出名', 文曲: '才艺星，口才艺术、偏门才学', 左辅: '助力之星，得朋友同辈相助',
  右弼: '助力之星，得贵人暗中辅助', 火星: '急躁冲动之星，来得快去得快', 铃星: '突发之星，主意外事端',
  擎羊: '刑伤之星，主竞争与锐气', 陀罗: '迟滞纠缠之星，好事多磨', 天马: '驿马星，主变动迁移、动中生财',
  天魁: '贵人星，功名科举有贵人提携', 天钺: '贵人星，多得异性贵人相助',
};
const SIHUA_MEAN: Record<string, string> = { 禄: '主得财喜、顺遂进益', 权: '主掌权、事业进取', 科: '主名声文贵、斯文化解', 忌: '主损耗压力、需留意' };

export function interpretZiwei(r: ZiweiResult): Interp {
  const lines: InterpLine[] = [];
  const mingStars = Object.entries(r.stars).filter(([, z]) => z === r.minggong).map(([s]) => s);
  if (mingStars.length) {
    const descs = mingStars
      .map((s) => { const d = MAIN_STAR[s]; return d ? `${s}：${d}` : null; })
      .filter(Boolean) as string[];
    if (descs.length) lines.push(L('命宫主星', descs.join('；'), 'neutral'));
  }
  if (r.sihua.length) {
    lines.push(L('四化',
      r.sihua.map((x) => `${x.star}化${x.hua}（${SIHUA_MEAN[x.hua] ?? ''}）`).join('；'),
      r.sihua.some((x) => x.hua === '忌') ? 'bad' : 'good'));
  }
  lines.push(L('身宫', `身宫在${r.shengong}，主后天努力与处世方式所在；命宫看先天格局，身宫看后天作为。`));
  const fu = r.palaces['福德'] ?? null;
  if (fu) lines.push(L('福德', `福德宫在${fu}，主内心福分与精神享受，是为人之底色。`));
  return { title: '紫微斗数 · 白话解读', lines };
}

/* ═══════════ 八字 ═══════════ */
const SHISHEN_PERSON: Record<string, string> = {
  比肩: '自主自立、朋友多，合作中能独当一面', 劫财: '好胜心强、敢冲敢抢，防破财',
  食神: '福气口福、才艺温和，乐观享福', 伤官: '聪明外露、创意强，不喜受管',
  偏财: '大方多财路，投资理财有眼光', 正财: '务实守正、精打细算，求稳',
  七杀: '果敢有魄力、抗压强，宜竞争性岗位', 正官: '正直守规、重名誉，适合管理',
  偏印: '钻研心重、喜独处思考，偏门学术', 正印: '重学业长辈、慈爱包容，得庇护',
};

export function interpretBazi(bz: BaziResult): Interp {
  const lines: InterpLine[] = [];
  const day = bz.pillars.Day;
  lines.push(L('日主', `日主${day.gan}（属${day.gan === '甲' || day.gan === '乙' ? '木' : day.gan === '丙' || day.gan === '丁' ? '火' : day.gan === '戊' || day.gan === '己' ? '土' : day.gan === '庚' || day.gan === '辛' ? '金' : '水'}），为命主自身，四柱皆围绕日主论生克。`));
  // 五行分布统计（天干全算，藏干折半）
  const wc: Record<string, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  (['Year', 'Month', 'Day', 'Hour'] as const).forEach((k) => {
    const p = bz.pillars[k];
    const wxOf = (gan: string): string => (gan === '甲' || gan === '乙') ? '木' : (gan === '丙' || gan === '丁') ? '火' : (gan === '戊' || gan === '己') ? '土' : (gan === '庚' || gan === '辛') ? '金' : '水';
    wc[wxOf(p.gan)] += 1;
    p.hidden.forEach((h) => { wc[wxOf(h.gan)] += 0.5; });
  });
  const sorted = Object.entries(wc).sort((a, b) => b[1] - a[1]);
  const [topWx, topN] = sorted[0];
  lines.push(L('五行', `五行分布：${sorted.map(([w, n]) => `${w}${n}`).join('　')}。${topWx}最旺，为命局主气。`, 'neutral'));
  // 十神最多者（天干十神统计）
  const sCnt: Record<string, number> = {};
  (['Year', 'Month', 'Hour'] as const).forEach((k) => {
    const ss = bz.pillars[k].shishen;
    if (ss) sCnt[ss] = (sCnt[ss] ?? 0) + 1;
  });
  const dominant = Object.entries(sCnt).sort((a, b) => b[1] - a[1])[0];
  if (dominant) {
    const sv = SHISHEN_PERSON[dominant[0]];
    if (sv) lines.push(L('十神', `命局以${dominant[0]}为显（${dominant[1]}柱）：${sv}`, dominant[0] === '七杀' || dominant[0] === '劫财' ? 'bad' : dominant[0] === '正印' || dominant[0] === '食神' || dominant[0] === '正财' ? 'good' : 'neutral'));
  }
  lines.push(L('大运', `${bz.yun.startDesc}（${bz.yun.startTime.slice(0, 10)}交运），首步大运${bz.yun.list[0]?.pillar ?? ''}（${bz.yun.list[0]?.startAge ?? ''}岁起）。大运主十年一运的人生阶段。`));
  return { title: '八字 · 白话解读', lines };
}