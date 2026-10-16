// Session-only document preparation. All authority actions are explicit demo simulations.
const documentLabels = {
 name:'Vessel name', flag:'Flag / country', registration:'Registration', registryPort:'Port of registry',
 tonnage:'Tonnage', tonnageType:'Tonnage measure', tonnageSource:'Tonnage evidence',
 applicant:'Applicant name', applicantAddress:'Applicant address', owner:'Owner name', ownerAddress:'Owner address',
 ownerAgent:"Owner’s appointed agent", agentAddress:'Agent address', agentPhone:'Agent telephone',
 description:'Vessel description', propulsion:'Power or sail', rig:'Rig', colour:'Colour', ownerStatus:'Owner status',
 period:'Requested permit period', requestedStart:'Requested commencement', applicationDate:'Application date', declaration:'Applicant declaration',
 captain:'Master / captain', construction:'Construction material', clearancePort:'Clearance port', nextPort:'Destination port',
 destinationCountry:'Destination country', crewCount:'Crew count (including master)', guestCount:'Guest count', countsConfirmed:'Manifest reconciliation'
};
const documentPeriods=['One day','One week','One month','Three months'];
const docTitle=type=>type==='cruising'?'Cruising permit':'Outward clearance';
const docProcess=type=>type==='cruising'?'cruising':'customs-out';
const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')&&!Number.isNaN(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;
const money=value=>Number.isFinite(Number(value))&&/^\d+(\.\d{1,2})?$/.test(String(value));
function documentStore(v){v.documentDrafts??={};v.documentRequests??=[];v.assessments??=[];v.issuedDocuments??=[];}
function documentDefaults(v){
 const shared=(v.documentRequests||[]).filter(r=>r.visitVersion===v.version).at(-1)?.data||{};
 return {...Object.fromEntries(Object.keys(documentLabels).map(key=>[key,shared[key]||v[key]||''])),
 crewCount:String((v.people||[]).filter(p=>p.role==='Crew').length),guestCount:String((v.people||[]).filter(p=>p.role==='Guest').length),
 applicationDate:new Date().toLocaleDateString('en-CA',{timeZone:'America/Anguilla'}),requestedStart:v.arrival||'',clearancePort:v.port||''};
}
function saveDocumentDraft(v,type,input){
 documentStore(v);
 v.documentDrafts[type]=Object.fromEntries(Object.keys(documentLabels).map(key=>[key,String(input[key]??'').trim()]));
 addActivity(v,v.broker,`${docTitle(type)} draft saved`);
 return {ok:true};
}
function documentMissing(data,type){
 const keys=type==='cruising'?['name','registration','flag','registryPort','tonnage','tonnageType','tonnageSource','applicant','applicantAddress','owner','ownerAddress','ownerAgent','agentAddress','agentPhone','description','propulsion','rig','colour','ownerStatus','period','requestedStart','applicationDate','declaration']:['name','registration','captain','tonnage','tonnageType','tonnageSource','construction','clearancePort','nextPort','destinationCountry','crewCount','guestCount','countsConfirmed'];
 const errors=keys.filter(key=>!String(data[key]??'').trim()).map(key=>documentLabels[key]);
 if(!(Number(data.tonnage)>0&&Number.isFinite(Number(data.tonnage))))errors.push('Positive tonnage');
 if(type==='cruising'){
  if(!documentPeriods.includes(data.period))errors.push('Choose a permit period');
  if(!validDate(data.requestedStart)||!validDate(data.applicationDate))errors.push('Valid request and application dates');
  if(data.requestedStart<data.applicationDate)errors.push('Commencement on or after application date');
  if(data.declaration!=='Confirmed for demo')errors.push('Confirm the demo declaration');
 }else{
  if(!/^\d+$/.test(data.crewCount)||Number(data.crewCount)<1||!/^\d+$/.test(data.guestCount))errors.push('Whole headcounts including at least the master');
  if(data.countsConfirmed!=='Confirmed for demo')errors.push('Confirm the reconciled manifest counts');
 }
 return [...new Set(errors)];
}
function latestRequest(v,type){return (v.documentRequests||[]).filter(r=>r.type===type).at(-1)}
function requestCurrent(v,r){return r&&v.submitted&&r.visitVersion===v.version&&latestRequest(v,r.type)?.id===r.id}
function submitDocumentRequest(v,type){
 documentStore(v);const data=v.documentDrafts[type];
 const errors=!v.submitted?['Submit the visit first']:!data?['Save a document draft first']:documentMissing(data,type);
 if(data&&['name','flag','registration'].some(key=>data[key]!==String(v[key]||'').trim()))errors.push('Vessel identity differs from the submitted visit; prepare a visit amendment first');
 if(errors.length)return {ok:false,errors};
 const r={id:'REQ-'+(v.documentRequests.length+1),type,data:clone(data),visitVersion:v.version,at:new Date().toISOString()};
 v.documentRequests.push(r);delete v.documentDrafts[type];
 const d=v.decisions.find(d=>d.key===docProcess(type));if(d.status!=='Pending')d.needsReview=true;
 addActivity(v,v.broker,`${docTitle(type)} request submitted`,`${r.id} · Visit version ${v.version}`);
 return {ok:true,request:r};
}
function createAssessment(v,data){
 documentStore(v);const r=v.documentRequests.find(r=>r.id===data.requestId);const errors=[];
 if(!requestCurrent(v,r)||r.type!=='cruising')errors.push('Choose the current cruising request');
 if(!data.actor?.trim()||!data.reference?.trim()||!data.basis?.trim()||!validDate(data.date))errors.push('Enter officer, reference, date and assessment basis');
 if(!['Fee','Exempt'].includes(data.kind)||!money(data.amount)||(data.kind==='Fee'?Number(data.amount)<=0:Number(data.amount)!==0))errors.push('Enter a positive fee or a zero-value exemption');
 if(!['XCD','USD','EUR','GBP'].includes(data.currency))errors.push('Confirm assessment currency');
 if(v.assessments.some(a=>a.requestId===data.requestId))errors.push('An assessment already exists; submit a revised request to reassess');
 if(errors.length)return {ok:false,errors};
 const a={id:'ASSESS-'+(v.assessments.length+1),requestId:r.id,actor:data.actor.trim(),reference:data.reference.trim(),basis:data.basis.trim(),date:data.date,kind:data.kind,amount:Number(data.amount),currency:data.currency};
 v.assessments.push(a);addActivity(v,a.actor,'Demo assessment recorded',`${a.reference} · ${a.kind} · ${a.amount} ${a.currency}`);return {ok:true};
}
function addLinkedReceipt(v,data){
 documentStore(v);const a=v.assessments.find(a=>a.id===data.assessmentId);const errors=[];
 if(!a||a.kind!=='Fee'||!requestCurrent(v,v.documentRequests.find(r=>r.id===a.requestId)))errors.push('Choose a current fee assessment');
 if(!money(data.amount)||Number(data.amount)<=0||data.currency!==a?.currency)errors.push('Use a positive amount in the assessment currency');
 if(!data.receipt?.trim()||!validDate(data.date))errors.push('Enter receipt reference and date');
 if(v.payments.some(p=>p.receipt.toLowerCase()===String(data.receipt).trim().toLowerCase()))errors.push('This receipt is already recorded');
 if(errors.length)return {ok:false,errors};
 v.payments.push({id:'RECEIPT-'+(v.payments.length+1),assessmentId:a.id,receipt:data.receipt.trim(),amount:Number(data.amount),currency:data.currency,assessed:data.date,authority:'Customs',purpose:'Cruising permit · '+a.reference,source:'Broker evidence · Awaiting verification',verified:false});
 addActivity(v,v.broker,'Receipt evidence linked',`${data.receipt} · ${a.reference}`);return {ok:true};
}
function verifyLinkedReceipt(v,id,actor,note){
 const p=v.payments.find(p=>p.id===id&&p.assessmentId);
 if(!p||p.verified||!actor?.trim()||!note?.trim())return {ok:false,errors:['Choose an unverified linked receipt and enter officer and verification reason']};
 const a=v.assessments.find(a=>a.id===p.assessmentId);
 if(!requestCurrent(v,v.documentRequests.find(r=>r.id===a?.requestId)))return {ok:false,errors:['Receipt belongs to a superseded request']};
 Object.assign(p,{verified:true,verifiedBy:actor.trim(),verificationNote:note.trim(),source:'Verified in demo by '+actor.trim()});
 addActivity(v,actor,'Receipt verified in demo',`${p.receipt} · ${note}`);return {ok:true};
}
function issueDemoDocument(v,data){
 documentStore(v);const r=v.documentRequests.find(r=>r.id===data.requestId);const errors=[];
 if(!requestCurrent(v,r))return {ok:false,errors:['Submit a current document request for this visit version']};
 if(!data.reference?.trim()||!data.actor?.trim()||!data.note?.trim()||!data.issuePlace?.trim()||!validDate(data.issueDate))errors.push('Enter document number, officer, reason, issue date and place');
 if(visits.some(x=>(x.issuedDocuments||[]).some(d=>d.reference===data.reference?.trim())))errors.push('Use a new unique document number');
 if(v.issuedDocuments.some(d=>d.requestId===r.id))errors.push('This request already has an issued document; submit a revision to reissue');
 const a=v.assessments.find(a=>a.requestId===r.id);const receipts=v.payments.filter(p=>p.assessmentId===a?.id&&p.verified);
 if(r.type==='cruising'){
  if(!a||(a.kind==='Fee'&&receipts.reduce((sum,p)=>sum+Math.round(p.amount*100),0)<Math.round(a.amount*100)))errors.push('Record an authority exemption or sufficient verified receipts');
  if(!validDate(data.from)||!validDate(data.until)||data.until<data.from)errors.push('Confirm valid issue dates');
 }else if(!inwardComplete(v))errors.push('Current inward clearance records are needed for this demo certificate');
 if(errors.length)return {ok:false,errors};
 const result=setProcessRecord(v,docProcess(r.type),{applicability:'Required',status:'Recorded',actor:data.actor,note:data.note,reference:data.reference,from:r.type==='cruising'?data.from:'',until:r.type==='cruising'?data.until:'',conditions:data.conditions});
 if(!result.ok)return result;
 const d={id:'DOC-'+(v.issuedDocuments.length+1),type:r.type,requestId:r.id,visitVersion:r.visitVersion,outcomeRevision:v.decisions.find(p=>p.key===docProcess(r.type)).revision,reference:data.reference.trim(),officer:data.actor.trim(),issueDate:data.issueDate,issuePlace:data.issuePlace.trim(),note:data.note.trim(),from:r.type==='cruising'?data.from:'',until:r.type==='cruising'?data.until:'',conditions:String(data.conditions||'').trim(),data:clone(r.data),assessment:a?clone(a):null,receipts:clone(receipts),deliveries:[]};
 v.issuedDocuments.push(d);addActivity(v,d.officer,'Demo document issued',`${docTitle(d.type)} · ${d.reference}`);return {ok:true,document:d};
}
function documentState(v,d){
 if(d.cancelledAt)return 'Cancelled';
 const record=v.decisions.find(r=>r.key===docProcess(d.type));
 if(record.status==='Cancelled'&&record.reference===d.reference)return 'Cancelled';
 if(record.reference!==d.reference)return 'Superseded';
 if(record.revision!==d.outcomeRevision||record.needsReview||record.status!=='Recorded'||v.version!==d.visitVersion||latestRequest(v,d.type)?.id!==d.requestId)return 'Review needed';
 return d.type==='cruising'?processValidity({...d,key:'cruising',status:'Recorded',applicability:'Required'}):'Recorded';
}
function recordDocumentDelivery(v,id,recipient){
 const d=v.issuedDocuments.find(d=>d.id===id);
 if(!d||!recipient?.trim())return {ok:false,errors:['Enter a recipient']};
 const state=documentState(v,d);
 if(['Cancelled','Superseded','Review needed','Expired'].includes(state))return {ok:false,errors:['Only a current document can be marked delivered']};
 d.deliveries.push({recipient:recipient.trim(),at:new Date().toISOString(),actor:v.broker});
 addActivity(v,v.broker,'Copy delivery recorded',`${d.reference} · ${recipient.trim()} · No message sent`);return {ok:true};
}
function documentFacts(data,keys=Object.keys(documentLabels)){
 return `<div class="facts">${keys.filter(key=>data[key]!==undefined&&data[key]!=='').map(key=>`<div><span>${documentLabels[key]}</span><strong>${esc(data[key])}</strong></div>`).join('')}</div>`;
}
function requestFields(type){return type==='cruising'?Object.keys(documentLabels).filter(k=>!['captain','construction','clearancePort','nextPort','destinationCountry','crewCount','guestCount','countsConfirmed'].includes(k)):['name','flag','registration','captain','tonnage','tonnageType','tonnageSource','construction','clearancePort','nextPort','destinationCountry','crewCount','guestCount','countsConfirmed'];}
function documentInput(key,data){
 if(key==='flag')return flagSelect(data.flag);
 const options={propulsion:['Power','Sail','Power and sail'],ownerStatus:['Unconfirmed','Anguillian','Non-Anguillian'],period:documentPeriods,declaration:['Not confirmed','Confirmed for demo'],countsConfirmed:['Not confirmed','Confirmed for demo'],tonnageType:['Registered tonnage','Gross tonnage','Net tonnage','Tons burthen — confirmation needed']};
 return options[key]?selectField(documentLabels[key],key,['',...options[key]],data[key]):field(documentLabels[key],key,data[key],['requestedStart','applicationDate'].includes(key)?'date':['tonnage','crewCount','guestCount'].includes(key)?'number':'text',false);
}
function documentInputGroups(type,data){
 const groups=type==='cruising'?[['Vessel & registration',['name','flag','registration','registryPort','tonnage','tonnageType','tonnageSource','description','propulsion','rig','colour']],['Applicant, owner & agent',['applicant','applicantAddress','owner','ownerAddress','ownerStatus','ownerAgent','agentAddress','agentPhone']],['Requested permission',['period','requestedStart','applicationDate','declaration']]]:[['Vessel & master',['name','flag','registration','captain','tonnage','tonnageType','tonnageSource','construction']],['Departure & manifest',['clearancePort','nextPort','destinationCountry','crewCount','guestCount','countsConfirmed']]];
 return groups.map(([title,keys])=>`<fieldset class="document-group"><legend>${title}</legend><div class="form-grid">${keys.map(key=>documentInput(key,data)).join('')}</div></fieldset>`).join('');
}
function packLink(v){return `<section class="panel document-entry"><span class="eyebrow">Prepare once · Reuse across documents</span><h2>Visit document pack</h2><p>Prepare a cruising application and outward-clearance details. Track linked fees and keep each issued copy.</p><a class="button" href="#documents/${v.id}">Open document pack</a></section>`}
function issuedList(v){return (v.issuedDocuments||[]).length?v.issuedDocuments.map(d=>`<div class="queue-row"><div><strong>${esc(d.reference)}</strong><p>${docTitle(d.type)} · ${esc(documentState(v,d))} · ${d.deliveries.length} delivery records</p></div><a class="button secondary small" href="#document/${v.id}/${d.id}">View copy</a></div>`).join(''):'<p class="muted">No documents issued yet.</p>'}
function documentPack(id,type='cruising'){
 const v=visits.find(v=>v.id===id);if(!v){dashboard();return}documentStore(v);if(!['cruising','clearance'].includes(type))type='cruising';
 const r=latestRequest(v,type);const draft=v.documentDrafts[type];const data=draft||r?.data||documentDefaults(v);
 app.innerHTML=`<section class="workspace">${demoNote}<a href="#visit/${v.id}">Back to visit</a><div class="pagehead"><div><span class="eyebrow">Broker preparation · ${esc(v.reference)}</span><h1>One yacht. A complete document pack.</h1><p>${esc(v.name)} · Reuse known details, then review each document separately.</p></div>${v.submitted?`<a class="button secondary" href="#document-review/${v.id}">Demo authority desk</a>`:''}</div><div class="document-layout"><div><div class="pills document-tabs"><a class="button ${type==='cruising'?'':'secondary'}" href="#documents/${v.id}/cruising">Cruising application</a><a class="button ${type==='clearance'?'':'secondary'}" href="#documents/${v.id}/clearance">Outward clearance</a></div><form id="doc-draft" class="panel" novalidate><h2>${docTitle(type)} preparation</h2><p class="fine">${type==='cruising'?'Applicant, owner and appointed agent may be different people. Confirm each role. Requested dates are separate from issued dates.':'Counts start from the visit manifest. Reconcile them with the captain, including the master in the crew count.'} Saving this form does not change the submitted visit.</p>${documentInputGroups(type,data)}<p class="fine">${type==='cruising'?'Declaration confirmation is a demo acknowledgement, not a legally accepted electronic signature.':'This models the supplied clearance certificate; operational requirements still need Customs confirmation.'}</p><div class="actions"><button>Save document draft</button><button type="button" class="secondary" id="sample-pack">Use fictional example</button></div><p id="doc-error" role="alert"></p></form>${draft?`<section class="panel document-entry"><h2>Review saved draft</h2>${documentFacts(draft,requestFields(type))}<p class="fine">${documentMissing(draft,type).length?'Still needed: '+esc(documentMissing(draft,type).join(' · ')):'Demo completeness checks passed. Confirm the details before submitting.'}</p><button id="submit-doc">Submit this document request</button></section>`:''}${r?`<section class="panel document-entry"><h2>Submitted request · ${r.id}</h2><p>Visit version ${r.visitVersion} · ${requestCurrent(v,r)?'Current':'Resubmit against current visit'}</p><a class="button secondary" href="#document/${v.id}/${r.id}">View submitted application</a></section>`:''}</div><aside><section class="panel"><h2>Issued copies</h2>${issuedList(v)}</section>${receiptPanel(v)}<section class="panel document-entry"><h2>Separate responsibilities</h2><p>The broker prepares and records evidence. Customs reviews the request, confirms the assessment and issues the demo document.</p><p class="fine">A cruising permit does not grant a person permission to enter Anguilla.</p></section></aside></div></section>`;
 document.querySelector('#doc-draft').onsubmit=e=>{e.preventDefault();saveDocumentDraft(v,type,Object.fromEntries(new FormData(e.target)));documentPack(id,type);toast('Document draft saved; review it below')};
 if(draft)document.querySelector('#submit-doc').onclick=()=>{const result=submitDocumentRequest(v,type);if(result.ok){documentPack(id,type);toast('Document request submitted for demo review')}else document.querySelector('#doc-error').textContent=result.errors.join('. ')};
 document.querySelector('#sample-pack').onclick=()=>{saveDocumentDraft(v,type,{...data,applicant:'Taylor Sample',applicantAddress:'Sample applicant address',ownerAddress:'Sample owner address',ownerAgent:'Sample Maritime Agent',agentPhone:'000-0000',tonnageType:'Registered tonnage',tonnageSource:'Fictional vessel register',description:'Fictional motor yacht',propulsion:'Power',rig:'Not applicable',colour:'White',ownerStatus:'Unconfirmed',period:'One week',requestedStart:v.arrival,applicationDate:'2027-01-08',declaration:'Confirmed for demo',construction:'Fibreglass',nextPort:'Gustavia',destinationCountry:'Saint Barthélemy',crewCount:'1',guestCount:'0',countsConfirmed:'Confirmed for demo'});documentPack(id,type)};
 bindReceiptPanel(v,()=>documentPack(id,type));
}
function receiptPanel(v){
 const assessments=v.assessments.filter(a=>a.kind==='Fee'&&requestCurrent(v,v.documentRequests.find(r=>r.id===a.requestId)));
 return `<section class="panel document-entry"><h2>Linked assessments & receipts</h2><p><a href="#epay/${v.id}">Open government e-pay demo</a></p>${v.assessments.map(a=>`<p><strong>${esc(a.reference)} · ${a.amount.toFixed(2)} ${esc(a.currency)}</strong><br>${esc(a.kind)} · ${esc(a.requestId)}<br><small>${esc(a.basis)}</small></p>`).join('')||'<p>Awaiting an authority assessment.</p>'}${v.payments.filter(p=>p.assessmentId).map(p=>`<p>${esc(p.receipt)} · ${p.amount.toFixed(2)} ${esc(p.currency)}<br><small>${esc(p.source)}</small></p>`).join('')}${assessments.length?`<form id="linked-receipt">${selectOptions('Assessment','assessmentId',assessments.map(a=>[a.id,`${a.reference} · ${a.amount} ${a.currency}`]))}${field('Receipt reference','receipt')}${field('Amount paid','amount','','number')}${selectField('Receipt currency','currency',['','XCD','USD','EUR','GBP'],'',true)}${field('Receipt date','date','','date')}<button>Link receipt evidence</button><p id="receipt-error" role="alert"></p></form>`:''}<p class="fine">Evidence remains unverified until the authority checks it. No payment is processed.</p></section>`;
}
function selectOptions(label,name,entries){return `<div><label for="${name}">${label}</label><select id="${name}" name="${name}">${entries.map(([value,text])=>`<option value="${esc(value)}">${esc(text)}</option>`).join('')}</select></div>`}
function bindReceiptPanel(v,refresh){if(document.querySelector('#linked-receipt'))document.querySelector('#linked-receipt').onsubmit=e=>{e.preventDefault();const result=addLinkedReceipt(v,Object.fromEntries(new FormData(e.target)));if(result.ok)refresh();else document.querySelector('#receipt-error').textContent=result.errors.join('. ')};}
function uniqueFormIds(html){
 return html.replace(/<form id="([^"]+)"[^>]*>[\s\S]*?<\/form>/g,(form,prefix)=>form.replace(/(<(?:input|select|textarea)\b[^>]*\bid=")([^"]+)/g,(_,start,id)=>start+prefix+'-'+id).replace(/(<label\b[^>]*\bfor=")([^"]+)/g,(_,start,id)=>start+prefix+'-'+id));
}
function documentReview(id){
 const v=visits.find(v=>v.id===id&&v.submitted);if(!v){dashboard();return}documentStore(v);
 const requests=v.documentRequests.filter(r=>requestCurrent(v,r));
 const cruising=requests.filter(r=>r.type==='cruising'&&!v.assessments.some(a=>a.requestId===r.id));
 const unverified=v.payments.filter(p=>p.assessmentId&&!p.verified&&requestCurrent(v,v.documentRequests.find(r=>r.id===v.assessments.find(a=>a.id===p.assessmentId)?.requestId)));
 app.innerHTML=`<section class="workspace">${demoNote}<a href="#documents/${v.id}">Back to document pack</a><div class="pagehead"><div><span class="eyebrow">Customs desk · Role simulation</span><h1>Review. Reconcile. Issue.</h1><p>${esc(v.name)} · Every action below is a fictional authority action.</p></div><div class="actions"><a class="button secondary" href="#customs/${v.id}">Customs visit file</a><a class="button secondary" href="#review/${v.id}">Other process reviews</a></div></div>${requests.length?`<div class="document-layout"><div><section class="panel"><h2>Submitted requests</h2>${requests.map(r=>`<article class="decision-block"><h3>${docTitle(r.type)} · ${r.id}</h3>${documentFacts(r.data,requestFields(r.type))}<a href="#document/${v.id}/${r.id}">Open printable request</a></article>`).join('')}</section><section class="panel document-entry"><h2>Issued copies</h2>${issuedList(v)}</section></div><div>${cruising.length?`<form id="assessment-form" class="panel"><h2>01 · Confirm assessment</h2><p class="fine">Enter a manually confirmed demo amount or an authority-reviewed exemption. The historical tariff is not an automatic quote.</p>${selectOptions('Cruising request','requestId',cruising.map(r=>[r.id,r.id]))}<div class="form-grid">${field('Assessment reference','reference')}${selectField('Assessment type','kind',['Fee','Exempt'],'Fee')}${field('Assessed amount (0 for exemption)','amount','','number')}${selectField('Confirmed currency','currency',['','XCD','USD','EUR','GBP'],'',true)}${field('Assessment date','date','','date')}${field('Assessing officer','actor','Demo Customs officer')}</div>${field('Assessment / exemption basis','basis')}<button>Record demo assessment</button><p id="assessment-error" role="alert"></p></form>`:''}${unverified.length?`<form id="receipt-review" class="panel document-entry"><h2>02 · Verify receipt evidence</h2>${selectOptions('Receipt to verify','receiptId',unverified.map(p=>[p.id,`${p.receipt} · ${p.amount} ${p.currency}`]))}${field('Verifying officer','actor','Demo Customs officer')}${field('Verification reason','note')}<button>Verify in demo</button><p id="receipt-review-error" role="alert"></p></form>`:''}<form id="issue-document" class="panel document-entry"><h2>03 · Issue demo document</h2><p class="fine">Cruising requires a confirmed exemption or sufficient verified receipts. Clearance requires current inward outcomes. Issuing one document does not complete every permission.</p>${selectOptions('Submitted request','requestId',requests.map(r=>[r.id,`${r.id} · ${docTitle(r.type)}`]))}<div class="form-grid">${field('New document number','reference')}${field('Issuing officer','actor','Demo Customs officer')}${field('Issue date','issueDate','','date')}${field('Issue place','issuePlace','Road Bay')}${field('Confirmed permit start','from','','date',false)}${field('Confirmed permit expiry','until','','date',false)}</div><p class="fine">Permit dates apply to cruising only: 09:00 start to end of expiry day, Anguilla time. Confirm calendar-period conventions with Customs.</p>${field('Public scope / conditions','conditions','','text',false)}${field('Private issuance reason','note')}<button>Issue fictional document</button><p id="issuance-error" role="alert"></p></form></div></div>`:'<section class="panel"><h2>No current document requests</h2><p>Prepare and submit a document request from the broker pack first.</p></section>'}</section>`;
 app.innerHTML=uniqueFormIds(app.innerHTML);
 const bind=(selector,error,action)=>{const el=document.querySelector(selector);if(el)el.onsubmit=e=>{e.preventDefault();const result=action(Object.fromEntries(new FormData(e.target)));if(result.ok){documentReview(id);toast('Demo authority record saved')}else document.querySelector(error).textContent=result.errors.join('. ')};};
 bind('#assessment-form','#assessment-error',data=>createAssessment(v,data));
 bind('#receipt-review','#receipt-review-error',data=>verifyLinkedReceipt(v,data.receiptId,data.actor,data.note));
 bind('#issue-document','#issuance-error',data=>issueDemoDocument(v,data));
}
function documentView(id,documentId){
 const v=visits.find(v=>v.id===id);if(!v){dashboard();return}documentStore(v);
 const issued=v.issuedDocuments.find(d=>d.id===documentId);const r=v.documentRequests.find(r=>r.id===documentId);const d=issued||r;
 if(!d){app.innerHTML='<section class="workspace"><h1>Document not found</h1><a href="#dashboard">Back to applications</a></section>';return}
 const status=issued?documentState(v,d):requestCurrent(v,d)?'Submitted for review':'Superseded request';
 app.innerHTML=`<section class="workspace document-page"><div class="no-print"><a href="#documents/${v.id}">Back to document pack</a><div class="pagehead"><h1>${issued?'Issued demo copy':'Submitted application'}</h1><div class="actions"><button id="print-document">Print / save as PDF</button><button id="download-document" class="secondary">Download printable copy</button></div></div><p class="fine">If the embedded preview does not open a print dialog, download the HTML copy and open it in your browser to print or save as PDF.</p></div><article class="paper-document"><div class="paper-top"><span class="brand">harbour</span><strong>FICTIONAL DEMO · NO LEGAL VALIDITY</strong></div><h2>${docTitle(d.type)}${issued?'':' request'}</h2><p>${esc(issued?d.reference:d.id)} · Visit ${esc(v.reference)} · Version ${d.visitVersion}</p><p class="document-status">Status at viewing: ${esc(status)}</p>${documentFacts(d.data,requestFields(d.type))}${issued?`<h3>Issuance record</h3><div class="facts"><div><span>Issuing officer (simulated)</span><strong>${esc(d.officer)}</strong></div><div><span>Issued at</span><strong>${esc(d.issuePlace)} · ${esc(d.issueDate)}</strong></div>${d.type==='cruising'?`<div><span>Confirmed validity · Anguilla time</span><strong>${esc(d.from)} 09:00 through ${esc(d.until)} end of day</strong></div>`:''}<div><span>Scope / conditions</span><strong>${esc(d.conditions||'None recorded')}</strong></div></div>${d.assessment?`<h3>Assessment and payment evidence</h3><p>${esc(d.assessment.reference)} · ${esc(d.assessment.kind)} · ${d.assessment.amount.toFixed(2)} ${esc(d.assessment.currency)}</p>${d.receipts.map(p=>`<p>Receipt ${esc(p.receipt)} · ${p.amount.toFixed(2)} ${esc(p.currency)} · ${esc(p.assessed)}</p>`).join('')}`:''}<p class="paper-attestation">Fictional authority record. No official stamp or signature is reproduced.</p>`:'<p class="paper-attestation">Prepared by the broker for simulated authority review. This application is not an issued permit or clearance.</p>'}<p class="fine">${d.type==='cruising'?'Cruising permission does not confer a person’s right to enter Anguilla.':'This Customs document does not replace separate Immigration or permit requirements.'} Private demo copy · Printed status is a snapshot and may change. No live cross-device verification is available.</p></article>${issued?`<section class="panel document-entry no-print"><h2>Copy delivery history</h2>${d.deliveries.map(x=>`<p>${esc(x.recipient)} · ${esc(x.at)} · ${esc(x.actor)}</p>`).join('')||'<p>No delivery recorded.</p>'}<form id="delivery-form">${field('Copy recipient (sample name or role)','recipient')}<button>Record copy delivered</button><p class="fine">Records a broker-reported event only. It does not send email or share a document.</p><p id="delivery-error" role="alert"></p></form></section>`:''}</section>`;
 document.querySelector('#print-document').onclick=()=>window.print();
 document.querySelector('#download-document').onclick=()=>{
  const content=document.querySelector('.paper-document').outerHTML;
  const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Harbour fictional document</title><style>body{font:15px/1.5 Arial,sans-serif;color:#173334;max-width:800px;margin:32px auto;padding:24px}.paper-top{display:flex;justify-content:space-between;gap:24px;border-bottom:2px solid #00686b;padding-bottom:20px}.paper-top strong{font-size:11px}.brand{font-size:26px;font-weight:bold}.facts{display:grid;grid-template-columns:1fr 1fr;gap:20px}.facts span{display:block;color:#586c6d;font-size:12px}.facts strong{display:block;overflow-wrap:anywhere}.document-status{padding:12px;background:#edf6f4}.fine{font-size:12px}.paper-attestation{border-top:1px solid #ddd;padding-top:20px}h3{margin-top:28px}@media(max-width:500px){.facts{grid-template-columns:1fr}}@media print{@page{size:A4;margin:16mm}body{font-size:10pt;margin:0;padding:0}.facts{grid-template-columns:1fr 1fr;gap:12px}.facts>div,.paper-top,.paper-attestation{break-inside:avoid}h3{break-after:avoid}}</style></head><body>'+content+'</body></html>';
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));a.download='harbour-'+v.id+'-'+d.id+'.html';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('Printable demo copy downloaded');
 };
 if(issued)document.querySelector('#delivery-form').onsubmit=e=>{e.preventDefault();const result=recordDocumentDelivery(v,d.id,new FormData(e.target).get('recipient'));if(result.ok)documentView(id,documentId);else document.querySelector('#delivery-error').textContent=result.errors.join('. ')};
}
function publicDocuments(v){return (v.issuedDocuments||[]).length?`<h3>Document references</h3>${v.issuedDocuments.map(d=>`<p><strong>${esc(d.reference)}</strong> · ${docTitle(d.type)} · ${esc(documentState(v,d))}</p>`).join('')}`:''}
