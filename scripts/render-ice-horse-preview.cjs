const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../dist');
const server=http.createServer((req,res)=>{
 if(req.url==='/__ice-preview'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Crystal unicorn preview</title>');return;}
 const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.join(root,name);
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.svg')?'image/svg+xml':'application/octet-stream');res.end(data);});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage();await page.goto(`http://127.0.0.1:${server.address().port}/__ice-preview`);
  const data=await page.evaluate(async()=>{
   const THREE=await import('/vendor/three.module.js'),{LowPolyAssets}=await import('/low-poly-models.js?v=17'),{HORSES}=await import('/characters.js?v=17');
   const assets=new LowPolyAssets(),scene=new THREE.Scene(),renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
   renderer.setPixelRatio(1);renderer.setSize(480,280);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
   scene.background=new THREE.Color(0xe0eaf0);scene.add(new THREE.HemisphereLight(0xfff7e5,0x6b92ab,2.2));const sun=new THREE.DirectionalLight(0xfff8f0,3);sun.position.set(-4,9,6);scene.add(sun);
   scene.add(assets.unicorn(HORSES.find(horse=>horse.id==='ice')));assets.mesh(scene,'cylinder',0xb4ccdb,0,-.09,0,1.3,.18,1.2);
   const camera=new THREE.PerspectiveCamera(35,480/280,.1,200);camera.position.set(3.3,2.4,4.7);camera.lookAt(0,1.1,0);renderer.render(scene,camera);const data=renderer.domElement.toDataURL('image/png');renderer.dispose();assets.dispose();return data;
  });
  fs.writeFileSync(path.join(root,'assets/unicorn-portrait-ice.png'),Buffer.from(data.split(',')[1],'base64'));console.log('Rendered: unicorn-portrait-ice.png');
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
