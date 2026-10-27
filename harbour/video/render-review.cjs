const {bundle}=require('@remotion/bundler');
const {selectComposition,renderStill}=require('@remotion/renderer');
(async()=>{
 const serveUrl=await bundle({entryPoint:require('path').resolve('src/index.tsx')});
 const browserExecutable='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
 const composition=await selectComposition({serveUrl,id:'HarbourStakeholderPitch',browserExecutable});
 for(const frame of [100,280,480,600,760,900,1000,1100,1200,1300,1400,1540,1720,1799,659,660,959,960]){
  await renderStill({serveUrl,composition,frame,output:`output/review-${frame}.png`,browserExecutable});
  console.log('Reviewed frame '+frame);
 }
})().catch(e=>{console.error(e);process.exit(1)});
