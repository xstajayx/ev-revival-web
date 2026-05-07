(() => {
  const pageName = window.location.pathname.split('/').pop() || 'index.html';
  const sharedNavLinks = [
    { href: 'index.html', label: 'Home' },
    { href: 'features.html', label: 'Features' },
    { href: 'pricing.html', label: 'Pricing' },
    { href: 'https://evrevival.jworldcreations.com', label: 'Go to app' },
    { href: 'vestel-alternative-app.html', label: 'Use on Phone' },
    { href: 'vestel-charger-wifi-setup.html', label: 'Get your Vestel charger online' },
    { href: 'ocpp.html', label: 'Connect Your EV Charger' },
    { href: 'vestel-charger-error-help.html', label: 'Error Help' },
    { href: 'faqs.html', label: 'FAQs' },
    { href: 'vestel-charger-help.html', label: 'Help' },
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

(() => {
  const safetyEscalationText = 'Stop using the charger and contact a qualified electrician, installer, or authorised service provider.';
  const prohibitedRepairText = 'For safety, I can only provide external checks and cannot provide internal wiring or repair steps.';

  const flowMap = {
    offline: [
      'Has your charger Wi-Fi or network changed recently?',
      'Has your router been restarted?',
      'Is the charger close enough to the Wi-Fi signal?',
      'Weak Wi-Fi is a common cause of offline chargers. Check SSID/password, reboot router, improve signal, or use a Wi-Fi extender if needed.',
      'If still offline, Escalate to your installer or authorised support.'
    ],
    red_fault: [
      'Steady red usually indicates a fault.',
      'If safe, power-cycle once using normal external isolation only (do not open the charger).',
      'If the red light remains or repeats, escalate immediately.',
      safetyEscalationText
    ],
    unusual_light: [
      'Blue glow: charging. Blinking blue: waiting for authorisation or user action.',
      'Green glow: authorised/ready to charge.',
      'Blinking red: ventilation-required mode / vehicle may be unsuitable for this charger type.',
      'Steady purple: charging disabled, over-temperature, or current limit condition. Blinking purple: charging limited due to temperature.',
      'If status remains unclear or charging is blocked, escalate safely.'
    ],
    not_charging: [
      'Does the charger have power and show any light?',
      'What LED pattern is currently shown?',
      'Is the vehicle fully plugged in?',
      'Is a vehicle schedule/timer enabled?',
      'Is charger RFID mode enabled or is app scheduling preventing charging?',
      'Safe step: unplug from the vehicle first, wait briefly, then reconnect firmly.',
      'If still not charging, escalate safely.'
    ],
    rfid: [
      'Is the charger in RFID/authorised mode?',
      'Unauthorised RFID cards can be rejected.',
      'When stopping a session, use the same card used to start it where applicable.',
      prohibitedRepairText,
      'If RFID still fails, escalate to authorised support.'
    ],
    schedule: [
      'Check for conflicts between charger schedule, vehicle schedule, and tariff schedule.',
      'Is the charger online?',
      'Was the car plugged in before the scheduled start time?',
      'Refresh status and wait for a heartbeat update, then retry.',
      'If scheduling still fails, escalate.'
    ],
    cable_stuck: [
      'Do not force the cable.',
      'Stop charging first from vehicle/app/RFID where available.',
      'Remove from the vehicle side first before removing from charger socket (where applicable).',
      'If cable remains locked, escalate safely.'
    ],
    app: [
      'Is the charger currently online?',
      'Could another app/backend still be controlling the charger?',
      'Refresh and wait for the latest charger heartbeat/status update.',
      'If app status remains wrong, escalate.'
    ],
    ocpp: [
      'Is the charger online locally but missing in the app/backend?',
      'Were OCPP URL or Charge Point ID changed recently?',
      'Do not share any secret keys publicly.',
      'Check the EV Revival setup guide values carefully and retry.',
      'If still not connected, escalate to setup support.'
    ]
  };

  const create = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  };

  const renderFlow = (root, issueId) => {
    const messages = flowMap[issueId] || ['No guidance found. Please escalate safely.'];
    root.innerHTML = '';

    const emergency = create('div', 'chat-alert', `Safety check: If you notice burning smell, heat damage, exposed wiring, water ingress, electric shock, repeated breaker trips, charger casing damage, or a persistent red fault light: ${safetyEscalationText}`);
    root.appendChild(emergency);

    messages.forEach((message) => {
      const bubble = create('div', 'chat-bubble bot', message);
      root.appendChild(bubble);
    });

    const escalate = create('button', 'chat-escalate', 'Escalate');
    escalate.type = 'button';
    escalate.addEventListener('click', () => {
      const outcome = create('div', 'chat-bubble bot escalate', safetyEscalationText);
      root.appendChild(outcome);
      root.scrollTop = root.scrollHeight;
    });
    root.appendChild(escalate);
    root.scrollTop = root.scrollHeight;
  };

  const initChatbot = async () => {
    let kb;
    try {
      const response = await fetch('./data/vestelTroubleshooting.json', { cache: 'no-store' });
      kb = await response.json();
    } catch {
      return;
    }

    const button = create('button', 'chat-launcher', 'Vestel Help');
    button.type = 'button';
    button.setAttribute('aria-expanded', 'false');

    const panel = create('section', 'chat-panel');
    panel.setAttribute('aria-hidden', 'true');

    const header = create('header', 'chat-header');
    header.appendChild(create('h3', '', kb.title || 'Vestel Charger Help'));
    header.appendChild(create('p', '', kb.intro || 'I can help with safe basic checks.'));

    const quickWrap = create('div', 'chat-quick-issues');
    (kb.quickIssues || []).forEach((issue) => {
      const issueBtn = create('button', 'chat-issue-btn', issue.label);
      issueBtn.type = 'button';
      issueBtn.addEventListener('click', () => renderFlow(body, issue.id));
      quickWrap.appendChild(issueBtn);
    });

    const body = create('div', 'chat-body');
    body.appendChild(create('div', 'chat-bubble bot', 'Choose an issue to begin safe troubleshooting.'));

    const footer = create('footer', 'chat-footer', kb.disclaimer || 'General guidance only.');

    panel.append(header, quickWrap, body, footer);
    document.body.append(button, panel);

    button.addEventListener('click', () => {
      const open = panel.classList.toggle('open');
      panel.setAttribute('aria-hidden', String(!open));
      button.setAttribute('aria-expanded', String(open));
    });
  };

  initChatbot();
})();
