/* Image breaks on the home page: licensed photos + black-and-gold dividers built from data/schedule.json. */
(function(){
 var ET={timeZone:'America/New_York'};
 function el(id){return document.getElementById(id);}
 function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
 function vs(g){return (g.home?'vs ':'at ')+g.opponent;}
 function when(iso){var d=new Date(iso);var day=d.toLocaleDateString('en-US',Object.assign({weekday:'short',month:'short',day:'numeric'},ET));
  if(/T05:00/.test(iso))return day+' · Time TBD';return day+' · '+d.toLocaleTimeString('en-US',Object.assign({hour:'numeric',minute:'2-digit'},ET))+' ET';}
 function daysTo(iso){var ms=new Date(iso)-Date.now();if(ms<=0)return 'Game day';var d=Math.ceil(ms/864e5);return d===1?'Tomorrow':'In '+d+' days';}
 function fill(s){
  var n=s&&s.next,l=s&&s.last,a=el('ib-next'),b=el('ib-record');
  if(a){if(n){a.innerHTML='<div class="ib-stripe" aria-hidden="true"></div><p class="ib-kicker">Next up · '+esc(n.week||'')+'</p><p class="ib-line"><b>'+esc(vs(n))+'</b><span>'+esc(when(n.date))+(n.tv?' · '+esc(n.tv):'')+'</span></p><p class="ib-sub">'+esc(n.venue||'')+' <span class="ib-pill">'+esc(daysTo(n.date))+'</span> <a href="#/opponent">Opponent preview →</a></p>';a.hidden=false;}else a.hidden=true;}
  if(b){if(s&&s.record){var last=l?'<p class="ib-sub">Last time out: <b class="ib-res">'+esc(l.result)+' '+esc(l.score)+'</b> '+esc(vs(l))+' · '+esc(new Date(l.date).toLocaleDateString('en-US',Object.assign({month:'short',day:'numeric'},ET)))+'</p>':'';
   b.innerHTML='<div class="ib-num"><span>'+esc(s.record)+'</span><small>'+esc(s.season||'')+' record</small></div><div class="ib-body"><p class="ib-kicker">By the numbers</p>'+last+'<p class="ib-sub"><a href="#/game">Full schedule →</a> · <a href="#/grades">Grade the players →</a></p></div>';b.hidden=false;}else b.hidden=true;}
 }
 function load(){fetch((typeof BGD_url==='function'?BGD_url('data/schedule.json'):'data/schedule.json'),{cache:'no-store'}).then(function(r){if(!r.ok)throw r.status;return r.json();}).then(fill).catch(function(){});}
 /* Mid-news photo: re-insert after the 2nd card whenever the news grid re-renders. */
 var tpl=el('ib-midnews-tpl');
 function placeMid(){var c=el('cards');if(!c||!tpl)return;if(c.querySelector('.ib-mid'))return;var k=c.children;if(k.length<4)return;
  var f=tpl.content?tpl.content.firstElementChild.cloneNode(true):null;if(f)c.insertBefore(f,k[2]);}
 var cards=el('cards');if(cards&&window.MutationObserver)new MutationObserver(placeMid).observe(cards,{childList:true});placeMid();
 load();setInterval(load,10*60*1000);
})();
