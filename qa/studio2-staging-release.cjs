const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");
const crypto=require("node:crypto");
const assert=require("node:assert/strict");
const {execFileSync}=require("node:child_process");

const root=fs.mkdtempSync(path.join(os.tmpdir(),"showset-staging-release-"));
const run=(script,args)=>execFileSync(process.execPath,[script,...args],{
  encoding:"utf8",stdio:"pipe"
});
const sha=value=>crypto.createHash("sha256").update(value).digest("hex");
const original=Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlQzXkAAAAASUVORK5CYII=",
  "base64"
);
const id="asset-"+sha(original);
function signedBackup(revision,text){
  const workspace={schemaVersion:2,revision,
    pages:{home:{slug:"home",route:"/",sections:[{
      id:"test",type:"hero",title:text,image:"asset:"+id
    }]}},
    globals:{theme:{navy:"#0D2F49"},header:{links:[]}},
    media:[{id,name:"test.png",type:"image/png",size:original.length,
      width:1,height:1,alt:"Event photograph",tags:[],
      createdAt:"2026-10-30T00:00:00Z"}],
    updatedAt:"2026-10-30T00:00:00Z"
  };
  const body={format:"showset-studio2-backup",version:2,
    at:"2026-10-30T00:00:00Z",origin:"https://studio.example.test",
    records:{},assets:[{id,type:"image/png",base64:original.toString("base64")}],
    workspace};
  return {...body,checksum:sha(JSON.stringify(body))};
}
const prepare="scripts/prepare-studio-release.mjs";
const verify="scripts/verify-studio-release.mjs";
const save=(name,doc)=>{
  const file=path.join(root,name);
  fs.writeFileSync(file,JSON.stringify(doc));
  return file;
};
const fail=(script,args)=>assert.throws(()=>run(script,args),/Command failed/);
try{
  const first=signedBackup(7,"First reviewed version");
  const backup=save("approved.json",first);
  const dest=path.join(root,"release-42");
  const flags=["--target",dest,"--release-id","42","--expect-revision","7"];
  const dry=run(prepare,[backup,"--dry-run",...flags]);
  assert.match(dry,/No website source or public assets were modified/);
  assert.ok(!fs.existsSync(dest),"Dry run may not write candidate files");
  fail(prepare,[backup,"--apply","--target",dest,
    "--release-id","42","--expect-revision","6"]);
  assert.ok(!fs.existsSync(dest),"Wrong revision may not write source");
  fail(prepare,[backup,"--apply","--release-id","42","--expect-revision","7"]);
  assert.match(run(prepare,[backup,"--apply",...flags]),/no deployment performed/);
  const manifest=JSON.parse(fs.readFileSync(
    path.join(dest,".showset-staging/manifest.json"),"utf8"));
  assert.equal(manifest.checkpointId,42);
  assert.equal(manifest.sourceRevision,7);
  assert.equal(manifest.backupChecksum,first.checksum);
  assert.equal(manifest.files.length,3);
  assert.match(run(verify,["--target",dest]),/PASS private SHOWSET staging/);

  const built=(file,text)=>{
    const target=path.join(dest,"out",file);
    fs.mkdirSync(path.dirname(target),{recursive:true});
    fs.writeFileSync(target,text);
  };
  built("index.html",'<html><head><title>Home</title></head><body><h1>SHOWSET</h1></body></html>');
  built("studio/next/index.html",
    '<meta name="robots" content="noindex"><h1>Private editing workspace</h1>');
  built("studio/next/preview/index.html",
    '<meta name="robots" content="noindex"><h1>Private editing workspace</h1>');
  assert.match(run(verify,["--target",dest,"--built"]),/"buildChecked":true/);

  // Prevent an accidental public editor exposure, even on a valid build.
  built("studio/next/index.html",'<h1>Studio editor</h1>');
  fail(verify,["--target",dest,"--built"]);
  built("studio/next/index.html",
    '<meta name="robots" content="noindex"><h1>Private editing workspace</h1>');

  // A tiny single-byte change invalidates the release rather than being silently accepted.
  const pages=path.join(dest,"content/pages.json");
  const approved=fs.readFileSync(pages);
  fs.appendFileSync(pages,"\n");
  fail(verify,["--target",dest]);
  fs.writeFileSync(pages,approved);
  const originalPath=path.join(dest,"public/media/studio/"+id+".png");
  fs.appendFileSync(originalPath,"altered");
  fail(verify,["--target",dest]);
  fs.writeFileSync(originalPath,original);
  assert.match(run(verify,["--target",dest]),/PASS/);

  // A rollback is a *new* reviewed checkpoint, never an overwrite of history.
  const rollback=save("rollback.json",signedBackup(8,"Earlier approved content"));
  const target2=path.join(root,"rollback-43");
  run(prepare,[rollback,"--apply","--target",target2,
    "--release-id","43","--expect-revision","8"]);
  assert.match(run(verify,["--target",target2]),/PASS/);
  assert.ok(fs.existsSync(dest),"The earlier checkpoint remains intact");
  assert.equal(JSON.parse(fs.readFileSync(
    path.join(target2,".showset-staging/manifest.json"))).checkpointId,43);

  const bad=save("invalid.json",{...first,checksum:"0".repeat(64)});
  const invalidTarget=path.join(root,"invalid-target");
  fail(prepare,[bad,"--apply","--target",invalidTarget,
    "--release-id","44","--expect-revision","7"]);
  assert.ok(!fs.existsSync(invalidTarget));

  console.log("PASS staging release dry-run, review ID/revision lock, immutable assets, static route protections, checksum tamper rejection and non-destructive rollback rehearsal.");
}finally{
  fs.rmSync(root,{recursive:true,force:true});
}
