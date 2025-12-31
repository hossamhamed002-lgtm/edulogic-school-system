const TARGET = 'https://school-pay-pro.onrender.com';

export async function onRequest({ request }) {
  const url = new URL(request.url);

  const targetUrl = TARGET + url.pathname.replace(/^\/api/, '') + url.search;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  const proxied = await fetch(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body
  });

  return proxied;
}
