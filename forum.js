// Forum (preview). Only real content: topics opened by the clearly labeled Black & Gold Dispatch Bot (data/forum_bot.json).
// No fake members, replies, votes or view counts. Posting opens when accounts launch.
const FCATS=[
 {name:'Game Day',icon:'🏈',desc:'Pregame and postgame game threads'},
 {name:'Rumors & Roster',icon:'📋',desc:'Daily discussion, trades, signings, injuries'},
 {name:'Draft',icon:'🎯',desc:'Prospects, mocks and big boards'},
 {name:'Film Talk',icon:'🎬',desc:'All-22, breakdowns and scheme talk'},
 {name:'Off-Topic',icon:'💬',desc:'Pittsburgh life, other sports'},
 {name:'Founding Members Lounge',icon:'⭐',desc:'First 250 accounts get a free Founding Member badge and lounge (opens with accounts; not a paid tier)',locked:true}];
let FB=null;
const FE=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const botBadge='<span class="bot-badge" title="Automated house account, not a person">BOT</span>';
const fAgo=iso=>{const m=Math.round((Date.now()-new Date(iso))/6e4);return m<0?'scheduled':m<60?m+'m ago':m<1440?Math.round(m/60)+'h ago':Math.round(m/1440)+'d ago';};
const fAv=()=>'<span class="avatar bot" aria-hidden="true">🤖</span>';
const kindIcon={'Game thread':'🏈','Postgame':'📊','Daily discussion':'🗞️','Weekly poll':'🗳️'};
function forumList(){const T=FB?FB.topics:[];const cnt=c=>T.filter(t=>t.cat===c).length;return `
 <p class="page-sub">Real topics only. Threads are opened automatically by the <b>Black & Gold Dispatch Bot</b> ${botBadge}, a labeled house account, not a person. Replies open when member accounts launch.</p>
 <p class="box forum-rules-note"><b>Forum rules:</b> be respectful, no made-up "facts" about real people, no impersonation, no copied articles or photos (link instead), no spam or betting promos. Members must be 13+. <a href="legal/terms.html#forum-rules">Read the full rules</a> · <a href="legal/dmca.html">Copyright / DMCA</a></p>
 <h2 class="section-title">Categories</h2>
 <div class="cats">${FCATS.map(c=>`<a class="cat${c.locked?' locked':''}" href="#/forum"><span class="cat-icon">${c.icon}</span><span class="cat-main"><b>${c.name}${c.locked?' <span class="lock">⭐ Founders</span>':''}</b><small>${c.desc}</small></span><span class="cat-stats"><b>${cnt(c.name)}</b> topics</span></a>`).join('')}</div>
 <h2 class="section-title">Latest topics</h2>
 <div class="threads">${T.length?[...T].sort((a,b)=>(b.pinned-a.pinned)||b.created.localeCompare(a.created)).map(t=>`<a class="thread" href="#/forum/thread/${FE(t.id)}">${fAv()}<span class="t-main"><span class="t-cat">${t.pinned?'📌 ':''}${kindIcon[t.kind]||''} ${FE(t.kind)} · ${FE(t.cat)}</span><b>${FE(t.title)}</b><small>by ${FE(t.author)} ${botBadge}</small></span><span class="t-stats"><b>${t.replies}</b> replies<br><small>${fAgo(t.created)}</small></span></a>`).join(''):'<p class="fine">No topics yet.</p>'}</div>`;}
function forumThread(id){const t=(FB?FB.topics:[]).find(x=>x.id===id);if(!t)return '<p><a class="back" href="#/forum">← Back to forum</a></p><p>Topic not found.</p>';
 const ext='target="_blank" rel="noopener nofollow"';return `
 <p><a class="back" href="#/forum">← Back to forum</a></p>
 <div class="thread-head"><span class="t-cat">${kindIcon[t.kind]||''} ${FE(t.kind)} · ${FE(t.cat)}</span><h2>${FE(t.title)}</h2><small>${t.replies} replies · opened ${fAgo(t.created)}</small></div>
 <div class="posts"><article class="post">${fAv()}<div class="p-body"><p class="p-meta"><b>${FE(t.author)}</b> ${botBadge} <span class="role">Automated house account</span> · ${fAgo(t.created)}</p>
  <p>${FE(t.body)}</p>
  <p class="p-report"><button type="button" class="report-btn" data-id="${FE(t.id)}" aria-label="Report this post to moderators">⚑ Report</button> <a href="legal/terms.html#forum-rules">Rules</a> <span class="report-msg fine" role="status"></span></p>
  ${t.poll?`<div class="poll" role="group" aria-label="${FE(t.poll.question)}">${t.poll.options.map(o=>`<button type="button" disabled>${FE(o)}</button>`).join('')}<small class="fine">Voting opens to signed-in members at launch. No results yet.</small></div>`:''}
  ${(t.links||[]).length?`<p class="p-actions">${t.links.map(l=>`<a class="btn ghost" href="${FE(l.href)}" ${l.external?ext:''}>${FE(l.label)}</a>`).join(' ')}</p>`:''}</div></article></div>
 <p class="fine">No replies yet. Be the first when member accounts launch.</p>
 <div class="reply-box"><label class="sr" for="reply-ta">Reply</label><textarea id="reply-ta" placeholder="Sign in to reply (accounts launching soon; 13+ only)" disabled></textarea><button class="btn" type="button" disabled>Post reply</button></div>`;}
function renderForum(){const el=document.getElementById('forum-body');if(!el)return;const m=location.hash.match(/forum\/thread\/([\w-]+)/);el.innerHTML=m?forumThread(m[1]):forumList();}
fetch('data/forum_bot.json',{cache:'no-store'}).then(r=>r.json()).then(d=>{FB=d;if(/forum/.test(location.hash))renderForum();}).catch(()=>{});
document.addEventListener('route',e=>{if(e.detail==='forum')renderForum();});
// Report button (scaffold): moderation queue goes live with accounts. Nothing is sent anywhere yet.
document.addEventListener('click',e=>{const b=e.target.closest('.report-btn');if(!b)return;const m=b.parentElement.querySelector('.report-msg');
 if(m)m.textContent='Thanks. Reporting goes live with member accounts; nothing was sent yet. For copyright issues, use the DMCA page.';});
