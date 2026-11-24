// Combined fictional outward-clearance copy. No authority notes or real stamps are exported.
const clearanceOwnerFields={
 ownerGivenName:'Owner first / given names',
 ownerFamilyName:'Owner family name or legal entity',
 ownerCapacity:'Capacity / company',
 ownerResidence:'Country of residence'
};
const clearanceDepartureFields={departureDate:'Scheduled departure date',departureTime:'Scheduled departure time (Anguilla local time)'};
const clearancePrerequisites=['customs-in','immigration-in','immigration-out'];

function clearanceSkipperOptions(v,data){
 const crew=(v.people||[]).flatMap((p,index)=>p.role==='Crew'?[[String(index),withFullName(p).name||`Crew member ${index+1}`]]:[]);
 return `<div><label for="skipperIndex">Skipper on submitted crew list</label><select id="skipperIndex" name="skipperIndex"><option value="">Select skipper</option>${crew.map(([id,name])=>`<option value="${id}" ${data.skipperIndex===id?'selected':''}>${esc(name)}</option>`).join('')}</select></div>`;
}

function clearanceManifest(v,data){
 const people=(v.people||[]).map((p,index)=>{
  const {surname,givenNames}=personNames(p);
  return {role:p.role,surname,givenNames,dob:p.dob,placeOfBirth:p.placeOfBirth,passport:p.passport,nationality:p.nationality,skipper:String(index)===data.skipperIndex};
 });
 const crew=people.filter(p=>p.role==='Crew'), passengers=people.filter(p=>p.role==='Guest');
 const errors=[];
 if(people.length!==crew.length+passengers.length)errors.push('Assign each person to crew or passengers in the visit');
 if(crew.length!==Number(data.crewCount)||passengers.length!==Number(data.guestCount))errors.push('Headcounts must match the submitted manifest');
 if(!crew.some(p=>p.skipper))errors.push('Select the skipper from the submitted crew list');
 people.forEach((p,index)=>{
  const fields=[['Family name',p.surname],['First / given names',p.givenNames],['Place of birth',p.placeOfBirth],['Passport number',p.passport],['Nationality',p.nationality]];
  const missing=fields.filter(([,value])=>!String(value??'').trim()).map(([label])=>label);
  if(!validDate(p.dob))missing.push('Valid date of birth');
  if(missing.length)errors.push(`Manifest row ${index+1}: ${missing.join(', ')}`);
 });
 return {crew,passengers,errors};
}

function clearanceReadiness(v,request){
 const errors=[];
 const checks=clearancePrerequisites.map(key=>v.decisions.find(p=>p.key===key));
 for(const decision of checks){
  if(!currentRecord(decision)||decision.version!==v.version)errors.push(`Record current ${decision.title} before issuing the combined copy`);
 }
 const arrival=v.actualArrival||'';
 const departure=`${request.data.departureDate}T${request.data.departureTime}`;
 if(!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/.test(arrival)||!validDate(arrival.slice(0,10)))errors.push('Record the reported entry date and time on the visit');
 else if(departure<=arrival)errors.push('Scheduled departure must be after reported entry');
 return {errors,arrival,departedAtIssue:v.actualDeparture||'',prerequisites:checks.map(({key,title,reference,revision})=>({key,title,reference,revision}))};
}

