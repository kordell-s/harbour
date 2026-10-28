// Fictional, in-memory government workspaces. UI role selection is not authentication.
const governmentTeams = {
 customs: {name:'Customs',description:'Vessel clearances, cruising requests and payment reconciliation.'},
 immigration: {name:'Immigration',description:'People, travel documents and separate arrival and departure reviews.'}
};
const govAmount=(amount,currency)=>Number(amount).toFixed(2)+' '+currency;
const govError=errors=>({ok:false,errors});
const govToday=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Anguilla'}).format(new Date());
function teamProcesses(v,team){return v.decisions.filter(d=>d.department===governmentTeams[team]?.name)}
function recordTeamOutcome(v,team,key,data){
 if(!teamProcesses(v,team).some(d=>d.key===key))return govError(['This process belongs to a different team']);
 return setProcessRecord(v,key,data);
}
function personIdentity(p){return JSON.stringify([p.name,p.role,p.nationality,p.dob,p.passport,p.passportCountry,p.passportIssued,p.passportExpiry])}
function currentPersonReview(v,index){
 const p=v.people[index];if(!p)return null;
 return (v.personReviews||[]).filter(r=>r.index===index&&r.version===v.version&&r.identity===personIdentity(p)).at(-1)||null;
}
function recordPersonReview(v,index,data){
 if(!v.submitted||!Number.isInteger(index)||!v.people[index])return govError(['Choose a person on the submitted manifest']);
 if(!['Pending','Checked','Clarification required'].includes(data.status)||!data.actor?.trim()||!data.note?.trim()||data.note.length>2000||data.actor.length>120)return govError(['Enter a review state, officer and a private note (up to 2,000 characters)']);
 const r={index,version:v.version,identity:personIdentity(v.people[index]),status:data.status,actor:data.actor.trim(),note:data.note.trim(),at:new Date().toISOString()};
 (v.personReviews??=[]).push(r);
 // Identity and review notes stay out of the shared/public activity summary.
 addActivity(v,r.actor,'Private manifest review updated',`Person ${index+1} · ${data.status}`);
 return {ok:true};
}
// Per-person landing outcomes. Like identity reviews, they bind to the submitted version and captured identity.
const landingStatuses=['Pending','Landed','Further information requested','Refused entry'];
function currentLanding(v,index){
 const p=v.people[index];if(!p)return null;
 return (v.landings||[]).filter(r=>r.index===index&&r.version===v.version&&r.identity===personIdentity(p)).at(-1)||null;
}
function recordLanding(v,index,data){
 if(!v.submitted||!Number.isInteger(index)||!v.people[index])return govError(['Choose a person on the submitted manifest']);
 const errors=[],until=data.until||'';
 if(!landingStatuses.includes(data.status))errors.push('Choose a landing outcome');
 if(!data.actor?.trim()||data.actor.length>120)errors.push('Enter the landing officer');
 if((data.note||'').length>2000||(data.reference||'').length>120)errors.push('Keep the reference under 120 and the note under 2,000 characters');
 if(data.status==='Landed'){
  if(currentPersonReview(v,index)?.status!=='Checked')errors.push('Confirm identity before recording a landing');
  if(!validDate(until))errors.push('Enter a permitted-to-stay-until date');
  else if(v.arrival&&until<v.arrival)errors.push('Permitted-to-stay-until date must be on or after arrival');
 }
 if(['Further information requested','Refused entry'].includes(data.status)&&!data.note?.trim())errors.push('Record a private reason');
 if(errors.length)return govError(errors);
 const r={index,version:v.version,identity:personIdentity(v.people[index]),status:data.status,until:data.status==='Landed'?until:'',reference:(data.reference||'').trim(),actor:data.actor.trim(),note:(data.note||'').trim(),at:new Date().toISOString()};
 (v.landings??=[]).push(r);
 addActivity(v,r.actor,'Landing outcome updated',`Person ${index+1} · ${data.status}`);
 return {ok:true};
}
function landingObservations(p,r){
 return r?.status==='Landed'&&validDate(p.passportExpiry)&&r.until>p.passportExpiry?['Permitted stay extends past passport expiry']:[];
}
function passportObservations(p,v){
 const notes=[];
 if(!p.passport)notes.push('Passport number missing');
 if(!p.passportCountry)notes.push('Issuing country missing');
 if(!validDate(p.passportExpiry))notes.push('Expiry date not supplied');
 else if(v.arrival&&p.passportExpiry<v.arrival)notes.push('Expires before planned arrival');
 else if(v.departure&&p.passportExpiry<v.departure)notes.push('Expires during planned visit');
 if(p.passportIssued&&!validDate(p.passportIssued))notes.push('Check passport issue date');
 if(validDate(p.passportIssued)&&v.arrival&&p.passportIssued>v.arrival)notes.push('Issue date is after arrival');
 if(validDate(p.passportIssued)&&validDate(p.passportExpiry)&&p.passportExpiry<p.passportIssued)notes.push('Expiry precedes issue date');
 return notes;
}
function currentFeeAssessments(v){
 return (v.assessments||[]).filter(a=>a.kind==='Fee'&&requestCurrent(v,v.documentRequests.find(r=>r.id===a.requestId)));
}
function assessmentBalance(v,a){
 // Linked evidence reserves the amount while awaiting verification, preventing duplicate demo payment.
 const cents=v.payments.filter(p=>p.assessmentId===a.id).reduce((sum,p)=>sum+Math.round(p.amount*100),0);
 return Math.max(0,Math.round(a.amount*100)-cents)/100;
}
function simulateGovernmentPayment(v,assessmentId,outcome){
 const a=currentFeeAssessments(v).find(a=>a.id===assessmentId);
 if(!a)return govError(['This assessment is no longer current. Return to the latest request.']);
 if(!['Succeeded','Declined','Cancelled'].includes(outcome))return govError(['Choose a simulation outcome']);
 const amount=assessmentBalance(v,a);if(amount<=0)return govError(['Payment evidence already covers this assessment. Await authority verification.']);
 v.epayTransactions??=[];
 const id='DEMO-EPAY-'+v.id+'-'+(v.epayTransactions.length+1);
 const receipt=outcome==='Succeeded'?'DEMO-RCP-'+v.id+'-'+(v.epayTransactions.length+1):'';
 if(outcome==='Succeeded'){
  const linked=addLinkedReceipt(v,{assessmentId:a.id,receipt,amount:amount.toFixed(2),currency:a.currency,date:govToday()});
  if(!linked.ok)return linked;
  const p=v.payments.at(-1);p.source='Government e-pay simulation · Awaiting authority verification';p.transactionId=id;
 }
 const transaction={id,assessmentId:a.id,assessmentReference:a.reference,requestId:a.requestId,amount,currency:a.currency,outcome,receipt,at:new Date().toISOString(),payer:v.broker};
 v.epayTransactions.push(transaction);
 addActivity(v,'Demo e-pay',`Payment simulation: ${outcome}`,`${id} · ${a.reference}`);
 return {ok:true,transaction};
}
function governmentNav(active){if(['customs','immigration','epay'].filter(t=>roleAllows(currentRole,t)).length<2)return '';return `<nav class="desk-nav" aria-label="Government demo workspaces"><a href="#customs" ${active==='customs'?'aria-current="page"':''}><span class="desk-label-full">Customs desk</span><span class="desk-label-compact">Customs</span></a><a href="#immigration" ${active==='immigration'?'aria-current="page"':''}><span class="desk-label-full">Immigration desk</span><span class="desk-label-compact">Immigration</span></a><a href="#epay" ${active==='epay'?'aria-current="page"':''}><span class="desk-label-full">Government e-pay</span><span class="desk-label-compact">E-pay demo</span><span class="fine">Demo</span></a></nav>`}
function govNotice(){return '<div class="demo-banner gov-demo-notice"><strong>Fictional demo · Session-only records</strong><span>Role simulation · No authenticated officer access</span></div>'}
function govFacts(entries){return `<dl class="gov-facts">${entries.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value||'Not supplied')}</dd></div>`).join('')}</dl>`}
function govSection(title,body,extra=''){return `<section class="panel gov-section"><div class="gov-section-head"><h2>${title}</h2>${extra}</div>${body}</section>`}
function govState(d){return d.needsReview?'Review needed':d.applicability==='Unconfirmed'?'Applicability unconfirmed':d.applicability==='Not applicable'?'Not applicable':d.status}
function teamState(v,team){const ds=teamProcesses(v,team);return ds.some(d=>d.needsReview)?'Review needed':ds.some(d=>d.status==='Changes requested')?'Changes requested':ds.some(d=>d.status==='Rejected'||d.status==='Cancelled')?'Review needed':ds.filter(d=>d.key.endsWith('-in')).every(currentRecord)?'Arrival reviewed':'Awaiting review'}
function governmentDesk(team,id){
 if(!governmentTeams[team])return;
 const meta=governmentTeams[team];
 const submitted=visits.filter(v=>v.submitted);submitted.forEach(documentStore);
 const v=id?submitted.find(v=>v.id===id):null;
 if(id&&!v){app.innerHTML=`<section class="workspace government">${governmentNav(team)}${govSection('Submitted visit not found','<p>Drafts remain with the broker until submitted.</p><a href="#'+team+'">Back to team queue</a>')}</section>`;return}
 const needs=submitted.filter(x=>teamState(x,team)!=='Arrival reviewed').length;
 app.innerHTML=`<section class="workspace government ${v?'gov-detail':'gov-overview'}">${govNotice()}${governmentNav(team)}<div class="pagehead"><div><span class="eyebrow">Department workspace · Anguilla</span><h1>${meta.name} desk</h1><p class="muted">${meta.description}</p></div><span class="desk-role">Viewing as ${meta.name} · Demo</span></div>${!v?`<div class="gov-metrics"><div><strong>${submitted.length}</strong><span>Submitted visits</span></div><div><strong>${needs}</strong><span>Need team review</span></div><div><strong>${submitted.reduce((n,x)=>n+x.people.length,0)}</strong><span>People on manifests</span></div></div><div class="desk-toolbar"><div><label for="desk-search">Find a submitted visit</label><input id="desk-search" type="search" placeholder="Vessel, reference or broker"></div><div><label for="desk-filter">Review state</label><select id="desk-filter"><option>All visits</option><option>Needs review</option><option>Arrival reviewed</option></select></div></div><section class="panel desk-queue"><div class="gov-section-head"><h2>Visit queue</h2><span class="fine">Submitted broker records</span></div><div id="desk-results">${governmentQueueRows(submitted,team)}</div></section><p class="fine">Open North Star for the populated government and e-pay example. Planned visits are in January 2027.</p>`:`<a class="back-link" href="#${team}">Back to ${meta.name} queue</a><div class="visit-file-head"><div><span class="eyebrow">${esc(v.reference)} · Submitted version ${v.version}</span><h2>${esc(v.name)}</h2><p>${esc(v.flag)} · ${esc(v.registration)} · ${esc(v.arrival)} to ${esc(v.departure)}</p></div><span class="badge ${teamState(v,team)==='Arrival reviewed'?'ready':''}">${teamState(v,team)}</span></div>${v.draft?'<div class="review-note">A broker amendment is saved but has not been submitted. This file shows the submitted version.</div>':''}<div class="gov-file-layout"><div class="gov-main">${team==='customs'?customsInformation(v):immigrationInformation(v)}${govSection('Team activity',governmentActivity(v,team))}</div><aside class="gov-aside">${teamDecisionPanel(v,team)}${connectedVisit(v,team)}</aside></div>`}</section>`;
 if(!v){
  const search=document.querySelector('#desk-search'),filter=document.querySelector('#desk-filter');
  const refresh=()=>{const q=search.value.toLowerCase();const rows=submitted.filter(x=>(x.name+' '+x.reference+' '+x.broker).toLowerCase().includes(q)&&(filter.value==='All visits'||(filter.value==='Arrival reviewed'?teamState(x,team)==='Arrival reviewed':teamState(x,team)!=='Arrival reviewed')));document.querySelector('#desk-results').innerHTML=governmentQueueRows(rows,team)};
  search.oninput=refresh;filter.onchange=refresh;
 }else{
  bindTeamDecision(v,team);
  if(team==='immigration')document.querySelectorAll('[data-person-review]').forEach(form=>{form.onsubmit=e=>{e.preventDefault();const result=recordPersonReview(v,Number(form.dataset.personReview),Object.fromEntries(new FormData(form)));if(result.ok){governmentDesk(team,id);toast('Private manifest review saved')}else form.querySelector('[role="alert"]').textContent=result.errors.join('. ')}});
  if(team==='immigration')document.querySelectorAll('[data-person-landing]').forEach(form=>{form.onsubmit=e=>{e.preventDefault();const result=recordLanding(v,Number(form.dataset.personLanding),Object.fromEntries(new FormData(form)));if(result.ok){governmentDesk(team,id);toast('Landing outcome recorded for this person')}else form.querySelector('[role="alert"]').textContent=result.errors.join('. ')}});
  if(team==='customs')document.querySelectorAll('[data-verify-receipt]').forEach(form=>{form.onsubmit=e=>{e.preventDefault();const data=Object.fromEntries(new FormData(form));const result=verifyLinkedReceipt(v,form.dataset.verifyReceipt,data.actor,data.note);if(result.ok){governmentDesk(team,id);toast('Receipt verified; issuance remains a separate decision')}else form.querySelector('[role="alert"]').textContent=result.errors.join('. ')}});
 }
}
function governmentQueueRows(rows,team){return rows.length?rows.map(v=>`<article class="desk-queue-row"><div><span class="fine">${esc(v.reference)} · Version ${v.version}</span><h3><a href="#${team}/${v.id}">${esc(v.name)}</a></h3><p>${esc(v.broker)}</p></div><div><span class="fine">Planned arrival</span><strong>${esc(date(v.arrival))}</strong><p>${esc(v.port)}</p></div><div><span class="fine">${team==='customs'?'Vessel / use':'Manifest'}</span><strong>${team==='customs'?esc(v.tonnage+' tons · '+v.vesselUse):v.people.length+' people'}</strong><span class="badge ${teamState(v,team)==='Arrival reviewed'?'ready':''}">${teamState(v,team)}</span></div><a class="button secondary small" href="#${team}/${v.id}">Open file</a></article>`).join(''):'<div class="empty"><h3>No visits match</h3><p>Try a different vessel name or review state.</p></div>'}
function governmentActivity(v,team){
 const rows=v.history.filter(h=>typeof h!=='string'&&(h.process?teamProcesses(v,team).some(d=>d.key===h.process):(/submitted/i.test(h.action)||(team==='immigration'?/manifest review|landing outcome/i:/assessment|receipt|Payment simulation|request submitted/i).test(h.action))));
 return rows.length?`<ol class="timeline">${rows.slice(0,8).map(h=>`<li><strong>${esc(h.action)}</strong><div class="fine">${esc(h.actor)} · Version ${h.version} · ${esc(h.at.slice(0,16).replace('T',' '))} UTC</div>${h.note?`<p>${esc(h.note)}</p>`:''}</li>`).join('')}</ol>`:'<p class="muted">No team activity recorded for this submitted version.</p>';
}
function receiptIsCurrent(v,p){const a=v.assessments.find(a=>a.id===p.assessmentId);return !!a&&!!requestCurrent(v,v.documentRequests.find(r=>r.id===a.requestId))}
function customsInformation(v){
 return govSection('Vessel & representation',govFacts([['Vessel name',v.name],['Flag / country of registration',v.flag],['Registration number',v.registration],['Port of registry',v.registryPort],['Registered tonnage',v.tonnage],['Vessel use',v.vesselUse],['Owner',v.owner],['Broker / agency',v.broker],['Authority to act',v.authorisation],['Agent address',v.agentAddress],['Agent telephone',v.agentPhone],['Captain',v.captain]]))+
 govSection('Voyage & declarations',govFacts([['Arrival location',v.port],['Planned arrival',v.arrival],['Planned departure',v.departure],['Previous port',v.previousPort],['Next destination',v.nextPort],['Expected arrival time',v.eta],['Cargo declared',v.cargo],['Activities / anchorages',v.activities],['External notification reference',v.externalRef],['Manifest headcount',v.people.length+' people']]))+
 govSection('Supporting documents',`<p class="fine">Filename evidence only. File content is not uploaded or verified.</p>${v.files.map(f=>`<div class="evidence-row"><strong>${esc(f)}</strong><span class="badge">Content not stored</span></div>`).join('')||'<p>No supporting filenames supplied.</p>'}`)+
 govSection('Requests & issued copies',`${v.documentRequests.filter(r=>requestCurrent(v,r)).map(r=>`<div class="evidence-row"><div><strong>${docTitle(r.type)}</strong><p class="fine">${esc(r.id)} · Submitted version ${r.visitVersion}</p></div><a href="#document/${v.id}/${r.id}">View request</a></div>`).join('')||'<p>No current document requests submitted.</p>'}<div class="actions"><a class="button secondary small" href="#document-review/${v.id}">Assessment & issuance desk</a></div>${issuedList(v)}`)+
 govSection('Assessments & receipt reconciliation',`<p class="fine">Amounts below are fictional officer-entered examples. E-pay success creates evidence awaiting this separate check.</p>${v.assessments.map(a=>`<div class="assessment-summary"><strong>${esc(a.reference)} · ${esc(govAmount(a.amount,a.currency))}</strong><p>${esc(a.kind)} · ${esc(a.basis)}</p><span class="fine">${requestCurrent(v,v.documentRequests.find(r=>r.id===a.requestId))?'Current request':'Superseded request'} · ${esc(a.requestId)}</span></div>`).join('')||'<p>Awaiting an assessment.</p>'}${v.payments.filter(p=>p.assessmentId).map(p=>`<article class="reconciliation"><div class="decision-line"><strong>${esc(p.receipt)}</strong><span class="badge ${p.verified?'ready':''}">${!receiptIsCurrent(v,p)?'Superseded receipt':p.verified?'Verified in demo':'Awaiting verification'}</span></div><p>${esc(govAmount(p.amount,p.currency))} · ${esc(p.source)}</p>${!receiptIsCurrent(v,p)?'<p class="fine">Retained as history. Submit and assess the current request before linking new evidence.</p>':p.verified?`<p class="fine">${esc(p.verifiedBy)} · ${esc(p.verificationNote)}</p>`:`<details><summary>Verify receipt evidence</summary><form data-verify-receipt="${esc(p.id)}">${field('Verifying officer','verify-'+p.id+'-actor','Demo Customs officer').replace('name="verify-'+p.id+'-actor"','name="actor"')}${field('Verification note','verify-'+p.id+'-note').replace('name="verify-'+p.id+'-note"','name="note"')}<button class="small">Verify in demo</button><p role="alert"></p></form></details>`}</article>`).join('')}<div class="actions"><a href="#epay/${v.id}">Open linked e-pay assessments</a></div>`);
}
function immigrationInformation(v){
 const checked=v.people.filter((p,i)=>currentPersonReview(v,i)?.status==='Checked').length,landed=v.people.filter((p,i)=>currentLanding(v,i)?.status==='Landed').length;
 return govSection('Visit & responsible contacts',govFacts([['Vessel',v.name],['Captain',v.captain],['Captain email',v.email],['Broker / agency',v.broker],['Arrival location',v.port],['Arrival date',v.arrival],['Departure date',v.departure],['Previous port',v.previousPort],['Next destination',v.nextPort],['Submitted manifest',v.people.length+' people']]))+
 govSection('Crew & passenger manifest',`<div class="manifest-summary"><div><strong>${v.people.filter(p=>p.role==='Crew').length}</strong><span>Crew</span></div><div><strong>${v.people.filter(p=>p.role==='Guest').length}</strong><span>Guests</span></div><div><strong>${checked} / ${v.people.length}</strong><span>Identities confirmed</span></div><div><strong>${landed} / ${v.people.length}</strong><span>Landed</span></div></div><p class="fine">Passport details and landing outcomes stay in this private workspace. No passport images are stored.</p>${v.people.length?v.people.map((p,i)=>personReviewCard(v,p,i)).join(''):'<div class="empty"><h3>No manifest supplied</h3><p>Request crew and passenger details from the broker before reviewing the visit.</p></div>'}`);
}
function personReviewCard(v,p,i){
 const r=currentPersonReview(v,i),notes=passportObservations(p,v),prefix='person-'+i;
 return `<article class="manifest-person"><div class="gov-section-head"><div><span class="eyebrow">Person ${String(i+1).padStart(2,'0')} · ${esc(p.role)}</span><h3>${esc(p.name)}</h3></div><span class="badge ${r?.status==='Checked'?'ready':''}">${esc(r?.status||'Pending review')}</span></div>${govFacts([['Nationality',p.nationality],['Date of birth',p.dob],['Passport number',p.passport],['Issuing country',p.passportCountry],['Issue date',p.passportIssued],['Expiry date',p.passportExpiry]])}${notes.length?`<div class="review-note"><strong>Information to check</strong><ul>${notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul></div>`:'<p class="fine">Dates cover the planned visit. Any further validity or entry requirements need officer review.</p>'}${r?`<div class="private-note"><strong>Private review · ${esc(r.actor)}</strong><p>${esc(r.note)}</p><span class="fine">Version ${r.version} · ${esc(r.at.slice(0,16).replace('T',' '))} UTC</span></div>`:''}<details><summary>${r?'Update':'Record'} identity review</summary><form data-person-review="${i}"><label for="${prefix}-status">Review state</label><select id="${prefix}-status" name="status">${['Pending','Checked','Clarification required'].map(x=>`<option ${r?.status===x?'selected':''}>${x}</option>`).join('')}</select><label for="${prefix}-actor">Reviewing officer</label><input id="${prefix}-actor" name="actor" value="Demo Immigration officer" maxlength="120" required><label for="${prefix}-note">Private review note</label><textarea id="${prefix}-note" name="note" rows="3" maxlength="2000" required>${esc(r?.note||'')}</textarea><button class="small">Save identity review</button><p role="alert"></p></form></details>${landingBlock(v,p,i)}</article>`;
}
function landingBlock(v,p,i){
 const r=currentLanding(v,i),notes=landingObservations(p,r),prefix='landing-'+i;
 return `<div class="landing-outcome"><div class="decision-line"><strong>Landing outcome</strong><span class="badge ${r?.status==='Landed'?'ready':''}">${esc(r?.status||'Pending')}</span></div>${r?.status==='Landed'?`<p>Permitted to stay until <strong>${esc(date(r.until))}</strong>${r.reference?` · ${esc(r.reference)}`:''}</p>`:''}${notes.length?`<div class="review-note"><strong>Information to check</strong><ul>${notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul></div>`:''}${r?`<p class="fine">${esc(r.actor)} · ${esc(r.at.slice(0,16).replace('T',' '))} UTC${r.note?' · '+esc(r.note):''}</p>`:''}<details><summary>${r?'Update':'Record'} landing outcome</summary><form data-person-landing="${i}"><label for="${prefix}-status">Outcome</label><select id="${prefix}-status" name="status">${landingStatuses.map(x=>`<option ${(r?.status||'Pending')===x?'selected':''}>${x}</option>`).join('')}</select><label for="${prefix}-until">Permitted to stay until</label><input id="${prefix}-until" name="until" type="date" value="${esc(r?.until||v.departure||'')}"><label for="${prefix}-reference">Landing reference (optional)</label><input id="${prefix}-reference" name="reference" maxlength="120" value="${esc(r?.reference||'')}"><label for="${prefix}-actor">Landing officer</label><input id="${prefix}-actor" name="actor" value="Demo Immigration officer" maxlength="120" required><label for="${prefix}-note">Private note (required if refused or more information is needed)</label><textarea id="${prefix}-note" name="note" rows="2" maxlength="2000">${esc(r?.note||'')}</textarea><button class="small">Save landing outcome</button><p role="alert"></p></form></details></div>`;
}
// Immigration officers see their own vocabulary; stored values stay shared with the rest of the app.
const immigrationTerms={Recorded:'Cleared','Changes requested':'Further information requested',Rejected:'Refused','Applicability unconfirmed':'Requirement to be confirmed','Not applicable':'Not required for this visit',Unconfirmed:'To be confirmed'};
const teamTerm=(team,value)=>team==='immigration'?immigrationTerms[value]||value:value;
const decisionLabels={
 customs:{summary:'Simulate a team decision',applicability:'Applicability',officer:'Officer',reference:'Authority reference',from:'Permit start',until:'Permit expiry',conditions:'Public scope / conditions',note:'Private reason / correction request',button:'Record demo outcome'},
 immigration:{summary:'Record vessel arrival or departure outcome',applicability:'Requirement',officer:'Immigration officer',reference:'Immigration reference',from:'Valid from',until:'Valid until',conditions:'Conditions shown on verification',note:'Private reason / information requested',button:'Record outcome'}
};
// Links to other workspaces appear only when the current demo role can open them.
function connectedVisit(v,team){
 const links=[['visit/'+v.id,'Broker visit record'],[(team==='customs'?'immigration':'customs')+'/'+v.id,(team==='customs'?'Immigration':'Customs')+' view'],['epay/'+v.id,'Government e-pay demo']].filter(([route])=>roleAllows(currentRole,route));
 const note=`<p class="fine">Each team retains its own outcomes.${team==='immigration'?' Landing outcomes are recorded per person; the vessel arrival outcome is separate.':''}</p>`;
 return govSection(links.length?'Connected visit':'About these outcomes',`${links.length?`<p>Use the shared visit reference to follow preparation, reviews and payment evidence.</p><div class="stack-links">${links.map(([route,label])=>`<a href="#${route}">${label}</a>`).join('')}</div>`:''}${note}`);
}
function teamDecisionPanel(v,team){
 const ds=teamProcesses(v,team),L=decisionLabels[team];
 return govSection('Team decision record',`<p class="fine">Independent ${governmentTeams[team].name} outcomes for submitted version ${v.version}. Existing decisions appear below; use the controls for an optional simulation.</p>${ds.map(d=>`<div class="team-outcome"><strong>${esc(d.title)}</strong><span class="badge ${currentRecord(d)?'ready':''}">${esc(teamTerm(team,govState(d)))}</span>${d.reference?`<p class="fine">${esc(d.reference)}</p>`:''}${d.note?`<p>${esc(d.note)}</p>`:''}</div>`).join('')}${team==='immigration'?landingSummary(v):''}<details class="decision-controls"><summary>${L.summary}</summary><form id="team-decision">${selectOptions('Process','team-process',ds.map(d=>[d.key,d.title]))}${selectOptions(L.applicability,'team-applicability',['Required','Unconfirmed','Not applicable'].map(x=>[x,teamTerm(team,x)]))}${selectOptions('Outcome','team-status',['Pending','Recorded','Changes requested','Rejected','Cancelled'].map(x=>[x,teamTerm(team,x)]))}${field(L.officer,'team-actor','Demo '+governmentTeams[team].name+' officer')}${field(L.reference,'team-reference','','text',false)}<div class="form-grid">${field(L.from,'team-from','','date',false)}${field(L.until,'team-until','','date',false)}</div><label for="team-conditions">${L.conditions}</label><textarea id="team-conditions" name="team-conditions" maxlength="1000"></textarea><label for="team-note">${L.note}</label><textarea id="team-note" name="team-note" maxlength="2000" required></textarea><button>${L.button}</button><p id="team-error" role="alert"></p></form></details>`);
}
function landingSummary(v){
 const counts=landingStatuses.map(s=>[s,v.people.filter((p,i)=>(currentLanding(v,i)?.status||'Pending')===s).length]).filter(([,n])=>n);
 return `<div class="team-outcome"><strong>People landed</strong><span class="badge ${v.people.length&&counts.length===1&&counts[0][0]==='Landed'?'ready':''}">${v.people.filter((p,i)=>currentLanding(v,i)?.status==='Landed').length} of ${v.people.length}</span><p class="fine">${counts.map(([s,n])=>n+' '+s.toLowerCase()).join(' · ')||'No one on the manifest'}</p></div>`;
}
function bindTeamDecision(v,team){
 const form=document.querySelector('#team-decision'),picker=document.querySelector('#team-process');
 const load=()=>{const d=teamProcesses(v,team).find(d=>d.key===picker.value)||teamProcesses(v,team)[0];for(const [field,value] of Object.entries({applicability:d.applicability,status:d.status,reference:d.reference,from:d.from,until:d.until,conditions:d.conditions,note:''}))document.querySelector('#team-'+field).value=value||'';};
 picker.onchange=load;load();
 form.onsubmit=e=>{e.preventDefault();const x=Object.fromEntries(new FormData(form));const data=Object.fromEntries(['applicability','status','actor','reference','from','until','conditions','note'].map(k=>[k,x['team-'+k]]));const result=recordTeamOutcome(v,team,picker.value,data);if(result.ok){governmentDesk(team,v.id);toast('Team outcome recorded independently')}else document.querySelector('#team-error').textContent=result.errors.join('. ')};
}
function paymentPortal(visitId,assessmentId){
 const all=visits.filter(v=>v.submitted),v=all.find(v=>v.id===visitId);
 const bills=(v?[v]:all).flatMap(v=>currentFeeAssessments(v).map(a=>({v,a})));
 const selected=v&&bills.find(x=>x.a.id===assessmentId),last=selected?(v.epayTransactions||[]).filter(t=>t.assessmentId===assessmentId).at(-1):null;
 app.innerHTML=`<section class="workspace government epay">${governmentNav('epay')}<div class="epay-notice"><strong>Demo payment portal</strong><span>Simulated government e-pay · No money is collected · No card details required</span></div><div class="pagehead"><div><span class="eyebrow">Connected payments · Anguilla</span><h1>Government e-pay</h1><p class="muted">One assessment. A traceable payment. A linked receipt.</p></div><span class="desk-role">Harbour demonstration</span></div>${selected?`<a class="back-link" href="#epay/${v.id}">Back to assessments</a><div class="epay-layout"><section class="panel"><span class="eyebrow">01 / Review assessment</span><h2 class="epay-title">${docTitle(v.documentRequests.find(r=>r.id===selected.a.requestId).type)}</h2>${govFacts([['Department','Customs'],['Assessment reference',selected.a.reference],['Visit reference',v.reference],['Vessel',v.name]])}<details class="assessment-details"><summary>Assessment details</summary>${govFacts([['Request',selected.a.requestId],['Assessed date',selected.a.date],['Payer / broker',v.broker],['Assessment basis',selected.a.basis]])}</details><div class="payment-total"><span>Assessment total</span><strong>${esc(govAmount(selected.a.amount,selected.a.currency))}</strong></div><div class="payment-total"><span>Remaining to pay</span><strong>${esc(govAmount(assessmentBalance(v,selected.a),selected.a.currency))}</strong></div><p class="fine">Linked receipt evidence reserves its amount pending authority verification. This fictional amount is not a current government tariff.</p></section><div>${last?paymentResult(v,last):''}${assessmentBalance(v,selected.a)>0?`<form id="epay-form" class="panel"><span class="eyebrow">02 / Simulate payment</span><h2 class="epay-title">Try the payment experience</h2><div class="sample-payment-method"><span>Sample payment method</span><strong>Demo card ···· 4242</strong><p class="fine">Preconfigured fictional method. Do not enter real payment information.</p></div><label for="epay-outcome">Demo result</label><select id="epay-outcome" name="outcome"><option value="Succeeded">Successful payment</option><option value="Declined">Payment declined</option><option value="Cancelled">Payment cancelled</option></select><p class="fine">The amount and currency come from the assessment. A successful simulation links a receipt for authority verification.</p><button class="epay-submit">Simulate payment · ${esc(govAmount(assessmentBalance(v,selected.a),selected.a.currency))}</button><p id="epay-error" role="alert"></p></form>`:!last?govSection('Payment evidence linked','<p>The linked evidence covers this assessment. Customs must verify it before the document payment gate is met.</p>'):''}${govSection('What happens next','<ol class="payment-steps"><li>Payment evidence is linked to this assessment.</li><li>Customs verifies the receipt separately.</li><li>The authority reviews and records any issuance.</li></ol><a href="#customs/'+v.id+'">View Customs reconciliation</a>')}</div></div>`:`${visitId&&!v?'<section class="panel"><h2>Visit not available</h2><p>Choose a submitted visit with a current assessment.</p></section>':''}${assessmentId&&!selected?'<p class="review-note">That assessment is not available or has been superseded. Select a current assessment below.</p>':''}<section class="panel"><div class="gov-section-head"><h2>${v?esc(v.name)+' · ':''}Current assessments</h2><span class="fine">Officer-entered demo amounts</span></div>${bills.length?bills.map(({v,a})=>`<article class="bill-row"><div><span class="eyebrow">Customs · Cruising permit</span><h3>${esc(v.name)}</h3><p>${esc(a.reference)} · ${esc(v.reference)}</p><span class="fine">${esc(a.basis)}</span></div><div><strong class="bill-amount">${esc(govAmount(a.amount,a.currency))}</strong><span class="badge ${assessmentBalance(v,a)<=0?'ready':''}">${assessmentBalance(v,a)>0?'Payment due':v.payments.filter(p=>p.assessmentId===a.id).every(p=>p.verified)?'Verified in demo':'Evidence awaiting verification'}</span><a class="button secondary small" href="#epay/${v.id}/${a.id}">${assessmentBalance(v,a)>0?'Review & pay':'View payment'}</a></div></article>`).join(''):'<div class="empty"><h3>No current fee assessments</h3><p>A Customs assessment appears here after a current cruising request is assessed. Exemptions have no payment due.</p><a href="#epay/gov-demo/ASSESS-1">Open the populated payment example</a></div>'}</section>${paymentHistory(v?[v]:all)}`}<p class="fine epay-footnote">Harbour prototype · No government affiliation or live e-pay integration. Payment does not grant clearance, admission or a permit. Session data resets on reload.</p></section>`;
 if(selected&&assessmentBalance(v,selected.a)>0)document.querySelector('#epay-form').onsubmit=e=>{e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;const result=simulateGovernmentPayment(v,selected.a.id,document.querySelector('#epay-outcome').value);if(result.ok){paymentPortal(v.id,selected.a.id);document.querySelector('#payment-result')?.focus?.();toast('Demo payment '+result.transaction.outcome.toLowerCase())}else{button.disabled=false;document.querySelector('#epay-error').textContent=result.errors.join('. ')}};
 if(last?.receipt){const button=document.querySelector('#download-epay-receipt');if(button)button.onclick=()=>downloadPaymentReceipt(v,last)};
}
function paymentResult(v,t){return `<section id="payment-result" tabindex="-1" class="panel payment-result ${t.outcome==='Succeeded'?'payment-success':''}" role="status"><span class="eyebrow">${t.outcome==='Succeeded'?'Payment simulation complete':'Payment simulation'}</span><h2>${t.outcome==='Succeeded'?'Payment recorded':t.outcome==='Declined'?'Payment declined':'Payment cancelled'}</h2><p>${t.outcome==='Succeeded'?(v.payments.find(p=>p.receipt===t.receipt)?.verified?'Receipt verified in demo. Document issuance remains a separate authority decision.':'Your demo receipt is linked. Authority verification is still pending.'):'No receipt was created. You can try again using the simulation below.'}</p>${govFacts([['Transaction',t.id],['Result',t.outcome],['Amount',govAmount(t.amount,t.currency)],...(t.receipt?[['Receipt reference',t.receipt]]:[])])}${t.receipt?'<button id="download-epay-receipt" class="secondary small">Download demo receipt</button>':''}</section>`}
function paymentHistory(vs){const rows=vs.flatMap(v=>(v.epayTransactions||[]).map(t=>({v,t}))).sort((a,b)=>b.t.at.localeCompare(a.t.at));return govSection('Transaction history',rows.length?rows.map(({v,t})=>`<div class="evidence-row"><div><strong>${esc(t.id)}</strong><p>${esc(v.name)} · ${esc(t.assessmentReference)} · ${esc(govAmount(t.amount,t.currency))}</p><span class="fine">${esc(t.at.slice(0,16).replace('T',' '))} UTC${t.receipt?' · '+esc(t.receipt):''}</span></div><span class="badge ${t.outcome==='Succeeded'?'ready':''}">${esc(t.outcome)}</span></div>`).join(''):'<p class="muted">No payment attempts in this session. Use the North Star example to create a sample transaction.</p>')}
function paymentReceiptHTML(v,t){
 return '<!doctype html><html lang="en"><meta charset="utf-8"><title>Harbour demo payment receipt</title><body style="font:16px/1.6 Arial,sans-serif;max-width:720px;margin:50px auto;padding:24px"><h1>Government e-pay · Demo receipt</h1><p>FICTIONAL SIMULATION · NO MONEY COLLECTED · NO LEGAL VALIDITY</p>'+govFacts([['Receipt',t.receipt],['Transaction',t.id],['Visit',v.reference],['Vessel',v.name],['Department','Customs'],['Assessment',t.assessmentReference],['Request',t.requestId],['Amount',govAmount(t.amount,t.currency)],['Payment date',t.at],['Result',v.payments.find(p=>p.receipt===t.receipt)?.verified?'Succeeded · Receipt verified in demo':'Succeeded · Awaiting authority verification']])+'<p>Payment evidence only. This receipt does not grant clearance or a permit.</p></body></html>';
}
function downloadPaymentReceipt(v,t){
 const html=paymentReceiptHTML(v,t);
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));a.download='harbour-'+t.receipt+'.html';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function seedGovernmentDemo(){
 visits[0].people.forEach((p,i)=>Object.assign(p,{passportCountry:i?'Canada':'United Kingdom',passportIssued:'2021-03-12',passportExpiry:i?'2027-01-14':'2031-03-11'}));
 const v={...clone(visits[0]),id:'gov-demo',reference:'HBR-DEMO-GOV',name:'North Star',registration:'DEMO-NS-404',flag:'Cayman Islands',captain:'Taylor Harbour',email:'captain@example.invalid',broker:'Sample broker agency',arrival:'2027-01-18',departure:'2027-01-24',previousPort:'Marigot, Saint Martin',nextPort:'Gustavia, Saint Barthélemy',eta:'10:30',agentPhone:'000-0000',externalRef:'DEMO-NOTICE-404',tonnage:'18',cargo:'No',activities:'Road Bay stay · Cruising request submitted',people:[{name:'Taylor Harbour',role:'Crew',nationality:'British',dob:'1985-04-16',passport:'DEMO-NS-P001',passportCountry:'United Kingdom',passportIssued:'2022-06-01',passportExpiry:'2032-05-31'},{name:'Jordan Sample',role:'Crew',nationality:'Canadian',dob:'1992-09-10',passport:'DEMO-NS-P002',passportCountry:'Canada',passportIssued:'2020-03-15',passportExpiry:'2030-03-14'},{name:'Casey Demo',role:'Guest',nationality:'American',dob:'1990-12-03',passport:'DEMO-NS-P003',passportCountry:'United States',passportIssued:'2017-01-23',passportExpiry:'2027-01-22'}],history:[],decisions:newProcesses(),payments:[],documentDrafts:{},documentRequests:[],assessments:[],issuedDocuments:[],personReviews:[],epayTransactions:[],version:1,submitted:true};
 visits.push(v);
 const data={...documentDefaults(v),applicant:'Taylor Harbour',applicantAddress:'Fictional applicant address',ownerAddress:'Fictional owner address',ownerAgent:'Sample broker agency',agentPhone:'000-0000',tonnageType:'Registered tonnage',tonnageSource:'Fictional vessel register',description:'Fictional motor yacht',propulsion:'Power',rig:'Not applicable',colour:'White',ownerStatus:'Non-resident (demo)',period:'One week',requestedStart:v.arrival,applicationDate:govToday(),declaration:'Confirmed for demo'};
 saveDocumentDraft(v,'cruising',data);submitDocumentRequest(v,'cruising');
 createAssessment(v,{requestId:'REQ-1',actor:'Demo Customs officer',reference:'DEMO-ASSESS-401',basis:'Fictional demonstration amount; not a government tariff',date:govToday(),kind:'Fee',amount:'225.00',currency:'XCD'});
 recordPersonReview(v,0,{status:'Checked',actor:'Demo Immigration officer',note:'Fictional identity details reconciled with the submitted manifest.'});
 recordLanding(v,0,{status:'Landed',until:'2027-01-24',reference:'DEMO-LAND-001',actor:'Demo Immigration officer',note:''});
 const seaGlass=visits.find(x=>x.id==='3');
 seaGlass.people.forEach((p,i)=>{recordPersonReview(seaGlass,i,{status:'Checked',actor:'Demo Immigration officer',note:'Fictional identity details reconciled with the submitted manifest.'});recordLanding(seaGlass,i,{status:'Landed',until:'2027-01-15',reference:'DEMO-LAND-SG'+(i+1),actor:'Demo Immigration officer',note:''})});
 addActivity(v,v.broker,'Sample visit submitted','Government workspace presentation example');
}
