from pathlib import Path
import subprocess,time,json,signal,base64,re
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
fixture=(root/'tests/motion-style-fixture.html').read_text()
css=(root/'app/globals.css').read_text()
css=css.split("\n",1)[1]
css=css.replace("url('/brand/pattern.svg')", "url('data:image/svg+xml;base64,"+base64.b64encode((root/'public/brand/pattern.svg').read_bytes()).decode()+"')")
fixture=fixture.replace('<link rel="stylesheet" href="/app/globals.css">','<style>'+css+'</style>')
for asset in (root/'public/media').glob('*.webp'):
 fixture=fixture.replace('/media/'+asset.name,'data:image/webp;base64,'+base64.b64encode(asset.read_bytes()).decode())
results=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for width,height in [(1440,900),(1024,768),(768,1024),(390,844),(320,700)]:
   page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
   errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(fixture,wait_until='load')
   page.wait_for_timeout(300)
   for name,sel in [('hero','.ss-hero-content'),('services','#services'),('work','.ss-work'),('dot','#dot')]:
    page.locator(sel).scroll_into_view_if_needed(timeout=10000)
    page.wait_for_timeout(130)
    if width==1440 and name in ('hero','services','dot') or width==390 and name in ('hero','services','dot'):
     page.screenshot(path=str(root/'tests'/f'{width}-{name}.png'))
   data=page.evaluate('''() => ({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,
     headline:getComputedStyle(document.querySelector('.ss-hero-track .ss-title')).color,
     serviceColumns:getComputedStyle(document.querySelector('.ss-services-layout')).gridTemplateColumns,
     dotMask:getComputedStyle(document.querySelector('.ss-dot-circle')).clipPath,
     cards:document.querySelectorAll('.ss-case-card').length,
     body:document.querySelector('.ss-work .ss-copy').innerText.slice(0,50)})''')
   results.append({'viewport':[width,height], 'errors':errors,**data})
   page.close()
  browser.close()
finally:
 pass
(root/'tests/fixture-qa-results.json').write_text(json.dumps(results,indent=2))
print(json.dumps(results,indent=2))
