// Candidate-only composition. Existing public renderer is an injected fetch,
// never copied SEO content, a new renderer, or a scheduler invocation.
import { firstTouch, attributionConsent } from './first-touch.mjs';
import { platformContract } from '../private-release/platform-contract.mjs';
const PRIVATE_ORIGIN = 'https://fabrya-product-qa.sempehugo03.chatgpt.site';
const SEO_READ = /^\/conseils(?:\/[a-z0-9-]+)?\/?$/;
const STATIC_READ = /^\/(?:_next\/|_vinext\/|assets\/|images\/|fonts\/|favicon\.|icon|apple-touch-icon|manifest\.)/;
const MARKETING_READ = ['/creation-site-ia', '/refonte-site-internet', '/fonctionnement', '/tarifs', '/securite'];

export function privateComposition({ productFetch, publicFetch, privateAdminFetch, privateCmsFetch, privateReviewFetch, authorizeOwner, mode = 'candidate', localReview = false }) {
  if (!['candidate', 'rollback'].includes(mode)) throw Error('Unknown private composition mode');
  return async (request, env) => {
    const url = new URL(request.url);
    // Host alone is not owner authentication. Missing auth is a hard failure.
    const local = localReview && url.hostname === '127.0.0.1';
    if ((!local && url.origin !== PRIVATE_ORIGIN) || typeof authorizeOwner !== 'function' ||
        !(await authorizeOwner(request))) return new Response('Private review unavailable', { status: 403 });
    const privateEnv = { ...env, FABRYA_PRODUCT_ORIGIN: PRIVATE_ORIGIN,
      FABRYA_PRIVATE_LEGACY_READONLY: 'true',
      FABRYA_PRODUCT_QA: 'true', FABRYA_STRIPE_MODE: 'test', FABRYA_DEPLOYMENT_STAGE: 'private' };
    const read = request.method === 'GET' || request.method === 'HEAD';
    // Only authorized HTML arrivals; no assets, API, preview or rollback writes.
    const legacyArrival = mode === 'candidate' && request.method === 'GET' &&
      (SEO_READ.test(url.pathname) || MARKETING_READ.includes(url.pathname));
    const arrival = legacyArrival && privateEnv.DB && attributionConsent(request)
      ? await firstTouch({ db: privateEnv.DB, env: privateEnv }).arrival(request) : null;
    let response;
    if (['/interface-review','/__private-review/review.mjs','/__private-review/work-a','/__private-review/work-b'].includes(url.pathname)) {
      response = read && privateReviewFetch ? await privateReviewFetch(request,privateEnv) : new Response('Private review unavailable',{status:404});
    } else if (url.pathname === '/__private-review/initialize') {
      response = mode === 'candidate' && typeof privateAdminFetch === 'function' ? await privateAdminFetch(request, privateEnv) : new Response('Private initialization unavailable', { status: 503 });
    } else if (/^\/api\/product\/projects\/[^/]+\/(?:checkout|payment|portal)$/.test(url.pathname) || url.pathname === '/api/product/webhook') {
      response = mode === 'candidate' && privateEnv.FABRYA_STRIPE_MODE === 'test' ? await productFetch(request, privateEnv) : Response.json({ code: 'PRIVATE_BILLING_DISABLED', message: 'Paiement indisponible.' }, { status: 409 });
    } else if (url.pathname.startsWith('/api/platform-auth/')) {
      if (mode === 'rollback' && !read) response = new Response('Private rollback: writes paused', { status: 503 });
      else response = await platformContract(request, privateEnv, productFetch);
    } else if (url.pathname.startsWith('/api/product/') || url.pathname.startsWith('/product-assets/') || ['/produit','/modifications'].includes(url.pathname)) {
      // Rollback preserves read access but stops new Product writes. No DB rollback/drop.
      if (mode === 'rollback' && !read) response = new Response('Private rollback: writes paused', { status: 503 });
      else response = await productFetch(request, privateEnv);
    } else if (url.pathname.startsWith('/api/seo/')) {
      // Existing live-validation transport is untouched; QA uses its own
      // compiled, owner-private adapter to the same strict core.
      response = privateCmsFetch ? await privateCmsFetch(request, privateEnv) : await productFetch(request, privateEnv);
    } else if (read && (SEO_READ.test(url.pathname) || STATIC_READ.test(url.pathname) ||
        [...MARKETING_READ, '/robots.txt', '/sitemap.xml'].includes(url.pathname) || (mode === 'rollback' && url.pathname === '/'))) {
      response = await publicFetch(request, privateEnv);
    } else if (read && url.pathname === '/') response = await productFetch(request, privateEnv);
    else response = new Response('Route unavailable in private review', { status: 404 });
    const result = new Response(response.body, response);
    if (arrival?.cookie) result.headers.append('set-cookie', arrival.cookie);
    result.headers.set('x-robots-tag', 'noindex, nofollow');
    result.headers.set('cache-control', 'private, no-store');
    return result;
  };
}
