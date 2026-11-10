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


/**
 * Clean 8-bit canyon composition — exactly two asymmetrical mesas, two distant
 * relief silhouettes, two small clouds, and one setting sun. Terrain y is tied
 * to WORLD.groundY. The detailed original sandstone floor is preserved by
 * decoding only the ground band from the existing local PNG at build time.
 * Exported output contains only SVG paths/rectangles, no <image> or data URIs.
 */
function rectangle(x,y,width,height,color){
  return '<rect x="'+x+'" y="'+y+'" width="'+width+'" height="'+height+'" fill="'+color+'"/>';
}
function pshape(d,color){
  return '<path fill="'+color+'" d="'+d+'"/>';
}
function noise(seed){let s=seed>>>0;return ()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);}

function sky(){
  // Broad color bands instead of a blurred backdrop. The contribution overlay
  // provides the only soft transition, above the scenery.
  const rows=[[0,100,'#172b40'],[100,157,'#253750'],[157,206,'#41435a'],
    [206,243,'#68485b'],[243,273,'#90515d'],[273,305,'#b86a62'],
    [305,336,'#d68a6d'],[336,WORLD.groundY,'#e9ad7b']];
  const bits=rows.map(([top,bottom,color])=>rectangle(0,top,WIDTH,bottom-top,color));
  bits.push(rectangle(0,231,230,3,'#795166'),rectangle(296,267,154,3,'#a85c61'),
    rectangle(725,246,188,3,'#854d60'),rectangle(1001,306,150,3,'#dc8f70'));
  return '<g id="desert-sky">'+bits.join('')+'</g>';
}

function clouds(){
  // Exactly two individually drawn wind-swept cloud silhouettes.
  return '<g id="desert-clouds">'+[
    rectangle(123,246,46,7,'#ce8373'),rectangle(109,253,92,9,'#ce8373'),
    rectangle(99,262,114,7,'#9d6071'),rectangle(151,240,28,6,'#edaa8a'),
    rectangle(131,247,65,6,'#efb695'),rectangle(608,275,36,6,'#e2a386'),
    rectangle(597,281,87,8,'#c98379'),rectangle(615,289,95,6,'#9f6672'),
    rectangle(654,270,27,6,'#efb08d')
  ].join('')+'</g>';
}
function settingSun(){
  const x=911,y=250;
  const rows=[[0,28],[6,52],[12,64],[20,72],[29,80],[38,82],
    [47,80],[56,72],[65,58],[73,42]];
  const bits=rows.map(([dy,w],i)=>rectangle(x+(82-w)/2,y+dy,w,i===0?6:9,
    i<2?'#fce8a5':i<5?'#ffd48b':i<8?'#ffbe79':'#f3a16d'));
  bits.push(rectangle(x-9,y+54,107,4,'#cf7963'),
    rectangle(x-15,y+68,119,5,'#b36c64'));
  return '<g id="canyon-setting-sun">'+bits.join('')+'</g>';
}
function distantRidges(){
  // No repeated wallpaper or false platform silhouettes.
  return '<g id="distant-ridges">'+[
    pshape('M0 369V359H55V353H91V346H135V337H171V333H225V339H258V347H300V355H350V360H400V369Z','#82606b'),
    pshape('M522 374V364H556V358H597V352H628V341H665V336H712V347H759V355H813V362H863V374Z','#805566'),
    pshape('M0 374V369H45V361H80V364H122V372H171V374Z','#6d5364'),
    pshape('M498 374V367H545V364H583V371H630V374Z','#6d5263')
  ].join('')+'</g>';
}
function mesas(){
  const r=noise(0xACE5A21);
  const rocks=[
    {id:'mesa-west',d:'M36 374V354H56V342H70V330H90V320H118V312H147V304H165V294H255V300H276V310H300V321H323V336H343V347H365V359H383V374Z',
      x:54,y:296,w:300,h:78,light:'#ad6857',shadow:'#7d4a4b',rim:'#df9166',cut:'#df8a62'},
    {id:'mesa-east',d:'M762 374V362H778V350H795V339H814V326H832V312H846V303H862V294H880V282H978V290H997V301H1022V311H1041V325H1066V338H1090V350H1118V362H1145V374Z',
      x:781,y:284,w:352,h:90,light:'#b7745b',shadow:'#875052',rim:'#ecaa73',cut:'#e79b70'}
  ];
  const out=[];
  for(const m of rocks){
    out.push('<g id="'+m.id+'">'+pshape(m.d,m.shadow));
    out.push('<clipPath id="clip-'+m.id+'">'+pshape(m.d,'#ffffff')+'</clipPath>');
    out.push('<g clip-path="url(#clip-'+m.id+')">');
    out.push(rectangle(m.x-8,m.y+14,m.w+30,6,m.light),
      rectangle(m.x+14,m.y+30,m.w+8,4,m.light),
      rectangle(m.x+5,m.y+48,m.w+16,5,m.light),
      rectangle(m.x-5,m.y+66,m.w+40,3,m.light));
    for(let k=0;k<33;k++){
      const x=m.x+Math.floor(r()*m.w/4)*4;
      const y=m.y+Math.floor(r()*m.h/4)*4;
      const len=[8,12,16,20,28,36][Math.floor(r()*6)];
      out.push(rectangle(x,y,len,k%3===0?4:3,k%4===0?m.cut:'#6c4049'));
    }
    out.push(rectangle(m.x+27,m.y+8,58,4,m.rim),
      rectangle(m.x+m.w-113,m.y+17,57,3,m.rim),
      rectangle(m.x+59,m.y+55,27,3,'#503c46'),
      rectangle(m.x+m.w-156,m.y+37,34,4,'#633e48'));
    out.push('</g></g>');
  }
  return '<g id="canyon-mesas">'+out.join('')+'</g>';
}

function makePaths(pixels,palette){
  const paths=Array.from({length:palette.length},()=>[]);
  for(let y=CANYON_GROUND_ROW;y<SH;y++){
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
  return '<g id="canyon-ground-texture" shape-rendering="crispEdges"><g transform="scale(3 '+(HEIGHT/SH)+')">'+art+'</g></g>';
}


export function desertScene(){
  if(cache)return cache;
  const png=readFileSync(new URL('../assets/desert-canyon-background.png',import.meta.url));
  if(png.length<10000||png.length>500000)throw new Error('Отсутствует исходная текстура грунта');
  const decoded=decodePng(png);
  cache='<g id="desert-canyon-v3" data-location="desert" data-art-version="5.0" data-ground-baseline="'+WORLD.groundY+'" shape-rendering="crispEdges">'
    +sky()+clouds()+settingSun()+distantRidges()+mesas()+makePaths(decoded.pixels,decoded.palette)+'</g>';
  if(/<image\b|data:image|https?:\/\//.test(cache))throw new Error('SVG каньона не должен зависеть от внешних изображений');
  return cache;
}
