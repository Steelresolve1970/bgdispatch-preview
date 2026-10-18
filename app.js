const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ext='target="_blank" rel="noopener nofollow"';
const ET={timeZone:'America/New_York'};
function ago(iso){if(!iso)return'';const m=Math.max(0,Math.round((Date.now()-new Date(iso))/60000));
 if(m<60)return m+'m ago';const h=Math.round(m/60);if(h<24)return h+'h ago';return Math.round(h/24)+'d ago';}
const getJSON=u=>fetch(u,{cache:'no-store'}).then(r=>{if(!r.ok)throw r.status;return r.json()});
const D={};
const card=n=>`<article class="card"><p class="meta"><b>${esc(n.source)}</b> · <time datetime="${esc(n.published)}">${ago(n.published)}</time></p>
 <h3><a class="hl" href="${esc(n.link)}" ${ext}>${esc(n.title)}</a></h3>${n.summary?`<p>${esc(n.summary)}</p>`:''}<a href="${esc(n.link)}" ${ext}>Read at source →</a></article>`;
const tile=(e,kind,who,cta)=>`<article class="pod"><p class="kind">${kind}</p><p class="meta"><b>${esc(who)}</b> · ${ago(e.published)}</p><h3><a class="hl" href="${esc(e.link)}" ${ext}>${esc(e.title)}</a></h3>${e.summary?`<p>${esc(e.summary)}</p>`:''}<a href="${esc(e.link)}" ${ext}>${cta} at source →</a></article>`;
const empty=t=>`<p class="empty">${t}</p>`;

// Rumors & Roster keyword filter
const RUMOR=/\b(trade[sd]?|trading|sign(s|ed|ing)?|re-sign\w*|release[sd]?|cuts?|waive[sd]?|waivers?|injur(y|ies|ed)|IR|injured reserve|practice squad|rumou?rs?|contract|extension|deal|activate[sd]?|questionable|doubtful|ruled out|out for|elevat\w+|claim(ed)?|free agen\w+|roster|depth chart|suspen\w+)\b/i;
const TAGS=[['Trades',/trad(e|ing)/i],['Signings',/sign|contract|extension|deal|claim/i],['Injuries',/injur|\bIR\b|questionable|doubtful|ruled out|out for|activate/i],['Releases',/release|\bcuts?\b|waive/i],['Practice squad',/practice squad|elevat/i]];
let rumorTag=null;

function renderNews(){const n=D.news;if(!n||!n.items.length)return;const items=n.items,f=items[0];
 $('featured').querySelector('.featured-body').innerHTML=`<span class="tag">Top Story</span><h1><a class="hl" href="${esc(f.link)}" ${ext}>${esc(f.title)}</a></h1>${f.summary?`<p>${esc(f.summary)}</p>`:''}<p class="meta">${esc(f.source)} · ${ago(f.published)} · <a href="${esc(f.link)}" ${ext}>Read at source →</a></p>`;
 $('cards').innerHTML=items.slice(1,17).map(card).join('');
 $('updated').textContent=`${n.count} headlines from ${n.sources.filter(s=>s.status==='ok').length} sources · updated ${ago(n.generated)}`;
 const tdy=new Date().toLocaleDateString('en-CA',ET);const r=items.filter(i=>RUMOR.test(i.title+' '+i.summary)&&new Date(i.published).toLocaleDateString('en-CA',ET)===tdy);
 $('rumor-chips').innerHTML=[['All',null],...TAGS].map(([l,re])=>`<button class="chip${(rumorTag===l||(!rumorTag&&!re))?' on':''}" data-tag="${l}">${l}</button>`).join('');
 const sel=TAGS.find(t=>t[0]===rumorTag);const shown=sel?r.filter(i=>sel[1].test(i.title+' '+i.summary)):r;
 $('rumor-cards').innerHTML=shown.length?shown.map(card).join(''):empty('No new rumors today');}
