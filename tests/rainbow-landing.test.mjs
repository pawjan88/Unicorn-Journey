import assert from 'node:assert/strict';
import {Adventure,RULES} from '../dist/rules.js';

for(const episode of ['forest','dino','cave']){
  const events=[],game=new Adventure(event=>events.push(event));
  game.selectEpisode(episode);game.start();
  const enemies=game.objects.filter(object=>['troll','dragon'].includes(object.type)&&object.z>RULES.bonusEnd);
  const first=enemies[0],pair=enemies.filter(object=>object.z===first.z);
  assert.equal(pair.length,2,'both creatures move together');
  assert((first.z-RULES.bonusEnd)/RULES.speed>=4,'at least four seconds to react after landing');
  assert(first.z<game.objects.find(object=>object.type==='fence'&&object.z>RULES.bonusEnd).z,'encounter stays before the next fence');
  assert.equal(game.objects.filter(object=>object.type==='rainbow').length,50);
  game.distance=RULES.bonusStart-.01;
  game.objects.filter(object=>object.z<game.distance).forEach(object=>object.done=true);
  [...game.herds,...game.witches].filter(herd=>herd.z<game.distance).forEach(herd=>herd.cleared=true);
  game.update(1/120,{forward:true,steer:0});
  while(game.bonus.active)game.update(1/120,{forward:false,steer:0});
  assert.equal(game.distance,RULES.bonusEnd);assert.equal(game.bonusCount,5);
  const before=events.length;
  for(let i=0;i<3*120;i++)game.update(1/120,{forward:true,steer:0});
  assert(!events.slice(before).some(event=>event.type==='bump'),'no enemy collision during the first three seconds after descent');
  assert(pair.every(object=>!object.done),'both enemies remain available to shoot');
  game.x=first.x;assert(game.shoot());
  assert.equal(events.at(-1).type,'shot');assert.equal(events.at(-1).target,first,'magic hits the relocated opponent');
  game.start();assert.equal(game.objects.filter(object=>object.type==='troll'&&object.z>RULES.bonusEnd)[0].z,first.z,'replay preserves the safe landing');
}
console.log('PASS: all three episodes provide four seconds before the first post-rainbow enemy pair; three seconds of safe travel, working shots, five bonus pickups and replay');
