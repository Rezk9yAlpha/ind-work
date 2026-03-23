const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

tg.setHeaderColor("secondary_bg_color");
tg.setBackgroundColor("bg_color");

let selectedType = "Индивидуальный проект";
let selectedPrice = "от 3 500 ₽";
let attachedFiles = [];

const buttons = document.querySelectorAll(".item");
buttons.forEach((btn, index) => {
  if (index === 0) btn.classList.add("active");
  
  btn.addEventListener("click", () => {
    if (tg.HapticFeedback) {
      tg.HapticFeedback.impactOccurred("light");
    }
    buttons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedType = btn.dataset.type || selectedType;
    selectedPrice = btn.dataset.price || selectedPrice;
  });
});

document.getElementById('myOrdersBtn').addEventListener('click', () => {
    // Навигация на страницу "Мои заказы"
    const currentUrl = new URL(window.location.href);
    const ordersUrl = new URL('my_orders.html', window.location.href);
    ordersUrl.search = currentUrl.search; // Сохраняем все параметры (включая список заказов)
    window.location.href = ordersUrl.toString();
});

// Работа с файлами
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
  
  if (tg.HapticFeedback) {
    tg.HapticFeedback.impactOccurred("medium");
  }
});

document.getElementById("sendBtn").addEventListener("click", () => {
  const task = document.getElementById("task").value.trim();
  const deadline = document.getElementById("deadline").value;
  const promo = document.getElementById("promo").value.trim();
  
  if (!task) {
    if (tg.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred("error");
    }
    tg.showAlert("Пожалуйста, опишите вашу задачу ✍️");
    return;
  }

  if (!deadline) {
    if (tg.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred("error");
    }
    tg.showAlert("Пожалуйста, укажите желаемый дедлайн 📅");
    return;
  }

  const payload = {
    type: selectedType,
    price: selectedPrice,
    task,
    deadline,
    promo,
    files: attachedFiles // Передаем только имена файлов (для уведомления)
  };

  if (tg.HapticFeedback) {
    tg.HapticFeedback.notificationOccurred("success");
  }

  // ТАК КАК ПРИЛОЖЕНИЕ ОТКРЫТО ЧЕРЕЗ INLINE-КНОПКУ, tg.sendData НЕ РАБОТАЕТ.
  // ИСПОЛЬЗУЕМ СХЕМУ С ПЕРЕНАПРАВЛЕНИЕМ В БОТА С ПАРАМЕТРОМ.
  const jsonData = JSON.stringify(payload);
  const base64Data = btoa(unescape(encodeURIComponent(jsonData)));
  
  // Открываем бота с параметром старта
  const botUsername = "Kursawork_bot"; // Тэг вашего бота
  tg.openTelegramLink(`https://t.me/${botUsername}?start=${base64Data}`);
  tg.close();
});