function renderTicker(){const t=D.ticker;if(!t)return;const h=t.items.map(i=>`<a href="${esc(i.link)}" ${ext}><b>${i.tag}</b> · ${esc(i.title)}</a>`).join('');$('tickerMove').innerHTML=h+h;}
function renderIns(){const d=D.ins;if(!d)return;
 const cut=Date.now()-72*3600*1000;const fresh=a=>(a||[]).filter(p=>p.published&&new Date(p.published).getTime()>=cut);
 const items=fresh(d.items),all=fresh(d.all||d.items);
 const li=p=>`<li><strong>${esc(p.name)}</strong><time datetime="${esc(p.published)}">${ago(p.published).replace(' ago','')}</time><span>${esc(p.about||('Post by '+p.name))}</span><a class="via" href="${esc(p.link)}" ${ext}>View on ${esc(p.platform)} →</a></li>`;
 $('insiders').innerHTML=items.length?items.slice(0,6).map(li).join(''):'<li><span>No insider posts in the last 3 days.</span></li>';
 $('insider-full').innerHTML=all.length?all.map(p=>`<article class="card"><p class="meta"><b>${esc(p.name)}</b> · ${esc(p.handle)} · ${ago(p.published)}</p><p>${esc(p.about||('Post by '+p.name))}</p><a href="${esc(p.link)}" ${ext}>View on ${esc(p.platform)} →</a></article>`).join(''):empty('No insider posts in the last 3 days');}
