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
    // But tokens.css also carries the @font-face rules (branding pass,
    // 2026-09-25) — dropping the link silently dropped those too, so the
    // creatives rendered in a system-font fallback despite CONFIG's fonts
    // being embedded correctly for real browsers. Re-inline just the
    // @font-face blocks (already resolved against `tokens` above, since
    // they can reference var() themselves) before the link is removed.
    // tokens.css's own url('./fonts/...') is relative to styles/, but the
    // temp copy lives in creatives/ — rewrite to the same ../styles/fonts/
    // path the creative HTML files already use for other styles/ assets.
    const fontFaceBlocks = (tokensCss.match(/@font-face\s*{[^}]*}/g) || [])
      .map(function (block) { return resolveVars(block, tokens); })
      .map(function (block) { return block.replace(/url\(['"]?\.\/fonts\//g, "url('../styles/fonts/"); })
      .join('\n');
    let withoutTokensLink = resolvedHtml.replace(
      /<link[^>]*tokens\.css[^>]*>\s*/i,
      '<style>' + fontFaceBlocks + '</style>\n'
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

    // wkhtmltoimage's Qt WebKit renderer anti-aliases text/edges poorly when
    // asked to rasterize directly at the final ad-slot size (250x250,
    // 320x50) — output comes out visibly soft. Rendering at 2x pixel
    // dimensions via --zoom and then downscaling with high-quality bicubic
    // resampling (supersampling) fixes this without changing the HTML/CSS
    // or the final PNG's declared dimensions.
    const scale = 2;
    const rawOutPath = path.join(CREATIVES_DIR, '.export-raw-' + creative.out);
    const outPath = path.join(CREATIVES_DIR, creative.out);
    console.log('exporting ' + creative.out + ' (' + creative.width + 'x' + creative.height + ', ' + scale + 'x supersampled)');
    execFileSync(WKHTMLTOIMAGE, [
      '--enable-local-file-access',
      '--width', String(creative.width * scale),
      '--height', String(creative.height * scale),
      '--zoom', String(scale),
      '--disable-smart-width',
      '--quality', '100',
      tmpHtmlPath,
      rawOutPath,
    ], { stdio: 'inherit' });

    downscale(rawOutPath, outPath, creative.width, creative.height);
    fs.rmSync(rawOutPath, { force: true });
    tmpPaths.push(rawOutPath);
  });

  tmpPaths.forEach(function (p) { fs.rmSync(p, { force: true }); });
}

// No ImageMagick/sharp available in this environment — .NET System.Drawing
// via a one-shot PowerShell invocation gives us high-quality bicubic
// downscaling (supersampling) without adding a package dependency.
function downscale(srcPath, destPath, width, height) {
  const psScript = [
    'Add-Type -AssemblyName System.Drawing',
    '$src = [System.Drawing.Image]::FromFile(' + JSON.stringify(srcPath) + ')',
    '$dest = New-Object System.Drawing.Bitmap(' + width + ', ' + height + ')',
    '$dest.SetResolution($src.HorizontalResolution, $src.VerticalResolution)',
    '$g = [System.Drawing.Graphics]::FromImage($dest)',
    '$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality',
    '$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic',
    '$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality',
    '$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality',
    '$g.DrawImage($src, 0, 0, ' + width + ', ' + height + ')',
    '$dest.Save(' + JSON.stringify(destPath) + ', [System.Drawing.Imaging.ImageFormat]::Png)',
    '$g.Dispose(); $dest.Dispose(); $src.Dispose()',
  ].join('; ');
  execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psScript], { stdio: 'inherit' });
}

main();
