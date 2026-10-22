from pathlib import Path
import re
p=Path(__file__).resolve().parents[1]
s=(p/'lib/concept-12/source-runtime.js').read_text(encoding='utf-8').strip()
assert s.startswith('(() => {') and s.endswith('})();')
s=s[len('(() => {'):-len('})();')]
s=s.replace('root = document','root = host')
s=s.replace("const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;", "const reduced = options.staticMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;")
s=re.sub(r'\b(window|document|dropdownBtn|mobileToggle|projectTrigger|projectWrapper|option|el|carousel|heroStage)\.addEventListener\(',r'listen(\1,',s)
s=s.replace('window.setInterval(', 'trackedInterval(')
s=s.replace("$('#contact-form').addEventListener(", "listen($('#contact-form'),")
s=s.replace("projectWrapper.classList.add('js-select-ready');", "projectWrapper.classList.add('js-select-ready');projectSelect.setAttribute('aria-hidden','true');projectSelect.tabIndex=-1;")
s=s.replace("(projectOptions.find(x=>x.dataset.value===projectSelect.value)||projectOptions[0])?.focus();", "trackedFrame(()=>(projectOptions.find(x=>x.dataset.value===projectSelect.value)||projectOptions[0])?.focus());")
s=s.replace("projectOptions[next]?.focus();", "trackedFrame(()=>projectOptions[next]?.focus());")


s=re.sub(r'(?<![\w.])setTimeout\(', 'trackedTimeout(', s)
s=s.replace('requestAnimationFrame(', 'trackedFrame(')
s=s.replace('new IntersectionObserver(', 'new TrackedObserver(')
s=s.replace("Math.min(2,Math.floor(fp*3))", "Math.min((options.filmCount||3)-1,Math.floor(fp*(options.filmCount||3)))")
s=s.replace("Math.min(3,Math.floor(sp*4))", "Math.min(Math.max(1,options.serviceCount??4)-1,Math.floor(sp*Math.max(1,options.serviceCount??4)))")
s=s.replace("const key=serviceKeys[n],d=data[key];", "const key=serviceKeys[n%4],d=data[key];")
marker="$('#service-visual-link').setAttribute('aria-label','Explore '+({events:'Events and experiences',creative:'Creative and design',digital:'Digital and marketing',production:'Content and production'})[key]);"
s=s.replace(marker,marker+"\n    const override=options.serviceOverrides?.[n];if(override?.description!=null)$('#service-visual-copy').textContent=override.description;if(override?.href){$('#service-visual-link').href=override.href;$('#service-visual-link').setAttribute('aria-label','Explore '+override.title);}rewriteLinks();")

s=s.replace("fp*3-idx", "fp*(options.filmCount||3)-idx")
s=s.replace("1.13-p*.11", "(options.heroScale??1.13)-p*((options.heroScale??1.13)-1.02)")
s=s.replace("(16*(1-p))", "((options.heroRadius??16)*(1-p))")
s=s.replace("    const hero=$('#hero-track'),heroRect=hero.getBoundingClientRect();", "    if(!options.stillScenes?.includes('hero')){\n    const hero=$('#hero-track'),heroRect=hero.getBoundingClientRect();")
s=s.replace("    const film=$('#film-track'),filmRect=film.getBoundingClientRect();", "    }\n    const film=$('#film-track'),filmRect=film.getBoundingClientRect();")
s=s.replace("if(filmRect.top<vh && filmRect.bottom>0)", "if(filmRect.top<vh && filmRect.bottom>0 && !options.stillScenes?.includes('story'))")
s=s.replace("if(serviceRect.top<vh && serviceRect.bottom>0 && !small.matches)", "if(serviceRect.top<vh && serviceRect.bottom>0 && !small.matches && !options.stillScenes?.includes('services'))")
s=s.replace("if(dotRect.top < vh && dotRect.bottom > 0)", "if(dotRect.top < vh && dotRect.bottom > 0 && !options.stillScenes?.includes('dot'))")

