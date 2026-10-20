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
    ['Sacks (by defense)',th.sacks_taken,ta.sacks_taken],
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

function playerBlock(abbr, P, compact){
  if(!P)return'';
  if(compact){   // Live Hub panel: passing, rushing, receiving, top defenders
    let h=`<section class="box bs-players"><h2>${E(TEAM(abbr)==='Steelers'?'Steelers':abbr)} players</h2>`;
    h+=ptable('Passing',[['C/ATT',0],['Yds','yds'],['TD','td'],['INT','int']],P.passing,(r,k)=>k===0?`${r.cmp}/${r.att}`:r[k]);
    h+=ptable('Rushing',[['Car','att'],['Yds','yds'],['TD','td']],P.rushing);
    h+=ptable('Receiving',[['Rec','rec'],['Yds','yds'],['TD','td']],P.receiving);
    h+=ptable('Top defenders',[['Tkl','tkl'],['Sacks','sk'],['INT','int']],(P.defense||[]).slice().sort((a,b)=>(b.tkl-a.tkl)||(b.sk-a.sk)).slice(0,5),(r,k)=>k==='tkl'||k==='sk'?(+r[k]%1?(+r[k]).toFixed(1):+r[k]):r[k]);
    return h+'</section>';
  }
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
   <p class="fine">${E(b.source||'Data: nflverse (CC-BY 4.0)')}. <a href="${E(b.source_url||'https://github.com/nflverse/nflverse-data')}" target="_blank" rel="noopener">nflverse</a>. Unofficial fan site.</p>
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
// Drawn football field for the Live Hub (no logos, no team marks; plain abbreviations in the end zones).
// f = {away, home, posteam, ytez (yards to the end zone the offense is attacking), down, dist, text}
// Layout: away team's end zone on the left, home team's on the right. The away offense drives right, the home offense left.
window.BGDField={svg(f){if(!f||f.ytez==null||!f.posteam)return'';const W=120,Hh=53.3,y0=0;
 const toR=f.posteam===f.away;const x=toR?110-f.ytez:10+f.ytez;const fd=f.dist&&f.ytez-f.dist>0?(toR?110-(f.ytez-f.dist):10+(f.ytez-f.dist)):null;
 let lines='';for(let i=1;i<20;i++){const lx=10+i*5;lines+=`<line x1="${lx}" y1="0" x2="${lx}" y2="${Hh}" stroke="#ffffff" stroke-opacity="${i%2?0.18:0.45}" stroke-width="${i%2?0.25:0.4}"/>`;}
 let nums='';for(let yd=10;yd<=90;yd+=10){const n=yd<=50?yd:100-yd;nums+=`<text x="${10+yd}" y="9" font-size="4.2" text-anchor="middle" fill="#ffffff" fill-opacity=".75" font-weight="700">${n}</text><text x="${10+yd}" y="${Hh-5}" font-size="4.2" text-anchor="middle" fill="#ffffff" fill-opacity=".75" font-weight="700">${n}</text>`;}
 const ez=(x0,ab)=>`<rect x="${x0}" y="0" width="10" height="${Hh}" fill="#101010"/><text x="${x0+5}" y="${Hh/2}" font-size="5.2" fill="#FFB612" font-weight="900" text-anchor="middle" dominant-baseline="middle" transform="rotate(${x0?90:-90} ${x0+5} ${Hh/2})" letter-spacing=".8">${E(ab)}</text>`;
 const dir=toR?1:-1,ax=x+dir*7;
 return`<svg class="bf-svg" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="${E(f.posteam)} ball, ${E(f.text||'')}" preserveAspectRatio="xMidYMid meet">
  <rect x="0" y="0" width="${W}" height="${Hh}" fill="#2d2d2d"/><rect x="10" y="0" width="100" height="${Hh}" fill="#3a3a36"/>${lines}${nums}
  ${ez(0,f.away)}${ez(110,f.home)}<rect x="0.3" y="0.3" width="${W-0.6}" height="${Hh-0.6}" fill="none" stroke="#FFB612" stroke-width=".6"/>
  ${fd!=null?`<line x1="${fd}" y1="1" x2="${fd}" y2="${Hh-1}" stroke="#FFB612" stroke-width=".9" stroke-dasharray="2 1.2"/>`:''}
  <line x1="${x}" y1="1" x2="${x}" y2="${Hh-1}" stroke="#ffffff" stroke-width=".7"/>
  <line x1="${x}" y1="${Hh/2}" x2="${ax}" y2="${Hh/2}" stroke="#FFB612" stroke-width="1.1"/><path d="M${ax} ${Hh/2-2.2} L${ax+dir*3} ${Hh/2} L${ax} ${Hh/2+2.2}Z" fill="#FFB612"/>
  <ellipse cx="${x}" cy="${Hh/2}" rx="2.6" ry="1.6" fill="#FFB612" stroke="#101010" stroke-width=".4"/>
 </svg>`;},
 html(d){const f=d.field;const pl=(d.plays||[]).slice(0,5);
  const head=f?`<p class="bf-dd"><b>${E(f.posteam)} ball</b> · ${E(f.text||'')}</p>`:'';
  return`<div class="box bf">${head}${f?this.svg(f):'<p class="fine">Ball position shows here once the play-by-play feed is connected.</p>'}
   <p class="fine bf-key">White line: line of scrimmage · dashed gold: first-down line · arrow: drive direction</p>
   ${pl.length?`<h3 class="bs-h3">Latest plays</h3><ol class="bf-plays">${pl.map(p=>`<li class="${p.scoring?'sc':''}"><small>${E(p.team||'')} · Q${E(p.q)} ${E(p.clock||'')}${p.down?' · '+E(p.down):''}</small>${E(p.text)}</li>`).join('')}</ol>`:''}</div>`;}};
const st2=document.createElement('style');st2.textContent='.bf{padding:12px}.bf-svg{width:100%;height:auto;display:block;border-radius:8px;max-height:360px}.bf-dd{margin:0 0 8px;font-size:1.05rem}.bf-dd b{background:#101010;color:#FFB612;padding:2px 8px;border-radius:5px;font-size:.85rem;letter-spacing:.06em;text-transform:uppercase}.bf-key{margin:6px 0 0}.bf-k{display:inline-block;width:14px;height:0;border-top:2px solid #101010;vertical-align:middle;margin:0 2px 0 6px}.bf-k2{border-top:2px dashed #c98f00}.bf-plays{list-style:none;margin:0;padding:0;max-height:420px;overflow:auto}.bf-plays li{padding:8px 0;border-bottom:1px solid #eee;overflow-wrap:anywhere}.bf-plays li small{display:block;color:#6b6b6b;font-weight:700}.bf-plays li.sc{border-left:4px solid #FFB612;padding-left:8px}';document.head.appendChild(st2);
// Compact box score for the Live Hub (extras.js live()). Same nflverse data as the full page.
const st=document.createElement('style');st.textContent='.lb-box .bs-players{margin-top:14px}.lb-box .bs-p{min-width:340px}.lb-box .bs-team{min-width:300px}.lb-box .bs-q .bs-t{min-width:300px}.lb-box .bs-pitfirst{display:grid;gap:14px}.lb-box .bs-credit{margin-top:10px}.lb-box .box{min-width:0}@media(min-width:1000px){.lb-box .bs-pitfirst{grid-template-columns:1fr 1fr;align-items:start}.lb-box .bs-players{margin-top:0}}';document.head.appendChild(st);
window.BGDBox={panel(b){const pit=b.away.abbr==='PIT'?b.away.abbr:b.home.abbr,opp=pit===b.away.abbr?b.home.abbr:b.away.abbr;
 const url=b.source_url||'https://github.com/nflverse/nflverse-data';
 return`<p class="fine">${E(b.week)} · ${E(b.away.name)} ${b.away.score}, ${E(b.home.name)} ${b.home.score} · ${b.live?'<b>Live</b>, updates during the game':'Final'}</p>${qtrTable(b)}${teamStats(b)}
  <div class="bs-pitfirst">${playerBlock(pit,b.players[pit],true)}${playerBlock(opp,b.players[opp],true)}</div>
  <p class="fine bs-credit">Stats via <a href="${E(url)}" target="_blank" rel="noopener">${/balldontlie/i.test(url)?'BALLDONTLIE':'nflverse</a> (CC-BY 4.0'}${/balldontlie/i.test(url)?'</a>':')'}.${b.live?'':` <a href="#/boxscore/${encodeURIComponent(b.id)}">Full box score with scoring plays →</a>`}</p>`;}};
})();
