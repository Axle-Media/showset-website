import fs from 'node:fs';import path from 'node:path';
const pages=JSON.parse(fs.readFileSync('content/pages.json','utf8'));let bad=[];
const allowed=new Set(['hero','pagehero','split','story','services','work','dot','cta','visual','items','accordion','contact']);
for(const [slug,page] of Object.entries(pages)){
 if(!Array.isArray(page.sections)||!page.sections.length)bad.push(slug+': missing sections');
 for(const s of page.sections){if(!allowed.has(s.type))bad.push(slug+': invalid section '+s.type);if(s.image?.startsWith('/media/')&&!fs.existsSync('public'+s.image))bad.push(slug+': missing '+s.image);for(const item of s.items||[])if(item.image?.startsWith('/media/')&&!fs.existsSync('public'+item.image))bad.push(slug+': missing '+item.image)}
}
// Keep both scroll scenes and the server-rendered CTA labels in sync with
// the approved directors' copy. These are the only public CTA instances using
// these particular phrases; routes and button treatments remain unchanged.
const hero=pages.home.sections.find(section=>section.type==='hero');
const html=JSON.parse(fs.readFileSync('lib/concept-12/markup.json','utf8'));
for(const [field,expected] of [['buttonLabel','Explore our services'],['secondaryLabel','Meet the studio']]){
  if(hero?.[field]!==expected)bad.push('home hero: unexpected '+field);
  const matches=html.split('>'+expected+' <span').length-1;
  if(matches!==2)bad.push('home hero: expected '+expected+' in both scenes, found '+matches);
}
if(/See what we do|Get to know us/i.test(html))bad.push('home hero: old CTA wording in static HTML');
// The featured-work introduction is a heading-only treatment on Home.
// Check the authored data and static HTML together, without changing
// individual case-study cards or the Our Work catalogue.
const featured=pages.home.sections.find(section=>section.type==='work');
if(featured?.headline!=='Work that'||featured?.accent!=='speaks for itself.'||featured?.body!=='')
  bad.push('home featured work: heading or removed paragraph has regressed');
if(!html.includes('<div class="portfolio-intro" hidden><p></p></div>')||
   !html.includes('<span>Work that</span></span><span class="wipe-line accent-line"><span>speaks for itself.</span>'))
  bad.push('home featured work: static title-only markup is out of sync');

// Directors' portfolio CTA and Elmboog description must remain consistent
// between the Home source, the Our Work source and the initial server markup.
const elmboogCopy='A brand identity rooted in the land, brought to life across a brand guide, company profile, stationery and presentations.';
for(const [pageName,section] of [['Home',featured],['Our Work',pages['our-work'].sections.find(s=>s.type==='work')]]){
  const item=section?.items.find(x=>x.href==='/work/made-to-be-remembered/');
  if(item?.description!==elmboogCopy)bad.push(pageName+': Elmboog description differs from approved copy');
}
if(!html.includes('<p>'+elmboogCopy+'</p>'))bad.push('Home: Elmboog static card description differs from approved copy');
if((html.match(/View the project <b>/g)||[]).length!==3 ||
   /Explore the study/.test(html))bad.push('Home: some project-card CTAs use outdated wording');
const workRenderer=fs.readFileSync('lib/concept-12/portfolio-content.ts','utf8');
if(!workRenderer.includes('View the project')||workRenderer.includes('Explore the study'))
  bad.push('Our Work: project-card CTA wording differs from approved copy');

// Services introduction now carries only the two-line heading.
const servicesIntro=pages.home.sections.find(section=>section.type==='services');
if(servicesIntro?.headline!=='Every discipline.'||servicesIntro?.accent!=='One creative partner.'||servicesIntro?.body!=='')
  bad.push('Home services: director-approved heading or removed copy has regressed');
if(!html.includes('<h2 class="services-panel-heading"><span>Every discipline<span class="service-heading-period">.</span></span><span class="accent-text">One creative partner<span class="service-heading-accent-period showset-ending-punctuation">.</span></span></h2>\n<p hidden></p>'))
  bad.push('Home services: static heading and hidden copy are out of sync');

// Every interactive homepage services panel must display the revised
// directors' copy with one shared Discover more CTA, on initial HTML and
// after changing the active discipline.
const servicePanelCopy=[
  ['Events & experiences','Conferences, launches and celebrations, delivered with precision.','/events-experiences/'],
  ['Creative & design','Brand identities with a distinct point of view.','/creative-design/'],
  ['Digital & marketing','Websites and campaigns that engage and convert.','/digital-marketing/'],
  ['Content & production','Film, photography, motion and live production.','/content-production/'],
];
servicePanelCopy.forEach(([title,description,href],i)=>{
  const item=servicesIntro?.items[i];
  if(item?.title!==title||item?.description!==description||item?.href!==href)
    bad.push('Home services: panel '+i+' content or route differs from approved copy');
});
if(!html.includes('<p id="service-visual-copy">'+servicePanelCopy[0][1]+'</p>')||
   !html.includes('id="service-visual-link">Discover more <span>')||
   html.includes('Step inside this world'))
  bad.push('Home services: server-rendered initial panel or CTA differs from approved copy');
const serviceRuntime=fs.readFileSync('lib/concept-12/runtime.js','utf8');
if(!serviceRuntime.includes('options.serviceOverrides?.[n]')||
   !serviceRuntime.includes("'Discover more about '+override.title"))
  bad.push('Home services: dynamic panel descriptions or accessible CTA label regressed');

// Keep the approach heading-only; restore copy to the shared closing CTA.
const dot=pages.home.sections.find(s=>s.type==='dot');
if(dot?.body!=='')bad.push('Home approach: obsolete explanatory paragraph remains');
const closing={headline:'Have an idea',accent:'worth bringing to life?',
  body:'The brief can be polished, half-written or still living entirely in your head. Tell us what you are trying to make happen. We know where to start.',buttonLabel:'Start a conversation',buttonHref:'/contact/#contact-form'};
for(const pageName of ['home','our-studio','services']){
  const s=pages[pageName].sections.find(s=>s.type==='cta');
  if(!s||Object.entries(closing).some(([k,v])=>s[k]!==v))
    bad.push(pageName+': closing CTA does not match approved conversation wording or destination');
}
if(!html.includes('<div class="end-bottom"><p>'+closing.body+'</p>') ||
   !html.includes('<div class="studio-final-copy"><p>'+closing.body+'</p></div>') ||
   (html.split('Start a conversation <span aria-hidden="true">↗</span>').length-1)<2 ||
   /Got a beautifully|The small stuff is never small/.test(html))
  bad.push('Static Home/Studio: outdated closing CTA or approach paragraph');
if(!html.includes('href="/contact/#contact-form"') || !html.includes('id="contact-form"'))
  bad.push('Contact CTA: missing direct email form anchor');

console.log(`${Object.keys(pages).length} pages; ${Object.values(pages).reduce((n,p)=>n+p.sections.length,0)} sections; ${bad.length} errors`);bad.forEach(console.error);process.exitCode=bad.length?1:0;
