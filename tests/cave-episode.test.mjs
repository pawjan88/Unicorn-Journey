import assert from 'node:assert/strict';
import {Adventure,RULES} from '../dist/rules.js';
import {EPISODES} from '../dist/episodes.js';

assert.equal(EPISODES.dino.next,'cave');assert.equal(EPISODES.cave.next,undefined);
const events=[],game=new Adventure(event=>events.push(event));game.selectHorse('rose');game.selectEpisode('cave');game.start();
assert.equal(game.horseId,'rose');assert.equal(game.objects.filter(object=>object.type==='rainbow').length,50);
assert(game.objects.filter(object=>object.type==='rainbow').every(object=>object.species==='crystal'));
assert(game.objects.filter(object=>object.type==='troll').every(object=>object.species==='stone-golem'));
assert(game.objects.filter(object=>object.type==='dragon').every(object=>object.species==='crystal-crab'));
assert.equal(game.boss.species,'obsidian-guardian');assert.equal(game.giant.type,'crystal-turtle');
assert(game.herds.every(herd=>herd.type==='lizard'));assert(game.witches.every(herd=>herd.type==='bat'));
const obstacles=game.objects.filter(object=>object.type==='fence');assert.equal(new Set(obstacles.map(object=>object.pair).filter(Boolean)).size,5);obstacles.forEach((object,i)=>assert.equal(object.obstacle,i%2?'column':'chasm'));
assert(game.objects.filter(object=>['troll','dragon'].includes(object.type)&&object.z>RULES.bonusEnd).every(object=>object.z>=RULES.bonusEnd+16));
const tick=(seconds,input={forward:true,steer:0})=>{for(let i=0;i<seconds*120;i++)game.update(1/120,input);};
game.objects.forEach(object=>object.done=true);[...game.herds,...game.witches].forEach(herd=>herd.cleared=true);game.distance=65.5;tick(.1);assert(game.waitingForHerd);assert.equal(game.waitingCrossing.type,'steam');const held=game.distance;
game.jump();game.shoot();tick(1);assert.equal(game.distance,held,'steam must be waited out, not jumped or shot');game.pause();const elapsed=game.vents[0].elapsed;tick(3);assert.equal(game.vents[0].elapsed,elapsed);game.resume();tick(4);assert(game.vents[0].cleared);assert(game.distance>68);
game.start();events.length=0;let time=0;
while(game.mode==='playing'&&time<180){
  const obstacle=game.objects.find(object=>object.type==='fence'&&!object.done&&object.z>game.distance);
  if(obstacle&&obstacle.z-game.distance<2.2&&game.jumpTime<0)game.jump();
  game.update(1/120,{forward:true,steer:0,fire:true});time+=1/120;
}
assert.equal(game.mode,'finished','entire third episode is completable');assert.equal(game.boss.hp,0);assert.equal(game.bonusCount,5);assert(game.count<50,'collecting all crystals is optional');assert(game.vents.every(vent=>vent.cleared));assert(game.giant.done);assert.equal(events.filter(event=>event.type==='giantStart').length,1);assert.equal(events.filter(event=>event.type==='giantRoar').length,1);assert.equal(events.filter(event=>event.type==='finish').length,1);
game.start();assert.equal(game.giant.elapsed,-1);assert(game.vents.every(vent=>vent.elapsed===-1));assert.equal(game.boss.hp,3);game.reset();game.selectEpisode('forest');assert.equal(game.vents.length,0);assert.equal(game.giant,null,'cave state does not leak into the forest');
console.log('PASS: cave collection/enemies, double jumps, steam waiting and pause, single turtle encounter, complete third route, three-hit guardian, optional crystals and clean replay');
