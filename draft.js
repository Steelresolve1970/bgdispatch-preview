// Mock Draft Simulator v2 (Oct 23, 2026: board back to 500+ prospects so 7 rounds always finish; an early end is now explained) — our own 2027 big board (data/draft/board.json), projected 7-round order + CPU team needs (data/draft/order.json).
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
// Trade rule (owner request Oct 21, 2026): accept when what the CPU team gets is at least 95% of what it gives (overpays always accepted).
// 85-95% = "close" message. The gap is shown in plain words. Exported for tests as window.BGD_tradeVerdict.
const ACCEPT=0.95,CLOSE=0.85,pts=n=>n===1?'1 point':`${n} points`;
function tradeVerdict(gv,rv){const pct=rv?gv/rv:1,gap=Math.abs(gv-rv),need=Math.max(0,Math.ceil(rv*ACCEPT)-gv);
 if(pct>=ACCEPT){return{ok:true,cls:'dr-ok',head:'They accept.',text:gv===rv?'Dead-even trade.':gv>rv?`You are giving ${pts(gap)} more than you get.`:`You are ${pts(gap)} short, but that is close enough for them.`};}
 if(pct>=CLOSE)return{ok:false,cls:'dr-close',head:'Close. Add a little more to get this done.',text:`You are ${pts(gap)} short. About ${pts(need)} more would do it.`};
 return{ok:false,cls:'dr-no',head:'Not enough. They say no.',text:`You are ${pts(gap)} short. They want at least about ${pts(Math.ceil(rv*ACCEPT))} for what you are asking.`};}
window.BGD_tradeVerdict=tradeVerdict;
function rng(){S.seed=(S.seed*1664525+1013904223)>>>0;return S.seed/4294967296;}
const needs=a=>a==='PIT'&&S.needsPIT?S.needsPIT:(S.order.needs[a]||[]);
const mine=a=>S.slots.filter(s=>s.owner===a&&s.player);
const isUser=s=>S.teams.includes(s.owner);
// CPU teams (Oct 26, 2026): each team gets its own draft style for this draft, so they don't all pick the same way.
// need = how hard it leans on its needs; reach = how often it jumps a need player up the board; bpa = sometimes ignores needs.
function styleFor(a){S.style=S.style||{};if(!S.style[a]){const r1=rng(),r2=rng(),r3=rng();S.style[a]={need:0.55+r1*1.1,reach:r2<0.35?0.4+r3*0.6:r3*0.3,bpa:r1<0.2};}return S.style[a];}
function cpuPick(s){const nd=needs(s.owner),have=mine(s.owner).map(x=>x.player.pos),st=styleFor(s.owner);const k=8+S.rand*3;
 // Occasional reach: a need player from deeper on the board, mostly in rounds 1-4. Scales with the randomness slider.
 if(s.round<=4&&nd.length&&rng()<st.reach*0.12*(S.rand/4)){const deep=S.avail.slice(k,k+30).filter(p=>nd.slice(0,3).includes(p.pos)&&!have.includes(p.pos));if(deep.length)return deep[Math.floor(rng()*Math.min(3,deep.length))];}
 let best=null,bs=1e9;
 S.avail.slice(0,k).forEach(p=>{let sc=p.rank+(rng()-0.5)*S.rand*4;const i=nd.indexOf(p.pos);if(i>=0&&!st.bpa)sc-=(14-i*2.5)*(s.round<=3?1:0.6)*st.need;
  const dup=have.filter(x=>x===p.pos).length;sc+=dup*(p.pos==='QB'?60:12);if(p.pos==='QB'&&i<0&&s.round<=2)sc+=12;if(sc<bs){bs=sc;best=p;}});return best;}
