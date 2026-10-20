/* Engagement cards on the Podcasts & YouTube page (#/podcasts), plus the site-wide ad switch.
 * Pool of 5 card types; 3 show each week (US Eastern weeks starting Monday), rotating automatically:
 *   poll    - Fan poll of the week (votes stored in D1 via /api/engage/poll, one per browser)
 *   stat    - Stat of the day, computed live from data/schedule.json + data/stats.json (nflverse). Nothing hard-coded.
 *   history - This day / this week in Steelers history, from data/engage_history.json (each fact source-checked by build_engage.py)
 *   hot     - Hot in the forum: busiest thread in the last 48 hours (/api/engage/hot)
 *   pickem  - Pick 'Em reminder with the first kickoff, from data/pickem.json + /api/play/leaderboard
 * Cards are spread evenly through the episode list (about 1/4, 1/2 and 3/4 of the way down).
 * QA only: add ?engage=poll,stat,history,hot,pickem (or ?engage=all) before the # to force cards.
 * ADS: one switch, "ads_enabled" in data/site_config.json. While false, every .ad slot stays display:none (styles.css). */
(function(){
 'use strict';
 var ET='America/New_York', EPOCH='2026-10-19';
 var ORDER=['poll','stat','history','hot','pickem'];
 var NEWSLETTER_CARD='narrow';   // 'off' | 'narrow' (only when the sidebar sign-up sits below the list, under 900px) | 'always'
 function $(id){return document.getElementById(id);}
 function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
 function u(p){return typeof window.BGD_url==='function'?window.BGD_url(p):p;}
 function getJSON(p){return fetch(u(p),{cache:'no-store',credentials:'same-origin'}).then(function(r){if(!r.ok)throw r.status;return r.json();});}
 function api(p,body){var o={method:body?'POST':'GET',credentials:'same-origin',headers:{'x-bgd':'1'}};if(body){o.headers['content-type']='application/json';o.body=JSON.stringify(body);}
  return fetch('/api/'+p,o).then(function(r){return r.json();});}
 function etDay(t){return new Date(t).toLocaleDateString('en-CA',{timeZone:ET});}
 function weekInfo(t){var d=new Date(etDay(t)+'T00:00:00Z'),mon=new Date(d-((d.getUTCDay()+6)%7)*864e5);
  return {monday:mon,idx:Math.floor((mon-Date.parse(EPOCH+'T00:00:00Z'))/(7*864e5)),day:Math.floor(d/864e5)};}
 function ord(n){var s=['th','st','nd','rd'],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0]);}
 function fmtET(iso,o){return new Date(iso).toLocaleString('en-US',Object.assign({timeZone:ET},o));}
 function md(d){return d.toISOString().slice(5,10);}

 /* ---------- which cards this week ---------- */
 function forced(){var m=/[?&]engage=([a-z,]+)/.exec(location.search);if(!m)return null;return m[1]==='all'?ORDER.slice():m[1].split(',').filter(function(k){return ORDER.indexOf(k)>=0;});}
 function weekPicks(idx){var k=((idx%5)+5)%5;return [ORDER[k],ORDER[(k+1)%5],ORDER[(k+3)%5]];}

 /* ---------- card builders: each resolves to an element, or null when it has nothing true to show ---------- */
 function card(type,kicker,inner,extra){var a=document.createElement('aside');a.className='eg eg-'+type+(extra?' '+extra:'');a.setAttribute('aria-label',kicker);
  a.innerHTML='<p class="eg-kicker">'+esc(kicker)+'</p>'+inner;return a;}

 function buildPoll(){
  return api('engage/poll').then(function(d){
   if(!d||!d.ok||!d.poll)return null;var p=d.poll,LS='bgd_poll_'+p.key,mine=d.mine;
   try{var ls=localStorage.getItem(LS);if(mine==null&&ls!=null&&ls!=='')mine=+ls;}catch(e){}
   var el=card('poll','Fan poll of the week','<h3 class="eg-q">'+esc(p.q)+'</h3><div class="eg-body"></div><p class="eg-msg fine" role="status" aria-live="polite"></p><p class="eg-foot">No account needed. One vote per device. New question every Monday.</p>');
   var body=el.querySelector('.eg-body'),msg=el.querySelector('.eg-msg');
   function results(counts,me){var tot=counts.reduce(function(a,b){return a+b;},0);
    body.innerHTML='<ul class="eg-res">'+p.choices.map(function(c,i){var pc=tot?Math.round(counts[i]*100/tot):0;
     return '<li class="'+(i===me?'me':'')+'"><span class="eg-lbl">'+esc(c)+(i===me?' <b class="eg-you">Your vote</b>':'')+'</span><span class="eg-pc">'+pc+'%</span><span class="eg-bar"><i style="width:'+pc+'%"></i></span></li>';}).join('')+'</ul><p class="eg-tot">'+tot+' vote'+(tot===1?'':'s')+' so far</p>';}
   function ballot(){body.innerHTML='<div class="eg-choices">'+p.choices.map(function(c,i){return '<button type="button" class="eg-ch" data-i="'+i+'">'+esc(c)+'</button>';}).join('')+'</div>';}
   if(mine!=null)results(d.counts,mine);else ballot();
   body.addEventListener('click',function(e){var b=e.target.closest('.eg-ch');if(!b)return;var i=+b.dataset.i;
    body.querySelectorAll('.eg-ch').forEach(function(x){x.disabled=true;});b.classList.add('on');msg.textContent='Saving your vote...';
    api('engage/poll',{key:p.key,choice:i}).then(function(r){
     if(r&&r.ok&&r.counts){try{localStorage.setItem(LS,String(r.mine));}catch(e){}msg.textContent=r.counted?'Thanks, your vote is in.':'You already voted this week.';results(r.counts,r.mine);}
     else if(r&&r.counts){msg.textContent=r.error||'';results(r.counts,null);}
     else{msg.textContent=(r&&r.error)||'That didn\'t go through. Please try again.';body.querySelectorAll('.eg-ch').forEach(function(x){x.disabled=false;});b.classList.remove('on');}
    }).catch(function(){msg.textContent='That didn\'t go through. Please try again.';body.querySelectorAll('.eg-ch').forEach(function(x){x.disabled=false;});b.classList.remove('on');});
   });
   return el;
  }).catch(function(){return null;});
 }

 function statPool(s,st){
  var out=[],done=(s&&s.games||[]).filter(function(g){return g.completed&&g.season_type==='REG'&&g.pit_score!==''&&g.opp_score!=='';});
  var n=done.length,src='<a href="#/stats">Stats page</a> · data: <a href="https://github.com/nflverse/nflverse-data" target="_blank" rel="noopener">nflverse</a>';
  if(n){
   var pf=0,pa=0,hw=0,hl=0,aw=0,al=0,best=null;
   done.forEach(function(g){var a=+g.pit_score,b=+g.opp_score;pf+=a;pa+=b;if(g.home){a>b?hw++:a<b&&hl++;}else{a>b?aw++:a<b&&al++;}if(a>b&&(!best||a-b>best.m))best={m:a-b,g:g};});
   var thru='through '+n+' game'+(n===1?'':'s');
   out.push({num:(pf/n).toFixed(1),line:'Points per game '+thru+' ('+pf+' total).',src:src});
   out.push({num:(pf-pa>0?'+':'')+(pf-pa),line:'Point differential '+thru+': '+pf+' scored, '+pa+' allowed.',src:src});
   if(hw+hl)out.push({num:hw+'-'+hl,line:'Home record this season.',src:src});
   if(aw+al)out.push({num:aw+'-'+al,line:'Road record this season.',src:src});
   if(best)out.push({num:best.g.pit_score+'-'+best.g.opp_score,line:'Biggest win so far: '+best.m+' points, '+(best.g.home?'vs ':'at ')+best.g.opponent+' ('+best.g.week+').',src:src});
  }
  ((st&&st.team)||[]).forEach(function(t){if(t.rank&&t.rank<=10&&t.value&&!/per game|scored|allowed|Touchdowns/i.test(t.label))
   out.push({num:t.value,line:t.label+(t.section==='Defense'&&!/allowed/i.test(t.label)?' by the defense':'')+' this season, '+ord(t.rank)+(t.lower_is_better?' fewest':'')+' in the NFL.',src:src});});
  var lead={'Sacks':'sacks','Tackles':'tackles','Rush Yds':'rushing yards','Rec Yds':'receiving yards','Pass TD':'touchdown passes','INT':'interceptions','PD':'passes defended'};
  Object.keys(lead).forEach(function(k){var top=null;((st&&st.players)||[]).forEach(function(p){var v=p.stats&&p.stats[k];if(!v)return;var x=parseFloat(String(v.value).replace(/,/g,''));if(!(x>0))return;if(!top||x>top.x)top={x:x,p:p,v:v,tie:false};else if(x===top.x)top.tie=true;});
   if(top&&!top.tie)out.push({num:top.v.value,line:top.p.name+' leads the team in '+lead[k]+(top.v.rank&&top.v.rank<=20?', '+ord(top.v.rank)+' in the NFL':'')+'.',src:src});});
  return out;
 }
 function buildStat(){
  return Promise.all([getJSON('data/schedule.json').catch(function(){return null;}),getJSON('data/stats.json').catch(function(){return null;})]).then(function(r){
   var pool=statPool(r[0],r[1]);if(!pool.length)return null;var w=weekInfo(Date.now()),s=pool[((w.day%pool.length)+pool.length)%pool.length];
   return card('stat','Stat of the day','<div class="eg-statrow"><div class="eg-num">'+esc(s.num)+'</div><div><p class="eg-line">'+esc(s.line)+'</p><p class="eg-src">Source: '+s.src+'</p></div></div>');
  });
 }

 function buildHistory(){
  return getJSON('data/engage_history.json').then(function(h){
   var F=(h&&h.facts)||[];if(!F.length)return null;var now=Date.now(),today=etDay(now),w=weekInfo(now),pick=null,label;
   var todays=F.filter(function(f){return f.md===today.slice(5);});
   if(todays.length){pick=todays[weekInfo(now).day%todays.length];label='On this day in '+pick.year;}
   else{var days=[];for(var i=0;i<7;i++)days.push(md(new Date(+w.monday+i*864e5)));var tdx=days.indexOf(today.slice(5));
    var wk=F.filter(function(f){return days.indexOf(f.md)>=0;}).sort(function(a,b){return Math.abs(days.indexOf(a.md)-tdx)-Math.abs(days.indexOf(b.md)-tdx);});
    if(wk.length){pick=wk[0];label='This week in '+pick.year;}}
   if(!pick)return null;
   var when=new Date(pick.year+'-'+pick.md+'T12:00:00Z').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'});
   return card('history','This day in Steelers history','<p class="eg-when">'+esc(label)+' · '+esc(when)+'</p><p class="eg-fact">'+esc(pick.text)+'</p><p class="eg-src">Source: <a href="'+esc(pick.link)+'" target="_blank" rel="noopener">'+esc(pick.source)+'</a> · <a href="#/history">More Steelers history</a></p>');
  }).catch(function(){return null;});
 }

 function buildHot(){
  return api('engage/hot').then(function(d){
   if(!d||!d.ok||!d.thread)return null;var t=d.thread;
   var sub=d.why==='hot'&&t.recent>=2?(t.recent+' new posts in the last 2 days · '+esc(t.cat)):d.why==='hot'?('Latest discussion · '+esc(t.cat)):d.why==='welcome'?'Pinned · New here? Start with this one':'Game Day · Talk about this week\'s game';
   return card('hot','Hot in the forum','<a class="eg-thread" href="#/forum/thread/'+(+t.id)+'"><b>'+esc(t.title)+'</b><span>'+sub+'</span></a><p class="eg-src"><a href="#/forum/thread/'+(+t.id)+'">Join the conversation</a> · <a href="#/forum">All forum topics</a></p>');
  }).catch(function(){return null;});
 }

 function buildPickem(){
  return getJSON('data/pickem.json').then(function(pk){
   var now=Date.now(),open=(pk&&pk.games||[]).filter(function(g){return g.state==='pre'&&Date.parse(g.date)>now;}).sort(function(a,b){return Date.parse(a.date)-Date.parse(b.date);});
   if(!open.length)return null;var first=open[0];
   var when=fmtET(first.date,{weekday:'short',month:'short',day:'numeric'})+', '+fmtET(first.date,{hour:'numeric',minute:'2-digit'})+' ET';
   var el=card('pickem','Pick \'Em','<h3 class="eg-q">Make your Week '+esc(pk.week)+' picks</h3><p class="eg-line">First kickoff: <b>'+esc(first.away.name)+' at '+esc(first.home.name)+'</b>, '+esc(when)+'. Each game locks at kickoff.</p><p class="eg-lead" hidden></p><p class="eg-src"><a class="eg-btn" href="#/play">Make your picks</a></p>');
   api('play/leaderboard').then(function(d){var L=d&&d.ok&&d.leaders||[],top=L[0];if(!top||!(top.pick_wins+top.trivia_right>0))return;
    var p=el.querySelector('.eg-lead');p.innerHTML='Leaderboard leader: <b>'+esc(top.name)+'</b> ('+(+top.pick_wins)+' correct pick'+(top.pick_wins===1?'':'s')+(top.trivia_right?', '+(+top.trivia_right)+' trivia':'')+')';p.hidden=false;}).catch(function(){});
   return el;
  }).catch(function(){return null;});
 }

 function buildNewsletter(){
  var el=card('news','The Daily Huddle','<h3 class="eg-q">Every Steelers headline in your inbox each morning. Free.</h3><form data-nl onsubmit="return BGD_sub(event,this)"><input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0"><label for="em-eg" class="sr">Email</label><input id="em-eg" type="email" placeholder="you@email.com" required><button class="btn">Sign up</button><p class="fine age13">You must be 13 or older to sign up. Emails are sent by Kit (ConvertKit) with double opt-in; unsubscribe anytime. <a href="legal/privacy.html">Privacy</a></p><p class="msg fine" role="status" aria-live="polite"></p></form>');
  var f=el.querySelector('form');f.dataset.t=String(Date.now());return el;
 }

 var BUILD={poll:buildPoll,stat:buildStat,history:buildHistory,hot:buildHot,pickem:buildPickem};

 /* ---------- placement inside #pods-full ---------- */
 var state={cards:[],ads:[],news:null,loading:null,adsOn:false};
 function adSlot(i){var d=document.createElement('div');d.className='ad ad-inline'+(state.adsOn?' ad-live':'');d.setAttribute('aria-hidden','true');d.dataset.slot='pods-'+i;return d;}
 function place(){
  var root=$('pods-full');if(!root||!state.cards.length&&!state.news)return;
  var tiles=[].slice.call(root.querySelectorAll('.pods > .pod, .pods > article'));var n=tiles.length;
  var items=state.cards.slice();
  function after(k,el){if(!el)return;if(!n){root.appendChild(el);return;}var t=tiles[Math.max(0,Math.min(n-1,k-1))];
   /* two-column grids (900px+): land after an even tile so no half-row gap is left */
   var sib=[].slice.call(t.parentNode.children).filter(function(x){return tiles.indexOf(x)>=0;}),gi=sib.indexOf(t)+1;if(gi%2===1&&sib[gi])t=sib[gi];
   t.parentNode.insertBefore(el,t.nextSibling);}
  var showNews=!!state.news&&(NEWSLETTER_CARD==='always'||matchMedia('(max-width:899px)').matches);
  var pos=items.map(function(_,i){return Math.max(1,Math.round(n*(i+1)/(items.length+1)));});
  if(showNews&&items.length===3)pos[1]=Math.round(n*0.6);   /* newsletter takes the halfway spot; the middle card moves a little lower */
  /* ads (hidden until ads_enabled): between the 2nd and 3rd card, and near the end */
  if(state.ads[0])after(Math.round(n*0.68),state.ads[0]);
  if(state.ads[1]&&n>=12)after(Math.round(n*0.9),state.ads[1]);
  if(showNews)after(Math.round(n/2),state.news);else if(state.news&&state.news.parentNode)state.news.remove();
  for(var i=items.length-1;i>=0;i--)after(pos[i],items[i]);
  if(n<3)items.forEach(function(el){root.appendChild(el);});
 }
 function load(){
  if(state.loading)return state.loading;
  var want=forced()||weekPicks(weekInfo(Date.now()).idx),rest=ORDER.filter(function(k){return want.indexOf(k)<0;}),need=forced()?want.length:3;
  state.loading=Promise.all(ORDER.map(function(k){return want.indexOf(k)>=0?BUILD[k]():Promise.resolve(undefined);})).then(function(res){
   var got={};ORDER.forEach(function(k,i){if(res[i])got[k]=res[i];});
   var list=want.filter(function(k){return got[k];});
   /* a card with nothing true to say this week is swapped for the next one in the pool */
   var chain=Promise.resolve();
   rest.forEach(function(k){chain=chain.then(function(){if(list.length>=need)return;return BUILD[k]().then(function(el){if(el){got[k]=el;list.push(k);}});});});
   return chain.then(function(){state.cards=list.map(function(k){return got[k];});window.BGD_engage={cards:list,week_index:weekInfo(Date.now()).idx};});
  }).then(function(){
   if(NEWSLETTER_CARD!=='off')state.news=buildNewsletter();
   state.ads=[adSlot(1),adSlot(2)];place();
  });
  return state.loading;
 }
 function onRoute(v){if(v!=='podcasts')return;load().then(place);}
 document.addEventListener('route',function(e){onRoute(e.detail);});
 var root=$('pods-full');
 if(root&&window.MutationObserver)new MutationObserver(function(){if(!root.querySelector('.eg')&&state.cards.length)place();}).observe(root,{childList:true});
 if(/^#\/?podcasts/.test(location.hash))onRoute('podcasts');

 /* ---------- ad switch (data/site_config.json "ads_enabled") ---------- */
 getJSON('data/site_config.json').then(function(c){if(!c||c.ads_enabled!==true)return;state.adsOn=true;
  document.querySelectorAll('.ad').forEach(function(a){a.classList.add('ad-live');});
  var src=c.ads_script_src;if(src&&/^https:\/\//.test(src)&&!document.querySelector('script[data-ads]')){var s=document.createElement('script');s.async=true;s.src=src;s.dataset.ads='1';if(c.ads_client)s.setAttribute('data-ad-client',c.ads_client);s.crossOrigin='anonymous';document.head.appendChild(s);}
 }).catch(function(){});
})();
