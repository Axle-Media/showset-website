// Delegated editorial interactions survive Studio edits and route transitions.
// Studio swaps one photo at a time. Work filters and paginates a growing portfolio.
export function mountEditorialExperiences(host, still = false) {
  const studio = host.querySelector('.view[data-view="studio"]');
  const work = host.querySelector('.view[data-view="work"]');
  // Studio's scroll hero is the same kind of pinned, expanding photographic
  // composition as the homepage, but it owns its own frame state and cleanup.
  const hero = studio?.querySelector('[data-studio-hero-track]');
  const clamp = value => Math.max(0,Math.min(1,value));
  let studioHeroFrame = 0;
  let studioHeroObserver;
  let heroDisposed = false;
  if (hero) {
    const first = hero.querySelector('[data-studio-hero-first]');
    const follow = hero.querySelector('[data-studio-hero-follow]');
    const photo = hero.querySelector('[data-studio-hero-photo]');
    const image = photo?.querySelector('img');
    const firstHeading = first?.querySelector('h1');
    const followHeading = follow?.querySelector('h2');

    const setAccess = (scene, visible) => {
      if (!scene || scene.getAttribute('aria-hidden') === String(!visible)) return;
      scene.setAttribute('aria-hidden', String(!visible));
      scene.toggleAttribute('inert', !visible);
    };
    const updateHero = () => {
      studioHeroFrame = 0;
      if (heroDisposed || !studio?.classList.contains('is-current') || !photo || !first || !follow) return;
      const rect = hero.getBoundingClientRect();
      const vh = window.innerHeight;
      const distance = Math.max(1, hero.offsetHeight-vh);
      const p = clamp(-rect.top/distance);
      const expand = clamp(p/.68);
      // The approved homepage inset-to-full-screen camera treatment.
      const top = 14*(1-expand), side = 7.4*(1-expand), bottom = 10*(1-expand);
      const small = window.matchMedia('(max-width:800px)').matches;
      const phone = window.matchMedia('(max-width:540px)').matches;
      const topStart = phone ? 19 : small ? 17 : 14;
      const sideStart = phone ? 4.5 : small ? 5 : 7.4;
      const bottomStart = phone ? 13 : small ? 12 : 10;
      photo.style.inset = (topStart*(1-expand)).toFixed(3)+'% '+(sideStart*(1-expand)).toFixed(3)+'% '+(bottomStart*(1-expand)).toFixed(3)+'%';
      photo.style.borderRadius = (12*(1-expand)).toFixed(2)+'px';
      photo.style.boxShadow = '0 '+Math.round(38*(1-expand))+'px '+Math.round(105*(1-expand))+'px rgba(0,0,0,.28)';
      if (image) image.style.transform = 'translate3d(0,'+(-1.5+2.8*expand).toFixed(2)+'%,0) scale('+(1.095-.072*expand).toFixed(4)+')';

      // The first statement lifts away, then the next follows it upwards,
      // instead of two headings appearing simultaneously.
      const fadeFirst = 1-clamp((p-.30)/.23);
      const arrive = clamp((p-.51)/.20);
      first.style.opacity = String(fadeFirst);
      first.style.transform = 'translate3d(0,'+(-70*clamp((p-.26)/.35)).toFixed(2)+'px,0)';
      follow.style.opacity = String(arrive);
      follow.style.transform = 'translate3d(0,'+(70*(1-arrive)).toFixed(2)+'px,0)';

      const within = rect.bottom>vh*.1 && rect.top<vh;
      if (within) firstHeading?.classList.add('is-revealed');
      if (p>=.59 && within) followHeading?.classList.add('is-revealed');
      if (p<.40) followHeading?.classList.remove('is-revealed');
      setAccess(first,fadeFirst>=.22);
      setAccess(follow,arrive>=.82);
      hero.dataset.studioProgress = p.toFixed(3);
    };
    const scheduleHero = () => {
      if (heroDisposed || studioHeroFrame || still) return;
      studioHeroFrame = window.requestAnimationFrame(updateHero);
    };
    if (still) {
      hero.dataset.studioMotion = 'still';
      setAccess(first,true);
      setAccess(follow,true);
      firstHeading?.classList.add('is-revealed');
      followHeading?.classList.add('is-revealed');
    } else {
      hero.dataset.studioMotion = 'on';
      // On a native route transition, the Studio view is made current without
      // remounting its engine. Observe only its visibility state.
      studioHeroObserver = new MutationObserver(scheduleHero);
      studioHeroObserver.observe(studio,{attributes:true,attributeFilter:['class','hidden']});
      window.addEventListener('scroll',scheduleHero,{passive:true});
      window.addEventListener('resize',scheduleHero,{passive:true});
      scheduleHero();
    }
    // Kept on the cleanup closure below.
    hero._studioHeroCleanup = () => {
      heroDisposed = true;
      studioHeroObserver?.disconnect();
      window.removeEventListener('scroll',scheduleHero);
      window.removeEventListener('resize',scheduleHero);
      if (studioHeroFrame) window.cancelAnimationFrame(studioHeroFrame);
      hero.removeAttribute('data-studio-motion');
      hero.removeAttribute('data-studio-progress');
    };
  }

  const activate = index => {
    if (!studio) return;
    const buttons = [...studio.querySelectorAll('[data-studio-choice]')];
    if (!buttons.some(button => Number(button.dataset.studioChoice) === index)) return;
    buttons.forEach(button => {
      const selected = Number(button.dataset.studioChoice) === index;
      button.setAttribute('aria-pressed', String(selected));
      button.closest('[data-studio-entry]')?.classList.toggle('is-active', selected);
    });
    studio.querySelectorAll('[data-studio-frame]').forEach(frame => {
      const selected = Number(frame.dataset.studioFrame) === index;
      frame.classList.toggle('is-active', selected);
      frame.dataset.active = String(selected);
    });
  };
  const index = work?.querySelector('[data-work-index]');
  const filters = work?.querySelector('[data-work-filters]');
  const more = work?.querySelector('[data-work-more]');
  let activeCategory = 'all';
  let visibleCount = 6;
  const updateWork = () => {
    if (!work || !index || !filters || !more) return;
    const cards = [...index.querySelectorAll('.work-portfolio-card')];
    // Filters are only presented when the catalogue has enough depth.
    filters.hidden = cards.length < 6 || !filters.querySelector('.work-filter');
    let visible = 0;
    cards.forEach(card => {
      const matched = activeCategory === 'all' || card.dataset.workCategory === activeCategory;
      if (matched) visible++;
      const show = matched && visible <= visibleCount;
      card.hidden = !show;
      card.setAttribute('aria-hidden', String(!show));
      if (!show) card.setAttribute('tabindex', '-1');
      else card.removeAttribute('tabindex');
    });
    more.hidden = visible <= visibleCount;
    filters.querySelectorAll('.work-filter').forEach(button => {
      const selected = button.dataset.workFilter === activeCategory;
      button.classList.toggle('is-current', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  };
  const onClick = event => {
    const button = event.target.closest?.('[data-studio-choice]');
    if (button && studio?.contains(button)) {
      activate(Number(button.dataset.studioChoice));
      return;
    }
    const filter = event.target.closest?.('[data-work-filter]');
    if (filter && work?.contains(filter)) {
      activeCategory = filter.dataset.workFilter || 'all';
      visibleCount = 6;
      updateWork();
      return;
    }
    const moreButton = event.target.closest?.('[data-work-more-button]');
    if (moreButton && work?.contains(moreButton)) {
      visibleCount += 6;
      updateWork();
    }
  };
  const onFocus = event => {
    const button = event.target.closest?.('[data-studio-choice]');
    if (button && studio?.contains(button)) activate(Number(button.dataset.studioChoice));
  };
  const onPointer = event => {
    if (still || event.pointerType !== 'mouse') return;
    const button = event.target.closest?.('[data-studio-choice]');
    if (button && studio?.contains(button)) activate(Number(button.dataset.studioChoice));
  };
  host.addEventListener('click', onClick);
  host.addEventListener('focusin', onFocus);
  host.addEventListener('pointerover', onPointer, {passive:true});
  let observer;
  if (work && !still && typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-exposed');
        observer.unobserve(entry.target);
      }
    }, {threshold:.12,rootMargin:'0px 0px -5% 0px'});
  }
  // The index is recreated by the Studio content bridge. Keep controls in sync
  // without restarting the route engine or attaching listeners to individual cards.
  const observeCards = () => {
    updateWork();
    if (observer && index) {
      index.querySelectorAll('.work-portfolio-card:not(.is-exposed)')
        .forEach(card => observer.observe(card));
    }
  };
  let mutations;
  if (index && typeof MutationObserver !== 'undefined') {
    mutations = new MutationObserver(() => {
      activeCategory = 'all';
      visibleCount = 6;
      observeCards();
    });
    mutations.observe(index, {childList:true});
  }
  observeCards();
  return () => {
    hero?._studioHeroCleanup?.();
    observer?.disconnect();
    mutations?.disconnect();
    host.removeEventListener('click', onClick);
    host.removeEventListener('focusin', onFocus);
    host.removeEventListener('pointerover', onPointer);
  };
}
