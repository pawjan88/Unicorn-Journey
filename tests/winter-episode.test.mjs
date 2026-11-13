import assert from 'node:assert/strict';
import {Adventure,RULES} from '../dist/rules.js';
import {EPISODES} from '../dist/episodes.js';
import {HORSES} from '../dist/characters.js';
assert.equal(EPISODES.cave.next,'ice');assert.equal(EPISODES.ice.next,undefined);
assert.equal(HORSES.length,4);assert(HORSES.find(horse=>horse.id==='ice').crystal);
const events=[],game=new Adventure(event=>events.push(event));game.selectHorse('ice');game.selectEpisode('ice');game.start();
assert.equal(game.horseId,'ice');assert.equal(game.objects.filter(object=>object.type==='rainbow').length,50);assert(game.objects.filter(object=>object.type==='rainbow').every(object=>object.species==='gold-snowflake'));
assert(game.objects.filter(object=>object.type==='troll').every(object=>object.species==='snow-imp'));assert(game.objects.filter(object=>object.type==='dragon').every(object=>object.species==='ice-dragon'));
const obstacles=game.objects.filter(object=>object.type==='fence');obstacles.forEach((object,i)=>assert.equal(object.obstacle,i%2?'snow-log':'ice-crack'));assert.equal(new Set(obstacles.map(object=>object.pair).filter(Boolean)).size,5);
assert(game.herds.every(herd=>herd.type==='reindeer'));assert(game.witches.every(herd=>herd.type==='owl'));assert.equal(game.giant.type,'mammoth');assert.equal(game.boss.species,'frost-king');assert.deepEqual(game.rescue,{freed:false,names:['Elza','Anna']});
game.distance=374;game.objects.filter(object=>object.type!=='boss').forEach(object=>object.done=true);game.update(1/120,{forward:false,steer:0});assert(game.boss.active);
for(const expected of [2,1,0]){
  game.shotCooldown=0;game.shoot();assert.equal(game.boss.hp,expected);assert.equal(game.rescue.freed,expected===0,'neither sister is freed before the third hit');
}
assert.equal(events.filter(event=>event.type==='rescue').length,1);assert.deepEqual(events.find(event=>event.type==='rescue').names,['Elza','Anna']);game.shotCooldown=0;game.shoot();assert.equal(events.filter(event=>event.type==='rescue').length,1,'rescue fires exactly once');
game.start();events.length=0;let time=0;
while(game.mode==='playing'&&time<180){
  const obstacle=game.objects.find(object=>object.type==='fence'&&!object.done&&object.z>game.distance);
  if(obstacle&&obstacle.z-game.distance<2.2&&game.jumpTime<0)game.jump();
  game.update(1/120,{forward:true,steer:0,fire:true});time+=1/120;
}
assert.equal(game.mode,'finished','entire fourth episode is playable');assert(game.rescue.freed);assert.equal(game.boss.hp,0);assert.equal(game.bonusCount,5);assert(game.count<50);assert.equal(events.filter(event=>event.type==='giantStart').length,1);assert.equal(events.filter(event=>event.type==='rescue').length,1);
game.start();assert(!game.rescue.freed);assert.equal(game.boss.hp,3);assert.equal(game.giant.elapsed,-1);game.reset();game.selectEpisode('forest');assert.equal(game.rescue,null);assert.equal(game.horseId,'ice','new horse remains playable outside winter');
console.log('PASS: four episodes and horses; winter obstacles/wildlife; exactly three hits free Elsa and Anna once; full route, optional snowflakes, safe bonus and reset');
