(() => {
'use strict';window.kwStaticMiniApp=location.hostname.endsWith('.github.io');
function load(url){return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=url;script.onload=resolve;script.onerror=reject;document.head.append(script);});}
async function boot(){
 if(window.kwStaticMiniApp){
  window.kwAccount={is_admin:false,authenticated:false};window.kwReady=Promise.resolve(window.kwAccount);
  window.kwEscape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  window.kwElement=(parent,tag,text,className)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;parent.append(node);return node;};

 }else{await load('/static/security.js');await load('/static/auth.js');}
 await load('./app.js?v=6');
}
boot().catch(()=>{const box=document.getElementById('kwAccountBar');if(box)box.textContent='Не удалось загрузить приложение. Закройте его, отправьте боту /start и попробуйте снова.';});
})();
