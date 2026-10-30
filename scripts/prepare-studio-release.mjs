#!/usr/bin/env node
/**
 * Prepares an owner-reviewed source release from a checksum-verified Studio
 * workspace backup. Never deploys, commits, uploads or modifies source unless
 * the operator explicitly passes --apply. Run Next build/QA on a separate
 * review branch after creating a source release.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import process from "node:process";
import {makeStagingManifest,stagingManifest,verifyStagingCandidate} from "./studio-release-manifest.mjs";

const sha=(bytes)=>crypto.createHash("sha256").update(bytes).digest("hex");
const usage="Usage: node scripts/prepare-studio-release.mjs <verified-backup.json> [--dry-run|--apply] [--target <directory>] [--release-id <approved-checkpoint>] [--expect-revision <saved-revision>]";
const args=process.argv.slice(2);
if(!args.length||args.includes("--help")){
  console.log(usage);process.exit(args.includes("--help")?0:1);
}
const file=args[0],apply=args.includes("--apply"),
  dry=args.includes("--dry-run")||!apply;
const targetIndex=args.indexOf("--target");
if(targetIndex>=0&&!args[targetIndex+1])throw Error("Missing --target directory.");
const root=path.resolve(targetIndex>=0?args[targetIndex+1]:process.cwd());
const releaseIndex=args.indexOf("--release-id");
const revisionIndex=args.indexOf("--expect-revision");
if((releaseIndex>=0)!==(revisionIndex>=0))
  throw Error("A reviewed release requires both --release-id and --expect-revision.");
if(apply&&targetIndex<0)
  throw Error("Explicit --target is mandatory for any source write.");
const releaseId=releaseIndex>=0?Number(args[releaseIndex+1]):null;
const expectedRevision=revisionIndex>=0?Number(args[revisionIndex+1]):null;
if(releaseId!==null&&(!Number.isSafeInteger(releaseId)||releaseId<1||
   !Number.isSafeInteger(expectedRevision)||expectedRevision<1))
  throw Error("Release ID and saved revision must be positive integers.");
const backup=JSON.parse(fs.readFileSync(file,"utf8"));
if(backup.format!=="showset-studio2-backup"||backup.version!==2||
   typeof backup.checksum!=="string"||!backup.workspace)
  throw Error("This is not a complete SHOWSET Studio backup.");
const {checksum,...body}=backup;
if(sha(Buffer.from(JSON.stringify(body)))!==checksum)
  throw Error("Backup checksum mismatch. Source has not been modified.");
const workspace=backup.workspace;
if(workspace.schemaVersion!==2||!workspace.pages||!workspace.globals?.theme)
  throw Error("Incomplete version 2 Studio workspace.");
if(expectedRevision!==null && workspace.revision!==expectedRevision)
  throw Error("Saved revision does not match the approved release. No write performed.");
const mimeExtension={
  "image/jpeg":"jpg","image/png":"png","image/webp":"webp",
  "image/avif":"avif",
};
const assets=new Map();
for(const asset of backup.assets||[]){
  if(!/^asset-[0-9a-f]{64}$/.test(asset.id)||!mimeExtension[asset.type]||
     typeof asset.base64!=="string"||assets.has(asset.id))
    throw Error("Unsupported or duplicate original image in backup.");
  const bytes=Buffer.from(asset.base64,"base64");
  if(bytes.length>8*1024*1024||sha(bytes)!==asset.id.slice(6))
    throw Error("Original image hash or size mismatch for "+asset.id);
  const valid={
    "image/png":()=>bytes.length>=8&&bytes.subarray(0,8).equals(
      Buffer.from([137,80,78,71,13,10,26,10])),
    "image/jpeg":()=>bytes.length>3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255,
    "image/webp":()=>bytes.length>12&&bytes.toString("ascii",0,4)==="RIFF"&&
      bytes.toString("ascii",8,12)==="WEBP",
    "image/avif":()=>bytes.length>12&&bytes.toString("ascii",4,8)==="ftyp"&&
      ["avif","avis"].includes(bytes.toString("ascii",8,12)),
  }[asset.type];
  if(!valid())throw Error("Original does not match declared image type: "+asset.id);
  assets.set(asset.id,{
    bytes,relative:"/media/studio/"+asset.id+"."+mimeExtension[asset.type],
  });
}
for(const item of workspace.media||[])
  if(!assets.has(item.id))
    throw Error("Missing original media: "+item.id);
const paths=new Set();
function reconcile(value){
  if(typeof value==="string"&&value.startsWith("asset:")){
    const id=value.slice(6);
    const original=assets.get(id);
    if(!original)throw Error("Unresolved asset reference: "+id);
    paths.add(original.relative);
    return original.relative;
  }
  if(Array.isArray(value))return value.map(reconcile);
  if(value&&typeof value==="object"){
    const result={};
    for(const [key,entry] of Object.entries(value))
      result[key]=reconcile(entry);
    return result;
  }
  return value;
}
const pages=reconcile(workspace.pages),globals=reconcile(workspace.globals);
if(!pages.home||!Object.values(pages).every(p=>
  p&&typeof p.route==="string"&&Array.isArray(p.sections)))
  throw Error("Missing or malformed approved page data.");
if(!Array.isArray(globals.header?.links))
  throw Error("Missing global navigation.");
const output={
  pages:path.join(root,"content/pages.json"),
  globals:path.join(root,"content/globals.json"),
};
if(!apply){
  console.log(JSON.stringify({mode:"dry-run",pages:Object.keys(pages).length,
    originals:paths.size,changedPaths:Object.values(output),target:root,
    checkpointId:releaseId,sourceRevision:expectedRevision},null,2));
  console.log("No website source or public assets were modified.");
  process.exit(0);
}
// Preflight every destination before modifying ANY source file.
for(const asset of assets.values()){
  if(!paths.has(asset.relative))continue;
  const location=path.join(root,"public",asset.relative.slice(1));
  if(fs.existsSync(location)&&sha(fs.readFileSync(location))!==sha(asset.bytes))
    throw Error("Existing media hash conflict: "+location);
}
for(const [key,value] of Object.entries({pages,globals})){
  fs.mkdirSync(path.dirname(output[key]),{recursive:true});
  fs.writeFileSync(output[key],JSON.stringify(value,null,2)+"\n","utf8");
}
for(const asset of assets.values()){
  if(!paths.has(asset.relative))continue;
  const location=path.join(root,"public",asset.relative.slice(1));
  fs.mkdirSync(path.dirname(location),{recursive:true});
  if(!fs.existsSync(location))fs.writeFileSync(location,asset.bytes);
}
if(releaseId!==null){
  // Manifest is the last write. An interrupted run cannot pass the candidate
  // validator with a partial or stale source set.
  const manifest=makeStagingManifest({
    root,checkpointId:releaseId,sourceRevision:expectedRevision,
    backupChecksum:checksum,originals:[...paths].map(value=>"public/"+value.slice(1)),
  });
  const file=path.join(root,stagingManifest);
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,JSON.stringify(manifest,null,2)+"\n","utf8");
  verifyStagingCandidate(root);
}
console.log(JSON.stringify({mode:"prepared-source",pages:Object.keys(pages).length,
  originals:paths.size,target:root,checkpointId:releaseId},null,2));
console.log("Source prepared only. Run QA, owner review and build separately; no deployment performed.");
