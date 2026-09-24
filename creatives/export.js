#!/usr/bin/env node
/*
  export.js — resolves tokens.css custom properties into literal values for
  wkhtmltoimage's export pass only.

  Why this exists: wkhtmltoimage 0.12.6 ships an old Qt WebKit build with no
  CSS custom-property (var()) support at all — confirmed empirically, not
  documented anywhere. The checked-in creative-*.html files keep var() as
  the real source of truth (correct in any real browser, and honors the
  "read tokens.css live" rule in part3-spec.md); this script only produces
  a temporary, resolved copy for the export subprocess to consume, then
  deletes it. Nothing checked in ever contains a hardcoded hex value.
*/

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CREATIVES_DIR = __dirname;
const TOKENS_PATH = path.join(ROOT, 'styles', 'tokens.css');
const WKHTMLTOIMAGE = 'C:\\Program Files\\wkhtmltopdf\\bin\\wkhtmltoimage.exe';

const CREATIVES = [
  { file: 'creative-320x50.html', width: 320, height: 50, out: 'iqly-320x50.png' },
  { file: 'creative-250x250.html', width: 250, height: 250, out: 'iqly-250x250.png' },
  { file: 'creative-1080x1920.html', width: 1080, height: 1920, out: 'iqly-1080x1920.png' },
];

function parseTokens(cssText) {
  const tokens = {};
  const re = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let m;
  while ((m = re.exec(cssText))) {
    tokens[m[1].trim()] = m[2].trim();
  }
  return tokens;
}

function resolveVars(cssText, tokens) {
  // Repeated passes handle tokens that reference other tokens indirectly.
  let out = cssText;
  for (let pass = 0; pass < 3; pass++) {
    out = out.replace(/var\((--[a-z0-9-]+)(?:\s*,\s*([^)]+))?\)/gi, function (full, name, fallback) {
      if (tokens[name] !== undefined) return tokens[name];
      return fallback !== undefined ? fallback.trim() : full;
    });
  }
  return out;
}

function main() {
  const tokensCss = fs.readFileSync(TOKENS_PATH, 'utf8');
  const tokens = parseTokens(tokensCss);

  // The resolved copy is written next to the real file (as a dotfile),
  // not to os.tmpdir() — this keeps every relative path in the creative
  // (../src/questions.js, ../index.html, etc.) resolving exactly as it
  // does for the checked-in file, with no path-rewriting needed.
  const tmpPaths = [];

  CREATIVES.forEach(function (creative) {
    const srcPath = path.join(CREATIVES_DIR, creative.file);
    if (!fs.existsSync(srcPath)) {
      console.log('skip (not built yet): ' + creative.file);
      return;
    }
    const html = fs.readFileSync(srcPath, 'utf8');
    const resolvedHtml = resolveVars(html, tokens);

    // wkhtmltoimage also chokes on the <link> to tokens.css itself once
    // var() is gone from the HTML — drop it from the temp copy only.
    let withoutTokensLink = resolvedHtml.replace(
      /<link[^>]*tokens\.css[^>]*>\s*/i,
      ''
    );

    // Creative 2+ inject SVG markup at runtime (from questions.js's
    // svgGrid()) containing its own var(--color-primary) references —
    // those never pass through the text substitution above, since they
    // don't exist until the page's own script runs. Give any such script
    // a resolved token table to fall back to; see creative-250x250.html's
    // inline script for the consumer side. No-op in a real browser, where
    // var() works and window.__IQLY_TOKENS__ is simply unused.
    withoutTokensLink = withoutTokensLink.replace(
      '<head>',
      '<head>\n<script>window.__IQLY_TOKENS__ = ' + JSON.stringify(tokens) + ';</script>'
    );

    const tmpHtmlPath = path.join(CREATIVES_DIR, '.export-' + creative.file);
    fs.writeFileSync(tmpHtmlPath, withoutTokensLink, 'utf8');
    tmpPaths.push(tmpHtmlPath);

    const outPath = path.join(CREATIVES_DIR, creative.out);
    console.log('exporting ' + creative.out + ' (' + creative.width + 'x' + creative.height + ')');
    execFileSync(WKHTMLTOIMAGE, [
      '--enable-local-file-access',
      '--width', String(creative.width),
      '--height', String(creative.height),
      '--disable-smart-width',
      '--quality', '100',
      tmpHtmlPath,
      outPath,
    ], { stdio: 'inherit' });
  });

  tmpPaths.forEach(function (p) { fs.rmSync(p, { force: true }); });
}

main();
