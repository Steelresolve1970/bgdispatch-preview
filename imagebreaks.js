/* Image breaks on the home page: licensed photos + black-and-gold dividers built from data/schedule.json. */
(function(){
 var ET={timeZone:'America/New_York'};
 function el(id){return document.getElementById(id);}
 function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
 function vs(g){return (g.home?'vs ':'at ')+g.opponent;}
 function when(iso){var d=new Date(iso);var day=d.toLocaleDateString('en-US',Object.assign({weekday:'short',month:'short',day:'numeric'},ET));
  if(/T05:00/.test(iso))return day+' · Time TBD';return day+' · '+d.toLocaleTimeString('en-US',Object.assign({hour:'numeric',minute:'2-digit'},ET))+' ET';}
 function daysTo(iso){var ms=new Date(iso)-Date.now();if(ms<=0)return 'Game day';var d=Math.ceil(ms/864e5);return d===1?'Tomorrow':'In '+d+' days';}
 function fill(s){
  var n=s&&s.next,l=s&&s.last,a=el('ib-next'),b=el('ib-record');
  if(a){if(n){a.innerHTML='<div class="ib-stripe" aria-hidden="true"></div><p class="ib-kicker">Next up · '+esc(n.week||'')+'</p><p class="ib-line"><b>'+esc(vs(n))+'</b><span>'+esc(when(n.date))+(n.tv?' · '+esc(n.tv):'')+'</span></p><p class="ib-sub">'+esc(n.venue||'')+' <span class="ib-pill">'+esc(daysTo(n.date))+'</span> <a href="#/opponent">Opponent preview →</a></p>';a.hidden=false;}else a.hidden=true;}
  if(b){if(s&&s.record){var last=l?'<p class="ib-sub">Last time out: <b class="ib-res">'+esc(l.result)+' '+esc(l.score)+'</b> '+esc(vs(l))+' · '+esc(new Date(l.date).toLocaleDateString('en-US',Object.assign({month:'short',day:'numeric'},ET)))+'</p>':'';
   b.innerHTML='<div class="ib-num"><span>'+esc(s.record)+'</span><small>'+esc(s.season||'')+' record</small></div><div class="ib-body"><p class="ib-kicker">By the numbers</p>'+last+'<p class="ib-sub"><a href="#/game">Full schedule →</a> · <a href="#/grades">Grade the players →</a></p></div>';b.hidden=false;}else b.hidden=true;}
 }
 function load(){fetch((typeof BGD_url==='function'?BGD_url('data/schedule.json'):'data/schedule.json'),{cache:'no-store'}).then(function(r){if(!r.ok)throw r.status;return r.json();}).then(fill).catch(function(){});}
 /* Mid-news photo: re-insert after the 2nd card whenever the news grid re-renders. */
 var tpl=el('ib-midnews-tpl');
 function placeMid(){var c=el('cards');if(!c||!tpl)return;if(c.querySelector('.ib-mid'))return;var k=c.children;if(k.length<4)return;
  var f=tpl.content?tpl.content.firstElementChild.cloneNode(true):null;if(f)c.insertBefore(f,k[2]);}
 var cards=el('cards');if(cards&&window.MutationObserver)new MutationObserver(placeMid).observe(cards,{childList:true});placeMid();
 load();setInterval(load,10*60*1000);
})();

/* Weekly photo rotation: fills the 3 photo slots from assets/image-credits.json, chosen by ISO week (US Eastern).
   Slot 0 (high on the page, after the 2nd news story) is always a stadium photo. No photo repeats within a week.
   Captions are rebuilt from the same pool entry, so the credit always matches the photo shown. */
(function(){
 function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
 function isoWeekET(d){var p={};new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(d).forEach(function(x){p[x.type]=x.value;});
  var t=new Date(Date.UTC(+p.year,+p.month-1,+p.day));var dn=(t.getUTCDay()+6)%7;t.setUTCDate(t.getUTCDate()-dn+3);
  var y=t.getUTCFullYear();var f=new Date(Date.UTC(y,0,4));var w=1+Math.round(((t-f)/864e5-3+((f.getUTCDay()+6)%7))/7);return y*100+w;}
 function rng(seed){var a=seed>>>0;return function(){a=(a+0x6D2B79F5)>>>0;var t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
 function pick(pool,key){
  var st=pool.filter(function(i){return i.stadium;}),rest;var n=Math.floor(key/100)*53+key%100;
  var a=st.length?st[n%st.length]:pool[n%pool.length];
  rest=pool.filter(function(i){return i!==a;});var r=rng(key);
  for(var i=rest.length-1;i>0;i--){var j=Math.floor(r()*(i+1));var t=rest[i];rest[i]=rest[j];rest[j]=t;}
  var b=rest.filter(function(i){return !i.stadium;})[0]||rest[0];rest=rest.filter(function(i){return i!==b;});
  return [a,b,rest[0]];}
 function credit(i){var lic=String(i.license||'').split(' (')[0];
  var who='<a href="'+esc(i.source_url)+'" target="_blank" rel="noopener noreferrer">'+esc(i.author)+'</a>';
  if(i.attribution_required)return 'Photo: '+who+', <a href="'+esc(i.license_url)+'" target="_blank" rel="noopener noreferrer">'+esc(lic)+'</a>, '+(/retouch|edit/i.test(i.changes||'')?'cropped and edited':'cropped');
  return 'Photo: '+who+' ('+(/^CC0/.test(lic)?'CC0':'public domain')+')';}
 function fill(fig,i){if(!fig||!i)return;var wide=/3:1/.test(i.changes||'');fig.classList.toggle('ib-wide',wide);
  var s=fig.querySelector('source'),im=fig.querySelector('img'),cap=fig.querySelector('figcaption');
  if(s)s.setAttribute('srcset',i.file);if(im){im.setAttribute('src',i.fallback);im.setAttribute('alt',i.alt||'');im.setAttribute('height',wide?'400':'500');}
  if(cap)cap.innerHTML='<b>'+esc(i.caption||i.title)+'</b><span>'+credit(i)+' · <a href="legal/photo-credits.html">Photo credits</a></span>';
  fig.setAttribute('data-photo',(i.file||'').split('/').pop());}
 var url='assets/image-credits.json';url=(typeof BGD_url==='function')?BGD_url(url):url;
 fetch(url,{cache:'no-store'}).then(function(r){if(!r.ok)throw r.status;return r.json();}).then(function(d){
  var pool=(d.images||[]).filter(function(i){return i.file&&i.fallback;});if(pool.length<3)return;
  var key=isoWeekET(new Date()),ch=pick(pool,key);window.BGD_photoWeek={week:key,photos:ch.map(function(i){return i.file;})};
  var tpl=document.getElementById('ib-midnews-tpl');if(tpl&&tpl.content)fill(tpl.content.querySelector('figure'),ch[0]);
  document.querySelectorAll('#cards > figure.ib-mid').forEach(function(f){fill(f,ch[0]);});
  var others=document.querySelectorAll('.view[data-view=home] > figure.ib-photo');if(others[0])fill(others[0],ch[1]);if(others[1])fill(others[1],ch[2]);
 }).catch(function(){});
})();
