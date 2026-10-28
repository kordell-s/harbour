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

const mrzKnownCode=code=>!!mrzCountryCodes[code.replace(/</g,'')];

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
 const sex={F:'Female',M:'Male'}[b[20]]||'Unspecified',issuer=mrzLetters(a.slice(2,5)),nationality=mrzLetters(b.slice(10,13));
 const checks={passport:mrzCheck(number)===numberCheck,dob:mrzCheck(dob)===dobCheck,expiry:mrzCheck(expiry)===expiryCheck,composite:mrzCheck(number+numberCheck+dob+dobCheck+expiry+expiryCheck+optional+optionalCheck)===compositeCheck};
 return {
  name:[given,surname].filter(Boolean).join(' '),surname,givenNames:given,sex,
  passport:number.replace(/</g,''),passportCountry:mrzCountry(issuer),nationality:mrzCountry(nationality),
  dob:mrzDate(dob,'birth'),passportExpiry:mrzDate(expiry,'expiry'),checks,verified:Object.values(checks).every(Boolean),
  lines:[a,b],knownCodes:{passportCountry:mrzKnownCode(issuer),nationality:mrzKnownCode(nationality)},
  // A name that runs to the last character may have been shortened to fit the MRZ.
  nameTruncated:a[43]!=='<'
 };
}
const mrzScore=p=>p?Object.values(p.checks).filter(Boolean).length+(p.dob?1:0)+(p.passportExpiry?1:0):-1;

// Find every passport MRZ among OCR lines ({text, bbox?}). OCR can add or drop a character, so nearby lengths are tried.
function findMrzLines(ocr){
 const lines=ocr.map(l=>({...l,clean:l.text.toUpperCase().replace(/[^A-Z0-9<]/g,'')})).filter(l=>l.clean.length>=30);
 const found=[];
 for(let i=0;i<lines.length-1;i++){
  const start=lines[i].clean.search(/P[A-Z<][A-Z<]{3}/);
  if(start<0||start>4||!lines[i].clean.includes('<<'))continue;
  const line1=lines[i].clean.slice(start),raw=lines[i+1].clean,candidates=[];
  if(raw.length>=44)for(let s=0;s<=raw.length-44;s++)candidates.push(raw.slice(s,s+44));
  else for(let at=28;at<=42;at++)candidates.push((raw.slice(0,at)+'<'.repeat(44-raw.length)+raw.slice(at)).slice(0,44));
  const best=candidates.map(c=>parseMrz(line1,c)).sort((x,y)=>mrzScore(y)-mrzScore(x))[0];
  if(best&&mrzScore(best)>=3){
   const [u,v]=[lines[i].bbox,lines[i+1].bbox];
   if(u&&v)best.bbox={x0:Math.min(u.x0,v.x0),y0:Math.min(u.y0,v.y0),x1:Math.max(u.x1,v.x1),y1:Math.max(u.y1,v.y1)};
   found.push(best);i++;
  }
 }
 return found;
}
const findMrzs=text=>findMrzLines(text.split('\n').map(text=>({text})));

