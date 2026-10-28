// Delegated interactions survive Studio content refreshes and native route transitions.
// All text remains visible; selection changes only a photographic layer.
export function mountEditorialExperiences(host, still = false) {
  const studio = host.querySelector('.view[data-view="studio"]');
  const work = host.querySelector('.view[data-view="work"]');
  const activate = (index) => {
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
  const onClick = event => {
    const button = event.target.closest?.('[data-studio-choice]');
    if (!button || !studio?.contains(button)) return;
    activate(Number(button.dataset.studioChoice));
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
    }, {threshold:0.13});
    work.querySelectorAll('.work-feature').forEach(card => observer.observe(card));
  }
  return () => {
    observer?.disconnect();
    host.removeEventListener('click', onClick);
    host.removeEventListener('focusin', onFocus);
    host.removeEventListener('pointerover', onPointer);
  };
}
