// Owner claim link: accept /?claim=<token>, /claim?t=<token> and #/claim/<token>; normalize to #/forum/claim/<token> before anything else runs.
(function(){try{const q=new URLSearchParams(location.search);const h=location.hash.match(/^#\/(?:forum\/)?claim\/([0-9a-f]{48,128})/);const t=q.get('claim')||(/\/claim\/?$/.test(location.pathname)?q.get('t'):null)||(h&&h[1]);
 if(t&&/^[0-9a-f]{48,128}$/.test(t)){window.BGD_CLAIM=t;const want='/#/forum/claim/'+t;if(location.pathname+location.search+location.hash!==want)history.replaceState(null,'',want);}}catch(e){}})();
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ext='target="_blank" rel="noopener"';
// Newsletter sign-up -> /api/newsletter -> Kit (double opt-in). Falls back to posting straight to Kit if our endpoint is down.
window.BGD_KIT_FORM='10069961';
window.BGD_sub=async function(ev,f){ev.preventDefault();const m=f.querySelector('.msg'),b=f.querySelector('button'),em=f.querySelector('input[type=email]'),fn=f.querySelector('input[name=first_name]');
 const ok='Almost done! Check your inbox and click the confirmation link from Kit to finish subscribing.';const say=(t,cls)=>{m.innerHTML=t;m.className='msg fine '+(cls||'');};
 if(f.dataset.busy)return false;f.dataset.busy='1';b&&(b.disabled=true);say('Signing you up…');
 const email=(em&&em.value||'').trim(),first=(fn&&fn.value||'').trim();let d=null;
 try{const r=await fetch('/api/newsletter',{method:'POST',credentials:'same-origin',headers:{'x-bgd':'1','content-type':'application/json'},body:JSON.stringify({email,first_name:first,website:(f.querySelector('input[name=website]')||{}).value||'',t:Date.now()-(+f.dataset.t||0)})});d=await r.json().catch(()=>null);}catch(e){d=null;}
 // Kit often asks for a security check when the request comes from our server (a data-center address). Try once more straight from the visitor's browser; keep Kit's check link as the last resort.
 if(d&&d.ok&&d.status==='check'){const g=d.url;try{const fd=new FormData();fd.append('email_address',email);if(first)fd.append('fields[first_name]',first);const r=await fetch('https://app.kit.com/forms/'+window.BGD_KIT_FORM+'/subscriptions',{method:'POST',body:fd,headers:{accept:'application/json'}});const k=await r.json();d=k.status==='success'?{ok:true,status:'success'}:k.status==='quarantined'?{ok:true,status:'check',url:k.url||g}:{ok:true,status:'check',url:g};}catch(e){d={ok:true,status:'check',url:g};}}
 if(!d||d.fallback||d.error==='not_configured'){try{const fd=new FormData();fd.append('email_address',email);if(first)fd.append('fields[first_name]',first);const r=await fetch('https://app.kit.com/forms/'+window.BGD_KIT_FORM+'/subscriptions',{method:'POST',body:fd,headers:{accept:'application/json'}});const k=await r.json();d=k.status==='success'?{ok:true,status:'success'}:k.status==='quarantined'?{ok:true,status:'check',url:k.url}:{ok:false,error:(k.errors&&k.errors.messages||[]).join(' ')||'Sign-up didn\'t go through. Please try again.'};}catch(e){d={ok:false,error:'Sign-up didn\'t go through. Please check your connection and try again.'};}}
 delete f.dataset.busy;b&&(b.disabled=false);
 if(d.ok&&d.status==='check'&&/^https:\/\/app\.kit\.com\//.test(d.url||''))say('One more step: Kit needs a quick security check. <a href="'+esc(d.url)+'" '+ext+'>Finish subscribing →</a> Then check your inbox for the confirmation email.','ok');
 else if(d.ok){say(esc(ok),'ok');f.reset();}
 else say(esc(d.message&&d.error&&/^[a-z_]+$/.test(d.error)?d.message:(d.error||'Sign-up didn\'t go through. Please try again.')),'err');
 return false;};
document.addEventListener('focusin',e=>{const f=e.target.closest&&e.target.closest('form[data-nl]');if(f&&!f.dataset.t)f.dataset.t=Date.now();});
const ET={timeZone:'America/New_York'};
function ago(iso){if(iso==null||iso==='')return'';const t=new Date(iso).getTime();if(!Number.isFinite(t))return'';const m=Math.max(0,Math.round((Date.now()-t)/60000));
 if(m>3650*1440)return'';if(m<60)return m+'m ago';const h=Math.round(m/60);if(h<24)return h+'h ago';return Math.round(h/24)+'d ago';}
window.BGD_V=document.querySelector('meta[name="bgd-build"]')?.content||'';
window.BGD_url=u=>{const v=window.BGD_V;if(!v||v==='dev')return u;return u+(u.includes('?')?'&':'?')+'v='+encodeURIComponent(v);};
const getJSON=u=>fetch(BGD_url(u),{cache:'no-store'}).then(r=>{if(!r.ok)throw r.status;return r.json()});
// Reload once if a newer build is on the server (defeats stale HTML/JS caches).
(function(){const cur=window.BGD_V;if(!cur||cur==='dev')return;
 fetch(BGD_url('version.json'),{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{if(!j||!j.v)return;
  if(j.v===cur){try{localStorage.setItem('bgd_build',j.v);}catch(e){}return;}
  if(window.BGD_CLAIM)return;   // never reload away from a claim link
  try{if(sessionStorage.getItem('bgd_reloaded')===j.v)return;sessionStorage.setItem('bgd_reloaded',j.v);}catch(e){}
  location.reload();}).catch(()=>{});})();
const storyHref=n=>`#/story/${encodeURIComponent(n.id||'')}`;
const storyIdFromLink=link=>{try{let h=0;const s=String(link||'');for(let i=0;i<s.length;i++)h=((h<<5)-h)+s.charCodeAt(i)|0;return (h>>>0).toString(16).slice(0,10);}catch(e){return'';}};
const D={};
const card=n=>{const id=n.id||storyIdFromLink(n.link);const href=id?`#/story/${encodeURIComponent(id)}`:'#/';
 return `<article class="card" data-story="${esc(id)}"><p class="meta"><b>${esc(n.source)}</b> · <time datetime="${esc(n.published)}">${ago(n.published)}</time></p>
 <h3><a class="hl" href="${href}">${esc(n.title)}</a></h3>${n.summary?`<p>${esc(n.summary)}</p>`:''}<a href="${href}">Our take →</a></article>`;};
const tile=(e,kind,who,cta)=>`<article class="pod"><p class="kind">${kind}</p><p class="meta"><b>${esc(who)}</b> · ${ago(e.published)}</p><h3><a class="hl" href="${esc(e.link)}" ${ext}>${esc(e.title)}</a></h3>${e.summary?`<p>${esc(e.summary)}</p>`:''}<a href="${esc(e.link)}" ${ext}>${cta} at source →</a></article>`;
const empty=t=>`<p class="empty">${t}</p>`;


// News & Rumors filters (Rumors & Updates page)
const RUMOR=/\b(trade[sd]?|trading|sign(s|ed|ing)?|re-sign\w*|release[sd]?|cuts?|waive[sd]?|waivers?|injur(y|ies|ed)|IR|injured reserve|practice squad|rumou?rs?|contract|extension|deal|activate[sd]?|questionable|doubtful|ruled out|out for|elevat\w+|claim(ed)?|free agen\w+|roster|depth chart|suspen\w+)\b/i;
const TAGS=[['Trades',/trad(e|ing)/i],['Signings',/sign|contract|extension|deal|claim/i],['Injuries',/injur|\bIR\b|questionable|doubtful|ruled out|out for|activate/i],['Releases',/release|\bcuts?\b|waive/i],['PS moves',/practice squad|elevat/i]];
let rumorTag=null;

function renderNews(){const n=D.news;if(!n||!n.items.length)return;const items=n.items,f=items[0];
 {const fid=f.id||storyIdFromLink(f.link);const fhref=fid?`#/story/${encodeURIComponent(fid)}`:'#/';
 $('featured').querySelector('.featured-body').innerHTML=`<span class="tag">Top Story</span><h1><a class="hl" href="${fhref}">${esc(f.title)}</a></h1>${f.summary?`<p>${esc(f.summary)}</p>`:''}<p class="meta">${esc(f.source)} · ${ago(f.published)} · <a href="${fhref}">Our take →</a></p>`;}
 $('cards').innerHTML=items.slice(1,17).map(card).join('');
 $('updated').textContent=`${n.count} headlines from ${n.sources.filter(s=>s.status==='ok').length} sources · updated ${ago(n.generated)}`;
 const chips=$('rumor-chips'), cards=$('rumor-cards');
 if(chips&&cards){const cut=Date.now()-5*864e5;const r=items.filter(i=>RUMOR.test(i.title+' '+(i.summary||''))&&i.published&&new Date(i.published).getTime()>=cut);
  chips.innerHTML=[['All',null],...TAGS].map(([l,re])=>`<button class="chip${(rumorTag===l||(!rumorTag&&!re))?' on':''}" data-tag="${l}">${l}</button>`).join('');
  const sel=TAGS.find(t=>t[0]===rumorTag);const shown=sel?r.filter(i=>sel[1].test(i.title+' '+i.summary)):r;
  cards.innerHTML=shown.length?shown.map(card).join(''):empty('No roster-move headlines in the last 5 days');}
}
function renderTicker(){const t=D.ticker;if(!t)return;const h=t.items.map(i=>`<a href="${esc(i.link)}" ${ext}><b>${i.tag}</b> · ${esc(i.title)}</a>`).join('');$('tickerMove').innerHTML=h+h;}
/* Insider ticker: 2nd scrolling line under the headline ticker, every page (replaced the sidebar Insider Tracker box).
   Shows our own topic line ("posted about ..."), never the post text (fetch_insiders.py never stores it). */
function renderInsTicker(all){const bar=$('insTicker'),mv=$('insMove');if(!bar||!mv)return;
 const list=(all||[]).slice().sort((a,b)=>b.published.localeCompare(a.published)).slice(0,15);if(!list.length){bar.hidden=true;mv.innerHTML='';return;}
 const cut=(s,n)=>{s=String(s||'');if(s.length<=n)return s;s=s.slice(0,n);const i=s.lastIndexOf(' ');return (i>40?s.slice(0,i):s).replace(/[\s,.;:]+$/,'')+'…';};
 const line=p=>cut(String(p.about||'').replace(/^@\S+\s+/,'').replace(/\.$/,'')||('Post on '+p.platform),90);
 const one=(hide)=>list.map(p=>`<a href="${esc(p.link)}" target="_blank" rel="noopener"${hide?' tabindex="-1"':''}><b>${esc(p.name)}</b> ${esc(line(p))} <time datetime="${esc(p.published)}">${ago(p.published)}</time></a>`).join('<i class="ins-dot" aria-hidden="true"></i>')+'<i class="ins-dot" aria-hidden="true"></i>';
 mv.innerHTML=one(false)+`<span class="ins-copy" aria-hidden="true">${one(true)}</span>`;bar.hidden=false;
 requestAnimationFrame(()=>{const w=mv.scrollWidth/2,slow=matchMedia('(prefers-reduced-motion: reduce)').matches;mv.style.animationDuration=Math.max(40,Math.round(w/(slow?18:42)))+'s';}); /* ~42px/s: easy to read on a phone; reduced motion ~18px/s */
 if(!bar.dataset.wired){bar.dataset.wired='1';const on=()=>bar.classList.add('ins-paused'),off=()=>bar.classList.remove('ins-paused');
  bar.addEventListener('touchstart',on,{passive:true});bar.addEventListener('touchend',()=>setTimeout(off,1500),{passive:true});bar.addEventListener('touchcancel',off,{passive:true});}}
function renderIns(){const d=D.ins;if(!d)return;
 const cut=Date.now()-72*3600*1000;const fresh=a=>(a||[]).filter(p=>p.published&&new Date(p.published).getTime()>=cut);
 const items=fresh(d.items),all=fresh(d.all||d.items);
 renderInsTicker(all);
 const li=p=>`<li><strong>${esc(p.name)}</strong><time datetime="${esc(p.published)}">${ago(p.published).replace(' ago','')}</time><span>${esc(p.about||('Post by '+p.name))}</span><a class="via" href="${esc(p.link)}" ${ext}>View on ${esc(p.platform)} →</a></li>`;
 if($('insiders'))$('insiders').innerHTML=items.length?items.slice(0,6).map(li).join(''):'<li><span>No insider posts in the last 3 days.</span></li>';
 $('insider-full').innerHTML=all.length?all.map(p=>`<article class="card"><p class="meta"><b>${esc(p.name)}</b> · ${esc(p.handle)} · ${ago(p.published)}</p><p>${esc(p.about||('Post by '+p.name))}</p><a href="${esc(p.link)}" ${ext}>View on ${esc(p.platform)} →</a></article>`).join(''):empty('No insider posts in the last 3 days');}
function renderFilm(){
 if(D.film){const p=D.film,h=p.game?'Film Breakdown: '+p.game.label:'Film Breakdown';$('filmH').textContent=h;$('filmH2').textContent=h;
  const x=p.items.map(e=>tile(e,'🎬 Film',e.creator,'View'));$('film-list').innerHTML=x.slice(0,6).join('')||empty('No film breakdowns yet for the last game');const G=p.games||[];if(G.length){$('filmH2').textContent='Film Room: '+G.length+' games this season';
   $('film-full').innerHTML=`<nav class="filmnav" aria-label="Pick a game">${G.map(g=>`<a href="#film-${esc(g.gid)}" onclick="event.preventDefault();const d=document.getElementById('film-${esc(g.gid)}');d.open=true;d.scrollIntoView({behavior:'smooth'})">${esc(g.label)} (${g.count})</a>`).join('')}</nav>`+
   G.map((g,i)=>`<details class="filmgame" id="film-${esc(g.gid)}" ${i?'':'open'}><summary><h2>${esc(g.label)}</h2> <span class="meta">${g.count} breakdown${g.count==1?'':'s'}</span></summary><div class="pods">${g.items.map(e=>tile(e,'🎬 Film',e.creator,'View')).join('')||empty('No breakdowns found for this game')}</div></details>`).join('');}
  else $('film-full').innerHTML=x.join('')||empty('No film breakdowns yet for the last game');}
 if(D.prev){const p=D.prev,h=p.game?'Opponent Preview: '+p.game.label:'Opponent Preview';if($('prevH'))$('prevH').textContent=h;$('prevH2').textContent=h;
  const x=p.items.map(e=>tile(e,'🔎 Preview',e.creator,'View'));if($('preview-list'))$('preview-list').innerHTML=x.slice(0,6).join('')||empty('No previews yet for the next game');$('preview-full').innerHTML=ctmBox(p.ctm)+(x.join('')||empty('No previews yet for the next game'));}}
function ctmBox(c){if(!c)return'';return `<article class="pod ctm"><p class="kind">🎙 Check the Mic · ${esc(c.network)}</p><h3>${esc(c.title)}</h3><p class="meta"><b>${esc(c.hosts)}</b> · ${fmt(c.published,{month:'short',day:'numeric'})}</p><p>${esc(c.summary)}</p>${c.note?`<p class="fine">${esc(c.note)}</p>`:''}${c.embed?`<div class="yt-embed"><iframe loading="lazy" src="${esc(c.embed)}" title="${esc(c.title)}" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`:''}<a href="${esc(c.link)}" ${ext}>Listen${c.segment?' (Steelers segment at '+esc(c.segment)+')':''} →</a>${c.youtube?` · <a href="${esc(c.youtube)}" ${ext}>Watch on YouTube →</a>`:''}</article>`;}
/* Podcasts & YouTube (#/podcasts + home box). Show-name-first cards, show filter buttons (#/podcasts?show=<slug> or ?show=following),
   Follow stars saved on this device (localStorage bgd_follow_shows). Owner rule: All view and home box grouped by US Eastern day, newest day first; filtered views are one newest-first list with dates on cards. */
const podSlug=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const podFollows=()=>{try{const a=JSON.parse(localStorage.getItem('bgd_follow_shows')||'[]');return new Set(Array.isArray(a)?a:[]);}catch(e){return new Set();}};
const podSetFollows=s=>{try{localStorage.setItem('bgd_follow_shows',JSON.stringify([...s]));}catch(e){}};
const podFilter=()=>{const m=(location.hash.split('?')[1]||'').match(/(?:^|&)show=([a-z0-9-]+)/);return m?m[1]:'';};
const podStar=(slug,name,f)=>`<button type="button" class="pf-star${f.has(slug)?' on':''}" data-follow="${esc(slug)}" aria-pressed="${f.has(slug)}" aria-label="${f.has(slug)?'Unfollow':'Follow'} ${esc(name)}" title="${f.has(slug)?'Following':'Follow'}">${f.has(slug)?'★':'☆'}</button>`;
const podTile=(e,f,dated)=>{const v=e.kind==='video',s=podSlug(e.show);return `<article class="pod pod-ep" data-show="${esc(s)}"><p class="pod-show"><b>${esc(e.show)}</b>${podStar(s,e.show,f)}</p><p class="kind">${v?'YouTube':'Podcast'} · ${dated?`<time class="pod-date" datetime="${esc(e.published)}">${new Date(e.published).toLocaleDateString('en-US',{...ET,weekday:'short',month:'short',day:'numeric'})}</time> · `:''}${ago(e.published)}</p><h3><a class="hl" href="${esc(e.link)}" ${ext}>${esc(e.title)}</a></h3>${e.summary?`<p>${esc(e.summary)}</p>`:''}<a href="${esc(e.link)}" ${ext}>${v?'Watch':'Listen'} at source →</a></article>`;};
const podDays=(list,f,cls)=>{const g={};list.forEach(e=>{const k=new Date(e.published).toLocaleDateString('en-CA',ET);(g[k]=g[k]||[]).push(e)});
 const day=k=>new Date(k+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'});
 return Object.keys(g).sort().reverse().map(k=>{const d=g[k].slice().sort((a,b)=>(f.has(podSlug(b.show))-f.has(podSlug(a.show)))||b.published.localeCompare(a.published)); /* followed shows first within the day */
  return `<h2 class="section-title pod-day${cls?' '+cls:''}">${day(k)} <small>${d.length}</small></h2><div class="pods">${d.map(e=>podTile(e,f)).join('')}</div>`;}).join('');};
let podChipsOpen=false; /* show chips: 2 rows by default; 'All N shows' opens the rest (kept while on the page) */
function podChipsFit(){const c=$('pf-chips'),b=document.querySelector('#pods-filter .pf-more');if(!c||!b||!c.offsetHeight)return;
 c.classList.remove('open');const over=c.scrollHeight>c.clientHeight+2,cur=c.querySelector('.pf-chip.cur');
 if(cur&&cur.offsetTop+cur.offsetHeight>c.offsetTop+c.clientHeight+2&&!podChipsOpen)podChipsOpen=true; /* selected show sits in a hidden row: open the list */
 c.classList.toggle('open',podChipsOpen);b.hidden=!over;b.setAttribute('aria-expanded',podChipsOpen);b.textContent=podChipsOpen?'Fewer shows':`All ${c.children.length} shows`;}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#pods-filter .pf-more');if(!b)return;e.preventDefault();podChipsOpen=!podChipsOpen;podChipsFit();});
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('#pods-filter .pf-seg-btn,#pods-filter .pf-showing a'))podChipsOpen=false;},true); /* All shows / Following / Clear: fold the show list back to 2 rows */
document.addEventListener('focusin',e=>{const c=e.target.closest&&e.target.closest('#pf-chips .pf-chip');if(c&&!podChipsOpen){const w=$('pf-chips');if(c.offsetTop+c.offsetHeight>w.offsetTop+w.clientHeight+2){podChipsOpen=true;podChipsFit();}}});
{let t;addEventListener('resize',()=>{clearTimeout(t);t=setTimeout(podChipsFit,150);});}
document.addEventListener('route',e=>{if(e.detail==='podcasts')setTimeout(podChipsFit,0);});
function renderPods(){const p=D.pods;if(!p)return;const cut=Date.now()-3*864e5,POD_MIN=6,f=podFollows();
 const D3=p.display_days||2,DK=p.days||5,dk=t=>new Date(t).toLocaleDateString('en-CA',ET),k3=dk(Date.now()-(D3-1)*864e5),k5=dk(Date.now()-(DK-1)*864e5); /* data keeps 5 days; default view = today + yesterday (US Eastern calendar days), so day headings are whole days */
 const all=(p.items||[]).filter(e=>e&&e.published).sort((a,b)=>b.published.localeCompare(a.published));let it=all.filter(e=>dk(e.published)>=k3);if(it.length<POD_MIN)it=all.slice(0,Math.max(POD_MIN,it.length)); /* 3-day default; slow-week fallback: newest ~6 so it's never empty */
 let full=all.filter(e=>dk(e.published)>=k5||it.includes(e)); /* show filters and Following search the full 5 days */
 /* Post-Game Reaction (fetch_podcasts.py "postgame"): ~48h after each game, post-game shows on top; not repeated below */
 const pg=p.postgame&&p.postgame.items&&p.postgame.items.length&&Date.now()<new Date(p.postgame.until)?p.postgame:null,pk=e=>e.show+'|'+String(e.title).toLowerCase().replace(/\W+/g,''); /* same show+title = same episode (podcast and video copies) */
 const pgItems=pg?pg.items:[];
 if(pg){const s=new Set(pgItems.map(pk));it=it.filter(e=>!s.has(pk(e)));full=full.filter(e=>!s.has(pk(e)));}
 const more=full.filter(e=>!it.includes(e)),wide=/(?:^|&)days=5\b/.test(location.hash.split('?')[1]||'')&&more.length;
 /* show list: every show with items in the window (post-game box included) */
 const cnt={},nm={};full.concat(pgItems).forEach(e=>{const s=podSlug(e.show);cnt[s]=(cnt[s]||0)+1;nm[s]=e.show;});
 const shows=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]||nm[a].localeCompare(nm[b]));
 let sel=podFilter();if(sel&&sel!=='following'&&!cnt[sel])sel='';   /* unknown or expired show: fall back to All */
 const keep=e=>!sel||(sel==='following'?f.has(podSlug(e.show)):podSlug(e.show)===sel);
 const pgShown=pgItems.filter(keep),list=full.filter(keep);
 const pgBox=(items,n,cls)=>items.length?`<section class="pg-react ${cls}" aria-label="${esc(pg.heading)}"><h2 class="section-title pg-head">${esc(pg.heading)}</h2><div class="pods">${items.slice(0,n).map(e=>podTile(e,f,cls==='pg-full'&&!!sel)).join('')}</div></section>`:'';
 /* home box: 3 post-game + 3 newest (or 6 newest), still grouped by day */
 if($('pods-pg'))$('pods-pg').innerHTML=pgBox(pgItems,3,'pg-home');
 if($('pods')){const h=it.slice(0,pg?3:6);$('pods').innerHTML=h.length?podDays(h,f,'pod-day-home'):empty('No new episodes this week');}
 /* filter bar */
 /* filter bar (polished): All shows | Following segmented toggle, then quiet show chips (followed first, then A to Z), 2 rows with an 'All N shows' toggle */
 const fb=$('pods-filter');if(fb){const nf=full.concat(pgItems).filter(e=>f.has(podSlug(e.show))).length,az=s=>nm[s].replace(/^the\s+/i,'').toLowerCase();
  const seg=(s,label,n)=>`<a class="pf-seg-btn${sel===s?' cur':''}" href="#/podcasts${s?'?show='+esc(s):''}" data-pf="${esc(s)}"${sel===s?' aria-current="true"':''}>${esc(label)}${n?` <small>${n}</small>`:''}</a>`;
  const order=shows.slice().sort((a,b)=>(f.has(b)-f.has(a))||az(a).localeCompare(az(b)));
  const chip=s=>`<a class="pf-chip${sel===s?' cur':''}${f.has(s)?' fol':''}" href="#/podcasts?show=${esc(s)}" data-pf="${esc(s)}"${sel===s?' aria-current="true"':''} title="${esc(nm[s])}">${f.has(s)?'<span class="pf-fol" aria-hidden="true">★</span><span class="sr"> (following) </span>':''}<span class="pf-nm">${esc(nm[s])}</span> <small>${cnt[s]}</small></a>`;
  fb.innerHTML=`<div class="pf-panel"><div class="pf-seg" role="group" aria-label="View">${seg('','All shows',it.length+pgItems.length)}${seg('following','Following',nf)}</div>`+
   `<div class="pf-chips${podChipsOpen?' open':''}" id="pf-chips" role="group" aria-label="Filter by show">${order.map(chip).join('')}</div>`+
   `<button type="button" class="pf-more" aria-controls="pf-chips" aria-expanded="${podChipsOpen}" hidden>${podChipsOpen?'Fewer shows':`All ${order.length} shows`}</button></div>`+
   (sel?`<p class="pf-showing">Showing: <b>${sel==='following'?'Shows you follow':esc(nm[sel])}</b> · <a href="#/podcasts" data-pf="">Clear</a></p>`:'');
  podChipsFit();}
 if($('pods-full-pg'))$('pods-full-pg').innerHTML=pgBox(pgShown,8,'pg-full');
 const root=$('pods-full');root.classList.toggle('pf-filtered',!!sel); /* filtered views: engage/quote/ad cards are hidden by CSS */
 /* All view: grouped by US Eastern day (followed shows first within each day). Single-show / Following views: one newest-first list, date on each card (owner) */
 let h=(sel?(list.length?`<div class="pods pods-flat">${list.map(e=>podTile(e,f,true)).join('')}</div>`:''):podDays(wide?it.concat(more):it,f)+(more.length?`<div class="pd-more">${wide?`<a class="pd-btn pd-less" href="#/podcasts" data-pdays="${D3}">Show fewer days</a><span class="fine">Back to the past ${D3} days</span>`:`<a class="pd-btn" href="#/podcasts?days=${DK}" data-pdays="${DK}">Show ${DK-D3} more days</a><span class="fine">${more.length} more episodes and videos</span>`}</div>`:''))||(sel==='following'?empty(f.size?'None of the shows you follow have posted in the past '+DK+' days.':'You aren’t following any shows yet. Tap the star next to a show’s name to follow it.'):sel&&pgShown.length?'':empty('No recent episodes right now'));
 const ch=sel?[]:(p.yt_channels||[]);
 if(ch.length)h+=`<h2 class="section-title pod-day">Latest on YouTube</h2><p class="fine">Official YouTube players for channels whose feed didn’t load this update.</p><div class="pods">${ch.map(c=>`<article class="pod"><p class="pod-show"><b>${esc(c.show)}</b></p><p class="kind">YouTube</p><div class="yt-embed"><iframe loading="lazy" src="${esc(c.embed)}" title="${esc(c.show)} latest videos" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe></div><a href="${esc(c.link)}" ${ext}>Watch on YouTube →</a></article>`).join('')}</div>`;
 {const i=h.indexOf('<div class="pd-more">');if(i>=0){const j=h.indexOf('</div>',i)+6;h=h.slice(0,i)+h.slice(j)+h.slice(i,j);}} /* 'Show 3 more days' sits last, right above THE SHOWS */
 root.innerHTML=h;
 podDir(p,full.concat(pgItems),f,DK);}
