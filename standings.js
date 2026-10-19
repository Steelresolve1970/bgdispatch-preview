// NFL standings (data/standings.json, computed from nflverse scores every update cycle; cross-checked vs ESPN)
(function(){
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rec=r=>`${r.w}-${r.l}${r.t?'-'+r.t:''}`, pct=p=>p.toFixed(3).replace(/^0/,'');
const upd=d=>new Date(d.generated).toLocaleString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
function table(name,rows){return `<section class="box stn-div"><h3>${E(name)}</h3><table class="stn"><thead><tr><th>Team</th><th class="num">W-L-T</th><th class="num">Pct</th><th class="num">Div</th><th class="num">Conf</th><th class="num">PF</th><th class="num">PA</th><th class="num">Diff</th><th class="num">Strk</th></tr></thead><tbody>${rows.map(r=>`<tr class="${r.abbr==='PIT'?'pit':''}"><td><b>${E(r.abbr)}</b> <small>${E(r.name)}</small></td><td class="num">${r.w}-${r.l}-${r.t}</td><td class="num">${pct(r.pct)}</td><td class="num">${E(r.div)}</td><td class="num">${E(r.conf)}</td><td class="num">${r.pf}</td><td class="num">${r.pa}</td><td class="num">${r.diff>0?'+':''}${r.diff}</td><td class="num">${E(r.strk)}</td></tr>`).join('')}</tbody></table></section>`;}
function render(d){
 const full=document.getElementById('standings-full');
 if(full){full.innerHTML=`<h2 class="section-title">NFL Standings</h2><p class="page-sub">${d.season} regular season through ${E(d.through||'')} · updated ${upd(d)} ET.</p>`+
  ['AFC','NFC'].map(c=>`<h3 class="stn-conf">${c}</h3><div class="stn-grid">${Object.keys(d.divisions).filter(k=>k.startsWith(c)).map(k=>table(k,d.divisions[k])).join('')}</div>`).join('')+
  `<p class="fine">${E(d.order_note)} Data: <a href="${E(d.source_url)}" target="_blank" rel="noopener">${E(d.source)}</a>.</p>`;}
 const box=document.getElementById('afcn-box'), n=d.divisions['AFC North'];
 if(box&&n){box.hidden=false;box.innerHTML=`<h2>AFC North</h2><table class="afcn"><thead><tr><th>Team</th><th class="num">W-L-T</th><th class="num">Div</th><th class="num">Strk</th></tr></thead><tbody>${n.map((r,i)=>`<tr class="${r.abbr==='PIT'?'pit':''}"><td>${i+1}. ${E(r.name.replace(/^.* /,''))}</td><td class="num">${r.w}-${r.l}-${r.t}</td><td class="num">${E(r.div)}</td><td class="num">${E(r.strk)}</td></tr>`).join('')}</tbody></table><p class="fine">Updated ${upd(d)} ET · <a href="#/game">Full standings →</a></p>`;}
}
fetch(BGD_url('data/standings.json'),{cache:'no-store'}).then(r=>r.json()).then(render).catch(()=>{});
})();
