#!/usr/bin/env node
/** The approved Studio export may only update generated content and media.
 * No source code, workflows, server configuration or dependencies may be
 * smuggled into a content-only candidate PR.
 */
import {execFileSync} from "node:child_process";
import process from "node:process";

const base=process.env.SHOWSET_RELEASE_BASE_SHA||"";
if(!/^[a-f0-9]{40}$/.test(base))
  throw Error("Release diff validation requires an exact base commit SHA.");
const changed=execFileSync("git",
  ["diff","--name-only","--no-renames",base,"HEAD"],
  {encoding:"utf8"}).trim().split("\n").filter(Boolean);
const contentFiles=new Set(["content/pages.json","content/globals.json",
  ".showset-staging/manifest.json"]);
const allowed=path=>contentFiles.has(path)||
  /^public\/media\/studio\/asset-[a-f0-9]{64}\.(png|jpg|webp|avif)$/.test(path);
const rejected=changed.filter(file=>!allowed(file));
if(rejected.length)
  throw Error("Release branch changes application or unreviewed files: "+
    rejected.join(", "));
if(!changed.includes(".showset-staging/manifest.json"))
  throw Error("Release candidate did not introduce its approved manifest.");
console.log("PASS Studio release PR contains only reviewed site data and content-addressed media.");
