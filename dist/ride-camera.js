import { RULES, skyHeightAt } from './rules.js?v=17';

export const EYE_HEIGHT=2.05;
export const FOLLOW_DISTANCE=1.7;
export function skySlopeAt(distance){
  const length=RULES.bonusEnd-RULES.bonusStart;
  const t=(distance-RULES.bonusStart)/length;
  return t>0&&t<1?RULES.bonusHeight*Math.PI/length*Math.sin(t*Math.PI*2):0;
}

// Offset the eye along the track's normal and tangent, not the world's vertical.
// A vertical offset at a point 1.7m ahead put the old eye below a steep descent.
export function riderCameraPose(distance){
  const angle=Math.atan(skySlopeAt(distance));
  return {
    y:skyHeightAt(distance)+EYE_HEIGHT*Math.cos(angle)-FOLLOW_DISTANCE*Math.sin(angle),
    z:-distance+EYE_HEIGHT*Math.sin(angle)+FOLLOW_DISTANCE*Math.cos(angle),
    pitch:angle-.055,
    trackAngle:angle,
  };
}
