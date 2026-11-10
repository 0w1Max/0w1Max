/** Volcanic Rift V2: pure SVG scene, decorative only, no colliders or external resources. */
const r=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const p=(d,c)=>`<path d="${d}" fill="${c}"/>`;
const PALETTE=Object.freeze({
  smoke:'#322235',smokeHi:'#57405a',ash:'#765467',far:'#473044',
  farLight:'#684051',basalt:'#292532',basaltHi:'#45404b',cliff:'#382c3b',
  edge:'#68515b',edgeHi:'#977077',ember:'#b53f35',magma:'#f06c2b',
  hot:'#ffad36',core:'#ffe078',ground:'#28232e',shale:'#38343f'
});
function seeded(seed){let value=(seed^0xa4530dd1)>>>0;return ()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296;};}
const a=(name,content)=>`<g id="volcano-${name}" shape-rendering="crispEdges">${content}</g>`;
function sky(){
  const C=PALETTE;
  return a('horizon',[
    r(0,211,1200,35,'#442239'),r(0,246,1200,31,'#65303c'),
    r(0,277,1200,26,'#8d3940'),r(0,303,1200,32,'#6c303e'),
    r(0,335,1200,39,'#332635'),
    r(0,319,1200,4,'#9c3835'),r(0,326,1200,3,'#ad4934'),
    r(0,333,1200,3,'#ce5430'),
    p('M0 243h46v-7h54v-8h45v-5h68v8h37v10h59v8H0z',C.smoke),
    p('M770 244h35v-7h61v-9h61v5h53v7h87v11h133v12H770z',C.smoke),
    p('M0 274h59v-6h43v-3h69v4h31v8h46v6H0z',C.ash),
    p('M952 270h48v-4h80v6h64v5h56v10H952z',C.ash)
  ].join(''));
}
function farRidges(){
  const C=PALETTE;
  return a('far-ridges',[
    p('M0 355v-45h48v-11h38v-13h33v13h21v-21h34v-16h26v17h27v10h44v12h34v-7h49v11h43v15h57v34H0z',C.far),
    p('M700 357v-31h38v-16h39v-20h27v9h36v-25h30v10h24v24h31v-17h29v-10h24v12h33v17h43v-16h31v16h41v-21h25v13h40v13h32v-9h28v28h51v43H700z',C.far),
    p('M0 350v-29h34v-11h20v9h22v-18h20v12h27v-11h24v25h40v-13h30v26h28v10z',C.farLight),
    p('M855 353v-25h28v-20h26v15h29v-18h37v18h28v-13h33v17h39v-12h37v24h53v14z',C.farLight),
    r(12,328,27,4,'#7b4b53'),r(159,330,33,4,'#78505d'),
    r(931,327,37,4,'#875061'),r(1034,324,26,4,'#8f5155')
  ].join(''));
}
function eruption(seed){
  const C=PALETTE,rand=seeded(seed+17);
  let sparks='';
  for(let i=0;i<43;i++){
    const x=596+Math.round((rand()-.5)*240/4)*4;
    const y=187+Math.floor(rand()*105/4)*4;
    const side=rand()<.23?6:rand()<.55?4:2;
    sparks+=r(x,y,side,side,i%7===0?C.core:i%3===0?C.hot:C.ember);
  }
  return a('eruption',[
    p('M553 230v-12h-18v-12h-9v-13h14v-10h22v-14h19v-9h31v-13h30v9h21v12h21v13h21v11h-12v13h-17v10h-16v11h-22v11z',C.smoke),
    p('M570 221v-13h-14v-12h15v-15h19v-9h23v-11h21v9h17v12h15v13h-16v12h-16v10z',C.smokeHi),
    p('M591 213v-11h-11v-13h17v-8h18v-11h16v13h18v12h-15v13h-15v5z',C.ash),
    r(585,207,15,5,'#76566d'),r(620,181,20,5,'#865d69'),
    p('M597 280v-21h-9v-15h6v-15h9v12h6v-20h6v19h6v-15h7v18h8v25h-9v17z',C.ember),
    p('M608 277v-28h6v-24h5v23h6v31z',C.hot),
    p('M612 266v-24h5v29z',C.core),sparks
  ].join(''));
}
function volcanoCone(){
  const C=PALETTE;
  return a('caldera',[
    p('M324 371v-14h27v-18h25v-18h24v-20h18v-19h21v-17h20v-13h19v-12h20v-9h24v-9h24v-5h62v6h20v7h21v12h24v14h20v15h23v17h22v17h18v15h21v17h25v14h27v20z',C.basalt),
    p('M352 369v-16h31v-16h31v-16h24v-18h23v-17h18v-16h22v-14h22v-10h16v-10h22v-9h32v8h-26v12h-20v12h-18v12h-20v16h-22v20h-22v19h-27v24h-34v19z',C.basaltHi),
    p('M607 227h25v11h18v13h21v17h18v15h21v18h22v17h19v23h32v29H590v-45h28v-27h19v-27h-17v-22h-13z',C.cliff),
    p('M556 227h17v5h12v-5h39v5h19v-5h21v11h-12v6h-26v-6h-44v7h-23v-7h-12z',C.basalt),
    r(575,229,57,5,C.ember),r(584,229,35,4,C.hot),r(597,229,13,3,C.core),
    r(562,222,15,5,C.edgeHi),r(639,223,17,5,C.edgeHi),
    p('M584 234h12v24h-7v17h-9v24h-11v21h-17v25h-13v28h-18v-5h12v-31h14v-24h14v-28h12v-23h11z',C.ember),
    p('M589 240h5v22h-7v20h-8v19h-10v21h-13v24h-11v22h-8v-5h5v-23h10v-24h13v-20h8v-22h8v-21h8z',C.hot),
    p('M594 234h7v15h9v20h10v14h16v18h15v19h21v21h13v31h-11v-22h-16v-23h-17v-19h-13v-20h-14v-23h-10z',C.ember),
    p('M600 235h4v20h11v18h10v17h14v21h15v18h17v16h10v24h-6v-20h-11v-18h-17v-19h-14v-19h-14v-19h-10v-20h-9z',C.hot),
    r(602,251,5,18,C.core),r(655,327,5,14,C.core),
    r(453,294,22,4,'#71606b'),r(429,322,35,4,'#62525f'),
    r(482,279,13,3,'#837080'),r(498,263,13,3,'#826975'),
    r(699,299,19,4,'#78606c'),r(731,331,24,3,'#534352'),
    p('M440 325h13v-6h9v-7h5v15h-11v8h-16z','#3b3342'),
    p('M715 317h11v-10h7v15h9v14h-13v-9h-14z','#292735')
  ].join(''));
}
function lavaFalls(){
  const C=PALETTE;
  return a('lava-waterfalls',[
    p('M31 343h139v-9h23v7h28v12h37v21H0v-19h31z',C.cliff),
    p('M783 340h84v-6h65v6h61v14h81v20H747v-18h36z',C.cliff),
    p('M158 338h32v13h7v11h14v12h-22v-10h-13v-12h-18z',C.ember),
    p('M163 338h19v13h7v11h9v12h-11v-11h-12v-11h-12z',C.magma),
    r(172,340,7,11,C.core),r(189,362,4,9,C.hot),
    p('M868 338h38v10h-7v26h-27v-21h-4z',C.ember),
    p('M875 338h25v11h-7v25h-15v-23h-3z',C.magma),
    r(884,341,9,26,C.hot),r(885,344,3,19,C.core),
    p('M82 358h110v4h28v5h27v7H45v-9h37z',C.ember),
    p('M88 360h102v3h28v6H66v-4h22z',C.magma),
    r(96,363,52,3,C.core),r(159,365,43,3,C.hot),
    p('M794 360h99v-5h64v5h36v7h47v7H762v-8h32z',C.ember),
    p('M803 362h102v-5h42v6h34v7H789v-5h14z',C.magma),
    r(806,363,52,3,C.core),r(907,365,48,3,C.hot),
    r(39,353,17,3,C.hot),r(236,361,16,3,C.ember),
    r(1017,357,17,3,C.hot),r(1061,368,27,2,C.ember)
  ].join(''));
}
function ancientRuins(seed){
  const C=PALETTE,rand=seeded(seed+77);
  const basalt='#252531',stone='#3f3742',bright='#73616b',deep='#181923';
  let chips='';
  for(let i=0;i<56;i++){
    const left=i%2===0;
    const x=(left?70:927)+Math.floor(rand()*200/4)*4;
    const y=286+Math.floor(rand()*80/4)*4;
    chips+=r(x,y,4+Math.floor(rand()*4)*4,2+Math.floor(rand()*2)*2,i%4===0?bright:stone);
  }
  const shadows=[
    p('M67 374v-72h16v-17h15v-21h17v-14h29v7h15v-15h18v16h13v22h15v19h23v75z',deep),
    p('M78 372v-66h14v-19h15v-17h31v8h16v-20h14v28h14v17h17v69z',basalt),
    p('M95 372v-59h12v-21h16v-17h13v32h16v-12h13v41h14v36z',stone),
    r(99,285,14,6,bright),r(126,271,18,5,bright),r(161,289,11,5,bright),
    r(113,313,9,23,deep),r(116,319,4,13,C.ember),r(117,321,2,7,C.hot),
    r(150,327,7,17,deep),r(152,332,3,8,C.magma),
    p('M70 355h20v-6h17v7h26v5h13v13H68z',C.cliff),
    p('M913 374v-43h21v-28h21v-20h24v-30h18v6h14v-9h23v25h19v14h20v22h18v16h33v46z',deep),
    p('M923 374v-37h18v-30h17v-18h20v-27h21v9h19v-12h14v33h17v17h26v21h17v44z',basalt),
    p('M936 374v-30h19v-23h17v-27h15v-17h11v21h15v-19h16v30h19v28h14v37z',stone),
    r(959,306,10,5,bright),r(987,279,11,5,bright),
    r(1018,301,16,5,bright),r(1054,327,10,5,bright),
    r(972,331,8,22,deep),r(975,334,3,15,C.ember),
    r(1007,317,10,22,deep),r(1010,320,4,13,C.magma),r(1011,321,2,9,C.hot),
    r(1038,345,8,14,deep),r(1040,347,3,9,C.ember),
    r(201,330,118,6,deep),r(208,333,104,3,stone),
    r(215,341,12,21,deep),r(294,340,12,22,deep),
    r(816,325,107,6,deep),r(821,328,95,3,stone),
    r(836,334,12,25,deep),r(902,333,12,26,deep)
  ];
  return a('ancient-ruins',shadows.join('')+chips);
}
function rockTextures(seed){
  const C=PALETTE,rand=seeded(seed+231);let out='';
  const clusters=[
    [366,338,118,28],[414,307,101,29],[465,277,65,28],
    [650,267,57,25],[694,296,80,34],[739,327,90,28],
    [217,344,114,25],[815,342,111,27],[20,348,85,24],[1070,345,110,24]
  ];
  for(const [bx,by,w,h] of clusters){
    for(let j=0;j<10;j++){
      const x=bx+4*Math.floor(rand()*w/4),y=by+4*Math.floor(rand()*h/4);
      const cw=4+4*Math.floor(rand()*4),ch=2+2*Math.floor(rand()*3);
      out+=r(x,y,cw,ch,j%5===0?C.edgeHi:j%3===0?C.basaltHi:C.edge);
      if(j%3===0)out+=r(x+3,y+ch,6,3,'#24232e');
    }
  }
  return a('rock-sprites',out);
}
function lavaShimmer(seed){
  const C=PALETTE,rand=seeded(seed+433);let out='';
  for(let i=0;i<62;i++){
    const left=i%2===0;
    const x=(left?68:771)+Math.floor(rand()*(left?183:276)/4)*4;
    const y=360+Math.floor(rand()*12/3)*3,w=4+4*Math.floor(rand()*4);
    out+=r(x,y,w,2+2*Math.floor(rand()*2),i%6===0?C.core:i%3===0?C.hot:C.magma);
  }
  return a('lava-embers',out);
}
function foreground(seed){
  const C=PALETTE,rand=seeded(seed+103);let detail='';
  for(let i=0;i<82;i++){
    const x=8+Math.floor(rand()*1190/4)*4,y=383+Math.floor(rand()*42/4)*4;
    const w=4+4*Math.floor(rand()*4),h=2+2*Math.floor(rand()*2);
    detail+=r(x,y,w,h,i%9===0?C.edgeHi:i%3===0?C.edge:C.shale);
  }
  const cracks=[[88,387],[273,396],[492,388],[733,398],[952,384],[1131,402]]
    .map(([x,y],i)=>'<g transform="translate('+x+' '+y+')">'+
      p('M0 0h21v4h11v-3h15v5h-9v5h-21v-4H0z',C.ember)+
      p('M4 2h13v3h15v-2h9v4h-11v3H15V5H4z',C.magma)+
      r(8,3,12,2,i%2?C.core:C.hot)+'</g>').join('');
  const edge=[
    r(0,374,1200,5,'#121b28'),r(0,379,1200,7,C.basaltHi),
    r(0,386,1200,44,C.ground),r(0,374,1200,3,'#66545d'),
    r(0,391,240,3,C.shale),r(258,392,151,3,C.shale),
    r(416,391,210,3,C.shale),r(637,393,170,3,C.shale),
    r(829,391,201,3,C.shale),r(1036,393,164,3,C.shale),
    r(0,424,1200,6,'#181821')
  ].join('');
  const rocks=[
    p('M0 374v-36h12v-11h12v-6h15v6h13v12h8v25z',C.basalt),
    p('M0 365v-25h14v-8h16v7h10v8h8v18z',C.basaltHi),
    r(15,334,12,4,C.edge),r(31,349,12,4,C.edge),
    p('M1156 374v-17h9v-16h10v-12h13v9h12v36z',C.basalt),
    p('M1167 368v-25h12v-8h11v7h10v26z',C.basaltHi),
    r(1179,341,9,4,C.edge),r(1167,357,7,5,C.edgeHi)
  ].join('');
  return a('basalt-floor',edge+detail+cracks+rocks);
}
export function volcanoScene(seed=0){
  if(!Number.isSafeInteger(seed)||seed<0)throw new Error('Некорректный seed вулкана');
  return '<g id="volcano-stage-v2" data-scene="volcano-rift" data-seed="'+seed+'" shape-rendering="crispEdges">'+
    sky()+farRidges()+eruption(seed)+volcanoCone()+lavaFalls()+ancientRuins(seed)+rockTextures(seed)+lavaShimmer(seed)+foreground(seed)+'</g>';
}
