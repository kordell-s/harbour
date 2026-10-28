const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const governmentSource = require('node:fs').existsSync(`${__dirname}/../dist/government.js`) ? readFileSync(`${__dirname}/../dist/government.js`, 'utf8') : '';
const source = governmentSource + '\n' + (require('node:fs').existsSync(`${__dirname}/../dist/documents.js`) ? readFileSync(`${__dirname}/../dist/documents.js`, 'utf8') : '') + '\n' + readFileSync(`${__dirname}/../dist/manifest-import.js`, 'utf8') + '\n' + readFileSync(process.env.HARBOUR_APP || `${__dirname}/../dist/app.js`, 'utf8');

// A minimal DOM harness exercises the real route renderers and event handlers.
// It does not substitute for a browser layout or accessibility check.
function session(appSource = source) {
  const elements = new Map();
  const element = key => {
    if (!elements.has(key)) elements.set(key, {
      innerHTML: '', value: '', style: {}, files: [],
      querySelector: selector => element(`${key} ${selector}`),
      prepend(child) { element('#app').innerHTML += child.innerHTML; }, append() {},
    });
    return elements.get(key);
  };
  const listeners = [];
  const context = vm.createContext({
    document: { querySelector: element, querySelectorAll: () => [], createElement: () => element('created') },
    location: { _hash: '', get hash() { return this._hash; }, set hash(value) { this._hash = value.startsWith('#') ? value : '#' + value; } },
    window: { addEventListener: (event, handler) => listeners.push([event, handler]), scrollTo() {} },
    setTimeout: () => 1, clearTimeout() {}, console,
    FormData: class { constructor(form) { return Object.entries(form.data); } },
  });
  vm.runInContext(appSource, context);
  return { element, listeners, run: code => vm.runInContext(code, context),
    route(hash) { context.location.hash = hash; vm.runInContext('render()', context); return element('#app').innerHTML; },
    decision(department, status, note = 'Sample reason', officer = 'Demo officer') {
      for (const [key, value] of Object.entries({ department, decision: status, reason: note, officer })) element(`#${key}`).value = value;
      element('#decisionform').onsubmit({ preventDefault() {} });
    },
  };
}

