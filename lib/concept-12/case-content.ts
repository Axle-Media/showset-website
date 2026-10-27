import type { CaseExperience, CaseStoryChapter, PageData } from '@/lib/types';
import { safeHref } from '@/lib/safe';

/** Non-destructive read model: missing fields derive from this project's own records.
 * Explicit empty strings/arrays and every authored/legacy field remain authoritative. */
export function caseExperienceFor(page: PageData): CaseExperience {
 const hero=page.sections[0],split=page.sections.find(s=>s.type==='split'),visual=page.sections.find(s=>s.type==='visual');
 const modules=page.projectModules||[],texts=modules.filter(m=>m.kind==='text');
 const photos=modules.filter(m=>m.kind==='image'&&safeHref(m.src)!=='#').map(m=>({id:m.id,src:m.src!,alt:m.alt||m.title}));
 const picture=(index:number)=>photos[index]?.src||hero?.image||'';
 const chapter=(key:'brief'|'intention'|'approach',fallback:CaseStoryChapter):CaseStoryChapter=>({...fallback,...page.caseExperience?.[key]});
 const existing=page.caseExperience;
 return {
  ...existing,
  demo:existing?.demo??false,
  openingTitle:existing?.openingTitle??hero?.headline??page.title,
  openingBody:existing?.openingBody??hero?.body??'',
  openingImage:existing?.openingImage??hero?.image??'',
  secondTitle:existing?.secondTitle??'This is how we made it happen.',
  secondImage:existing?.secondImage??visual?.image??picture(1),
  secondBody:existing?.secondBody??visual?.body??'',
  brief:chapter('brief',{heading:split?.headline||'The brief.',body:split?.body||'',images:[picture(0)].filter(Boolean)}),
  intention:chapter('intention',{heading:texts[0]?.title||'The intention.',body:texts[0]?.body||'',images:[picture(1)].filter(Boolean)}),
  approach:chapter('approach',{heading:texts[1]?.title||'The approach.',body:texts[1]?.body||'',images:[picture(2)].filter(Boolean)}),
  gallery:existing?.gallery??(photos.length?photos:hero?.image?[{src:hero.image,alt:page.title}]:[]),
  partners:existing?.partners??[],
 };
}
