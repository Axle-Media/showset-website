// Homepage refinement round 2. Run against the real locally served Next.js build.
// SHOWSET_BASE_URL=http://127.0.0.1:3002 node qa/homepage-feedback.cjs
const { chromium } = require(process.env.SHOWSET_PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const base = process.env.SHOWSET_BASE_URL || 'http://127.0.0.1:3002';
const checks = [], errors = [];
function check(name, pass, detail) {
  checks.push({ name, pass: !!pass, detail });
  console.log(pass ? 'PASS' : 'FAIL', name, detail ?? '');
}
async function position(page, selector, fraction = 0) {
  await page.locator(selector).evaluate((node, p) => {
    const y = scrollY + node.getBoundingClientRect().top +
      Math.max(0, node.offsetHeight - innerHeight) * p;
    scrollTo({ top: y, behavior: 'instant' });
  }, fraction);
  await page.waitForTimeout(350);
}
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base + '/');
    await page.waitForTimeout(750);

    const initial = await page.evaluate(() => {
      const hero = document.querySelector('.hero-title');
      const accent = hero.querySelector('.hero-accent-phrase>span');
      const period = hero.querySelector('.hero-period');
      return {
        title: hero.textContent.replace(/\s+/g, ' ').trim(),
        accent: getComputedStyle(accent).color,
        period: getComputedStyle(period).color,
        secondHidden: document.querySelector('#hero-second').inert,
      };
    });
    check('Initial hero keeps exact words', initial.title === 'Great ideas should move people.', initial.title);
    check('Hero phrase teal', initial.accent === 'rgb(18, 186, 175)', initial.accent);
    check('Final hero period white', initial.period === 'rgb(250, 249, 253)', initial.period);
    check('Second-scene controls initially inert', initial.secondHidden);
    await position(page, '#hero-track', 0.85);
    check('Second hero copy expanded', (await page.locator('.hero-second-copy').innerText()).includes('first sketch'));
    check('Two second-scene CTA links', await page.locator('#hero-second a[href]').count() === 2);
    check('Second-scene controls become interactive',
      await page.locator('#hero-second').evaluate(el => !el.inert && el.getAttribute('aria-hidden') === 'false'));
    const sizes = await page.evaluate(() => {
      const first = getComputedStyle(document.querySelector('.hero-title'));
      const second = getComputedStyle(document.querySelector('#hero-second h2'));
      return { first: parseFloat(first.fontSize), second: parseFloat(second.fontSize), fw: first.fontWeight, sw: second.fontWeight };
    });
    check('Second hero headline scale matches original', Math.abs(sizes.first - sizes.second) <= 1.5, sizes);
    await position(page, '#hero-track', 0);
    check('Reverse-scrolling hides second controls', await page.locator('#hero-second').evaluate(el => el.inert));

    check('Editorial CTA is beneath heading', await page.locator('.manifesto-heading-group .understated-link').count() === 1);
    check('Service heading has accent period',
      await page.locator('.service-heading-period').evaluate(el => getComputedStyle(el).color) === 'rgb(18, 186, 175)');
    // Regression: the nested accent period was inheriting display:block,
    // leaving a stray dot on a third line. Navigation must sit under the copy.
    for (const { width, height } of [
      { width: 822, height: 772 }, { width: 1440, height: 900 }
    ]) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(120);
      const geometry = await page.evaluate(() => {
        const title = document.querySelector('.services-panel-heading > span:first-child');
        const period = document.querySelector('.service-heading-period');
        const range = document.createRange();
        range.selectNodeContents(title.firstChild);
        const textRect = range.getBoundingClientRect();
        const dotRect = period.getBoundingClientRect();
        const copyRect = document.querySelector('.services-stage-intro > p').getBoundingClientRect();
        const navRect = document.querySelector('.services-left .service-navigation').getBoundingClientRect();
        return {
          dotDisplay: getComputedStyle(period).display,
          dotLineOffset: Math.abs(dotRect.bottom - textRect.bottom),
          copyToCategories: navRect.top - copyRect.bottom,
        };
      });
      check('Services punctuation stays on first line ' + width,
        geometry.dotDisplay === 'inline' && geometry.dotLineOffset <= 10, geometry);
      check('Services category list follows body without large dead space ' + width,
        geometry.copyToCategories >= 12 && geometry.copyToCategories <= 90, geometry);
    }
    // The Content & Production photograph caption should be smaller,
    // closely spaced and no more than two lines at desktop panel widths.
    for (const width of [1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.locator('[data-service="3"]').focus();
      await page.waitForFunction(() =>
        document.querySelector('#service-visual-copy')?.textContent?.startsWith('From the first storyboard')
      );
      const caption = await page.locator('#service-visual-copy').evaluate(el => {
        const css = getComputedStyle(el);
        const lines = el.getBoundingClientRect().height / parseFloat(css.lineHeight);
        return { lines, fontSize: parseFloat(css.fontSize), lineHeight: parseFloat(css.lineHeight), width: el.getBoundingClientRect().width };
      });
      check('Production photo caption remains within two lines at ' + width,
        caption.lines <= 2.1 && caption.fontSize <= 20.1, caption);
    }
    await page.setViewportSize({ width: 1440, height: 900 });

    const dotBefore = await page.locator('#dot-core').evaluate(el => getComputedStyle(el).clipPath);
    check('Dot initially clipped to zero', /circle\(0px\s+at/.test(dotBefore), dotBefore);
    await position(page, '#dot-track', 0.55);
    const dotDuring = await page.locator('#dot-core').evaluate(el => parseFloat(el.style.getPropertyValue('--dot-radius')));
    check('Dot expands with scroll', dotDuring > 20, dotDuring);
    await position(page, '#dot-track', 0);
    const dotAfter = await page.locator('#dot-core').evaluate(el => parseFloat(el.style.getPropertyValue('--dot-radius')));
    check('Dot reverses to hidden', dotAfter === 0, dotAfter);
    check('Dot desktop headline uses two deliberate lines',
      await page.locator('.dot-words h2 br').count() === 1);
    check('Closing CTA follows body text',
      await page.locator('.end-bottom p + a.end-link').count() === 1);
    for (const width of [833, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const copy = await page.locator('#ending .end-bottom>p').evaluate(el => {
        const style = getComputedStyle(el);
        return {
          lines: el.getBoundingClientRect().height / parseFloat(style.lineHeight),
          width: el.getBoundingClientRect().width,
          maxWidth: style.maxWidth,
          text: el.textContent.trim(),
        };
      });
      check('Closing paragraph stays within two lines on desktop ' + width,
        copy.lines <= 2.1 && copy.text.endsWith('start.'), copy);
    }
    const buttonMatch = await page.evaluate(() => {
      const sample = document.querySelector('.hero-links .solid-link');
      const closing = document.querySelector('#ending .end-link');
      if (!sample || !closing) return null;
      const pick = el => {
        const css = getComputedStyle(el);
        return {
          background: css.backgroundColor,
          foreground: css.color,
          borderRadius: css.borderRadius,
          fontSize: css.fontSize,
          paddingTop: css.paddingTop,
          borderTop: css.borderTopWidth,
          borderBottom: css.borderBottomWidth,
        };
      };
      return { sample: pick(sample), closing: pick(closing), href: closing.getAttribute('href') };
    });
    check('Closing CTA uses the shared primary button design',
      buttonMatch && JSON.stringify(buttonMatch.sample) === JSON.stringify(buttonMatch.closing)
      && buttonMatch.href === '/contact/', buttonMatch);
    await page.setViewportSize({ width: 1440, height: 900 });

    check('Footer contact column exists', await page.locator('.footer-contact').count() === 1);
    check('Footer email domain', await page.locator('[data-footer-email]').getAttribute('href') === 'mailto:hello@showset.co.za');
    check('Footer phone link', await page.locator('[data-footer-phone]').getAttribute('href') === 'tel:+27682805777');
    check('Footer Cape Town location', (await page.locator('[data-footer-location]').innerText()) === 'Cape Town, South Africa');
    check('Footer sign-off', (await page.locator('.footer-signoff').innerText()) === 'Made by Showset.');
    check('Three teal social icons exist under Contact us',
      await page.locator('.footer-contact .footer-socials .footer-social').count() === 3
      && await page.locator('.footer-contact [data-footer-social="facebook"]').count() === 1
      && await page.locator('.footer-contact [data-footer-social="instagram"]').count() === 1
      && await page.locator('.footer-contact [data-footer-social="linkedin"]').count() === 1);
    const socialStyles = await page.locator('.footer-socials .footer-social').first().evaluate(el => ({
      color: getComputedStyle(el).color,
      href: el.getAttribute('href'),
      disabled: el.getAttribute('aria-disabled'),
    }));
    check('Unconfigured profiles do not link to incorrect accounts',
      socialStyles.color === 'rgb(18, 186, 175)'
      && socialStyles.href === null && socialStyles.disabled === 'true', socialStyles);
    await page.setViewportSize({ width: 1440, height: 900 });
    const footerColumns = await page.evaluate(() => {
      const elements = [
        document.querySelector('.footer-links>div:nth-child(1)'),
        document.querySelector('.footer-links>div:nth-child(2)'),
        document.querySelector('.footer-contact'),
      ];
      return {
        lefts: elements.map(el => el.getBoundingClientRect().left),
        mode: getComputedStyle(document.querySelector('.footer-links')).display,
      };
    });
    const [discoverX, whatX, contactX] = footerColumns.lefts;
    check('Footer What we do column is centred between Discover and Contact us',
      footerColumns.mode === 'contents' && discoverX < whatX && whatX < contactX
      && Math.abs((whatX - discoverX) - (contactX - whatX)) < 25, footerColumns);


    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + '/');
    await page.waitForTimeout(400);
    const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    check('390px homepage has no horizontal overflow', mobileOverflow <= 1, mobileOverflow);
    await position(page, '#hero-track', 0.85);
    check('Mobile second hero CTA still interactive', await page.locator('#hero-second').evaluate(el => !el.inert));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(base + '/');
    check('Reduced-motion homepage renders', await page.locator('.hero-title').isVisible());
    check('No browser page errors', errors.length === 0, errors);
    await browser.close();
    fs.mkdirSync('qa-results', { recursive: true });
    fs.writeFileSync('qa-results/homepage-feedback.json', JSON.stringify(checks, null, 2));
    if (checks.some(x => !x.pass)) process.exitCode = 1;
  } catch (e) {
    await browser.close();
    throw e;
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