test('visit summary is a coordination stage, not universal approval',()=>{
 const s=session(); assert.equal(s.run('overall(visits[2])'),'Ready to report');
 assert.equal(s.run("visits[2].decisions.find(d=>d.key==='tax').applicability"),'Unconfirmed');
});
test('clearance stays independent from payments and conditional permits',()=>{
 const s=session();
 s.run("recordPayment(visits[0],{authority:'Customs',purpose:'Sample assessment',amount:'100',currency:'XCD',receipt:'DEMO-RECEIPT',assessed:'2027-01-12'})");
 assert.equal(s.run("visits[0].decisions.find(d=>d.key==='customs-in').status"),'Changes requested');
 assert.equal(s.run("visits[0].decisions.find(d=>d.key==='cruising').status"),'Pending');
});
test('officer records need a reference, reason and applicability',()=>{
 const s=session();
 assert.equal(s.run("setProcessRecord(visits[0],'cruising',{applicability:'Unconfirmed',status:'Recorded',actor:'Officer',note:'Sample',reference:'P-1',from:'2027-01-12',until:'2027-01-16'}).ok"),false);
 assert.equal(s.run("setProcessRecord(visits[0],'customs-in',{applicability:'Required',status:'Recorded',actor:'Officer',note:'Sample',reference:''}).ok"),false);
});
test('marine permit requires current inward clearance evidence',()=>{
 const s=session();
 assert.equal(s.run("setProcessRecord(visits[0],'marine',{applicability:'Required',status:'Recorded',actor:'Officer',note:'Sample',reference:'M-1',from:'2027-01-12',until:'2027-01-16'}).ok"),false);
});
test('permit records have their own validity and conditions',()=>{
 const s=session();
 assert.equal(s.run("setProcessRecord(visits[2],'cruising',{applicability:'Required',status:'Recorded',actor:'Officer',note:'Sample permit',reference:'C-1',from:'2027-01-13',until:'2027-01-14',conditions:'Road Bay only'}).ok"),true);
 assert.equal(s.run("processValidity(visits[2].decisions.find(d=>d.key==='cruising'),'2027-01-12')"),'Not yet valid');
 assert.equal(s.run("processValidity(visits[2].decisions.find(d=>d.key==='cruising'),'2027-01-15')"),'Expired');
});
test('required inward clearance cannot be marked not applicable',()=>{
 const s=session();
 assert.equal(s.run("setProcessRecord(visits[2],'immigration-in',{applicability:'Not applicable',status:'Pending',actor:'Officer',note:'Skip',reference:'X'}).ok"),false);
});
test('saving an amendment preserves submitted information',()=>{
 const s=session();s.run("saveApplicationDraft(visits[2],{...visits[2],name:'Changed name',response:'Correction'})");
 assert.equal(s.run('visits[2].name'),'Sea Glass');
 assert.ok(!s.route('#verify/HBR-DEMO-1003').includes('Changed name'));
});
test('submission retains decisions but marks previous records for review',()=>{
 const s=session();s.run("saveApplicationDraft(visits[2],{...visits[2],response:'Changed voyage'})");
 assert.equal(s.run('submitDraft(visits[2]).ok'),true);
 assert.equal(s.run("visits[2].decisions[0].status"),'Recorded');
 assert.equal(s.run("visits[2].decisions[0].needsReview"),true);
 assert.equal(s.run('inwardComplete(visits[2])'),false);
});
test('cancellation cannot be toggled away or lost on resubmission',()=>{
 const s=session();
 s.run("setProcessRecord(visits[2],'customs-in',{applicability:'Required',status:'Cancelled',actor:'Officer',note:'Withdrawn',reference:'OLD'});saveApplicationDraft(visits[2],{...visits[2],response:'Amended'})");
 s.run('submitDraft(visits[2])');
 assert.equal(s.run('visits[2].decisions[0].status'),'Cancelled');
 assert.equal(s.run("setProcessRecord(visits[2],'customs-in',{applicability:'Required',status:'Recorded',actor:'Officer',note:'Reissued',reference:'OLD'}).ok"),false);
});
test('incomplete drafts remain private and cannot be submitted',()=>{
 const s=session();s.run("saveApplicationDraft(null,{name:'Incomplete',people:[],files:[]})");
 assert.equal(s.run('submitDraft(visits[0]).ok'),false);
 assert.match(s.route('#verify/'+s.run('visits[0].reference')),/Record not found/);
});
test('insurance filenames are no longer a universal submission requirement',()=>{
 const s=session(); assert.equal(s.run("missingFields({...visits[2],files:[]}).length"),0);
});
test('departure cannot complete without inward and outward records',()=>{
 const s=session();
 assert.equal(s.run("recordMovement(visits[0],{actualArrival:'2027-01-12T10:00',actualDeparture:'2027-01-16T10:00'}).ok"),false);
 assert.equal(s.run('visits[0].actualDeparture||""'),'');
});
test('payment requires a positive amount, currency and receipt',()=>{
 const s=session();assert.equal(s.run("recordPayment(visits[0],{authority:'Customs',purpose:'Test',amount:'-1',currency:'XCD',receipt:'R',assessed:'2027-01-12'}).ok"),false);
 assert.equal(s.run('visits[0].payments.length'),0);
});
test('reset restores process examples and clears payments',()=>{
 const s=session();s.run("visits[0].payments.push({receipt:'test'});resetDemo()");
 assert.equal(s.run('visits[0].payments.length'),0);assert.equal(s.run('visits[1].submitted'),false);
});
test('public verification omits identity, officer notes and payments',()=>{
 const s=session();s.run("visits[0].decisions[0].note='PRIVATE NOTE'");
 const html=s.route('#verify/HBR-DEMO-1001');
 for(const value of ['Elena Morgan','DEMO-001','PRIVATE NOTE'])assert.ok(!html.includes(value));
});
test('every main route renders',()=>{
 const s=session();for(const route of ['#home','#dashboard','#intake','#visit/1','#review/1','#verify/HBR-DEMO-1003','#submit/2','#reset'])assert.ok(s.route(route).length>100,route);
});

test('full arrival and departure coordination needs each independent outcome',()=>{
 const s=session();
 assert.equal(s.run("recordMovement(visits[2],{actualArrival:'2027-01-10T10:00',departureStarted:'Yes'}).ok"),true);
 assert.equal(s.run('overall(visits[2])'),'Departure preparation');
 for(const key of ['customs-out','immigration-out'])assert.equal(s.run(`setProcessRecord(visits[2],'${key}',{applicability:'Required',status:'Recorded',actor:'Officer',note:'Sample outward check',reference:'OUT-${key}'}).ok`),true);
 assert.equal(s.run("recordMovement(visits[2],{actualArrival:'2027-01-10T10:00',actualDeparture:'2027-01-15T10:00',departureStarted:'Yes'}).ok"),true);
 assert.equal(s.run('overall(visits[2])'),'Departed');
 assert.equal(s.run("visits[2].decisions.find(d=>d.key==='tax').applicability"),'Unconfirmed');
});
test('conditional permission does not alter inward outcomes',()=>{
 const s=session();
 assert.equal(s.run("setProcessRecord(visits[2],'marine',{applicability:'Required',status:'Recorded',actor:'Officer',note:'Sample permission',reference:'MARINE-1',from:'2027-01-10',until:'2027-01-15',conditions:'Day use only'}).ok"),true);
 assert.equal(s.run('inwardComplete(visits[2])'),true);
 assert.equal(s.run("visits[2].decisions.find(d=>d.key==='cruising').status"),'Pending');
});
test('receipt amounts preserve decimal precision',()=>{
 const s=session();
 assert.equal(s.run("recordPayment(visits[2],{authority:'Customs',purpose:'Assessed fee',amount:'25.50',currency:'USD',receipt:'R1',assessed:'2027-01-10'}).ok"),true);
 assert.equal(s.run('visits[2].payments[0].amount'),25.5);
});

