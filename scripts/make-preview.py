from pathlib import Path
from html import escape as e
import json,re,shutil
R=Path(__file__).resolve().parents[1];O=R/'preview';O.mkdir(exist_ok=True)
for folder in ['media','brand']:(O/folder).mkdir(exist_ok=True)
for f in (R/'public/media').iterdir():shutil.copy2(f,O/'media'/f.name)
shutil.copy2(R/'public/brand/pattern.svg',O/'brand/pattern.svg')
css=(R/'app/globals.css').read_text().replace("url('/brand/pattern.svg')","url('brand/pattern.svg')")
(O/'site.css').write_text(css)
D=json.loads((R/'content/pages.json').read_text());G=json.loads((R/'content/globals.json').read_text());
def text(v):return e(str(v or ''))
def href(v):
 if not v:return '#'
 if v.startswith('/work/') or v.startswith('/'):
  s=v.strip('/').split('/')[-1] or 'home';return '#page='+s
 return '#services' if v=='#services' else text(v)
def img(v):return text((v or '/media/planning.webp').lstrip('/'))
def title(s,cls=''):
 return '<h2 class="ss-title '+cls+'">'+text(s['headline'])+('<br/><span>'+text(s['accent'])+'</span>' if s['accent'] else '')+'</h2>'
def para(s):return '<div class="ss-copy">'+''.join('<p>'+text(v.strip())+'</p>' for v in re.split(r'\n\s*\n',s.get('body','')) if v.strip())+'</div>'
def act(s,secondary=False):
 label=s['secondaryLabel'] if secondary else s['buttonLabel']; link=s['secondaryHref'] if secondary else s['buttonHref']; return '<a class="ss-button '+('ghost' if secondary else '')+'" href="'+href(link)+'">'+text(label)+' <span>↗</span></a>' if label else ''