// Majority vote across independent reads of one passport, field by field. Check digits miss about
// 1 in 10 multi-character misreads and names have none, so a field is only accepted when at least two
// reads agree on it. The printed page can break a tie on the passport number.
const mrzFieldSlices={passportCountry:[0,2,5],name:[0,5,44],passport:[1,0,10],nationality:[1,10,13],dob:[1,13,20],sex:[1,20,21],passportExpiry:[1,21,28],optional:[1,28,43],composite:[1,43,44]};
const shownMrzFields=['passportCountry','name','passport','nationality','dob','sex','passportExpiry'];
// Small edit distance, for matching a printed passport number against MRZ reads.
function editDistance(a,b){let row=[...Array(b.length+1).keys()];for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(row[j]+1,next[j-1]+1,row[j-1]+(a[i-1]===b[j-1]?0:1));row=next}return row[b.length]}
function voteReads(reads,printedText=''){
 reads=reads.filter(Boolean);
 if(!reads.length)return null;
 const lines=[[...reads[0].lines[0]],[...reads[0].lines[1]]],support={};let printedConfirmed=false;
 for(const [field,[line,from,to]] of Object.entries(mrzFieldSlices)){
  const counts=new Map();
  reads.forEach(r=>{const value=r.lines[line].slice(from,to);counts.set(value,(counts.get(value)||0)+1)});
  // Ties keep the earliest read, so reads are passed in order of image quality.
  let [value,n]=[...counts].sort((x,y)=>y[1]-x[1])[0];
  // Consult the printed page when reads disagree, or agree on a number that fails its own check digit.
  if(field==='passport'&&(n<2||mrzCheck(value.slice(0,9))!==mrzDigits(value[9]))&&printedText){
   // Whole printed words only: a substring could come from MRZ text and would confirm a read by itself.
   const words=new Set(printedText.split(/\s+/));
   const match=[...counts.keys()].filter(v=>{const number=v.slice(0,9).replace(/</g,'');return number.length>=6&&words.has(number)});
   if(match.length===1){value=match[0];n=2;printedConfirmed=true}
   else{
    // The number is also printed in another font, so it is misread differently. A printed token counts as a
    // second read when it is close to an MRZ read and satisfies the check digit most MRZ reads agree on.
    const checkCounts=new Map();reads.forEach(r=>checkCounts.set(r.lines[1][9],(checkCounts.get(r.lines[1][9])||0)+1));
    const checkDigit=mrzDigits([...checkCounts].sort((x,y)=>y[1]-x[1])[0][0]);
    const numbers=[...counts.keys()].map(v=>v.slice(0,9).replace(/</g,''));
    const tokens=[...new Set(printedText.split(/\s+/).filter(t=>t.length>=6&&t.length<=9))].filter(t=>mrzCheck((t+'<<<<<<<<<').slice(0,9))===checkDigit&&numbers.some(n=>editDistance(n,t)<=2));
    if(tokens.length===1){value=(tokens[0]+'<<<<<<<<<').slice(0,9)+checkDigit;n=2;printedConfirmed=true}
   }
  }
  lines[line].splice(from,to-from,...value);support[field]=n;
 }
 const p=parseMrz(lines[0].join(''),lines[1].join(''));
 const disagree=reads.length<2?[]:shownMrzFields.filter(f=>support[f]<2);
 return {...p,reads:reads.length,singleRead:reads.length<2,disagree,printedConfirmed,verified:p.verified&&reads.length>=2&&!disagree.length};
}

// Checks that catch values a correct read could still make implausible.
function plausibility(p,arrival=''){
 const flags=[],notes=[],today=govToday(),years=(from,to)=>Math.floor((Date.parse(to)-Date.parse(from))/31557600000);
 if(p.dob&&p.dob>today){flags.push('dob');notes.push('Date of birth is in the future.')}
 else if(p.dob&&years(p.dob,today)>110){flags.push('dob');notes.push('Date of birth gives an age over 110.')}
 if(p.passportExpiry&&years(today,p.passportExpiry)>=11){flags.push('passportExpiry');notes.push('Expiry is more than ten years away, longer than passports are issued for.')}
 for(const field of ['nationality','passportCountry'])if(p.knownCodes&&!p.knownCodes[field]){flags.push(field);notes.push('Country code not recognised. Check it against the scan.')}
 if(p.nameTruncated){flags.push('givenNames');notes.push('The name fills the machine-readable line and may be shortened. Check the full name on the passport page.')}
 const age=p.dob?years(p.dob,validDate(arrival)?arrival:today):null;
 if(age!==null&&age>=0&&age<18)notes.push(`Minor, aged ${age} on arrival. Immigration may ask for guardian details.`);
 return {flags,notes};
}

