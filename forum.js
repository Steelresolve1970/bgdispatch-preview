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
 let to=null;if(opts.timeout&&window.AbortController){const ac=new AbortController();o.signal=ac.signal;to=setTimeout(()=>ac.abort(),opts.timeout);}
 let r;try{r=await fetch('/api/'+path,o);}catch(e){clearTimeout(to);return{ok:false,error:e&&e.name==='AbortError'?'The site took too long to answer. Check your connection and try again.':'Network problem. Check your connection and try again.',net:true};}
 clearTimeout(to);
 let d;try{d=await r.json();}catch(e){d={ok:false,error:r.status===404?'not_configured':r.status===413?'That is too long to send. Please shorten it and try again.':r.status>=500?'The site had a problem saving that. Please try again in a minute.':'Something went wrong. Please try again.'};}
 if(!d||typeof d!=='object')d={ok:false,error:r.status>=500?'The site had a problem saving that. Please try again in a minute.':'Something went wrong. Please try again.'};
 if(!r.ok&&d.ok!==false)d.ok=false;if(!d.ok&&!d.error)d.error='Something went wrong. Please try again.';d.status=r.ok&&typeof d.status==='number'?d.status:r.status;return d;}   // the API answers most errors with HTTP 200 and the real code in the body
// Longest post / reply / chat message (the server checks the same number). A counter shows up near the limit; nothing is ever cut off silently.
const POST_MAX=5000,COUNT_FROM=4000;const n0=n=>n.toLocaleString('en-US');
function countMsg(len){return len>POST_MAX?{t:`Too long by ${n0(len-POST_MAX)} characters (${n0(len)} of ${n0(POST_MAX)}). Shorten it to post.`,bad:true}:len>=COUNT_FROM?{t:`${n0(len)} of ${n0(POST_MAX)} characters`,bad:false}:{t:'',bad:false};}
function wireCount(ta,out){const u=()=>{const m=countMsg(ta.value.length);out.textContent=m.t;out.className='fx-cnt'+(m.bad?' bad':'');out.dataset.err='';};ta.addEventListener('input',u);u();return u;}

// ---------- styles (kept here so the shared stylesheet stays untouched) ----------
const css=`
.fx-tabs{display:flex;gap:6px;overflow-x:auto;margin:6px 0 14px;padding-bottom:2px;-webkit-overflow-scrolling:touch}
.fx-tabs a{flex:0 0 auto;min-height:44px;display:inline-flex;align-items:center;padding:0 16px;border-radius:22px;background:#fff;border:2px solid #101010;color:#101010;text-decoration:none;font-weight:800}
.fx-tabs a.on{background:#101010;color:#FFB612}
.fx-btn{min-height:46px;padding:0 18px;border-radius:10px;border:0;background:#FFB612;color:#101010;font-weight:900;font-size:1rem;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;text-decoration:none}
.fx-btn.dark{background:#101010;color:#FFB612}.fx-btn.ghost{background:#fff;border:2px solid #101010;color:#101010}.fx-btn[disabled]{opacity:.5;cursor:default}.fx-btn.sm{min-height:36px;padding:0 12px;font-size:.9rem}
.fx-form{background:#fff;border-radius:12px;padding:18px;max-width:520px;box-shadow:0 1px 3px #0001}
.fp-gate{border-left:5px solid #FFB612;margin:0 0 14px}.fp-gate p{margin:0 0 10px}.fp-gate .fp-gate-btns{display:flex;gap:10px;flex-wrap:wrap;margin:0}#fp-play.fp-gated .pk-save{display:none!important}
.fx-tag{display:inline-block;background:#101010;color:#FFB612;border-radius:4px;padding:1px 7px;font-size:.7rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;vertical-align:middle;line-height:1.5}
.fx-tag.gold{background:#FFB612;color:#101010;margin:0 0 6px;display:table}.fx-tag.dim{background:#e7e7e7;color:#333}.fx-home .fx-tag.gold{display:inline-block;margin:0 4px 0 0}
.fx-newbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:4px 0 14px}.fx-newbar .fine{margin:0}
.fx-btn.fx-new{min-height:50px;padding:0 24px;font-size:1.08rem;border:2px solid #101010;box-shadow:0 3px 0 #101010;touch-action:manipulation}.fx-btn.fx-new:active{transform:translateY(2px);box-shadow:0 1px 0 #101010}
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
.fx-fp{background:#101010;color:#fff;border:3px solid #FFB612;border-radius:12px;padding:14px 16px;margin:0 0 14px}.fx-fp h3{margin:0 0 8px;color:#FFB612;text-transform:uppercase;letter-spacing:1px;font-weight:900;font-size:1rem}.fx-fp h3 small{color:#ccc;font-weight:600;text-transform:none;letter-spacing:0;margin-left:6px;font-size:.8rem}
.fx-fp blockquote{margin:0 0 8px;padding:0 0 0 12px;border-left:4px solid #FFB612;font-size:1.05rem;line-height:1.45;overflow-wrap:anywhere}.fx-fp blockquote::before{content:'“'}.fx-fp blockquote::after{content:'”'}
.fx-fp-by{margin:0 0 10px;font-size:.9rem;color:#ddd;overflow-wrap:anywhere}.fx-fp-by a{color:#FFB612}.fx-fp .fx-btn{display:inline-flex}.fx-post.fx-hl{outline:3px solid #FFB612;outline-offset:2px}
.fx-score{background:#101010;color:#fff;border-radius:12px;padding:14px 16px;margin-bottom:12px;position:sticky;top:64px;z-index:3}
.fx-score .row{display:flex;justify-content:space-around;align-items:center;font-size:1.5rem;font-weight:900}.fx-score .row span{color:#FFB612}
.fx-score small{display:block;text-align:center;color:#ccc;margin-top:4px}.fx-score a{color:#FFB612}
.fx-posts{display:flex;flex-direction:column;gap:10px;margin-bottom:120px}
.fx-post{background:#fff;border-radius:10px;padding:12px 14px;box-shadow:0 1px 3px #0001}.fx-post.hid{opacity:.55;border:2px dashed #b3261e}
.fx-post .who{display:flex;flex-wrap:wrap;gap:6px;align-items:baseline}.fx-post .who2{display:flex;gap:10px;align-items:flex-start;margin-bottom:6px}.fx-post .who2 .who{flex:1}.fx-post .stat{flex-basis:100%;font-size:.78rem;color:#666}.fx-post .stat .rk{font-weight:800;color:#101010}
.fx-av{width:44px;height:44px;border-radius:50%;flex:none;overflow:hidden;display:inline-block;background:#101010}.fx-av img,.fx-av svg{width:100%;height:100%;display:block;object-fit:cover}.fx-av.lg{width:96px;height:96px}
.fx-avp{display:grid;grid-template-columns:repeat(auto-fill,minmax(56px,1fr));gap:8px;margin:6px 0}.fx-avp button{border:3px solid transparent;border-radius:50%;padding:0;background:none;width:56px;height:56px;cursor:pointer}.fx-avp button.on{border-color:#FFB612}.fx-avp .fx-av{width:50px;height:50px}
.fx-upl{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:6px 0}.fx-upl .fx-btn{position:relative;overflow:hidden}.fx-upl input[type=file]{position:absolute;inset:0;opacity:0;cursor:pointer}
.fx-post blockquote{border-left:4px solid #FFB612;margin:4px 0 8px;padding:4px 10px;background:#faf7ee;color:#444;font-size:.92rem}.fx-rx button .l{font-size:.8rem;font-weight:700}
.fx-pend{background:#fff3cf;border:1px solid #FFB612;border-radius:8px;padding:6px 10px;font-size:.85rem}.fx-avq{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}.fx-avq .c{background:#fff;border-radius:12px;padding:12px;text-align:center;box-shadow:0 1px 3px #0002}.fx-avq img{width:160px;height:160px;border-radius:50%;object-fit:cover;background:#eee}.fx-avq .b{display:flex;gap:8px;margin-top:10px}.fx-avq .b button{flex:1;min-height:52px;font-size:1rem}
.fx-post .who b{font-size:1rem}.fx-post .who small{color:#666}
.fx-fm{display:inline-block;background:#101010;color:#FFB612;border:1px solid #FFB612;border-radius:6px;padding:0 6px;font-size:.72rem;font-weight:800;letter-spacing:.02em;line-height:1.5;white-space:nowrap;vertical-align:middle}.fx-fmline{margin:0 0 10px;padding:8px 12px;border-left:5px solid #FFB612;background:#faf6ea;border-radius:6px;font-size:.92rem}
.fx-flair{background:#FFB612;color:#101010;border-radius:6px;padding:1px 6px;font-size:.78rem;font-weight:800}.fx-role{background:#101010;color:#FFB612;border-radius:6px;padding:1px 6px;font-size:.72rem;font-weight:800}
.fx-post .tx{margin:6px 0 8px;white-space:pre-wrap;overflow-wrap:anywhere;font-size:1.02rem}
.fx-rx{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.fx-rx button{min-height:40px;min-width:48px;border-radius:20px;border:1px solid #ddd;background:#f6f6f4;font-size:1.05rem;padding:0 10px}
.fx-rx button.on{background:#fff3cf;border-color:#FFB612}.fx-rx .sp{flex:1}.fx-rx .lnk{background:none;border:0;min-width:0;font-size:.85rem;color:#555;text-decoration:underline}
.fx-reply{position:fixed;left:0;right:0;bottom:0;background:#fff;border-top:3px solid #FFB612;padding:10px;z-index:6;display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;box-shadow:0 -2px 8px #0002}
.fx-reply textarea{flex:1;min-width:0;min-height:48px;max-height:40vh;font-size:16px;line-height:1.35;padding:10px;border:2px solid #ccc;border-radius:10px;resize:none;overflow-y:auto}
.fx-reply .fx-cnt{flex-basis:100%;order:3;margin:0}.fx-reply .fx-cnt:empty{display:none}
.fx-cnt{font-size:.85rem;font-weight:700;color:#555;margin:4px 0 0}.fx-cnt.bad{color:#b3261e}
.fx-dob{display:flex;gap:8px;align-items:stretch}.fx-dob>*{min-width:0}.fx-dob select{flex:1.6}.fx-dob .d{flex:0.9}.fx-dob .y{flex:1.2}
.fx-dob span{display:block;font-size:.8rem;font-weight:700;color:#555;margin:0 0 3px}.fx-dob>div{display:flex;flex-direction:column}
.fx-form .fx-dob input.bad,.fx-form .fx-dob select.bad{border-color:#b3261e}
.fx-jump{position:fixed;right:14px;bottom:92px;z-index:7;min-height:46px;border-radius:23px;border:0;background:#101010;color:#FFB612;font-weight:900;padding:0 16px;box-shadow:0 2px 8px #0004}
.fx-grade{background:#fff;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 1px 3px #0001}
.fx-gi{display:grid;grid-template-columns:1fr 54px;gap:4px 10px;align-items:center;padding:10px 0;border-bottom:1px solid #eee}
.fx-gi .l b{display:block}.fx-gi .l small{color:#666}.fx-gi output{font-size:1.4rem;font-weight:900;text-align:center;color:#999}.fx-gi.set output{color:#101010}
.fx-gi input[type=range]{grid-column:1/3;width:100%;height:36px;accent-color:#FFB612}.fx-gi.done{opacity:.75}
.fx-sum{position:sticky;bottom:0;background:#fff;padding:10px;border-top:3px solid #FFB612;display:flex;gap:10px;align-items:center;justify-content:space-between;z-index:4}
.fx-cmp{width:100%;border-collapse:collapse}.fx-cmp th,.fx-cmp td{padding:8px 6px;border-bottom:1px solid #eee;text-align:center}.fx-cmp td:first-child,.fx-cmp th:first-child{text-align:left}
.fx-cmp .fan{font-weight:900}.fx-modal{position:fixed;inset:0;background:#0008;z-index:50;display:flex;align-items:flex-end;justify-content:center}
.fx-modal .in{background:#fff;border-radius:14px 14px 0 0;padding:18px;max-width:560px;width:100%}
.fx-ncii{border-left:4px solid #c62828}.fx-due{color:#b71c1c;font-weight:700;font-size:.85rem;margin:4px 0}.fx-csam{border-left:4px solid #b71c1c}.fx-proc li{margin:6px 0}
.fx-modal .in .opts{display:flex;flex-direction:column;gap:8px;margin:10px 0}
#fp-play section[hidden]{display:none}
.fx-home{display:block;background:#101010;color:#fff;text-decoration:none;border-radius:10px;padding:14px 16px;margin:10px 0;border-left:8px solid #FFB612;font-weight:800}
.fx-home span{color:#FFB612}
@media(min-width:800px){.fx-reply{left:50%;right:auto;width:100%;transform:translateX(-50%);max-width:820px;border-radius:12px 12px 0 0}}`;
const lcCss=`
.lc{padding:0;overflow:hidden}.lc-top{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;justify-content:space-between;background:#101010;color:#fff;padding:10px 12px}
.lc-top b{color:#FFB612}.lc-top .fx-tag.gold{display:inline-block;margin:0 6px 0 0}.lc-top a{color:#FFB612;font-weight:800;white-space:nowrap}
.lc-note{margin:0;padding:6px 12px;font-size:.8rem;color:#555;background:#faf6ea;border-bottom:1px solid #eee}
.lc-list{max-height:420px;overflow-y:auto;padding:6px 12px;overscroll-behavior:contain}.lc-empty{color:#666;font-size:.9rem;margin:10px 0}
.lc-m{display:flex;gap:8px;padding:7px 0;border-bottom:1px solid #f0f0f0}.lc-m:last-child{border-bottom:0}.lc-m.hid{opacity:.55}.lc-m .fx-av{width:30px;height:30px}
.lc-b{min-width:0;flex:1}.lc-h{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 6px}.lc-h b{font-size:.92rem}.lc-h small{color:#777;font-size:.75rem}
.lc-t{white-space:pre-wrap;overflow-wrap:anywhere;font-size:.95rem;line-height:1.35}.lc-a{font-size:.78rem}.lc-a a,.lc-a .lnk{background:none;border:0;padding:0;margin-right:10px;color:#555;text-decoration:underline;cursor:pointer;font-size:.78rem}
.lc-form{display:flex;gap:8px;padding:10px 12px;border-top:1px solid #eee;background:#fafafa;align-items:flex-end}.lc-form textarea{flex:1;min-width:0;min-height:44px;max-height:200px;resize:none;font:inherit;font-size:16px;padding:10px;border:2px solid #101010;border-radius:10px;overflow-y:auto}.lc-form{flex-wrap:wrap}.lc-form .fx-cnt{flex-basis:100%;order:3;margin:0}.lc-form .fx-cnt:empty{display:none}.lc-hint{flex-basis:100%;order:4;margin:0;font-size:.75rem;color:#666}
.lc-gate{padding:12px;border-top:1px solid #eee;background:#fafafa}.lc-gate p{margin:0 0 8px}.lc-gate .fx-btn{margin:0 6px 6px 0}.lc .fx-err{margin:0;padding:0 12px 8px}
`;
const st=document.createElement('style');st.textContent=css+lcCss;document.head.appendChild(st);

