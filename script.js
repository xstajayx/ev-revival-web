(() => {
  const pageName = window.location.pathname.split('/').pop() || 'index.html';
  const sharedNavLinks = [
    { href: 'index.html', label: 'Home' },
    { href: 'features.html', label: 'Features' },
    { href: 'pricing.html', label: 'Pricing' },
    { href: 'app.html', label: 'Use on Phone' },
    { href: 'charger-online.html', label: 'Get Online' },
    { href: 'ocpp.html', label: 'Connect Your EV Charger' },
    { href: 'error-help.html', label: 'Error Help' },
    { href: 'faqs.html', label: 'FAQs' },
    { href: 'support.html', label: 'Support' },
    { href: 'terms.html', label: 'Terms' },
    { href: 'privacy.html', label: 'Privacy' }
  ];

  const buildNavMarkup = () => sharedNavLinks.map((link) => {
    const current = pageName === link.href ? ' aria-current=\"page\"' : '';
    return `<a href=\"${link.href}\"${current}>${link.label}</a>`;
  }).join('');

  document.querySelectorAll('.desktop-nav').forEach((desktopNav) => {
    desktopNav.innerHTML = buildNavMarkup();
  });

  document.querySelectorAll('.drawer-links').forEach((drawerLinks) => {
    drawerLinks.innerHTML = buildNavMarkup();
  });

  const drawer = document.querySelector('[data-drawer]');
  const menuBtn = document.querySelector('[data-menu-open]');
  const closeBtn = document.querySelector('[data-menu-close]');
  const backToTop = document.querySelector('[data-back-top]');

  if (menuBtn && drawer) {
    menuBtn.addEventListener('click', () => {
      drawer.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
    });
  }

  const closeDrawer = () => {
    if (!drawer) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
  };

  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (drawer) {
    drawer.addEventListener('click', (e) => {
      if (e.target === drawer) closeDrawer();
    });
  }

  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const value = btn.getAttribute('data-copy');
      try {
        await navigator.clipboard.writeText(value);
        const original = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(() => (btn.textContent = original), 1300);
      } catch {
        btn.textContent = 'Copy failed';
      }
    });
  });

  const onScroll = () => {
    if (!backToTop) return;
    backToTop.classList.toggle('show', window.scrollY > 500);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {
        // keep silent to avoid noisy UI when offline or unsupported
      });
    });
  }
})();