function clearanceFacts(fields){
 return `<dl class="clearance-facts">${fields.filter(([,value])=>value!==''&&value!=null).map(([name,value])=>`<div><dt>${esc(name)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>`;
}
function clearanceSection(number,title,body){
 return `<section class="clearance-section"><h3><span>${number}</span> ${title}</h3>${body}</section>`;
}
function clearancePeople(rows,crew){
 if(!rows.length)return `<p class="clearance-empty">No ${crew?'crew':'passengers'} recorded.</p>`;
 const columns=['Family name','First / given names',...(crew?['Skipper']:[]),'Date and place of birth','Passport number','Nationality'];
 return `<div class="clearance-table-frame" role="region" aria-label="${crew?'Crew table':'Passenger table'}" tabindex="0"><table class="clearance-table" aria-label="${crew?'Crew details':'Passenger details'}"><thead><tr>${columns.map(name=>`<th scope="col">${name}</th>`).join('')}</tr></thead><tbody>${rows.map(p=>`<tr><td>${esc(p.surname)}</td><td>${esc(p.givenNames)}</td>${crew?`<td>${p.skipper?'<strong>Yes</strong>':'—'}</td>`:''}<td><span>${esc(p.dob)}</span><br>${esc(p.placeOfBirth)}</td><td>${esc(p.passport)}</td><td>${esc(p.nationality)}</td></tr>`).join('')}</tbody></table></div>`;
}
// Formal masthead: jurisdiction and departments, form title, and a box for the document's own numbers.
// Deliberately no crest, seal or government branding: this is a proposed format, not an official form.
function clearanceMasthead(d){
 return `<div class="clearance-masthead"><div class="clearance-authority"><p class="clearance-jurisdiction">Anguilla</p><p class="clearance-departments">Customs<br>Immigration</p></div><div class="clearance-title"><p class="clearance-form-no">Proposed form HBR-OC</p><h2>Yacht Outward Clearance</h2><p class="clearance-subtitle">Vessel, crew and passenger clearance for departure</p></div><dl class="clearance-docbox"><div><dt>Clearance no.</dt><dd>${esc(d.reference)}</dd></div><div><dt>Date of issue</dt><dd>${esc(d.issueDate||'—')}</dd></div><div><dt>Port of issue</dt><dd>${esc(d.issuePlace||'—')}</dd></div></dl></div><p class="clearance-band">Proposed format · Fictional demo · No legal validity</p>`;
}
function clearanceSignatures(d){
 return `<div class="clearance-signatures"><div><span>Customs officer</span><strong>${esc(d.officer||'')}</strong><em>Signature</em></div><div><span>Immigration officer</span><strong></strong><em>Signature</em></div><div class="clearance-stamp"><span>Official stamp</span></div></div>`;
}
function clearancePaper(d,status){
 const {arrival,arrivalPort,departedAtIssue,prerequisites,crew,passengers,visitReference}=d.clearance;
 const a=d.data;
 const voyage=clearanceFacts([['Reported entry date',arrival.slice(0,10)],['Entry port',arrivalPort],['Departure port',a.clearancePort],['Scheduled departure date',a.departureDate],['Scheduled departure time',a.departureTime],['Destination',[a.nextPort,a.destinationCountry].join(', ')],['Reported departure',departedAtIssue.replace('T',' ')]]);
 const vessel=clearanceFacts([['Vessel name',a.name],['Flag / country',a.flag],['Registration number',a.registration],['Port of registry',a.registryPort],['Length overall',a.length],['Tonnage',a.tonnage],['Tonnage measure',a.tonnageType],['Construction',a.construction],['Vessel use',a.vesselUse],['Vessel description',a.description],['Propulsion',a.propulsion],['Rig',a.rig],['Colour',a.colour],['Master / captain',a.captain]]);
 const owner=clearanceFacts([['Vessel name',a.name],['First / given names',a.ownerGivenName],['Family name or legal entity',a.ownerFamilyName],['Capacity / company',a.ownerCapacity],['Address',a.ownerAddress],['Country of residence',a.ownerResidence]]);
 const issue=clearanceFacts([['Customs outward reference',d.reference],['Issuing officer (simulated)',d.officer],['Issue date and port',[d.issueDate,d.issuePlace].filter(Boolean).join(' · ')],...prerequisites.map(p=>[p.title,p.reference]),['Scope / conditions',d.conditions]]);
 return `<article class="paper-document clearance-paper"><div class="clearance-watermark" aria-hidden="true">Specimen</div>${clearanceMasthead(d)}<div class="clearance-identifiers"><span><strong>${esc(d.reference)}</strong> · ${esc(visitReference)} · Visit version ${d.visitVersion}</span><span>Copy status: <strong>${esc(status)}</strong></span></div>${clearanceSection('01','Entry &amp; departure',voyage+'<p class="clearance-detail">All times are Anguilla local time. Scheduled departure is separate from actual movement.</p>')}${clearanceSection('02','Vessel',vessel)}${clearanceSection('03','Owner',owner)}${clearanceSection('04',`Crew · ${crew.length}`,clearancePeople(crew,true))}${clearanceSection('05',`Passengers · ${passengers.length}`,clearancePeople(passengers,false))}${clearanceSection('06','Issuance &amp; departmental references',issue)}${clearanceSignatures(d)}<p class="clearance-footer">Private demo copy. Contains manifest information. No official seal or signature. No permit or additional permission is granted by this copy.</p></article>`;
}

// Shared by the application view and the offline printable HTML.
const clearancePaperCss=`
.clearance-paper{position:relative;overflow:hidden;box-sizing:border-box;max-width:940px;margin:0 auto;padding:32px;border:1px solid #c7d8d3;border-radius:4px;background:#fff;color:#1b2b2c;font:14px/1.4 Arial,sans-serif;overflow-wrap:anywhere}
.clearance-paper>*{position:relative}
.clearance-watermark{position:absolute!important;top:38%;left:50%;transform:translate(-50%,-50%) rotate(-24deg);font:700 120px/1 Georgia,'Times New Roman',serif;letter-spacing:.12em;text-transform:uppercase;color:#1b2b2c;opacity:.045;pointer-events:none;white-space:nowrap}
.clearance-masthead{display:grid;grid-template-columns:minmax(120px,1fr) minmax(0,2.2fr) minmax(170px,1fr);align-items:center;gap:16px;padding-bottom:14px;border-bottom:3px double #1b2b2c}
.clearance-jurisdiction{margin:0;font:700 1.15em/1.1 Georgia,'Times New Roman',serif;letter-spacing:.22em;text-transform:uppercase}
.clearance-departments{margin:6px 0 0;padding-top:6px;border-top:1px solid #1b2b2c;font-size:.78em;letter-spacing:.14em;text-transform:uppercase;line-height:1.5;color:#33494a}
.clearance-title{text-align:center}
.clearance-form-no{margin:0 0 4px;font-size:.72em;letter-spacing:.16em;text-transform:uppercase;color:#53696a}
.clearance-title h2{margin:0;font:700 clamp(22px,4.4vw,32px)/1.1 Georgia,'Times New Roman',serif;letter-spacing:.04em;text-transform:uppercase}
.clearance-subtitle,.clearance-detail,.clearance-empty{margin:5px 0 0;color:#425c59}
.clearance-docbox{margin:0;border:1.5px solid #1b2b2c}
.clearance-docbox div{display:flex;justify-content:space-between;gap:10px;padding:4px 8px;border-top:1px solid #1b2b2c}.clearance-docbox div:first-child{border-top:0}
.clearance-docbox dt{font-size:.72em;letter-spacing:.06em;text-transform:uppercase;color:#53696a;align-self:center}
.clearance-docbox dd{margin:0;font-weight:700;font-family:Menlo,Consolas,monospace;font-size:.92em;text-align:right}
.clearance-band{margin:6px 0 0;padding:3px 0;text-align:center;font-size:.7em;letter-spacing:.2em;text-transform:uppercase;color:#7a5a24;border-bottom:1px solid #c7d8d3}
.clearance-signatures{display:grid;grid-template-columns:1fr 1fr minmax(130px,.8fr);gap:18px;margin-top:22px;break-inside:avoid}
.clearance-signatures>div{display:flex;flex-direction:column;gap:3px;min-height:86px}
.clearance-signatures span{font-size:.72em;letter-spacing:.08em;text-transform:uppercase;color:#53696a}
.clearance-signatures strong{min-height:1.2em}
.clearance-signatures em{margin-top:auto;padding-top:4px;border-top:1px solid #1b2b2c;font-style:normal;font-size:.72em;color:#53696a}
.clearance-stamp{border:1.5px dashed #9fb2b0;border-radius:50%;align-items:center;justify-content:center;text-align:center}
.clearance-identifiers{display:flex;justify-content:space-between;gap:6px 18px;flex-wrap:wrap;padding:8px 0;border-bottom:1px solid #c7d8d3;font-size:.87em}
.clearance-section{margin-top:14px}
.clearance-section h3{margin:0 0 6px;padding:4px 8px;background:#1b2b2c;color:#fff;text-transform:uppercase;font-size:.84em;letter-spacing:.1em}
.clearance-section h3 span{display:inline-block;min-width:1.8em;color:#b9d8d1;margin-right:4px}
.clearance-facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px 14px;margin:0}
.clearance-facts dt{font-size:.84em;color:#425c59}
.clearance-facts dd{font-weight:700;margin:0}
.clearance-detail,.clearance-footer{font-size:.81em}
.clearance-table-frame{overflow:auto}
.clearance-table{border-collapse:collapse;width:100%;min-width:520px;font-size:.9em;line-height:1.3}
.clearance-table th,.clearance-table td{border:1px solid #afc4be;padding:5px 7px;text-align:left;vertical-align:top}
.clearance-table th{background:#eef2f1;color:#1b2b2c;font-size:.86em;text-transform:uppercase;letter-spacing:.04em}
.clearance-footer{border-top:1px solid #c7d8d3;margin-top:14px;padding-top:6px;color:#425c59}
@media screen and (max-width:700px){.clearance-paper{padding:16px}.clearance-facts{grid-template-columns:repeat(2,minmax(0,1fr))}.clearance-masthead{grid-template-columns:1fr}.clearance-title{text-align:left;order:-1}.clearance-watermark{font-size:64px}.clearance-signatures{grid-template-columns:1fr 1fr}.clearance-stamp{grid-column:1/-1;min-height:70px!important;border-radius:12px}}
@page harbour-clearance{size:A4 portrait;margin:12mm}
@media print{
.clearance-paper{page:harbour-clearance;border:0;border-radius:0;padding:0;margin:0;max-width:none;font-size:9.5pt}
.clearance-masthead{padding-bottom:8px}
.clearance-title h2{font-size:19pt}
.clearance-watermark{font-size:110pt}
.clearance-section{margin-top:9px}
.clearance-facts{gap:4px 12px}
.clearance-footer{margin:8px 0 0}
.clearance-section h3{break-after:avoid}
.clearance-section .clearance-facts>div,.clearance-masthead,.clearance-table tr,.clearance-footer,.clearance-signatures{break-inside:avoid}
.clearance-section h3,.clearance-table th{-webkit-print-color-adjust:exact;print-color-adjust:exact}
.clearance-table-frame{overflow:visible}
.clearance-table{min-width:0}
.clearance-table thead{display:table-header-group}
}
`;
function clearancePrintableHtml(d,status){
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Harbour · Fictional outward clearance</title><style>body{margin:24px;background:#f5f8f7}@media print{body{margin:0;background:white}}${clearancePaperCss}</style></head><body>${clearancePaper(d,status)}</body></html>`;
}

function clearancePreview(id){
 const v=visits.find(x=>x.id===id);if(!v){location.hash='dashboard';return}documentStore(v);
 const r=latestRequest(v,'clearance'),draft=v.documentDrafts.clearance,data={...(draft||r?.data||documentDefaults(v))};
 if(!data.skipperIndex)data.skipperIndex=sampleSkipperIndex(v);
 const {crew,passengers}=clearanceManifest(v,data);
 const d={reference:'PREVIEW',issueDate:'',issuePlace:data.clearancePort||v.port||'',officer:'',conditions:'',visitVersion:v.version,data,clearance:{arrival:v.actualArrival||'',arrivalPort:v.port||'',departedAtIssue:'',visitReference:v.reference,crew,passengers,prerequisites:clearancePrerequisites.map(key=>{const p=v.decisions.find(x=>x.key===key);return {title:p.title,reference:currentRecord(p)?p.reference:'Not yet recorded'}})}};
 app.innerHTML=`<section class="workspace document-page"><div class="no-print"><a href="#documents/${v.id}/clearance">Back to outward clearance</a><div class="pagehead"><div><span class="eyebrow">${esc(v.name)} · ${esc(v.reference)}</span><h1>Preview of the finished clearance</h1><p>Built from the details entered so far${draft?' in the saved draft':r?' in the submitted request':''}. Nothing is issued or recorded. Customs and Immigration complete the issued copy.</p></div><div class="actions"><button id="print-preview">Print / save as PDF</button></div></div></div><style>${clearancePaperCss}</style>${clearancePaper(d,'Preview · not issued')}</section>`;
 document.querySelector('#print-preview').onclick=()=>window.print();
}
