#!/usr/bin/env sh
command -v node >/dev/null 2>&1 || { echo 'Node.js is required.'; exit 1; }
echo 'Open http://127.0.0.1:4173'
node serve.mjs
