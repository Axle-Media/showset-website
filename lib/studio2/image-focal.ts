import type {Breakpoint, CanvasNode} from "./model";
import {validStyle} from "./registry";

export type GalleryItem = NonNullable<CanvasNode["props"]["items"]>[number];

/** Strict, compact representation of a non-destructive, percentage-based crop. */
export function parseFocal(value: string | undefined): {x:number;y:number} {
  if(!value || !validStyle("objectPosition",value)) return {x:50,y:50};
  const [x,y]=value.split(" ").map(part=>Number.parseFloat(part));
  return {x,y};
}
export function focalValue(x:number,y:number):string {
  const clamp=(n:number)=>Math.max(0,Math.min(100,Math.round(n)));
  return clamp(x)+"% "+clamp(y)+"%";
}
export function focalFor(item:GalleryItem,breakpoint:Breakpoint):string {
  return item.focal?.[breakpoint] ||
    (breakpoint==="mobile" ? item.focal?.tablet : undefined) ||
    item.focal?.desktop || "50% 50%";
}
const idSafe=(id:string)=>/^[\w-]{1,100}$/.test(id);
export function galleryFocalCss(id:string,items:GalleryItem[]):string {
  if(!idSafe(id))return "";
  const base='.concept-12-root #main [data-builder-node][data-builder-node="'+id+'"]';
  let css="";
  for(const item of items){
    if(!idSafe(item.id))continue;
    const target=base+' [data-gallery-item="'+item.id+'"] img';
    for(const point of ["desktop","tablet","mobile"] as Breakpoint[]){
      const value=item.focal?.[point];
      if(!value || !validStyle("objectPosition",value))continue;
      const rule=target+"{object-position:"+value+"!important}";
      css+=(point==="desktop"?rule:
        "@media(max-width:"+(point==="tablet"?"1024":"600")+"px){"+rule+"}");
    }
  }
  return css;
}
