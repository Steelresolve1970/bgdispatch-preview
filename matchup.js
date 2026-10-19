// Matchup report for the next Steelers game (Opponent Preview page; the old Opponent Scouting page was merged in here).
// Data: data/matchup.json (fetch_matchup.py) + data/opponent.json (fetch_hub.py: record, TV, last 5, key players, injuries).
// Both are rebuilt by run_all.py on every update (nflverse CC-BY 4.0 stats; pundit picks link to sources).
(function(){
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const EXT='target="_blank" rel="noopener"';
const url=u=>window.BGD_url?BGD_url(u):u;
const ord=n=>{const s=['th','st','nd','rd'],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0]);};
const css=`.mu{margin-top:8px}.mu .mu-head{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:baseline}.mu .mu-head h2{margin:0}
.mu-rk{font-size:.78em;font-weight:600;color:#666;white-space:nowrap}.mu-rk.top{color:#1b7a34}.mu-rk.bot{color:#b3261e}
.mu-tbl{width:100%;border-collapse:collapse;font-size:.95rem}.mu-tbl th,.mu-tbl td{padding:7px 6px;border-bottom:1px solid #eee;text-align:center}
.mu-tbl th:first-child,.mu-tbl td:first-child{text-align:left}.mu-tbl thead th{font-size:.8rem;text-transform:uppercase;color:#555}
.mu-tbl tr.grp td{background:#101010;color:#FFB612;font-weight:800;text-transform:uppercase;font-size:.78rem;letter-spacing:.5px}
.mu-tbl td.win{font-weight:800;background:#fff6dc}
@media(max-width:560px){.mu-tbl .mu-rk{display:block}}
.mu-form{display:flex;flex-wrap:wrap;gap:4px 14px;width:100%;font-size:.9rem}.mu-form b{margin-right:4px}.mu-form .res{cursor:default}
.mu-list{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));margin:0 0 16px;padding:0;list-style:none}
.mu-list>li{background:#fff;border-radius:8px;padding:14px;box-shadow:0 1px 3px #0001;border-top:4px solid #FFB612}
.mu-list>li>b{display:block;font-size:1.02rem;margin-bottom:4px}.mu-list>li>p{margin:0 0 6px}.mu-list>li>ul{margin:4px 0 0;padding-left:18px;font-size:.88rem;color:#444}
.mu-n{display:inline-block;background:#101010;color:#FFB612;border-radius:50%;width:24px;height:24px;line-height:24px;text-align:center;font-weight:900;margin-right:6px;font-size:.85rem}
.mu-picks{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr))}
.mu-pick{background:#fff;border-radius:8px;padding:12px 14px;box-shadow:0 1px 3px #0001;display:flex;flex-direction:column;gap:2px}
.mu-pick .who{font-weight:800}.mu-pick .out{font-size:.85rem;color:#555}.mu-pick .mu-pk{font-size:1.1rem;font-weight:900;margin:4px 0}
.mu-pick .mu-pk.pit{color:#101010;background:#FFB612;border-radius:4px;padding:1px 6px;align-self:flex-start}
.mu-pick a{font-size:.85rem}.mu-wait{background:#fff;border:2px dashed #FFB612;border-radius:8px;padding:16px;text-align:center;font-weight:700}
@media(max-width:560px){.mu-tbl{font-size:.88rem}.mu-tbl th,.mu-tbl td{padding:6px 3px}}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
let D=null,O=null;
const rk=(n,total)=>`<span class="mu-rk ${n<=10?'top':n>(total||32)-10?'bot':''}">(${ord(n)})</span>`;
const fmtv=(v,k,d)=>{const t=Number(v).toFixed(d??1);return k==='tomargin'&&v>0?'+'+t:t;};
function table(d,skip){const GO=['Offense','Defense','Other'];const rows=d.stats.filter(s=>!skip||!skip.has(s.label)).sort((a,b)=>GO.indexOf(a.group)-GO.indexOf(b.group));if(!rows.length)return'';let g='';const T=d.teams_ranked;
 return `<div class="box"><table class="mu-tbl"><thead><tr><th>Stat (per game)</th><th>PIT</th><th>${E(d.opp)}</th></tr></thead><tbody>${rows.map(s=>{
  const head=s.group!==g?(g=s.group,`<tr class="grp"><td colspan="3">${E(g)}</td></tr>`):'';const pw=s.higher_better?s.pit>s.opp:s.pit<s.opp,ow=s.higher_better?s.opp>s.pit:s.opp<s.pit;
  return head+`<tr><td>${E(s.label)}</td><td class="${pw?'win':''}">${E(fmtv(s.pit,s.key,s.dec))} ${rk(s.pit_rank,T)}</td><td class="${ow?'win':''}">${E(fmtv(s.opp,s.key,s.dec))} ${rk(s.opp_rank,T)}</td></tr>`;}).join('')}</tbody></table>
  <p class="fine">NFL rank in parentheses (1st = best of ${T} teams; ties share a rank). Highlighted = better of the two teams. Games played: PIT ${d.games_played.PIT}, ${E(d.opp)} ${d.games_played.opp}.</p></div>`;}
function picks(d){const p=d.picks||{},it=p.items||[];const nick=d.opp_nick;
 const chk=p.checked?new Date(p.checked).toLocaleString('en-US',{timeZone:'America/New_York',weekday:'short',hour:'numeric',minute:'2-digit'})+' ET':'';
 if(!it.length)return `<div class="mu-wait">Picks coming later this week.<br><small class="fine">Experts usually post their picks Wednesday through Saturday. We check for new ones several times a day${chk?'; last checked '+E(chk):''}.${p.cbs_consensus&&p.cbs_consensus.link?` <a href="${E(p.cbs_consensus.link)}" ${EXT}>CBS Sports expert panel picks</a>`:''}</small></div>`;
 const c=p.cbs_consensus;
 return `<div class="mu-picks">${it.map(x=>{const pit=x.winner==='PIT';const tm=pit?'Steelers':nick;
  return `<div class="mu-pick"><span class="who">${E(x.name)}</span><span class="out">${E(x.outlet)}</span><span class="mu-pk ${pit?'pit':''}">${E(tm)}${x.score?' '+E(x.score):' to win'}</span><a href="${E(x.link)}" ${EXT}>Source</a></div>`;}).join('')}</div>
  ${c&&c.link?`<p class="fine">${c.link_only?'CBS Sports expert panel picks:':`CBS Sports expert panel: ${c.pit} of ${c.total} pick the Steelers.`} <a href="${E(c.link)}" ${EXT}>See the panel at CBS Sports</a></p>`:''}
  <p class="fine">Only each expert's pick is shown; tap Source to read their reasoning at the original outlet. ${it.length<5?'More picks will be added as they are published. ':''}Last checked ${E(chk)}.</p>`;}
