const app=document.querySelector('#app');
const visits=[{id:'1',name:'Azure',flag:'Cayman Islands',registration:'DEMO-AZ-101',length:'42 m',captain:'Elena Morgan',email:'captain@example.invalid',arrival:'2027-01-12',departure:'2027-01-16',port:'Road Bay',people:[{name:'Elena Morgan',role:'Crew',nationality:'British',passport:'DEMO-001',dob:'1987-03-12'},{name:'Daniel Reed',role:'Guest',nationality:'Canadian',passport:'DEMO-002',dob:'1991-06-20'}],files:['Vessel registration.pdf','Insurance certificate.pdf'],checks:[true,true,false,false,false],stage:'Preparing',agent:'Alex James'},{id:'2',name:'Solstice',flag:'Marshall Islands',registration:'DEMO-SO-202',length:'55 m',captain:'James Laurent',email:'captain@example.invalid',arrival:'2027-01-14',departure:'2027-01-19',port:'Road Bay',people:[],files:['Vessel registration.pdf'],checks:[true,false,false,false,false],stage:'Awaiting documents',agent:'Morgan Lee'},{id:'3',name:'Sea Glass',flag:'United Kingdom',registration:'DEMO-SG-303',length:'31 m',captain:'Sofia Bennett',email:'captain@example.invalid',arrival:'2027-01-10',departure:'2027-01-15',port:'Road Bay',people:[],files:['Vessel registration.pdf','Insurance certificate.pdf'],checks:[true,true,true,true,false],stage:'Submitted',agent:'Alex James'}];
let filter='All',query='',editingId=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=d=>!d?'Not set':new Date(d+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'});
const banner='<div class="demo-banner">Pitch demo · Fictional data · Changes last for this session. Please use sample details only.</div>';
function toast(t){const el=document.querySelector('#toast');el.textContent=t;el.style.display='block';clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el.style.display='none',3500)}
function field(label,name,value='',type='text',required=true){return `<div><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" ${type==='number'?'step="any"':''} value="${esc(value)}" ${required?'required':''}></div>`}
// Country and territory labels include separate yacht-registration jurisdictions.
const flagRegionCodes='AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ');
const flagRegionNames=new Intl.DisplayNames(['en'],{type:'region'});
const flagCountries=flagRegionCodes.map(code=>flagRegionNames.of(code)).sort((a,b)=>a.localeCompare(b,'en'));
function flagSelect(value=''){
  // Keep imported or previously saved labels even if they differ from this list.
  const options=value&&!flagCountries.includes(value)?[value,...flagCountries]:flagCountries;
  return `<div><label for="flag">Flag / country of registration</label><select id="flag" name="flag" required><option value="" disabled ${value?'':'selected'}>Select a country or territory</option>${options.map(country=>`<option value="${esc(country)}" ${country===value?'selected':''}>${esc(country)}</option>`).join('')}</select></div>`;
}
function baseIntake(){const record=visits.find(v=>v.id===editingId);const v=record?(record.draft||record):null;app.innerHTML=`<section class="workspace"><div class="form-shell">${banner}<span class="eyebrow">Broker application</span><h1>${v?'Update application':'New yacht application'}</h1><p class="muted">Prepare yacht and visit details on behalf of the captain for departmental review. This demo does not submit information to authorities.</p>${record?correctionPanel(record):''}<form id="intakeform"><section class="panel"><h2>01 · Yacht & captain</h2><div class="form-grid">${field('Yacht name','name',v?.name)}${flagSelect(v?.flag)}${field('Registration number','registration',v?.registration)}${field('Length','length',v?.length||'42 m')}${field('Captain name','captain',v?.captain)}${field('Captain email','email',v?.email||'','email')}</div></section><section class="panel"><h2>02 · Visit details</h2><div class="form-grid">${field('Arrival date','arrival',v?.arrival||'2027-01-12','date')}${field('Departure date','departure',v?.departure||'2027-01-16','date')}<div class="full"><label for="port">Arrival location</label><select id="port" name="port"><option>Road Bay</option></select><p class="fine">Sample location. Confirm entry arrangements with the relevant authorities.</p></div></div></section><section class="panel"><h2>03 · Crew & guests</h2><p class="muted">Use fictional identity details in this pitch demo.</p><div id="people"></div><button type="button" class="secondary" id="addperson">Add a person</button></section><section class="panel"><h2>04 · Document checklist</h2><p class="muted">Select sample filenames to demonstrate document collection. Actual document and insurance requirements need confirmation; filenames are not a universal submission gate.</p><label for="files">Registration and insurance documents</label><input id="files" type="file" multiple accept=".pdf,.jpg,.jpeg,.png"><button type="button" class="secondary" id="sampledocs">Use sample registration & insurance</button><p id="filenames" class="uploadlist">${v?esc(v.files.join(', ')):'No files selected'}</p></section><div class="actions"><button type="submit">Review application</button><button type="button" class="secondary" id="savedraft">Save draft</button><a class="button secondary" href="#dashboard">Cancel</a></div></form></div></section>`;const addPerson=(p={})=>{const box=document.createElement('div');box.className='person';box.innerHTML=`<div class="form-grid"><div><label>Name<input data-person="name" value="${esc(p.name)}" required></label></div><div><label>Role<select data-person="role"><option ${p.role==='Crew'?'selected':''}>Crew</option><option ${p.role==='Guest'?'selected':''}>Guest</option></select></label></div><div><label>Nationality<input data-person="nationality" value="${esc(p.nationality)}" required></label></div><div><label>Date of birth<input type="date" data-person="dob" value="${esc(p.dob)}" required></label></div><div><label>Sample passport number<input data-person="passport" value="${esc(p.passport)}" required></label></div><div><label>Passport issuing country<input data-person="passportCountry" value="${esc(p.passportCountry)}" maxlength="100"></label></div><div><label>Passport issue date<input type="date" data-person="passportIssued" value="${esc(p.passportIssued)}"></label></div><div><label>Passport expiry date<input type="date" data-person="passportExpiry" value="${esc(p.passportExpiry)}"></label></div></div><button type="button" class="textlink" style="margin-top:12px">Remove person</button>`;box.querySelector('button').onclick=()=>box.remove();document.querySelector('#people').append(box)};(v?.people||[]).forEach(addPerson);document.querySelector('#addperson').onclick=()=>addPerson();let pendingFiles=v?.files||[];
document.querySelector('#files').onchange=e=>{pendingFiles=Array.from(e.target.files).map(f=>f.name);document.querySelector('#filenames').textContent=pendingFiles.join(', ')||'No files selected'};
document.querySelector('#sampledocs').onclick=()=>{pendingFiles=['Sample vessel registration.pdf','Updated sample insurance.pdf'];document.querySelector('#filenames').textContent=pendingFiles.join(', ');toast('Sample filenames added; no document content stored')};
const saveForm=(reviewNext)=>{
  const form=document.querySelector('#intakeform');
  const data=Object.fromEntries(new FormData(form));
  data.people=Array.from(document.querySelectorAll('.person')).map(row=>Object.fromEntries(Array.from(row.querySelectorAll('[data-person]')).map(el=>[el.dataset.person,el.value])));
  data.files=[...pendingFiles];
  const saved=saveApplicationDraft(record,data);
  editingId=null;
  location.hash=(reviewNext?'submit/':'visit/')+saved.id;
  toast(reviewNext?'Review the application before submitting':'Draft saved for this session');
};
document.querySelector('#savedraft').onclick=()=>saveForm(false);
document.querySelector('#intakeform').onsubmit=e=>{e.preventDefault();saveForm(true)};
}

