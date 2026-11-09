// First-period title-break and canonical Amaze-Ball copy parity across
// Home, Our Work and related case-study cards at phone and desktop sizes.
const { chromium } = require(process.env.SHOWSET_PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.SHOWSET_BASE_URL || 'http://127.0.0.1:3001';
const fs=require('node:fs');
const copy='Look and feel, décor, furniture, entertainment, technical production and live coverage for a padel tournament with purpose.';
const results=[];
function check(label,condition,details) {
  const result={label,pass:!!condition,details};
  results.push(result);console.log(result.pass?'PASS':'FAIL',label,details||'');
}
async function titleLines(card,selector) {
  return card.locator(selector).evaluateAll(elements=>elements.map(el=>({
    text:el.textContent.trim().replace(/\s+/g,' '),
    y:el.getBoundingClientRect().top
  })));
}
(async()=>{
  const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chromium',headless:true});
  try {
    for(const width of [390,768,1440]){
      const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
      await page.goto(base+'/');
      await page.waitForSelector('.concept-12-root[data-concept-ready="true"]');
      const home=page.locator('#case-rail > [data-case-slide][href="/work/the-amaze-ball/"]');
      const homeLines=await titleLines(home,'h3 > .case-title-line');
      check('Home title breaks after first period @'+width,
        homeLines.length===2&&homeLines[0].text==='A grand slam.'&&
        homeLines[1].text==='A greater cause.'&&homeLines[1].y>homeLines[0].y+5,homeLines);
      check('Home Amaze-Ball description @'+width,
        (await home.locator('.case-story p').innerText()).trim()===copy);
      await page.goto(base+'/our-work/');
      await page.waitForSelector('.case-index-item');
      const work=page.locator('.case-index-item[href="/work/the-amaze-ball/"]');
      const workLines=await titleLines(work,'h2 > .case-title-line');
      check('Our Work title breaks after first period @'+width,
        workLines.length===2&&workLines[0].text==='A grand slam.'&&
        workLines[1].text==='A greater cause.'&&workLines[1].y>workLines[0].y+5,workLines);
      check('Our Work Amaze-Ball description @'+width,
        (await work.locator('.case-index-info p').innerText()).trim()===copy);
      await page.goto(base+'/work/made-to-be-remembered/');
      await page.waitForSelector('.case-experience[data-case-ready="true"]');
      await page.evaluate(()=>document.fonts.ready);
      const related=page.locator('.case-related-card[href="/work/the-amaze-ball/"]');
      const relatedHeading=related.locator('h3[data-case-heading]');
      await relatedHeading.locator('.case-heading-line').first().waitFor();
      const relatedLines=await titleLines(related,'h3 > .case-heading-line');
      check('Related title breaks at first period @'+width,
        relatedLines.length>=2&&relatedLines[0].text==='A grand slam.'&&
        relatedLines[1].text.startsWith('A greater cause')&&
        relatedLines[1].y>relatedLines[0].y+5,relatedLines);
      check('Related cards remain title-only @'+width,
        await related.locator('.case-related-card-caption p').count()===0);
      await page.close();
    }
  }finally{
    await browser.close();
    fs.mkdirSync('qa-results',{recursive:true});
    fs.writeFileSync('qa-results/case-title-breaks.json',JSON.stringify(results,null,2));
    if(results.some(x=>!x.pass))process.exitCode=1;
  }
})().catch(e=>{console.error(e);process.exitCode=1});
