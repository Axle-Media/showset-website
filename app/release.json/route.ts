import {execFileSync} from 'node:child_process';

// A framework-managed static route is published by Vercel as well as static export.
export const dynamic='force-static';
export function GET(){
 let commit=process.env.VERCEL_GIT_COMMIT_SHA||'';
 if(!/^[a-f0-9]{40}$/i.test(commit)){
  try{commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()}catch{commit='unknown'}
 }
 return Response.json({commit:/^[a-f0-9]{40}$/i.test(commit)?commit:'unknown'});
}
