const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

tg.setHeaderColor("secondary_bg_color");
tg.setBackgroundColor("bg_color");

let selectedType = "Курсовой проект";
let selectedPrice = "от 2 800 ₽";
let attachedFiles = [];

// --- SPA Навигация ---
const homeView = document.getElementById('home-view');
const ordersView = document.getElementById('orders-view');
const showOrdersBtn = document.getElementById('showOrdersBtn');
const backBtn = document.getElementById('backBtn');
const toHomeBtn = document.getElementById('to-home-btn');

function switchView(view) {
 if(tg.HapticFeedback)tg.HapticFeedback.impactOccurred('light');
 const target=view==='orders'?ordersView:homeView,other=view==='orders'?homeView:ordersView;
 other.hidden=true;other.style.display='none';target.hidden=false;target.style.display='block';
 target.classList.remove('mini-screen-enter');void target.offsetWidth;target.classList.add('mini-screen-enter');
 window.scrollTo({top:0,behavior:'instant'});if(view==='orders')renderOrders();
}

showOrdersBtn.addEventListener('click', () => switchView('orders'));
backBtn.addEventListener('click', () => switchView('home'));
toHomeBtn.addEventListener('click', () => switchView('home'));

// --- Работа с данными из URL ---
let serverOrders=[], ordersLoaded=false, ordersError="";
function getUrlParams(){return {orders:serverOrders,admins:[]};}
async function loadServerOrders(){
 if(window.kwStaticMiniApp){serverOrders=window.kwStaticOrders||[];ordersLoaded=['ready','stale'].includes(window.kwSnapshotStatus);ordersError=ordersLoaded?'':'Отправьте боту /start и откройте новую кнопку Mini App, чтобы загрузить свои заказы.';renderOrders();return;}
 try{const data=await kwApi('/api/orders/mine');if(!Array.isArray(data.orders))throw new Error('Не удалось загрузить заказы');serverOrders=data.orders.map(order=>({...order,manager_tg:order.manager?.tg_url,manager_vk:order.manager?.vk_url}));ordersLoaded=true;ordersError='';renderOrders();checkAcceptedOrders();}
 catch(error){ordersError=error.message;renderOrders();}
}

function renderOrders() {
    const { orders, admins } = getUrlParams();
    const list = document.getElementById('orders-list');
    const noOrders = document.getElementById('no-orders-msg');
    
    list.innerHTML = '';
    toHomeBtn.hidden=!ordersLoaded||!!ordersError;
    const message=noOrders.querySelector('p');
    message.textContent=ordersError||(ordersLoaded?'У вас пока нет заказов.':'Загружаем ваши заказы…');
    
    if (orders.length === 0) {
        noOrders.style.display = 'block';
        return;
    }
    
    noOrders.style.display = 'none';
    
    orders.forEach(rawOrder => {
        const order={...rawOrder};for(const field of ['id','type','task','time','manager_name'])order[field]=kwEscape(order[field]);
        const card = document.createElement('div');
        card.className = 'card order-card';
        
        let statusClass = 'status-pending';
        let statusText = 'Ожидает рассмотрения'; // Значение по умолчанию

        // Маппинг статусов
        const s = order.status;
        if (s === 'accepted') { statusClass = 'status-accepted'; statusText = 'Принят'; }
        else if (s === 'in_progress') { statusClass = 'status-progress'; statusText = 'В работе 🛠️'; }
        else if (s === 'completed') { statusClass = 'status-ready'; statusText = 'Готов'; }
        else if (s === 'rejected') { statusClass = 'status-rejected'; statusText = 'Отказано ❌'; }
        else { statusClass = 'status-pending'; statusText = 'Ожидает рассмотрения'; }

        const priceHtml = order.final_price ? `<div class="order-price">${order.final_price} ₽</div>` : '';
        const managerHtml = order.manager_name ? `
            <div class="kw-preserved-151">
                <div class="kw-preserved-152">👤 Ваш менеджер: ${order.manager_name}</div>
                <div class="kw-preserved-153">
                    ${order.manager_tg ? `<a href="${order.manager_tg}" target="_blank" class="kw-preserved-154">💬 Telegram</a>` : ''}
                    ${order.manager_vk ? `<a href="${order.manager_vk}" target="_blank" class="kw-preserved-155">🌐 ВКонтакте</a>` : ''}
                </div>
            </div>
        ` : '';

        card.innerHTML = `
            <div class="mini-order-heading">
                <span class="order-id">Заказ #${order.id}</span>
                <div class="mini-order-status-wrap">
                    <span class="order-status ${statusClass}">${statusText}</span>
                </div>
            </div>
            <div class="order-info"><b>Тип:</b> ${order.type || '—'}</div>
            <div class="order-info"><b>Задача:</b> ${order.task?.length>100?order.task.slice(0,100)+'…':order.task || '—'}</div>
            ${managerHtml}
            <div class="mini-order-bottom">
                <div class="order-time">${order.time || '—'}</div>
                ${priceHtml}
            </div>
        `;
        list.appendChild(card);if(rawOrder.status==='completed'){const trash=kwElement(card.querySelector('.mini-order-status-wrap'),'button','🗑️','mini-order-delete');trash.setAttribute('aria-label','Удалить готовый заказ #'+rawOrder.id);trash.onclick=()=>deleteOrder(rawOrder.id);}
        if(rawOrder.manager_tg){const button=kwElement(card,'button','Написать администратору '+rawOrder.manager_name,'item');button.onclick=()=>openManager(rawOrder);}
    });
}

