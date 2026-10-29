import type {Block,PageData} from "../types";
import {builderFor,makeNode,type CanvasNode} from "./model";

/** Non-destructive replacement only for standard-flow editorial blocks.
 * Pinned and scroll-choreographed scenes remain under their original runtime.
 */
export function canReplaceNative(page:PageData,block:Block):boolean{
  if(page.route==="/our-studio/")
    return block.type==="split" &&
      ["section-2","section-5"].includes(block.id);
  if(page.route==="/our-work/")
    return block.type==="split"&&block.id==="section-2";
  if(["/events-experiences/","/creative-design/","/digital-marketing/",
      "/content-production/"].includes(page.route))
    return (block.id==="section-2"&&block.type==="split") ||
      (block.id==="section-6"&&block.type==="accordion");
  return false;
}
function fromBlock(block:Block):CanvasNode{
  const root=makeNode("section");
  root.name="Rebuilt: "+(block.headline||block.type);
  root.styles.desktop={...root.styles.desktop};
  root.motion=undefined;
  const children:CanvasNode[]=[];
  if(block.headline||block.accent){
    const heading=makeNode("heading");
    heading.name="Original heading";
    heading.props.text=block.headline.replace(/<br\s*\/?>/g,"\n")
      .replace(/<[^>]*>/g,"");
    heading.props.accent=block.accent.replace(/<br\s*\/?>/g,"\n")
      .replace(/<[^>]*>/g,"");
    children.push(heading);
  }
  if(block.body){
    const paragraph=makeNode("text");
    paragraph.name="Original paragraph";
    paragraph.props.text=block.body.replace(/<br\s*\/?>/g,"\n")
      .replace(/<[^>]*>/g,"");
    children.push(paragraph);
  }
  if(block.image){
    const visual=makeNode("image");
    visual.name="Original photograph";
    visual.props.src=block.image;
    visual.props.alt=block.headline.replace(/<[^>]*>/g,"");
    children.push(visual);
  }
  if(block.type==="accordion"&&block.items.length){
    const items=makeNode("accordion");
    items.name="Original service capabilities";
    items.props.items=block.items.map(item=>({
      id:item.id,title:item.title,body:item.description,
    }));
    children.push(items);
  }
  if(block.buttonLabel){
    const button=makeNode("button");
    button.name="Original action";
    button.props.text=block.buttonLabel;
    button.props.href=block.buttonHref;
    children.push(button);
  }
  if(!children.length)children.push(makeNode("text"));
  root.children=children;
  return root;
}
export function replaceNativeBlock(page:PageData,id:string):
  {page:PageData;nodeId:string}{
  const block=page.sections.find(s=>s.id===id);
  if(!block||!canReplaceNative(page,block))
    throw Error("This original scene has protected animation or navigation. Rebuild it only through its own content controls.");
  const builder=builderFor(page);
  if(builder.replacedNative?.includes(id))
    throw Error("This native section already has an editable replacement.");
  const trackedId=builder.nativeReplacementNodes?.[id];
  const previous=builder.roots.find(root=>root.id===trackedId) ||
    // Backward compatibility with early local drafts before stable mappings.
    builder.roots.find(root=>root.name==="Rebuilt: "+(block.headline||block.type));
  if(previous){
    return {nodeId:previous.id,page:{...page,builder:{
      ...builder,
      roots:builder.roots.map(root=>root.id===previous.id
        ? {...root,hidden:false} : root),
      replacedNative:[...(builder.replacedNative||[]),id],
      nativeReplacementNodes:{...builder.nativeReplacementNodes,[id]:previous.id},
    }}};
  }
  const node=fromBlock(block);
  return {nodeId:node.id,page:{...page,builder:{
    ...builder,
    roots:[...builder.roots,node],
    replacedNative:[...(builder.replacedNative||[]),id],
    nativeReplacementNodes:{...builder.nativeReplacementNodes,[id]:node.id},
  }}};
}
export function restoreNativeBlock(page:PageData,id:string):PageData{
  const builder=builderFor(page);
  const block=page.sections.find(section=>section.id===id);
  const trackedId=builder.nativeReplacementNodes?.[id];
  const replacement=builder.roots.find(root=>root.id===trackedId) ||
    (block && builder.roots.find(root=>
      root.name==="Rebuilt: "+(block.headline||block.type)));
  if(builder.replacedNative?.includes(id) && !replacement)
    throw Error("The replacement section could not be identified. Export a backup before restoring.");
  // Restore the original without deleting the owner's authored edits.
  // The archived chapter is hidden and can be reactivated on Rebuild.
  return {...page,builder:{...builder,
    replacedNative:(builder.replacedNative||[]).filter(x=>x!==id),
    roots:replacement ? builder.roots.map(root=>
      root.id===replacement.id ? {...root,hidden:true} : root) : builder.roots,
    nativeReplacementNodes:replacement
      ? {...builder.nativeReplacementNodes,[id]:replacement.id}
      : builder.nativeReplacementNodes,
  }};
}
/**
 * Resolve only verified, active native replacements. Stored replacement roots
 * are immutable anchors: an archived replacement is retained but never shown.
 * Legacy local drafts without an ID map are resolved by their original name.
 */
