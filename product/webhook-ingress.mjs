import { verifyWebhook, LIVE_ACCOUNT_ID } from "./stripe-gateway.mjs";
/** Public ingress exposes exactly one signed POST. The private product stays private. */
export function webhookIngress({
  env,
  fetcher = fetch,
  clock = () => Date.now(),
}) {
  const test=env.FABRYA_STRIPE_MODE==='test';
  const secret=test?env.FABRYA_PRODUCT_STRIPE_TEST_WEBHOOK_SECRET:env.FABRYA_PRODUCT_STRIPE_LIVE_WEBHOOK_SECRET;
  const bearer=test?env.FABRYA_PRIVATE_PRODUCT_TEST_SERVICE:env.FABRYA_PRIVATE_PRODUCT_BEARER;
  const target=test?'https://fabrya-product-qa.sempehugo03.chatgpt.site':'https://fabrya-product-live-validation.sempehugo03.chatgpt.site';
  return async (request) => {
    const url = new URL(request.url);
    if (url.pathname !== "/stripe/webhook")
      return new Response("Page indisponible.", { status: 404 });
    if (request.method !== "POST")
      return new Response("Méthode indisponible.", {
        status: 405,
        headers: { Allow: "POST" },
      });
    if (
      !secret ||
      !bearer ||
      !env.FABRYA_PRIVATE_PRODUCT_ORIGIN
    )
      return new Response("Service indisponible.", { status: 503 });
    // Pin the destination: service credentials can never be forwarded to arbitrary hosts.
    if (
      env.FABRYA_PRIVATE_PRODUCT_ORIGIN !== target
    )
      return new Response("Service indisponible.", { status: 503 });
    try {
      const chunks = [];
      let size = 0;
      const reader = request.body?.getReader();
      if (!reader) return new Response("Requête invalide.", { status: 400 });
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 200000) {
          await reader.cancel();
          return new Response("Requête trop grande.", { status: 413 });
        }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
      }
      const raw = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      const signature = request.headers.get("Stripe-Signature");
      const event = await verifyWebhook(
        raw,
        signature,
        secret,
        clock,
      );
      if (
        event.livemode !== !test ||
        (event.account && event.account !== LIVE_ACCOUNT_ID)
      )
        return new Response("Événement refusé.", { status: 400 });
      const response = await fetcher(
        env.FABRYA_PRIVATE_PRODUCT_ORIGIN + "/api/product/webhook",
        {
          method: "POST",
          redirect: "manual",
          signal: AbortSignal.timeout(20000),
          body: bytes,
          headers: {
            "Content-Type": "application/json",
            "Stripe-Signature": signature,
            "OAI-Sites-Authorization":
              "Bearer " + bearer,
          },
        },
      );
      return new Response(
        response.ok ? "Événement reçu." : "Confirmation indisponible.",
        {
          status: response.ok ? 200 : 503,
          headers: { "Cache-Control": "no-store" },
        },
      );
    } catch (error) {
      return new Response("Événement refusé.", {
        status: error?.status === 400 ? 400 : 503,
        headers: { "Cache-Control": "no-store" },
      });
    }
  };
}
export default { fetch: (request, env) => webhookIngress({ env })(request) };
