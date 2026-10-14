// 奇门遁甲黄金回归（语料转自 metaphysics-steward test_qimen_golden.py，MIT）
const fs = require('fs');
const path = require('path');
const { paiQimen } = require('../../.test/qimen');

const cases = JSON.parse(fs.readFileSync(path.join(__dirname, 'golden.json'), 'utf-8')).cases;

let pass = 0;
const fails = [];
for (const c of cases) {
  const [y, m, d, h, eJu, eYang, eXun, eZfs, eZfh, eZsd, eZsh, eGrid, eD5] = c;
  try {
    const r = paiQimen(new Date(y, m - 1, d, h, 0));
    const errs = [];
    if (r.ju !== eJu) errs.push(`局${r.ju}≠${eJu}`);
    if (r.yang !== eYang) errs.push(`阳遁${r.yang}≠${eYang}`);
    if (r.xunShou !== eXun) errs.push(`旬首${r.xunShou}≠${eXun}`);
    if (r.zhifu.star !== eZfs || r.zhifu.house !== eZfh) errs.push(`值符${r.zhifu.star}${r.zhifu.house}≠${eZfs}${eZfh}`);
    if (r.zhishi.door !== eZsd || r.zhishi.house !== eZsh) errs.push(`值使${r.zhishi.door}${r.zhishi.house}≠${eZsd}${eZsh}`);
    for (const [hk, [eg, es, ed, et, edp]] of Object.entries(eGrid)) {
      const g = r.grid[Number(hk)];
      if (!g) { errs.push(`宫${hk}缺失`); continue; }
      if (g.god !== eg) errs.push(`宫${hk}神${g.god}≠${eg}`);
      if (g.star !== es) errs.push(`宫${hk}星${g.star}≠${es}`);
      if (g.door !== ed) errs.push(`宫${hk}门${g.door}≠${ed}`);
      if (g.tgan !== et) errs.push(`宫${hk}天盘${g.tgan}≠${et}`);
      if (g.dgan !== edp) errs.push(`宫${hk}地盘${g.dgan}≠${edp}`);
    }
    if (r.grid[5].dgan !== eD5) errs.push(`中宫地盘${r.grid[5].dgan}≠${eD5}`);
    if (errs.length === 0) pass++;
    else fails.push(`${y}-${m}-${d} ${h}时: ${errs.slice(0, 6).join(' ')}${errs.length > 6 ? ` …共${errs.length}项` : ''}`);
  } catch (e) {
    fails.push(`${y}-${m}-${d} ${h}时: ERROR ${e.message}`);
  }
}
console.log(`\n通过 ${pass} / ${cases.length}`);
fails.slice(0, 10).forEach((f) => console.log(' ', f));
process.exit(fails.length ? 1 : 0);