// The printed (visual) part of the page holds place of birth and issue date, which the MRZ lacks.
// They have no check digit, so values read here are always shown for the broker to check.
const printedLabels={placeOfBirth:/place of birth|lieu de naissance|lugar de nacimiento|geburtsort|luogo di nascita|geboorteplaats|local de nascimento/i,passportIssued:/date of issue|date de d[ée]livrance|fecha de expedici[oó]n|ausstellungsdatum|data di rilascio|datum van afgifte|data de emiss[aã]o/i};
const monthNames=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
function printedDate(text){
 const t=text.toUpperCase().replace(/[O]/g,'0'),two=n=>String(n).padStart(2,'0');let m;
 if((m=t.match(/(\d{4})[-./ ](\d{1,2})[-./ ](\d{1,2})/)))return validDate(`${m[1]}-${two(m[2])}-${two(m[3])}`)?`${m[1]}-${two(m[2])}-${two(m[3])}`:'';
 if((m=t.match(/(\d{1,2})[-./ ](\d{1,2})[-./ ](\d{4})/)))return validDate(`${m[3]}-${two(m[2])}-${two(m[1])}`)?`${m[3]}-${two(m[2])}-${two(m[1])}`:'';
 if((m=text.toUpperCase().match(/(\d{1,2})\s*([A-Z]{3})[A-Z]*\.?\s*(?:\/\s*[A-Z]+\s*)?(\d{4})/))&&monthNames.includes(m[2]))return `${m[3]}-${two(monthNames.indexOf(m[2])+1)}-${two(m[1])}`;
 return '';
}
function printedFields(lines){
 const out={};
 for(const [field,label] of Object.entries(printedLabels))for(const line of lines){
  let joined='';const spans=(line.words||[]).map(w=>{const span=[joined.length,joined.length+w.text.length,w];joined+=w.text+' ';return span});
  const m=joined.match(label);if(!m)continue;
  const labelWords=spans.filter(([s,e])=>e>m.index&&s<m.index+m[0].length).map(s=>s[2]),h=line.bbox.y1-line.bbox.y0,x0=Math.min(...labelWords.map(w=>w.bbox.x0));
  // The value sits on the next line down, starting under the label.
  const next=lines.filter(l=>l.bbox.y0>line.bbox.y0+h*.5&&l.bbox.y0<line.bbox.y1+h*2.5).sort((a,b)=>a.bbox.y0-b.bbox.y0)[0];
  const value=[];
  for(const w of (next?.words||[]).filter(w=>w.bbox.x1>x0-h).sort((a,b)=>a.bbox.x0-b.bbox.x0)){
   if(!value.length&&w.bbox.x0>x0+h*4)break;
   if(value.length&&w.bbox.x0-value.at(-1).bbox.x1>h*1.5)break;
   value.push(w);
  }
  const text=value.map(w=>w.text).join(' ').replace(/[^\p{L}\d ,.'/-]/gu,'').trim();
  const parsed=field==='passportIssued'?printedDate(text):text.length>1?titleCase(text):'';
  if(parsed){out[field]=parsed;break}
 }
 return out;
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
// Three readers: whole pages for MRZ, cropped MRZ strips (one text block), and printed text without a character limit.
const scanReaders={};
function scanReader(kind){
 return scanReaders[kind]??=(async()=>{
  await loadScanScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js');
  const worker=await Tesseract.createWorker('eng');
  if(kind!=='printed')await worker.setParameters({tessedit_char_whitelist:'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',preserve_interword_spaces:'0'});
  if(kind==='strip')await worker.setParameters({tessedit_pageseg_mode:'6'});
  return worker;
 })();
}
const loadScanReaders=()=>Promise.all(['page','strip','printed'].map(scanReader));
async function scanPages(file){
 if(file.type==='application/pdf'||/\.pdf$/i.test(file.name)){
  await loadScanScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
  pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise,pages=[];
  // The print intent renders without requestAnimationFrame, which browsers pause in background tabs.
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
function greyLevels(canvas){
 const ctx=canvas.getContext('2d'),image=ctx.getImageData(0,0,canvas.width,canvas.height),px=image.data,grey=new Uint8Array(px.length/4),histogram=new Array(256).fill(0);
 for(let i=0;i<grey.length;i++){grey[i]=(px[i*4]*299+px[i*4+1]*587+px[i*4+2]*114)/1000;histogram[grey[i]]++}
 return {ctx,image,px,grey,histogram};
}
function copyCanvas(source,sx=0,sy=0,sw=source.width,sh=source.height,scale=1){
 const canvas=document.createElement('canvas');canvas.width=Math.round(sw*scale);canvas.height=Math.round(sh*scale);
 const ctx=canvas.getContext('2d');ctx.imageSmoothingQuality='high';ctx.drawImage(source,sx,sy,sw,sh,0,0,canvas.width,canvas.height);return canvas;
}
// Greyscale and stretch contrast so dim phone photos read like scans.
function enhance(source){
 const canvas=copyCanvas(source),{ctx,image,px,grey,histogram}=greyLevels(canvas);
 const level=share=>{let seen=0;for(let v=0;v<256;v++){seen+=histogram[v];if(seen>=grey.length*share)return v}return 255};
 const low=level(.02),high=Math.max(low+1,level(.98));
 for(let i=0;i<grey.length;i++){const v=Math.max(0,Math.min(255,(grey[i]-low)*255/(high-low)));px[i*4]=px[i*4+1]=px[i*4+2]=v}
 ctx.putImageData(image,0,0);return canvas;
}
// Black and white at Otsu's threshold, a second, differently processed view of the MRZ strip.
function binarize(source){
 const canvas=copyCanvas(source),{ctx,image,px,grey,histogram}=greyLevels(canvas),total=grey.length;
 let sum=0;for(let v=0;v<256;v++)sum+=v*histogram[v];
 let back=0,backSum=0,best=0,threshold=128;
 for(let v=0;v<256;v++){back+=histogram[v];if(!back)continue;const fore=total-back;if(!fore)break;backSum+=v*histogram[v];const mb=backSum/back,mf=(sum-backSum)/fore,between=back*fore*(mb-mf)**2;if(between>best){best=between;threshold=v}}
 for(let i=0;i<total;i++){const v=grey[i]>threshold?255:0;px[i*4]=px[i*4+1]=px[i*4+2]=v}
 ctx.putImageData(image,0,0);return canvas;
}
// Crop the two MRZ lines with a margin and enlarge them so characters are about 46 px tall.
function cropStrip(canvas,box){
 const lineHeight=(box.y1-box.y0)/2.2,padX=(box.x1-box.x0)*.03,padY=lineHeight*.7;
 const sx=Math.max(0,box.x0-padX),sy=Math.max(0,box.y0-padY),sw=Math.min(canvas.width,box.x1+padX)-sx,sh=Math.min(canvas.height,box.y1+padY)-sy;
 return copyCanvas(canvas,sx,sy,sw,sh,Math.max(1,Math.min(4,46/lineHeight)));
}
const ocrLines=data=>(data.blocks||[]).flatMap(b=>b.paragraphs.flatMap(p=>p.lines.map(l=>({text:l.text,bbox:l.bbox,words:l.words.map(w=>({text:w.text,bbox:w.bbox}))}))));
async function readStrip(reader,canvas){const {data}=await reader.recognize(canvas);return findMrzs(data.text).sort((x,y)=>mrzScore(y)-mrzScore(x))[0]||null}
// Find each passport on a page, then read its MRZ three ways and vote: the whole page, the enlarged
// strip, and the strip in black and white. The printed page supplies place of birth and issue date.
async function readPage(source,arrival){
 const [pageReader,stripReader,printedReader]=await loadScanReaders(),enhanced=enhance(source);
 let located=null;
 for(const [base,turns] of [[enhanced,[0,180,-3,3,90,270]],[source,[0,180]]]){
  for(const degrees of turns){
   const canvas=degrees?rotateCanvas(base,degrees):base,{data}=await pageReader.recognize(canvas,{},{text:true,blocks:true});
   const found=findMrzLines(ocrLines(data));
   if(found.length){located={found,degrees,canvas,original:degrees?rotateCanvas(source,degrees):source};break}
  }
  if(located)break;
 }
 if(!located)return [];
 const {data:printed}=await printedReader.recognize(located.canvas,{},{text:true,blocks:true}),printedLines=ocrLines(printed);
 const people=[];
 for(const found of located.found){
  const box=found.bbox||{x0:0,y0:0,x1:located.canvas.width,y1:located.canvas.height};
  const strip=cropStrip(located.canvas,box);
  const reads=[await readStrip(stripReader,strip),await readStrip(stripReader,binarize(cropStrip(located.original,box))),found];
  // Printed text belongs to this passport when it sits above its MRZ, within a data page's height. The MRZ
  // lines themselves are excluded, so the page can never confirm the MRZ with its own text.
  const width=box.x1-box.x0,lineHeight=(box.y1-box.y0)/2.2,region=printedLines.filter(l=>l.bbox.y1<=box.y0+lineHeight*.3&&l.bbox.y0>=box.y0-width*.75&&l.bbox.x1>box.x0-width*.05&&l.bbox.x0<box.x1&&!/<</.test(l.text));
  const person=voteReads(reads,region.map(l=>l.text).join(' ').toUpperCase().replace(/[^A-Z0-9\s]/g,'').replace(/\s+/g,' '));
  const printedValues=printedFields(region),check=plausibility(person,arrival);
  people.push({...person,...printedValues,printedFields:Object.keys(printedValues),flags:check.flags,notes:check.notes,strip:copyCanvas(strip,0,0,strip.width,strip.height,Math.min(1,900/strip.width)).toDataURL('image/jpeg',.85),verified:person.verified&&!check.flags.length});
 }
 return people;
}
// Thumbnail cropped to the page's content, so a passport on a white A4 scan is shown large enough to compare.
function scanThumbnail(canvas){
 const step=4,{width,height}=canvas,px=canvas.getContext('2d').getImageData(0,0,width,height).data;let x0=width,y0=height,x1=0,y1=0;
 for(let y=0;y<height;y+=step)for(let x=0;x<width;x+=step){const i=(y*width+x)*4;if(px[i]+px[i+1]+px[i+2]<690){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}}
 if(x1<=x0||y1<=y0)[x0,y0,x1,y1]=[0,0,width,height];
 const pad=12,sx=Math.max(0,x0-pad),sy=Math.max(0,y0-pad),sw=Math.min(width,x1+pad)-sx,sh=Math.min(height,y1+pad)-sy;
 return copyCanvas(canvas,sx,sy,sw,sh,Math.min(1,900/sw)).toDataURL('image/jpeg',.8);
}

// --- Import panel inside the broker application's crew & guests section. ---
const scanFields=[['givenNames','Given names'],['surname','Family name'],['sex','Sex'],['nationality','Nationality'],['dob','Date of birth','date'],['placeOfBirth','Place of birth'],['passport','Passport number'],['passportCountry','Issuing country'],['passportIssued','Issue date','date'],['passportExpiry','Expiry date','date']];
const scanCheckFields={passport:['passport'],dob:['dob'],expiry:['passportExpiry']};
function scanFlags(p){
 const fields=[...Object.entries(p.checks||{}).filter(([k,ok])=>!ok&&scanCheckFields[k]).flatMap(([k])=>scanCheckFields[k]),...(p.disagree||[]),...(p.flags||[])];
 return new Set(fields.flatMap(f=>f==='name'?['givenNames','surname']:[f]));
}
function openScanImport(panel,addPerson){
 panel.hidden=false;
 panel.innerHTML=`<div class="scan-import"><div class="scan-head"><div><h3>Import from passport scans</h3><p class="muted">Add the passport scans you received by email: scanned images, phone photos or PDFs, with several people per file if needed. Harbour reads each passport in this browser. Nothing is uploaded, and images are discarded once you finish.</p></div><button type="button" class="textlink" id="scan-close">Close</button></div><label class="scan-drop" id="scan-drop"><input id="scan-files" type="file" multiple accept="image/*,application/pdf"><strong>Drop passport scans here or choose files</strong><span>JPG, PNG or PDF</span></label><button type="button" class="textlink" id="scan-samples">Use fictional sample scans</button><p id="scan-status" class="scan-status" role="status" aria-live="polite"></p><div id="scan-results"></div><div class="actions" id="scan-actions" hidden><button type="button" id="scan-add">Add to manifest</button></div></div>`;
 const results=[],status=panel.querySelector('#scan-status'),list=panel.querySelector('#scan-results'),actions=panel.querySelector('#scan-actions'),addButton=panel.querySelector('#scan-add');
 const existing=()=>new Set(Array.from(document.querySelectorAll('#people [data-person="passport"]')).map(i=>i.value.trim().toUpperCase()).filter(Boolean));
 const refreshCount=()=>{const n=list.querySelectorAll('[data-scan-include]:checked').length;addButton.textContent=`Add ${n} ${n===1?'person':'people'} to manifest`;addButton.disabled=!n};
 const render=()=>{
  const onManifest=existing(),seen=new Set();
  list.innerHTML=results.map((r,i)=>{
   const p=r.person||{},key=(p.passport||'').toUpperCase(),duplicate=key&&(onManifest.has(key)||seen.has(key));if(key)seen.add(key);
   const flagged=scanFlags(p),printed=new Set(p.printedFields||[]),expired=p.passportExpiry&&p.passportExpiry<govToday();
   const confirmedNote=p.printedConfirmed?'<p class="scan-note">Passport number confirmed against the number printed on the page.</p>':'';
   const state=!r.person?['danger','Couldn’t find a passport’s machine-readable lines on this page. Type the details or leave it out.']:duplicate?['','Already on the manifest or listed twice. Left out.']:!p.verified?['warn',(p.singleRead?'Only one read found this passport, so it could not be confirmed. Compare every field with the scan':'Some values could not be confirmed. Compare the highlighted fields with the lines shown above them')+', then tick Add to manifest.']:expired?['warn','Read and verified, but this passport has expired.']:['ready','Three reads agree and the passport’s check digits match.'];
   // Only confirmed passports start ticked; anything flagged needs the broker's attention first.
   r.include??=!!r.person&&p.verified&&!duplicate;
   const badge=state[0]==='ready'?'Verified':state[0]==='danger'?'Not read':duplicate?'Duplicate':p.verified&&expired?'Expired':'Check';
   const fieldHTML=([k,label,type])=>k==='sex'?`<div><label>${label}<select data-scan-field="sex" data-scan="${i}">${['','Female','Male','Unspecified'].map(x=>`<option ${p.sex===x?'selected':''} value="${x}">${x||'Select'}</option>`).join('')}</select></label></div>`:`<div><label>${label}${printed.has(k)?' <span class="scan-source">from printed page</span>':''}<input ${type?`type="${type}"`:''} data-scan-field="${k}" data-scan="${i}" value="${esc(p[k]||'')}" class="${flagged.has(k)?'scan-flag':printed.has(k)?'scan-printed':''}"></label></div>`;
   return `<article class="scan-card"><button type="button" class="scan-thumb" data-scan-zoom="${i}" aria-label="Enlarge scan of ${esc(r.label)}"><img src="${r.thumb}" alt=""></button><div><div class="decision-line"><span class="fine">${esc(r.label)}</span><span class="badge ${badge==='Verified'?'ready':badge==='Not read'?'danger':''}">${badge}</span></div><p class="scan-note ${state[0]}">${state[1]}</p>${confirmedNote}${(p.notes||[]).map(n=>`<p class="scan-note warn">${esc(n)}</p>`).join('')}${p.strip?`<img class="scan-strip" src="${p.strip}" alt="Machine-readable lines from this scan">`:''}<div class="form-grid scan-fields">${scanFields.map(fieldHTML).join('')}<div><label>Role<select data-scan-field="role" data-scan="${i}">${['Guest','Crew'].map(x=>`<option ${r.role===x?'selected':''}>${x}</option>`).join('')}</select></label></div></div><label class="scan-include"><input type="checkbox" data-scan-include="${i}" ${r.include?'checked':''}> Add to manifest</label></div></article>`;
  }).join('');
  list.querySelectorAll('[data-scan-field]').forEach(el=>el.oninput=el.onchange=()=>{const r=results[el.dataset.scan];if(el.dataset.scanField==='role')r.role=el.value;else (r.person??={checks:{}})[el.dataset.scanField]=el.value});
  list.querySelectorAll('[data-scan-include]').forEach(el=>el.onchange=()=>{results[el.dataset.scanInclude].include=el.checked;refreshCount()});
  list.querySelectorAll('[data-scan-zoom]').forEach(el=>el.onclick=()=>el.classList.toggle('zoomed'));
  actions.hidden=!results.length;refreshCount();
 };
 const importFiles=async files=>{
  files=[...files].filter(f=>/^image\//.test(f.type)||f.type==='application/pdf'||/\.pdf$/i.test(f.name));
  if(!files.length){status.textContent='Choose JPG, PNG or PDF files.';return}
  const started=performance.now(),captain=(document.querySelector('#captain')?.value||'').trim().toLowerCase(),arrival=document.querySelector('#arrival')?.value||'';let pages=0,people=0;
  try{
   status.textContent='Loading the passport reader…';await loadScanReaders();
   for(const file of files){status.textContent=`Opening ${file.name}…`;for(const page of await scanPages(file)){
    pages++;status.textContent=`Reading ${page.label}…`;
    const found=await readPage(page.canvas,arrival),thumb=scanThumbnail(page.canvas);
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
  chosen.forEach(({person:p,role})=>addPerson({givenNames:p.givenNames,surname:p.surname,role,sex:p.sex,nationality:p.nationality,dob:p.dob,placeOfBirth:p.placeOfBirth,passport:p.passport,passportCountry:p.passportCountry,passportIssued:p.passportIssued,passportExpiry:p.passportExpiry}));
  panel.hidden=true;panel.innerHTML='';
  toast(`${chosen.length} ${chosen.length===1?'person':'people'} added from passport scans. Check the rows below before saving.`);
  document.querySelector('#people')?.scrollIntoView?.({behavior:'smooth',block:'start'});
 };
}
