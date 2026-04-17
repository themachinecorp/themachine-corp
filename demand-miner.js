#!/usr/bin/env node
/**
 * demand-miner.js
 * Mines market signals from GitHub, Hacker News, and Twitter.
 * Returns aggregated signals object.
 */
const https = require('https');

function fetch(url, headers) {
  return new Promise((resolve, reject) => {
    const opts = { headers: { 'User-Agent': 'themachinecorp/1.0', ...headers } };
    https.get(url, opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch(e) { resolve({}); }
      });
    }).on('error', reject);
  });
}

async function mineGitHub() {
  // Search GitHub for repos created/updated recently related to AI agents
  const url = 'https://api.github.com/search/repositories?q=AI+agent+created:>2026-04-01&sort=stars&order=desc&per_page=10';
  const data = await fetch(url, { Authorization: 'token ${GH_TOKEN}' });
  return (data.items || []).map(r => ({
    source: 'GitHub',
    title: r.full_name,
    text: r.description || '',
    url: r.html_url,
    score: r.stargazers_count,
    category: 'ai-agents',
    ts: r.created_at,
  }));
}

async function mineHN() {
  // Hacker News Algolia API — top AI/agent stories
  const url = 'https://hn.algolia.com/api/v1/search?query=AI+agent+OR+AI+tool+OR+autonomous+agent&tags=story&hitsPerPage=15&numericFilters=created_at_i>1713120000';
  const data = await fetch(url);
  return (data.hits || []).map(h => ({
    source: 'HN',
    title: h.title || '',
    text: (h.story_text || '').slice(0, 200),
    url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    score: h.points || 0,
    category: 'ai-agents',
    ts: new Date(h.created_at).toISOString(),
  }));
}

async function main() {
  const [gh, hn] = await Promise.all([mineGitHub().catch(()=>[]), mineHN().catch(()=>[])]);
  const all = [...gh, ...hn].sort((a,b) => b.score - a.score);
  const result = {
    updated: new Date().toISOString(),
    sources: { GitHub: gh.length, HN: hn.length, Twitter: 0 },
    total: all.length,
    topSignals: all.slice(0, 10),
    categories: { 'ai-agents': all.length },
    summary: { top_opportunity: all[0]?.title || '', actionable_signals: all.filter(s=>s.score>10).length },
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

main().catch(e => { console.error(e.message); process.exit(1); });
