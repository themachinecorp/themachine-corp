export async function onRequest(context) {
  const url = new URL(context.request.url);

  // Unified auth routes — redirect to CROWN Next.js app
  if (url.pathname === '/_auth/' || url.pathname === '/_auth') {
    return Response.redirect(new URL('/crown/login/', url.origin), 302);
  }
  if (url.pathname === '/auth/callback/' || url.pathname === '/auth/callback') {
    return Response.redirect(new URL('/crown/callback_route/', url.origin), 302);
  }

  // LogoMind legacy redirect → serve new logomind.html directly
  if (url.pathname === '/logomind' || url.pathname === '/logomind/' || url.pathname === '/logomind.html') {
    // serve /logomind/ which is the static logomind.html
    const r = await context.next();
    return r;
  }

  return context.next();
}