// Regression audit of visible, published SHOWSET button families.
// Sample every route, then hover representative controls in a real Chromium
// browser. Control types are deliberately different: filled, outlined, text,
// filters, image selectors and menu controls must not be homogenised.
const { chromium } = require(process.env.SHOWSET_PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const base = process.env.SHOWSET_BASE_URL || 'http://127.0.0.1:3001';
const routes = [
  '/', '/events-experiences/', '/creative-design/', '/digital-marketing/',
  '/content-production/', '/our-studio/', '/our-work/', '/contact/',
  '/work/atmosphere-is-everything/', '/work/made-to-be-remembered/',
  '/work/behind-every-moment/', '/privacy-policy/', '/terms-and-conditions/'
];
const expected = {
  primary: { background: 'rgb(57, 212, 200)', color: 'rgb(6, 39, 57)' },
  outline: { background: 'rgb(18, 186, 175)', color: 'rgb(6, 39, 57)' },
  text: { color: 'rgb(18, 186, 175)' }
};
const checks = [], inventory = {}, errors = [];
function check(name, pass, details) {
  const result = { name, pass: !!pass, details };
  checks.push(result);
  console.log(pass ? 'PASS' : 'FAIL', name, pass ? '' : JSON.stringify(details));
}
async function visibleTarget(page, selector) {
  const elements = page.locator(selector), count = await elements.count();
  for (let i = 0; i < count; i++) {
    const el = elements.nth(i);
    if (!await el.isVisible()) continue;
    if (await el.evaluate(node => !!node.closest('[inert],[aria-hidden="true"]'))) continue;
    return el;
  }
  return null;
}
function state(el) {
  const s = getComputedStyle(el);
  return {
    background: s.backgroundColor, color: s.color, border: s.borderTopColor,
    fontSize: s.fontSize, fontWeight: s.fontWeight, transform: s.transform,
    borderGlow: getComputedStyle(el, '::before').animationName,
    borderGlowOpacity: getComputedStyle(el, '::before').opacity
  };
}
(async () => {
  const browser = await chromium.launch({
    channel: process.env.SHOWSET_PLAYWRIGHT_CHANNEL || 'chromium',
    headless: true
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
    page.on('pageerror', error => errors.push(error.message));
    let coverage = { primary: 0, outline: 0, text: 0 };
    for (const route of routes) {
      await page.goto(base + route, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.concept-12-root');
      if (!route.includes('policy') && !route.includes('conditions')) {
        await page.waitForSelector('.concept-12-root[data-concept-ready="true"]');
      }
      await page.evaluate(() => document.fonts.ready);
      inventory[route] = await page.evaluate(() => {
        const root = document.querySelector('.concept-12-root');
        return [...root.querySelectorAll('button,a[href]')].filter(el => {
          const s = getComputedStyle(el), r = el.getBoundingClientRect();
          return s.display !== 'none' && s.visibility !== 'hidden' && r.width && r.height &&
            !el.closest('[inert],[aria-hidden="true"]');
        }).map(el => ({
          tag: el.tagName.toLowerCase(), className: String(el.className || ''),
          text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 75)
        }));
      });
      const samples = [
        ['primary', '.concept-12-root .header-cta, .concept-12-root .hero-links .solid-link, .concept-12-root .service-close .solid-link, .concept-12-root .editorial-action.solid-link, .concept-12-root .contact-submit, .concept-12-root #ending .end-link, .concept-12-root #case-ending .end-link'],
        ['outline', '.concept-12-root .contact-whatsapp, .concept-12-root .work-index-more:not([hidden]) button'],
        ['text', '.concept-12-root .text-arrow-link, .concept-12-root .understated-link, .concept-12-root .service-image-information > a']
      ];
      for (const [type, selector] of samples) {
        const el = await visibleTarget(page, selector);
        if (!el) continue;
        await el.hover({ timeout: 12000 });
        await page.waitForTimeout(300);
        const computed = await el.evaluate(state);
        const expectation = expected[type];
        check(type + ' hover matches contract ' + route,
          Object.entries(expectation).every(([key,value]) => computed[key] === value) &&
          (type !== 'primary' || (
            computed.fontSize === '14px' &&
            computed.transform === 'none' &&
            computed.borderGlow === 'showset-button-border-orbit' &&
            Number(computed.borderGlowOpacity) > 0
          )),
          { computed, expectation });
        coverage[type]++;
        await page.mouse.move(0, 0);
      }
    }
    check('Sampled every public route', routes.every(route => inventory[route]?.length > 0),
      Object.fromEntries(routes.map(route => [route, inventory[route]?.length || 0])));
    check('Primary, outline and text hover families exercised',
      coverage.primary >= 10 && coverage.outline >= 1 && coverage.text >= 3, coverage);

    // The work pagination action is initially hidden when there are only a few
    // case studies. Check its source contract separately rather than inventing
    // additional portfolio entries to make it visible.
    const css = fs.readFileSync('app/button-interactions.css', 'utf8');
    check('Work outlined action and reduced-motion contracts are present',
      css.includes('.work-index-more button:is(:hover,:focus-visible)') &&
      css.includes('@media (prefers-reduced-motion: reduce)'));

    const motionPage = await browser.newPage({
      viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce'
    });
    await motionPage.goto(base, { waitUntil: 'domcontentloaded' });
    await motionPage.waitForSelector('.concept-12-root[data-concept-ready="true"]');
    const motionCTA = await visibleTarget(motionPage, '.concept-12-root .header-cta');
    if (motionCTA) {
      await motionCTA.hover();
      const style = await motionCTA.evaluate(state);
      check('Reduced motion: primary CTA is stationary and its border light is disabled',
        style.transform === 'none' && style.borderGlow === 'none' &&
        Number(style.borderGlowOpacity) === 0, style);
    }
    await motionPage.close();
    check('No browser exceptions', errors.length === 0, errors);
  } finally {
    await browser.close();
    fs.mkdirSync('qa-results', { recursive: true });
    fs.writeFileSync('qa-results/button-interactions.json', JSON.stringify({ checks, inventory, errors }, null, 2));
    if (checks.some(c => !c.pass) || errors.length) process.exitCode = 1;
  }
})().catch(error => { console.error(error); process.exitCode = 1 });
