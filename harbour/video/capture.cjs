const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const puppeteer=require('puppeteer-core');
(async()=>{
 const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--allow-file-access-from-files'],defaultViewport:{width:1440,height:1000,deviceScaleFactor:2}});
 const page=await browser.newPage();
 await page.goto(pathToFileURL(path.resolve(__dirname,'../dist/index.html')).href,{waitUntil:'networkidle0'});
 await page.evaluate(()=>{dashboard();});
 await page.screenshot({path:path.join(__dirname,'public/screens/dashboard.png')});
 await page.evaluate(()=>{detail('1');});
 await page.screenshot({path:path.join(__dirname,'public/screens/review.png')});
 await (await page.$('.corrections')).screenshot({path:path.join(__dirname,'public/screens/correction.png')});
 await (await page.$('.details > div:nth-child(2) > .panel')).screenshot({path:path.join(__dirname,'public/screens/processes.png')});
 await page.evaluate(()=>{
  const v=visits.find(x=>x.id==='3');
  saveDocumentDraft(v,'cruising',{...documentDefaults(v),applicant:'Taylor Sample',applicantAddress:'Sample applicant address',ownerAddress:'Sample owner address',ownerAgent:'Sample Maritime Agent',agentPhone:'000-0000',tonnageType:'Registered tonnage',tonnageSource:'Fictional vessel register',description:'Fictional motor yacht',propulsion:'Power',rig:'Not applicable',colour:'White',ownerStatus:'Unconfirmed',period:'One week',requestedStart:'2027-01-10',applicationDate:'2027-01-08',declaration:'Confirmed for demo'});
  documentPack('3');
 });
 await page.screenshot({path:path.join(__dirname,'public/screens/prepare.png')});
 await (await page.$('#doc-draft')).screenshot({path:path.join(__dirname,'public/screens/application.png')});
 await page.evaluate(()=>{
  const v=visits.find(x=>x.id==='3');submitDocumentRequest(v,'cruising');
  createAssessment(v,{requestId:'REQ-1',actor:'Demo Customs officer',reference:'DEMO-A-1',amount:'25.50',currency:'XCD',date:'2027-01-08',basis:'Fictional amount for demonstration; not a tariff quote',kind:'Fee'});
  addLinkedReceipt(v,{assessmentId:'ASSESS-1',receipt:'DEMO-R-1',amount:'25.50',currency:'XCD',date:'2027-01-08'});
  documentPack('3');
 });
 await (await page.$('aside .document-entry')).screenshot({path:path.join(__dirname,'public/screens/receipt-pending.png')});
 await page.evaluate(()=>{
  const v=visits.find(x=>x.id==='3');verifyLinkedReceipt(v,'RECEIPT-1','Demo Customs officer','Matched fictional receipt to assessment');documentPack('3');
 });
 await (await page.$('aside .document-entry')).screenshot({path:path.join(__dirname,'public/screens/receipt-verified.png')});
 await page.evaluate(()=>{
  const v=visits.find(x=>x.id==='3');
  const result=issueDemoDocument(v,{requestId:'REQ-1',reference:'DEMO-C-1',actor:'Demo Customs officer',note:'Fictional evidence reviewed',from:'2027-01-10',until:'2027-01-16',issueDate:'2027-01-09',issuePlace:'Road Bay',conditions:'Fictional permit scope — demonstration only'});
  if(!result.ok)throw Error(result.errors.join(','));
  recordDocumentDelivery(v,'DOC-1','Sample appointed agent');documentView('3','DOC-1');
 });
 await (await page.$('.paper-document')).screenshot({path:path.join(__dirname,'public/screens/permit.png')});
 await (await page.$('.document-entry')).screenshot({path:path.join(__dirname,'public/screens/delivery.png')});
 await browser.close();
 fs.copyFileSync(path.resolve(__dirname,'../dist/coast.webp'),path.join(__dirname,'public/coast.webp'));
 console.log('Captured 10 actual UI views using fictional fixtures.');
})().catch(error=>{console.error(error);process.exit(1)});
