// Records a real, scripted run of passport scan import through to the crew and passenger lists.
// Usage: node record-scan-demo.cjs [base URL] [scan files…]
// Defaults to http://127.0.0.1:8000 and the fictional samples in dist/samples. Writes output/passport-scan-demo.mp4.
// Needs Google Chrome, ffmpeg on PATH, and network access for the in-browser reader (loaded from CDNs).
const path=require('node:path');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const puppeteer=require('puppeteer-core');

const base=process.argv[2]||'http://127.0.0.1:8000';
const samples=path.resolve(__dirname,'../dist/samples');
const files=process.argv.length>3?process.argv.slice(3).map(f=>path.resolve(f)):['sample-passport-scans.pdf','sample-phone-photo.jpg','sample-smudged-scan.jpg'].map(f=>path.join(samples,f));
const out=path.join(__dirname,'output');
fs.mkdirSync(out,{recursive:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));

// Overlay: a visible cursor, captions, title cards and file chips. Injected into the page for recording only.
const overlay=`(()=>{
 const css=document.createElement('style');css.textContent=\`
 #demo-cursor{position:fixed;left:0;top:0;width:26px;height:26px;z-index:2147483647;pointer-events:none;transition:transform .7s cubic-bezier(.3,.7,.2,1);filter:drop-shadow(0 2px 3px #0005)}
 #demo-cursor.down{scale:.85}
 #demo-ripple{position:fixed;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:3px solid #00686b;z-index:2147483646;pointer-events:none;opacity:0}
 #demo-ripple.on{animation:ripple .5s ease-out}
 @keyframes ripple{from{opacity:.9;transform:scale(.3)}to{opacity:0;transform:scale(1.4)}}
 #demo-caption{position:fixed;left:50%;bottom:34px;transform:translateX(-50%);max-width:1100px;padding:16px 28px;border-radius:16px;background:#123c3fee;color:#fff;font:600 25px/1.35 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:center;z-index:2147483645;pointer-events:none;opacity:0;transition:opacity .35s}
 #demo-caption.on{opacity:1}
 #demo-card{position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:18px;background:linear-gradient(160deg,#0d4a4d,#00686b);color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:center;opacity:0;transition:opacity .6s;pointer-events:none}
 #demo-card.on{opacity:1}
 #demo-card h1{font-size:64px;margin:0;letter-spacing:-1px}#demo-card p{font-size:28px;margin:0;max-width:1100px;opacity:.92}#demo-card small{font-size:18px;opacity:.75;margin-top:24px}
 .demo-chip{position:fixed;z-index:2147483646;padding:12px 18px;border-radius:12px;background:#fff;border:1px solid #c7d8d3;box-shadow:0 10px 24px #0003;font:600 17px -apple-system,BlinkMacSystemFont,sans-serif;color:#173334;transition:transform 1.3s cubic-bezier(.4,0,.2,1),opacity .4s;pointer-events:none}
 \`;document.head.append(css);
 const cursor=document.createElement('div');cursor.id='demo-cursor';cursor.innerHTML='<svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 2l16 9.5-7 1.6-3.6 6.9z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>';
 const ripple=document.createElement('div');ripple.id='demo-ripple';
 const caption=document.createElement('div');caption.id='demo-caption';
 const card=document.createElement('div');card.id='demo-card';
 document.body.append(cursor,ripple,caption,card);
 window.demo={x:720,y:400,
  move(x,y){this.x=x;this.y=y;cursor.style.transform=\`translate(\${x-4}px,\${y-2}px)\`},
  tap(){cursor.classList.add('down');ripple.style.left=this.x+'px';ripple.style.top=this.y+'px';ripple.classList.remove('on');void ripple.offsetWidth;ripple.classList.add('on');setTimeout(()=>cursor.classList.remove('down'),180)},
  say(text){caption.textContent=text;caption.classList.toggle('on',!!text)},
  card(html){card.innerHTML=html||'';card.classList.toggle('on',!!html)},
  chips(names,target){
   const box=target.getBoundingClientRect();
   return names.map((n,i)=>{const c=document.createElement('div');c.className='demo-chip';c.textContent='📄 '+n;c.style.left='60px';c.style.top=(innerHeight-220+i*58)+'px';document.body.append(c);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{c.style.transform=\`translate(\${box.left+box.width/2-200-60+i*14}px,\${box.top+box.height/2-(innerHeight-220+i*58)-10}px)\`}));return c});
  }
 };
 demo.move(720,400);
})()`;

