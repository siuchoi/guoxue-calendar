// 梅花易数回归：对照 metaphysics-steward test_meihua_regression.py 的 4 组用例
const { qiGuaByNumbers, qiGuaByTime } = require('../../.test/meihua.cjs');

let ok = 0, fail = 0;
const check = (name, got, exp) => {
  if (got === exp) ok++;
  else { fail++; console.log(`FAIL ${name}: got=${got} expect=${exp}`); }
};

// N1: 数字起卦 [1,8,6] → 天地否/风山渐/泽地萃，体坤用乾
let a = qiGuaByNumbers(1, 8, 6);
check('N1 本卦', a.ben.name, '天地否');
check('N1 互卦', a.hu.name, '风山渐');
check('N1 变卦', a.bian.name, '泽地萃');
check('N1 动爻', a.dongYao, 6);
check('N1 体', a.tiGua.name, '坤');
check('N1 用', a.yongGua.name, '乾');

// N2: 数字起卦 [3,2,2] → 火泽睽，动2，体离用兑，互水火既济
a = qiGuaByNumbers(3, 2, 2);
check('N2 本卦', a.ben.name, '火泽睽');
check('N2 动爻', a.dongYao, 2);
check('N2 体', a.tiGua.name, '离');
check('N2 用', a.yongGua.name, '兑');
check('N2 互卦', a.hu.name, '水火既济');

// T2: 时间起卦 1990-05-08 12:00（庚午年四月十四午时）→ 上乾下坤动2
a = qiGuaByTime(6, 4, 14, 6); // 午=index6（子=0）
check('T2 本卦', a.ben.name, '天地否');
check('T2 动爻', a.dongYao, 2);
check('T2 体', a.tiGua.name, '乾');
check('T2 用', a.yongGua.name, '坤');

// T1: 2026-09-12 12:00 丙午年八月初二午时 → 上乾下坤动6
a = qiGuaByTime(6, 8, 2, 6);
check('T1 本卦', a.ben.name, '天地否');
check('T1 互卦', a.hu.name, '风山渐');
check('T1 变卦', a.bian.name, '泽地萃');
check('T1 体', a.tiGua.name, '坤');

console.log(`\n梅花回归: ${ok} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
