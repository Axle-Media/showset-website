import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const sha256=value=>crypto.createHash("sha256").update(value).digest("hex");
export const stagingManifest=".showset-staging/manifest.json";
export const isReleaseId=value=>Number.isSafeInteger(value)&&value>0;
const mediaPath=/^public\/media\/studio\/asset-[a-f0-9]{64}\.(png|jpg|webp|avif)$/;
const safeHash=value=>typeof value==="string"&&/^[a-f0-9]{64}$/.test(value);
const parseContent=(root,file)=>JSON.parse(fs.readFileSync(path.join(root,file),"utf8"));
const inside=(root,relative)=>{
  const absolute=path.resolve(root,relative);
  if(absolute===root||!absolute.startsWith(root+path.sep))
    throw Error("Manifest path leaves the staging workspace.");
  return absolute;
};
function assetReferences(value){
  if(typeof value==="string")return value.startsWith("/media/studio/asset-")?[value.slice(1)]:[];
  if(Array.isArray(value))return value.flatMap(assetReferences);
  if(value&&typeof value==="object")return Object.values(value).flatMap(assetReferences);
  return [];
}
export function makeStagingManifest({
  root,checkpointId,sourceRevision,backupChecksum,originals,
}){
  if(!isReleaseId(checkpointId)||!isReleaseId(sourceRevision)||!safeHash(backupChecksum))
    throw Error("A positive approved checkpoint, revision and checksum are required.");
  const pages=parseContent(root,"content/pages.json");
  const globals=parseContent(root,"content/globals.json");
  const paths=["content/pages.json","content/globals.json",
    ...[...new Set(originals)].sort()];
  const files=paths.map(relative=>{
    if(!["content/pages.json","content/globals.json"].includes(relative)&&
      !mediaPath.test(relative))throw Error("Unrecognised release asset: "+relative);
    return {path:relative,sha256:sha256(fs.readFileSync(inside(root,relative)))};
  });
  const routes=Object.values(pages).map(p=>p.route).sort();
  const manifest={
    format:"showset-staging-release",version:1,
    checkpointId,sourceRevision,backupChecksum,
    routes,files,
  };
  if(!Array.isArray(routes)||!routes.includes("/")||
      routes.some(p=>typeof p!=="string"||!p.startsWith("/")))
    throw Error("Invalid release routes.");
  if(!globals?.theme||!Array.isArray(globals?.header?.links))
    throw Error("Incomplete global design data.");
  return manifest;
}
export function verifyStagingCandidate(root,{checkBuild=false}={}){
  const base=path.resolve(root);
  const mf=inside(base,stagingManifest);
  if(!fs.existsSync(mf))throw Error("Missing reviewed staging manifest.");
  const manifest=JSON.parse(fs.readFileSync(mf,"utf8"));
  if(manifest.format!=="showset-staging-release"||manifest.version!==1||
    !isReleaseId(manifest.checkpointId)||!isReleaseId(manifest.sourceRevision)||
    !safeHash(manifest.backupChecksum)||!Array.isArray(manifest.files)||
    !Array.isArray(manifest.routes))
    throw Error("Invalid staging release metadata.");
  const pages=parseContent(base,"content/pages.json");
  const globals=parseContent(base,"content/globals.json");
  const expectedRoutes=Object.values(pages).map(p=>p.route).sort();
  if(!expectedRoutes.includes("/")||
    JSON.stringify(expectedRoutes)!==JSON.stringify(manifest.routes))
    throw Error("Page routes differ from the reviewed release.");
  const used=new Set([...assetReferences(pages),...assetReferences(globals)]);
  const required=["content/pages.json","content/globals.json",...used].sort();
  const declared=manifest.files.map(item=>item.path).sort();
  if(JSON.stringify(required)!==JSON.stringify(declared))
    throw Error("Staging manifest omits or adds files relative to the site.");
  const pathSet=new Set();
  for(const item of manifest.files){
    if(typeof item.path!=="string"||
       !["content/pages.json","content/globals.json"].includes(item.path)&&
         !mediaPath.test(item.path) ||
       pathSet.has(item.path)||!safeHash(item.sha256))
      throw Error("Invalid or duplicated release file path.");
    pathSet.add(item.path);
    const location=inside(base,item.path);
    if(!fs.existsSync(location)||sha256(fs.readFileSync(location))!==item.sha256)
      throw Error("Staging file does not match approved source: "+item.path);
    if(item.path.startsWith("public/media/studio/")){
      const matched=item.path.match(/asset-([a-f0-9]{64})\./);
      if(!matched||matched[1]!==item.sha256)
        throw Error("Original media bytes do not match immutable asset ID.");
    }
  }
  if(checkBuild){
    const exportRoot=inside(base,"out");
    if(!fs.existsSync(exportRoot))throw Error("No built static staging site.");
    for(const route of expectedRoutes){
      if(!/^\/[a-z0-9/-]*\/$/.test(route))
        throw Error("Unexpected release route.");
      const file=inside(exportRoot,path.join(route.slice(1),"index.html"));
      if(!fs.existsSync(file))throw Error("Built preview missing route "+route);
      const html=fs.readFileSync(file,"utf8");
      if(!/<title[^>]*>[^<]+<\/title>/i.test(html)||!/<h1(?:\s|>)/i.test(html))
        throw Error("Built route missing SEO title or primary heading: "+route);
    }
    for(const route of ["studio/next","studio/next/preview"]){
      const html=fs.readFileSync(inside(exportRoot,route+"/index.html"),"utf8");
      if(!html.includes("Private editing workspace")||!html.includes("noindex"))
        throw Error("Staging build exposes an unprotected Studio route.");
    }
  }
  return {checkpointId:manifest.checkpointId,sourceRevision:manifest.sourceRevision,
    routes:manifest.routes.length,originals:used.size,
    buildChecked:checkBuild};
}
