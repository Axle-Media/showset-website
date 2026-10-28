import type {BlockItem} from '@/lib/types';
import type {ServiceKind} from './service-content';

/** Presentation-only categories, mapped to stable Studio item IDs.
 * All authored descriptions remain untouched and editable in page data.
 * Unrecognised/new items are always shown, never silently discarded.
 */
type GroupDefinition={title:string;ids:string[]};
export type CapabilityGroup={title:string;items:BlockItem[]};
const definitions:Record<ServiceKind,GroupDefinition[]>={
 events:[
  {title:'Concept & Design',ids:[
   'event-concepts---creative-di-1',
   'graphic-design---event-brand-2',
   'event-layout---3d-renders-3',
   'branding--signage---printing-10'
  ]},
  {title:'Planning & People',ids:[
   'event-planning---management-4',
   'venue-sourcing-5',
   'guest-management---rsvp-coor-13',
   'event-staffing---hospitality-14',
   'transport---logistics-16'
  ]},
  {title:'Space & Production',ids:[
   'd-cor---styling-6',
   'furniture---equipment-hire-8',
   'stage-builds---custom-instal-9',
   'lighting-sound-av-production-20261028',
   'photography-videography-20261028'
  ]},
  {title:'The Experience',ids:[
   'catering---bar-services-11',
   'entertainment--djs---mcs-12',
   'gifting---branded-merchandis-15',
   'brand-activations---interact-17'
  ]}
 ],
 creative:[
  {title:'Brand & Identity',ids:[
   'brand-strategy---identity-0',
   'marketing-strategy---creativ-4',
   'creative-naming-20261028',
   'creative-brand-guidelines-20261028'
  ]},
  {title:'Graphic & Creative',ids:[
   'graphic-design---creative-pr-1',
   'creative-campaign-art-direction-20261028',
   'creative-presentations-20261028',
   'creative-illustration-20261028'
  ]},
  {title:'Print & Packaging',ids:[
   'packaging--print---retail-de-2',
   'creative-print-collateral-20261028',
   'creative-retail-pos-20261028',
   'creative-production-artwork-20261028'
  ]},
  {title:'Spaces & Experiences',ids:[
   'experiential---environmental-3',
   'creative-event-branding-20261028',
   'creative-spatial-visuals-20261028',
   'creative-branded-installations-20261028'
  ]}
 ],
 digital:[
  {title:'Websites & Technology',ids:[
   'websites---digital-experienc-0',
   'software--technology---solut-3'
  ]},
  {title:'Marketing & Content',ids:[
   'digital-marketing---advertis-1',
   'social-media---content-manag-2',
   'ongoing-creative---marketing-4'
  ]}
 ],
 production:[
  {title:'Concept & Pre-Production',ids:[
   'production-concepts-20261028',
   'production-scripting-20261028',
   'production-planning-20261028',
   'production-shoot-design-20261028'
  ]},
  {title:'Film & Photography',ids:[
   'photography---videography-1',
   'production-branded-film-20261028',
   'production-event-coverage-20261028',
   'production-content-shoot-20261028'
  ]},
  {title:'Motion & Post-Production',ids:[
   'motion-graphics--video---mul-0',
   'production-animation-20261028',
   'production-editing-20261028',
   'production-cutdowns-20261028'
  ]},
  {title:'Live & Technical Production',ids:[
   'lighting--sound---audiovisua-2',
   'production-live-streaming-20261028',
   'production-multicamera-20261028',
   'production-hybrid-20261028',
   'production-live-visuals-20261028',
   'production-stream-recording-20261028'
  ]}
 ]
};

export function groupServiceCapabilities(kind:ServiceKind,items:BlockItem[]):CapabilityGroup[]{
 const included=new Set<string>();
 const byId=new Map(items.map(item=>[item.id,item]));
 const groups=definitions[kind].map(group=>({
  title:group.title,
  items:group.ids.flatMap(id=>{
   const item=byId.get(id);
   if(!item||included.has(id))return [];
   included.add(id);
   return [item];
  })
 })).filter(group=>group.items.length>0);
 const additions=items.filter(item=>!included.has(item.id));
 if(additions.length)groups.push({title:'More Services',items:additions});
 return groups;
}