window.deleteOrder = function(orderId) {
 tg.showConfirm('Удалить готовый заказ #'+orderId+' вместе с его файлами и перепиской? Это действие нельзя отменить.',async ok=>{
  if(!ok)return;
  if(window.kwStaticMiniApp){tg.sendData(JSON.stringify({action:'delete_completed_order',order_id:orderId}));tg.close();return;}
  try{await kwPost('/api/orders/'+encodeURIComponent(orderId)+'/delete',{});await loadServerOrders();}catch(error){tg.showAlert(error.message);}
 });
};

// --- Выбор типа услуги ---
const buttons = document.querySelectorAll(".item");
buttons.forEach((btn, index) => {
  if (index === 0) btn.classList.add("active");
  
  btn.addEventListener("click", () => {
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred("light");
    buttons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedType = btn.dataset.type || selectedType;
    selectedPrice = btn.dataset.price || selectedPrice;
  });
});

// --- Файлы ---
const fileInput = document.getElementById("fileInput");
const fileBtn = document.getElementById("fileBtn");
const fileList = document.getElementById("fileList");

fileBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (e) => {
  const files = Array.from(e.target.files);
  attachedFiles = files.map(f => f.name);
  fileList.innerHTML = "";
  attachedFiles.forEach(name => {
    const div = document.createElement("div");
    div.textContent = `📎 ${name}`;
    fileList.appendChild(div);
  });
});

