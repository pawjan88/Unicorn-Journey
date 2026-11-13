export const GIANT=Object.freeze({z:312,trigger:18,stopDistance:7.5,approach:4.8,depart:8.6,duration:14.2,roarAt:5.5,roarEnd:8.3,span:28,scale:3.15});
const smooth=(a,b,value)=>{const t=Math.max(0,Math.min(1,(value-a)/(b-a)));return t*t*(3-2*t);};
export function giantPose(elapsed){
  if(elapsed<0)return {phase:'waiting',visible:false,walking:false,x:-GIANT.span,look:0,jaw:0,gait:0,step:-1};
  if(elapsed<GIANT.approach)return {phase:'approach',visible:true,walking:true,x:-GIANT.span*(1-elapsed/GIANT.approach),look:0,jaw:0,gait:elapsed*5,step:Math.floor(elapsed*1.5)};
  if(elapsed<GIANT.depart)return {phase:'roar',visible:true,walking:false,x:0,look:smooth(4.8,5.4,elapsed)*(1-smooth(8.0,8.6,elapsed)),jaw:.76*smooth(5.2,5.8,elapsed)*(1-smooth(7.7,8.35,elapsed)),gait:Math.PI,step:7};
  if(elapsed<GIANT.duration){const t=elapsed-GIANT.depart;return {phase:'depart',visible:true,walking:true,x:GIANT.span*t/(GIANT.duration-GIANT.depart),look:0,jaw:0,gait:t*5+Math.PI,step:8+Math.floor(t*1.5)};}
  return {phase:'done',visible:false,walking:false,x:GIANT.span,look:0,jaw:0,gait:0,step:17};
}
