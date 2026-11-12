const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../dist');
const server=http.createServer((req,res)=>{
  if(req.url==='/__previews'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Model previews</title>');return;}
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.join(root,name);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.svg')?'image/svg+xml':'application/octet-stream');res.end(data);});
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
  try{
    const page=await browser.newPage();await page.goto(`http://127.0.0.1:${server.address().port}/__previews`);
    const images=await page.evaluate(async()=>{const {renderModelPreviews}=await import('/low-poly-models.js?v=12');return renderModelPreviews();});
    for(const [name,data]of Object.entries(images)){fs.writeFileSync(path.join(root,'assets',name+'.png'),Buffer.from(data.split(',')[1],'base64'));console.log('Rendered:',name+'.png');}
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