// ---------- body text: escape, keep line breaks, link URLs ----------
// Avatars: our own simple black-and-gold art (no logos, no marks, no real people). '' = initials.
const AVP=[['#101010','#FFB612','circle'],['#FFB612','#101010','circle'],['#101010','#FFB612','stripes'],['#FFB612','#101010','diamond'],['#101010','#FFB612','star'],['#FFB612','#101010','ball'],['#101010','#FFB612','posts'],['#FFB612','#101010','tri'],['#101010','#FFB612','chev'],['#FFB612','#101010','field'],['#101010','#FFB612','ring'],['#FFB612','#101010','bolt']];
function avArt(k){const [bg,fg,sh]=AVP[k-1]||AVP[0];const g={circle:`<circle cx="32" cy="32" r="16" fill="${fg}"/>`,stripes:`<path d="M-8 40 40-8M8 56 56 8M24 72 72 24" stroke="${fg}" stroke-width="8"/>`,diamond:`<path d="M32 12 52 32 32 52 12 32Z" fill="${fg}"/>`,
 star:`<path d="M32 12l5.9 12 13.1 1.9-9.5 9.3 2.2 13.1L32 42.1l-11.7 6.2 2.2-13.1-9.5-9.3 13.1-1.9z" fill="${fg}"/>`,ball:`<ellipse cx="32" cy="32" rx="20" ry="12" fill="${fg}" transform="rotate(-30 32 32)"/><path d="M26 30l12 4M28 26l-2 8M32 28l-2 7M36 30l-2 7" stroke="${bg}" stroke-width="2"/>`,
 posts:`<path d="M20 14v20h24V14M32 34v18" stroke="${fg}" stroke-width="5" fill="none"/>`,tri:`<path d="M32 14 52 48H12Z" fill="${fg}"/>`,chev:`<path d="M14 26 32 38 50 26M14 38 32 50 50 38" stroke="${fg}" stroke-width="6" fill="none"/>`,
 field:`<rect x="12" y="18" width="40" height="28" fill="none" stroke="${fg}" stroke-width="3"/><path d="M22 18v28M32 18v28M42 18v28" stroke="${fg}" stroke-width="2"/>`,ring:`<circle cx="32" cy="32" r="16" fill="none" stroke="${fg}" stroke-width="7"/>`,bolt:`<path d="M36 10 18 36h12l-4 18 20-28H34z" fill="${fg}"/>`}[sh];
 return `<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="${bg}"/>${g}</svg>`;}
function initials(n){const w=String(n||'?').replace(/[^A-Za-z0-9 ]/g,' ').trim().split(/\s+/);return((w[0]||'?')[0]+(w.length>1?w[w.length-1][0]:(w[0]||'')[1]||'')).toUpperCase();}
function avInit(n){let h=0;for(const c of String(n))h=(h*31+c.charCodeAt(0))>>>0;const gold=h%2;return `<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="${gold?'#FFB612':'#101010'}"/><text x="32" y="41" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="800" font-size="24" fill="${gold?'#101010':'#FFB612'}">${E(initials(n))}</text></svg>`;}
// av(key, name, uid, v, pending?) -> html. key: '' | 'pN' | 'u' (approved upload)
function av(k,n,uid,v,cls='',pending=false){const inner=pending&&uid?`<img src="/api/avatar/${uid}?pending=1&t=${Date.now()}" alt="">`:k==='u'&&uid?`<img src="/api/avatar/${uid}?v=${v||0}" alt="" loading="lazy">`:/^p\d+$/.test(k||'')?avArt(+k.slice(1)):avInit(n);return `<span class="fx-av ${cls}">${inner}</span>`;}
const rank=n=>n>=500?'Legend':n>=200?'All-Star':n>=50?'Veteran':n>=10?'Starter':'Rookie';   // generic words only
const joined=t=>t?new Date(t).toLocaleDateString('en-US',{month:'short',year:'numeric'}):'';
const RX={like:['👍','Like'],dislike:['👎','Dislike'],agree:['✅','Agree'],disagree:['❌','Disagree'],funny:['😂','Hilarious'],insightful:['💡','Insightful']};
const UPLOAD_RULES='Only upload images you own or have permission to use. No logos, no copyrighted photos, no explicit or hateful images. Uploaded pictures are checked automatically and then approved by a moderator before others can see them.';
// Avatar picker (sign-up + profile)
function avPicker(cur,name){return `<div class="fx-avbox"><input type="hidden" name="avatar" value="${E(cur)}"><p class="fine" style="margin:4px 0">Pick a preset avatar (optional). Your initials are used otherwise.</p>
 <div class="fx-avp" role="radiogroup" aria-label="Avatar">${['',...AVP.map((_,i)=>'p'+(i+1))].map(k=>`<button type="button" role="radio" class="${k===cur?'on':''}" data-av="${k}" aria-checked="${k===cur}" aria-label="${k?'Preset '+k.slice(1):'Initials'}">${av(k,name)}</button>`).join('')}</div>
 <span class="fx-avprev" hidden></span><small class="fx-avmsg fine" role="status"></small></div>`;}   // custom uploads are OFF: presets and initials only
let NSFW=null;
function loadScript(src){return new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s);});}
async function nsfwModel(){if(NSFW)return NSFW;NSFW=(async()=>{if(!window.tf)await loadScript('vendor/nsfwjs/tf.min.js');if(!window.nsfwjs)await loadScript('vendor/nsfwjs/nsfwjs.min.js');return nsfwjs.load(new URL('vendor/nsfwjs/mobilenet_v2/model.json',location.href).href);})();NSFW.catch(()=>{NSFW=null;});return NSFW;}
// Resize to 256px square (center crop), WebP (JPEG fallback), max ~100 KB; then on-device nudity check (NSFWJS, MIT) before upload.
async function prepAvatar(file){if(!/^image\/(jpeg|png|webp)$/.test(file.type))throw new Error('Please choose a JPEG, PNG or WebP image.');if(file.size>15e6)throw new Error('That file is too big. Try one under 15 MB.');
 const img=await new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>no(new Error('We couldn\'t read that image.'));i.src=URL.createObjectURL(file);});
 const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');const m=Math.min(img.naturalWidth,img.naturalHeight);x.drawImage(img,(img.naturalWidth-m)/2,(img.naturalHeight-m)/2,m,m,0,0,256,256);URL.revokeObjectURL(img.src);
 let model;try{model=await nsfwModel();}catch(e){throw new Error('Our picture safety check didn\'t load. Check your connection and try again, or pick a preset.');}
 const pr=Object.fromEntries((await model.classify(c)).map(q=>[q.className,q.probability]));
 if((pr.Porn||0)+(pr.Hentai||0)>0.35||(pr.Sexy||0)>0.6)throw new Error('That picture can\'t be used here. Please pick a different one (no explicit images).');
 for(const [t,qs_] of [['image/webp',[.85,.7,.55,.4]],['image/jpeg',[.85,.7,.55,.4]]])for(const q of qs_){const u=c.toDataURL(t,q);if(u.startsWith('data:'+t)&&u.length<=136000)return u;}
 throw new Error('We couldn\'t shrink that picture enough. Try another one.');}
