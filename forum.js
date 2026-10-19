// Fan Forum + fan accounts + Game Day threads + Grade the Team + Pick'em/Trivia tabs.
// Talks to /api/* (Cloudflare Pages Functions + D1). If the API isn't switched on yet, the forum falls back to the
// read-only bot topics (data/forum_bot.json) and Pick'em/Trivia keep working on-device exactly as before.
(function(){
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const U=u=>window.BGD_url?BGD_url(u):u;
const getJ=u=>fetch(U(u),{cache:'no-store'}).then(r=>{if(!r.ok)throw r.status;return r.json();});
const $=id=>document.getElementById(id);
const ago=t=>{if(t==null||t==='')return'';const v=typeof t==='number'?t:Date.parse(t);if(!Number.isFinite(v))return'';const m=Math.round((Date.now()-v)/6e4);return m<1?'just now':m<60?m+'m ago':m<1440?Math.round(m/60)+'h ago':Math.round(m/1440)+'d ago';};
const etTime=t=>new Date(t).toLocaleString('en-US',{timeZone:'America/New_York',weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+' ET';
const S={api:null,me:null,cats:[],emoji:['🔥','👏','😤','😂','💛'],poll:null,livePoll:null,thread:null,last:0,bot:null,flairs:null};
async function api(path,opts={}){const o={method:opts.method||'GET',credentials:'same-origin',headers:{'x-bgd':'1'}};if(opts.body){o.method='POST';o.headers['content-type']='application/json';o.body=JSON.stringify(opts.body);}
 let r;try{r=await fetch('/api/'+path,o);}catch(e){return{ok:false,error:'Network problem. Check your connection and try again.',net:true};}
 let d;try{d=await r.json();}catch(e){d={ok:false,error:r.status===404?'not_configured':'Something went wrong.'};}
 if(!r.ok&&d.ok!==false)d.ok=false;d.status=r.status;return d;}

// ---------- styles (kept here so the shared stylesheet stays untouched) ----------
const css=`
.fx-tabs{display:flex;gap:6px;overflow-x:auto;margin:6px 0 14px;padding-bottom:2px;-webkit-overflow-scrolling:touch}
.fx-tabs a{flex:0 0 auto;min-height:44px;display:inline-flex;align-items:center;padding:0 16px;border-radius:22px;background:#fff;border:2px solid #101010;color:#101010;text-decoration:none;font-weight:800}
.fx-tabs a.on{background:#101010;color:#FFB612}
.fx-btn{min-height:46px;padding:0 18px;border-radius:10px;border:0;background:#FFB612;color:#101010;font-weight:900;font-size:1rem;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;text-decoration:none}
.fx-btn.dark{background:#101010;color:#FFB612}.fx-btn.ghost{background:#fff;border:2px solid #101010;color:#101010}.fx-btn[disabled]{opacity:.5;cursor:default}.fx-btn.sm{min-height:36px;padding:0 12px;font-size:.9rem}
.fx-form{background:#fff;border-radius:12px;padding:18px;max-width:520px;box-shadow:0 1px 3px #0001}
.fx-form label{display:block;font-weight:800;margin:12px 0 4px}.fx-form small{color:#555;font-weight:400}
.fx-form input[type=text],.fx-form input[type=email],.fx-form input[type=password],.fx-form select,.fx-form textarea{width:100%;min-height:48px;font-size:16px;padding:10px 12px;border:2px solid #ccc;border-radius:10px;background:#fff}
.fx-form input:focus,.fx-form textarea:focus,.fx-form select:focus{border-color:#FFB612;outline:none}
.fx-form .chk{display:flex;gap:10px;align-items:center;font-weight:600;margin:14px 0}.fx-form .chk input{width:24px;height:24px}
.fx-err{color:#b3261e;font-weight:700;min-height:1.2em;margin:8px 0}.fx-ok{color:#1b7a34;font-weight:700}
.fx-pw{position:relative}.fx-pw button{position:absolute;right:6px;top:6px;min-height:36px;border:0;background:none;font-weight:700;color:#555}
.fx-gd{display:block;background:#101010;color:#fff;border-radius:12px;padding:16px;text-decoration:none;margin-bottom:14px;border-left:8px solid #FFB612}
.fx-gd b{color:#FFB612;font-size:1.1rem}.fx-gd small{display:block;color:#ddd;margin-top:4px}
.fx-list{display:flex;flex-direction:column;gap:8px}
.fx-th{display:flex;gap:12px;align-items:center;background:#fff;border-radius:10px;padding:12px 14px;text-decoration:none;color:#1c1c1c;box-shadow:0 1px 3px #0001;min-height:60px}
.fx-th .m{flex:1;min-width:0}.fx-th b{display:block;overflow-wrap:anywhere}.fx-th small{color:#666}.fx-th .n{text-align:right;font-weight:800;min-width:48px}
.fx-th.pin{border-left:6px solid #FFB612}
.fx-chips{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px}.fx-chips button{min-height:38px;border-radius:19px;border:1px solid #bbb;background:#fff;padding:0 12px;font-weight:700}
.fx-chips button.on{background:#FFB612;border-color:#FFB612}
.fx-score{background:#101010;color:#fff;border-radius:12px;padding:14px 16px;margin-bottom:12px;position:sticky;top:64px;z-index:3}
.fx-score .row{display:flex;justify-content:space-around;align-items:center;font-size:1.5rem;font-weight:900}.fx-score .row span{color:#FFB612}
.fx-score small{display:block;text-align:center;color:#ccc;margin-top:4px}.fx-score a{color:#FFB612}
.fx-posts{display:flex;flex-direction:column;gap:10px;margin-bottom:120px}
.fx-post{background:#fff;border-radius:10px;padding:12px 14px;box-shadow:0 1px 3px #0001}.fx-post.hid{opacity:.55;border:2px dashed #b3261e}
.fx-post .who{display:flex;flex-wrap:wrap;gap:6px;align-items:baseline}.fx-post .who b{font-size:1rem}.fx-post .who small{color:#666}
.fx-flair{background:#FFB612;color:#101010;border-radius:6px;padding:1px 6px;font-size:.78rem;font-weight:800}.fx-role{background:#101010;color:#FFB612;border-radius:6px;padding:1px 6px;font-size:.72rem;font-weight:800}
.fx-post .tx{margin:6px 0 8px;white-space:pre-wrap;overflow-wrap:anywhere;font-size:1.02rem}
.fx-rx{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.fx-rx button{min-height:40px;min-width:48px;border-radius:20px;border:1px solid #ddd;background:#f6f6f4;font-size:1.05rem;padding:0 10px}
.fx-rx button.on{background:#fff3cf;border-color:#FFB612}.fx-rx .sp{flex:1}.fx-rx .lnk{background:none;border:0;min-width:0;font-size:.85rem;color:#555;text-decoration:underline}
.fx-reply{position:fixed;left:0;right:0;bottom:0;background:#fff;border-top:3px solid #FFB612;padding:10px;z-index:6;display:flex;gap:8px;align-items:flex-end;box-shadow:0 -2px 8px #0002}
.fx-reply textarea{flex:1;min-height:48px;max-height:160px;font-size:16px;padding:10px;border:2px solid #ccc;border-radius:10px;resize:vertical}
.fx-jump{position:fixed;right:14px;bottom:92px;z-index:7;min-height:46px;border-radius:23px;border:0;background:#101010;color:#FFB612;font-weight:900;padding:0 16px;box-shadow:0 2px 8px #0004}
.fx-grade{background:#fff;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 1px 3px #0001}
.fx-gi{display:grid;grid-template-columns:1fr 54px;gap:4px 10px;align-items:center;padding:10px 0;border-bottom:1px solid #eee}
.fx-gi .l b{display:block}.fx-gi .l small{color:#666}.fx-gi output{font-size:1.4rem;font-weight:900;text-align:center;color:#999}.fx-gi.set output{color:#101010}
.fx-gi input[type=range]{grid-column:1/3;width:100%;height:36px;accent-color:#FFB612}.fx-gi.done{opacity:.75}
.fx-sum{position:sticky;bottom:0;background:#fff;padding:10px;border-top:3px solid #FFB612;display:flex;gap:10px;align-items:center;justify-content:space-between;z-index:4}
.fx-cmp{width:100%;border-collapse:collapse}.fx-cmp th,.fx-cmp td{padding:8px 6px;border-bottom:1px solid #eee;text-align:center}.fx-cmp td:first-child,.fx-cmp th:first-child{text-align:left}
.fx-cmp .fan{font-weight:900}.fx-modal{position:fixed;inset:0;background:#0008;z-index:50;display:flex;align-items:flex-end;justify-content:center}
.fx-modal .in{background:#fff;border-radius:14px 14px 0 0;padding:18px;max-width:560px;width:100%}
.fx-modal .in .opts{display:flex;flex-direction:column;gap:8px;margin:10px 0}
#fp-play section[hidden]{display:none}
.fx-home{display:block;background:#101010;color:#fff;text-decoration:none;border-radius:10px;padding:14px 16px;margin:10px 0;border-left:8px solid #FFB612;font-weight:800}
.fx-home span{color:#FFB612}
@media(min-width:800px){.fx-reply{left:50%;transform:translateX(-50%);max-width:820px;border-radius:12px 12px 0 0}}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

// ---------- body text: escape, keep line breaks, link URLs ----------
const fmtBody=s=>E(s).replace(/https?:\/\/[^\s<]+[^\s<.,;:!?)"']/g,u=>`<a href="${u}" target="_blank" rel="noopener nofollow ugc">${u.replace(/^https?:\/\//,'').slice(0,60)}</a>`);
const roleTag=r=>r==='owner'?'<span class="fx-role">OWNER</span>':r==='mod'?'<span class="fx-role">MOD</span>':r==='bot'?'<span class="fx-role" title="Automated house account">BOT</span>':'';

// ---------- header buttons ----------
function head(){const a=document.querySelector('.forum-actions');const badge=document.querySelector('.forum-head .badge');
 if(S.api&&badge)badge.remove();if(!a)return;
 if(!S.api){a.innerHTML='';return;}
 a.innerHTML=S.me?`<a class="fx-btn ghost sm" href="#/forum/me">👤 ${E(S.me.display_name)}</a> <a class="fx-btn sm" href="#/forum/new">+ New thread</a>`
  :`<a class="fx-btn ghost sm" href="#/forum/signin">Sign in</a> <a class="fx-btn sm" href="#/forum/join">Join free</a>`;}
function tabs(on){return `<nav class="fx-tabs" aria-label="Forum sections">${[['discuss','Discussions','#/forum'],['gameday','🏈 Game Day','#/forum/gameday'],['pickem',"Pick 'Em",'#/forum/pickem'],['trivia','Trivia','#/forum/trivia']]
 .map(([k,l,h])=>`<a href="${h}" class="${on===k?'on':''}">${l}</a>`).join('')}${S.me&&(S.me.role==='mod'||S.me.role==='owner')?`<a href="#/forum/mod" class="${on==='mod'?'on':''}">🛡 Mod queue</a>`:''}</nav>`;}

// ---------- routing inside #/forum ----------
function sub(){const h=location.hash.replace(/^#\/?/,'');const [p,...rest]=h.split('?')[0].split('/');return p==='forum'?rest:null;}
function qs(k){const m=(location.hash.split('?')[1]||'').match(new RegExp('(?:^|&)'+k+'=([^&]*)'));return m?decodeURIComponent(m[1]):null;}
function stopPolls(){clearTimeout(S.poll);clearTimeout(S.livePoll);S.poll=S.livePoll=null;S.thread=null;document.querySelector('.fx-reply')?.remove();document.querySelector('.fx-jump')?.remove();}
async function render(){const el=$('forum-body');if(!el)return;const r=sub();if(!r)return;stopPolls();
 if(S.api===null)await probe();head();parkPlay();
 const [p,a]=r;
 if(p==='pickem'||p==='trivia')return playTab(el,p);
 if(!S.api){if(p==='gameday')return gamedayTab(el);return legacy(el,p,a);}
 if(p==='join'||p==='signin')return authForm(el,p);
 if(p==='me')return profile(el);
 if(p==='new')return newThread(el);
 if(p==='thread'&&a)return threadView(el,+a);
 if(p==='grade')return gradeView(el,a);
 if(p==='mod')return modView(el);
 if(p==='gameday')return gamedayTab(el);
 return listView(el);}
async function probe(){const d=await api('me');S.api=!!(d.ok&&d.configured!==false);S.me=S.api?d.user:null;document.documentElement.classList.toggle('fx-on',S.api);}

// ---------- Discussions ----------
async function listView(el){el.innerHTML=tabs('discuss')+'<p class="empty">Loading…</p>';
 if(qs('cat')==='Film Talk'){location.replace('#/forum?cat='+encodeURIComponent('General Steelers'));return;}   // old category name
 const cat=qs('cat');const d=await api('forum/threads'+(cat?'?cat='+encodeURIComponent(cat):''));if(!d.ok){el.innerHTML=tabs('discuss')+`<p class="fx-err">${E(d.error)}</p>`;return;}
 S.cats=d.cats;S.me=d.me;head();const T=d.threads;const pin=T.filter(t=>t.pinned&&(t.kind==='gameday'||t.kind==='postgame'));
 el.innerHTML=tabs('discuss')+`${pin.map(t=>`<a class="fx-gd" href="#/forum/thread/${t.id}"><b>${E(t.title)}</b><small>${t.kind==='gameday'?'Live chat · score updates on its own':'Post-game talk + Grade the Team'} · ${t.posts} posts · ${ago(t.last_post)}</small></a>`).join('')}
 <div class="fx-chips" role="group" aria-label="Filter by category"><button type="button" data-cat="" class="${!cat?'on':''}">All</button>${d.cats.map(c=>`<button type="button" data-cat="${E(c)}" class="${cat===c?'on':''}">${E(c)}</button>`).join('')}</div>
 <div class="fx-list">${T.filter(t=>!pin.includes(t)).map(t=>`<a class="fx-th${t.pinned?' pin':''}" href="#/forum/thread/${t.id}"><span class="m"><small>${t.pinned?'📌 ':''}${E(t.cat)}${t.hidden?' · HIDDEN':''}${t.locked?' · 🔒':''}</small><b>${E(t.title)}</b><small>by ${E(t.author)} ${t.author_role==='bot'?'(bot)':''} · ${ago(t.last_post)}</small></span><span class="n">${t.posts}<br><small>posts</small></span></a>`).join('')||'<p class="fine">No threads yet. Start the first one!</p>'}</div>
 <p class="fine" style="margin-top:14px"><a href="legal/community.html">Community guidelines</a> · Be respectful, no spam, 13+ only.</p>`;
 el.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{location.hash='#/forum'+(b.dataset.cat?'?cat='+encodeURIComponent(b.dataset.cat):'');});}

// ---------- sign up / sign in (one screen each) ----------
async function flairs(){if(S.flairs)return S.flairs;try{const d=await getJ('data/depth.json');const n=new Set();(d.units||[]).forEach(u=>u.rows.forEach(r=>r.players.forEach(p=>n.add(p.name))));S.flairs=[...n].sort();}catch(e){S.flairs=[];}return S.flairs;}
async function authForm(el,mode){const nxt=qs('next')||sessionStorage.getItem('bgd_next')||'';if(qs('next'))sessionStorage.setItem('bgd_next',qs('next'));
 if(S.me){goNext();return;}
 const fl=mode==='join'?await flairs():[];
 el.innerHTML=`<p><a class="back" href="#/forum">← Forum</a></p>${nxt==='mock'?'<p class="box">Sign in or join to post your mock draft. You\'ll come right back to finish posting.</p>':nxt.startsWith('grade')?'<p class="box">Sign in or join to grade the team.</p>':''}
 <form class="fx-form" id="fx-auth" novalidate>${mode==='join'?`<h2>Join Black &amp; Gold Dispatch</h2><p class="fine">Free. Takes 30 seconds. You stay signed in on this device.</p>
  <label for="f-u">Username <small>3-20 letters, numbers or _</small></label><input id="f-u" name="username" type="text" autocomplete="username" autocapitalize="off" required maxlength="20">
  <label for="f-e">Email <small>never shown publicly</small></label><input id="f-e" name="email" type="email" autocomplete="email" required>
  <label for="f-p">Password <small>8+ characters</small></label><div class="fx-pw"><input id="f-p" name="password" type="password" autocomplete="new-password" required minlength="8"><button type="button" class="pw-t">Show</button></div>
  <label for="f-d">Display name <small>optional</small></label><input id="f-d" name="display_name" type="text" maxlength="30" placeholder="Shown on your posts">
  <label for="f-f">Favorite player <small>optional flair</small></label><input id="f-f" name="flair" type="text" list="f-fl" maxlength="40" placeholder="e.g. T.J. Watt"><datalist id="f-fl">${fl.map(n=>`<option value="${E(n)}">`).join('')}</datalist>
  <label class="chk"><input type="checkbox" name="age13" id="f-a"> I'm 13 or older and agree to the <a href="legal/community.html" target="_blank">community guidelines</a> and <a href="legal/terms.html" target="_blank">terms</a>.</label>`
 :`<h2>Sign in</h2><label for="f-l">Username or email</label><input id="f-l" name="login" type="text" autocomplete="username" autocapitalize="off" required>
  <label for="f-p">Password</label><div class="fx-pw"><input id="f-p" name="password" type="password" autocomplete="current-password" required><button type="button" class="pw-t">Show</button></div>`}
  <p class="fx-err" role="alert"></p><button class="fx-btn" type="submit" style="width:100%">${mode==='join'?'Create account':'Sign in'}</button>
  <p class="fine" style="text-align:center;margin-top:12px">${mode==='join'?'Already have an account? <a href="#/forum/signin">Sign in</a>':'New here? <a href="#/forum/join">Join free</a><br>Forgot your password? Email reset is coming soon; for now, ask a moderator in the forum.'}</p></form>`;
 const f=$('fx-auth');f.querySelector('.pw-t').onclick=e=>{const i=$('f-p');i.type=i.type==='password'?'text':'password';e.target.textContent=i.type==='password'?'Show':'Hide';};
 f.onsubmit=async e=>{e.preventDefault();const b=f.querySelector('button[type=submit]');const er=f.querySelector('.fx-err');er.textContent='';b.disabled=true;
  const fd=Object.fromEntries(new FormData(f));if(mode==='join')fd.age13=$('f-a').checked;
  const d=await api(mode==='join'?'auth/signup':'auth/login',{body:fd});b.disabled=false;
  if(!d.ok){er.textContent=d.error||'Something went wrong.';if(d.field){const i=f.querySelector(`[name=${d.field}]`);i&&i.focus();}return;}
  S.me=d.user;head();goNext();};}
function goNext(){const n=sessionStorage.getItem('bgd_next')||'';sessionStorage.removeItem('bgd_next');
 location.hash=n==='mock'?'#/forum/new?mock=1':n.startsWith('grade')?'#/forum/'+n.replace(':','/'):n.startsWith('thread')?'#/forum/'+n.replace(':','/'):n==='pickem'||n==='trivia'?'#/forum/'+n:'#/forum';}
function needSignIn(next){sessionStorage.setItem('bgd_next',next);location.hash='#/forum/join';}

async function profile(el){if(!S.me){location.hash='#/forum/signin';return;}const fl=await flairs();
 el.innerHTML=`<p><a class="back" href="#/forum">← Forum</a></p><form class="fx-form" id="fx-prof"><h2>Your profile</h2><p class="fine">Signed in as <b>${E(S.me.username)}</b>${S.me.role!=='user'?' · '+roleTag(S.me.role):''}</p>
 <label for="p-d">Display name</label><input id="p-d" name="display_name" type="text" maxlength="30" value="${E(S.me.display_name)}">
 <label for="p-f">Favorite player flair</label><input id="p-f" name="flair" type="text" list="p-fl" maxlength="40" value="${E(S.me.flair)}"><datalist id="p-fl">${fl.map(n=>`<option value="${E(n)}">`).join('')}</datalist>
 <p class="fx-err" role="status"></p><button class="fx-btn" type="submit">Save</button> <button class="fx-btn ghost" type="button" id="p-out">Sign out</button>
 <p class="fine" style="margin-top:12px">Email verification and password reset by email are coming soon.</p></form>`;
 $('fx-prof').onsubmit=async e=>{e.preventDefault();const d=await api('me',{body:Object.fromEntries(new FormData(e.target))});const m=e.target.querySelector('.fx-err');
  if(d.ok){S.me=d.user;head();m.className='fx-ok';m.textContent='Saved.';}else{m.className='fx-err';m.textContent=d.error;}};
 $('p-out').onclick=async()=>{await api('auth/logout',{body:{}});S.me=null;head();location.hash='#/forum';};}

// ---------- new thread (also used for Fan Mock Drafts) ----------
function mockText(m){const L=[];m.teams.forEach(t=>{L.push(`${t.name}${t.grade?' (Draft Desk grade: '+t.grade+')':''}`);if(t.needs&&t.needs.length)L.push('Team needs: '+t.needs.join(', '));
  const by={};t.picks.forEach(p=>(by[p.round]=by[p.round]||[]).push(p));Object.keys(by).sort((a,b)=>a-b).forEach(r=>{L.push(`Round ${r}:`);by[r].forEach(p=>L.push(`  #${p.overall} ${p.name}, ${p.pos}, ${p.school}${p.grade?' · grade '+p.grade:''}`));});L.push('');});
 return L.join('\n').trim();}
async function newThread(el){if(!S.me){needSignIn(qs('mock')?'mock':'new');return;}
 let mock=null;if(qs('mock')){try{mock=JSON.parse(sessionStorage.getItem('bgd_mock')||'null');}catch(e){}}
 const cats=(S.cats.length?S.cats:['Depth Chart & Roster','Draft','Fan Mock Drafts','General Steelers','Off-Topic']).filter(c=>c!=='Game Day'||S.me.role!=='user');
 const pit=mock&&(mock.teams.find(t=>t.team==='PIT')||mock.teams[0]);
 el.innerHTML=`<p><a class="back" href="#/forum">← Forum</a></p><form class="fx-form" id="fx-new"><h2>${mock?'Post your mock draft':'Start a thread'}</h2>
 ${mock?`<input type="hidden" name="cat" value="Fan Mock Drafts"><p class="fine">Category: <b>Fan Mock Drafts</b></p>`:`<label for="n-c">Category</label><select id="n-c" name="cat">${cats.map(c=>`<option ${c==='Off-Topic'?'selected':''}>${E(c)}</option>`).join('')}</select>`}
 <label for="n-t">Title</label><input id="n-t" name="title" type="text" maxlength="120" required value="${mock?E(`${S.me.display_name}'s ${mock.rounds}-round mock${pit&&pit.grade?' (Draft Desk grade: '+pit.grade+')':''}`):''}">
 ${mock?`<label>Your picks</label><pre class="box" style="white-space:pre-wrap;font-size:.9rem;max-height:320px;overflow:auto">${E(mockText(mock))}</pre><label for="n-b">Add a comment <small>optional</small></label>`:'<label for="n-b">Post</label>'}
 <textarea id="n-b" name="body" rows="${mock?3:7}" maxlength="4000" ${mock?'':'required'} placeholder="${mock?'Why you made these picks…':'What\'s on your mind?'}"></textarea>
 <p class="fx-err" role="alert"></p><button class="fx-btn" type="submit" style="width:100%">${mock?'Post to Forum':'Post thread'}</button></form>`;
 $('fx-new').onsubmit=async e=>{e.preventDefault();const f=e.target,b=f.querySelector('button[type=submit]'),er=f.querySelector('.fx-err');b.disabled=true;
  const fd=Object.fromEntries(new FormData(f));if(mock){fd.kind='mock';fd.mock=mock;fd.body=(fd.body?fd.body.trim()+'\n\n':'')+mockText(mock);}
  const d=await api('forum/threads',{body:fd});b.disabled=false;if(!d.ok){er.textContent=d.error;return;}
  if(mock)sessionStorage.removeItem('bgd_mock');location.hash='#/forum/thread/'+d.id;};}

// ---------- thread view with live polling ----------
function postHTML(p,T){const mine=new Set((T.mine||[]).filter(x=>x.post_id===p.id).map(x=>x.emoji));const c={};(T.reactions||[]).filter(x=>x.post_id===p.id).forEach(x=>c[x.emoji]=x.n);
 const mod=S.me&&(S.me.role==='mod'||S.me.role==='owner');
 return `<article class="fx-post${p.hidden?' hid':''}" id="p${p.id}" data-id="${p.id}"><div class="who"><b>${E(p.name)}</b>${roleTag(p.role)}${p.flair?`<span class="fx-flair">${E(p.flair)}</span>`:''}<small>${ago(p.created)}${p.hidden?' · hidden':''}</small></div>
 <div class="tx">${fmtBody(p.body)}</div><div class="fx-rx">${S.emoji.map(em=>`<button type="button" class="rx${mine.has(em)?' on':''}" data-e="${em}" aria-label="React ${em}" aria-pressed="${mine.has(em)}">${em}<small>${c[em]?' '+c[em]:''}</small></button>`).join('')}
 <span class="sp"></span>${p.role!=='bot'?`<button type="button" class="lnk rep">⚑ Report</button>`:''}${mod?` <button type="button" class="lnk mod" data-a="${p.hidden?'unhide':'hide'}">${p.hidden?'Unhide':'Hide'}</button> <button type="button" class="lnk mod" data-a="delete">Delete</button>${p.role==='user'?` <button type="button" class="lnk ban" data-u="${E(p.username)}">Ban</button>`:''}`:''}</div></article>`;}
async function threadView(el,id){el.innerHTML='<p class="empty">Loading thread…</p>';const d=await api('forum/thread/'+id);
 if(!d.ok){el.innerHTML=`<p><a class="back" href="#/forum">← Forum</a></p><p class="fx-err">${E(d.error)}</p>`;return;}
 S.me=d.me;head();if(d.emoji)S.emoji=d.emoji;const T=S.thread={id,th:d.thread,posts:d.posts,reactions:d.reactions,mine:d.mine};S.last=d.posts.length?d.posts[d.posts.length-1].id:0;
 const th=d.thread,mod=S.me&&(S.me.role==='mod'||S.me.role==='owner');
 el.innerHTML=`<p><a class="back" href="#/forum">← Forum</a></p>${th.game?'<div class="fx-score" id="fx-score"><small>Loading score…</small></div>':''}
 <h2 style="margin:6px 0">${E(th.title)}</h2><p class="fine">${E(th.cat)} · started ${ago(th.created)}${th.locked?' · 🔒 locked':''}${th.hidden?' · HIDDEN':''}</p>
 ${th.grade?`<a class="fx-gd" href="#/forum/grade/${E(th.game_id)}"><b>🗳 Grade the Team</b><small>Grade every player who played, plus the coaches. Open for 7 days after the game.</small></a>`:''}
 ${mod?`<p class="fx-rx"><button type="button" class="fx-btn ghost sm tmod" data-a="${th.pinned?'unpin':'pin'}">${th.pinned?'Unpin':'Pin'}</button> <button type="button" class="fx-btn ghost sm tmod" data-a="${th.locked?'unlock':'lock'}">${th.locked?'Unlock':'Lock'}</button> <button type="button" class="fx-btn ghost sm tmod" data-a="${th.hidden?'unhide':'hide'}">${th.hidden?'Unhide thread':'Hide thread'}</button></p>`:''}
 <div class="fx-posts" id="fx-posts">${T.posts.map(p=>postHTML(p,T)).join('')}</div>`;
 const bar=document.createElement('div');bar.className='fx-reply';
 const lift=()=>{if(!bar.isConnected)return clearInterval(bar._t);const cb=$('cookie-banner');const r=cb&&!cb.hidden&&getComputedStyle(cb).display!=='none'?cb.getBoundingClientRect():null;const h=r&&r.height?Math.max(0,Math.round(innerHeight-r.top)):0;bar.style.bottom=h+'px';};bar._t=setInterval(lift,800);setTimeout(lift,0);   // sit above the cookie banner until it's dismissed
 bar.innerHTML=S.me?(th.locked&&!mod?'<p class="fine" style="margin:0;flex:1;text-align:center">This thread is locked.</p>':`<label class="sr" for="fx-ta">Reply</label><textarea id="fx-ta" rows="1" maxlength="2000" placeholder="Write a reply…"></textarea><button class="fx-btn" type="button" id="fx-send">Post</button>`)
  :`<a class="fx-btn" style="flex:1" href="#/forum/join" onclick="sessionStorage.setItem('bgd_next','thread:${id}')">Join free to post</a><a class="fx-btn ghost" href="#/forum/signin" onclick="sessionStorage.setItem('bgd_next','thread:${id}')">Sign in</a>`;
 document.body.appendChild(bar);
 const jump=document.createElement('button');jump.type='button';jump.className='fx-jump';jump.textContent='↓ Jump to latest';jump.hidden=true;document.body.appendChild(jump);
 jump.onclick=()=>{const l=$('fx-posts').lastElementChild;l&&l.scrollIntoView({behavior:'smooth',block:'end'});jump.hidden=true;jump.textContent='↓ Jump to latest';};
 const nearBottom=()=>innerHeight+scrollY>document.documentElement.scrollHeight-260;
 S.onScroll=()=>{if(!S.thread)return;jump.hidden=nearBottom();};removeEventListener('scroll',S.onScrollBound||(()=>{}));S.onScrollBound=S.onScroll;addEventListener('scroll',S.onScroll,{passive:true});
 setTimeout(()=>{jump.hidden=nearBottom();if(th.kind==='gameday'&&!location.hash.includes('top')){const l=$('fx-posts').lastElementChild;l&&l.scrollIntoView({block:'end'});}},50);
 const send=$('fx-send');if(send){const ta=$('fx-ta');ta.oninput=()=>{ta.style.height='auto';ta.style.height=Math.min(160,ta.scrollHeight)+'px';};
  send.onclick=async()=>{const v=ta.value.trim();if(!v)return;send.disabled=true;const r=await api(`forum/thread/${id}/posts`,{body:{body:v}});send.disabled=false;
   if(!r.ok){toast(r.error);return;}ta.value='';ta.style.height='';await pull(true);};}
 if(th.game)liveScore(th.game,th.kind);
 S.poll=setTimeout(tick,10000);}
async function tick(){if(!S.thread)return;if(document.visibilityState==='visible')await pull(false);if(S.thread)S.poll=setTimeout(tick,10000);}
async function pull(mineJustPosted){const T=S.thread;if(!T)return;const was=innerHeight+scrollY>document.documentElement.scrollHeight-260;
 const d=await api(`forum/thread/${T.id}?after=${S.last}`);if(!d.ok||!S.thread||S.thread.id!==T.id)return;
 T.reactions=d.reactions;T.mine=d.mine;const box=$('fx-posts');if(!box)return;
 (d.hidden_ids||[]).forEach(i=>{const n=$('p'+i);n&&n.remove();});
 d.posts.forEach(p=>{if($('p'+p.id))return;box.insertAdjacentHTML('beforeend',postHTML(p,T));S.last=Math.max(S.last,p.id);});
 box.querySelectorAll('.fx-post').forEach(a=>{const id=+a.dataset.id;const c={};T.reactions.filter(x=>x.post_id===id).forEach(x=>c[x.emoji]=x.n);const mine=new Set(T.mine.filter(x=>x.post_id===id).map(x=>x.emoji));
  a.querySelectorAll('.rx').forEach(b=>{const em=b.dataset.e;b.classList.toggle('on',mine.has(em));b.querySelector('small').textContent=c[em]?' '+c[em]:'';});});
 if(d.posts.length){if(was||mineJustPosted){const l=box.lastElementChild;l&&l.scrollIntoView({behavior:'smooth',block:'end'});}else{const j=document.querySelector('.fx-jump');if(j){j.hidden=false;j.textContent=`↓ ${d.posts.length} new · Jump to latest`;}}}}
function toast(m){const t=document.createElement('div');t.className='fx-modal';t.innerHTML=`<div class="in" role="alertdialog"><p><b>${E(m)}</b></p><button class="fx-btn" type="button" style="width:100%">OK</button></div>`;document.body.appendChild(t);t.querySelector('button').onclick=()=>t.remove();t.onclick=e=>{if(e.target===t)t.remove();};}
// live score at the top of game threads (our box score + live data; refreshed every 30s while the game is on)
async function liveScore(g,kind){const el=$('fx-score');if(!el)return;let live=null,box=null,sched=null;
 try{[live,sched]=await Promise.all([getJ('data/live.json').catch(()=>null),getJ('data/schedule.json').catch(()=>null)]);}catch(e){}
 const sg=sched&&sched.games.find(x=>(x.nflverse_id||x.id)===(g.nflverse_id||g.id))||g;
 const onNow=live&&String(live.event_id)===String(sg.id)&&live.teams;
 if(sg.completed){try{box=await getJ(`data/boxscores/${sg.nflverse_id}.json`);}catch(e){}}
 const opp=sg.opp_abbr||'OPP';let html;
 if(onNow&&live.state!=='pre'){const t=live.teams;html=`<div class="row">${t.map(x=>`<div>${E(x.abbr)} <span>${E(x.score)}</span></div>`).join('<div>–</div>')}</div><small>${E(live.detail||'')}${live.situation&&live.situation.downDistanceText?' · '+E(live.situation.downDistanceText):''} · updates automatically</small>`;}
 else if(sg.completed){const ps=sg.pit_score,os=sg.opp_score;html=`<div class="row"><div>PIT <span>${E(ps)}</span></div><div>–</div><div>${E(opp)} <span>${E(os)}</span></div></div><small>Final${box&&box.quarters?' · by quarter: '+E(JSON.stringify(box.quarters).replace(/[{}"[\]]/g,' ').replace(/\s+/g,' ').slice(0,80)):''} · <a href="#/boxscore/${E(sg.nflverse_id)}">Full box score →</a></small>`;}
 else html=`<div class="row"><div>PIT</div><div style="font-size:1rem">${sg.home?'vs':'at'}</div><div>${E(opp)}</div></div><small>Kickoff ${E(etTime(sg.date))}${sg.venue?' · '+E(sg.venue):''}</small>`;
 el.innerHTML=html;
 if(!sg.completed&&S.thread)S.livePoll=setTimeout(()=>liveScore(g,kind),30000);}

// reactions / report / moderation clicks
document.addEventListener('click',async e=>{const b=e.target.closest('.fx-post button, .tmod');if(!b)return;const post=b.closest('.fx-post');const pid=post&&+post.dataset.id;
 if(b.classList.contains('rx')){if(!S.me){sessionStorage.setItem('bgd_next','thread:'+S.thread.id);location.hash='#/forum/join';return;}
  const d=await api('forum/react',{body:{post_id:pid,emoji:b.dataset.e}});if(!d.ok){toast(d.error);return;}b.classList.toggle('on',d.on);b.querySelector('small').textContent=d.count?' '+d.count:'';
  const T=S.thread;if(T){T.mine=T.mine.filter(x=>!(x.post_id===pid&&x.emoji===b.dataset.e));if(d.on)T.mine.push({post_id:pid,emoji:b.dataset.e});T.reactions=T.reactions.filter(x=>!(x.post_id===pid&&x.emoji===b.dataset.e));if(d.count)T.reactions.push({post_id:pid,emoji:b.dataset.e,n:d.count});}return;}
 if(b.classList.contains('rep')){if(!S.me){sessionStorage.setItem('bgd_next','thread:'+S.thread.id);location.hash='#/forum/signin';return;}
  const m=document.createElement('div');m.className='fx-modal';m.innerHTML=`<div class="in" role="dialog" aria-label="Report post"><h3>Report this post</h3><div class="opts">${['Spam or ads','Harassment or hate','Off-topic or trolling','Copied article or photo','Something else'].map(r=>`<button class="fx-btn ghost" type="button" data-r="${r}">${r}</button>`).join('')}</div><button class="fx-btn dark" type="button" data-x style="width:100%">Cancel</button></div>`;
  document.body.appendChild(m);m.onclick=async ev=>{const o=ev.target.closest('[data-r]');if(ev.target===m||ev.target.closest('[data-x]')){m.remove();return;}if(!o)return;const d=await api('forum/report',{body:{post_id:pid,reason:o.dataset.r}});m.remove();toast(d.ok?'Thanks. A moderator will take a look.':d.error);};return;}
 if(b.classList.contains('mod')){if(b.dataset.a==='delete'&&!confirm('Delete this post for good?'))return;const d=await api('mod/post',{body:{post_id:pid,action:b.dataset.a}});if(!d.ok){toast(d.error);return;}
  if(b.dataset.a==='delete')post.remove();else{post.classList.toggle('hid',b.dataset.a==='hide');b.dataset.a=b.dataset.a==='hide'?'unhide':'hide';b.textContent=b.dataset.a==='hide'?'Hide':'Unhide';}return;}
 if(b.classList.contains('ban')){const days=prompt(`Ban ${b.dataset.u} for how many days? (0 = lift a ban)`,'7');if(days===null)return;const d=await api('mod/ban',{body:{username:b.dataset.u,days:+days,reason:'Moderator action'}});toast(d.ok?(d.banned_until?'Banned until '+new Date(d.banned_until).toLocaleDateString():'Ban lifted.'):d.error);return;}
 if(b.classList.contains('tmod')){const d=await api('mod/thread',{body:{thread_id:S.thread.id,action:b.dataset.a}});if(!d.ok){toast(d.error);return;}render();}});

// ---------- Grade the Team ----------
async function gradeView(el,gid){el.innerHTML='<p class="empty">Loading ballot…</p>';const d=await api('grades/ballot'+(gid?'?game='+encodeURIComponent(gid):''));
 if(!d.ok){el.innerHTML=`<p class="fx-err">${E(d.error)}</p>`;return;}if(!d.ballot){el.innerHTML=tabs('gameday')+'<p class="box">No game to grade yet. Grading opens at the final whistle.</p>';return;}
 S.me=d.me;const b=d.ballot,mine={};d.mine.forEach(x=>mine[x.item]=x.grade);const av=d.averages.items;
 const groups=['Team','Offense','Defense'];const done=Object.keys(mine).length;
 el.innerHTML=`<p><a class="back" href="#/forum/gameday">← Game Day</a></p><div class="fx-grade"><h2 style="margin:0">🗳 Grade the Team</h2><p style="margin:4px 0"><b>${E(b.label)}</b></p>
 <p class="fine">${b.open?`Open until ${E(etTime(b.closes))}`:b.final_at?'Grading has closed for this game.':'Grading opens at the final whistle.'} · ${d.averages.voters} fan${d.averages.voters===1?'':'s'} have graded so far. Slide 1 (awful) to 10 (elite). Only the sliders you move are counted, and each grade can be cast once.</p>
 ${!b.players_ready?'<p class="box">Player grades appear here once the game\'s stats post (usually by the next morning). You can grade the team and coaches now and come back for the players.</p>':''}
 ${!S.me&&b.open?`<a class="fx-btn" href="#/forum/join" onclick="sessionStorage.setItem('bgd_next','grade:${E(b.game_id)}')" style="width:100%">Join free to vote</a>`:''}</div>
 <form id="fx-ballot">${groups.map(g=>{const it=b.items.filter(i=>i.group===g);if(!it.length)return'';return`<div class="fx-grade"><h3 style="margin:0 0 4px">${g}</h3>${it.map(i=>{const v=mine[i.key];const a=av[i.key];
  return`<div class="fx-gi${v?' done set':''}" data-k="${E(i.key)}"><span class="l"><b>${E(i.label)}</b><small>${i.pos?E(i.pos)+' · ':''}${i.ours!=null?'Our grade '+Number(i.ours).toFixed(1)+' · ':''}${a?`Fans ${a.avg.toFixed(1)} (${a.n})`:'No fan grades yet'}${v?' · your grade '+v:''}</small></span><output>${v||'–'}</output>
  <input type="range" min="1" max="10" step="1" value="${v||6}" aria-label="Grade ${E(i.label)} from 1 to 10" ${v||!b.open||!S.me?'disabled':''}></div>`;}).join('')}</div>`;}).join('')}
 ${b.open&&S.me?`<div class="fx-sum"><span id="fx-cnt">${done?done+' already graded':'Move a slider to grade'}</span><button class="fx-btn" type="submit" id="fx-sub" disabled>Submit grades</button></div>`:''}</form>`;
 const f=$('fx-ballot');const touched={};const upd=()=>{const n=Object.keys(touched).length;const s=$('fx-sub');if(s){s.disabled=!n;s.textContent=n?`Submit ${n} grade${n>1?'s':''}`:'Submit grades';}};
 f.querySelectorAll('input[type=range]').forEach(r=>{const row=r.closest('.fx-gi');r.addEventListener('input',()=>{touched[row.dataset.k]=+r.value;row.classList.add('set');row.querySelector('output').textContent=r.value;upd();});});
 f.onsubmit=async e=>{e.preventDefault();const s=$('fx-sub');s.disabled=true;const r=await api('grades/vote',{body:{game_id:b.game_id,grades:touched}});
  if(!r.ok){toast(r.error);s.disabled=false;return;}toast(`Thanks! ${r.saved} grade${r.saved===1?'':'s'} counted.${r.skipped?' '+r.skipped+' were already graded.':''}`);gradeView(el,b.game_id);};}

// ---------- Game Day tab ----------
async function gamedayTab(el){el.innerHTML=tabs('gameday')+'<p class="empty">Loading…</p>';let sched=null;try{sched=await getJ('data/schedule.json');}catch(e){}
 const g=S.api?(await api('forum/gameday')).game:null;const nx=sched&&sched.next;
 let h=tabs('gameday');
 if(g){h+=`${g.gameday_thread?`<a class="fx-gd" href="#/forum/thread/${g.gameday_thread}"><b>🏈 Game Day Thread: ${E(g.label)}</b><small>${g.final?'Game over · read the live chat':'Live chat · score at the top updates on its own'}</small></a>`:''}
  ${g.postgame_thread?`<a class="fx-gd" href="#/forum/thread/${g.postgame_thread}"><b>📊 Post-Game Thread</b><small>Takeaways and reactions</small></a>`:''}
  ${g.grading_open?`<a class="fx-gd" href="#/forum/grade/${E(g.game_id)}"><b>🗳 Grade the Team</b><small>Open for 7 days after the final whistle</small></a>`:''}`;}
 if(nx)h+=`<div class="box"><h3 style="margin-top:0">Next game</h3><p><b>Steelers ${nx.home?'vs':'at'} ${E(nx.opponent)}</b><br>${E(nx.week)} · ${E(etTime(nx.date))}${nx.venue?' · '+E(nx.venue):''}</p>
  <p class="fine">${S.api?'The game-day thread opens on its own the day before kickoff and gets pinned to the top of the forum. The post-game thread and Grade the Team poll open at the final whistle.':'Game-day threads open here when fan accounts go live.'}</p><p><a class="fx-btn ghost sm" href="#/opponent">Opponent preview →</a></p></div>`;
 el.innerHTML=h;}

// ---------- Moderator queue ----------
async function modView(el){el.innerHTML=tabs('mod')+'<p class="empty">Loading reports…</p>';const d=await api('mod/reports');if(!d.ok){el.innerHTML=tabs('mod')+`<p class="fx-err">${E(d.error)}</p>`;return;}
 el.innerHTML=tabs('mod')+`<h2 class="section-title">Reported posts</h2>${d.reports.length?d.reports.map(r=>`<div class="fx-post${r.hidden?' hid':''}" data-id="${r.post_id}"><div class="who"><b>${E(r.author)}</b><small>in <a href="#/forum/thread/${r.thread_id}">${E(r.title)}</a> · ${r.reports} report${r.reports>1?'s':''}: ${E(r.reasons||'')}</small></div><div class="tx">${fmtBody(r.body)}</div>
 <div class="fx-rx"><button type="button" class="fx-btn sm qm" data-a="${r.hidden?'unhide':'hide'}">${r.hidden?'Unhide':'Hide'}</button><button type="button" class="fx-btn ghost sm qm" data-a="delete">Delete</button><button type="button" class="fx-btn ghost sm qm" data-a="dismiss">Dismiss</button><button type="button" class="fx-btn dark sm qb" data-u="${E(r.author)}">Ban user</button></div></div>`).join(''):'<p class="box">No open reports. 👍</p>'}
 ${S.me.role==='owner'?`<form class="fx-form" id="fx-role" style="margin-top:16px"><h3>Moderators</h3><label for="r-u">Username</label><input id="r-u" name="username" type="text"><p><button class="fx-btn sm" name="role" value="mod">Make moderator</button> <button class="fx-btn ghost sm" name="role" value="user">Remove moderator</button></p><p class="fx-err"></p></form>`:''}`;
 el.querySelectorAll('.qm').forEach(b=>b.onclick=async()=>{const d=await api('mod/post',{body:{post_id:+b.closest('.fx-post').dataset.id,action:b.dataset.a}});if(!d.ok)toast(d.error);modView(el);});
 el.querySelectorAll('.qb').forEach(b=>b.onclick=async()=>{const days=prompt(`Ban ${b.dataset.u} for how many days?`,'7');if(days===null)return;const d=await api('mod/ban',{body:{username:b.dataset.u,days:+days,reason:'Reported posts'}});toast(d.ok?'Done.':d.error);});
 const rf=$('fx-role');if(rf)rf.onsubmit=async e=>{e.preventDefault();const role=e.submitter&&e.submitter.value;const d=await api('mod/role',{body:{username:$('r-u').value,role}});rf.querySelector('.fx-err').textContent=d.ok?'Saved.':d.error;};}

// ---------- Pick 'Em + Trivia (the existing game, moved into the Forum) ----------
function parkPlay(){const pb=$('play-body');if(!pb)return;let host=$('fp-play');if(!host){host=document.createElement('div');host.id='fp-play';host.hidden=true;$('forum-body').after(host);}
 if(pb.parentElement!==host)host.prepend(pb);host.hidden=true;if(!pb.dataset.fx){pb.dataset.fx='1';new MutationObserver(tagPlay).observe(pb,{childList:true});}}
function tagPlay(){const host=$('fp-play');if(!host)return;const tab=host.dataset.tab;host.querySelectorAll('#play-body section').forEach(s=>{const h=(s.querySelector('h2')||{}).textContent||'';s.hidden=tab==='trivia'?!/trivia/i.test(h):/trivia/i.test(h);});const ps=host.querySelector('#play-body > p.page-sub');if(ps&&S.api)ps.hidden=true;
 host.querySelectorAll('#play-body h2.section-title').forEach(h=>{if(/leaderboard/i.test(h.textContent)){h.hidden=!!S.api;const n=h.nextElementSibling;if(n)n.hidden=!!S.api;}});}
async function playTab(el,tab){el.innerHTML=tabs(tab);const host=$('fp-play');host.dataset.tab=tab;host.hidden=false;tagPlay();
 let lb=$('fp-lb');if(!lb){lb=document.createElement('div');lb.id='fp-lb';host.appendChild(lb);}
 if(!S.api){lb.innerHTML='';return;}
 lb.innerHTML=`${S.me?`<p class="fine">Signed in as <b>${E(S.me.display_name)}</b>: your ${tab==='trivia'?'answers':'saved picks'} count on the fan leaderboard.</p>`:`<p class="box">Want to be on the leaderboard? <a class="fx-btn sm" href="#/forum/join" onclick="sessionStorage.setItem('bgd_next','${tab}')">Join free</a> Your picks and answers still save on this device either way.</p>`}
 <h2 class="section-title">Fan leaderboard</h2><div class="box" id="fp-lbb"><p class="fine">Loading…</p></div>`;
 const d=await api('play/leaderboard');const b=$('fp-lbb');if(!b)return;
 b.innerHTML=d.ok&&d.leaders.length?`<table class="fx-cmp"><thead><tr><th>#</th><th>Fan</th><th>Pick 'Em</th><th>Trivia</th></tr></thead><tbody>${d.leaders.map((r,i)=>`<tr><td>${i+1}</td><td><b>${E(r.name)}</b>${r.flair?` <span class="fx-flair">${E(r.flair)}</span>`:''}</td><td>${r.pick_wins}/${r.pick_games}</td><td>${r.trivia_right}/${r.trivia_played}</td></tr>`).join('')}</tbody></table><p class="fine">Pick 'Em: correct picks / graded games. Trivia: right answers / days played. Only real accounts are listed.</p>`
  :'<p class="fine">No scores yet. Signed-in fans show up here after their first saved picks or trivia answer.</p>';}
// sync on-device picks/answers to the fan account (the on-device game itself is unchanged)
let PK=null;getJ('data/pickem.json').then(d=>PK=d).catch(()=>{});
document.addEventListener('click',e=>{if(!S.api||!S.me)return;const t=e.target.closest('#play-body .topt');if(t&&!t.disabled){api('play/trivia',{body:{answer:t.dataset.a}});return;}
 const s=e.target.closest('#play-body .pk-submit');if(s&&!s.disabled&&PK)setTimeout(()=>{try{const p=JSON.parse(localStorage.getItem('sd_picks_'+PK.season+'_w'+PK.week)||'{}');api('play/picks',{body:{picks:p}});}catch(err){}},50);},true);

// ---------- read-only fallback (before accounts are switched on) ----------
async function legacy(el){el.innerHTML=tabs('discuss')+'<p class="empty">Loading…</p>';if(!S.bot){try{S.bot=await getJ('data/forum_bot.json');}catch(e){S.bot={topics:[]};}}
 const T=[...S.bot.topics].sort((a,b)=>(b.pinned-a.pinned)||b.created.localeCompare(a.created));const id=(sub()||[])[1];const t=id&&T.find(x=>x.id===id);
 if(t){el.innerHTML=tabs('discuss')+`<p><a class="back" href="#/forum">← Forum</a></p><article class="fx-post"><div class="who"><b>${E(t.author)}</b>${roleTag('bot')}<small>${ago(t.created)}</small></div><h2>${E(t.title)}</h2><div class="tx">${E(t.body)}</div>
  ${(t.links||[]).map(l=>`<a class="fx-btn ghost sm" href="${E(l.href)}" ${l.external?'target="_blank" rel="noopener"':''}>${E(l.label)}</a>`).join(' ')}</article><p class="box">Replies open when fan accounts launch (very soon).</p>`;return;}
 const CL=[['Game Day','Game threads and post-game talk'],['Depth Chart & Roster','Roster moves and injuries'],['Draft','Prospects and big boards'],['Fan Mock Drafts','Your mock drafts'],['General Steelers','Anything Steelers'],['Off-Topic','Pittsburgh life, other sports']];
 el.innerHTML=tabs('discuss')+`<p class="box">Fan accounts are almost ready. Until then, here are today's topics from our labeled house bot.</p><p class="fine"><b>Categories:</b> ${CL.map(([n,d])=>`${E(n)} <small>(${E(d)})</small>`).join(' · ')}</p><div class="fx-list">${T.map(t=>`<a class="fx-th${t.pinned?' pin':''}" href="#/forum/thread/${E(t.id)}"><span class="m"><small>${E(t.kind)} · ${E(t.cat)}</small><b>${E(t.title)}</b><small>by ${E(t.author)} (bot) · ${ago(t.created)}</small></span></a>`).join('')}</div>
 <p class="fine" style="margin-top:14px"><a href="legal/community.html">Community guidelines</a></p>`;}

// ---------- fan averages next to our grades (heat map + box score pages) ----------
const avgCache={};
async function fanAvg(q){if(!S.api)return null;if(avgCache[q]&&Date.now()-avgCache[q].t<60000)return avgCache[q].d;const d=await api('grades/avg?'+q);const v=d.ok?d.averages:null;avgCache[q]={t:Date.now(),d:v};return v;}
function cmpTable(wk,av,title){const items=av?av.items:{};const team=[['team:overall','Overall team'],['team:coaching','Coaching staff'],['team:offense','Offense'],['team:defense','Defense']];
 const OFF=['QB','RB','WR','TE','OL'],DEF=['DL','LB','DB'];const ps=(wk.players||[]).filter(p=>p.shown!==false&&!p.dnp&&(OFF.includes(p.group)||DEF.includes(p.group)));
 const cell=k=>{const a=items[k];return a?`<span class="fan">${a.avg.toFixed(1)}</span> <small>(${a.n})</small>`:'<small>–</small>';};
 return `<h2 class="section-title">${E(title)}</h2><div class="box" style="overflow-x:auto"><table class="fx-cmp"><thead><tr><th>Player</th><th>Our grade</th><th>Fan avg (votes)</th></tr></thead><tbody>
 ${team.map(([k,l])=>`<tr><td><b>${l}</b></td><td>–</td><td>${cell(k)}</td></tr>`).join('')}
 ${ps.map(p=>`<tr><td>${E(p.name)} <small>${E(p.pos)}</small></td><td>${p.avg!=null?Number(p.avg).toFixed(1):'–'}</td><td>${cell('p:'+(p.gsis_id||p.name))}</td></tr>`).join('')}</tbody></table>
 <p class="fine">${av&&av.voters?av.voters+' fan'+(av.voters===1?'':'s')+' graded this game.':'No fan grades for this game yet.'} Fan grades come from signed-in fans in the Grade the Team poll (1-10, open 7 days after each game). ${av&&av.game_id?`<a href="#/forum/grade/${E(av.game_id)}">Grade the Team →</a>`:''}</p></div>`;}
let hmWeek=null,hmBusy=false;
async function heatAvg(){const hb=$('heat-body');if(!hb||!S.api)return;const G_=typeof G!=='undefined'?G:null;const wk=G_&&G_.week;if(!wk||G_.mode==='season'){const o=$('fx-hm');o&&o.remove();hmWeek=null;return;}
 if(hmBusy||(hmWeek===wk.week&&$('fx-hm')))return;hmBusy=true;hmWeek=wk.week;const av=await fanAvg('week='+wk.week);hmBusy=false;
 let o=$('fx-hm');if(!o){o=document.createElement('div');o.id='fx-hm';hb.after(o);}o.innerHTML=cmpTable(wk,av,`Fans vs. our grades: Week ${wk.week}`);}
async function boxAvg(){const bb=$('boxscore-body');const id=window.BGD_boxId;if(!bb||!id||!S.api)return;let o=$('fx-bx');if(o&&o.dataset.id===id)return;
 let box=null,wk=null;try{box=await getJ(`data/boxscores/${id}.json`);wk=await getJ(`data/grades/week-${box.week_num}.json`);}catch(e){return;}
 const av=await fanAvg('game='+encodeURIComponent(id));if(!o){o=document.createElement('div');o.id='fx-bx';bb.after(o);}o.dataset.id=id;o.innerHTML=cmpTable(wk,av,'Player grades: ours vs. the fans');}
// homepage: game-day / grade-the-team link
async function homeLink(){const home=document.querySelector('[data-view="home"]');if(!home||!S.api)return;let sched=null;try{sched=await getJ('data/schedule.json');}catch(e){return;}
 const t=Date.now();const near=(sched.games||[]).some(g=>{const k=Date.parse(g.date);return t>k-24*36e5&&t<k+7*864e5;});if(!near)return;
 const d=await api('forum/gameday');const g=d.ok&&d.game;let a=$('fx-home');if(!g){a&&a.remove();return;}
 const html=!g.final&&g.gameday_thread?`🏈 <span>Game Day Thread:</span> ${E(g.label)} · join the live chat →`:g.grading_open?`🗳 <span>Grade the Team:</span> ${E(g.label)} · fans' grades are open →`:'';if(!html){a&&a.remove();return;}
 if(!a){a=document.createElement('a');a.id='fx-home';a.className='fx-home';home.prepend(a);}a.href=!g.final&&g.gameday_thread?`#/forum/thread/${g.gameday_thread}`:`#/forum/grade/${g.game_id}`;a.innerHTML=html;}

// ---------- mock draft -> forum ----------
document.addEventListener('click',e=>{const b=e.target.closest('.dr-forum');if(!b)return;const m=window.BGD_mockDraft&&window.BGD_mockDraft();if(!m){toast('Finish your draft first.');return;}
 sessionStorage.setItem('bgd_mock',JSON.stringify(m));if(S.api===false){toast('Posting to the forum is almost here: fan sign-in launches soon. Your draft is saved on this device, and once sign-in opens this button will post it to Fan Mock Drafts under your name. For now you can share it with Copy text or Download image.');return;}
 if(!S.me){sessionStorage.setItem('bgd_next','mock');location.hash='#/forum/join';return;}location.hash='#/forum/new?mock=1';});

// ---------- wiring ----------
function onRoute(v){if(v==='play'){location.replace('#/forum/pickem');return;}
 if(v!=='forum')stopPolls();if(v==='forum')render();if(v==='heatmap')setTimeout(heatAvg,300);if(v==='boxscore')setTimeout(boxAvg,300);if(v==='home')homeLink();}
document.addEventListener('route',e=>onRoute(e.detail));
const hb=()=>{const h=$('heat-body');if(h)new MutationObserver(()=>{if(!location.hash.match(/heatmap|grades/))return;clearTimeout(S.hmT);S.hmT=setTimeout(heatAvg,250);}).observe(h,{childList:true});};
probe().then(()=>{head();const v=(location.hash.replace(/^#\/?/,'').split(/[/?]/)[0])||'home';if(v==='play')location.replace('#/forum/pickem');
 if(v==='forum')render();if(/heatmap|grades/.test(v))heatAvg();if(v==='boxscore')boxAvg();if(v==='home')homeLink();hb();});
})();
