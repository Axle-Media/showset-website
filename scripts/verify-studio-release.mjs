#!/usr/bin/env node
/** Fail-closed release candidate verification. Does not deploy or write. */
import path from "node:path";
import process from "node:process";
import {verifyStagingCandidate} from "./studio-release-manifest.mjs";

const args=process.argv.slice(2);
if(args.some(a=>!["--target","--built","--help"].includes(a)&&
  args[args.indexOf(a)-1]!=="--target"))
  throw Error("Unexpected option. Use --target <isolated-checkout> [--built].");
if(args.includes("--help")){
  console.log("Usage: node scripts/verify-studio-release.mjs --target <candidate-checkout> [--built]");
  process.exit(0);
}
const i=args.indexOf("--target");
if(i<0||!args[i+1])throw Error("A candidate checkout path is required.");
const result=verifyStagingCandidate(path.resolve(args[i+1]),{
  checkBuild:args.includes("--built"),
});
const branch=process.env.SHOWSET_RELEASE_BRANCH;
if(branch){
  const matched=/^release\/studio-r([1-9]\d*)-rev([1-9]\d*)$/.exec(branch);
  if(!matched || Number(matched[1])!==result.checkpointId||
    Number(matched[2])!==result.sourceRevision)
    throw Error("Release branch does not match the reviewed checkpoint and revision.");
}
console.log("PASS private SHOWSET staging release candidate",JSON.stringify(result));
console.log("This check does not grant deployment approval or publish the website.");
