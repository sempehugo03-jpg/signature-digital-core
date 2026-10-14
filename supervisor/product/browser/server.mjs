// Ephemeral synthetic-only QA server: same compiled Worker, no remote services/secrets.
import { createServer } from 'node:http';
import worker from '../../../product/dist/server/index.js';
import { sqliteD1 } from '../../../tests/product/helpers.mjs';
const db=sqliteD1();
export async function startServer(){
 const server=createServer(async(req,res)=>{
  try{
   const chunks=[];for await(const c of req)chunks.push(c);
   const origin=`http://127.0.0.1:${server.address().port}`;
   const response=await worker.fetch(new Request(origin+req.url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})}),{
    DB:db,FABRYA_PRODUCT_QA:'true',PRODUCT_COOKIE_SECURE:'false',FABRYA_PRODUCT_ORIGIN:'https://fabrya-product-live-validation.sempehugo03.chatgpt.site'
   });
   res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  }catch{res.writeHead(500);res.end('Synthetic QA server error');}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 return {origin:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise(r=>server.close(()=>{db.close();r();}))};
}
