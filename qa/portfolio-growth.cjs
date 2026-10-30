// Regression: the Work index scales to dozens of case studies without new markup.
const fs=require('node:fs');
const ts=require('typescript');
const {parseHTML}=require('linkedom');
const assert=require('node:assert/strict');
const source=fs.readFileSync('lib/concept-12/portfolio-content.ts','utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const moduleProxy={exports:{}};
const modules={
 './case-content':{caseExperienceFor:page=>page.caseExperience||{openingImage:page.sections[0]?.image,demo:false}},
 '@/lib/safe':{safeHref:source=>typeof source==='string'&&source.startsWith('/')?source:'#'}
};
new Function('require','module','exports',compiled)(name=>{
 if(!modules[name])throw new Error('Unexpected module '+name);
 return modules[name];
},moduleProxy,moduleProxy.exports);
const {portfolioEntries,renderPortfolioIndex}=moduleProxy.exports;
const seed=JSON.parse(fs.readFileSync('content/pages.json','utf8'));
const sourceProjects=Object.values(seed).filter(p=>p.route.startsWith('/work/'));
assert.equal(sourceProjects.length,3,'Published case-study seed count');
const catalog={...seed};
for(let i=0;i<27;i++){
 const key='future-project-'+i;
 const original=sourceProjects[i%sourceProjects.length];
 catalog[key]={
  ...original,slug:key,route:'/work/'+key+'/',title:'Future project '+i,
  // Synthetic records must not inherit the publication date of a real source project.
  publishedAt:undefined,
  caseExperience:{...original.caseExperience,demo:false,openingTitle:'Future project '+i},
  sections:original.sections.map((s,j)=>({...s,headline:j===0?'Future project '+i:s.headline}))
 };
}
// A newly dated project must lead, regardless of old curated item order.
catalog['future-project-20'].publishedAt='2027-10-28T12:00:00Z';
catalog['future-project-20'].caseExperience.tags=['Events','Digital'];
catalog['future-project-19'].publishedAt='2026-10-20T12:00:00Z';
const work=seed['our-work'].sections.find(s=>s.type==='work');
const projects=portfolioEntries(work,catalog);
assert.equal(projects.length,30);
assert.equal(new Set(projects.map(p=>p.route)).size,30);
assert.equal(projects[0].route,'/work/future-project-20/','Newest dated case must lead the page');
assert.deepEqual(projects[0].tags,['Events','Digital'],'Case studies support multiple filter tags');
assert.ok(projects.slice(0,27).every(p=>p.label==='Project'),'New pages must appear without a fixed card list');
assert.equal(projects.filter(p=>p.label==='Concept study').length,
 sourceProjects.filter(p=>p.caseExperience?.demo).length,
 'Only demonstration cases must have the concept-study label');
for (const page of sourceProjects) {
 const entry=projects.find(p=>p.route===page.route);
 const item=work.items.find(item=>item.href===page.route);
 assert.equal(entry.label,page.caseExperience.demo?'Concept study':item?.accent?.trim()||'Project',
  'Each case must preserve its authored client/concept classification');
}
assert.ok(projects.every(p=>p.route.startsWith('/work/')&&p.image.startsWith('/')));
const {document}=parseHTML('<html><body><div class="view" data-view="work"><div data-work-filters hidden></div><div data-work-index></div><div data-work-more hidden></div></div></body></html>');
renderPortfolioIndex(document.body,work,catalog);
const cards=[...document.querySelectorAll('[data-work-index] .work-portfolio-card')];
assert.equal(cards.length,30);
assert.ok(cards.every(card=>card.classList.contains('case-slide')),'Every Work tile must reuse the homepage card structure');
assert.equal(cards[0].getAttribute('data-work-order'),'0');
assert.equal(cards[0].getAttribute('data-work-tags'),'Events|Digital');
assert.ok(cards.every(card=>card.querySelector('.case-photo')&&card.querySelector('.case-story')));
assert.ok(cards.every(card=>card.querySelector('h2')&&card.querySelector('a')===null&&card.getAttribute('href')?.startsWith('/work/')));
assert.deepEqual([...document.querySelectorAll('[data-work-filter]')].map(x=>x.textContent),['All','Events','Creative','Digital','Content']);
assert.equal(document.querySelector('[data-work-more]').hasAttribute('hidden'),false,'Load more must activate after six stories');
assert.equal(document.querySelectorAll('[data-work-index] .work-portfolio-card').length,30);
console.log('PASS Portfolio: 30 real records, date ordering, multi-tag filters, six-story pagination contract');
