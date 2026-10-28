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
  ['/work/atmosphere-is-everything/', '.case-opening-first .block-heading'],
  ['/work/made-to-be-remembered/', '.case-opening-first .block-heading'],
  ['/events-experiences/', '.service-hero [data-service-reveal="photo"]'],
  ['/content-production/', '.service-hero [data-service-reveal="photo"]'],
  
  ['/our-studio/', '.studio-hero-scene-first .block-heading'],
  ['/our-work/', '.simple-hero .block-heading'],
];
async function styles(page, selector) {
  return page.locator('.view.is-current '+selector).evaluate(h => {
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
  const browser = await chromium.launch({ channel: process.env.SHOWSET_PLAYWRIGHT_CHANNEL || 'chromium', headless: true });
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
      await page.locator('.view.is-current '+selector).evaluate(h => h.classList.add('is-revealed'));
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
    await page.goto(base + '/digital-marketing/');
    await page.waitForSelector('[data-concept-ready="true"]');
    ck('Digital closing is a static editorial section rather than a photo hero',
      await page.locator('.service-close--editorial').count()===1
      &&await page.locator('.service-close [data-service-reveal="photo"]').count()===0);
    await page.goto(base + '/content-production/');
    await page.waitForSelector('[data-concept-ready="true"]');
    ck('Production CTA is editorial, not a second photographic hero',
      await page.locator('.service-close--editorial').count()===1
      &&await page.locator('.service-close [data-service-reveal="photo"]').count()===0);
    await page.goto(base + '/creative-design/');
    await page.waitForSelector('[data-concept-ready="true"]');
    ck('Creative closing CTA uses static editorial design without a second photo',
      await page.locator('.service-close--editorial').count()===1
      &&await page.locator('.service-close [data-service-reveal="photo"]').count()===0);
    await page.goto(base + '/events-experiences/');
    await page.waitForSelector('[data-concept-ready="true"]');
    ck('Events ending is a static editorial CTA rather than a photographic hero',
      await page.locator('.service-close--editorial').count()===1
      &&await page.locator('.service-close [data-service-reveal="photo"]').count()===0
      &&await page.locator('.service-close .service-close-art').count()===0);
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
    ck('Second photographic hero uses a teal first block and sand second block',
      secondSwipe.first === 'rgb(18, 186, 175)' &&
      secondSwipe.accent === 'rgb(229, 216, 195)', secondSwipe);
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
    // Both scroll hero headings replay when returning through their visible
    // scene, without requiring a route change or a page reload.
    await page.waitForTimeout(1050);
    await page.evaluate(() => {
      window.__showsetReplayCounts = { first: 0, second: 0 };
      document.querySelector('.hero-title').addEventListener('animationstart', e => {
        if (e.animationName === 'showsetPhotoTextUnmask') window.__showsetReplayCounts.first++;
      });
      document.querySelector('.hero-second .wipe-heading').addEventListener('animationstart', e => {
        if (e.animationName === 'showsetPhotoTextUnmask') window.__showsetReplayCounts.second++;
      });
    });
    const scrollHeroTo = async fraction => {
      await page.locator('#hero-track').evaluate((h, p) => {
        window.scrollTo({ top: scrollY + h.getBoundingClientRect().top +
          Math.max(0, h.offsetHeight - innerHeight) * p, behavior: 'instant' });
      }, fraction);
      await page.waitForTimeout(240);
    };
    await scrollHeroTo(.85);
    await page.waitForTimeout(900);
    await scrollHeroTo(.12);
    await page.waitForFunction(()=>window.__showsetReplayCounts.first>=2,null,{timeout:1500}).catch(()=>{});
    const firstReplay = await page.evaluate(() => window.__showsetReplayCounts.first);
    ck('Opening hero block reveal replays when scrolling back upwards', firstReplay >= 2, { firstReplay });
    await scrollHeroTo(.85);
    await page.waitForTimeout(900);
    const secondBefore = await page.evaluate(() => window.__showsetReplayCounts.second);
    await page.locator('#hero-track').evaluate(h => {
      window.scrollTo({ top: scrollY + h.getBoundingClientRect().bottom + innerHeight * .5,
        behavior: 'instant' });
    });
    await page.waitForTimeout(180);
    await scrollHeroTo(.85);
    const secondAfter = await page.evaluate(() => window.__showsetReplayCounts.second);
    ck('Second hero block reveal replays after returning from the next section',
      secondAfter > secondBefore, { secondBefore, secondAfter });
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
      const text = getComputedStyle(el.querySelector('span'));
      return { display: marker.display, content: marker.content, clip: text.clipPath, animation: text.animationName, opacity: text.opacity, transform: text.transform };
    });
    ck('Non-photo Work-section heading has no entrance animation', other.display === 'none' && other.clip === 'none' && other.animation === 'none' && other.opacity === '1' && (other.transform === 'none' || other.transform === 'matrix(1, 0, 0, 1, 0, 0)'), other);
    ck('Service photo description remains a paragraph, never a swipe heading',
      await page.locator('.service-image-information>p').count() === 1);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(base + '/work/atmosphere-is-everything/');
    await page.waitForSelector('[data-concept-ready="true"]');
    const still = await styles(page, '.case-opening-first .block-heading');
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
