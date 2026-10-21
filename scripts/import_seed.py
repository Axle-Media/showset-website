from pathlib import Path
import json,re
root=Path(__file__).resolve().parents[1]
seed=json.load(open(root/'content/legacy-wordpress-seed.json'))
def url(o):
    s=o.get('url','') if isinstance(o,dict) else str(o or '')
    return s.replace('__ASSET__','/media').replace('/showset-new-home/','/')
def norm(i,n):
    st=i['settings']; items=[]
    for j in st.get('items',[]):
        items.append({'id':re.sub('[^a-z0-9-]','-',j.get('label','item').lower())[:28]+'-'+str(len(items)), 'title':j.get('label',j.get('headline','')), 'accent':j.get('accent',''), 'description':j.get('description',''),'image':url(j.get('image')),'href':url(j.get('url'))})
    return {'id':f'section-{n+1}','type':i['kind'], 'headline':st.get('headline',''), 'accent':st.get('accent',''), 'body':re.sub(r'</?p[^>]*>','\n\n',st.get('description','')).strip(), 'image':url(st.get('image')), 'pattern':st.get('pattern')=='yes', 'reveal':st.get('reveal')=='yes','buttonLabel':st.get('button_text',''), 'buttonHref':url(st.get('button_url')), 'secondaryLabel':st.get('secondary_text',''), 'secondaryHref':url(st.get('secondary_url')), 'items':items, 'speed':int(st.get('speed',{}).get('size',6)) if isinstance(st.get('speed'),dict) else 6,'formTitle':st.get('form_title',''), 'helperText':st.get('helper_text','')}
pages={}
for p in seed['pages']:
 slug=p['slug'].replace('showset-new-home','home')
 if p.get('parent'): route='/work/'+slug+'/'
 elif slug=='home': route='/'
 else: route='/'+slug+'/'
 pages[slug]={'slug':slug,'route':route,'title':p['title'].replace('SHOWSET / New Home','SHOWSET | Events & Creative Agency'),'sections':[norm(s,n) for n,s in enumerate(p['sections'])],'seo':{'title':p['title'].replace('SHOWSET / New Home','SHOWSET | Events & Creative Agency'),'description':''}}
# global config
nav=seed['global']['header']['settings'];foot=seed['global']['footer']['settings']
globals={'brand':{'wordmark':'showset','tagline':'events & creative agency'},'header':{'buttonLabel':nav['button_text'],'buttonHref':url(nav['button_url']), 'links':[{'label':x['label'],'href':url(x['url'])} for x in nav['items']], 'services':[{'label':x['label'],'href':url(x['url'])} for x in nav['service_links']]},'footer':{'description':foot['description'],'links':[{'label':x['label'],'href':url(x['url'])} for x in foot['items']], 'copyright':foot['copyright']},'theme':{'navy':'#0D2F49','navyDark':'#071E2E','blue':'#153B54','teal':'#12BAAF','sand':'#E5D8C3','white':'#FAF9FD','fontHeading':'Poppins','fontBody':'Manrope','headingTracking':'-0.018em','bodyTracking':'0.005em','headingLeading':1.08,'bodyLeading':1.55,'sectionSpace':108,'radius':20,'buttonHeight':43,'patternOpacity':0.09}, 'motion':{'enabled':True,'circleReveal':True,'heroScale':1.14,'storyParallax':0.15,'carouselSeconds':6}}
(root/'content/pages.json').write_text(json.dumps(pages,ensure_ascii=False,indent=2))
(root/'content/globals.json').write_text(json.dumps(globals,ensure_ascii=False,indent=2))
print('Pages',len(pages),'sections',sum(len(p['sections']) for p in pages.values()))