export function activeNativeReplacements(page:PageData):
  {sourceId:string;node:CanvasNode}[]{
  const builder=builderFor(page);
  return (builder.replacedNative||[]).flatMap(sourceId=>{
    const block=page.sections.find(section=>section.id===sourceId);
    if(!block||!canReplaceNative(page,block))return [];
    const id=builder.nativeReplacementNodes?.[sourceId];
    const node=builder.roots.find(root=>root.id===id)||
      (!id ? builder.roots.find(root=>root.name===
        "Rebuilt: "+(block.headline||block.type)) : undefined);
    if(!node||node.kind!=="section"||node.hidden)return [];
    return [{sourceId,node}];
  });
}

/** The native node stays in the DOM: no animated scene is destroyed. */
export function syncNativeReplacementVisibility(
  host:HTMLElement,page:PageData,
):void{
  const hidden=new Set(activeNativeReplacements(page).map(item=>item.sourceId));
  const selector="[data-section],[data-service-section]";
  host.querySelectorAll<HTMLElement>(selector).forEach(el=>{
    const id=el.dataset.section||el.dataset.serviceSection;
    if(!id)return;
    if(hidden.has(id)){
      if(el.dataset.studio2NativeReplaced!=="true"){
        el.dataset.studio2NativeReplaced="true";
        el.dataset.studio2OriginalDisplay=el.style.getPropertyValue("display");
        el.dataset.studio2OriginalDisplayPriority=el.style.getPropertyPriority("display");
        el.dataset.studio2OriginalAria=el.getAttribute("aria-hidden")??"";
        el.dataset.studio2OriginalInert=el.hasAttribute("inert")?"yes":"no";
      }
      el.style.setProperty("display","none","important");
      el.setAttribute("aria-hidden","true");
      el.setAttribute("inert","");
    }else if(el.dataset.studio2NativeReplaced==="true"){
      const display=el.dataset.studio2OriginalDisplay||"";
      const priority=el.dataset.studio2OriginalDisplayPriority||"";
      if(display)el.style.setProperty("display",display,priority);
      else el.style.removeProperty("display");
      if(el.dataset.studio2OriginalAria)el.setAttribute("aria-hidden",el.dataset.studio2OriginalAria);
      else el.removeAttribute("aria-hidden");
      if(el.dataset.studio2OriginalInert!=="yes")el.removeAttribute("inert");
      for(const key of ["studio2NativeReplaced","studio2OriginalDisplay",
        "studio2OriginalDisplayPriority","studio2OriginalAria","studio2OriginalInert"])
        delete el.dataset[key as keyof DOMStringMap];
    }
  });
}
