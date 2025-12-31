import type { RequestHandler } from '@cloudflare/workers-types';

const TARGET = 'https://school-pay-pro.onrender.com';

export const onRequest: RequestHandler = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/^\/api/, '') || '/';

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  }

  const targetUrl = `${TARGET}${pathname}${url.search}`;
  const headers = new Headers();

  // Forward essential headers
  ['authorization', 'content-type'].forEach((h) => {
    const val = request.headers.get(h);
    if (val) headers.set(h, val);
  });

  // Forward body for non-GET/HEAD
  const init: RequestInit = {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body
  };

  const response = await fetch(targetUrl, init);

  const respHeaders = new Headers(response.headers);
  respHeaders.set('Cache-Control', 'no-store');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: respHeaders
  });
};
