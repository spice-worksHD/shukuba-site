// ===== LANG (base) =====
function setLang(lang) {
  document.body.className = 'lang-' + lang;
  document.querySelectorAll('.lang-btn').forEach((b, i) => {
    b.classList.toggle('active', (i === 0) === (lang === 'ja'));
  });
}

// ===== NAV SCROLL =====
window.addEventListener('scroll', () => {
  const nav = document.getElementById('nav');
  if (nav) nav.classList.toggle('scrolled', scrollY > 60);
});

// ===== NAV MOBILE MENU =====
function toggleNavMenu() {
  document.getElementById('nav').classList.toggle('menu-open');
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => document.getElementById('nav').classList.remove('menu-open'));
  });
});

// ===== FADE IN =====
document.addEventListener('DOMContentLoaded', () => {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.15 });
  document.querySelectorAll('.fade-in').forEach(el => obs.observe(el));
});

// ===== BACK TO TOP =====
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.createElement('button');
  btn.id = 'to-top';
  btn.setAttribute('aria-label', 'ページ上部へ戻る');
  btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V7"/><path d="M6 12l6-6 6 6"/></svg>';
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  document.body.appendChild(btn);
  const toggle = () => btn.classList.toggle('show', window.scrollY > 400);
  window.addEventListener('scroll', toggle, { passive: true });
  toggle();
});

// ===== HERO VIDEO AUTOPLAY =====
(function() {
  function initHeroVideo() {
    var v = document.getElementById('hero-video');
    if (!v) return;
    v.muted = true;
    var p = v.play();
    if (p !== undefined) {
      p.catch(function() {
        document.addEventListener('click', function() { v.play(); }, { once: true });
        document.addEventListener('touchstart', function() { v.play(); }, { once: true });
      });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroVideo);
  } else {
    initHeroVideo();
  }
})();
