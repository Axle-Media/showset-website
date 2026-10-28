// Delegated editorial interactions survive Studio edits and route transitions.
// Studio swaps one photo at a time. Work filters and paginates a growing portfolio.
export function mountEditorialExperiences(host, still = false) {
  const studio = host.querySelector('.view[data-view="studio"]');
  const work = host.querySelector('.view[data-view="work"]');
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
    observer?.disconnect();
    mutations?.disconnect();
    host.removeEventListener('click', onClick);
    host.removeEventListener('focusin', onFocus);
    host.removeEventListener('pointerover', onPointer);
  };
}
