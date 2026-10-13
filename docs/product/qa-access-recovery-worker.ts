// Uses the very same Vinext app-router renderer as public506. The historical
// worker/index.ts stays intact and is deliberately not imported: fetch pumps,
// workflow classes and scheduled events are not part of this private entry.
import handler from 'vinext/server/app-router-entry';
import product from '../product/worker-entry.mjs';
import { workMcp } from '../product/work-mcp.mjs';
import { privateComposition } from '../product/private-composition.mjs';
import { initializeReview } from './initialize.mjs';
import { qaCms } from './qa-cms.mjs';
import { review } from './review.mjs';
import { enginePrivateRoute } from '../engine/private-host-route.mjs';
import { createProductModifier } from '../engine/postpurchase/product-adapter.mjs';
import { storagePortsForRequest } from '../engine/product-storage-ports.mjs';
declare const __FABRYA_PRIVATE_MODE__: 'candidate' | 'rollback';
declare const __FABRYA_LOCAL_REVIEW__: boolean;
declare const __FABRYA_PRIVATE_SITE_ID__: string;

export default {
  async fetch(request: Request, env: Record<string, any>, ctx: any) {
    if(new URL(request.url).pathname.startsWith('/engine/')) {
      if(__FABRYA_PRIVATE_SITE_ID__ !== 'appgprj_6acaa0a0fc588191b73beeb33eb23f88') return new Response('Private Engine only',{status:403});
      return enginePrivateRoute(request,env);
    }
    if (new URL(request.url).pathname === '/mcp') {
      if(new URL(request.url).hostname !== 'fabrya-product-qa.sempehugo03.chatgpt.site') return new Response('Private QA only',{status:403});
      return workMcp(request,{...env,FABRYA_QA_PRODUCT_FETCH:(r:Request)=>product.fetch(r,env)});
    }
    const router = privateComposition({
      mode: __FABRYA_PRIVATE_MODE__, localReview: __FABRYA_LOCAL_REVIEW__,
      // Sites' confirmed owner-private edge is the authentication boundary.
      // A consumed wc_bypass bearer may have no identity header. Never infer
      // identity from a caller header or require an invented email variable.
      // Exact host is enforced by privateComposition; deployment must retain
      // owner-only visibility. Other worker URLs/public hosts are refused.
      authorizeOwner: async () => __FABRYA_PRIVATE_SITE_ID__ === 'appgprj_6acaa0a0fc588191b73beeb33eb23f88',
      productFetch: (r: Request, privateEnv: any) => product.fetch(r, {
        ...privateEnv,
        FABRYA_POSTPURCHASE_ENGINE_FACTORY: (options: any) => createProductModifier(options),
        FABRYA_POSTPURCHASE_STORAGE_FACTORY: storagePortsForRequest,
      }),
      publicFetch: (r: Request, privateEnv: any) => handler.fetch(r, privateEnv, ctx),
      privateAdminFetch: (r: Request, privateEnv: any) => initializeReview(r, privateEnv),
      privateReviewFetch: (r: Request) => review(r),
      privateCmsFetch: (r: Request, privateEnv: any) => qaCms(r, privateEnv, (preview: Request, e: any) => handler.fetch(preview,e,ctx), { localReview: __FABRYA_LOCAL_REVIEW__ }),
    });
    return router(request, env);
  },
};
