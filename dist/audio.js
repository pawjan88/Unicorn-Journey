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
    this.neigh = null;
    this.witchLaugh = null;
    this.dinoCrossing = null;
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
        this.master.connect(this.context.destination);
        this.musicGain = this.context.createGain();
        this.musicGain.gain.value = .30;
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
  setPlaying(playing) {
    this.playing = playing;
    if (playing) this.startMusic();
    else { this.stopMusic(); this.stopEffects(); }
  }
  setMusicState(episodeId, bossActive=false) {
    const next=episodeId==='dino'?(bossActive?'dino-thunder':'dino-ambient'):'forest-music';
    if(next===this.musicTrack)return;
    this.stopMusic();this.trackOffsets.set(this.musicTrack,this.musicOffset);
    this.musicTrack=next;this.musicOffset=this.trackOffsets.get(next)||0;
    if(this.musicGain)this.musicGain.gain.setTargetAtTime(next==='dino-thunder'?.36:.30,this.context.currentTime,.15);
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
    for (const node of this.effects) { try { node.stop(); } catch {} node.disconnect(); }
    this.effects.clear();
  }
  effect(name, volume = .5, rate = 1) {
    if (!this.enabled || !this.context || this.context.state !== 'running') return;
    const buffer = this.buffers.get(name);
    if (!buffer) return;
    if (name === 'neigh' && this.neigh) { try { this.neigh.stop(); } catch {} }
    const source = this.context.createBufferSource(), gain = this.context.createGain();
    if (name === 'neigh') this.neigh = source;
    source.buffer = buffer; source.playbackRate.value = rate; gain.gain.value = volume;
    source.connect(gain).connect(this.master); this.effects.add(source);
    source.onended = () => { this.effects.delete(source); if (this.neigh === source) this.neigh = null; source.disconnect(); gain.disconnect(); };
    source.start();
  }
  startHooves() {
    if (this.hooves || !this.playing || !this.enabled || !this.context || this.context.state !== 'running') return;
    const buffer = this.buffers.get('hoof-loop');
    if (!buffer) return;
    const source = this.context.createBufferSource(), gain = this.context.createGain();
    source.buffer = buffer;
    source.loop = true;
    gain.gain.value = .42;
    source.connect(gain).connect(this.master);
    source.onended = () => { if (this.hooves === source) this.hooves = null; source.disconnect(); gain.disconnect(); };
    this.hooves = source;
    source.start();
  }
  stopHooves() {
    if (!this.hooves) return;
    const source = this.hooves;
    this.hooves = null;
    try { source.stop(); } catch {}
    source.disconnect();
  }
  updateWitches(crossing) {
    if (!crossing || crossing.type !== 'witch' || crossing.elapsed < 0 || crossing.cleared || !this.playing || !this.enabled || !this.context || this.context.state !== 'running') {
      this.stopWitches(); return;
    }
    if (this.witchLaugh) return;
    const buffer=this.buffers.get('witch-cackle');
    if(!buffer)return;
    const source=this.context.createBufferSource(),gain=this.context.createGain();
    source.buffer=buffer;source.loop=true;gain.gain.value=.40;
    source.connect(gain).connect(this.master);
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
    const name=crossing?.type==='dinosaur'?'dino-call':crossing?.type==='pterodactyl'?'ptero-call':null;
    if(!name||crossing.elapsed<0||crossing.cleared||!this.playing||!this.enabled||!this.context||this.context.state!=='running'){this.stopDinoCrossing();return;}
    if(this.dinoCrossing)return;
    const buffer=this.buffers.get(name);if(!buffer)return;
    const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=buffer;source.loop=true;gain.gain.value=.25;
    source.connect(gain).connect(this.master);source.onended=()=>{if(this.dinoCrossing===source)this.dinoCrossing=null;source.disconnect();gain.disconnect();};
    this.dinoCrossing=source;source.start(0,crossing.elapsed%buffer.duration);
  }
  stopDinoCrossing(){if(!this.dinoCrossing)return;const source=this.dinoCrossing;this.dinoCrossing=null;try{source.stop();}catch{}source.disconnect();}
  update(dt, moving, grounded, witchCrossing=null) {
    this.updateWitches(witchCrossing);this.updateDinoCrossing(witchCrossing);
    if (!this.playing || !this.enabled || !moving || !grounded) { this.stopHooves(); return; }
    this.startHooves();
  }
  reset() {
    this.setPlaying(false); this.musicOffset = 0; this.trackOffsets.clear();
  }
}
