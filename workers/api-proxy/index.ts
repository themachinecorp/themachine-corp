export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    // Map requests to local OpenClaw API
    const paths: Record<string, string> = {
      'snapshot': 'http://127.0.0.1:8080/api/openclaw/snapshot',
      'agents': 'http://127.0.0.1:8080/api/openclaw/agents',
      'tasks': 'http://127.0.0.1:8080/api/openclaw/tasks',
      'memory': 'http://127.0.0.1:8080/api/openclaw/memory',
      'skills': 'http://127.0.0.1:8080/api/openclaw/skills',
    };
    
    const path = url.pathname.replace('/api/openclaw/', '');
    const target = paths[path];
    
    if (!target) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    try {
      const response = await fetch(target);
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'OpenClaw not reachable' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
