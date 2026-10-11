// Small progressive enhancements. The page is fully readable without this file.
(function () {
  var header = document.querySelector('[data-header]');
  var sentinel = document.querySelector('.scroll-sentinel');
  var toggle = document.querySelector('.menu-toggle');
  var menu = document.getElementById('mobile-menu');
  var hasIO = 'IntersectionObserver' in window;

  // Condense the header once the page has scrolled.
  if (header && sentinel && hasIO) {
    new IntersectionObserver(function (entries) {
      header.classList.toggle('is-scrolled', !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  // Scroll reveals, staggered within each parent.
  var revealables = document.querySelectorAll('[data-reveal], [data-track]');
  revealables.forEach(function (el) {
    if (!el.hasAttribute('data-reveal')) return;
    var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.hasAttribute('data-reveal'); });
    el.style.setProperty('--i', siblings.indexOf(el));
  });
  if (hasIO) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  }

  // Mobile menu.
  if (!toggle || !menu) return;
  function setOpen(open) {
    header.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      menu.hidden = false;
      menu.removeAttribute('inert');
    } else {
      menu.setAttribute('inert', '');
    }
  }
  menu.setAttribute('inert', '');
  toggle.addEventListener('click', function () {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });
  window.matchMedia('(min-width: 721px)').addEventListener('change', function (mq) {
    if (mq.matches) setOpen(false);
  });
})();
