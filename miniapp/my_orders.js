const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

tg.setHeaderColor("secondary_bg_color");
tg.setBackgroundColor("bg_color");

// Функция для получения данных о заказах
function fetchOrders() {
    // В реальном приложении здесь был бы запрос к вашему бэкенду.
    // Telegram.WebApp.initDataUnsafe.query_id можно использовать для авторизации.
    // Для демонстрации используем "заглушку".
    const urlParams = new URLSearchParams(window.location.search);
    const ordersData = urlParams.get('orders');

    if (ordersData) {
        try {
            const orders = JSON.parse(decodeURIComponent(ordersData));
            renderOrders(orders);
        } catch (e) {
            console.error("Error parsing orders data:", e);
            showNoOrders();
        }
    } else {
        showNoOrders();
    }
}

function renderOrders(orders) {
    const container = document.getElementById('orders-list');
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

        card.innerHTML = `
            <div class="order-header">
                <span class="order-id">Заказ #${order.id}</span>
                <span class="order-status ${statusClass}">${statusText}</span>
            </div>
            <div class="order-body">
                <p><strong>Тип:</strong> ${order.data.type}</p>
                <p><strong>Задача:</strong> ${order.data.task.substring(0, 100)}...</p>
                <p><strong>Дедлайн:</strong> ${order.data.deadline}</p>
            </div>
            <div class="order-footer">
                <span>${order.time}</span>
            </div>
        `;
        container.appendChild(card);
    });
}

function showNoOrders() {
    document.getElementById('orders-list').style.display = 'none';
    document.getElementById('no-orders').style.display = 'block';
}

document.getElementById('back-to-main').addEventListener('click', () => {
    // Эта ссылка должна вести на ваш основной index.html
    window.location.href = './index.html'; 
});

// Запускаем получение заказов при загрузке страницы
fetchOrders();
