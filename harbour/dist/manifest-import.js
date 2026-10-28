// Passport scan import: reads the machine-readable zone (MRZ) of passport scans in the browser.
// Scans are processed in memory only; nothing is uploaded and images are discarded after import.

// ISO 3166 alpha-3 codes used in MRZs, mapped to alpha-2 for display names. "D" is Germany's MRZ code.
const mrzCountryCodes=Object.fromEntries('AFG:AF ALA:AX ALB:AL DZA:DZ ASM:AS AND:AD AGO:AO AIA:AI ATA:AQ ATG:AG ARG:AR ARM:AM ABW:AW AUS:AU AUT:AT AZE:AZ BHS:BS BHR:BH BGD:BD BRB:BB BLR:BY BEL:BE BLZ:BZ BEN:BJ BMU:BM BTN:BT BOL:BO BES:BQ BIH:BA BWA:BW BRA:BR IOT:IO BRN:BN BGR:BG BFA:BF BDI:BI CPV:CV KHM:KH CMR:CM CAN:CA CYM:KY CAF:CF TCD:TD CHL:CL CHN:CN COL:CO COM:KM COG:CG COD:CD COK:CK CRI:CR CIV:CI HRV:HR CUB:CU CUW:CW CYP:CY CZE:CZ DNK:DK DJI:DJ DMA:DM DOM:DO ECU:EC EGY:EG SLV:SV GNQ:GQ ERI:ER EST:EE SWZ:SZ ETH:ET FLK:FK FRO:FO FJI:FJ FIN:FI FRA:FR GUF:GF PYF:PF GAB:GA GMB:GM GEO:GE DEU:DE D:DE GHA:GH GIB:GI GRC:GR GRL:GL GRD:GD GLP:GP GUM:GU GTM:GT GGY:GG GIN:GN GNB:GW GUY:GY HTI:HT VAT:VA HND:HN HKG:HK HUN:HU ISL:IS IND:IN IDN:ID IRN:IR IRQ:IQ IRL:IE IMN:IM ISR:IL ITA:IT JAM:JM JPN:JP JEY:JE JOR:JO KAZ:KZ KEN:KE KIR:KI PRK:KP KOR:KR KWT:KW KGZ:KG LAO:LA LVA:LV LBN:LB LSO:LS LBR:LR LBY:LY LIE:LI LTU:LT LUX:LU MAC:MO MDG:MG MWI:MW MYS:MY MDV:MV MLI:ML MLT:MT MHL:MH MTQ:MQ MRT:MR MUS:MU MEX:MX FSM:FM MDA:MD MCO:MC MNG:MN MNE:ME MSR:MS MAR:MA MOZ:MZ MMR:MM NAM:NA NRU:NR NPL:NP NLD:NL NCL:NC NZL:NZ NIC:NI NER:NE NGA:NG NIU:NU MKD:MK NOR:NO OMN:OM PAK:PK PLW:PW PSE:PS PAN:PA PNG:PG PRY:PY PER:PE PHL:PH POL:PL PRT:PT PRI:PR QAT:QA REU:RE ROU:RO RUS:RU RWA:RW BLM:BL SHN:SH KNA:KN LCA:LC MAF:MF SPM:PM VCT:VC WSM:WS SMR:SM STP:ST SAU:SA SEN:SN SRB:RS SYC:SC SLE:SL SGP:SG SXM:SX SVK:SK SVN:SI SLB:SB SOM:SO ZAF:ZA SSD:SS ESP:ES LKA:LK SDN:SD SUR:SR SWE:SE CHE:CH SYR:SY TWN:TW TJK:TJ TZA:TZ THA:TH TLS:TL TGO:TG TON:TO TTO:TT TUN:TN TUR:TR TKM:TM TCA:TC TUV:TV UGA:UG UKR:UA ARE:AE GBR:GB GBD:GB GBN:GB GBO:GB GBS:GB GBP:GB USA:US URY:UY UZB:UZ VUT:VU VEN:VE VNM:VN VGB:VG VIR:VI WLF:WF YEM:YE ZMB:ZM ZWE:ZW RKS:XK'.split(' ').map(pair=>pair.split(':')));
const mrzRegionNames=new Intl.DisplayNames(['en'],{type:'region'});
function mrzCountry(code){const alpha2=mrzCountryCodes[code.replace(/</g,'')];return alpha2?mrzRegionNames.of(alpha2):code.replace(/</g,'')}

