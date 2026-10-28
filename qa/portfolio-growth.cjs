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
assert.equal(sourceProjects.length,3,'Published demo seed count');
const catalog={...seed};
for(let i=0;i<27;i++){
 const key='future-project-'+i;
 const original=sourceProjects[i%sourceProjects.length];
 catalog[key]={
  ...original,slug:key,route:'/work/'+key+'/',title:'Future project '+i,
  caseExperience:{...original.caseExperience,demo:false,openingTitle:'Future project '+i},
  sections:original.sections.map((s,j)=>({...s,headline:j===0?'Future project '+i:s.headline}))
 };
}
const work=seed['our-work'].sections.find(s=>s.type==='work');
const projects=portfolioEntries(work,catalog);
assert.equal(projects.length,30);
assert.equal(new Set(projects.map(p=>p.route)).size,30);
assert.ok(projects.slice(0,3).every(p=>p.label==='Concept study'),'Demo work must not become client work');
assert.ok(projects.slice(3).every(p=>p.label==='Project'),'New pages must appear without a fixed card list');
assert.ok(projects.every(p=>p.route.startsWith('/work/')&&p.image.startsWith('/')));
const {document}=parseHTML('<html><body><div class="view" data-view="work"><div data-work-filters hidden></div><div data-work-index></div><div data-work-more hidden></div></div></body></html>');
renderPortfolioIndex(document.body,work,catalog);
const cards=[...document.querySelectorAll('[data-work-index] .work-portfolio-card')];
assert.equal(cards.length,30);
assert.ok(cards[0].classList.contains('work-portfolio-featured'));
assert.ok(cards.every(card=>card.querySelector('h2')&&card.querySelector('a')===null&&card.getAttribute('href')?.startsWith('/work/')));
assert.ok(document.querySelectorAll('[data-work-filter]').length>=3,'Categories should activate when portfolio grows');
console.log('PASS Portfolio grows from 3 to 30 without hardcoded cards or fabricated projects');
