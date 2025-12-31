export async function onRequest({ request }) {
  const url = new URL(request.url);

  const backendBase = "https://school-pay-pro.onrender.com";

  const targetUrl =
    backendBase +
    url.pathname.replace("/api", "") +
    url.search;

  return fetch(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body
  });
}
