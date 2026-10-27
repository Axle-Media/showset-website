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
   'event-branding--layout---3d--0',
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
   'floral-design-7',
   'furniture---equipment-hire-8',
   'stage-builds---custom-instal-9'
  ]},
  {title:'The Experience',ids:[
   'catering---bar-services-11',
   'entertainment--djs---mcs-12',
   'gifting---branded-merchandis-15',
   'brand-activations---interact-17'
  ]}
 ],
 creative:[
  {title:'Strategy & Identity',ids:[
   'brand-strategy---identity-0',
   'marketing-strategy---creativ-4'
  ]},
  {title:'Design & Production',ids:[
   'graphic-design---creative-pr-1',
   'packaging--print---retail-de-2',
   'experiential---environmental-3'
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
  {title:'Film & Content',ids:[
   'motion-graphics--video---mul-0',
   'photography---videography-1'
  ]},
  {title:'Technical Production',ids:[
   'lighting--sound---audiovisua-2'
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
