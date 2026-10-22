// Run against the locally served SHOWSET Next.js build, never against live production.
// SHOWSET_BASE_URL=http://127.0.0.1:3001 node qa/photo-headline-swipe.cjs
const { chromium } = require(process.env.SHOWSET_PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const base = process.env.SHOWSET_BASE_URL || 'http://127.0.0.1:3001';
const checks = [], errors = [];
function ck(name, ok, details = null) {
  checks.push({ name, pass: Boolean(ok), details });
  console.log(ok ? 'PASS' : 'FAIL', name, details || '');
}
const targets = [
  ['/', '.hero-second .wipe-heading'],
  ['/', '.film-step.is-on .wipe-heading'],
  ['/events-experiences/', '.category-hero .block-heading'],
  ['/events-experiences/', '.category-banner .block-heading'],
  ['/our-studio/', '.simple-hero .block-heading'],
  ['/our-work/', '.simple-hero .block-heading'],
];
async function styles(page, selector) {
  return page.locator(selector).evaluate(h => {
    const line = h.querySelector('.wipe-line');
    if (!line) return null;
    const marker = getComputedStyle(line, '::after');
    const text = getComputedStyle(line.querySelector('span'));
    return {
      markerContent: marker.content,
      markerDisplay: marker.display,
      markerBackground: marker.backgroundColor,
      markerAnimation: marker.animationName,
      textClip: text.clipPath,
      textOpacity: text.opacity
    };
  });
}
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', e => errors.push(e.message));
    for (const [path, selector] of targets) {
      await page.goto(base + path);
      await page.waitForSelector('[data-concept-ready="true"]');
      const o = await styles(page, selector);
      ck(selector + ' has an active rectangular overlay on ' + path,
        o && o.markerDisplay !== 'none' && !['none', 'normal'].includes(o.markerContent)
        && o.textClip === 'none', o);
      await page.locator(selector).evaluate(h => h.classList.add('is-revealed'));
      const active = await styles(page, selector);
      ck(selector + ' replays block swipe rather than circular reveal',
        active?.markerAnimation.includes('showsetPhotoBlockSwipe')
        && !active.markerAnimation.includes('showsetCircleReveal')
        && !active.markerAnimation.includes('showsetRadialTypeReveal'), active);
    }
    await page.goto(base + '/');
    await page.waitForSelector('[data-concept-ready="true"]');
    const hero = await page.locator('.hero-title .line').first().evaluate(el => {
      const css = getComputedStyle(el, '::after');
      return { animation: css.animationName, content: css.content };
    });
    ck('Original hero receives matching block sweep', hero.animation.includes('showsetPhotoBlockSwipe'), hero);
    const other = await page.locator('.portfolio-heading .block-heading .wipe-line').first().evaluate(el => {
      const marker = getComputedStyle(el, '::after');
      return { display: marker.display, content: marker.content };
    });
    ck('Non-photo Work-section heading keeps its original circle', other.display === 'none', other);
    ck('Service photo description remains a paragraph, never a swipe heading',
      await page.locator('.service-image-information>p').count() === 1);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(base + '/events-experiences/');
    await page.waitForSelector('[data-concept-ready="true"]');
    const still = await styles(page, '.category-hero .block-heading');
    ck('Reduced motion disables photo block and leaves text visible',
      still?.markerDisplay === 'none' && Number(still.textOpacity) > .99, still);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(base + '/');
    await page.waitForSelector('[data-concept-ready="true"]');
    const width = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ck('Mobile photo animation introduces no horizontal overflow', width <= 1, { width });
    ck('No runtime exceptions', errors.length === 0, errors);
  } finally {
    await browser.close();
  }
  fs.mkdirSync('qa-results', { recursive: true });
  fs.writeFileSync('qa-results/photo-headline-swipe.json', JSON.stringify(checks, null, 2));
  if (checks.some(c => !c.pass)) process.exitCode = 1;
})().catch(err => { console.error(err); process.exitCode = 1; });
