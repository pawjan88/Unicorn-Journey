import { Adventure, RULES } from './rules.js?v=15';
import { AdventureAudio } from './audio.js?v=14';
import { EPISODES } from './episodes.js?v=12';
import { HORSES } from './characters.js?v=12';
import { Celebration } from './celebration.js?v=12';
const $ = selector => document.querySelector(selector);
const keys = new Set();
const input = { forward: false, steer: 0, fire: false };
let forest, previousTime = 0, accumulator = 0, pendingEpisode = null, sceneTime = 0, contextUnavailable = false;
const sound = new AdventureAudio();
const confetti = new Celebration($('#confetti'));
const game = new Adventure(handleEvent);
const overlay = $('#overlay');
const startTemplate = overlay.innerHTML;
let lastHud='',uiMode=null;
function syncMode(){if(uiMode!==game.mode){uiMode=game.mode;$('.game').setAttribute('data-mode',uiMode);}}

function announce(text){$('#message').textContent=text;}

function updateHud() {
  syncMode();
  $('#progress').style.width = `${game.distance / RULES.length * 100}%`;
  const signature=[game.mode,game.episodeId,game.count,game.waitingForHerd,game.waitingCrossing?.type,game.bonus.active,game.bonusCount,game.boss.active,game.boss.done,game.boss.hp].join(':');
  if(signature===lastHud)return;
  lastHud=signature;
  $('#count').innerHTML = `${game.count} <small>/ ${game.episode.total}</small>`;
  $('#bonus-count').hidden = game.bonusCount === 0;
  $('#bonus-count').textContent = `+${game.bonusCount}`;
  $('#boss-notice').hidden = !game.boss.active || game.boss.done;
  $('#boss-hp').textContent = '●'.repeat(game.boss.hp) + '○'.repeat(3-game.boss.hp);
  $('#boss-notice').setAttribute('aria-label',`${game.episode.bossName}: pozostało ${game.boss.hp} z 3 trafień`);
}
function start(options = {}) {
  if (!forest||contextUnavailable) return;
  sound.unlock(); sound.reset(); sound.setMusicState(game.episodeId,false); sound.setPlaying(true); confetti.reset();
  if (!options.preserveInput) keys.clear();
  pendingEpisode = null; game.start(); updateHud();
  forest.resetEffects();
  overlay.hidden = true;
  $('#pause').textContent = 'Ⅱ';
  $('#pause').setAttribute('aria-label', 'Pauza');
  accumulator = 0;
  $('#world').focus({ preventScroll: true });
}
function resume() {
  if(contextUnavailable){announce('Grafika odpoczywa. Poczekaj chwilkę lub odśwież stronę.');return;}
  sound.unlock(); sound.setPlaying(true);
  keys.clear(); game.resume(); overlay.hidden = true;
  $('#pause').textContent = 'Ⅱ';
  $('#pause').setAttribute('aria-label', 'Pauza');
  $('#world').focus({ preventScroll: true });
}
function pause() {
  if (game.mode === 'paused') { resume(); return; }
  if (game.mode !== 'playing') return;
  keys.clear(); game.pause(); sound.setPlaying(false); overlay.hidden = false;
  $('#pause').textContent = '▶';
  $('#pause').setAttribute('aria-label', 'Wznów grę');
  syncMode();
  overlay.innerHTML = `<div class="intro"><div class="pill">CHWILA ODPOCZYNKU</div><h2>Magia na Ciebie<br><em>poczeka.</em></h2><p>Odpocznij chwilkę. Wracamy, kiedy zechcesz.</p><button class="primary" id="resume">Jedziemy dalej <span>→</span></button><div class="sound-settings"><label>Muzyka <input id="music-volume" type="range" min="0" max="100" value="${Math.round((sound.musicVolume??.25)*100)}"></label><label>Efekty <input id="effects-volume" type="range" min="0" max="100" value="${Math.round((sound.effectsVolume??.85)*100)}"></label></div><button class="secondary" id="back-menu">Wróć do wyboru przygody</button></div>`;
  $('#resume').onclick = resume;
  $('#back-menu').onclick = showStart;
  $('#music-volume').oninput=event=>sound.setVolume('music',Number(event.target.value)/100);
  $('#effects-volume').oninput=event=>sound.setVolume('effects',Number(event.target.value)/100);
  $('#resume').focus({ preventScroll: true });
}
function handleEvent(event) {
  if (event.type === 'collect') {
    sound.effect('collect', .35);
    forest?.collect(event.object); updateHud();
  } else if (event.type === 'shot') {
    forest?.fire(event);
    sound.effect('magic-shot', .44);
  } else if (event.type === 'jump') {
    sound.stopHooves?.();
    sound.effect('neigh', .44);
  } else if (event.type === 'herdStart') {
    if(event.herd.type==='unicorn')sound.effect('neigh',.18,.94);
  } else if(event.type==='giantStep'){
    forest?.giantStep?.(event.x);sound.effect('bump',.25+.12*Math.max(0,1-Math.abs(event.x)/20),.46);
  } else if (event.type === 'episodeSelect') {
    if(!$('#episode-picker')){overlay.innerHTML=startTemplate;overlay.hidden=false;}
    rebuildForest();applyEpisodeUI();bindStart();updateHud();
  } else if (event.type === 'horseSelect') {
    forest?.selectHorse(event.horseId); refreshHorseChoices();
  } else if (event.type === 'bonusStart') {
    sound.effect('collect', .45);
  } else if (event.type === 'bonusCollect') {
    sound.effect('collect', .4); forest?.collect(event.object); updateHud();
  } else if (event.type === 'bossWake') {
    if(game.episodeId==='dino')sound.effect('dino-call',.4,.8);
  } else if (event.type === 'rockRoll') {
    forest?.bossThrow(); sound.effect('bump', .15, .65);
  } else if (event.type === 'rockHit') {
    sound.effect('bump', .35);
  } else if (event.type === 'bump') {
    sound.effect('bump', .25);
  } else if (event.type === 'cleared') {
    sound.effect('collect', .18, 1.15);
  } else if (event.type === 'finish') {
    if(game.episodeId==='forest'){pendingEpisode='dino';return;}
    keys.clear(); sound.setPlaying(false); sound.effect('confetti-pop', .6);
    forest?.celebrate(); confetti.start(); overlay.hidden = false;
    overlay.innerHTML = `<div class="intro"><div class="pill">✦ MAGICZNA META ZDOBYTA!</div><h2>Brawo!<br>Udało Ci się!</h2><p>${game.episode.endText}<br>${game.episode.pickupResult}: <strong>${game.count} z ${game.episode.total}</strong><br>Tęczowy bonus: <strong>${game.bonusCount} z 5</strong></p><button class="primary" id="again">Zagraj jeszcze raz <span>↻</span></button><button class="secondary" id="change-horse">Wybierz przygodę lub konika</button></div>`;
    $('#again').onclick = start;
    $('#change-horse').onclick = showStart;
    $('#again').focus({ preventScroll: true });

  }
}
function refreshHorseChoices() {
  HORSES.forEach(horse => {
    const button=$('#horse-'+horse.id);
    if(button)button.setAttribute('aria-pressed', String(game.horseId===horse.id));
  });

}
function applyEpisodeUI() {
  const episode=game.episode;
  $('.game').setAttribute('data-episode',game.episodeId);
  $('.edition').textContent=episode.edition;
  $('h1').innerHTML=episode.title;$('.heading p').textContent=episode.subtitle;
  $('#count-icon').textContent=episode.icon;$('#count-label').textContent=episode.pickupLabel;
  $('#obstacle-hint').textContent=episode.obstacleHint;$('#enemy-hint').textContent=episode.enemyHint;$('#shot-hint').textContent=episode.shotHint;
  if($('#intro-copy'))$('#intro-copy').textContent=episode.intro;
}
function rebuildForest() {
  if(!forest)return;
  forest.dispose();
  forest=new forest.constructor($('#world'),game.objects,game.herds,{witches:game.witches,horseId:game.horseId,episodeId:game.episodeId});
}
function bindStart() {
  $('#episode-picker').innerHTML=Object.values(EPISODES).map((episode,index)=>`<button type="button" class="horse-option episode-option" id="episode-${episode.id}" aria-label="Epizod ${index+1}: ${episode.name}" aria-pressed="${game.episodeId===episode.id}"><img class="episode-image" src="assets/episode-${episode.id}.png" alt=""><strong><span>${index+1}.</span> ${episode.name}</strong></button>`).join('');
  Object.values(EPISODES).forEach(episode=>{$('#episode-'+episode.id).onclick=()=>game.selectEpisode(episode.id);});
  $('#intro-copy').textContent=game.episode.intro;
  $('#horse-picker').innerHTML = HORSES.map(horse=>`<button type="button" class="horse-option" id="horse-${horse.id}" aria-label="Wybierz: ${horse.name}" aria-pressed="${game.horseId===horse.id}"><img src="assets/${horse.portrait}" alt=""><strong>${horse.name}</strong><span class="horse-colors" aria-hidden="true"><i style="background:${horse.coat}"></i><i style="background:${horse.hooves}"></i><i style="background:${horse.horn}"></i></span></button>`).join('');
  HORSES.forEach(horse=>{$('#horse-'+horse.id).onclick=()=>game.selectHorse(horse.id);});
  $('#play').onclick=start;$('#play').disabled=!forest;if(forest)$('#play').innerHTML='Ruszamy po przygodę! <span>→</span>';refreshHorseChoices();
}
function showStart() {
  pendingEpisode=null;keys.clear();sound.reset();confetti.reset();game.reset();forest.resetEffects();
  overlay.innerHTML=startTemplate;overlay.hidden=false;bindStart();applyEpisodeUI();updateHud();
}
bindStart();applyEpisodeUI();
$('#pause').onclick = pause;
$('#sound').onclick = () => {
  sound.setEnabled(!sound.enabled);
  $('#sound').textContent = `♫ Dźwięk: ${sound.enabled ? 'wł.' : 'wył.'}`;
  $('#sound').setAttribute('aria-label', sound.enabled ? 'Wyłącz muzykę i efekty' : 'Włącz muzykę i efekty');
  $('#sound').setAttribute('aria-pressed', String(sound.enabled));
};
$('#fullscreen').onclick = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await $('.game').requestFullscreen();
  } catch { announce('Pełny ekran możesz też włączyć klawiszem F11.'); }
};
document.addEventListener('fullscreenchange', () => {
  const full = !!document.fullscreenElement;
  $('#fullscreen').textContent = '⛶';
  $('#fullscreen').setAttribute('aria-label', full ? 'Wyjdź z pełnego ekranu' : 'Włącz pełny ekran');
});
addEventListener('keydown', event => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'ControlLeft', 'ControlRight'].includes(event.code)) {
    if (game.mode !== 'playing') return;
    event.preventDefault(); keys.add(event.code);
    if (event.code === 'Space' && !event.repeat) game.jump();
    if (event.code.startsWith('Control') && !event.repeat) game.shoot();
  }
  if (event.code === 'Escape' && !event.repeat) pause();
});
addEventListener('keyup',event=>{keys.delete(event.code);if(event.code==='ArrowUp')sound.stopHooves?.();});
addEventListener('blur', () => { keys.clear(); if (game.mode === 'playing') pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && game.mode === 'playing') pause(); });
$('#world').addEventListener('webglcontextlost', event => {
  event.preventDefault();contextUnavailable=true;if(game.mode==='playing')pause();
  $('.game').setAttribute('data-context','lost');
  announce('Chwila przerwy w grafice. Twoja przygoda jest bezpieczna.');
});
$('#world').addEventListener('webglcontextrestored',()=>{contextUnavailable=false;$('.game').setAttribute('data-context','ready');forest?.resize();announce('Magia wróciła! Możesz jechać dalej.');});
$('.help')?.addEventListener('toggle',event=>{if(event.currentTarget.open&&game.mode==='playing')pause();});