function take(s,p){S.avail=S.avail.filter(x=>x!==p);s.player=p;S.cur++;}
function snap(){return{cur:S.cur,avail:[...S.avail],slots:S.slots.map(s=>({...s}))};}
function step(){clearTimeout(S.timer);clearTimeout(S.watch);if(S.paused){render();return;}
 try{while(S.cur<S.slots.length&&!isUser(S.slots[S.cur])){const s=S.slots[S.cur],p=cpuPick(s)||S.avail[0];if(!p){S.short=S.cur;S.slots=S.slots.slice(0,S.cur);break;}take(s,p);
  if(S.speed>0&&S.cur<S.slots.length){S.phase='cpu';render();S.timer=setTimeout(step,S.speed);S.watch=setTimeout(stallCheck,Math.max(4000,S.speed*10));return;}}
 S.phase=S.cur>=S.slots.length?'done':'user';if(S.phase==='user')S.tab='board';render();}catch(err){console.warn('mock draft step',err);S.stalled=true;try{render();}catch(e2){showFinish();}}}
// Safety net: if the CPU stops picking for any reason, offer a Finish draft button.
let lastCur=-1;function stallCheck(){if(S.phase==='cpu'&&!S.paused&&S.cur===lastCur){S.stalled=true;render();}lastCur=S.cur;if(S.phase==='cpu')S.watch=setTimeout(stallCheck,Math.max(4000,S.speed*10));}
function finishDraft(){clearTimeout(S.timer);clearTimeout(S.watch);S.paused=false;S.stalled=false;S.card=null;S.trade=null;
 while(S.cur<S.slots.length){const s=S.slots[S.cur];const p=cpuPick(s)||S.avail[0];if(!p){S.short=S.cur;S.slots=S.slots.slice(0,S.cur);break;}take(s,p);}S.phase='done';render();}
