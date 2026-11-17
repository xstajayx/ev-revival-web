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
    else if (!supported) message.textContent = 'Use desktop Chrome or Edge for USB installation. Downloads are available below.';
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
    message.textContent = 'The installer could not load. Check your internet connection and reload, or use the manual flasher.';
  };
  document.head.append(script);
})();


(() => {
  const button = document.getElementById('download-release');
  const message = document.getElementById('download-message');
  button.addEventListener('click', async () => {
    button.disabled = true;
    message.textContent = 'Preparing your release download…';
    try {
      const response = await fetch('ev-revival-local/downloads/release.json', {cache: 'no-store'});
      if (!response.ok) throw new Error('Release download unavailable. Please try again.');
      const release = await response.json();
      const buffers = [];
      let received = 0;
      for (const part of release.parts) {
        const response = await fetch('ev-revival-local/downloads/' + part.path);
        if (!response.ok) throw new Error('Download interrupted. Please try again.');
        const buffer = await response.arrayBuffer();
        if (buffer.byteLength !== part.bytes) throw new Error('Download incomplete. Please try again.');
        buffers.push(buffer);
        received += buffer.byteLength;
        message.textContent = 'Preparing ZIP · ' + Math.round(received / release.bytes * 100) + '%';
      }
      const zip = new Blob(buffers, {type: 'application/zip'});
      if (zip.size !== release.bytes) throw new Error('Download incomplete. Please try again.');
      if (window.isSecureContext && crypto.subtle) {
        const digest = await crypto.subtle.digest('SHA-256', await zip.arrayBuffer());
        const hash = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
        if (hash !== release.sha256) throw new Error('Download verification failed. Please retry.');
      }
      const url = URL.createObjectURL(zip);
      const link = document.createElement('a');
      link.href = url;
      link.download = release.filename;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      message.textContent = 'Your ZIP is ready. Check your browser downloads.';
    } catch (error) {
      message.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
})();
