import { Adventure, RULES } from './rules.js?v=9';
import { AdventureAudio } from './audio.js?v=9';
import { EPISODES } from './episodes.js?v=9';
import { HORSES } from './characters.js?v=7';
import { Celebration } from './celebration.js?v=4';
const $ = selector => document.querySelector(selector);
const keys = new Set();
const input = { forward: false, steer: 0, fire: false };
let forest, toastTimer, previousTime = 0, accumulator = 0, pendingEpisode = null;
const sound = new AdventureAudio();
const confetti = new Celebration($('#confetti'));
const game = new Adventure(handleEvent);
const overlay = $('#overlay');
const startTemplate = overlay.innerHTML;

function message(text) {
  clearTimeout(toastTimer);
  $('#message').textContent = text;
  $('#message').style.opacity = 1;
  toastTimer = setTimeout(() => { $('#message').style.opacity = 0; }, 2300);
}
function updateHud() {
  $('#count').innerHTML = `${game.count} <small>/ ${game.episode.total}</small>`;
  $('#progress').style.width = `${game.distance / RULES.length * 100}%`;
  $('#herd-notice').hidden = !game.waitingForHerd;
  const crossingMessages={witch:'<span>🧙‍♀️</span> Czarownice lecą — poczekaj',unicorn:'<span>🦄</span> Poczekaj, stado przebiega',dinosaur:'<span>🦕</span> Poczekaj, stado dinozaurów',pterodactyl:'<span>🦅</span> Poczekaj na przelot pterodaktyli'};
  $('#herd-notice').innerHTML = crossingMessages[game.waitingCrossing?.type]||crossingMessages.unicorn;
  $('#bonus-count').hidden = game.bonusCount === 0;
  $('#bonus-count').textContent = `+ ${game.bonusCount} bonus`;
  $('#bonus-notice').hidden = !game.bonus.active;
  $('#bonus-notice').textContent = `${game.episode.icon} ${game.episode.bonusName} · ${game.bonusCount} / 5`;
  $('#boss-notice').hidden = !game.boss.active || game.boss.done;
  $('#boss-hp').textContent = '●'.repeat(game.boss.hp) + '○'.repeat(3-game.boss.hp);
}
function start(options = {}) {
  if (!forest) return;
  sound.unlock(); sound.reset(); sound.setMusicState(game.episodeId,false); sound.setPlaying(true); confetti.reset();
  if (!options.preserveInput) keys.clear();
  pendingEpisode = null; game.start(); updateHud();
  forest.resetEffects();
  overlay.hidden = true;
  $('#pause').textContent = 'Ⅱ';
  $('#pause').setAttribute('aria-label', 'Pauza');
  clearTimeout(toastTimer); $('#message').style.opacity = 0;
  accumulator = 0;
  $('#world').focus({ preventScroll: true });
}
function resume() {
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
  overlay.innerHTML = '<div class="intro"><div class="pill">CHWILA ODPOCZYNKU</div><h2>Las poczeka.</h2><p>Wracamy do naszej przygody?</p><button class="primary" id="resume">Jedziemy dalej <span>→</span></button></div>';
  $('#resume').onclick = resume;
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
    sound.effect('neigh', .44);
  } else if (event.type === 'herdStart') {
    if(event.herd.type==='unicorn')sound.effect('neigh',.18,.94);

  } else if (event.type === 'episodeSelect') {
    if(!$('#episode-picker')){overlay.innerHTML=startTemplate;overlay.hidden=false;}
    rebuildForest();applyEpisodeUI();bindStart();updateHud();
  } else if (event.type === 'horseSelect') {
    forest?.selectHorse(event.horseId); refreshHorseChoices();
  } else if (event.type === 'bonusStart') {
    sound.effect('collect', .45); message('Galop po Tęczy! 🌈');
  } else if (event.type === 'bonusCollect') {
    sound.effect('collect', .4); forest?.collect(event.object); updateHud();
  } else if (event.type === 'bonusEnd') {
    message(`Tęczowy galop: +${game.bonusCount} ${game.episode.bonusUnit}!`);
  } else if (event.type === 'bossWake') {
    message(game.episode.bossHint);if(game.episodeId==='dino')sound.effect('dino-call',.4,.8);
  } else if (event.type === 'rockRoll') {
    forest?.bossThrow(); sound.effect('bump', .15, .65);
  } else if (event.type === 'rockHit') {
    sound.effect('bump', .35); message('Uwaga na kamienie! Skręcaj strzałkami.');
  } else if (event.type === 'bump') {
    sound.effect('bump', .25);
    message('Omiń mnie albo użyj tęczowej magii — Ctrl!');
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
  const horse=HORSES.find(h=>h.id===game.horseId);
  $('#horse-badge').innerHTML = `<img src="assets/${horse.portrait}" alt=""><span>${horse.name}</span>`;
}
function applyEpisodeUI() {
  const episode=game.episode;
  $('.edition').textContent=episode.edition;
  $('h1').innerHTML=episode.title;$('.heading p').textContent=episode.subtitle;
  $('.scene-label').textContent=episode.scene;
  $('#count-icon').textContent=episode.icon;$('#count-label').textContent=episode.pickupLabel;
  $('#boss-title').textContent=episode.bossName;
  $('#obstacle-hint').textContent=episode.obstacleHint;$('#enemy-hint').textContent=episode.enemyHint;$('#shot-hint').textContent=episode.shotHint;
  if($('#intro-copy'))$('#intro-copy').textContent=episode.intro;
}
function rebuildForest() {
  if(!forest)return;
  forest.dispose();
  forest=new forest.constructor($('#world'),game.objects,game.herds,{witches:game.witches,horseId:game.horseId,episodeId:game.episodeId});
}
function bindStart() {
  $('#episode-picker').innerHTML=Object.values(EPISODES).map((episode,index)=>`<button type="button" class="horse-option episode-option" id="episode-${episode.id}" aria-label="Epizod ${index+1}: ${episode.name}" aria-pressed="${game.episodeId===episode.id}"><img src="assets/episode-${episode.id}.svg" alt=""><strong><span>${index+1}.</span> ${episode.name}</strong></button>`).join('');
  Object.values(EPISODES).forEach(episode=>{$('#episode-'+episode.id).onclick=()=>game.selectEpisode(episode.id);});
  $('#intro-copy').textContent=game.episode.intro;
  $('#horse-picker').innerHTML = HORSES.map(horse=>`<button type="button" class="horse-option" id="horse-${horse.id}" aria-label="Wybierz: ${horse.name}" aria-pressed="${game.horseId===horse.id}"><img src="assets/${horse.portrait}" alt=""><strong>${horse.name}</strong><span class="horse-colors" aria-hidden="true"><i style="background:${horse.coat}"></i><i style="background:${horse.hooves}"></i><i style="background:${horse.horn}"></i></span></button>`).join('');
  HORSES.forEach(horse=>{$('#horse-'+horse.id).onclick=()=>game.selectHorse(horse.id);});
  $('#play').onclick=start;$('#play').disabled=!forest;if(forest)$('#play').innerHTML='Zaczynamy! <span>→</span>';refreshHorseChoices();
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
  } catch { message('Pełny ekran możesz też włączyć klawiszem F11.'); }
};
document.addEventListener('fullscreenchange', () => {
  const full = !!document.fullscreenElement;
  $('#fullscreen').textContent = full ? '⛶ Wróć' : '⛶ Pełny ekran';
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
addEventListener('keyup', event => keys.delete(event.code));
addEventListener('blur', () => { keys.clear(); if (game.mode === 'playing') pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && game.mode === 'playing') pause(); });
$('#world').addEventListener('webglcontextlost', event => {
  event.preventDefault(); if (game.mode === 'playing') pause();
  message('Chwila przerwy w magii. Odśwież stronę, aby wrócić do lasu.');
});

function frame(timestamp) {
  const dt = Math.min(.06, Math.max(0, (timestamp - (previousTime || timestamp)) / 1000));
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
  if (game.mode === 'playing') updateHud();
  sound.setMusicState(game.episodeId,game.boss.active&&!game.boss.done);
  sound.update(dt, game.moving, game.jumpTime < 0 && !game.bonus.active, [...game.herds,...game.witches].find(w=>w.elapsed>=0&&!w.cleared)||null);
  forest.update(game, timestamp/1000, dt);
  confetti.update(dt);
  requestAnimationFrame(frame);
}
import('./forest.js?v=9').then(async ({ MagicForest }) => {
  await MagicForest.prepare();
  forest = new MagicForest($('#world'), game.objects, game.herds, { witches:game.witches, horseId:game.horseId, episodeId:game.episodeId });
  $('#play').disabled = false;
  $('#play').innerHTML = 'Zaczynamy! <span>→</span>';
  requestAnimationFrame(frame);
}).catch(error => {
  console.error('Nie udało się otworzyć magicznego lasu:', error);
  overlay.innerHTML = '<div class="intro"><div class="pill">MAGICZNY LAS 3D</div><h2>Obudźmy las!</h2><p>Gra potrzebuje włączonej akceleracji graficznej (WebGL). Otwórz ją w aktualnym Chrome, Edge lub Firefox.</p><button class="primary" id="reload">Spróbuj ponownie ↻</button></div>';
  $('#reload').onclick = () => location.reload();
});
