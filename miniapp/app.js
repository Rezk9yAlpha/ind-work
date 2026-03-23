const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

tg.setHeaderColor("secondary_bg_color");
tg.setBackgroundColor("bg_color");

let selectedType = "Курсовой проект";
let selectedPrice = "от 3 500 ₽";
let attachedFiles = [];

// --- SPA Навигация ---
const homeView = document.getElementById('home-view');
const ordersView = document.getElementById('orders-view');
const showOrdersBtn = document.getElementById('showOrdersBtn');
const backBtn = document.getElementById('backBtn');
const toHomeBtn = document.getElementById('to-home-btn');

function switchView(view) {
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred("light");
    if (view === 'orders') {
        homeView.style.display = 'none';
        ordersView.style.display = 'block';
        renderOrders();
    } else {
        homeView.style.display = 'block';
        ordersView.style.display = 'none';
    }
}

showOrdersBtn.addEventListener('click', () => switchView('orders'));
backBtn.addEventListener('click', () => switchView('home'));
toHomeBtn.addEventListener('click', () => switchView('home'));

// --- Работа с данными из URL ---
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    try {
        const orders = JSON.parse(params.get('orders') || '[]');
        const admins = JSON.parse(params.get('admins') || '[]');
        return { orders, admins };
    } catch (e) {
        console.error("Ошибка парсинга параметров:", e);
        return { orders: [], admins: [] };
    }
}

function renderOrders() {
    const { orders, admins } = getUrlParams();
    const list = document.getElementById('orders-list');
    const noOrders = document.getElementById('no-orders-msg');
    
    list.innerHTML = '';
    
    if (orders.length === 0) {
        noOrders.style.display = 'block';
        return;
    }
    
    noOrders.style.display = 'none';
    
    // Получаем текущий ID пользователя
    const currentUserId = tg.initDataUnsafe?.user?.id;
    // Проверка на админа: сравниваем значения как строки для надежности
    const isAdmin = admins.some(id => String(id).trim() === String(currentUserId).trim());
    
    // Отладка для админа (выводится в консоль разработчика в ТГ)
    console.log("=== DEBUG ADMIN ===");
    console.log("Current User ID:", currentUserId);
    console.log("Admins from URL:", admins);
    console.log("Is Admin Match:", isAdmin);
    console.log("====================");

    orders.sort((a, b) => {
        // Сортировка по времени (новые сверху)
        return b.id.localeCompare(a.id); // Простой способ если ID инкрементальные или по времени
    });

    orders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'card order-card';
        
        let statusClass = 'status-pending';
        let statusText = 'В ожидании';
        if (order.status === 'accepted') {
            statusClass = 'status-accepted';
            statusText = 'Принят';
        } else if (order.status === 'in_progress') {
            statusClass = 'status-progress';
            statusText = 'В работе';
        } else if (order.status === 'completed') {
            statusClass = 'status-ready';
            statusText = 'Готов';
        } else if (order.status === 'rejected') {
            statusClass = 'status-rejected';
            statusText = 'Отклонен';
        }

        const deleteBtn = isAdmin ? `<button class="delete-btn" onclick="deleteOrder('${order.id}')">🗑️</button>` : '';

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span class="order-id">Заказ #${order.id}</span>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="order-status ${statusClass}">${statusText}</span>
                    ${deleteBtn}
                </div>
            </div>
            <div class="order-info"><b>Тип:</b> ${order.data.type}</div>
            <div class="order-info"><b>Дедлайн:</b> ${order.data.deadline}</div>
            <div class="order-info"><b>Задача:</b> ${order.data.task}</div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                <div class="order-time">${order.time}</div>
                ${priceHtml}
            </div>
        `;
        list.appendChild(card);
    });
}

// Глобальная функция для удаления (через start payload)
window.deleteOrder = function(orderId) {
    tg.showConfirm(`Вы уверены, что хотите удалить заказ #${orderId}?`, (ok) => {
        if (ok) {
            const data = { action: "delete_order", order_id: orderId };
            const encoded = btoa(JSON.stringify(data));
            // Открываем бота с параметром для удаления
            tg.openTelegramLink(`https://t.me/${tg.initDataUnsafe.receiver?.username || 'KursaWork_bot'}?start=${encoded}`);
            tg.close();
        }
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
document.getElementById("sendBtn").addEventListener("click", () => {
  const task = document.getElementById("task").value.trim();
  const deadline = document.getElementById("deadline").value;
  const promo = document.getElementById("promo").value.trim();
  
  if (!task || !deadline) {
    tg.showAlert("Заполните описание и дедлайн! ✍️");
    return;
  }

  const payload = {
    type: selectedType,
    price: selectedPrice,
    task,
    deadline,
    promo,
    files: attachedFiles
  };

  if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");
  tg.sendData(JSON.stringify(payload));
  tg.close();
});

// Инициализация
renderOrders();
