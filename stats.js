// Stats page + league leaders (#/leaders/team|player/<stat>). Data: data/stats.json + data/leaders/* (nflverse CC-BY 4.0).
(function(){
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rk=(r,n=32)=>{if(!r)return'<span class="rank na">—</span>';const t=r<=n*0.25?'top':r>=n*0.75?'bot':'mid';return`<span class="rank ${t}">#${r}</span>`;};
const GROUPS=[['Passing',['Pass Yds','YPA','Pass TD','INT thrown','Passer Rtg']],['Rushing',['Rush Yds','Rush TD']],
 ['Receiving',['Rec','Rec Yds','Rec TD','YAC']],['Defense',['Tackles','Sacks','TFL','PD','INT','FF','FR']]];
const PRIMARY={Passing:'pass_yds',Rushing:'rush_yds',Receiving:'rec_yds',Defense:'tackles'};
let tab='Passing', D=null, IDX=null, L=null, sort={key:'value',dir:'desc'};

function parseLeadersHash(){
  const parts=(location.hash.replace(/^#\/?/,'').split('?')[0]||'').split('/');
  if(parts[0]!=='leaders')return null;
  return {kind:parts[1]==='player'?'player':'team', key:decodeURIComponent(parts[2]||'')};
}
function goLeaders(kind,key){location.hash=`#/leaders/${kind}/${encodeURIComponent(key)}`;}
function fmtCell(v){if(v==null||v==='')return'—';return E(String(v));}

function renderStats(){
  const el=document.getElementById('stats-body');if(!el||!D)return;
  const secs=['Offense','Defense','Scoring'];
  const teamHTML=secs.map(s=>`<section class="box st-team"><h2>${s}</h2><table><tbody>${D.team.filter(t=>t.section===s).map(t=>`<tr class="st-click" data-ld-kind="team" data-ld-key="${E(t.key||'')}">
    <td><a class="st-link" href="#/leaders/team/${E(t.key)}">${E(t.label)}</a>${t.note?`<br><small>${E(t.note)}</small>`:''}</td>
    <td class="num"><a class="st-link" href="#/leaders/team/${E(t.key)}">${E(t.value)}</a></td>
    <td class="num">${rk(t.rank)}</td></tr>`).join('')}</tbody></table></section>`).join('');
  const [g,cols]=GROUPS.find(x=>x[0]===tab);
  const pool=D.players.filter(p=>cols.some(c=>p.stats[c])).sort((a,b)=>{
    const c0=cols[0];const v=p=>parseFloat(String((p.stats[c0]||{}).value||0).replace(/,/g,''))||0;return v(b)-v(a);});
  const n={Passing:D.player_pool_sizes['offense:passing'],Rushing:D.player_pool_sizes['offense:rushing'],Receiving:D.player_pool_sizes['offense:receiving'],Defense:D.player_pool_sizes['defense']}[g]||100;
  el.innerHTML=`<p class="page-sub">${D.season} regular season · Tap any team or player stat for the full NFL leaderboard. NFL rank in gold (top quarter) to red (bottom). Data: nflverse (CC-BY 4.0), updated ${new Date(D.generated).toLocaleString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})} ET.</p>
 <h2 class="section-title">Team</h2><div class="st-grid">${teamHTML}</div>
 <h2 class="section-title">Players</h2>
 <div class="chips">${GROUPS.map(([x])=>`<button type="button" class="chip st-tab${x===tab?' on':''}" data-st="${x}">${x}</button>`).join('')}</div>
 <div class="box sched st-wrap"><table class="st-players"><thead><tr><th>Player</th>${cols.map(c=>c==='YAC'?`<th class="num" title="Yards after catch">YAC<sup>*</sup></th>`:`<th class="num">${c}</th>`).join('')}</tr></thead><tbody>
 ${pool.map(p=>{const pk=PRIMARY[tab];
  const nameCell=p.id
    ?`<button type="button" class="st-pname" data-pid="${E(p.id)}" title="Open roster card">${E(p.name)}</button> <a class="st-mini" href="#/leaders/player/${pk}" title="League leaders">LB</a>`
    :`<a class="st-link" href="#/leaders/player/${pk}">${E(p.name)}</a>`;
  return `<tr><td><b>${nameCell}</b> <small>${E(p.pos||'')}</small></td>${cols.map(c=>{const s=p.stats[c];if(!s)return`<td class="num"><span class="na">–</span></td>`;
   const k=s.key||(IDX&&IDX.player_label_key&&IDX.player_label_key[c])||'';
   return`<td class="num"><a class="st-link" href="#/leaders/player/${E(k)}">${E(s.value)} ${rk(s.rank,n)}</a></td>`;}).join('')}</tr>`;}).join('')}
 </tbody></table></div>
 <p class="fine">Player ranks are among all ${n.toLocaleString()} NFL players with ${g.toLowerCase()} stats this season (ties share a rank). Tap a name for the roster card (when available) or LB for leaders; tap any stat for that category’s leaderboard. ${g==='Receiving'?'<sup>*</sup>YAC = yards after catch. ':''}${E(D.qbr_note||'')}</p>`;
}

function loadIndex(){return IDX?Promise.resolve(IDX):fetch(BGD_url('data/leaders/index.json'),{cache:'no-store'}).then(r=>r.json()).then(j=>{IDX=j;return j;});}

function renderLeaders(){
  const el=document.getElementById('leaders-body');if(!el)return;
  const h=parseLeadersHash();
  if(!h||!h.key){el.innerHTML=`<p class="empty">Pick a category from <a href="#/stats">Stats</a>.</p>`;return;}
  el.innerHTML=`<p class="empty">Loading leaderboard…</p>`;
  loadIndex().then(()=>{
    const file=`data/leaders/${h.kind}-${h.key}.json`;
    return fetch(BGD_url(file),{cache:'no-store'}).then(r=>{if(!r.ok)throw r.status;return r.json();});
  }).then(d=>{L=d;sort={key:'value',dir:d.lower_is_better?'asc':'desc'};paintLeaders();}).catch(()=>{
    el.innerHTML=`<p class="empty">Leaderboard not found. <a href="#/stats">← Back to Stats</a></p>`;
  });
}

function sortedRows(){
  if(!L)return[];
  const rows=[...L.rows];
  const k=sort.key, dir=sort.dir==='asc'?1:-1;
  rows.sort((a,b)=>{
    let av=a[k],bv=b[k];
    if(av==null&&bv==null)return 0;
    if(av==null)return 1;if(bv==null)return-1;
    const na=typeof av==='number'?av:parseFloat(String(av).replace(/,/g,''));
    const nb=typeof bv==='number'?bv:parseFloat(String(bv).replace(/,/g,''));
    if(Number.isFinite(na)&&Number.isFinite(nb)&&String(av).match(/^[\d.,+-]+$/)&&String(bv).match(/^[\d.,+-]+$/))return (na-nb)*dir;
    return String(av).localeCompare(String(bv))*dir;
  });
  return rows;
}

function catPicker(kind,cur){
  if(!IDX)return'';
  const list=kind==='team'?IDX.team:IDX.player;
  const groups={};
  list.forEach(c=>{const g=c.section||c.group||'Other';(groups[g]=groups[g]||[]).push(c);});
  return `<label class="ld-pick"><span>Category</span><select id="ld-cat">${Object.entries(groups).map(([g,cs])=>`<optgroup label="${E(g)}">${cs.map(c=>`<option value="${E(c.key)}" ${c.key===cur?'selected':''}>${E(c.label)}</option>`).join('')}</optgroup>`).join('')}</select></label>`;
}

function paintLeaders(){
  const el=document.getElementById('leaders-body');if(!el||!L)return;
  const rows=sortedRows();
  const cols=L.columns||[{key:'value',label:L.label,primary:true}];
  const th=[{key:'rank',label:'#'},{key:L.kind==='team'?'name':'name',label:L.kind==='team'?'Team':'Player'},...(L.kind==='player'?[{key:'team',label:'Tm'},{key:'pos',label:'Pos'}]:[]),...cols.map(c=>({key:c.key,label:c.label}))];
  // dedupe name
  const seen=new Set();const heads=[];
  th.forEach(h=>{if(seen.has(h.key))return;seen.add(h.key);heads.push(h);});
  const arrow=k=>sort.key===k?(sort.dir==='asc'?' ▲':' ▼'):'';
  el.innerHTML=`<p><a class="back" href="#/stats">← Back to Stats</a></p>
 <h1 class="page-title">${E(L.label)} <span class="badge">${L.kind==='team'?'Team leaders':'Player leaders'}</span></h1>
 <p class="page-sub">${L.season} regular season${L.min_note?` · ${E(L.min_note)}`:''}${L.count!=null?` · ${L.count} qualified`:''}. ${E(L.source||'Data: nflverse (CC-BY 4.0)')}. Steelers highlighted.</p>
 <div class="ld-bar">${catPicker(L.kind,L.key)}
  <div class="chips ld-kind">${IDX.team.some(c=>c.key===L.key)?`<a class="chip${L.kind==='team'?' on':''}" href="#/leaders/team/${E(L.key)}">Teams</a>`:''}
  ${IDX.player.some(c=>c.key===L.key)?`<a class="chip${L.kind==='player'?' on':''}" href="#/leaders/player/${E(L.key)}">Players</a>`:''}</div>
 </div>
 <div class="box ld-wrap"><table class="ld-table"><thead><tr>${heads.map(h=>`<th scope="col" class="${h.key==='name'||h.key==='rank'?'':('num')} ld-sort" data-sk="${E(h.key)}" aria-sort="${sort.key===h.key?(sort.dir==='ascending'?'ascending':'descending'):'none'}">${E(h.label)}${arrow(h.key)}</th>`).join('')}</tr></thead>
 <tbody>${rows.map(r=>{
   const pit=r.pit?' pit':'';
   const name=L.kind==='player'&&r.pit&&r.id
     ?`<button type="button" class="st-pname" data-pid="${E(r.id)}">${E(r.name)}</button>`
     :E(r.name||r.team);
   return `<tr class="${pit.trim()}" data-pit="${r.pit?1:0}" id="${r.pit?'ld-pit':''}">
    <td class="num">${r.rank??''}</td>
    <td>${name}${L.kind==='team'?` <small>${E(r.team)}</small>`:''}</td>
    ${L.kind==='player'?`<td>${E(r.team||'')}</td><td>${E(r.pos||'')}</td>`:''}
    ${cols.map(c=>`<td class="num">${fmtCell(r[c.key])}</td>`).join('')}
   </tr>`;}).join('')}</tbody></table></div>
 <p class="fine">Tap a column header to sort. ${L.kind==='player'?'Steelers names open the roster card when available. ':''}Qualifying notes apply per category.</p>`;
  // scroll Steelers into view
  requestAnimationFrame(()=>{const pit=el.querySelector('tr.pit');if(pit)pit.scrollIntoView({block:'center',behavior:'smooth'});});
}

function onRoute(){
  const h=parseLeadersHash();
  if(h){renderLeaders();return;}
  if((location.hash.replace(/^#\/?/,'').split('?')[0]||'').split('/')[0]==='stats'||document.querySelector('.view[data-view="stats"]:not([hidden])')){
    if(D)renderStats();
  }
}

document.addEventListener('click',e=>{
  const tabBtn=e.target.closest('.st-tab');if(tabBtn){tab=tabBtn.dataset.st;renderStats();return;}
  const pname=e.target.closest('.st-pname');if(pname&&pname.dataset.pid){e.preventDefault();if(window.RosterCard&&RosterCard.open)RosterCard.open(pname.dataset.pid);return;}
  const sortTh=e.target.closest('.ld-sort');if(sortTh&&L){
    const k=sortTh.dataset.sk;if(sort.key===k)sort.dir=sort.dir==='asc'?'desc':'asc';else{sort.key=k;sort.dir=(k==='name'||k==='team'||k==='pos')?'asc':(L.lower_is_better?'asc':'desc');}
    paintLeaders();return;
  }
});
document.addEventListener('change',e=>{
  if(e.target&&e.target.id==='ld-cat'&&L){goLeaders(L.kind,e.target.value);}
});
document.addEventListener('route',e=>{
  if(e.detail==='leaders')renderLeaders();
  else if(e.detail==='stats'&&D)renderStats();
});

fetch(BGD_url('data/stats.json'),{cache:'no-store'}).then(r=>r.json()).then(d=>{D=d;loadIndex().finally(()=>{if(!parseLeadersHash())renderStats();});}).catch(()=>{});
loadIndex().catch(()=>{});
})();
