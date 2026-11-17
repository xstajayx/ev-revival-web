#!/bin/sh
set -eu
cd "$(dirname "$0")/../.."
npm ci --prefix .github/firmware
python3 .github/firmware/patch-ewt.py .github/firmware
.github/firmware/node_modules/.bin/esbuild .github/firmware/node_modules/esp-web-tools/dist/install-button.js --bundle --format=esm --minify --outfile=ev-revival-local/vendor/esp-web-tools.js
node .github/firmware/check.mjs
node .github/firmware/integrity.test.mjs
node .github/firmware/upstream.test.mjs