(async()=>{
 const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,defaultViewport:{width:1440,height:810,deviceScaleFactor:4/3}});
 const page=await browser.newPage();
 page.on('pageerror',e=>console.error('page error:',e.message));
 // Start as the Broker role, with the reader warmed up so the recording shows reading speed, not the first download.
 await page.evaluateOnNewDocument(()=>{try{localStorage.setItem('harbour-role','broker')}catch{}});
 await page.goto(base+'/#dashboard',{waitUntil:'networkidle0'});
 await page.evaluate(()=>loadScanReaders());
 await page.evaluate(overlay);

 const say=text=>page.evaluate(t=>demo.say(t),text);
 const card=html=>page.evaluate(h=>demo.card(h),html);
 const scrollTo=async(selector,block='center')=>{await page.evaluate((s,b)=>document.querySelector(s).scrollIntoView({behavior:'smooth',block:b}),selector,block);await pause(900)};
 const pointAt=async selector=>{const box=await page.evaluate(s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.left+Math.min(r.width/2,140),y:r.top+r.height/2}},selector);await page.evaluate(b=>demo.move(b.x,b.y),box);await pause(800);return box};
 const click=async selector=>{await pointAt(selector);await page.evaluate(()=>demo.tap());await page.click(selector);await pause(500)};
 const type=async(selector,text)=>{await pointAt(selector);await page.click(selector,{clickCount:3});await page.type(selector,text,{delay:35})};
 const fill=(values)=>page.evaluate(v=>Object.entries(v).forEach(([k,x])=>{const el=document.querySelector(`#intakeform [name="${k}"]`);el.value=x;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}),values);

 const recording=path.join(out,'passport-scan-demo.webm');
 const recorder=await page.screencast({path:recording});

 await card('<h1>harbour</h1><p>From emailed passport scans to crew and passenger lists</p><small>Fictional people and passports · Recorded in the Harbour demo</small>');
 await pause(3500);await card('');await pause(700);

 await say('A broker starts a new yacht application.');
 await click('a[href="#intake"]');await pause(800);
 await type('#name','Marisol');
 await fill({flag:'Cayman Islands',registration:'DEMO-MS-505',length:'38 m',email:'captain@example.invalid',arrival:'2027-01-20',departure:'2027-01-27'});
 await type('#captain','Daniel Chukwuma Okafor');
 await pause(600);

 await say('The guests’ passports arrived by email: a scanned PDF, a phone photo and a smudged scan.');
 await scrollTo('.people-actions','start');
 await click('#import-scans');await pause(500);
 await scrollTo('#scan-drop','center');
 await page.evaluate(names=>{const t=document.querySelector('#scan-drop');t.classList.add('over');window.demoChips=demo.chips(names,t)},files.map(f=>path.basename(f)));
 await pause(1700);
 await page.evaluate(()=>{demoChips.forEach(c=>c.style.opacity=0);document.querySelector('#scan-drop').classList.remove('over')});
 await (await page.$('#scan-files')).uploadFile(...files);

 await say('Harbour reads every passport in the browser. Nothing is uploaded.');
 await page.waitForFunction(()=>/^Read /.test(document.querySelector('#scan-status')?.textContent||''),{timeout:180000,polling:500});
 const summary=await page.$eval('#scan-status',el=>el.textContent);
 await scrollTo('#scan-status','start');
 await say(summary.replace(/\.\s.*$/,'.')+' Each one is read three ways and checked against its check digits.');
 await pause(3200);

 await say('Verified means three reads agree and the passport’s own check digits match.');
 await scrollTo('.scan-card:nth-child(1)','start');await pause(2200);
 const cards=await page.$$eval('.scan-card',els=>els.map(e=>({badge:e.querySelector('.badge').textContent,printed:/confirmed against/.test(e.textContent),surname:e.querySelector('[data-scan-field="surname"]').value})));
 const confirmed=cards.findIndex(c=>c.printed&&c.badge==='Verified');
 if(confirmed>=0){
  await say('Where reads disagree, the number printed on the page settles it.');
  await scrollTo(`.scan-card:nth-child(${confirmed+1})`,'start');await pause(3000);
 }
 const check=cards.findIndex(c=>c.badge==='Check');
 if(check>=0){
  const card=`.scan-card:nth-child(${check+1})`;
  await say('A smudged birth date cannot be confirmed, so Harbour leaves it blank instead of guessing.');
  await scrollTo(card,'start');await pause(2600);
  await click(`${card} .scan-thumb`);await pause(1400);
  await say('The broker checks the scan, types the date and ticks the passport.');
  await scrollTo(`${card} [data-scan-field="dob"]`,'center');
  await pointAt(`${card} [data-scan-field="dob"]`);await page.click(`${card} [data-scan-field="dob"]`);
  await page.evaluate(sel=>{const el=document.querySelector(sel);el.value='1996-01-27';el.dispatchEvent(new Event('input',{bubbles:true}))},`${card} [data-scan-field="dob"]`);
  await pause(700);
  await click(`${card} [data-scan-include]`);await pause(600);
 }

 await say('One click adds everyone to the manifest.');
 await scrollTo('#scan-add','center');
 await click('#scan-add');await pause(1200);
 await scrollTo('#people','start');await pause(1500);
 await say('The phone photo was too tilted to read place of birth, so the broker adds it, with the captain’s rank.');
 const okafor=await page.$$eval('#people .person',rows=>rows.findIndex(r=>r.querySelector('[data-person="surname"]').value==='Okafor'));
 if(okafor>=0){
  const row=`#people .person:nth-child(${okafor+1})`;
  await scrollTo(`${row} [data-person="placeOfBirth"]`,'center');
  await type(`${row} [data-person="placeOfBirth"]`,'Melbourne');
  await type(`${row} [data-person="rank"]`,'Master');
  await pause(600);
 }
 await say('');
 await fill({previousPort:'Gustavia, Saint Barthélemy',nextPort:'English Harbour, Antigua',tonnage:'210',registryPort:'George Town',owner:'Fictional yacht owner'});
 await scrollTo('#savedraft','center');
 await click('#savedraft');await pause(1500);

 await say('Harbour generates the crew and passenger lists from the passport data.');
 await click('a[href^="#manifest/"]');await pause(1500);
 await pause(1800);
 await scrollTo('.fal-page','start');await pause(3200);
 await say('Laid out after the IMO FAL forms used for ship arrivals, ready to print, save as PDF or export.');
 await scrollTo('.fal-page:nth-of-type(2)','start');await pause(3600);
 await scrollTo('.manifest-page .pagehead','center');await pause(800);
 await click('#manifest-csv');await pause(1500);
 await say('');

 await card(`<h1>From passport scans to manifest</h1><p>${summary.replace(/\.\s.*$/,'')} in this recording. Every value is either verified or flagged for a quick check, never guessed.</p><small>Fictional demo · Not connected to government systems · Passport scans are read in the browser and never uploaded</small>`);
 await pause(5000);

 await recorder.stop();
 await browser.close();
 const mp4=path.join(out,'passport-scan-demo.mp4');
 execFileSync('ffmpeg',['-y','-loglevel','error','-i',recording,'-vf','scale=1920:1080:flags=lanczos,format=yuv420p','-c:v','libx264','-crf','20','-preset','slow','-r','30','-movflags','+faststart',mp4]);
 console.log('Wrote',mp4);
})().catch(e=>{console.error(e);process.exit(1)});
