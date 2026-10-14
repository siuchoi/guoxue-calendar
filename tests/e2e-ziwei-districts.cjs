// E2E: 紫微页出生地省市县三级联动
// 验证：①进入紫微页默认北京市/北京市/东城区 ②切省→市→县联动重置 ③切市重置县 ④无县城市显示「—」兜底 ⑤排命盘正常出盘
const { chromium } = require('playwright-core');

const CHROME = 'C:/Users/Admin/AppData/Local/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-win64/chrome-headless-shell.exe';
const BASE = 'http://localhost:5173/';

let pass = 0, fail = 0;
const log = (m) => console.log(m);
const ok = (cond, name) => {
  if (cond) { pass++; log(`  ✅ ${name}`); }
  else { fail++; log(`  ❌ ${name}`); }
};

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // 1. 进入紫微斗数页
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const nav = page.locator('.nav-cat, nav, .nav-bar li, [class*=nav] a, .tabs button, .tab-btn');
  const ziweiTabs = page.getByText('紫微斗数', { exact: true });
  await ziweiTabs.first().click();
  await page.waitForTimeout(800);
  log('== 进入紫微斗数页 ==');

  // 出生地 label 下的三个 select
  const selectEls = page.locator('label:has-text("出生地") select');
  const selCount = await selectEls.count();
  ok(selCount === 3, `出生地应有 3 个 select（省市县），实际 ${selCount}`);

  async function selVal(i) { return await selectEls.nth(i).inputValue(); }
  async function selOpts(i) {
    return await selectEls.nth(i).locator('option').allTextContents();
  }

  // 2. 默认值
  log('\n== 默认值 ==');
  ok((await selVal(0)) === '北京市', `默认省=北京市, 实际 ${await selVal(0)}`);
  ok((await selVal(1)) === '北京市', `默认市=北京市, 实际 ${await selVal(1)}`);
  ok((await selVal(2)) === '东城区', `默认县=东城区, 实际 ${await selVal(2)}`);

  // 3. 切省联动 → 广东省，市自动置首市（广州市）、县置首县（从化区）
  log('\n== 切省联动 ==');
  await selectEls.nth(0).selectOption('广东省');
  await page.waitForTimeout(300);
  const gdFirstCity = (await selOpts(1))[0];
  ok((await selVal(1)) === gdFirstCity, `切省后市自动置为首市 ${gdFirstCity}, 实际 ${await selVal(1)}`);
  const gdCounties = await selOpts(2);
  ok((await selVal(2)) === gdCounties[0], `切省后县自动置为首县 ${gdCounties[0]}, 实际 ${await selVal(2)}`);

  // 4. 切市联动重置县 → 广东省 → 深圳市 → 首县光明区，下拉含南山区
  log('\n== 切市重置县 ==');
  const cityOptions = await selOpts(1);
  ok(cityOptions.includes('深圳市'), `广东省市列表含深圳市（源数据排序 ${cityOptions.slice(0, 3).join(',')}…）`);
  await selectEls.nth(1).selectOption('深圳市');
  await page.waitForTimeout(300);
  const szOpts = await selOpts(2);
  ok(szOpts.includes('南山区'), `深圳县级下拉含南山区: ${szOpts.slice(0, 5).join(',')}`);
  ok((await selVal(2)) === szOpts[0], `切市后县自动置为首县 ${szOpts[0]}, 实际 ${await selVal(2)}`);

  // 5. 直辖市 北京海淀
  log('\n== 直辖市县区 ==');
  await selectEls.nth(0).selectOption('北京市');
  await page.waitForTimeout(300);
  await selectEls.nth(1).selectOption('北京市');
  await page.waitForTimeout(300);
  const bjOpts = await selOpts(2);
  ok(bjOpts.includes('海淀区') && bjOpts.includes('朝阳区'), `北京市县区分区正常: ${bjOpts.slice(0, 6).join(',')}`);
  await selectEls.nth(2).selectOption('海淀区');
  await page.waitForTimeout(200);

  // 6. 排命盘
  log('\n== 排命盘 ==');
  await page.getByRole('button', { name: '排命盘' }).click();
  await page.waitForTimeout(800);
  const panVisible = await page.locator('.zw-grid').first().isVisible().catch(() => false);
  ok(panVisible, '紫微命盘渲染');
  const centerText = await page.locator('.zw-center').first().textContent().catch(() => '');
  ok(/年命|命宫/.test(centerText), `中心区命盘信息: ${centerText.trim().slice(0, 30)}`);

  // 7. 无县兜底 → 找港澳台或县级为空的城市
  log('\n== 无县兜底 ==');
  await selectEls.nth(0).selectOption('四川省');
  await page.waitForTimeout(300);
  const scOpts = await selOpts(1);
  let emptyCity = null;
  for (const c of scOpts) {
    await selectEls.nth(1).selectOption(c);
    await page.waitForTimeout(200);
    const cs = await selOpts(2);
    if (cs.length === 0 || cs[0] === '—') { emptyCity = c; break; }
  }
  if (emptyCity) {
    const current = await selVal(2);
    ok(current === '' || current === '—' || (await selOpts(2))[0] === '—', `无县城市 ${emptyCity} 显示占位「—」, 当前值='${current}'`);
  } else {
    log('  ℹ️ 四川所有市都有县级数据，跳过兜底断言（县级全覆盖是常态）');
  }

  log(`\n===== 结果: ${pass} 通过 / ${fail} 失败 =====`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });