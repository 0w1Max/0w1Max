/** Pixel lettering and entry timing shared by the four location-specific panels. */
const glyphs = {
  G:['01111','11000','11000','11011','11001','11001','01111'],
  A:['01110','11011','11011','11111','11011','11011','11011'],
  M:['11011','11111','11111','11011','11011','11011','11011'],
  E:['11111','11000','11000','11110','11000','11000','11111'],
  O:['01110','11011','11011','11011','11011','11011','01110'],
  V:['11011','11011','11011','11011','11011','01110','00100'],
  R:['11110','11011','11011','11110','11100','11010','11011'],
};
const fmt = n => Number(n.toFixed(6)).toString();

export function gameOverHeading(fill, shadow) {
  const title='GAME OVER', unit=4, width=(title.length*6-1)*unit;
  let path='';
  for(const [index,letter] of [...title].entries()){
    if(letter===' ')continue;
    for(const [row,pixels] of glyphs[letter].entries()){
      for(let column=0;column<5;){
        if(pixels[column]==='0'){column++;continue;}
        let end=column+1;
        while(end<5&&pixels[end]==='1')end++;
        const x=600-width/2+index*6*unit+column*unit,y=237+row*unit,w=(end-column)*unit;
        path+=`M${x} ${y}h${w}v${unit}h-${w}z`;
        column=end;
      }
    }
  }
  return `<g role="img" aria-label="GAME OVER"><title>GAME OVER</title>`+
    `<path d="${path}" fill="${shadow}" transform="translate(0 3)"/>`+
    `<path d="${path}" fill="${fill}"/></g>`;
}

export function endScreenEntry({duration,finishedAt,fadeBegin}) {
  if(![duration,finishedAt,fadeBegin].every(Number.isFinite)||duration<=0||
     finishedAt<0||fadeBegin<=finishedAt||fadeBegin>duration)
    throw new Error('Invalid end-screen animation timing');
  const enterEnd=Math.min(finishedAt+.32,fadeBegin-.005);
  if(enterEnd<=finishedAt+.01)return '';
  const pct=time=>fmt(Math.min(1,Math.max(0,time/duration)));
  return '<animateTransform attributeName="transform" type="translate" calcMode="linear" keyTimes="'+
    [0,pct(finishedAt-.001),pct(finishedAt),pct(enterEnd),1].join(';')+
    '" values="0 8;0 8;0 8;0 0;0 0" dur="'+fmt(duration)+'s" repeatCount="indefinite"/>';
}
