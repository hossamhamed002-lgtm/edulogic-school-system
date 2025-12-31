export async function onRequest({ request }) {
  const url = new URL(request.url);

  const target =
    "https://school-pay-pro.onrender.com" +
    url.pathname.replace("/api", "") +
    url.search;

  return fetch(target, {
    method: request.method,
    headers: request.headers,
    body: request.body
  });
}
