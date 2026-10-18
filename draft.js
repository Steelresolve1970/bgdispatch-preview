// Mock Draft Simulator v2 — our own 2027 big board (data/draft/board.json), projected 7-round order + CPU team needs (data/draft/order.json).
(function(){
const COMPS_=new Proxy({},{get:(o,k)=>(window.COMPS||{})[k]});
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const POS=['QB','RB','WR','TE','OT','IOL','EDGE','DL','LB','CB','S'];
const SPEEDS=[['Instant',0],['Fast',60],['Normal',300],['Slow',900]];
const S={board:null,order:null,teams:['PIT'],rounds:7,rand:4,speed:60,slots:[],avail:[],cur:0,phase:'setup',filter:'All',school:'',q:'',timer:null,paused:false,hist:[],card:null,trade:null,seed:1,tab:'board',needsPIT:null};
const el=()=>document.getElementById('draft-body');
const TN=a=>(S.order.order.find(t=>t.abbr===a)||{name:a}).name;
// Our own trade value chart: smooth curve, pick 1 = 1000 pts.
const val=n=>Math.round(1000*Math.exp(-0.0285*(n-1))+8);
function rng(){S.seed=(S.seed*1664525+1013904223)>>>0;return S.seed/4294967296;}
const needs=a=>a==='PIT'&&S.needsPIT?S.needsPIT:(S.order.needs[a]||[]);
const mine=a=>S.slots.filter(s=>s.owner===a&&s.player);
const isUser=s=>S.teams.includes(s.owner);
function cpuPick(s){const nd=needs(s.owner),have=mine(s.owner).map(x=>x.player.pos);const k=8+S.rand*3;let best=null,bs=1e9;
 S.avail.slice(0,k).forEach(p=>{let sc=p.rank+(rng()-0.5)*S.rand*4;const i=nd.indexOf(p.pos);if(i>=0)sc-=(14-i*2.5)*(s.round<=3?1:0.6);
  const dup=have.filter(x=>x===p.pos).length;sc+=dup*(p.pos==='QB'?60:12);if(p.pos==='QB'&&i<0&&s.round<=2)sc+=12;if(sc<bs){bs=sc;best=p;}});return best;}
function take(s,p){S.avail=S.avail.filter(x=>x!==p);s.player=p;S.cur++;}
function snap(){return{cur:S.cur,avail:[...S.avail],slots:S.slots.map(s=>({...s}))};}
function step(){clearTimeout(S.timer);clearTimeout(S.watch);if(S.paused){render();return;}
 try{while(S.cur<S.slots.length&&!isUser(S.slots[S.cur])){const s=S.slots[S.cur],p=cpuPick(s)||S.avail[0];if(!p){S.slots=S.slots.slice(0,S.cur);break;}take(s,p);
  if(S.speed>0&&S.cur<S.slots.length){S.phase='cpu';render();S.timer=setTimeout(step,S.speed);S.watch=setTimeout(stallCheck,Math.max(4000,S.speed*10));return;}}
 S.phase=S.cur>=S.slots.length?'done':'user';if(S.phase==='user')S.tab='board';render();}catch(err){console.warn('mock draft step',err);S.stalled=true;try{render();}catch(e2){showFinish();}}}
// Safety net: if the CPU stops picking for any reason, offer a Finish draft button.
let lastCur=-1;function stallCheck(){if(S.phase==='cpu'&&!S.paused&&S.cur===lastCur){S.stalled=true;render();}lastCur=S.cur;if(S.phase==='cpu')S.watch=setTimeout(stallCheck,Math.max(4000,S.speed*10));}
function finishDraft(){clearTimeout(S.timer);clearTimeout(S.watch);S.paused=false;S.stalled=false;S.card=null;S.trade=null;
 while(S.cur<S.slots.length){const s=S.slots[S.cur];const p=cpuPick(s)||S.avail[0];if(!p){S.slots=S.slots.slice(0,S.cur);break;}take(s,p);}S.phase='done';render();}
function showFinish(){const e=el();if(e&&!e.querySelector('.dr-finish'))e.insertAdjacentHTML('afterbegin','<p class="box"><b>The draft got stuck.</b> <button class="btn dr-finish" type="button">Finish draft</button></p>');}
const LET=x=>x>=1.2?'A+':x>=0.7?'A':x>=0.4?'A-':x>=0.2?'B+':x>=0?'B':x>=-0.25?'B-':x>=-0.5?'C+':x>=-0.8?'C':x>=-1.2?'C-':x>=-1.7?'D':'F';
// Value vs our board (scaled so a 10-spot reach in round 1 counts more than in round 6) + need fit.
function pickScore(s){const p=s.player,d=s.overall-p.rank,sc=d/(4+0.22*s.overall);const i=needs(s.owner).indexOf(p.pos);return Math.max(-2.5,Math.min(2,sc))+(i>=0?(5-i)*0.06:-0.05);}
function pickGrade(s){return LET(pickScore(s));}
function teamGrade(a){const ps=mine(a);if(!ps.length)return null;let v=0,w=0;ps.forEach(s=>{const k=1/(1+s.round*0.3);v+=pickScore(s)*k;w+=k;});return LET(v/w);}
const COL={ARI:'#97233F',ATL:'#A71930',BAL:'#241773',BUF:'#00338D',CAR:'#0085CA',CHI:'#0B162A',CIN:'#FB4F14',CLE:'#311D00',DAL:'#041E42',DEN:'#FB4F14',DET:'#0076B6',GB:'#203731',HOU:'#03202F',IND:'#002C5F',JAX:'#006778',KC:'#E31837',LV:'#000000',LAC:'#0080C6',LA:'#003594',LAR:'#003594',MIA:'#008E97',MIN:'#4F2683',NE:'#002244',NO:'#9F8958',NYG:'#0B2265',NYJ:'#125740',PHI:'#004C54',PIT:'#FFB612',SF:'#AA0000',SEA:'#002244',TB:'#D50A0A',TEN:'#4B92DB',WAS:'#5A1414'};
const tm=a=>`<span class="dr-tm" style="--tc:${COL[a]||'#555'}">${E(a)}</span>`;
const meta=p=>PCard.meta(p);
function filtered(){const q=S.q.toLowerCase();return S.avail.filter(p=>(S.filter==='All'||p.pos===S.filter)&&(!S.school||p.school===S.school)&&(!q||(p.name+' '+p.school).toLowerCase().includes(q)));}
function cardHTML(p){if(!p)return'';const pk=S.slots.find(x=>x.player===p),can=S.phase==='user'&&S.avail.includes(p);
 return PCard.html(p,{top:pk?`<p class="dr-picked">Picked #${pk.overall} (R${pk.round}) by ${tm(pk.owner)} ${E(TN(pk.owner))} · <span class="dr-grade sm">${pickGrade(pk)}</span></p>`:'',
  bottom:can?`<button class="btn dr-take" type="button" data-r="${p.rank}">Draft this player</button>`:''});}
function tradeHTML(){const on=S.slots[S.cur],me=on.owner,T=S.trade;const partners=[...new Set(S.slots.slice(S.cur).map(s=>s.owner))].filter(a=>a!==me).sort();
 const open=a=>S.slots.slice(S.cur).filter(s=>s.owner===a&&!s.player);
 const give=open(me).filter(s=>T.give.includes(s.overall)),get=T.with?open(T.with).filter(s=>T.get.includes(s.overall)):[];
 const gv=give.reduce((a,s)=>a+val(s.overall),0),rv=get.reduce((a,s)=>a+val(s.overall),0);const ok=get.length&&give.length&&gv>=rv*1.05;
 const li=(a,arr,cls)=>open(a).map(s=>`<button type="button" class="chip ${cls}${arr.includes(s.overall)?' on':''}" data-o="${s.overall}">R${s.round} #${s.overall} <small>${val(s.overall)}</small></button>`).join('');
 return`<div class="box dr-trade"><h2>Trade picks</h2><p class="fine">Our own value chart (pick 1 = 1000 pts). CPU teams accept if they get at least 5% more value than they give.</p>
 <label>Trade with <select class="dr-tw"><option value="">Choose a team</option>${partners.map(a=>`<option value="${a}"${T.with===a?' selected':''}>${E(TN(a))}</option>`).join('')}</select></label>
 <p><b>You give (${E(me)})</b></p><div class="chips">${li(me,T.give,'dr-tg')}</div>
 ${T.with?`<p><b>You get (${E(T.with)})</b></p><div class="chips">${li(T.with,T.get,'dr-tr')}</div>`:''}
 <p>Value: you give <b>${gv}</b> · you get <b>${rv}</b> ${get.length&&give.length?(ok?'<span class="dr-ok">✓ They accept</span>':'<span class="dr-no">✗ Not enough value</span>'):''}</p>
 <button class="btn dr-tdo" type="button"${ok?'':' disabled'}>Make trade</button> <button class="btn ghost dr-tx" type="button">Cancel</button>${T.msg?`<p class="dr-ok">${E(T.msg)}</p>`:''}</div>`;}
function shareText(){const lines=[`My 2027 mock draft on Black & Gold Dispatch (${S.rounds} rounds)`];S.teams.forEach(a=>{lines.push(`${TN(a)} — Dispatch Draft Desk grade ${teamGrade(a)||'–'}`);mine(a).forEach(s=>lines.push(`R${s.round} #${s.overall}: ${s.player.name}, ${s.player.pos}, ${s.player.school}`));});lines.push('Our own board, unofficial fan site. blackandgolddispatch.com');return lines.join('\n');}
function shareImage(){const rows=[];S.teams.forEach(a=>{rows.push({h:`${TN(a)}  ·  Draft Desk grade ${teamGrade(a)||'–'}`});mine(a).forEach(s=>rows.push({t:`R${s.round} #${s.overall}  ${s.player.name}  ${s.player.pos} · ${s.player.school}`,g:pickGrade(s)}));});
 const c=document.createElement('canvas'),W=1080,H=Math.max(600,190+rows.length*46+80);c.width=W;c.height=H;const x=c.getContext('2d');
 x.fillStyle='#111';x.fillRect(0,0,W,H);x.fillStyle='#FFB612';x.fillRect(0,0,W,14);x.font='italic 900 54px Arial';x.fillText('BLACK & GOLD DISPATCH',50,90);
 x.fillStyle='#fff';x.font='700 32px Arial';x.fillText('My 2027 Mock Draft',50,140);let y=200;
 rows.forEach(r=>{if(r.h){x.fillStyle='#FFB612';x.font='900 32px Arial';x.fillText(r.h,50,y);}else{x.fillStyle='#FFB612';x.fillRect(50,y-30,54,38);x.fillStyle='#000';x.font='900 24px Arial';x.fillText(r.g,58,y-3);x.fillStyle='#fff';x.font='26px Arial';x.fillText(r.t.slice(0,62),120,y);}y+=46;});
 x.fillStyle='#aaa';x.font='22px Arial';x.fillText('Our own board · unofficial fan site · not affiliated with the NFL or any team',50,H-40);
 const a=document.createElement('a');a.download='my-mock-draft.png';a.href=c.toDataURL('image/png');a.click();}
function setupHTML(){const ts=[...S.order.order].sort((a,b)=>a.name.localeCompare(b.name));
 return`<div class="dr-setup box"><p class="fine">Board: <b>${S.board.count}</b> prospects ranked by <b>our own formula plus our staff scouting tiers</b> — not copied from any outside big board. Order: projected from current records, 7 rounds, ${S.order.total} picks. <a href="#" class="dr-how">How it works</a></p>
 <p class="dr-howbox" hidden>${E(S.board.method)}<br><br>${E(S.order.note)}<br><br>${E(S.order.needs_note)}</p>
 <p><b>Your team(s)</b> — tap to pick one or more</p><div class="chips dr-teams">${ts.map(t=>`<button type="button" class="chip dr-team${S.teams.includes(t.abbr)?' on':''}" data-a="${t.abbr}">${E(t.abbr)}</button>`).join('')}</div>
 <p><b>Rounds</b></p><div class="chips">${[1,2,3,4,5,6,7].map(n=>`<button type="button" class="chip dr-rounds${S.rounds===n?' on':''}" data-n="${n}">${n}</button>`).join('')}</div>
 <p><b>CPU randomness</b>: <span id="drRandV">${S.rand}</span>/10 <small>(0 = sticks to our board, 10 = wild)</small></p><input type="range" min="0" max="10" value="${S.rand}" class="dr-rand" aria-label="CPU randomness">
 <p><b>Speed</b></p><div class="chips">${SPEEDS.map(([l,v])=>`<button type="button" class="chip dr-speed${S.speed===v?' on':''}" data-v="${v}">${l}</button>`).join('')}</div>
 ${S.teams.includes('PIT')?`<p><b>Steelers needs</b>: ${needs('PIT').map(E).join(' → ')} <small>(owner's order)</small></p>`:''}
 <p><button class="btn dr-start" type="button"${S.teams.length?'':' disabled'}>Start draft</button></p></div>`;}
function boardHTML(){const list=filtered().slice(0,80),on=S.slots[S.cur];const nd=on?needs(on.owner):[];
 const schools=[...new Set(S.avail.map(p=>p.school))].sort();
 return`<div class="dr-tools"><input type="search" class="dr-q" placeholder="Search player or school" value="${E(S.q)}" aria-label="Search prospects">
  <select class="dr-sch" aria-label="Filter by school"><option value="">All schools</option>${schools.map(s=>`<option${S.school===s?' selected':''}>${E(s)}</option>`).join('')}</select></div>
 <div class="chips">${['All',...POS].map(p=>`<button type="button" class="chip dr-filter${S.filter===p?' on':''}" data-p="${p}">${p}</button>`).join('')}</div>
 <div class="dr-list">${list.map(p=>`<div class="dr-prospect${nd.includes(p.pos)?' need':''}"><span class="dr-rank">#${p.rank}</span><button type="button" class="dr-info" data-r="${p.rank}"><b>${E(p.name)}</b><br><small>${meta(p)}</small>${p.line?`<br><small class="dr-line">${E(p.line)}</small>`:''}</button><span class="dr-gr">${p.grade}</span>${S.phase==='user'?`<button type="button" class="dr-draft" data-r="${p.rank}">Draft</button>`:''}</div>`).join('')||'<p class="empty">No prospects match</p>'}</div>
 ${filtered().length>80?`<p class="fine">Showing top 80 of ${filtered().length}. Use search or filters to see more.</p>`:''}`;}
function tickerHTML(){const lo=Math.max(0,S.cur-40),hi=Math.min(S.slots.length,S.cur+16);let h='';for(let i=lo;i<hi;i++){const s=S.slots[i];h+=`<button type="button" class="dr-tk${isUser(s)?' mine':''}${i===S.cur?' now':''}" data-o="${s.overall}" style="--tc:${COL[s.owner]||'#555'}"><small>R${s.round} #${s.overall}</small><b>${E(s.owner)}</b><span>${s.player?E(s.player.name.split(' ').slice(-1)[0])+' · '+s.player.pos:i===S.cur?'On clock':'—'}</span></button>`;}
 return`<div class="dr-ticker" aria-label="Pick ticker — scroll back to see earlier picks">${h}</div>`;}
function logHTML(){let h='',r=0;S.slots.forEach((s,i)=>{if(!s.player&&i>=S.cur+40)return;if(s.round!==r){r=s.round;h+=`<li class="dr-rd">Round ${r}</li>`;}
 h+=`<li class="${isUser(s)?'mine':''}${i===S.cur?' now':''}"><b>${s.overall}.</b> ${tm(s.owner)}${s.owner!==s.team?` <small>(via ${E(s.team)})</small>`:''} ${s.player?(S.phase==='done'?`<span class="dr-row"><span class="dr-nm dr-lg"><button type="button" class="dr-pk" data-o="${s.overall}">${E(s.player.name)}</button> <small>${s.player.pos}, ${E(s.player.school)}</small></span><span class="dr-grade sm">${pickGrade(s)}</span></span>`:`— <button type="button" class="dr-pk" data-o="${s.overall}">${E(s.player.name)}</button> <small>${s.player.pos}, ${E(s.player.school)}</small>`):i===S.cur?'— on the clock':''}</li>`;});return`<ol class="dr-log full">${h}</ol>`;}
function summaryHTML(){const all=[...new Set(S.slots.map(s=>s.owner))].sort((a,b)=>S.teams.includes(b)-S.teams.includes(a)||a.localeCompare(b));
 return`<div class="ballot-head"><p class="kind">Draft complete</p><h2>Your 2027 draft</h2><p>${S.rounds} round${S.rounds>1?'s':''} · <b>Dispatch Draft Desk grades</b>: where you picked vs. our board, plus need fit</p></div>
 ${S.teams.map(a=>`<div class="box"><h2>${E(TN(a))} <span class="dr-grade" title="Dispatch Draft Desk grade">${teamGrade(a)||'–'}</span></h2><p class="fine dr-desk">Dispatch Draft Desk grade</p>${mine(a).map(s=>`<div class="dr-mine"><div class="dr-row"><span class="dr-nm"><b>R${s.round} #${s.overall} <button type="button" class="dr-pk" data-o="${s.overall}">${E(s.player.name)}</button></b> <small>${s.player.pos}, ${E(s.player.school)}</small></span><span class="dr-grade sm">${pickGrade(s)}</span></div><div class="dr-sub"><small>${meta(s.player)} · our board #${s.player.rank}</small>${COMPS_[s.player.name]?`<br><small>Plays like ${E(COMPS_[s.player.name].name)} (our comparison)</small>`:''}</div></div>`).join('')||'<p class="fine">No picks.</p>'}</div>`).join('')}
 <div class="box"><h2>Share</h2><textarea class="dr-share" readonly rows="6">${E(shareText())}</textarea><p><button class="btn dr-copy" type="button">Copy text</button> <button class="btn dr-img" type="button">Download image</button> <button class="btn ghost dr-reset" type="button">Draft again</button></p></div>
 <div class="box"><h2>Every team's grade <small>· Dispatch Draft Desk</small></h2><p class="fine">Every pick graded A+ to F: where he went vs. our board rank (reaches cost more early), plus fit with that team's needs. Tap a team to see each pick.</p><div class="dr-allg">${all.map(a=>`<details${S.teams.includes(a)?' open':''} class="${S.teams.includes(a)?'mine':''}"><summary>${tm(a)} <b>${E(TN(a))}</b> <span class="dr-grade sm">${teamGrade(a)||'–'}</span></summary>${mine(a).map(s=>`<p class="dr-pg dr-row"><span class="dr-nm">R${s.round} #${s.overall} <button type="button" class="dr-pk" data-o="${s.overall}">${E(s.player.name)}</button> <small>${s.player.pos} · board #${s.player.rank}</small></span><span class="dr-grade sm">${pickGrade(s)}</span></p>`).join('')}</details>`).join('')}</div></div>`;}
function render(){const e=el();if(!e||!S.board)return;const ae=document.activeElement,qf=ae&&ae.classList.contains('dr-q'),cp=qf?ae.selectionStart:0;
 if(S.phase==='setup'){e.innerHTML=setupHTML();return;}
 if(S.phase==='done'){e.innerHTML=`<div class="dr-grid"><div>${summaryHTML()}</div><aside><div class="box"><h2>Every pick, graded <small>· Dispatch Draft Desk</small></h2>${logHTML()}</div></aside></div>${S.card?cardHTML(S.card):''}`;return;}
 if(S.cur>=S.slots.length){S.phase='done';return render();}
 const on=S.slots[S.cur],my=S.teams.flatMap(a=>mine(a)).sort((a,b)=>a.overall-b.overall);
 e.innerHTML=`<div class="dr-grid"><div>
  <div class="ballot-head dr-clock"><p class="kind">${S.phase==='user'?'You are on the clock':S.paused?'Paused':'CPU picking…'}</p><h2>R${on.round} · #${on.overall}: ${E(TN(on.owner))}</h2><p>Needs: ${needs(on.owner).map(E).join(', ')||'–'}</p>
   <p class="dr-ctl">${S.phase==='user'?`<button class="btn dr-topen" type="button">Trade</button> `:`<button class="btn dr-pause" type="button">${S.paused?'Resume':'Pause'}</button> `}${S.phase==='cpu'||S.stalled?`<button class="btn${S.stalled?'':' ghost'} dr-finish" type="button">Finish draft</button> `:''}<button class="btn ghost dr-undo" type="button"${S.hist.length?'':' disabled'}>Undo my last pick</button> <span class="chips inline">${SPEEDS.map(([l,v])=>`<button type="button" class="chip dr-speed${S.speed===v?' on':''}" data-v="${v}">${l}</button>`).join('')}</span></p></div>
  ${tickerHTML()}${S.trade?tradeHTML():''}
  <div class="chips dr-tabs"><button type="button" class="chip dr-tab${S.tab==='board'?' on':''}" data-t="board">Big board</button><button type="button" class="chip dr-tab${S.tab==='log'?' on':''}" data-t="log">Full board by round</button></div>
  ${S.tab==='board'?boardHTML():logHTML()}
 </div><aside><div class="box"><h2>Your picks</h2>${my.length?`<ol class="dr-log">${my.map(s=>`<li class="mine"><b>${s.overall}.</b> ${E(s.owner)} — ${E(s.player.name)} <small>${s.player.pos}</small></li>`).join('')}</ol>`:'<p class="fine">None yet.</p>'}
  <p class="fine">Upcoming: ${S.slots.slice(S.cur).filter(s=>isUser(s)&&!s.player).slice(0,6).map(s=>'#'+s.overall).join(', ')||'none'}</p></div>
  <div class="box"><h2>Recent picks</h2><ol class="dr-log">${S.slots.slice(Math.max(0,S.cur-8),S.cur).reverse().map(s=>`<li class="${isUser(s)?'mine':''}"><b>${s.overall}.</b> ${E(s.owner)} — ${E(s.player.name)} <small>${s.player.pos}</small></li>`).join('')||'<li class="fine">Waiting…</li>'}</ol></div></aside></div>${S.card?cardHTML(S.card):''}`;
 const tk=e.querySelector('.dr-ticker'),nw=tk&&tk.querySelector('.now');if(tk&&nw){tk.scrollLeft=(S.tkCur===S.cur&&S.tkPos!=null)?S.tkPos:nw.offsetLeft-tk.clientWidth/2;S.tkCur=S.cur;S.tkPos=tk.scrollLeft;tk.addEventListener('scroll',()=>{S.tkPos=tk.scrollLeft;},{passive:true});}
 if(qf){const q=e.querySelector('.dr-q');q.focus();q.setSelectionRange(cp,cp);}}
function start(){S.seed=(Date.now()%100000)+7;S.avail=[...S.board.prospects];S.slots=S.order.picks.filter(p=>p.round<=S.rounds).map(p=>({...p,owner:p.team,player:null}));
 S.cur=0;S.stalled=false;S.hist=[];S.trade=null;S.card=null;S.paused=false;S.q='';S.filter='All';S.school='';step();}
function userTake(rank){const p=S.avail.find(x=>x.rank==rank);if(!p||S.phase!=='user')return;S.hist.push(snap());take(S.slots[S.cur],p);S.card=null;S.trade=null;step();}
document.addEventListener('click',ev=>{const e=el();if(!e||!e.contains(ev.target))return;const t=ev.target.closest('button,a.dr-how,.dr-modal');if(!t)return;const c=t.classList;
 if(c.contains('dr-how')){ev.preventDefault();const b=e.querySelector('.dr-howbox');b.hidden=!b.hidden;}
 else if(c.contains('dr-modal')&&ev.target===t){S.card=null;render();}
 else if(c.contains('dr-x')){S.card=null;render();}
 else if(c.contains('dr-team')){const a=t.dataset.a;S.teams=S.teams.includes(a)?S.teams.filter(x=>x!==a):[...S.teams,a];render();}
 else if(c.contains('dr-rounds')){S.rounds=+t.dataset.n;render();}
 else if(c.contains('dr-speed')){S.speed=+t.dataset.v;render();}
 else if(c.contains('dr-start'))start();
 else if(c.contains('dr-filter')){S.filter=t.dataset.p;render();}
 else if(c.contains('dr-tab')){S.tab=t.dataset.t;render();}
 else if(c.contains('dr-info')){S.card=S.avail.find(x=>x.rank==t.dataset.r)||S.board.prospects.find(x=>x.rank==t.dataset.r);render();}
 else if(c.contains('dr-tk')||c.contains('dr-pk')){const s=S.slots.find(x=>x.overall==t.dataset.o);if(s&&s.player){S.card=s.player;render();}}
 else if(c.contains('dr-draft')||c.contains('dr-take'))userTake(t.dataset.r);
 else if(c.contains('dr-pause')){S.paused=!S.paused;S.paused?render():step();}
 else if(c.contains('dr-undo')&&S.hist.length){clearTimeout(S.timer);clearTimeout(S.watch);const h=S.hist.pop();S.cur=h.cur;S.avail=h.avail;S.slots=h.slots;S.phase='user';S.paused=false;S.trade=null;render();}
 else if(c.contains('dr-topen')){S.trade={with:'',give:[],get:[]};render();}
 else if(c.contains('dr-tx')){S.trade=null;render();}
 else if(c.contains('dr-tg')||c.contains('dr-tr')){const k=c.contains('dr-tg')?'give':'get',o=+t.dataset.o;S.trade[k]=S.trade[k].includes(o)?S.trade[k].filter(x=>x!==o):[...S.trade[k],o];S.trade.msg='';render();}
 else if(c.contains('dr-tdo')){const T=S.trade,me=S.slots[S.cur].owner;S.hist.push(snap());S.slots.forEach(s=>{if(T.give.includes(s.overall))s.owner=T.with;else if(T.get.includes(s.overall))s.owner=me;});
  S.trade={with:'',give:[],get:[],msg:`Trade done with ${TN(T.with)}.`};if(!isUser(S.slots[S.cur])){S.trade=null;step();}else render();}
 else if(c.contains('dr-copy')){const ta=e.querySelector('.dr-share');(navigator.clipboard?navigator.clipboard.writeText(ta.value):Promise.reject()).then(()=>{t.textContent='Copied!';}).catch(()=>{ta.select();document.execCommand('copy');t.textContent='Copied!';});}
 else if(c.contains('dr-finish'))finishDraft();
 else if(c.contains('dr-img'))shareImage();
 else if(c.contains('dr-reset')){clearTimeout(S.timer);clearTimeout(S.watch);S.phase='setup';render();}});
document.addEventListener('input',ev=>{const e=el();if(!e||!e.contains(ev.target))return;const c=ev.target.classList;
 if(c.contains('dr-q')){S.q=ev.target.value;render();}else if(c.contains('dr-rand')){S.rand=+ev.target.value;document.getElementById('drRandV').textContent=S.rand;}});
document.addEventListener('change',ev=>{const e=el();if(!e||!e.contains(ev.target))return;const c=ev.target.classList;
 if(c.contains('dr-sch')){S.school=ev.target.value;render();}else if(c.contains('dr-tw')){S.trade.with=ev.target.value;S.trade.get=[];render();}});
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&S.card){S.card=null;render();}});
Promise.all([...['data/draft/board.json','data/draft/order.json'].map(u=>fetch(u,{cache:'no-store'}).then(r=>r.json())),window.compsReady]).then(([b,o])=>{S.board=b;S.order=o;if(o.needs&&o.needs.PIT)S.needsPIT=o.needs.PIT;render();}).catch(()=>{const e=el();if(e)e.innerHTML='<p class="empty">Mock draft data unavailable right now.</p>';});
})();
