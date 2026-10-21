import fs from 'node:fs';
import path from 'node:path';
const out=path.resolve('out');
if(!fs.existsSync(path.join(out,'index.html'))){console.error('Run npm run build before packaging.');process.exit(1)}
const api=path.join(out,'api','showset');fs.mkdirSync(api,{recursive:true});
for(const f of ['index.php','config.example.php','.htaccess'])fs.copyFileSync(path.join('backend','api',f),path.join(api,f));
fs.mkdirSync(path.join(out,'media','uploads'),{recursive:true});
console.log('Static website and PHP backend are ready in out/');
console.log('Configure config.local.php only on the server, never in Git or public downloads.');
