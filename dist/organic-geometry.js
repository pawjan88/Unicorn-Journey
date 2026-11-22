import * as THREE from './vendor/three.module.js';

// Elliptical cross sections follow the nasal bridge, cheeks and muzzle.
export function horseFace(){
  return loft([
    [-.335,.07,.025,.04],[-.28,.075,.18,.235],[-.15,.07,.27,.33],
    [.01,.056,.285,.345],[.15,.018,.257,.285],[.30,-.038,.197,.216],
    [.43,-.078,.167,.166],[.52,-.104,.181,.139],[.59,-.12,.154,.108],
    [.624,-.126,.065,.052],[.63,-.126,.004,.004]
  ]);
}

function loft(sections){
  const radii=new THREE.SplineCurve(sections.map(s=>new THREE.Vector2(s[2],s[3])));
  const axis=new THREE.SplineCurve(sections.map(s=>new THREE.Vector2(s[0],s[1])));
  const p=[],idx=[],uv=[];
  for(let ring=0;ring<=32;ring++){
    const t=ring/32,r=radii.getPoint(t),center=axis.getPoint(t);
    for(let j=0;j<=32;j++){
      const angle=j*Math.PI/16;
      p.push(r.x*Math.cos(angle),center.y+r.y*Math.sin(angle),center.x);
      uv.push(j/32,t);
      if(ring&&j){const i=ring*33+j;idx.push(i-34,i-33,i,i-34,i,i-1);}
    }
  }
  return geometry(p,idx,uv);
}

function geometry(positions,indices,uv,colors){
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  if(uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  if(colors)g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  g.setIndex(indices);g.computeVertexNormals();return g;
}

// A swept lock contains several overlapping strands with tapered tips.
export function maneLock(){
  const p=[],idx=[],colors=[];
  for(let strand=0;strand<11;strand++){
    const lateral=(strand-5)/5;
    for(let row=0;row<=10;row++){
      const t=row/10,w=(.18+.82*Math.sin(Math.PI*t))*(1-t*.94);
      for(let side=0;side<6;side++){
        const angle=side*Math.PI/3,index=p.length/3;
        p.push(lateral*(.3+t*.62)+Math.sin(t*4+strand*.14)*t*.73+w*.32*Math.cos(angle),
          1-t*(1.75+.25*Math.sin(strand*2.4)), .7-1.22*t-.36*Math.sin(t*Math.PI)+lateral*lateral*.065+w*.28*Math.sin(angle));
        const shade=.60+.40*(strand%4)/3;colors.push(shade,shade,shade);
        if(row){const next=side===5?index-5:index+1;idx.push(index-6,index,next,next,next-6,index-6);}
      }
    }
  }
  return geometry(p,idx,null,colors);
}

// Crossed, curved sprays give the canopy gaps and individually lit leaf tips.
export function leafCrown(random,count=26){
  const p=[],idx=[],uv=[],colors=[];
  for(let spray=0;spray<count;spray++){
    const azimuth=spray*2.39996,y=-.88+1.76*(spray+.5)/count;
    const r=Math.sqrt(1-y*y);
    const axis=new THREE.Vector3(r*Math.cos(azimuth),y,r*Math.sin(azimuth));
    const side=new THREE.Vector3(-Math.sin(azimuth),0,Math.cos(azimuth));
    const start=p.length/3,span=.58+random()*.28;
    for(const [u,v] of [[0,0],[1,0],[1,1],[0,1]]){
      const point=axis.clone().multiplyScalar(.16+v*.94).addScaledVector(side,(2*u-1)*span);
      point.y+=.20-v*v*.21;
      p.push(point.x,point.y,point.z);uv.push(u,v);
      const shade=.7+v*.3;colors.push(shade,shade,shade);
    }
    idx.push(start,start+1,start+2,start,start+2,start+3);
  }
  return geometry(p,idx,uv,colors);
}

export function horseBody(){
  return loft([[-.80,1.14,.01,.02],[-.70,1.11,.24,.29],[-.48,1.07,.39,.46],
    [-.25,1.04,.39,.42],[.01,1.02,.37,.415],[.27,1.05,.35,.435],
    [.46,1.10,.32,.425],[.60,1.16,.235,.325],[.66,1.22,.01,.02]]);
}

export function horseLeg(hind){
  // The fetlock inclines forward and the hock bends back on the hind legs.
  const rings=[[0,.08,0],[.06,.12,0],[.20,.14,hind?.045:0],[.36,.10,.035],
    [.49,.08,hind?-.065:.01],[.55,.075,hind?-.09:.02],[.69,.046,-.045],
    [.78,.066,-.025],[.82,.057,.005],[.87,.06,.035]];
  const g=loft(rings.map(([d,r,z])=>[d,z,r,r*1.06]));
  g.rotateX(Math.PI/2);return g;
}

export function spiralHorn(){
  const g=new THREE.CylinderGeometry(.006,1,1,32,58);
  const p=g.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    const relief=.92+.08*Math.cos(Math.atan2(z,x)*2-y*Math.PI*12);
    p.setXYZ(i,x*relief,y,z*relief);
  }
  g.computeVertexNormals();return g;
}

