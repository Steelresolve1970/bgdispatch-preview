// Draft tab: Steelers needs, top prospects per need with availability estimate, last draft class + analyst grades (letter + link only),
// searchable archive of every Steelers pick (nflverse draft_picks, CC-BY 4.0), and links to outside draft resources.
(function(){
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ext='target="_blank" rel="noopener nofollow"';
let H=null,HI=null,need=null;const F={q:'',year:'',round:'',pos:''};let shown=50;
const gcls=g=>'g-'+(g||'').charAt(0).toLowerCase();
function needsHTML(){return`<section class="box needs-panel"><h2>Steelers Needs</h2>
 <p class="fine">${H.needs_mode==='automatic'?'Automatic ranking':'Owner-adjusted order'} · auto score from starter age, contracts, depth, player grades and analyst headlines (see NEEDS.md)</p>
 <ol class="needs-list">${H.needs.map((n,i)=>`<li><div class="nl-top"><span class="nl-rank">${i+1}</span><b>${E(n.label)}</b>${n.pinned?' <span class="badge">Owner pick</span>':''}<span class="nl-bar"><i style="width:${Math.min(100,n.score)}%"></i></span><span class="nl-score">${n.score}</span></div><ul>${n.reasons.map(x=>`<li>${E(x)}</li>`).join('')||'<li>Owner priority</li>'}</ul></li>`).join('')}</ol></section>`;}
function prospectsHTML(){need=need||H.needs[0].pos;const n=H.needs.find(x=>x.pos===need);
 return`<section><h2 class="section-title">Top ${H.draft_year} prospects by need</h2>
 <p class="page-sub">Steelers' projected picks: ${H.steelers_picks.map(p=>`Round ${p.round} (#${p.overall})`).join(', ')}, based on current standings. Our own board, not a consensus.</p>
 <div class="chips">${H.needs.map(x=>`<button type="button" class="chip dh-need${x.pos===need?' on':''}" data-p="${x.pos}">${E(x.label)}</button>`).join('')}</div>
 <div class="cl-list">${n.prospects.map(p=>`<article class="box cl-card"><div class="cl-head"><span class="dr-rank">#${p.rank}</span><div><h2><button type="button" class="pc-link" data-pc="${E(p.name)}" aria-label="Open player card for ${E(p.name)}">${E(p.name)}</button></h2><small>${E(p.pos)} · ${E(p.school)}${p.cls?' · '+E(p.cls):''}${window.PCard&&PCard.size(p.name)?' · '+E(PCard.size(p.name)):''} · ${E(p.tier)} · our grade ${p.grade}</small></div></div>
  ${p.realistic?'<p class="kind dark">Realistic target</p>':''}${availHTML(p.name,p.availability)}${window.compHTML?compHTML(p.name):''}
  ${p.season||p.line?`<p><b>2026:</b> ${E(p.season||p.line)}</p>`:''}${p.snippet&&p.snippet!==p.line?`<p class="cl-snip">${E(p.snippet)}</p>`:''}</article>`).join('')}</div>
 <details class="box dh-how"><summary>How "chance available" works</summary><p>${E(H.availability_method)}</p><p>Example: a player ranked #22 on our board has about a 50% chance of still being there at pick #22. The further a player ranks below the pick, the better the odds. Picks move as the standings change, so these numbers update with every run.</p></details></section>`;}
function classHTML(){const c=H.last_class,A=c.analysts||[];
 return`<section><h2 class="section-title">Last draft: ${c.year} Steelers class, graded pick by pick</h2>
 <div class="table-wrap"><table class="dh-table dh-pg"><thead><tr><th>Rd</th><th>Pick</th><th>Player</th><th>Pos</th><th>School</th>${A.map(a=>`<th title="${E(a.analyst)}"><a href="${E(a.url)}" ${ext}>${E(a.outlet)}</a></th>`).join('')}</tr></thead><tbody>
 ${c.picks.map(p=>`<tr><td>${p.round}</td><td>${p.pick}</td><td><b>${E(p.name)}</b></td><td>${E(p.pos)}</td><td>${E(p.school)}</td>${A.map(a=>{const g=(p.grades||{})[a.key];return`<td class="c">${g?`<a class="dh-letter sm ${gcls(g.grade)}" href="${E(g.url)}" ${ext} aria-label="${E(a.outlet)} grade ${E(g.grade)} for ${E(p.name)}">${E(g.grade)}</a>`:'<span class="dh-na" title="Not verified">–</span>'}</td>`;}).join('')}</tr>`).join('')}</tbody></table></div>
 <p class="fine">${E(c.grades_note)} Graders: ${A.map(a=>`${E(a.outlet)}: ${E(a.analyst)}`).join(' · ')}. Picks: nflverse (CC-BY 4.0).</p>
 ${c.team_grades.length?`<p class="dh-overall"><b>Overall class grades:</b> ${c.team_grades.map(g=>`<a href="${E(g.url)}" ${ext}>${E(g.outlet)}${g.analyst.startsWith('Mel')||g.analyst.startsWith('Chad')?' ('+E(g.analyst.split(' (')[0])+')':''} <b>${E(g.grade)}</b></a>`).join(' · ')}</p>`:''}</section>`;}
function filt(){const q=F.q.toLowerCase();return HI.picks.filter(p=>(!F.year||p.year==F.year)&&(!F.round||p.round==F.round)&&(!F.pos||p.pos===F.pos)&&(!q||(p.name+' '+p.school).toLowerCase().includes(q)));}
function archHTML(){const years=[...new Set(HI.picks.map(p=>p.year))],poss=[...new Set(HI.picks.map(p=>p.pos))].sort(),r=filt();
 return`<section id="dh-archive"><h2 class="section-title">Search past Steelers drafts <small>(${HI.first_year}–${HI.last_year})</small></h2>
 <div class="dr-tools dh-tools"><input type="search" class="dh-q" placeholder="Player or school" value="${E(F.q)}" aria-label="Search player or school">
 <select class="dh-f" data-k="year" aria-label="Year"><option value="">All years</option>${years.map(y=>`<option${F.year==y?' selected':''}>${y}</option>`).join('')}</select>
 <select class="dh-f" data-k="round" aria-label="Round"><option value="">All rounds</option>${[1,2,3,4,5,6,7,8,9,10,11,12].filter(n=>HI.picks.some(p=>p.round===n)).map(n=>`<option value="${n}"${F.round==n?' selected':''}>Round ${n}</option>`).join('')}</select>
 <select class="dh-f" data-k="pos" aria-label="Position"><option value="">All positions</option>${poss.map(p=>`<option${F.pos===p?' selected':''}>${E(p)}</option>`).join('')}</select></div>
 <p class="fine dh-count">${r.length} pick${r.length===1?'':'s'}</p>
 <div class="table-wrap"><table class="dh-table"><thead><tr><th>Year</th><th>Rd</th><th>Pick</th><th>Player</th><th>Pos</th><th>School</th><th>Games</th><th>Honors</th></tr></thead><tbody>
 ${r.slice(0,shown).map(p=>`<tr><td>${p.year}</td><td>${p.round}</td><td>${p.pick}</td><td><b>${E(p.name)}</b></td><td>${E(p.pos)}</td><td>${E(p.school)}</td><td>${p.games??''}</td><td>${[p.hof?'Hall of Fame':'',p.all_pro?p.all_pro+'× All-Pro':'',p.pro_bowls?p.pro_bowls+'× Pro Bowl':''].filter(Boolean).join(', ')}</td></tr>`).join('')||'<tr><td colspan="8" class="empty">No picks match</td></tr>'}</tbody></table></div>
 ${r.length>shown?`<p><button type="button" class="btn dh-more">Show more (${r.length-shown} left)</button></p>`:''}
 <p class="fine">Past drafts: <a href="${E(HI.credit_url)}" ${ext}>${E(HI.credit)}</a>.</p></section>`;}
function deeperHTML(){return`<section class="box"><h2>Go deeper on prospects</h2><ul class="dh-links">${H.go_deeper.map(l=>`<li><a href="${E(l.url)}" ${ext}><b>${E(l.name)}</b> →</a><small>${E(l.why)}</small></li>`).join('')}</ul><p class="fine">Outside sites, not affiliated with us. Try the <a href="#/draft">Mock Draft</a> to run your own picks.</p></section>`;}
function render(){const el=document.getElementById('drafthub-body');if(!el||!H||!HI)return;
 el.innerHTML=`<p class="box dh-cpt"><a href="#/college"><b>College Prospect Tracker →</b></a> <small>Live stats and weekly headlines for top prospects at our needs.</small></p>`+needsHTML()+prospectsHTML()+classHTML()+archHTML()+deeperHTML()+`<p class="fine">Credits: ${H.credits.map(E).join(' · ')}. Updated ${new Date(H.generated).toLocaleString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})} ET.</p>`;}
function rerenderArchive(focus){const a=document.getElementById('dh-archive');if(!a)return;const pos=focus&&document.activeElement===focus?focus.selectionStart:null;a.outerHTML=archHTML();if(pos!==null){const q=document.querySelector('.dh-q');q.focus();q.setSelectionRange(pos,pos);}}
Promise.all([...['data/draft/hub.json','data/draft/history.json'].map(u=>fetch(u,{cache:'no-store'}).then(r=>r.json())),window.compsReady,window.PCard&&PCard.ready]).then(([h,hi])=>{H=h;HI=hi;render();}).catch(()=>{const el=document.getElementById('drafthub-body');if(el)el.innerHTML='<p class="empty">Draft info unavailable right now.</p>';});
document.addEventListener('click',e=>{const n=e.target.closest('.dh-need');if(n){need=n.dataset.p;render();return;}if(e.target.closest('.dh-more')){shown+=100;rerenderArchive();}});
document.addEventListener('input',e=>{if(e.target.matches('.dh-q')){F.q=e.target.value;shown=50;rerenderArchive(e.target);}});
document.addEventListener('change',e=>{if(e.target.matches('.dh-f')){F[e.target.dataset.k]=e.target.value;shown=50;rerenderArchive();}});
})();