test('cancellation cannot be hidden by not-applicable or whitespace in the old reference',()=>{
 const s=session();s.run("setProcessRecord(visits[2],'cruising',{applicability:'Required',status:'Cancelled',actor:'Officer',note:'Cancelled',reference:'OLD'})");
 assert.equal(s.run("setProcessRecord(visits[2],'cruising',{applicability:'Not applicable',status:'Cancelled',actor:'Officer',note:'Skip',reference:'NA'}).ok"),false);
 assert.equal(s.run("setProcessRecord(visits[2],'cruising',{applicability:'Required',status:'Recorded',actor:'Officer',note:'Reissue',reference:' OLD ',from:'2027-01-10',until:'2027-01-15'}).ok"),false);
 assert.equal(s.run("setProcessRecord(visits[2],'cruising',{applicability:'Required',status:'Recorded',actor:'Officer',note:'Reissue',reference:'NEW',from:'2027-01-10',until:'2027-01-15'}).ok"),true);
 assert.equal(s.run('visits[2].history[0].previousRecord.status'),'Cancelled');
});

function preparedSession(type='cruising') {
 const s=session();
 s.run(`saveDocumentDraft(visits[2],'${type}',{...documentDefaults(visits[2]),applicant:'Sample Applicant',applicantAddress:'Sample address',ownerAddress:'Sample owner address',ownerAgent:'Sample Agent',agentPhone:'555',tonnageType:'Registered tonnage',tonnageSource:'Sample register',description:'Sample vessel',propulsion:'Power',rig:'Not applicable',colour:'White',ownerStatus:'Unconfirmed',period:'One week',requestedStart:'2027-01-10',applicationDate:'2027-01-08',declaration:'Confirmed for demo',construction:'Fibreglass',clearancePort:'Road Bay',nextPort:'Gustavia',destinationCountry:'Saint Barthélemy',crewCount:'1',guestCount:'0',countsConfirmed:'Confirmed for demo'})`);
 assert.equal(s.run(`submitDocumentRequest(visits[2],'${type}').ok`),true);
 return s;
}
test('document completeness is separate from visit completeness and drafts stay private',()=>{
 const s=session();s.run("saveDocumentDraft(visits[2],'cruising',{...documentDefaults(visits[2]),applicant:'Private Applicant'})");
 assert.equal(s.run("submitDocumentRequest(visits[2],'cruising').ok"),false);
 assert.equal(s.run('missingFields(visits[2]).length'),0);
 assert.ok(!s.route('#verify/HBR-DEMO-1003').includes('Private Applicant'));
});
test('submitted document requests retain distinct parties and cannot be changed by draft edits',()=>{
 const s=preparedSession();s.run("saveDocumentDraft(visits[2],'cruising',{...documentDefaults(visits[2]),applicant:'Changed'})");
 assert.equal(s.run('visits[2].documentRequests[0].data.applicant'),'Sample Applicant');
 assert.equal(s.run('visits[2].documentRequests[0].data.ownerAgent'),'Sample Agent');
 assert.equal(s.run('visits[2].owner'),'Fictional yacht owner');
});
function assess(s,exempt=false) {
 assert.equal(s.run(`createAssessment(visits[2],{requestId:visits[2].documentRequests[0].id,actor:'Officer',reference:'A-1',amount:'${exempt?'0':'25.50'}',currency:'XCD',date:'2027-01-08',basis:'Manually confirmed demo amount',kind:'${exempt?'Exempt':'Fee'}'}).ok`),true);
}
function pay(s){
 assert.equal(s.run("addLinkedReceipt(visits[2],{assessmentId:visits[2].assessments[0].id,receipt:'R-1',amount:'25.50',currency:'XCD',date:'2027-01-08'}).ok"),true);
 assert.equal(s.run("verifyLinkedReceipt(visits[2],visits[2].payments[0].id,'Officer','Matched sample evidence').ok"),true);
}
const issuance="{requestId:visits[2].documentRequests[0].id,reference:'PERMIT-1',actor:'Officer',note:'Reviewed fictional evidence',from:'2027-01-10',until:'2027-01-16',issueDate:'2027-01-09',issuePlace:'Road Bay',conditions:'Sample scope'}";
test('assessment and unverified receipt cannot issue permission',()=>{
 const s=preparedSession();assess(s);
 assert.equal(s.run(`issueDemoDocument(visits[2],${issuance}).ok`),false);
 s.run("addLinkedReceipt(visits[2],{assessmentId:visits[2].assessments[0].id,receipt:'R-1',amount:'25.50',currency:'XCD',date:'2027-01-08'})");
 assert.equal(s.run(`issueDemoDocument(visits[2],${issuance}).ok`),false);
 assert.equal(s.run("visits[2].decisions.find(d=>d.key==='cruising').status"),'Pending');
});
test('issuance freezes data and payments; duplicate references and stale requests are rejected',()=>{
 const s=preparedSession();assess(s);pay(s);
 assert.equal(s.run(`issueDemoDocument(visits[2],${issuance}).ok`),true);
 s.run("visits[2].name='Edited live name';visits[2].payments[0].amount=99");
 assert.equal(s.run('visits[2].issuedDocuments[0].data.name'),'Sea Glass');
 assert.equal(s.run('visits[2].issuedDocuments[0].receipts[0].amount'),25.5);
 assert.equal(s.run(`issueDemoDocument(visits[2],${issuance}).ok`),false);
 s.run('visits[2].version++');
 assert.equal(s.run("documentState(visits[2],visits[2].issuedDocuments[0])"),'Review needed');
});
test('exemption needs authority basis and does not require a fabricated payment',()=>{
 const s=preparedSession();assess(s,true);
 assert.equal(s.run(`issueDemoDocument(visits[2],${issuance}).ok`),true);
 assert.equal(s.run('visits[2].payments.length'),0);
});
test('receipts reject wrong currency, unknown assessment and duplicates',()=>{
 const s=preparedSession();assess(s);
 assert.equal(s.run("addLinkedReceipt(visits[2],{assessmentId:'missing',receipt:'R',amount:'25.50',currency:'XCD',date:'2027-01-08'}).ok"),false);
 assert.equal(s.run("addLinkedReceipt(visits[2],{assessmentId:visits[2].assessments[0].id,receipt:'R',amount:'25.50',currency:'USD',date:'2027-01-08'}).ok"),false);
 pay(s);
 assert.equal(s.run("addLinkedReceipt(visits[2],{assessmentId:visits[2].assessments[0].id,receipt:'R-1',amount:'25.50',currency:'XCD',date:'2027-01-08'}).ok"),false);
});
test('clearance pack uses confirmed counts and destination without a cruising fee',()=>{
 const s=preparedSession('clearance');
 assert.equal(s.run(`issueDemoDocument(visits[2],${issuance}).ok`),true);
 assert.equal(s.run('visits[2].issuedDocuments[0].data.crewCount'),'1');
 assert.equal(s.run('visits[2].issuedDocuments[0].type'),'clearance');
});
test('cruising validity observes Anguilla 09:00 and end-of-day boundaries',()=>{
 const s=session();s.run("Object.assign(visits[2].decisions[2],{status:'Recorded',applicability:'Required',from:'2027-01-10',until:'2027-01-10'})");
 assert.equal(s.run("processValidity(visits[2].decisions[2],'2027-01-10T12:59:59Z')"),'Not yet valid');
 assert.equal(s.run("processValidity(visits[2].decisions[2],'2027-01-10T13:00:00Z')"),'Within recorded dates');
 assert.equal(s.run("processValidity(visits[2].decisions[2],'2027-01-11T04:00:00Z')"),'Expired');
});
test('document routes escape input and keep private content out of verification',()=>{
 const s=preparedSession();assess(s,true);s.run(`issueDemoDocument(visits[2],${issuance})`);
 for(const route of ['#documents/3','#document-review/3','#document/3/'+s.run('visits[2].issuedDocuments[0].id')])assert.ok(s.route(route).length>100);
 const html=s.route('#verify/HBR-DEMO-1003');
 for(const privateValue of ['Sample Applicant','Sample owner address','A-1'])assert.ok(!html.includes(privateValue));
});

