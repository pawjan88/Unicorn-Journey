import assert from 'node:assert/strict';
import { AdventureAudio } from '../dist/audio.js';
let nodes=[];
class Node {
  constructor(){this.gain={value:0,setTargetAtTime(value){this.value=value;}};this.playbackRate={value:1};this.stopped=false;nodes.push(this);}
  connect(node){return node;}disconnect(){}start(when=0,offset=0){this.started=true;this.offset=offset;}stop(){this.stopped=true;this.onended?.();}
}
class Context {
  constructor(){this.state='suspended';this.currentTime=0;this.destination={};}
  createGain(){return new Node();}createBufferSource(){return new Node();}
  resume(){this.state='running';return Promise.resolve();}
  decodeAudioData(){return Promise.resolve({duration:53.333});}
}
globalThis.window={AudioContext:Context};
const requests=[];
globalThis.fetch=async url=>{requests.push(String(url));return {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)};};
const audio=new AdventureAudio();
assert.equal(audio.enabled,true);assert.equal(audio.context,null,'no autoplay context before gesture');
audio.setPlaying(true);assert.equal(audio.music,null);
audio.unlock();await audio.ready;assert(audio.music?.started);assert(audio.music.loop);assert.equal(audio.buffers.size,20);
assert(requests.some(url=>url.endsWith('/audio/step_konia_3s.mp3')));assert(requests.some(url=>url.endsWith('/audio/rzenie_konia_3s.mp3')),'supplied files are loaded');
const originalMusic=audio.music;audio.startMusic();assert.equal(audio.music,originalMusic,'one music loop');
let count=audio.effects.size;audio.update(.1,true,true);assert(audio.hooves?.started,'recorded hooves when moving on ground');assert(audio.hooves.loop);assert.equal(audio.hooves.buffer,audio.buffers.get('hoof-loop'));assert.equal(audio.hooves.playbackRate.value,1,'recording keeps original speed');
const firstHooves=audio.hooves;for(let i=0;i<30;i++)audio.update(.1,true,true);assert.equal(audio.hooves,firstHooves,'one three-second loop, no overlapping copies');
const played=nodes.filter(n=>n.started).length;audio.update(.1,false,true);assert.equal(audio.hooves,null);assert(firstHooves.stopped,'recorded footsteps stop immediately');audio.update(.1,true,false);assert.equal(nodes.filter(n=>n.started).length,played,'no clops while blocked or airborne');
audio.update(.1,true,true);assert(audio.hooves?.started&&audio.hooves!==firstHooves,'footsteps resume with movement');
audio.effect('neigh');const firstNeigh=audio.neigh;assert.equal(firstNeigh.buffer,audio.buffers.get('neigh'));audio.effect('neigh');assert(firstNeigh.stopped);assert(audio.neigh!==firstNeigh,'new jump replaces old neigh instead of layering');audio.effect('magic-shot');assert.equal(audio.effects.size,2);
audio.context.currentTime=12;audio.setPlaying(false);assert.equal(audio.music,null);assert.equal(audio.effects.size,0);assert.equal(audio.hooves,null);assert.equal(audio.neigh,null);assert.equal(audio.musicOffset,12);
audio.setPlaying(true);assert.equal(audio.music.offset,12,'music resumes at paused position');
audio.update(.1,true,true);const mutedHooves=audio.hooves;audio.setEnabled(false);assert.equal(audio.music,null);assert.equal(audio.hooves,null);assert(mutedHooves.stopped);count=nodes.filter(n=>n.started).length;audio.effect('neigh');audio.update(1,true,true);assert.equal(nodes.filter(n=>n.started).length,count,'mute blocks music and effects');
audio.setEnabled(true);assert(audio.music);audio.setPlaying(false);audio.effect('confetti-pop');assert.equal(audio.effects.size,1,'finish sound can follow stopped music');
audio.reset();assert.equal(audio.effects.size,0);assert.equal(audio.musicOffset,0);assert.equal(audio.hooves,null);assert.equal(audio.neigh,null);
audio.setPlaying(true);
const crossing={type:'witch',elapsed:1.2,cleared:false};
audio.update(.016,false,true,crossing);const laugh=audio.witchLaugh;assert(laugh?.started&&laugh.loop);assert.equal(laugh.buffer,audio.buffers.get('witch-cackle'));assert.equal(laugh.offset,1.2,'laughter follows flight clock');
for(let i=0;i<10;i++)audio.update(.016,false,true,crossing);assert.equal(audio.witchLaugh,laugh,'one cackle loop');
audio.setPlaying(false);assert(laugh.stopped);assert.equal(audio.witchLaugh,null,'pause stops the witches');
crossing.elapsed=2;audio.setPlaying(true);audio.update(.016,false,true,crossing);assert.equal(audio.witchLaugh.offset,2,'resume follows paused flight position');
audio.setEnabled(false);assert.equal(audio.witchLaugh,null);audio.update(.016,false,true,crossing);assert.equal(audio.witchLaugh,null,'mute blocks cackle');
audio.setEnabled(true);audio.update(.016,false,true,crossing);const ended=audio.witchLaugh;crossing.cleared=true;audio.update(.016,false,true,crossing);assert(ended.stopped);assert.equal(audio.witchLaugh,null,'laughter ends with flight');
audio.update(.016,false,true,{type:'unicorn',elapsed:1});assert.equal(audio.witchLaugh,null,'unicorn herds do not cackle');
audio.update(.016,false,true,{type:'witch',elapsed:0,cleared:false});audio.reset();assert.equal(audio.witchLaugh,null,'restart clears cackle');
assert(requests.some(url=>url.endsWith('/audio/witch-cackle.mp3')));
audio.setMusicState('dino',false);audio.setPlaying(true);assert.equal(audio.music.buffer,audio.buffers.get('dino-ambient'),'episode 2 plays uploaded jungle/insect mix');
const ambient=audio.music;audio.context.currentTime+=4;audio.setMusicState('dino',true);assert(ambient.stopped);assert.equal(audio.music.buffer,audio.buffers.get('dino-thunder'),'fight plays supplied thunder');
const thunder=audio.music;audio.setPlaying(false);assert(thunder.stopped);audio.setPlaying(true);assert.equal(audio.music.buffer,audio.buffers.get('dino-thunder'));audio.setMusicState('dino',false);assert.equal(audio.music.buffer,audio.buffers.get('dino-ambient'));assert.equal(audio.music.offset,4,'ambient resumes after boss');
audio.update(.016,false,true,{type:'dinosaur',elapsed:1,cleared:false});assert.equal(audio.dinoCrossing.buffer,audio.buffers.get('dino-call'));audio.update(.016,false,true,null);assert.equal(audio.dinoCrossing,null);
audio.update(.016,false,true,{type:'pterodactyl',elapsed:.5,cleared:false});assert.equal(audio.dinoCrossing.buffer,audio.buffers.get('ptero-call'));assert.equal(audio.witchLaugh,null);audio.setPlaying(false);assert.equal(audio.dinoCrossing,null);audio.setMusicState('forest',false);audio.setPlaying(true);assert.equal(audio.music.buffer,audio.buffers.get('forest-music'),'episode 1 soundtrack unchanged');audio.reset();
audio.setPlaying(true);
const giant={elapsed:6,done:false};audio.update(.016,false,true,null,giant);
const roar=audio.giantRoar;assert(roar?.started);assert.equal(roar.buffer,audio.buffers.get('giant-roar'));assert.equal(roar.offset,.5,'roar follows the encounter clock');
audio.update(.016,false,true,null,giant);assert.equal(audio.giantRoar,roar,'only one giant roar source');
audio.setPlaying(false);assert(roar.stopped);assert.equal(audio.giantRoar,null,'pause stops the roar');
giant.elapsed=6.5;audio.setPlaying(true);audio.update(.016,false,true,null,giant);assert.equal(audio.giantRoar.offset,1,'resume continues the roar at its current position');
audio.setEnabled(false);assert.equal(audio.giantRoar,null);audio.update(.016,false,true,null,giant);assert.equal(audio.giantRoar,null,'mute suppresses the roar');
audio.setEnabled(true);audio.update(.016,false,true,null,giant);const resumedRoar=audio.giantRoar;giant.elapsed=8.4;audio.update(.016,false,true,null,giant);assert(resumedRoar.stopped);assert.equal(audio.giantRoar,null,'roar ends when the jaw closes');audio.reset();assert.equal(audio.giantRoar,null);
audio.setMusicState('cave');audio.setPlaying(true);assert.equal(audio.music.buffer,audio.buffers.get('cave-ambient'),'cave uses natural water and air ambiance');
for(const [type,name]of [['lizard','cave-lizards'],['bat','cave-bats'],['steam','cave-steam']]){audio.update(.016,false,true,{type,elapsed:.8,cleared:false});assert.equal(audio.dinoCrossing.buffer,audio.buffers.get(name));assert.equal(audio.crossingTrack,name);}
audio.setPlaying(false);assert.equal(audio.dinoCrossing,null);audio.setPlaying(true);audio.update(.016,false,true,null,{type:'crystal-turtle',elapsed:6,done:false});assert.equal(audio.giantRoar.buffer,audio.buffers.get('cave-turtle'),'turtle uses gentle animal breath');audio.stopGiant();
audio.effect('bump');assert.equal([...audio.effects].at(-1).buffer,audio.buffers.get('cave-rock'));audio.effect('collect');assert.equal([...audio.effects].at(-1).buffer,audio.buffers.get('cave-crystal'));audio.effect('magic-shot');assert.equal([...audio.effects].at(-1).buffer,audio.buffers.get('cave-steam'),'cave magic uses a natural air swish');audio.reset();
const failedFetch=globalThis.fetch;globalThis.fetch=async()=>{throw new Error('offline');};const silent=new AdventureAudio();silent.unlock();await silent.ready;assert.equal(silent.buffers.size,0,'missing audio cannot prevent game from loading');globalThis.fetch=failedFetch;
const mix=new AdventureAudio();mix.setVolume('music',.4);mix.setVolume('effects',.6);mix.unlock();await mix.ready;mix.setPlaying(true);
assert.equal(mix.musicGain.gain.value,.4);assert.equal(mix.effectsGain.gain.value,.6);
for(let i=0;i<30;i++)mix.effect('magic-shot');assert(mix.effects.size<=12,'rapid spell effects have a bounded voice count');
mix.update(.016,false,true);assert.equal(mix.musicGain.gain.value,.4*.65,'music ducks around magic without changing the chosen music volume');
mix.setVolume('effects',2);assert.equal(mix.effectsVolume,1);mix.setVolume('music',NaN);assert.equal(mix.musicVolume,0);mix.reset();assert.equal(mix.effects.size,0);
console.log('PASS: gesture-based start, one calm music loop, hoof movement/airborne guards, supplied recordings, single hoof loop, non-overlapping neigh/spell playback, pause/resume, mute, finish, restart, missing-audio fallback, independent volumes, ducking and bounded voices');
