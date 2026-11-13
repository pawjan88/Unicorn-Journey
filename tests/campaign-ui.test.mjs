import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {Adventure,RULES} from '../dist/rules.js';
import {HORSES} from '../dist/characters.js';
import {EPISODES} from '../dist/episodes.js';
const elements=new Map(),listeners={};
function element(){return {style:{},hidden:false,disabled:false,_html:'',textContent:'',attributes:{},
 get innerHTML(){return this._html;},
 set innerHTML(value){this._html=value;for(const button of value.matchAll(/<button\b([^>]+)>/g)){const id=button[1].match(/id="([^"]+)"/);if(id){const node=$('#'+id[1]);for(const attribute of button[1].matchAll(/(aria-[\w-]+)="([^"]+)"/g))node.setAttribute(attribute[1],attribute[2]);}}},
 setAttribute(k,v){this.attributes[k]=String(v);},focus(){},addEventListener(){}};}
function $(selector){if(!elements.has(selector))elements.set(selector,element());return elements.get(selector);}
const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
assert(html.includes('id="episode-picker"'));assert(!html.includes('<select'),'episode choices are picture buttons');
$('#overlay').innerHTML='start-screen-template';
class Forest {
 static async prepare(){}
 constructor(canvas,objects,herds,options){this.episodeId=options.episodeId;this.horseId=options.horseId;this.disposed=false;}
 dispose(){this.disposed=true;}resetEffects(){}update(){}selectHorse(id){this.horseId=id;}fire(){}collect(){}bossThrow(){}celebrate(){}
}
class Audio {
 constructor(){this.enabled=true;this.effects=[];this.playing=false;}
 unlock(){}reset(){this.playing=false;}setMusicState(episodeId,bossActive){this.state={episodeId,bossActive};}setPlaying(v){this.playing=v;}setEnabled(v){this.enabled=v;}effect(name){this.effects.push(name);}update(){}
}
class Confetti {constructor(){this.starts=0;}start(){this.starts++;}reset(){}update(){}}
const context=vm.createContext({console,Math,Set,document:{querySelector:$,addEventListener:(type,fn)=>{listeners[type]=fn;}},window:{},addEventListener:(type,fn)=>{listeners[type]=fn;},requestAnimationFrame(){},setTimeout:()=>1,clearTimeout(){}});
function synthetic(values){return new vm.SyntheticModule(Object.keys(values),function(){for(const[k,v]of Object.entries(values))this.setExport(k,v);},{context});}
const modules={rules:synthetic({Adventure,RULES}),episodes:synthetic({EPISODES}),characters:synthetic({HORSES}),audio:synthetic({AdventureAudio:Audio}),celebration:synthetic({Celebration:Confetti}),forest:synthetic({MagicForest:Forest})};
await modules.forest.link(()=>{});await modules.forest.evaluate();
const source=fs.readFileSync(new URL('../dist/game.js',import.meta.url),'utf8')+'\nexport {game,keys,start,frame,forest,showStart,sound,confetti,pause,accumulator};';
const app=new vm.SourceTextModule(source,{context,importModuleDynamically:async()=>modules.forest});
await app.link(spec=>modules[Object.keys(modules).find(key=>spec.includes(key+'.js'))]);await app.evaluate();await new Promise(resolve=>setImmediate(resolve));
const ui=app.namespace;
assert.equal($('#episode-forest').attributes['aria-pressed'],'true');
assert($('#episode-picker').innerHTML.includes('horse-option episode-option'));assert($('#episode-picker').innerHTML.includes('episode-forest.png'));assert($('#episode-picker').innerHTML.includes('episode-dino.png'));
for(const id of ['forest','dino','cave'])assert(fs.existsSync(new URL('../dist/assets/episode-'+id+'.png',import.meta.url)));
$('#horse-moon').onclick();$('#episode-dino').onclick();assert.equal(ui.game.episodeId,'dino');assert.equal(ui.game.horseId,'moon');assert.equal($('#episode-dino').attributes['aria-pressed'],'true');assert.equal($('#episode-forest').attributes['aria-pressed'],'false');
$('#episode-forest').onclick();ui.start();
function key(code,type='keydown'){listeners[type]({code,repeat:false,preventDefault(){}});}
key('ArrowUp');key('ControlLeft');
ui.game.objects.forEach(o=>o.done=true);[...ui.game.herds,...ui.game.witches].forEach(h=>h.cleared=true);ui.game.bonus.finished=true;ui.game.distance=RULES.length-.03;
const firstScene=ui.forest;const bursts=ui.confetti.starts;ui.frame(10);ui.frame(30);
assert.equal(ui.game.episodeId,'dino','forest finish transfers in the same render frame');assert.equal(ui.game.mode,'playing','no result screen or extra Start click');assert.equal(ui.game.horseId,'moon');assert.equal(ui.game.distance,0);assert.equal(ui.game.count,0);assert.equal(ui.game.boss.hp,3);assert(firstScene.disposed);
assert.equal($('#overlay').hidden,true);assert.equal(ui.forest.episodeId,'dino');assert.equal(ui.sound.state.episodeId,'dino');assert(ui.keys.has('ArrowUp')&&ui.keys.has('ControlLeft'),'held input survives transition');assert.equal(ui.confetti.starts,bursts+1,'finish confetti carries into new episode');assert(ui.accumulator>=0,'fixed simulation step remains valid');
const dinoScene=ui.forest;ui.frame(50);ui.frame(70);assert(ui.game.distance>0,'continuing to hold Up moves without a new keypress');assert.equal(ui.forest,dinoScene,'transition fires once');
ui.pause();const stopped=ui.game.distance;ui.frame(90);assert.equal(ui.game.distance,stopped);ui.pause();key('ArrowUp');
ui.game.objects.forEach(o=>o.done=true);[...ui.game.herds,...ui.game.witches].forEach(h=>h.cleared=true);ui.game.bonus.finished=true;ui.game.distance=RULES.length-.03;ui.frame(110);ui.frame(130);
assert.equal(ui.game.mode,'playing');assert.equal(ui.game.episodeId,'cave');assert(dinoScene.disposed);assert.equal(ui.sound.state.episodeId,'cave');assert(ui.keys.has('ArrowUp'));const caveScene=ui.forest;
ui.game.objects.forEach(o=>o.done=true);[...ui.game.herds,...ui.game.witches,...ui.game.vents].forEach(h=>h.cleared=true);ui.game.bonus.finished=true;ui.game.distance=RULES.length-.03;ui.frame(150);ui.frame(170);
assert.equal(ui.game.mode,'finished');assert.equal(ui.game.episodeId,'cave');assert.equal(ui.forest,caveScene);assert.equal($('#overlay').hidden,false,'last episode still shows congratulations');assert.equal(ui.sound.playing,false);
ui.showStart();assert.equal($('#episode-cave').attributes['aria-pressed'],'true');$('#episode-forest').onclick();assert.equal(ui.game.episodeId,'forest');assert.equal(ui.game.mode,'intro');assert.equal(ui.game.horseId,'moon');
ui.start();key('ArrowUp');ui.frame(370);assert(ui.game.distance>.7&&ui.game.distance<.85,'a 200ms render frame advances elapsed simulation time instead of slowing the game to 60ms');
console.log('PASS: episode picture cards and selected states, immediate forest-to-dinosaur-to-cave transitions, chosen horse and held keys preserved, one transition, safe simulation step, confetti/audio handoff, final congratulations, menu return and low-FPS timing');
