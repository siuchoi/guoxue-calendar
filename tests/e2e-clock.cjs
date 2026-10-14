// E2E: 地支时钟节气环 + 小时数字 截图验证
const { chromium } = require('playwright-core');
const CHROME = 'C:/Users/Admin/AppData/Local/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-win64/chrome-headless-shell.exe';

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message));
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.locator('nav button', { hasText: '地支时钟' }).first().click();
  await page.waitForTimeout(600);

  // 断言：节气文字与小时数字已渲染
  const svgText = await page.locator('.dial-wrap svg').first().innerHTML();
  const checks = ['寒露', '冬至', '夏至', '>00<', '>11<', '>13<', '>23<'];
  let fail = 0;
  for (const c of checks) {
    const has = svgText.includes(c);
    console.log(`  ${has ? 'PASS' : 'FAIL'} 表盘含 ${c.replace(/[><]/g, '')}`);
    if (!has) fail++;
  }
  // 底部信息栏含节气
  const readout = await page.locator('.time-readout').textContent();
  const hasJQ = /寒露|霜降|立冬/.test(readout);
  console.log(`  ${hasJQ ? 'PASS' : 'FAIL'} 底部信息栏含节气: ${readout.trim().slice(0, 60)}`);
  if (!hasJQ) fail++;

  await page.screenshot({ path: 'tests/shots/clock-jieqi.png', fullPage: false });
  await browser.close();
  console.log(fail ? `\n${fail} 项失败` : '\n全部通过');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
