#!/usr/bin/env node
/*
  export.js — HTML → PDF export for the 3 write-up documents.

  Same tool and same var()-resolution trick as creatives/export.js (old Qt
  WebKit inside wkhtmltopdf has no CSS custom-property support) — wkhtmltopdf
  ships in the same install as wkhtmltoimage, so no new dependency is added
  for this. The resolved copy is temporary; the checked-in HTML/CSS keeps
  var() as the real source of truth.
*/

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT_DIR = __dirname;
const TOKENS_PATH = path.join(ROOT, 'styles', 'tokens.css');
const WKHTMLTOPDF = 'C:\\Program Files\\wkhtmltopdf\\bin\\wkhtmltopdf.exe';

const DOCS = [
  { file: 'write-up-part1.html', footer: 'IQly — AI Growth Builder Challenge — Part 1 of 3' },
  { file: 'write-up-part2.html', footer: 'IQly — AI Growth Builder Challenge — Part 2 of 3' },
  { file: 'write-up-part3.html', footer: 'IQly — AI Growth Builder Challenge — Part 3 of 3' },
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

  const fontFaceBlocks = (tokensCss.match(/@font-face\s*{[^}]*}/g) || [])
    .map(function (block) { return resolveVars(block, tokens); })
    .map(function (block) { return block.replace(/url\(['"]?\.\/fonts\//g, "url('../../styles/fonts/"); })
    .join('\n');

  const pdfCssRaw = fs.readFileSync(path.join(OUT_DIR, 'pdf.css'), 'utf8');
  const pdfCssResolved = resolveVars(pdfCssRaw, tokens);

  const tmpPaths = [];

  DOCS.forEach(function (doc) {
    const srcPath = path.join(OUT_DIR, doc.file);
    const html = fs.readFileSync(srcPath, 'utf8');

    // Replace both stylesheet <link>s with inline, resolved <style> blocks —
    // tokens.css's var()s and pdf.css's var()s both need resolving, and the
    // @font-face blocks need to come along too (dropped otherwise, same
    // issue documented in creatives/export.js).
    let resolved = html
      .replace(/<link[^>]*tokens\.css[^>]*>\s*/i, '<style>' + fontFaceBlocks + '</style>\n')
      .replace(/<link[^>]*pdf\.css[^>]*>\s*/i, '<style>' + pdfCssResolved + '</style>\n');

    // The in-content <footer> (position: fixed) is for the HTML opened
    // directly in a browser only — wkhtmltopdf's print path doesn't honor
    // CSS position: fixed reliably (same class of engine gap as the
    // flexbox bug on the header lockup), and on a page whose content runs
    // close to the bottom margin it silently doesn't render at all. Strip
    // it from the export copy and use wkhtmltopdf's own --footer-center,
    // which is driven by the page-margin box directly, not page content.
    resolved = resolved.replace(/<footer class="doc-footer">[\s\S]*?<\/footer>\s*/i, '');

    const tmpHtmlPath = path.join(OUT_DIR, '.export-' + doc.file);
    fs.writeFileSync(tmpHtmlPath, resolved, 'utf8');
    tmpPaths.push(tmpHtmlPath);

    const outPath = path.join(OUT_DIR, doc.file.replace(/\.html$/, '.pdf'));
    console.log('exporting ' + path.basename(outPath));
    execFileSync(WKHTMLTOPDF, [
      '--enable-local-file-access',
      '--page-size', 'A4',
      '--orientation', 'Portrait',
      '--margin-top', '16mm',
      '--margin-bottom', '20mm',
      '--margin-left', '18mm',
      '--margin-right', '18mm',
      '--footer-center', doc.footer,
      '--footer-font-size', '8',
      '--footer-spacing', '4',
      tmpHtmlPath,
      outPath,
    ], { stdio: 'inherit' });
  });

  tmpPaths.forEach(function (p) { fs.rmSync(p, { force: true }); });
}

main();