function frame(timestamp) {
  const dt = Math.min(.25, Math.max(0, (timestamp - (previousTime || timestamp)) / 1000));
  previousTime = timestamp;
  input.forward = keys.has('ArrowUp');
  input.steer = Number(keys.has('ArrowRight')) - Number(keys.has('ArrowLeft'));
  input.fire = keys.has('ControlLeft') || keys.has('ControlRight');
  accumulator += dt;
  while (accumulator >= 1/120) { game.update(1/120, input); accumulator -= 1/120; }
  // Switch after the fixed-step loop, so reset cannot make its accumulator negative.
  if(pendingEpisode&&game.mode==='finished'){
    const next=pendingEpisode;pendingEpisode=null;
    if(game.selectEpisode(next)){
      start({preserveInput:true});
      sound.effect('confetti-pop',.6);confetti.start();
    }
  }
  updateHud();
  sound.setMusicState(game.episodeId,game.boss.active&&!game.boss.done);
  sound.update(dt, game.moving, game.jumpTime < 0 && !game.bonus.active, [...game.herds,...game.witches].find(w=>w.elapsed>=0&&!w.cleared)||null,game.giant);
  const visualDt=game.mode==='paused'?0:dt;
  sceneTime+=visualDt;
  if(!contextUnavailable)forest.update(game, sceneTime, visualDt);
  confetti.update(visualDt);
  requestAnimationFrame(frame);
}
import('./forest.js?v=15').then(async ({ MagicForest }) => {
  await document.fonts?.ready;
  await MagicForest.prepare();
  forest = new MagicForest($('#world'), game.objects, game.herds, { witches:game.witches, horseId:game.horseId, episodeId:game.episodeId });
  $('#play').disabled = false;
  $('#play').innerHTML = 'Ruszamy po przygodę! <span>→</span>';
  requestAnimationFrame(frame);
}).catch(error => {
  console.error('Nie udało się otworzyć magicznego lasu:', error);
  overlay.innerHTML = '<div class="intro"><div class="pill">MAŁA WIELKA PRZYGODA</div><h2>Obudźmy las!</h2><p>Gra potrzebuje włączonej akceleracji graficznej (WebGL). Otwórz ją w aktualnym Chrome, Edge lub Firefox.</p><button class="primary" id="reload">Spróbuj ponownie ↻</button></div>';
  $('#reload').onclick = () => location.reload();
});

