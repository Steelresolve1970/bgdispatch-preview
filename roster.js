// Depth Chart & Roster page: section tabs, Practice Squad list, full Roster table and player cards (data/roster/*.json, nflverse CC-BY 4.0).
(function(){
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id);
let R=null,P=null,pReady=null,sortK='num',sortD=1,q='',grp='All';
const TEAM={ARI:'Cardinals',ATL:'Falcons',BAL:'Ravens',BUF:'Bills',CAR:'Panthers',CHI:'Bears',CIN:'Bengals',CLE:'Browns',DAL:'Cowboys',DEN:'Broncos',DET:'Lions',GB:'Packers',HOU:'Texans',IND:'Colts',JAX:'Jaguars',KC:'Chiefs',LV:'Raiders',OAK:'Raiders',LAC:'Chargers',SD:'Chargers',LA:'Rams',STL:'Rams',MIA:'Dolphins',MIN:'Vikings',NE:'Patriots',NO:'Saints',NYG:'Giants',NYJ:'Jets',PHI:'Eagles',PIT:'Steelers',SF:'49ers',SEA:'Seahawks',TB:'Buccaneers',TEN:'Titans',WAS:'Commanders'};
const tn=t=>TEAM[t]||t;
// ---- tabs ----
function tab(k,push){document.querySelectorAll('.rr-tab').forEach(b=>{const on=b.dataset.rr===k;b.classList.toggle('on',on);b.setAttribute('aria-selected',on);});
 document.querySelectorAll('.rr-pane').forEach(p=>p.hidden=p.dataset.rrp!==k);
 if(push){const h='#/roster'+(k==='depth'?'':'?tab='+k);if(location.hash!==h)history.replaceState(null,'',h);}
 if(k==='ps'||k==='roster')load();}
document.addEventListener('click',e=>{const b=e.target.closest('.rr-tab');if(b){tab(b.dataset.rr,true);}});
document.addEventListener('route',e=>{if(e.detail!=='roster')return;const m=location.hash.match(/tab=(\w+)/);tab(m&&['depth','ps','roster'].includes(m[1])?m[1]:'depth',true);});
// ---- data ----
function load(){if(R)return Promise.resolve(R);return fetch('data/roster/roster.json',{cache:'no-store'}).then(r=>r.json()).then(j=>{R=j;renderPS();renderRoster();return R;}).catch(()=>{const t='<p class="empty">Roster data is not available right now.</p>';$('ps-body').innerHTML=t;$('roster-body').innerHTML=t;});}
function loadP(){return pReady||(pReady=fetch('data/roster/players.json',{cache:'no-store'}).then(r=>r.json()).then(j=>P=j.players));}
const asof=()=>`<p class="fine">nflverse roster data through Week ${R.nflverse_week} of ${R.season} (file updated ${new Date(R.nflverse_file_updated).toLocaleString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})} ET). Same-day signings and IR moves can take a day or two to show up. Tap a player for his card.</p>`;
const nb=x=>x.num?'#'+E(x.num):'—';
function renderPS(){if(!R)return;const ps=R.players.filter(p=>p.group==='Practice squad').sort((a,b)=>(+a.num||999)-(+b.num||999));
 $('ps-body').innerHTML=asof()+`<p class="rr-count"><b>${ps.length}</b> players on the practice squad</p><div class="box rr-ps">${ps.map(p=>`<button type="button" class="rr-row" data-pid="${E(p.id)}"><span class="rr-n">${nb(p)}</span><span class="rr-nm"><b>${E(p.name)}</b><small>${E(p.college||'')}</small></span><span class="rr-pos">${E(p.pos)}</span><span class="rr-st">${p.status!=='Practice squad'?E(p.status.replace('Practice squad ','')):''}</span></button>`).join('')}</div>`;}
const COLS=[['num','#'],['name','Name'],['pos','Pos'],['height','Ht'],['weight','Wt'],['age','Age'],['exp','Exp'],['college','College']];
const hin=h=>{const m=/(\d+)'(\d+)/.exec(h||'');return m?+m[1]*12+ +m[2]:0;};
function val(p,k){if(k==='num')return +p.num||999;if(k==='height')return hin(p.height);if(['weight','age','exp'].includes(k))return p[k]??-1;return String(p[k]||'').toLowerCase();}
function renderRoster(){if(!R)return;const el=$('roster-body');const c=R.counts;
 const head=asof()+`<p class="rr-count"><b>${c['Active roster']}</b> active · <b>${c['Practice squad']}</b> practice squad · <b>${c['Reserve / IR']}</b> reserve/IR</p>
 <div class="rr-tools"><input type="search" id="rr-q" placeholder="Search name, position, college…" aria-label="Search roster" value="${E(q)}">
 <select id="rr-g" aria-label="Filter by group">${['All','Active roster','Practice squad','Reserve / IR'].map(g=>`<option${g===grp?' selected':''}>${g}</option>`).join('')}</select></div><div id="rr-table"></div>`;
 if(!$('rr-table'))el.innerHTML=head;table();}
function table(){const qq=q.trim().toLowerCase();
 const rows=R.players.filter(p=>(grp==='All'||p.group===grp)&&(!qq||[p.name,p.pos,p.college,p.num].join(' ').toLowerCase().includes(qq)));
 rows.sort((a,b)=>{const x=val(a,sortK),y=val(b,sortK);return (x>y?1:x<y?-1:0)*sortD;});
 const groups=['Active roster','Practice squad','Reserve / IR'].filter(g=>grp==='All'||g===grp);
 $('rr-table').innerHTML=groups.map(g=>{const rs=rows.filter(p=>p.group===g);if(!rs.length)return'';
  return`<h3 class="rr-gh">${g} <small>(${rs.length})</small></h3><div class="box rr-wrap"><table class="rr-t"><thead><tr>${COLS.map(([k,l])=>`<th class="c-${k}"><button type="button" class="rr-sort" data-k="${k}" aria-label="Sort by ${l}">${l}${sortK===k?(sortD>0?' ▲':' ▼'):''}</button></th>`).join('')}</tr></thead><tbody>
  ${rs.map(p=>`<tr data-pid="${E(p.id)}" tabindex="0"><td class="c-num">${nb(p)}</td><td class="c-name"><b>${E(p.name)}</b>${p.group!=='Active roster'&&p.status!==g?`<small>${E(p.status)}</small>`:''}</td><td class="c-pos">${E(p.pos)}</td><td class="c-height">${E(p.height)}</td><td class="c-weight">${p.weight??''}</td><td class="c-age">${p.age??''}</td><td class="c-exp">${p.exp===0?'R':p.exp}</td><td class="c-college">${E(p.college)}</td></tr>`).join('')}</tbody></table></div>`;}).join('')||'<p class="empty">No players match.</p>';}
document.addEventListener('input',e=>{if(e.target.id==='rr-q'){q=e.target.value;table();}});
document.addEventListener('change',e=>{if(e.target.id==='rr-g'){grp=e.target.value;table();}});
document.addEventListener('click',e=>{const s=e.target.closest('.rr-sort');if(s){const k=s.dataset.k;sortD=sortK===k?-sortD:1;sortK=k;table();return;}
 const r=e.target.closest('[data-pid]');if(r&&r.closest('#roster-body,#ps-body'))openCard(r.dataset.pid);});
document.addEventListener('keydown',e=>{if(e.key==='Enter'){const r=e.target.closest&&e.target.closest('tr[data-pid]');if(r)openCard(r.dataset.pid);}if(e.key==='Escape')close();});
// ---- player card ----
const ord=n=>n+(['th','st','nd','rd'][(n%100-20)%10]||['th','st','nd','rd'][n%100]||'th');
function entry(e){if(e.type==='drafted')return`${e.year} NFL Draft${e.round?`, round ${e.round}, pick ${e.pick} (${ord(e.pick)} overall)`:`, ${ord(e.pick)} overall`}, by the ${E(e.team_name)}`;
 return`Undrafted free agent, ${e.year||'year unknown'}${e.team_name?`, signed by the ${E(e.team_name)}`:''}${e.verified?' (no draft record in nflverse)':''}`;}
function tbl(title,cols,rows){if(!rows.length)return'';return`<h3>${title}</h3><div class="rr-wrap"><table class="rr-st-t"><thead><tr><th>Year</th><th>Tm</th>${cols.map(c=>`<th>${c[0]}</th>`).join('')}</tr></thead><tbody>${rows.map(([s,o])=>`<tr><td>${s.season}</td><td>${E(s.team)}</td>${cols.map(c=>`<td>${typeof c[1]==='function'?c[1](o):(o[c[1]]??'')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
function stats(p){const S=p.seasons,pick=k=>S.filter(s=>s[k]).map(s=>[s,s[k]]);
 let h=tbl('Games','',[]);
 h=`<h3>Games played &amp; started</h3>${S.length?`<div class="rr-wrap"><table class="rr-st-t"><thead><tr><th>Year</th><th>Tm</th><th>G</th><th>GS*</th><th>Off snaps</th><th>Def snaps</th><th>ST snaps</th></tr></thead><tbody>${S.map(s=>`<tr><td>${s.season}</td><td>${E(s.team)}</td><td>${s.g}</td><td>${s.gs??'–'}</td><td>${s.snaps?s.snaps.off:'–'}</td><td>${s.snaps?s.snaps.def_:'–'}</td><td>${s.snaps?s.snaps.st:'–'}</td></tr>`).join('')}</tbody></table></div><p class="fine">*Starts = games with 50%+ of offensive or defensive snaps (nflverse has no official starts field). Snap data begins in 2012; earlier seasons count games with a recorded stat. Regular season only.</p>`:'<p>No regular-season games played yet.</p>'}`;
 h+=tbl('Passing',[['Cmp','cmp'],['Att','att'],['Yds','yds'],['TD','td'],['INT','int'],['Sk','sk'],['Rate','rate']],pick('pass'));
 h+=tbl('Rushing',[['Att','att'],['Yds','yds'],['Avg',o=>o.att?(o.yds/o.att).toFixed(1):''],['TD','td'],['FL','fum']],pick('rush'));
 h+=tbl('Receiving',[['Tgt','tgt'],['Rec','rec'],['Yds','yds'],['TD','td']],pick('rec'));
 h+=tbl('Defense',[['Tkl','tkl'],['Solo','solo'],['TFL','tfl'],['Sacks','sk'],['QBH','qbh'],['INT','int'],['PD','pd'],['FF','ff']],pick('def'));
 h+=tbl('Kicking',[['FGM','fgm'],['FGA','fga'],['Pct',o=>o.fga?Math.round(100*o.fgm/o.fga)+'%':''],['Long','lng'],['XPM','xpm'],['XPA','xpa']],pick('kick'));
 h+=tbl('Punting',[['Punts','punts'],['Yds','yds'],['Avg','avg'],['Net','net'],['In 20','in20'],['Long','lng']],pick('punt'));
 h+=tbl('Returns',[['KR','kr'],['KR yds','kryds'],['PR','pr'],['PR yds','pryds']],pick('ret'));
 if(!S.some(s=>s.pass||s.rush||s.rec||s.def||s.kick||s.punt||s.ret))h+=`<p class="rr-none">No box-score stats on record${['OL','T','G','C','LS'].includes(p.pos)?' (offensive linemen and long snappers do not get individual box-score stats)':' yet'}.</p>`;
 return h;}
function career(p){const segs=[];p.career.forEach(c=>{const t=c.teams.join('/');const l=segs[segs.length-1];if(l&&l.t===t)l.b=c.season;else segs.push({t,a:c.season,b:c.season});});
 return segs.length?`<ul class="rr-career">${segs.map(s=>`<li><b>${s.a===s.b?s.a:s.a+'–'+s.b}</b> ${s.t.split('/').map(tn).map(E).join(' / ')}</li>`).join('')}</ul>${p.joined_pit?`<p>Joined the Steelers: <b>${p.joined_pit}</b> season</p>`:''}`:'<p>No NFL roster history in nflverse yet.</p>';}
const bd=b=>b?new Date(b+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'';
function card(p){return`<div class="dr-modal rr-modal" role="dialog" aria-modal="true" aria-label="${E(p.name)}"><div class="dr-card rr-card"><button class="dr-x" type="button" aria-label="Close">✕</button>
 <p class="kind">${E(p.group)}${p.status!==p.group?' · '+E(p.status):''}</p><h2>${p.num?'#'+E(p.num)+' ':''}${E(p.name)}</h2>
 <dl class="rr-bio"><div><dt>Position</dt><dd>${E(p.pos)}</dd></div><div><dt>Height</dt><dd>${E(p.height)||'–'}</dd></div><div><dt>Weight</dt><dd>${p.weight?p.weight+' lb':'–'}</dd></div><div><dt>Age</dt><dd>${p.age??'–'}</dd></div><div><dt>Born</dt><dd>${bd(p.birthdate)||'–'}</dd></div><div><dt>College</dt><dd>${E(p.college)||'–'}</dd></div><div><dt>NFL exp.</dt><dd>${p.exp===0?'Rookie':p.exp+' yr'+(p.exp>1?'s':'')}</dd></div><div><dt>Rookie year</dt><dd>${p.rookie_year||'–'}</dd></div></dl>
 <h3>How he entered the league</h3><p>${entry(p.entry)}</p>
 <div class="rr-take"><b>Our take</b><p>${E(p.take)}</p></div>
 <h3>Career path</h3>${career(p)}
 ${stats(p)}
 <p class="fine">Data: nflverse (CC-BY 4.0). "Our take" is written by Black &amp; Gold Dispatch from this data.</p>
 <button class="btn pc-close" type="button">Close</button></div></div>`;}
let host=null,last=null;
function close(){if(host){host.remove();host=null;document.body.classList.remove('pc-open');last&&last.focus&&last.focus();}}
function openCard(id){loadP().then(()=>{const p=P&&P[id];if(!p)return;close();last=document.activeElement;host=document.createElement('div');host.className='pc-host';host.innerHTML=card(p);document.body.appendChild(host);document.body.classList.add('pc-open');host.querySelector('.dr-x').focus();});}
document.addEventListener('click',e=>{if(!host)return;if(e.target.closest('.rr-card .dr-x,.rr-card .pc-close')||e.target.classList.contains('rr-modal'))close();});
addEventListener('hashchange',close);
window.RosterCard={open:openCard};
})();
