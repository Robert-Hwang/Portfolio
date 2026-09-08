(() => {
  const body = document.body;
  if (!body.matches('.playdoggy-case, .league-page, .promotion-page') || !('IntersectionObserver' in window)) return;
  if (body.dataset.interactionMotion !== 'full' && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Headings lead; descriptions and cards enter intact, slightly behind them.
  document.querySelector('.project-hero__subtitle')?.classList.add('case-reading');
  document.querySelectorAll('.project-section__head').forEach(head => {
    head.classList.remove('case-reveal');
    head.querySelector('.project-section__intro')?.classList.add('case-reveal');
  });
  ['.need-balance', '.priority-map--focused', '.publishing-flow', '.what-changed'].forEach(selector => {
    document.querySelector(selector)?.classList.remove('case-reveal');
  });
  document.querySelectorAll('.need-card, .priority-map__flow > div, .publishing-flow > div, .what-changed__head, .what-changed__list > li').forEach(el => el.classList.add('case-reveal'));

  const titles = [...document.querySelectorAll('.case-reading')];
  titles.forEach(title => {
    const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    let order = 0;
    nodes.forEach(node => {
      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(word => {
        if (!word.trim()) { fragment.append(document.createTextNode(word)); return; }
        const span = document.createElement('span');
        span.className = 'case-word';
        span.textContent = word;
        span.style.setProperty('--word-delay', `${Math.min(order++, 12) * 115}ms`);
        fragment.append(span);
      });
      node.replaceWith(fragment);
    });
  });

  const blocks = [...document.querySelectorAll('.case-reveal')].filter(el => !el.parentElement.closest('.case-reveal'));
  const anchors = new Map();
  const started = new WeakMap();
  const orders = new Map();
  blocks.forEach(block => {
    block.classList.add('case-block');
    const section = block.closest('section, [role="region"]');
    anchors.set(block, section?.querySelector('.case-reading'));
    const order = orders.get(section) || 0;
    block.dataset.revealOrder = Math.min(order, 3);
    orders.set(section, order + 1);
  });
  const readTitle = title => {
    if (!title || started.has(title)) return;
    started.set(title, performance.now());
    title.classList.add('is-read');
  };
  function present(block, immediate = false) {
    const anchor = anchors.get(block);
    readTitle(anchor);
    const elapsed = performance.now() - (started.get(anchor) || 0);
    const delay = immediate ? 0 : Math.max(0, 260 - elapsed) + Number(block.dataset.revealOrder) * 55;
    block.style.setProperty('--block-delay', `${delay}ms`);
    block.classList.add('is-present');
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      if (anchors.has(entry.target)) present(entry.target);
      else readTitle(entry.target);
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .04 });
  [...titles, ...blocks].forEach(el => observer.observe(el));

  const images = [...document.querySelectorAll('.project-hero__collage, .commerce-main__screen, .responsive-showcase__devices, .league-page .featured-content__visual, .promotion-page .featured-content__visual')].map(el => {
    el.classList.add('case-grow');
    return { el, current: .96 };
  });
  let frame = 0;
  function paint() {
    frame = 0;
    let pending = false;
    const startScale = innerWidth <= 720 ? .97 : .94;
    images.forEach(item => {
      const rect = item.el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > innerHeight * 1.1) return;
      const progress = Math.max(0, Math.min(1, (innerHeight - rect.top) / (innerHeight * .75)));
      const target = startScale + (1 - startScale) * progress;
      item.current += (target - item.current) * .14;
      if (Math.abs(target - item.current) > .0001) pending = true;
      else item.current = target;
      item.el.style.setProperty('--image-scale', item.current.toFixed(4));
    });
    if (pending && !document.hidden) frame = requestAnimationFrame(paint);
  }
  const queuePaint = () => { if (!frame && !document.hidden) frame = requestAnimationFrame(paint); };
  addEventListener('scroll', queuePaint, { passive: true });
  addEventListener('resize', queuePaint, { passive: true });
  addEventListener('pageshow', queuePaint);
  document.addEventListener('visibilitychange', queuePaint);
  document.addEventListener('focusin', event => {
    const block = event.target.closest('.case-block');
    if (block) present(block, true);
  });
  body.classList.add('case-motion');
  queuePaint();
})();
