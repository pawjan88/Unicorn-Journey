import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Adventure,RULES,skyHeightAt} from '../dist/rules.js';
import {HORSES} from '../dist/characters.js';
const idle={forward:false,steer:0},forward={forward:true,steer:0};
const events=[];const game=new Adventure(event=>events.push(event));
function tick(seconds,input=idle){for(let i=0;i<Math.round(seconds*120);i++)game.update(1/120,input);}
function reset(){game.start();events.length=0;}
function clearRoute({boss=true}={}){
 game.objects.forEach(o=>{if(o.type!=='boss'||boss)o.done=true;});
 [...game.herds,...game.witches].forEach(h=>h.cleared=true);game.bonus.finished=true;
}
assert.equal(HORSES.length,3);
for(const key of ['coat','hooves','horn'])assert.equal(new Set(HORSES.map(h=>h[key])).size,3,`three distinct ${key} colors`);
for(const horse of HORSES){
 assert(game.selectHorse(horse.id));assert.equal(game.horseId,horse.id);
 const portrait=fs.readFileSync(new URL('../dist/assets/'+horse.portrait,import.meta.url),'utf8');
 const saddle=fs.readFileSync(new URL('../dist/assets/'+horse.saddle,import.meta.url),'utf8');
 assert(portrait.includes(horse.coat)&&portrait.includes(horse.hooves)&&portrait.includes(horse.horn));
 assert(saddle.includes(horse.coat)&&saddle.includes(horse.horn)&&saddle.includes(horse.hornShadow),'matching horn palette in first-person view');
}
assert.equal(game.selectHorse('unknown'),false);const chosen=game.horseId;reset();assert.equal(game.horseId,chosen);assert.equal(game.selectHorse(HORSES[0].id),false,'cannot change horse mid-run');
const pairs=new Map();game.objects.filter(o=>o.type==='fence'&&o.pair).forEach(f=>{if(!pairs.has(f.pair))pairs.set(f.pair,[]);pairs.get(f.pair).push(f);});assert.equal(pairs.size,5);
for(const [pairId,pair] of pairs){
 assert.equal(pair.length,2);assert(Math.abs(pair[1].z-pair[0].z-RULES.pairGap)<1e-7);
 assert(RULES.pairGap>RULES.jumpDuration*RULES.speed,'one jump cannot span a pair');
 reset();clearRoute();const fences=game.objects.filter(o=>o.pair===pairId);fences.forEach(f=>f.done=false);
 game.distance=fences[0].z-2.2;game.jump();tick(1.5,forward);assert(fences[0].done);assert(!fences[1].done);assert(game.distance<=fences[1].z-RULES.fenceStopDistance+.0001,'second fence stays solid');
 game.jump();tick(1,forward);assert(fences[1].done,'second jump clears second fence');
 reset();clearRoute();const fast=game.objects.filter(o=>o.pair===pairId);fast.forEach(f=>f.done=false);game.distance=fast[0].z-2.2;game.jump();tick(RULES.pairGap/RULES.speed,forward);assert.equal(game.jumpTime,-1);game.jump();tick(.7,forward);assert(fast.every(f=>f.done),'quick two-jump sequence works without stopping');
}
reset();clearRoute();game.witches.forEach(w=>w.cleared=false);assert.equal(game.witches.length,3);assert(game.witches.every(w=>w.count===5));
const witches=game.witches[0];game.distance=witches.z-RULES.herdTriggerDistance-.1;tick(2.5,forward);assert(game.waitingForHerd);assert.equal(game.waitingCrossing.type,'witch');assert.equal(game.distance,witches.z-RULES.herdStopDistance);
game.jump();tick(.8,{forward:true,steer:0,fire:true});assert(!witches.cleared);assert.equal(game.distance,witches.z-RULES.herdStopDistance);assert(events.filter(e=>e.type==='shot').every(e=>!e.target),'friendly crossing witches cannot be shot');
game.pause();const clock=witches.elapsed;tick(4,forward);assert.equal(witches.elapsed,clock);game.resume();tick(4);assert(witches.cleared);tick(1,forward);assert(game.distance>witches.z);
reset();clearRoute();game.bonus.finished=false;game.distance=RULES.bonusStart-.02;game.x=1.6;tick(.02,forward);assert(game.bonus.active);assert.equal(game.jump(),false);
const underBridge={type:'troll',x:0,z:RULES.bonusStart+8,done:false};game.objects.push(underBridge);
tick(4);assert(game.flightHeight>14,'rider rises above the forest');assert(Math.abs(game.x)<.01,'sky gallop follows rainbow');assert.equal(game.stun,0);game.shoot();assert.equal(events.filter(e=>e.type==='shot').at(-1).target,null,'sky section has no shootable enemies');
game.pause();const elapsed=game.bonus.elapsed;tick(3);assert.equal(game.bonus.elapsed,elapsed);game.resume();tick(4.1);
assert(game.bonus.finished&&!game.bonus.active);assert.equal(game.bonusCount,5);assert.equal(game.count,0,'bonus count stays separate from 50 main rainbows');assert.equal(game.flightHeight,0);assert(Math.abs(game.distance-RULES.bonusEnd)<.1);assert.equal(events.filter(e=>e.type==='bonusCollect').length,5);
assert.equal(skyHeightAt(RULES.bonusStart),0);assert.equal(skyHeightAt(RULES.bonusEnd),0);assert(skyHeightAt((RULES.bonusStart+RULES.bonusEnd)/2)>=15);assert(game.objects.filter(o=>o.type==='rainbow').every(o=>o.z<RULES.bonusStart||o.z>RULES.bonusEnd),'base rainbows remain reachable outside flight');
reset();clearRoute({boss:false});game.distance=RULES.bossWakeDistance;tick(.02);assert(game.boss.active);assert.equal(game.boss.hp,3);assert.equal(game.rocks.length,1);assert.equal(game.rocks[0].x,game.x,'stone is aimed at rider');
game.shoot();assert.equal(game.boss.hp,2);assert(!game.boss.done);tick(.46);game.x=1.5;game.shoot();assert.equal(game.boss.hp,1);assert(!game.boss.done);tick(.46);game.shoot();assert.equal(game.boss.hp,0);assert(game.boss.done);assert(game.rocks.length>0,'already rolling stones still need avoiding');tick(1);assert.equal(events.filter(e=>e.type==='rockHit').length,0,'steering avoids the stone');
reset();clearRoute({boss:false});game.distance=RULES.bossZ-RULES.bossStopDistance-.1;game.bossRollClock=100;tick(1,forward);assert.equal(game.distance,RULES.bossZ-RULES.bossStopDistance,'living boss blocks route to finish');assert.equal(game.mode,'playing');
game.boss.done=true;game.boss.hp=0;tick(4,forward);assert.equal(game.mode,'finished');assert.equal(events.filter(e=>e.type==='finish').length,1);
reset();clearRoute({boss:false});game.distance=RULES.bossWakeDistance;game.bossRollClock=100;game.rocks.push({id:0,x:0,z:game.distance+1,angle:0,active:true});tick(.1);assert(events.some(e=>e.type==='rockHit'));assert(game.stun>0);assert(game.distance<RULES.bossWakeDistance,'stone hit is recoverable knockback');
reset();clearRoute({boss:false});game.distance=RULES.bossWakeDistance;tick(.02);game.pause();const rockZ=game.rocks[0].z;tick(4);assert.equal(game.rocks[0].z,rockZ);game.resume();tick(.1);assert(game.rocks[0].z<rockZ);
reset();assert.equal(game.boss.hp,3);assert.equal(game.rocks.length,0);assert.equal(game.bonusCount,0);assert(game.witches.every(w=>w.elapsed===-1));assert.equal(game.horseId,chosen);
console.log('PASS: three horse palettes and consistent horns; five two-jump fence pairs; three pause-safe witch groups; automatic enemy-free sky gallop, five bonus rainbows and safe landing; three-hit boss, rolling/avoidable stones, gate, pause and replay');
