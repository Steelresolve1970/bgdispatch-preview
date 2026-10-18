// Steelers History (expanded): renders data/history/*.json into #history-extra. Our own words; facts link to sources.
(function(){
const H={},FILES=['seasons','superbowls','halloffame','coaches','leaders','moments'];let loaded=false,decade='all';
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const X='target="_blank" rel="noopener nofollow"';const src=(u,t)=>u?`<a href="${esc(u)}" ${X}>${esc(t||'Source')}</a>`:'';
const SEC=[['h-seasons','Year by year'],['h-sb','Super Bowls'],['h-hof','Hall of Famers'],['h-coaches','Coaches & owners'],['h-leaders','Records & leaders'],['h-moments','Moments & rivals']];
function seasonsRows(){const s=H.seasons.seasons.filter(r=>decade==='all'||String(Math.floor(r.year/10)*10)===decade);
 return s.map(r=>{const sb=/Won Super Bowl/.test(r.playoffs),po=!!r.playoffs;const rec=`${r.w}–${r.l}${r.t?'–'+r.t:''}`;
  return `<tr class="${sb?'h-champ':''}"><td><b>${r.year}</b>${r.team!=='Steelers'?`<div class="h-sub">${esc(r.team)}</div>`:''}</td><td class="h-rec ${r.w>r.l?'h-win':r.w<r.l?'h-loss':''}">${rec}</td><td>${esc(r.finish)} <span class="h-sub">${esc(r.div)}</span></td><td class="h-po">${sb?'🏆 ':''}${po?esc(r.playoffs).replace(/; /g,'<br>'):'<span class="h-sub">—</span>'}</td><td class="h-coach">${esc(r.coach)}</td></tr>`;}).join('');}
function seasonsTable(){const tb=document.getElementById('h-season-rows');if(tb)tb.innerHTML=seasonsRows();
 document.querySelectorAll('.h-dec').forEach(b=>b.setAttribute('aria-pressed',b.dataset.d===decade));}
function sec(id,title,body,open){return `<details class="h-sec" id="${id}"${open?' open':''}><summary><h2>${title}</h2></summary><div class="h-body">${body}</div></details>`;}
function render(){const el=document.getElementById('history-extra');if(!el)return;
 const S=H.seasons,B=H.superbowls,F=H.halloffame,C=H.coaches,L=H.leaders,M=H.moments;
 const decs=[...new Set(S.seasons.map(r=>String(Math.floor(r.year/10)*10)))];
 const playoff=S.seasons.reduce((a,r)=>{(r.playoffs.match(/Won/g)||[]).forEach(()=>a[0]++);(r.playoffs.match(/Lost/g)||[]).forEach(()=>a[1]++);return a},[0,0]);
 const yrs=`<div class="h-stats"><div><b>${S.totals.w}–${S.totals.l}–${S.totals.t}</b><span>regular season, 1933–${S.seasons.at(-1).year}*</span></div><div><b>${playoff[0]}–${playoff[1]}</b><span>playoffs</span></div><div><b>6</b><span>Super Bowl wins</span></div><div><b>${S.seasons.filter(r=>r.playoffs).length}</b><span>playoff seasons</span></div></div>
 <div class="h-decs" role="group" aria-label="Filter by decade"><button class="h-dec" data-d="all">All</button>${decs.map(d=>`<button class="h-dec" data-d="${d}">${d}s</button>`).join('')}</div>
 <div class="h-tbl"><table><thead><tr><th>Year</th><th>W–L</th><th>Finish</th><th>Playoffs</th><th>Coach</th></tr></thead><tbody id="h-season-rows"></tbody></table></div>
 <p class="fine">*Franchise totals leave out 1943 and 1944, when wartime player shortages forced merged teams with the Eagles and Cardinals; those rows are shown for reference. Gold rows are Super Bowl seasons. Sources: ${src(S.source,'Wikipedia season list')} · ${src(S.source2,'Pro-Football-Reference')}. ${esc(S.check)}.</p>`;
 const sbs=`<div class="h-cards">${B.wins.map(g=>`<article class="h-card"><div class="h-card-top"><span class="h-trophy">🏆</span><div><h3>${esc(g.game)}</h3><div class="h-sub">${esc(g.date)} · ${esc(g.site)}</div></div></div>
  <p class="h-score">Steelers ${esc(g.score)} ${esc(g.opp)}</p><p class="h-sub">MVP: <b>${esc(g.mvp)}</b> · ${g.season} season</p><p>${esc(g.story)}</p><ul>${g.plays.map(p=>`<li>${esc(p)}</li>`).join('')}</ul><p class="h-src">${src(g.link)}</p></article>`).join('')}</div>
  <h3 class="h-h3">The two that got away</h3><div class="h-cards">${B.losses.map(g=>`<article class="h-card h-lost"><h3>${esc(g.game)}</h3><div class="h-sub">${esc(g.date)} · ${esc(g.site)}</div><p class="h-score">Steelers ${esc(g.score)} ${esc(g.opp)}</p><p class="h-sub">MVP: ${esc(g.mvp)}</p><p>${esc(g.note)}</p><p class="h-src">${src(g.link)}</p></article>`).join('')}</div>`;
 const row=(p,y)=>`<li><div><b>${esc(p[0])}</b> <span class="h-pos">${esc(p[1])}</span> <span class="h-sub">${esc(p[2])}${y?` · Inducted ${p[3]}`:''}</span></div><div>${esc(y?p[4]:p[3])}</div></li>`;
 const hof=`<p>${esc(F.note)}</p><h3 class="h-h3">Players</h3><ul class="h-list">${F.players.map(p=>row(p,1)).join('')}</ul><h3 class="h-h3">Coaches, owners & scouts</h3><ul class="h-list">${F.builders.map(p=>row(p,1)).join('')}</ul><p class="fine">${esc(F.others)}</p>
  <h3 class="h-h3">All-time greats not (yet) in Canton</h3><ul class="h-list">${F.greats.map(p=>row(p,0)).join('')}</ul><p class="fine">${esc(F.retired)} Sources: ${src(F.source,'Wikipedia')} · ${src(F.source2,'Pro Football Hall of Fame')}.</p>`;
 const co=`<h3 class="h-h3">Owners</h3><ul class="h-list">${C.owners.map(o=>`<li><div><b>${esc(o[0])}</b> <span class="h-sub">${esc(o[1])}</span></div><div>${esc(o[2])}</div></li>`).join('')}</ul>
  <h3 class="h-h3">Head coaches</h3><div class="h-tbl"><table><thead><tr><th>Coach</th><th>Years</th><th>Record</th><th>Playoffs</th><th>Notes</th></tr></thead><tbody>${C.coaches.map(c=>`<tr><td><b>${esc(c[0])}</b></td><td>${esc(c[1])}</td><td>${esc(c[2])}</td><td>${esc(c[3])}</td><td>${esc(c[4])}</td></tr>`).join('')}</tbody></table></div><p class="fine">${esc(C.note)} Sources: ${src(C.source,'Wikipedia')} · ${src(C.source2,'Pro-Football-Reference')}.</p>`;
 const ld=`<p class="h-sub">${esc(L.through)}</p><div class="h-leaders">${L.cats.map(c=>`<div class="h-lead"><h3>${esc(c[0])}</h3><ol>${c[1].map(p=>`<li><span>${esc(p[0])}</span><b>${esc(p[1])}</b></li>`).join('')}</ol></div>`).join('')}</div>
  <h3 class="h-h3">Single-season and team marks</h3><ul class="h-list h-compact">${L.season.map(s=>`<li><div><b>${esc(s[0])}</b></div><div>${esc(s[1])}</div></li>`).join('')}</ul><p class="fine">${esc(L.footnote)} ${esc(L.check)} Sources: ${src(L.source,'Wikipedia team records')} · ${src(L.source2,'Pro-Football-Reference')}.</p>`;
 const mo=`<div class="h-cards">${M.moments.map(m=>`<article class="h-card"><div class="h-sub">${esc(m.when)}</div><h3>${esc(m.title)}</h3><p>${esc(m.text)}</p><p class="h-src">${src(m.link)}</p></article>`).join('')}</div>
  <h3 class="h-h3">Rivalries</h3><div class="h-cards">${M.rivals.map(r=>`<article class="h-card"><h3>${esc(r.team)}</h3><p class="h-sub">Since 1999: <b>${esc(r.since1999)}</b> · Playoffs: <b>${esc(r.playoffs)}</b></p><p>${esc(r.text)}</p><p class="h-src">${src(r.link)}</p></article>`).join('')}</div><p class="fine">${esc(M.rivals_note)}</p>`;
 el.innerHTML=`<nav class="h-jump" aria-label="Jump to section">${SEC.map(s=>`<button data-j="${s[0]}">${s[1]}</button>`).join('')}</nav>
 ${sec('h-seasons','Year-by-year records, 1933–'+S.seasons.at(-1).year,yrs,true)}${sec('h-sb','Six Super Bowl titles',sbs,true)}${sec('h-hof','Hall of Famers & all-time greats',hof)}${sec('h-coaches','Coaches & owners',co)}${sec('h-leaders','Team records & all-time leaders',ld)}${sec('h-moments','Famous moments & rivalries',mo)}
 <p class="fine">Black & Gold Dispatch is an unofficial fan site, not affiliated with the team or the league. Everything here is written in our own words; facts link to their sources.</p>`;
 seasonsTable();}
document.addEventListener('click',e=>{const d=e.target.closest('.h-dec');if(d){decade=d.dataset.d;seasonsTable();return;}
 const j=e.target.closest('.h-jump button');if(j){const t=document.getElementById(j.dataset.j);if(t){t.open=true;t.scrollIntoView({behavior:'smooth',block:'start'});}}});
function load(){if(loaded){render();return;}Promise.all(FILES.map(f=>fetch('data/history/'+f+'.json',{cache:'no-store'}).then(r=>r.json()))).then(a=>{FILES.forEach((f,i)=>H[f]=a[i]);loaded=true;render();}).catch(()=>{const el=document.getElementById('history-extra');if(el)el.innerHTML='<p class="empty">History data could not load. Try reloading.</p>';});}
document.addEventListener('route',e=>{if(e.detail==='history')load();});
if(/^#\/history/.test(location.hash))load();
})();
