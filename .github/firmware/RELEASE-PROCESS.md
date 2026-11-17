# EV Revival Local firmware integrity and recovery

## Scope and trust

No firmware bytes, partitions, Mini OCPP logic, calibration, RFID, schedules, time synchronisation or history code have been changed. The existing 2026-11-17 factory binary is 1,702,160 bytes; SHA-256 is 68545af13435c7f508f4f82261f364eef27ba067e196d22b17a8b351196a06ec.

Trust is pinned release metadata in `ev-revival-local/integrity.mjs`, reviewed with the website. `approved-releases.json` is the readable catalog and CI must confirm equality with the pins, reject unpinned binaries, and reject modification/deletion of existing versioned binary paths relative to the PR base. It is not a second authenticity authority. SHA-256 verifies downloaded bytes against those reviewed pins; it does not establish the author's identity if the website/repository is compromised. No signature scheme or private key is introduced. Require protected main, owner review of these pins, mandatory integrity CI, and deployment from protected main only in GitHub settings. These external controls have NOT been configured or verified by this change; a workflow alone cannot prevent a repository administrator bypassing review.

Only fixed, versioned relative paths under the same HTTPS origin's `/ev-revival-local/firmware/` location are accepted. Redirects, arbitrary URLs, unknown versions, changed installer manifests, sizes and hashes fail closed. Every image is downloaded and verified before ANY erase/write. The checked bytes, not a second network download, go to esptool. Device family must be exactly ESP32 and reported flash capacity exactly 4096 KiB. Unknown capacity is rejected. Display/touch cannot be autodetected; confirmation is required. The locally bundled ESP Web Tools 10.1.0 delegates to this policy before erase/write. It remains an ESP Web Tools installer, with a small reproducible patch to its download stage. No runtime CDN dependency remains. Web Serial and Web Crypto require a secure browser context.

## Partition findings and updates

The existing factory file writes offsets 0..1702159, including settings-area bytes. Its partition table at 0x8000 has: NVS 0x9000/0x5000; otadata 0xe000/0x2000; app0 0x10000/0x1e0000; app1 0x1f0000/0x1e0000; SPIFFS 0x3d0000/0x20000; coredump 0x3f0000/0x10000. Table-page SHA-256: 5826ebb499d58c5707f565be1c80a6e3d1d5d2198dadadb4d9f75d5773ff12aa.

This does NOT prove a settings-preserving update. Update mode is explicitly blocked, even with consent. No application-only image is generated, no partition changes are made, and no backup/restore is invented. Existing session export may be used if offered by installed firmware; users must record other settings. Fresh installation/recovery requires acceptance of possible loss. The ESP Web Tools erase prompt is a separate confirmation; full erase is not automatic. Even without it the factory image can overwrite settings. A future update image needs a reviewed app-only write layout, matching partition schema/storage version, and persistence tests before updateSafe may become true. Never enable it only by changing the boolean.

## Reproduce and check

From repository root: `sh .github/firmware/build.sh`. This runs locked npm installation in .github/firmware, applies the narrow patch to upstream distributed flash.js, bundles locally, then verifies catalog/binaries and runs policy tests. Never commit node_modules. The bundle includes third-party licenses in vendor/THIRD-PARTY-LICENSES.txt. Build source/tools live under .github, not a new public source download.

For existing binaries, `node .github/firmware/check.mjs` recalculates size, SHA-256 and partition-page hash and rejects mismatch against pinned metadata. It NEVER rewrites expected values to make a failed check pass.

For a future candidate release (not performed here):
1. Obtain a release-owner-approved build from the private build process. No development or secret files may enter the website tree.
2. Assign a NEW immutable versioned filename. Never replace an existing published file. Compute `sha256sum <file>` and `wc -c <file>`; inspect every image offset and partition layout. Record build provenance outside the public website.
3. Review and add exact path, size, hash, version, date, board, chip, capacity and offsets to the pinned catalog module; export the reviewed catalog to approved-releases.json. Keep old pins and binaries for controlled recovery. Update the ESP Web Tools manifest selection implementation if supporting more than the current single approved version; UI selection alone is not sufficient. CI must test switching each release and its exact manifest.
4. Run binary/policy tests and required physical hardware tests below. Require owner approval and protected-branch CI before release publication/deployment. No automatic firmware publishing action is added.

There is only one approved historical firmware in this repository; no distinct older stable image can honestly be offered. Recovery can reinstall that existing release, not an invented earlier version.

## Manual CYD test record — ALL OUTSTANDING / NOT PERFORMED

Use a real ESP32-2432S028 / ESP32-32E, 4 MB, ILI9341_2, XPT2046. Record operator, hardware revision, starting release, target hash, erase choice, browser and observed result. Do not use a live charging session during destructive tests.

- Fresh install: correct hardware and data-loss confirmation, optional erase confirmation, USB install, calibration, setup and charging controls.
- Normal update: BLOCKED until an independently validated non-destructive update package exists.
- Wi-Fi persistence: prefill settings, update, reconnect and compare. Pending safe update package.
- RFID persistence: compare tag identifiers/access after update. Pending safe update package.
- Schedule/time persistence: compare schedules and clock sync. Pending safe update package.
- Session history persistence: export before, compare all records after. Pending safe update package.
- Power interruption: interrupt a sacrificial-device flash; verify BOOT/RESET recovery and document any unrecoverable state. Do not claim automatic recovery.
- Reinstall current last approved release: recovery selector, hash verification, install, reconfigure and functional checks.
- Incompatible/corrupt installation recovery: verify hardware, bootloader, approved image; document whether erase is needed and data lost.
- Confirm wrong chip and non-4MB flash refuse BEFORE erase/write on actual devices.

Website guidance covers BOOT held while pressing/releasing RESET, USB/driver/serial failures, incomplete downloads, checksum errors, blank screens, interrupted flashes, and incompatible firmware. Full erase is last resort for incompatible settings, never a cure for wrong hardware.

## Automated result in this task

16 policy/download tests and 6 patched-upstream flash-path tests passed (22 total). Mocked serial tests confirm zero erase/write calls on rejection and exact verified bytes passed to the writer. Chromium at 360/768/1440 pixels loaded the real local component, verified the actual binary using Web Crypto, rejected a truncated response, enforced consent, blocked update mode, and enabled recovery only with confirmations. No horizontal overflow. These are simulated serial tests, not real hardware results. The reproducible locked build completed successfully. Firmware bytes and original ESP Web Tools manifest remain unchanged.

Browser regression: `node .github/firmware/browser.test.cjs` requires Playwright available in the test environment and Chromium at /usr/bin/chromium (or CHROMIUM_PATH). It intercepts the production HTTPS origin locally and mocks serial capability; it does not deploy, contact chargers or flash hardware.

## PR #34 customer-flow simplification

The public page has one fresh-install action; there is no mode or version dropdown. The selected release remains pinned in code, not user-supplied. Recovery uses that same verified fresh-install path after following the collapsed Need help? instructions; it cannot bypass either confirmation. Settings-preserving updates remain blocked in policy and are not offered. A presentation-only status callback relays existing ESP Web Tools states to the page; callback failure cannot bypass verification or interrupt the security gate. Version/date remain visible and SHA-256/copy are inside help. No binaries, approved pins or manifest changed. Hardware tests remain outstanding.
