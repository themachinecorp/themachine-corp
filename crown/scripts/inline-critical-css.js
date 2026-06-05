#!/usr/bin/env node
// inline-critical-css.js — Post-build: inline the global CSS into HTML files.
// This eliminates one render-blocking HTTP request and the FOUC on slow connections.
// Tradeoff: HTML size grows by ~43KB but CSS is in initial payload.

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'out');

// ─── Find first HTML + its referenced CSS file on disk ───
function findFirst(dir) {
  if (!fs.existsSync(dir)) return null;
  const entries = fs.readdirSync(dir);
  for (const e of entries) {
    const p = path.join(dir, e);
    if (fs.statSync(p).isDirectory()) {
      const found = findFirst(p);
      if (found) return found;
    } else if (p.endsWith('.html')) {
      const html = fs.readFileSync(p, 'utf8');
      // Match href="<anything>_next/static/chunks/<file>.css" data-precedence="next"
      const m = html.match(/href="(\/[^"]*_next\/static\/chunks\/([^"]+)\.css)"\s+data-precedence="next"/);
      if (m) {
        const cssHref = m[1]; // e.g. /crown/_next/static/chunks/0o08s1jjxy8wk.css
        const cssFile = m[2] + '.css'; // e.g. 0o08s1jjxy8wk.css
        // Find the file anywhere under OUT_DIR
        function findFile(d) {
          if (!fs.existsSync(d)) return null;
          for (const f of fs.readdirSync(d)) {
            const fp = path.join(d, f);
            if (fs.statSync(fp).isDirectory()) {
              const r = findFile(fp);
              if (r) return r;
            } else if (f === cssFile) {
              return fp;
            }
          }
          return null;
        }
        const cssPath = findFile(OUT_DIR);
        if (cssPath) return { html: p, cssPath, cssHref };
      }
    }
  }
  return null;
}

const sample = findFirst(OUT_DIR);
if (!sample) {
  console.log('⚠️  No global CSS chunk found, skipping inline');
  process.exit(0);
}

const css = fs.readFileSync(sample.cssPath, 'utf8');
console.log(`📦 Global CSS: ${(css.length / 1024).toFixed(1)}KB from ${path.relative(OUT_DIR, sample.cssPath)}`);

// ─── Inline into all HTML files referencing the same CSS ───
const htmlFiles = [];
function findHtml(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) findHtml(p);
    else if (p.endsWith('.html')) htmlFiles.push(p);
  });
}
findHtml(OUT_DIR);

let inlined = 0;
htmlFiles.forEach(htmlFile => {
  const html = fs.readFileSync(htmlFile, 'utf8');
  const linkTag = `<link rel="stylesheet" href="${sample.cssHref}" data-precedence="next"/>`;
  if (!html.includes(linkTag)) return;
  const styleTag = `<style data-precedence="next" data-inlined="true">${css}</style>`;
  const newHtml = html.replace(linkTag, styleTag);
  fs.writeFileSync(htmlFile, newHtml);
  inlined++;
});

console.log(`✅ Inlined CSS into ${inlined} HTML files (each +${(css.length / 1024).toFixed(1)}KB)`);
