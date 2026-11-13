const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../dist');
const server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(name==='/__winter_preview'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Winter episode card</title>');return;}
  const file=path.join(root,name);if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':'application/octet-stream');res.end(data);});
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
  try{
    const page=await browser.newPage();await page.goto(`http://127.0.0.1:${server.address().port}/__winter_preview`);
    for(const mode of process.argv.includes('--inspect')?['card','sisters','creatures','wildlife']:['card']){
      const encoded=await page.evaluate(async mode=>{
        const THREE=await import('/vendor/three.module.js'),{LowPolyAssets}=await import('/low-poly-models.js');
        const {snowflake,snowImp,iceDragon,frostKing,reindeer,snowyOwl,mammoth,winterSister}=await import('/winter-models.js');
        const a=new LowPolyAssets(),renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true}),wide=mode!=='card';
        const width=wide?1200:480,height=wide?800:280;renderer.setPixelRatio(1);renderer.setSize(width,height);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
        const scene=new THREE.Scene();scene.background=new THREE.Color(0xe0ebeb);scene.add(new THREE.HemisphereLight(0xfffaf0,0x7a9db0,2.0));
        const sun=new THREE.DirectionalLight(0xfff0dc,2.8);sun.position.set(-5,9,8);scene.add(sun);const fill=new THREE.DirectionalLight(0x95e7f2,.8);fill.position.set(5,4,-5);scene.add(fill);
        const content=new THREE.Group();scene.add(content);const camera=new THREE.PerspectiveCamera(35,width/height,.1,200);
        if(mode==='sisters'){
          const elsa=winterSister(a,'elsa'),anna=winterSister(a,'anna');elsa.position.x=-.72;anna.position.x=.72;elsa.rotation.y=.08;anna.rotation.y=-.08;content.add(elsa,anna);
          a.mesh(content,'cylinder',0xc1dadd,0,-.12,0,2.2,.21,1.5);camera.position.set(.3,2.2,5.3);camera.lookAt(0,1.12,0);
        }else if(mode==='creatures'){
          const imp=snowImp(a);imp.position.set(-2.5,0,0);const dragon=iceDragon(a);dragon.position.set(0,0,0);const king=frostKing(a);king.scale.multiplyScalar(.60);king.position.set(2.5,0,-.3);content.add(imp,dragon,king);
          const deer=reindeer(a);deer.position.set(-2.4,0,-3.3);const big=mammoth(a);big.scale.setScalar(.80);big.position.set(2.1,0,-3.6);const owl=snowyOwl(a);owl.position.set(0,2.8,-2.6);content.add(deer,big,owl);
          a.mesh(content,'cylinder',0xc1dadd,0,-.18,-1.3,5,.30,4.5);camera.position.set(6,5.2,12);camera.lookAt(0,1.1,-1.4);
        }else if(mode==='wildlife'){
          const deer=reindeer(a);deer.position.set(-2.5,0,.5);const big=mammoth(a);big.position.set(1.7,0,-1.2);big.rotation.y=-.25;const owl=snowyOwl(a);owl.position.set(-.7,2.9,-1);content.add(deer,big,owl);
          a.mesh(content,'cylinder',0xc1dadd,0,-.18,-.7,5,.3,4);camera.position.set(7,5.1,11);camera.lookAt(0,1.1,-.4);
        }else{
          a.mesh(content,'cylinder',0xaac5cf,0,-.37,0,6.4,.72,5.2);a.mesh(content,'cylinder',0xe1efec,0,-.035,0,6.3,.09,5.1);a.mesh(content,'box',0xb8dce3,0,.025,1.5,2.10,.06,7.2);
          const ice=a.mat(0x9bcbdc,{metalness:.25,roughness:.28}),edge=0xd8ecec;
          a.mesh(content,'box',ice,0,1.9,-2.2,4.1,3.8,2.1);a.mesh(content,'box',0x4b7d99,0,1.15,-1.13,1.25,2.3,.09);
          for(const [x,z,h]of [[-2.3,-1.6,4.6],[2.3,-1.6,4.6],[-1.1,-3.2,5.6],[1.1,-3.2,5.6]]){
            a.mesh(content,'cylinder',ice,x,h*.5,z,.78,h,.78);a.mesh(content,'cone',0xbadce9,x,h+.74,z,1.04,1.56,1.04);a.mesh(content,'cone',edge,x,h+.82,z,.45,.90,.45);
          }
          for(const x of [-1.7,-.85,0,.85,1.7])a.mesh(content,'box',edge,x,3.95,-1.15,.42,.48,.35);
          for(const [x,z,h]of [[-4.2,-.9,2.7],[-4.6,1.7,1.8],[4.2,-.45,2.8],[3.95,2.2,1.7],[-3.2,3.1,1.3]]){
            a.mesh(content,'taper',0x7896a2,x,h*.3,z,.12,h*.6,.12);for(let i=0;i<3;i++)a.mesh(content,'cone',i%2?0xb9d8da:0xecf4ee,x,h*.49+i*h*.20,z,.85-i*.18,h*.61,.85-i*.18);
          }
          for(let band=0;band<3;band++){
            const positions=[],indices=[];for(let i=0;i<=16;i++){const x=-5.4+i*10.8/16,y=5.8+Math.sin(i*.35)*.40+band*.24;positions.push(x,y,-4.5,x,y+.64,-4.5);if(i<16){const n=i*2;indices.push(n,n+2,n+1,n+1,n+2,n+3);}}
            const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();a.geometries['winterCardAurora'+band]=geometry;
            content.add(new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:[0x8edac4,0x91c8e1,0xbba3d9][band],transparent:true,opacity:.40,side:THREE.DoubleSide,depthWrite:false})));
          }
          const king=frostKing(a);king.scale.multiplyScalar(.42);king.position.set(0,.06,.25);content.add(king);
          for(const [id,x]of [['elsa',-1.85],['anna',1.85]]){const sister=winterSister(a,id);sister.scale.setScalar(.70);sister.position.set(x,.05,1.6);sister.rotation.y=-x*.09;content.add(sister);}
          const flake=snowflake(a);flake.scale.setScalar(1.85);flake.position.set(0,.90,3.3);content.add(flake);
          camera.position.set(11,10.4,16);camera.lookAt(0,2.2,-.1);
        }
        renderer.render(scene,camera);const data=renderer.domElement.toDataURL('image/png');renderer.dispose();a.dispose();return data;
      },mode);
      const file=mode==='card'?path.join(root,'assets','episode-ice.png'):path.resolve(__dirname,'../artifacts/winter-assets/'+mode+'.png');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,Buffer.from(encoded.split(',')[1],'base64'));console.log('Rendered:',file);
    }
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
