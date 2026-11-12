// Shared palette and sampling grid preserve the anchors of the approved poses.
export const PIXEL_PALETTE = Object.freeze([
  '#1b2038','#293451','#384b68','#52677e','#718496','#a2acac',
  '#fff7df','#fff0d0','#e8d8b0','#c7c9b1','#b89e85','#876a62',
  '#355d63','#37746b','#41967f','#73b58c','#a3d4a1','#d0e5b8',
  '#a14b3d','#cc6540','#f18b45','#ffb968','#f8d66d','#f0ad23',
  '#b45d2b','#c47c19','#e95d78','#f3a6c1','#bf6c9f','#ec9a9b',
  '#5475b1','#334b80','#28c6c2','#36d3dc','#18899e','#78bfe0',
  '#864bc2','#ce4ac9','#8732a2','#9d4dcc','#b398d9','#e2c5ef',
]);
const rgb=PIXEL_PALETTE.map(hex=>[1,3,5].map(offset=>parseInt(hex.slice(offset,offset+2),16)));
const exactColors=new Set(rgb.map(([r,g,b])=>(r<<16)|(g<<8)|b));
const lookup=new Uint8Array(4096);
for(let key=0;key<4096;key++){
  const r=(key>>8)*17,g=((key>>4)&15)*17,b=(key&15)*17;
  let best=Infinity;
  rgb.forEach((color,index)=>{const distance=2*(r-color[0])**2+3*(g-color[1])**2+(b-color[2])**2;if(distance<best){best=distance;lookup[key]=index;}});
}
export function quantizePixels(data){
  for(let i=0;i<data.length;i+=4){
    if(data[i+3]<120){data[i+3]=0;continue;}
    if(exactColors.has((data[i]<<16)|(data[i+1]<<8)|data[i+2])){data[i+3]=255;continue;}
    const key=(data[i]>>4)*256+(data[i+1]>>4)*16+(data[i+2]>>4);
    const color=rgb[lookup[key]];
    data[i]=color[0];data[i+1]=color[1];data[i+2]=color[2];data[i+3]=255;
  }
  return data;
}
export function pixelCanvas(image,maxSize=128){
  const canvas=document.createElement('canvas');
  const width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;
  const scale=maxSize/Math.max(width,height);
  canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.imageSmoothingEnabled=false;ctx.drawImage(image,0,0,canvas.width,canvas.height);
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
  quantizePixels(pixels.data);ctx.putImageData(pixels,0,0);
  return canvas;
}
const menuCache=new Map();
export function prepareMenuArt(root){
  for(const img of root.querySelectorAll?.('img')||[]){
    if(img.dataset.pixelReady)continue;
    img.dataset.pixelReady='1';const key=img.src;
    const ready=menuCache.get(key)||img.decode().then(()=>pixelCanvas(img,img.classList.contains('episode-image')?192:96).toDataURL());
    menuCache.set(key,ready);
    ready.then(url=>{if(img.isConnected)img.src=url;}).catch(()=>menuCache.delete(key));
  }
}
