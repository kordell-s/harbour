// Crew and passenger lists generated from the visit's manifest, laid out after IMO FAL Forms 5 and 6.
// Fictional demo documents only; they are not official forms and carry no legal validity.

// People hold family and given names separately, as passports and FAL forms do. Older records with a
// single name are split at the last space.
function splitName(name){const parts=String(name||'').trim().split(/\s+/).filter(Boolean);return parts.length>1?{givenNames:parts.slice(0,-1).join(' '),surname:parts.at(-1)}:{givenNames:'',surname:parts[0]||''}}
function personNames(p){return p.surname||p.givenNames?{givenNames:p.givenNames||'',surname:p.surname||''}:splitName(p.name)}
function withFullName(p){const n=personNames(p);return {...p,...n,name:[n.givenNames,n.surname].filter(Boolean).join(' ')}}

// What each list needs for every person, beyond what the vessel record supplies.
const crewListFields=[['surname','Family name'],['givenNames','Given names'],['rank','Rank or rating'],['nationality','Nationality'],['dob','Date of birth'],['placeOfBirth','Place of birth'],['passport','Passport number'],['passportCountry','Issuing state'],['passportExpiry','Passport expiry']];
const passengerListFields=[['surname','Family name'],['givenNames','Given names'],['nationality','Nationality'],['dob','Date of birth'],['placeOfBirth','Place of birth'],['sex','Gender'],['passport','Passport number'],['passportCountry','Issuing state'],['passportExpiry','Passport expiry']];
function manifestGaps(v){
 const people=(v.people||[]).map(withFullName);
 return people.flatMap((p,i)=>{
  const missing=(p.role==='Crew'?crewListFields:passengerListFields).filter(([k])=>!String(p[k]||'').trim()).map(([,label])=>label);
  return missing.length?[{index:i,name:p.name||`Person ${i+1}`,role:p.role,missing}]:[];
 });
}
function manifestRecord(v){
 // Brokers see their latest saved draft; officers see what was submitted.
 const source=currentRole==='broker'&&v.draft?{...v,...v.draft}:v;
 const people=(source.people||[]).map(withFullName);
 return {v:source,isDraft:source!==v||!v.submitted,crew:people.filter(p=>p.role==='Crew'),passengers:people.filter(p=>p.role!=='Crew')};
}
function manifestRows(m){
 const embark=m.v.previousPort||'',disembark=m.v.nextPort||'';
 return {
  crew:m.crew.map((p,i)=>[i+1,`${p.surname.toUpperCase()}, ${p.givenNames}`,p.rank||'',p.nationality,[p.dob,p.placeOfBirth].filter(Boolean).join(' · '),'Passport '+(p.passport||''),p.passportCountry||'',p.passportExpiry||'']),
  passengers:m.passengers.map((p,i)=>[i+1,`${p.surname.toUpperCase()}, ${p.givenNames}`,p.nationality,p.dob,p.placeOfBirth||'',p.sex||'','Passport',p.passport||'',p.passportCountry||'',p.passportExpiry||'',embark,disembark,'No'])
 };
}
const crewHeadings=['No.','Family name, given names','Rank or rating','Nationality','Date and place of birth','Nature and no. of identity document','Issuing state','Expiry date'];
const passengerHeadings=['No.','Family name, given names','Nationality','Date of birth','Place of birth','Gender','Type of identity document','Serial number','Issuing state','Expiry date','Port of embarkation','Port of disembarkation','Transit passenger'];
function shipBlock(m){
 const v=m.v;
 return `<dl class="fal-ship"><div><dt>1.1 Name of ship</dt><dd>${esc(v.name||'')}</dd></div><div><dt>1.2 IMO number</dt><dd>${esc(v.imo||'—')}</dd></div><div><dt>1.3 Call sign</dt><dd>${esc(v.callSign||'—')}</dd></div><div><dt>1.4 Voyage number</dt><dd>${esc(v.reference||'—')}</dd></div><div><dt>2. Port of arrival</dt><dd>${esc((v.port||'')+', Anguilla')}</dd></div><div><dt>3. Date of arrival</dt><dd>${esc(v.arrival||'')}</dd></div><div><dt>4. Flag state of ship</dt><dd>${esc(v.flag||'')}</dd></div><div><dt>5. Last port of call</dt><dd>${esc(v.previousPort||'Not supplied')}</dd></div></dl>`;
}
function falTable(headings,rows,empty){return rows.length?`<table class="fal-table"><thead><tr>${headings.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td${/^\d{4}-\d{2}-\d{2}$|^\d+$/.test(String(c))?' class="nowrap"':''}>${esc(String(c))}</td>`).join('')}</tr>`).join('')}</tbody></table>`:`<p class="fine">${empty}</p>`}
function manifestDocument(m){
 const rows=manifestRows(m),signature='<div class="fal-sign"><span>Date and signature by master, authorised agent or officer</span><span></span></div>';
 const top=title=>`<div class="paper-top"><span class="brand">harbour</span><strong>FICTIONAL DEMO · NOT AN OFFICIAL FORM</strong></div><h2>${title}</h2><p class="fine">Arrival · Prepared from passport scans and the visit record ${esc(m.v.reference||'')}${m.isDraft?' · Draft, not yet submitted':''}</p>`;
 return `<article class="paper-document fal-page">${top('Crew list <small>(after IMO FAL Form 5)</small>')}${shipBlock(m)}${falTable(crewHeadings,rows.crew,'No crew listed.')}${signature}</article><article class="paper-document fal-page">${top('Passenger list <small>(after IMO FAL Form 6)</small>')}${shipBlock(m)}${falTable(passengerHeadings,rows.passengers,'No passengers listed.')}${signature}</article>`;
}
function manifestCSV(m){
 const rows=manifestRows(m),cell=x=>'"'+String(x??'').replace(/^[=+@-]/,"'$&").replace(/"/g,'""')+'"';
 return [['CREW AND PASSENGER LISTS — FICTIONAL DEMO — NOT OFFICIAL'],['Ship',m.v.name,'Flag',m.v.flag,'Voyage',m.v.reference,'Port of arrival',m.v.port,'Arrival',m.v.arrival,'Last port',m.v.previousPort||''],[],['CREW LIST'],crewHeadings,...rows.crew,[],['PASSENGER LIST'],passengerHeadings,...rows.passengers].map(r=>r.map(cell).join(',')).join('\r\n');
}
function manifestPage(id){
 const v=visits.find(x=>x.id===id);if(!v){location.hash='dashboard';return}
 const m=manifestRecord(v),gaps=manifestGaps(m.v),total=m.crew.length+m.passengers.length;
 const back=currentRole==='broker'?`#visit/${v.id}`:`#${currentRole}/${v.id}`;
 app.innerHTML=`<section class="workspace manifest-page"><div class="no-print">${demoNote}<a href="${back}">Back to ${currentRole==='broker'?'visit':'visit file'}</a><div class="pagehead"><div><span class="eyebrow">${esc(m.v.name||'')} · ${esc(m.v.reference||'')}</span><h1>Crew and passenger lists</h1><p>${m.crew.length} crew and ${m.passengers.length} ${m.passengers.length===1?'passenger':'passengers'}, generated from the manifest${m.isDraft?' in the latest saved draft':''}.</p></div><div class="actions"><button id="manifest-print">Print / save as PDF</button><button id="manifest-html" class="secondary">Download printable copy</button><button id="manifest-csv" class="secondary">Download CSV</button></div></div>${!total?'<div class="review-note"><strong>No one on the manifest yet</strong><p>Add crew and guests, or import them from passport scans, in the application.</p></div>':gaps.length?`<div class="review-note"><strong>${gaps.length} ${gaps.length===1?'person needs':'people need'} details before these lists are complete</strong><ul>${gaps.map(g=>`<li>${esc(g.name)} (${esc(g.role||'Guest')}): ${esc(g.missing.join(', '))}</li>`).join('')}</ul>${currentRole==='broker'?'<p>Add them in the application’s crew & guests section.</p>':''}</div>`:'<div class="manifest-ready"><strong>Complete</strong><span>Every person has the details both lists need.</span></div>'}<p class="fine">Ports of embarkation and disembarkation default to the voyage’s previous and next ports; confirm them for guests joining or leaving in Anguilla. IMO number and call sign are not collected in this demo.</p></div>${manifestDocument(m)}</section>`;
 document.querySelector('#manifest-print').onclick=()=>window.print();
 const save=(content,type,name)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
 document.querySelector('#manifest-csv').onclick=()=>{save(manifestCSV(m),'text/csv;charset=utf-8',`harbour-${v.reference||v.id}-crew-passenger-lists.csv`);toast('Crew and passenger lists downloaded as CSV')};
 document.querySelector('#manifest-html').onclick=()=>{
  const css='body{font:13px/1.45 Arial,sans-serif;color:#173334;margin:24px}.paper-document{max-width:none;margin:0 0 40px;page-break-after:always}.paper-top{display:flex;justify-content:space-between;border-bottom:2px solid #00686b;padding-bottom:12px}.paper-top strong{font-size:11px}.brand{font-size:22px;font-weight:bold}h2{margin:18px 0 4px}h2 small{font-size:13px;font-weight:normal;color:#586c6d}.fine{font-size:11px;color:#586c6d}.fal-ship{display:grid;grid-template-columns:repeat(4,1fr);gap:8px 16px;margin:16px 0}.fal-ship dt{font-size:10px;color:#586c6d}.fal-ship dd{margin:0;font-weight:bold}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #9fb2b0;padding:5px 6px;text-align:left;vertical-align:top}.nowrap{white-space:nowrap}th{background:#edf5f2;font-size:10px}.fal-sign{display:flex;gap:16px;align-items:flex-end;margin-top:28px;font-size:11px}.fal-sign span:last-child{flex:1;border-bottom:1px solid #173334;height:28px}@media print{@page{size:A4 landscape;margin:12mm}}';
  save(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Crew and passenger lists · ${esc(m.v.name||'')}</title><style>${css}</style></head><body>${manifestDocument(m)}</body></html>`,'text/html;charset=utf-8',`harbour-${v.reference||v.id}-crew-passenger-lists.html`);
  toast('Printable crew and passenger lists downloaded');
 };
}
