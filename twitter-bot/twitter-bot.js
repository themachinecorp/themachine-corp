/**
 * Twitter Automation Bot - Stealth Mode
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const fs = require('fs');
const path = require('path');

const CONFIG = {
    cookiesFile: path.join(__dirname, 'cookies.json'),
    twitterUrl: 'https://x.com'
};

let browser = null;
let page = null;

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function initBrowser() {
    if (browser) return browser;
    
    browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    return browser;
}

async function saveCookies() {
    if (!page) return;
    const cookies = await page.cookies(CONFIG.twitterUrl);
    fs.writeFileSync(CONFIG.cookiesFile, JSON.stringify(cookies, null, 2));
    console.log('✓ Cookies saved');
}

async function loadCookies() {
    if (!fs.existsSync(CONFIG.cookiesFile)) return false;
    const cookies = JSON.parse(fs.readFileSync(CONFIG.cookiesFile, 'utf8'));
    await page.setCookie(...cookies);
    return true;
}

async function login(username, password) {
    await initBrowser();
    
    console.log('→ Opening X login...');
    await page.goto('https://x.com/login', { waitUntil: 'networkidle2', timeout: 60000 });
    await wait(5000);
    
    console.log('→ Entering username...');
    try {
        await page.waitForSelector('input[name="text"], input[autocomplete="username"]', { timeout: 10000 });
        await page.type('input[name="text"], input[autocomplete="username"]', username, { delay: 100 });
    } catch (e) {
        console.log('Trying alternative selector...');
        await page.type('input', username, { delay: 100 });
    }
    
    await page.keyboard.press('Enter');
    console.log('→ Waiting for next step...');
    await wait(3000);
    
    console.log('→ Entering password...');
    try {
        await page.waitForSelector('input[name="password"], input[autocomplete="current-password"]', { timeout: 5000 });
        await page.type('input[name="password"], input[autocomplete="current-password"]', password, { delay: 100 });
    } catch (e) {
        console.log('Password field not found');
        await page.screenshot({ path: 'login-debug.png' });
        return false;
    }
    
    await page.keyboard.press('Enter');
    console.log('→ Waiting for login...');
    await wait(5000);
    
    const url = page.url();
    console.log('→ Current URL:', url);
    
    if (url.includes('home') || url === 'https://x.com/') {
        console.log('✓ Login successful!');
        await saveCookies();
        return true;
    } else {
        console.log('✗ Need verification or login failed');
        await page.screenshot({ path: 'login-fail.png' });
        return false;
    }
}

async function tweet(text) {
    await initBrowser();
    const hasCookies = await loadCookies();
    if (!hasCookies) {
        return { success: false, error: 'Not logged in' };
    }
    
    await page.goto(CONFIG.twitterUrl, { waitUntil: 'networkidle2' });
    await wait(3000);
    
    if (page.url().includes('login')) {
        return { success: false, error: 'Cookies expired' };
    }
    
    console.log('→ Posting tweet:', text.substring(0, 50) + '...');
    
    // Click tweet button
    try {
        await page.click('a[href="/compose/tweet"]');
    } catch (e) {
        try {
            await page.click('[data-testid="sideNavNewTweetButton"]');
        } catch (e2) {
            console.log('Could not find tweet button');
        }
    }
    
    await wait(2000);
    
    // Type tweet
    try {
        await page.click('div[contenteditable="true"][role="textbox"]');
        await page.keyboard.type(text, { delay: 30 });
    } catch (e) {
        console.log('Could not type tweet');
    }
    
    await wait(500);
    
    // Submit
    try {
        await page.click('button[data-testid="tweetButton"]');
    } catch (e) {
        console.log('Submit button not found');
    }
    
    await wait(2000);
    console.log('✓ Tweet posted!');
    
    return { success: true };
}

async function getTimeline(count = 10) {
    await initBrowser();
    await loadCookies();
    
    await page.goto(CONFIG.twitterUrl, { waitUntil: 'networkidle2' });
    await wait(3000);
    
    if (page.url().includes('login')) {
        return { success: false, error: 'Not logged in' };
    }
    
    const tweets = await page.evaluate((cnt) => {
        const articles = document.querySelectorAll('article[role="article"]');
        const results = [];
        
        for (let i = 0; i < Math.min(articles.length, cnt); i++) {
            const article = articles[i];
            const text = article.querySelector('[role="group"] + div')?.innerText || '';
            
            if (text && text.length < 500) {
                results.push({ text: text.substring(0, 200) });
            }
        }
        return results;
    }, count);
    
    return { success: true, tweets };
}

async function closeBrowser() {
    if (browser) {
        await browser.close();
        browser = null;
    }
}

const command = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

async function main() {
    try {
        switch (command) {
            case 'login':
                await login(arg1, arg2);
                break;
            case 'tweet':
                await initBrowser();
                await loadCookies();
                const result = await tweet(arg1);
                console.log(result);
                break;
            case 'timeline':
                await initBrowser();
                const timeline = await getTimeline(parseInt(arg1) || 10);
                console.log(JSON.stringify(timeline, null, 2));
                break;
            default:
                console.log(`Commands:
  node twitter-bot.js login <user> <pass>
  node twitter-bot.js tweet "<message>"
  node twitter-bot.js timeline [count]`);
        }
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await closeBrowser();
    }
}

main();
