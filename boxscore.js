// Box score page (#/boxscore/<nflverse_id>). Data: data/boxscores/*.json from nflverse (CC-BY 4.0).
(function(){
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id);
const cache={};
const TEAM=a=>a==='PIT'?'Steelers':a;

function qtrTable(b){
  const qs=Object.keys(b.quarters||{}).sort((a,c)=>+a-+c);
  if(!qs.length)return'';
  const lab=q=>q==='5'?'OT':('Q'+q);
  const head=`<tr><th></th>${qs.map(q=>`<th>${lab(q)}</th>`).join('')}<th>F</th></tr>`;
  const row=(side,abbr,final)=>`<tr><th scope="row">${E(abbr)}</th>${qs.map(q=>`<td>${b.quarters[q][side]}</td>`).join('')}<td><b>${final}</b></td></tr>`;
  return`<div class="box bs-q"><table class="bs-t"><thead>${head}</thead><tbody>
   ${row('away',b.away.abbr,b.away.score)}${row('home',b.home.abbr,b.home.score)}
  </tbody></table></div>`;
}

function scoring(b){
  if(!(b.scoring||[]).length)return'<p class="fine">Scoring play list not available for this game.</p>';
  return`<div class="box"><h2>Scoring plays</h2><ol class="bs-scorelist">${b.scoring.map(s=>`<li><span class="bs-qtr">Q${s.qtr}</span> <b>${E(s.team)}</b> ${E(s.desc)} <span class="bs-run">${s.away}–${s.home}</span></li>`).join('')}</ol></div>`;
}

function teamStats(b){
  const A=b.away.abbr,H=b.home.abbr,ta=b.team_stats[A]||{},th=b.team_stats[H]||{};
  const rows=[
    ['First downs',ta.first_downs,th.first_downs],
    ['Total yards',ta.total_yards,th.total_yards],
    ['Passing yards',ta.passing_yards,th.passing_yards],
    ['Rushing yards',ta.rushing_yards,th.rushing_yards],
    ['Turnovers',ta.turnovers,th.turnovers],
    ['Penalties',ta.penalties_line||ta.penalties,th.penalties_line||th.penalties],
    ['3rd down',ta.third_down,th.third_down],
    ['Time of possession',ta.possession,th.possession],
  ];
  return`<div class="box"><h2>Team stats</h2><div class="bs-wrap"><table class="bs-t bs-team"><thead><tr><th>Stat</th><th>${E(A)}</th><th>${E(H)}</th></tr></thead><tbody>
   ${rows.map(([l,a,h])=>`<tr><th scope="row">${E(l)}</th><td>${a??'–'}</td><td>${h??'–'}</td></tr>`).join('')}
  </tbody></table></div></div>`;
}

function ptable(title, cols, rows, fmt){
  if(!rows||!rows.length)return'';
  return`<h3 class="bs-h3">${E(title)}</h3><div class="bs-wrap"><table class="bs-t bs-p"><thead><tr><th>Player</th>${cols.map(c=>`<th>${E(c[0])}</th>`).join('')}</tr></thead><tbody>
   ${rows.map(r=>`<tr><th scope="row">${E(r.name)}</th>${cols.map(c=>`<td>${fmt?fmt(r,c[1]):(r[c[1]]??'')}</td>`).join('')}</tr>`).join('')}
  </tbody></table></div>`;
}

function playerBlock(abbr, P){
  if(!P)return'';
  let h=`<section class="box bs-players"><h2>${E(abbr)} players</h2>`;
  h+=ptable('Passing',[['C/A',0],['Yds','yds'],['TD','td'],['INT','int'],['Sk','sk'],['Rate','rate']],P.passing,
    (r,k)=>k===0?`${r.cmp}/${r.att}`:r[k]);
  h+=ptable('Rushing',[['Att','att'],['Yds','yds'],['Avg','avg'],['TD','td']],P.rushing);
  h+=ptable('Receiving',[['Rec','rec'],['Tgt','tgt'],['Yds','yds'],['Avg','avg'],['TD','td']],P.receiving);
  h+=ptable('Defense',[['Tkl','tkl'],['Solo','solo'],['Sk','sk'],['TFL','tfl'],['PD','pd'],['INT','int'],['QBH','qbh']],P.defense);
  h+=ptable('Kicking',[['FG','fg'],['XP','xp'],['Long','long']],P.kicking,(r,k)=>k==='fg'?`${r.fgm}/${r.fga}`:k==='xp'?`${r.xpm}/${r.xpa}`:r[k]);
  return h+'</section>';
}

function render(b){
  const el=$('boxscore-body');if(!el||!b)return;
  const pitWon=b.result==='W';
  const headline=`${E(b.away.name)} ${b.away.score}, ${E(b.home.name)} ${b.home.score}`;
  el.innerHTML=`
   <h1 class="page-title">Box Score</h1>
   <p class="page-sub">${E(b.week)} · ${new Date(b.date).toLocaleDateString('en-US',{timeZone:'America/New_York',weekday:'short',month:'short',day:'numeric',year:'numeric'})}${b.venue?' · '+E(b.venue):''}</p>
   <div class="bs-hero box ${pitWon?'bs-win':'bs-loss'}">
    <div class="bs-side"><span class="bs-abbr">${E(b.away.abbr)}</span><span class="bs-name">${E(TEAM(b.away.abbr)==='Steelers'?b.away.name:b.away.name)}</span><span class="bs-sc">${b.away.score}</span></div>
    <div class="bs-mid"><span class="res ${E(b.result)}">${E(b.result||'F')}</span><small>Final</small></div>
    <div class="bs-side"><span class="bs-abbr">${E(b.home.abbr)}</span><span class="bs-name">${E(b.home.name)}</span><span class="bs-sc">${b.home.score}</span></div>
   </div>
   ${qtrTable(b)}
   ${scoring(b)}
   ${teamStats(b)}
   ${playerBlock(b.away.abbr,b.players[b.away.abbr])}
   ${playerBlock(b.home.abbr,b.players[b.home.abbr])}
   <p class="fine">${E(b.source||'Data: nflverse (CC-BY 4.0)')}. <a href="${E(b.source_url||'https://github.com/nflverse/nflverse-data')}" target="_blank" rel="noopener noreferrer">nflverse</a>. Unofficial fan site.</p>
   <p><a class="back" href="#/game">← Back to Schedule</a></p>`;
  document.title=`Box Score: ${b.away.abbr} ${b.away.score}–${b.home.abbr} ${b.home.score} – Black & Gold Dispatch`;
}

function load(id){
  const el=$('boxscore-body');if(!el)return;
  if(!id){el.innerHTML='<p class="empty">No game selected. <a href="#/game">Back to Schedule</a></p>';return;}
  if(cache[id]){render(cache[id]);return;}
  el.innerHTML='<p class="empty">Loading box score…</p>';
  fetch((window.BGD_url?BGD_url('data/boxscores/'+encodeURIComponent(id)+'.json'):('data/boxscores/'+encodeURIComponent(id)+'.json')),{cache:'no-store'})
    .then(r=>{if(!r.ok)throw r.status;return r.json();})
    .then(b=>{cache[id]=b;render(b);})
    .catch(()=>{el.innerHTML=`<p class="empty">Box score not available for this game yet. <a href="#/game">Back to Schedule</a></p>`;});
}

document.addEventListener('route',e=>{if(e.detail==='boxscore')load(window.BGD_boxId);});
})();
