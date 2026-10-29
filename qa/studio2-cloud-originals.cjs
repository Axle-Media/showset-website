const assert=require("node:assert/strict");
const fs=require("node:fs");
const ts=require("typescript");
const vm=require("node:vm");
const {createHash,webcrypto}=require("node:crypto");
const bytes=Buffer.from("89504e470d0a1a0a0000000d494844520000000100000001","hex");
const hash=createHash("sha256").update(bytes).digest("hex");
const id="asset-"+hash;
const validationModule={exports:{}};
const validationScript=ts.transpileModule(
  fs.readFileSync("lib/studio2/image-validation.ts","utf8"),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
  }).outputText;
vm.runInNewContext("(function(exports,module){"+validationScript+"\n})")(
  validationModule.exports,validationModule
);
const source=fs.readFileSync("lib/studio2/cloud.ts","utf8");
const js=ts.transpileModule(source,{compilerOptions:{
  module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022
}}).outputText;
const calls=[];
const response=(value,status=200,type="application/json")=>new Response(
  type==="application/json"?JSON.stringify(value):value,
  {status,headers:{"content-type":type}}
);
let tamperedDownload=false;
const fetch=async(url,init)=>{
  const path=new URL(url).pathname;
  calls.push({path,method:init.method||"GET"});
  if(path==="/auth/v1/token")
    return response({access_token:"valid",refresh_token:"refresh",expires_in:3600,
      user:{id:"test-user",email:"owner@showset.test"}});
  if(path.endsWith("/showset_studio_members"))
    return response([{role:"owner",active:true}]);
  if(path.includes("/storage/v1/object/authenticated/"))
    return response(tamperedDownload?Buffer.from("not an image"):bytes,200,"image/png");
  if(path.includes("/storage/v1/object/showset-studio-media/"))
    return response({Key:"site/"+id},201);
  throw Error("Unknown endpoint "+path);
};
const sandboxModule={exports:{}};
vm.runInNewContext("(function(exports,require,module,process,fetch,URL,Blob,crypto){"+
  js+"\n})",{Response,Uint8Array})(sandboxModule.exports,(name)=>{
    if(name==="./image-validation")return validationModule.exports;
  if(name==="./model")return {assertWorkspace:()=>{}};
    throw Error("Unexpected module");
  },sandboxModule,{env:{NEXT_PUBLIC_SHOWSET_SUPABASE_URL:"https://test.supabase.co",
    NEXT_PUBLIC_SHOWSET_SUPABASE_PUBLISHABLE_KEY:"public_test"}},
  fetch,URL,Blob,webcrypto);
(async()=>{
  const cloud=new sandboxModule.exports.CloudStore({
    url:"https://test.supabase.co",key:"public_test"
  });
  await cloud.signIn("owner@showset.test","password");
  const original=new Blob([bytes],{type:"image/png"});
  await assert.rejects(()=>cloud.putOriginal(original,"asset-"+"0".repeat(64)),
    /content-addressed ID/);
  assert.equal(calls.filter(c=>c.method==="POST"&&
    c.path.includes("/object/showset-studio-media/")).length,0,
    "Hash mismatch must fail before any network upload");
  const disguised=new Blob([Buffer.from("this is not a png")],{type:"image/png"});
  const forgedId="asset-"+createHash("sha256").update(
    Buffer.from(await disguised.arrayBuffer())).digest("hex");
  await assert.rejects(()=>cloud.putOriginal(disguised,forgedId),
    /bytes do not match/);
  assert.equal(calls.filter(c=>c.method==="POST"&&
    c.path.includes("/object/showset-studio-media/")).length,0,
    "Forged MIME must fail before upload even when SHA-256 matches");
  await cloud.putOriginal(original,id);
  assert.equal(calls.filter(c=>c.method==="POST"&&
    c.path.includes("/object/showset-studio-media/")).length,1);
  const downloaded=await cloud.getOriginal({id});
  assert.equal(await downloaded.arrayBuffer().then(b=>Buffer.compare(Buffer.from(b),bytes)),0);
  tamperedDownload=true;
  await assert.rejects(()=>cloud.getOriginal({id}),/not a supported image/);
  tamperedDownload=false;
  const tooLarge=new Blob([new Uint8Array(8*1024*1024+1)],{type:"image/png"});
  await assert.rejects(()=>cloud.putOriginal(tooLarge,id),/up to 8 MB/);
  console.log("PASS cloud originals reject forged MIME, validate dimensions and SHA-256, and reject corrupt authenticated downloads.");
})().catch(error=>{console.error(error);process.exitCode=1});
