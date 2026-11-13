import {GIANT} from './giant-encounter.js?v=14';
// Local audio: supplied horse recordings, original music, and game effects.
const FILES = {
  'forest-music': 'forest-music.mp3',
  'hoof-loop': 'step_konia_3s.mp3',
  neigh: 'rzenie_konia_3s.mp3',
  bump: 'bump.mp3',
  'magic-shot': 'magic-shot.mp3',
  collect: 'collect.mp3',
  'confetti-pop': 'confetti-pop.mp3',
  'witch-cackle': 'witch-cackle.mp3',
  'dino-ambient': 'dino-ambient.mp3',
  'dino-thunder': 'grzmoty.mp3',
  'dino-call': 'dino-call.mp3',
  'ptero-call': 'ptero-call.mp3',
  'giant-roar':'giant-roar.mp3',
  'cave-ambient':'cave-ambient.mp3',
  'cave-rock':'cave-rock.mp3',
  'cave-steam':'cave-steam.mp3',
  'cave-bats':'cave-bats.mp3',
  'cave-lizards':'cave-lizards.mp3',
  'cave-turtle':'cave-turtle.mp3',
  'cave-crystal':'cave-crystal.mp3',
  'winter-ambient':'winter-ambient.mp3',
  'winter-snow':'winter-snow.mp3',
  'winter-ice':'winter-ice.mp3',
  'winter-wings':'winter-wings.mp3',
  'winter-herd':'winter-herd.mp3',
  'winter-mammoth':'winter-mammoth.mp3',
};
export class AdventureAudio {
  constructor() {
    this.enabled = true;
    this.playing = false;
    this.context = null;
    this.buffers = new Map();
    this.effects = new Set();
    this.music = null;
    this.musicOffset = 0;
    this.musicTrack = 'forest-music';
    this.trackOffsets = new Map();
    this.hooves = null;
    this.snow = null;
    this.neigh = null;
    this.witchLaugh = null;
    this.dinoCrossing = null;
    this.giantRoar=null;this.giantRoarGain=null;this.giantRoarFinished=false;
    this.episodeId='forest';this.crossingTrack=null;
    this.musicVolume=.25;this.effectsVolume=.85;this.duckUntil=0;
    // Fetching files does not start audio or create an AudioContext.
    this.files = Promise.all(Object.entries(FILES).map(async ([name, file]) => {
      try {
        const response = await fetch(new URL(`./audio/${file}`, import.meta.url));
        if (!response.ok) return [name, null];
        return [name, await response.arrayBuffer()];
      } catch { return [name, null]; }
    }));
  }
  unlock() {
    try {
      if (!this.context) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = this.enabled ? .68 : 0;
        if(this.context.createDynamicsCompressor){
          const limiter=this.context.createDynamicsCompressor();
          limiter.threshold.value=-12;limiter.knee.value=18;limiter.ratio.value=4;
          limiter.attack.value=.006;limiter.release.value=.18;
          this.master.connect(limiter).connect(this.context.destination);
        }else this.master.connect(this.context.destination);
        this.effectsGain=this.context.createGain();this.effectsGain.gain.value=this.effectsVolume;this.effectsGain.connect(this.master);
        // A short room response adds natural cave reflections to the recorded foley.
        if(this.context.createConvolver&&this.context.createBuffer){
          const reverb=this.context.createConvolver(),length=Math.floor(this.context.sampleRate*1.15),response=this.context.createBuffer(2,length,this.context.sampleRate);
          for(let channel=0;channel<2;channel++){const samples=response.getChannelData(channel);for(let i=0;i<length;i++)samples[i]=(Math.random()*2-1)*Math.exp(-i/length*7)*.32;}
          reverb.buffer=response;this.reverbGain=this.context.createGain();this.reverbGain.gain.value=0;
          this.effectsGain.connect(reverb).connect(this.reverbGain).connect(this.master);
        }
        this.musicGain = this.context.createGain();
        this.musicGain.gain.value = this.musicVolume;
        this.musicGain.connect(this.master);
        this.ready = this.files.then(files => Promise.all(files.map(async ([name, bytes]) => {
          if (!bytes) return;
          try { this.buffers.set(name, await this.context.decodeAudioData(bytes)); } catch { /* A missing sound never blocks play. */ }
        }))).then(() => this.startMusic());
      }
      // Called directly from Start, Resume or the sound button to satisfy browser autoplay rules.
      if (this.enabled) this.context.resume().then(() => this.startMusic()).catch(() => {});
    } catch { /* Audio is optional on devices without Web Audio. */ }
  }
  setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled) this.unlock();
    if (this.master) this.master.gain.setTargetAtTime(enabled ? .68 : 0, this.context.currentTime, .025);
    if (!enabled) { this.stopMusic(); this.stopEffects(); }
    else this.startMusic();
  }
  setVolume(kind,value){
    const volume=Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
    if(kind==='music'){this.musicVolume=volume;this.musicGain?.gain.setTargetAtTime(volume,this.context.currentTime,.08);}
    else if(kind==='effects'){this.effectsVolume=volume;this.effectsGain?.gain.setTargetAtTime(volume,this.context.currentTime,.025);}
  }
  setPlaying(playing) {
    this.playing = playing;
    this.reverbGain?.gain.setTargetAtTime(playing&&this.episodeId==='cave'?.16:0,this.context.currentTime,.05);
    if (playing) this.startMusic();
    else { this.stopMusic(); this.stopEffects(); }
  }
  setMusicState(episodeId, bossActive=false) {
    this.episodeId=episodeId;
    if(episodeId!=='ice')this.stopSnow();
    this.reverbGain?.gain.setTargetAtTime(this.playing&&episodeId==='cave'?.16:0,this.context.currentTime,.1);
    const next=episodeId==='ice'?'winter-ambient':episodeId==='cave'?'cave-ambient':episodeId==='dino'?(bossActive?'dino-thunder':'dino-ambient'):'forest-music';
    if(next===this.musicTrack)return;
    this.stopMusic();this.trackOffsets.set(this.musicTrack,this.musicOffset);
    this.musicTrack=next;this.musicOffset=this.trackOffsets.get(next)||0;
    if(this.musicGain)this.musicGain.gain.setTargetAtTime(this.musicVolume*(next==='dino-thunder'?.85:1),this.context.currentTime,.15);
    this.startMusic();
  }
  startMusic() {
    if (!this.context || !this.enabled || !this.playing || this.music || this.context.state !== 'running') return;
    const buffer = this.buffers.get(this.musicTrack);
    if (!buffer) return;
    this.music = this.context.createBufferSource();
    this.music.buffer = buffer;
    this.music.loop = true;
    this.music.connect(this.musicGain);
    this.musicStarted = this.context.currentTime;
    this.music.start(0, this.musicOffset % buffer.duration);
  }
  stopMusic() {
    if (!this.music) return;
    this.musicOffset += this.context.currentTime - this.musicStarted;
    this.music.stop(); this.music.disconnect(); this.music = null;
  }
  stopEffects() {
    this.stopHooves();
    this.stopWitches();
    this.stopDinoCrossing();
    this.stopGiant();
    for (const node of this.effects) { try { node.stop(); } catch {} node.disconnect(); }
    this.effects.clear();
  }
  effect(name, volume = .5, rate = 1) {
    if (!this.enabled || !this.context || this.context.state !== 'running') return;
    const requested=name;
    if(this.episodeId==='cave')name=({bump:'cave-rock',collect:'cave-crystal','magic-shot':'cave-steam'})[name]||name;
    if(this.episodeId==='ice')name=({bump:'winter-ice',collect:'cave-crystal','magic-shot':'cave-steam'})[name]||name;
    const buffer = this.buffers.get(name);
    if (!buffer) return;
    if(this.effects.size>=12){const oldest=this.effects.values().next().value;this.effects.delete(oldest);try{oldest.stop();}catch{}oldest.disconnect();}
    if(requested==='neigh'||requested==='magic-shot')this.duckUntil=this.context.currentTime+.65;
    if (name === 'neigh' && this.neigh) { try { this.neigh.stop(); } catch {} }
    const source = this.context.createBufferSource(), gain = this.context.createGain();
    if (name === 'neigh') this.neigh = source;
    source.buffer = buffer; source.playbackRate.value = rate; gain.gain.value = volume;
    source.connect(gain).connect(this.effectsGain); this.effects.add(source);
    source.onended = () => { this.effects.delete(source); if (this.neigh === source) this.neigh = null; source.disconnect(); gain.disconnect(); };
    if(['cave','ice'].includes(this.episodeId)&&requested==='magic-shot'){
      gain.gain.setTargetAtTime(0,this.context.currentTime+.25,.08);source.start(0,0,.6);
    }else source.start();
  }
  startHooves() {
    this.startSnow();
    if (this.hooves || !this.playing || !this.enabled || !this.context || this.context.state !== 'running') return;
    const buffer = this.buffers.get('hoof-loop');
    if (!buffer) return;
    const source = this.context.createBufferSource(), gain = this.context.createGain();
    source.buffer = buffer;
    source.loop = true;
    gain.gain.value = .34;
    source.connect(gain).connect(this.effectsGain);
    source.onended = () => { if (this.hooves === source) this.hooves = null; source.disconnect(); gain.disconnect(); };
    this.hooves = source;
    source.start();
  }
  stopHooves() {
    this.stopSnow();
    if (!this.hooves) return;
    const source = this.hooves;
    this.hooves = null;
    try { source.stop(); } catch {}
    source.disconnect();
  }
  startSnow(){
    if(this.snow||this.episodeId!=='ice'||!this.playing||!this.enabled||!this.context||this.context.state!=='running')return;
    const buffer=this.buffers.get('winter-snow');if(!buffer)return;
    const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=buffer;source.loop=true;gain.gain.value=.17;
    source.connect(gain).connect(this.effectsGain);this.snow=source;
    source.onended=()=>{if(this.snow===source)this.snow=null;source.disconnect();gain.disconnect();};source.start();
  }
  stopSnow(){if(!this.snow)return;const source=this.snow;this.snow=null;try{source.stop();}catch{}source.disconnect();}
  updateWitches(crossing) {
    if (!crossing || crossing.type !== 'witch' || crossing.elapsed < 0 || crossing.cleared || !this.playing || !this.enabled || !this.context || this.context.state !== 'running') {
      this.stopWitches(); return;
    }
    if (this.witchLaugh) return;
    const buffer=this.buffers.get('witch-cackle');
    if(!buffer)return;
    const source=this.context.createBufferSource(),gain=this.context.createGain();
    source.buffer=buffer;source.loop=true;gain.gain.value=.40;
    source.connect(gain).connect(this.effectsGain);
    source.onended=()=>{if(this.witchLaugh===source)this.witchLaugh=null;source.disconnect();gain.disconnect();};
    this.witchLaugh=source;
    source.start(0,crossing.elapsed%buffer.duration);
  }
  stopWitches() {
    if(!this.witchLaugh)return;
    const source=this.witchLaugh;this.witchLaugh=null;
    try{source.stop();}catch{}
    source.disconnect();
  }
  updateDinoCrossing(crossing) {
    const name=({dinosaur:'dino-call',pterodactyl:'ptero-call',lizard:'cave-lizards',bat:'cave-bats',steam:'cave-steam',reindeer:'winter-herd',owl:'winter-wings'})[crossing?.type]||null;
    if(!name||crossing.elapsed<0||crossing.cleared||!this.playing||!this.enabled||!this.context||this.context.state!=='running'){this.stopDinoCrossing();return;}
    if(this.dinoCrossing&&this.crossingTrack!==name)this.stopDinoCrossing();
    if(this.dinoCrossing)return;
    const buffer=this.buffers.get(name);if(!buffer)return;
    const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=buffer;source.loop=true;gain.gain.value=.25;
    source.connect(gain).connect(this.effectsGain);source.onended=()=>{if(this.dinoCrossing===source)this.dinoCrossing=null;source.disconnect();gain.disconnect();};
    this.dinoCrossing=source;this.crossingTrack=name;source.start(0,crossing.elapsed%buffer.duration);
  }
  stopDinoCrossing(){this.crossingTrack=null;if(!this.dinoCrossing)return;const source=this.dinoCrossing;this.dinoCrossing=null;try{source.stop();}catch{}source.disconnect();}
  updateGiant(giant){
    if(!giant||giant.done||giant.elapsed<GIANT.roarAt||giant.elapsed>=GIANT.roarEnd||!this.playing||!this.enabled||!this.context||this.context.state!=='running'){this.stopGiant();return;}
    if(this.giantRoar||this.giantRoarFinished)return;
    const buffer=this.buffers.get(giant.type==='mammoth'?'winter-mammoth':giant.type==='crystal-turtle'?'cave-turtle':'giant-roar'),offset=giant.elapsed-GIANT.roarAt;
    if(!buffer)return;if(offset>=buffer.duration){this.giantRoarFinished=true;return;}
    const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=buffer;gain.gain.value=.62;
    source.connect(gain).connect(this.effectsGain);this.giantRoar=source;this.giantRoarGain=gain;
    source.onended=()=>{if(this.giantRoar===source){this.giantRoar=null;this.giantRoarGain=null;this.giantRoarFinished=true;}source.disconnect();gain.disconnect();};
    source.start(0,offset);
  }
  stopGiant(){if(this.giantRoar){this.giantRoar.onended=null;try{this.giantRoar.stop();}catch{}this.giantRoar.disconnect();this.giantRoarGain?.disconnect();this.giantRoar=null;this.giantRoarGain=null;}this.giantRoarFinished=false;}
  update(dt, moving, grounded, witchCrossing=null,giant=null) {
    const roaring=giant&&!giant.done&&giant.elapsed>=GIANT.roarAt&&giant.elapsed<GIANT.roarEnd;
    if(this.musicGain)this.musicGain.gain.setTargetAtTime(this.musicVolume*(this.musicTrack==='dino-thunder'?.85:1)*(roaring?.4:this.context.currentTime<this.duckUntil?.65:1),this.context.currentTime,.12);
    this.updateWitches(witchCrossing);this.updateDinoCrossing(witchCrossing);
    this.updateGiant(giant);
    if (!this.playing || !this.enabled || !moving || !grounded) { this.stopHooves(); return; }
    this.startHooves();
  }
  reset() {
    this.setPlaying(false); this.musicOffset = 0; this.trackOffsets.clear();this.duckUntil=0;
  }
}