test('document requests must belong to the submitted vessel',()=>{
 const s=preparedSession();s.run("saveDocumentDraft(visits[2],'cruising',{...visits[2].documentRequests[0].data,registration:'OTHER-VESSEL'})");
 assert.equal(s.run("submitDocumentRequest(visits[2],'cruising').ok"),false);
});
test('cancellation stays visible after reissue and same-reference edits trigger document review',()=>{
 const s=preparedSession();assess(s,true);s.run(`issueDemoDocument(visits[2],${issuance})`);
 s.run("setProcessRecord(visits[2],'cruising',{applicability:'Required',status:'Recorded',actor:'Officer',note:'Changed conditions',reference:'PERMIT-1',from:'2027-01-10',until:'2027-01-16',conditions:'New condition'})");
 assert.equal(s.run('documentState(visits[2],visits[2].issuedDocuments[0])'),'Review needed');
 s.run("setProcessRecord(visits[2],'cruising',{applicability:'Required',status:'Cancelled',actor:'Officer',note:'Cancelled',reference:'PERMIT-1'})");
 s.run("setProcessRecord(visits[2],'cruising',{applicability:'Required',status:'Recorded',actor:'Officer',note:'Reissued',reference:'NEW-REF',from:'2027-01-10',until:'2027-01-16'})");
 assert.equal(s.run('documentState(visits[2],visits[2].issuedDocuments[0])'),'Cancelled');
});
test('copy delivery records history without changing the issued snapshot and blocks cancellation',()=>{
 const s=preparedSession();assess(s,true);s.run(`issueDemoDocument(visits[2],${issuance})`);
 assert.equal(s.run("recordDocumentDelivery(visits[2],'DOC-1','Sample agent').ok"),true);
 assert.equal(s.run('visits[2].issuedDocuments[0].deliveries.length'),1);
 s.run("setProcessRecord(visits[2],'cruising',{applicability:'Required',status:'Cancelled',actor:'Officer',note:'Cancelled',reference:'PERMIT-1'})");
 assert.equal(s.run("recordDocumentDelivery(visits[2],'DOC-1','Sample agent').ok"),false);
});

