import { HORSES } from './characters.js?v=12';
import { EPISODES } from './episodes.js?v=16';
import { GIANT,giantPose } from './giant-encounter.js?v=14';
export const RULES = Object.freeze({
  length:396, speed:4, halfWidth:2.1, riderRadius:.35, steerSpeed:2.45,
  jumpDuration:1.1, jumpHeight:1.2, fenceClearance:.54,
  shotRange:20, shotHalfWidth:.85, shotCooldown:.45,
  fenceStopDistance:.65, herdTriggerDistance:11, herdStopDistance:2.4, herdDuration:6.2,
  pairGap:5.2, bonusStart:194, bonusEnd:226, bonusDuration:8, bonusHeight:15, landingEnemyGap:16,
  bossZ:386, bossWakeDistance:373, bossStopDistance:4, rockSpeed:9, rockInterval:1.25,
});
export function skyHeightAt(distance) {
  const t=(distance-RULES.bonusStart)/(RULES.bonusEnd-RULES.bonusStart);
  return t>0&&t<1 ? RULES.bonusHeight*Math.sin(t*Math.PI)**2 : 0;
}
export class Adventure {
  constructor(onEvent=()=>{}) { this.onEvent=onEvent;this.horseId=HORSES[0].id;this.episodeId='forest';this.reset(); }
  reset() {
    this.episode=EPISODES[this.episodeId];
    this.mode='intro';this.distance=0;this.x=0;this.jumpTime=-1;this.jumpHeight=0;
    this.stun=0;this.count=0;this.bonusCount=0;this.shotCooldown=0;this.moving=false;
    this.fenceBlocked=false;this.waitingForHerd=false;this.waitingCrossing=null;this.flightHeight=0;
    this.herds=[92,183,273,361].map((z,i)=>({type:'unicorn',z,elapsed:-1,cleared:false,count:6,direction:i%2?-1:1}));
    this.witches=[57,145,325].map((z,i)=>({type:'witch',z,elapsed:-1,cleared:false,count:5,direction:i%2?-1:1}));
    this.vents=[];
    this.bonus={active:false,finished:false,elapsed:0,items:Array.from({length:5},(_,i)=>({type:'bonusRainbow',x:0,z:RULES.bonusStart+(i+1)*(RULES.bonusEnd-RULES.bonusStart)/6,done:false}))};
    this.objects=Array.from({length:50},(_,i)=>{
      let z=12+i*334/49;if(z>=RULES.bonusStart)z+=RULES.bonusEnd-RULES.bonusStart;
      return {type:'rainbow',z,x:Math.sin(i*.9)*1.32,done:false};
    });
    const paired=[0,2,4,10,12];
    for(let i=0;i<16;i++) {
      const object={type:i%2?'troll':'fence',weapon:i%4===1?'sword':'axe',z:(37.5+i*27.75)*.8,x:i%2?(i%3===0?0:1.12):0,done:false};
      // Leave time to recover the ground view before the next enemy encounter.
      if(object.type==='troll'&&object.z>=RULES.bonusEnd)object.z=Math.max(object.z,RULES.bonusEnd+RULES.landingEnemyGap);
      const pair=paired.indexOf(i);
      if(pair>=0){object.pair=pair+1;this.objects.push({...object,z:object.z+RULES.pairGap,pair:pair+1});}
      this.objects.push(object);
      if(object.type==='troll')this.objects.push({type:'dragon',z:object.z,x:object.x>0?object.x-1.6:object.x+1.6,done:false});
    }
    this.boss={type:'boss',weapon:'axe',x:0,z:RULES.bossZ,hp:3,maxHp:3,done:false,active:false};
    this.objects.push(this.boss);this.objects.sort((a,b)=>a.z-b.z);
    if(this.episodeId==='dino'){
      // Mechanical roles stay shared; the episode supplies dinosaur species and scenery.
      this.herds.forEach(h=>{h.type='dinosaur';h.species='stegosaurus';});
      this.witches.forEach(h=>{h.type='pterodactyl';});
      let obstacleIndex=0;
      for(const object of this.objects){
        if(object.type==='fence')object.obstacle=obstacleIndex++%2?'log':'lava';
        if(object.type==='troll')object.species='triceratops';
        if(object.type==='dragon')object.species='diplodocus';
      }
      this.boss.species='tyrannosaurus';
    }
    if(this.episodeId==='cave'){
      this.herds.forEach(herd=>{herd.type='lizard';herd.species='crystal-lizard';});
      this.witches.forEach(herd=>{herd.type='bat';});
      this.vents=[68,118].map(z=>({type:'steam',z,elapsed:-1,cleared:false,duration:4.5}));
      let obstacleIndex=0;
      for(const object of this.objects){
        if(object.type==='fence')object.obstacle=obstacleIndex++%2?'column':'chasm';
        if(object.type==='troll')object.species='stone-golem';
        if(object.type==='dragon')object.species='crystal-crab';
        if(object.type==='rainbow')object.species='crystal';
      }
      this.boss.species='obsidian-guardian';
    }
    this.rocks=[];this.rockId=0;this.bossRollClock=0;
    this.giant=this.episodeId!=='forest'?{type:this.episodeId==='cave'?'crystal-turtle':'giganotosaurus',z:GIANT.z,elapsed:-1,done:false,roared:false,lastStep:-1,...giantPose(-1)}:null;
  }
  selectEpisode(id) {
    if(!EPISODES[id]||!['intro','finished'].includes(this.mode))return false;
    if(id===this.episodeId)return true;
    this.episodeId=id;this.reset();this.onEvent({type:'episodeSelect',episodeId:id});return true;
  }
  selectHorse(id) {
    if(!HORSES.some(h=>h.id===id)||!['intro','finished'].includes(this.mode))return false;
    this.horseId=id;this.onEvent({type:'horseSelect',horseId:id});return true;
  }
  start(){this.reset();this.mode='playing';}
  pause(){if(this.mode==='playing'){this.mode='paused';this.moving=false;}}
  resume(){if(this.mode==='paused')this.mode='playing';}
  jump(){
    if(this.mode!=='playing'||this.jumpTime>=0||this.bonus.active)return false;
    this.jumpTime=0;this.onEvent({type:'jump'});return true;
  }
  shoot(){
    if(this.mode!=='playing'||this.shotCooldown>0)return false;
    this.shotCooldown=RULES.shotCooldown;
    const target=this.bonus.active?null:this.objects.filter(o=>!o.done&&['troll','dragon','boss'].includes(o.type)
      &&(o.type!=='boss'||o.active)&&o.z>=this.distance-.35&&o.z<=this.distance+RULES.shotRange
      &&Math.abs(o.x-this.x)<=(o.type==='boss'?1.9:RULES.shotHalfWidth))
      .sort((a,b)=>a.z-b.z||Math.abs(a.x-this.x)-Math.abs(b.x-this.x))[0];
    if(target){
      if(target.type==='boss'){target.hp--;target.done=target.hp===0;target.destroyed=target.done;if(target.done)target.active=false;}
      else {target.done=true;target.destroyed=true;}
    }
    this.onEvent({type:'shot',target:target||null,
      origin:{x:this.x,y:1.78+this.jumpHeight+this.flightHeight,z:this.distance},
      end:{x:target?.x??this.x,y:target?.type==='boss'?2:(target ? .95 : 1.1+this.flightHeight),z:target?.z??this.distance+RULES.shotRange}});
    return true;
  }
  updateBonus(dt){
    const bonus=this.bonus;bonus.elapsed=Math.min(RULES.bonusDuration,bonus.elapsed+dt);
    const t=bonus.elapsed/RULES.bonusDuration;
    this.distance=RULES.bonusStart+t*(RULES.bonusEnd-RULES.bonusStart);
    this.flightHeight=skyHeightAt(this.distance);this.x*=Math.exp(-dt*5);this.jumpHeight=0;this.jumpTime=-1;
    this.moving=true;this.waitingForHerd=false;this.waitingCrossing=null;this.fenceBlocked=false;
    for(const item of bonus.items)if(!item.done&&this.distance>=item.z){
      item.done=true;this.bonusCount++;this.onEvent({type:'bonusCollect',object:{...item,y:skyHeightAt(item.z)+1},count:this.bonusCount});
    }
    if(t>=1){
      bonus.active=false;bonus.finished=true;this.flightHeight=0;
      for(const object of this.objects)if(object.z>=RULES.bonusStart&&object.z<=RULES.bonusEnd)object.done=true;
      this.onEvent({type:'bonusEnd'});
    }
  }
  updateCrossings(dt,next,previous){
    for(const herd of [...this.herds,...this.witches,...this.vents]){
      if(herd.cleared)continue;
      if(herd.elapsed<0){
        if(previous>herd.z+1){herd.cleared=true;continue;}
        if(next<herd.z-RULES.herdTriggerDistance)continue;
        herd.elapsed=0;this.onEvent({type:'herdStart',herd});
      }
      herd.elapsed+=dt;
      if(herd.elapsed>=(herd.duration||RULES.herdDuration)){herd.cleared=true;this.onEvent({type:'herdEnd',herd});}
      else if(next>=herd.z-RULES.herdStopDistance){next=Math.min(next,herd.z-RULES.herdStopDistance);this.waitingForHerd=true;this.waitingCrossing=herd;}
    }
    return next;
  }
  updateRocks(dt,previous,next){
    if(this.boss.active&&!this.boss.done){
      this.bossRollClock-=dt;
      if(this.bossRollClock<=0){
        const rock={id:this.rockId++,x:this.x,z:this.boss.z-1.6,angle:0,active:true};
        this.rocks.push(rock);this.bossRollClock=RULES.rockInterval;this.onEvent({type:'rockRoll',rock});
      }
    }
    for(const rock of this.rocks){
      if(!rock.active)continue;
      const before=rock.z;rock.z-=RULES.rockSpeed*dt;rock.angle+=RULES.rockSpeed*dt/.35;
      if(before>=previous-.5&&rock.z<=next+.55&&Math.abs(rock.x-this.x)<.65&&this.jumpHeight<.6){
        rock.active=false;next=Math.max(0,Math.min(next,previous-1.2));this.stun=.7;this.onEvent({type:'rockHit',rock});
      }
      if(rock.z<next-4)rock.active=false;
    }
    this.rocks=this.rocks.filter(r=>r.active).slice(-8);return next;
  }
  updateGiant(dt,previous,next){
    const giant=this.giant;if(!giant||giant.done)return next;
    if(previous>giant.z+2){giant.done=true;Object.assign(giant,giantPose(GIANT.duration));return next;}
    if(giant.elapsed<0){if(next<giant.z-GIANT.trigger)return next;giant.elapsed=0;this.onEvent({type:'giantStart'});}
    giant.elapsed=Math.min(GIANT.duration,giant.elapsed+dt);Object.assign(giant,giantPose(giant.elapsed));
    if(giant.walking&&giant.step!==giant.lastStep){giant.lastStep=giant.step;this.onEvent({type:'giantStep',x:giant.x});}
    if(!giant.roared&&giant.elapsed>=GIANT.roarAt){giant.roared=true;this.onEvent({type:'giantRoar'});}
    if(giant.elapsed>=GIANT.duration){giant.done=true;this.onEvent({type:'giantEnd'});return next;}
    if(next>=giant.z-GIANT.stopDistance){this.waitingForHerd=true;this.waitingCrossing=giant;return Math.min(next,giant.z-GIANT.stopDistance);}
    return next;
  }
  update(dt,input){
    if(this.mode!=='playing')return;
    if(!this.boss.done&&this.distance>=RULES.bossWakeDistance&&!this.boss.active){this.boss.active=true;this.onEvent({type:'bossWake'});}
    this.shotCooldown=Math.max(0,this.shotCooldown-dt);if(input.fire)this.shoot();
    this.stun=Math.max(0,this.stun-dt);
    if(this.bonus.active){this.updateBonus(dt);return;}
    if(this.jumpTime>=0){
      this.jumpTime+=dt;this.jumpHeight=Math.sin(Math.min(1,this.jumpTime/RULES.jumpDuration)*Math.PI)*RULES.jumpHeight;
      if(this.jumpTime>=RULES.jumpDuration){this.jumpTime=-1;this.jumpHeight=0;}
    }
    const edge=RULES.halfWidth-RULES.riderRadius;
    this.x=Math.max(-edge,Math.min(edge,this.x+input.steer*RULES.steerSpeed*dt));
    const previous=this.distance;
    let next=input.forward&&!this.stun?Math.min(RULES.length,previous+RULES.speed*dt):previous;
    this.waitingForHerd=false;this.waitingCrossing=null;this.fenceBlocked=false;
    next=this.updateCrossings(dt,next,previous);
    next=this.updateGiant(dt,previous,next);
    if(!this.bonus.finished&&previous<RULES.bonusStart&&next>=RULES.bonusStart){
      this.distance=RULES.bonusStart;this.bonus.active=true;this.jumpHeight=0;this.jumpTime=-1;this.onEvent({type:'bonusStart'});this.updateBonus(0);return;
    }
    for(const fence of this.objects){
      if(fence.type!=='fence'||fence.done||fence.z<previous-.5)continue;
      if(next>=fence.z-RULES.fenceStopDistance-1e-7&&this.jumpHeight<RULES.fenceClearance){next=Math.min(next,fence.z-RULES.fenceStopDistance);this.fenceBlocked=true;}
    }
    if(!this.boss.done&&next>=this.boss.z-RULES.bossStopDistance)next=Math.min(next,this.boss.z-RULES.bossStopDistance);
    next=this.updateRocks(dt,previous,next);
    this.distance=next;this.moving=next>previous+1e-8;
    for(const object of this.objects){
      if(object.type==='boss')continue;
      if(object.type==='fence'){
        if(!object.done&&previous<=object.z+.4&&next>=object.z+.4){object.done=true;this.onEvent({type:'cleared',object});}continue;
      }
      if(object.done||object.z<previous-.45||object.z>next+.45)continue;
      const creature=object.type==='troll'||object.type==='dragon';
      if(Math.abs(object.x-this.x)>(creature ? .73 : .65))continue;
      object.done=true;
      if(object.type==='rainbow'){this.count++;this.onEvent({type:'collect',object,count:this.count});}
      else {this.stun=.75;this.onEvent({type:'bump',object});}
    }
    if(this.distance>=RULES.length&&this.boss.done){this.mode='finished';this.moving=false;this.onEvent({type:'finish',count:this.count,bonusCount:this.bonusCount});}
  }
}
