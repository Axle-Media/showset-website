import type {MediaAsset,Workspace} from "./model";

/** Counts references in pages, reusable templates and global branding.
 * Metadata is deliberately excluded, so editing a filename cannot affect
 * published image usage or trigger accidental deletion of shared originals. */
export function mediaUsage(workspace:Workspace,id:string){
  const token="asset:"+id;
  const count=(value:unknown)=>JSON.stringify(value).split(token).length-1;
  const pages=Object.values(workspace.pages).map(page=>({
    title:page.title,route:page.route,count:count(page),
  })).filter(page=>page.count>0);
  const reusable=(workspace.sectionLibrary||[]).reduce(
    (n,section)=>n+count(section.section),0);
  const global=count(workspace.globals);
  return {pages,reusable,global,total:pages.reduce((n,page)=>n+page.count,0)+
    reusable+global};
}
export function searchMedia(assets:MediaAsset[],query:string,tag:string){
  const needle=query.trim().toLowerCase();
  return assets.filter(asset=>
    (!tag||asset.tags.includes(tag)) &&
    (!needle||[asset.name,asset.alt,...asset.tags].some(value=>
      value.toLowerCase().includes(needle)
    )));
}
export function parseTags(value:string):string[]{
  const tags=[...new Set(value.split(",").map(s=>s.trim().toLowerCase())
    .filter(Boolean))];
  if(tags.length>20||tags.some(tag=>tag.length>40||
    !/^[a-z0-9][a-z0-9 -]*$/.test(tag)))
    throw Error("Use up to 20 tags, each 1–40 letters, numbers, spaces or hyphens.");
  return tags;
}