test('new request revision cannot reuse the earlier assessment and keeps escaped party text',()=>{
 const s=preparedSession();assess(s,true);s.run(`issueDemoDocument(visits[2],${issuance})`);
 s.run("saveDocumentDraft(visits[2],'cruising',{...visits[2].documentRequests[0].data,applicant:'<img src=x onerror=alert(1)>'});submitDocumentRequest(visits[2],'cruising')");
 assert.equal(s.run('documentState(visits[2],visits[2].issuedDocuments[0])'),'Review needed');
 assert.equal(s.run(`issueDemoDocument(visits[2],{...${issuance},requestId:'REQ-2',reference:'NEW-2'}).ok`),false);
 const html=s.route('#document/3/REQ-2');
 assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
 assert.ok(!html.includes('<img src=x'));
 s.run('resetDemo()');
 assert.equal(s.run('visits[2].issuedDocuments.length'),0);
 assert.equal(s.run('visits[2].documentRequests.length'),0);
});


test('team desk rejects another department outcome without mutating records',()=>{
 const s=session();assert.equal(s.run('typeof recordTeamOutcome'),'function');
 const before=s.run('JSON.stringify(visits[0].decisions)');
 assert.equal(s.run("recordTeamOutcome(visits[0],'customs','immigration-in',{status:'Recorded',actor:'Officer',note:'Checked',reference:'I-1',applicability:'Required'}).ok"),false);
 assert.equal(s.run('JSON.stringify(visits[0].decisions)'),before);
 assert.equal(s.run("recordTeamOutcome(visits[0],'customs','customs-in',{status:'Recorded',actor:'Officer',note:'Checked',reference:'C-1',applicability:'Required'}).ok"),true);
});
test('passport review is private and expires on submission changes',()=>{
 const s=session();assert.equal(s.run('typeof recordPersonReview'),'function');
 assert.equal(s.run("recordPersonReview(visits[0],0,{status:'Checked',actor:'Officer',note:'Sample passport reconciled'}).ok"),true);
 assert.equal(s.run("currentPersonReview(visits[0],0).status"),'Checked');
 assert.equal(s.run("visits[0].decisions.find(d=>d.key==='immigration-in').status"),'Pending');
 s.run("visits[0].people[0].passport='CHANGED'");
 assert.equal(s.run('currentPersonReview(visits[0],0)'),null);
 s.run('visits[0].version++');assert.equal(s.run('currentPersonReview(visits[0],0)'),null);
 const html=s.route('#verify/HBR-DEMO-1001');assert.doesNotMatch(html,/Sample passport reconciled|CHANGED|Elena Morgan/);
});
test('e-pay success links evidence once and leaves authority decisions untouched',()=>{
 const s=session();assert.equal(s.run('typeof simulateGovernmentPayment'),'function');
 s.run("var gv=visits.find(v=>v.id==='gov-demo');var bill=gv.assessments[0];var beforeDecision=JSON.stringify(gv.decisions)");
 assert.equal(s.run("simulateGovernmentPayment(gv,bill.id,'Succeeded').ok"),true);
 assert.equal(s.run('gv.payments.length'),1);assert.equal(s.run('gv.payments[0].verified'),false);
 assert.equal(s.run('JSON.stringify(gv.decisions)'),s.run('beforeDecision'));
 assert.equal(s.run("simulateGovernmentPayment(gv,bill.id,'Succeeded').ok"),false);
 assert.equal(s.run('gv.payments.length'),1);
 assert.equal(s.run('gv.issuedDocuments.length'),0);
});
test('declined and cancelled payments allow retry without creating receipts',()=>{
 const s=session();assert.equal(s.run('typeof simulateGovernmentPayment'),'function');
 s.run("var gv=visits.find(v=>v.id==='gov-demo');var bill=gv.assessments[0]");
 for(const result of ['Declined','Cancelled'])assert.equal(s.run(`simulateGovernmentPayment(gv,bill.id,'${result}').ok`),true);
 assert.equal(s.run('gv.payments.length'),0);
 assert.equal(s.run("simulateGovernmentPayment(gv,bill.id,'Succeeded').ok"),true);
 assert.equal(s.run('gv.epayTransactions.length'),3);
});
test('e-pay rejects stale requests and public verification omits transactions and passports',()=>{
 const s=session();assert.equal(s.run('typeof simulateGovernmentPayment'),'function');
 s.run("var gv=visits.find(v=>v.id==='gov-demo');gv.version++");
 assert.equal(s.run("simulateGovernmentPayment(gv,gv.assessments[0].id,'Succeeded').ok"),false);
 const html=s.route('#verify/HBR-DEMO-GOV');assert.doesNotMatch(html,/DEMO-NS-P001|DEMO-ASSESS-401|Taylor Harbour/);
});
test('government routes show populated records and escape private values',()=>{
 const s=session();assert.equal(s.run('typeof governmentDesk'),'function');
 for(const route of ['#customs','#customs/gov-demo','#immigration','#immigration/gov-demo','#epay','#epay/gov-demo/ASSESS-1'])assert.ok(s.route(route).length>400,route);
 s.run("visits.find(v=>v.id==='gov-demo').people[0].passport='<img src=x onerror=alert(1)>'");
 const html=s.route('#immigration/gov-demo');assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img src=x/);
});