s=s.replace("((.5-local)*2)", "((.5-local)*2*(options.storyParallax??1))")
s=s.replace("},4700);", "},Math.max(1,options.carouselSeconds??4.7)*1000);")

s=s.replace("$('meta[name=\"description\"]')", "document.querySelector('meta[name=\"description\"]')")
s=s.replace("a.getAttribute('href')===`#${key}`", "a.dataset.routeKey===key")
s=s.replace("      setupReveals();\n      if (key === 'home')", "      options.bind?.(host,key); rewriteLinks();\n      setupReveals();\n      if (key === 'home')")
s=s.replace("const initial=routeFromHash()||'home';", "const initial=options.route || routeFromHash() || 'home';")
prefix='''// Original Concept 12 JavaScript, with lifecycle ownership and path-routing adapters.
// Generated from reference/CONCEPT_12_APPROVED.html; animation equations remain upstream.
export function mountConcept(host, options) {
  const cleanups=[],timeouts=new Set(),frames=new Set();
  const listen=(target,type,handler,settings)=>{target.addEventListener(type,handler,settings);cleanups.push(()=>target.removeEventListener(type,handler,settings));};
  const trackedTimeout=(callback,delay)=>{const id=setTimeout(()=>{timeouts.delete(id);callback();},delay);timeouts.add(id);return id;};
  const trackedInterval=(callback,delay)=>{const id=setInterval(callback,delay);cleanups.push(()=>clearInterval(id));return id;};
  const trackedFrame=(callback)=>{const id=requestAnimationFrame(time=>{frames.delete(id);callback(time);});frames.add(id);return id;};
  class TrackedObserver extends IntersectionObserver { constructor(...args){super(...args);cleanups.push(()=>this.disconnect());} }
  const paths={home:'/',events:'/events-experiences/',creative:'/creative-design/',digital:'/digital-marketing/',production:'/content-production/',studio:'/our-studio/',work:'/our-work/',contact:'/contact/','case-events':'/work/atmosphere-is-everything/','case-identity':'/work/made-to-be-remembered/','case-production':'/work/behind-every-moment/'};
  const keyForPath=(path)=>Object.keys(paths).find(key=>paths[key]===path);
  function rewriteLinks(){host.querySelectorAll('a[href^="#"]').forEach(a=>{const key=a.getAttribute('href').slice(1);if(paths[key]){a.dataset.routeKey=key;a.href=paths[key];}});}
'''
# Configure callback changes only textContent-backed previews, never template HTML.
s=s.replace("  let current = 'home';", "  options.configure?.(data,caseStudies);\n  let current = 'home';")
suffix='''
  rewriteLinks();
  listen(document,'click',ev=>{
    if(ev.defaultPrevented || ev.button!==0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey)return;
    const a=ev.target.closest?.('a[href]');if(!a || !host.contains(a) || a.target==='_blank' || a.hasAttribute('download'))return;
    const url=new URL(a.href,location.href);if(url.origin!==location.origin || url.hash)return;
    const key=keyForPath(url.pathname);if(!key)return;
    ev.preventDefault();if(options.editor)return;
    if(location.pathname!==url.pathname)history.pushState(null,'',url.pathname);
    setRoute(key);
  });
  listen(window,'popstate',()=>setRoute(keyForPath(location.pathname)||'home'));
  return ()=>{cleanups.reverse().forEach(fn=>fn());timeouts.forEach(clearTimeout);frames.forEach(cancelAnimationFrame);document.body.classList.remove('menu-open');};
}
'''
# Initial home needs its editable bindings before observers are configured.
s=s.replace("if(initial==='home'){current='home';setupReveals();setService(0)}", "if(initial==='home'){current='home';options.bind?.(host,'home');setupReveals();setService(0)}")
(p/'lib/concept-12/runtime.js').write_text(prefix+s+suffix,encoding='utf-8')
print('Ported runtime, managed listener sites:',s.count('listen('))
