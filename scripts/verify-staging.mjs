import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
const root=path.resolve('staging-out'),manifest=JSON.parse(fs.readFileSync(path.join(root,'deployment.json'),'utf8'));
let count=0;
for(const [file,hash] of Object.entries(manifest.files)){
 if(file.includes('..')||file.startsWith('/')||/(^|\/)(studio|studio-preview|api|backend|reference|node_modules|\.git|\.showset-deploy)(\/|$)/i.test(file)||/local-studio-backup|\.(php|sql|env|bak|zip|tar|gz|map|pem|key)$/i.test(file))throw Error('Disallowed staging file: '+file);
 const data=fs.readFileSync(path.join(root,file));
 if(createHash('sha256').update(data).digest('hex')!==hash)throw Error('Asset hash mismatch: '+file);
 if(/\.(js|html|css|txt)$/.test(file)){
  const text=data.toString('utf8');
  if(/showset-demo-pages|showset-preview-published-pages|showset-studio-recovery|\/api\/showset\/index\.php|localhost:300[0-9]|127\.0\.0\.1:300[0-9]|-----BEGIN (?:OPENSSH |RSA )?PRIVATE KEY-----/.test(text))throw Error('Local editor/backend or development configuration leaked into '+file);
 }
 count++;
}
for(const route of manifest.routes){const file=path.join(root,route.replace(/^\//,''),'index.html');if(!fs.existsSync(file))throw Error('Missing public route '+route);if(!/<meta name="robots" content="[^"]*noindex/.test(fs.readFileSync(file,'utf8')))throw Error('Missing noindex on '+route)}
if(fs.existsSync(path.join(root,'studio'))||fs.existsSync(path.join(root,'studio-preview')))throw Error('Studio must not export');
console.log('Validated '+manifest.routes.length+' public routes and '+count+' hashed files; no editor, backend or local development configuration.');
