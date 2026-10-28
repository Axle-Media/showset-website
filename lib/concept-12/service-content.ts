import type {Block, PageData} from '@/lib/types';
export type ServiceKind='events'|'creative'|'digital'|'production';
export const serviceRoutes:Record<ServiceKind,string>={events:'/events-experiences/',creative:'/creative-design/',digital:'/digital-marketing/',production:'/content-production/'};
export const serviceNames:Record<ServiceKind,string>={events:'Events & Experiences',creative:'Creative & Design',digital:'Digital & Marketing',production:'Content & Production'};
const images:Record<ServiceKind,string[]>={events:['/media/planning.webp','/media/rigging.webp','/media/evening.webp'],creative:['/media/cases/identity-process.webp','/media/cases/identity-detail.webp','/media/brand.webp'],digital:['','',''],production:['/media/planning.webp','/media/cases/production-process.webp','/media/sound.webp']};
export const serviceKind=(page:PageData)=>Object.keys(serviceRoutes).find(k=>serviceRoutes[k as ServiceKind]===page.route) as ServiceKind|undefined;
/** Additive read model for older drafts; no existing section, field or item is replaced. */
export function servicePage(page:PageData):PageData{
 const kind=serviceKind(page);if(!kind)return page;
 const sections=[...page.sections],process=sections.find(s=>s.id==='section-5')||sections.find(s=>s.type==='items');
 if(!sections.some(s=>s.id==='service-story')&&process){const story:Block={...process,id:'service-story',type:'story',items:process.items.map((item,i)=>({...item,image:item.image||images[kind][i%3]}))};sections.splice(Math.max(1,sections.findIndex(s=>s.id==='section-2')+1),0,story)}

 return sections.length===page.sections.length?page:{...page,sections};
}
