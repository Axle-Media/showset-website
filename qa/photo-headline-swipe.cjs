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
      textOpacity: text.opacity,
      textTransform: text.transform,
      textTransition: text.transitionDuration,
      textAnimation: text.animationName,
      textAnimationDuration: text.animationDuration,
      markerDuration: marker.animationDuration
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
        && o.textClip.startsWith('inset(') && o.textTransform === 'none', o);
      await page.locator(selector).evaluate(h => h.classList.add('is-revealed'));
      const active = await styles(page, selector);
      ck(selector + ' uses only the faster rectangular swipe',
        active?.markerAnimation.includes('showsetPhotoBlockSwipe')
        && Math.abs(parseFloat(active.markerDuration) - .75) < .01
        && active?.textAnimation.includes('showsetPhotoTextUnmask')
        && !active.markerAnimation.includes('showsetRadialTypeReveal')
        && !active.textAnimation.includes('showsetRadialTypeReveal')
        && active.textTransform === 'none'
        && parseFloat(active.textTransition) === 0, active);
    }
    await page.goto(base + '/');
    await page.waitForSelector('[data-concept-ready="true"]');
    const secondSwipe = await page.locator('.hero-second .wipe-heading').evaluate(h => {
      const first = h.querySelector('.wipe-line');
      const accent = h.querySelector('.wipe-line.accent-line');
      return {
        first: getComputedStyle(first, '::after').backgroundColor,
        accent: getComputedStyle(accent, '::after').backgroundColor
      };
    });
    ck('Second photographic hero has matching teal block swipes on both lines',
      secondSwipe.first === 'rgb(18, 186, 175)' &&
      secondSwipe.accent === secondSwipe.first, secondSwipe);
    const hero = await page.locator('.hero-title .line').first().evaluate(el => {
      const css = getComputedStyle(el, '::after');
      const text = getComputedStyle(el.querySelector(':scope > span'));
      return { animation: css.animationName, duration: css.animationDuration,
        content: css.content, textAnimation: text.animationName,
        textTransform: text.transform, textTransition: text.transitionDuration };
    });
    ck('Original hero uses only the faster swipe, without the rising-line movement',
      hero.animation.includes('showsetPhotoBlockSwipe')
        && Math.abs(parseFloat(hero.duration)-.75) < .01
        && hero.textAnimation.includes('showsetPhotoTextUnmask')
        && !hero.textAnimation.includes('heroLine')
        && hero.textTransform === 'none' && parseFloat(hero.textTransition) === 0, hero);
    const heroTransforms = await page.evaluate(() => {
      const a = document.querySelector('#hero-foreground');
      const b = document.querySelector('#hero-second');
      return { first: a.style.transform, second: b.style.transform };
    });
    ck('Both scroll hero scenes stay stationary while photography moves',
      heroTransforms.first === 'none' && heroTransforms.second === 'none', heroTransforms);
    const filmMovement = await page.locator('.film-step.is-on').evaluate(el => ({
      transform: getComputedStyle(el).transform,
      transition: getComputedStyle(el).transitionProperty,
      duration: getComputedStyle(el).transitionDuration
    }));
    ck('Film headline scene has no secondary slide or fade',
      filmMovement.transform === 'none' && parseFloat(filmMovement.duration) === 0, filmMovement);
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
    ck('Reduced motion disables photo block and leaves text fully visible',
      still?.markerDisplay === 'none' && Number(still.textOpacity) > .99
        && still.textTransform === 'none' && still.textClip === 'none', still);
    await page.goto(base + '/');
    await page.waitForSelector('[data-concept-ready="true"]');
    const reducedHero = await page.locator('.hero-title .line>span').first().evaluate(el => ({
      clip: getComputedStyle(el).clipPath,
      animation: getComputedStyle(el).animationName
    }));
    ck('Reduced-motion initial hero is legible without any swipe or clipping',
      reducedHero.clip === 'none' && reducedHero.animation === 'none', reducedHero);
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
