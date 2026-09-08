(() => {
  const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  // Motion is part of the final design, independent of the old preview toggle.
  document.body.dataset.interactionMotion = 'full';
  const surfaces = document.querySelectorAll([
    '.skill-group', '.leadership-panel', '.process-card', '.work-card__image', '.archive-card__visual',
    '.playdoggy-case .need-card', '.playdoggy-case .ux-decision',
    '.playdoggy-case .priority-map__flow > div', '.playdoggy-case .publishing-flow > div',
    '.playdoggy-case .project-hero__collage',
    '.league-page .project-hero__collage', '.league-page .league-selected-proposal'
  ].join(', '));
  const active = new Set();
  let frame = 0;
  let previousTime = 0;

  function paint(state) {
    const angle = Math.hypot(state.x, state.y);
    state.element.style.setProperty('--tilt-x', angle > 0.001 ? state.x / angle : 0);
    state.element.style.setProperty('--tilt-y', angle > 0.001 ? state.y / angle : 1);
    state.element.style.setProperty('--tilt-angle', `${angle}deg`);
  }

  function tick(time) {
    // Time-based easing gives the same response on 60 Hz and 120 Hz displays.
    const delta = previousTime ? Math.min(time - previousTime, 50) : 16.67;
    previousTime = time;
    const follow = 1 - Math.exp(-delta / 110);
    active.forEach((state) => {
      state.x += (state.targetX - state.x) * follow;
      state.y += (state.targetY - state.y) * follow;
      if (Math.abs(state.targetX - state.x) + Math.abs(state.targetY - state.y) < 0.008) {
        state.x = state.targetX;
        state.y = state.targetY;
        active.delete(state);
      }
      paint(state);
    });
    frame = active.size ? requestAnimationFrame(tick) : 0;
    if (!frame) previousTime = 0;
  }

  function animate(state) {
    active.add(state);
    if (!frame) frame = requestAnimationFrame(tick);
  }

  const states = [...surfaces].map((element) => {
    element.classList.add('motion-surface');
    const state = { element, x: 0, y: 0, targetX: 0, targetY: 0, bounds: null };
    const strength = element.matches('.skill-group, .leadership-panel, .need-card, .priority-map__flow > div') ? 3 :
      element.matches('.process-card, .ux-decision, .publishing-flow > div, .league-selected-proposal') ? 2 : 1.4;

    function move(event) {
      if (!pointer.matches || document.body.dataset.interactionMotion !== 'full' || event.pointerType !== 'mouse') return;
      // Measure once on entry, so transformed bounds don't feed back into the tilt.
      state.bounds ||= element.getBoundingClientRect();
      const { left, top, width, height } = state.bounds;
      if (!width || !height) return;
      const x = Math.max(-1, Math.min(1, (event.clientX - left) / width * 2 - 1));
      const y = Math.max(-1, Math.min(1, (event.clientY - top) / height * 2 - 1));
      state.targetX = -y * strength;
      state.targetY = x * strength;
      animate(state);
    }

    function leave() {
      state.bounds = null;
      state.targetX = state.targetY = 0;
      if (state.x || state.y) animate(state);
    }

    element.addEventListener('pointerenter', move, { passive: true });
    element.addEventListener('pointermove', move, { passive: true });
    element.addEventListener('pointerleave', leave, { passive: true });
    element.addEventListener('pointercancel', leave, { passive: true });
    return state;
  });

  function reset(immediate = false) {
    states.forEach((state) => {
      state.bounds = null;
      state.targetX = state.targetY = 0;
      if (immediate) {
        state.x = state.y = 0;
        paint(state);
      } else if (state.x || state.y) animate(state);
    });
    if (immediate) {
      cancelAnimationFrame(frame);
      active.clear();
      frame = previousTime = 0;
    }
  }

  window.addEventListener('scroll', () => reset(), { passive: true });
  window.addEventListener('resize', () => reset(), { passive: true });
  window.addEventListener('blur', () => reset());
  pointer.addEventListener('change', () => reset(true));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) reset(true);
  });
})();
