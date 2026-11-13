const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const root=path.resolve(__dirname,'../dist');
const landingOnly=process.argv.includes('--rainbow-landing'),caveOnly=process.argv.includes('--cave');
const output=path.resolve(process.env.PLAYTEST_OUTPUT||(landingOnly?'artifacts/landing-playtest':caveOnly?'artifacts/cave-playtest':'artifacts/playtest'));
fs.mkdirSync(output,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.mp3':'audio/mpeg','.ttf':'font/ttf','.png':'image/png'};
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
  const wait=(fn,arg)=>page.waitForFunction(fn,arg,{timeout:45000});
  const checkpoint=(distance,x=0)=>page.evaluate(([d,x])=>window.__unicornQA.checkpoint(d,x),[distance,x]);
  async function shot(name){await page.screenshot({path:path.join(output,name+'.png'),fullPage:true});report.screenshots.push(name+'.png');}
  async function check(name,action){try{await action();report.checks.push(name);console.log('PASS:',name);}catch(error){report.failedState=await state();await shot('FAILED');throw error;}}
  await page.goto(base+'/?qa=1');
  await page.locator('#play:not([disabled])').waitFor({timeout:60000});
  async function noCaptions(){
    const words=await page.locator('.game').evaluate(root=>{
      const texts=[],walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
      while((node=walker.nextNode())){
        if(!node.textContent.trim()||node.parentElement.closest('.sr-only,[hidden]'))continue;
        const style=getComputedStyle(node.parentElement);if(style.visibility==='hidden'||style.display==='none')continue;
        const range=document.createRange();range.selectNodeContents(node);const rect=range.getBoundingClientRect();
        if(rect.width>1&&rect.height>1&&/\p{L}/u.test(node.textContent))texts.push(node.textContent.trim());
      }
      return texts;
    });assert.deepEqual(words,[],'no visible captions or instructions cover the playfield');
  }
  if(landingOnly){
    for(const episode of ['forest','dino','cave']){
      if((await state()).mode==='playing'){await page.keyboard.press('Escape');await page.click('#back-menu');}
      await page.click('#episode-'+episode);await page.click('#play');
      await check(episode+': complete rainbow descent and five bonus pickups',async()=>{
        await checkpoint(193.8);await page.keyboard.down('ArrowUp');await wait(()=>window.__unicornQA.snapshot().bonus);await page.keyboard.up('ArrowUp');
        await wait(()=>!window.__unicornQA.snapshot().bonus);
        const landed=await state();assert.equal(landed.distance,226);assert.equal(landed.bonusCount,5);assert.equal(landed.jumpHeight,0);assert(landed.view.clearance>1.4);await noCaptions();await shot(episode+'-landing');
      });
      await check(episode+': three seconds of clear travel, then shoot the relocated enemy',async()=>{
        const enemies=(await state()).enemiesRemaining;
        await page.keyboard.down('ArrowUp');await wait(()=>window.__unicornQA.snapshot().distance>=238);await page.keyboard.up('ArrowUp');
        assert.equal((await state()).enemiesRemaining,enemies,'no surprise enemy collision after landing');await shot(episode+'-after-three-seconds');
        await page.keyboard.press('Control');await wait(before=>window.__unicornQA.snapshot().enemiesRemaining===before-1,enemies);await shot(episode+'-magic-hit');
      });
    }
    assert.deepEqual(report.errors,[],'no browser errors or failed assets');report.result='passed';report.finishedAt=new Date().toISOString();return;
  }
  if(!caveOnly){
  await check('First actionable menu, local font, three episode cards and three horses',async()=>{
    assert.equal(await page.locator('.episode-option').count(),3);assert.equal(await page.locator('#horse-picker button').count(),3);
    assert(await page.evaluate(()=>document.fonts.check('16px Fredoka')));assert.equal((await state()).audio.state,undefined);
    assert(await page.locator('#play').evaluate(node=>{const rect=node.getBoundingClientRect();return rect.top>=0&&rect.bottom<=innerHeight;}));await shot('01-menu-desktop');
  });
  await check('Episode selection and all three coat/horn palettes',async()=>{
    for(const horse of ['sunny','moon','rose']){await page.click('#horse-'+horse);assert.equal((await state()).horse,horse);assert.equal(await page.locator('#horse-'+horse).getAttribute('aria-pressed'),'true');}
    await page.click('#episode-dino');assert.equal((await state()).episode,'dino');await shot('02-menu-dinosaurs');
    await page.click('#episode-forest');assert.equal((await state()).horse,'rose');await page.click('#play');
    await wait(()=>window.__unicornQA.snapshot().audio.buffers===20);await shot('03-forest');report.renderer=await state();assert.equal(await page.locator('#world').evaluate(node=>getComputedStyle(node).imageRendering),'auto');assert((await state()).render.triangles>1000,'a volumetric scene is rendered');
  });
  await check('Rider head reduced by 20%, deep forest and gameplay free of captions',async()=>{assert.equal((await state()).view.headScale,.8);assert((await state()).environment.deepTrees>1200);assert.equal(await page.locator('#herd-notice, #bonus-notice, .spell-hint, .scene-label').count(),0);await noCaptions();});
  await check('Hold Up to ride, release to stop, steer both ways and respect path bounds',async()=>{
    const scroll=await page.evaluate(()=>scrollY);
    await page.keyboard.down('ArrowUp');await wait(()=>window.__unicornQA.snapshot().distance>.8);assert((await state()).audio.hooves);
    await page.keyboard.up('ArrowUp');await page.waitForTimeout(100);const stopped=(await state()).distance;await page.waitForTimeout(300);assert.equal((await state()).distance,stopped);assert(!(await state()).audio.hooves);
    await page.keyboard.down('ArrowLeft');await wait(()=>window.__unicornQA.snapshot().x< -1.7);await page.keyboard.up('ArrowLeft');assert((await state()).x>=-1.75);
    await page.keyboard.down('ArrowRight');await wait(()=>window.__unicornQA.snapshot().x>1.7);await page.keyboard.up('ArrowRight');assert((await state()).x<=1.75);assert.equal(await page.evaluate(()=>scrollY),scroll);
  });
  await check('Space jumps, head shows face and eye, pause freezes the jump and effects',async()=>{
    await page.keyboard.press('Space');await wait(()=>window.__unicornQA.snapshot().headFrame===2);
    await page.keyboard.press('Escape');const held=await state();assert.equal(held.mode,'paused');assert(held.jumpHeight>.5);assert(Math.abs(held.render.headAngle)>1,'the actual 3D head rotates towards the rider');
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
    assert.equal((await state()).environment.beamShadowCasters,0,'rainbow beam does not cast a shadow');
  });
  await check('Crossing herd blocks forward travel and clears after waiting',async()=>{
    await checkpoint(89.4);await page.keyboard.down('ArrowUp');await wait(()=>window.__unicornQA.snapshot().waiting);const held=(await state()).distance;assert(held<=89.6+.001);
    await shot('08-herd-crossing');await page.keyboard.press('Control');assert((await state()).waiting);await wait(()=>window.__unicornQA.snapshot().distance>92);await page.keyboard.up('ArrowUp');
  });
  await check('Witch crossing and pause prevent movement and lingering hoof audio',async()=>{
    await checkpoint(54.5);await page.keyboard.down('ArrowUp');await wait(()=>window.__unicornQA.snapshot().waiting);await page.keyboard.up('ArrowUp');await noCaptions();await shot('09-witches');
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal((await state()).mode,'paused');await page.click('#resume');assert(!(await state()).audio.hooves);
  });
  await check('Rainbow sky road rises above forest, awards five bonus pickups and lands safely',async()=>{
    await page.evaluate(()=>{window.__flightTrace=[];window.__captureFlight=true;const sample=()=>{if(!window.__captureFlight)return;const state=window.__unicornQA.snapshot();if(state.bonus)window.__flightTrace.push({distance:state.distance,...state.view});requestAnimationFrame(sample);};requestAnimationFrame(sample);});
    await checkpoint(193.8);await page.keyboard.down('ArrowUp');await wait(()=>window.__unicornQA.snapshot().bonus);await page.keyboard.up('ArrowUp');
    await wait(()=>window.__unicornQA.snapshot().bonusCount>=2);await noCaptions();await shot('10-rainbow-flight');await wait(()=>window.__unicornQA.snapshot().distance>=216);await shot('10b-rainbow-descent');await wait(()=>window.__unicornQA.snapshot().distance>=223);await shot('10c-rainbow-landing');await wait(()=>!window.__unicornQA.snapshot().bonus);assert.equal((await state()).bonusCount,5);const trace=await page.evaluate(()=>{window.__captureFlight=false;return window.__flightTrace;});assert(trace.length>10);assert(trace.every(sample=>sample.clearance>1.4),'camera never clips below the rainbow');assert(trace.some(sample=>sample.distance>212&&sample.pitch<-.8),'camera looks down while descending');report.flightTrace=trace;
  });
  await check('Forest boss needs three hits, then Episode 1 automatically continues into Episode 2',async()=>{
    await checkpoint(374);await wait(()=>window.__unicornQA.snapshot().boss.active);await shot('11-forest-boss');
    await page.keyboard.press('Control');await wait(()=>window.__unicornQA.snapshot().boss.hp===2);await wait(()=>window.__unicornQA.snapshot().shotCooldown===0);await page.keyboard.press('Control');await wait(()=>window.__unicornQA.snapshot().boss.hp===1);await wait(()=>window.__unicornQA.snapshot().shotCooldown===0);await page.keyboard.press('Control');await wait(()=>window.__unicornQA.snapshot().boss.done);
    await checkpoint(395.8);await page.keyboard.down('ArrowUp');await wait(()=>window.__unicornQA.snapshot().episode==='dino');assert.equal((await state()).mode,'playing');assert.equal((await state()).horse,'rose');await wait(()=>window.__unicornQA.snapshot().distance>.2);await page.keyboard.up('ArrowUp');assert.equal((await state()).audio.music,'dino-ambient');await shot('12-dinosaur-game');
  });
  await check('Deep jungle, flowing lava river, jump and leathery pterodactyl crossing',async()=>{
    assert((await state()).environment.deepTrees>1200);await checkpoint(26);await shot('13-lava');await page.keyboard.down('ArrowUp');await wait(()=>window.__unicornQA.snapshot().blocked);const offset=(await state()).environment.lavaOffset;await wait(before=>window.__unicornQA.snapshot().environment.lavaOffset!==before,offset);await page.keyboard.press('Space');await wait(()=>window.__unicornQA.snapshot().distance>30.5);await page.keyboard.up('ArrowUp');
    await checkpoint(54.5);await page.keyboard.down('ArrowUp');await wait(()=>window.__unicornQA.snapshot().waiting);await page.keyboard.up('ArrowUp');await shot('14-pterodactyls');
  });
  await check('Baby stegosaurus herd stops traffic and clears safely',async()=>{
    await checkpoint(89.4);await page.keyboard.down('ArrowUp');await wait(()=>window.__unicornQA.snapshot().waiting);await shot('14b-stegosaurs');await noCaptions();await wait(()=>window.__unicornQA.snapshot().distance>92);await page.keyboard.up('ArrowUp');
  });
  await check('Giganotosaurus walks, shakes the camera, stops, roars, opens its jaw and clears the road',async()=>{
    await checkpoint(303.8);await page.keyboard.down('ArrowUp');
    await wait(()=>{const s=window.__unicornQA.snapshot();return s.giant.elapsed>2.8&&s.environment.shake>0;});const approach=await state();assert(approach.giant.walking);await shot('14c-giant-approach');
    await wait(()=>{const s=window.__unicornQA.snapshot();return s.giant.elapsed>6&&s.environment.giantJaw>.6&&s.audio.giantRoar;});const roar=await state();assert.equal(roar.giant.x,0);assert(roar.waiting);assert(roar.distance<=304.501);await noCaptions();await shot('14d-giant-roar');
    await page.keyboard.press('Escape');const paused=await state();await page.waitForTimeout(300);assert.equal((await state()).giant.elapsed,paused.giant.elapsed);assert.equal((await state()).environment.giantJaw,paused.environment.giantJaw);assert(!(await state()).audio.giantRoar);await page.click('#resume');await wait(()=>window.__unicornQA.snapshot().audio.giantRoar);
    await page.keyboard.press('Control');await page.keyboard.press('Space');assert((await state()).distance<=304.501);assert(!(await state()).giant.done);await page.keyboard.down('ArrowUp');
    await page.waitForFunction(()=>window.__unicornQA.snapshot().giant.done,null,{timeout:45000});await wait(()=>window.__unicornQA.snapshot().distance>307);await page.keyboard.up('ArrowUp');assert(!(await state()).audio.giantRoar);assert(!(await state()).environment.roarVisible);await shot('14e-giant-cleared');
  });
  await check('Tyrannosaur boss and automatic volcano-to-cave transition',async()=>{
    await checkpoint(374);await wait(()=>window.__unicornQA.snapshot().boss.active);assert.equal((await state()).audio.music,'dino-thunder');await noCaptions();await shot('15-tyrannosaur');
    await page.keyboard.down('Control');await wait(()=>window.__unicornQA.snapshot().boss.done);await page.keyboard.up('Control');
    await checkpoint(395.7);await page.keyboard.down('ArrowUp');await wait(()=>window.__unicornQA.snapshot().episode==='cave');assert.equal((await state()).mode,'playing');assert.equal((await state()).horse,'rose');await wait(()=>window.__unicornQA.snapshot().distance>.2);await page.keyboard.up('ArrowUp');assert.equal((await state()).audio.music,'cave-ambient');await shot('16-cave-arrival');
  });
  }else{
    await page.click('#horse-rose');await page.click('#episode-cave');await page.click('#play');
    await wait(()=>window.__unicornQA.snapshot().audio.buffers===20);await shot('16-cave-arrival');
  }
  await check('Cave: original controls, fifty optional crystals and natural ambiance',async()=>{
    assert.equal((await state()).episode,'cave');assert.equal((await state()).audio.music,'cave-ambient');assert((await state()).audio.reverb>0);assert.equal((await state()).view.headScale,.8);await noCaptions();
    await checkpoint(11.6);const before=(await state()).count;await page.keyboard.down('ArrowUp');await wait(n=>window.__unicornQA.snapshot().count>n,before);await page.keyboard.up('ArrowUp');await shot('16b-cave-crystal');
  });
  await check('Cave: two consecutive jumps over chasm and fallen column',async()=>{
    await checkpoint(28.9);await page.keyboard.down('ArrowUp');await wait(()=>window.__unicornQA.snapshot().blocked);await shot('16c-cave-chasm');await page.keyboard.press('Control');assert((await state()).blocked);
    await page.keyboard.press('Space');await wait(()=>window.__unicornQA.snapshot().distance>30.5);await wait(()=>window.__unicornQA.snapshot().jumpTime===-1);await wait(()=>window.__unicornQA.snapshot().blocked);await page.keyboard.press('Space');await wait(()=>window.__unicornQA.snapshot().distance>35.7);await page.keyboard.up('ArrowUp');
  });
  await check('Cave: golem and crystal crab each need one rainbow hit',async()=>{
    await checkpoint(43,1.12);const before=(await state()).enemiesRemaining;await shot('16d-golem-and-crab');await page.keyboard.press('Control');await wait(n=>window.__unicornQA.snapshot().enemiesRemaining===n-1,before);
    await checkpoint(43,-.48);await wait(()=>window.__unicornQA.snapshot().shotCooldown===0);const remaining=(await state()).enemiesRemaining;await page.keyboard.press('Control');await wait(n=>window.__unicornQA.snapshot().enemiesRemaining===n-1,remaining);assert.equal((await state()).environment.beamShadowCasters,0);
  });
  await check('Cave: natural steam jets require waiting and pause freezes them',async()=>{
    await checkpoint(65.5);await page.keyboard.down('ArrowUp');await wait(()=>window.__unicornQA.snapshot().crossing?.type==='steam');await wait(()=>window.__unicornQA.snapshot().audio.crossing==='cave-steam');assert((await state()).environment.cave.steamPuffs>0);await noCaptions();await shot('16e-steam');
    await page.keyboard.press('Escape');const held=await state();await page.waitForTimeout(250);assert.equal((await state()).crossing.elapsed,held.crossing.elapsed);assert.equal((await state()).audio.crossing,null);await page.click('#resume');await page.keyboard.down('ArrowUp');await wait(()=>window.__unicornQA.snapshot().distance>68);await page.keyboard.up('ArrowUp');
  });
  await check('Cave: friendly lizard herd and membrane bats cross the route',async()=>{
    await checkpoint(89.4);await page.keyboard.down('ArrowUp');await wait(()=>{const s=window.__unicornQA.snapshot();return s.crossing?.type==='lizard'&&s.crossing.elapsed>1.5;});assert.equal((await state()).audio.crossing,'cave-lizards');await shot('16f-lizards');await wait(()=>window.__unicornQA.snapshot().distance>92);await page.keyboard.up('ArrowUp');
    await checkpoint(141.9);await page.keyboard.down('ArrowUp');await wait(()=>{const s=window.__unicornQA.snapshot();return s.crossing?.type==='bat'&&s.crossing.elapsed>1.5;});await page.keyboard.up('ArrowUp');assert.equal((await state()).audio.crossing,'cave-bats');await shot('16g-mushrooms-and-bats');
  });
  await check('Cave: rainbow bridge above the lake, five gems, safe roof/descent and landing space',async()=>{
    await checkpoint(193.8);await page.keyboard.down('ArrowUp');await wait(()=>window.__unicornQA.snapshot().bonus);await page.keyboard.up('ArrowUp');await wait(()=>window.__unicornQA.snapshot().distance>=209);
    assert((await state()).environment.cave.ceilingClearance>(await state()).view.y+2);await shot('16h-cave-rainbow');await wait(()=>window.__unicornQA.snapshot().distance>=219);await shot('16i-cave-rainbow-descent');await wait(()=>!window.__unicornQA.snapshot().bonus);assert.equal((await state()).bonusCount,5);const enemies=(await state()).enemiesRemaining;
    await page.keyboard.down('ArrowUp');await wait(()=>window.__unicornQA.snapshot().distance>=238);await page.keyboard.up('ArrowUp');assert.equal((await state()).enemiesRemaining,enemies);await shot('16j-underground-lake');
  });
  await check('Cave: giant crystal turtle greets the rider and safely clears the road',async()=>{
    await checkpoint(303.8);await page.keyboard.down('ArrowUp');await wait(()=>{const s=window.__unicornQA.snapshot();return s.giant.elapsed>5.6&&s.audio.giantRoar;});const greeting=await state();assert.equal(greeting.giant.type,'crystal-turtle');assert(greeting.waiting);assert.equal(greeting.giant.x,0);await noCaptions();await shot('16k-crystal-turtle');
    await page.waitForFunction(()=>window.__unicornQA.snapshot().giant.done,null,{timeout:45000});await wait(()=>window.__unicornQA.snapshot().distance>307);await page.keyboard.up('ArrowUp');
  });
  await check('Cave: three-hit guardian restores the visible heart, statue clears the exit, sunlit finish and replay',async()=>{
    await checkpoint(374);await wait(()=>window.__unicornQA.snapshot().boss.active);assert.equal((await state()).environment.cave.heartCharge,0);await shot('16l-obsidian-guardian');
    for(const hp of [2,1,0]){await wait(()=>window.__unicornQA.snapshot().shotCooldown===0);await page.keyboard.press('Control');await wait(n=>{const s=window.__unicornQA.snapshot();return s.boss.hp===n&&s.environment.cave.heartCharge===3-n;},hp);assert.equal((await state()).environment.cave.heartCharge,3-hp);}
    await shot('16m-heart-restored');await page.keyboard.down('ArrowUp');await wait(()=>window.__unicornQA.snapshot().distance>390);await page.keyboard.up('ArrowUp');assert.equal((await state()).environment.cave.section,'sunlit-clearing');await shot('16n-sunlit-clearing');
    await page.keyboard.down('ArrowUp');await wait(()=>window.__unicornQA.snapshot().mode==='finished');await page.keyboard.up('ArrowUp');await shot('16o-finish-confetti');assert(await page.locator('#again').isVisible());await page.click('#again');assert.equal((await state()).mode,'playing');assert.equal((await state()).distance,0);assert.equal((await state()).boss.hp,3);assert.equal((await state()).giant.elapsed,-1);
  });
  await check('Fullscreen resizes the 3D canvas, then restores the layout',async()=>{
    await page.click('#fullscreen');await wait(()=>!!document.fullscreenElement);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await shot('17-fullscreen');await page.click('#fullscreen');await wait(()=>!document.fullscreenElement);assert((await state()).render.width<=1600);
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
  await check('Reduced motion suppresses giant camera shake',async()=>{
    await page.click('#episode-dino');await page.click('#play');await checkpoint(303.8);await page.keyboard.down('ArrowUp');await wait(()=>window.__unicornQA.snapshot().giant.elapsed>1);assert.equal((await state()).environment.shake,0);await page.keyboard.up('ArrowUp');
  });
  await check('Normal URL exposes no QA controls',async()=>{await page.goto(base);await page.locator('#play:not([disabled])').waitFor({timeout:60000});assert.equal(await page.evaluate(()=>typeof window.__unicornQA),'undefined');});
  assert.deepEqual(report.errors,[],'no browser errors or failed assets');
  report.result='passed';report.finishedAt=new Date().toISOString();
}
run().catch(error=>{report.result='failed';report.failure=error.stack;console.error(error);process.exitCode=1;}).finally(async()=>{fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));if(browser)await browser.close();server.close();console.log('Report:',path.join(output,'report.json'));});
