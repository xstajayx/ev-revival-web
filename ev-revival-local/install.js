(async () => {
  const {releases, selectRelease, checkOperation, prepare} = await import('./integrity.mjs');
  const hardware = document.getElementById('hardware-confirm');
  const button = document.getElementById('flash-button');
  const message = document.getElementById('install-message');
  const installer = document.getElementById('installer');
  const version = document.getElementById('release-version');
  const mode = document.getElementById('install-mode');
  const consent = document.getElementById('data-loss-confirm');
  const supported = window.isSecureContext && 'serial' in navigator;
  let ready = false;
  const manifestURL = new URL('manifest.json', new URL('ev-revival-local/', location.href));
  const base = manifestURL.href;
  for (const release of releases) version.add(new Option(release.version+' · '+release.date,release.version));
  function update() {
    const release = selectRelease(version.value);
    document.getElementById('release-hash').textContent = release.parts[0].sha256;
    document.getElementById('verified-release').textContent = 'Approved release '+release.version+' · '+release.date;
    let reason = '';
    try { checkOperation(release,mode.value,consent.checked); } catch(e) { reason=e.message; }
    button.disabled = !ready || !supported || !hardware.checked || !!reason;
    message.textContent = !supported ? 'Use HTTPS in desktop Chrome or Edge for USB installation.' : !ready ? 'Loading the USB installer…' : !hardware.checked ? 'Confirm the board, display and touchscreen. Hardware has not been physically verified.' : reason || 'Ready to connect. Firmware bytes and connected hardware will be checked before any erase or write.';
  }
  for (const el of [version,mode,consent,hardware]) el.addEventListener('change',update);
  installer.addEventListener('click',e=>{if(button.disabled){e.preventDefault();e.stopImmediatePropagation();}},true);
  document.getElementById('copy-release-hash').addEventListener('click',async e=>{
    try { await navigator.clipboard.writeText(selectRelease(version.value).parts[0].sha256);e.target.textContent='Copied'; }
    catch { e.target.textContent='Select and copy the checksum above'; }
  });
  window.evRevivalPolicy = Object.freeze({prepare: async (loader,manifest,erase) => {
    const release=selectRelease(version.value);
    if (!hardware.checked) throw Error('Hardware confirmation is required.');
    if (manifest.new_install_prompt_erase!==true || manifest.new_install_improv_wait_time!==0 || manifest.version!==release.version || manifest.builds.length!==1 || manifest.builds[0].chipFamily!==release.chipFamily || JSON.stringify(manifest.builds[0].parts)!==JSON.stringify(release.parts.map(p=>({path:p.path,offset:p.offset})))) throw Error('Installer manifest does not match the pinned approved release. Nothing was written.');
    if (erase && !consent.checked) throw Error('Erase was not confirmed. Nothing was written.');
    message.textContent='Checking hardware and downloading firmware for SHA-256 verification…';
    try {
      const buffers=await prepare(release,loader.chip.CHIP_NAME,(await loader.getFlashSize())*1024,mode.value,consent.checked,base);
      message.textContent='Verified Firmware '+release.version+': size and SHA-256 match. Hardware: chip and flash match; display and touch are user-confirmed only.';
      return buffers;
    } catch(e) {message.textContent=e.message;throw e;}
  }});
  update();
  if (!supported) return;
  try { await import('./vendor/esp-web-tools.js'); await customElements.whenDefined('esp-web-install-button');ready=true;update(); }
  catch { message.textContent='The USB installer could not load. Reload and retry; no firmware was written.'; }
})();
