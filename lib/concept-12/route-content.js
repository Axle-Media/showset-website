// Original source content population, shared by build-time HTML and browser routing.
const serviceKeys=['events','creative','digital','production'];
export function populateCategory(host,key,data) {
    const $=selector=>host.querySelector(selector);
    const d = data[key];
    $('#category-title').innerHTML = `<span class="wipe-line"><span>${d.title[0]}</span></span><span class="wipe-line accent-line"><span>${d.title[1]}</span></span>`;
    const catimg = $('#category-image'); catimg.src = d.image; catimg.alt = `${d.title.join(' ')} visual concept`;
    const banner = $('#category-banner'); const bannerImages={events:'/concept-12/cacc0a760b075d1ccf18.webp',creative:'/concept-12/f778ffc756368369e22f.webp',digital:'/concept-12/857bfe33201dcedbc6c9.webp',production:'/concept-12/cacc0a760b075d1ccf18.webp'}; banner.src = bannerImages[key]; banner.alt = {events:'Event production rigging in warm stage light',creative:'Close-up of thoughtful event and brand details',digital:'Planning materials and creative production detail',production:'Technical event rigging during setup'}[key];
    $('#category-description').textContent = d.description;
    $('.category-inner .solid-link').innerHTML = d.button+' <span>↗</span>';
    const bannerH=$('.category-banner h2');
    const phrase=d.banner.replace(/\.$/,'');
    bannerH.innerHTML = '<span class="wipe-line"><span>'+phrase+'</span></span>';
    $('.category-banner .solid-link').innerHTML=d.bannerButton+' <span>↗</span>';
    $('#category-clusters').innerHTML=d.clusters.map(([h,p])=>'<article><h3>'+h+'</h3><p>'+p+'</p></article>').join('');
    $('#category-feature-title').textContent=d.feature[0];
    $('#category-feature-copy').textContent=d.feature[1];
    $('#category-process-list').innerHTML=d.process.map(([h,p],i)=>'<article><h3>'+h+'</h3><p>'+p+'</p></article>').join('');
    $('#category-capabilities-list').innerHTML=d.capabilities.map(([h,p])=>'<details><summary>'+h+'<span aria-hidden="true">+</span></summary><p>'+p+'</p></details>').join('');
    $('#category-belief').textContent = d.belief;
    $('#category-belief-copy').textContent = d.beliefCopy;
    const categoryLabels={events:'Events & experiences',creative:'Creative & design',digital:'Digital & marketing',production:'Content & production'};
    $('#category-more-links').innerHTML = serviceKeys.filter(x => x !== key).map(x => `<a href="#${x}">${categoryLabels[x]} <span>↗</span></a>`).join('');
  }
export function populateCaseStudy(host,key,caseStudies) {
    const $=selector=>host.querySelector(selector);
    const c = caseStudies[key];
    if(!c)return;
    $('#case-detail-image').src=c.image;
    $('#case-detail-image').alt=c.title;
    $('#case-detail-second-image').src=c.detail;
    $('#case-detail-title').innerHTML=c.title+'<span class="teal-dot">.</span>';
    $('#case-detail-intro').textContent=c.intro;
    $('#case-detail-belief').textContent=c.belief;
    $('#case-detail-description').textContent=c.description;
    $('#case-detail-quote').textContent=c.quote;
  }

export function selectCurrentView(host,key) {
  const name=serviceKeys.includes(key)?'service':key.startsWith('case-')?'case-study':key;
  host.querySelectorAll('.view').forEach(view=>{
    const active=view.dataset.view===name;
    view.classList.toggle('is-current',active);
    if(active){view.removeAttribute('hidden');view.removeAttribute('inert');view.removeAttribute('aria-hidden')}
    else{view.setAttribute('hidden','');view.setAttribute('inert','');view.setAttribute('aria-hidden','true')}
  });
  return name;
}
