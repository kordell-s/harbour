import React from 'react';
import {AbsoluteFill, Composition, Easing, Img, Sequence, interpolate, registerRoot, staticFile, useCurrentFrame} from 'remotion';

const C = {ink: '#192b2d', teal: '#00686b', sea: '#073e43', mist: '#f5f8f7', muted: '#657477', line: '#d9e4e2'};
const font = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const range = (f: number, a: number, b: number, x: number, y: number) => interpolate(f, [a, b], [x, y], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

function Logo({light = false}: {light?: boolean}) {
  return <div style={{display: 'flex', alignItems: 'center', gap: 12, color: light ? 'white' : C.ink, fontSize: 40, fontWeight: 750, letterSpacing: -2}}><span style={{display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 52, borderRadius: 14, background: light ? '#ffffff22' : C.teal, color: 'white', fontSize: 46, lineHeight: 1}}>h</span>harbour</div>;
}
function Tag({children, light = false}: {children: React.ReactNode; light?: boolean}) {
  return <div style={{fontSize: 18, fontWeight: 700, letterSpacing: 2.1, textTransform: 'uppercase', color: light ? '#b7d7d5' : C.teal}}>{children}</div>;
}
function Reveal({children, delay = 0}: {children: React.ReactNode; delay?: number}) {
  const f = useCurrentFrame();
  return <div style={{opacity: range(f, delay, delay + 16, 0, 1), transform: `translateY(${range(f, delay, delay + 24, 20, 0)}px)`}}>{children}</div>;
}
function Caption({children, light = false}: {children: React.ReactNode; light?: boolean}) {
  return <div style={{position: 'absolute', left: 96, right: 96, bottom: 72, display: 'flex', justifyContent: 'center'}}><div style={{padding: '19px 32px', background: light ? '#ffffff17' : C.sea, color: 'white', border: light ? '1px solid #ffffff30' : undefined, borderRadius: 18, fontSize: 29, fontWeight: 500, letterSpacing: -.3, lineHeight: 1.25, textAlign: 'center'}}>{children}</div></div>;
}
function Panel({file}: {file: string}) {
  return <Img src={staticFile(`screens/stakeholder-${file}.png`)} style={{display: 'block', width: '100%', height: '100%', objectFit: 'contain'}}/>;
}
function ProductFrame({title, children}: {title: string; children: React.ReactNode}) {
  const f = useCurrentFrame();
  return <div style={{position: 'absolute', left: 645, top: 175, width: 1179, height: 710, borderRadius: 22, border: '1px solid #cfdbd9', overflow: 'hidden', background: 'white', boxShadow: '0 22px 70px #14383c1c', opacity: range(f, 0, 15, .35, 1), transform: `translateY(${range(f, 0, 24, 18, 0)}px)`}}><div style={{height: 42, background: '#edf2f1', display: 'flex', alignItems: 'center', padding: '0 22px', gap: 8}}>{['#aac0bc', '#bed0cc', '#d0dcd9'].map((color, i) => <span key={i} style={{width: 9, height: 9, borderRadius: 20, background: color}}/>)}<span style={{fontSize: 15, letterSpacing: 1.3, fontWeight: 650, color: '#496964', marginLeft: 15}}>{title}</span></div><div style={{height: 666, padding: '14px 22px', overflow: 'hidden'}}>{children}</div></div>;
}
function SideCopy({step, title, body, note, noteTitle}: {step: string; title: React.ReactNode; body: string; note: React.ReactNode; noteTitle: string}) {
  return <><div style={{position: 'absolute', left: 96, top: 210, width: 435}}><Reveal><Tag>{step}</Tag></Reveal><Reveal delay={4}><h1 style={{fontSize: 60, lineHeight: 1.08, letterSpacing: -2.7, fontWeight: 650, margin: '28px 0'}}>{title}</h1></Reveal><Reveal delay={10}><p style={{fontSize: 26, lineHeight: 1.45, color: C.muted, margin: 0, maxWidth: 415}}>{body}</p></Reveal></div><div style={{position: 'absolute', left: 96, top: 728, width: 435, padding: '22px 26px', borderRadius: 18, background: C.sea, color: 'white'}}><div style={{fontSize: 16, letterSpacing: 1.8, color: '#bddbd7', fontWeight: 650, marginBottom: 10}}>{noteTitle}</div><div style={{fontSize: 23, lineHeight: 1.35}}>{note}</div></div></>;
}
function Scene({children, tinted = false}: {children: React.ReactNode; tinted?: boolean}) {
  return <AbsoluteFill style={{background: tinted ? '#edf4f2' : C.mist}}>{children}</AbsoluteFill>;
}
function Intro() {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{background: C.sea, color: 'white'}}><Img src={staticFile('coast.webp')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 65%', transform: `scale(${range(f, 0, 180, 1.035, 1.08)})`}}/><AbsoluteFill style={{background: 'linear-gradient(90deg,rgba(0,27,34,.9),rgba(0,33,38,.56) 65%,rgba(0,33,38,.22))'}}/><div style={{position: 'absolute', left: 100, top: 220}}><Reveal><Tag light>BROKERS · CUSTOMS · IMMIGRATION · ANGUILLA</Tag></Reveal><Reveal delay={5}><h1 style={{fontSize: 112, lineHeight: 1.03, letterSpacing: -5, fontWeight: 600, margin: '35px 0'}}>One visit.<br/>Connected teams.</h1></Reveal><Reveal delay={14}><div style={{fontSize: 56, fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#dbefeb'}}>A clearer way to coordinate.</div></Reveal><Reveal delay={22}><p style={{fontSize: 28, marginTop: 32, color: '#d8e7e5'}}>Broker-led preparation. Better information for every review.</p></Reveal></div><Caption light>Meet Harbour. From broker preparation to authority review and payment evidence.</Caption></AbsoluteFill>;
}
function Broker() {
  return <Scene><SideCopy step="01 / BROKER WORKSPACE" title={<>Prepare once.<br/>Keep the visit<br/>moving.</>} body="Bring vessel details, document requests and follow-ups into one visit record." noteTitle="BROKER-LED PREPARATION" note={<>A clear next step.<br/>A shared source of details.</>}/><ProductFrame title="BROKER WORKSPACE · ATTENTION QUEUE"><Panel file="broker"/></ProductFrame><Caption>Start with the broker. See outstanding work and prepare the visit for review.</Caption></Scene>;
}
function Customs() {
  const f = useCurrentFrame();
  const decisions = f >= 165;
  return <Scene tinted><SideCopy step="02 / CUSTOMS DESK" title={<>The vessel.<br/>The voyage.<br/>The evidence.</>} body="Review submitted details, representation and supporting records in a dedicated Customs workspace." noteTitle="INDEPENDENT OUTCOMES" note={<>Arrival, cruising and departure<br/>stay separate.</>}/><ProductFrame title={decisions ? 'CUSTOMS DESK · TEAM DECISION RECORD' : 'CUSTOMS DESK · VESSEL & REPRESENTATION'}><Panel file={decisions ? 'customs-decisions' : 'customs-vessel'}/></ProductFrame><Caption>{decisions ? 'Customs records each process outcome independently.' : 'Give Customs the submitted information it needs to assess the visit.'}</Caption></Scene>;
}
function Immigration() {
  const f = useCurrentFrame();
  const check = f >= 180;
  return <Scene><SideCopy step="03 / IMMIGRATION DESK" title={<>Every person.<br/>Clearer<br/>context.</>} body="Review crew and guests with nationality, date of birth, passport details and private review notes." noteTitle="IDENTITY REVIEW" note={<>Surface information to check.<br/>Keep entry decisions separate.</>}/><ProductFrame title={check ? 'IMMIGRATION DESK · PASSPORT EXPIRY CHECK' : 'IMMIGRATION DESK · CAPTURED PASSPORT INFORMATION'}><Panel file={check ? 'immigration-check' : 'immigration-passport'}/></ProductFrame><Caption>{check ? 'Flag a passport that expires during the visit for officer review.' : 'Captured passport information supports review. Immigration retains entry decisions.'}</Caption></Scene>;
}
function Epay() {
  const f = useCurrentFrame();
  const stage = f < 90 ? 'assessment' : f < 180 ? 'checkout' : 'success';
  return <Scene tinted><SideCopy step="04 / GOVERNMENT E-PAY DEMO" title={<>From assessment<br/>to receipt.</>} body="Carry the assessed amount and visit reference into a simple payment demonstration." noteTitle="SIMULATION ONLY" note={<>No money collected.<br/>Fictional amount shown.</>}/><ProductFrame title={`E-PAY DEMO · ${stage === 'assessment' ? 'REVIEW ASSESSMENT' : stage === 'checkout' ? 'SIMULATE PAYMENT' : 'LINKED DEMO RECEIPT'}`}><Panel file={`epay-${stage}`}/></ProductFrame><Caption>{stage === 'assessment' ? 'Review the assessment, amount and currency before the demo payment.' : stage === 'checkout' ? 'Simulate a successful payment without entering real card details.' : 'A linked demo receipt returns to the visit, awaiting authority verification.'}</Caption></Scene>;
}
function Reconciliation() {
  const f = useCurrentFrame();
  const verified = f >= 90;
  return <Scene><SideCopy step="05 / RECEIPT RECONCILIATION" title={<>Payment<br/>evidence.<br/>Verified<br/>separately.</>} body="Match the receipt to its assessment and keep a record of the officer’s verification." noteTitle="A DISTINCT REVIEW STEP" note={verified ? <>Receipt verified in demo.<br/>Authority decisions remain separate.</> : <>Evidence linked.<br/>Awaiting officer verification.</>}/><ProductFrame title={`CUSTOMS DESK · RECEIPT ${verified ? 'VERIFIED IN DEMO' : 'AWAITING VERIFICATION'}`}><Panel file={`customs-receipt-${verified ? 'verified' : 'pending'}`}/></ProductFrame><Caption>Payment never grants clearance or automatically issues a permit.</Caption></Scene>;
}
function Records() {
  return <Scene tinted><SideCopy step="06 / DOCUMENT HISTORY" title={<>Keep the copy.<br/>Keep the<br/>history.</>} body="Preserve issued document versions and record delivery against the same visit." noteTitle="AFTER THE ISSUANCE REVIEW" note={<>An issued demo copy.<br/>A traceable delivery record.</>}/><ProductFrame title="VISIT RECORD · ISSUED COPY & DELIVERY HISTORY"><div style={{height: '100%', display: 'grid', gridTemplateRows: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 20}}><Panel file="issued-copy"/><Panel file="delivery"/></div></ProductFrame><Caption>After explicit issuance review, preserve the copy and its delivery history.</Caption></Scene>;
}
function Outro() {
  return <AbsoluteFill style={{background: C.sea, color: 'white'}}><div style={{position: 'absolute', right: -260, top: -200, width: 1150, height: 1150, borderRadius: '50%', border: '1px solid #ffffff15'}}/><div style={{position: 'absolute', right: -100, top: -40, width: 800, height: 800, borderRadius: '50%', border: '1px solid #ffffff15'}}/><div style={{position: 'absolute', left: 100, top: 217}}><Reveal><Tag light>FOR BROKERS & PUBLIC-SECTOR STAKEHOLDERS</Tag></Reveal><Reveal delay={5}><h1 style={{fontSize: 94, letterSpacing: -4, lineHeight: 1.07, fontWeight: 600, margin: '35px 0'}}>Let’s connect your<br/>next yacht visit.</h1></Reveal><Reveal delay={12}><div style={{display: 'flex', gap: 20, alignItems: 'center', marginTop: 45}}><div style={{borderRadius: 60, padding: '23px 34px', background: 'white', color: C.sea, fontSize: 27, fontWeight: 650}}>Explore the stakeholder demo ↗</div><div style={{padding: '23px 24px', fontSize: 27, color: '#cae2de'}}>harbour-xi-eight.vercel.app</div></div></Reveal><Reveal delay={20}><p style={{fontSize: 25, color: '#c4dcd8', marginTop: 40}}>Share your workflow. Help shape the next step.</p></Reveal></div><div style={{position: 'absolute', left: 100, bottom: 78, maxWidth: 980, fontSize: 21, color: '#bed6d2', lineHeight: 1.6}}>Working prototype · Fictional data · Simulated authority actions<br/>No live government integration, money collected or official document validity.</div><div style={{position: 'absolute', right: 96, bottom: 84, width: 510, textAlign: 'right', fontSize: 16, lineHeight: 1.5, color: '#a5c2be', overflowWrap: 'anywhere'}}>Coastal photo: Roy Googin · CC BY 3.0<br/>creativecommons.org/licenses/by/3.0<br/>commons.wikimedia.org/wiki/File:Anguilla-aerial_view_western_portion.jpg<br/>Cropped, colour overlay and animated framing.</div></AbsoluteFill>;
}
const scenes = [
  {at: 0, end: 180, component: Intro},
  {at: 180, end: 390, component: Broker},
  {at: 390, end: 660, component: Customs},
  {at: 660, end: 960, component: Immigration},
  {at: 960, end: 1260, component: Epay},
  {at: 1260, end: 1470, component: Reconciliation},
  {at: 1470, end: 1620, component: Records},
  {at: 1620, end: 1800, component: Outro},
];
function Pitch() {
  const f = useCurrentFrame();
  const dark = f < 180 || f >= 1620;
  return <AbsoluteFill style={{fontFamily: font, color: C.ink, background: C.sea}}><style>{'*, *::before, *::after { box-sizing: border-box; }'}</style>{scenes.map(({at, end, component: Comp}) => <Sequence key={at} from={at} durationInFrames={end - at}><Comp/></Sequence>)}<div style={{position: 'absolute', left: 96, top: 48}}><Logo light={dark}/></div><div style={{position: 'absolute', right: 96, top: 58, fontSize: 17, letterSpacing: 2, fontWeight: 650, border: `1px solid ${dark ? '#ffffff55' : C.line}`, padding: '12px 20px', borderRadius: 30, color: dark ? '#e0efed' : C.teal}}>PRODUCT DEMO</div><div style={{position: 'absolute', bottom: 29, left: 96, right: 96, height: 3, background: dark ? '#ffffff20' : '#cededb'}}><div style={{height: '100%', width: `${f / 1799 * 100}%`, background: dark ? '#a8d7cf' : C.teal}}/></div></AbsoluteFill>;
}
const Root = () => <Composition id="HarbourStakeholderPitch" component={Pitch} durationInFrames={1800} fps={30} width={1920} height={1080}/>;
registerRoot(Root);
