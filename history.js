// Steelers History (expanded): renders data/history/*.json into #history-extra. Our own words; facts link to sources.
(function(){
const H={},FILES=['seasons','superbowls','halloffame','coaches','leaders','moments','hallofhonor','hof','ballots'];let loaded=false,decade='all';
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const X='target="_blank" rel="noopener nofollow"';const src=(u,t)=>u?`<a href="${esc(u)}" ${X}>${esc(t||'Source')}</a>`:'';
const SEC=[['h-seasons','Year by year'],['h-sb','Super Bowls'],['h-hof','Hall of Famers'],['h-coaches','Coaches & owners'],['h-leaders','Records & leaders'],['h-moments','Moments & rivals']];
function seasonsRows(){const s=H.seasons.seasons.filter(r=>decade==='all'||String(Math.floor(r.year/10)*10)===decade);
 return s.map(r=>{const sb=/Won Super Bowl/.test(r.playoffs),po=!!r.playoffs;const rec=`${r.w}–${r.l}${r.t?'–'+r.t:''}`;
  return `<tr class="${sb?'h-champ':''}"><td><b>${r.year}</b>${r.team!=='Steelers'?`<div class="h-sub">${esc(r.team)}</div>`:''}</td><td class="h-rec ${r.w>r.l?'h-win':r.w<r.l?'h-loss':''}">${rec}</td><td>${esc(r.finish)} <span class="h-sub">${esc(r.div)}</span></td><td class="h-po">${sb?'🏆 ':''}${po?esc(r.playoffs).replace(/; /g,'<br>'):'<span class="h-sub">—</span>'}</td><td class="h-coach">${esc(r.coach)}</td></tr>`;}).join('');}
function seasonsTable(){const tb=document.getElementById('h-season-rows');if(tb)tb.innerHTML=seasonsRows();
 document.querySelectorAll('.h-dec').forEach(b=>b.setAttribute('aria-pressed',b.dataset.d===decade));}
function sec(id,title,body,open){return `<details class="h-sec" id="${id}"${open?' open':''}><summary><h2>${title}</h2></summary><div class="h-body">${body}</div></details>`;}

const TABS=[['overview','Overview'],['honor','Hall of Honor'],['hof','Hall of Fame'],['vote','Fan Vote']];
function curTab(){const m=location.hash.match(/[?&]tab=(\w+)/);const t=m&&m[1];return TABS.some(x=>x[0]===t)?t:'overview';}
function tabsNav(cur){return `<div class="h-tabs" role="tablist" aria-label="History sections">${TABS.map(t=>`<a role="tab" href="#/history${t[0]==='overview'?'':'?tab='+t[0]}" aria-selected="${t[0]===cur}" class="h-tab${t[0]===cur?' on':''}">${t[1]}</a>`).join('')}</div>`;}
const srcs=a=>a.map(x=>src(x[0],x[1])).join(' · ');
const FOOT='<p class="fine">Black & Gold Dispatch is an unofficial fan site, not affiliated with the team or the league. Write-ups are in our own words; facts link to their sources.</p>';
let hq='',hcls='all',hgrp='all';
function honorRows(){const M=H.hallofhonor.members,q=hq.trim().toLowerCase();
 const r=M.filter(m=>(hcls==='all'||String(m.cls)===hcls)&&(hgrp==='all'||m.group===hgrp)&&(!q||(m.name+' '+m.pos+' '+m.text).toLowerCase().includes(q)));
 const out=document.getElementById('hoh-list'),cnt=document.getElementById('hoh-count');if(cnt)cnt.textContent=`Showing ${r.length} of ${M.length}`;
 if(out)out.innerHTML=r.length?r.map(m=>`<article class="hh-card"><div class="hh-top"><h3>${esc(m.name)}</h3><span class="hh-cls">Class of ${m.cls}</span></div><div class="hh-meta"><span class="h-pos">${esc(m.pos)}</span> <span class="h-sub">${esc(m.years)}</span>${m.hof?' <span class="hh-hof">Pro Football HOF</span>':''}</div><p>${esc(m.text)}</p></article>`).join(''):'<p class="empty">No members match. Try clearing the filters.</p>';}
function renderHonor(el){const D=H.hallofhonor,M=D.members;const cls=[...new Set(M.map(m=>m.cls))].sort(),grp=[...new Set(M.map(m=>m.group))].sort();
 const byC=cls.map(c=>`${c}: ${M.filter(m=>m.cls===c).length}`).join(' · ');
 el.innerHTML=tabsNav('honor')+`<section class="hh"><h2 class="hh-h">Steelers Hall of Honor <span class="h-sub">${M.length} members, 2017–${D.latest}</span></h2><p>${esc(D.note)}</p><p class="h-sub">Members per class: ${byC}</p>
 <div class="hh-filters"><input id="hoh-q" type="search" placeholder="Search names, positions…" aria-label="Search Hall of Honor" value="${esc(hq)}">
 <select id="hoh-cls" aria-label="Filter by class"><option value="all">All classes</option>${cls.map(c=>`<option value="${c}"${String(c)===hcls?' selected':''}>Class of ${c}</option>`).join('')}</select>
 <select id="hoh-grp" aria-label="Filter by position"><option value="all">All positions</option>${grp.map(g=>`<option${g===hgrp?' selected':''}>${esc(g)}</option>`).join('')}</select></div>
 <p class="h-sub" id="hoh-count"></p><div class="hh-grid" id="hoh-list"></div><p class="fine">Roster and years per the official list, cross-checked with other sources: ${srcs(D.sources)}. Updated ${esc(D.updated)}.</p>${FOOT}</section>`;honorRows();}
function hofCard(m){return `<article class="hh-card"><div class="hh-top"><h3>${esc(m.name)}</h3><span class="hh-cls">Inducted ${m.year}</span></div><div class="hh-meta"><span class="h-pos">${esc(m.pos)}</span> <span class="h-sub">Steelers ${esc(m.years)}</span></div><p>${esc(m.text)}</p></article>`;}
function renderHof(el){const D=H.hof;el.innerHTML=tabsNav('hof')+`<section class="hh"><h2 class="hh-h">Pro Football Hall of Famers <span class="h-sub">${D.players.length+D.builders.length} primarily Steelers</span></h2><p>${esc(D.note)}</p>
 <h3 class="h-h3">Players (${D.players.length})</h3><div class="hh-grid">${[...D.players].sort((a,b)=>a.year-b.year).map(hofCard).join('')}</div>
 <h3 class="h-h3">Coaches, owners & scouts (${D.builders.length})</h3><div class="hh-grid">${D.builders.map(hofCard).join('')}</div>
 <h3 class="h-h3">Brief Steelers stints (${D.brief.length})</h3><p class="h-sub">Hall of Famers inducted mainly for their work elsewhere.</p><ul class="h-list">${D.brief.map(m=>`<li><div><b>${esc(m.name)}</b> <span class="h-pos">${esc(m.pos)}</span> <span class="h-sub">Steelers ${esc(m.years)} · Inducted ${m.year}</span></div><div>${esc(m.text)}</div></li>`).join('')}</ul>
 <p class="fine">Sources: ${srcs(D.sources)}. Updated ${esc(D.updated)}. <a href="#/history?tab=vote">Vote on who should be next →</a></p>${FOOT}</section>`;}
const VKEY=id=>'bgd_vote_v1_'+id;
function getVote(id){try{return JSON.parse(localStorage.getItem(VKEY(id))||'null');}catch(e){return null;}}
const voteMsg={};
function ballotHtml(b){const v=getVote(b.id),edit=voteMsg[b.id]==='edit'||!v;
 if(!edit){const c=b.candidates.find(x=>x.id===v.choice);const name=v.choice==='write-in'?v.writeIn:(c?c.name:v.choice);
  return `<section class="hv" id="bal-${b.id}"><h2 class="hh-h">${esc(b.title)}</h2><div class="hv-res"><p class="hv-ok">✅ <b>Your vote saved; community totals launch with member accounts.</b></p><p>Your pick: <b>${esc(name)}</b>${v.choice==='write-in'?' <span class="h-sub">(write-in)</span>':''}</p><p class="h-sub">Saved on this device ${esc(new Date(v.votedAt).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}))}. One vote per ballot per device; you can change it anytime.</p><button class="hv-btn hv-change" data-b="${b.id}">Change my vote</button></div></section>`;}
 return `<section class="hv" id="bal-${b.id}"><h2 class="hh-h">${esc(b.title)}</h2><p class="h-sub">${esc(b.note)}</p><form class="hv-form" data-b="${b.id}"><fieldset><legend class="sr-only">${esc(b.title)}</legend>
 ${b.candidates.map(c=>`<label class="hv-opt"><input type="radio" name="v-${b.id}" value="${c.id}"${v&&v.choice===c.id?' checked':''}><span><b>${esc(c.name)}</b> <span class="h-sub">${esc(c.info)}</span><br><span class="hv-txt">${esc(c.text)}</span></span></label>`).join('')}
 <label class="hv-opt"><input type="radio" name="v-${b.id}" value="write-in"${v&&v.choice==='write-in'?' checked':''}><span><b>Write-in</b><br><input type="text" class="hv-wi" maxlength="60" placeholder="Name a former Steeler" aria-label="Write-in name" value="${v&&v.choice==='write-in'?esc(v.writeIn):''}"></span></label></fieldset>
 <p class="hv-err" role="alert"></p><button type="submit" class="hv-btn">Save my vote</button></form></section>`;}
function renderVote(el){const D=H.ballots;el.innerHTML=tabsNav('vote')+`<div class="hh"><p>Two fan ballots. Pick one name on each, or write one in. Votes are saved on this device for now; community totals launch with member accounts.</p>${D.ballots.map(ballotHtml).join('')}<p class="fine">Eligibility checked against the Pro Football Hall of Fame Class of 2026 and the official Steelers Hall of Honor list through the Class of 2026. Sources: ${srcs(H.hof.sources)} · ${srcs(H.hallofhonor.sources.slice(0,1))}.</p>${FOOT}</div>`;}
document.addEventListener('submit',e=>{const f=e.target.closest('.hv-form');if(!f)return;e.preventDefault();const id=f.dataset.b;const r=f.querySelector('input[type=radio]:checked');const err=f.querySelector('.hv-err');
 if(!r){err.textContent='Pick a name first.';return;}let wi='';if(r.value==='write-in'){wi=f.querySelector('.hv-wi').value.trim().replace(/\s+/g,' ');if(wi.length<3){err.textContent='Type a name for your write-in.';return;}}
 const rec={ballot:id,choice:r.value,writeIn:wi,votedAt:new Date().toISOString(),schema:1,synced:false};
 try{localStorage.setItem(VKEY(id),JSON.stringify(rec));}catch(x){err.textContent='⚠️ Your browser blocked saving (private browsing may do this). Try a regular browser window.';return;}
 delete voteMsg[id];const s=document.getElementById('bal-'+id);if(s)s.outerHTML=ballotHtml(H.ballots.ballots.find(b=>b.id===id));});
document.addEventListener('focusin',e=>{if(e.target.classList&&e.target.classList.contains('hv-wi')){const r=e.target.closest('.hv-opt').querySelector('input[type=radio]');if(r)r.checked=true;}});
document.addEventListener('input',e=>{if(e.target.id==='hoh-q'){hq=e.target.value;honorRows();}});
document.addEventListener('change',e=>{if(e.target.id==='hoh-cls'){hcls=e.target.value;honorRows();}if(e.target.id==='hoh-grp'){hgrp=e.target.value;honorRows();}});
function render(){const el=document.getElementById('history-extra');if(!el)return;const t=curTab();const hb=document.getElementById('history-body');if(hb)hb.hidden=t!=='overview';
 if(t==='honor')return renderHonor(el);if(t==='hof')return renderHof(el);if(t==='vote')return renderVote(el);
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
 const hof=`<p><b>${H.hof.players.length+H.hof.builders.length}</b> Pro Football Hall of Famers made their names in Pittsburgh: ${H.hof.players.length} players and ${H.hof.builders.length} coaches, owners and scouts. Another ${H.hof.brief.length} passed through briefly. <a href="#/history?tab=hof"><b>See every Hall of Famer with a write-up →</b></a> · <a href="#/history?tab=honor">Steelers Hall of Honor (${H.hallofhonor.members.length} members) →</a></p>
  <h3 class="h-h3">All-time greats not (yet) in Canton</h3><ul class="h-list">${F.greats.map(p=>row(p,0)).join('')}</ul><p class="fine">${esc(F.retired)} <a href="#/history?tab=vote">Vote on who should be next →</a></p>`;
 const co=`<h3 class="h-h3">Owners</h3><ul class="h-list">${C.owners.map(o=>`<li><div><b>${esc(o[0])}</b> <span class="h-sub">${esc(o[1])}</span></div><div>${esc(o[2])}</div></li>`).join('')}</ul>
  <h3 class="h-h3">Head coaches</h3><div class="h-tbl"><table><thead><tr><th>Coach</th><th>Years</th><th>Record</th><th>Playoffs</th><th>Notes</th></tr></thead><tbody>${C.coaches.map(c=>`<tr><td><b>${esc(c[0])}</b></td><td>${esc(c[1])}</td><td>${esc(c[2])}</td><td>${esc(c[3])}</td><td>${esc(c[4])}</td></tr>`).join('')}</tbody></table></div><p class="fine">${esc(C.note)} Sources: ${src(C.source,'Wikipedia')} · ${src(C.source2,'Pro-Football-Reference')}.</p>`;
 const ld=`<p class="h-sub">${esc(L.through)}</p><div class="h-leaders">${L.cats.map(c=>`<div class="h-lead"><h3>${esc(c[0])}</h3><ol>${c[1].map(p=>`<li><span>${esc(p[0])}</span><b>${esc(p[1])}</b></li>`).join('')}</ol></div>`).join('')}</div>
  <h3 class="h-h3">Single-season and team marks</h3><ul class="h-list h-compact">${L.season.map(s=>`<li><div><b>${esc(s[0])}</b></div><div>${esc(s[1])}</div></li>`).join('')}</ul><p class="fine">${esc(L.footnote)} ${esc(L.check)} Sources: ${src(L.source,'Wikipedia team records')} · ${src(L.source2,'Pro-Football-Reference')}.</p>`;
 const mo=`<div class="h-cards">${M.moments.map(m=>`<article class="h-card"><div class="h-sub">${esc(m.when)}</div><h3>${esc(m.title)}</h3><p>${esc(m.text)}</p><p class="h-src">${src(m.link)}</p></article>`).join('')}</div>
  <h3 class="h-h3">Rivalries</h3><div class="h-cards">${M.rivals.map(r=>`<article class="h-card"><h3>${esc(r.team)}</h3><p class="h-sub">Since 1999: <b>${esc(r.since1999)}</b> · Playoffs: <b>${esc(r.playoffs)}</b></p><p>${esc(r.text)}</p><p class="h-src">${src(r.link)}</p></article>`).join('')}</div><p class="fine">${esc(M.rivals_note)}</p>`;
 el.innerHTML=tabsNav('overview')+`<nav class="h-jump" aria-label="Jump to section">${SEC.map(s=>`<button data-j="${s[0]}">${s[1]}</button>`).join('')}</nav>
 ${sec('h-seasons','Year-by-year records, 1933–'+S.seasons.at(-1).year,yrs,true)}${sec('h-sb','Six Super Bowl titles',sbs,true)}${sec('h-hof','Hall of Famers & all-time greats',hof)}${sec('h-coaches','Coaches & owners',co)}${sec('h-leaders','Team records & all-time leaders',ld)}${sec('h-moments','Famous moments & rivalries',mo)}
 <p class="fine">Black & Gold Dispatch is an unofficial fan site, not affiliated with the team or the league. Everything here is written in our own words; facts link to their sources.</p>`;
 seasonsTable();}
document.addEventListener('click',e=>{const ch=e.target.closest('.hv-change');if(ch){voteMsg[ch.dataset.b]='edit';const b=H.ballots.ballots.find(x=>x.id===ch.dataset.b);document.getElementById('bal-'+b.id).outerHTML=ballotHtml(b);return;}
 const d=e.target.closest('.h-dec');if(d){decade=d.dataset.d;seasonsTable();return;}
 const j=e.target.closest('.h-jump button');if(j){const t=document.getElementById(j.dataset.j);if(t){t.open=true;t.scrollIntoView({behavior:'smooth',block:'start'});}}});
function load(){if(loaded){render();return;}Promise.all(FILES.map(f=>fetch('data/history/'+f+'.json',{cache:'no-store'}).then(r=>r.json()))).then(a=>{FILES.forEach((f,i)=>H[f]=a[i]);loaded=true;render();}).catch(()=>{const el=document.getElementById('history-extra');if(el)el.innerHTML='<p class="empty">History data could not load. Try reloading.</p>';});}
document.addEventListener('route',e=>{if(e.detail==='history')load();});
if(/^#\/history/.test(location.hash))load();
})();
