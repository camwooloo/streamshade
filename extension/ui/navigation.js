// Keep one sidebar item current for clicks, wheel scrolling, and keyboard navigation.
export function trackSections() {
  const links = [...document.querySelectorAll('.nav-link')];
  const sections = links.map(link => document.querySelector(link.hash));
  let queued = false;
  function update() {
    queued = false;
    const boundary = Math.min(160, innerHeight * 0.25);
    let current = 0;
    sections.forEach((section, index) => {
      if (section.getBoundingClientRect().top <= boundary) current = index;
    });
    if (scrollY > 0 && innerHeight + scrollY >= document.documentElement.scrollHeight - 4) current = links.length - 1;
    links.forEach((link, index) => {
      link.classList.toggle('active', index === current);
      if (index === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function schedule() {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  addEventListener('hashchange', schedule);
  new ResizeObserver(schedule).observe(document.querySelector('.settings-main'));
  document.fonts.ready.then(schedule);
  update();
}
