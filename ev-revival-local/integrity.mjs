// Reviewed release pins. Changing these requires release-owner review.
export const releases = Object.freeze([Object.freeze({
  version: '2026-11-17', date: '17 November 2026', board: 'ESP32-2432S028-ILI9341_2-XPT2046',
  chipFamily: 'ESP32', flashBytes: 4194304, updateSafe: false,
  parts: [Object.freeze({url: 'https://ev.jworldcreations.com/ev-revival-local/firmware/EV-Revival-Local-ESP32-2432S028-2026-11-17-factory.bin', path: 'firmware/EV-Revival-Local-ESP32-2432S028-2026-11-17-factory.bin',
    size: 1702160, sha256: '68545af13435c7f508f4f82261f364eef27ba067e196d22b17a8b351196a06ec', offset: 0})]
})]);
export function selectRelease(version) {
  const release = releases.find(r => r.version === version);
  if (!release) throw Error('This release is not approved. Nothing was written.');
  return release;
}
export function validateManifest(manifest) {
  const release = selectRelease(manifest?.version);
  if (JSON.stringify(manifest) !== JSON.stringify(release)) throw Error('Release metadata is missing or differs from the approved release. Nothing was written.');
  return release;
}
export function checkDevice(release, chip, bytes) {
  if (chip !== release.chipFamily) throw Error('Incompatible chip: this release requires classic ESP32. Nothing was written.');
  if (bytes !== release.flashBytes) throw Error('Unsupported or unknown flash capacity: exactly 4 MB is required. Nothing was written.');
}
export function checkOperation(release, mode, eraseConfirmed) {
  if (!['install','recovery','update'].includes(mode)) throw Error('Select an installation option.');
  if (mode === 'update' && !release.updateSafe) throw Error('Settings-preserving updates are not validated for this factory image. Export sessions and record settings; use installation or recovery only if you accept data loss.');
  if (mode !== 'update' && !eraseConfirmed) throw Error('Confirm replacement and possible loss of all device settings before continuing.');
}
export async function verifyBytes(part, bytes) {
  if (bytes.byteLength !== part.size) throw Error('Firmware download has the wrong size or is incomplete. Nothing was written. Retry with a reliable connection.');
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
  if (hash !== part.sha256) throw Error('Firmware integrity check failed (SHA-256 mismatch). Nothing was written. Do not install this file.');
  return bytes;
}
export async function downloadPart(part, base, fetcher = fetch) {
  const url = new URL(part.path, base);
  if (url.href !== part.url || url.protocol !== 'https:' || url.origin !== new URL(base).origin || !releases.some(r=>r.parts.some(p=>JSON.stringify(p)===JSON.stringify(part))) || !url.pathname.endsWith('/ev-revival-local/'+part.path)) throw Error('Firmware URL is not an approved HTTPS release location.');
  try {
    const response = await fetcher(url.href, {cache:'no-store',redirect:'error',signal:AbortSignal.timeout(60000)});
    if (!response.ok) throw Error('HTTP '+response.status);
    return await verifyBytes(part, await response.arrayBuffer());
  } catch (error) {
    throw Error('Download or verification stopped. '+error.message+' No erase or write was started.');
  }
}
export async function prepare(release, chip, capacity, mode, confirmed, base, fetcher) {
  validateManifest(release); checkDevice(release,chip,capacity); checkOperation(release,mode,confirmed);
  return Promise.all(release.parts.map(p=>downloadPart(p,base,fetcher)));
}