const l5=a=>(a||[]).map(e=>{const t=`${e.result} ${e.score} ${e.atVs} ${e.opp}`;return `<span class="res ${E(e.result)}" title="${E(t)}" aria-label="${E(t)}">${E(e.result)}</span>`;}).join('');
const ST={'Out':'s-out','Doubtful':'s-doubt','Questionable':'s-q','Injured Reserve':'s-ir','Physically Unable to Perform':'s-ir'};
function extra(d,o){if(!o)return'';const ld=(o.leaders&&o.leaders.opp)||[];const inj=(o.injuries||[]).filter(p=>p.status!=='Cleared');
 return `<h2 class="section-title">${E(d.opp_nick||d.opp)} key players</h2>
 <div class="leaders">${ld.map(l=>`<div class="box ldr"><small>${E(l.cat)}</small><b>${E(l.name)}${l.pos?' <small>'+E(l.pos)+'</small>':''}</b><span>${E(l.line)}</span></div>`).join('')||'<p class="fine">No stat leaders yet.</p>'}</div>
 <h2 class="section-title">${E(d.opp_nick||d.opp)} injury report</h2>
 <div class="inj-list">${inj.map(p=>`<a class="box inj" href="${E(p.link)}" ${EXT}><span class="pill ${ST[p.status]||''}">${p.status==='Injured Reserve'?'IR':E(p.status)}</span><b>${E(p.name)}</b><small>${E(p.pos)}</small><span>${E(p.injury||'Undisclosed')}</span></a>`).join('')||'<p class="fine">No injuries listed.</p>'}</div>`;}
