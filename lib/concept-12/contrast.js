/** Decorative ink layer: retain light text on navy and use brand navy inside teal. */
export function syncDotContrast(host) {
  const stage=host.querySelector('.dot-stage');
  const words=stage?.querySelector('.dot-words:not(.dot-contrast-words)');
  if(!stage||!words)return;
  let mask=stage.querySelector('.dot-contrast-mask');
  if(!mask){
    mask=host.ownerDocument.createElement('div');
    mask.className='dot-contrast-mask';
    mask.setAttribute('aria-hidden','true');mask.setAttribute('inert','');
    const copy=words.cloneNode(false);copy.classList.add('dot-contrast-words');
    copy.removeAttribute('id');copy.removeAttribute('style');
    mask.append(copy);stage.append(mask);
  }
  const copy=mask.firstElementChild;
  if(copy.innerHTML!==words.innerHTML)copy.innerHTML=words.innerHTML;
  copy.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));
}