test('team queue recognises arrival review independently of pending departure',()=>{
 const s=session();assert.equal(s.run("teamState(visits[2],'customs')"),'Arrival reviewed');
 assert.equal(s.run("teamState(visits[2],'immigration')"),'Arrival reviewed');
});
test('payment view reflects later authority verification',()=>{
 const s=session();s.run("var gv=visits.find(v=>v.id==='gov-demo');simulateGovernmentPayment(gv,'ASSESS-1','Succeeded');verifyLinkedReceipt(gv,gv.payments[0].id,'Demo officer','Matched demo receipt')");
 const html=s.route('#epay/gov-demo/ASSESS-1');assert.match(html,/Receipt verified in demo/);assert.doesNotMatch(html,/Authority verification is still pending/);
 assert.match(s.run('paymentReceiptHTML(gv,gv.epayTransactions[0])'),/Receipt verified in demo/);
});
test('e-pay pays only the remaining cents after linked evidence',()=>{
 const s=session();s.run("var gv=visits.find(v=>v.id==='gov-demo');addLinkedReceipt(gv,{assessmentId:'ASSESS-1',receipt:'PARTIAL',amount:'24.95',currency:'XCD',date:'2026-10-16'})");
 assert.equal(s.run("simulateGovernmentPayment(gv,'ASSESS-1','Succeeded').transaction.amount"),200.05);
 assert.equal(s.run('gv.payments.length'),2);
});

test('e-pay receipt must be verified before cruising issuance can pass',()=>{
 const s=session();s.run("var gv=visits.find(v=>v.id==='gov-demo');simulateGovernmentPayment(gv,'ASSESS-1','Succeeded');var issue={requestId:'REQ-1',reference:'DEMO-ISSUE-401',actor:'Officer',note:'Reviewed fictional request',issueDate:'2027-01-18',issuePlace:'Road Bay',from:'2027-01-18',until:'2027-01-24',conditions:'Fictional example'}");
 assert.equal(s.run('issueDemoDocument(gv,issue).ok'),false);
 s.run("verifyLinkedReceipt(gv,gv.payments[0].id,'Officer','Matched demo receipt')");
 assert.equal(s.run('issueDemoDocument(gv,issue).ok'),true);
 assert.equal(s.run('gv.issuedDocuments[0].receipts[0].verified'),true);
 assert.equal(s.run("gv.decisions.find(d=>d.key==='immigration-in').status"),'Pending');
});
test('passport observations flag expiry during travel without inventing admission status',()=>{
 const s=session();s.run("var gv=visits.find(v=>v.id==='gov-demo')");
 assert.match(s.run('passportObservations(gv.people[2],gv).join()'),/Expires during planned visit/);
 assert.equal(s.run('passportObservations(gv.people[0],gv).length'),0);
 assert.equal(s.run("gv.decisions.find(d=>d.key==='immigration-in').status"),'Pending');
});