function renderFilm(){
 if(D.film){const p=D.film,h=p.game?'Film Breakdown: '+p.game.label:'Film Breakdown';$('filmH').textContent=h;$('filmH2').textContent=h;
  const x=p.items.map(e=>tile(e,'🎬 Film',e.creator,'View'));$('film-list').innerHTML=x.slice(0,6).join('')||empty('No film breakdowns yet for the last game');$('film-full').innerHTML=x.join('')||empty('No film breakdowns yet for the last game');}
 if(D.prev){const p=D.prev,h=p.game?'Film Preview: '+p.game.label:'Film Preview';$('prevH').textContent=h;$('prevH2').textContent=h;
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
   <p><a href="#/preview">Film preview →</a></p></section>`:'<section class="gc-next"><h2>Season complete</h2></section>'}
  <section class="box gc-side"><p class="kind dark">Record</p><p class="big">${esc(s.record)}</p>
   ${l?`<p class="kind dark">Last game</p><p class="res ${l.result}">${l.result} ${esc(l.score)}</p><p>${vs(l)} · ${fmt(l.date,{month:'short',day:'numeric'})}</p><p><a href="#/film">Film breakdown →</a><br><a href="#/grades">Grade the players (Heat Map) →</a><br><a href="#/heatmap">Fan heat map →</a></p>`:''}</section>
 </div>
 <h2 class="section-title">${s.season} Schedule</h2>
 <div class="box sched"><table><thead><tr><th>Wk</th><th>Date</th><th>Opponent</th><th>Result / TV</th></tr></thead><tbody>
 ${s.games.map(g=>`<tr class="${n&&g.date===n.date?'nextrow':''}"><td>${esc((g.week||'').replace('Week ',''))}</td><td>${fmt(g.date,{month:'short',day:'numeric'})}</td><td>${vs(g)}</td><td>${g.completed?`<b class="res ${g.result}">${g.result}</b> ${esc(g.score)}`:(/T05:00/.test(g.date)?'TBD':fmt(g.date,{hour:'numeric',minute:'2-digit'}))+(g.tv?' · '+esc(g.tv):'')}</td></tr>`).join('')}
 </tbody></table></div>
 <p class="fine">Schedule data: nflverse (CC-BY 4.0). Times US Eastern.</p>`;tick();}
function tick(){const c=$('countdown');if(!c)return;let ms=new Date(c.dataset.t)-Date.now();
 if(ms<=0){c.innerHTML='<b>Game time!</b>';return;}const d=Math.floor(ms/864e5),h=Math.floor(ms/36e5)%24,m=Math.floor(ms/6e4)%60,s=Math.floor(ms/1e3)%60;
 c.innerHTML=[[d,'days'],[h,'hrs'],[m,'min'],[s,'sec']].map(([v,l])=>`<span><b>${v}</b>${l}</span>`).join('');}
setInterval(tick,1000);

const SRC={news:['data/news.json',renderNews],ticker:['data/ticker.json',renderTicker],ins:['data/insiders.json',renderIns],
 prev:['data/preview.json',renderFilm],film:['data/film.json',renderFilm],pods:['data/podcasts.json',renderPods],sched:['data/schedule.json',renderGame]};
async function loadAll(){await Promise.all(Object.entries(SRC).map(async([k,[u,fn]])=>{try{D[k]=await getJSON(u);fn();}catch(e){}}));}
loadAll();setInterval(loadAll,5*60*1000);

// hash router
const TITLES={home:'News',podcasts:'Podcasts & YouTube',film:'Film Room',preview:'Film Preview',rumors:'Rumors & Roster',game:'Schedule',stats:'Stats',heatmap:'Player Heat Map',drafthub:'Draft',draft:'Mock Draft',college:'College Prospect Tracker',insiders:'Insiders',forum:'Forum',live:'Live Hub',injuries:'Injury Tracker',scout:'Opponent Scouting',cap:'Cap Center',rumormeter:'Rumor Meter',play:"Pick'em & Trivia",history:'Steelers History',alerts:'Alerts & Email'};
function route(){const r=(location.hash.replace(/^#\/?/,'')||'home').split('?')[0].split('/')[0];const alias={grades:'heatmap'};const v=alias[r]||(TITLES[r]?r:'home');
 document.querySelectorAll('.view').forEach(e=>e.hidden=e.dataset.view!==v);
 {const ib=document.querySelector('.sidebar .insiders');if(ib)ib.style.display=v==='home'?'':'none';} {const hs=document.querySelector('[aria-labelledby="huddleSide"]');if(hs)hs.style.display=v==='alerts'?'none':'';}
 document.querySelectorAll('nav a').forEach(a=>a.dataset.route===v?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current'));document.querySelector('.more-btn')?.classList.toggle('cur',!!document.querySelector('.more a[aria-current]'));
 document.title=(v==='home'?'':TITLES[v]+' – ')+'Black & Gold Dispatch';document.body.classList.remove('nav-open');document.querySelector('.has-more')?.classList.remove('open');window.scrollTo(0,0);
 document.dispatchEvent(new CustomEvent('route',{detail:v}));
 if(r==='grades')setTimeout(()=>document.getElementById('grade-section')?.scrollIntoView({behavior:'smooth'}),150);}
addEventListener('hashchange',route);
document.addEventListener('click',e=>{const c=e.target.closest('.chip');if(c){rumorTag=c.dataset.tag==='All'?null:c.dataset.tag;renderNews();}});
const b=$('menuBtn');b.onclick=()=>{const o=document.body.classList.toggle('nav-open');b.setAttribute('aria-expanded',o)};
window.addEventListener('DOMContentLoaded',route);

document.addEventListener('click',e=>{const m=document.querySelector('.has-more');if(!m)return;const bt=e.target.closest('.more-btn');if(bt){const o=m.classList.toggle('open');bt.setAttribute('aria-expanded',o);}else if(!e.target.closest('.more'))m.classList.remove('open');});

// Per-section Schema.org JSON-LD for crawlers/agents (no visual change): loads jsonld/<route>.json into <head>.
const JL=new Set(['college','drafthub','film','game','heatmap','home','injuries','live','podcasts','preview','rumormeter','rumors','scout','stats']);
document.addEventListener('route',e=>{const v=e.detail==='home'?null:e.detail;let s=document.getElementById('ld-route');
 if(!v||!JL.has(v)){s&&s.remove();return;}fetch('jsonld/'+v+'.json',{cache:'no-store'}).then(r=>r.ok?r.text():null).then(t=>{if(!t)return;if(!s){s=document.createElement('script');s.type='application/ld+json';s.id='ld-route';document.head.appendChild(s);}s.textContent=t;}).catch(()=>{});});
// Shared "chance available at Steelers pick" badge (estimate; data/draft/availability.json, method on the Draft tab).
window.BGD_AV=null;fetch('data/draft/availability.json',{cache:'no-store'}).then(r=>r.json()).then(a=>{window.BGD_AV=a;document.dispatchEvent(new Event('bgd-avail'));}).catch(()=>{});
window.availHTML=function(name,list){const a=list||(window.BGD_AV&&window.BGD_AV.players[name]&&window.BGD_AV.players[name].picks);if(!a)return'';
 const cls=p=>p>=65?'hi':p>=35?'mid':p>=10?'lo':'none';
 return`<div class="avail" title="Estimate from our board rank vs the Steelers' projected pick. See the Draft tab for how it works."><span class="avail-lab">Chance available at Steelers pick <small>(estimate)</small></span>${a.map(x=>`<span class="avail-pill ${cls(x.pct)}">R${x.round} #${x.overall}: <b>${x.pct<1?'<1':x.pct>99?'>99':x.pct}%</b></span>`).join('')}</div>`;};