function block(d,o){const g=d.game;if(!g)return{head:'<p class="empty">No upcoming game.</p>',body:''};
 const when=new Date(g.date).toLocaleString('en-US',{timeZone:'America/New_York',weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
 const head=`<div class="box mu-head"><h2>Steelers ${g.home?'vs':'at'} ${E(d.opp_name)}${o&&o.record?` <small>(${E(d.opp)} ${E(o.record)})</small>`:''}</h2><span class="fine">${E(g.week)} · ${E(when)} ET${(g.tv||(o&&o.game&&o.game.tv))?' · '+E(g.tv||o.game.tv):''}${g.venue?' · '+E(g.venue):''}</span>
 ${o&&o.last5?`<div class="mu-form"><span><b>Last 5 · ${E(d.opp)}</b>${l5(o.last5.opp)}</span><span><b>PIT</b>${l5(o.last5.pit)}</span></div>`:''}</div>`;
 return {head,body:`<section class="mu" aria-label="Matchup report">
 <h2 class="section-title">3 keys to a Steelers win</h2>
 <ol class="mu-list">${d.keys.map((k,i)=>`<li><b><span class="mu-n">${i+1}</span>${E(k.title)}</b><p>${E(k.why)}</p></li>`).join('')}</ol>
 <h2 class="section-title">3 key matchups to watch</h2>
 <ol class="mu-list">${d.matchups.map((m,i)=>`<li><b><span class="mu-n">${i+1}</span>${E(m.title)}</b><p>${E(m.why)}</p><ul>${m.stats.map(s=>`<li>${E(s)}</li>`).join('')}</ul></li>`).join('')}</ol>
 <h2 class="section-title">Pundit picks</h2>${picks(d)}
 <h2 class="section-title">Team stats with NFL ranks</h2>${table(d)}
 ${extra(d,o)}
 <p class="fine">Stats, ranks, keys and matchups update automatically every week from nflverse data (<a href="${E(d.source_url)}" ${EXT}>CC-BY 4.0</a>). Keys and matchups are our own takes, generated from the numbers. Records, last-5 results, key players and injuries come from nflverse schedules, stats and official injury reports.</p></section>`};}
// Page order: game header card, then "Previews & film" (#preview-full), then keys, matchups, picks, stats, key players, injuries.
function render(){if(!D||D.opp===undefined&&!D.game)return;
 const pv=document.getElementById('preview-full');if(!pv)return;
 let hd=document.getElementById('mu-opp-head'),bd=document.getElementById('mu-opp');
 if(!hd){hd=document.createElement('div');hd.id='mu-opp-head';hd.className='mu';pv.parentNode.insertBefore(hd,pv);
  const h=document.createElement('h2');h.className='section-title';h.id='mu-prev-h';h.textContent='Previews & film';pv.parentNode.insertBefore(h,pv);}
 if(!bd){bd=document.createElement('div');bd.id='mu-opp';pv.after(bd);}
 const r=block(D,(O&&D.opp&&O.abbr===D.opp)?O:null);hd.innerHTML=r.head;bd.innerHTML=r.body;}
const go=()=>{if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();};
const get=u=>fetch(url(u),{cache:'no-store'}).then(r=>{if(!r.ok)throw r.status;return r.json();});
get('data/matchup.json').then(d=>{D=d;window.BGD_matchup=d;go();}).catch(()=>{});
get('data/opponent.json').then(d=>{O=d;go();}).catch(()=>{});
})();
