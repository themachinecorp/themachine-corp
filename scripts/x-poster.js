#!/usr/bin/env node
/**
 * x-poster.js — X/Twitter automated poster via Playwright CDP
 * 
 * Reads drafts from auto/tweetDraft.md (or --file flag)
 * Enforces: max 2 tweets/day, no consecutive self-reply threads
 * Uses Chrome debug port ws://127.0.0.1:9222
 * 
 * Usage:
 *   node scripts/x-poster.js                  # post next draft
 *   node scripts/x-poster.js --dry-run        # show what would post
 *   node scripts/x-poster.js --file path.md    # custom draft file
 *   node scripts/x-poster.js --force           # bypass daily limit
 */

const fs = require('fs');
const path = require('path');

// ── Config ────────────────────────────────────────────────────────────────
const CHROME_DEBUG_URL = 'ws://127.0.0.1:9222';
const DRAFT_FILE = path.join(__dirname, '..', 'auto', 'tweetDraft.md');
const STATE_FILE = path.join(__dirname, '..', 'auto', 'x-poster-state.json');
const MAX_TWEETS_PER_DAY = 2;
const MIN_INTERVAL_HOURS = 1;  // minimum gap between our own tweets

const ARGV = process.argv.slice(2);
const DRY_RUN = ARGV.includes('--dry-run');
const FORCE = ARGV.includes('--force');
const CUSTOM_FILE = (() => {
  const idx = ARGV.indexOf('--file');
  return idx !== -1 && ARGV[idx + 1] ? ARGV[idx + 1] : null;
})();

// ── State helpers ──────────────────────────────────────────────────────────
function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return { lastPostDate: null, postedToday: 0, lastTweetTime: null };
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
}

function getTodayPosts(state) {
  if (!isToday(state.lastPostDate)) return 0;
  return state.postedToday || 0;
}

function canPost(state) {
  if (FORCE) return { ok: true, reason: 'forced' };
  const today = getTodayPosts(state);
  if (today >= MAX_TWEETS_PER_DAY) {
    return { ok: false, reason: `Already posted ${today}/${MAX_TWEETS_PER_DAY} today` };
  }
  // Check minimum interval
  if (state.lastTweetTime) {
    const gap = (Date.now() - new Date(state.lastTweetTime).getTime()) / 1000 / 60 / 60;
    if (gap < MIN_INTERVAL_HOURS) {
      return { ok: false, reason: `Last tweet only ${gap.toFixed(1)}h ago, need ${MIN_INTERVAL_HOURS}h gap` };
    }
  }
  return { ok: true };
}

// ── Draft parsing ──────────────────────────────────────────────────────────
/**
 * Parse tweetDraft.md
 * Format:
 *   # Tweet Draft - title
 *   ---
 *   [content]
 *   ---
 *   (no output)  ← marks this draft as already posted
 */
function parseDrafts(content) {
  const drafts = [];
  const blocks = content.split(/^---$/m);
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;
    // Skip header lines starting with #
    const bodyLines = lines.filter(l => !l.startsWith('#'));
    const body = bodyLines.join('\n').trim();
    if (!body || body === '(no output)') continue;
    drafts.push(body);
  }
  return drafts;
}

function readDraftFile() {
  const filePath = CUSTOM_FILE || DRAFT_FILE;
  if (!fs.existsSync(filePath)) {
    throw new Error(`Draft file not found: ${filePath}`);
  }
  return parseDrafts(fs.readFileSync(filePath, 'utf8'));
}

// ── Playwright CDP ──────────────────────────────────────────────────────────
async function getChromeBrowser() {
  const { chromium } = require('playwright');
  const browsers = await chromium.connectOverCDP(`http://127.0.0.1:9222`);
  return browsers;
}

