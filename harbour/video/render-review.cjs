const {bundle}=require('@remotion/bundler');
const {selectComposition,renderStill}=require('@remotion/renderer');
(async()=>{
 const serveUrl=await bundle({entryPoint:require('path').resolve('src/index.tsx')});
 const browserExecutable='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
 const composition=await selectComposition({serveUrl,id:'HarbourBrokerPitch',browserExecutable});
 for(const frame of [100,340,620,749,757,900,1240,1480,1597,1720]){
  await renderStill({serveUrl,composition,frame,output:`output/review-${frame}.png`,browserExecutable});
  console.log('Reviewed frame '+frame);
 }
})().catch(e=>{console.error(e);process.exit(1)});
