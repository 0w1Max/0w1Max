/** GitHub-совместимый векторный pixel-art: PNG используется только на этапе сборки. */
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import {WORLD} from './mission.mjs';

const WIDTH=1200, HEIGHT=430, SW=400, SH=143;
// На исходном PNG видимая поверхность грунта начинается с y=381,
// тогда как движение бойца и препятствия рассчитаны на WORLD.groundY=374.
// Меняем только дискретизацию фоновой текстуры, сохраняя коллизии.
export const CANYON_SOURCE_GROUND_Y=381;
export const CANYON_GROUND_ROW=Math.floor(WORLD.groundY*SH/HEIGHT);
let cache;

function decodePng(buffer){
  if(buffer.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')
    throw new Error('Некорректная PNG-сигнатура каньона');
  let pos=8,valid=false,palette=null,blocks=[];
  while(pos+12<=buffer.length){
    const length=buffer.readUInt32BE(pos);
    if(length>buffer.length-pos-12)throw new Error('Обрезанный чанк PNG');
    const type=buffer.toString('ascii',pos+4,pos+8);
    const c=buffer.subarray(pos+8,pos+8+length);
    if(type==='IHDR'){
      if(length!==13 ||c.readUInt32BE(0)!==WIDTH ||c.readUInt32BE(4)!==HEIGHT ||
         c[8]!==8 ||c[9]!==3 ||c[12]!==0)throw new Error('Нужен PNG 1200x430, indexed 8-bit');
      valid=true;
    }else if(type==='PLTE'){
      if(length<3||length>768||length%3)throw new Error('Недопустимая PNG-палитра');
      palette=Array.from({length:length/3},(_,i)=>'#'+c.subarray(i*3,i*3+3).toString('hex'));
    }else if(type==='IDAT')blocks.push(c);
    pos+=12+length;
    if(type==='IEND')break;
  }
  if(!valid||!palette||!blocks.length)throw new Error('PNG не содержит нужные чанки');
  const raw=inflateSync(Buffer.concat(blocks),{maxOutputLength:HEIGHT*(WIDTH+1)});
  if(raw.length!==HEIGHT*(WIDTH+1))throw new Error('Некорректный размер распакованного PNG');
  const pixels=Buffer.alloc(WIDTH*HEIGHT);
  let k=0;
  for(let y=0;y<HEIGHT;y++){
    const filter=raw[k++];
    if(filter>4)throw new Error('Неподдерживаемый PNG-фильтр');
    for(let x=0;x<WIDTH;x++){
      const v=raw[k++],i=y*WIDTH+x;
      const a=x?pixels[i-1]:0,b=y?pixels[i-WIDTH]:0,c=x&&y?pixels[i-WIDTH-1]:0;
      let predictor=0;
      if(filter===1)predictor=a;
      else if(filter===2)predictor=b;
      else if(filter===3)predictor=(a+b)>>>1;
      else if(filter===4){
        const p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);
        predictor=da<=db&&da<=dc?a:db<=dc?b:c;
      }
      const index=(v+predictor)&255;
      if(index>=palette.length)throw new Error('PNG содержит индекс вне палитры');
      pixels[i]=index;
    }
  }
  return {pixels,palette};
}
function makePaths(pixels,palette){
  const paths=Array.from({length:palette.length},()=>[]);
  for(let y=0;y<SH;y++){
    // Устраняем полоску неба между ботинками и землёй. Нижний участок
    // растягиваем на оставшуюся высоту SVG, вместо сдвига физики персонажа.
    const sy=y<CANYON_GROUND_ROW
      ? Math.min(HEIGHT-1,Math.floor((y+.5)*HEIGHT/SH))
      : Math.min(HEIGHT-1,CANYON_SOURCE_GROUND_Y+
          Math.floor((y-CANYON_GROUND_ROW+.5)*(HEIGHT-CANYON_SOURCE_GROUND_Y)/(SH-CANYON_GROUND_ROW)));
    let last=-1,from=0;
    for(let x=0;x<=SW;x++){
      const index=x===SW?-1:pixels[sy*WIDTH+Math.min(WIDTH-1,Math.floor((x+.5)*WIDTH/SW))];
      if(index!==last){
        if(last>=0){
          const w=x-from;
          paths[last].push('M'+from+' '+y+'h'+w+'v1h-'+w+'z');
        }
        from=x;last=index;
      }
    }
  }
  const art=paths.map((segments,i)=>segments.length?'<path fill="'+palette[i]+'" d="'+segments.join('')+'"/>':'').join('');
  return '<g id="desert-canyon-v3" data-location="desert" data-art-version="4.1" data-ground-baseline="'+WORLD.groundY+'" shape-rendering="crispEdges"><g transform="scale(3 '+(HEIGHT/SH)+')">'+art+'</g></g>';
}
export function desertScene(){
  if(cache)return cache;
  const png=readFileSync(new URL('../assets/desert-canyon-background.png',import.meta.url));
  if(png.length<10000||png.length>500000)throw new Error('Слишком большой или пустой PNG');
  const result=decodePng(png);
  cache=makePaths(result.pixels,result.palette);
  if(cache.includes('<image')||cache.includes('data:image')||cache.includes('http:'))
    throw new Error('Фон должен быть полностью векторным');
  return cache;
}
