import assert from 'node:assert/strict';
import fs from 'node:fs';
import {jumpHeadPose} from '../dist/animation.js';
import {HORSES} from '../dist/characters.js';
import {Adventure,RULES} from '../dist/rules.js';
assert.deepEqual(jumpHeadPose(-1,RULES.jumpDuration),{turn:0,frame:0});
assert.deepEqual(jumpHeadPose(0,RULES.jumpDuration),{turn:0,frame:0});
assert.deepEqual(jumpHeadPose(RULES.jumpDuration,RULES.jumpDuration),{turn:0,frame:0});
assert.equal(jumpHeadPose(RULES.jumpDuration*.18,RULES.jumpDuration).frame,1,'half turn during takeoff');
for(const fraction of [.30,.45,.65])assert.equal(jumpHeadPose(RULES.jumpDuration*fraction,RULES.jumpDuration).frame,2,'face, muzzle and eye are held towards rider in flight');
assert.equal(jumpHeadPose(RULES.jumpDuration*.83,RULES.jumpDuration).frame,1,'head turns back during descent');
let previous=0;const frames=new Set();
for(let i=0;i<=132;i++){
 const pose=jumpHeadPose(i/120,RULES.jumpDuration);
 assert(pose.turn>=0&&pose.turn<=1);assert(Math.abs(pose.turn-previous)<.08,'rotation is smooth');previous=pose.turn;frames.add(pose.frame);
}
assert.deepEqual([...frames].sort(),[0,1,2]);
for(const horse of HORSES){
 for(const file of [horse.neck,horse.headBack,horse.headTurn,horse.headLook])assert(fs.existsSync(new URL('../dist/assets/'+file,import.meta.url)));
 for(const file of [horse.headBack,horse.headTurn,horse.headLook]){
  const art=fs.readFileSync(new URL('../dist/assets/'+file,import.meta.url),'utf8');
  assert(art.includes(horse.coat)&&art.includes(horse.horn),'head poses preserve selected coat and horn');
 }
}
const game=new Adventure();game.start();game.jump();game.update(RULES.jumpDuration/2,{forward:false,steer:0});assert.equal(jumpHeadPose(game.jumpTime,RULES.jumpDuration).frame,2);game.pause();const held=game.jumpTime;game.update(1,{forward:true,steer:0});assert.equal(game.jumpTime,held,'pause holds head pose');game.start();assert.equal(jumpHeadPose(game.jumpTime,RULES.jumpDuration).frame,0,'restart restores forward gaze');
assert.equal(game.objects.filter(o=>o.type==='troll'&&o.weapon==='sword').length,4);assert.equal(game.objects.filter(o=>o.type==='troll'&&o.weapon==='axe').length,4);assert.equal(game.boss.weapon,'axe');
for(const [file,weapon]of [['troll-sword.svg','sword'],['troll-axe.svg','axe'],['boss.svg','axe']]){
 const art=fs.readFileSync(new URL('../dist/assets/'+file,import.meta.url),'utf8');assert(art.includes('id="armor"'));assert(art.includes(`id="${weapon}"`));
}
console.log('PASS: smooth three-pose head turn, sustained rider-facing gaze, landing/replay/pause, three matching coat/horn palettes, sword/axe armor variants for all trolls');
