// 金口诀黄金回归（语料转自 metaphysics-steward test_jinkoujue_golden.py，MIT）
const fs = require('fs');
const path = require('path');
const { paiJinKouJue } = require('../../.test/jinkoujue');

const cases = JSON.parse(fs.readFileSync(path.join(__dirname, 'golden.json'), 'utf-8')).cases;

let pass = 0;
const fails = [];
for (const c of cases) {
  const [y, m, d, h, mi, difen, exp] = c;
  const [eYj, eK1, eK2, eBk, eDay, eHour, eRy, eGsG, eGsZ, eGsS, eJsG, eJsZ, eJsS] = exp;
  try {
    const r = paiJinKouJue(new Date(y, m - 1, d, h, mi), difen);
    const got = [
      r.yueJiang, r.kong[0], r.kong[1], r.bigKong,
      r.dayGan + r.dayZhi, r.hourGan + r.hourZhi,
      r.renyuan.gan, r.guishen.gan, r.guishen.zhi, r.guishen.star,
      r.jiangshen.gan, r.jiangshen.zhi, r.jiangshen.star,
    ];
    const expArr = [eYj, eK1, eK2, eBk, eDay, eHour, eRy, eGsG, eGsZ, eGsS, eJsG, eJsZ, eJsS];
    if (JSON.stringify(got) === JSON.stringify(expArr)) pass++;
    else {
      const diffs = expArr.map((e, i) => (e !== got[i] ? `[${i}]${got[i]}≠${e}` : null)).filter(Boolean);
      fails.push(`${y}-${m}-${d} ${h}:${mi} ${difen}: ${diffs.join(' ')}`);
    }
  } catch (e) {
    fails.push(`${y}-${m}-${d} ${difen}: ERROR ${e.message}`);
  }
}
console.log(`\n通过 ${pass} / ${cases.length}`);
if (fails.length) {
  console.log('失败明细（前 12 条）:');
  fails.slice(0, 12).forEach((f) => console.log(' ', f));
}
process.exit(fails.length ? 1 : 0);
