// Existing platform endpoint response shape, backed by the same Product auth
// implementation and sd_platform_* rows. No OAuth/provider call is performed.
export async function platformContract(request, env, productFetch) {
  const url = new URL(request.url), operation = url.pathname.split('/').at(-1);
  if (!['session', 'login', 'logout'].includes(operation)) return new Response('Legacy authentication operation unavailable in private review', { status: 503 });
  const target = new URL(request.url); target.pathname = '/api/product/auth/' + operation;
  const response = await productFetch(new Request(target, request), env);
  const data = await response.json();
  const status = operation === 'session' && !data.user ? 401 : response.status;
  return Response.json(status < 400 ? { ok: true, ...(data.user ? { user: data.user } : {}) } : { ok: false, ...(data.message ? { message: data.message } : {}) }, { status, headers: response.headers });
}
