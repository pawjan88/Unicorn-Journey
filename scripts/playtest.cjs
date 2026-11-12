const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const root=path.resolve(__dirname,'../dist');
const output=path.resolve(process.env.PLAYTEST_OUTPUT||'artifacts/playtest');
fs.mkdirSync(output,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.mp3':'audio/mpeg','.ttf':'font/ttf'};
const server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.join(root,name==='/'?'index.html':name);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(data);});
});
const report={browser:'Chromium',checks:[],errors:[],screenshots:[],startedAt:new Date().toISOString()};
let browser;
async function run(){
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const executable=process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);
  browser=await chromium.launch({executablePath:executable,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
  const page=await browser.newPage({viewport:{width:1440,height:960}});
  page.on('pageerror',error=>report.errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)report.errors.push(`${response.status()} ${response.url()}`);});
  page.on('console',message=>{if(message.type()==='error'&&!message.text().includes('context is lost'))report.errors.push(message.text());});
  const state=()=>page.evaluate(()=>window.__unicornQA.snapshot());
  const wait=(fn,arg)=>page.waitForFunction(fn,arg,{timeout:20000});
  const checkpoint=(distance,x=0)=>page.evaluate(([d,x])=>window.__unicornQA.checkpoint(d,x),[distance,x]);
  async function shot(name){await page.screenshot({path:path.join(output,name+'.png'),fullPage:true});report.screenshots.push(name+'.png');}
  async function check(name,action){try{await action();report.checks.push(name);console.log('PASS:',name);}catch(error){report.failedState=await state();await shot('FAILED');throw error;}}
  await page.goto(base+'/?qa=1');
  await page.locator('#play:not([disabled])').waitFor({timeout:60000});
  await check('First actionable menu, local font, two episode cards and three horses',async()=>{
    assert.equal(await page.locator('.episode-option').count(),2);assert.equal(await page.locator('#horse-picker button').count(),3);
    assert(await page.evaluate(()=>document.fonts.check('16px Pixelify')));assert.equal((await state()).audio.state,undefined);
    assert(await page.locator('#play').evaluate(node=>{const rect=node.getBoundingClientRect();return rect.top>=0&&rect.bottom<=innerHeight;}));await shot('01-menu-desktop');
  });
  await check('Episode selection and all three coat/horn palettes',async()=>{
    for(const horse of ['sunny','moon','rose']){await page.click('#horse-'+horse);assert.equal((await state()).horse,horse);assert.equal(await page.locator('#horse-'+horse).getAttribute('aria-pressed'),'true');}
    await page.click('#episode-dino');assert.equal((await state()).episode,'dino');await shot('02-menu-dinosaurs');
    await page.click('#episode-forest');assert.equal((await state()).horse,'rose');await page.click('#play');
    await wait(()=>window.__unicornQA.snapshot().audio.buffers===12);await shot('03-forest');
  });
  await check('Hold Up to ride, release to stop, steer both ways and respect path bounds',async()=>{
    const scroll=await page.evaluate(()=>scrollY);
    await page.keyboard.down('ArrowUp');await wait(()=>window.__unicornQA.snapshot().distance>.8);assert((await state()).audio.hooves);
    await page.keyboard.up('ArrowUp');await page.waitForTimeout(100);const stopped=(await state()).distance;await page.waitForTimeout(300);assert.equal((await state()).distance,stopped);assert(!(await state()).audio.hooves);
    await page.keyboard.down('ArrowLeft');await wait(()=>window.__unicornQA.snapshot().x< -1.7);await page.keyboard.up('ArrowLeft');assert((await state()).x>=-1.75);
    await page.keyboard.down('ArrowRight');await wait(()=>window.__unicornQA.snapshot().x>1.7);await page.keyboard.up('ArrowRight');assert((await state()).x<=1.75);assert.equal(await page.evaluate(()=>scrollY),scroll);
  });
  await check('Space jumps, head shows face and eye, pause freezes the jump and effects',async()=>{
    await page.keyboard.press('Space');await wait(()=>window.__unicornQA.snapshot().headFrame===2);
    await page.keyboard.press('Escape');const held=await state();assert.equal(held.mode,'paused');assert(held.jumpHeight>.5);
    await shot('04-head-turn-paused');await page.waitForTimeout(250);assert.equal((await state()).jumpTime,held.jumpTime);assert.equal((await state()).sceneTime,held.sceneTime);assert(!(await state()).audio.playing);
    await page.click('#resume');await wait(()=>window.__unicornQA.snapshot().jumpTime===-1);
  });
  await check('Actual Web Audio signal, global mute, resume and independent volume sliders',async()=>{
    await page.evaluate(()=>window.__unicornQA.audioLevel());await wait(()=>window.__unicornQA.audioLevel()>.00001);
    await page.click('#sound');await page.waitForTimeout(300);assert((await page.evaluate(()=>window.__unicornQA.audioLevel()))<.00001);assert(!(await state()).audio.enabled);
    await page.click('#sound');await wait(()=>window.__unicornQA.audioLevel()>.00001);
    await page.keyboard.press('Escape');
    for(const [id,fraction]of [['music-volume',.4],['effects-volume',.65]]){const box=await page.locator('#'+id).boundingBox();await page.mouse.click(box.x+box.width*fraction,box.y+box.height/2);assert(Math.abs(Number(await page.locator('#'+id).inputValue())/100-fraction)<.06);}
    await shot('05-pause-audio');await page.click('#resume');
  });
  await check('Solid fence and two consecutive jumps',async()=>{
    await checkpoint(28.9);await page.keyboard.down('ArrowUp');await wait(()=>window.__unicornQA.snapshot().blocked);assert((await state()).distance<30);
    await shot('06-fence-stop');await page.keyboard.press('Control');assert((await state()).distance<30,'magic does not destroy a fence');
    await page.keyboard.press('Space');await wait(()=>window.__unicornQA.snapshot().distance>30.5);await wait(()=>window.__unicornQA.snapshot().jumpTime===-1);await wait(()=>window.__unicornQA.snapshot().blocked);
    assert((await state()).distance<35.2);await page.keyboard.press('Space');await wait(()=>window.__unicornQA.snapshot().distance>35.7);await page.keyboard.up('ArrowUp');
  });
  await check('Ctrl rainbow shot destroys an enemy without a shot popup',async()=>{
    await checkpoint(43,1.12);const before=(await state()).enemiesRemaining;await page.keyboard.press('Control');await wait(()=>window.__unicornQA.snapshot().shotTime>0);assert.equal((await state()).enemiesRemaining,before-1);await shot('07-rainbow-magic');
    assert.equal(await page.locator('#message').evaluate(node=>getComputedStyle(node).opacity),'0');
  });
  await check('Crossing herd blocks forward travel and clears after waiting',async()=>{
    await checkpoint(89.4);await page.keyboard.down('ArrowUp');await wait(()=>window.__unicornQA.snapshot().waiting);const held=(await state()).distance;assert(held<=89.6+.001);
    await shot('08-herd-crossing');await page.keyboard.press('Control');assert((await state()).waiting);await wait(()=>window.__unicornQA.snapshot().distance>92);await page.keyboard.up('ArrowUp');
  });
  await check('Witch crossing and pause prevent movement and lingering hoof audio',async()=>{
    await checkpoint(54.5);await page.keyboard.down('ArrowUp');await wait(()=>window.__unicornQA.snapshot().waiting);await page.keyboard.up('ArrowUp');await shot('09-witches');
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal((await state()).mode,'paused');await page.click('#resume');assert(!(await state()).audio.hooves);
  });
  await check('Rainbow sky road rises above forest, awards five bonus pickups and lands safely',async()=>{
    await checkpoint(193.8);await page.keyboard.down('ArrowUp');await wait(()=>window.__unicornQA.snapshot().bonus);await page.keyboard.up('ArrowUp');
    await wait(()=>window.__unicornQA.snapshot().bonusCount>=2);await shot('10-rainbow-flight');await wait(()=>!window.__unicornQA.snapshot().bonus);assert.equal((await state()).bonusCount,5);
  });
  await check('Forest boss needs three hits, then Episode 1 automatically continues into Episode 2',async()=>{
    await checkpoint(374);await wait(()=>window.__unicornQA.snapshot().boss.active);await shot('11-forest-boss');
    await page.keyboard.press('Control');await wait(()=>window.__unicornQA.snapshot().boss.hp===2);await wait(()=>window.__unicornQA.snapshot().shotCooldown===0);await page.keyboard.press('Control');await wait(()=>window.__unicornQA.snapshot().boss.hp===1);await wait(()=>window.__unicornQA.snapshot().shotCooldown===0);await page.keyboard.press('Control');await wait(()=>window.__unicornQA.snapshot().boss.done);
    await checkpoint(395.8);await page.keyboard.down('ArrowUp');await wait(()=>window.__unicornQA.snapshot().episode==='dino');assert.equal((await state()).mode,'playing');assert.equal((await state()).horse,'rose');await wait(()=>window.__unicornQA.snapshot().distance>.2);await page.keyboard.up('ArrowUp');assert.equal((await state()).audio.music,'dino-ambient');await shot('12-dinosaur-game');
  });
  await check('Dinosaur lava jump and flying pterodactyl crossing',async()=>{
    await checkpoint(29);await page.keyboard.down('ArrowUp');await wait(()=>window.__unicornQA.snapshot().blocked);await shot('13-lava');await page.keyboard.press('Space');await wait(()=>window.__unicornQA.snapshot().distance>30.5);await page.keyboard.up('ArrowUp');
    await checkpoint(54.5);await page.keyboard.down('ArrowUp');await wait(()=>window.__unicornQA.snapshot().waiting);await page.keyboard.up('ArrowUp');await shot('14-pterodactyls');
  });
  await check('Tyrannosaur, thunder music, three-hit boss, cave finish, confetti and replay',async()=>{
    await checkpoint(374);await wait(()=>window.__unicornQA.snapshot().boss.active);assert.equal((await state()).audio.music,'dino-thunder');await shot('15-tyrannosaur');
    await page.keyboard.down('Control');await wait(()=>window.__unicornQA.snapshot().boss.done);await page.keyboard.up('Control');
    await checkpoint(395.7);await page.keyboard.down('ArrowUp');await wait(()=>window.__unicornQA.snapshot().mode==='finished');await page.keyboard.up('ArrowUp');await shot('16-finish-confetti');assert(await page.locator('#again').isVisible());await page.click('#again');assert.equal((await state()).mode,'playing');assert.equal((await state()).distance,0);
  });
  await check('Fullscreen resizes the pixel canvas, then restores the layout',async()=>{
    await page.click('#fullscreen');await wait(()=>!!document.fullscreenElement);await shot('17-fullscreen');await page.click('#fullscreen');await wait(()=>!document.fullscreenElement);assert((await state()).render.width<=640);
  });
  await check('WebGL context loss pauses safely and recovery permits continuing',async()=>{
    await page.evaluate(()=>window.__unicornQA.loseContext());await wait(()=>window.__unicornQA.snapshot().mode==='paused');await page.waitForTimeout(300);await page.evaluate(()=>window.__unicornQA.restoreContext());await page.waitForTimeout(1000);await page.click('#resume');await wait(()=>window.__unicornQA.snapshot().mode==='playing');await shot('18-context-recovered');
  });
  await check('Keyboard navigation and return to menu preserve the selected horse',async()=>{
    await page.keyboard.press('Escape');await page.click('#back-menu');assert.equal((await state()).mode,'intro');assert.equal((await state()).horse,'rose');await page.locator('#episode-forest').focus();await page.keyboard.press('Enter');assert.equal((await state()).episode,'forest');
  });
  await check('Mobile menu has no horizontal overflow and Start stays reachable',async()=>{
    await page.setViewportSize({width:390,height:844});await shot('19-menu-mobile');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const rect=await page.locator('#play').boundingBox(),game=await page.locator('.game').boundingBox();assert(rect.y+rect.height<=game.y+game.height);await page.click('#play');await shot('20-game-mobile');
  });
  await check('Reduced motion disables decorative UI transitions',async()=>{
    await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.locator('#play:not([disabled])').waitFor({timeout:60000});assert.equal(await page.locator('.horse-option').first().evaluate(node=>getComputedStyle(node).transitionDuration),'0s');await shot('21-reduced-motion');
  });
  await check('Normal URL exposes no QA controls',async()=>{await page.goto(base);await page.locator('#play:not([disabled])').waitFor({timeout:60000});assert.equal(await page.evaluate(()=>typeof window.__unicornQA),'undefined');});
  assert.deepEqual(report.errors,[],'no browser errors or failed assets');
  report.result='passed';report.finishedAt=new Date().toISOString();
}
run().catch(error=>{report.result='failed';report.failure=error.stack;console.error(error);process.exitCode=1;}).finally(async()=>{fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));if(browser)await browser.close();server.close();console.log('Report:',path.join(output,'report.json'));});
