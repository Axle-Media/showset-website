const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const ts=require("typescript");
const validationModule={exports:{}};
const validationScript=ts.transpileModule(
  fs.readFileSync("lib/studio2/image-validation.ts","utf8"),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
  }).outputText;
vm.runInNewContext("(function(exports,module){"+validationScript+"\n})")(
  validationModule.exports,validationModule
);
const source=fs.readFileSync("lib/studio2/cloud.ts","utf8");
const transpiled=ts.transpileModule(source,{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText;
const database={row:null,releases:[],users:new Map()};
const response=(value,status=200,headers={"content-type":"application/json"})=>
  new Response(status===204?null:JSON.stringify(value),{status,headers});
let calls=[];
async function fakeFetch(url,init){
  const path=new URL(url).pathname;
  calls.push({path,method:init.method||"GET",headers:init.headers});
  if(path==="/auth/v1/token"){
    const credentials=JSON.parse(init.body);
    const identity=credentials.email==="owner@showset.test"
      ? {id:"owner-id",email:"owner@showset.test",role:"owner"}
      : {id:"editor-id",email:"editor@showset.test",role:"editor"};
    database.users.set(identity.id,identity);
    return response({access_token:"token-"+identity.id,
      refresh_token:"refresh-"+identity.id,expires_in:3600,
      token_type:"bearer",user:{id:identity.id,email:identity.email}});
  }
  const uid=(init.headers.Authorization||"").replace("Bearer token-","");
  const identity=database.users.get(uid);
  if(!identity)return response({message:"Not authenticated"},401);
  if(path.endsWith("/showset_studio_members"))
    return response([{role:identity.role,active:true}]);
  if(path.endsWith("/showset_studio_workspaces")){
    if(init.method==="POST"){
      if(database.row)return response({message:"duplicate key"},409);
      database.row=JSON.parse(init.body);return response([database.row],201);
    }
    if(init.method==="PATCH"){
      const expected=Number(new URL(url).searchParams.get("revision").slice(3));
      if(!database.row||database.row.revision!==expected)return response([]);
      database.row=JSON.parse(init.body);return response([database.row]);
    }
    return response(database.row?[database.row]:[]);
  }
  if(path.endsWith("/rpc/showset_studio_publish")){
    if(identity.role!=="owner")return response({message:"Permission denied"},403);
    const {p_expected_revision}=JSON.parse(init.body);
    if(p_expected_revision!==database.row?.revision)
      return response({message:"Draft changed"},409);
    database.releases.push({...database.row,by:uid});
    return response(database.releases.length);
  }
  if(path.includes("/object/showset-studio-media/"))
    return response({Key:"site/test"},201);
  return response({message:"Unknown route"},404);
}
const sandboxModule={exports:{}};
const load=vm.runInNewContext(
  "(function(exports,require,module,process,fetch,URL,Blob,Date){"+
    transpiled+"\n})",
  {Response,Uint8Array},
);
load(sandboxModule.exports,(name)=>{
  if(name==="./image-validation")return validationModule.exports;
  if(name==="./model")return {assertWorkspace:(workspace)=>{
    assert.equal(workspace.schemaVersion,2);
  }};
  throw Error("Unexpected module "+name);
},sandboxModule,{
  env:{
    NEXT_PUBLIC_SHOWSET_SUPABASE_URL:"https://showset-test.supabase.co",
    NEXT_PUBLIC_SHOWSET_SUPABASE_PUBLISHABLE_KEY:"sb_publishable_test",
  },
},fakeFetch,URL,Blob,Date);
const {CloudStore,CloudConflictError,cloudConfig}=sandboxModule.exports;
(async()=>{
  const config=cloudConfig();
  assert.ok(config);
  const owner=new CloudStore(config),editor=new CloudStore(config);
  await owner.signIn("owner@showset.test","secret");
  await editor.signIn("editor@showset.test","secret");
  assert.equal(owner.role,"owner");assert.equal(editor.role,"editor");
  assert.equal(await owner.read(),null);
  const document={schemaVersion:2,revision:0,pages:{home:{}},
    media:[],globals:{theme:{}},updatedAt:""};
  const first=await owner.save(document,0);
  assert.equal(first.revision,1);
  const stale=await editor.read();
  assert.equal(stale.revision,1);
  const next=await owner.save(first,1);
  assert.equal(next.revision,2);
  await assert.rejects(()=>editor.save(stale,1),CloudConflictError);
  await assert.rejects(()=>editor.approve(2),/Publisher role required/);
  const checkpoint=await owner.approve(2);
  assert.equal(checkpoint,1);
  assert.equal(database.releases.length,1);
  assert.equal(database.releases[0].revision,2);
  assert.ok(calls.every(c=>!JSON.stringify(c.headers).includes("service_role")));
  assert.ok(calls.some(c=>c.path==="/auth/v1/token"&&!c.headers.Authorization),
    "sign-in sends publishable key, never forged JWT");
  owner.signOut();
  await assert.rejects(()=>owner.read(),/Sign in/);
  console.log("PASS cloud invite roles, auth, CAS conflicts, publisher-only immutable snapshots and no service credentials.");
})().catch(e=>{console.error(e);process.exitCode=1});
