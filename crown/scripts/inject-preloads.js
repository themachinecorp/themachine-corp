#!/usr/bin/env node
// inject-preloads.js — Post-build: read .next/static/ chunk sizes, pick the
// top 4 largest JS files referenced by each HTML, inject <link rel="modulepreload">
// tags. Static export doesn't emit build-manifest.json, so we walk the filesystem.

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'out');
const TOP_N = 4; // top N largest chunks to preload

// ─── Find all .js chunks in _next/static/chunks/, sorted by size desc ───
const chunksDir = path.join(OUT_DIR, '_next', 'static', 'chunks');
if (!fs.existsSync(chunksDir)) {
  console.log('⚠️  No _next/static/chunks/ found, skipping preload injection');
  process.exit(0);
}

const allChunks = fs.readdirSync(chunksDir)
  .filter(f => f.endsWith('.js'))
  .map(f => ({ name: f, size: fs.statSync(path.join(chunksDir, f)).size }))
  .sort((a, b) => b.size - a.size);

const topChunks = allChunks.slice(0, TOP_N);
console.log(`📦 Top ${topChunks.length} chunks:`);
topChunks.forEach(c => console.log(`   ${(c.size / 1024).toFixed(1)}KB  ${c.name}`));

// ─── For each HTML file, find already-referenced chunks and inject preloads for top ones ───
const htmlFiles = [];
function findHtml(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    const s = fs.statSync(p);
    if (s.isDirectory()) findHtml(p);
    else if (f === 'index.html' || f.endsWith('.html')) htmlFiles.push(p);
  });
}
findHtml(OUT_DIR);

let totalInjected = 0;
htmlFiles.forEach(htmlFile => {
  let html = fs.readFileSync(htmlFile, 'utf8');
  let injected = 0;

  topChunks.forEach(chunk => {
    // Chunk path as referenced in HTML (with basePath /crown/)
    const chunkPath = `/crown/_next/static/chunks/${chunk.name}`;
    // Only inject if this HTML actually uses this chunk
    if (!html.includes(chunkPath)) return;
    // Skip if already preloaded
    if (html.includes(`href="${chunkPath}"`)) return;
    // Inject before </head>
    const tag = `<link rel="modulepreload" href="${chunkPath}" as="script" crossorigin="anonymous">`;
    html = html.replace('</head>', `    ${tag}\n  </head>`);
    injected++;
  });

  if (injected > 0) {
    fs.writeFileSync(htmlFile, html);
    totalInjected += injected;
    console.log(`  ✓ ${path.relative(OUT_DIR, htmlFile)}: +${injected} preloads`);
  }
});

console.log(`\n✅ Injected ${totalInjected} modulepreload links across ${htmlFiles.length} HTML files`);
