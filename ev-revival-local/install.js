(() => {
  const confirmHardware = document.getElementById('hardware-confirm');
  const flashButton = document.getElementById('flash-button');
  const message = document.getElementById('install-message');
  const installer = document.getElementById('installer');
  let ready = false;
  const supported = window.isSecureContext && 'serial' in navigator;

  function update() {
    flashButton.disabled = !ready || !supported || !confirmHardware.checked;
    if (!window.isSecureContext) message.textContent = 'Open the HTTPS version of this page to flash your CYD.';
    else if (!supported) message.textContent = 'Use desktop Chrome or Edge for USB installation.';
    else if (!ready) message.textContent = 'Loading the USB installer…';
    else message.textContent = confirmHardware.checked
      ? 'Ready. Click the flash button and choose your CYD USB serial port.'
      : 'Confirm your hardware to enable the flash button.';
  }

  confirmHardware.addEventListener('change', update);
  installer.addEventListener('click', event => {
    if (!confirmHardware.checked || !ready || !supported) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
  update();
  if (!supported) return;

  const script = document.createElement('script');
  script.type = 'module';
  script.src = 'https://unpkg.com/esp-web-tools@10.1.0/dist/web/install-button.js?module';
  script.onload = async () => {
    await customElements.whenDefined('esp-web-install-button');
    ready = true;
    update();
  };
  script.onerror = () => {
    flashButton.disabled = true;
    message.textContent = 'The installer could not load. Check your internet connection and reload, or contact support.';
  };
  document.head.append(script);
})();
