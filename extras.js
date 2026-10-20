// Extra sections: Live Hub, Injuries, Cap Center, Rumors & Updates / Rumor Meter, Pick'em & Trivia, History, Alerts.
// All data comes from files the fetchers write (nflverse CC-BY 4.0 data, our news feed, verified history).
(function(){
const X={};const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const EXT='target="_blank" rel="noopener"';const J=u=>fetch((window.BGD_url?BGD_url(u):u),{cache:'no-store'}).then(r=>{if(!r.ok)throw r.status;return r.json()});
const et=(iso,o)=>new Date(iso).toLocaleString('en-US',{timeZone:'America/New_York',...o});
const ago=iso=>{if(iso==null||iso==='')return'';const t=new Date(iso).getTime();if(!Number.isFinite(t))return'';const m=Math.round((Date.now()-t)/6e4);if(m<0)return'';if(m>3650*1440)return'';return m<60?m+'m ago':m<1440?Math.round(m/60)+'h ago':Math.round(m/1440)+'d ago';};
const $=id=>document.getElementById(id);const money=v=>v==null?'—':'$'+(v>=1e6?(v/1e6).toFixed(v>=1e7?1:2)+'M':Math.round(v/1e3)+'K');
const stCls={Out:'s-out',Doubtful:'s-doubt',Questionable:'s-q','Injured Reserve':'s-ir','Physically Unable to Perform':'s-ir',Cleared:'s-ok'};

// ---------- Injury tracker ----------
function injuries(){const d=X.inj,el=$('injuries-body');if(!d||!el)return;const g={};d.players.forEach(p=>(g[p.status]=g[p.status]||[]).push(p));
 const order=['Out','Doubtful','Questionable','Injured Reserve','Physically Unable to Perform','Cleared'];
 el.innerHTML=`<p class="page-sub">${d.next_game?`Status for ${d.next_game.week}: ${d.next_game.home?'vs':'at'} ${E(d.next_game.opponent)} (${et(d.next_game.date,{weekday:'short',month:'short',day:'numeric'})}).`:''} Updated ${ago(d.generated)}.</p>
 <div class="inj-sum">${order.filter(s=>g[s]).map(s=>`<span class="pill ${stCls[s]}">${s}: <b>${g[s].length}</b></span>`).join('')}</div>
 ${order.filter(s=>g[s]).map(s=>`<h2 class="section-title">${s}</h2><div class="inj-list">${g[s].map(p=>{const ret=p.return_date&&s!=='Cleared'?'Est. return: '+et(p.return_date+'T12:00:00Z',{month:'short',day:'numeric',year:p.return_date.slice(0,4)!==String(new Date().getFullYear())?'numeric':undefined}):'';return `<a class="box inj" href="${E(p.link)}" ${EXT}><span class="pill ${stCls[s]}">${s==='Injured Reserve'?'IR':s}</span><b>${E(p.name)}</b><small>${E(p.pos)}${p.jersey?' #'+E(p.jersey):''}</small><span>${E([p.injury,p.side,p.detail].filter(Boolean).join(' · ')||'Undisclosed')}</span>${ret?`<small>${ret}</small>`:''}</a>`;}).join('')}</div>`).join('')}
 <h2 class="section-title">Practice report (from headlines)</h2>
 <div class="box"><ul class="plain">${d.practice_headlines.length?d.practice_headlines.map(h=>`<li><a href="${E(h.link)}" ${EXT}>${E(h.title)}</a> <small>${E(h.source)} · ${ago(h.published)}</small></li>`).join(''):'<li>No practice-report headlines this week yet.</li>'}</ul></div>
 <p class="fine">${E(d.note)} Game statuses come from the official NFL injury report (via nflverse), which updates daily, mostly overnight; same-day moves show up first in the practice-report headlines below.</p>`;}

// (Opponent Scouting was merged into the Opponent Preview page; see matchup.js.)

// ---------- Cap center ----------
let capSort='salary';
function cap(){const d=X.cap,el=$('cap-body');if(!d||!el)return;if(d.coming_soon){el.innerHTML=`<div class="box gaps"><b>Cap Center: coming soon</b><ul>${d.gaps.map(g=>`<li>${E(g)}</li>`).join('')}</ul></div>`;return;}const rows=[...d.players].sort((a,b)=>capSort==='name'?a.name.localeCompare(b.name):capSort==='through'?(a.through||9999)-(b.through||9999):(b[capSort]||0)-(a[capSort]||0));
 const mx=Math.max(...Object.values(d.by_pos));
 el.innerHTML=`<div class="box gaps"><b>What this page can and can't show</b><ul>${d.gaps.map(g=>`<li>${E(g)}</li>`).join('')}</ul></div>
 <div class="cap-cards"><div class="box"><small>ESPN-listed salaries (${d.with_salary} players)</small><b>${money(d.total_listed)}</b></div><div class="box"><small>Official cap space</small><b class="gap">Not available</b></div><div class="box"><small>Roster players</small><b>${d.roster_size}</b></div></div>
 <h2 class="section-title">Listed salary by position</h2>
 <div class="box">${Object.entries(d.by_pos).map(([p,v])=>`<div class="bar-row"><span>${E(p)}</span><i style="width:${(v/mx*100).toFixed(1)}%"></i><b>${money(v)}</b></div>`).join('')}</div>
 <h2 class="section-title">Contracts ending</h2>
 <div class="box">${Object.entries(d.expiring).map(([y,n])=>`<p><b>After ${E(y)}:</b> ${n.map(E).join(', ')}</p>`).join('')}</div>
 <h2 class="section-title">Player contracts</h2>
 <div class="chips">${[['salary','Salary'],['remaining','Remaining'],['through','Ends soonest'],['name','Name']].map(([k,l])=>`<button class="chip cap-sort${capSort===k?' on':''}" data-k="${k}">${l}</button>`).join('')}</div>
 <div class="box tbl-wrap"><table class="cap"><thead><tr><th>Player</th><th>Pos</th><th>Salary</th><th>Remaining</th><th>Ends</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${E(r.name)}</td><td>${E(r.pos)}</td><td>${money(r.salary)}</td><td>${money(r.remaining)}</td><td>${r.through||'—'}</td></tr>`).join('')}</tbody></table></div>
 <p class="fine">${E(d.note)} "—" = not listed by ESPN. Updated ${ago(d.generated)}.</p>`;}

// ---------- Rumor meter ----------
let rmF='All';
function rumors(){const d=X.rum,el=$('rumormeter-body');if(!d||!el)return;const sc={'National insider':4,'Beat writer / team':3,'Fan blog':2,'Aggregator / other':1};
 const cut=Date.now()-5*864e5;const list=d.rumors.filter(r=>r.published&&new Date(r.published).getTime()>=cut).filter(r=>rmF==='All'||r.status===rmF||r.tier===rmF);
 el.innerHTML=`<p class="page-sub">Steelers rumors from the last 5 days, rated by who's reporting them. Status changes automatically when a later headline confirms or denies the rumor.</p>
 <div class="box tiers-legend">${Object.entries(sc).map(([t,n])=>`<span><i class="meter m${n}">${'▮'.repeat(n)}${'▯'.repeat(4-n)}</i> ${t}</span>`).join('')}</div>
 <div class="chips">${['All','Rumor','Confirmed','Denied','National insider','Beat writer / team','Fan blog','Aggregator / other'].map(f=>`<button class="chip rm-f${rmF===f?' on':''}" data-f="${f}">${f}</button>`).join('')}</div>
 <div class="rm-list">${list.map(r=>`<article class="box rm"><div class="rm-top"><span class="st st-${r.status.toLowerCase()}">${r.status}</span><i class="meter m${sc[r.tier]}" title="${E(r.tier)}">${'▮'.repeat(sc[r.tier])}${'▯'.repeat(4-sc[r.tier])}</i><small>${E(r.tier)} · ${E(r.source)} · ${ago(r.published)}</small></div>
  <a class="hl ext-native" href="${E(r.link)}" target="_blank" rel="noopener" data-native="1">${E(r.title)}</a>${r.summary?`<p>${E(r.summary)}</p>`:''}${r.status_note?`<p class="fine">${r.status==='Confirmed'?'✅ Confirmed by':'❌ Denied by'}: <a href="${E(r.status_link)}" target="_blank" rel="noopener" data-native="1" class="ext-native">${E(r.status_note)}</a></p>`:''}</article>`).join('')||'<p class="empty">No rumors in the last 5 days</p>'}</div>
 <p class="fine">${E(d.method)}</p>`;}
window.BGD_renderRumors=rumors;

// ---------- Live hub ----------
let liveTimer=null;
async function live(){const el=$('live-body');if(!el)return;let d;try{d=await J('data/live.json');}catch(e){el.innerHTML='<p class="empty">Live data unavailable right now.</p>';return;}
 const n=d.next,state=d.state;
 el.innerHTML=`<p class="page-sub">${state==='in'?(d.live_feed===false?'<b class="live-dot">● GAME ON</b> Live scoring is coming soon; the final posts after the game.':'<b class="live-dot">● LIVE</b> Updates every 20 seconds.'):state==='pre'?'Pregame. Live updates start at kickoff.':'Showing the most recent final. The hub goes live automatically an hour before each kickoff.'} <small>Data as of ${ago(d.generated)}.</small></p>
 <div class="scorebug box">${d.teams.map(t=>`<div class="sb-team${t.abbr==='PIT'?' pit':''}"><b>${E(t.abbr)}</b><span>${E(t.name)}</span><strong>${E(t.score??'0')}</strong></div>`).join('<span class="sb-at">'+(state==='pre'?'vs':'')+'</span>')}
  <p class="sb-status">${E(d.detail)}${d.situation?' · '+E(d.situation):''}</p></div>
 ${n&&!d.window?`<p class="box">Next: Steelers ${n.home?'vs':'at'} <b>${E(n.opponent)}</b>, ${et(n.date,{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})} ET${n.tv?' · '+E(n.tv):''}. <a href="#/opponent">Opponent preview →</a></p>`:''}
 <div class="live-grid"><section><h2 class="section-title">Play-by-play</h2><div class="box pbp">${d.plays.length?d.plays.map(p=>`<p class="${p.scoring?'score':''}"><small>${E(p.team||'')} · Q${E(p.q)} ${E(p.clock||'')}</small>${E(p.text)}</p>`).join(''):(d.live_feed===false?'<p class="fine">Live play-by-play is coming soon. For now this hub shows kickoff info and the final score once it posts.</p>':'<p class="fine">Plays appear here once the game starts.</p>')}</div></section>
 <section><h2 class="section-title">Scoring</h2><div class="box">${d.scoring.map(p=>`<p><b>${E(p.team)}</b> Q${E(p.q)} ${E(p.clock)}: ${E(p.text)} <small>(${E(p.away)}-${E(p.home)})</small></p>`).join('')||'<p class="fine">No scoring yet.</p>'}</div>
 <h2 class="section-title">Game chat</h2><div class="box chat"><p class="fine">Live chat opens when member accounts launch. Until then, join the Dispatch Desk's game thread in the <a href="#/forum">forum</a>.</p><textarea disabled placeholder="Chat opens at launch"></textarea></div></section></div>
 <p class="fine">${E(d.note||'')} Data: nflverse (CC-BY 4.0).</p>`;
 clearTimeout(liveTimer);if(state==='in'||d.window)liveTimer=setTimeout(()=>{if(location.hash.startsWith('#/live'))live();},20000);}

// ---------- Pick'em + Trivia ----------
function play(){const el=$('play-body'),p=X.pick,h=X.hist;if(!el||!p)return;const key='sd_picks_'+p.season+'_w'+p.week,skey=key+'_saved';
 const saved=JSON.parse(localStorage.getItem(key)||'{}');if(!X.draftPicks||X.draftKey!==key){X.draftPicks=Object.assign({},saved);X.draftKey=key;}const picks=X.draftPicks;
 const isLocked=g=>g.state!=='pre'||new Date(g.date)<=new Date();
 const open=p.games.filter(g=>!isLocked(g)),made=open.filter(g=>picks[g.id]).length;
 const dirty=JSON.stringify(Object.keys(picks).filter(k=>picks[k]).sort().map(k=>k+picks[k]))!==JSON.stringify(Object.keys(saved).filter(k=>saved[k]).sort().map(k=>k+saved[k]));
 const savedAt=localStorage.getItem(skey);
 let right=0,done=0;p.games.forEach(g=>{if(g.completed&&saved[g.id]){done++;const w=g.home.winner?g.home.abbr:g.away.winner?g.away.abbr:null;if(w===saved[g.id])right++;}});
 const tq=h&&h.trivia.length?h.trivia[Math.floor((Date.now()-new Date('2026-01-01'))/864e5)%h.trivia.length]:null;
 const tkey='sd_trivia_'+new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'});const ans=localStorage.getItem(tkey);
 const status=X.pkMsg?X.pkMsg:(savedAt&&!dirty?`✅ <b>Picks saved</b> on this device (${new Date(savedAt).toLocaleString('en-US',{timeZone:'America/New_York',weekday:'short',hour:'numeric',minute:'2-digit'})} ET). You can change them until each game kicks off. Just tap a new team and hit Save again.`:dirty?'You have unsaved changes. Hit <b>Save my picks</b> to keep them.':'Pick as many games as you like, then hit <b>Save my picks</b>. Games that already started are locked and not required.');
 const bar=`<div class="box pk-save" style="position:sticky;bottom:calc(8px + var(--cb,0px));z-index:5;display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between"><span><b>${made}/${open.length}</b> open games picked</span><button type="button" class="btn pk-submit" ${made&&(dirty||!savedAt)?'':'disabled'}>${savedAt&&!dirty?'Picks saved ✓':'Save my picks'}</button><p class="fine pk-msg" role="status" style="flex-basis:100%;margin:0">${status}</p></div>`;
 el.innerHTML=`<p class="page-sub">Play now. Picks are saved <b>only on this device</b> for now. When free member accounts launch, saved picks will count toward a leaderboard.</p>
 <div class="play-grid"><section><h2 class="section-title">Week ${p.week} pick'em</h2>
 <p class="fine">Tap the team you think wins, then save. Picks lock at kickoff. ${done?`You're <b>${right}/${done}</b> on finished games.`:''}</p>
 <div class="picks">${p.games.map(g=>{const locked=isLocked(g);const pk=locked?saved[g.id]:picks[g.id];return`<div class="box pick${locked?' locked':''}"><small>${!locked?et(g.date,{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+' ET':E(g.state==='pre'?'Locked (kicked off)':g.detail)}</small>
  <div class="pick-row">${['away','home'].map(s=>{const t=g[s];return`<button type="button" class="pk${pk===t.abbr?' on':''}${t.winner?' won':''}" data-g="${g.id}" data-t="${t.abbr}" ${locked?'disabled':''}><b>${E(t.abbr)}</b><small>${E(t.record||'')}</small>${g.state!=='pre'?`<span>${E(t.score)}</span>`:''}</button>`}).join('<span class="at">@</span>')}</div></div>`}).join('')}</div>${bar}</section>
 <section><h2 class="section-title">Daily trivia</h2>${tq?`<div class="box trivia"><p class="tq">${E(tq.q)}</p><div class="topts">${tq.options.map(o=>`<button type="button" class="topt${ans?(o===tq.a?' right':o===ans?' wrong':''):''}" data-a="${E(o)}" ${ans?'disabled':''}>${E(o)}</button>`).join('')}</div>
  ${ans?`<p>${ans===tq.a?'✅ Correct!':'❌ The answer is <b>'+E(tq.a)+'</b>.'} ${tq.explain?E(tq.explain)+'.':''}</p><p class="fine">Source: ${tq.link?`<a href="${E(tq.link)}" ${EXT}>${E(tq.source)}</a>`:E(tq.source)}. New question tomorrow.</p>`:''}</div>`:'<p class="fine">Loading trivia…</p>'}
 <h2 class="section-title">Leaderboard</h2><div class="box"><p class="fine">The leaderboard opens when free member accounts launch. No scores are shown until real players exist.</p></div></section></div>`;
 X.pkMsg=null;
 el.onclick=e=>{const b=e.target.closest('.pk');if(b&&!b.disabled){const g=p.games.find(x=>x.id===b.dataset.g);if(g&&isLocked(g)){play();return;}picks[b.dataset.g]=picks[b.dataset.g]===b.dataset.t?undefined:b.dataset.t;play();return;}
  const sb=e.target.closest('.pk-submit');if(sb&&!sb.disabled){const keep={};p.games.forEach(g=>{if(isLocked(g)){if(saved[g.id])keep[g.id]=saved[g.id];}else if(picks[g.id])keep[g.id]=picks[g.id];});
   try{localStorage.setItem(key,JSON.stringify(keep));localStorage.setItem(skey,new Date().toISOString());X.draftPicks=Object.assign({},keep);}catch(err){X.pkMsg='⚠️ Your browser blocked saving (private browsing may do this). Try a regular browser window.';}
   play();return;}
  const t=e.target.closest('.topt');if(t&&!t.disabled){localStorage.setItem(tkey,t.dataset.a);play();}};}

// ---------- History ----------
function history(){const d=X.hist,el=$('history-body');if(!d||!el)return;const t=new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'}).slice(5);
 const md=t,games=d.games.filter(g=>g.md===md),facts=d.facts.filter(f=>f.md===md);
 const label=new Date().toLocaleDateString('en-US',{timeZone:'America/New_York',month:'long',day:'numeric'});
  el.innerHTML=`<h2 class="section-title">This day in Steelers history: ${label}</h2>
 <div class="box">${facts.map(f=>`<p>🏆 <b>${f.year}:</b> ${E(f.text)} <small>Source: <a href="${E(f.link)}" ${EXT}>${E(f.source)}</a>, <a href="https://creativecommons.org/licenses/by-sa/4.0/" ${EXT}>CC BY-SA 4.0</a></small></p>`).join('')}
 ${games.length?games.map(g=>`<p><b>${g.date.slice(0,4)}:</b> Steelers ${g.result==='W'?'beat':g.result==='L'?'lost to':'tied'} the ${E(g.opp)} ${g.pit}-${g.opp_pts} ${g.home?'at home':'on the road'}${g.playoff?' (playoffs)':''}. <small><a href="${E(g.link)}" ${EXT}>Box score</a></small></p>`).join(''):''}
 ${!facts.length&&!games.length?'<p class="fine">No Steelers games or milestones on this date in our verified records.</p>':''}</div>
 <h2 class="section-title">Record book since 2001</h2>
 <div class="box tbl-wrap"><table class="cap"><thead><tr><th>Record</th><th>Mark</th><th>Game</th></tr></thead><tbody>${d.records.map(r=>`<tr><td>${E(r.record)}</td><td><b>${E(r.value)}</b></td><td>${r.game?`<a href="${E(r.game.link)}" ${EXT}>${E(r.game.date)} ${r.game.home?'vs':'at'} ${E(r.game.opp)} ${r.game.pit}-${r.game.opp_pts}</a>`:'—'}</td></tr>`).join('')}</tbody></table></div>
 <p class="fine">Game results: nflverse schedules, CC-BY 4.0 (${E(d.game_range)}); earlier seasons are left out instead of guessed. Milestones and Super Bowls are checked against Wikipedia's text every week; any fact that can't be matched is dropped automatically. Wikipedia-derived facts: Source: Wikipedia, licensed <a href="https://creativecommons.org/licenses/by-sa/4.0/" ${EXT}>CC BY-SA 4.0</a>; wording adapted by Black & Gold Dispatch. Licensed only as described in our free API terms (<a href="llms.txt">llms.txt</a>).</p>`;}

// ---------- Alerts & email ----------
function alerts(){const el=$('alerts-body');if(!el)return;const sw='serviceWorker' in navigator,pn='PushManager' in window;
 el.innerHTML=`<p class="page-sub">The Daily Huddle email sign-up is live. Push alerts are coming soon.</p>
 <div class="alerts-grid"><section class="box"><h2>The Daily Huddle email</h2><p>Every morning: top Steelers news, today's podcasts, the heat-map leader and the next game.</p>
  <form class="signup" data-nl onsubmit="return BGD_sub(event,this)"><input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">
  <label for="al-em" class="sr">Email</label><input id="al-em" type="email" placeholder="you@email.com" required><button class="btn">Notify me</button><p class="fine age13">You must be 13 or older to sign up. Emails are sent by Kit (ConvertKit). We use double opt-in, and every email has a one-click unsubscribe. <a href="legal/privacy.html">Privacy</a></p><p class="msg fine" role="status" aria-live="polite"></p></form></section>
 <section class="box"><h2>Push alerts</h2><p>Breaking news, injury updates and game-day reminders on your phone.</p>
  ${['Breaking news','Injury report changes','Game-day kickoff + final score','Daily trivia reminder'].map(t=>`<label class="tog"><input type="checkbox" disabled> ${t}</label>`).join('')}
  <button class="btn" type="button" disabled>Turn on alerts (coming soon)</button><p class="fine">Your browser ${sw&&pn?'supports':'may not support'} web push.</p></section></div>`;}

const SRCS={inj:['data/injuries.json',injuries],cap:['data/cap.json',cap],rum:['data/rumors.json',rumors],pick:['data/pickem.json',play],hist:['data/history.json',()=>{history();play();}]};
Object.entries(SRCS).forEach(([k,[u,f]])=>J(u).then(d=>{X[k]=d;f();}).catch(()=>{}));
document.addEventListener('click',e=>{const c=e.target.closest('.cap-sort');if(c){capSort=c.dataset.k;cap();}const r=e.target.closest('.rm-f');if(r){rmF=r.dataset.f;rumors();}});
document.addEventListener('route',e=>{const v=e.detail;if(v==='live')live();else clearTimeout(liveTimer);if(v==='alerts')alerts();if(v==='play')play();if(v==='history')history();});
if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('sw.js').catch(()=>{}); // scaffold: registers only, never subscribes
})();

// ---------- Depth chart (Depth Chart & Roster page) ----------
(function(){const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const tag={Out:'s-out',Doubtful:'s-doubt',Questionable:'s-q','Injured Reserve':'s-ir','Physically Unable to Perform':'s-ir'};
 const ab={Out:'OUT',Doubtful:'D',Questionable:'Q','Injured Reserve':'IR','Physically Unable to Perform':'PUP'};
 const pc=p=>p?`<${p.link?'a':'span'} class="dp"${p.link?` href="${E(p.link)}" target="_blank" rel="noopener"`:''}>${p.jersey?'<small>#'+E(p.jersey)+'</small> ':''}${E(p.name)}${p.injury?` <span class="pill ${tag[p.injury]||''}">${ab[p.injury]||E(p.injury)}</span>`:''}</${p.link?'a':'span'}>`:'<span class="dp none">—</span>';
 let D=null;let uSel='Offense';
 function render(){const el=document.getElementById('depth-body');if(!el||!D)return;const u=D.units.find(x=>x.unit===uSel)||D.units[0];
  el.innerHTML=`<p class="fine">Last updated ${new Date(D.generated).toLocaleString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})} ET · refreshed every update cycle · formation: ${E(u.formation)}</p>
  <div class="chips">${D.units.map(x=>`<button class="chip dc-u${x.unit===u.unit?' on':''}" data-u="${E(x.unit)}">${E(x.unit)}</button>`).join('')}</div>
  <div class="box depth"><div class="dr dh"><span>Position</span><span>Starter</span><span>2nd</span><span>3rd</span><span>Others</span></div>
  ${u.rows.map(r=>`<div class="dr"><span class="dpos"><b>${E(r.slot)}</b><small>${E(r.label)}</small></span>${[0,1,2].map(i=>`<span class="ds" data-s="${['Starter','2nd','3rd'][i]}">${pc(r.players[i])}</span>`).join('')}<span class="ds more" data-s="Others">${r.players.slice(3).map(pc).join(' ')||'<span class="dp none">—</span>'}</span></div>`).join('')}</div>
  <p class="fine">${E(D.note)} Tags: OUT, D = doubtful, Q = questionable, IR = injured reserve.</p>`;}
 fetch(BGD_url('data/depth.json'),{cache:'no-store'}).then(r=>r.json()).then(d=>{D=d;render();}).catch(()=>{});
 setInterval(()=>fetch(BGD_url('data/depth.json'),{cache:'no-store'}).then(r=>r.json()).then(d=>{D=d;render();}).catch(()=>{}),5*60*1000);
 document.addEventListener('click',e=>{const b=e.target.closest('.dc-u');if(b){uSel=b.dataset.u;render();}});})();
