export async function onRequest(context) {
  const url = new URL(context.request.url);
  
  if (url.pathname === '/logomind' || url.pathname === '/logomind/') {
    return new Response(
      `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LogoMind — AI Logo 设计决策助手</title>
  <meta http-equiv="refresh" content="0;url=/out/logomind/index.html">
</head>
<body>
  <p>Redirecting to <a href="/out/logomind/index.html">LogoMind</a>...</p>
</body>
</html>`,
      {
        status: 302,
        headers: { 'Location': '/out/logomind/index.html', 'Content-Type': 'text/html' }
      }
    );
  }
  
  return context.next();
}