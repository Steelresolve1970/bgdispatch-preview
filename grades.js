// Player Grades + Heat Map. Each tile shows the STATS grade (from nflverse weekly stats) until the player has 25+ real fan votes, then the FAN grade. No generated votes.
const G={ballot:null,week:null,season:null,mode:'week',picks:{},sel:null};
const GE=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const GROUPS={QB:'Quarterbacks',RB:'Running Backs',WR:'Wide Receivers',TE:'Tight Ends',OL:'Offensive Line',DL:'Defensive Line',LB:'Linebackers',DB:'Defensive Backs',ST:'Specialists'};
const gj=u=>fetch((window.BGD_url?BGD_url(u):u),{cache:'no-store'}).then(r=>{if(!r.ok)throw r.status;return r.json()});
const fmtD=(iso,o)=>new Date(iso).toLocaleString('en-US',{timeZone:'America/New_York',...o});

// Color scale: BLUE = cold/worst -> light gray (neutral) -> orange -> RED = hot/best, smooth interpolation on grade 3..9
const STOPS=[[3,[21,67,156]],[4.5,[90,150,210]],[6,[236,236,232]],[7.5,[230,110,60]],[9,[178,24,43]]];
function heat(v){v=Math.max(3,Math.min(9,v));for(let i=1;i<STOPS.length;i++){const[a,ca]=STOPS[i-1],[b,cb]=STOPS[i];
 if(v<=b){const t=(v-a)/(b-a);return`rgb(${ca.map((c,j)=>Math.round(c+(cb[j]-c)*t)).join(',')})`;}}return'rgb(178,24,43)';}
// WCAG: pick black or white text, whichever has the higher contrast on the tile color
function lum(rgb){const c=rgb.match(/\d+/g).map(x=>{x/=255;return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4)});return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2];}
const cold=v=>{if(v==null)return false;const L=lum(heat(v));return (1.05/(L+0.05))>((L+0.05)/0.05);};
const word=v=>v==null?'Awaiting votes':v>=8?'Hot (best)':v>=7?'Warm':v>=5.5?'Average':v>=4.5?'Cool':'Cold (worst)';
const tval=p=>p.source==='fan'?Math.sqrt(p.votes):p.source==='awaiting'?1.6:Math.sqrt((p.involvement||0)+2);
// Tile label: full name if it fits, else last name (skip Jr./III), else initial + short last name
const SUF=/^(jr\.?|sr\.?|ii|iii|iv|v)$/i;
function lbl(n,w){const ch=Math.max(3,Math.floor((w-8)/6.6));if(n.length<=ch)return n;const p=n.split(' ').filter(x=>!SUF.test(x));let l=p[p.length-1]||n;if(l.length<=ch)return l;return l.slice(0,Math.max(3,ch-1))+'.';}
const GSRC={editor:'Editor grade',fan:'Fan grade',stats:'Stats grade',mixed:'Stats + fan',awaiting:'Awaiting fan votes'}; // white text on the darkest blues and reds

// ---------- Ballot (live: same Grade the Team poll as the forum, saved through /api/grades/*) ----------
// Picks are keyed by the poll's item keys (team:overall, p:<gsis_id>, ...). One grade per item per account, never overwritten.
const GAPI=(p,body)=>fetch('/api/'+p,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'x-bgd':'1','content-type':'application/json'}:{'x-bgd':'1'},body:body?JSON.stringify(body):undefined})
 .then(r=>r.json().catch(()=>({ok:false,error:r.status>=500?'The site had a problem saving that. Please try again in a minute.':'Something went wrong. Please try again.'})))
 .catch(()=>({ok:false,error:'Network problem. Check your connection and try again.',net:true}));
async function loadLiveBallot(){const d=await GAPI('grades/ballot');const old=G.live&&G.live.ballot&&G.live.ballot.game_id;G.live=d&&d.ok?d:{ok:false,error:d&&d.error};
 const b=G.live.ballot;if(!b||b.game_id!==old)G.picks={};else(G.live.mine||[]).forEach(x=>delete G.picks[x.item]);renderBallot();}
