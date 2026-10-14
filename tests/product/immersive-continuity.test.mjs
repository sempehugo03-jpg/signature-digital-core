import test from 'node:test';
import assert from 'node:assert/strict';
import {conversationView} from '../../product/conversation-view.mjs';
const project={id:'private_project_123',company_input:{name:'<script>atelier</script>'}};
const versions=[{id:'v1',number:1,state:'ready',source:'work-mcp'},{id:'v2',number:2,state:'ready',source:'work-mcp'}];
test('review opens newest Work delivery; explicitly selected original still opens original authenticated preview',()=>{
 const html=conversationView({project,versions});
 assert.match(html,/versions\/v2\/preview/);assert.doesNotMatch(html,/<script>atelier/);assert.match(html,/sandbox="allow-scripts allow-forms"/);
 const original=conversationView({project,versions},{selected:'v1'});
 assert.match(original,/versions\/v1\/preview/);assert.doesNotMatch(original,/versions\/v2\/preview/);
});
test('queued Work request reports only received state, with no inferred milestones or percentage',()=>{
 const html=conversationView({project,versions:[],job:{status:'queued'},conversation:{messages:[]}});
 assert.match(html,/Votre demande est enregistrée/);assert.doesNotMatch(html,/Compréhension de votre entreprise|Direction de votre expérience|progressbar|\d+%/);
 assert.match(html,/Vous pouvez quitter cet espace et revenir/);
});
test('unqualified genuine demo remains interactive while approval and checkout stay gated',()=>{
 const html=conversationView({project,versions,conversation:{delivery_qualification:'preview_only'}});
 assert.match(html,/<iframe/);assert.match(html,/l’abonnement n’est pas encore ouvert/);assert.doesNotMatch(html,/data-action="approve"|data-action="checkout"/);
});
