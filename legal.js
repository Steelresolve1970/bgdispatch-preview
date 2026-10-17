// Cookie banner + Do Not Sell/Share + Global Privacy Control (SCAFFOLD). No ad/analytics scripts exist yet;
// window.sdConsent.allowAds() is the single gate any future ad/analytics loader must check before loading.
(function(){
const KEY='sd_consent';const base=new URL('.',document.currentScript.src).href;
const gpc=navigator.globalPrivacyControl===true;
const get=()=>{try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return{}}};
const set=v=>{try{localStorage.setItem(KEY,JSON.stringify({...get(),...v,ts:new Date().toISOString()}))}catch(e){}};
if(gpc&&!get().optOut)set({optOut:true,via:'GPC'});   // GPC = valid opt-out of sale/sharing
window.sdConsent={gpc,state:get,allowAds:()=>{const s=get();return s.choice==='accept'&&!s.optOut&&!gpc;}};
function banner(){if(document.getElementById('cookie-banner'))return;const d=document.createElement('div');d.id='cookie-banner';d.setAttribute('role','dialog');d.setAttribute('aria-label','Cookie choices');
 d.innerHTML=`<p><b>Cookies.</b> We only use on-device storage needed for the site (your picks and settings). No ad or analytics cookies are set today. If we add them, they'll load only if you accept${gpc?'. Your browser\'s Global Privacy Control signal is on, so we treat you as opted out of sale/sharing':''}. <a href="${base}legal/cookies.html">Cookie notice</a> · <a href="${base}legal/privacy.html">Privacy</a></p>
 <div><button class="btn" data-c="accept" type="button">Accept</button> <button class="btn ghost" data-c="reject" type="button">Reject non-essential</button></div>`;
 d.addEventListener('click',e=>{const b=e.target.closest('[data-c]');if(!b)return;set({choice:b.dataset.c});d.remove();document.body.style.paddingBottom='';document.documentElement.style.removeProperty('--cb');});document.body.appendChild(d);
 const pad=()=>{if(!d.isConnected)return;const h=d.offsetHeight+24;document.body.style.paddingBottom=h+'px';document.documentElement.style.setProperty('--cb',h+'px');};pad();addEventListener('resize',pad);}
function wire(){if(!get().choice)banner();
 document.getElementById('reopen-consent')?.addEventListener('click',banner);
 const st=document.getElementById('gpc-status');if(st)st.textContent=gpc?'Global Privacy Control detected: you are opted out of sale/sharing on this device.':'No Global Privacy Control signal detected from your browser.';
 const t=document.getElementById('dns-toggle');if(t){t.checked=!!get().optOut;if(gpc)t.disabled=true;t.addEventListener('change',()=>set({optOut:t.checked,via:'toggle'}));}}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',wire):wire();
})();
