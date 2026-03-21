const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

let selectedType = "Индивидуальный проект";
let selectedPrice = "от 3 500 ₽";

const buttons = document.querySelectorAll(".item");
buttons.forEach((btn, index) => {
  if (index === 0) btn.classList.add("active");
  btn.addEventListener("click", () => {
    buttons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedType = btn.dataset.type || selectedType;
    selectedPrice = btn.dataset.price || selectedPrice;
  });
});

document.getElementById("sendBtn").addEventListener("click", () => {
  const task = document.getElementById("task").value.trim();
  const payload = {
    type: selectedType,
    price: selectedPrice,
    task,
  };
  tg.sendData(JSON.stringify(payload));
  tg.close();
});