function wirePicker(root,name){const box=root.querySelector('.fx-avbox');if(!box)return;const h=box.querySelector('input[name=avatar]'),msg=box.querySelector('.fx-avmsg'),prev=box.querySelector('.fx-avprev');
 box.querySelectorAll('[data-av]').forEach(b=>b.onclick=()=>{h.value=b.dataset.av;prev.innerHTML='';msg.textContent='';box.querySelectorAll('[data-av]').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-checked',x===b);});});
 const fi=box.querySelector('input[type=file]');if(fi)fi.onchange=async()=>{const f=fi.files[0];fi.value='';if(!f)return;msg.textContent='Checking your picture…';
  try{const u=await prepAvatar(f);h.value=u;prev.innerHTML=`<span class="fx-av"><img src="${u}" alt="Your upload"></span>`;box.querySelectorAll('[data-av]').forEach(x=>{x.classList.remove('on');x.setAttribute('aria-checked','false');});msg.textContent='Looks good. A moderator will approve it shortly; until then others see your initials.';}
  catch(e){msg.textContent=e.message;}};}
const fmtQuote=s=>s.split('\n').map(l=>/^&gt; ?/.test(l)?`<blockquote>${l.replace(/^&gt; ?/,'')}</blockquote>`:l).join('\n').replace(/<\/blockquote>\n<blockquote>/g,'<br>');
const fmtBody=s=>fmtQuote(E(s)).replace(/https?:\/\/[^\s<]+[^\s<.,;:!?)"']/g,u=>`<a href="${u}" target="_blank" rel="noopener noreferrer nofollow ugc">${u.replace(/^https?:\/\//,'').slice(0,60)}</a>`);
const R_CSAM='Illegal content (child sexual abuse material)',R_NCII='Intimate image shared without consent (TAKE IT DOWN Act)',CYBERTIP='https://report.cybertip.org/';
const tag=(t,c='')=>`<span class="fx-tag${c?' '+c:''}">${t}</span>`;   // small-caps text labels (no emoji, owner request Oct 20, 2026)
// Founding Member badge: the first 250 fan accounts, numbered in signup order (number comes from the server; text only, no emoji or logos)
const fmTag=n=>n?`<span class="fx-fm" title="One of the first 250 forum members">Founding Member #${+n}</span>`:'';
const roleTag=r=>r==='owner'?'<span class="fx-role">OWNER</span>':r==='mod'?'<span class="fx-role">MOD</span>':r==='bot'?'<span class="fx-role" title="Posted automatically by the Dispatch Desk">AUTO</span>':'';

// ---------- header buttons ----------
// One-time notice about the interim Terms of Use (Oct 23, 2026) for members who joined before the new terms went live.
// The server decides who needs it (me.terms_notice); "I've read the updated terms" is saved on the account (POST me/terms-ack),
// so it stops on every device. Shown at the top of every page once signed in. Never allowed to break sign-in or the forum.
const TERMS_VER='2026-10-23-interim';
function termsNote(){try{let n=$('fx-terms-note');
 if(!S.me||!S.me.terms_notice){if(n)n.remove();return;}if(n)return;
 const m=document.querySelector('body>main.wrap')||document.querySelector('main');if(!m)return;
 n=document.createElement('div');n.id='fx-terms-note';n.setAttribute('role','region');n.setAttribute('aria-label','Updated Terms of Use');
 n.style.cssText='background:#fff;color:#111;border-left:4px solid #FFB612;border-radius:8px;padding:12px 14px;margin:12px 0 14px;box-shadow:0 1px 3px #0001';
 n.innerHTML='<p style="margin:0 0 10px">We\'ve updated our Terms of Use (interim terms, effective Oct 23, 2026). Please read the <a href="/legal/terms">Terms</a>.</p><button type="button" class="fx-btn sm">I\'ve read the updated terms</button> <p class="fx-terms-err" style="display:none;margin:6px 0 0;color:#b00020;font-size:.9rem" aria-live="polite"></p>';
 const btn=n.querySelector('button'),er=n.querySelector('.fx-terms-err');
 btn.onclick=async()=>{try{btn.disabled=true;er.textContent='';er.style.display='none';const d=await api('me/terms-ack',{body:{version:TERMS_VER},timeout:15000});
  if(d.ok){if(S.me)S.me.terms_notice=false;n.remove();}else{btn.disabled=false;er.textContent=d.error||'Something went wrong. Please try again.';er.style.display='block';}}
  catch(e){btn.disabled=false;}};
 m.insertBefore(n,m.firstChild);}catch(e){}}
function head(){termsNote();const a=document.querySelector('.forum-actions');const badge=document.querySelector('.forum-head .badge');
 if(S.api&&badge)badge.remove();if(!a)return;
 if(!S.api){a.innerHTML='';return;}
 a.innerHTML=S.me?`<a class="fx-btn ghost sm" href="#/forum/me">${E(S.me.display_name)}</a> <a class="fx-btn sm" href="#/forum/new">+ New Thread</a>`
  :`<a class="fx-btn ghost sm" href="#/forum/signin">Sign in</a> <a class="fx-btn sm" href="#/forum/join">Join free</a>`;}
function tabs(on){return `<nav class="fx-tabs" aria-label="Forum sections">${[['discuss','Discussions','#/forum'],['gameday','Game Day','#/forum/gameday'],['pickem',"Pick 'Em",'#/forum/pickem'],['trivia','Trivia','#/forum/trivia']]
 .map(([k,l,h])=>`<a href="${h}" class="${on===k?'on':''}">${l}</a>`).join('')}${S.me&&(S.me.role==='mod'||S.me.role==='owner')?`<a href="#/forum/mod" class="${on==='mod'?'on':''}">Mod queue</a>`:''}</nav>`;}

// ---------- routing inside #/forum ----------
function sub(){const h=location.hash.replace(/^#\/?/,'');const [p,...rest]=h.split('?')[0].split('/');return p==='forum'?rest:null;}
function qs(k){const m=(location.hash.split('?')[1]||'').match(new RegExp('(?:^|&)'+k+'=([^&]*)'));return m?decodeURIComponent(m[1]):null;}
function stopPolls(){clearTimeout(S.poll);clearTimeout(S.livePoll);S.poll=S.livePoll=null;S.thread=null;document.querySelectorAll('.fx-reply,.fx-jump').forEach(n=>n.remove());if(S.vvOff){S.vvOff();S.vvOff=null;}}
// Each render gets a number; a view that finishes loading after a newer render started just stops.
// (Fixes Oct 20, 2026: on a fresh page load the thread view ran twice and stacked two reply boxes, and the one on top had no working Post button.)
S.rseq=0;const stale=t=>t!==S.rseq;
async function render(){const el=$('forum-body');if(!el)return;const r=sub();if(!r)return;stopPolls();const tok=++S.rseq;
 if(S.api===null)await probe();if(stale(tok))return;head();parkPlay();
 const [p,a]=r;
 if(p==='pickem'||p==='trivia')return playTab(el,p);
 if(!S.api){if(p==='gameday')return gamedayTab(el);return legacy(el,p,a);}
 if(p==='claim')return claimView(el,a);
 if(p==='join'||p==='signin')return authForm(el,p,tok);
 if(p==='me')return profile(el);
 if(p==='new')return newThread(el);
 if(p==='thread'&&a)return threadView(el,+a,tok);
 if(p==='grade')return gradeView(el,a);
 if(p==='mod')return modView(el);
 if(p==='procedure')return procView(el);
 if(p==='gameday')return gamedayTab(el);
 return listView(el);}
async function probe(){const d=await api('me');S.api=!!(d.ok&&d.configured!==false);S.me=S.api?d.user:null;document.documentElement.classList.toggle('fx-on',S.api);}

// ---------- Discussions ----------
async function listView(el){el.innerHTML=tabs('discuss')+'<p class="empty">Loading…</p>';
 if(qs('cat')==='Film Talk'){location.replace('#/forum?cat='+encodeURIComponent('General Steelers'));return;}   // old category name
 const cat=qs('cat');const d=await api('forum/threads'+(cat?'?cat='+encodeURIComponent(cat):''));if(!d.ok){el.innerHTML=tabs('discuss')+`<p class="fx-err">${E(d.error)}</p>`;return;}
 S.cats=d.cats;S.me=d.me;head();const T=d.threads;const pin=T.filter(t=>t.pinned&&(t.kind==='gameday'||t.kind==='postgame'));
 const nq=cat&&cat!=='Game Day'?'?cat='+encodeURIComponent(cat):'';
 el.innerHTML=tabs('discuss')+`<div id="fx-livebadge"></div><div class="fx-newbar"><a class="fx-btn fx-new" id="fx-newbtn" href="#/forum/new${nq}">+ New Thread</a><span class="fine">${S.me?(cat&&cat!=='Game Day'?'Start a thread in '+E(cat):'Start a conversation'):'Free account needed to post. Reading is open to everyone.'}</span></div>${cat?'':'<div id="fx-fanpost"></div>'}${pin.map(t=>`<a class="fx-gd" href="#/forum/thread/${t.id}">${tag(t.kind==='gameday'?'Game Day':'Post-Game','gold')}<b>${E(t.title)}</b><small>${t.kind==='gameday'?'Live chat · score updates on its own':'Post-game talk + Grade the Team'} · ${t.posts} posts · ${ago(t.last_post)}</small></a>`).join('')}
 <div class="fx-chips" role="group" aria-label="Filter by category"><button type="button" data-cat="" class="${!cat?'on':''}">All</button>${d.cats.map(c=>`<button type="button" data-cat="${E(c)}" class="${cat===c?'on':''}">${E(c)}</button>`).join('')}</div>
 <div class="fx-list">${T.filter(t=>!pin.includes(t)).map(t=>`<a class="fx-th${t.pinned?' pin':''}" href="#/forum/thread/${t.id}"><span class="m"><small>${t.pinned?tag('Pinned')+' ':''}${t.locked?tag('Locked','dim')+' ':''}${t.hidden?tag('Hidden','dim')+' ':''}${E(t.cat)}</small><b>${E(t.title)}</b><small>by ${E(t.author)} ${t.author_role==='bot'?roleTag('bot'):''} · ${ago(t.last_post)}</small></span><span class="n">${t.posts}<br><small>posts</small></span></a>`).join('')||`<p class="fine">No threads yet. <a href="#/forum/new${nq}">Start the first one!</a></p>`}</div>
 <p class="fine" style="margin-top:14px"><a href="legal/community.html">Community guidelines</a> · Be respectful, no spam, 13+ only.</p>`;
 el.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{location.hash='#/forum'+(b.dataset.cat?'?cat='+encodeURIComponent(b.dataset.cat):'');});
 liveBadge();if(!cat)fanPost();}
// Fan Post of the Week (GET /api/forum/fanpost, cached ~5 min). No winner yet: the box stays empty (no placeholder).
async function fanPostData(){try{const r=await fetch('/api/forum/fanpost',{credentials:'same-origin'});const d=await r.json();return d&&d.ok?d:null;}catch(e){return null;}}
async function fanPost(){const box=$('fx-fanpost');if(!box)return;const d=await fanPostData();const p=d&&d.post;if(!p||!box.isConnected)return;
 box.innerHTML=`<section class="fx-fp" aria-labelledby="fx-fpH"><h3 id="fx-fpH">Fan Post of the Week <small>${E(d.week&&d.week.label||'')}</small></h3><blockquote>${E(p.quote)}</blockquote><p class="fx-fp-by"><b>${E(p.username)}</b> in <a href="#/forum/thread/${+p.thread_id}">${E(p.thread_title)}</a></p><a class="fx-btn sm" href="#/forum/thread/${+p.thread_id}?p=${+p.id}">Read the full post</a></section>`;}

// ---------- sign up / sign in (one screen each) ----------
async function flairs(){if(S.flairs)return S.flairs;try{const d=await getJ('data/depth.json');const n=new Set();(d.units||[]).forEach(u=>u.rows.forEach(r=>r.players.forEach(p=>n.add(p.name))));S.flairs=[...n].sort();}catch(e){S.flairs=[];}return S.flairs;}
async function authForm(el,mode,tok=S.rseq){const nxt=qs('next')||sessionStorage.getItem('bgd_next')||'';if(qs('next'))sessionStorage.setItem('bgd_next',qs('next'));
 if(S.me){goNext();return;}
 if(mode==='join'&&(localStorage.getItem('bgd_u13')||/(^|; )bgd_u13=/.test(document.cookie))){el.innerHTML=`<p><a class="back" href="#/forum">← Forum</a></p><div class="box"><h2>Sorry, you can't make an account</h2><p>You can still read the forum and use the rest of the site.</p></div>`;return;}
 const fl=mode==='join'?await flairs():[];if(stale(tok))return;
 el.innerHTML=`<p><a class="back" href="#/forum">← Forum</a></p>${nxt==='mock'?'<p class="box">Sign in or join to post your mock draft. You\'ll come right back to finish posting.</p>':nxt.startsWith('grade')?'<p class="box">Sign in or join to grade the team.</p>':nxt==='pickem'?`<p class="box fx-why">Sign in or join free to make your picks. You'll come right back to Pick 'Em.</p>`:nxt==='new'||nxt.startsWith('new:')?`<p class="box fx-why">To start a thread, ${mode==='join'?'join free below, or <a href="#/forum/signin">sign in</a> if you already have an account':'sign in below, or <a href="#/forum/join">join free</a>'}. You'll come right back to the new-thread form.</p>`:''}
 <form class="fx-form" id="fx-auth" novalidate>${mode==='join'?`<h2>Join Black &amp; Gold Dispatch</h2><p class="fine">Free. Takes 30 seconds. You stay signed in on this device.</p><p class="fx-fmline" id="fx-fmleft" hidden></p>
  <label for="f-u">Username <small>3-20 letters, numbers or _</small></label><input id="f-u" name="username" type="text" autocomplete="username" autocapitalize="off" required maxlength="20">
  <label for="f-e">Email <small>never shown publicly</small></label><input id="f-e" name="email" type="email" autocomplete="email" required>
  <label for="f-p">Password <small>8+ characters</small></label><div class="fx-pw"><input id="f-p" name="password" type="password" autocomplete="new-password" required minlength="8"><button type="button" class="pw-t">Show</button></div>
  <label for="f-d">Display name <small>optional</small></label><input id="f-d" name="display_name" type="text" maxlength="30" placeholder="Shown on your posts">
  <label for="f-f">Favorite player <small>optional flair</small></label><input id="f-f" name="flair" type="text" list="f-fl" maxlength="40" placeholder="e.g. T.J. Watt"><datalist id="f-fl">${fl.map(n=>`<option value="${E(n)}">`).join('')}</datalist>
  <label>Avatar <small>optional</small></label>${avPicker('','?')}
  <fieldset class="fx-dobset" style="border:0;padding:0;margin:0"><legend style="font-weight:800;margin:12px 0 4px;padding:0">Date of birth <small>we check it once and don't store it</small></legend>
  <div class="fx-dob"><div><span id="f-bm-l">Month</span><select id="f-bm" aria-labelledby="f-bm-l" autocomplete="bday-month"><option value="">Month</option>${MONTHS.map((m,i)=>`<option value="${i+1}">${m}</option>`).join('')}</select></div>
  <div class="d"><span id="f-bd-l">Day</span><input id="f-bd" aria-labelledby="f-bd-l" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" placeholder="DD" autocomplete="bday-day"></div>
  <div class="y"><span id="f-by-l">Year</span><input id="f-by" aria-labelledby="f-by-l" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="4" placeholder="YYYY" autocomplete="bday-year"></div></div>
  <input type="hidden" name="dob" id="f-b"><p class="fx-err" id="f-berr" role="alert" style="margin:6px 0 0"></p></fieldset>
  <p class="fine" style="margin:8px 0">By creating an account you agree to the <a href="legal/terms.html" target="_blank">Terms</a> and <a href="legal/community.html" target="_blank">Community Guidelines</a>, and you've read the <a href="legal/privacy.html" target="_blank">Privacy notice</a>.</p>`
 :`<h2>Sign in</h2><label for="f-l">Username or email</label><input id="f-l" name="login" type="text" autocomplete="username" autocapitalize="off" required>
  <label for="f-p">Password</label><div class="fx-pw"><input id="f-p" name="password" type="password" autocomplete="current-password" required><button type="button" class="pw-t">Show</button></div>`}
  <p class="fx-err" role="alert"></p><button class="fx-btn" type="submit" style="width:100%">${mode==='join'?'Create account':'Sign in'}</button>
  <p class="fine" style="text-align:center;margin-top:12px">${mode==='join'?'Already have an account? <a href="#/forum/signin">Sign in</a>':'New here? <a href="#/forum/join">Join free</a><br>Forgot your password? Use the <a href="#/contact?topic=Account%20help">Contact form</a> (topic "Account help") from your account\'s email. Moderators can\'t help with accounts in the forum.'}</p></form>`;
 const f=$('fx-auth');wirePicker(f,'?');if(mode==='join'){fmLeft();wireDob();}f.querySelector('.pw-t').onclick=e=>{const i=$('f-p');i.type=i.type==='password'?'text':'password';e.target.textContent=i.type==='password'?'Show':'Hide';};
 f.onsubmit=async e=>{e.preventDefault();const b=f.querySelector('button[type=submit]');const er=f.querySelector('.fx-err');er.textContent='';b.disabled=true;
  if(mode==='join'){const v=dobCheck(true);if(!v.ok){b.disabled=false;$('f-berr').textContent=v.msg;v.el&&v.el.focus();return;}$('f-b').value=v.iso;}
  const fd=Object.fromEntries(new FormData(f));
  const d=await api(mode==='join'?'auth/signup':'auth/login',{body:fd,timeout:25000});b.disabled=false;
  if(!d.ok&&d.blocked){try{localStorage.setItem('bgd_u13','1');}catch(x){}authForm(el,mode);return;}
  if(!d.ok){er.textContent=d.error||'Something went wrong.';if(d.field==='dob'){$('f-berr').textContent=d.error||'';$('f-bm')&&$('f-bm').focus();}else if(d.field){const i=f.querySelector(`[name=${d.field}]`);i&&i.focus();}return;}
  S.me=d.user;head();goNext();if(mode==='join'&&d.user&&d.user.founding)setTimeout(()=>toast(`Welcome! You're Founding Member #${+d.user.founding}. The badge shows next to your name on your posts and in the game chat.`),400);};}
// Date of birth: Month list + Day + Year typed with the number keypad (replaced the scroll-through calendar, Oct 20, 2026).
// Sent to the server as YYYY-MM-DD, the same format as before; the server still does the real 13+ check and throws the date away.
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
function dobCheck(final){const m=+$('f-bm').value,dS=$('f-bd').value.trim(),yS=$('f-by').value.trim(),d=+dS,y=+yS,now=new Date();
 [$('f-bm'),$('f-bd'),$('f-by')].forEach(x=>x.classList.remove('bad'));const bad=(el,msg)=>{if(final)el.classList.add('bad');return{ok:false,el,msg};};
 if(!m)return bad($('f-bm'),'Pick the month you were born.');
 if(!/^\d{1,2}$/.test(dS)||d<1||d>31)return bad($('f-bd'),'Type the day you were born, a number from 1 to 31.');
 if(!/^\d{4}$/.test(yS))return bad($('f-by'),'Type your birth year with 4 numbers, like 1985.');
 if(y<1900)return bad($('f-by'),'Please check the year. It should be 1900 or later.');
 const dim=new Date(Date.UTC(y,m,0)).getUTCDate();if(d>dim)return bad($('f-bd'),`${MONTHS[m-1]} ${y} only has ${dim} days. Please check the day.`);
 const iso=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;if(iso>now.toISOString().slice(0,10))return bad($('f-by'),'That date is in the future. Please check it.');
 return{ok:true,iso};}
function wireDob(){const dd=$('f-bd'),yy=$('f-by'),mm=$('f-bm'),er=$('f-berr');if(!dd)return;
 const digits=(el,n)=>{const v=el.value.replace(/\D/g,'').slice(0,n);if(v!==el.value)el.value=v;};
 dd.addEventListener('input',()=>{digits(dd,2);er.textContent='';if(dd.value.length===2||(dd.value.length===1&&+dd.value>3))yy.focus();});
 yy.addEventListener('input',()=>{digits(yy,4);er.textContent='';if(yy.value.length===4){const v=dobCheck(true);if(!v.ok)er.textContent=v.msg;}});
 mm.addEventListener('change',()=>{er.textContent='';if(mm.value&&!dd.value)dd.focus();});
 [dd,yy].forEach(x=>x.addEventListener('blur',()=>{if(dd.value&&yy.value.length===4&&mm.value){const v=dobCheck(true);er.textContent=v.ok?'':v.msg;}}));}
// "X of 250 Founding Member spots left" (real counts from the server; hidden if the count can't load)
async function fmLeft(){const b=$('fx-fmleft');if(!b)return;const d=await api('founding');if(!d.ok||!b.isConnected||!(d.total>0))return;
 b.innerHTML=d.left>0?`<b>${d.left} of ${d.total}</b> Founding Member spots left. The first ${d.total} forum members get a permanent Founding Member badge next to their name.`:`All ${d.total} Founding Member spots have been claimed. Thanks for joining!`;b.hidden=false;}
function goNext(){const n=sessionStorage.getItem('bgd_next')||'';sessionStorage.removeItem('bgd_next');
 location.hash=n==='mock'?'#/forum/new?mock=1':n==='new'?'#/forum/new':n.startsWith('new:')?'#/forum/new?cat='+encodeURIComponent(n.slice(4)):n.startsWith('grade')?'#/forum/'+n.replace(':','/'):n.startsWith('thread')?'#/forum/'+n.replace(':','/'):n==='pickem'||n==='trivia'?'#/forum/'+n:n==='live'?'#/live':'#/forum';}
function needSignIn(next){sessionStorage.setItem('bgd_next',next);location.hash='#/forum/join';}

async function claimView(el,tok){
 el.innerHTML=`<form class="fx-form" id="fx-claim" novalidate><h2>Claim the owner account</h2><p class="fine">This private one-time link sets the password for the site owner account. It works once and expires 7 days after it was made.</p>
  <label for="c-e">Email for the account <small>never shown publicly</small></label><input id="c-e" name="email" type="email" autocomplete="email" value="blackandgolddispatch@gmail.com">
  <label for="c-p">New password <small>10+ characters</small></label><div class="fx-pw"><input id="c-p" name="password" type="password" autocomplete="new-password" minlength="10"><button type="button" class="pw-t">Show</button></div>
  <p class="fx-err" role="alert"></p><button class="fx-btn" type="submit" style="width:100%">Set password and sign in</button></form>`;
 const f=$('fx-claim');f.querySelector('.pw-t').onclick=e=>{const i=$('c-p');i.type=i.type==='password'?'text':'password';e.target.textContent=i.type==='password'?'Show':'Hide';};
 f.onsubmit=async e=>{e.preventDefault();const b=f.querySelector('button[type=submit]');b.disabled=true;const d=await api('auth/claim',{body:{token:tok,email:$('c-e').value,password:$('c-p').value}});b.disabled=false;
  if(!d.ok){f.querySelector('.fx-err').textContent=d.error;return;}S.me=d.user;head();location.replace('#/forum/mod');toast('Welcome, '+d.user.display_name+'! You are signed in as the owner. This is your Mod queue.');};}
async function profile(el){if(!S.me){location.hash='#/forum/signin';return;}const fl=await flairs();
 el.innerHTML=`<p><a class="back" href="#/forum">← Forum</a></p><form class="fx-form" id="fx-prof"><h2>Your profile</h2><div style="display:flex;gap:14px;align-items:center">${av(S.me.avatar,S.me.display_name,S.me.id,S.me.av_v,'lg',S.me.av_pending)}<p class="fine" style="margin:0">Signed in as <b>${E(S.me.username)}</b>${S.me.role!=='user'?' · '+roleTag(S.me.role):''}${S.me.founding?' · '+fmTag(S.me.founding):''}<br><b>${rank(S.me.posts||0)}</b> · ${S.me.posts||0} posts · Joined ${joined(S.me.joined)}${S.me.av_pending?'<br><span class="fx-pend">Your new picture is waiting for a moderator. Only you can see it for now.</span>':''}</p></div>
 <label for="p-d">Display name</label><input id="p-d" name="display_name" type="text" maxlength="30" value="${E(S.me.display_name)}">
 <label for="p-f">Favorite player flair</label><input id="p-f" name="flair" type="text" list="p-fl" maxlength="40" value="${E(S.me.flair)}"><datalist id="p-fl">${fl.map(n=>`<option value="${E(n)}">`).join('')}</datalist>
 <label for="p-b">Bio <small>optional, 200 characters</small></label><textarea id="p-b" name="bio" rows="2" maxlength="200">${E(S.me.bio||'')}</textarea>
 <label>Avatar</label>${avPicker(S.me.avatar==='u'||S.me.av_pending?'__keep':S.me.avatar,S.me.display_name)}
 <p class="fx-err" role="status"></p><button class="fx-btn" type="submit">Save</button> <button class="fx-btn ghost" type="button" id="p-out">Sign out</button>
 <p class="fine" style="margin-top:12px">Email verification and password reset by email are coming soon. Locked out? Use the <a href="#/contact?topic=Account%20help">Contact form</a>.</p></form>
 <div class="fx-form" id="fx-acct"><h3>Your account and data</h3>
 <p class="fine">Sign-ins last 90 days on each device. <a href="legal/privacy.html">Privacy notice</a></p>
 <p><button class="fx-btn ghost sm" type="button" id="p-all">Sign out everywhere</button> <a class="fx-btn ghost sm" href="/api/me/export" download>Download my data (JSON)</a></p>
 <details><summary><b>Delete my account</b></summary><p class="fine">This removes your profile, email, avatar, sign-ins, reactions, grades, picks and trivia scores. Your posts stay but show "Deleted user", unless you tick the box to remove them too. This can't be undone.</p>
 <label class="chk"><input type="checkbox" id="p-rm"> Also remove all my posts</label>
 <label for="p-pw">Your password, to confirm</label><input id="p-pw" type="password" autocomplete="current-password">
 <p class="fx-err" id="p-derr" role="alert"></p><button class="fx-btn dark sm" type="button" id="p-del">Delete my account for good</button></details></div>`;
 $('p-all').onclick=async()=>{if(!confirm('Sign out on every device, including this one?'))return;await api('auth/logout-all',{body:{}});S.me=null;head();location.hash='#/forum';toast('Signed out everywhere.');};
 const pd=$('p-del');if(S.me.role==='owner'){pd.disabled=true;$('p-derr').textContent='The owner account can\'t be deleted here.';}
 pd.onclick=async()=>{if(!confirm('Delete your account for good?'))return;const d=await api('me/delete',{body:{password:$('p-pw').value,remove_posts:$('p-rm').checked}});if(!d.ok){$('p-derr').textContent=d.error;return;}S.me=null;head();location.hash='#/forum';toast('Your account was deleted.');};
 wirePicker($('fx-prof'),S.me.display_name);
 $('fx-prof').onsubmit=async e=>{e.preventDefault();const fd=Object.fromEntries(new FormData(e.target));if(fd.avatar==='__keep')delete fd.avatar;const d=await api('me',{body:fd});const m=e.target.querySelector('.fx-err');
  if(d.ok){S.me=d.user;head();if('avatar' in fd&&String(fd.avatar).startsWith('data:'))toast('Saved. Your new picture will show to everyone once a moderator approves it.');profile($('forum-body'));}else{m.className='fx-err';m.textContent=d.error;}};
 $('p-out').onclick=async()=>{await api('auth/logout',{body:{}});S.me=null;head();location.hash='#/forum';};}

// ---------- new thread (also used for Fan Mock Drafts) ----------
function mockText(m){const L=[];m.teams.forEach(t=>{L.push(`${t.name}${t.grade?' (Draft Desk grade: '+t.grade+')':''}`);if(t.needs&&t.needs.length)L.push('Team needs: '+t.needs.join(', '));
  const by={};t.picks.forEach(p=>(by[p.round]=by[p.round]||[]).push(p));Object.keys(by).sort((a,b)=>a-b).forEach(r=>{L.push(`Round ${r}:`);by[r].forEach(p=>L.push(`  #${p.overall} ${p.name}, ${p.pos}, ${p.school}${p.grade?' · grade '+p.grade:''}`));});L.push('');});
 return L.join('\n').trim();}
async function newThread(el){if(!S.me){needSignIn(qs('mock')?'mock':qs('cat')?'new:'+qs('cat'):'new');return;}
 let mock=null;if(qs('mock')){try{mock=JSON.parse(sessionStorage.getItem('bgd_mock')||'null');}catch(e){}}
 const cats=(S.cats.length?S.cats:['Depth Chart & Roster','Draft','Fan Mock Drafts','General Steelers','Off-Topic']).filter(c=>c!=='Game Day'||S.me.role!=='user');
 const pit=mock&&(mock.teams.find(t=>t.team==='PIT')||mock.teams[0]);
 el.innerHTML=`<p><a class="back" href="#/forum">← Forum</a></p><form class="fx-form" id="fx-new"><h2>${mock?'Post your mock draft':'Start a thread'}</h2>
 ${mock?`<input type="hidden" name="cat" value="Fan Mock Drafts"><p class="fine">Category: <b>Fan Mock Drafts</b></p>`:`<label for="n-c">Category</label><select id="n-c" name="cat">${cats.map(c=>`<option ${c===(cats.includes(qs('cat'))?qs('cat'):'Off-Topic')?'selected':''}>${E(c)}</option>`).join('')}</select>`}
 <label for="n-t">Title</label><input id="n-t" name="title" type="text" maxlength="120" required value="${mock?E(`${S.me.display_name}'s ${mock.rounds}-round mock${pit&&pit.grade?' (Draft Desk grade: '+pit.grade+')':''}`):''}">
 ${mock?`<label>Your picks</label><pre class="box" style="white-space:pre-wrap;font-size:.9rem;max-height:320px;overflow:auto">${E(mockText(mock))}</pre><label for="n-b">Add a comment <small>optional</small></label>`:'<label for="n-b">Post</label>'}
 <textarea id="n-b" name="body" rows="${mock?3:7}" ${mock?'':'required'} placeholder="${mock?'Why you made these picks…':'What\'s on your mind?'}"></textarea><p class="fx-cnt" id="n-cnt" aria-live="polite"></p>
 <p class="fx-err" role="alert"></p><button class="fx-btn" type="submit" style="width:100%">${mock?'Post to Forum':'Post thread'}</button></form>`;
 wireCount($('n-b'),$('n-cnt'));
 $('fx-new').onsubmit=async e=>{e.preventDefault();const f=e.target,b=f.querySelector('button[type=submit]'),er=f.querySelector('.fx-err');er.textContent='';if(!mock&&$('n-b').value.trim().length>POST_MAX){er.textContent=countMsg($('n-b').value.trim().length).t;return;}b.disabled=true;
  const fd=Object.fromEntries(new FormData(f));if(mock){fd.kind='mock';fd.mock=mock;fd.body=(fd.body?fd.body.trim()+'\n\n':'')+mockText(mock);}
  const d=await api('forum/threads',{body:fd,timeout:25000});b.disabled=false;if(!d.ok){er.textContent=d.error;return;}
  if(mock)sessionStorage.removeItem('bgd_mock');location.hash='#/forum/thread/'+d.id;};}

// ---------- thread view with live polling ----------
function postHTML(p,T){const mine=new Set((T.mine||[]).filter(x=>x.post_id===p.id).map(x=>x.emoji));const c={};(T.reactions||[]).filter(x=>x.post_id===p.id).forEach(x=>c[x.emoji]=x.n);
 const mod=S.me&&(S.me.role==='mod'||S.me.role==='owner');
 return `<article class="fx-post${p.hidden?' hid':''}" id="p${p.id}" data-id="${p.id}"><div class="who2">${av(p.av,p.name,p.user_id,p.av_v,'',!!(S.me&&S.me.id===p.user_id&&S.me.av_pending))}<div class="who"><b>${E(p.name)}</b>${roleTag(p.role)}${fmTag(p.fm)}${p.flair?`<span class="fx-flair">${E(p.flair)}</span>`:''}<small>${ago(p.created)}${p.hidden?' · hidden':''}</small>${p.role==='bot'?'':`<span class="stat"><span class="rk">${rank(p.posts_n||0)}</span> · ${p.posts_n||0} posts · Joined ${joined(p.joined)}</span>`}</div></div>
 <div class="tx">${fmtBody(p.body)}</div><div class="fx-rx">${S.emoji.map(em=>{const [ic,lb]=RX[em]||[em,em];return `<button type="button" class="rx${mine.has(em)?' on':''}" data-e="${em}" aria-label="${lb}" aria-pressed="${mine.has(em)}" title="${lb}"><span class="l">${lb}</span><small>${c[em]?' '+c[em]:''}</small></button>`;}).join('')}
 <span class="sp"></span><button type="button" class="lnk qt">Reply</button> ${p.role!=='bot'?`<button type="button" class="lnk rep">Report</button>`:''}${mod&&p.av==='u'?` <button type="button" class="lnk rmav" data-u="${p.user_id}">Remove picture</button>`:''}${mod?` <button type="button" class="lnk mod" data-a="${p.hidden?'unhide':'hide'}">${p.hidden?'Unhide':'Hide'}</button> <button type="button" class="lnk mod" data-a="delete">Delete</button>${p.role==='user'&&p.user_id>2&&!p.hidden?` <button type="button" class="lnk fp" data-a="feature">Feature</button>`:''}${p.role==='user'?` <button type="button" class="lnk ban" data-u="${E(p.username)}">Ban</button>`:''}`:''}</div></article>`;}
async function threadView(el,id,tok=S.rseq){el.innerHTML='<p class="empty">Loading thread…</p>';const d=await api('forum/thread/'+id);
 if(stale(tok))return;document.querySelectorAll('.fx-reply,.fx-jump').forEach(n=>n.remove());
 if(!d.ok){el.innerHTML=`<p><a class="back" href="#/forum">← Forum</a></p><p class="fx-err">${E(d.error)}</p>`;return;}
 S.me=d.me;head();if(d.emoji)S.emoji=d.emoji;const T=S.thread={id,th:d.thread,posts:d.posts,reactions:d.reactions,mine:d.mine};S.last=d.posts.length?d.posts[d.posts.length-1].id:0;
 const th=d.thread,mod=S.me&&(S.me.role==='mod'||S.me.role==='owner');
 el.innerHTML=`<p><a class="back" href="#/forum">← Forum</a></p>${th.game?'<div class="fx-score" id="fx-score"><small>Loading score…</small></div>':''}
 <h2 style="margin:6px 0">${E(th.title)}</h2>${th.kind==='gameday'?'<div id="fx-livebadge"></div>':''}<p class="fine">${E(th.cat)} · started ${ago(th.created)}${th.locked?' · '+tag('Locked','dim'):''}${th.hidden?' · '+tag('Hidden','dim'):''}</p>
 ${th.grade?`<a class="fx-gd" href="#/forum/grade/${E(th.game_id)}">${tag('Open','gold')}<b>Grade the Team</b><small>Grade every player who played, plus the coaches. Open for 7 days after the game.</small></a>`:''}
 ${mod?`<p class="fx-rx"><button type="button" class="fx-btn ghost sm tmod" data-a="${th.pinned?'unpin':'pin'}">${th.pinned?'Unpin':'Pin'}</button> <button type="button" class="fx-btn ghost sm tmod" data-a="${th.locked?'unlock':'lock'}">${th.locked?'Unlock':'Lock'}</button> <button type="button" class="fx-btn ghost sm tmod" data-a="${th.hidden?'unhide':'hide'}">${th.hidden?'Unhide thread':'Hide thread'}</button></p>`:''}
 <div class="fx-posts" id="fx-posts">${T.posts.map(p=>postHTML(p,T)).join('')}</div>`;
 const bar=document.createElement('div');bar.className='fx-reply';
 // sit above the cookie banner until it's dismissed, and above the on-screen keyboard on iPad/iPhone (visualViewport)
 const vv=window.visualViewport;const lift=()=>{if(!bar.isConnected)return clearInterval(bar._t);const cb=$('cookie-banner');const r=cb&&!cb.hidden&&getComputedStyle(cb).display!=='none'?cb.getBoundingClientRect():null;const h=r&&r.height?Math.max(0,Math.round(innerHeight-r.top)):0;
  const kb=vv?Math.max(0,Math.round(innerHeight-vv.height-vv.offsetTop)):0;const v=Math.max(h,kb>60?kb:0)+'px';if(bar.style.bottom!==v)bar.style.bottom=v;
  const j=document.querySelector('.fx-jump');if(j){const jb=Math.round(parseInt(v)+bar.offsetHeight+12)+'px';if(j.style.bottom!==jb)j.style.bottom=jb;}};   // keep "Jump to latest" above the reply box as it growsbar._t=setInterval(lift,800);setTimeout(lift,0);
 if(vv){vv.addEventListener('resize',lift);vv.addEventListener('scroll',lift);S.vvOff=()=>{vv.removeEventListener('resize',lift);vv.removeEventListener('scroll',lift);};}
 bar.innerHTML=S.me?(th.locked&&!mod?'<p class="fine" style="margin:0;flex:1;text-align:center">This thread is locked.</p>':`<label class="sr" for="fx-ta">Reply</label><textarea id="fx-ta" rows="1" placeholder="Write a reply…" enterkeyhint="enter"></textarea><button class="fx-btn" type="button" id="fx-send">Post</button><p class="fx-cnt" id="fx-rmsg" role="status" aria-live="polite"></p>`)
  :`<a class="fx-btn" style="flex:1" href="#/forum/join" onclick="sessionStorage.setItem('bgd_next','thread:${id}')">Join free to post</a><a class="fx-btn ghost" href="#/forum/signin" onclick="sessionStorage.setItem('bgd_next','thread:${id}')">Sign in</a>`;
 document.body.appendChild(bar);
 const jump=document.createElement('button');jump.type='button';jump.className='fx-jump';jump.textContent='↓ Jump to latest';jump.hidden=true;document.body.appendChild(jump);
 jump.onclick=()=>{const l=$('fx-posts').lastElementChild;l&&l.scrollIntoView({behavior:'smooth',block:'end'});jump.hidden=true;jump.textContent='↓ Jump to latest';};
 const nearBottom=()=>innerHeight+scrollY>document.documentElement.scrollHeight-260;
 S.onScroll=()=>{if(!S.thread)return;jump.hidden=nearBottom();};removeEventListener('scroll',S.onScrollBound||(()=>{}));S.onScrollBound=S.onScroll;addEventListener('scroll',S.onScroll,{passive:true});
 {const fp=+qs('p');if(fp)setTimeout(()=>{const t=$('p'+fp);if(t){t.scrollIntoView({block:'center'});t.classList.add('fx-hl');}},120);}
 if(mod)fanPostData().then(d=>{if(d&&d.post&&d.post.pinned){const b=document.querySelector('#p'+d.post.id+' .lnk.fp');if(b){b.dataset.a='unfeature';b.textContent='Unfeature';}}});
 setTimeout(()=>{jump.hidden=nearBottom();if(th.kind==='gameday'&&!location.hash.includes('top')&&!qs('p')){const l=$('fx-posts').lastElementChild;l&&l.scrollIntoView({block:'end'});}},50);
 const send=bar.querySelector('#fx-send');if(send){const ta=bar.querySelector('#fx-ta'),msg=bar.querySelector('#fx-rmsg'),dk='bgd_draft_'+id;
  try{const dv=sessionStorage.getItem(dk);if(dv)ta.value=dv;}catch(e){}   // a reply that didn't post is kept on this device
  const grow=()=>{const atEnd=ta.selectionEnd>=ta.value.length-1;const cap=Math.round(innerHeight*0.4);ta.style.height='auto';ta.style.height=Math.min(cap,ta.scrollHeight+4)+'px';if(atEnd)ta.scrollTop=ta.scrollHeight;};
  const cnt=wireCount(ta,msg);ta.addEventListener('input',()=>{grow();lift();try{ta.value?sessionStorage.setItem(dk,ta.value):sessionStorage.removeItem(dk);}catch(e){}});if(ta.value)setTimeout(grow,0);
  const say=(t)=>{msg.textContent=t;msg.className='fx-cnt bad';msg.dataset.err=t?'1':'';};
  send.onclick=async()=>{const v=ta.value.trim();if(!v){say('Write something first.');ta.focus();return;}
   if(v.length>POST_MAX){say(countMsg(v.length).t);ta.focus();return;}
   send.disabled=true;send.textContent='Posting…';msg.dataset.err='';const r=await api(`forum/thread/${id}/posts`,{body:{body:v},timeout:25000});send.disabled=false;send.textContent='Post';
   if(!r.ok){say(r.status===401?'You were signed out. Sign in again and your reply will still be here.':(r.error||'Your reply didn\'t post. Please try again.')+' Your reply is still in the box.');return;}
   ta.value='';ta.style.height='';try{sessionStorage.removeItem(dk);}catch(e){}msg.dataset.err='';cnt();await pull(true);};}
 if(th.game)liveScore(th.game,th.kind);if(th.kind==='gameday')liveBadge();
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
 try{[live,sched]=await Promise.all([fetch('/api/live',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).catch(()=>getJ('data/live.json')).catch(()=>null),getJ('data/schedule.json').catch(()=>null)]);}catch(e){}
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
 if(b.classList.contains('qt')){if(!S.me){sessionStorage.setItem('bgd_next','thread:'+S.thread.id);location.hash='#/forum/signin';return;}const ta=$('fx-ta');if(!ta)return;const name=post.querySelector('.who b').textContent;
  const txt=[...post.querySelector('.tx').childNodes].filter(n=>!(n.nodeName==='BLOCKQUOTE')).map(n=>n.textContent).join('').trim().slice(0,280);ta.value=`> ${name} wrote: ${txt.replace(/\n+/g,' ')}\n\n`+ta.value;ta.focus();ta.setSelectionRange(ta.value.length,ta.value.length);return;}
 if(b.classList.contains('rmav')){if(!confirm('Remove this fan\'s picture? They\'ll show initials instead and get a strike.'))return;const d=await api('mod/avatar',{body:{user_id:+b.dataset.u,action:'remove',strike:true}});toast(d.ok?'Picture removed.':d.error);if(d.ok)render();return;}
 if(b.classList.contains('rx')){if(!S.me){sessionStorage.setItem('bgd_next','thread:'+S.thread.id);toast('Sign in or join free to react. You\'ll come right back here.');location.hash='#/forum/signin';return;}
  const d=await api('forum/react',{body:{post_id:pid,emoji:b.dataset.e}});if(!d.ok){toast(d.error);return;}b.classList.toggle('on',d.on);b.querySelector('small').textContent=d.count?' '+d.count:'';
  const T=S.thread;if(T){T.mine=T.mine.filter(x=>!(x.post_id===pid&&x.emoji===b.dataset.e));if(d.on)T.mine.push({post_id:pid,emoji:b.dataset.e});T.reactions=T.reactions.filter(x=>!(x.post_id===pid&&x.emoji===b.dataset.e));if(d.count)T.reactions.push({post_id:pid,emoji:b.dataset.e,n:d.count});}return;}
 if(b.classList.contains('rep')){if(!S.me){sessionStorage.setItem('bgd_next','thread:'+S.thread.id);location.hash='#/forum/signin';return;}
  const m=document.createElement('div');m.className='fx-modal';m.innerHTML=`<div class="in" role="dialog" aria-label="Report post"><h3>Report this post</h3><div class="opts">${['Spam or ads','Harassment or hate','Inappropriate picture or name','Off-topic or trolling','Copied article or photo',R_NCII,R_CSAM,'Something else'].map(r=>`<button class="fx-btn ghost" type="button" data-r="${r}">${r}</button>`).join('')}</div><p class="fine" style="margin:0 0 8px">Reports of illegal content or intimate images hide the post right away. Please don't share, screenshot or download such material. <a href="legal/intimate-images.html">Intimate image removal</a></p><button class="fx-btn dark" type="button" data-x style="width:100%">Cancel</button></div>`;
  document.body.appendChild(m);m.onclick=async ev=>{const o=ev.target.closest('[data-r]');if(ev.target===m||ev.target.closest('[data-x]')){m.remove();return;}if(!o)return;if(o.dataset.r===R_CSAM&&!confirm('Report this as illegal content (child sexual abuse material)? The post is removed for everyone at once and kept securely so it can be reported to the National Center for Missing & Exploited Children. Please do not save, screenshot or share it.'))return;const d=await api('forum/report',{body:{post_id:pid,reason:o.dataset.r}});m.remove();toast(d.ok?(d.restricted?'Thank you. The post has been removed and will be reported to the authorities.':d.hidden?'Thank you. The post is hidden while a moderator checks it (within 48 hours).':'Thanks. A moderator will take a look.'):d.error);if(d.ok&&(d.restricted||d.hidden)&&!(S.me&&(S.me.role==='mod'||S.me.role==='owner'))){const a=document.querySelector(`.fx-post[data-id="${pid}"]`);a&&a.remove();}};return;}
 if(b.classList.contains('fp')){const d=await api('forum/fanpost',{body:{post_id:pid,action:b.dataset.a}});if(!d.ok){toast(d.error);return;}
  document.querySelectorAll('.fx-post .lnk.fp').forEach(x=>{x.dataset.a='feature';x.textContent='Feature';});if(d.featured){b.dataset.a='unfeature';b.textContent='Unfeature';}
  toast(d.featured?'Pinned as Fan Post of the Week.':'Removed as Fan Post of the Week. The automatic pick takes over.');return;}
 if(b.classList.contains('mod')){if(b.dataset.a==='delete'&&!confirm('Delete this post for good?'))return;const d=await api('mod/post',{body:{post_id:pid,action:b.dataset.a}});if(!d.ok){toast(d.error);return;}
  if(b.dataset.a==='delete')post.remove();else{post.classList.toggle('hid',b.dataset.a==='hide');b.dataset.a=b.dataset.a==='hide'?'unhide':'hide';b.textContent=b.dataset.a==='hide'?'Hide':'Unhide';}return;}
 if(b.classList.contains('ban')){const days=prompt(`Ban ${b.dataset.u} for how many days? (0 = lift a ban)`,'7');if(days===null)return;const d=await api('mod/ban',{body:{username:b.dataset.u,days:+days,reason:'Moderator action'}});toast(d.ok?(d.banned_until?'Banned until '+new Date(d.banned_until).toLocaleDateString():'Ban lifted.'):d.error);return;}
 if(b.classList.contains('tmod')){const d=await api('mod/thread',{body:{thread_id:S.thread.id,action:b.dataset.a}});if(!d.ok){toast(d.error);return;}render();}});

// ---------- Grade the Team ----------
async function gradeView(el,gid){el.innerHTML='<p class="empty">Loading ballot…</p>';const d=await api('grades/ballot'+(gid?'?game='+encodeURIComponent(gid):''));
 if(!d.ok){el.innerHTML=`<p class="fx-err">${E(d.error)}</p>`;return;}if(!d.ballot){el.innerHTML=tabs('gameday')+'<p class="box">No game to grade yet. Grading opens at the final whistle.</p>';return;}
 S.me=d.me;const b=d.ballot,mine={};d.mine.forEach(x=>mine[x.item]=x.grade);const av=d.averages.items;
 const groups=['Team','Offense','Defense'];const done=Object.keys(mine).length;
 el.innerHTML=`<p><a class="back" href="#/forum/gameday">← Game Day</a></p><div class="fx-grade"><h2 style="margin:0">Grade the Team</h2><p style="margin:4px 0"><b>${E(b.label)}</b></p>
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
 const gd=S.api?await api('forum/gameday'):null,g=gd&&gd.game,ch=gd&&gd.chat;const nx=sched&&sched.next;
 let h=tabs('gameday')+liveCard(ch);
 if(ch&&(!g||g.gameday_thread!==ch.thread))h+=`<a class="fx-gd" href="#/forum/thread/${ch.thread}">${tag('Game Day','gold')}<b>${E(ch.title)}</b><small>Talk about the game here or in the Live Hub game chat · ${ch.posts} posts</small></a>`;
 if(g){h+=`${g.gameday_thread?`<a class="fx-gd" href="#/forum/thread/${g.gameday_thread}">${g.final?tag('Game Day','gold'):tag('Live','gold')}<b>Game Day Chat: ${E(g.label)}</b><small>${g.final?'Game over · read the live chat':'Live chat · score at the top updates on its own'}</small></a>`:''}
  ${g.postgame_thread?`<a class="fx-gd" href="#/forum/thread/${g.postgame_thread}">${tag('Post-Game','gold')}<b>Post-Game Thread</b><small>Takeaways and reactions</small></a>`:''}
  ${g.grading_open?`<a class="fx-gd" href="#/forum/grade/${E(g.game_id)}">${tag('Open','gold')}<b>Grade the Team</b><small>Open for 7 days after the final whistle</small></a>`:''}`;}
 if(nx)h+=`<div class="box"><h3 style="margin-top:0">Next game</h3><p><b>Steelers ${nx.home?'vs':'at'} ${E(nx.opponent)}</b><br>${E(nx.week)} · ${E(etTime(nx.date))}${nx.venue?' · '+E(nx.venue):''}</p>
  <p class="fine">${S.api?'The game-day chat thread opens on its own up to a week before kickoff and gets pinned to the top of the forum. Messages from the Live Hub game chat are saved in it. The post-game thread and Grade the Team poll open at the final whistle.':'Game-day threads open here when fan accounts go live.'}</p><p><a class="fx-btn ghost sm" href="#/opponent">Opponent preview →</a></p></div>`;
 el.innerHTML=h;}

// ---------- Illegal-content hold (mod queue section) + moderator procedure page ----------
function restrictedHTML(d,own){const L=d.restricted||[];const held=L.filter(r=>r.status==='held').length;
 return `<h2 class="section-title">Illegal content hold <small>${held?held+' waiting for a report':'nothing waiting'}</small></h2>
 <div class="box fx-csam"><p><b>Never open, download, screenshot or share suspected child sexual abuse material.</b> Reported items are hidden from everyone (moderators too), with no preview, and kept for 1 year as the law requires (18 U.S.C. 2258A). ${own?`<b>Owner:</b> report each item to NCMEC's CyberTipline at <a href="${CYBERTIP}" target="_blank" rel="noopener noreferrer">report.cybertip.org</a> as soon as you can, using the account details below (not the image), then record the report number here.`:`The owner reports each item to NCMEC's CyberTipline (<a href="${CYBERTIP}" target="_blank" rel="noopener noreferrer">report.cybertip.org</a>). If you see something, use "Report as illegal" and tell the owner.`} <a href="#/forum/procedure">Read the moderator procedure →</a></p></div>
 ${L.map(r=>`<div class="fx-post" data-rs="${r.id}"><div class="who"><b>${r.kind==='avatar'?'Profile picture':'Post'} by @${E(r.author_username||'?')}</b><small>${new Date(r.created).toLocaleString()} · ${E(r.status==='held'?'NOT YET REPORTED':r.status==='reported'?'Reported'+(r.cybertip?' · CyberTipline #'+r.cybertip:''):r.status==='extended'?'Hold extended':'Released (report was wrong)')} · kept until ${new Date(r.hold_until).toLocaleDateString()}</small></div>
 <p class="fine">${E(r.reason||'')}${own?` · account #${r.author_id}, email ${E(r.author_email||'?')}, joined ${r.author_created?new Date(r.author_created).toLocaleDateString():'?'}, scrambled IP ${E(r.author_ip||'not recorded')} · reported by user #${r.reporter_id||'?'} (IP ${E(r.reporter_ip||'?')})${r.thread_id?` · thread #${r.thread_id}`:''}${r.note?' · '+E(r.note):''}`:''}</p>
 ${own?`<div class="fx-rx">${r.status==='held'?`<a class="fx-btn sm" href="${CYBERTIP}" target="_blank" rel="noopener noreferrer">Open CyberTipline</a><button type="button" class="fx-btn sm rsq" data-a="reported">Record report number</button>`:''}<button type="button" class="fx-btn dark sm rsq" data-a="ban">Ban account</button>${r.status!=='released'?`<button type="button" class="fx-btn ghost sm rsq" data-a="extend">Extend hold</button>`:''}${r.status==='held'&&r.kind==='post'?`<button type="button" class="fx-btn ghost sm rsq" data-a="release">Release (wrong report)</button>`:''}</div>`:''}</div>`).join('')}`;}
function procView(el){const mod=S.me&&(S.me.role==='mod'||S.me.role==='owner');if(!mod){el.innerHTML=tabs('mod')+'<p class="box">Moderators only.</p>';return;}
 el.innerHTML=tabs('mod')+`<div class="fx-form fx-proc"><h2>Moderator procedure: illegal content and intimate images</h2>
 <h3>If you see suspected child sexual abuse material (CSAM)</h3><ol>
 <li><b>Do not</b> download, save, screenshot, copy, forward or share it, not even to "show" someone. Doing so can itself be a crime.</li>
 <li>Tap <b>Report</b> on the post and pick "Illegal content (child sexual abuse material)", or use <b>Report as illegal</b> in the Mod queue. The post (and any uploaded picture of that account) is hidden from everyone at once, with no preview, and moved to a locked hold. Nothing is deleted.</li>
 <li>Tell the owner (David) that you used it. Don't describe the image in public threads.</li>
 <li><b>The owner</b> files a report with NCMEC's CyberTipline at <a href="${CYBERTIP}" target="_blank" rel="noopener noreferrer">report.cybertip.org</a> as soon as reasonably possible, using the details in the hold list (username, email, join date, scrambled IP, time, thread). Then he records the report number, and bans the account.</li>
 <li>The material is kept for <b>1 year</b> (18 U.S.C. 2258A, as extended by the REPORT Act), then deleted automatically. If law enforcement asks, the owner taps "Extend hold" and notes the request. Only the owner can see the hold list details; nobody can view the content through the site.</li>
 <li>If a child may be in immediate danger, call 911 first.</li></ol>
 <h3>Intimate images shared without consent (TAKE IT DOWN Act)</h3><ol>
 <li>Reports with this reason hide the post right away and go to the top of the queue with a 48-hour deadline.</li>
 <li>If the request is valid (from the person shown, or someone acting for them), <b>Delete</b> the post, and remove any copies you can find, within 48 hours.</li>
 <li>Requests can also arrive through the Contact form (topic "Intimate image removal"); the owner handles those the same way.</li></ol>
 <h3>Everything else</h3><p>Use Hide, Delete, Remove picture and Ban as described in the <a href="legal/community.html">Community Guidelines</a>. Never help anyone get into an account through the forum: account problems go through the <a href="#/contact">Contact form</a> only.</p>
 <p><a class="fx-btn sm" href="#/forum/mod">← Back to the Mod queue</a></p></div>`;}

// ---------- Moderator queue ----------
async function modView(el){el.innerHTML=tabs('mod')+'<p class="empty">Loading reports…</p>';const d=await api('mod/reports');if(!d.ok){el.innerHTML=tabs('mod')+`<p class="fx-err">${E(d.error)}</p>`;return;}
 const pq=await api('mod/avatars');const own=S.me.role==='owner';const mq=own?await api('mod/messages'):null;const MS=mq&&mq.ok?mq.messages:[];
 el.innerHTML=tabs('mod')+`${own?`<h2 class="section-title">Messages <small>(Contact &amp; Suggestions${MS.filter(m=>!m.read).length?' · '+MS.filter(m=>!m.read).length+' new':''})</small></h2>${MS.length?MS.map(m=>`<div class="fx-post fx-msg${m.read?' hid':''}${m.topic==='Intimate image removal'?' fx-ncii':''}" data-m="${m.id}">${m.topic==='Intimate image removal'&&!m.read?`<p class="fx-due">Intimate image removal request: act by ${new Date(m.created+48*36e5).toLocaleString([], {weekday:'short',hour:'numeric',minute:'2-digit'})} (48 hours) if valid.</p>`:''}<div class="who"><b>${E(m.topic)}</b><small>${E(m.name||'Anonymous')}${m.email?` · <a href="mailto:${E(m.email)}?subject=${encodeURIComponent('Re: your message to Black & Gold Dispatch')}">${E(m.email)}</a>`:' · no email'} · ${ago(m.created)}${m.read?'':' · <b>NEW</b>'}</small></div><div class="tx">${E(m.body)}</div>
 <div class="fx-rx"><button type="button" class="fx-btn sm msq" data-a="${m.read?'unread':'read'}">${m.read?'Mark unread':'✓ Mark read'}</button><button type="button" class="fx-btn ghost sm msq" data-a="delete">Delete</button></div></div>`).join(''):'<p class="box">No messages yet.</p>'}`:''}
 ${restrictedHTML(d,own)}
 <h2 class="section-title">Pictures waiting for approval</h2>${!d.uploads_on?'<p class="box">Picture uploads are turned off. Fans can pick only the preset avatars or their initials, so there is nothing to approve.</p>':''}${pq.ok&&pq.pending.length?`<div class="fx-avq">${pq.pending.map(u=>`<div class="c" data-u="${u.id}"><img src="/api/avatar/${u.id}?pending=1&t=${Date.now()}" alt="Pending picture from ${E(u.display_name)}"><p><b>${E(u.display_name)}</b> <small>@${E(u.username)}${u.strikes?' · '+u.strikes+' strike'+(u.strikes>1?'s':''):''}</small></p><div class="b"><button type="button" class="fx-btn avq" data-a="approve">✓ Approve</button><button type="button" class="fx-btn dark avq" data-a="reject">✕ Reject</button><button type="button" class="fx-btn ghost sm avq" data-a="illegal">Report as illegal</button></div></div>`).join('')}</div>`:d.uploads_on?'<p class="box">No pictures waiting.</p>':''}
 <h2 class="section-title">Reported posts</h2>${d.reports.length?d.reports.map(r=>{const nc=(r.reasons||'').includes(R_NCII);return `<div class="fx-post${r.hidden?' hid':''}${nc?' fx-ncii':''}" data-id="${r.post_id}"><div class="who"><b>${E(r.author)}</b><small>in <a href="#/forum/thread/${r.thread_id}">${E(r.title)}</a> · ${r.reports} report${r.reports>1?'s':''}: ${E(r.reasons||'')}</small></div>${nc?`<p class="fx-due">Intimate image report: remove it by ${new Date(r.last+48*36e5).toLocaleString([], {weekday:'short',hour:'numeric',minute:'2-digit'})} (48 hours) if the request is valid. Links are not clickable here.</p><div class="tx">${E(r.body)}</div>`:`<div class="tx">${fmtBody(r.body)}</div>`}
 <div class="fx-rx"><button type="button" class="fx-btn sm qm" data-a="${r.hidden?'unhide':'hide'}">${r.hidden?'Unhide':'Hide'}</button><button type="button" class="fx-btn ghost sm qm" data-a="delete">Delete</button><button type="button" class="fx-btn ghost sm qm" data-a="dismiss">Dismiss</button><button type="button" class="fx-btn dark sm qb" data-u="${E(r.author)}">Ban user</button>${r.author_av==='u'?`<button type="button" class="fx-btn ghost sm qav" data-u="${r.author_id}">Remove picture</button>`:''}<button type="button" class="fx-btn ghost sm qm" data-a="illegal">Report as illegal</button></div></div>`}).join(''):'<p class="box">No open reports.</p>'}
 ${S.me.role==='owner'?`<form class="fx-form" id="fx-role" style="margin-top:16px"><h3>Moderators</h3><label for="r-u">Username</label><input id="r-u" name="username" type="text"><p><button class="fx-btn sm" name="role" value="mod">Make moderator</button> <button class="fx-btn ghost sm" name="role" value="user">Remove moderator</button></p><p class="fx-err"></p></form>`:''}`;
 el.querySelectorAll('.msq').forEach(b=>b.onclick=async()=>{if(b.dataset.a==='delete'&&!confirm('Delete this message?'))return;const d=await api('mod/message',{body:{id:+b.closest('.fx-msg').dataset.m,action:b.dataset.a}});if(!d.ok){toast(d.error);return;}modView(el);});
 el.querySelectorAll('.rsq').forEach(b=>b.onclick=async()=>{const id=+b.closest('[data-rs]').dataset.rs,a=b.dataset.a;let extra={};
  if(a==='reported'){const n=prompt('CyberTipline report number (from the confirmation page):','');if(n===null)return;extra.cybertip=n;}
  if(a==='extend'){const n=prompt('Why is the hold extended? (e.g. law enforcement request, case number)','');if(n===null)return;extra.note=n;}
  if(a==='release'&&!confirm('Release this item? Only do this if the report was clearly wrong (for example, an ordinary text post). It goes back to the normal queue as a hidden post.'))return;
  if(a==='ban'&&!confirm('Ban this account for good and sign it out everywhere?'))return;
  const d=await api('mod/restricted',{body:{id,action:a,...extra}});if(!d.ok){toast(d.error);return;}modView(el);});
 el.querySelectorAll('.avq').forEach(b=>b.onclick=async()=>{const c=b.closest('.c');if(b.dataset.a==='illegal'&&!confirm('Report this picture as illegal? It is hidden at once and held for the owner to report. Do not download or screenshot it.'))return;b.disabled=true;const d=await api('mod/avatar',{body:{user_id:+c.dataset.u,action:b.dataset.a}});if(!d.ok){toast(d.error);b.disabled=false;return;}c.remove();});
 el.querySelectorAll('.qav').forEach(b=>b.onclick=async()=>{const d=await api('mod/avatar',{body:{user_id:+b.dataset.u,action:'remove',strike:true}});toast(d.ok?'Picture removed.':d.error);});
 el.querySelectorAll('.qm').forEach(b=>b.onclick=async()=>{if(b.dataset.a==='illegal'&&!confirm('Report this post as illegal content (child sexual abuse material)? It is removed for everyone, including moderators, and held for the owner to report to NCMEC. Do not download, screenshot or share it.'))return;const d=await api('mod/post',{body:{post_id:+b.closest('.fx-post').dataset.id,action:b.dataset.a}});if(!d.ok)toast(d.error);modView(el);});
 el.querySelectorAll('.qb').forEach(b=>b.onclick=async()=>{const days=prompt(`Ban ${b.dataset.u} for how many days?`,'7');if(days===null)return;const d=await api('mod/ban',{body:{username:b.dataset.u,days:+days,reason:'Reported posts'}});toast(d.ok?'Done.':d.error);});
 const rf=$('fx-role');if(rf)rf.onsubmit=async e=>{e.preventDefault();const role=e.submitter&&e.submitter.value;const d=await api('mod/role',{body:{username:$('r-u').value,role}});rf.querySelector('.fx-err').textContent=d.ok?'Saved.':d.error;};}

// ---------- Pick 'Em + Trivia (the existing game, moved into the Forum) ----------
function parkPlay(){const pb=$('play-body');if(!pb)return;let host=$('fp-play');if(!host){host=document.createElement('div');host.id='fp-play';host.hidden=true;$('forum-body').after(host);}
 if(pb.parentElement!==host)host.prepend(pb);host.hidden=true;if(!pb.dataset.fx){pb.dataset.fx='1';new MutationObserver(tagPlay).observe(pb,{childList:true});}}
function tagPlay(){const host=$('fp-play');if(!host)return;const tab=host.dataset.tab;host.querySelectorAll('#play-body section').forEach(s=>{const h=(s.querySelector('h2')||{}).textContent||'';s.hidden=tab==='trivia'?!/trivia/i.test(h):/trivia/i.test(h);});const ps=host.querySelector('#play-body > p.page-sub');if(ps&&S.api)ps.hidden=true;
 host.querySelectorAll('#play-body h2.section-title').forEach(h=>{if(/leaderboard/i.test(h.textContent)){h.hidden=!!S.api;const n=h.nextElementSibling;if(n)n.hidden=!!S.api;}});}
async function playTab(el,tab){el.innerHTML=tabs(tab);const host=$('fp-play');host.dataset.tab=tab;host.hidden=false;tagPlay();
 // Pick 'Em needs a free account on the live site: show a clear sign-in prompt instead of buttons that seem to do nothing
 let gate=$('fp-gate');const gated=!!(S.api&&!S.me&&tab==='pickem');host.classList.toggle('fp-gated',gated);
 if(gated){if(!gate){gate=document.createElement('div');gate.id='fp-gate';host.prepend(gate);}gate.hidden=false;
  gate.innerHTML=`<div class="box fp-gate"><p><b>Sign in or join free to make your picks.</b> It takes 30 seconds, and your picks count on the fan leaderboard.</p><p class="fp-gate-btns"><a class="fx-btn" href="#/forum/join" onclick="sessionStorage.setItem('bgd_next','pickem')">Join free</a> <a class="fx-btn ghost" href="#/forum/signin" onclick="sessionStorage.setItem('bgd_next','pickem')">Sign in</a></p></div>`;}
 else if(gate)gate.hidden=true;
 let lb=$('fp-lb');if(!lb){lb=document.createElement('div');lb.id='fp-lb';host.appendChild(lb);}
 if(!S.api){lb.innerHTML='';return;}
 lb.innerHTML=`${S.me?`<p class="fine">Signed in as <b>${E(S.me.display_name)}</b>: your ${tab==='trivia'?'answers':'saved picks'} count on the fan leaderboard.</p>`:tab==='pickem'?'':`<p class="box">Want to be on the leaderboard? <a class="fx-btn sm" href="#/forum/join" onclick="sessionStorage.setItem('bgd_next','${tab}')">Join free</a> Your answers still save on this device either way.</p>`}
 <h2 class="section-title">Fan leaderboard</h2><div class="box" id="fp-lbb"><p class="fine">Loading…</p></div>`;
 const d=await api('play/leaderboard');const b=$('fp-lbb');if(!b)return;
 b.innerHTML=d.ok&&d.leaders.length?`<table class="fx-cmp"><thead><tr><th>#</th><th>Fan</th><th>Pick 'Em</th><th>Trivia</th></tr></thead><tbody>${d.leaders.map((r,i)=>`<tr><td>${i+1}</td><td><b>${E(r.name)}</b>${r.flair?` <span class="fx-flair">${E(r.flair)}</span>`:''}</td><td>${r.pick_wins}/${r.pick_games}</td><td>${r.trivia_right}/${r.trivia_played}</td></tr>`).join('')}</tbody></table><p class="fine">Pick 'Em: correct picks / graded games. Trivia: right answers / days played. Only real accounts are listed.</p>`
  :'<p class="fine">No scores yet. Signed-in fans show up here after their first saved picks or trivia answer.</p>';}
// sync on-device picks/answers to the fan account (the on-device game itself is unchanged)
let PK=null;getJ('data/pickem.json').then(d=>PK=d).catch(()=>{});
document.addEventListener('click',e=>{const g=S.api&&!S.me&&e.target.closest('#fp-play.fp-gated #play-body .pk');if(g&&!g.disabled){e.preventDefault();e.stopPropagation();sessionStorage.setItem('bgd_next','pickem');location.hash='#/forum/join';return;}
 if(!S.api||!S.me)return;const t=e.target.closest('#play-body .topt');if(t&&!t.disabled){api('play/trivia',{body:{answer:t.dataset.a}});return;}
 const s=e.target.closest('#play-body .pk-submit');if(s&&!s.disabled&&PK)setTimeout(()=>{try{const p=JSON.parse(localStorage.getItem('sd_picks_'+PK.season+'_w'+PK.week)||'{}');api('play/picks',{body:{picks:p}});}catch(err){}},50);},true);

// ---------- read-only fallback (before accounts are switched on) ----------
async function legacy(el){el.innerHTML=tabs('discuss')+'<p class="empty">Loading…</p>';if(!S.bot){try{S.bot=await getJ('data/forum_bot.json');}catch(e){S.bot={topics:[]};}}
 const T=[...S.bot.topics].sort((a,b)=>(b.pinned-a.pinned)||b.created.localeCompare(a.created));const id=(sub()||[])[1];const t=id&&T.find(x=>x.id===id);
 if(t){el.innerHTML=tabs('discuss')+`<p><a class="back" href="#/forum">← Forum</a></p><article class="fx-post"><div class="who"><b>${E(t.author)}</b>${roleTag('bot')}<small>${ago(t.created)}</small></div><h2>${E(t.title)}</h2><div class="tx">${E(t.body)}</div>
  ${(t.links||[]).map(l=>`<a class="fx-btn ghost sm" href="${E(l.href)}" ${l.external?'target="_blank" rel="noopener noreferrer"':''}>${E(l.label)}</a>`).join(' ')}</article><p class="box">Replies open when fan accounts launch (very soon).</p>`;return;}
 const CL=[['Game Day','Game threads and post-game talk'],['Depth Chart & Roster','Roster moves and injuries'],['Draft','Prospects and big boards'],['Fan Mock Drafts','Your mock drafts'],['General Steelers','Anything Steelers'],['Off-Topic','Pittsburgh life, other sports']];
 el.innerHTML=tabs('discuss')+`<p class="box">Fan accounts are almost ready. Until then, here are today's topics, posted automatically by the Dispatch Desk.</p><p class="fine"><b>Categories:</b> ${CL.map(([n,d])=>`${E(n)} <small>(${E(d)})</small>`).join(' · ')}</p><div class="fx-list">${T.map(t=>`<a class="fx-th${t.pinned?' pin':''}" href="#/forum/thread/${E(t.id)}"><span class="m"><small>${E(t.kind)} · ${E(t.cat)}</small><b>${E(t.title)}</b><small>by ${E(t.author)} ${roleTag('bot')} · ${ago(t.created)}</small></span></a>`).join('')}</div>
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
async function boxAvg(){const bb=$('boxscore-body');if(!bb||!S.api)return;let id=window.BGD_boxId;if(!id){try{const ix=await getJ('data/boxscores/index.json');const g=ix.games[ix.games.length-1];id=g&&g.id;}catch(e){}}if(!id)return;let o=$('fx-bx');if(o&&o.dataset.id===id)return;
 let box=null,wk=null;try{box=await getJ(`data/boxscores/${id}.json`);wk=await getJ(`data/grades/week-${box.week_num}.json`);}catch(e){return;}
 const av=await fanAvg('game='+encodeURIComponent(id));if(!o){o=document.createElement('div');o.id='fx-bx';bb.after(o);}o.dataset.id=id;o.innerHTML=cmpTable(wk,av,'Player grades: ours vs. the fans');}
// homepage: game-day / grade-the-team link
async function homeLink(){const home=document.querySelector('[data-view="home"]');if(!home||!S.api)return;let sched=null;try{sched=await getJ('data/schedule.json');}catch(e){return;}
 const t=Date.now();const near=(sched.games||[]).some(g=>{const k=Date.parse(g.date);return t>k-24*36e5&&t<k+7*864e5;});if(!near)return;
 const d=await api('forum/gameday');const g=d.ok&&d.game;let a=$('fx-home');if(!g){a&&a.remove();return;}
 const html=!g.final&&g.gameday_thread?`${tag('Game Day','gold')} <span>Game Day Chat:</span> ${E(g.label)} · join the live chat →`:g.grading_open?`${tag('Grades open','gold')} <span>Grade the Team:</span> ${E(g.label)} · fans' grades are open →`:'';if(!html){a&&a.remove();return;}
 if(!a){a=document.createElement('a');a.id='fx-home';a.className='fx-home';home.prepend(a);}a.href=!g.final&&g.gameday_thread?`#/forum/thread/${g.gameday_thread}`:`#/forum/grade/${g.game_id}`;a.innerHTML=html;}

// ---------- mock draft -> forum ----------
document.addEventListener('click',e=>{const b=e.target.closest('.dr-forum');if(!b)return;const m=window.BGD_mockDraft&&window.BGD_mockDraft();if(!m){toast('Finish your draft first.');return;}
 sessionStorage.setItem('bgd_mock',JSON.stringify(m));if(S.api===false){toast('Posting to the forum is almost here: fan sign-in launches soon. Your draft is saved on this device, and once sign-in opens this button will post it to Fan Mock Drafts under your name. For now you can share it with Copy text or Download image.');return;}
 if(!S.me){sessionStorage.setItem('bgd_next','mock');location.hash='#/forum/join';return;}location.hash='#/forum/new?mock=1';});

// ---------- Live Hub game chat ----------
// The chat IS the forum's game-day thread: same accounts, same posts, same word filter, bans, rate limits and moderator tools.
// Messages sent here are forum posts in that thread, so the conversation stays in the forum after the game.
const lcLive=c=>{const k=Date.parse(c.kickoff),t=Date.now();return t>k-36e5&&t<k+6*36e5;};
function liveCard(c){return c&&lcLive(c)?`<a class="fx-gd" href="#/live">${tag('Live now','gold')}<b>Game on: chat on the Live Hub</b><small>${E(c.label)} · score, play-by-play and the game chat in one place. Messages there are saved in the forum's game-day thread.</small></a>`:'';}
async function liveBadge(){const box=$('fx-livebadge');if(!box||!S.api)return;const d=await api('forum/gameday');if(box.isConnected)box.innerHTML=liveCard(d.ok&&d.chat);}
const LC={el:null,tid:0,last:0,timer:null,chat:null,busy:false,st:0,bottom:true,err:''};
const lcMod=()=>S.me&&(S.me.role==='mod'||S.me.role==='owner');
function lcAttach(){const slot=$('live-chat-slot');if(!slot)return false;if(!LC.el){LC.el=document.createElement('div');LC.el.id='lc';LC.el.className='box lc';LC.el.innerHTML='<p class="lc-empty" style="padding:0 12px">Loading chat…</p>';}
 if(LC.el.parentNode!==slot){slot.appendChild(LC.el);const l=LC.el.querySelector('.lc-list');if(l)l.scrollTop=LC.bottom?l.scrollHeight:LC.st;}return true;}
function lcMsg(p){const mod=lcMod(),mine=S.me&&S.me.id===p.user_id;
 return `<div class="lc-m${p.hidden?' hid':''}" id="lc${p.id}" data-id="${p.id}">${av(p.av,p.name,p.user_id,p.av_v)}<div class="lc-b"><div class="lc-h"><b>${E(p.name)}</b>${roleTag(p.role)}${fmTag(p.fm)}<small>${ago(p.created)}${p.hidden?' · hidden':''}</small></div><div class="lc-t">${fmtBody(p.body)}</div>${(S.me&&!mine&&p.role!=='bot')||mod?`<div class="lc-a">${S.me&&!mine&&p.role!=='bot'?`<a href="#/forum/thread/${LC.tid}?p=${p.id}">Report in forum</a>`:''}${mod?`<button type="button" class="lnk lcmod" data-a="${p.hidden?'unhide':'hide'}">${p.hidden?'Unhide':'Hide'}</button><button type="button" class="lnk lcmod" data-a="delete">Delete</button>`:''}</div>`:''}</div></div>`;}
// The chat box can finish loading before the Live Hub page has drawn its slot; keep the box ready and attach it when the slot appears
// (before Oct 20, 2026 it could stay on "Loading chat…" with no working Send button).
function lcBox(html){lcAttach();if(!LC.el){LC.el=document.createElement('div');LC.el.id='lc';LC.el.className='box lc';}LC.el.innerHTML=html;}
function lcGate(c){if(!S.me)return `<div class="lc-gate"><p><b>Sign in or join the forum to chat.</b> Reading is open to everyone. One free account works across the whole site.</p><a class="fx-btn sm" href="#/forum/signin" data-lcnext>Sign in</a><a class="fx-btn ghost sm" href="#/forum/join" data-lcnext>Join the forum</a></div>`;
 if(S.me.banned)return '<div class="lc-gate"><p class="fine">Your account is suspended from posting.</p></div>';
 if(c.locked&&!lcMod())return '<div class="lc-gate"><p class="fine">This game chat is locked.</p></div>';
 return `<form class="lc-form" id="lc-form"><label class="sr" for="lc-ta">Chat message</label><textarea id="lc-ta" rows="1" placeholder="Chat as ${E(S.me.display_name)}…"></textarea><button class="fx-btn" type="submit" id="lc-send">Send</button><p class="fx-cnt" id="lc-cnt" aria-live="polite"></p>${lcTouch()?'':'<p class="lc-hint">Enter sends. Shift+Enter starts a new line.</p>'}</form>`;}
// iPad/iPhone: the Return key makes a new line and the Send button sends. Keyboard and mouse computers: Enter sends.
const lcTouch=()=>matchMedia('(pointer: coarse)').matches||/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
async function lcLoad(){if(LC.busy)return;LC.busy=true;try{
 if(S.api===null)await probe();
 if(!S.api){lcBox('<p class="lc-empty" style="padding:0 12px">Game chat is resting right now. Talk about the game in the <a href="#/forum">forum</a>.</p>');return;}
 const d=await api('forum/gameday');const c=d.ok&&d.chat,g=d.ok&&d.game;LC.chat=c||null;
 if(!c){LC.tid=0;const gt=g&&g.gameday_thread,pg=g&&g.postgame_thread;
  lcBox(`<div class="lc-top"><b>Game chat</b><a href="#/forum/gameday">Game Day forum →</a></div><p class="lc-empty" style="padding:0 12px">The chat for the next game opens up to a week before kickoff.${gt?` <a href="#/forum/thread/${gt}">Read the last game's chat in the forum</a>.`:''}${pg?` <a href="#/forum/thread/${pg}">Post-game thread</a>.`:''}</p>`);return;}
 const t=await api('forum/thread/'+c.thread);if(!t.ok){lcBox(`<p class="fx-err" style="padding:8px 12px">${E(t.error||'Chat unavailable right now.')}</p>`);return;}
 S.me=t.me;LC.tid=c.thread;const posts=t.posts.slice(-150);LC.last=t.posts.length?t.posts[t.posts.length-1].id:0;
 lcBox(`<div class="lc-top"><span>${lcLive(c)?tag('Live now','gold'):''}<b>${E(c.title)}</b></span><a href="#/forum/thread/${c.thread}">Continue in the forum →</a></div>
  <p class="lc-note">Every message here is also a post in the forum's game-day thread. One account, same <a href="legal/community.html">community guidelines</a>.</p>
  <div class="lc-list" id="lc-list" aria-live="polite">${posts.map(lcMsg).join('')||'<p class="lc-empty">No messages yet. Start the conversation.</p>'}</div><p class="fx-err" id="lc-err" role="alert"></p>${lcGate(c)}`);
 const l=LC.el.querySelector('#lc-list');if(l){l.scrollTop=l.scrollHeight;LC.bottom=true;l.onscroll=()=>{LC.st=l.scrollTop;LC.bottom=l.scrollTop+l.clientHeight>l.scrollHeight-40;};}
 lcWire();}finally{LC.busy=false;}lcSchedule();}
function lcWire(){const q=x=>LC.el&&LC.el.querySelector('#'+x);const f=q('lc-form');if(!f)return;const ta=q('lc-ta');
 ta.oninput=()=>{const atEnd=ta.selectionEnd>=ta.value.length-1;ta.style.height='auto';ta.style.height=Math.min(200,ta.scrollHeight+4)+'px';if(atEnd)ta.scrollTop=ta.scrollHeight;};
 const cnt=wireCount(ta,q('lc-cnt'));
 ta.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&!lcTouch()){e.preventDefault();f.requestSubmit();}};
 f.onsubmit=async e=>{e.preventDefault();const v=ta.value.trim();const b=q('lc-send'),er=q('lc-err');er.textContent='';if(!v)return;
  if(v.length>POST_MAX){er.textContent=countMsg(v.length).t;return;}
  b.disabled=true;b.textContent='Sending…';const r=await api(`forum/thread/${LC.tid}/posts`,{body:{body:v},timeout:25000});b.disabled=false;b.textContent='Send';
  if(!r.ok){er.textContent=(r.status===401?'You were signed out. Sign in again to keep chatting.':(r.error||'Your message didn\'t send. Please try again.'))+' Your message is still in the box.';return;}ta.value='';ta.style.height='';cnt();LC.bottom=true;await lcPull();ta.focus();};}
async function lcPull(){if(!LC.tid)return;const tid=LC.tid;const d=await api(`forum/thread/${tid}?after=${LC.last}`);if(!d.ok||tid!==LC.tid)return;
 const l=$('lc-list');if(!l)return;(d.hidden_ids||[]).forEach(i=>{const n=$('lc'+i);n&&n.remove();});
 const fresh=d.posts.filter(p=>!$('lc'+p.id));if(fresh.length){const em=l.querySelector('.lc-empty');em&&em.remove();l.insertAdjacentHTML('beforeend',fresh.map(lcMsg).join(''));}
 d.posts.forEach(p=>LC.last=Math.max(LC.last,p.id));if(fresh.length&&LC.bottom)l.scrollTop=l.scrollHeight;}
function lcSchedule(){clearTimeout(LC.timer);if(!location.hash.startsWith('#/live')||!LC.tid)return;
 LC.timer=setTimeout(async function tick(){if(!location.hash.startsWith('#/live'))return;if(!document.hidden)await lcPull().catch(()=>{});lcSchedule();},LC.chat&&lcLive(LC.chat)?5000:20000);}
function lcStart(){if(LC.el)LC.el.innerHTML='<p class="lc-empty" style="padding:0 12px">Loading chat…</p>';lcAttach();lcLoad();}
function lcStop(){clearTimeout(LC.timer);LC.timer=null;}
document.addEventListener('click',async e=>{
 const n=e.target.closest('#lc [data-lcnext]');if(n){sessionStorage.setItem('bgd_next','live');return;}
 const b=e.target.closest('#lc .lcmod');if(!b)return;const m=b.closest('.lc-m'),a=b.dataset.a;
 if(a==='delete'&&!confirm('Delete this message for good? It is removed from the forum thread too.'))return;
 const d=await api('mod/post',{body:{post_id:+m.dataset.id,action:a}});if(!d.ok){toast(d.error);return;}lcLoad();});
{const lb=$('live-body');if(lb)new MutationObserver(()=>{if(location.hash.startsWith('#/live'))lcAttach();}).observe(lb,{childList:true});}

// ---------- wiring ----------
function onRoute(v){if(v==='play'){location.replace('#/forum/pickem');return;}
 if(v!=='forum')stopPolls();if(v==='live')lcStart();else lcStop();if(v==='forum')render();if(v==='heatmap')setTimeout(heatAvg,300);if(v==='boxscore')setTimeout(boxAvg,300);if(v==='home')homeLink();}
document.addEventListener('route',e=>onRoute(e.detail));
const hb=()=>{const h=$('heat-body');if(h)new MutationObserver(()=>{if(!location.hash.match(/heatmap|grades/))return;clearTimeout(S.hmT);S.hmT=setTimeout(heatAvg,250);}).observe(h,{childList:true});};
addEventListener('hashchange',()=>document.querySelectorAll('.fx-modal').forEach(m=>m.remove()));   // close pop-ups when the page changes
const claimHop=()=>{const m=location.hash.match(/^#\/claim\/([0-9a-f]{48,128})/);if(m)location.replace('#/forum/claim/'+m[1]);};claimHop();addEventListener('hashchange',claimHop);
probe().then(()=>{head();const v=(location.hash.replace(/^#\/?/,'').split(/[/?]/)[0])||'home';if(v==='play')location.replace('#/forum/pickem');
 if(v==='forum')render();if(v==='live')lcStart();if(/heatmap|grades/.test(v))heatAvg();if(v==='boxscore')boxAvg();if(v==='home')homeLink();hb();});
})();