// --- Отправка ---
document.getElementById("sendBtn").addEventListener("click", async () => {
  const task = document.getElementById("task").value.trim();
  const deadline = document.getElementById("deadline").value;
  const promo = document.getElementById("promo").value.trim();
  
  if (!task || !deadline) {
    tg.showAlert("Заполните описание и дедлайн! ✍️");
    return;
  }

  const payload = {
    source: 'miniapp',
    type: selectedType,
    price: selectedPrice,
    task,
    deadline,
    promo,
    contact: tg.initDataUnsafe?.user?.username ? "@"+tg.initDataUnsafe.user.username : String(tg.initDataUnsafe?.user?.id||"Telegram")
  };

  if(window.kwStaticMiniApp){
    const data=JSON.stringify(payload);
    if(new TextEncoder().encode(data).length>4096){tg.showAlert('Сократите описание заявки. Подробное ТЗ можно отправить администратору после принятия заказа.');return;}
    try{const send=()=>{tg.sendData(data);tg.close();};if(fileInput.files.length)tg.showAlert('GitHub передаёт только заявку. Сами файлы отправьте администратору в Telegram после принятия заказа.',send);else send();}catch(_){tg.showAlert('Отправьте боту /start и откройте Mini App новой кнопкой внизу чата.');}
    return;
  }
  if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");
  const button=document.getElementById('sendBtn');button.disabled=true;
  try{const result=await kwPost('/api/orders/create',payload);kwSaveAccess(result.order_id,result.access_token);const errors=await kwUploadFiles(result.order_id,fileInput.files);tg.showAlert('Заявка #'+result.order_id+' сохранена. Скидка: '+result.discount_percent+'%.'+(errors.length?' Часть документов не загрузилась: '+errors.join('; '):''));await loadServerOrders();switchView('orders');}
  catch(error){tg.showAlert(error.message);}
  finally{button.disabled=false;}
});

function openManager(order){
 const url=order.manager_tg;
 if(!url||!/^https:\/\/t\.me\/[A-Za-z0-9_]+$/.test(url))return;
 try{tg.openTelegramLink(url);tg.close();}catch(error){tg.showAlert('Не удалось открыть чат. Нажмите «Написать администратору» ещё раз.');}
}
function checkAcceptedOrders(){
 for(const order of serverOrders){
  if(order.source!=='miniapp'||!['accepted','in_progress'].includes(order.status)||!order.accepted_at||!order.manager_tg||!order.manager_id)continue;
  const key='kw-mini-accepted:'+order.id,value=order.accepted_at+':'+order.manager_id;
  let previous;try{previous=sessionStorage.getItem(key);}catch{}
  if(previous===value)continue;
  try{sessionStorage.setItem(key,value);}catch{}
  openManager(order);break;
 }
}
function showAdminEntry(){if(!kwAccount?.is_admin||document.getElementById('miniAdminBtn'))return;const bar=document.querySelector('#home-view > div');if(!bar)return;const button=kwElement(bar,'button','Админ-панель',document.getElementById('showOrdersBtn').className);button.id='miniAdminBtn';button.onclick=()=>location.href='/admin';}
window.addEventListener('kw-account-rendered',showAdminEntry);
kwReady.then(showAdminEntry).catch(()=>{});
setInterval(()=>{if(!document.hidden)loadServerOrders();},4000);

// Инициализация
loadServerOrders();

// --- Эффект Деликатного 3D Наклона (Subtle Tilt) + Radial Spotlight ---
// Наклон ограничен до минимальных приятных 2.5 градусов, а при наборе текста или клике в поле ввода мгновенно выравнивается!
function initSpotlightEffect() {
  const cards = document.querySelectorAll(".card");
  const MAX_TILT_DEG = 2.5; // Минимальный деликатный угол (не мешает читать и попадать по кнопкам)

  window.addEventListener("pointermove", (e) => {
    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Обновляем координаты для неонового луча по контуру
      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);

      // Если курсор над карточкой и внутри нет активного ввода текста
      const isInside = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
      const hasActiveInput = card.contains(document.activeElement) && 
        (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA");

      if (isInside && !hasActiveInput) {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        // Очень плавный расчет наклона
        const tiltX = -((y - centerY) / centerY) * MAX_TILT_DEG;
        const tiltY = ((x - centerX) / centerX) * MAX_TILT_DEG;

        card.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
        card.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
      } else {
        card.style.setProperty("--tilt-x", `0deg`);
        card.style.setProperty("--tilt-y", `0deg`);
      }
    });
  }, { passive: true });

  // При уходе курсора с экрана плавно возвращаем карточки в ровное положение
  document.addEventListener("mouseleave", () => {
    cards.forEach((card) => {
      card.style.setProperty("--tilt-x", `0deg`);
      card.style.setProperty("--tilt-y", `0deg`);
    });
  });
}

initSpotlightEffect();