test('newly submitted broker visit opens Customs before any document pack exists',()=>{
 const s=session();s.run("var fresh=saveApplicationDraft(null,{...clone(visits[0]),name:'Fresh yacht'});submitDraft(fresh)");
 assert.match(s.route('#customs/'+s.run('fresh.id')),/Fresh yacht/);
});
test('superseded receipt is labelled and cannot offer verification in the Customs desk',()=>{
 const s=session();s.run("var gv=visits.find(v=>v.id==='gov-demo');simulateGovernmentPayment(gv,'ASSESS-1','Succeeded');gv.version++");
 const html=s.route('#customs/gov-demo');assert.match(html,/Superseded receipt/);assert.doesNotMatch(html,/data-verify-receipt=/);
});

test('Sea Glass arrival record is backed by a reviewed, landed manifest',()=>{
 const s=session();
 assert.equal(s.run('visits[2].people.length'),3);
 assert.equal(s.run("visits[2].people.every((p,i)=>currentLanding(visits[2],i)?.status==='Landed')"),true);
 assert.match(s.route('#immigration/3'),/3 of 3/);
});
test('landing outcomes are per person, need a checked identity and a permitted-until date',()=>{
 const s=session();s.run("var gv=visits.find(v=>v.id==='gov-demo')");
 assert.equal(s.run("currentLanding(gv,0).until"),'2027-01-24');
 assert.equal(s.run("recordLanding(gv,1,{status:'Landed',until:'2027-01-24',actor:'Officer'}).ok"),false);
 s.run("recordPersonReview(gv,1,{status:'Checked',actor:'Officer',note:'Matched'})");
 assert.equal(s.run("recordLanding(gv,1,{status:'Landed',until:'',actor:'Officer'}).ok"),false);
 assert.equal(s.run("recordLanding(gv,1,{status:'Landed',until:'2027-01-01',actor:'Officer'}).ok"),false);
 assert.equal(s.run("recordLanding(gv,1,{status:'Landed',until:'2027-01-24',actor:'Officer'}).ok"),true);
 assert.equal(s.run("recordLanding(gv,2,{status:'Refused entry',actor:'Officer',note:''}).ok"),false);
 assert.equal(s.run("recordLanding(gv,2,{status:'Refused entry',actor:'Officer',note:'Fictional reason'}).ok"),true);
 assert.equal(s.run("currentLanding(gv,2).until"),'');
 assert.equal(s.run("gv.decisions.find(d=>d.key==='immigration-in').status"),'Pending');
});
test('landing beyond passport expiry is flagged and amendments reset landings',()=>{
 const s=session();s.run("var gv=visits.find(v=>v.id==='gov-demo');recordPersonReview(gv,2,{status:'Checked',actor:'Officer',note:'Matched'});recordLanding(gv,2,{status:'Landed',until:'2027-01-24',actor:'Officer'})");
 assert.match(s.run('landingObservations(gv.people[2],currentLanding(gv,2)).join()'),/past passport expiry/);
 s.run('gv.version++');
 assert.equal(s.run('currentLanding(gv,0)'),null);
});
test('Immigration desk uses Immigration wording and keeps landings off public verification',()=>{
 const s=session();const html=s.route('#immigration/3');
 assert.match(html,/Record vessel arrival or departure outcome/);
 assert.match(html,/>Cleared</);assert.match(html,/Refused entry/);
 assert.doesNotMatch(html,/Simulate a team decision/);
 assert.match(s.route('#customs/3'),/Simulate a team decision/);
 assert.doesNotMatch(s.route('#verify/HBR-DEMO-1003'),/DEMO-LAND|Permitted to stay/);
});

test('demo roles own their routes; home and verification stay open to all',()=>{
 const s=session();
 assert.equal(s.run("roleAllows('immigration','immigration/gov-demo')"),true);
 assert.equal(s.run("roleAllows('immigration','customs/gov-demo')"),false);
 assert.equal(s.run("roleAllows('broker','epay/gov-demo')"),true);
 assert.equal(s.run("roleAllows('customs','epay')"),false);
 assert.equal(s.run("roleAllows('customs','document/3/REQ-1')"),true);
 for(const role of ['broker','customs','immigration'])for(const route of ['home','verify/HBR-DEMO-1003','reset'])assert.equal(s.run(`roleAllows('${role}','${route}')`),true);
});
test('a deep link adopts its role until one is chosen, then other workspaces are gated',()=>{
 const s=session();
 assert.match(s.route('#immigration/gov-demo'),/North Star/);
 assert.equal(s.run('currentRole'),'immigration');
 s.run("currentRole='broker';roleChosen=true");
 const html=s.route('#immigration/gov-demo');
 assert.match(html,/belongs to the Immigration officer workspace/);
 assert.doesNotMatch(html,/DEMO-NS-P001/);
 assert.match(s.route('#dashboard'),/Your yacht applications/);
});
test('officer desks show no cross-team tabs',()=>{
 const s=session();s.run("currentRole='immigration';roleChosen=true");
 assert.doesNotMatch(s.route('#immigration'),/Customs desk/);
});

