export const HORSES = Object.freeze([
  { id:'sunny', name:'Słoneczko', coat:'#fff0d0', shadow:'#c7c9b1', hooves:'#b45d2b', horn:'#f0ad23', hornShadow:'#c47c19' },
  { id:'moon', name:'Nocna Iskierka', coat:'#5475b1', shadow:'#334b80', hooves:'#28c6c2', horn:'#36d3dc', hornShadow:'#18899e' },
  { id:'rose', name:'Różana Chmurka', coat:'#f3a6c1', shadow:'#bf6c9f', hooves:'#864bc2', horn:'#ce4ac9', hornShadow:'#8732a2' },
  { id:'ice', name:'Lodowa Iskierka', coat:'#b9e7fa', shadow:'#70b4db', hooves:'#609edb', horn:'#a6f2ff', hornShadow:'#6dbedb', crystal:true },
].map(horse => Object.freeze({ ...horse, portrait:`unicorn-portrait-${horse.id}.png` })));
