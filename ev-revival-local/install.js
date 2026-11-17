(async () => {
  const {releases, selectRelease, checkOperation, prepare} = await import('./integrity.mjs');
  const hardware = document.getElementById('hardware-confirm');
  const button = document.getElementById('flash-button');
  const message = document.getElementById('install-message');
  const installer = document.getElementById('installer');
  const release = selectRelease(releases[0].version);
  const mode = 'install';
  const progress = document.getElementById('install-progress');
  const consent = document.getElementById('data-loss-confirm');
  const supported = window.isSecureContext && 'serial' in navigator;
  let ready = false;
  const manifestURL = new URL('manifest.json', new URL('ev-revival-local/', location.href));
  const base = manifestURL.href;
  function update() {
    document.getElementById('release-hash').textContent = release.parts[0].sha256;
    document.getElementById('verified-release').textContent = 'Version '+release.version+' · '+release.date;
    let reason = '';
    try { checkOperation(release,mode,consent.checked); } catch(e) { reason=e.message; }
    button.disabled = !ready || !supported || !hardware.checked || !!reason;
    message.textContent = !supported ? 'Use HTTPS in desktop Chrome or Edge for USB installation.' : !ready ? 'Loading the USB installer…' : !hardware.checked ? 'Confirm your board matches the model listed.' : !consent.checked ? 'Confirm you have saved anything you need before installing.' : 'Ready. Select Install EV Revival Local and choose your USB device.';
  }
  for (const el of [consent,hardware]) el.addEventListener('change',update);
  installer.addEventListener('click',e=>{if(button.disabled){e.preventDefault();e.stopImmediatePropagation();}},true);
  document.getElementById('copy-release-hash').addEventListener('click',async e=>{
    try { await navigator.clipboard.writeText(release.parts[0].sha256);e.target.textContent='Copied'; }
    catch { e.target.textContent='Select and copy the checksum above'; }
  });
  window.evRevivalPolicy = Object.freeze({status: state => {
    if (state.state === 'initializing') { progress.hidden=false;progress.removeAttribute('value');message.textContent='Connecting to your board…'; }
    if (state.state === 'preparing') message.textContent='Verifying the installation files…';
    if (state.state === 'erasing') message.textContent='Clearing the device as confirmed…';
    if (state.state === 'writing') { progress.hidden=false;progress.value=Math.min(100,Math.max(0,state.details?.percentage || 0));message.textContent='Installing… '+Math.round(progress.value)+'%. Keep USB connected.'; }
    if (state.state === 'finished') { progress.hidden=false;progress.value=100;message.textContent='Installation complete. Disconnect in the browser, reconnect USB and follow setup on the touchscreen.'; }
    if (state.state === 'error') { progress.hidden=true;message.textContent='Installation stopped. '+state.message+' Open Need help? before retrying.'; }
  },prepare: async (loader,manifest,erase) => {
    if (!hardware.checked) throw Error('Hardware confirmation is required.');
    if (manifest.new_install_prompt_erase!==true || manifest.new_install_improv_wait_time!==0 || manifest.version!==release.version || manifest.builds.length!==1 || manifest.builds[0].chipFamily!==release.chipFamily || JSON.stringify(manifest.builds[0].parts)!==JSON.stringify(release.parts.map(p=>({path:p.path,offset:p.offset})))) throw Error('Installer manifest does not match the pinned approved release. Nothing was written.');
    if (erase && !consent.checked) throw Error('Erase was not confirmed. Nothing was written.');
    message.textContent='Checking your board and verifying the installation files…';
    try {
      const buffers=await prepare(release,loader.chip.CHIP_NAME,(await loader.getFlashSize())*1024,mode,consent.checked,base);
      if (!hardware.checked || !consent.checked) throw Error('Confirmation was withdrawn. Nothing was written. Confirm both statements before retrying.');
      message.textContent='Checks passed. Installing EV Revival Local…';
      return buffers;
    } catch(e) {message.textContent=e.message;throw e;}
  }});
  update();
  if (!supported) return;
  try { await import('./vendor/esp-web-tools.js'); await customElements.whenDefined('esp-web-install-button');ready=true;update(); }
  catch { message.textContent='The USB installer could not load. Reload and retry; no firmware was written.'; }
})();

// Help links open the collapsed instructions without changing installer permissions.
for (const link of document.querySelectorAll('a[href="#installation-help"]')) link.addEventListener('click',()=>{document.getElementById('help-details').open=true;});
