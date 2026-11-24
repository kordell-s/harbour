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
function clearancePaper(d,status){
 const {arrival,arrivalPort,departedAtIssue,prerequisites,crew,passengers,visitReference}=d.clearance;
 const a=d.data;
 const voyage=clearanceFacts([['Reported entry date',arrival.slice(0,10)],['Entry port',arrivalPort],['Departure port',a.clearancePort],['Scheduled departure date',a.departureDate],['Scheduled departure time',a.departureTime],['Destination',[a.nextPort,a.destinationCountry].join(', ')],['Reported departure',departedAtIssue.replace('T',' ')]]);
 const vessel=clearanceFacts([['Vessel name',a.name],['Flag / country',a.flag],['Registration number',a.registration],['Port of registry',a.registryPort],['Length overall',a.length],['Tonnage',a.tonnage],['Tonnage measure',a.tonnageType],['Construction',a.construction],['Vessel use',a.vesselUse],['Vessel description',a.description],['Propulsion',a.propulsion],['Rig',a.rig],['Colour',a.colour],['Master / captain',a.captain]]);
 const owner=clearanceFacts([['Vessel name',a.name],['First / given names',a.ownerGivenName],['Family name or legal entity',a.ownerFamilyName],['Capacity / company',a.ownerCapacity],['Address',a.ownerAddress],['Country of residence',a.ownerResidence]]);
 const issue=clearanceFacts([['Customs outward reference',d.reference],['Issuing officer (simulated)',d.officer],['Issue date and port',`${d.issueDate} · ${d.issuePlace}`],...prerequisites.map(p=>[p.title,p.reference]),['Scope / conditions',d.conditions]]);
 return `<article class="paper-document clearance-paper"><div class="clearance-heading"><div><p class="clearance-jurisdiction">Anguilla</p><h2>Yacht outward clearance</h2><p class="clearance-subtitle">Customs &amp; Immigration · Proposed combined format</p></div><strong class="clearance-demo">Fictional demo<br>No legal validity</strong></div><div class="clearance-identifiers"><span><strong>${esc(d.reference)}</strong> · ${esc(visitReference)} · Visit version ${d.visitVersion}</span><span>Copy status: <strong>${esc(status)}</strong></span></div>${clearanceSection('01','Entry &amp; departure',voyage+'<p class="clearance-detail">All times are Anguilla local time. Scheduled departure is separate from actual movement.</p>')}${clearanceSection('02','Vessel',vessel)}${clearanceSection('03','Owner',owner)}${clearanceSection('04',`Crew · ${crew.length}`,clearancePeople(crew,true))}${clearanceSection('05',`Passengers · ${passengers.length}`,clearancePeople(passengers,false))}${clearanceSection('06','Issuance &amp; departmental references',issue)}<p class="clearance-footer">Private demo copy. Contains manifest information. No official seal or signature. No permit or additional permission is granted by this copy.</p></article>`;
}

// Shared by the application view and the offline printable HTML.
const clearancePaperCss=`
.clearance-paper{box-sizing:border-box;max-width:940px;margin:0 auto;padding:32px;border:1px solid #c7d8d3;border-radius:12px;background:#fff;color:#183334;font:14px/1.4 Arial,sans-serif;overflow-wrap:anywhere}
.clearance-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:12px 24px;flex-wrap:wrap;border-bottom:2px solid #00686b;padding-bottom:12px}
.clearance-heading h2{margin:2px 0;font-size:clamp(23px,5vw,36px);line-height:1.1}
.clearance-jurisdiction{margin:0;text-transform:uppercase;letter-spacing:.14em;font-weight:700;font-size:.9em;color:#00686b}
.clearance-subtitle,.clearance-detail,.clearance-empty{margin:4px 0 0;color:#425c59}
.clearance-demo{border:1px solid #926b35;color:#63451c;padding:5px 9px;text-transform:uppercase;font-size:.78em;letter-spacing:.06em;line-height:1.35}
.clearance-identifiers{display:flex;justify-content:space-between;gap:6px 18px;flex-wrap:wrap;padding:8px 0;border-bottom:1px solid #c7d8d3;font-size:.87em}
.clearance-section{margin-top:14px}
.clearance-section h3{margin:0 0 6px;border-bottom:1px solid #c7d8d3;padding:0 0 4px;text-transform:uppercase;font-size:.91em;letter-spacing:.06em;color:#173d3b}
.clearance-section h3 span{color:#00686b;margin-right:4px}
.clearance-facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px 14px;margin:0}
.clearance-facts dt{font-size:.84em;color:#425c59}
.clearance-facts dd{font-weight:700;margin:0}
.clearance-detail,.clearance-footer{font-size:.81em}
.clearance-table-frame{overflow:auto}
.clearance-table{border-collapse:collapse;width:100%;min-width:520px;font-size:.9em;line-height:1.3}
.clearance-table th,.clearance-table td{border:1px solid #afc4be;padding:5px 7px;text-align:left;vertical-align:top}
.clearance-table th{background:#edf5f2;color:#173d3b}
.clearance-footer{border-top:1px solid #c7d8d3;margin-top:14px;padding-top:6px;color:#425c59}
@media screen and (max-width:600px){.clearance-paper{padding:16px}.clearance-facts{grid-template-columns:repeat(2,minmax(0,1fr))}}
@page harbour-clearance{size:A4 portrait;margin:12mm}
@media print{
.clearance-paper{page:harbour-clearance;border:0;border-radius:0;padding:0;margin:0;max-width:none;font-size:9.5pt}
.clearance-heading{padding-bottom:8px}
.clearance-heading h2{font-size:23pt}
.clearance-section{margin-top:9px}
.clearance-facts{gap:4px 12px}
.clearance-footer{margin:8px 0 0}
.clearance-section h3{break-after:avoid}
.clearance-section .clearance-facts>div,.clearance-heading,.clearance-table tr,.clearance-footer{break-inside:avoid}
.clearance-table-frame{overflow:visible}
.clearance-table{min-width:0}
.clearance-table thead{display:table-header-group}
}
`;
function clearancePrintableHtml(d,status){
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Harbour · Fictional outward clearance</title><style>body{margin:24px;background:#f5f8f7}@media print{body{margin:0;background:white}}${clearancePaperCss}</style></head><body>${clearancePaper(d,status)}</body></html>`;
}