/* THE SHOWS directory (below the list, every view): every show in the feed list, even with nothing new; same Follow stars */
function podDir(p,items,f,DK){const el=$('pods-dir');if(!el)return;const dir=p.directory||[];if(!dir.length){el.hidden=true;return;}
 const n={};items.forEach(e=>{const s=podSlug(e.show);n[s]=(n[s]||0)+1;});
 const key=d=>d.show.replace(/^the\s+/i,'').toLowerCase();
 const card=d=>{const s=podSlug(d.show),c=n[s]||0,k=d.kinds||[],fmt=k.includes('podcast')&&k.includes('video')?'Podcast + YouTube':k.includes('video')?'YouTube':'Podcast';
  const links=[d.site?`<a href="${esc(d.site)}" ${ext}>Show page →</a>`:'',d.youtube?`<a href="${esc(d.youtube)}" ${ext}>YouTube channel →</a>`:''].filter(Boolean).join('');
  return `<article class="pd-show" data-show="${esc(s)}"><p class="pod-show"><b>${esc(d.show)}</b>${podStar(s,d.show,f)}</p><p class="kind">${fmt}</p><p class="pd-count">${c?`${c} episode${c==1?'':'s'} in the past ${DK} days`:`Nothing new in the past ${DK} days`}</p><div class="pd-acts">${c?`<a class="pd-see" href="#/podcasts?show=${esc(s)}" data-pf="${esc(s)}">See episodes</a>`:''}${links}</div></article>`;};
 el.innerHTML=`<h2 class="section-title" id="podsDirH">The Shows</h2><p class="fine">Every show we follow, A to Z. Tap the star to follow a show on this device.</p><div class="pd-grid">${dir.slice().sort((a,b)=>key(a).localeCompare(key(b))).map(card).join('')}</div>`;el.hidden=false;}
