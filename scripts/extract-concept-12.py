from pathlib import Path
import re,base64,hashlib,json
project=Path(__file__).resolve().parents[1]
source=project/'reference/CONCEPT_12_APPROVED.html'; raw=source.read_text(encoding='utf-8')
assets=project/'public/concept-12';assets.mkdir(exist_ok=True)
manifest=[]
def image(m):
 value=m[0];kind,payload=value.split(';base64,');data=base64.b64decode(payload);ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/svg+xml':'svg'}[kind[5:]]
 name=hashlib.sha256(data).hexdigest()[:20]+'.'+ext; (assets/name).write_bytes(data)
 if not any(x['file']==name for x in manifest):manifest.append({'file':name,'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)})
 return '/concept-12/'+name
s=re.sub(r'data:image/(?:jpeg|png|webp|svg\+xml);base64,[A-Za-z0-9+/=]+',image,raw)
css=re.search(r'<style[^>]*>([\s\S]*?)</style>',s)[1]
js=re.search(r'<script[^>]*>([\s\S]*?)</script>',s)[1]
markup=re.search(r'<body[^>]*>([\s\S]*?)<script',s)[1]
dest=project/'lib/concept-12';dest.mkdir(exist_ok=True)
(project/'app/concept-12.css').write_text(css,encoding='utf-8')
(dest/'markup.json').write_text(json.dumps(markup,ensure_ascii=False),encoding='utf-8')
(dest/'source-runtime.js').write_text(js,encoding='utf-8')
(dest/'assets.json').write_text(json.dumps({'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'assets':manifest},indent=2),encoding='utf-8')
for name in ['data','caseStudies']:
 marker='const '+name+' = ';start=js.find(marker)
 if start<0:marker='const '+name+'=';start=js.find(marker)
 obj,end=json.JSONDecoder().raw_decode(js[start+len(marker):].lstrip());(dest/(name+'.json')).write_text(json.dumps(obj,ensure_ascii=False,indent=2),encoding='utf-8')
print('Extracted byte-identical assets:',len(manifest),'CSS:',len(css),'markup:',len(markup),'JS:',len(js))
for f in (project/'public/media').glob('*'):
 h=hashlib.sha256(f.read_bytes()).hexdigest();match=next((x['file'] for x in manifest if x['sha256']==h),None)
 print(f.name,match)
