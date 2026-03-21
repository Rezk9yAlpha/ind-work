const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Устанавливаем цвета темы Telegram
tg.setHeaderColor("secondary_bg_color");
tg.setBackgroundColor("bg_color");

let selectedType = "Индивидуальный проект";
let selectedPrice = "от 3 500 ₽";

const buttons = document.querySelectorAll(".item");
buttons.forEach((btn, index) => {
  if (index === 0) btn.classList.add("active");
  
  btn.addEventListener("click", () => {
    // Добавляем легкую вибрацию при клике (если поддерживается)
    if (tg.HapticFeedback) {
      tg.HapticFeedback.impactOccurred("light");
    }

    buttons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedType = btn.dataset.type || selectedType;
    selectedPrice = btn.dataset.price || selectedPrice;
  });
});

document.getElementById("sendBtn").addEventListener("click", () => {
  const task = document.getElementById("task").value.trim();
  
  if (!task) {
    if (tg.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred("error");
    }
    alert("Пожалуйста, опишите вашу задачу ✍️");
    return;
  }

  const payload = {
    type: selectedType,
    price: selectedPrice,
    task,
  };

  if (tg.HapticFeedback) {
    tg.HapticFeedback.notificationOccurred("success");
  }

  tg.sendData(JSON.stringify(payload));
  tg.close();
});
