const http = require('http');
const fs = require('fs');
const path = require('path');

const COMFY_HOST = '127.0.0.1';
const COMFY_PORT = 8188;
const PORT = 8080;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
};

const server = http.createServer((req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    const url = new URL(req.url, `http://localhost:${PORT}`);
    
    // API 代理
    if (url.pathname === '/prompt' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const options = {
                hostname: COMFY_HOST,
                port: COMFY_PORT,
                path: '/prompt',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            };
            const proxyReq = http.request(options, (proxyRes) => {
                res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
                proxyRes.pipe(res, { end: true });
            });
            proxyReq.on('error', () => {
                res.writeHead(502);
                res.end(JSON.stringify({ error: 'ComfyUI unreachable' }));
            });
            proxyReq.write(body);
            proxyReq.end();
        });
        return;
    }
    
    // 历史代理
    if (url.pathname.startsWith('/history/')) {
        const promptId = url.pathname.split('/').pop();
        http.get(`http://${COMFY_HOST}:${COMFY_PORT}/history/${promptId}`, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
            proxyRes.pipe(res, { end: true });
        }).on('error', () => {
            res.writeHead(502);
            res.end('{}');
        });
        return;
    }
    
    // 图片代理
    if (url.pathname.startsWith('/view')) {
        const imgPath = url.pathname + url.search;
        http.get(`http://${COMFY_HOST}:${COMFY_PORT}${imgPath}`, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res, { end: true });
        }).on('error', () => {
            res.writeHead(502);
            res.end('Image not found');
        });
        return;
    }
    
    // 健康检查
    if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
    }
    
    // 静态文件
    let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
    filePath = path.join(__dirname, filePath);
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'text/plain' });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`AI Generator running on http://localhost:${PORT}`);
});
