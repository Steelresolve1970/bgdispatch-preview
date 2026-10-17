// Mock Draft Simulator v2 — our own 2027 big board (data/draft/board.json), projected 7-round order + CPU team needs (data/draft/order.json).
(function(){
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
function step(){clearTimeout(S.timer);if(S.paused){render();return;}
 while(S.cur<S.slots.length&&!isUser(S.slots[S.cur])){take(S.slots[S.cur],cpuPick(S.slots[S.cur]));if(S.speed>0){S.phase='cpu';render();S.timer=setTimeout(step,S.speed);return;}}
 S.phase=S.cur>=S.slots.length?'done':'user';if(S.phase==='user')S.tab='board';render();}
function pickGrade(s){const d=s.overall-s.player.rank;return d>=20?'A+':d>=8?'A':d>=-6?'B':d>=-20?'C':'D';}
function teamGrade(a){const ps=mine(a);if(!ps.length)return null;let v=0;ps.forEach(s=>{v+=Math.max(-40,Math.min(40,s.overall-s.player.rank))/(1+s.round*0.35);const i=needs(a).indexOf(s.player.pos);if(i>=0)v+=(5-i)*0.8;});
 const x=v/ps.length;return x>=9?'A':x>=5?'A-':x>=2.5?'B+':x>=0?'B':x>=-3?'B-':x>=-7?'C+':x>=-12?'C':'D';}
const meta=p=>[p.pos,p.school,p.cls,p.height,p.weight?p.weight+' lb':''].filter(Boolean).map(E).join(' · ');
function filtered(){const q=S.q.toLowerCase();return S.avail.filter(p=>(S.filter==='All'||p.pos===S.filter)&&(!S.school||p.school===S.school)&&(!q||(p.name+' '+p.school).toLowerCase().includes(q)));}
function cardHTML(p){if(!p)return'';const t=p.parts||{};return`<div class="dr-modal" role="dialog" aria-label="${E(p.name)}"><div class="dr-card"><button class="dr-x" type="button" aria-label="Close">✕</button>
 <p class="kind">Our board #${p.rank} · ${E(p.tier)}</p><h2>${E(p.name)}</h2><p>${meta(p)}</p><p class="dr-g">Our grade <b>${p.grade}</b>${p.stars?` · ${p.stars}★ recruit`:''}${p.anchor?' · Steelers watch list':''}</p>
 ${window.availHTML?availHTML(p.name):''}
 ${p.line?`<p><b>2026:</b> ${E(p.line)}</p>`:''}${p.note?`<p>${E(p.note)}</p>`:''}
 <table class="dr-parts"><tr><th>Production</th><th>Pedigree</th><th>Schedule</th><th>Team</th><th>Class</th><th>Size</th><th>Scout tier</th></tr><tr><td>${t.production??'–'}/45</td><td>${t.pedigree??'–'}/22</td><td>${t.schedule??'–'}/12</td><td>${t.team??'–'}/6</td><td>${t.cls??'–'}/5</td><td>${t.size??'–'}/5</td><td>${p.scout_tier??'–'}</td></tr></table>
 <p class="fine">Our own formula from CollegeFootballData.com stats. Fan opinion, not a scouting report.</p>
 ${S.phase==='user'?`<button class="btn dr-take" type="button" data-r="${p.rank}">Draft ${E(p.name)}</button>`:''}</div></div>`;}
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
function shareText(){const lines=[`My 2027 mock draft on Black & Gold Dispatch (${S.rounds} rounds)`];S.teams.forEach(a=>{lines.push(`${TN(a)} — grade ${teamGrade(a)||'–'}`);mine(a).forEach(s=>lines.push(`R${s.round} #${s.overall}: ${s.player.name}, ${s.player.pos}, ${s.player.school}`));});lines.push('Our own board, unofficial fan site. blackandgolddispatch.com');return lines.join('\n');}
function shareImage(){const rows=[];S.teams.forEach(a=>{rows.push({h:`${TN(a)}  ·  Grade ${teamGrade(a)||'–'}`});mine(a).forEach(s=>rows.push({t:`R${s.round} #${s.overall}  ${s.player.name}  ${s.player.pos} · ${s.player.school}`,g:pickGrade(s)}));});
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
function logHTML(){let h='',r=0;S.slots.forEach((s,i)=>{if(!s.player&&i>=S.cur+40)return;if(s.round!==r){r=s.round;h+=`<li class="dr-rd">Round ${r}</li>`;}
 h+=`<li class="${isUser(s)?'mine':''}${i===S.cur?' now':''}"><b>${s.overall}.</b> ${E(s.owner)}${s.owner!==s.team?` <small>(via ${E(s.team)})</small>`:''} ${s.player?`— ${E(s.player.name)} <small>${s.player.pos}, ${E(s.player.school)}</small>`:i===S.cur?'— on the clock':''}</li>`;});return`<ol class="dr-log full">${h}</ol>`;}
function summaryHTML(){const all=[...new Set(S.slots.map(s=>s.owner))].sort((a,b)=>S.teams.includes(b)-S.teams.includes(a)||a.localeCompare(b));
 return`<div class="ballot-head"><p class="kind">Draft complete</p><h2>Your 2027 draft</h2><p>${S.rounds} round${S.rounds>1?'s':''} · grades compare where you picked to our board, plus need fit</p></div>
 ${S.teams.map(a=>`<div class="box"><h2>${E(TN(a))} <span class="dr-grade">${teamGrade(a)||'–'}</span></h2>${mine(a).map(s=>`<div class="dr-mine"><span class="dr-grade sm">${pickGrade(s)}</span><div><b>R${s.round}, #${s.overall}: ${E(s.player.name)}</b><br><small>${meta(s.player)} · our board #${s.player.rank}</small></div></div>`).join('')||'<p class="fine">No picks.</p>'}</div>`).join('')}
 <div class="box"><h2>Share</h2><textarea class="dr-share" readonly rows="6">${E(shareText())}</textarea><p><button class="btn dr-copy" type="button">Copy text</button> <button class="btn dr-img" type="button">Download image</button> <button class="btn ghost dr-reset" type="button">Draft again</button></p></div>
 <div class="box"><h2>Every team's grade</h2><div class="dr-allg">${all.map(a=>`<details><summary><b>${E(a)}</b> <span class="dr-grade sm">${teamGrade(a)||'–'}</span></summary>${mine(a).map(s=>`<p class="fine">R${s.round} #${s.overall} ${E(s.player.name)} (${s.player.pos})</p>`).join('')}</details>`).join('')}</div></div>`;}
function render(){const e=el();if(!e||!S.board)return;const ae=document.activeElement,qf=ae&&ae.classList.contains('dr-q'),cp=qf?ae.selectionStart:0;
 if(S.phase==='setup'){e.innerHTML=setupHTML();return;}
 if(S.phase==='done'){e.innerHTML=`<div class="dr-grid"><div>${summaryHTML()}</div><aside><div class="box"><h2>Full draft</h2>${logHTML()}</div></aside></div>`;return;}
 const on=S.slots[S.cur],my=S.teams.flatMap(a=>mine(a)).sort((a,b)=>a.overall-b.overall);
 e.innerHTML=`<div class="dr-grid"><div>
  <div class="ballot-head dr-clock"><p class="kind">${S.phase==='user'?'You are on the clock':S.paused?'Paused':'CPU picking…'}</p><h2>R${on.round} · #${on.overall}: ${E(TN(on.owner))}</h2><p>Needs: ${needs(on.owner).map(E).join(', ')||'–'}</p>
   <p class="dr-ctl">${S.phase==='user'?`<button class="btn dr-topen" type="button">Trade</button> `:`<button class="btn dr-pause" type="button">${S.paused?'Resume':'Pause'}</button> `}<button class="btn ghost dr-undo" type="button"${S.hist.length?'':' disabled'}>Undo my last pick</button> <span class="chips inline">${SPEEDS.map(([l,v])=>`<button type="button" class="chip dr-speed${S.speed===v?' on':''}" data-v="${v}">${l}</button>`).join('')}</span></p></div>
  ${S.trade?tradeHTML():''}
  <div class="chips dr-tabs"><button type="button" class="chip dr-tab${S.tab==='board'?' on':''}" data-t="board">Big board</button><button type="button" class="chip dr-tab${S.tab==='log'?' on':''}" data-t="log">Draft log</button></div>
  ${S.tab==='board'?boardHTML():logHTML()}
 </div><aside><div class="box"><h2>Your picks</h2>${my.length?`<ol class="dr-log">${my.map(s=>`<li class="mine"><b>${s.overall}.</b> ${E(s.owner)} — ${E(s.player.name)} <small>${s.player.pos}</small></li>`).join('')}</ol>`:'<p class="fine">None yet.</p>'}
  <p class="fine">Upcoming: ${S.slots.slice(S.cur).filter(s=>isUser(s)&&!s.player).slice(0,6).map(s=>'#'+s.overall).join(', ')||'none'}</p></div>
  <div class="box"><h2>Recent picks</h2><ol class="dr-log">${S.slots.slice(Math.max(0,S.cur-8),S.cur).reverse().map(s=>`<li class="${isUser(s)?'mine':''}"><b>${s.overall}.</b> ${E(s.owner)} — ${E(s.player.name)} <small>${s.player.pos}</small></li>`).join('')||'<li class="fine">Waiting…</li>'}</ol></div></aside></div>${S.card?cardHTML(S.card):''}`;
 if(qf){const q=e.querySelector('.dr-q');q.focus();q.setSelectionRange(cp,cp);}}
function start(){S.seed=(Date.now()%100000)+7;S.avail=[...S.board.prospects];S.slots=S.order.picks.filter(p=>p.round<=S.rounds).map(p=>({...p,owner:p.team,player:null}));
 S.cur=0;S.hist=[];S.trade=null;S.card=null;S.paused=false;S.q='';S.filter='All';S.school='';step();}
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
 else if(c.contains('dr-draft')||c.contains('dr-take'))userTake(t.dataset.r);
 else if(c.contains('dr-pause')){S.paused=!S.paused;S.paused?render():step();}
 else if(c.contains('dr-undo')&&S.hist.length){clearTimeout(S.timer);const h=S.hist.pop();S.cur=h.cur;S.avail=h.avail;S.slots=h.slots;S.phase='user';S.paused=false;S.trade=null;render();}
 else if(c.contains('dr-topen')){S.trade={with:'',give:[],get:[]};render();}
 else if(c.contains('dr-tx')){S.trade=null;render();}
 else if(c.contains('dr-tg')||c.contains('dr-tr')){const k=c.contains('dr-tg')?'give':'get',o=+t.dataset.o;S.trade[k]=S.trade[k].includes(o)?S.trade[k].filter(x=>x!==o):[...S.trade[k],o];S.trade.msg='';render();}
 else if(c.contains('dr-tdo')){const T=S.trade,me=S.slots[S.cur].owner;S.hist.push(snap());S.slots.forEach(s=>{if(T.give.includes(s.overall))s.owner=T.with;else if(T.get.includes(s.overall))s.owner=me;});
  S.trade={with:'',give:[],get:[],msg:`Trade done with ${TN(T.with)}.`};if(!isUser(S.slots[S.cur])){S.trade=null;step();}else render();}
 else if(c.contains('dr-copy')){const ta=e.querySelector('.dr-share');(navigator.clipboard?navigator.clipboard.writeText(ta.value):Promise.reject()).then(()=>{t.textContent='Copied!';}).catch(()=>{ta.select();document.execCommand('copy');t.textContent='Copied!';});}
 else if(c.contains('dr-img'))shareImage();
 else if(c.contains('dr-reset')){clearTimeout(S.timer);S.phase='setup';render();}});
document.addEventListener('input',ev=>{const e=el();if(!e||!e.contains(ev.target))return;const c=ev.target.classList;
 if(c.contains('dr-q')){S.q=ev.target.value;render();}else if(c.contains('dr-rand')){S.rand=+ev.target.value;document.getElementById('drRandV').textContent=S.rand;}});
document.addEventListener('change',ev=>{const e=el();if(!e||!e.contains(ev.target))return;const c=ev.target.classList;
 if(c.contains('dr-sch')){S.school=ev.target.value;render();}else if(c.contains('dr-tw')){S.trade.with=ev.target.value;S.trade.get=[];render();}});
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&S.card){S.card=null;render();}});
Promise.all(['data/draft/board.json','data/draft/order.json'].map(u=>fetch(u,{cache:'no-store'}).then(r=>r.json()))).then(([b,o])=>{S.board=b;S.order=o;if(o.needs&&o.needs.PIT)S.needsPIT=o.needs.PIT;render();}).catch(()=>{const e=el();if(e)e.innerHTML='<p class="empty">Mock draft data unavailable right now.</p>';});
})();
