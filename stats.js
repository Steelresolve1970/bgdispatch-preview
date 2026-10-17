// Stats page: team stats with NFL rank + every Steelers player's stats with NFL rank (data/stats.json, nflverse CC-BY 4.0)
(function(){
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rk=(r,n=32)=>{if(!r)return'<span class="rank na">—</span>';const t=r<=n*0.25?'top':r>=n*0.75?'bot':'mid';return`<span class="rank ${t}">#${r}</span>`;};
const GROUPS=[['Passing',['Pass Yds','YPA','Pass TD','INT thrown','Passer Rtg']],['Rushing',['Rush Yds','Rush TD']],
 ['Receiving',['Rec','Rec Yds','Rec TD','YAC']],['Defense',['Tackles','Sacks','TFL','PD','INT','FF','FR']]];
let tab='Passing';
function render(d){const el=document.getElementById('stats-body');if(!el||!d)return;
 const secs=['Offense','Defense','Scoring'];
 const teamHTML=secs.map(s=>`<section class="box st-team"><h2>${s}</h2><table>${d.team.filter(t=>t.section===s).map(t=>`<tr><td>${E(t.label)}${t.note?`<br><small>${E(t.note)}</small>`:''}</td><td class="num">${E(t.value)}</td><td class="num">${rk(t.rank)}</td></tr>`).join('')}</table></section>`).join('');
 const [g,cols]=GROUPS.find(x=>x[0]===tab);
 const pool=d.players.filter(p=>cols.some(c=>p.stats[c])).sort((a,b)=>{const c=cols[0]==='INT thrown'?cols[0]:cols.find(c=>a.stats[c]||b.stats[c]);
   const v=p=>parseFloat(String((p.stats[cols[0]]||p.stats[c]||{}).value||0).replace(/,/g,''));return v(b)-v(a);});
 const n={Passing:d.player_pool_sizes['offense:passing'],Rushing:d.player_pool_sizes['offense:rushing'],Receiving:d.player_pool_sizes['offense:receiving'],Defense:d.player_pool_sizes['defense']}[g]||100;
 el.innerHTML=`<p class="page-sub">${d.season} regular season · NFL rank in gold badges (top quarter) to red (bottom quarter). Data: nflverse (CC-BY 4.0), updated ${new Date(d.generated).toLocaleString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})} ET.</p>
 <h2 class="section-title">Team</h2><div class="st-grid">${teamHTML}</div>
 <h2 class="section-title">Players</h2>
 <div class="chips">${GROUPS.map(([x])=>`<button class="chip st-tab${x===tab?' on':''}" data-st="${x}">${x}</button>`).join('')}</div>
 <div class="box sched"><table class="st-players"><thead><tr><th>Player</th>${cols.map(c=>`<th class="num">${c}</th>`).join('')}</tr></thead><tbody>
 ${pool.map(p=>`<tr><td><b>${E(p.name)}</b> <small>${E(p.pos||'')}</small></td>${cols.map(c=>{const s=p.stats[c];return`<td class="num">${s?`${E(s.value)} ${rk(s.rank,n)}`:'<span class="na">–</span>'}</td>`}).join('')}</tr>`).join('')}
 </tbody></table></div>
 <p class="fine">Player ranks are among all ${n.toLocaleString()} NFL players with ${g.toLowerCase()} stats this season (ties share a rank). ${E(d.qbr_note)}</p>
 <div class="box"><b>Coming soon:</b> ${d.coming_soon.map(E).join(', ')}. These need a paid data provider (e.g. PFF / Sports Info Solutions).</div>`;}
let D=null;fetch('data/stats.json',{cache:'no-store'}).then(r=>r.json()).then(d=>{D=d;render(D);}).catch(()=>{});
document.addEventListener('click',e=>{const t=e.target.closest('.st-tab');if(t){tab=t.dataset.st;render(D);}});
})();