// ICAO 9303 check digit: weights 7-3-1, digits as-is, A–Z as 10–35, filler "<" as 0.
const mrzValue=c=>c==='<'?0:/[0-9]/.test(c)?Number(c):c.charCodeAt(0)-55;
function mrzCheck(text){let total=0;for(let i=0;i<text.length;i++)total+=mrzValue(text[i])*[7,3,1][i%3];return String(total%10)}
// Characters OCR commonly confuses, used only where a field's type is known.
const mrzToDigit={O:'0',Q:'0',D:'0',U:'0',I:'1',L:'1',T:'1',Z:'2',S:'5',B:'8',G:'6'};
const mrzToLetter={0:'O',1:'I',2:'Z',5:'S',8:'B',6:'G'};
const mrzDigits=s=>s.replace(/[A-Z]/g,c=>mrzToDigit[c]||c);
const mrzLetters=s=>s.replace(/[0-9]/g,c=>mrzToLetter[c]||c);
const titleCase=s=>s.toLowerCase().replace(/(^|[\s'-])\p{L}/gu,m=>m.toUpperCase());

function mrzDate(yymmdd,kind){
 if(!/^\d{6}$/.test(yymmdd))return '';
 const yy=Number(yymmdd.slice(0,2)),now=new Date().getFullYear()%100;
 // Expiry dates are always in the 2000s; a birth year above this year's two digits is in the 1900s.
 const year=kind==='expiry'||yy<=now?2000+yy:1900+yy;
 const value=`${year}-${yymmdd.slice(2,4)}-${yymmdd.slice(4,6)}`;
 return validDate(value)?value:'';
}

// Parse a TD3 (passport) MRZ from two 44-character lines. Returns fields plus which checks passed.
function parseMrz(line1,line2){
 const a=(line1+'<'.repeat(44)).slice(0,44),b=line2;
 if(a[0]!=='P'||b.length!==44)return null;
 // Dates and check digits can only be digits, so letter misreads there are safe to convert.
 // Passport numbers mix letters and digits: a failed check is flagged for the broker, never guessed.
 const number=b.slice(0,9),numberCheck=mrzDigits(b[9]),dob=mrzDigits(b.slice(13,19)),dobCheck=mrzDigits(b[19]),expiry=mrzDigits(b.slice(21,27)),expiryCheck=mrzDigits(b[27]),optional=b.slice(28,42),optionalCheck=mrzDigits(b[42]),compositeCheck=mrzDigits(b[43]);
 // Primary and secondary identifiers are separated by "<<"; anything after the next "<<" is filler, often misread as letters.
 const names=mrzLetters(a.slice(5)).split('<<');
 const surname=titleCase(names[0].replace(/</g,' ').trim()),given=titleCase((names[1]||'').replace(/</g,' ').trim());
 const sex={F:'Female',M:'Male'}[b[20]]||'Unspecified';
 const checks={passport:mrzCheck(number)===numberCheck,dob:mrzCheck(dob)===dobCheck,expiry:mrzCheck(expiry)===expiryCheck,composite:mrzCheck(number+numberCheck+dob+dobCheck+expiry+expiryCheck+optional+optionalCheck)===compositeCheck};
 return {
  name:[given,surname].filter(Boolean).join(' '),surname,givenNames:given,sex,
  passport:number.replace(/</g,''),passportCountry:mrzCountry(mrzLetters(a.slice(2,5))),nationality:mrzCountry(mrzLetters(b.slice(10,13))),
  dob:mrzDate(dob,'birth'),passportExpiry:mrzDate(expiry,'expiry'),checks,verified:Object.values(checks).every(Boolean)
 };
}
const mrzScore=p=>p?Object.values(p.checks).filter(Boolean).length+(p.dob?1:0)+(p.passportExpiry?1:0):-1;

// Find every passport MRZ in OCR text. OCR can add or drop a character, so nearby lengths are tried.
function findMrzs(text){
 const lines=text.split('\n').map(l=>l.toUpperCase().replace(/[^A-Z0-9<]/g,'')).filter(l=>l.length>=30);
 const found=[];
 for(let i=0;i<lines.length-1;i++){
  const start=lines[i].search(/P[A-Z<][A-Z<]{3}/);
  if(start<0||start>4||!lines[i].includes('<<'))continue;
  const line1=lines[i].slice(start),raw=lines[i+1],candidates=[];
  if(raw.length>=44)for(let s=0;s<=raw.length-44;s++)candidates.push(raw.slice(s,s+44));
  else for(let at=28;at<=42;at++)candidates.push((raw.slice(0,at)+'<'.repeat(44-raw.length)+raw.slice(at)).slice(0,44));
  const best=candidates.map(c=>parseMrz(line1,c)).sort((x,y)=>mrzScore(y)-mrzScore(x))[0];
  if(best&&mrzScore(best)>=3){found.push(best);i++}
 }
 return found;
}

// Check digits miss about 1 in 10 multi-character misreads, and names have none. A person is only
// verified when a second, independent read of the same page agrees field by field.
const confirmedFields=['name','sex','nationality','dob','passport','passportCountry','passportExpiry'];
function confirmReads(first,second){
 return first.map((p,i)=>{
  const other=second.find(o=>o.passport===p.passport&&o.dob===p.dob)||second[i];
  if(!other)return {...p,verified:false,disagree:[],singleRead:true};
  const disagree=confirmedFields.filter(k=>p[k]!==other[k]);
  return {...p,verified:p.verified&&other.verified&&!disagree.length,disagree};
 });
}

// Build a valid TD3 MRZ for a person. Used for fictional samples and tests.
function buildMrz({surname,givenNames,country,nationality,number,dob,sex,expiry}){
 const clean=s=>s.toUpperCase().normalize('NFD').replace(/[^A-Z ]/g,'').trim().replace(/\s+/g,'<');
 const line1=('P<'+country+clean(surname)+'<<'+clean(givenNames)+'<'.repeat(44)).slice(0,44);
 const doc=(number.toUpperCase()+'<'.repeat(9)).slice(0,9),ymd=d=>d.slice(2).replace(/-/g,'');
 const body=doc+mrzCheck(doc)+nationality+ymd(dob)+mrzCheck(ymd(dob))+sex+ymd(expiry)+mrzCheck(ymd(expiry))+'<'.repeat(14)+'0';
 return [line1,body+mrzCheck(body.slice(0,10)+body.slice(13,20)+body.slice(21,43))];
}

// --- Browser reading: PDFs are rendered with pdf.js, text is read with Tesseract, both loaded on first use. ---
const scanLibraries={};
function loadScanScript(src){return scanLibraries[src]??=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('Could not load the scan reader. Check the internet connection.'));document.head.append(s)})}
let mrzWorker=null;
async function mrzReader(){
 if(mrzWorker)return mrzWorker;
 await loadScanScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js');
 const worker=await Tesseract.createWorker('eng');
 await worker.setParameters({tessedit_char_whitelist:'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',preserve_interword_spaces:'0'});
 return mrzWorker=worker;
}
async function scanPages(file){
 if(file.type==='application/pdf'||/\.pdf$/i.test(file.name)){
  await loadScanScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
  pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise,pages=[];
  for(let n=1;n<=pdf.numPages;n++){const page=await pdf.getPage(n),view=page.getViewport({scale:1}),viewport=page.getViewport({scale:Math.min(3,2000/Math.max(view.width,view.height))});const canvas=document.createElement('canvas');canvas.width=viewport.width;canvas.height=viewport.height;await page.render({canvasContext:canvas.getContext('2d'),viewport,intent:'print'}).promise;pages.push({canvas,label:`${file.name} · page ${n}`})}
  return pages;
 }
 const bitmap=await createImageBitmap(file),scale=Math.min(1,2200/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');
 canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close?.();
 return [{canvas,label:file.name}];
}
function rotateCanvas(source,degrees){
 const canvas=document.createElement('canvas'),turn=degrees%180!==0;
 canvas.width=turn?source.height:source.width;canvas.height=turn?source.width:source.height;
 const ctx=canvas.getContext('2d');ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(degrees*Math.PI/180);ctx.drawImage(source,-source.width/2,-source.height/2);
 return canvas;
}
// Greyscale and stretch contrast so dim phone photos read like scans.
function enhance(source){
 const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
 const ctx=canvas.getContext('2d');ctx.drawImage(source,0,0);
 const image=ctx.getImageData(0,0,canvas.width,canvas.height),px=image.data,grey=new Uint8Array(px.length/4),histogram=new Array(256).fill(0);
 for(let i=0;i<grey.length;i++){grey[i]=(px[i*4]*299+px[i*4+1]*587+px[i*4+2]*114)/1000;histogram[grey[i]]++}
 const level=share=>{let seen=0;for(let v=0;v<256;v++){seen+=histogram[v];if(seen>=grey.length*share)return v}return 255};
 const low=level(.02),high=Math.max(low+1,level(.98));
 for(let i=0;i<grey.length;i++){const v=Math.max(0,Math.min(255,(grey[i]-low)*255/(high-low)));px[i*4]=px[i*4+1]=px[i*4+2]=v}
 ctx.putImageData(image,0,0);return canvas;
}
// Try a page upright, upside down, slightly tilted, then sideways until an MRZ is found.
async function readTurns(worker,canvas,turns){
 for(const degrees of turns){
  const {data}=await worker.recognize(degrees?rotateCanvas(canvas,degrees):canvas);
  const found=findMrzs(data.text);
  if(found.length)return {found,degrees};
 }
 return {found:[],degrees:null};
}
// Read each page twice, enhanced and as received, and keep only what both reads agree on.
async function readPage(source){
 const worker=await mrzReader(),turns=[0,180,-3,3,90,270];
 const enhanced=await readTurns(worker,enhance(source),turns);
 const original=await readTurns(worker,source,enhanced.degrees===null?turns:[enhanced.degrees]);
 const [first,second]=enhanced.found.length?[enhanced.found,original.found]:[original.found,enhanced.found];
 return confirmReads(first,second);
}
// Thumbnail cropped to the page's content, so a passport on a white A4 scan is shown large enough to compare.
function scanThumbnail(canvas){
 const step=4,{width,height}=canvas,px=canvas.getContext('2d').getImageData(0,0,width,height).data;let x0=width,y0=height,x1=0,y1=0;
 for(let y=0;y<height;y+=step)for(let x=0;x<width;x+=step){const i=(y*width+x)*4;if(px[i]+px[i+1]+px[i+2]<690){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}}
 if(x1<=x0||y1<=y0)[x0,y0,x1,y1]=[0,0,width,height];
 const pad=12,sx=Math.max(0,x0-pad),sy=Math.max(0,y0-pad),sw=Math.min(width,x1+pad)-sx,sh=Math.min(height,y1+pad)-sy;
 const scale=Math.min(1,900/sw),t=document.createElement('canvas');t.width=Math.round(sw*scale);t.height=Math.round(sh*scale);
 t.getContext('2d').drawImage(canvas,sx,sy,sw,sh,0,0,t.width,t.height);return t.toDataURL('image/jpeg',.8);
}

// --- Import panel inside the broker application's crew & guests section. ---
const scanFields=[['name','Full name'],['sex','Sex'],['nationality','Nationality'],['dob','Date of birth','date'],['passport','Passport number'],['passportCountry','Issuing country'],['passportExpiry','Passport expiry','date']];
const scanFlagFields={passport:'passport',dob:'dob',expiry:'passportExpiry'};
function openScanImport(panel,addPerson){
 panel.hidden=false;
 panel.innerHTML=`<div class="scan-import"><div class="scan-head"><div><h3>Import from passport scans</h3><p class="muted">Add the passport scans you received by email: scanned images, phone photos or PDFs, with several people per file if needed. Harbour reads each passport's machine-readable lines in this browser. Nothing is uploaded, and images are discarded once you finish.</p></div><button type="button" class="textlink" id="scan-close">Close</button></div><label class="scan-drop" id="scan-drop"><input id="scan-files" type="file" multiple accept="image/*,application/pdf"><strong>Drop passport scans here or choose files</strong><span>JPG, PNG or PDF</span></label><button type="button" class="textlink" id="scan-samples">Use fictional sample scans</button><p id="scan-status" class="scan-status" role="status" aria-live="polite"></p><div id="scan-results"></div><div class="actions" id="scan-actions" hidden><button type="button" id="scan-add">Add to manifest</button></div></div>`;
 const results=[],status=panel.querySelector('#scan-status'),list=panel.querySelector('#scan-results'),actions=panel.querySelector('#scan-actions'),addButton=panel.querySelector('#scan-add');
 const existing=()=>new Set(Array.from(document.querySelectorAll('#people [data-person="passport"]')).map(i=>i.value.trim().toUpperCase()).filter(Boolean));
 const refreshCount=()=>{const n=list.querySelectorAll('[data-scan-include]:checked').length;addButton.textContent=`Add ${n} ${n===1?'person':'people'} to manifest`;addButton.disabled=!n};
 const render=()=>{
  const onManifest=existing(),seen=new Set();
  list.innerHTML=results.map((r,i)=>{
   const p=r.person||{},key=(p.passport||'').toUpperCase(),duplicate=key&&(onManifest.has(key)||seen.has(key));if(key)seen.add(key);
   const flagged=new Set([...Object.entries(p.checks||{}).filter(([k,ok])=>!ok&&scanFlagFields[k]).map(([k])=>scanFlagFields[k]),...(p.disagree||[])]);
   const expired=p.passportExpiry&&p.passportExpiry<govToday();
   const state=!r.person?['danger','Couldn’t read this passport. Type the details or leave it out.']:duplicate?['','Already on the manifest or listed twice. Left out.']:!p.verified?['warn',(p.singleRead?'Only one read found this passport, so it could not be confirmed. Compare every field with the scan':'Some characters could not be confirmed. Compare the highlighted fields with the scan')+', then tick Add to manifest.']:expired?['warn','Read and verified, but this passport has expired.']:['ready','Two independent reads agree and the passport’s check digits match.'];
   // Only confirmed passports start ticked; anything flagged needs the broker's attention first.
   r.include??=!!r.person&&p.verified&&!duplicate;
   return `<article class="scan-card"><button type="button" class="scan-thumb" data-scan-zoom="${i}" aria-label="Enlarge scan of ${esc(r.label)}"><img src="${r.thumb}" alt=""></button><div><div class="decision-line"><span class="fine">${esc(r.label)}</span><span class="badge ${state[0]==='ready'?'ready':state[0]==='danger'?'danger':''}">${state[0]==='ready'?'Verified':state[0]==='danger'?'Not read':duplicate?'Duplicate':p.verified&&expired?'Expired':'Check'}</span></div><p class="scan-note ${state[0]}">${state[1]}</p><div class="form-grid scan-fields">${scanFields.map(([k,label,type])=>k==='sex'?`<div><label>${label}<select data-scan-field="sex" data-scan="${i}">${['','Female','Male','Unspecified'].map(x=>`<option ${p.sex===x?'selected':''} value="${x}">${x||'Select'}</option>`).join('')}</select></label></div>`:`<div><label>${label}<input ${type?`type="${type}"`:''} data-scan-field="${k}" data-scan="${i}" value="${esc(p[k]||'')}" class="${flagged.has(k)?'scan-flag':''}"></label></div>`).join('')}<div><label>Role<select data-scan-field="role" data-scan="${i}">${['Guest','Crew'].map(x=>`<option ${r.role===x?'selected':''}>${x}</option>`).join('')}</select></label></div></div><label class="scan-include"><input type="checkbox" data-scan-include="${i}" ${r.include?'checked':''}> Add to manifest</label></div></article>`;
  }).join('');
  list.querySelectorAll('[data-scan-field]').forEach(el=>el.oninput=el.onchange=()=>{const r=results[el.dataset.scan];if(el.dataset.scanField==='role')r.role=el.value;else (r.person??={checks:{}})[el.dataset.scanField]=el.value});
  list.querySelectorAll('[data-scan-include]').forEach(el=>el.onchange=()=>{results[el.dataset.scanInclude].include=el.checked;refreshCount()});
  list.querySelectorAll('[data-scan-zoom]').forEach(el=>el.onclick=()=>el.classList.toggle('zoomed'));
  actions.hidden=!results.length;refreshCount();
 };
 const importFiles=async files=>{
  files=[...files].filter(f=>/^image\//.test(f.type)||f.type==='application/pdf'||/\.pdf$/i.test(f.name));
  if(!files.length){status.textContent='Choose JPG, PNG or PDF files.';return}
  const started=performance.now(),captain=(document.querySelector('#captain')?.value||'').trim().toLowerCase();let pages=0,people=0;
  try{
   status.textContent='Loading the passport reader…';await mrzReader();
   for(const file of files){status.textContent=`Opening ${file.name}…`;for(const page of await scanPages(file)){
    pages++;status.textContent=`Reading ${page.label}…`;
    const found=await readPage(page.canvas),thumb=scanThumbnail(page.canvas);
    if(!found.length)results.push({label:page.label,thumb,person:null,role:'Guest'});
    found.forEach((person,n)=>{people++;results.push({label:found.length>1?`${page.label} · passport ${n+1}`:page.label,thumb,person,role:captain&&person.name.toLowerCase()===captain?'Crew':'Guest'})});
    render();
   }}
  }catch(error){status.textContent=error.message||'The scans could not be read.';return}
  const attention=results.filter(r=>!r.person||!r.person.verified).length;
  status.textContent=`Read ${people} ${people===1?'passport':'passports'} from ${pages} ${pages===1?'page':'pages'} in ${Math.max(1,Math.round((performance.now()-started)/1000))} s.${attention?` ${attention} ${attention===1?'needs':'need'} your attention.`:' All verified.'}`;
 };
 panel.querySelector('#scan-files').onchange=e=>importFiles(e.target.files);
 const drop=panel.querySelector('#scan-drop');
 drop.ondragover=e=>{e.preventDefault();drop.classList.add('over')};drop.ondragleave=()=>drop.classList.remove('over');
 drop.ondrop=e=>{e.preventDefault();drop.classList.remove('over');importFiles(e.dataTransfer.files)};
 panel.querySelector('#scan-samples').onclick=async()=>{
  status.textContent='Loading fictional sample scans…';
  const names=['sample-passport-scans.pdf','sample-phone-photo.jpg','sample-smudged-scan.jpg'];
  const files=await Promise.all(names.map(async n=>new File([await (await fetch('samples/'+n)).blob()],n,{type:n.endsWith('.pdf')?'application/pdf':'image/jpeg'})));
  importFiles(files);
 };
 panel.querySelector('#scan-close').onclick=()=>{panel.hidden=true;panel.innerHTML=''};
 addButton.onclick=()=>{
  const chosen=results.filter(r=>r.include&&r.person);
  // Replace untouched blank rows so imported people are not followed by empty entries.
  document.querySelectorAll('#people .person').forEach(row=>{if(Array.from(row.querySelectorAll('[data-person]')).every(el=>el.dataset.person==='role'||!el.value))row.remove()});
  chosen.forEach(r=>addPerson({name:r.person.name,role:r.role,sex:r.person.sex,nationality:r.person.nationality,dob:r.person.dob,passport:r.person.passport,passportCountry:r.person.passportCountry,passportExpiry:r.person.passportExpiry}));
  panel.hidden=true;panel.innerHTML='';
  toast(`${chosen.length} ${chosen.length===1?'person':'people'} added from passport scans. Check the rows below before saving.`);
  document.querySelector('#people')?.scrollIntoView?.({behavior:'smooth',block:'start'});
 };
}
