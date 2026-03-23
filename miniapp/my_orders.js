const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

tg.setHeaderColor("secondary_bg_color");
tg.setBackgroundColor("bg_color");

const urlParams = new URLSearchParams(window.location.search);
const adminIds = [7314654912, 580964653]; // ID админов для возможности удаления

// Функция для получения данных о заказах
function fetchOrders() {
    const ordersData = urlParams.get('orders');
    // Получаем текущего пользователя для проверки прав на удаление
    const user = tg.initDataUnsafe.user;
    const is_admin = user && adminIds.includes(user.id);

    if (ordersData) {
        try {
            const orders = JSON.parse(decodeURIComponent(ordersData));
            renderOrders(orders, is_admin);
        } catch (e) {
            console.error("Error parsing orders data:", e);
            showNoOrders();
        }
    } else {
        showNoOrders();
    }
}

function renderOrders(orders, is_admin) {
    const container = document.getElementById('orders-list');
    container.innerHTML = ''; // Очищаем список
    
    if (orders.length === 0) {
        showNoOrders();
        return;
    }

    orders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'order-card';

        let statusClass = '';
        let statusText = '';
        switch (order.status) {
            case 'accepted':
                statusClass = 'status-accepted';
                statusText = 'В работе';
                break;
            case 'rejected':
                statusClass = 'status-rejected';
                statusText = 'Отклонен';
                break;
            default:
                statusClass = 'status-pending';
                statusText = 'Ожидает';
                break;
        }

        // Если это админ, добавляем кнопку удаления
        const deleteBtn = is_admin ? `
            <button class="delete-order-btn" data-id="${order.id}" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 5px;">
                🗑️
            </button>
        ` : '';

        card.innerHTML = `
            <div class="order-header">
                <span class="order-id">Заказ #${order.id}</span>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="order-status ${statusClass}">${statusText}</span>
                    ${deleteBtn}
                </div>
            </div>
            <div class="order-body">
                <p><strong>Тип:</strong> ${order.data.type}</p>
                <p><strong>Задача:</strong> ${order.data.task.substring(0, 100)}${order.data.task.length > 100 ? '...' : ''}</p>
                <p><strong>Дедлайн:</strong> ${order.data.deadline}</p>
            </div>
            <div class="order-footer">
                <span>${order.time}</span>
            </div>
        `;
        container.appendChild(card);
    });

    // Обработка удаления
    if (is_admin) {
        document.querySelectorAll('.delete-order-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const oid = e.currentTarget.dataset.id;
                if (confirm(`Удалить заказ #${oid}?`)) {
                    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred("warning");
                    
                    // Отправляем команду удаления боту
                    const deletePayload = { action: 'delete_order', order_id: oid };
                    const base64Data = btoa(unescape(encodeURIComponent(JSON.stringify(deletePayload))));
                    const botUsername = "Kursawork_bot";
                    tg.openTelegramLink(`https://t.me/${botUsername}?start=${base64Data}`);
                    tg.close();
                }
            });
        });
    }
}

function showNoOrders() {
    document.getElementById('orders-list').style.display = 'none';
    document.getElementById('no-orders').style.display = 'block';
}

document.getElementById('back-to-main').addEventListener('click', () => {
    window.location.href = `./index.html${window.location.search}`; 
});

document.getElementById('back-btn-header').addEventListener('click', () => {
    window.location.href = `./index.html${window.location.search}`;
});

// Запускаем получение заказов при загрузке страницы
fetchOrders();
