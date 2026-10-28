// Scoped regression: editorial Studio headings share the same left content edge.
// Three storyboard chapter headings remain left-aligned within their columns.
const { chromium } = require(process.env.SHOWSET_PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const base = process.env.SHOWSET_BASE_URL || 'http://127.0.0.1:3001';
const checks = [];
const check = (name, pass, data) => { checks.push({name,pass:!!pass,data});console.log(pass?'PASS':'FAIL',name,data??''); };
(async () => {
  const browser = await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL || 'chromium',headless:true});
  try {
    for (const width of [320,390,768,1024,1440,1920]) {
      const page = await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
      await page.goto(base+'/our-studio/');
      await page.waitForSelector('.view.is-current[data-view="studio"] [data-studio-hero-first] h1');
      await page.evaluate(() => document.fonts.ready);
      const result = await page.evaluate(() => {
        const root = document.querySelector('.view.is-current[data-view="studio"]');
        const selectors = [
          ['hero first', '[data-studio-hero-first] h1'],
          ['hero follow', '[data-studio-hero-follow] h2'],
          ['company', '.studio-manifesto h2'],
          ['storyboard', '.studio-exploration-intro h2'],
          ['capabilities', '.studio-outlook h2'],
          ['closing', '.studio-final h2'],
        ];
        const lefts = selectors.map(([name,selector]) => {
          const node = root.querySelector(selector);
          if (!node) return {name,error:'missing'};
          const rect=node.getBoundingClientRect();
          return {name,left:rect.left,textAlign:getComputedStyle(node).textAlign,text:node.textContent.trim()};
        });
        const chapters=[...root.querySelectorAll('.studio-storyboard-copy h3')].map(node => ({
          textAlign:getComputedStyle(node).textAlign,
          left:node.getBoundingClientRect().left,
          content:node.textContent.trim(),
        }));
        const rootStyle=getComputedStyle(root);
        return {lefts,chapters,expected:parseFloat(rootStyle.getPropertyValue('--studio-heading-left')),overflow:document.documentElement.scrollWidth-innerWidth};
      });
      const lefts = result.lefts;
      check('Full-width Studio headings share left edge @'+width,
        lefts.length===6 && lefts.every(v=>!v.error && v.textAlign==='left' && Math.abs(v.left-lefts[0].left)<=2.1),
        {expected:result.expected,lefts});
      check('All Studio triptych chapter headings are left-aligned @'+width,
        result.chapters.length===3 && result.chapters.every(h=>h.textAlign==='left' && h.content),
        result.chapters);
      check('Studio avoids horizontal overflow @'+width,result.overflow<=1,result.overflow);
      await page.close();
    }
  } finally {
    await browser.close();
    fs.mkdirSync('qa-results',{recursive:true});
    fs.writeFileSync('qa-results/studio-heading-alignment.json',JSON.stringify(checks,null,2));
    if(checks.some(x=>!x.pass))process.exitCode=1;
  }
})().catch(err=>{console.error(err);process.exitCode=1});
