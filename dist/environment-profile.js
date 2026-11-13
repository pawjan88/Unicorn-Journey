export function terrainHeightAt(x,z){
  const edge=Math.max(0,Math.min(1,(Math.abs(x)-4)/12));
  return -.07+edge*(Math.sin(x*.11+z*.015)*.20+Math.cos(x*.07-z*.02)*.13-.08);
}
export function riverMeander(x){return Math.sin(x*.09)*Math.min(3,Math.max(0,Math.abs(x)-3)*.12);}
export function riverHeightAt(x,z){return Math.max(.035,terrainHeightAt(x,z)+.10);}