def pattern(s):return '<div class="ss-pattern"></div>' if s['pattern'] else ''
def shtml(s):
 t=s['type'];p=pattern(s);ts=title(s,'ss-circle-reveal ss-reveal' if s['reveal'] else '')
 if t in ('hero','pagehero'):
  return f'<section class="ss-hero {"ss-page-hero" if t=="pagehero" else ""}"><div class="ss-hero-media" style="background-image:linear-gradient(90deg,#071e2edd,#071e2e33 80%),url(\'{img(s["image"])}\')"></div><div class="ss-hero-glow"></div><div class="ss-wrap ss-hero-content">{ts.replace("h2","h1")}{para(s)}<div class="ss-button-group">{act(s)}{act(s,True)}</div></div></section>'
 if t=='split':return f'<section class="ss-section ss-split">{p}<div class="ss-wrap ss-split-grid"><div>{ts}</div><div class="ss-split-body">{para(s)}{act(s)}</div></div></section>'
 if t=='story':
  ims=''.join('<div class="ss-story-frame '+('active' if n==0 else '')+'" style="background-image:linear-gradient(90deg,#071e2edb,#071e2e33),url(\''+img(x['image'])+'\')"></div>' for n,x in enumerate(s['items']))
  first=s['items'][0];return f'<section class="ss-story-outer" data-stories="{text(json.dumps(s["items"],ensure_ascii=False))}" style="--chapters:{len(s["items"])}"><div class="ss-story-sticky">{ims}<div class="ss-wrap ss-story-copy"><div class="ss-story-words"><h2>{text(first["title"])}<br/><span>{text(first["accent"])}</span></h2><p>{text(first["description"])}</p></div></div><div class="ss-story-progress"><div></div></div></div></section>'
 if t=='services':
  rows=''.join(f'<a class="ss-service-row {"active" if n==0 else ""}" href="{href(x["href"])}" data-svc="{n}"><span>{text(x["title"])}</span><span>↗</span></a>' for n,x in enumerate(s['items']))
  ims=''.join(f'<div class="{"active" if n==0 else ""}" style="background-image:linear-gradient(180deg,transparent,#081c2b9e),url(\'{img(x["image"])}\')"></div>' for n,x in enumerate(s['items']))
  return f'<section id="services" class="ss-section ss-services"><div class="ss-wrap ss-services-layout"><div class="ss-services-intro">{ts}{para(s)}</div><div class="ss-services-rows">{rows}</div><div class="ss-service-feature">{ims}</div></div></section>'
 if t=='work':
  cards=''.join(f'<a class="ss-case-card" href="{href(x["href"])}"><img src="{img(x["image"])}" alt=""/><span class="ss-case-caption"><strong>{text(x["title"])}</strong><small>{text(x["description"])}</small><b>↗</b></span></a>' for x in (s['items']+s['items']))
  return f'<section class="ss-section ss-work">{p}<div class="ss-wrap"><div class="ss-split-grid ss-work-top">{ts}{para(s)}</div><div class="ss-carousel">{cards}</div><a class="ss-text-link" href="#page=our-work">Explore our case studies ↗</a></div></section>'
 if t=='dot':return f'<section class="ss-dot-track"><div class="ss-dot-sticky"><div class="ss-dot-circle"></div><div class="ss-dot-content">{title(s)}<p>{text(s["body"])}</p></div></div></section>'
 if t=='cta':return f'<section class="ss-section ss-cta">{p}<div class="ss-wrap ss-cta-grid">{ts}<div>{para(s)}{act(s)}</div></div></section>'
 if t=='visual':return f'<section class="ss-visual" style="background-image:linear-gradient(90deg,#071e2edb,#071e2e33),url(\'{img(s["image"])}\')"><div class="ss-wrap">{ts}{para(s)}{act(s)}</div></section>'
 if t=='items':
  cards=''.join(f'<div class="ss-feature"><strong>{text(x["title"])}</strong><p>{text(x["description"])}</p></div>' for x in s['items'])
  return f'<section class="ss-section ss-feature-section">{p}<div class="ss-wrap"><div class="ss-section-heading">{ts}{para(s)}</div><div class="ss-feature-grid">{cards}</div></div></section>'
 if t=='accordion':
  acc=''.join(f'<details><summary>{text(x["title"])}<span>+</span></summary><p>{text(x["description"])}</p></details>' for x in s['items'])
  return f'<section class="ss-section ss-accordion-section">{p}<div class="ss-wrap ss-split-grid">{ts}<div>{para(s)}<div class="ss-accordion">{acc}</div></div></div></section>'
 if t=='contact':return f'<section class="ss-section ss-contact"><div class="ss-wrap ss-contact-grid"><div>{ts}{para(s)}</div><form class="ss-form" onsubmit="event.preventDefault();alert(\'Preview only. The form will be connected after backend deployment.\')"><h2>{text(s["formTitle"])}</h2><label>Your name<input placeholder="What should we call you?"></label><label>Email address<input type="email" placeholder="Somewhere we can get back to you"></label><label>Company or organisation<input></label><label>What are we making?<select>{"".join("<option>"+text(x["title"])+"</option>" for x in s["items"])}</select></label><label>Tell us about it<textarea rows="5"></textarea></label><button class="ss-button">{text(s["buttonLabel"])} ↗</button><small>{text(s["helperText"])}</small></form></div></section>'
 return ''
