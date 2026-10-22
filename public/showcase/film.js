/* Keep product film. Deterministic timeline shared by playback and MP4 export.
 * All values and website captures are from the local demo, never a live vault.
 * Premium motion: exponential entrances, controlled exits, layered parallax.
 */
(() => {
  'use strict';
  const canvas = document.getElementById('film');
  const c = canvas.getContext('2d', { alpha: false });
  const W = 1440, H = 1080, DURATION = 30;
  const ink = '#202520', gray = '#8c938c', green = '#547e5a', pale = '#edf3eb';
  const images = {};
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = v => 1 - Math.pow(1 - clamp(v), 4);
  const smooth = v => { v = clamp(v); return v * v * (3 - 2 * v); };
  const mix = (a, b, p) => a + (b - a) * p;
  function box(x, y, w, h, r = 22, color = '#fff', shadow = false) {
    c.save();
    if (shadow) { c.shadowColor = '#1828191c'; c.shadowBlur = 35; c.shadowOffsetY = 18; }
    c.fillStyle = color; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); c.restore();
  }
  function line(x, y, x2, y2, color = '#e5e9e3', width = 1.5) {
    c.strokeStyle = color; c.lineWidth = width; c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke();
  }
  function text(str, x, y, size = 24, weight = 500, color = ink, align = 'left') {
    c.fillStyle = color; c.font = `${weight} ${size}px Geist, Arial, sans-serif`; c.textAlign = align; c.textBaseline = 'alphabetic';
    c.letterSpacing = size >= 48 ? `${-size * .045}px` : '0px'; c.fillText(str, x, y); c.letterSpacing = '0px';
  }
  function pill(str, x, y, color = pale, fg = green, size = 17) {
    c.font = `550 ${size}px Geist`; const w = c.measureText(str).width + 26;
    box(x, y, w, 34, 10, color); text(str, x + 13, y + 23, size, 550, fg); return w;
  }
  function circle(x, y, r, color) { c.fillStyle = color; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
  function icon(type, x, y, size = 28, color = ink) {
    c.save(); c.translate(x, y); c.scale(size / 24, size / 24); c.strokeStyle = color; c.lineWidth = 1.7; c.lineCap = 'round'; c.lineJoin = 'round';
    const paths = {
      lock: 'M7 10V7a5 5 0 0 1 10 0v3 M5 10h14v11H5Z M12 14v3',
      check: 'M5 12l4 4L19 6', copy: 'M8 8h13v13H8Z M16 5V2H2v14h3',
      search: 'M16 16l6 6 M18 10a8 8 0 1 1-16 0a8 8 0 0 1 16 0',
      clock: 'M22 12a10 10 0 1 1-20 0a10 10 0 0 1 20 0 M12 5v7l4 3',
      arrow: 'M4 12h16 M14 6l6 6-6 6', key: 'M14 6a5 5 0 1 1-10 0a5 5 0 0 1 10 0 M12 10l10 10 M17 15l3-3 M20 18l3-3',
      sun: 'M16 12a4 4 0 1 1-8 0a4 4 0 0 1 8 0 M12 1v3 M12 20v3 M1 12h3 M20 12h3 M4 4l2 2 M18 18l2 2 M4 20l2-2 M18 6l2-2',
      moon: 'M19 17A9 9 0 0 1 7 5a9 9 0 1 0 12 12',
      share: 'M8 9l8-5 M8 15l8 5 M9 12a3 3 0 1 1-6 0a3 3 0 0 1 6 0 M22 3a3 3 0 1 1-6 0a3 3 0 0 1 6 0 M22 21a3 3 0 1 1-6 0a3 3 0 0 1 6 0',
    };
    c.stroke(new Path2D(paths[type] || paths.key)); c.restore();
  }
  function logo(x, y, size) { box(x, y, size, size, size * .22, '#fff'); c.drawImage(images.logo, x, y, size, size); }
  function cursor(x, y, click = 0) {
    if (click > 0) { c.save(); c.globalAlpha = (1 - click) * .4; circle(x + 3, y + 3, 12 + click * 34, green); c.restore(); }
    c.save(); c.translate(x, y); c.fillStyle = ink; c.strokeStyle = '#fff'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(3, 31); c.lineTo(11, 22); c.lineTo(20, 37); c.lineTo(26, 33); c.lineTo(17, 19); c.lineTo(29, 17); c.closePath(); c.fill(); c.stroke(); c.restore();
  }
  function enter(t, delay, draw, distance = 50) {
    const p = ease((t - delay) / .8); if (!p) return;
    c.save(); c.globalAlpha *= p; c.translate(0, (1 - p) * distance); draw(); c.restore();
  }
  function browser(name, t, x = -4, y = 48, w = 524, h = 984) {
    const arrival = ease(t / .95); const drift = Math.sin(t * .8) * 3;
    c.save(); c.translate(x - (1 - arrival) * 170, y + drift); c.rotate(-.012 + .012 * ease(t / 2));
    box(0, 0, w, h, 34, '#242825', true); box(7, 7, w - 14, h - 14, 28, '#fff');
    c.save(); c.beginPath(); c.roundRect(7, 7, w - 14, h - 14, 28); c.clip();
    box(7, 7, w - 14, 55, 0, '#f6f7f4');
    [0,1,2].forEach(i => circle(29 + i * 20, 34, 5, ['#d8b4aa','#dfd0a2','#aec6b0'][i]));
    box(128, 20, w - 245, 27, 7, '#ebeee9'); text('Keep / Your workspace', w / 2, 39, 13, 450, '#798078', 'center');
    const img = images[name]; const scale = (w - 14) / img.width;
    c.drawImage(img, 7, 62, w - 14, img.height * scale);
    c.restore(); c.restore();
  }
  const specs = [
    ['YOUR API-KEY VAULT', 'Every API key.', 'One safe place.', 'vault'],
    ['SEARCH & ORGANIZE', 'Find your key.', 'In a heartbeat.', 'search'],
    ['SECURE SHARING', 'Share access.', 'Stay in control.', 'sharing'],
    ['EXPIRY REMINDERS', 'Stay ahead.', 'Of expiry.', 'vault'],
    ['LIGHT & DARK', 'Your vault.', 'Your atmosphere.', 'dark'],
    ['ACTIVITY LOG', 'Every action.', 'Accounted for.', 'activity'],
  ];
  function heading(n, t) {
    const [label, first, second] = specs[n];
    enter(t, .06, () => { text(label, 584, 161, 16, 700, green); });
    enter(t, .12, () => text(first, 578, 254, 76, 680), 56);
    enter(t, .21, () => text(second, 578, 337, 76, 650, gray), 56);
  }
  function keyRow(y, name, cat, tag, delay, t, x = 628, width = 676) {
    enter(t, delay, () => {
      box(x, y, width, 104, 15, '#f5f7f3');
      box(x + 18, y + 21, 55, 55, 14, '#e6ede1'); icon('key', x + 32, y + 33, 26, green);
      text(name, x + 91, y + 39, 23, 600); text('•••• •••• ••••', x + 91, y + 76, 20, 500, '#a0a89f');
      pill(cat, x + width - 115, y + 18, '#e8ece5', '#667261', 14);
      text(tag, x + width - 23, y + 77, 14, 500, '#85907f', 'right');
    }, 25);
  }
  function vault(t) {
    box(590, 422, 742, 458, 27, '#fff', true);
    text('Your keys', 626, 476, 27, 650); pill('4 keys', 1177, 450);
    keyRow(505, 'OpenAI Production', 'AI', '#production', .4, t);
    keyRow(623, 'Stripe Secret Key', 'Payments', '#billing', .49, t);
    enter(t, .72, () => { icon('lock', 630, 793, 23, green); text('Encrypted before storage.', 668, 814, 20, 550, green); });
    enter(t, 1.25, () => { box(1050, 818, 316, 70, 18, pale, true); icon('check', 1071, 840, 23, green); text('Safely kept.', 1110, 863, 25, 600, green); });
  }
  function search(t) {
    box(590, 422, 742, 463, 27, '#fff', true);
    box(618, 452, 686, 75, 16, '#f1f4ee'); icon('search', 639, 475, 25, green);
    const query = 'production'.slice(0, Math.floor(clamp((t - .6) / 1) * 10));
    text(query || 'Search your keys', 687, 500, 27, 500, query ? ink : gray);
    if (t > .6 && t < 2) { line(690 + c.measureText(query).width, 475, 690 + c.measureText(query).width, 506, green, 2); }
    const p = smooth((t - 1.4) / .4);
    enter(t, .35, () => { pill('All categories', 620, 547, '#f2f3f0', '#6b7569'); pill('#production', 790, 547); });
    keyRow(608, 'OpenAI Production', 'AI', '#production', .5, t);
    keyRow(726, 'Stripe Secret Key', 'Payments', '#production', .58, t);
    enter(t, 1.7, () => { pill('2 matching keys', 1069, 548); });
    if (p > 0) { c.save(); c.globalAlpha = p; cursor(987, 570); c.restore(); }
  }
  function sharing(t) {
    box(590, 422, 742, 466, 27, '#fff', true);
    text('OpenAI Production', 627, 480, 29, 650); text('Share with others', 627, 524, 20, 450, gray);
    box(622, 550, 678, 70, 13, '#f4f6f2'); text('teammate@keep.app', 642, 594, 24, 500); pill('View  ⌄', 1169, 568);
    line(624, 649, 1297, 649);
    enter(t, .58, () => {
      circle(655, 704, 27, '#dce7d6'); text('T', 655, 714, 23, 650, green, 'center');
      text('teammate@keep.app', 700, 712, 22, 550); pill(t > 2.1 ? 'Edit  ⌄' : 'View  ⌄', 1144, 687);
    });
    const p = ease((t - 1.1) / .6);
    if (t > 1.1 && t < 2.5) cursor(mix(1280, 1184, p), mix(798, 714, p), t > 2 ? clamp((t - 2) / .45) : 0);
    if (t > 1.7 && t < 2.1) { box(1116, 728, 169, 97, 12, '#fff', true); text('View', 1138, 762, 19); text('Edit', 1138, 802, 19, 600, green); }
    enter(t, 2.2, () => { icon('check', 632, 812, 24, green); text('The right access. For the right people.', 671, 835, 20, 550, green); });
  }
  function expiry(t) {
    box(590, 422, 742, 454, 27, '#fff', true);
    text('A little heads-up.', 628, 483, 28, 650); text('Before your next rotation.', 628, 524, 21, 450, gray);
    enter(t, .4, () => {
      box(624, 553, 673, 164, 19, '#faf2e3'); icon('clock', 650, 581, 33, '#b58b40');
      text('Stripe Secret Key', 705, 607, 27, 600); text('Expires in 10 days', 705, 650, 23, 500, '#a57d37');
      pill('Payments', 705, 667, '#f2e6cb', '#a17f43', 14);
    });
    enter(t, .72, () => {
      box(624, 740, 673, 94, 18, '#f5f6f3'); circle(663, 787, 18, '#e4ebdd'); icon('check', 652, 775, 23, green);
      text('Expiry reminders, built in.', 704, 795, 23, 550);
    });
    const progress = ease((t - .5) / 2.7);
    box(1098, 582, 150, 9, 4, '#eadbbd'); box(1098, 582, 150 * progress, 9, 4, '#bd9a55');
  }
  function themes(t) {
    const dark = smooth((t - 1.1) / .85);
    box(590, 422, 742, 454, 27, '#fff', true);
    c.save(); c.beginPath(); c.roundRect(590, 422, 742, 454, 27); c.clip();
    box(590, 422, 742 * dark, 454, 0, '#171b18');
    const color = dark > .6 ? '#f0f4ed' : ink;
    logo(627, 456, 45); text('Your keys', 691, 488, 28, 600, color);
    for (let i = 0; i < 3; i++) {
      box(626, 538 + i * 93, 670, 76, 13, dark > .6 ? '#272e28' : '#f4f6f1');
      text(['OpenAI Production', 'Stripe Secret Key', 'GitHub Personal Token'][i], 649, 581 + i * 93, 23, 500, color);
      icon('lock', 1243, 563 + i * 93, 22, '#99ab91');
    }
    c.restore();
    box(1095, 442, 198, 60, 30, dark > .6 ? '#323d33' : '#e8ede4');
    box(mix(1101, 1198, dark), 448, 89, 48, 24, '#fff', true);
    icon('sun', 1132, 460, 25, dark > .6 ? '#9dae95' : green); icon('moon', 1228, 460, 25, dark > .6 ? green : '#9dae95');
    if (t > .6 && t < 2.1) cursor(1242, 488, t > 1.1 ? clamp((t - 1.1) / .5) : 0);
  }
  function activity(t) {
    box(590, 422, 742, 463, 27, '#fff', true);
    text('Activity log', 628, 483, 29, 650); pill('Your workspace', 1101, 457, '#f0f3ec', '#75816c', 14);
    const rows = [ ['view', 'GitHub Personal Token', 'Viewed'], ['edit', 'OpenAI Production', 'Edited'], ['copy', 'OpenAI Production', 'Copied'] ];
    rows.forEach((r, i) => enter(t, .33 + i * .13, () => {
      const y = 541 + i * 99; circle(649, y + 18, 20, pale); icon(i === 2 ? 'copy' : i === 0 ? 'clock' : 'check', 638, y + 7, 23, green);
      text(r[1], 691, y + 12, 23, 550); text('demo@keep.app', 691, y + 43, 17, 450, gray); pill(r[2], 1170, y - 6);
      if (i < 2) line(691, y + 66, 1288, y + 66);
    }, 26));
  }
  const cards = [vault, search, sharing, expiry, themes, activity];
  function scene(n, t) {
    browser(specs[n][3], t);
    heading(n, t);
    enter(t, .24, () => { c.save(); c.translate(0, Math.sin(t * 1.1) * 3); cards[n](t); c.restore(); }, 64);
    enter(t, .6, () => {
      logo(582, 957, 32); text('Keep', 629, 982, 23, 650); text('EVERY API KEY. ONE SAFE PLACE.', 1326, 979, 12, 550, '#98a096', 'right');
      for (let i = 0; i < 6; i++) box(586 + i * 35, 1007, i === n ? 23 : 8, 5, 2, i === n ? green : '#dfe5dc');
    });
  }
  function tile(x,y,w,h,t,delay,fn,bg='#f3f5f0') {
    const p=ease((t-delay)/.85); if (!p) return;
    c.save(); c.globalAlpha*=p; c.translate(x+w/2,y+h/2+(1-p)*76); c.scale(.93+.07*p,.93+.07*p); c.translate(-w/2,-h/2);
    box(0,0,w,h,23,bg); c.save(); c.beginPath(); c.roundRect(0,0,w,h,23); c.clip(); fn(w,h); c.restore(); c.restore();
  }
  function bento(t) {
    // Overlapping card entrances stay within a half-second stagger budget.
    tile(40,42,414,215,t,0,() => {
      text('Every API key.',24,45,30,650); text('One safe place.',24,79,30,600,gray);
      ['AI','Dev','Email','Payments'].forEach((a,i)=>{box(24+i*94,124,84,61,15,['#dfead5','#e0e6f5','#f6e8d4','#ebdff2'][i]);text(a,66+i*94,162,i===3?14:20,650,ink,'center');});
    });
    tile(470,42,320,215,t,.03,()=>{text('Encrypted storage',24,42,23,600);icon('lock',26,84,65,green);text('Safely',111,123,35,650);text('kept.',111,161,35,650,gray);});
    tile(806,42,255,215,t,.06,()=>{text('Stay ahead.',23,42,25,600);text('10',23,144,88,650,green);text('days to expiry',25,182,20,500,gray);});
    tile(1077,42,323,215,t,.09,()=>{text('Copy. Go. Build.',24,43,27,600);box(24,91,275,94,16,'#fff');icon('copy',46,121,32,green);text('Copied',100,143,31,600,green);});
    tile(40,273,280,505,t,.12,()=>{
      text('Your vault.',24,45,29,650);text('Your atmosphere.',24,79,25,600,gray);
      box(24,112,232,362,18,'#1d241f');logo(43,136,36);text('Your keys',43,211,22,600,'#eff3eb');
      [0,1,2].forEach(i=>{box(41,233+i*67,198,54,9,'#303a30');text(['OpenAI','Stripe','GitHub'][i],54,266+i*67,19,550,'#d9e3d2');});
    });
    tile(336,273,235,244,t,.15,()=>{text('Find it.',22,42,27,650);text('In seconds.',22,75,27,600,gray);icon('search',80,115,69,green);pill('#production',26,191);});
    tile(336,533,235,245,t,.18,()=>{text('Organized.',22,43,25,650);['#production','#billing','#personal'].forEach((a,i)=>pill(a,22,73+i*48,i===1?'#f4e9d6':pale,i===1?'#ac8a50':green));});
    tile(1003,273,397,244,t,.21,()=>{text('Every action.',24,44,28,650);text('Accounted for.',24,77,28,600,gray);['Viewed a key','Edited a key','Copied a key'].forEach((a,i)=>{circle(39,119+i*42,11,'#dce7d5');icon('check',32,112+i*42,14,green);text(a,61,126+i*42,20,500);});});
    tile(1003,533,397,245,t,.24,()=>{text('Share access.',24,45,29,650);text('Stay in control.',24,78,29,600,gray);[0,1,2].forEach(i=>{circle(55+i*61,134,26,['#d4e4ca','#d9dfef','#ebdbd2'][i]);text(['A','T','M'][i],55+i*61,143,23,650,green,'center');});pill('View',24,187);pill('Edit',113,187);icon('share',313,127,42,green);});
    tile(40,794,360,244,t,.27,()=>{text('A little heads-up.',23,45,27,650);box(23,78,314,138,16,'#f5e8cc');icon('clock',44,99,27,'#a7803d');text('Expiry reminders',44,166,25,600,'#977337');text('Before the last minute.',44,197,18,450,'#ac8a50');});
    tile(416,794,330,244,t,.30,()=>{text('Less searching.',24,45,28,650);text('More shipping.',24,80,28,600,gray);text('•••• ••••',24,156,36,600,green);pill('Ready when you are',24,184);});
    tile(762,794,304,244,t,.33,()=>{text('Your whole stack.',23,45,25,650);text('Together.',23,77,25,600,gray);['AI','Dev','Payments'].forEach((a,i)=>{box(23+i*90,124,80,85,13,['#dfead5','#e0e6f5','#f4e6d4'][i]);icon('key',47+i*90,137,28,green);text(a,63+i*90,190,a==='Payments'?12:17,550,ink,'center');});});
    tile(1082,794,318,244,t,.36,()=>{text('Made for',24,45,29,650);text('your workflow.',24,80,29,600,gray);icon('sun',32,140,44,green);icon('moon',114,140,44,green);icon('arrow',241,146,33,green);});
    tile(587,273,400,505,t,.5,()=>{
      const grad=c.createLinearGradient(0,0,400,505);grad.addColorStop(0,'#e5efdf');grad.addColorStop(.5,'#f7faf4');grad.addColorStop(1,'#dce8d4');c.fillStyle=grad;c.fillRect(0,0,400,505);
      const p=ease((t-.8)/1.15);c.save();c.translate(200,176);c.scale(.8+.2*p,.8+.2*p);logo(-63,-63,126);c.restore();
      text('Keep.',200,309,84,680,ink,'center');text('Every API key.',200,361,25,500,'#6c7d64','center');text('One safe place.',200,393,25,500,'#6c7d64','center');
      enter(t,1.6,()=>{box(76,429,248,47,24,ink);text('Keep building.',190,460,19,550,'#fff','center');icon('arrow',284,442,20,'#fff');},18);
    },'#e9f1e3');
  }
  function render(time) {
    const t=clamp(time,0,DURATION); c.setTransform(1,0,0,1,0,0);c.globalAlpha=1; c.fillStyle='#fdfefd';c.fillRect(0,0,W,H);
    // Ambient color stays below the headline and moves opposite the device.
    const g=c.createRadialGradient(920+Math.sin(t*.35)*50,710,0,920,710,620);g.addColorStop(0,'#eef3e866');g.addColorStop(1,'#ffffff00');c.fillStyle=g;c.fillRect(0,0,W,H);
    if(t>=23){bento(t-23);return;}
    const n=Math.min(5,Math.floor(t/4));const local=t-n*4;const length=n===5?3:4;
    c.save();
    const out=smooth((local-(length-.4))/.4);
    c.globalAlpha=1-out;c.translate(-out*130,-out*12);scene(n,local);c.restore();
  }
  window.keepFilm={render,duration:DURATION,ready:false};
  const play=document.getElementById('play'),replay=document.getElementById('replay'),seek=document.getElementById('seek'),clock=document.getElementById('time'),sound=document.getElementById('sound'),audio=document.getElementById('audio');
  let running=false,position=0,origin=0,muted=true,frame=0;
  const capture=new URLSearchParams(location.search).has('capture');
  if(capture)document.body.classList.add('capture');
  function updateControls(){seek.value=position;clock.textContent=`0:${String(Math.floor(position)).padStart(2,'0')} / 0:30`;play.textContent=running?'Pause':'Play';play.setAttribute('aria-label',running?'Pause film':'Play film');}
  function syncSound(){audio.muted=muted;if(running&&!muted){audio.currentTime=Math.min(position,29.99);audio.play().catch(()=>{muted=true;sound.textContent='Sound off';sound.setAttribute('aria-pressed','false');});}else audio.pause();}
  function tick(now){if(!running)return;position=Math.min(DURATION,(now-origin)/1000);render(position);updateControls();if(position>=DURATION){running=false;audio.pause();updateControls();return;}frame=requestAnimationFrame(tick);}
  function start(){if(position>=DURATION)position=0;running=true;origin=performance.now()-position*1000;syncSound();updateControls();cancelAnimationFrame(frame);frame=requestAnimationFrame(tick);}
  function pause(){running=false;cancelAnimationFrame(frame);audio.pause();updateControls();}
  play.addEventListener('click',()=>running?pause():start());
  replay.addEventListener('click',()=>{position=0;start();});
  seek.addEventListener('input',()=>{position=Number(seek.value);origin=performance.now()-position*1000;render(position);syncSound();updateControls();});
  sound.addEventListener('click',()=>{muted=!muted;sound.textContent=muted?'Sound off':'Sound on';sound.setAttribute('aria-pressed',String(!muted));syncSound();});
  document.addEventListener('keydown',e=>{if(e.code==='Space'&&e.target===document.body){e.preventDefault();if(running)pause();else start();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&running)pause();});
  Promise.all(['logo','vault','search','sharing','dark','activity'].map(name=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{images[name]=img;resolve();};img.onerror=()=>reject(new Error(`Could not load ${name}`));img.src=`assets/${name}.png`;})).concat([document.fonts.load('650 76px Geist')])).then(()=>{
    window.keepFilm.ready=true;play.disabled=false;replay.disabled=false;position=capture?0:1.5;render(position);updateControls();
    if(!capture&&!matchMedia('(prefers-reduced-motion: reduce)').matches){position=0;start();}
  }).catch(error=>{document.getElementById('error').hidden=false;document.getElementById('error').textContent=`The film could not load. ${error.message}. Reload to try again.`;play.textContent='Unavailable';});
})();