/* Follow stars + show filter buttons: filter changes update the URL without jumping to the top of the page */
document.addEventListener('click',e=>{const st=e.target.closest&&e.target.closest('.pf-star');if(st){e.preventDefault();e.stopPropagation();const f=podFollows(),s=st.dataset.follow;f.has(s)?f.delete(s):f.add(s);podSetFollows(f);renderPods();return;}
 const b=e.target.closest&&e.target.closest('[data-pf]');if(b&&!e.metaKey&&!e.ctrlKey){e.preventDefault();const s=b.dataset.pf,h='#/podcasts'+(s?'?show='+s:'');if(location.hash!==h)history.pushState(null,'',h);renderPods();
  const top=$('pods-filter');if(top&&top.getBoundingClientRect().top<0)top.scrollIntoView({block:'start'});}});
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-pdays]');if(!b||e.metaKey||e.ctrlKey)return;e.preventDefault();
 const n=+b.dataset.pdays,h='#/podcasts'+(n>((D.pods&&D.pods.display_days)||3)?'?days='+n:'');if(location.hash!==h)history.pushState(null,'',h);renderPods();
 if(b.classList.contains('pd-less')){const m=document.querySelector('#pods-full .pd-more');if(m)m.scrollIntoView({block:'center'});}});
addEventListener('popstate',()=>{if(/^#\/?podcasts/.test(location.hash))renderPods();});
document.addEventListener('route',e=>{if(e.detail==='podcasts'&&D.pods)renderPods();});
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
 el.innerHTML=`<h2 id="fvH" class="section-title">Featured Video · ${lab}</h2><div class="fv-grid">${src?`<div class="fv-frame"><iframe src="${esc(src)}" title="${esc(v.title)}" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`:`<a class="fv-frame fv-out" data-no-embed="1" href="${esc(v.link)}" ${ext}><span class="fv-play">▶</span><span class="fv-out-t">Watch on YouTube</span><span class="fv-out-s">${esc(v.channel)} only allows this video to play on YouTube</span></a>`}<div class="fv-body"><h3><a href="${esc(v.link)}" ${ext}>${esc(v.title)}</a></h3><p>${esc(v.caption||'')}</p>${f.fallback?`<p class="fv-note">${esc(f.fallback)}</p>`:''}<p class="meta">Official ${esc(v.channel)} YouTube channel · <a href="${esc(v.link)}" ${ext}>Watch on YouTube →</a></p></div></div>`;
 el.hidden=false;}

const SRC={news:['data/news.json',()=>{renderNews();if(window.BGD_storyId)renderStory();}],ticker:['data/ticker.json',renderTicker],ins:['data/insiders.json',renderIns],
 prev:['data/preview.json',renderFilm],film:['data/film.json',renderFilm],pods:['data/podcasts.json',renderPods],sched:['data/schedule.json',renderGame],fv:['data/featured_video.json',renderFV]};
async function loadAll(){await Promise.all(Object.entries(SRC).map(async([k,[u,fn]])=>{try{D[k]=await getJSON(u);fn();}catch(e){}}));}
loadAll();setInterval(loadAll,5*60*1000);


function findStory(id){const items=(D.news&&D.news.items)||[];return items.find(n=>(n.id||storyIdFromLink(n.link))===id);}
function renderStory(){
  const el=$('story-body');if(!el)return;
  const id=window.BGD_storyId||'';
  const n=findStory(id);
  if(!n){el.innerHTML=`<p class="empty">Story not found. <a href="#/">Back to News</a></p>`;return;}
  const src=esc(n.source);const url=esc(n.link);
  el.innerHTML=`<p class="meta"><b>${src}</b> · <time datetime="${esc(n.published)}">${ago(n.published)}</time>${n.via?` · via ${esc(n.via)}`:''}</p>
   <h1 class="story-title">${esc(n.title)}</h1>
   ${n.summary?`<p class="story-summary">${esc(n.summary)}</p>`:''}
   <p class="story-credit fine">Summary by Black &amp; Gold Dispatch. Full article © ${src}.</p>
   <p class="story-actions">
     <a class="btn primary ext-native" href="${url}" target="_blank" rel="noopener" data-native="1">Read full story at ${src} ↗</a>
     <button type="button" class="btn ghost" data-copy="${url}">Copy link</button>
   </p>`;
}
document.addEventListener('route',e=>{if(e.detail==='story')renderStory();});
document.addEventListener('click',e=>{const b=e.target.closest('[data-copy]');if(!b)return;const u=b.getAttribute('data-copy');
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(u).then(()=>{b.textContent='Copied!';setTimeout(()=>b.textContent='Copy link',1500);}).catch(()=>{});}
  else{try{const ta=document.createElement('textarea');ta.value=u;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();b.textContent='Copied!';setTimeout(()=>b.textContent='Copy link',1500);}catch(err){}}
});

// hash router
const TITLES={home:'News',story:'Story',podcasts:'Podcasts & YouTube',film:'Film Room',opponent:'Opponent Preview',roster:'Depth Chart & Roster',game:'Schedule',stats:'Stats',leaders:'League Leaders',heatmap:'Player Grades',drafthub:'Draft',draft:'Mock Draft',college:'College Prospect Tracker',insiders:'Insiders',forum:'Forum',contact:'Contact & Suggestions',live:'Live Hub',injuries:'Injury Tracker',cap:'Cap Center',rumors:'Rumors & Updates',play:"Pick'em & Trivia",history:'Steelers History',alerts:'Newsletter Sign-up',boxscore:'Box Score',notfound:'Page not found'};
function route(){const parts=(location.hash.replace(/^#\/?/,'')||'home').split('?')[0].split('/');const r=parts[0];const alias={newsletter:'alerts',signup:'alerts',grades:'heatmap',rumormeter:'rumors',preview:'opponent',scout:'opponent',scouting:'opponent',schedule:'game'};if(r==='about'){location.replace('legal/about.html');return;}const bad=/^#\//.test(location.hash)&&!!r&&!alias[r]&&!TITLES[r]&&r!=='claim'&&r!=='home';const v=bad?'notfound':alias[r]||(TITLES[r]?r:'home');window.BGD_boxId=r==='boxscore'?decodeURIComponent(parts[1]||''):'';window.BGD_storyId=r==='story'?decodeURIComponent(parts[1]||''):'';window.BGD_leaderKind=r==='leaders'?decodeURIComponent(parts[1]||''):'';window.BGD_leaderStat=r==='leaders'?decodeURIComponent(parts[2]||''):'';
 if(r==='rumormeter'){const qs=(location.hash.split('?')[1]||'');const nh='#/rumors'+(qs?('?'+qs):'?tab=meter');if(location.hash!==nh)history.replaceState(null,'',nh);}
 if(r==='alerts'){history.replaceState(null,'','#/newsletter');} /* old Alerts & Email address now opens the Newsletter page */
 if(r==='preview'||r==='scout'||r==='scouting'){if(location.hash!=='#/opponent')history.replaceState(null,'','#/opponent');}
 document.querySelectorAll('.view').forEach(e=>e.hidden=e.dataset.view!==v);
 {const ib=document.querySelector('.sidebar .insiders');if(ib)ib.style.display=v==='home'?'':'none';} {const hs=document.querySelector('[aria-labelledby="huddleSide"]');if(hs)hs.style.display=v==='alerts'?'none':'';}
 document.querySelectorAll('nav a').forEach(a=>a.dataset.route===v?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current'));document.querySelector('.more-btn')?.classList.toggle('cur',!!document.querySelector('.more a[aria-current]'));
 document.title=(v==='home'?'':TITLES[v]+' – ')+'Black & Gold Dispatch';document.body.classList.remove('nav-open');document.querySelector('.has-more')?.classList.remove('open');window.scrollTo(0,0);
 {let m=document.getElementById('bgd-robots');const priv=r==='claim'||v==='notfound'||(r==='forum'&&/^(mod|me|new|join|signin|claim)$/.test(parts[1]||''));if(priv){if(!m){m=document.createElement('meta');m.name='robots';m.id='bgd-robots';document.head.appendChild(m);}m.content='noindex,nofollow';}else if(m)m.remove();}
 document.dispatchEvent(new CustomEvent('route',{detail:v}));
 if(r==='grades')setTimeout(()=>document.getElementById('grade-section')?.scrollIntoView({behavior:'smooth'}),150);}
addEventListener('hashchange',route);
const b=$('menuBtn');b.onclick=()=>{const o=document.body.classList.toggle('nav-open');b.setAttribute('aria-expanded',o)};
window.addEventListener('DOMContentLoaded',route);

document.addEventListener('click',e=>{const c=e.target.closest('#rumor-chips .chip');if(c){rumorTag=c.dataset.tag==='All'?null:c.dataset.tag;renderNews();return;}
 const br=e.target.closest('tr.sched-done');if(br&&!e.target.closest('a')){location.hash='#/boxscore/'+br.dataset.box;return;}});
document.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const br=e.target.closest&&e.target.closest('tr.sched-done');if(br){e.preventDefault();location.hash='#/boxscore/'+br.dataset.box;}});
document.addEventListener('click',e=>{const m=document.querySelector('.has-more');if(!m)return;const bt=e.target.closest('.more-btn');if(bt){const o=m.classList.toggle('open');bt.setAttribute('aria-expanded',o);if(o)BGD_fitMore();}else if(!e.target.closest('.more')){m.classList.remove('open');m.querySelector('.more-btn')?.setAttribute('aria-expanded','false');}});
// Keep the More dropdown fully on screen (it can sit near the left edge when the tabs wrap on an iPad).
window.BGD_fitMore=function(){const u=document.getElementById('moreMenu');if(!u)return;u.style.left='';u.style.right='';const r=u.getBoundingClientRect();if(r.width&&r.left<8){u.style.left='0';u.style.right='auto';}const r2=u.getBoundingClientRect();if(r2.right>innerWidth-8){u.style.left='auto';u.style.right='0';}};
// #/newsletter opens the Newsletter page and puts the cursor in the email box.
document.addEventListener('route',e=>{if(e.detail==='alerts'&&/^#\/(newsletter|signup)/.test(location.hash))setTimeout(()=>{const i=document.getElementById('al-em');if(i){i.scrollIntoView({block:'center'});}},250);});

// Per-section Schema.org JSON-LD for crawlers/agents (no visual change): loads jsonld/<route>.json into <head>.
const JL=new Set(['college','drafthub','film','game','heatmap','home','injuries','live','podcasts','opponent','rumors','roster','stats']);
document.addEventListener('route',e=>{const v=e.detail==='home'?null:e.detail;let s=document.getElementById('ld-route');
 if(!v||!JL.has(v)){s&&s.remove();return;}fetch(BGD_url('jsonld/'+v+'.json'),{cache:'no-store'}).then(r=>r.ok?r.text():null).then(t=>{if(!t)return;if(!s){s=document.createElement('script');s.type='application/ld+json';s.id='ld-route';document.head.appendChild(s);}s.textContent=t;}).catch(()=>{});});
// Shared "chance available at Steelers pick" badge (estimate; data/draft/availability.json, method on the Draft tab).
window.BGD_AV=null;fetch(BGD_url('data/draft/availability.json'),{cache:'no-store'}).then(r=>r.json()).then(a=>{window.BGD_AV=a;document.dispatchEvent(new Event('bgd-avail'));}).catch(()=>{});
window.availHTML=function(name,list){const a=list||(window.BGD_AV&&window.BGD_AV.players[name]&&window.BGD_AV.players[name].picks);if(!a)return'';
 const cls=p=>p>=65?'hi':p>=35?'mid':p>=10?'lo':'none';
 return`<div class="avail" title="Estimate from our board rank vs the Steelers' projected pick. See the Draft tab for how it works."><span class="avail-lab">Chance available at Steelers pick <small>(estimate)</small></span>${a.map(x=>`<span class="avail-pill ${cls(x.pct)}">R${x.round} #${x.overall}: <b>${x.pct<1?'<1':x.pct>99?'>99':x.pct}%</b></span>`).join('')}</div>`;};

// External links + place restore.
// iPadOS Safari reports a Mac desktop UA; detect via maxTouchPoints. It often ignores
// window.open after async work and may open target=_blank in-place — so for iPad / in-app
// WebViews we do NOT preventDefault: a real <a target=_blank rel=noopener> handles the tap.
// News cards go to #/story/<id> first. "Read full story" on that page is data-native.
// Desktop: sync window.open; if blocked, show an in-site sheet (Open article + Copy link).
(function(){
 const PLACE='bgd_place';
 function savePlace(){try{if(/claim/.test(location.hash)||window.BGD_CLAIM)return;const p={hash:location.hash||'#/',scroll:window.scrollY||0,t:Date.now()};sessionStorage.setItem(PLACE,JSON.stringify(p));localStorage.setItem(PLACE,JSON.stringify(p));}catch(e){}}
 function restorePlace(){try{const raw=sessionStorage.getItem(PLACE)||localStorage.getItem(PLACE);if(!raw)return;const p=JSON.parse(raw);if(!p||!p.hash)return;if(window.BGD_CLAIM||/claim/.test(location.hash+location.search))return;
  // a link that names a page (deep link, claim link) always wins over the saved place; only a bare visit restores the last page
  const cur=location.hash||'';if(cur&&cur!=='#'&&cur!=='#/'&&cur!==p.hash)return;
  const go=()=>{if(window.BGD_CLAIM||/claim/.test(location.hash))return;if((location.hash||'#/')!==p.hash)location.hash=p.hash;const sc=()=>window.scrollTo(0,p.scroll||0);sc();setTimeout(sc,120);setTimeout(sc,450);};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(go,0));else setTimeout(go,0);}catch(e){}}
 window.BGD_savePlace=savePlace;window.BGD_restorePlace=restorePlace;
 let scrollT=null;addEventListener('scroll',()=>{clearTimeout(scrollT);scrollT=setTimeout(savePlace,200);},{passive:true});
 addEventListener('hashchange',()=>setTimeout(savePlace,0));
 addEventListener('pagehide',savePlace);addEventListener('beforeunload',savePlace);
 restorePlace();

 function isIPad(){
  const ua=navigator.userAgent||'';
  if(/iPad/i.test(ua))return true;
  // iPadOS 13+ desktop site: Macintosh + touch
  return /Macintosh/i.test(ua) && (navigator.maxTouchPoints||0)>1;
 }
 function isInApp(){
  const ua=navigator.userAgent||'';
  if(/FBAN|FBAV|Instagram|Line\/|Twitter|LinkedInApp|GSA\/|Snapchat|Discord|MicroMessenger|WKWebView/i.test(ua))return true;
  if(/\bwv\b/i.test(ua) && /Android/i.test(ua))return true;
  // iOS WebView: has AppleWebKit but not Safari (and not CriOS/FxiOS)
  if(/(iPhone|iPod|iPad)/i.test(ua) && /AppleWebKit/i.test(ua) && !/Safari/i.test(ua))return true;
  if(isIPad() && /AppleWebKit/i.test(ua) && !/Safari\//i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua))return true;
  return false;
 }
 function preferNative(){return isIPad() || isInApp();}

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
  rel.add('noopener');rel.delete('noreferrer');
  a.setAttribute('rel',[...rel].join(' '));
  if(!a.classList.contains('ext-skip')&&!a.classList.contains('hl')&&!a.classList.contains('btn')&&!a.classList.contains('fv-out')&&!a.classList.contains('inj')&&!a.classList.contains('dp')&&!a.classList.contains('ext-native')&&!a.closest('#tickerMove,.fv-frame,.merch-grid,nav,#ext-viewer,#ext-sheet'))
   a.classList.add('ext-link');
  return true;
 }
 function scan(root){(root||document).querySelectorAll?.('a[href]')?.forEach(harden);if(root?.matches?.('a[href]'))harden(root);}

 function ytId(url){
  try{const u=new URL(url,location.href);const h=u.hostname.replace(/^www\./,'');
   if(h==='youtu.be')return u.pathname.replace(/^\//,'').split('/')[0]||null;
   if(h==='youtube.com'||h==='m.youtube.com'||h==='music.youtube.com'||h==='youtube-nocookie.com'){
    if(u.searchParams.get('v'))return u.searchParams.get('v');
    const m=u.pathname.match(/\/(?:embed|shorts|live)\/([^/?#]+)/);return m?m[1]:null;}
  }catch(e){}return null;
 }
 function noEmbed(a,url){
  if(a&&(a.classList.contains('fv-out')||a.dataset.noEmbed==='1'))return true;
  const t=((a&&(a.textContent||'')+' '+(a.getAttribute('aria-label')||'')||'')+' '+(url||'')).toLowerCase();
  if(/\bnfl\b/.test(t)&&/only allows this video to play on youtube|watch on youtube/.test(t))return true;
  try{const u=new URL(url,location.href);if(/youtube\.com\/@nfl\b/i.test(u.href)||/\.nfl\.com$/i.test(u.hostname.replace(/^www\./,'')))return true;}catch(e){}
  return false;
 }
 function likelyFrameable(url){
  try{const h=new URL(url,location.href).hostname.replace(/^www\./,'').toLowerCase();
   return /(^|\.)youtube\.com$|(^|\.)youtube-nocookie\.com$|(^|\.)youtu\.be$|(^|\.)player\.vimeo\.com$|(^|\.)open\.spotify\.com$|(^|\.)embed\.podcasts\.apple\.com$/.test(h);
  }catch(e){return false;}
 }

 function ensureViewer(){
  let host=document.getElementById('ext-viewer');
  if(host)return host;
  host=document.createElement('div');host.id='ext-viewer';host.className='yt-modal';host.setAttribute('role','dialog');host.setAttribute('aria-modal','true');
  host.innerHTML=`<div class="yt-modal-card ext-viewer-card"><button type="button" class="yt-modal-x" aria-label="Close">✕</button><h2 class="yt-modal-title"></h2><div class="yt-modal-frame ext-viewer-frame"><iframe referrerpolicy="no-referrer-when-downgrade" title="External content"></iframe></div><p class="yt-modal-note" hidden></p><p class="yt-modal-actions"><a class="btn ghost yt-modal-ext ext-native" href="#" target="_blank" rel="noopener" data-native="1">Open in new tab ↗</a> <button type="button" class="btn ghost yt-modal-close">Close</button></p></div>`;
  document.body.appendChild(host);
  host.addEventListener('click',e=>{if(e.target===host||e.target.closest('.yt-modal-x')||e.target.closest('.yt-modal-close'))closeViewer();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeViewer();});
  return host;
 }
 let viewerTimer=null;let viewerFallback=null;
 function closeViewer(){const host=document.getElementById('ext-viewer');if(!host)return;clearTimeout(viewerTimer);viewerTimer=null;viewerFallback=null;host.classList.remove('open');document.body.classList.remove('yt-modal-open');const iframe=host.querySelector('iframe');if(iframe)iframe.src='about:blank';const note=host.querySelector('.yt-modal-note');if(note)note.hidden=true;}
 function openYtModal(id,title){
  const host=ensureViewer();clearTimeout(viewerTimer);viewerFallback=null;
  host.querySelector('.yt-modal-title').textContent=title||'Video';
  host.querySelector('.yt-modal-note').hidden=true;
  const iframe=host.querySelector('iframe');iframe.removeAttribute('sandbox');
  iframe.src='https://www.youtube-nocookie.com/embed/'+encodeURIComponent(id)+'?rel=0&modestbranding=1&playsinline=1';
  host.querySelector('.yt-modal-ext').href='https://www.youtube.com/watch?v='+encodeURIComponent(id);
  host.classList.add('open');document.body.classList.add('yt-modal-open');
  host.querySelector('.yt-modal-x').focus();
 }
 function showSheet(url,title){
  let host=document.getElementById('ext-sheet');
  if(!host){
   host=document.createElement('div');host.id='ext-sheet';host.className='yt-modal';host.setAttribute('role','dialog');host.setAttribute('aria-modal','true');
   host.innerHTML=`<div class="yt-modal-card"><button type="button" class="yt-modal-x" aria-label="Close">✕</button><h2 class="yt-modal-title">Open article</h2><p class="story-summary ext-sheet-sum"></p><p class="yt-modal-actions"><a class="btn primary ext-native ext-sheet-open" href="#" target="_blank" rel="noopener" data-native="1">Open article ↗</a> <button type="button" class="btn ghost ext-sheet-copy">Copy link</button> <button type="button" class="btn ghost yt-modal-close">Stay here</button></p></div>`;
   document.body.appendChild(host);
   host.addEventListener('click',e=>{if(e.target===host||e.target.closest('.yt-modal-x')||e.target.closest('.yt-modal-close')){host.classList.remove('open');document.body.classList.remove('yt-modal-open');}});
   host.querySelector('.ext-sheet-copy').addEventListener('click',()=>{const u=host.querySelector('.ext-sheet-open').href;const b=host.querySelector('.ext-sheet-copy');
    const done=()=>{b.textContent='Copied!';setTimeout(()=>b.textContent='Copy link',1500);};
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(u).then(done).catch(()=>{});
    else{try{const ta=document.createElement('textarea');ta.value=u;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();done();}catch(e){}}
   });
  }
  host.querySelector('.yt-modal-title').textContent=title||'Open article';
  host.querySelector('.ext-sheet-sum').textContent='This browser blocked opening a new tab. Use the button below to open the article (or copy the link into Safari/Chrome).';
  const a=host.querySelector('.ext-sheet-open');a.href=url;
  host.classList.add('open');document.body.classList.add('yt-modal-open');
 }
 function openNewTab(url){
  savePlace();
  let w=null;
  try{w=window.open(url,'_blank');}catch(e){w=null;}
  if(w){try{w.opener=null;}catch(e){}}
  return !!w;
 }
 function openExternal(url,a){
  savePlace();
  const id=ytId(url);
  if(id&&!noEmbed(a,url)&&!preferNative()){openYtModal(id,(a&&(a.getAttribute('aria-label')||a.textContent)||'Video').replace(/\s+/g,' ').trim());return true;}
  if(preferNative())return false; // let <a target=_blank> proceed
  if(noEmbed(a,url)||!likelyFrameable(url)){
   if(!openNewTab(url))showSheet(url,(a&&a.textContent||'Article').replace(/\s+/g,' ').trim());
   return true;
  }
  // known-frameable non-YT on desktop: still new tab (viewer optional)
  if(!openNewTab(url))showSheet(url,(a&&a.textContent||'Link').replace(/\s+/g,' ').trim());
  return true;
 }

 function onExtActivate(e){
  const a=e.target.closest?.('a[href]');if(!a||!isExt(a))return;
  if(a.closest?.('#ext-viewer')||a.closest?.('#ext-sheet'))return;
  if(a.classList.contains('ext-native')||a.dataset.native==='1'){harden(a);savePlace();return;} // real target=_blank
  harden(a);
  // iPad / in-app: do not preventDefault — Safari must see a direct user-activated <a target=_blank>.
  if(preferNative()){savePlace();return;}
  const handled=openExternal(a.href,a);
  if(handled){e.preventDefault();e.stopPropagation();if(typeof e.stopImmediatePropagation==='function')e.stopImmediatePropagation();}
 }
 document.addEventListener('click',onExtActivate,true);
 document.addEventListener('auxclick',e=>{if(e.button===1)onExtActivate(e);},true);

 // One-time banner for in-app / awkward WebViews (incl. iPad desktop-UA).
 function showBrowseBanner(){
  if(!preferNative())return;
  try{if(localStorage.getItem('bgd_browser_banner')==='1')return;}catch(e){}
  if(document.getElementById('bgd-browser-banner'))return;
  const bar=document.createElement('div');bar.id='bgd-browser-banner';bar.className='bgd-browser-banner';
  bar.innerHTML=`<p>For the best experience, open Black &amp; Gold Dispatch in <b>Safari</b> or <b>Chrome</b>.</p>
   <p class="bb-actions"><button type="button" class="btn ghost" data-bb-copy>Copy link</button> <button type="button" class="btn ghost" data-bb-dismiss>Dismiss</button></p>`;
  document.body.prepend(bar);
  bar.querySelector('[data-bb-dismiss]').onclick=()=>{try{localStorage.setItem('bgd_browser_banner','1');}catch(e){}bar.remove();};
  bar.querySelector('[data-bb-copy]').onclick=()=>{const u=location.href.split('#')[0]+(location.hash||'#/');
   const b=bar.querySelector('[data-bb-copy]');const done=()=>{b.textContent='Copied!';setTimeout(()=>b.textContent='Copy link',1500);};
   if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(u).then(done).catch(()=>{});
   else{try{const ta=document.createElement('textarea');ta.value=u;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();done();}catch(e){}}
  };
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',showBrowseBanner);else showBrowseBanner();

 const mo=new MutationObserver(ms=>{for(const m of ms){m.addedNodes.forEach(n=>{if(n.nodeType===1)scan(n);});}});
 const start=()=>{scan(document);try{mo.observe(document.documentElement,{childList:true,subtree:true});}catch(e){}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
 document.addEventListener('route',()=>setTimeout(()=>{scan(document);savePlace();},0));
 window.BGD_hardenExt=harden;window.BGD_scanExt=scan;window.BGD_openExternal=openExternal;window.BGD_ytModal=openYtModal;window.BGD_closeViewer=closeViewer;
 window.BGD_preferNative=preferNative;window.BGD_showSheet=showSheet;
})();




// Rumors & Updates sub-tabs (News & Rumors | Rumor Meter)
function ruTab(k,push){document.querySelectorAll('.ru-tabs .rr-tab').forEach(b=>{const on=b.dataset.ru===k;b.classList.toggle('on',on);b.setAttribute('aria-selected',on);});
 document.querySelectorAll('.ru-pane').forEach(p=>p.hidden=p.dataset.rup!==k);
 if(push){const h='#/rumors'+(k==='news'?'':'?tab='+k);if(location.hash!==h)history.replaceState(null,'',h);}
 if(k==='meter'){try{window.BGD_renderRumors&&window.BGD_renderRumors();}catch(e){}}}
document.addEventListener('click',e=>{const b=e.target.closest('.ru-tabs .rr-tab');if(b){ruTab(b.dataset.ru,true);}});
document.addEventListener('route',e=>{if(e.detail!=='rumors')return;const m=location.hash.match(/tab=(\w+)/);ruTab(m&&['news','meter'].includes(m[1])?m[1]:'news',true);});