function showFinish(){const e=el();if(e&&!e.querySelector('.dr-finish'))e.insertAdjacentHTML('afterbegin','<p class="box"><b>The draft got stuck.</b> <button class="btn dr-finish" type="button">Finish draft</button></p>');}
// Dispatch Draft Desk grades (Oct 26, 2026 redesign). Before, every team's grade was an average of near-even picks on a
// fixed scale, so almost everyone landed on B. Now each team gets a raw score from value, needs, reaches, steals, trades and
// pick count, and the final grade is mostly a curve against the other teams in the same draft (70%) plus a fixed scale (30%),
// so grades spread like real post-draft report cards and change from draft to draft. Every team, yours too, uses the same rules.
const LETTERS=[[1.95,'A+'],[1.45,'A'],[1.05,'A-'],[0.65,'B+'],[0.28,'B'],[-0.08,'B-'],[-0.45,'C+'],[-0.82,'C'],[-1.55,'C-'],[-1.85,'D+'],[-2.1,'D'],[-2.4,'D-']];
const LET=x=>{for(const[t,l]of LETTERS)if(x>=t)return l;return'F';};
const RW=[0,1,0.8,0.62,0.48,0.38,0.3,0.25];
// Value of one pick: how far below (steal) or above (reach) his board rank he went, on a log scale so a 10-spot reach at #5 counts far more than at #150.
// A few spots either way counts as fair value (dead zone), so a team taking board #3 at #2 isn't marked as reaching.
const rel=s=>{const r=Math.log((s.overall+12)/(s.player.rank+12)),d=Math.sign(r)*Math.max(0,Math.abs(r)-0.06);return Math.max(-1.4,Math.min(1.2,d));};
function pickScore(s){const r0=Math.log((s.overall+12)/(s.player.rank+12)),r=Math.max(-1.4,Math.min(1.2,Math.sign(r0)*Math.max(0,Math.abs(r0)-0.025))),i=needs(s.owner).indexOf(s.player.pos);return r*5+(i>=0&&i<5?0.4-i*0.08:s.round<=3?-0.3:-0.08);}
function pickGrade(s){return LET(pickScore(s));}
// Absolute reference (mean and spread of raw team scores over many simulated drafts at default settings).
// Index = number of rounds drafted.
const REF_MS=[0,0.32,0.63,0.84,0.92,0.95,0.96,0.96],REF_SDS=[0,0.29,0.35,0.37,0.365,0.36,0.36,0.36];
// Normal-curve position from a 0-1 rank share (rational approximation), so the class always spreads like a bell curve.
const qn=p=>{const a=[-39.696830,220.946098,-275.928510,138.357751,-30.664798,2.506628],b=[-54.476098,161.585836,-155.698979,66.801311,-13.280681],c=[-0.007784894,-0.32239645,-2.400758,-2.549732,4.374664,2.938163],d=[0.007784695,0.32246712,2.445134,3.754408];
 if(p<0.02425){const q=Math.sqrt(-2*Math.log(p));return(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}
 if(p>1-0.02425)return-qn(1-p);const q=p-0.5,r=q*q;return(((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);};
function teamRaw(a){const ps=mine(a).sort((x,y)=>x.overall-y.overall);if(!ps.length)return null;const nd=needs(a).slice(0,5);
 let v=0,need=0,reach=null,steal=null,pos={};const f={};
 ps.forEach(s=>{const w=RW[s.round]||0.2,r=rel(s);v+=w*r;
  if(r<-0.3)v+=w*(r+0.3)*0.9; // big reaches hurt extra
  if(r>0.3)v+=w*(r-0.3)*0.5;  // big steals help extra
  const i=nd.indexOf(s.player.pos);if(s.round<=4){if(i>=0&&!f[s.player.pos]){need+=w*(5-i)/5*0.35;f[s.player.pos]=1;}else if(i<0&&s.round<=2)need-=w*0.08;}
  const c=(pos[s.player.pos]=(pos[s.player.pos]||0)+1);if(c>1&&s.round<=3)need-=0.12;
  if(!reach||r<rel(reach))reach=s;if(!steal||r>rel(steal))steal=s;});
 const top3=nd.slice(0,3).filter(p=>ps.some(s=>s.round<=5&&s.player.pos===p)).length;need+=top3*0.1;
 if(nd[0]&&!ps.some(s=>s.round<=3&&s.player.pos===nd[0]))need-=0.18;
 // Trades: pick points owned now vs. the picks this team started with (our value chart).
 const own=S.slots.filter(s=>s.owner===a).reduce((x,s)=>x+val(s.overall),0),orig=S.slots.filter(s=>s.team===a).reduce((x,s)=>x+val(s.overall),0),net=own-orig;
 const tr=Math.max(-1,Math.min(1,net/400)),cnt=(ps.length-S.rounds)*0.07;
 // Pick capital: early picks land better players, so they count a little (pick 1 adds 0.25).
 const cap=ps.reduce((x,s)=>x+val(s.overall),0)/1000*0.25;
 return{raw:v+need+tr*0.6+cnt+cap,v,need,tr:net,top3,nd,reach,steal,n:ps.length};}
let GC={k:'',m:{}};
function gradeAll(){const k=S.cur+'|'+S.slots.map(s=>s.owner+(s.player?s.player.rank:'')).join(',');if(GC.k===k)return GC.m;
 const all=[...new Set(S.slots.map(s=>s.owner))],R={};all.forEach(a=>{const r=teamRaw(a);if(r)R[a]=r;});
 const L=Object.values(R).sort((x,y)=>x.raw-y.raw),n=L.length;
 // Curve: rank in this draft -> bell-curve spot (ties share a spot). Fixed scale: raw vs. our typical draft. 70/30 blend.
 L.forEach((r,i)=>{const lo=L.findIndex(x=>x.raw===r.raw),hi=L.length-1-[...L].reverse().findIndex(x=>x.raw===r.raw);
  r.z=n>=8?qn(((lo+hi)/2+0.5)/n):0;const RM=REF_MS[S.rounds]||0.96,RS=REF_SDS[S.rounds]||0.36,ab=Math.max(-3,Math.min(3,(r.raw-RM)/RS));r.score=n>=8?0.7*r.z+0.3*ab:ab;r.grade=LET(r.score);});
 GC={k,m:R};return R;}
function teamGrade(a){const r=gradeAll()[a];return r?r.grade:null;}
// One short plain-English line explaining the grade.
function teamNote(a){const r=gradeAll()[a];if(!r)return'';const bits=[];const nm=s=>`${s.player.name} at #${s.overall} (our board #${s.player.rank})`;
 if(r.steal&&rel(r.steal)>0.15)bits.push(`Best value: ${nm(r.steal)}.`);
 if(r.reach&&rel(r.reach)<-0.2&&r.reach!==r.steal)bits.push(`Biggest reach: ${nm(r.reach)}.`);
 if(r.nd.length)bits.push(r.top3===3?'Filled all of its top 3 needs.':r.top3?`Filled ${r.top3} of its top 3 needs.`:'Missed its top 3 needs.');
 if(Math.abs(r.tr)>=40)bits.push(r.tr>0?`Gained ${r.tr} points in trades.`:`Gave up ${-r.tr} points in trades.`);
 const G=Object.values(gradeAll()),place=1+G.filter(x=>x.raw>r.raw).length;
 bits.push(`Ranks ${place}${place%10===1&&place!==11?'st':place%10===2&&place!==12?'nd':place%10===3&&place!==13?'rd':'th'} of ${G.length} teams in this draft.`);return bits.join(' ');}
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
 const gv=give.reduce((a,s)=>a+val(s.overall),0),rv=get.reduce((a,s)=>a+val(s.overall),0);const tv=tradeVerdict(gv,rv),ok=get.length&&give.length&&tv.ok;
 const li=(a,arr,cls)=>open(a).map(s=>`<button type="button" class="chip ${cls}${arr.includes(s.overall)?' on':''}" data-o="${s.overall}">R${s.round} #${s.overall} <small>${val(s.overall)}</small></button>`).join('');
 return`<div class="box dr-trade"><h2>Trade picks</h2><p class="fine">Our own value chart (pick 1 = 1000 pts). Like real GMs, the other team says yes if your offer is worth at least 95% of what they give up. Overpaying always works.</p>
 <label>Trade with <select class="dr-tw"><option value="">Choose a team</option>${partners.map(a=>`<option value="${a}"${T.with===a?' selected':''}>${E(TN(a))}</option>`).join('')}</select></label>
 <p><b>You give (${E(me)})</b></p><div class="chips">${li(me,T.give,'dr-tg')}</div>
 ${T.with?`<p><b>You get (${E(T.with)})</b></p><div class="chips">${li(T.with,T.get,'dr-tr')}</div>`:''}
 <p>Value: you give <b>${gv}</b> · you get <b>${rv}</b></p>${get.length&&give.length?`<p class="dr-tv ${tv.cls}" role="status"><b>${E(tv.head)}</b> ${E(tv.text)}</p>`:'<p class="fine">Pick at least one of your picks and one of theirs.</p>'}
 <button class="btn dr-tdo" type="button"${ok?'':' disabled'}>Make trade</button> <button class="btn ghost dr-tx" type="button">Cancel</button>${T.msg?`<p class="dr-ok">${E(T.msg)}</p>`:''}</div>`;}
window.BGD_mockDraft=()=>S.phase!=='done'?null:{rounds:S.rounds,teams:S.teams.map(a=>({team:a,name:TN(a),grade:teamGrade(a)||null,note:teamNote(a),needs:needs(a).slice(0,6),picks:mine(a).map(s=>({round:s.round,overall:s.overall,name:s.player.name,pos:s.player.pos,school:s.player.school,grade:String(pickGrade(s)).replace(/<[^>]+>/g,'')}))}))};
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
 ${S.teams.includes('PIT')?`<p><b>Steelers needs</b>: ${needs('PIT').map(E).join(' → ')}</p>`:''}
 <p><button class="btn dr-start" type="button"${S.teams.length?'':' disabled'}>Start draft</button></p></div>`;}
function boardHTML(){const list=filtered().slice(0,80),on=S.slots[S.cur];const nd=on?needs(on.owner):[];
 const schools=[...new Set(S.avail.map(p=>p.school))].sort();
 return`<div class="dr-tools"><input type="search" class="dr-q" placeholder="Search player or school" value="${E(S.q)}" aria-label="Search prospects">
  <select class="dr-sch" aria-label="Filter by school"><option value="">All schools</option>${schools.map(s=>`<option${S.school===s?' selected':''}>${E(s)}</option>`).join('')}</select></div>
 <div class="chips">${['All',...POS].map(p=>`<button type="button" class="chip dr-filter${S.filter===p?' on':''}" data-p="${p}">${p}</button>`).join('')}</div>
 <div class="dr-list">${list.map(p=>`<div class="dr-prospect${nd.includes(p.pos)?' need':''}"><span class="dr-rank">#${p.rank}</span><button type="button" class="dr-info" data-r="${p.rank}"><b>${E(p.name)}</b><br><small>${meta(p)}</small><br><small class="dr-line">${PCard.stats(p,true)}</small></button><span class="dr-gr">${p.grade}</span>${S.phase==='user'?`<button type="button" class="dr-draft" data-r="${p.rank}">Draft</button>`:''}</div>`).join('')||'<p class="empty">No prospects match</p>'}</div>
 ${filtered().length>80?`<p class="fine">Showing top 80 of ${filtered().length}. Use search or filters to see more.</p>`:''}`;}
function tickerHTML(){const lo=Math.max(0,S.cur-40),hi=Math.min(S.slots.length,S.cur+16);let h='';for(let i=lo;i<hi;i++){const s=S.slots[i];h+=`<button type="button" class="dr-tk${isUser(s)?' mine':''}${i===S.cur?' now':''}" data-o="${s.overall}" style="--tc:${COL[s.owner]||'#555'}"><small>R${s.round} #${s.overall}</small><b>${E(s.owner)}</b><span>${s.player?E(s.player.name.split(' ').slice(-1)[0])+' · '+s.player.pos:i===S.cur?'On clock':'—'}</span></button>`;}
 return`<div class="dr-ticker" aria-label="Pick ticker — scroll back to see earlier picks">${h}</div>`;}
function logHTML(){let h='',r=0;S.slots.forEach((s,i)=>{if(!s.player&&i>=S.cur+40)return;if(s.round!==r){r=s.round;h+=`<li class="dr-rd">Round ${r}</li>`;}
 h+=`<li class="${isUser(s)?'mine':''}${i===S.cur?' now':''}"><b>${s.overall}.</b> ${tm(s.owner)}${s.owner!==s.team?` <small>(via ${E(s.team)})</small>`:''} ${s.player?(S.phase==='done'?`<span class="dr-row"><span class="dr-nm dr-lg"><button type="button" class="dr-pk" data-o="${s.overall}">${E(s.player.name)}</button> <small>${s.player.pos}, ${E(s.player.school)}</small></span><span class="dr-grade sm">${pickGrade(s)}</span></span>`:`— <button type="button" class="dr-pk" data-o="${s.overall}">${E(s.player.name)}</button> <small>${s.player.pos}, ${E(s.player.school)}</small>`):i===S.cur?'— on the clock':''}</li>`;});return`<ol class="dr-log full">${h}</ol>`;}
function summaryHTML(){const all=[...new Set(S.slots.map(s=>s.owner))].sort((a,b)=>S.teams.includes(b)-S.teams.includes(a)||a.localeCompare(b));
 return`<div class="ballot-head"><p class="kind">Draft complete</p><h2>Your 2027 draft</h2><p>${S.rounds} round${S.rounds>1?'s':''} · <b>Dispatch Draft Desk grades</b>: value vs. our board, needs filled, reaches, steals and trades, graded on a curve against the rest of this draft</p>${S.short?`<p class="fine" role="status">Our board ran out of prospects after pick #${S.short}, so the draft ended early.</p>`:''}</div>
 ${S.teams.map(a=>`<div class="box"><h2>${E(TN(a))} <span class="dr-grade" title="Dispatch Draft Desk grade">${teamGrade(a)||'–'}</span></h2><p class="fine dr-desk">Dispatch Draft Desk grade</p><p class="dr-note">${E(teamNote(a))}</p>${mine(a).map(s=>`<div class="dr-mine"><div class="dr-row"><span class="dr-nm"><b>R${s.round} #${s.overall} <button type="button" class="dr-pk" data-o="${s.overall}">${E(s.player.name)}</button></b> <small>${s.player.pos}, ${E(s.player.school)}</small></span><span class="dr-grade sm">${pickGrade(s)}</span></div><div class="dr-sub"><small>${meta(s.player)} · our board #${s.player.rank}</small><br><small>${window.PCard&&PCard.forty?PCard.forty(s.player.name):''}</small>${COMPS_[s.player.name]?`<br><small>Plays like ${E(COMPS_[s.player.name].name)} (our comparison)</small>`:''}</div></div>`).join('')||'<p class="fine">No picks.</p>'}</div>`).join('')}
 <div class="box"><h2>Share</h2><textarea class="dr-share" readonly rows="6">${E(shareText())}</textarea><p><button class="btn dr-copy" type="button">Copy text</button> <button class="btn dr-img" type="button">Download image</button> <button class="btn ghost dr-reset" type="button">Draft again</button></p><p><button class="btn dr-forum" type="button">Post to Forum</button> <small class="fine">Optional: share your picks in Fan Mock Drafts.</small></p></div>
 <div class="box"><h2>Every team's grade <small>· Dispatch Draft Desk</small></h2><p class="fine">Team grades are graded on a curve like real post-draft report cards: each team is scored on value vs. our board (early picks count most), big reaches and steals, needs filled, trades and number of picks, then compared with the other teams in this draft. Your team gets the same rules as everyone else. Each pick is graded A+ to F on where he went vs. our board, plus need fit. Tap a team to see each pick.</p><div class="dr-allg">${all.map(a=>`<details${S.teams.includes(a)?' open':''} class="${S.teams.includes(a)?'mine':''}"><summary>${tm(a)} <b>${E(TN(a))}</b> <span class="dr-grade sm">${teamGrade(a)||'–'}</span></summary><p class="fine dr-note">${E(teamNote(a))}</p>${mine(a).map(s=>`<p class="dr-pg dr-row"><span class="dr-nm">R${s.round} #${s.overall} <button type="button" class="dr-pk" data-o="${s.overall}">${E(s.player.name)}</button> <small>${s.player.pos} · board #${s.player.rank}</small></span><span class="dr-grade sm">${pickGrade(s)}</span></p>`).join('')}</details>`).join('')}</div></div>`;}
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
function start(){S.seed=(Date.now()%100000)+7;S.style={};S.avail=[...S.board.prospects];S.slots=S.order.picks.filter(p=>p.round<=S.rounds).map(p=>({...p,owner:p.team,player:null}));
 S.cur=0;S.short=0;S.stalled=false;S.hist=[];S.trade=null;S.card=null;S.paused=false;S.q='';S.filter='All';S.school='';step();}
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
 else if(c.contains('dr-tdo')){const T=S.trade,me=S.slots[S.cur].owner;const vv=a=>a.reduce((x,o)=>x+val(o),0);if(!T.with||!T.give.length||!T.get.length||!tradeVerdict(vv(T.give),vv(T.get)).ok)return;S.hist.push(snap());S.slots.forEach(s=>{if(T.give.includes(s.overall))s.owner=T.with;else if(T.get.includes(s.overall))s.owner=me;});
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
Promise.all([...['data/draft/board.json','data/draft/order.json'].map(u=>fetch((window.BGD_url?BGD_url(u):u),{cache:'no-store'}).then(r=>r.json())),window.compsReady,window.PCard&&PCard.xready]).then(([b,o])=>{S.board=b;if(PCard.setMeta)PCard.setMeta(b);S.order=o;if(o.needs&&o.needs.PIT)S.needsPIT=o.needs.PIT;render();}).catch(()=>{const e=el();if(e)e.innerHTML='<p class="empty">Mock draft data unavailable right now.</p>';});
})();
