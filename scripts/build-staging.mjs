import fs from 'node:fs';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const root=process.cwd(), temporary=path.join(root,'.staging-build');
const stash=path.join(temporary,'routes'), moved=[];
fs.mkdirSync(temporary,{recursive:true});
const lock=path.join(temporary,'lock');
const handle=fs.openSync(lock,'wx');
try {
  fs.mkdirSync(stash,{recursive:true});
  for(const name of ['studio','studio-preview']) {
    const source=path.join(root,'app',name), saved=path.join(stash,name);
    if(fs.existsSync(saved))throw Error('Recover the previous staging route stash before building.');
    if(!fs.existsSync(source))throw Error('Expected local editor route missing: '+name);
    fs.renameSync(source,saved);moved.push([saved,source]);
  }
  const build=spawnSync(process.execPath,['node_modules/next/dist/bin/next','build'],{
    stdio:'inherit',env:{...process.env,SHOWSET_STATIC_STAGING:'true',NEXT_PUBLIC_SHOWSET_STATIC_STAGING:'true'}
  });
  if(build.status!==0)throw Error('Staging build failed; no deployable package produced.');
  const output=path.join(root,'staging-out');
  // A dedicated generated directory; never delete the project or normal export.
  fs.rmSync(output,{recursive:true,force:true});fs.mkdirSync(output);
  const pages=JSON.parse(fs.readFileSync('content/pages.json','utf8'));
  const routes=Object.values(pages).map(p=>p.route);
  const directories=new Set(['_next','_not-found','404',...routes.filter(r=>r!=='/').map(r=>r.split('/').filter(Boolean)[0])]);
  for(const entry of fs.readdirSync('out',{withFileTypes:true})){
    const name=entry.name;
    if(entry.isDirectory()&&directories.has(name))fs.cpSync(path.join('out',name),path.join(output,name),{recursive:true});
    if(entry.isFile()&&(name==='index.html'||name==='index.txt'||name==='404.html'||name.startsWith('__next.')))fs.copyFileSync(path.join('out',name),path.join(output,name));
  }
  // Copy only version-controlled approved public assets, never local uploads or backup tools.
  const tracked=execFileSync('git',['ls-files','-z','public'],{encoding:'utf8'}).split('\0').filter(Boolean);
  const allowed=/^public\/(?:brand\/|concept-12\/|fonts\/|media\/(?:planning|rigging|evening|brand|details|sound)\.webp$|favicon\.ico$)/;
  for(const file of tracked.filter(f=>allowed.test(f))){
    const target=path.join(output,file.slice(7));fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(file,target);
  }
  fs.copyFileSync('deploy/staging.htaccess',path.join(output,'.htaccess'));
  fs.writeFileSync(path.join(output,'robots.txt'),'User-agent: *\nDisallow: /\n');
  const sha=process.env.SHOWSET_RELEASE_SHA||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  if(!/^[a-f0-9]{40}$/.test(sha))throw Error('Release SHA must be a complete Git commit.');
  const files={};
  function list(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isSymbolicLink())throw Error('Symlink in staging package');if(e.isDirectory())list(f);else files[path.relative(output,f).split(path.sep).join('/')]=createHash('sha256').update(fs.readFileSync(f)).digest('hex')}}
  list(output);
  fs.writeFileSync(path.join(output,'deployment.json'),JSON.stringify({site:'staging.axlemedia.co.za',sha,readOnly:true,studio:false,routes,files},null,2)+'\n');
  const verify=spawnSync(process.execPath,['scripts/verify-staging.mjs'],{stdio:'inherit'});
  if(verify.status!==0)throw Error('Public staging package validation failed.');
  console.log('Public-only static export ready in staging-out. Local Studio source is restored.');
} finally {
  for(const [saved,source] of moved.reverse())if(fs.existsSync(saved))fs.renameSync(saved,source);
  fs.closeSync(handle);fs.unlinkSync(lock);
}
