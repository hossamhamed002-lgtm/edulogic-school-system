const TARGET = 'https://school-pay-pro.onrender.com';

export async function onRequest({ request }) {
  const url = new URL(request.url);

  // Build target URL by stripping /api prefix
  const targetUrl = TARGET + url.pathname.replace(/^\/api/, '') + url.search;

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  // Proxy request
  const proxied = await fetch(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body
  });

  // Clone response with CORS headers
  const respHeaders = new Headers(proxied.headers);
  respHeaders.set('Access-Control-Allow-Origin', '*');
  respHeaders.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  respHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return new Response(proxied.body, {
    status: proxied.status,
    statusText: proxied.statusText,
    headers: respHeaders
  });
}
