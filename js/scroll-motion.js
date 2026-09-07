(() => {
  if (!('IntersectionObserver' in window)) return;
  const body = document.body;
  const enabled = () => body.dataset.interactionMotion === 'full';
  const opening = () => body.classList.contains('is-intro');
  const titleSelector = [
    '.profile__statement', '.about .section-title',
    '.skills__head .section-title > span', '.works__title', '.leadership__title',
    '.archive__title', '.archive-group__head h3', '.contact__thanks'
  ].join(', ');
  const titles = [...document.querySelectorAll(titleSelector)];
  const tools = document.querySelector('.tools-list');
  const images = [...document.querySelectorAll('.work-card__image')];

  titles.forEach(title => {
    const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    let order = 0;
    nodes.forEach(node => {
      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(word => {
        if (!word.trim()) { fragment.append(document.createTextNode(word)); return; }
        const span = document.createElement('i');
        span.className = 'reading-word';
        span.textContent = word;
        span.style.setProperty('--word-delay', `${Math.min(order++, 12) * 115}ms`);
        fragment.append(span);
      });
      node.replaceWith(fragment);
    });
    title.classList.add('reading-title');
    title.closest('.reveal')?.classList.add('reading-host');
  });
  tools?.querySelectorAll('li').forEach((tool, index) => tool.style.setProperty('--tool-order', index));

  const blocks = [...document.querySelectorAll([
    '.about__copy > p', '.about__details', '.skills__grid > article',
    '.works__lead', '.work-card', '.leadership__lead', '.process-card',
    '.archive__lead', '.archive-card', '.contact__closing', '.contact__mail'
  ].join(', '))];
  const anchors = new Map();
  const titleStarted = new WeakMap();
  const groupOrder = new Map();
  const visibleBlocks = new Set();
  blocks.forEach(block => {
    const group = block.closest('.archive-group') || block.closest('.section');
    const anchor = group?.querySelector('.reading-title');
    anchors.set(block, anchor);
    const order = groupOrder.get(group) || 0;
    block.style.setProperty('--content-order', Math.min(order, 3));
    groupOrder.set(group, order + 1);
    block.classList.add('content-reveal');
    // The outer block owns the entrance; nested legacy reveals stay together.
    block.querySelectorAll('.reveal').forEach(child => child.classList.add('is-visible'));
  });

  function revealBlock(block, immediate = false) {
    if (block.classList.contains('is-present')) return;
    const anchor = anchors.get(block);
    if (!immediate && anchor && !anchor.classList.contains('is-read')) return;
    const elapsed = performance.now() - (titleStarted.get(anchor) ?? 0);
    const order = Number(block.style.getPropertyValue('--content-order')) || 0;
    const delay = immediate ? 0 : Math.max(0, 260 - elapsed) + order * 55;
    block.style.setProperty('--content-delay', `${Math.round(delay)}ms`);
    block.classList.add('is-present');
  }

  function reveal(element) {
    if (anchors.has(element)) {
      visibleBlocks.add(element);
      const anchor = anchors.get(element);
      // Handles direct section links and a title already above the viewport.
      if (anchor && !anchor.classList.contains('is-read') && anchor.getBoundingClientRect().top < innerHeight * .88) reveal(anchor);
      revealBlock(element);
      return;
    }
    if (element === tools) { element.classList.add('is-unveiled'); return; }
    if (!element.classList.contains('is-read')) {
      titleStarted.set(element, performance.now());
      element.classList.add('is-read');
    }
    visibleBlocks.forEach(block => { if (anchors.get(block) === element) revealBlock(block); });
  }

  const observer = new IntersectionObserver(entries => {
    if (!enabled() || opening()) return;
    entries.forEach(entry => {
      if (!entry.isIntersecting) { visibleBlocks.delete(entry.target); return; }
      reveal(entry.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: .12 });
  [...titles, tools, ...blocks].filter(Boolean).forEach(element => observer.observe(element));

  let frame = 0;
  let previousTime = 0;
  const scales = images.map(element => ({ element, current: 1 }));
  const clamp = value => Math.min(1, Math.max(0, value));

  function paintImages(time) {
    frame = 0;
    const follow = 1 - Math.exp(-Math.min(previousTime ? time - previousTime : 16.67, 50) / 95);
    previousTime = time;
    const height = window.innerHeight;
    const base = window.innerWidth <= 720 ? .94 : .88;
    // Read layout before writing styles; use the unscaled card to avoid feedback.
    const targets = scales.map(({ element }) => {
      if (!enabled()) return 1;
      const top = element.closest('.work-card').getBoundingClientRect().top;
      return base + (1 - base) * clamp((height * .94 - top) / (height * .66));
    });
    let moving = false;
    scales.forEach((state, index) => {
      const target = targets[index];
      state.current = enabled() ? state.current + (target - state.current) * follow : 1;
      if (Math.abs(target - state.current) < .0001) state.current = target;
      else moving = true;
      state.element.style.setProperty('--scroll-scale', state.current.toFixed(5));
    });
    if (moving && !document.hidden) frame = requestAnimationFrame(paintImages);
    else previousTime = 0;
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(paintImages);
  }
  function syncVisible() {
    if (enabled() && !opening()) {
      [...titles, tools, ...blocks].filter(Boolean).forEach(element => {
        const rect = element.getBoundingClientRect();
        if (rect.top < innerHeight * .88 && rect.bottom > 0) {
          reveal(element);
        }
      });
    }
    schedule();
  }
  body.classList.add('scroll-enhanced');
  new MutationObserver(syncVisible).observe(body, { attributes: true, attributeFilter: ['class', 'data-interaction-motion'] });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', syncVisible, { passive: true });
  window.addEventListener('pageshow', syncVisible);
  document.addEventListener('focusin', event => {
    const block = event.target.closest('.content-reveal');
    if (block) revealBlock(block, true);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = previousTime = 0; }
    else syncVisible();
  });
  document.fonts?.ready.then(syncVisible);
  // Give initial styles a frame before starting elements already in view.
  requestAnimationFrame(() => requestAnimationFrame(syncVisible));
})();
