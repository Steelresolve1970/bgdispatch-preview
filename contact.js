// Contact & Suggestions (#/contact). Saves to /api/contact (D1). Spam protection: hidden honeypot field, a
// minimum fill time and per-IP rate limits on the server. The email line shows only when data/site_config.json sets contact_email.
(function(){
const $=id=>document.getElementById(id);
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TOPICS=['Suggestion/Improvement','Report a problem','Correction','Advertising','Copyright/takedown','Other'];
let CFG=null,shown=0;
const css=`.ct-form{max-width:640px;background:#fff;border-radius:14px;padding:18px;box-shadow:0 1px 3px #0002}
.ct-form label{display:block;font-weight:800;margin:12px 0 4px}.ct-form label small{font-weight:400;color:#666}
.ct-form input,.ct-form select,.ct-form textarea{width:100%;min-height:48px;font-size:16px;padding:10px 12px;border:2px solid #ccc;border-radius:10px;background:#fff;box-sizing:border-box}
.ct-form textarea{min-height:150px;resize:vertical}.ct-form input:focus,.ct-form select:focus,.ct-form textarea:focus{border-color:#FFB612;outline:none}
.ct-form button{margin-top:14px;width:100%;min-height:52px;font-size:1.05rem;font-weight:900;border:0;border-radius:12px;background:#FFB612;color:#101010;cursor:pointer}
.ct-form button:disabled{opacity:.6}.ct-hp{position:absolute!important;left:-9999px!important;width:1px;height:1px;overflow:hidden}
.ct-err{color:#b00020;font-weight:700;min-height:1.2em;margin:8px 0 0}.ct-ok{background:#fff3cf;border:2px solid #FFB612;border-radius:12px;padding:16px;max-width:640px}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
async function cfg(){if(CFG)return CFG;try{const r=await fetch((window.BGD_url?BGD_url('data/site_config.json'):'data/site_config.json'),{cache:'no-store'});CFG=await r.json();}catch(e){CFG={};}return CFG;}
async function render(){const el=$('contact-body');if(!el)return;const c=await cfg();const em=(c.contact_email||'').trim();shown=Date.now();
 const pre=(new URLSearchParams(location.hash.split('?')[1]||'')).get('topic');
 el.innerHTML=`<p class="page-sub">Ideas, fixes, corrections or questions: we read every message.${em?` You can also email us at <a href="mailto:${E(em)}">${E(em)}</a>.`:''}</p>
 <form class="ct-form" id="ct-form" novalidate>
  <label for="ct-n">Name <small>optional</small></label><input id="ct-n" name="name" type="text" maxlength="80" autocomplete="name">
  <label for="ct-e">Email <small>optional, only if you'd like a reply</small></label><input id="ct-e" name="email" type="email" maxlength="120" autocomplete="email">
  <label for="ct-t">Topic</label><select id="ct-t" name="topic">${TOPICS.map(t=>`<option${t===pre?' selected':''}>${E(t)}</option>`).join('')}</select>
  <label for="ct-m">Message</label><textarea id="ct-m" name="message" maxlength="5000" required></textarea>
  <div class="ct-hp" aria-hidden="true"><label for="ct-w">Website</label><input id="ct-w" name="website" type="text" tabindex="-1" autocomplete="off"></div>
  <p class="ct-err" role="alert"></p><button type="submit">Send message</button>
  <p class="fine" style="margin-top:10px">We use what you send only to read and answer it, and keep it for about a year. See our <a href="legal/privacy.html">Privacy notice</a>. For copyright notices you can also use the <a href="legal/dmca.html">DMCA page</a>.</p>
 </form>`;
 const f=$('ct-form');f.onsubmit=async e=>{e.preventDefault();const b=f.querySelector('button'),er=f.querySelector('.ct-err');er.textContent='';
  const fd=Object.fromEntries(new FormData(f));if((fd.message||'').trim().length<5){er.textContent='Please write a message.';$('ct-m').focus();return;}
  fd.t=Date.now()-shown;b.disabled=true;b.textContent='Sending…';let d;
  try{const r=await fetch('/api/contact',{method:'POST',credentials:'same-origin',headers:{'x-bgd':'1','content-type':'application/json'},body:JSON.stringify(fd)});d=await r.json();}catch(err){d={ok:false,error:'We couldn\'t send that right now.'};}
  b.disabled=false;b.textContent='Send message';
  if(!d.ok){er.textContent=(d.error||'We couldn\'t send that right now.')+(em&&!d.field?` You can also email ${em}.`:'');return;}
  el.innerHTML=`<div class="ct-ok" role="status"><h2 style="margin-top:0">Thanks, message received! 💛</h2><p>${fd.email?'If it needs an answer, we\'ll reply to the email you gave.':'You didn\'t leave an email, so we can\'t reply directly, but we read every message.'}</p><p><a href="#/contact" onclick="setTimeout(()=>dispatchEvent(new HashChangeEvent('hashchange')),0)">Send another</a> · <a href="#/">Back to the news</a></p></div>`;};}
document.addEventListener('route',e=>{if(e.detail==='contact')render();});
if(/^#\/contact/.test(location.hash))setTimeout(render,0);
})();
