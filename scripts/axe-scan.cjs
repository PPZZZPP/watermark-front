/* eslint-disable */
// Simple Axe MCP-style scan runner using puppeteer + axe-core
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function main() {
  const url = process.env.AXE_URL || 'http://localhost:3000';
  const out = process.env.AXE_OUT || 'axe-report.json';
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  // Inject axe
  const axePath = require.resolve('axe-core/axe.min.js');
  await page.addScriptTag({ path: axePath });
  const results = await page.evaluate(async () => {
    return await window.axe.run(document, {
      resultTypes: ['violations', 'incomplete'],
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    });
  });
  fs.writeFileSync(path.resolve(process.cwd(), out), JSON.stringify(results, null, 2), 'utf-8');
  console.log(`Axe scan completed. Report -> ${out}`);
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


