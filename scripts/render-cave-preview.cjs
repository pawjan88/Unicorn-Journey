const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../dist');
// Standalone scene: generation never imports or starts the main game.
const server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(name==='/__cave_preview'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Cave episode card</title>');return;}
  const file=path.join(root,name);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':'application/octet-stream');res.end(data);});
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
  try{
    const page=await browser.newPage();await page.goto(`http://127.0.0.1:${server.address().port}/__cave_preview`);
    const encoded=await page.evaluate(async()=>{
      const THREE=await import('/vendor/three.module.js');
      const {LowPolyAssets}=await import('/low-poly-models.js');
      const {caveCrystal,caveGolem,crystalCrab}=await import('/cave-models.js');
      const a=new LowPolyAssets(),renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});
      renderer.setPixelRatio(1);renderer.setSize(480,280);renderer.outputColorSpace=THREE.SRGBColorSpace;
      renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.20;
      const scene=new THREE.Scene();scene.background=new THREE.Color(0xdce4e0);
      scene.add(new THREE.HemisphereLight(0xf9f1e8,0x657f87,2.2));
      const sun=new THREE.DirectionalLight(0xffebd2,2.8);sun.position.set(-6,10,7);scene.add(sun);
      const cyan=new THREE.PointLight(0x73e9e8,4,11,1.3);cyan.position.set(-.6,2.1,-1);scene.add(cyan);
      const plum=new THREE.PointLight(0xcda1ef,2.4,9,1.2);plum.position.set(3,1,2);scene.add(plum);
      const content=new THREE.Group();scene.add(content);
      a.mesh(content,'cylinder',0x7d9190,0,-.35,0,6.3,.72,5.1);
      a.mesh(content,'box',0xc8c2aa,0,.025,1.5,2.1,.06,7.5);
      // A broad vaulted rock opening and a dark interior make the third world legible.
      a.mesh(content,'box',0x3a5261,0,2.20,-3.70,5.7,4.50,.18);
      for(const [x,y,z,sx,sy,sz,color]of [
        [-3.7,1.45,-2.8,1.2,1.8,1.3,0x718d96],[3.7,1.45,-2.8,1.2,1.8,1.3,0x81979c],
        [-3.15,3.32,-3.05,1.15,1.24,1.08,0x9baca8],[3.15,3.32,-3.05,1.15,1.24,1.08,0x80959e],
        [-1.98,4.41,-3.18,1.4,.92,1.1,0x859da4],[1.98,4.41,-3.18,1.4,.92,1.1,0x9aaba8],
        [0,4.88,-3.20,1.64,.80,1.06,0x8ca5a8],[-4.4,.16,1.8,.9,.46,1.2,0x839c9c],
        [4.3,.15,1.9,.9,.5,1.05,0x96a8a3]
      ])a.mesh(content,'rock',color,x,y,z,sx,sy,sz);
      const lake=a.mesh(content,'cylinder',a.mat(0x79bebd,{emissive:0x417c8d,emissiveIntensity:.18,metalness:.25,roughness:.45}),-2.65,.03,.45,1.25,.055,1.9);
      lake.rotation.y=.2;
      for(const [x,z,scale]of [[-2.8,-1.4,3.8],[-3.7,.85,2.4],[2.9,-2.0,2.5],[3.45,2.0,1.8],[-2.6,2.6,1.4]]){
        const crystal=caveCrystal(a);crystal.position.set(x,.14+scale*.18,z);crystal.scale.setScalar(scale);crystal.rotation.z=x<0?-.17:.16;content.add(crystal);
      }
      const heart=caveCrystal(a);heart.position.set(0,2.64,-3.24);heart.scale.setScalar(3.6);content.add(heart);
      const golem=caveGolem(a);golem.position.set(.16,.06,-.65);golem.rotation.y=.20;content.add(golem);
      const crab=crystalCrab(a);crab.position.set(1.85,.05,2.6);crab.rotation.y=-.35;crab.scale.setScalar(.85);content.add(crab);
      for(const [x,z,height]of [[-2.5,3.1,.68],[-3.0,2.5,.46],[3.7,.35,.72],[2.9,.85,.45]]){
        a.mesh(content,'taper',0xc6d1bb,x,height*.42,z,.085,height*.84,.085);
        a.mesh(content,'round',a.mat(x<0?0x9bdcd1:0xc9a9da,{emissive:x<0?0x63c2bc:0xa786c4,emissiveIntensity:.23}),x,height,z,.38,.20,.32);
        a.mesh(content,'round',0xe9e5be,x-.13,height+.075,z+.16,.055,.03,.04);
      }
      const camera=new THREE.PerspectiveCamera(35,480/280,.1,200);camera.position.set(10,9.4,14);camera.lookAt(0,1.6,-.1);
      await a.ready();renderer.render(scene,camera);const data=renderer.domElement.toDataURL('image/png');renderer.dispose();a.dispose();return data;
    });
    const file=path.join(root,'assets','episode-cave.png');fs.writeFileSync(file,Buffer.from(encoded.split(',')[1],'base64'));console.log('Rendered:',file);
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
