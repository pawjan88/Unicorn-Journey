import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {Adventure,RULES} from '../dist/rules.js';
import {EPISODES} from '../dist/episodes.js';
import {HORSES} from '../dist/characters.js';
const events=[];const game=new Adventure(e=>events.push(e));
assert.equal(game.episodeId,'forest');assert.equal(game.objects.filter(o=>o.type==='rainbow').length,50);assert.equal(game.selectEpisode('missing'),false);
game.selectHorse('moon');assert(game.selectEpisode('dino'));assert.equal(game.episodeId,'dino');assert.equal(game.horseId,'moon');assert.equal(game.mode,'intro');assert.equal(game.episode.total,50);
assert.equal(game.objects.filter(o=>o.type==='rainbow').length,50,'same collection count');
const obstacles=game.objects.filter(o=>o.type==='fence');assert.equal(obstacles.length,13);obstacles.forEach((o,i)=>assert.equal(o.obstacle,i%2?'log':'lava','lava and fallen logs alternate'));
assert(game.objects.filter(o=>o.type==='troll').every(o=>o.species==='triceratops'));assert(game.objects.filter(o=>o.type==='dragon').every(o=>o.species==='diplodocus'));assert.equal(game.boss.species,'tyrannosaurus');assert.equal(game.boss.hp,3);
assert(game.herds.every(h=>h.type==='dinosaur'));assert(game.witches.every(h=>h.type==='pterodactyl'),'no witches in dinosaur episode');
for(const file of [...EPISODES.dino.trees,EPISODES.dino.panorama,'dino-triceratops.svg','dino-diplodocus.svg','dino-tyrannosaurus.svg','dino-small-0.svg','dino-small-1.svg','dino-pterodactyl.svg','dino-silhouette.svg','dragonfly.svg'])assert(fs.existsSync(new URL('../dist/assets/'+file,import.meta.url)));
const hashes={owady:'634569297486180c414154f6f20f0ed61fb7cbf200c76052410623e066e7158b',jungla:'d26b1a4126400ba3c9be497de8e4ade53dadf66a42c5de539f018f8da905c1c8',grzmoty:'3bbd3f651ece5e29853f35280759c0691e8f99f1c227cfe461759357bfa5a2c6'};
for(const[name,hash]of Object.entries(hashes)){const data=fs.readFileSync(new URL('../dist/audio/'+name+'.mp3',import.meta.url));assert.equal(createHash('sha256').update(data).digest('hex'),hash,'uploaded audio preserved');}
assert(fs.statSync(new URL('../dist/audio/dino-ambient.mp3',import.meta.url)).size>1000);
game.start();assert.equal(game.selectEpisode('forest'),false,'no accidental level switching during play');assert.equal(game.horseId,'moon');game.jump();game.update(.55,{forward:false,steer:0});assert.equal(game.jumpHeight,RULES.jumpHeight,'jump unchanged');
game.pause();assert.equal(game.selectEpisode('forest'),false);game.resume();
let time=0;while(game.mode==='playing'&&time<160){const f=game.objects.find(o=>o.type==='fence'&&!o.done&&o.z>game.distance);if(f&&f.z-game.distance<2.2&&game.jumpTime<0)game.jump();game.update(1/120,{forward:true,steer:0,fire:true});time+=1/120;}
assert.equal(game.mode,'finished','complete dinosaur route is playable');assert.equal(game.distance,RULES.length);assert.equal(game.boss.hp,0);assert.equal(game.bonusCount,5);assert(game.herds.every(h=>h.cleared)&&game.witches.every(h=>h.cleared));
assert(events.some(e=>e.type==='herdStart'&&e.herd.type==='dinosaur'));assert(events.some(e=>e.type==='herdStart'&&e.herd.type==='pterodactyl'));assert(events.some(e=>e.type==='bonusStart'));assert.equal(events.filter(e=>e.type==='finish').length,1);
assert(game.selectEpisode('forest'));assert.equal(game.mode,'intro');assert.equal(game.count,0);assert.equal(game.horseId,'moon');assert(game.herds.every(h=>h.type==='unicorn'));assert(game.witches.every(h=>h.type==='witch'));assert(game.objects.filter(o=>o.type==='fence').every(o=>!o.obstacle),'original forest obstacles unchanged');assert(!game.boss.species);
for(const horse of HORSES){game.selectHorse(horse.id);game.selectEpisode('dino');assert.equal(game.horseId,horse.id);game.start();game.reset();game.selectEpisode('forest');assert.equal(game.horseId,horse.id);}
console.log('PASS: separate episode selection, 50 amber pickups, alternating lava/logs, specified dinosaurs, rainbow flight, preserved uploaded audio, unchanged unicorns/jump/spell, complete dinosaur route, reset and return to original forest');
