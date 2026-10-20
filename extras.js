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
// Box score panel on the Live Hub: final box between games, a kickoff note before the game. nflverse posts stats after the game.
async function liveBox(d){const el=$('live-box');if(!el)return;const H='<h2 class="section-title">Box score</h2>';
 if(d.state==='pre'){el.innerHTML=H+'<div class="box"><p class="fine">Box score will appear at kickoff.</p></div>';return;}
 const id=d.nflverse_id||'';let b=d.box||null;if(!b&&id){try{b=await J('data/boxscores/'+encodeURIComponent(id)+'.json');}catch(e){}}
 if(!el.isConnected)return;
 if(!b||!window.BGDBox){el.innerHTML=H+`<div class="box"><p class="fine">${d.state==='in'?'Game in progress. Our free stats source (nflverse) publishes the box score after the final whistle, usually within a few hours, and it appears here automatically.':'The box score for this game hasn\'t posted yet. It appears here automatically, usually within a few hours of the final whistle.'}</p></div>`;return;}
 el.innerHTML=H+BGDBox.panel(b);}
// Live data: /api/live (Pages Function, edge-cached ~15-20s, live provider during games) with the static file as backup.
async function liveData(){try{const r=await fetch('/api/live',{cache:'no-store'});if(r.ok){const d=await r.json();if(d&&d.teams)return d;}}catch(e){}return J('data/live.json');}
async function live(){const el=$('live-body');if(!el)return;let d;try{d=await liveData();}catch(e){el.innerHTML='<p class="empty">Live data unavailable right now.</p>';return;}
 const n=d.next,state=d.state;
 el.innerHTML=`<p class="page-sub">${state==='in'?(d.live_feed===false?'<b class="live-dot">● GAME ON</b> Live scoring is coming soon; the final posts after the game.':'<b class="live-dot">● LIVE</b> Updates every 20 seconds.'):state==='pre'?'Pregame. Live updates start at kickoff.':'Showing the most recent final. The hub goes live automatically an hour before each kickoff.'} <small>Data as of ${ago(d.generated)}.</small></p>
 <div class="scorebug box">${d.teams.map(t=>`<div class="sb-team${t.abbr==='PIT'?' pit':''}"><b>${E(t.abbr)}</b><span>${E(t.name)}</span><strong>${E(t.score??'0')}</strong></div>`).join('<span class="sb-at">'+(state==='pre'?'vs':'')+'</span>')}
  <p class="sb-status">${E(d.detail)}${(()=>{const s=d.situation?(typeof d.situation==='string'?d.situation:(d.situation.text||d.situation.downDistanceText||'')):'';return s&&state!=='post'?' · '+E(s):'';})()}</p></div>
 ${d.quarters&&Object.keys(d.quarters).length&&!d.box?`<div class="box bs-q"><table class="bs-t"><thead><tr><th></th>${Object.keys(d.quarters).map(q=>`<th>${q==='5'?'OT':'Q'+q}</th>`).join('')}<th>F</th></tr></thead><tbody>${d.teams.map(t=>`<tr><th scope="row">${E(t.abbr)}</th>${Object.keys(d.quarters).map(q=>`<td>${E(d.quarters[q][t.homeAway])}</td>`).join('')}<td><b>${E(t.score)}</b></td></tr>`).join('')}</tbody></table></div>`:''}
 ${state==='in'&&window.BGDField?`<section id="live-field"><h2 class="section-title">On the field</h2>${BGDField.html(d)}</section>`:''}
 ${n&&!d.window?`<p class="box">Next: Steelers ${n.home?'vs':'at'} <b>${E(n.opponent)}</b>, ${et(n.date,{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})} ET${n.tv?' · '+E(n.tv):''}. <a href="#/opponent">Opponent preview →</a></p>`:''}
 <div class="live-grid"><section><h2 class="section-title">Play-by-play</h2><div class="box pbp">${d.plays.length?d.plays.map(p=>`<p class="${p.scoring?'score':''}"><small>${E(p.team||'')} · Q${E(p.q)} ${E(p.clock||'')}</small>${E(p.text)}</p>`).join(''):(d.live_feed===false?'<p class="fine">Live play-by-play is coming soon. For now this hub shows kickoff info and the final score once it posts.</p>':'<p class="fine">Plays appear here once the game starts.</p>')}</div></section>
 <section><h2 class="section-title">Scoring</h2><div class="box">${d.scoring.map(p=>`<p><b>${E(p.team)}</b> Q${E(p.q)} ${E(p.clock)}: ${E(p.text)} <small>(${E(p.away)}-${E(p.home)})</small></p>`).join('')||'<p class="fine">No scoring yet.</p>'}</div>
 <h2 class="section-title">Game chat</h2><div id="live-chat-slot"></div></section></div>
 <section class="lb-box" id="live-box" aria-live="polite"></section>
 <p class="fine">${E(d.note||'')} Data: nflverse (CC-BY 4.0).</p>`;
 liveBox(d);
 clearTimeout(liveTimer);const every=d.poll_ms||(state==='in'||d.window?25000:0);   // poll only while a game is on (or about to start)
 if(every)liveTimer=setTimeout(function tick(){if(!location.hash.startsWith('#/live'))return;if(document.hidden){liveTimer=setTimeout(tick,every);return;}live();},every);}

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
 const status=X.pkMsg?X.pkMsg:(savedAt&&!dirty?`<b>Picks saved</b> on this device (${new Date(savedAt).toLocaleString('en-US',{timeZone:'America/New_York',weekday:'short',hour:'numeric',minute:'2-digit'})} ET). You can change them until each game kicks off. Just tap a new team and hit Save again.`:dirty?'You have unsaved changes. Hit <b>Save my picks</b> to keep them.':'Pick as many games as you like, then hit <b>Save my picks</b>. Games that already started are locked and not required.');
 const bar=`<div class="box pk-save" style="position:sticky;bottom:calc(8px + var(--cb,0px));z-index:5;display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between"><span><b>${made}/${open.length}</b> open games picked</span><button type="button" class="btn pk-submit" ${made&&(dirty||!savedAt)?'':'disabled'}>${savedAt&&!dirty?'Picks saved':'Save my picks'}</button><p class="fine pk-msg" role="status" style="flex-basis:100%;margin:0">${status}</p></div>`;
 el.innerHTML=`<p class="page-sub">Play now. Picks are saved <b>only on this device</b> for now. When free member accounts launch, saved picks will count toward a leaderboard.</p>
 <div class="play-grid"><section><h2 class="section-title">Week ${p.week} pick'em</h2>
 <p class="fine">Tap the team you think wins, then save. Picks lock at kickoff. ${!open.length?'<b>Every game on this slate has kicked off.</b> Next week\'s games open here soon. ':''}${done?`You're <b>${right}/${done}</b> on finished games.`:''}</p>
 <div class="picks">${p.games.map(g=>{const locked=isLocked(g);const pk=locked?saved[g.id]:picks[g.id];return`<div class="box pick${locked?' locked':''}"><small>${!locked?et(g.date,{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+' ET':'Locked · '+E(g.state==='pre'?'kicked off':g.detail)}</small>
  <div class="pick-row">${['away','home'].map(s=>{const t=g[s];return`<button type="button" class="pk${pk===t.abbr?' on':''}${t.winner?' won':''}" data-g="${g.id}" data-t="${t.abbr}" ${locked?'disabled':''}><b>${E(t.abbr)}</b><small>${E(t.record||'')}</small>${g.state!=='pre'?`<span>${E(t.score)}</span>`:''}</button>`}).join('<span class="at">@</span>')}</div></div>`}).join('')}</div>${bar}</section>
 <section><h2 class="section-title">Daily trivia</h2>${tq?`<div class="box trivia"><p class="tq">${E(tq.q)}</p><div class="topts">${tq.options.map(o=>`<button type="button" class="topt${ans?(o===tq.a?' right':o===ans?' wrong':''):''}" data-a="${E(o)}" ${ans?'disabled':''}>${E(o)}</button>`).join('')}</div>
  ${ans?`<p>${ans===tq.a?'<b>Correct!</b>':'Not quite. The answer is <b>'+E(tq.a)+'</b>.'} ${tq.explain?E(tq.explain)+'.':''}</p><p class="fine">Source: ${tq.link?`<a href="${E(tq.link)}" ${EXT}>${E(tq.source)}</a>`:E(tq.source)}. New question tomorrow.</p>`:''}</div>`:'<p class="fine">Loading trivia…</p>'}
 <h2 class="section-title">Leaderboard</h2><div class="box"><p class="fine">The leaderboard opens when free member accounts launch. No scores are shown until real players exist.</p></div></section></div>`;
 X.pkMsg=null;
 el.onclick=e=>{const b=e.target.closest('.pk');if(b&&!b.disabled){const g=p.games.find(x=>x.id===b.dataset.g);if(g&&isLocked(g)){play();return;}picks[b.dataset.g]=picks[b.dataset.g]===b.dataset.t?undefined:b.dataset.t;play();return;}
  const sb=e.target.closest('.pk-submit');if(sb&&!sb.disabled){const keep={};p.games.forEach(g=>{if(isLocked(g)){if(saved[g.id])keep[g.id]=saved[g.id];}else if(picks[g.id])keep[g.id]=picks[g.id];});
   try{localStorage.setItem(key,JSON.stringify(keep));localStorage.setItem(skey,new Date().toISOString());X.draftPicks=Object.assign({},keep);}catch(err){X.pkMsg='Your browser blocked saving (private browsing may do this). Try a regular browser window.';}
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

// ---------- Newsletter page (old Alerts & Email) ----------
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

// ---------- Listen Live (radio link-outs only: no players, streams, iframes or station logos) ----------
// Sidebar copy only on the main nav tabs (on home it sits directly under the AFC North box; standings.js is untouched).
// One-column screens (<900px) drop the sidebar below the content, so the Live Hub also shows a copy near its top,
// and the sidebar copy is hidden on the Live Hub there so the box never shows twice on one screen.
// Time-aware: shows, phases and LIVE badges come from data/radio_shows.json (sched.rules, all US Eastern) and the
// kickoff times in data/schedule.json. A show is only marked LIVE when its time is known; estimates say "about".
(function(){const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const ST=[
  {k:'wdve',n:'102.5 WDVE',s:'Pittsburgh',l:'Flagship of the Steelers Audio Network: game-day pregame, the game and postgame. Online, the live game call is limited by NFL rules; pregame and postgame stream.',u:'https://www.iheart.com/live/1025-dve-2017/',b:'Listen on iHeart'},
  {k:'fan',n:'93.7 The Fan',s:'KDKA-FM',l:'Pittsburgh sports talk, with Steelers talk all week. It does not carry the Steelers game broadcast.',u:'https://www.audacy.com/stations/937thefan',b:'Listen on Audacy'}];
 const TZ='America/New_York',MIN=6e4,GAME_EST=195*MIN;   // final whistle estimated at kickoff + 3h15m until confirmed
 const NOW=()=>Date.now();
 // --- Eastern-time helpers ---
 const fmtP=new Intl.DateTimeFormat('en-US',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',weekday:'short',hourCycle:'h23'});
 function et(t){const o={};fmtP.formatToParts(new Date(t)).forEach(p=>o[p.type]=p.value);return {y:+o.year,m:+o.month,d:+o.day,h:+o.hour%24,mi:+o.minute,wd:o.weekday,date:`${o.year}-${o.month}-${o.day}`};}
 function etTime(date,hm){const [y,m,d]=date.split('-').map(Number),[h,mi]=hm.split(':').map(Number);let g=Date.UTC(y,m-1,d,h,mi);
  for(let i=0;i<2;i++){const p=et(g),asUTC=Date.UTC(p.y,p.m-1,p.d,p.h,p.mi);g+=Date.UTC(y,m-1,d,h,mi)-asUTC;}return g;}
 const addDays=(date,n)=>{const [y,m,d]=date.split('-').map(Number);return new Date(Date.UTC(y,m-1,d+n)).toISOString().slice(0,10);};
 const hm=t=>new Date(t).toLocaleTimeString('en-US',{timeZone:TZ,hour:'numeric',minute:'2-digit'});
 const dayLbl=(t,now)=>{const a=et(t).date,b=et(now).date;return a===b?'':a===addDays(b,1)?'tomorrow ':new Date(t).toLocaleDateString('en-US',{timeZone:TZ,weekday:'short'})+' ';};
 function dur(ms){const s=Math.max(0,Math.floor(ms/1000)),d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),x=s%60;
  return d?`${d}d ${h}h`:h?`${h}h ${String(m).padStart(2,'0')}m`:`${m}m ${String(x).padStart(2,'0')}s`;}
 // --- data ---
 let SH=null,SC=null,LV=null;
 const getJ=u=>fetch(BGD_url(u),{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null);
 function load(){return Promise.all([getJ('data/radio_shows.json'),getJ('data/schedule.json'),getJ('data/live.json')]).then(([a,b,c])=>{if(a)SH=a;if(b)SC=b;if(c)LV=c;});}
 function games(){const g=(SC&&SC.games)||[];return g.map(x=>({id:x.nflverse_id,ko:Date.parse(x.date),opp:x.opponent,home:x.home,completed:!!x.completed})).filter(x=>x.ko).sort((a,b)=>a.ko-b.ko);}
 // final whistle: confirmed (schedule says completed, or live.json says this game is final) or estimated
 function fin(g,now){const lvFinal=LV&&LV.nflverse_id===g.id&&(LV.state==='post'||LV.completed);
  if(g.completed||lvFinal){return {t:Math.min(g.ko+GAME_EST,now),sure:true,known:false};}
  if(now>=g.ko+240*MIN)return {t:g.ko+GAME_EST,sure:true,known:false};      // 4h after kickoff the game is certainly over
  return {t:g.ko+GAME_EST,sure:false,known:false};}
 // occurrences of one show around now: [{s,e,est,sure}]
 function occ(show,now){const R=(show.sched&&show.sched.rules)||[],out=[],today=et(now).date,G=games();
  const dated=new Set(R.filter(r=>r.type==='dated').map(r=>r.date));
  const recent=G.some(g=>g.ko<=now&&g.ko>now-8*864e5);
  for(const r of R){
   if(r.type==='dated'){const s=etTime(r.date,r.start),e=etTime(r.date,r.end);out.push({s,e,est:false,sure:true});}
   else if(r.type==='weekly'){for(let i=-1;i<=8;i++){const dt=addDays(today,i),wd=et(etTime(dt,'12:00')).wd;if(!(r.days||[]).includes(wd)||dated.has(dt))continue;
     if(r.needs_recent_game&&!recent)continue;out.push({s:etTime(dt,r.start),e:etTime(dt,r.end),est:false,sure:true});}}
   else if(r.type==='kickoff'){for(const g of G){if(dated.has(et(g.ko).date))continue;if(r.only_kickoff_et){const p=et(g.ko);if(`${String(p.h).padStart(2,'0')}:${String(p.mi).padStart(2,'0')}`!==r.only_kickoff_et)continue;}
     out.push({s:g.ko+(r.start_offset_min||0)*MIN,e:g.ko+(r.end_offset_min||0)*MIN,est:false,sure:true});}}
   else if(r.type==='after_game'){for(const g of G){if(dated.has(et(g.ko).date))continue;const f=fin(g,now);out.push({s:f.t,e:f.t+(r.duration_min||0)*MIN,est:true,sure:f.sure,after:true});}}}
  return out.filter(o=>o.e>now-864e5&&o.s<now+9*864e5).sort((a,b)=>a.s-b.s);}
 function stat(show,now){const o=occ(show,now);const on=o.find(x=>x.s<=now&&now<x.e&&x.sure);if(on)return {live:true,o:on};const nx=o.find(x=>x.s>now);return {live:false,o:nx||null};}
 // --- phase of the week ---
 function phase(now){const G=games(),today=et(now).date;
  const g=G.find(g=>(et(g.ko).date===today&&now<g.ko)||(now>=g.ko&&now<fin(g,now).t+4*36e5));   // game day from midnight ET, through ~4h after the final
  if(g){const f=fin(g,now);
   if(now<g.ko)return {k:'pre',grp:'pre',h:'Pre-game shows',g};
   if(now<f.t&&!(f.sure&&LV&&LV.nflverse_id===g.id&&LV.state==='post'))return {k:'game',grp:'post',h:'Game in progress',g};
   return {k:'post',grp:'post',h:'Post-game shows',g,fin:f};}
  const p=et(now),last=[...G].reverse().find(x=>x.ko<now);
  if(p.wd==='Mon'&&p.h===15&&last&&last.ko>now-8*864e5)return {k:'presser',grp:'presser',h:'Monday press conference'};
  if(last&&addDays(et(last.ko).date,1)===today)return {k:'dayafter',grp:'dayafter',h:'Day after'};
  if(last&&et(last.ko).date===today)return {k:'dayafter',grp:'dayafter',h:'Day after',tonight:true};   // game night, post-game window over
  return {k:'weekday',grp:'dayafter',h:'Weekday shows'};}
 function visible(){return ((SH&&SH.groups)||[]).map(x=>({...x,shows:(x.shows||[]).filter(v=>!v.hidden&&v.name&&/^https:\/\//.test(v.url||''))})).filter(x=>x.shows.length);}
 const badge='<span class="ll-live" aria-label="Live now"><i aria-hidden="true"></i>LIVE</span>';
 const cd=(t,est)=>est?`about ${hm(t)} ET`:`<span class="ll-cd" data-at="${t}">${dur(t-NOW())}</span> · ${hm(t)} ET`;
 // --- Listen Live: one box per station ---
 const stName=k=>k==='wdve'?'102.5 WDVE':'93.7 The Fan';
 function stState(k,now){const ph=SH?phase(now):null;
  if(k==='wdve'&&ph&&ph.k==='game')return {live:true,txt:`Live now: Steelers ${ph.g.home?'vs':'at'} ${E(ph.g.opp.replace(/^.* /,''))} game call`,sub:'Online, the game call may be limited by NFL rules.'};
  let live=null,next=null;for(const s of visible().flatMap(g=>g.shows).filter(s=>s.station===k)){const x=stat(s,now);if(x.live){if(!live)live={s,x};}else if(x.o&&!x.o.est&&(!next||x.o.s<next.x.o.s))next={s,x};}
  if(live)return {live:true,txt:`Live now: ${E(live.s.name)}`,sub:`Ends ${live.x.o.est?'about ':''}${hm(live.x.o.e)} ET`};
  if(next)return {live:false,txt:`Next: ${E(next.s.name)} in <span class="ll-cd" data-at="${next.x.o.s}">${dur(next.x.o.s-now)}</span>`,sub:`${dayLbl(next.x.o.s,now)}${hm(next.x.o.s)} ET`};
  return null;}
 function box1(s){const b=SH?stState(s.k,NOW()):null;return `<h2 class="ll-h">${E(s.n)} <small>${E(s.s)}</small></h2>${b?`<p class="ll-st${b.live?' ll-st-on':''}">${b.live?badge+' ':''}${b.txt}${b.sub?` <small>· ${b.sub}</small>`:''}</p>`:''}<p class="ll-desc">${E(s.l)}</p><a class="ll-btn" href="${E(s.u)}" target="_blank" rel="noopener">${E(s.b)}<span class="sr"> (opens in a new tab)</span></a><p class="fine ll-fine">Unofficial fan site; not affiliated with this station.</p>`;}
 function boxes(){return ST.map(s=>{const b=SH?stState(s.k,NOW()):null;return `<section class="box ll-box${b&&b.live?' ll-on':''}" data-st="${s.k}" aria-label="Listen live: ${E(s.n)}">${box1(s)}</section>`;}).join('');}
 // --- Home page: single ON AIR NOW / UP NEXT bar ---
 function barHtml(){if(!SH)return '';const now=NOW(),ph=phase(now);let pick=null,nx=null;
  if(ph.k==='game')return `<span class="ll-live" aria-label="Live now"><i aria-hidden="true"></i>LIVE</span> <b>On air now:</b> Steelers ${ph.g.home?'vs':'at'} ${E(ph.g.opp.replace(/^.* /,''))} game call <small>on 102.5 WDVE</small>`;
  const all=visible().flatMap(g=>g.shows),ord=[...all.filter(s=>s.station),...all.filter(s=>!s.station)];
  for(const s of ord){const x=stat(s,now);if(x.live&&!pick)pick={s,x};else if(!x.live&&x.o&&!x.o.est&&(!nx||x.o.s<nx.x.o.s))nx={s,x};}
  if(pick)return `${badge} <b>On air now:</b> ${E(pick.s.name)} <small>${E(pick.s.station?stName(pick.s.station):pick.s.where)} · ends ${pick.x.o.est?'about ':''}${hm(pick.x.o.e)}</small>`;
  if(nx)return `<b class="ll-next">Up next:</b> ${E(nx.s.name)} in <span class="ll-cd" data-at="${nx.x.o.s}">${dur(nx.x.o.s-now)}</span> <small>${E(nx.s.station?stName(nx.s.station):nx.s.where)} · ${dayLbl(nx.x.o.s,now)}${hm(nx.x.o.s)} ET</small>`;
  return '';}
 // --- Game-day shows list (Podcasts & YouTube page, All view) ---
 const open=new Set();
 function shows(compact){const now=NOW(),ph=phase(now),V=visible();if(!V.length)return '';
  const top=V.find(g=>g.key===ph.grp),rest=V.filter(g=>g!==top),ord=top?[top,...rest]:rest;
  const row=(s,isTop,nextRef)=>{const x=stat(s,now);let line='';
   if(x.live)line=`<span class="ll-now">On now · ends ${x.o.est?'about ':''}${hm(x.o.e)}</span>`;
   else if(isTop&&x.o&&nextRef&&s.name===nextRef.n)line=x.o.est?`Starts after the game, about ${hm(x.o.s)} ET`:`Starts in ${cd(x.o.s,false)}${dayLbl(x.o.s,now)?' '+dayLbl(x.o.s,now).trim():''}`;
   return `<li class="${x.live?'ll-on':''}"><a href="${E(s.url)}" target="_blank" rel="noopener">${E(s.name)}</a>${x.live?' '+badge:''} <small>${E(s.where)} · ${E(s.when)}</small>${line?`<span class="ll-when">${line}</span>`:''}</li>`;};
  const grp=(g,isTop)=>{const title=isTop&&ph.k==='weekday'&&g.key==='dayafter'?'Weekday talk shows':g.title;let nextRef=null;if(isTop){for(const s of g.shows){const x=stat(s,now);if(!x.live&&x.o&&(!nextRef||x.o.s<nextRef.s))nextRef={s:x.o.s,n:s.name};}}
   let L=g.shows,more=0;
   if(compact&&isTop){const k=s=>{const x=stat(s,now);return x.live?-1e15+x.o.s:x.o?x.o.s:1e15;};L=L.slice().sort((a,b)=>k(a)-k(b));more=Math.max(0,L.length-4);L=L.slice(0,4);}
   const body=`<ul>${L.map(s=>row(s,isTop,nextRef)).join('')}</ul>${more?`<p class="ll-more"><a href="#/podcasts" class="ll-golist">${more} more ${title.toLowerCase().replace(/ shows$/,'')} shows on the full list →</a></p>`:''}`;
   return isTop?`<div class="ll-grp ll-top"><h3>${E(title)}</h3>${body}</div>`:`<details class="ll-grp" data-k="${E(g.key)}"${open.has(g.key)?' open':''}><summary>${E(g.title)} <small>(${g.shows.length})</small></summary>${body}</details>`;};
  const game=ph.k==='game'?`<div class="ll-game">${badge} <b>Steelers ${ph.g.home?'vs':'at'} ${E(ph.g.opp)}</b> is on now. <a href="#/live">See the live score</a> or <a href="${E(ST[0].u)}" target="_blank" rel="noopener">listen on 102.5 WDVE</a> (online, the game call may be limited by NFL rules).</div>`:'';
  return `<h2 class="section-title">${E(ph.h)}</h2>${game}${ord.map((g,i)=>grp(g,i===0&&!!top)).join('')}<p class="fine">${E(SH.note||'')} Live badges follow each show's published schedule.</p>`;}
 const st=document.createElement('style');st.textContent=`.ll-box{background:var(--black);color:#fff;border:3px solid var(--gold)!important;padding:14px 16px}.ll-box h2{color:var(--gold);text-transform:uppercase;letter-spacing:1px;font-weight:900;font-size:16px;margin:0 0 8px;line-height:1.25}
.ll-box .ll-sub{margin:-4px 0 8px;font-size:12px;color:#ccc}
.ll-row{display:flex;gap:10px;align-items:center;justify-content:space-between;padding:8px;margin:0 -8px;border-top:1px solid #333;border-radius:6px}.ll-txt{min-width:0;flex:1}.ll-txt b{color:#fff}.ll-txt small{color:var(--gold);font-weight:700}.ll-txt p{margin:3px 0 0;font-size:13px;line-height:1.35;color:#ccc}
.ll-btn{flex:none;background:var(--gold);color:var(--black)!important;font-weight:800;font-size:13px;padding:8px 10px;border-radius:4px;text-decoration:none;white-space:nowrap}.ll-btn:hover,.ll-btn:focus{background:#fff}
.ll-box .ll-fine{color:#aaa;margin:8px 0 0;font-size:11px}.ll-inline{margin:0 0 18px}@media(min-width:600px){.ll-inline{max-width:560px}}
.sidebar .ll-row{flex-direction:column;align-items:stretch}.sidebar .ll-btn{text-align:center}
@media(min-width:900px){#listen-live{display:none!important}}
.ll-live{display:inline-flex;align-items:center;gap:4px;background:#c8102e;color:#fff;font-weight:800;font-size:10.5px;letter-spacing:.5px;padding:2px 6px;border-radius:3px;vertical-align:2px;line-height:1.3}
.ll-live i{width:7px;height:7px;border-radius:50%;background:#fff;animation:llDot 1.8s ease-in-out infinite}
.ll-on{border:2px solid #e0303f!important;animation:llGlow 1.8s ease-in-out infinite}
@keyframes llGlow{0%,100%{box-shadow:0 0 0 0 rgba(224,48,63,.25)}50%{box-shadow:0 0 12px 2px rgba(224,48,63,.6)}}
@keyframes llDot{0%,100%{opacity:1}50%{opacity:.35}}
@media (prefers-reduced-motion:reduce){.ll-on,.ll-live i{animation:none!important}.ll-on{box-shadow:0 0 0 2px rgba(224,48,63,.35)}}
.ll-shows .ll-grp{margin:6px 0}.ll-shows ul{margin:4px 0 6px;padding:0;list-style:none}.ll-shows li{margin:6px 0;padding:6px 8px;border:1px solid #e6e6e6;border-radius:6px}
.ll-shows li small{display:block;color:#666}.ll-shows .ll-when{display:block;font-size:12.5px;font-weight:700;color:#111;margin-top:2px}.ll-shows .ll-now{color:#b00d24}
.ll-shows h3{font-size:14px;margin:8px 0 2px;text-transform:uppercase;letter-spacing:.5px}
.ll-shows .ll-top{border-left:4px solid var(--gold);padding:4px 0 2px 10px;background:#fffaf0}
.ll-shows details{border-top:1px solid #e6e6e6;padding:6px 0}.ll-shows summary{cursor:pointer;font-weight:800;text-transform:uppercase;font-size:12.5px;letter-spacing:.5px;color:#444}
.ll-shows details li{font-size:13px;padding:4px 8px}
.ll-wrap{display:flex;flex-direction:column;gap:10px;margin:0 0 18px}.sidebar .ll-wrap{margin:0}.ll-wrap .ll-box{margin:0}
.ll-box .ll-h small{color:#fff;font-size:11px;letter-spacing:.5px;margin-left:4px}
.ll-box .ll-st{margin:0 0 6px;font-size:13px;font-weight:700;color:#fff;line-height:1.35}.ll-box .ll-st small{font-weight:400;color:#ccc}
.ll-box .ll-desc{margin:0 0 8px;font-size:13px;line-height:1.35;color:#ccc}.ll-box .ll-btn{display:block;text-align:center}
.ll-box.ll-on{border:3px solid #e0303f!important}
@media(min-width:600px) and (max-width:899px){.ll-inline{flex-direction:row;max-width:none}.ll-inline .ll-box{flex:1}}
.ll-hubline{margin:0 0 14px}.ll-hubline .ll-link{margin:0;font-size:14px}.ll-hubline .ll-link a{font-weight:700}
#pods-radio{margin:0 0 18px}#pods-radio h2,#home-radio h2{margin-top:0}#home-radio{margin:0 0 18px}.sidebar #home-radio h2{font-size:18px}.sidebar #home-radio li{font-size:13px}.ll-shows .ll-more{margin:2px 0 4px;font-size:13px}.ll-shows .ll-more a{font-weight:700}
.ll-bar{margin:0 0 16px}.ll-bar p{margin:0;background:var(--black);color:#fff;border:2px solid var(--gold);border-radius:6px;padding:8px 12px;font-size:14px;line-height:1.4}
.ll-bar small{color:#ccc}.ll-bar a{color:var(--gold);font-weight:700;white-space:nowrap}.ll-bar .ll-next{color:var(--gold)}.ll-bar.ll-bar-on p{border-color:#e0303f;animation:llGlow 1.8s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.ll-bar.ll-bar-on p{animation:none!important}}
.ll-game{background:var(--black);color:#fff;border:2px solid var(--gold);border-radius:6px;padding:10px 12px;margin:6px 0 10px;font-size:14px}.ll-game a{color:var(--gold)}`;
 document.head.appendChild(st);
 function mk(id,cls){const w=document.createElement('div');w.id=id;w.className='ll-wrap'+(cls?' '+cls:'');w.setAttribute('role','region');w.setAttribute('aria-label','Listen live on Pittsburgh radio');w.innerHTML=boxes();return w;}
 const podsAll=()=>!/[?&]show=/.test(location.hash);   // the list shows only in the All view of the podcast page
 function draw(){document.querySelectorAll('.ll-wrap').forEach(w=>{w.innerHTML=boxes();});
  let SL='';if(SH){try{SL=shows();}catch(e){SL='';}}
  const sh=document.getElementById('pods-radio');if(sh&&SH){sh.innerHTML=SL;sh.hidden=!SL||!podsAll();}
  const hr=document.getElementById('home-radio');if(hr&&SH){let H=SL;if(!hr.closest('.sidebar')){try{H=shows(true);}catch(e){H='';}}hr.innerHTML=H;hr.hidden=!H;}
  const lh=document.getElementById('live-shows');if(lh&&SH){let h='';try{const ph=phase(NOW());
    h=(ph.k==='game'?`<div class="ll-game">${badge} <b>Steelers ${ph.g.home?'vs':'at'} ${E(ph.g.opp)}</b> is on now. The live score is just below, or <a href="${E(ST[0].u)}" target="_blank" rel="noopener">listen on 102.5 WDVE</a> (online, the game call may be limited by NFL rules).</div>`:'')+
     `<p class="ll-link"><b>Game-day radio shows:</b> pre-game, post-game and weekday times, with what's on now. <a href="#/podcasts" class="ll-golist">See the full list →</a></p>`;}catch(e){}
   lh.innerHTML=h;lh.hidden=!h;}
  const bar=document.getElementById('home-onair');if(bar){let h='';try{h=barHtml();}catch(e){}
   bar.innerHTML=h?`<p>${h} <a href="#/podcasts" class="ll-golist">Full show list →</a></p>`:'';bar.hidden=!h;bar.classList.toggle('ll-bar-on',/ll-live/.test(h));}}
 function tick(){const now=NOW();document.querySelectorAll('.ll-cd').forEach(el=>{const t=+el.dataset.at;if(t>now)el.textContent=dur(t-now);});}
 function goList(){let n=0;const f=()=>{const el=document.getElementById('pods-radio');if(el&&!el.hidden&&el.offsetParent){el.scrollIntoView({block:'start'});window.scrollBy(0,-80);}else if(n++<20)setTimeout(f,150);};setTimeout(f,150);}
 document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('.ll-golist');if(a){if(location.hash.replace(/\?.*/,'')==='#/podcasts'&&podsAll()){e.preventDefault();}goList();return;}
  if(e.target.closest&&e.target.closest('[data-pf]'))setTimeout(draw,30);});   // show filter clicks (pushState) hide/show the list
 addEventListener('popstate',()=>setTimeout(draw,30));addEventListener('hashchange',()=>setTimeout(draw,30));
 function setup(){const side=document.querySelector('.sidebar');
  if(side&&!document.getElementById('listen-side')){const a=document.getElementById('afcn-box'),ad=side.querySelector('.ad-box'),el=mk('listen-side');
   if(a&&a.parentNode===side)a.after(el);else if(ad)ad.after(el);else side.prepend(el);}
  const lv=document.querySelector('.view[data-view="live"]'),body=document.getElementById('live-body');
  if(lv&&body&&!document.getElementById('listen-live')){body.before(mk('listen-live','ll-inline'));
   const sh=document.createElement('section');sh.id='live-shows';sh.className='ll-hubline';sh.hidden=true;body.before(sh);}
  const pg=document.getElementById('pods-full-pg');
  if(pg&&!document.getElementById('pods-radio')){const sh=document.createElement('section');sh.id='pods-radio';sh.className='box ll-shows';sh.hidden=true;pg.after(sh);
   sh.addEventListener('toggle',e=>{const d=e.target.closest&&e.target.closest('details');if(d){d.open?open.add(d.dataset.k):open.delete(d.dataset.k);}},true);}
  // Home page copy of the show list: one element, moved between the sidebar (wide) and the main column (narrow) by place(), so it never shows twice
  if(!document.getElementById('home-radio')){const side2=document.querySelector('.sidebar');if(side2){const hr=document.createElement('section');hr.id='home-radio';hr.className='box ll-shows ll-home-shows';hr.hidden=true;hr.setAttribute('aria-label','Game-day radio shows');side2.appendChild(hr);
   hr.addEventListener('toggle',e=>{const d=e.target.closest&&e.target.closest('details');if(d){d.open?open.add(d.dataset.k):open.delete(d.dataset.k);}},true);}}
  const nb=document.getElementById('ib-next');
  if(nb&&!document.getElementById('home-onair')){const b=document.createElement('div');b.id='home-onair';b.className='ll-bar';b.hidden=true;b.setAttribute('aria-live','polite');nb.after(b);}
  draw();}
 function place(){setup();const s=document.getElementById('listen-side');if(!s)return;
  const cur=document.querySelector('.view:not([hidden])'),v=cur?cur.dataset.view:'home',wide=matchMedia('(min-width:900px)').matches;
  // Sidebar copy only on the main nav tabs (the ones before the More menu); hidden on every More route and other pages.
  const NAV={home:1,podcasts:1,film:1,opponent:1,live:1,heatmap:1,drafthub:1,draft:1};
  s.style.display=(!NAV[v]||(!wide&&v==='live'))?'none':'';
  // Keep the sidebar copy directly under the AFC North box when that box is in the sidebar (home/schedule, wide screens).
  // Wide screens: station boxes at the top of the sidebar; on home the AFC North box (when standings.js has it in the sidebar) sits right under them,
  // then the home copy of the show list. Works whether or not other sidebar boxes (e.g. the old Insider Tracker) exist.
  const side=s.parentNode,a=document.getElementById('afcn-box'),hr=document.getElementById('home-radio');
  if(wide&&side){if(side.firstElementChild!==s)side.prepend(s);if(a&&a.parentNode===side&&s.nextElementSibling!==a)s.after(a);}
  if(hr){if(wide&&side){const ref=(a&&a.parentNode===side)?a:s;if(ref.nextElementSibling!==hr)ref.after(hr);hr.style.display=v==='home'?'':'none';}
   else{const bar=document.getElementById('home-onair'),anc=bar||document.getElementById('ib-next');if(anc&&anc.nextElementSibling!==hr)anc.after(hr);hr.style.display='';}
   const mode=hr.closest('.sidebar')?'side':'main';if(hr.dataset.mode!==mode){hr.dataset.mode=mode;if(SH)draw();}}}
 document.addEventListener('route',()=>setTimeout(place,20));addEventListener('resize',()=>{clearTimeout(place.t);place.t=setTimeout(place,200);});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',place);else place();setTimeout(place,1500);setTimeout(place,4000);
 load().then(()=>{draw();place();});
 setInterval(tick,1000);                      // countdown digits every second
 let lastMin=Math.floor(NOW()/MIN);setInterval(()=>{const m=Math.floor(NOW()/MIN);if(m!==lastMin){lastMin=m;if(!document.hidden)draw();}},5000);   // live states/phase each minute
 setInterval(()=>{if(!document.hidden)load().then(draw);},5*MIN);   // pick up the final whistle and edits
})();
