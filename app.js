const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ext='target="_blank" rel="noopener noreferrer"';
const ET={timeZone:'America/New_York'};
function ago(iso){if(!iso)return'';const m=Math.max(0,Math.round((Date.now()-new Date(iso))/60000));
 if(m<60)return m+'m ago';const h=Math.round(m/60);if(h<24)return h+'h ago';return Math.round(h/24)+'d ago';}
window.BGD_V=document.querySelector('meta[name="bgd-build"]')?.content||'';
window.BGD_url=u=>{const v=window.BGD_V;if(!v||v==='dev')return u;return u+(u.includes('?')?'&':'?')+'v='+encodeURIComponent(v);};
const getJSON=u=>fetch(BGD_url(u),{cache:'no-store'}).then(r=>{if(!r.ok)throw r.status;return r.json()});
// Reload once if a newer build is on the server (defeats stale HTML/JS caches).
(function(){const cur=window.BGD_V;if(!cur||cur==='dev')return;
 fetch(BGD_url('version.json'),{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{if(!j||!j.v)return;
  if(j.v===cur){try{localStorage.setItem('bgd_build',j.v);}catch(e){}return;}
  try{if(sessionStorage.getItem('bgd_reloaded')===j.v)return;sessionStorage.setItem('bgd_reloaded',j.v);}catch(e){}
  location.reload();}).catch(()=>{});})();
const D={};
const card=n=>`<article class="card"><p class="meta"><b>${esc(n.source)}</b> · <time datetime="${esc(n.published)}">${ago(n.published)}</time></p>
 <h3><a class="hl" href="${esc(n.link)}" ${ext}>${esc(n.title)}</a></h3>${n.summary?`<p>${esc(n.summary)}</p>`:''}<a href="${esc(n.link)}" ${ext}>Read at source →</a></article>`;
const tile=(e,kind,who,cta)=>`<article class="pod"><p class="kind">${kind}</p><p class="meta"><b>${esc(who)}</b> · ${ago(e.published)}</p><h3><a class="hl" href="${esc(e.link)}" ${ext}>${esc(e.title)}</a></h3>${e.summary?`<p>${esc(e.summary)}</p>`:''}<a href="${esc(e.link)}" ${ext}>${cta} at source →</a></article>`;
const empty=t=>`<p class="empty">${t}</p>`;


// News & Rumors filters (Rumors & Updates page)
const RUMOR=/\b(trade[sd]?|trading|sign(s|ed|ing)?|re-sign\w*|release[sd]?|cuts?|waive[sd]?|waivers?|injur(y|ies|ed)|IR|injured reserve|practice squad|rumou?rs?|contract|extension|deal|activate[sd]?|questionable|doubtful|ruled out|out for|elevat\w+|claim(ed)?|free agen\w+|roster|depth chart|suspen\w+)\b/i;
const TAGS=[['Trades',/trad(e|ing)/i],['Signings',/sign|contract|extension|deal|claim/i],['Injuries',/injur|\bIR\b|questionable|doubtful|ruled out|out for|activate/i],['Releases',/release|\bcuts?\b|waive/i],['PS moves',/practice squad|elevat/i]];
let rumorTag=null;

function renderNews(){const n=D.news;if(!n||!n.items.length)return;const items=n.items,f=items[0];
 $('featured').querySelector('.featured-body').innerHTML=`<span class="tag">Top Story</span><h1><a class="hl" href="${esc(f.link)}" ${ext}>${esc(f.title)}</a></h1>${f.summary?`<p>${esc(f.summary)}</p>`:''}<p class="meta">${esc(f.source)} · ${ago(f.published)} · <a href="${esc(f.link)}" ${ext}>Read at source →</a></p>`;
 $('cards').innerHTML=items.slice(1,17).map(card).join('');
 $('updated').textContent=`${n.count} headlines from ${n.sources.filter(s=>s.status==='ok').length} sources · updated ${ago(n.generated)}`;
 const chips=$('rumor-chips'), cards=$('rumor-cards');
 if(chips&&cards){const tdy=new Date().toLocaleDateString('en-CA',ET);const r=items.filter(i=>RUMOR.test(i.title+' '+i.summary)&&new Date(i.published).toLocaleDateString('en-CA',ET)===tdy);
  chips.innerHTML=[['All',null],...TAGS].map(([l,re])=>`<button class="chip${(rumorTag===l||(!rumorTag&&!re))?' on':''}" data-tag="${l}">${l}</button>`).join('');
  const sel=TAGS.find(t=>t[0]===rumorTag);const shown=sel?r.filter(i=>sel[1].test(i.title+' '+i.summary)):r;
  cards.innerHTML=shown.length?shown.map(card).join(''):empty('No new rumors today');}
}
function renderTicker(){const t=D.ticker;if(!t)return;const h=t.items.map(i=>`<a href="${esc(i.link)}" ${ext}><b>${i.tag}</b> · ${esc(i.title)}</a>`).join('');$('tickerMove').innerHTML=h+h;}
function renderIns(){const d=D.ins;if(!d)return;
 const cut=Date.now()-72*3600*1000;const fresh=a=>(a||[]).filter(p=>p.published&&new Date(p.published).getTime()>=cut);
 const items=fresh(d.items),all=fresh(d.all||d.items);
 const li=p=>`<li><strong>${esc(p.name)}</strong><time datetime="${esc(p.published)}">${ago(p.published).replace(' ago','')}</time><span>${esc(p.about||('Post by '+p.name))}</span><a class="via" href="${esc(p.link)}" ${ext}>View on ${esc(p.platform)} →</a></li>`;
 $('insiders').innerHTML=items.length?items.slice(0,6).map(li).join(''):'<li><span>No insider posts in the last 3 days.</span></li>';
 $('insider-full').innerHTML=all.length?all.map(p=>`<article class="card"><p class="meta"><b>${esc(p.name)}</b> · ${esc(p.handle)} · ${ago(p.published)}</p><p>${esc(p.about||('Post by '+p.name))}</p><a href="${esc(p.link)}" ${ext}>View on ${esc(p.platform)} →</a></article>`).join(''):empty('No insider posts in the last 3 days');}
function renderFilm(){
 if(D.film){const p=D.film,h=p.game?'Film Breakdown: '+p.game.label:'Film Breakdown';$('filmH').textContent=h;$('filmH2').textContent=h;
  const x=p.items.map(e=>tile(e,'🎬 Film',e.creator,'View'));$('film-list').innerHTML=x.slice(0,6).join('')||empty('No film breakdowns yet for the last game');const G=p.games||[];if(G.length){$('filmH2').textContent='Film Room: '+G.length+' games this season';
   $('film-full').innerHTML=`<nav class="filmnav" aria-label="Pick a game">${G.map(g=>`<a href="#film-${esc(g.gid)}" onclick="event.preventDefault();const d=document.getElementById('film-${esc(g.gid)}');d.open=true;d.scrollIntoView({behavior:'smooth'})">${esc(g.label)} (${g.count})</a>`).join('')}</nav>`+
   G.map((g,i)=>`<details class="filmgame" id="film-${esc(g.gid)}" ${i?'':'open'}><summary><h2>${esc(g.label)}</h2> <span class="meta">${g.count} breakdown${g.count==1?'':'s'}</span></summary><div class="pods">${g.items.map(e=>tile(e,'🎬 Film',e.creator,'View')).join('')||empty('No breakdowns found for this game')}</div></details>`).join('');}
  else $('film-full').innerHTML=x.join('')||empty('No film breakdowns yet for the last game');}
 if(D.prev){const p=D.prev,h=p.game?'Opponent Preview: '+p.game.label:'Opponent Preview';$('prevH').textContent=h;$('prevH2').textContent=h;
  const x=p.items.map(e=>tile(e,'🔎 Preview',e.creator,'View'));$('preview-list').innerHTML=x.slice(0,6).join('')||empty('No previews yet for the next game');$('preview-full').innerHTML=ctmBox(p.ctm)+(x.join('')||empty('No previews yet for the next game'));}}
function ctmBox(c){if(!c)return'';return `<article class="pod ctm"><p class="kind">🎙 Check the Mic · ${esc(c.network)}</p><h3>${esc(c.title)}</h3><p class="meta"><b>${esc(c.hosts)}</b> · ${fmt(c.published,{month:'short',day:'numeric'})}</p><p>${esc(c.summary)}</p>${c.note?`<p class="fine">${esc(c.note)}</p>`:''}${c.embed?`<div class="yt-embed"><iframe loading="lazy" src="${esc(c.embed)}" title="${esc(c.title)}" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`:''}<a href="${esc(c.link)}" ${ext}>Listen${c.segment?' (Steelers segment at '+esc(c.segment)+')':''} →</a>${c.youtube?` · <a href="${esc(c.youtube)}" ${ext}>Watch on YouTube →</a>`:''}</article>`;}
function renderPods(){const p=D.pods;if(!p)return;const cut=Date.now()-7*864e5;
 const it=(p.items||[]).filter(e=>new Date(e.published)>=cut).sort((a,b)=>b.published.localeCompare(a.published));
 const t=e=>tile(e,e.kind==='video'?'▶ YouTube':'🎙 Podcast',e.show,e.kind==='video'?'Watch':'Listen');
 $('pods').innerHTML=it.slice(0,6).map(t).join('')||empty('No new episodes this week');
 const g={};it.forEach(e=>{const k=new Date(e.published).toLocaleDateString('en-CA',ET);(g[k]=g[k]||[]).push(e)});
 const day=k=>new Date(k+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'});
 let h=Object.keys(g).sort().reverse().map(k=>`<h2 class="section-title pod-day">${day(k)} <small>${g[k].length}</small></h2><div class="pods">${g[k].map(t).join('')}</div>`).join('')||empty('No new episodes in the past 7 days');
 const ch=p.yt_channels||[];
 if(ch.length)h+=`<h2 class="section-title pod-day">Latest on YouTube</h2><p class="fine">Official YouTube players for channels whose feed didn’t load this update.</p><div class="pods">${ch.map(c=>`<article class="pod"><p class="kind">▶ YouTube</p><p class="meta"><b>${esc(c.show)}</b></p><div class="yt-embed"><iframe loading="lazy" src="${esc(c.embed)}" title="${esc(c.show)} latest videos" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe></div><a href="${esc(c.link)}" ${ext}>Watch on YouTube →</a></article>`).join('')}</div>`;
 $('pods-full').innerHTML=h;}
const fmt=(iso,o)=>new Date(iso).toLocaleString('en-US',{...ET,...o});
function renderGame(){const s=D.sched;if(!s)return;const n=s.next,l=s.last;
 const vs=g=>`${g.home?'vs':'at'} ${esc(g.opponent)}`;
 $('game-center').innerHTML=`
 <div class="gc-grid">
  ${n?`<section class="gc-next"><p class="kind">Next game · ${esc(n.week||'')}</p><h2>${vs(n)}</h2>
   <p>${fmt(n.date,{weekday:'long',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})} ET${n.tv?' · '+esc(n.tv):''}</p><p class="fine light">${esc(n.venue||'')}</p>
   <div class="countdown" id="countdown" data-t="${esc(n.date)}"></div>
   <p><a href="#/opponent">Opponent preview →</a></p></section>`:'<section class="gc-next"><h2>Season complete</h2></section>'}
  <section class="box gc-side"><p class="kind dark">Record</p><p class="big">${esc(s.record)}</p>
   ${l?`<p class="kind dark">Last game</p><p class="res ${l.result}">${l.result} ${esc(l.score)}</p><p>${vs(l)} · ${fmt(l.date,{month:'short',day:'numeric'})}</p><p><a href="#/film">Film breakdown →</a><br><a href="#/grades">Grade the players (Heat Map) →</a><br><a href="#/heatmap">Fan heat map →</a></p>`:''}</section>
 </div>
 <h2 class="section-title">${s.season} Schedule</h2>
 <div class="box sched"><table><thead><tr><th>Wk</th><th>Date</th><th>Opponent</th><th>Result / TV</th></tr></thead><tbody>
 ${s.games.map(g=>{const id=g.nflverse_id||g.id;const done=!!g.completed;const opp=done?`<a class="sched-opp" href="#/boxscore/${esc(id)}">${vs(g)}</a>`:vs(g);const res=done?`<a class="sched-res" href="#/boxscore/${esc(id)}"><b class="res ${g.result}">${g.result}</b> ${esc(g.score)}</a>`:(/T05:00/.test(g.date)?'TBD':fmt(g.date,{hour:'numeric',minute:'2-digit'}))+(g.tv?' · '+esc(g.tv):'');return`<tr class="${n&&g.date===n.date?'nextrow':''}${done?' sched-done':''}"${done?` data-box="${esc(id)}" tabindex="0" role="link" aria-label="Box score: ${vs(g).replace(/<[^>]+>/g,'')} ${g.result} ${esc(g.score)}"`:''}><td>${esc((g.week||'').replace('Week ',''))}</td><td>${fmt(g.date,{month:'short',day:'numeric'})}</td><td>${opp}</td><td>${res}</td></tr>`;}).join('')}
 </tbody></table></div>
 <p class="fine">Schedule data: nflverse (CC-BY 4.0). Tap a final to open the box score. Times US Eastern.</p>`;tick();}
function tick(){const c=$('countdown');if(!c)return;let ms=new Date(c.dataset.t)-Date.now();
 if(ms<=0){c.innerHTML='<b>Game time!</b>';return;}const d=Math.floor(ms/864e5),h=Math.floor(ms/36e5)%24,m=Math.floor(ms/6e4)%60,s=Math.floor(ms/1e3)%60;
 c.innerHTML=[[d,'days'],[h,'hrs'],[m,'min'],[s,'sec']].map(([v,l])=>`<span><b>${v}</b>${l}</span>`).join('');}
setInterval(tick,1000);
function renderFV(){const f=D.fv,el=$('featuredVideo');if(!el||!f||!f.video)return;const v=f.video;
 const lab={highlights:'Game Highlights',preview:'Game Preview',ctm:'Preview Podcast Segment'}[v.kind]||'Featured Video';
 const src=v.embed?(v.embed.includes('?')?v.embed+'&rel=0':v.embed+'?rel=0'):null;
 el.innerHTML=`<h2 id="fvH" class="section-title">Featured Video · ${lab}</h2><div class="fv-grid">${src?`<div class="fv-frame"><iframe src="${esc(src)}" title="${esc(v.title)}" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`:`<a class="fv-frame fv-out" href="${esc(v.link)}" ${ext}><span class="fv-play">▶</span><span class="fv-out-t">Watch on YouTube</span><span class="fv-out-s">${esc(v.channel)} only allows this video to play on YouTube</span></a>`}<div class="fv-body"><h3><a href="${esc(v.link)}" ${ext}>${esc(v.title)}</a></h3><p>${esc(v.caption||'')}</p>${f.fallback?`<p class="fv-note">${esc(f.fallback)}</p>`:''}<p class="meta">Official ${esc(v.channel)} YouTube channel · <a href="${esc(v.link)}" ${ext}>Watch on YouTube →</a></p></div></div>`;
 el.hidden=false;}

const SRC={news:['data/news.json',renderNews],ticker:['data/ticker.json',renderTicker],ins:['data/insiders.json',renderIns],
 prev:['data/preview.json',renderFilm],film:['data/film.json',renderFilm],pods:['data/podcasts.json',renderPods],sched:['data/schedule.json',renderGame],fv:['data/featured_video.json',renderFV]};
async function loadAll(){await Promise.all(Object.entries(SRC).map(async([k,[u,fn]])=>{try{D[k]=await getJSON(u);fn();}catch(e){}}));}
loadAll();setInterval(loadAll,5*60*1000);

// hash router
const TITLES={home:'News',podcasts:'Podcasts & YouTube',film:'Film Room',opponent:'Opponent Preview',roster:'Depth Chart & Roster',game:'Schedule',stats:'Stats',heatmap:'Player Heat Map',drafthub:'Draft',draft:'Mock Draft',college:'College Prospect Tracker',insiders:'Insiders',forum:'Forum',live:'Live Hub',injuries:'Injury Tracker',scout:'Opponent Scouting',cap:'Cap Center',rumors:'Rumors & Updates',play:"Pick'em & Trivia",history:'Steelers History',alerts:'Alerts & Email',boxscore:'Box Score'};
function route(){const parts=(location.hash.replace(/^#\/?/,'')||'home').split('?')[0].split('/');const r=parts[0];const alias={grades:'heatmap',rumormeter:'rumors',preview:'opponent'};const v=alias[r]||(TITLES[r]?r:'home');window.BGD_boxId=r==='boxscore'?decodeURIComponent(parts[1]||''):'';
 if(r==='rumormeter'){const qs=(location.hash.split('?')[1]||'');const nh='#/rumors'+(qs?('?'+qs):'?tab=meter');if(location.hash!==nh)history.replaceState(null,'',nh);}
 if(r==='preview'){if(location.hash!=='#/opponent')history.replaceState(null,'','#/opponent');}
 document.querySelectorAll('.view').forEach(e=>e.hidden=e.dataset.view!==v);
 {const ib=document.querySelector('.sidebar .insiders');if(ib)ib.style.display=v==='home'?'':'none';} {const hs=document.querySelector('[aria-labelledby="huddleSide"]');if(hs)hs.style.display=v==='alerts'?'none':'';}
 document.querySelectorAll('nav a').forEach(a=>a.dataset.route===v?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current'));document.querySelector('.more-btn')?.classList.toggle('cur',!!document.querySelector('.more a[aria-current]'));
 document.title=(v==='home'?'':TITLES[v]+' – ')+'Black & Gold Dispatch';document.body.classList.remove('nav-open');document.querySelector('.has-more')?.classList.remove('open');window.scrollTo(0,0);
 document.dispatchEvent(new CustomEvent('route',{detail:v}));
 if(r==='grades')setTimeout(()=>document.getElementById('grade-section')?.scrollIntoView({behavior:'smooth'}),150);}
addEventListener('hashchange',route);
const b=$('menuBtn');b.onclick=()=>{const o=document.body.classList.toggle('nav-open');b.setAttribute('aria-expanded',o)};
window.addEventListener('DOMContentLoaded',route);

document.addEventListener('click',e=>{const c=e.target.closest('#rumor-chips .chip');if(c){rumorTag=c.dataset.tag==='All'?null:c.dataset.tag;renderNews();return;}
 const br=e.target.closest('tr.sched-done');if(br&&!e.target.closest('a')){location.hash='#/boxscore/'+br.dataset.box;return;}});
document.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const br=e.target.closest&&e.target.closest('tr.sched-done');if(br){e.preventDefault();location.hash='#/boxscore/'+br.dataset.box;}});
document.addEventListener('click',e=>{const m=document.querySelector('.has-more');if(!m)return;const bt=e.target.closest('.more-btn');if(bt){const o=m.classList.toggle('open');bt.setAttribute('aria-expanded',o);}else if(!e.target.closest('.more'))m.classList.remove('open');});

// Per-section Schema.org JSON-LD for crawlers/agents (no visual change): loads jsonld/<route>.json into <head>.
const JL=new Set(['college','drafthub','film','game','heatmap','home','injuries','live','podcasts','opponent','rumors','roster','scout','stats']);
document.addEventListener('route',e=>{const v=e.detail==='home'?null:e.detail;let s=document.getElementById('ld-route');
 if(!v||!JL.has(v)){s&&s.remove();return;}fetch(BGD_url('jsonld/'+v+'.json'),{cache:'no-store'}).then(r=>r.ok?r.text():null).then(t=>{if(!t)return;if(!s){s=document.createElement('script');s.type='application/ld+json';s.id='ld-route';document.head.appendChild(s);}s.textContent=t;}).catch(()=>{});});
// Shared "chance available at Steelers pick" badge (estimate; data/draft/availability.json, method on the Draft tab).
window.BGD_AV=null;fetch(BGD_url('data/draft/availability.json'),{cache:'no-store'}).then(r=>r.json()).then(a=>{window.BGD_AV=a;document.dispatchEvent(new Event('bgd-avail'));}).catch(()=>{});
window.availHTML=function(name,list){const a=list||(window.BGD_AV&&window.BGD_AV.players[name]&&window.BGD_AV.players[name].picks);if(!a)return'';
 const cls=p=>p>=65?'hi':p>=35?'mid':p>=10?'lo':'none';
 return`<div class="avail" title="Estimate from our board rank vs the Steelers' projected pick. See the Draft tab for how it works."><span class="avail-lab">Chance available at Steelers pick <small>(estimate)</small></span>${a.map(x=>`<span class="avail-pill ${cls(x.pct)}">R${x.round} #${x.overall}: <b>${x.pct<1?'<1':x.pct>99?'>99':x.pct}%</b></span>`).join('')}</div>`;};

// External links: always open in a new tab so our site stays open for the reader.
// Hardens on render (MutationObserver) and again at click time for anything missed.
(function(){
 function isExt(a){
  if(!a||a.tagName!=='A')return false;
  const raw=(a.getAttribute('href')||'').trim();
  if(!raw||raw.startsWith('#')||raw.startsWith('mailto:')||raw.startsWith('tel:')||raw.startsWith('javascript:'))return false;
  try{return new URL(a.href,location.href).origin!==location.origin;}catch(e){return /^https?:\/\//i.test(raw);}
 }
 function harden(a){
  if(!isExt(a))return false;
  a.setAttribute('target','_blank');
  const rel=new Set((a.getAttribute('rel')||'').toLowerCase().split(/\s+/).filter(Boolean));
  rel.add('noopener');rel.add('noreferrer');
  a.setAttribute('rel',[...rel].join(' '));
  // Mark for the subtle ↗ CSS; skip dense UI (cards titles, buttons, frames, ticker).
  if(!a.classList.contains('ext-skip')&&!a.classList.contains('hl')&&!a.classList.contains('btn')&&!a.classList.contains('fv-out')&&!a.classList.contains('inj')&&!a.classList.contains('dp')&&!a.closest('#tickerMove,.fv-frame,.merch-grid,nav'))
   a.classList.add('ext-link');
  return true;
 }
 function scan(root){(root||document).querySelectorAll?.('a[href]')?.forEach(harden);if(root?.matches?.('a[href]'))harden(root);}
 document.addEventListener('click',e=>{const a=e.target.closest?.('a[href]');if(a)harden(a);},true);
 const mo=new MutationObserver(ms=>{for(const m of ms){m.addedNodes.forEach(n=>{if(n.nodeType===1)scan(n);});}});
 const start=()=>{scan(document);try{mo.observe(document.documentElement,{childList:true,subtree:true});}catch(e){}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
 document.addEventListener('route',()=>setTimeout(()=>scan(document),0));
 window.BGD_hardenExt=harden;window.BGD_scanExt=scan;
})();

// Rumors & Updates sub-tabs (News & Rumors | Rumor Meter)
function ruTab(k,push){document.querySelectorAll('.ru-tabs .rr-tab').forEach(b=>{const on=b.dataset.ru===k;b.classList.toggle('on',on);b.setAttribute('aria-selected',on);});
 document.querySelectorAll('.ru-pane').forEach(p=>p.hidden=p.dataset.rup!==k);
 if(push){const h='#/rumors'+(k==='news'?'':'?tab='+k);if(location.hash!==h)history.replaceState(null,'',h);}
 if(k==='meter'){try{window.BGD_renderRumors&&window.BGD_renderRumors();}catch(e){}}}
document.addEventListener('click',e=>{const b=e.target.closest('.ru-tabs .rr-tab');if(b){ruTab(b.dataset.ru,true);}});
document.addEventListener('route',e=>{if(e.detail!=='rumors')return;const m=location.hash.match(/tab=(\w+)/);ruTab(m&&['news','meter'].includes(m[1])?m[1]:'news',true);});

