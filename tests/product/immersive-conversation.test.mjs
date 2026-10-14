import test from 'node:test';
import assert from 'node:assert/strict';
import {conversationView} from '../../product/conversation-view.mjs';
const base={project:{id:'proj_12345678',company_input:{name:'Atelier <test>'}},conversation:{messages:[]},versions:[]};
test('waiting reports a retained request without inferring production milestones',()=>{
 const html=conversationView({...base,job:{status:'queued',progress:{label:'Demande conservée'}}});
 assert.match(html,/Demande conservée/);assert.doesNotMatch(html,/Production démarrée|100%|Étape terminée/);
});
test('only the supplied confirmed Work message is rendered and escaped',()=>{
 const html=conversationView({...base,job:{status:'creating',progress:{confirmed_message:'Direction <confirmée>'}}});
 assert.match(html,/Direction &lt;confirmée&gt;/);assert.doesNotMatch(html,/Direction <confirmée>/);
});
test('real Work preview keeps the scoped authenticated URL, interactive sandbox and phone format',()=>{
 const html=conversationView({...base,versions:[{id:'version_123',state:'ready',source:'work-mcp'}]},{device:'mobile'});
 assert.match(html,/\/api\/product\/projects\/proj_12345678\/versions\/version_123\/preview/);
 assert.match(html,/sandbox="allow-scripts allow-forms"/);assert.match(html,/demo-stage mobile/);
 assert.doesNotMatch(html,/<video|scale\(/);
});
test('unqualified Work delivery stays unavailable for approval',()=>{
 const html=conversationView({...base,conversation:{messages:[],delivery_qualification:'preview_only'},versions:[{id:'version_123',state:'ready',source:'work-mcp'}]});
 assert.match(html,/l’abonnement n’est pas encore ouvert/);assert.doesNotMatch(html,/data-action="approve"/);
});
test('messages retain text escaping',()=>{
 const html=conversationView({...base,conversation:{messages:[{role:'user',content:'<script>alert(1)</script>'}]}});
 assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>alert/);
});
