// E2E：验证神煞警示区新文案格式（去 @ 符号，带白话解释）
const { chromium } = require('playwright-core');
const CHROME = 'C:/Users/Admin/AppData/Local/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-win64/chrome-headless-shell.exe';

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });

  // 进入合婚模式
  await page.click('nav.tabs button:has-text("八字合婚")');
  await page.waitForTimeout(400);
  await page.locator('.mh-mode button').filter({ hasText: '合婚' }).click();
  await page.waitForTimeout(400);
  await page.click('.ly-cast-btn:has-text("合婚")');
  await page.waitForTimeout(700);

  // 找神煞警示卡片
  const shenshaCard = page.locator('.hh-section').filter({ has: page.locator('.section-title', { hasText: '神煞警示' }) });
  const exists = await shenshaCard.count();
  console.log('神煞警示卡片存在:', exists > 0);

  if (exists) {
    const text = await shenshaCard.textContent();
    console.log('--- 神煞警示全文 ---');
    console.log(text);

    // 断言（通用格式：神煞名（柱位）：白话解释）
    const hasAt = /@[^\s]/.test(text);
    const hasParen = /[一-龥]+（[日月年时][支柱]）：/.test(text);
    const hasDetail = /：/.test(text) && /主|婚缘|性刚|临|现于|日/.test(text);
    console.log('\n断言:');
    console.log('  无 @ 符号:', !hasAt ? 'PASS' : 'FAIL');
    console.log('  有（柱位）标注:', hasParen ? 'PASS' : 'FAIL');
    console.log('  带白话解释(detail):', hasDetail ? 'PASS' : 'FAIL');
    process.exit(hasAt || !hasParen || !hasDetail ? 1 : 0);
  } else {
    console.log('未找到神煞警示卡片');
    process.exit(1);
  }
})().catch((e) => { console.error('ERROR:', e.message); process.exit(2); });