nav=''.join(f'<a href="{href(l["href"])}">{text(l["label"])}</a>' for l in G['header']['links'] if l['label'].lower()!='what we do')
services=''.join(f'<a href="{href(l["href"])}">{text(l["label"])} ↗</a>' for l in G['header']['services'])
header=f'<header class="ss-header"><div class="ss-nav-shell"><a class="ss-wordmark" href="#page=home">showset<i>.</i><small>events & creative agency</small></a><nav class="ss-primary-nav"><div class="ss-dropdown"><button class="ss-nav-trigger">What we do ⌄</button><div class="ss-dropdown-panel" hidden>{services}</div></div>{nav}</nav><div class="ss-nav-actions"><a class="ss-button" href="#page=contact">Let’s talk ↗</a><button class="ss-mobile-toggle">☰</button></div></div></header>'
footnav=''.join(f'<a href="{href(l["href"])}">{text(l["label"])}</a>' for l in G['footer']['links'])
footer=f'<footer class="ss-footer"><div class="ss-wrap ss-footer-inner"><div><a class="ss-wordmark" href="#page=home">showset<i>.</i><small>events & creative agency</small></a><p>{text(G["footer"]["description"])}</p></div><div class="ss-footer-links">{footnav}</div></div><div class="ss-wrap ss-footer-bottom"><span>© 2026 SHOWSET. All rights reserved.</span><span>Ideas shouldn’t sit still.</span></div></footer>'
content=''.join(f'<div class="ss-preview-page" data-page="{k}" style="display:{"block" if k=="home" else "none"}">{"".join(shtml(s) for s in pg["sections"])}</div>' for k,pg in D.items())
cssjs='''
const mq=window.matchMedia('(prefers-reduced-motion: reduce)');
const nav=document.querySelector('.ss-primary-nav');const dd=document.querySelector('.ss-dropdown-panel');
document.querySelector('.ss-mobile-toggle').onclick=()=>nav.classList.toggle('open');document.querySelector('.ss-nav-trigger').onclick=e=>{e.stopPropagation();dd.hidden=!dd.hidden};document.addEventListener('click',e=>{if(!e.target.closest('.ss-dropdown'))dd.hidden=true});
function activePage(){const name=(location.hash.match(/page=([a-z0-9-]+)/)||[])[1]||'home';document.querySelectorAll('.ss-preview-page').forEach(x=>x.style.display=x.dataset.page===name?'block':'none');nav.classList.remove('open');dd.hidden=true;window.scrollTo({top:0,behavior:'instant'});observer.disconnect();initReveal();bindServices();}
let observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target)}})},{threshold:.14});
function initReveal(){document.querySelectorAll('.ss-preview-page:not([style*="none"]) .ss-reveal').forEach(x=>{x.classList.remove('is-visible');observer.observe(x)})}
function bindServices(){document.querySelectorAll('.ss-preview-page:not([style*="none"]) .ss-service-row').forEach((x,i)=>{x.onmouseenter=()=>setService(i);x.onfocus=()=>setService(i)});}
function setService(i){const page=document.querySelector('.ss-preview-page:not([style*="none"])');if(!page)return;page.querySelectorAll('.ss-service-row').forEach((x,n)=>x.classList.toggle('active',n===i));page.querySelectorAll('.ss-service-feature>div').forEach((x,n)=>x.classList.toggle('active',n===i))}
function tick(){if(!mq.matches){document.querySelectorAll('.ss-preview-page:not([style*="none"]) .ss-dot-track').forEach(el=>{const r=el.getBoundingClientRect(),m=Math.max(1,r.height-innerHeight),p=Math.min(1,Math.max(0,-r.top/m));el.style.setProperty('--dot-progress',(p*160)+'vmax')});document.querySelectorAll('.ss-preview-page:not([style*="none"]) .ss-story-outer').forEach(el=>{const r=el.getBoundingClientRect(),m=Math.max(1,r.height-innerHeight),p=Math.min(.999,Math.max(0,-r.top/m)),frames=el.querySelectorAll('.ss-story-frame'),n=Math.min(frames.length-1,Math.floor(p*frames.length));frames.forEach((f,i)=>f.classList.toggle('active',i===n));const stories=JSON.parse(el.dataset.stories),cur=stories[n];el.querySelector('.ss-story-words h2').innerHTML=cur.title+'<br><span>'+cur.accent+'</span>';el.querySelector('.ss-story-words p').textContent=cur.description;el.querySelector('.ss-story-progress div').style.width=((n+1)/frames.length*100)+'%'})}};
window.addEventListener('scroll',()=>requestAnimationFrame(tick),{passive:true});window.addEventListener('hashchange',activePage);activePage();tick();
let pause=false;document.querySelectorAll('.ss-carousel').forEach(el=>{el.onmouseenter=()=>pause=true;el.onmouseleave=()=>pause=false;setInterval(()=>{if(!pause&&!document.hidden&&!mq.matches&&el.closest('.ss-preview-page').style.display!=='none'){const card=el.querySelector('.ss-case-card');if(!card)return;let step=card.offsetWidth+18;el.scrollTo({left:(el.scrollLeft+step>el.scrollWidth-el.clientWidth-5)?0:el.scrollLeft+step,behavior:'smooth'})}},6000)})
'''
styles='''<style>:root{--navy:#0D2F49;--navy-dark:#071E2E;--blue:#153B54;--teal:#12BAAF;--sand:#E5D8C3;--white:#FAF9FD;--h-track:-.018em;--b-track:.005em;--h-leading:1.08;--b-leading:1.55;--section-space:108px;--radius:20px;--btn-height:43px;--pattern-opacity:.09}</style>'''
# fallback zooming into single page
html='<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SHOWSET | Next.js Design Review</title><link rel="stylesheet" href="site.css">'+styles+'</head><body><div class="ss-site">'+header+'<main>'+content+'</main>'+footer+'</div><script>'+cssjs+'</script></body></html>'
(O/'index.html').write_text(html)
print('Wrote preview', (O/'index.html').stat().st_size)
