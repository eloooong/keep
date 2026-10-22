/* Keep / Less key hunting. More building.
 * Original 18-second desktop film. Deterministic 1920x1080 / 60fps timeline.
 * Actual demo screenshots stay landscape throughout; no mobile mockups.
 */
(() => {
  'use strict';
  const canvas=document.getElementById('film'), c=canvas.getContext('2d',{alpha:false});
  const W=1920,H=1080,DURATION=18,images={};
  const ink='#152238',blue='#477cf0';
  const clamp=v=>Math.max(0,Math.min(1,v));
  const ease=v=>1-Math.pow(1-clamp(v),4);
  const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
  const mix=(a,b,t)=>a+(b-a)*t;
  function box(x,y,w,h,r=20,color='#fff',shadow=false){c.save();if(shadow){c.shadowColor='#17264525';c.shadowBlur=55;c.shadowOffsetY=24;}c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();c.restore();}
  function text(s,x,y,size=28,weight=500,color=ink,align='left'){c.fillStyle=color;c.font=`${weight} ${size}px Geist,Arial,sans-serif`;c.textAlign=align;c.textBaseline='alphabetic';c.letterSpacing=size>60?`${-size*.047}px`:'0px';c.fillText(s,x,y);c.letterSpacing='0px';}
  function circle(x,y,r,color){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
  function logo(x,y,size){box(x,y,size,size,size*.22,'#fff');c.drawImage(images.logo,x,y,size,size);}
  function icon(type,x,y,size=28,color=ink){const p={key:'M14 6a5 5 0 1 1-10 0a5 5 0 0 1 10 0 M12 10l10 10 M17 15l3-3 M20 18l3-3',lock:'M7 10V7a5 5 0 0 1 10 0v3 M5 10h14v11H5Z M12 14v3',check:'M5 12l4 4L19 6',search:'M16 16l6 6 M18 10a8 8 0 1 1-16 0a8 8 0 0 1 16 0',clock:'M22 12a10 10 0 1 1-20 0a10 10 0 0 1 20 0 M12 5v7l4 3',arrow:'M4 12h16 M14 6l6 6-6 6',moon:'M19 17A9 9 0 0 1 7 5a9 9 0 1 0 12 12',sun:'M16 12a4 4 0 1 1-8 0a4 4 0 0 1 8 0 M12 1v3 M12 20v3 M1 12h3 M20 12h3 M4 4l2 2 M18 18l2 2 M4 20l2-2 M18 6l2-2'};c.save();c.translate(x,y);c.scale(size/24,size/24);c.strokeStyle=color;c.lineWidth=1.7;c.lineCap='round';c.lineJoin='round';c.stroke(new Path2D(p[type]||p.key));c.restore();}
  function pill(s,x,y,bg='#e8efff',fg=blue){c.font='550 20px Geist';const w=c.measureText(s).width+34;box(x,y,w,42,12,bg);text(s,x+17,y+28,20,550,fg);return w;}
  function enter(t,delay,fn,dx=0,dy=60){let p=ease((t-delay)/.65);if(!p)return;c.save();c.globalAlpha*=p;c.translate((1-p)*dx,(1-p)*dy);fn();c.restore();}
  function pointer(x,y,click=0){if(click){c.save();c.globalAlpha*=1-click;circle(x,y,15+50*click,'#477cf033');c.restore();}c.save();c.translate(x,y);c.fillStyle=ink;c.strokeStyle='#fff';c.lineWidth=3;c.beginPath();c.moveTo(0,0);c.lineTo(4,37);c.lineTo(14,26);c.lineTo(23,42);c.lineTo(30,38);c.lineTo(21,22);c.lineTo(35,19);c.closePath();c.fill();c.stroke();c.restore();}
  function glow(x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,color.slice(0,7)+'00');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
  function background(t,dark=0){c.fillStyle=dark?'#101724':'#fbfaf5';c.fillRect(0,0,W,H);glow(320+Math.sin(t*.3)*130,250,620,dark?'#244b743d':'#b6ddfa55');glow(1660,160+Math.sin(t*.4)*60,540,dark?'#6451a52a':'#f5d98f66');glow(1590-Math.sin(t*.25)*100,880,530,dark?'#334da644':'#edb8de66');}
  function corner(dark=false){logo(82,66,40);text('Keep',136,98,28,650,dark?'#edf3ff':ink);text('A HOME FOR YOUR API KEYS',1836,96,14,650,dark?'#708199':'#98a0ac','right');}
  function star(x,y,t,color=blue){c.save();c.translate(x,y);c.rotate(t*.15);c.fillStyle=color;c.beginPath();c.moveTo(0,-8);c.quadraticCurveTo(2,-2,8,0);c.quadraticCurveTo(2,2,0,8);c.quadraticCurveTo(-2,2,-8,0);c.quadraticCurveTo(-2,-2,0,-8);c.fill();c.restore();}
  function browser(name,x,y,w,t,rotation=0){const h=w*(850/1440)+48;const p=ease(t/.75);c.save();c.translate(x+w/2,y+h/2+45*(1-p));c.rotate(rotation*(1-p*.75));c.scale(.97+.03*p,.97+.03*p);c.translate(-w/2,-h/2);box(0,0,w,h,20,'#fff',true);c.save();c.beginPath();c.roundRect(0,0,w,h,20);c.clip();box(0,0,w,48,0,name==='dark'?'#25282d':'#edf0f5');[0,1,2].forEach(i=>circle(22+i*18,24,5,['#e4aaa7','#e3cea2','#a6cab1'][i]));box(w*.28,10,w*.44,28,7,name==='dark'?'#353940':'#fff');text('Keep / Your workspace',w/2,29,13,450,name==='dark'?'#b2bbc8':'#909bac','center');c.drawImage(images[name],0,48,w,h-48);c.restore();c.restore();return h;}
  function caption(label,first,second,x,y,t,size=86,color=ink,accent=blue){enter(t,.03,()=>text(label,x,y-75,17,650,accent),0,25);enter(t,.09,()=>text(first,x,y,size,700,color),0,45);enter(t,.16,()=>{c.font=`700 ${size}px Geist`;c.letterSpacing=`${-size*.047}px`;const w=c.measureText(second).width;c.letterSpacing='0px';box(x-6,y+size*.31,w+10,size*.64,10,accent+'20');text(second,x,y+size*1.1,size,700,color);},0,45);}
  function intro(t){
    const converge=smooth((t-1.2)/.6);
    const labels=['OpenAI Production','Stripe Secret Key','GitHub Personal Token'];
    labels.forEach((s,i)=>{const p=ease((t-i*.07)/.7);c.save();c.globalAlpha=p*(1-converge);c.translate(mix(380+i*550,960,converge),mix(765+Math.sin(i*2)*45,720,converge));c.rotate((i-1)*.06*(1-converge));box(-212,-47,424,94,19,'#fff',true);icon('key',-185,-17,30,['#6388df','#966cc6','#b08b40'][i]);text(s,-134,9,24,550);c.restore();});
    enter(t,0,()=>text('Less key hunting.',960,455,134,700,ink,'center'),0,50);
    enter(t,.18,()=>{box(491,510,938*ease((t-.2)/.55),101,18,'#dfe8ff');text('More building.',960,599,134,700,ink,'center');},0,55);
    [ [312,400],[1587,430],[1344,771],[670,279] ].forEach((p,i)=>star(p[0],p[1]+Math.sin(t*2+i)*7,t,['#75a3e1','#dba9c9','#d8b252','#9ab6ea'][i]));
  }
  function vault(t){
    caption('01 / THE WORKSPACE','One vault.','Your whole stack.',105,396,t,78);
    enter(t,.24,()=>{text('Encrypted keys. Clear categories.',109,594,25,450,'#727f90');text('Everything right where you left it.',109,634,25,450,'#727f90');});
    enter(t,.06,()=>browser('vault',756,213,1120,t,-.025),160,25);
    enter(t,.65,()=>{box(1120,870,535,86,19,'#fff',true);circle(1164,913,23,'#e8efff');icon('lock',1151,898,26,blue);text('Your keys, encrypted at rest.',1205,923,24,550);},0,30);
  }
  function find(t){
    enter(t,0,()=>{text('The right key.',96,216,89,700);text('Right now.',746,216,89,700,blue);},0,40);
    const p=smooth((t-.35)/1.8);const zoom=1+.055*p;c.save();c.translate(960,647);c.scale(zoom,zoom);c.translate(-960,-647);
    enter(t,.04,()=>browser('search',155,295,1610,t),0,70);
    // A magnified search field floats above the real desktop search result.
    enter(t,.32,()=>{box(450,331,1020,103,20,'#fff',true);icon('search',484,365,33,blue);const s='production'.slice(0,Math.floor(clamp((t-.45)/.62)*10));text(s,546,396,35,550);pill('2 matching keys',1216,362);},0,24);
    c.restore();
    const p2=ease((t-.8)/.6);if(t>.8&&t<2.4){pointer(mix(1680,1435,p2),mix(510,609,p2),t>1.5?clamp((t-1.5)/.42):0);}
    enter(t,1.5,()=>{box(1230,804,461,78,18,'#17243b',true);icon('check',1257,829,27,'#bfd3ff');text('Found. Back to the good stuff.',1302,854,21,550,'#fff');},0,25);
  }
  function sharing(t){
    enter(t,0,()=>browser('sharing',66,215,1115,t,.024),-110,20);
    caption('02 / TEAM ACCESS','Access.','On your terms.',1248,375,t,75);
    enter(t,.24,()=>{text('Invite your people.',1252,559,27,450,'#727f90');text('Choose what they can do.',1252,601,27,450,'#727f90');});
    enter(t,.35,()=>{box(917,737,870,150,24,'#fff',true);circle(975,811,31,'#e5eafd');text('T',975,823,28,650,blue,'center');text('teammate@keep.app',1030,818,29,550);pill(t>1.35?'Edit access':'View access',1572,790,t>1.35?'#e2eee5':'#e8efff',t>1.35?'#4c8665':blue);});
    if(t>.75&&t<1.8){const p=ease((t-.75)/.4);pointer(mix(1810,1650,p),mix(963,827,p),t>1.3?clamp((t-1.3)/.4):0);}
  }
  function expiry(t){
    enter(t,0,()=>{text('A heads-up.',960,262,100,700,ink,'center');box(603,300,714,89,16,'#f3e1ba');text('Before the hurry.',960,377,100,700,ink,'center');},0,40);
    c.save();c.globalAlpha=.38;enter(t,.05,()=>browser('vault',172,480,1576,t),0,90);c.restore();
    enter(t,.3,()=>{box(451,481,1018,243,26,'#fff',true);box(484,516,172,172,22,'#fbf3e1');text('EXPIRES IN',570,554,15,650,'#a38346','center');text(String(Math.round(mix(30,10,ease((t-.35)/.75)))),570,633,75,650,'#a38346','center');text('DAYS',570,663,15,650,'#a38346','center');text('Stripe Secret Key',699,565,39,650);text('Keep your next rotation on your radar.',699,617,27,450,'#7e8795');icon('clock',700,650,25,'#b79043');text('Expiry reminders, built in.',740,671,24,550,'#a38346');},0,55);
    enter(t,.95,()=>{box(784,757,352,66,33,ink,true);icon('check',810,778,24,'#bdd4ff');text('One less thing to track.',853,800,21,550,'#fff');},0,20);
  }
  function night(t){
    const p=smooth((t-.25)/.7);
    function layer(dark){background(13+t,dark);corner(dark);caption('03 / YOUR SPACE','Late-night ideas.','Same clear view.',104,390,t,77,dark?'#f1f5ff':ink,dark?'#a9bcff':blue);enter(t,.2,()=>{text('A quieter canvas for your next big thing.',109,594,24,450,dark?'#8e9bb0':'#727f90');});browser(dark?'dark':'vault',752,206,1128,t);box(110,671,174,76,38,dark?'#405478':'#dfe7f4');box(mix(117,213,p),678,64,62,31,'#fff');icon('sun',136,696,28,dark?'#99afd7':blue);icon('moon',231,695,27,dark?blue:'#93a7c9');}
    layer(false);c.save();c.beginPath();c.arc(250,710,p*2350,0,Math.PI*2);c.clip();layer(true);c.restore();
    if(t>.2&&t<1)pointer(251,729,clamp((t-.25)/.5));
  }
  function outro(t){
    const p=ease(t/.7);const y=286+(1-p)*70;
    c.save();c.translate(960,y+62);c.rotate(-.07*(1-p));c.scale(.82+.18*p,.82+.18*p);logo(-62,-62,124);c.restore();
    enter(t,.08,()=>text('Keys kept.',960,542,128,700,ink,'center'),0,45);
    enter(t,.16,()=>text('Ideas moving.',960,671,128,700,blue,'center'),0,45);
    enter(t,.35,()=>{box(795,758,330,80,40,ink,true);text('Meet Keep.',944,810,30,600,'#fff','center');icon('arrow',1062,783,28,'#fff');},0,30);
    enter(t,.48,()=>text('YOUR API KEYS. YOUR TEAM. YOUR FLOW.',960,893,18,550,'#8390a1','center'),0,15);
    [[498,356],[1469,464],[425,717],[1414,821]].forEach((v,i)=>star(v[0],v[1]+Math.sin(t*1.5+i)*7,t,['#8cacdf','#d4adc9','#d8bf86','#9ebde7'][i]));
  }
  const cuts=[0,1.9,5,7.6,10.3,12.9,15.4,18],scenes=[intro,vault,find,sharing,expiry,night,outro];
  function render(time){const t=Math.max(0,Math.min(DURATION,time));c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;background(t);corner();let n=0;while(n<6&&t>=cuts[n+1])n++;const local=t-cuts[n],length=cuts[n+1]-cuts[n];c.save();if(n!==6){const out=smooth((local-(length-.16))/.16);c.globalAlpha=1-out;c.translate(-out*60,0);}scenes[n](local);c.restore();}
  window.keepFilm={render,duration:DURATION,width:W,height:H,ready:false};
  const play=document.getElementById('play'),replay=document.getElementById('replay'),seek=document.getElementById('seek'),clock=document.getElementById('time'),sound=document.getElementById('sound'),audio=document.getElementById('audio');
  let running=false,position=0,origin=0,muted=true,frame=0;
  const capture=new URLSearchParams(location.search).has('capture');if(capture)document.body.classList.add('capture');
  function controls(){seek.value=position;clock.textContent=`0:${String(Math.floor(position)).padStart(2,'0')} / 0:18`;play.textContent=running?'Pause':'Play';play.setAttribute('aria-label',running?'Pause film':'Play film');}
  function sync(){audio.muted=muted;if(running&&!muted){audio.currentTime=Math.min(position,17.99);audio.play().catch(()=>{muted=true;sound.textContent='Sound off';sound.setAttribute('aria-pressed','false');});}else audio.pause();}
  function tick(now){if(!running)return;position=Math.min(DURATION,(now-origin)/1000);render(position);controls();if(position>=DURATION){running=false;audio.pause();controls();return;}frame=requestAnimationFrame(tick);}
  function start(){if(position>=DURATION)position=0;running=true;origin=performance.now()-position*1000;sync();controls();cancelAnimationFrame(frame);frame=requestAnimationFrame(tick);}
  function pause(){running=false;cancelAnimationFrame(frame);audio.pause();controls();}
  play.addEventListener('click',()=>running?pause():start());replay.addEventListener('click',()=>{position=0;start();});
  seek.addEventListener('input',()=>{position=Number(seek.value);origin=performance.now()-position*1000;render(position);sync();controls();});
  sound.addEventListener('click',()=>{muted=!muted;sound.textContent=muted?'Sound off':'Sound on';sound.setAttribute('aria-pressed',String(!muted));sync();});
  document.addEventListener('keydown',e=>{if(e.code==='Space'&&e.target===document.body){e.preventDefault();if(running)pause();else start();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&running)pause();});
  Promise.all(['logo','vault','search','sharing','dark','activity'].map(name=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{images[name]=img;resolve();};img.onerror=()=>reject(new Error(`Could not load ${name}`));img.src=`assets/${name}.png`;})).concat([document.fonts.load('700 100px Geist')])).then(()=>{window.keepFilm.ready=true;play.disabled=false;replay.disabled=false;seek.disabled=false;position=capture?0:1;render(position);controls();if(!capture&&!matchMedia('(prefers-reduced-motion: reduce)').matches){position=0;start();}}).catch(e=>{document.getElementById('error').hidden=false;document.getElementById('error').textContent=`Film failed to load: ${e.message}. Please reload.`;});
})();
