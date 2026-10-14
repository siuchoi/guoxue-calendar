// 紫微斗数黄金回归（语料转自 metaphysics-steward test_ziwei_golden.py，MIT）
const fs = require('fs');
const path = require('path');
const { paiZiwei } = require('../../.test/ziwei');

const cases = JSON.parse(fs.readFileSync(path.join(__dirname, 'golden.json'), 'utf-8')).cases;

let pass = 0;
const fails = [];
for (const c of cases) {
  const [y, m, d, hm] = [c.input.slice(0, 4), c.input.slice(5, 7), c.input.slice(8, 10), c.input.slice(11)].map((s, i) => i < 3 ? parseInt(s, 10) : s);
  const [hh, mm] = hm.split(':').map(Number);
  try {
    const r = paiZiwei(new Date(y, m - 1, d, hh, mm), c.lon);
    const errs = [];
    if (r.minggong !== c.minggong) errs.push(`命宫${r.minggong}≠${c.minggong}`);
    if (r.shengong !== c.shengong) errs.push(`身宫${r.shengong}≠${c.shengong}`);
    if (r.ju !== c.ju) errs.push(`局${r.ju}≠${c.ju}`);
    if (r.mingzhu !== c.mingzhu) errs.push(`命主${r.mingzhu}≠${c.mingzhu}`);
    if (r.shenzhu !== c.shenzhu) errs.push(`身主${r.shenzhu}≠${c.shenzhu}`);
    for (const [star, zhi] of Object.entries(c.stars)) {
      if (r.stars[star] !== zhi) errs.push(`${star}${r.stars[star]}≠${zhi}`);
    }
    if (errs.length === 0) pass++;
    else fails.push(`${c.input}: ${errs.join(' ')}`);
  } catch (e) {
    fails.push(`${c.input}: ERROR ${e.message}`);
  }
}
console.log(`\n通过 ${pass} / ${cases.length}`);
fails.slice(0, 10).forEach((f) => console.log(' ', f));
process.exit(fails.length ? 1 : 0);
