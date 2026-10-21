"""Browser style smoke test fixture: mirrors React JSX structure but DOES NOT execute React hooks."""
import json,html
from pathlib import Path
root=Path(__file__).resolve().parents[1]
pages=json.loads((root/'content/pages.json').read_text())
blocks=pages['home']['sections']
e=lambda s:html.escape(str(s),quote=True)
def title(b):return f'<h2 class="ss-title">{e(b["headline"])}<br><span>{e(b["accent"])}</span></h2>'
def para(b):return '<div class="ss-copy"><p>'+e(b['body'])+'</p></div>'
hero,manifesto,story,services,work,dot,cta=blocks
head='<div class="ss-header"><div class="ss-nav-shell"><a class="ss-wordmark" href="#">showset<i>.</i><small>events & creative agency</small></a><nav class="ss-primary-nav"><a>What we do</a><a>Our studio</a><a>Our work</a><a>Contact</a></nav><div class="ss-nav-actions"><a class="ss-button">Let’s talk ↗</a><button class="ss-mobile-toggle">☰</button></div></div></div>'
herohtml=f'''<section class="ss-hero-track" id="hero"><div class="ss-hero-sticky"><div class="ss-hero-media" id="hero-media"><div class="ss-hero-photo" id="hero-photo" style="background-image:linear-gradient(90deg,#071e2e85,transparent),url({e(hero['image'])})"></div></div><div class="ss-hero-glow"></div><div class="ss-wrap ss-hero-content" id="hero-content"><h1 class="ss-title">{e(hero['headline'])}<br><span>{e(hero['accent'])}</span></h1>{para(hero)}<div class="ss-button-group"><a class="ss-button">See what we do ↗</a><a class="ss-button ghost">Get to know us ↗</a></div></div><div class="ss-wrap ss-hero-second" id="hero-second"><h2 class="ss-title">An idea is a start.<br><span>Let’s see what it becomes.</span></h2><p>We take the good part of “what if?” and turn it into something you can actually experience.</p></div></div></section>'''
splithtml=f'<section class="ss-section ss-split"><div class="ss-pattern"></div><div class="ss-wrap ss-split-grid"><div>{title(manifesto)}</div><div class="ss-split-body">{para(manifesto)}<a class="ss-button ghost">Meet the people behind it ↗</a></div></div></section>'
frames=''.join(f'<div class="ss-story-frame {"active" if i==0 else ""}" style="background-image:linear-gradient(90deg,#061a2bd9,#091d2b22),url({e(k["image"])})"></div>' for i,k in enumerate(story['items']))
sh=f'''<section class="ss-story-outer" id="story" style="--chapters:{len(story['items'])}"><div class="ss-story-sticky"><div class="ss-story-frames">{frames}</div><div class="ss-wrap ss-story-copy"><div class="ss-story-words"><h2>{e(story['items'][0]['title'])}<br><span>{e(story['items'][0]['accent'])}</span></h2><p>{e(story['items'][0]['description'])}</p></div></div><div class="ss-story-progress"><div></div></div></div></section>'''
svcrows=''.join(f'<a class="ss-service-row {"active" if i==0 else ""}"><span>{e(k["title"])}</span><span>↗</span></a>' for i,k in enumerate(services['items']))
svcscene=''.join(f'<div class="ss-service-scene {"active" if i==0 else ""}" style="background-image:url({e(k["image"])})"></div>' for i,k in enumerate(services['items']))
svchtml=f'''<section id="services" class="ss-services-track" style="--chapters:{len(services['items'])}"><div class="ss-services-sticky ss-section"><div class="ss-wrap ss-services-layout"><div class="ss-services-intro">{title(services)}{para(services)}</div><div class="ss-services-rows">{svcrows}</div><div class="ss-service-feature">{svcscene}<div class="ss-service-feature-copy">{e(services['items'][0]['description'])}</div></div></div></div></section>'''
casecards=''.join(f'<a class="ss-case-card"><img src="{e(k["image"])}"><span class="ss-case-caption"><strong>{e(k["title"])}</strong><small>{e(k["description"])}</small></span></a>' for k in work['items']*2)
workhtml=f'''<section class="ss-section ss-work"><div class="ss-pattern"></div><div class="ss-wrap"><div class="ss-split-grid ss-work-top">{title(work)}{para(work)}</div><div class="ss-carousel"><div class="ss-case-rail">{casecards}</div></div><div class="ss-carousel-bottom"><a class="ss-text-link">Explore our case studies ↗</a><span class="ss-carousel-progress">01 / 03</span></div></div></section>'''
dothtml=f'''<section class="ss-dot-track" id="dot"><div class="ss-dot-sticky"><div class="ss-dot-circle" id="dot-circle"></div><div class="ss-dot-content"><h2 class="ss-dot-heading"><span class="ss-dot-line">Serious about</span><span class="ss-dot-line">the <em>details.</em></span><span class="ss-dot-line">Wild about</span><span class="ss-dot-line">the <em>possibilities.</em></span></h2><p>{e(dot['body'])}</p></div></div></section>'''
ctahtml=f'<section class="ss-section ss-cta"><div class="ss-wrap ss-cta-grid">{title(cta)}<div>{para(cta)}<a class="ss-button">Let’s make a plan ↗</a></div></div></section>'
script='''<script>
let raf=0;function clamp(x){return Math.max(0,Math.min(1,x))}
function tick(){raf=0;let vh=innerHeight;
const h=document.getElementById('hero'),hr=h.getBoundingClientRect(), hp=clamp(-hr.top/Math.max(1,h.offsetHeight-vh));
const hm=document.getElementById('hero-media');hm.style.inset=`${15*(1-hp)}% ${7.6*(1-hp)}% ${10*(1-hp)}%`;hm.style.borderRadius=`${16*(1-hp)}px`;
document.getElementById('hero-photo').style.transform=`translate3d(0,${(-2.4+hp*4)}%,0) scale(${1.14-hp*.11})`;
const fg=document.getElementById('hero-content');fg.style.opacity=1-clamp((hp-.22)/.26);
const sec=document.getElementById('hero-second');sec.style.opacity=clamp((hp-.55)/.2);
const d=document.getElementById('dot'),r=d.getBoundingClientRect();if(r.bottom>0 && r.top<vh){const p=clamp(-r.top/Math.max(1,d.offsetHeight-vh));document.getElementById('dot-circle').style.clipPath=`circle(${10+Math.pow(p,1.5)*(Math.hypot(innerWidth/2,vh/2)+5-10)}px at 50% 50%)`}
}
window.addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(tick)},{passive:true});window.addEventListener('resize',tick);requestAnimationFrame(tick);
</script>'''
page='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app/globals.css"><title>SHOWSET Motion Style Fixture</title></head><body>'''+'<div class="ss-site">'+head+'<main>'+herohtml+splithtml+sh+svchtml+workhtml+dothtml+ctahtml+'</main></div>'+script+'</body></html>'
(root/'tests/motion-style-fixture.html').write_text(page)
print('written fixture bytes',len(page))
