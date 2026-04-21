const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

function getData(type) {
  try {
    const data = fs.readFileSync(path.join(__dirname, '../out/api/openclaw/' + type + '.json'), 'utf8');
    return JSON.parse(data);
  } catch { return {}; }
}

function getSystemData() {
  try {
    const data = fs.readFileSync(path.join(__dirname, '../out/api/office.json'), 'utf8');
    return JSON.parse(data);
  } catch { return {}; }
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  
  const url = req.url;
  console.log('Request:', url);
  
  // Main snapshot endpoint
  if (url.startsWith('/api/openclaw/snapshot')) {
    const snapshot = getSystemData();
    res.end(JSON.stringify(snapshot));
  } 
  // Resource list
  else if (url.startsWith('/api/openclaw/resource')) {
    res.end(JSON.stringify(getData('resource')));
  }
  // Agents
  else if (url.startsWith('/api/openclaw/agents')) {
    res.end(JSON.stringify(getData('agents')));
  }
  // Tasks
  else if (url.startsWith('/api/openclaw/tasks')) {
    res.end(JSON.stringify(getData('tasks')));
  }
  // File endpoint
  else if (url.startsWith('/api/openclaw/file')) {
    res.end(JSON.stringify({ path: 'workspace' }));
  }
  // Open endpoint  
  else if (url.startsWith('/api/openclaw/open')) {
    res.end(JSON.stringify({ status: 'ok' }));
  }
  // Preview
  else if (url.startsWith('/api/openclaw/preview')) {
    res.end(JSON.stringify({ preview: 'data:image/png;base64,' }));
  }
  else {
    res.end(JSON.stringify({ error: 'Not found', url }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('API running on port ' + PORT);
});
