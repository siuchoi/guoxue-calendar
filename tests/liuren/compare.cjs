// 黄金语料来源：https://github.com/superzhang21/metaphysics-steward (MIT)
// 大六壬引擎全量回归：对照 metaphysics-steward 144 条黄金案例
const fs = require('fs');
const { paiLiuRen, ZHI, GAN } = require('../../.test/liuren');

const GOLDEN = JSON.parse(fs.readFileSync(__dirname + '/golden144.json', 'utf-8'));

// 六十甲子序号
function jiaziIndex(gz) {
  for (let i = 0; i < 60; i++) if (GAN[i % 10] === gz[0] && ZHI[i % 12] === gz[1]) return i;
  return -1;
}

// 课型粗分类映射：我们的细分名 → 黄金语料类名
function coarse(keTi) {
  if (keTi.includes('井栏')) return '井栏';
  if (keTi.startsWith('元首') || keTi.startsWith('重审')) return '贼克';
  if (keTi.startsWith('知一')) return '比用';
  if (keTi.startsWith('涉害')) return '涉害';
  if (keTi.startsWith('遥克')) return '遥克';
  if (keTi.startsWith('伏吟')) return '伏吟';
  if (keTi.startsWith('返吟')) return '返吟';
  if (keTi.startsWith('八专')) return '八专';
  if (keTi.startsWith('昴星')) return '昴星';
  if (keTi.startsWith('别责')) return '别责';
  return keTi;
}

const QIN_SHORT = { 兄弟: '比', 妻财: '财', 官鬼: '官', 父母: '父', 子孙: '子' };
const JIANG_SHORT = { 贵人: '贵', 螣蛇: '蛇', 朱雀: '雀', 六合: '合', 勾陈: '勾', 青龙: '龙', 天空: '空', 白虎: '虎', 太常: '常', 玄武: '玄', 太阴: '阴', 天后: '后' };

let pass = 0, fail = 0;
const diffs = [];

GOLDEN.forEach((g, ci) => {
  const [y, m, d, zs, yueJiang, xunKong, dayGZ, zhanZhi, sanChuan, keTi, chuans, sike] = g;
  const r = paiLiuRen({
    dayGanZhiIndex: jiaziIndex(dayGZ),
    zhanShiZhi: ZHI.indexOf(zhanZhi),
    yueJiang: ZHI.indexOf(yueJiang),
  });
  const label = `#${ci + 1} ${y}-${m}-${d} ${dayGZ}日${zhanZhi}时${yueJiang}将`;
  const errs = [];

  // 三传
  const mySC = [r.sanChuan.chu, r.sanChuan.zhong, r.sanChuan.mo].map((z) => ZHI[z]).join('');
  if (mySC !== sanChuan) errs.push(`三传 我=${mySC} 金=${sanChuan}`);
  // 课型
  const myKT = coarse(r.keTi);
  if (myKT !== keTi) errs.push(`课型 我=${r.keTi}(${myKT}) 金=${keTi}`);
  // 空亡
  const myXK = r.xunKong.map((z) => ZHI[z]).join('');
  if (myXK !== xunKong) errs.push(`空亡 我=${myXK} 金=${xunKong}`);
  // 逐传：六亲/遁干/空/天将
  const myChuans = [
    { qin: r.sanChuan.chuQin, dun: r.sanChuan.chuDun, zhi: r.sanChuan.chu, jiang: r.sanChuan.chuJiang },
    { qin: r.sanChuan.zhongQin, dun: r.sanChuan.zhongDun, zhi: r.sanChuan.zhong, jiang: r.sanChuan.zhongJiang },
    { qin: r.sanChuan.moQin, dun: r.sanChuan.moDun, zhi: r.sanChuan.mo, jiang: r.sanChuan.moJiang },
  ];
  chuans.forEach((c, i) => {
    const [gQin, gDun, gZhi, gKong, gJiang] = c;
    const my = myChuans[i];
    if (ZHI[my.zhi] !== gZhi) return; // 支不同已在三传报过
    if (QIN_SHORT[my.qin] !== gQin) errs.push(`传${i + 1}六亲 我=${my.qin} 金=${gQin}`);
    const myKong = r.xunKong.includes(my.zhi);
    if (myKong !== gKong) errs.push(`传${i + 1}空 我=${myKong} 金=${gKong}`);
    if (gDun === '' ? my.dun !== '空亡' : my.dun !== gDun) errs.push(`传${i + 1}遁干 我=${my.dun} 金=${gDun || '(空)'}`);
    if (JIANG_SHORT[my.jiang] !== gJiang) errs.push(`传${i + 1}天将 我=${my.jiang} 金=${gJiang}`);
  });
  // 四课
  sike.forEach((k, i) => {
    const [gUp, gDown] = k;
    const my = r.siKe[i];
    if (ZHI[my.up] !== gUp) errs.push(`课${i + 1}上神 我=${ZHI[my.up]} 金=${gUp}`);
    const myDown = my.isGan ? GAN[r.dayGan] : ZHI[my.down];
    if (myDown !== gDown) errs.push(`课${i + 1}下神 我=${myDown} 金=${gDown}`);
  });

  if (errs.length) { fail++; diffs.push(label + '\n    ' + errs.join('\n    ')); }
  else pass++;
});

console.log(`\n===== 回归结果: ${pass}/${GOLDEN.length} 通过, ${fail} 失败 =====`);
if (diffs.length) {
  console.log('\n--- 差异明细（前 25 条）---');
  diffs.slice(0, 25).forEach((d) => console.log(d));
}
