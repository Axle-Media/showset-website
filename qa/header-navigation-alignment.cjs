// Regression for the shared What We Do dropdown, persistent route highlighting,
// desktop header geometry and mobile/legal navigation.
const { chromium }=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3001';
const checks=[],errors=[];
const servicePaths=['/events-experiences/','/creative-design/','/digital-marketing/','/content-production/'];
const check=(label,pass,detail)=>{checks.push({label,pass:!!pass,detail});console.log(pass?'PASS':'FAIL',label,pass?'':JSON.stringify(detail));};
async function ready(page,route){
 await page.goto(base+route);
 if(!route.includes('policy')&&!route.includes('conditions')){
  await page.waitForSelector('[data-concept-ready="true"]');
 }
 await page.evaluate(()=>document.fonts.ready);
}
(async()=>{
 const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chromium',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:920}});
  page.on('pageerror',err=>errors.push(err.message));
  await ready(page,'/');
  const nav=page.locator('.desktop-navigation');
  const dropdown=page.locator('#nav-dropdown');
  const trigger=page.locator('#services-button');
  const dropdownLinks=page.locator('#nav-panel .nav-service-link');
  check('Single What We Do parent replaces four direct service menu items',
   await trigger.count()===1&&(await nav.locator(':scope > a.nav-text').allTextContents()).join('|')==='Our studio|Our work|Contact',
   await nav.innerText());
  check('Four correct service destinations remain in the dropdown',
   JSON.stringify(await dropdownLinks.evaluateAll(nodes=>nodes.map(x=>new URL(x.href).pathname)))===JSON.stringify(servicePaths));
  const serviceType=await dropdownLinks.evaluateAll(nodes=>nodes.map(node=>{
    const el=node.querySelector('span:first-child'),s=getComputedStyle(el),r=el.getBoundingClientRect();
    return {size:s.fontSize,color:s.color,width:r.width,weight:s.fontWeight};
  }));
  check('Dropdown services use legible 17px labels rather than inherited 9px spans',
   serviceType.length===4&&serviceType.every(v=>v.size==='17px'&&parseInt(v.weight)>=600),
   serviceType);
  const inactiveColours=await dropdownLinks.evaluateAll(nodes=>nodes.map(el=>({
    label:getComputedStyle(el.querySelector('span:first-child')).color,
    arrow:getComputedStyle(el.querySelector('span:last-child')).color,
    link:getComputedStyle(el).color
  })));
  check('Inactive dropdown services have SHOWSET white labels and arrows',
   inactiveColours.length===4&&inactiveColours.every(x=>x.label==='rgb(250, 249, 253)'&&
     x.arrow==='rgb(250, 249, 253)'&&x.link==='rgb(250, 249, 253)'),
   inactiveColours);
  await trigger.hover();
  await dropdownLinks.first().hover();
  await page.waitForTimeout(250);
  const hoverColours=await dropdownLinks.first().evaluate(el=>({
    label:getComputedStyle(el.querySelector('span:first-child')).color,
    arrow:getComputedStyle(el.querySelector('span:last-child')).color,
    background:getComputedStyle(el).backgroundColor
  }));
  check('Inactive hovered service remains white with subtle background feedback',
   hoverColours.label==='rgb(250, 249, 253)'&&
   hoverColours.arrow==='rgb(250, 249, 253)'&&
   hoverColours.background!=='rgba(0, 0, 0, 0)',
   hoverColours);

  check('Hover opens dropdown and updates its accessible expanded state',
   await trigger.getAttribute('aria-expanded')==='true'&&await dropdownLinks.first().isVisible());
  await page.mouse.move(1,1);
  await page.waitForTimeout(350);
  check('Leaving dropdown closes hover state',await trigger.getAttribute('aria-expanded')==='false');
  await trigger.click();
  check('Click toggles What We Do open',await trigger.getAttribute('aria-expanded')==='true');
  await page.keyboard.press('Escape');
  check('Escape closes dropdown',await trigger.getAttribute('aria-expanded')==='false');
  await trigger.focus();
  check('Keyboard focus opens dropdown',await trigger.getAttribute('aria-expanded')==='true');
  await dropdownLinks.nth(1).click();
  await page.waitForURL(url=>url.pathname==='/creative-design/');
  // History is updated before the route curtain completes. Wait for the
  // renderer to rebind the active links, not only for the address-bar change.
  await page.waitForFunction(() =>
    document.querySelector('.concept-12-root')?.dataset.conceptRoute === 'creative' &&
    document.querySelector('#nav-panel a[aria-current="page"]')?.getAttribute('href') === '/creative-design/'
  );
  const serviceActive=await page.evaluate(()=>{
   const parent=document.querySelector('#services-button'),selected=document.querySelector('#nav-panel .nav-service-link[aria-current="page"]');
   return {parent:parent?.classList.contains('active'),parentColour:parent&&getComputedStyle(parent).color,
    selectedHref:selected?.getAttribute('href'),selectedColour:selected&&getComputedStyle(selected).color};
  });
  check('Service route highlights What We Do and the active submenu item',
   serviceActive.parent&&serviceActive.parentColour==='rgb(18, 186, 175)'&&
   serviceActive.selectedHref==='/creative-design/'&&serviceActive.selectedColour==='rgb(18, 186, 175)',
   serviceActive);
  const selectedColours=await page.locator('#nav-panel .nav-service-link').evaluateAll(nodes=>nodes.map(el=>({
    active:el.getAttribute('aria-current')==='page',
    label:getComputedStyle(el.querySelector('span:first-child')).color,
    arrow:getComputedStyle(el.querySelector('span:last-child')).color
  })));
  check('Only current dropdown service uses teal label and arrow',
   selectedColours.length===4&&selectedColours.filter(x=>x.active).length===1&&
   selectedColours.every(x=>x.label===(x.active?'rgb(18, 186, 175)':'rgb(250, 249, 253)') &&
      x.arrow===(x.active?'rgb(18, 186, 175)':'rgb(250, 249, 253)')),
   selectedColours);

  for(const [route,selector] of [['/our-studio/','a[href="/our-studio/"]'],['/our-work/','a[href="/our-work/"]']]){
   await ready(page,route);
   const selected=page.locator('.desktop-navigation > '+selector);
   check('Persistent teal active link '+route,
    await selected.getAttribute('aria-current')==='page'&&
    await selected.evaluate(el=>getComputedStyle(el).color)==='rgb(18, 186, 175)');
  }
  await ready(page,'/contact/');
  const contact=page.locator('.desktop-navigation > a[href="/contact/"]');
  check('Contact is in the top bar and persists teal on its own route',
   await contact.getAttribute('aria-current')==='page' &&
   await contact.evaluate(el=>getComputedStyle(el).color)==='rgb(18, 186, 175)');
  for(const width of[1920,1600,1440,1366,1351,1350,1100,600,390]){
   await page.setViewportSize({width,height:920});
   await ready(page,'/');
   const geometry=await page.evaluate(()=>{
    const rect=selector=>{const el=document.querySelector(selector);if(!el)return null;const x=el.getBoundingClientRect(),s=getComputedStyle(el);return{left:x.left,right:x.right,visible:s.display!=='none'&&s.visibility!=='hidden'}};
    const links=[...document.querySelectorAll('.desktop-navigation > :is(.nav-dropdown,a.nav-text)')].map(x=>x.getBoundingClientRect());
    return {logo:rect('#site-header .brand'),cta:rect('.header-cta'),nav:rect('.desktop-navigation'),
      toggle:rect('#mobile-toggle'),items:links.length,first:links[0]?.left,last:links.at(-1)?.right,
      centre:links.length?(links[0].left+links.at(-1).right)/2:null,
      doc:document.documentElement.scrollWidth};
   });
   check('No horizontal overflow '+width,geometry.doc<=width+2,geometry);
   if(width>=1351){
    check('Desktop navigation visible and clear of logo/CTA '+width,
     geometry.nav.visible&&geometry.cta.visible&&!geometry.toggle.visible&&
     geometry.logo.right+8<geometry.first&&geometry.last+8<geometry.cta.left&&geometry.items===4,
     geometry);
    check('Top-level navigation centred '+width,Math.abs(geometry.centre-width/2)<3,geometry.centre);
   }else check('Compact menu replaces desktop navigation '+width,
    !geometry.nav.visible&&geometry.toggle.visible,geometry);
  }
  await page.setViewportSize({width:390,height:844});
  await ready(page,'/events-experiences/');
  await page.locator('#mobile-toggle').click();
  const mobileLinks=page.locator('#mobile-panel nav > a.mobile-nav-link');
  const allMobilePaths=await mobileLinks.evaluateAll(nodes=>nodes.map(x=>new URL(x.href).pathname));
  check('Mobile lists services, Studio, Work and Contact directly',
   JSON.stringify(allMobilePaths)===JSON.stringify(['/',...servicePaths,'/our-studio/','/our-work/','/contact/']) &&
   await page.locator('#mobile-panel details,#mobile-panel summary').count()===0,
   allMobilePaths);
  const activeMobile=page.locator('#mobile-panel nav > a[href="/events-experiences/"]');
  check('Mobile current service link remains teal with aria-current',
   await activeMobile.getAttribute('aria-current')==='page' &&
   await activeMobile.evaluate(el=>getComputedStyle(el).color)==='rgb(18, 186, 175)');
  await page.locator('#mobile-panel nav > a[href="/digital-marketing/"]').click();
  await page.waitForURL(url=>url.pathname==='/digital-marketing/');
  check('Mobile direct service link navigates correctly',
   new URL(page.url()).pathname==='/digital-marketing/');
  for(const route of ['/privacy-policy/','/terms-and-conditions/']){
   await page.setViewportSize({width:1440,height:900});
   await ready(page,route);
   await page.locator('#services-button').click();
   check('Static legal header dropdown works '+route,
    await page.locator('#services-button').getAttribute('aria-expanded')==='true'&&
    await page.locator('#nav-panel a').count()===4);
   await page.keyboard.press('Escape');
   check('Legal header Escape closes dropdown '+route,
    await page.locator('#services-button').getAttribute('aria-expanded')==='false');
  }
  fs.mkdirSync('qa-results',{recursive:true});
  await page.setViewportSize({width:1440,height:900});
  await ready(page,'/');
  await page.locator('#services-button').click();
  await page.screenshot({path:'qa-results/header-desktop.png',animations:'disabled'});
  await page.setViewportSize({width:390,height:844});
  await ready(page,'/');
  await page.locator('#mobile-toggle').click();
  await page.screenshot({path:'qa-results/header-mobile.png',animations:'disabled'});
  check('No browser errors',errors.length===0,errors);
 }finally{
  await browser.close();
  fs.mkdirSync('qa-results',{recursive:true});
  fs.writeFileSync('qa-results/header-navigation-alignment.json',JSON.stringify({checks,errors},null,2));
  if(checks.some(x=>!x.pass)||errors.length)process.exitCode=1;
 }
})().catch(err=>{console.error(err);process.exitCode=1});
