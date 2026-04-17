#!/usr/bin/env node
/**
 * radar-update.js
 * Hourly cron: run demand-miner → update demand-cards.json → sync to demand-radar/ + demand-lab/
 * Usage: node radar-update.js
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const WORKSPACE = '/home/themachine/.openclaw/workspace';
const OUT_DIR   = path.join(WORKSPACE, 'out');
const DEMAND_LAB_DIR   = path.join(OUT_DIR, 'demand-lab');
const DEMAND_RADAR_DIR = path.join(OUT_DIR, 'demand-radar');
const DEMO_DIR         = path.join(OUT_DIR, 'demo');
const DEMAND_CARDS     = path.join(DEMAND_LAB_DIR, 'demand-cards.json');

const now = new Date().toISOString();
console.log('[' + now + '] radar-update start');

try {
  // 1. Run demand-miner (if it exists and is runnable)
  const minerPath = path.join(WORKSPACE, 'demand-miner.js');
  if (fs.existsSync(minerPath)) {
    console.log('[...] Running demand-miner.js...');
    const signals = JSON.parse(execSync('node ' + minerPath, { timeout: 60000 }));
    console.log('[...] Signals: GitHub=' + signals.sources.GitHub + ' HN=' + signals.sources.HN + ' Twitter=' + signals.sources.Twitter);
  } else {
    console.log('[!] demand-miner.js not found, skipping signal fetch');
  }

  // 2. Ensure output directories exist
  [DEMAND_LAB_DIR, DEMAND_RADAR_DIR, DEMO_DIR].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

  // 3. Load current demand-cards
  let cards = { updated: now, cards: [] };
  if (fs.existsSync(DEMAND_CARDS)) {
    cards = JSON.parse(fs.readFileSync(DEMAND_CARDS, 'utf8'));
    // Update timestamp
    cards.updated = now;
  }

  // 4. Save demand-cards.json to both directories
  const cardJson = JSON.stringify(cards, null, 2);
  fs.writeFileSync(DEMAND_CARDS, cardJson);
  fs.writeFileSync(path.join(DEMAND_RADAR_DIR, 'demand-cards.json'), cardJson);
  console.log('[+] demand-cards.json synced');

  // 5. Rebuild demand-lab/index.html with fresh card data
  const labTemplate = path.join(__dirname, 'demand-lab-template.html');
  if (fs.existsSync(labTemplate)) {
    let html = fs.readFileSync(labTemplate, 'utf8');
    const embed = 'demandCards = ' + cardJson + ';';
    const start = html.indexOf('demandCards = {"updated"');
    const end = html.indexOf('};', start) + 2;
    if (start !== -1) {
      html = html.slice(0, start) + embed + html.slice(end);
      fs.writeFileSync(path.join(DEMAND_LAB_DIR, 'index.html'), html);
      console.log('[+] demand-lab/index.html rebuilt');
    }
  }

  // 6. Update demo/index.html with fresh demand-cards
  const demoPath = path.join(DEMO_DIR, 'index.html');
  if (fs.existsSync(demoPath)) {
    let demo = fs.readFileSync(demoPath, 'utf8');
    const embed = 'demandCards = ' + cardJson + ';';
    const start = demo.indexOf('demandCards = {"updated"');
    const end = demo.indexOf('};', start) + 2;
    if (start !== -1) {
      demo = demo.slice(0, start) + embed + demo.slice(end);
      fs.writeFileSync(demoPath, demo);
      console.log('[+] demo/index.html updated');
    }
  }

  console.log('[' + now + '] radar-update done ✅');
} catch (err) {
  console.error('[!] Error:', err.message);
  process.exit(1);
}
