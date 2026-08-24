/* ── Nav: border on scroll ────────────────────────── */
const nav = document.getElementById('mainNav');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 24);
}, { passive: true });


/* ── Nav: active link tracks scroll position ─────── */
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(link => {
      const active = link.getAttribute('href') === '#' + entry.target.id;
      link.classList.toggle('active', active);
    });
  });
}, { threshold: 0.35 });

sections.forEach(s => sectionObserver.observe(s));


/* ── Shared reveal: fade-up on scroll ────────────── */
/* One motion language: translateY(16px) → 0 + opacity */
const revealEls = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('in-view');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.12 });

revealEls.forEach(el => revealObserver.observe(el));


/* ── Publications: staggered fade-up on scroll ───── */
const pubItems = document.querySelectorAll('.pub-item');

const pubObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (!entry.isIntersecting) return;
    setTimeout(() => entry.target.classList.add('in-view'), i * 100);
    pubObserver.unobserve(entry.target);
  });
}, { threshold: 0.10 });

pubItems.forEach(item => pubObserver.observe(item));
