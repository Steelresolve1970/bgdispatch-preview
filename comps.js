// "Plays like" Steeler comparisons (our comparison, our words) shared by Mock Draft, Draft tab and College Tracker.
(function(){const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
window.COMPS={};window.compsReady=fetch(BGD_url('data/draft/comps.json'),{cache:'no-store'}).then(r=>r.json()).then(j=>{window.COMPS=j.comps||{};}).catch(()=>{});
window.compHTML=n=>{const c=window.COMPS[n];return c?`<p class="comp"><b>Plays like:</b> ${E(c.name)} <span class="comp-tag">our comparison</span><br><small>${E(c.reason)}</small></p>`:'';};})();