export function contactDisc(){
  const g=new THREE.RingGeometry(.0001,1,32,10),p=g.attributes.position,c=[];
  for(let i=0;i<p.count;i++){
    const falloff=Math.max(0,1-Math.hypot(p.getX(i),p.getY(i))**2);
    c.push(1,1,1,falloff*falloff);
  }
  g.setAttribute('color',new THREE.Float32BufferAttribute(c,4));return g;
}

export function palmFrond(){
  const p=[],idx=[];
  for(let j=0;j<18;j++){
    const t=j/18,z=2.05*t,y=.30*Math.sin(t*Math.PI)-.22*t*t;
    for(const side of [-1,1]){
      const i=p.length/3,w=.1+.39*Math.sin((.08+t*.89)*Math.PI);
      p.push(0,y,z,side*w*.58,y+.025,z+.11,side*w,y-.09,z+.26,0,y,z+.095);
      idx.push(i,i+1,i+2,i,i+2,i+3);
    }
  }
  return geometry(p,idx);
}

export function spruceBoughs(){
  const p=[],idx=[];
  for(let j=0;j<20;j++){
    const a=j*2.39996,level=(j%4)/4,radius=.97-level*.53;
    const v=(angle,r,y)=>p.push(Math.cos(angle)*r,y,Math.sin(angle)*r);
    const i=p.length/3;
    v(a,.05,.5-level*.42);v(a-.33,radius*.78,-.27+level*.3);
    v(a,radius,-.50+level*.35);v(a+.32,radius*.76,-.24+level*.3);
    v(a,radius*.65,-.13+level*.35);
    idx.push(i,i+1,i+4,i+1,i+2,i+4,i+2,i+3,i+4,i+3,i,i+4);
  }
  return geometry(p,idx);
}

export function equineEar(){
  const g=loft([[0,0,.055,.043],[.065,.01,.094,.061],[.17,.017,.103,.065],
    [.28,.023,.073,.048],[.39,.035,.024,.02],[.42,.04,.003,.003]]);
  g.rotateX(-Math.PI/2);return g;
}

export function grassClump(random){
  const p=[],idx=[],colors=[];
  for(let i=0;i<32;i++){
    const x=random()-.5,z=random()-.5,a=random()*Math.PI*2;
    const w=.012+random()*.014,h=.08+random()*.19;
    const dx=Math.cos(a)*w,dz=Math.sin(a)*w,index=p.length/3;
    p.push(x-dx,0,z-dz,x+dx,0,z+dz,x+2*dz,h*.7,z-2*dx,x+4*dz,h,z-4*dx);
    idx.push(index,index+1,index+2,index,index+2,index+3);
    colors.push(.32,.40,.18,.32,.40,.18,.66,.76,.34,.90,.88,.43);
  }
  return geometry(p,idx,null,colors);
}

export function mountain(crater=false){
  const top=crater?.16:.009;
  const g=new THREE.CylinderGeometry(top,1,1,72,24,true);
  const p=g.attributes.position,tints=[],rock=new THREE.Color(0x637683),snow=new THREE.Color(0xdbe7e9);
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i),t=p.getY(i)+.5,a=Math.atan2(z,x);
    const fold=Math.sin(9*a+t*2)*.08+Math.sin(17*a-t*3)*.045+Math.cos(3*a+t)*.16;
    const relief=1+fold*(crater?1-t:1);
    p.setXYZ(i,x*relief+(crater?0:.17*t*t),t-.5+Math.sin(t*Math.PI)*fold*.23,z*relief);
    const coverage=THREE.MathUtils.smoothstep(t+fold*.75,.35,.82);
    const c=rock.clone().lerp(snow,coverage);tints.push(c.r,c.g,c.b);
  }
  g.computeVertexNormals();g.setAttribute('color',new THREE.Float32BufferAttribute(tints,3));return g;
}
