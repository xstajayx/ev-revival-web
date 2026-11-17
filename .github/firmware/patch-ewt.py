from pathlib import Path
import sys
root=Path(sys.argv[1]) / 'node_modules/esp-web-tools/dist'
p=root/'flash.js';s=p.read_text();assert 'const manifestURL =' in s and 'const fileArray =' in s
a=s.index('    const manifestURL =');b=s.index('    const fileArray:',a) if '    const fileArray:' in s[a:] else s.index('    const fileArray =',a)
s=s[:a]+'''    let buffers;
    try {
      const policy = window.evRevivalPolicy;
      if (!policy) throw Error('Approved firmware policy is unavailable.');
      buffers = await policy.prepare(esploader, manifest, eraseFirst);
    } catch (error) {
      fireStateEvent({ state: "error", message: error.message, details: { error: "failed_firmware_download", details: error.message } });
      await transport.disconnect();
      return;
    }
    const filePromises = buffers.map(buffer => Promise.resolve(Array.from(new Uint8Array(buffer), b=>String.fromCharCode(b)).join('')));
'''+s[b:]
needle='    const fireStateEvent = (stateUpdate) =>'
start=s.index(needle);end=s.index('    const transport =',start)
s=s[:start]+'''    const fireStateEvent = (stateUpdate) => {
      try { window.evRevivalPolicy?.status?.(stateUpdate); } catch (_) { /* presentation must not alter safety */ }
      onEvent({ ...stateUpdate, manifest, build, chipFamily });
    };
'''+s[end:]
p.write_text(s)