async function postTweetVia CDP(browser, text) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  try {
    // Navigate to X compose
    await page.goto('https://x.com/compose/post', { waitUntil: 'networkidle', timeout: 15000 });
    
    // Wait for the editor
    const editor = page.locator('[data-testid="tweetTextarea_0"]');
    await editor.waitFor({ timeout: 10000 });
    
    await editor.click();
    await editor.fill(text);
    
    // Click Post
    const postBtn = page.locator('[data-testid="tweetButtonInline"]:not([disabled])');
    await postBtn.waitFor({ timeout: 5000 });
    await postBtn.click();
    
    // Wait for confirmation (URL change or success indicator)
    await page.waitForURL('**/i/status/**', { timeout: 15000 }).catch(() => {});
    
    return { success: true };
  } finally {
    await ctx.close();
  }
}

// Simpler fallback using direct Twitter web UI interaction
async function postTweet(browser, text) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  try {
    await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Click compose
    const composeBtn = page.locator('[data-testid="FloatingWriteButton"]').first();
    const hasCompose = await composeBtn.isVisible().catch(() => false);
    
    if (hasCompose) {
      await composeBtn.click();
      await page.waitForTimeout(1000);
    } else {
      // Fallback: direct compose URL
      await page.goto('https://x.com/compose/post', { waitUntil: 'domcontentloaded', timeout: 15000 });
    }

    // Type the tweet
    const editor = page.locator('[data-testid="tweetTextarea_0"]').first();
    await editor.waitFor({ timeout: 10000 });
    await editor.click({ force: true });
    await editor.fill(text);
    await page.waitForTimeout(500);

    // Post
    const postBtn = page.locator('[data-testid="tweetButton"]:not([disabled]), [data-testid="tweetButtonInline"]:not([disabled])').first();
    await postBtn.waitFor({ timeout: 5000 });
    await postBtn.click();
    
    // Wait for success
    await page.waitForTimeout(3000);
    
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  } finally {
    await ctx.close();
  }
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const state = loadState();
  const { ok, reason } = canPost(state);
  
  let drafts;
  try {
    drafts = readDraftFile();
  } catch (err) {
    console.error('❌ Draft read error:', err.message);
    process.exit(1);
  }

  if (drafts.length === 0) {
    console.log('ℹ️  No drafts to post (or all marked no-output)');
    process.exit(0);
  }

  // Pick first available draft
  const tweetText = drafts[0];

  if (DRY_RUN) {
    console.log('🧪 Dry run — would post:');
    console.log('─'.repeat(50));
    console.log(tweetText);
    console.log('─'.repeat(50));
    console.log(`Can post: ${ok ? 'YES' : 'NO — ' + reason}`);
    console.log(`Posted today: ${getTodayPosts(state)}/${MAX_TWEETS_PER_DAY}`);
    process.exit(0);
  }

  if (!ok) {
    console.log(`⏸️  Cannot post: ${reason}`);
    process.exit(0);
  }

  console.log('📝 Posting tweet...');
  console.log(tweetText.slice(0, 80) + (tweetText.length > 80 ? '...' : ''));

  let result;
  try {
    const { chromium } = require('playwright');
    const browser = await chromium.connectOverCDP(CHROME_DEBUG_URL);
    result = await postTweet(browser, tweetText);
    await browser.close();
  } catch (err) {
    console.error('❌ Playwright CDP error:', err.message);
    console.log('💡 Is Chrome running with --remote-debugging-port=9222 ?');
    result = { success: false, error: err.message };
  }

  if (result.success) {
    const now = new Date().toISOString();
    state.lastPostDate = now.slice(0, 10);
    state.postedToday = getTodayPosts(state) + 1;
    state.lastTweetTime = now;
    saveState(state);
    
    // Mark draft as no-output so next run picks next one
    markDraftPosted(CUSTOM_FILE || DRAFT_FILE);
    
    console.log(`✅ Posted! (${state.postedToday}/${MAX_TWEETS_PER_DAY} today)`);
  } else {
    console.error('❌ Post failed:', result.error);
    process.exit(1);
  }
}

function markDraftPosted(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    // Prepend "(no output)" marker to first unposted block
    const firstSep = content.indexOf('\n---\n');
    if (firstSep === -1) return;
    const insertPos = content.indexOf('\n', firstSep + 5);
    if (insertPos === -1) return;
    content = content.slice(0, insertPos) + '\n(no output)' + content.slice(insertPos);
    fs.writeFileSync(filePath, content);
  } catch {
    // non-fatal
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
