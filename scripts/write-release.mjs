import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
let commit=process.env.VERCEL_GIT_COMMIT_SHA||'';
if(!/^[a-f0-9]{40}$/i.test(commit)){try{commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()}catch{commit='unknown'}}
writeFileSync('out/release.json',JSON.stringify({commit: /^[a-f0-9]{40}$/i.test(commit)?commit:'unknown'},null,2)+'\n');
console.log('Wrote public release commit marker.');
