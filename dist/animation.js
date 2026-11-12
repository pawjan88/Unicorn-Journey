function smoothstep(low, high, value) {
  const t=Math.max(0,Math.min(1,(value-low)/(high-low)));
  return t*t*(3-2*t);
}
// The neck stays anchored. The head turns, holds the rider's gaze, then returns on landing.
export function jumpHeadPose(jumpTime, duration) {
  if(jumpTime<0||duration<=0||jumpTime>=duration)return {turn:0,frame:0};
  const progress=jumpTime/duration;
  const turn=smoothstep(.035,.28,progress)*(1-smoothstep(.70,.98,progress));
  return {turn,frame:turn<.22?0:turn<.68?1:2};
}
