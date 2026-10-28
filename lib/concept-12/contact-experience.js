// Contact behaviour is lifecycle-owned and never claims delivery without a real endpoint.
// In static builds, this prepares a mailto: draft for the visitor to send themselves.
const configuredEndpoint = process.env.NEXT_PUBLIC_SHOWSET_CONTACT_ENDPOINT || '';
export function mountContactExperience(host, options = {}) {
  const form = host.querySelector('#contact-form');
  const status = host.querySelector('#form-result');
  if (!form || !status) return () => {};
  const note = form.querySelector('.form-note');
  const submit = form.querySelector('.contact-submit');
  const endpoint = (() => {
    const configured = configuredEndpoint.trim();
    if (!configured) return '';
    try {
      const parsed = new URL(configured, window.location.href);
      return parsed.protocol === 'https:' || (parsed.origin === window.location.origin &&
        (parsed.protocol === 'http:' || parsed.protocol === 'https:')) ? parsed.href : '';
    } catch { return ''; }
  })();
  if (endpoint) {
    if (submit) submit.innerHTML = 'Send the idea <span aria-hidden="true">↗</span>';
    if (note) note.textContent = 'You do not need to have all the answers. That is what the conversation is for.';
  }
  const controller = new AbortController();
  const get = name => String(new FormData(form).get(name) || '').trim();
  const read = () => ({
    name: get('name'), email: get('email'), type: get('type'),
    message: get('message'), company: get('company'), date: get('date'),
    budget: get('budget'), website: get('website')
  });
  const recipient = () => {
    const link = host.querySelector('[data-footer-email]');
    const href = link?.getAttribute('href') || 'mailto:hello@showset.co.za';
    const address = href.replace(/^mailto:/i, '').split('?')[0];
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) ? address : 'hello@showset.co.za';
  };
  const mailBody = p => [
    'Hello SHOWSET,','',
    'I would like to start a conversation about a project.','',
    'Name: ' + p.name,
    'Email: ' + p.email,
    ...(p.company ? ['Company / organisation: ' + p.company] : []),
    ...(p.type ? ['What we are making: ' + p.type] : []),
    ...(p.date ? ['Timing: ' + p.date] : []),
    ...(p.budget ? ['Budget: ' + p.budget] : []),
    '','The idea:','',p.message
  ].join('\n');
  const onSubmit = async event => {
    event.preventDefault();
    if (options.editor) {
      status.textContent = 'This is a Studio preview. No message has been sent.';
      return;
    }
    if (!form.reportValidity()) return;
    const payload = read();
    if (payload.website) {
      // Honeypot is only one safeguard; a configured server must validate and rate-limit.
      status.textContent = 'Please contact us by email if you need assistance.';
      return;
    }
    if (endpoint) {
      if (submit) { submit.disabled = true; submit.setAttribute('aria-busy', 'true'); }
      status.textContent = 'Sending your message...';
      try {
        const response = await fetch(endpoint, {
          method:'POST',headers:{'Content-Type':'application/json'},
          credentials:'omit',signal:controller.signal,
          body:JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Submission endpoint rejected the request');
        status.textContent = 'Your message has been sent. We will be in touch.';
        form.reset();
        const value = form.querySelector('#project-trigger .select-value');
        if (value) value.textContent = 'Choose the closest fit';
        form.querySelectorAll('.select-option').forEach(x => x.setAttribute('aria-selected','false'));
      } catch(error) {
        if (error.name !== 'AbortError') status.textContent = 'That did not go through. Please email us directly using the contact details below.';
      } finally {
        if (submit) { submit.disabled = false; submit.removeAttribute('aria-busy'); }
      }
      return;
    }
    const subject = 'A new idea for SHOWSET';
    const href = 'mailto:' + recipient() + '?subject=' +
      encodeURIComponent(subject) + '&body=' + encodeURIComponent(mailBody(payload));
    status.replaceChildren();
    status.append(document.createTextNode('Your email draft is ready. Please review it and press Send in your email app. Nothing has been submitted through this website. '));
    const link = document.createElement('a');
    link.href = href;
    link.textContent = 'Open the prepared email';
    link.className = 'contact-draft-link';
    status.append(link);
    // Invoke a mail handler from the user's original submit gesture.
    link.click();
  };
  form.addEventListener('submit', onSubmit);
  return () => { controller.abort(); form.removeEventListener('submit', onSubmit); };
}