// Local-only checkpoints for browser QA. Never exposed on the published hostname.
if(typeof location!=='undefined'&&['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).has('qa')){
  let contextExtension,meter;
  Object.defineProperty(window,'__unicornQA',{value:Object.freeze({
    snapshot:()=>({mode:game.mode,episode:game.episodeId,horse:game.horseId,distance:game.distance,x:game.x,jumpTime:game.jumpTime,jumpHeight:game.jumpHeight,headFrame:forest?.headFrame,count:game.count,bonus:game.bonus.active,bonusCount:game.bonusCount,boss:{hp:game.boss.hp,active:game.boss.active,done:game.boss.done},blocked:game.fenceBlocked,waiting:game.waitingForHerd,shotTime:forest?.shotTime,shotCooldown:game.shotCooldown,enemiesRemaining:game.objects.filter(object=>!object.done&&['troll','dragon','boss'].includes(object.type)).length,sceneTime,giant:game.giant?{...game.giant}:null,environment:forest?.environmentView?.(),view:forest?.rideView?.(),audio:{state:sound.context?.state,enabled:sound.enabled,playing:sound.playing,buffers:sound.buffers.size,hooves:!!sound.hooves,music:sound.musicTrack,effects:sound.effects.size,giantRoar:!!sound.giantRoar},render:{width:forest?.renderer.domElement.width,height:forest?.renderer.domElement.height,calls:forest?.renderer.info.render.calls,triangles:forest?.renderer.info.render.triangles,headAngle:forest?.mount?.userData.head.rotation.y,quality:forest?.resolutionScale}}),
    checkpoint:(distance,x=0)=>{game.distance=distance;game.x=x;game.stun=0;game.jumpTime=-1;game.jumpHeight=0;game.objects.forEach(o=>{if(o.type!=='boss')o.done=o.z<distance-2;});[...game.herds,...game.witches].forEach(h=>{h.elapsed=-1;h.cleared=h.z<distance-12;});game.bonus.active=false;game.bonus.finished=distance>RULES.bonusEnd;game.bonus.elapsed=0;game.flightHeight=0;if(game.giant){Object.assign(game.giant,{elapsed:-1,done:distance>game.giant.z+2,roared:false,lastStep:-1,phase:'waiting',visible:false,walking:false});}game.rocks=[];accumulator=0;forest?.resetEffects();},
    loseContext:()=>{contextExtension=forest.renderer.getContext().getExtension('WEBGL_lose_context');contextExtension?.loseContext();},
    restoreContext:()=>contextExtension?.restoreContext(),
    audioLevel:()=>{if(!sound.master)return 0;if(!meter){meter=sound.context.createAnalyser();meter.fftSize=256;sound.master.connect(meter);}const data=new Float32Array(meter.fftSize);meter.getFloatTimeDomainData(data);return Math.sqrt(data.reduce((sum,value)=>sum+value*value,0)/data.length);},
  })});
}