const specimen="{surname:'Harrington',givenNames:'Olivia Rose',country:'GBR',nationality:'GBR',number:'533190274',dob:'1988-02-11',sex:'F',expiry:'2032-02-10'}";
test('MRZ check digits follow ICAO 9303',()=>{
 const s=session();
 // ICAO 9303 Part 3 worked example: document number L898902C3 has check digit 6.
 assert.equal(s.run("mrzCheck('L898902C3')"),'6');
 assert.equal(s.run("mrzCheck('740812')"),'2');
});
test('a passport MRZ is parsed into manifest fields and verified',()=>{
 const s=session();s.run(`var lines=buildMrz(${specimen}),p=parseMrz(lines[0],lines[1])`);
 assert.equal(s.run('p.verified'),true);
 assert.equal(s.run('p.name'),'Olivia Rose Harrington');
 assert.equal(s.run('p.sex'),'Female');
 assert.equal(s.run('p.nationality'),'United Kingdom');
 assert.equal(s.run('p.passport'),'533190274');
 assert.equal(s.run('p.dob'),'1988-02-11');
 assert.equal(s.run('p.passportExpiry'),'2032-02-10');
 assert.equal(s.run("parseMrz(...buildMrz({surname:'Becker',givenNames:'Hanna',country:'D<<',nationality:'D<<',number:'C01X8R4K7',dob:'2015-03-19',sex:'F',expiry:'2028-03-18'})).nationality"),'Germany');
});
test('MRZs are found in noisy OCR text and common misreads are corrected or flagged',()=>{
 const s=session();s.run(`var lines=buildMrz(${specimen})`);
 // Surrounding text, spaces inside lines and a letter O read for a zero in the date of birth.
 const found=s.run("findMrzs('PASSPORT SPECIMEN\\nSURNAME HARRINGTON\\n'+lines[0].replace('<<','< <')+'\\n'+lines[1].replace('880211','88O211')+'\\n')");
 assert.equal(found.length,1);assert.equal(found[0].verified,true);assert.equal(found[0].dob,'1988-02-11');
 // A misread passport number is flagged, not guessed: its single check digit cannot identify the error.
 const misread=s.run("findMrzs(lines[0]+'\\n'+lines[1].replace('533190274','5331902T4'))[0]");
 assert.equal(misread.passport,'5331902T4');assert.equal(misread.checks.passport,false);assert.equal(misread.verified,false);
 // A wrong digit cannot be guessed: the birth date is flagged rather than silently accepted.
 const smudged=s.run("findMrzs(lines[0]+'\\n'+lines[1].replace('880211','880811'))[0]");
 assert.equal(smudged.verified,false);assert.equal(smudged.checks.dob,false);assert.equal(smudged.checks.passport,true);
 // One character dropped by OCR in the filler is tolerated.
 assert.equal(s.run("findMrzs(lines[0]+'\\n'+lines[1].replace('<<<<<<<<<<<<<<','<<<<<<<<<<<<<'))[0].verified"),true);
 // Filler after the given names misread as letters does not leak into the name.
 assert.equal(s.run("findMrzs(lines[0].replace(/<{6}$/,'<L<K<<')+'\\n'+lines[1])[0].name"),'Olivia Rose Harrington');
 assert.equal(s.run("findMrzs('no passport here\\nP<<<<<<\\n').length"),0);
});
test('intake offers passport scan import and keeps the sex field on the manifest',()=>{
 const s=session();
 assert.match(s.route('#intake'),/Import from passport scans/);
 s.run("visits[0].people[0].sex='Female'");
 assert.match(s.run("personIdentity(visits[0].people[0])"),/Female/);
});
test('a person is verified only when two independent reads agree',()=>{
 const s=session();s.run(`var lines=buildMrz(${specimen}),good=findMrzs(lines.join('\\n'))`);
 assert.equal(s.run('confirmReads(good,good)[0].verified'),true);
 // A misread that still passes the check digit (1 in 10 for multi-character errors) is caught by disagreement.
 s.run("var lucky=[{...good[0],passport:'O1X8R4AK7'}]");
 const r=s.run('confirmReads(lucky,good)[0]');assert.equal(r.verified,false);assert.deepEqual([...r.disagree],['passport']);
 // A name has no check digit; disagreement flags it.
 assert.deepEqual([...s.run("confirmReads([{...good[0],name:'Olivia Rose Harringtom'}],good)[0].disagree")],['name']);
 // Found by only one read: never verified.
 assert.equal(s.run('confirmReads(good,[])[0].verified'),false);
});
