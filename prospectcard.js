// Shared prospect player card: used by the mock draft (draft.js), the Draft tab prospect list (drafthub.js) and the College Prospect Tracker (college.js).
// PCard.html(p,{top,bottom}) renders the card for a board.json prospect; PCard.open(name) shows it as a modal outside the mock (no Draft button).
(function(){
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const scoutReason=p=>{const m=(p.note||'').split('Our scouts: ');return m.length>1?m[1]:'';};
function scout(p){const t=p.parts||{},g=[],c=[];
 if(p.prod_pct!=null&&p.prod_pct>=80)g.push('Top-20% producer at his position in our data');
 if(p.eff_pct!=null&&p.eff_pct>=80)g.push('Very efficient on a per-play basis');
 if(p.stars>=4)g.push(`Highly recruited (${p.stars}-star) out of high school`);
 if((t.schedule??0)>=8)g.push('Has produced against a tough schedule');
 if((t.size??0)>=4)g.push('Size fits what NFL teams want at his position');
 if(p.scout_tier&&p.scout_tier<=2)g.push('Our scouts see first-round talent');
 if(p.prod_pct!=null&&p.prod_pct<40)c.push('Limited production so far');
 if(p.eff_pct!=null&&p.eff_pct<40)c.push('Per-play efficiency is average or worse');
 if(t.schedule!=null&&t.schedule<5)c.push('Level of competition is a question');
 if(t.size!=null&&t.size<=2)c.push('Below the usual size range for his position');
 if(/So/.test(p.cls||''))c.push('Young for the class; could return to school');
 if(p.pos==='OT'||p.pos==='IOL')c.push('No box-score stats for linemen, so our view leans on scouting');
 if(p.scout_tier>=5)c.push('Our scouts project him as a Day 3 pick');
 return{g:g.slice(0,4),c:c.slice(0,3)};}
// Extras (Oct 21, 2026): sourced 40 times + verified highlight links (data/draft/prospect_extras.json). Link out only, new tab.
let X={};const xready=fetch(BGD_url('data/draft/prospect_extras.json'),{cache:'no-store'}).then(r=>r.json()).then(j=>{X=j.players||{};}).catch(()=>{X={};});
function fortyHTML(n){const f=(X[n]||{}).forty;if(!f)return`<span class="pc-40"><b>40:</b> TBD (combine Feb 2027)</span>`;
 return`<span class="pc-40"><b>40:</b> ${E(f.time)} <small>(${f.kind==='verified'?'verified':'projected'}, per <a href="${E(f.url)}" target="_blank" rel="noopener">${E(f.source)}</a>)</small></span>`;}
function hlHTML(n){const h=(X[n]||{}).highlight;return h?`<a class="btn pc-hl" href="${E(h.url)}" target="_blank" rel="noopener" title="${E(h.title)} (${E(h.channel)}, YouTube)" aria-label="Watch highlights of ${E(n)} on YouTube (opens a new tab)">Watch highlights</a>`:'';}
// Season stat line (Oct 25, 2026): says which season and "Stats through Week N (date)"; never shows old numbers silently.
let META={};
function statsHTML(p,short){p=p||{};const q=get(p.name)||p,k=q.stats,l=q.line,th=META.stats_through;
 const thru=th?`Stats through ${E(th.label)}`:'';const src=' · CollegeFootballData.com';
 if(k==='2026'&&l)return short?`${E(l)}${th?` <span class="pc-thru">· thru ${E((String(th.label).match(/\(([^)]*)\)/)||[,th.label])[1])}</span>`:''}`:`<p><b>2026 season:</b> ${E(l)}</p><p class="fine pc-thru">${thru}${src}</p>`;
 if(k==='2025'&&l)return short?`${E(l)} <span class="pc-thru">(2025; no 2026 stats yet)</span>`:`<p><b>2025 season:</b> ${E(l)} <small>(no 2026 stats recorded yet)</small></p>${th?`<p class="fine pc-thru">2026 checked through ${E(th.label)}${src}</p>`:''}`;
 if(q.pos==='OT'||q.pos==='IOL'||k==='line')return short?'No box-score stats for linemen':`<p><b>2026 season:</b> No box-score stats for linemen.</p>`;
 if(k===undefined&&l&&l!=='None')return short?E(l):`<p><b>2026 season:</b> ${E(l)}</p>`;
 return short?'Stats not available':`<p><b>2026 season:</b> Stats not available from CollegeFootballData.com${th?` (checked through ${E(th.label)})`:''}.</p>`;}
const meta=p=>[p.pos,p.school,p.cls,p.height,p.weight?p.weight+' lb':''].filter(Boolean).map(E).join(' · ');
function html(p,o){o=o||{};const t=p.parts||{},sc=scout(p),why=scoutReason(p);
 return`<div class="dr-modal" role="dialog" aria-label="${E(p.name)}"><div class="dr-card"><button class="dr-x" type="button" aria-label="Close">✕</button>
 <p class="kind">Our board #${p.rank} · ${E(p.tier)}${p.scout_tier?` · staff tier ${p.scout_tier}`:''}</p><h2>${E(p.name)}</h2><p>${meta(p)}${p.conf?' · '+E(p.conf):''}</p>
 ${o.top||''}
 <p class="pc-xrow">${fortyHTML(p.name)} ${hlHTML(p.name)}</p>
 <p class="dr-g">Our grade <b>${p.grade}</b>${p.stars?` · ${p.stars}★ recruit`:''}${p.transfer?` · transfer`:''}${p.anchor?' · Steelers watch list':''}</p>
 ${statsHTML(p)}
 ${why?`<p><b>Our scouts:</b> ${E(why)}</p>`:''}
 <div class="dr-sc"><div><b>Strengths</b><ul>${sc.g.map(x=>`<li>${E(x)}</li>`).join('')||'<li>Well-rounded profile in our data</li>'}</ul></div><div><b>Concerns</b><ul>${sc.c.map(x=>`<li>${E(x)}</li>`).join('')||'<li>No major red flags in our data</li>'}</ul></div></div>
 ${window.compHTML?compHTML(p.name):''}
 ${window.availHTML?availHTML(p.name):''}
 <table class="dr-parts"><tr><th>Prod.</th><th>Pedigree</th><th>Sched.</th><th>Team</th><th>Class</th><th>Size</th></tr><tr><td>${t.production??'–'}/45</td><td>${t.pedigree??'–'}/22</td><td>${t.schedule??'–'}/12</td><td>${t.team??'–'}/6</td><td>${t.cls??'–'}/5</td><td>${t.size??'–'}/5</td></tr></table>
 <p class="fine">Our own formula from CollegeFootballData.com stats plus our staff tier; strengths, concerns and comparison are our own read. Fan opinion, not a scouting report.</p>
 ${o.bottom||''}</div></div>`;}
let B=null;const ready=Promise.all([fetch(BGD_url('data/draft/board.json'),{cache:'no-store'}).then(r=>r.json()).then(j=>{META={stats_through:j.stats_through,stats_fetched:j.stats_fetched};B={};(j.prospects||[]).forEach(p=>{B[p.name]=p;});return B;}).catch(()=>{B={};}),xready]).then(a=>a[0]);
const get=n=>B&&B[n];
const size=n=>{const p=get(n);return p?[p.height,p.weight?p.weight+' lb':''].filter(Boolean).join(', '):'';};
let host=null,last=null;
function close(){if(host){host.remove();host=null;document.body.classList.remove('pc-open');if(last&&last.focus)last.focus();}}
function open(n){const p=get(n);if(!p)return;close();last=document.activeElement;host=document.createElement('div');host.className='pc-host';host.innerHTML=html(p,{bottom:'<button class="btn pc-close" type="button">Close</button>'});
 document.body.appendChild(host);document.body.classList.add('pc-open');const x=host.querySelector('.dr-x');if(x)x.focus();}
document.addEventListener('click',e=>{if(host&&host.contains(e.target)){if(e.target.closest('.dr-x,.pc-close')||e.target.classList.contains('dr-modal'))close();return;}
 const t=e.target.closest('[data-pc]');if(t){e.preventDefault();ready.then(()=>open(t.dataset.pc));}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&host)close();});
window.addEventListener('hashchange',close);
window.PCard={meta,html,open,close,get,size,ready,xready,forty:fortyHTML,hl:hlHTML,stats:statsHTML,setMeta:j=>{if(j&&j.stats_through)META={stats_through:j.stats_through,stats_fetched:j.stats_fetched};}};
})();
