(() => {
'use strict';window.kwStaticMiniApp=location.hostname.endsWith('.github.io');
function load(url){return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=url;script.onload=resolve;script.onerror=reject;document.head.append(script);});}
async function boot(){
 if(window.kwStaticMiniApp){
  window.kwAccount={is_admin:false,authenticated:false};window.kwReady=Promise.resolve(window.kwAccount);
  window.kwStaticOrders=[];window.kwSnapshotStatus='missing';
  const encoded=new URLSearchParams(location.hash.slice(1)).get('snapshot');
  if(encoded){
   try{
    const raw=encoded.replace(/-/g,'+').replace(/_/g,'/');const bytes=Uint8Array.from(atob(raw+'='.repeat((4-raw.length%4)%4)),c=>c.charCodeAt(0));
    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));const text=await new Response(stream).text();
    const snapshot=JSON.parse(text);const uid=window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    if(uid&&String(uid)!==String(snapshot.user_id))window.kwSnapshotStatus='wrong-user';
    else if(Array.isArray(snapshot.orders)){window.kwStaticOrders=snapshot.orders;window.kwSnapshotStatus=snapshot.expires_at<Date.now()/1000?'stale':'ready';}
   }catch(_){window.kwSnapshotStatus='invalid';}
   // Keep the private fragment so Telegram reloads retain this recipient snapshot.
  }

  window.kwEscape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  window.kwElement=(parent,tag,text,className)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;parent.append(node);return node;};

 }else{await load('/static/security.js');await load('/static/auth.js');}
 await load('./app.js?v=9');
}
boot().catch(()=>{const box=document.getElementById('kwAccountBar');if(box)box.textContent='Не удалось загрузить приложение. Закройте его, отправьте боту /start и попробуйте снова.';});
})();