function download(v){const rows=[['DRAFT MANIFEST — FICTIONAL DEMO — NOT OFFICIAL'],['Yacht',v.name,'Flag',v.flag,'Registration',v.registration],['Arrival',v.arrival,'Departure',v.departure,'Location',v.port],[],['Name','Role','Nationality','Date of birth','Sample passport number','Issuing country','Passport issue date','Passport expiry date'],...v.people.map(p=>[p.name,p.role,p.nationality,p.dob,p.passport,p.passportCountry||'',p.passportIssued||'',p.passportExpiry||''])];const csv=rows.map(r=>r.map(x=>'"'+String(x).replace(/^[=+@-]/,"'$&").replace(/"/g,'""')+'"').join(',')).join('\r\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='harbour-draft-manifest.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('Draft manifest downloaded')}
if(document.modelContext?.registerTool){try{document.modelContext.registerTool({name:'list_demo_yacht_visits',description:'Read fictional yacht visits in this session.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({visits:visits.map(v=>({id:v.id,name:v.name,arrival:v.arrival,status:overall(v)}))})});document.modelContext.registerTool({name:'open_demo_yacht_visit',description:'Navigate to a fictional yacht visit without changing its data.',inputSchema:{type:'object',properties:{id:{type:'string'}},required:['id'],additionalProperties:false},annotations:{readOnlyHint:true},execute:({id})=>{if(!visits.some(v=>v.id===id))throw Error('Visit not found');location.hash='visit/'+id;detail(id);return {id,opened:true}}})}catch(e){console.warn('Optional browser tools unavailable')}}
// Broker-led application and departmental review pitch workflow.
visits.forEach((v,i)=>{v.reference='HBR-DEMO-100'+(i+1);v.broker='Island Yacht Agency (Demo)';v.authorisation='Sample broker appointment recorded'});
const demoNote='<div class="demo-banner">Simulated approvals · No legal validity · Sample data only. Reviews and changes are held in this browser session; other devices and reloads show the original sample records.</div>';
const statusClass=s=>s==='Recorded'?'ready':s==='Rejected'||s==='Cancelled'?'danger':'';
function home(){app.innerHTML=`<section class="hero"><img src="coast.webp" alt="Anguilla’s turquoise western coastline"><div class="hero-copy"><span class="eyebrow">Broker-led yacht applications · Anguilla</span><h1>One application.<br><em>A smoother arrival.</em></h1><p>Bring brokers and departments together. Prepare one visit record, coordinate arrival clearance and track each permission through departure.</p><a class="button" href="#dashboard">Explore the broker portal</a></div><span class="location">18° N / 63° W · Anguilla, British Caribbean</span></section><div class="floating"><div><strong>Apply</strong><span>Your broker handles the details</span></div><div><strong>Review</strong><span>Separate departmental decisions</span></div><div><strong>Verify</strong><span>Separate clearance and permit records</span></div></div><section class="section"><div class="section-head"><div><span class="eyebrow">The welcome, connected</span><h2>Less repetition.<br>More clarity at every step.</h2></div><p style="max-width:350px">Broker-led coordination with Customs and Immigration, plus relevant permit and tax authorities. Requirements and responsibilities remain subject to confirmation.</p></div><div class="cards"><article class="card"><span class="icon">≡</span><h3>Broker portal</h3><p>Prepare yacht and visit details on behalf of the captain, submit supporting information and respond to requests.</p><a href="#dashboard">Explore applications</a></article><article class="card"><span class="icon">✓</span><h3>Department review</h3><p>Review relevant application details, request corrections and record an independent decision with a reason.</p><a href="#customs">Explore the Customs desk</a></article><article class="card"><span class="icon">◎</span><h3>On-land verification</h3><p>Search a visit reference to check separate process outcomes, permit dates and conditions.</p><a href="#verify">Verify a sample approval</a></article></div></section><section class="section" style="padding-top:0"><div class="cta"><div><span class="eyebrow">Interactive pitch demonstration</span><h2>Follow the complete journey.</h2><p>Open Azure’s application, record departmental reviews and view its verification record.</p></div><a class="button" href="#visit/1">Open sample application</a></div></section>`}
function dashboard(){app.innerHTML=`<section class="workspace">${demoNote}<div class="pagehead"><div><span class="eyebrow">Broker portal · Island Yacht Agency</span><h1>Your yacht applications</h1><p class="muted">Manage submissions on behalf of your yachts.</p></div><div class="actions"><a class="button" href="#intake">New application</a><button class="secondary" id="resetdemo">Reset demo</button></div></div>${actionQueue()}<div class="stats"><div class="stat"><strong>${visits.length}</strong><span>Applications</span></div><div class="stat"><strong>${visits.filter(v=>overall(v)==='Arrival processing').length}</strong><span>Arrival processing</span></div><div class="stat"><strong>${visits.filter(v=>overall(v)==='Stay management').length}</strong><span>Stay management</span></div></div><div class="toolbar"><div class="pills">${['All','Draft','Changes requested','Ready to report','Arrival processing','Stay management','Departure preparation','Departed','Review needed'].map(f=>`<button data-filter="${f}" class="${filter===f?'active':''}">${f}</button>`).join('')}</div><input id="search" type="search" aria-label="Search yacht or reference" placeholder="Search yacht or reference" value="${esc(query)}"></div><div class="visits" id="visits"></div></section>`;document.querySelector('#resetdemo').onclick=()=>{location.hash='reset'};renderCards();document.querySelector('#search').oninput=e=>{query=e.target.value;renderCards()};document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;dashboard()})}
function renderCards(){const found=[...visits].sort((a,b)=>attentionRank(a)-attentionRank(b)).filter(v=>(filter==='All'||overall(v)===filter)&&`${v.name} ${v.reference}`.toLowerCase().includes(query.toLowerCase()));document.querySelector('#visits').innerHTML=found.length?found.map(v=>`<article class="visit"><div class="visit-top"><span class="vessel-letter">${esc((v.name||'Draft')[0])}</span><span class="badge ${statusClass(overall(v))}">${overall(v)}</span></div><div class="visit-body"><h2>${esc(v.name||'Untitled yacht')}</h2><span class="muted">${esc(v.reference)}</span><dl><div><dt>Arrival</dt><dd>${date(v.arrival)}</dd></div><div><dt>Departure</dt><dd>${date(v.departure)}</dd></div></dl><p class="next-action">${esc(nextAction(v))}</p>${v.submitted===false?'':v.decisions.filter(d=>d.fixed&&!d.key.endsWith('out')).map(d=>`<div class="decision-line"><span>${esc(d.title||d.department)}</span><span class="badge ${d.needsReview?'':statusClass(d.status)}">${d.needsReview?'Review needed':d.applicability==='Unconfirmed'?'Applicability unconfirmed':d.applicability==='Not applicable'?'Not applicable':d.applicability==='Unconfirmed'?'Applicability unconfirmed':d.status}</span></div>`).join('')}<a class="button secondary" style="margin-top:20px" href="#visit/${v.id}">View application</a></div></article>`).join(''):'<div class="empty">No matching applications.</div>'}
function detail(id){const v=visits.find(v=>v.id===id);if(!v){location.hash='dashboard';return}app.innerHTML=`<section class="workspace">${demoNote}<a href="#dashboard">Back to applications</a><div class="pagehead"><div><span class="eyebrow">${esc(v.reference)}</span><h1>${esc(v.name)}</h1><p class="muted">${esc(v.arrival||'Arrival not set')} to ${esc(v.departure||'Departure not set')} · ${esc(v.port)}</p></div><span class="badge ${statusClass(overall(v))}">${overall(v)}</span></div>${correctionPanel(v)}${packLink(v)}<div class="details"><div><section class="panel"><h2>${v.submitted===false?'Prepared by the broker':'Submitted by the broker'}</h2><div class="facts">${[['Broker',v.broker],['Representation',v.authorisation],['Flag',v.flag],['Registration',v.registration],['Captain',v.captain],['People listed',v.people.length]].map(([k,x])=>`<div><span>${k}</span><strong>${esc(x)}</strong></div>`).join('')}</div><div class="actions"><button class="secondary" id="edit">${v.submitted===false?'Continue draft':'Prepare amendment'}</button>${v.draft?`<a class="button" href="#submit/${v.id}">Review saved draft</a>`:''}<button id="manifest" class="secondary">Draft manifest</button></div><p class="fine">Amendments preserve earlier evidence and mark existing records for review. Which changes require which authority reviews must be confirmed.</p></section><section class="panel" style="margin-top:25px"><h2>Supporting documents</h2>${v.files.map(f=>`<div class="check">▤ &nbsp; ${esc(f)}</div>`).join('')||'<p>No sample filenames recorded.</p>'}<p class="fine">Sample filenames only. No document content is stored.</p></section></div><div><section class="panel"><h2>${v.submitted===false?'Draft application':'Clearance and permit records'}</h2>${v.submitted===false?'<p>Finish the draft and review the summary before sending it for independent departmental decisions.</p>':decisionBlocks(v)}${v.submitted===false?'':`<div class="actions"><a class="button" href="#customs/${v.id}">Customs desk</a><a class="button secondary" href="#immigration/${v.id}">Immigration desk</a><a class="button secondary" href="#review/${v.id}">Other process reviews</a><a class="button secondary" href="#verify/${v.reference}">Verification record</a></div>`}<p class="fine">Clearance, conditional permits and receipts are separate. Unconfirmed applicability is not permission to proceed.</p></section>${v.submitted?operations(v):''}<section class="panel" style="margin-top:25px"><h2>Activity</h2>${timeline(v)}</section></div></div></section>`;document.querySelector('#edit').onclick=()=>{editingId=id;location.hash='intake'};document.querySelector('#manifest').onclick=()=>download(v);if(v.submitted)bindOperations(v)}
function decisionBlocks(v){return processRows(v)}
function review(id){
 const submitted=visits.filter(v=>v.submitted);const v=submitted.find(v=>v.id===id)||submitted[0];if(!v){dashboard();return}
 app.innerHTML=`<section class="workspace">${demoNote}<div class="pagehead"><div><span class="eyebrow">Authority workspace · Role simulation</span><h1>Record a process outcome</h1><p>Each authority records only its own clearance or permission. These controls simulate authority actions; there is no authenticated officer access.</p></div><a class="button secondary" href="#visit/${v.id}">Broker view</a></div><div class="details"><section class="panel"><label for="application">Application</label><select id="application">${submitted.map(x=>`<option value="${x.id}" ${x.id===v.id?'selected':''}>${esc(x.reference)} · ${esc(x.name)}</option>`).join('')}</select><h2>${esc(v.name)}</h2><p>Submitted version ${v.version} · ${esc(v.vesselUse||'Use unconfirmed')} · ${esc(v.tonnage||'Tonnage unconfirmed')}</p><p>Visit: ${esc(v.arrival)} to ${esc(v.departure)}</p><p>${esc(v.activities||'Activities not specified')}</p><h3>Supporting filenames</h3>${v.files.map(f=>`<p>${esc(f)}</p>`).join('')||'<p>None supplied. Confirm actual requirements.</p>'}${processRows(v)}</section><section class="panel"><form id="decisionform"><h2>Simulated authority record</h2><p class="fine">Version ${v.version}. ${v.draft?'A broker amendment is saved but not submitted.':''} Scope and legal requirements remain subject to stakeholder validation.</p>${selectField('Process','process',v.decisions.map(d=>d.key),'customs-in')}${selectField('Applicability','applicability',['Required','Unconfirmed','Not applicable'],'Required')}${selectField('Outcome','decision',['','Pending','Recorded','Changes requested','Rejected','Cancelled'],'',true)}${field('Officer name','officer','Demo officer')}${field('Authority reference','authorityReference','','text',false)}<div class="form-grid">${field('Valid from','validFrom','','date',false)}${field('Valid until','validUntil','','date',false)}</div><label for="conditions">Public scope / conditions (no personal information)</label><textarea id="conditions" name="conditions"></textarea><label for="reason">Private reason / correction request</label><textarea id="reason" name="reason" required></textarea><p class="fine">Marine-park records need current inward clearance evidence. Confirm optional applicability explicitly. To reissue a cancelled record, enter a new authority reference; earlier evidence remains in the activity history.</p><button>Record outcome</button><p id="decision-error" role="alert"></p></form></section></div></section>`;
 const picker=document.querySelector('#process');
 picker.innerHTML=v.decisions.map(d=>`<option value="${d.key}">${esc(d.title)} · ${esc(d.department)}</option>`).join('');
 const load=()=>{const d=v.decisions.find(d=>d.key===picker.value)||v.decisions[0];document.querySelector('#applicability').value=d.applicability;document.querySelector('#decision').value='';document.querySelector('#authorityReference').value=d.reference||'';document.querySelector('#validFrom').value=d.from||'';document.querySelector('#validUntil').value=d.until||'';document.querySelector('#conditions').value=d.conditions||'';document.querySelector('#reason').value=''};
 picker.onchange=load;load();
 document.querySelector('#application').onchange=e=>{location.hash='review/'+e.target.value};
 document.querySelector('#decisionform').onsubmit=e=>{e.preventDefault();const result=setProcessRecord(v,picker.value,{applicability:document.querySelector('#applicability').value,status:document.querySelector('#decision').value,actor:document.querySelector('#officer').value,note:document.querySelector('#reason').value,reference:document.querySelector('#authorityReference').value,from:document.querySelector('#validFrom').value,until:document.querySelector('#validUntil').value,conditions:document.querySelector('#conditions').value});if(result.ok){review(v.id);toast('Process outcome recorded; other processes unchanged')}else document.querySelector('#decision-error').textContent=result.errors.join('. ')};
}
function verify(ref=''){
 const v=visits.find(v=>v.submitted&&v.reference.toLowerCase()===ref.toLowerCase());
 app.innerHTML=`<section class="workspace"><div class="form-shell">${demoNote}<span class="eyebrow">Record verification</span><h1>Check a visit record</h1><p>Check each clearance or permit separately. A visit reference does not authorise every passenger, activity or anchorage.</p><form id="verifyform" class="toolbar"><input id="reference" aria-label="Visit reference" required placeholder="HBR-DEMO-1003" value="${esc(ref)}"><button>Search</button></form><div class="actions"><a href="#verify/HBR-DEMO-1003">View recorded-clearance example</a><a href="#verify/HBR-DEMO-1001">View correction example</a></div>${v?`<section class="panel"><h2>${esc(v.name)}</h2><p>${esc(v.reference)} · ${esc(v.registration)} · ${esc(v.flag)}</p><p>Planned visit: ${esc(v.arrival)} to ${esc(v.departure)}</p><p class="fine">Coordination stage: ${overall(v)}. This is not an overall permission or clearance decision.</p>${processRows(v,true)}${publicDocuments(v)}<p class="fine">Fictional records only. Immigration status here is a visit-level summary, not proof of any individual's right to enter. No identity details, private reasons or payment receipts are published.</p></section>`:ref?'<section class="panel"><h2>Record not found</h2><p>Check the reference. Drafts are not publicly verifiable.</p></section>':'<section class="panel"><h2>Separate outcomes, one visit</h2><p>Search the sample reference to see each process and its scope. Static QR images from the earlier demo are no longer displayed because they do not reflect these records.</p></section>'}</div></section>`;
 document.querySelector('#verifyform').onsubmit=e=>{e.preventDefault();location.hash='verify/'+encodeURIComponent(document.querySelector('#reference').value.trim())};
}

function intake(){
  baseIntake();
  const record=visits.find(v=>v.id===editingId);
  const data=record?.draft||record;
  const form=document.querySelector('#intakeform');
  const block=document.createElement('section');block.className='panel';
  block.innerHTML=`<h2>Broker representation</h2><div class="form-grid">${field('Broker / agency','broker',data?.broker||'Island Yacht Agency (Demo)')}${field('Authority to act','authorisation',data?.authorisation||'Sample broker appointment recorded')}</div><p class="fine">Representation evidence requirements must be confirmed with the departments.</p>${record?.submitted?`<label for="response">What changed?</label><textarea id="response" name="response" rows="3" placeholder="Explain the amendment or your response to the department">${esc(data?.response||'')}</textarea>`:''}`;
  form.prepend(block);const planning=document.createElement('div');planning.innerHTML=processIntake(data||{});form.prepend(planning);
}

function render(){const route=location.hash.slice(1)||'home';if(route==='customs'||route.startsWith('customs/'))governmentDesk('customs',route.split('/')[1]);else if(route==='immigration'||route.startsWith('immigration/'))governmentDesk('immigration',route.split('/')[1]);else if(route==='epay'||route.startsWith('epay/'))paymentPortal(route.split('/')[1],route.split('/')[2]);else if(route.startsWith('documents/'))documentPack(route.split('/')[1],route.split('/')[2]);else if(route.startsWith('document-review/'))documentReview(route.split('/')[1]);else if(route.startsWith('document/'))documentView(route.split('/')[1],route.split('/')[2]);else if(route==='dashboard')dashboard();else if(route.startsWith('visit/'))detail(route.split('/')[1]);else if(route==='intake')intake();else if(route.startsWith('submit/'))submissionReview(route.split('/')[1]);else if(route==='reset')resetScreen();else if(route.startsWith('review'))review(route.split('/')[1]);else if(route.startsWith('verify'))verify(decodeURIComponent(route.split('/')[1]||''));else home();if(route!=='intake')editingId=null;updateNavigation(route);window.scrollTo(0,0)}
function updateNavigation(route){
  const section=route.startsWith('customs')?'customs':route.startsWith('immigration')?'immigration':route.startsWith('epay')?'epay':(route.startsWith('review')||route.startsWith('document-review/'))?'review':route.startsWith('verify')?'verify':route==='dashboard'||route==='intake'||route==='reset'||route.startsWith('submit/')||route.startsWith('visit/')||route.startsWith('document')?'dashboard':'home';
  document.querySelectorAll('nav a').forEach(link=>{
    if(link.getAttribute('href')==='#'+section)link.setAttribute('aria-current','page');
    else link.removeAttribute('aria-current');
  });
}
// Demo lifecycle: editable drafts never replace a submitted record until confirmed.
function clone(value){return JSON.parse(JSON.stringify(value))}
function addActivity(v,actor,action,note=''){
  v.history.unshift({at:new Date().toISOString(),actor,action,note,version:v.version||0});
}
function missingFields(data){
  const labels={name:'Yacht name',flag:'Flag',registration:'Registration',length:'Length',captain:'Captain name',email:'Captain email',arrival:'Arrival date',departure:'Departure date',port:'Arrival location',broker:'Broker / agency',authorisation:'Authority to act',vesselUse:'Vessel use'};
  const missing=Object.entries(labels).filter(([key])=>!String(data[key]||'').trim()).map(([,label])=>label);
  if(data.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))missing.push('Valid captain email');
  if(data.arrival&&data.departure&&data.departure<data.arrival)missing.push('Departure on or after arrival');
  for(const person of data.people||[])if(['name','role','nationality','dob','passport'].some(key=>!String(person[key]||'').trim())){missing.push('Complete details for each listed person');break}
  if(data.tonnage&&(Number(data.tonnage)<=0||!Number.isFinite(Number(data.tonnage))))missing.push('Positive registered tonnage');
  return missing;
}
function saveApplicationDraft(record,input){
  const fields=['name','flag','registration','length','captain','email','arrival','departure','port','people','files','broker','authorisation','response','vesselUse','tonnage','registryPort','owner','agentAddress','agentPhone','previousPort','nextPort','eta','activities','externalRef','cargo'];
  const data=Object.fromEntries(fields.filter(key=>input[key]!==undefined).map(key=>[key,input[key]]));
  if(!record){
    const id='demo-'+nextReference;
    record={...clone(data),id,reference:'HBR-DEMO-'+nextReference++,submitted:false,version:0,history:[],decisions:newProcesses(),payments:[],actualArrival:'',actualDeparture:'',departureStarted:false};
    visits.unshift(record);
  }
  record.draft=clone(data);
  if(record.submitted===false)Object.assign(record,clone(data));
  addActivity(record,data.broker||'Demo broker','Draft saved');
  return record;
}
function submitDraft(v){
  if(!v?.draft)return {ok:false,errors:['No saved draft to submit']};
  const errors=missingFields(v.draft);
  if(v.submitted&&!String(v.draft.response||'').trim())errors.push('Explain what changed');
  if(errors.length)return {ok:false,errors};
  const previous=v.submitted;
  const response=v.draft.response||'';
  Object.assign(v,clone(v.draft));delete v.draft;
  v.submitted=true;v.version=(v.version||0)+1;
  if(previous)v.decisions.forEach(d=>{d.needsReview=d.status!=='Pending'||d.applicability==='Not applicable'});
  addActivity(v,v.broker,previous?'Application resubmitted':'Application submitted',response);
  return {ok:true};
}
function correctionPanel(v){
  const requests=v.decisions.filter(d=>d.status==='Changes requested');
  if(!requests.length)return '';
  return `<section class="panel corrections"><h2>Corrections requested</h2>${requests.map(d=>`<div class="decision-block"><strong>${esc(d.title||d.department)}</strong><p>${esc(d.note)}</p></div>`).join('')}<p class="fine">Prepare an amendment, explain the changes, then review and resubmit. Saving a draft leaves the submitted record unchanged.</p></section>`;
}
function attentionRank(v){return overall(v)==='Changes requested'?0:v.submitted===false?1:2}
function nextAction(v){
 if(!v.submitted)return `Finish draft · ${missingFields(v.draft||v).length} items to check`;
 if(v.draft)return 'Review your saved amendment';
 const request=v.decisions.find(d=>d.status==='Changes requested');if(request)return `${request.title}: ${request.note}`;
 if(v.decisions.some(d=>d.needsReview))return 'Confirm which authority records need review after the amendment';
 if(!v.actualArrival)return 'Coordinate arrival reporting at Road Bay / Sandy Ground';
 if(!inwardComplete(v))return 'Await separate Customs and Immigration arrival outcomes';
 if(v.actualDeparture)return 'Departure recorded; retain authority records';
 if(v.departureStarted)return 'Complete separate outward-clearance tasks';
 return 'Confirm applicable permits, conditions and departure arrangements';
}
function actionQueue(){
  const actionable=visits.filter(v=>v.submitted===false||v.draft||['Changes requested','Review needed','Ready to report','Departure preparation'].includes(overall(v))).sort((a,b)=>attentionRank(a)-attentionRank(b));
  return `<section class="panel action-queue"><div class="section-head"><div><span class="eyebrow">Your next steps</span><h2>Needs your attention</h2></div><span class="muted">${actionable.length} applications</span></div>${actionable.length?actionable.map(v=>`<div class="queue-row"><div><strong>${esc(v.name||'Untitled yacht')}</strong><p>${esc(nextAction(v))}</p></div><a class="button secondary small" href="#visit/${v.id}">${v.submitted===false?'Continue draft':'View next step'}</a></div>`).join(''):'<p>No broker actions outstanding. Submitted applications remain with the departments for review.</p>'}</section>`;
}
function timeline(v){
  return `<ol class="timeline">${v.history.map(h=>typeof h==='string'?`<li>${esc(h)}</li>`:`<li><strong>${esc(h.action)}</strong><div class="fine">${esc(h.actor)} · ${h.version?'Version '+h.version:'Draft'} · <time datetime="${esc(h.at)}">${esc(new Date(h.at).toLocaleString())}</time></div>${h.note?`<p>${esc(h.note)}</p>`:''}${h.previousRecord?`<details><summary>Previous process record</summary><p>${esc(h.previousRecord.title)} · ${esc(h.previousRecord.status)} · ${esc(h.previousRecord.reference||'No reference')} · Version ${h.previousRecord.version}</p><p>${esc(h.previousRecord.note||'')}</p><p>${esc(h.previousRecord.from||'')} ${esc(h.previousRecord.until||'')} ${esc(h.previousRecord.conditions||'')}</p></details>`:''}</li>`).join('')}</ol>`;
}
function submissionReview(id){
  const v=visits.find(v=>v.id===id);
  if(!v?.draft){location.hash='visit/'+id;return}
  const data=v.draft;const errors=missingFields(data);
  if(v.submitted&&!String(data.response||'').trim())errors.push('Explain what changed');
  app.innerHTML=`<section class="workspace"><div class="form-shell">${demoNote}<span class="eyebrow">Broker review · Saved draft</span><h1>Review before submitting</h1><p>Check the details that departments will receive. ${v.submitted?'Submitting this amendment preserves earlier records and flags them for authority review. This conservative demo policy is not a verified legal rule.':'Each department will make its own decision.'}</p><section class="panel"><h2>${esc(data.name||'Untitled yacht')}</h2><div class="facts">${[['Broker',data.broker],['Authority to act',data.authorisation],['Flag',data.flag],['Registration',data.registration],['Length',data.length],['Use',data.vesselUse],['Registered tonnage',data.tonnage],['Port of registry',data.registryPort],['Owner',data.owner],['Agent address',data.agentAddress],['Agent telephone',data.agentPhone],['Previous port',data.previousPort],['Next destination',data.nextPort],['Expected arrival time',data.eta],['Activities',data.activities],['External notification',data.externalRef],['Cargo',data.cargo],['Captain',data.captain],['Email',data.email],['Arrival',data.arrival],['Departure',data.departure],['Arrival location',data.port]].map(([label,value])=>`<div><span>${label}</span><strong>${esc(value||'Not provided')}</strong></div>`).join('')}</div><h3>Crew and guests</h3>${data.people?.length?data.people.map(p=>`<p>${esc(p.name)} · ${esc(p.role)} · ${esc(p.nationality)}<br><small>Date of birth: ${esc(p.dob)} · Sample passport: ${esc(p.passport)}<br>Issuing country: ${esc(p.passportCountry||'Not supplied')} · Issue: ${esc(p.passportIssued||'Not supplied')} · Expiry: ${esc(p.passportExpiry||'Not supplied')}</small></p>`).join(''):'<p>No people listed. Confirm the illustrative manifest with the captain.</p>'}<h3>Sample documents</h3>${data.files?.length?`<ul>${data.files.map(f=>`<li>${esc(f)}</li>`).join('')}</ul>`:'<p>No filenames selected.</p>'}${data.response?`<h3>Broker response</h3><p>${esc(data.response)}</p>`:''}</section><section class="panel"><h2>${errors.length?'Complete these items':'Ready for demo review'}</h2>${errors.length?`<ul>${errors.map(e=>`<li>${esc(e)}</li>`).join('')}</ul>`:'<p>The illustrative demo checks are complete. This is not an official completeness assessment.</p>'}<p class="fine">Requirements are illustrative and must be confirmed with departments. Document content is not uploaded.</p><div class="actions"><button id="confirm-submit" ${errors.length?'disabled':''}>${v.submitted?'Resubmit for review':'Submit for review'}</button><button class="secondary" id="back-edit">Edit draft</button><a href="#visit/${v.id}">Back to application</a></div></section></div></section>`;
  document.querySelector('#back-edit').onclick=()=>{editingId=id;location.hash='intake'};
  document.querySelector('#confirm-submit').onclick=()=>{
    const result=submitDraft(v);
    if(!result.ok){submissionReview(id);toast(result.errors.join('; '));return}
    location.hash='visit/'+id;toast('Application submitted for independent departmental review');
  };
}
function resetDemo(){
  visits.splice(0,visits.length,...clone(initialDemo));
  filter='All';query='';editingId=null;nextReference=1004;
}
function resetScreen(){
  app.innerHTML=`<section class="workspace"><div class="form-shell"><section class="panel"><span class="eyebrow">Presentation controls</span><h1>Reset the demo?</h1><p>This clears this session’s fictional drafts, decisions and activity and restores the four presentation examples. Session changes cannot be recovered.</p><div class="actions"><button id="confirm-reset">Reset demo</button><a class="button secondary" href="#dashboard">Keep current session</a></div></section></div></section>`;
  document.querySelector('#confirm-reset').onclick=()=>{resetDemo();location.hash='dashboard';toast('Demo examples restored')};
}
const processDefinitions=[
 {key:'customs-in',title:'Customs inward clearance',department:'Customs',fixed:true},
 {key:'immigration-in',title:'Immigration arrival review',department:'Immigration',fixed:true},
 {key:'cruising',title:'Cruising permission',department:'Customs',permit:true},
 {key:'marine',title:'Marine-park mooring permission',department:'Natural Resources',permit:true},
 {key:'tax',title:'Tax / business licensing',department:'Inland Revenue'},
 {key:'customs-out',title:'Customs outward clearance',department:'Customs',fixed:true},
 {key:'immigration-out',title:'Immigration departure review',department:'Immigration',fixed:true}
];
function newProcesses(){return processDefinitions.map(d=>({...d,applicability:d.fixed?'Required':'Unconfirmed',status:'Pending',reference:'',note:'',conditions:'',from:'',until:'',version:0,needsReview:false}))}
function currentRecord(d){return d.status==='Recorded'&&!d.needsReview&&d.applicability==='Required'}
function inwardComplete(v){return ['customs-in','immigration-in'].every(key=>currentRecord(v.decisions.find(d=>d.key===key)))}
function outwardComplete(v){return ['customs-out','immigration-out'].every(key=>currentRecord(v.decisions.find(d=>d.key===key)))}
function overall(v){
 if(!v.submitted)return 'Draft';
 if(v.decisions.some(d=>d.status==='Changes requested'))return 'Changes requested';
 if(v.decisions.some(d=>d.needsReview||d.status==='Cancelled'||d.status==='Rejected'))return 'Review needed';
 if(v.actualDeparture)return 'Departed';
 if(v.departureStarted)return 'Departure preparation';
 if(!v.actualArrival)return 'Ready to report';
 return inwardComplete(v)?'Stay management':'Arrival processing';
}
function processValidity(d,today=new Date().toISOString()){
 if(d.applicability==='Not applicable')return 'Not applicable';
 if(d.status==='Cancelled')return 'Cancelled';
 if(d.needsReview)return 'Review needed';
 if(d.status!=='Recorded')return 'Not recorded';
 if(!d.from||!d.until)return 'No validity window recorded';
 const now=Date.parse(today.length===10?today+'T12:00:00-04:00':today);
 const start=Date.parse(d.from+(d.key==='cruising'?'T09:00:00-04:00':'T00:00:00-04:00'));
 const end=Date.parse(d.until+'T23:59:59.999-04:00');
 return now<start?'Not yet valid':now>end?'Expired':'Within recorded dates';
}
function setProcessRecord(v,key,data){
 const d=v.decisions.find(p=>p.key===key);const errors=[];
 if(!v.submitted||!d)return {ok:false,errors:['Select a submitted visit and process']};
 if(!['Required','Unconfirmed','Not applicable'].includes(data.applicability))errors.push('Select applicability');
 if(d.fixed&&data.applicability!=='Required')errors.push('Arrival and departure review remain required in this demo');
 if(!['Pending','Recorded','Changes requested','Rejected','Cancelled'].includes(data.status))errors.push('Select a process status');
 if(!data.actor?.trim()||!data.note?.trim())errors.push('Enter officer name and reason');
 if(data.applicability==='Not applicable'&&!data.reference?.trim())errors.push('Enter the applicability confirmation reference');
 if(data.status==='Recorded'){
  if(data.applicability!=='Required')errors.push('Confirm applicability before recording an outcome');
  if(!data.reference?.trim())errors.push('Enter the authority reference');
  if(d.permit&&(!data.from||!data.until||data.until<data.from))errors.push('Enter a valid permit date window');
  if(key==='marine'&&!inwardComplete(v))errors.push('Current Customs and Immigration clearance records are needed before marine-park permission');
  if(d.status==='Cancelled'&&(data.reference||'').trim()===d.reference)errors.push('A cancelled record requires a new reference for reissue');
 }
 if(d.status==='Cancelled'&&data.applicability==='Not applicable')errors.push('Cancellation must remain visible; not applicable cannot restore the record');
 if(d.status==='Cancelled'&&data.status!=='Cancelled'&&data.status!=='Recorded')errors.push('Keep cancellation or record a reissue with a new reference');
 if(data.from&&data.until&&data.until<data.from)errors.push('End date must not precede start date');
 if(errors.length)return {ok:false,errors};
 const previous=clone(d);
 d.revision=(d.revision||0)+1;
 if(data.status==='Cancelled')(v.issuedDocuments||[]).filter(doc=>doc.reference===d.reference&&docProcess(doc.type)===key).forEach(doc=>{doc.cancelledAt=new Date().toISOString()});
 Object.assign(d,{applicability:data.applicability,status:data.status,officer:data.actor.trim(),note:data.note.trim(),reference:(data.reference||'').trim(),conditions:(data.conditions||'').trim(),from:data.from||'',until:data.until||'',version:v.version,needsReview:false,time:new Date().toLocaleString()});
 if(data.applicability==='Not applicable')d.status='Pending';
 addActivity(v,d.officer,`${d.title}: ${data.applicability==='Not applicable'?'Not applicable confirmed':d.status}`,d.note);
 v.history[0].previousRecord=previous;v.history[0].process=key;
 return {ok:true};
}
function recordPayment(v,data){
 const errors=[];
 if(!data.authority?.trim()||!data.purpose?.trim()||!data.receipt?.trim()||!data.assessed)errors.push('Enter authority, purpose, assessment date and receipt');
 if(!Number.isFinite(Number(data.amount))||Number(data.amount)<=0)errors.push('Enter a positive amount');
 if(!['XCD','USD','EUR','GBP'].includes(data.currency))errors.push('Select a currency');
 if(errors.length)return {ok:false,errors};
 v.payments.push({authority:data.authority.trim(),purpose:data.purpose.trim(),amount:Number(data.amount),currency:data.currency,receipt:data.receipt.trim(),assessed:data.assessed,source:'Broker-recorded receipt'});
 addActivity(v,v.broker,'Receipt recorded',`${data.authority}: ${data.purpose} — ${data.amount} ${data.currency}. Does not grant clearance.`);
 return {ok:true};
}
function recordMovement(v,data){
 const errors=[];
 if(data.actualDeparture&&(!data.actualArrival||data.actualDeparture<data.actualArrival))errors.push('Departure must follow the reported arrival');
 if(data.actualDeparture&&(!inwardComplete(v)||!outwardComplete(v)))errors.push('Record current inward and outward outcomes before completing departure');
 if(errors.length)return {ok:false,errors};
 Object.assign(v,{actualArrival:data.actualArrival||'',actualDeparture:data.actualDeparture||'',departureStarted:data.departureStarted==='Yes'||Boolean(data.actualDeparture)});
 addActivity(v,v.broker,'Visit movement updated','Broker-reported movement; this does not issue any authority permission.');return {ok:true};
}
function processRows(v,publicView=false){return v.decisions.map(d=>`<article class="decision-block"><div class="decision-line"><strong>${esc(d.title)}</strong><span class="badge ${d.needsReview?'':statusClass(d.status)}">${d.needsReview?'Review needed':d.applicability==='Not applicable'?'Not applicable':d.applicability==='Unconfirmed'?'Applicability unconfirmed':d.status}</span></div><p class="fine">${esc(d.department)} · ${esc(d.applicability)} · ${d.reference?'Reference '+esc(d.reference):'No authority reference'}</p>${d.permit?`<p>Validity: ${esc(processValidity(d))}${d.from&&d.until?` · ${esc(d.from)} to ${esc(d.until)}${d.key==='cruising'?' · 09:00 start / end-of-day expiry, Anguilla':''}`:''}</p>`:''}${d.conditions?`<p>Scope / conditions: ${esc(d.conditions)}</p>`:''}${!publicView&&d.note?`<p>${esc(d.note)}</p>`:''}${!publicView&&d.officer?`<p class="fine">${esc(d.officer)} · Submitted version ${d.version}</p>`:''}</article>`).join('')}
function selectField(label,name,options,value='',required=false){return `<div><label for="${name}">${label}</label><select id="${name}" name="${name}" ${required?'required':''}>${options.map(option=>`<option value="${esc(option)}" ${option===value?'selected':''}>${esc(option||'Select an option')}</option>`).join('')}</select></div>`}
function processIntake(v={}){return `<section class="panel"><h2>Voyage and permit planning</h2><p class="fine">Used to prepare the broker checklist. Applicability, current fees and reporting requirements need authority confirmation.</p><div class="form-grid">${selectField('Vessel use','vesselUse',['','Private leisure','Charter','Other commercial'],v.vesselUse,true)}${selectField('Carrying cargo?','cargo',['Unconfirmed','No','Yes'],v.cargo)}${field('Registered tonnage','tonnage',v.tonnage,'number',false)}${field('Port of registry','registryPort',v.registryPort,'text',false)}${field('Owner name','owner',v.owner,'text',false)}${field('Agent address','agentAddress',v.agentAddress,'text',false)}${field('Agent telephone','agentPhone',v.agentPhone,'tel',false)}${field('Previous port','previousPort',v.previousPort,'text',false)}${field('Next destination','nextPort',v.nextPort,'text',false)}${field('Expected arrival time (Anguilla)','eta',v.eta,'time',false)}${field('Planned anchorages / activities','activities',v.activities,'text',false)}${field('External notification reference (optional)','externalRef',v.externalRef,'text',false)}</div><p class="fine">SailClear availability in Anguilla is unconfirmed. A notification is not clearance. Cargo and commercial cases require manual confirmation.</p></section>`}
function operations(v){return `<section class="panel" style="margin-top:25px"><h2>Arrival and departure</h2><p>Coordinate reporting at Road Bay / Sandy Ground. Captain attendance and current procedures must be confirmed with authorities.</p><p class="fine">Broker-reported events are separate from authority decisions. Times below are Anguilla local time.</p><form id="movementform"><div class="form-grid">${field('Actual arrival','actualArrival',v.actualArrival,'datetime-local',false)}${selectField('Preparing departure?','departureStarted',['No','Yes'],v.departureStarted?'Yes':'No')}${field('Actual departure','actualDeparture',v.actualDeparture,'datetime-local',false)}</div><p class="fine">Before completing departure: record arrival, inward clearance outcomes, Customs outward clearance and Immigration departure review. Other applicable permit conditions remain separate.</p><button>Save movement</button><p id="movement-error" role="alert"></p></form></section><section class="panel" style="margin-top:25px"><h2>Assessments and receipts</h2><p class="fine">Manually record authority-assessed amounts. No automatic fee calculation. Payment never grants clearance or issues a permit.</p>${v.payments.length?v.payments.map(p=>`<p><strong>${esc(p.purpose)} · ${esc(p.amount)} ${esc(p.currency)}</strong><br>${esc(p.authority)} · ${esc(p.assessed)} · Receipt ${esc(p.receipt)}<br><small>${esc(p.source)}</small></p>`).join(''):'<p>No receipts recorded.</p>'}<form id="paymentform"><div class="form-grid">${field('Assessing authority','authority')}${field('Purpose','purpose')}${field('Assessed amount','amount','','number')}${selectField('Currency','currency',['','XCD','USD','EUR','GBP'],'',true)}${field('Assessment date','assessed','','date')}${field('Receipt reference','receipt')}</div><div class="actions"><button>Record receipt</button></div><p id="payment-error" role="alert"></p></form></section>`}
function bindOperations(v){
 document.querySelector('#movementform').onsubmit=e=>{e.preventDefault();const result=recordMovement(v,Object.fromEntries(new FormData(e.target)));if(result.ok){detail(v.id);toast('Broker movement recorded')}else document.querySelector('#movement-error').textContent=result.errors.join('. ')};
 document.querySelector('#paymentform').onsubmit=e=>{e.preventDefault();const result=recordPayment(v,Object.fromEntries(new FormData(e.target)));if(result.ok){detail(v.id);toast('Receipt recorded separately from permissions')}else document.querySelector('#payment-error').textContent=result.errors.join('. ')};
}

let nextReference=1004;
visits.forEach((v,i)=>{
 v.submitted=i!==1;v.version=i===1?0:1;v.history=[];v.decisions=newProcesses();v.payments=[];documentStore(v);
 v.vesselUse=i===0?'Charter':'Private leisure';v.cargo='No';v.tonnage=['250','480','150'][i];v.registryPort=['George Town','Majuro','London'][i];v.owner='Fictional yacht owner';v.agentAddress='Sample address, Anguilla';v.agentPhone='';v.activities=i===0?'Sandy Island visit — permit applicability to confirm':'Road Bay stay';v.actualArrival='';v.actualDeparture='';v.departureStarted=false;
 if(i===2)v.decisions.filter(d=>d.key.endsWith('-in')).forEach(d=>Object.assign(d,{status:'Recorded',reference:'DEMO-'+d.key.toUpperCase(),officer:'Demo officer',version:1,note:'Fictional arrival outcome; not a blanket permission.'}));
 if(i===0)Object.assign(v.decisions[0],{status:'Changes requested',note:'Please confirm the registered tonnage and intended anchorages.',officer:'Demo Customs officer',version:1});
 addActivity(v,v.broker,v.submitted?'Sample visit submitted':'Draft saved');
});
visits[1].registration='';visits[1].files=[];
visits[1].draft=clone(Object.fromEntries(['name','flag','registration','length','captain','email','arrival','departure','port','people','files','broker','authorisation','vesselUse','tonnage','cargo'].map(key=>[key,visits[1][key]])));
seedGovernmentDemo();
const initialDemo=clone(visits);
window.addEventListener('hashchange',render);
render();
