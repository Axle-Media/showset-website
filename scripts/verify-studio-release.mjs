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
console.log("PASS private SHOWSET staging release candidate",JSON.stringify(result));
console.log("This check does not grant deployment approval or publish the website.");
