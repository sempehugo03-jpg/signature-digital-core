import { chromium } from 'playwright';
import { mkdir,writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { startServer } from './server.mjs';
const output=process.env.PRODUCT_QA_OUTPUT||'/tmp/fabrya-browser-qa';
await mkdir(output,{recursive:true});
const server=await startServer();
let browser;
const results=[];const captures=[];
async function check(page,name,width){
 await page.locator('main').waitFor(); await page.evaluate(()=>document.fonts.ready);
 const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
 assert.equal(dimensions.width,width);
 const path=`${name}-${width}.png`;await page.screenshot({path:`${output}/${path}`,fullPage:true,animations:'disabled'});captures.push(path);
 assert.ok(dimensions.scroll<=width+1,`${name}: horizontal overflow ${dimensions.scroll}/${width}`);
}
try{
 browser=await chromium.launch();
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  // Block every non-loopback request. This process has no Stripe/provider capability.
  await context.route('**/*',route=>new URL(route.request().url()).origin===server.origin?route.continue():route.abort());
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(server.origin+'/'); await check(page,'landing',width);
  assert.match(await page.locator('main').innerText(),/59 €/);
  await page.getByRole('button',{name:'Créer ma proposition',exact:true}).click();
  await page.locator('input[name="name"]').fill('Client fictif QA');
  await page.locator('input[name="email"]').fill(`synthetic-${width}@example.test`);
  await page.locator('input[name="password"]').fill('Synthetic-only-password-2026');
  await page.locator('[data-form="auth"] button').click();
  await page.locator('[data-action="new-project"]').click();
  await page.locator('[data-form="brief"]').waitFor();
  await page.locator('input[name="name"]').fill('Atelier fictif QA');
  await page.locator('input[name="activity"]').fill('Menuiserie');
  await page.locator('[data-form="brief"] button:not([type="button"])').click();
  await page.locator('textarea[name="objective"]').fill('Recevoir des demandes');
  await page.locator('[data-form="brief"] button:not([type="button"])').click();
  await page.locator('textarea[name="description"]').fill('Un atelier fictif pour vérifier le parcours.');
  await page.locator('[data-form="brief"] button:not([type="button"])').click();
  await check(page,'brief',width);
  await page.locator('[data-form="brief"] button:not([type="button"])').click();
  await page.locator('[data-action="approve"]').waitFor({timeout:30000});
  await check(page,'proposal',width); await page.reload();
  await page.locator('[data-action="approve"]').waitFor();
  await page.locator('[data-action="approve"]').click();
  await page.locator('[data-action="confirm-approval"]').click();
  await page.locator('.payment-clarity').waitFor(); await check(page,'before-payment',width);
  assert.match(await page.locator('.payment-clarity').innerText(),/Publication du site sur Internet/);
  assert.equal(await page.locator('#accept-offer').isChecked(),false);
  // Never click checkout or a real portal; no payment/checkout session created.
  for(const scenario of ['active','past_due','unpaid','canceled','pending','slow','failed','timeout','cancelled','empty-history','network-error','offline','session-expired']){
   await page.goto(server.origin+`/interface-fixture?scenario=${scenario}&project=fixture_project`);
   await check(page,scenario,width);
   if(['active','past_due','unpaid','canceled','pending'].includes(scenario)){
    await page.locator('[data-action="tab"][data-id="subscription"]').click();
    await check(page,`${scenario}-subscription`,width);
   }
   if(['failed','timeout','cancelled'].includes(scenario)){
    await page.locator('[data-action="retry"]').click(); await page.locator('[data-action="approve"]').waitFor();
   }
  }
  assert.deepEqual(errors,[]);results.push({width,status:'PASS',scenarios:13,real_local_flow:true,reload_recovered:true});await context.close();
 }
}catch(error){results.push({status:'FAIL',diagnostic:error.message.slice(0,500)});process.exitCode=1;}
finally{if(browser)await browser.close();await server.close();}
await writeFile(`${output}/report.json`,JSON.stringify({schema:1,scope:'Compiled Product Worker on loopback; ephemeral synthetic SQLite and simulated billing states; no private customer data, no Stripe calls; automated checks do not certify subjective visual quality or hosted LIVE proof',results,captures,status:results.length===3&&results.every(r=>r.status==='PASS')?'PASS':'FAIL'},null,2));
console.log(JSON.stringify(results));