const nextGrade=()=>`sessionStorage.setItem('bgd_next','grades')`;   // forum sign-in sends them back to #/grades
function renderBallot(msg){const el=document.getElementById('grades-body');if(!el)return;const d=G.live;
 if(!d){el.innerHTML='<p class="empty">Loading ballot…</p>';return;}
 if(!d.ok){el.innerHTML=`<div class="ballot-head"><p class="kind">Grade the Team</p><h2>Fan ballot</h2><p>Signed-in fans grade every player who played, 1 (awful) to 10 (elite).</p><p><a class="btn" href="#/forum/grade">Open the fan ballot</a></p></div>`;return;}
 const b=d.ballot;if(!b){el.innerHTML=`<div class="ballot-head"><p class="kind">Grade the Team</p><h2>No game to grade yet</h2><p>Grading opens at the final whistle.</p></div>`;return;}
 const me=d.me,mine={};(d.mine||[]).forEach(x=>mine[x.item]=x.grade);const av=(d.averages&&d.averages.items)||{};const voters=(d.averages&&d.averages.voters)||0;
 const can=b.open&&!!me;const n=Object.keys(G.picks).length,done=Object.keys(mine).length,total=b.items.length;
 const closes=b.closes?fmtD(b.closes,{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+' ET':'';
 const gate=!me&&b.open?`<p class="ballot-gate"><a class="btn" href="#/forum/signin" onclick="${nextGrade(b.game_id)}">Sign in to grade</a> <a class="btn ghost" href="#/forum/join" onclick="${nextGrade(b.game_id)}">Join free</a></p><p>Grading is free. Sign in (or join), and you come right back to this ballot.</p>`:'';
 el.innerHTML=`<div class="ballot-head"><p class="kind">${b.week?'Week '+b.week+' ballot':'Ballot'}</p><h2>${GE(b.label)}</h2>
  <p>${b.open?`Tap a number from 1 (awful) to 10 (elite) for each player you want to grade, then tap <b>Submit</b>. Open until <b>${closes}</b>.<br><b>Skip anyone you didn\'t see play.</b> Every player is optional and only the players you grade are counted.`:b.final_at?'Grading has closed for this game.':'Grading opens at the final whistle.'} ${voters} fan${voters===1?'':'s'} graded so far. Each grade can be cast once.</p>
  ${me?`<p class="fine">Signed in as <b>${GE(me.display_name||me.username)}</b>${done?` · you've graded ${done} of ${total}`:''}</p>`:''}${gate}
  ${!b.players_ready?'<p class="fine">Player grades appear here once the game\'s stats post (usually by the next morning). You can grade the team and coaches now and come back for the players.</p>':''}</div>
  ${['Team','Offense','Defense'].map(g=>{const it=b.items.filter(i=>i.group===g);if(!it.length)return'';return`<section class="pos-group"><h3>${g==='Team'?'Team &amp; coaches':g}</h3>${it.map(i=>{const had=mine[i.key],v=had||G.picks[i.key],a=av[i.key],off=!can||!!had;
   return`<div class="gplayer${had?' graded':''}"><div class="gp-top"><span><b>${GE(i.label)}</b>${i.limited?` <small class="gp-lim">${i.limited==='special teams only'?'Special teams only':'Limited snaps'}, fine to skip</small>`:''} <small>${i.pos?GE(i.pos)+' · ':''}${a?`Fans ${a.avg.toFixed(1)} (${a.n})`:'No fan grades yet'}</small></span><span class="gp-val ${v?'':'unset'}">${had?'Your grade '+had:v?v+'/10':'Skipped'}</span></div>
   <div class="scale" role="radiogroup" aria-label="Grade ${GE(i.label)}">${[1,2,3,4,5,6,7,8,9,10].map(x=>`<button type="button" role="radio" aria-checked="${v===x}" class="${v===x?'on':''}" data-k="${GE(i.key)}" data-v="${x}" ${off?'disabled':''} style="${v===x?`background:${heat(2.4+x*0.66)};color:${cold(2.4+x*0.66)?'#fff':'#111'}`:''}">${x}</button>`).join('')}</div></div>`}).join('')}</section>`}).join('')}
  ${can?`<div class="submit-bar"><span><b>${n}</b> new grade${n===1?'':'s'} ready${done?` · ${done} already counted`:''}<br><small>${msg?GE(msg):n?'Tap Submit to count them.':'Tap a number to grade a player.'}</small></span><button class="btn" type="button" id="ballot-submit" ${n&&!G.busy?'':'disabled'}>${G.busy?'Saving…':n?`Submit ${n} grade${n>1?'s':''}`:'Submit grades'}</button></div>`
   :!me&&b.open?`<div class="submit-bar"><span>Sign in to grade<br><small>Your grades count toward the fan heat map.</small></span><a class="btn" href="#/forum/signin" onclick="${nextGrade(b.game_id)}">Sign in</a></div>`:''}`;}
async function submitBallot(){const d=G.live;if(!d||!d.ballot||G.busy)return;const n=Object.keys(G.picks).length;if(!n)return;G.busy=true;renderBallot();
 const r=await GAPI('grades/vote',{game_id:d.ballot.game_id,grades:G.picks});G.busy=false;
 if(!r.ok){renderBallot(r.error||'That did not save. Please try again.');return;}
 const y=scrollY;await loadLiveBallot();scrollTo(0,y);renderBallot(`Thanks! ${r.saved} grade${r.saved===1?'':'s'} counted.${r.skipped?' '+r.skipped+' were already graded.':''}`);}
document.addEventListener('click',e=>{const t=e.target.closest('#grades-body .scale button');if(t&&!t.disabled){const k=t.dataset.k,v=+t.dataset.v;if(G.picks[k]===v)delete G.picks[k];else G.picks[k]=v;const y=scrollY;renderBallot();scrollTo(0,y);return;}
 if(e.target.closest('#ballot-submit')){submitBallot();return;}
 if(e.target.closest('.ed-btn,.ed-modal'))return;
 const tl=e.target.closest('.tile');if(tl){G.sel=tl.dataset.name;renderHeat();document.getElementById('hm-detail')?.scrollIntoView({block:'nearest'});}
 const tg=e.target.closest('.toggle button');if(tg&&tg.dataset.hv){G.view=tg.dataset.hv;renderHeat();return;}if(tg){G.mode=tg.dataset.mode;G.sel=null;renderHeat();}});

// ---------- Squarified treemap ----------
function squarify(items,x,y,w,h){const out=[];const total=items.reduce((s,i)=>s+i.value,0);if(!total)return out;
 const scale=w*h/total;let rest=items.map(i=>({...i,area:i.value*scale}));
 while(rest.length){const short=Math.min(w,h);let row=[],best=Infinity;
  for(const it of rest){const r=[...row,it];const s=r.reduce((a,b)=>a+b.area,0);const mx=Math.max(...r.map(z=>z.area)),mn=Math.min(...r.map(z=>z.area));
   const worst=Math.max(short*short*mx/(s*s),(s*s)/(short*short*mn));if(worst>best)break;best=worst;row=r;}
  const s=row.reduce((a,b)=>a+b.area,0);
  if(w>=h){const cw=s/h;let cy=y;row.forEach(r=>{const ch=r.area/cw;out.push({...r,x,y:cy,w:cw,h:ch});cy+=ch;});x+=cw;w-=cw;}
  else{const rh=s/w;let cx=x;row.forEach(r=>{const cw=r.area/rh;out.push({...r,x:cx,y,w:cw,h:rh});cx+=cw;});y+=rh;h-=rh;}
  rest=rest.slice(row.length);}
 return out;}

// ---------- Heat map ----------
function heatRows(){if(G.mode==='season'){const s=G.season;return s?s.players.map(p=>({...p,shown:true})):[];}
 return G.week?G.week.players:[];}
function renderHeat(){const el=document.getElementById('heat-body');if(!el||!G.week||!G.season)return;
 const rows=heatRows(),shown=rows.filter(p=>p.shown),hidden=rows.filter(p=>!p.shown);
 const W=el.clientWidth||800,mobile=W<600,H=mobile?Math.max(760,W*2.1):620;
 const groups=Object.keys(GROUPS).map(g=>({g,players:shown.filter(p=>p.group===g)})).filter(x=>x.players.length)
   .map(x=>({...x,value:x.players.reduce((s,p)=>s+tval(p),0)}));
 const gr=squarify(groups.sort((a,b)=>b.value-a.value),0,0,W,H);
 let html='';
 gr.forEach(g=>{html+=`<div class="tm-group" style="left:${g.x}px;top:${g.y}px;width:${g.w}px;height:${g.h}px"><div class="tm-glabel">${g.g}</div>`;
  const tiles=squarify(g.players.map(p=>({...p,value:tval(p)})).sort((a,b)=>b.value-a.value),0,18,g.w-4,g.h-22);
  tiles.forEach(t=>{const tiny=t.w<84||t.h<50,micro=t.w<46||t.h<34;const nm=lbl(t.name,t.w);const tr=G.mode==='season'&&t.trend!=null?(t.trend>0?`<span class="arrow-up">▲${t.trend.toFixed(1)}</span>`:t.trend<0?`<span class="arrow-dn">▼${Math.abs(t.trend).toFixed(1)}</span>`:'▬'):'';
   const aw=t.avg==null;const src=GSRC[t.source]||'Stats grade';const ed=edOn();
   const tip=ed
     ? `${GE(t.name)} (${t.pos}): ${aw?'awaiting fan votes':src+' '+t.avg.toFixed(1)}${t.editor_note?' · '+GE(t.editor_note):''}`
     : `${GE(t.name)} (${t.pos})${aw?'':': '+t.avg.toFixed(1)}`;
   const srcSpan=ed?`<span class="src src-${t.source}">${t.source==='editor'?'EDITOR GRADE':t.source==='fan'?'FAN':t.source==='awaiting'?'Awaiting fan votes':t.source==='mixed'?'STATS+FAN':'STATS'}</span> `:'';
   const voteBit=ed&&t.source==='fan'?` · ${t.votes} votes`:'';
   html+=`<div class="tile${cold(t.avg)?' cold':''}${tiny?' tiny':''}${micro?' micro':''}${aw?' awaiting':''}" tabindex="0" data-name="${GE(t.name)}" title="${tip}"
    style="left:${t.x+1}px;top:${t.y}px;width:${t.w}px;height:${t.h}px;background:${aw?'#4a4a4a':heat(t.avg)}">${t.editor||(t.editor_weeks&&t.editor_weeks.length)?'<i class="ed-mark" title="Editor grade">✎</i>':''}<b>${GE(nm)}</b><span class="g">${aw?'—':t.avg.toFixed(1)} ${tr}</span><small>${srcSpan}${t.pos}${voteBit}</small>${edBtn(t)}</div>`;});
  html+='</div>';});
 const wk=G.week,s=G.season;const sel=rows.find(p=>p.name===G.sel);
 let det='';if(sel){const sp=s.players.find(p=>p.name===sel.name);
  const ed=edOn();
  det=`<div class="hm-detail" id="hm-detail"><h3>${GE(sel.name)} <small>${GE(sel.pos)}</small>${ed?` <span class="badge">${GSRC[sel.source]||''}</span>`:''}</h3>
   <p>${G.mode==='season'?`Season average <b>${sel.avg.toFixed(1)}</b> over ${sel.games} games${ed?` (${(GSRC[sel.source]||'').toLowerCase()})`:''}`:(sel.avg==null?`No grade yet for this game (snap counts not posted).${ed?` <b>Awaiting fan votes</b> (${sel.votes}/${wk.min_votes}).`:''}`:`Week ${wk.week} grade <b>${sel.avg.toFixed(1)}</b>${ed?`${sel.source!=='fan'?` · fan votes so far: ${sel.votes}/${wk.min_votes}`:` from ${sel.votes} votes`}${sel.editor?`<br><b>Editor grade</b> (computed grade was ${sel.computed_grade==null?'—':sel.computed_grade.toFixed(1)})${sel.editor_note?': '+GE(sel.editor_note):''}`:''}${sel.stats_line?`<br>${sel.group==='OL'?'Line play':'Box score'}: ${GE(sel.stats_line)}`:''}${sel.stats_terms&&sel.stats_terms.length?`<br><small>How the stats grade was built: ${GE(sel.stats_terms.join(' · '))} (see GRADES.md)</small>`:''}`:''}`)}${sp&&sp.trend!=null?` · trend vs last week: <b>${sp.trend>0?'▲':'▼'} ${Math.abs(sp.trend).toFixed(2)}</b>`:''}</p>
   ${sp?`<div class="spark">${sp.weekly.map(w=>`<span style="height:${w.avg*10}%;background:${heat(w.avg)}" title="Week ${w.week}: ${w.avg}"><em>W${w.week}</em></span>`).join('')}</div><br>`:''}</div>`;}
 el.innerHTML=`<p class="page-sub">${G.mode==='season'?`Season to date through Week ${s.through_week}: average of each player's weekly fan grades, with trend vs last week.`:`Week ${wk.week}: ${GE(wk.game)} (${GE(wk.score)}). Color = grade.`}</p>
  ${edOn()?`<p class="grade-src"><b>Editor: ${(()=>{const c={};rows.forEach(p=>c[p.source]=(c[p.source]||0)+1);return Object.entries(c).map(([k,v])=>`${GSRC[k]} (${v})`).join(' · ');})()}</b><br><small>Public page hides source labels. Stats grade until ${wk.min_votes} fan votes, then fan grade. OL line grade from sack rate / YPC / penalties × snap share.</small></p>`:''}
  <div class="hm-bar"><div class="toggle"><button data-mode="week" class="${G.mode==='week'?'on':''}">This week</button><button data-mode="season" class="${G.mode==='season'?'on':''}">Season (YTD)</button></div>
   <span class="legend">Cold <i style="background:linear-gradient(90deg,${heat(3)},${heat(5)},${heat(7)},${heat(9)})"></i> Hot</span></div>
  ${weekPicker()}
  <div class="toggle hm-view" role="group" aria-label="View"><button data-hv="map" class="${G.view!=='table'?'on':''}" aria-pressed="${G.view!=='table'}">Heat map</button><button data-hv="table" class="${G.view==='table'?'on':''}" aria-pressed="${G.view==='table'}">Text table</button></div>
  ${edBanner()}${G.view==='table'?`<div class="hm-table-wrap"><table class="hm-table"><caption>${G.mode==='season'?'Season-to-date grades':'Week '+wk.week+' grades'}: same data as the heat map, without color. Higher grade = hotter (red); lower = colder (blue).</caption>
   <thead><tr><th scope="col">Player</th><th scope="col">Pos</th><th scope="col">Unit</th><th scope="col">Grade</th><th scope="col">Rating</th>${edOn()?'<th scope="col">Source</th>':''}${G.mode==='season'?'<th scope="col">Trend</th>':'<th scope="col">Fan votes</th>'}</tr></thead>
   <tbody>${[...rows].sort((a,b)=>(b.avg??-1)-(a.avg??-1)).map(p=>`<tr><th scope="row">${GE(p.name)}</th><td>${GE(p.pos)}</td><td>${GE(p.group||'')}</td><td>${p.avg==null?'—':p.avg.toFixed(1)}</td><td>${word(p.avg)}</td>${edOn()?`<td>${GE(GSRC[p.source]||p.source||'')}</td>`:''}${G.mode==='season'?`<td>${p.trend==null?'—':(p.trend>0?'Up ':p.trend<0?'Down ':'Flat ')+Math.abs(p.trend).toFixed(1)}</td>`:`<td>${p.votes??0}</td>`}</tr>`).join('')}</tbody></table></div>`
   :`<div class="treemap" style="height:${H}px" role="img" aria-label="Heat map of player grades. Use the Text table button for the same data as a table.">${html}</div>${det}`}
  ${hidden.length?`<p class="hidden-list">Not shown (under ${wk.min_votes} votes): ${hidden.map(p=>GE(p.name)).join(', ')}</p>`:''}
  <p class="fine">Tile size = involvement (plays with a stat) until fan votes take over, then vote count. Grade formula and fan scoring (10% trimmed mean, minimum ${wk.min_votes} votes): see GRADES.md. Tap a tile for details. <a href="#/grades">Grade this week's players →</a></p>`;}
const ABR={Falcons:'ATL',Patriots:'NE',Bengals:'CIN',Browns:'CLE',Colts:'IND',Ravens:'BAL',Texans:'HOU',Jaguars:'JAX',Titans:'TEN',Bills:'BUF',Dolphins:'MIA',Jets:'NYJ',Chiefs:'KC',Raiders:'LV',Chargers:'LAC',Broncos:'DEN',Cowboys:'DAL',Giants:'NYG',Eagles:'PHI',Commanders:'WAS',Bears:'CHI',Lions:'DET',Packers:'GB',Vikings:'MIN',Panthers:'CAR',Saints:'NO',Buccaneers:'TB','49ers':'SF',Seahawks:'SEA',Rams:'LAR',Cardinals:'ARI'};
function wkLabel(w){const nick=w.game.split(' ').pop(),ha=w.game.startsWith('at ')?'at':'vs';return`Week ${w.week} ${ha} ${ABR[nick]||nick}`;}
function qWeek(){const m=(location.hash.split('?')[1]||'').match(/(?:^|&)week=(\d+)/);return m?+m[1]:null;}
async function setWeek(n,push){const ok=G.idx&&G.idx.find(w=>w.week===n);if(!ok)return;G.week=G.wkCache[n]||(G.wkCache[n]=await gj(`data/grades/week-${n}.json`));G.mode='week';G.sel=null;
 if(push){const latest=G.idx[G.idx.length-1].week;const q=(location.hash.split('?')[1]||'').split('&').filter(x=>x&&!x.startsWith('week='));if(n!==latest)q.push('week='+n);history.replaceState(null,'','#/heatmap'+(q.length?'?'+q.join('&'):''));}
 renderHeat();}
function weekPicker(){if(!G.idx||G.mode==='season')return'';return`<div class="hm-weeks" role="group" aria-label="Choose a game week"><span class="hm-weeks-lbl">Pick a game:</span>${G.idx.map(w=>`<button type="button" data-wk="${w.week}" class="${G.week&&G.week.week===w.week?'on':''}" aria-pressed="${G.week&&G.week.week===w.week}">${GE(wkLabel(w))}<small>${GE(w.score)}</small></button>`).join('')}</div>`;}
document.addEventListener('click',e=>{const b=e.target.closest('.hm-weeks button[data-wk]');if(b)setWeek(+b.dataset.wk,true);});
addEventListener('hashchange',()=>{const n=qWeek();if(n&&G.week&&n!==G.week.week)setWeek(n,false);});
async function loadGrades(){loadLiveBallot();try{G.ballot=await gj('data/grades/ballot.json');G.wkCache={};try{G.idx=(await gj('data/grades/index.json')).weeks;}catch(e){G.idx=null;}const qw=qWeek();const start=(G.idx&&qw&&G.idx.find(w=>w.week===qw))?qw:G.ballot.week;G.week=G.wkCache[start]=await gj(`data/grades/week-${start}.json`);G.ballotWeek=G.ballot.week===start?G.week:await gj(`data/grades/week-${G.ballot.week}.json`);G.season=await gj('data/grades/season.json');renderHeat();}catch(e){}}
loadGrades();
document.addEventListener('route',e=>{if(e.detail==='heatmap'){requestAnimationFrame(renderHeat);loadLiveBallot();}});
let rz;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(renderHeat,200);});

// ---------- Owner Editor mode (UI toggle only; real security = private GitHub repo issues) ----------
const ED_REPO='Steelresolve1970/steelers-daily';
(function(){const q=location.hash.split('?')[1]||'';const m=q.match(/(?:^|&)editor=(1|0)/);if(m){try{m[1]==='1'?localStorage.setItem('bgdEditor','1'):localStorage.removeItem('bgdEditor')}catch(e){}}})();
addEventListener('hashchange',()=>{const m=(location.hash.split('?')[1]||'').match(/(?:^|&)editor=(1|0)/);if(m){try{m[1]==='1'?localStorage.setItem('bgdEditor','1'):localStorage.removeItem('bgdEditor')}catch(e){}renderHeat();}});
function edOn(){try{return localStorage.getItem('bgdEditor')==='1'}catch(e){return false}}
function edSeason(){const d=G.week.date;return +d.slice(5,7)>2?d.slice(0,4):String(+d.slice(0,4)-1);}
function edBtn(t){return edOn()&&G.mode!=='season'?`<button type="button" class="ed-btn" data-ed="${GE(t.name)}" aria-label="Edit grade for ${GE(t.name)}">✎ Edit</button>`:'';}
function edBanner(){if(!edOn())return'';return`<div class="ed-banner"><b>Editor mode is on.</b> ${G.mode==='season'?'Switch to <b>This week</b> to edit grades.':'Tap <b>✎ Edit</b> on any player.'} Tap Save, then tap <b>Submit new issue</b> on GitHub. Your grade goes live in about 10 minutes. <a href="#/heatmap?editor=0">Turn off editor mode</a></div>`;}
function edOpen(name){const p=G.week.players.find(x=>x.name===name);if(!p)return;document.querySelector('.ed-modal')?.remove();
 const cur=p.avg!=null?p.avg:6;const d=document.createElement('div');d.className='ed-modal';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');
 d.innerHTML=`<form class="ed-form"><h3>Edit grade: ${GE(p.name)} <small>${GE(p.pos)}</small></h3>
 <p class="fine">Week ${G.week.week} ${GE(G.week.game)} · current ${p.avg==null?'—':p.avg.toFixed(1)} (${GE(GSRC[p.source]||'')})</p>
 <label>Grade (1–10)<div class="ed-row"><input type="range" min="1" max="10" step="0.5" value="${cur}" name="r"><input type="number" min="1" max="10" step="0.5" value="${cur}" name="g" required></div></label>
 <label>Note (optional)<input type="text" name="n" maxlength="140" placeholder="e.g. Drew double teams all day"></label>
 <p class="ed-help">Tap <b>Save</b>, then tap <b>Submit new issue</b> on GitHub. Your grade goes live in about 10 minutes.</p>
 <div class="ed-actions"><button type="submit" class="btn">Save</button><button type="button" class="btn ghost" data-act="clear">Clear editor grade</button><button type="button" class="btn ghost" data-act="cancel">Cancel</button></div></form>`;
 document.body.appendChild(d);const f=d.querySelector('form');f.r.oninput=()=>f.g.value=f.r.value;f.g.oninput=()=>f.r.value=f.g.value;
 const go=clear=>{const g=+f.g.value;if(!clear&&!(g>=1&&g<=10)){alert('Grade must be 1 to 10');return;}
  const note=f.n.value.trim().slice(0,140).replace(/[\r\n]+/g,' ');
  const body=['<!-- grade-edit v1: do not change the lines below -->','season: '+edSeason(),'week: '+G.week.week,'gsis_id: '+(p.gsis_id||''),'name: '+p.name,'action: '+(clear?'clear':'set'),'grade: '+(clear?'':g),'note: '+(clear?'':note)].join('\n');
  const title=(clear?'Clear grade: ':'Grade edit: ')+p.name+' wk'+G.week.week+(clear?'':' → '+g);
  window.open(`https://github.com/${ED_REPO}/issues/new?labels=grade-edit&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`,'_blank','noopener');d.remove();};
 f.onsubmit=e=>{e.preventDefault();go(false)};f.querySelector('[data-act=clear]').onclick=()=>go(true);f.querySelector('[data-act=cancel]').onclick=()=>d.remove();
 d.onclick=e=>{if(e.target===d)d.remove()};f.g.focus();}
document.addEventListener('click',e=>{const b=e.target.closest('.ed-btn');if(b){e.preventDefault();e.stopPropagation();edOpen(b.dataset.ed);}},true);
