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

console.log(`${Object.keys(pages).length} pages; ${Object.values(pages).reduce((n,p)=>n+p.sections.length,0)} sections; ${bad.length} errors`);bad.forEach(console.error);process.exitCode=bad.length?1:0;
