#!/usr/bin/env bash
mkdir -p dist
cp ./*.js* ./dist && cp ./*.css* ./dist && cp ./*.m4a ./dist && cp -r ./images ./dist/
node ./tools/buildPages.js
