import { copyToClipboard, createElement } from "@/utils";

export function creationsMattelMain() {
  try {
    const parentTable = ".order__items";

    const parentTableElem = document.querySelector(parentTable);

    const orderItems = parentTableElem?.querySelectorAll("tr.order-item");

    // Проходимся по каждому найденному элементу
    orderItems?.forEach((item) => {
      // Извлекаем ссылку на продукт
      const linkElement = item.querySelector(".order-item__info .link");

      const productLink = `${linkElement?.href}` || "Ссылка не найдена";
      const productName =
        linkElement?.textContent?.trim() || "Название не найдено";

      // Извлекаем цену
      const priceElement = item.querySelector(".order-item__unit-price");

      const productPrice =
        priceElement?.textContent?.trim() || "Цена не найдена";

      // Извлекаем количество
      const quantityElement = item.querySelector(".order-item__quantity");

      const productQuantity =
        quantityElement?.textContent?.trim() || "Количество не найдено";

      // Создаем кнопку
      const clipboardBtn = createElement(
        "div",
        "Скопировать",
        {
          position: "relative",
          backgroundColor: "tomato",
          color: "white",
          padding: "10px 10px",
          borderRadius: "5px",
          fontSize: "14px",
        },
        undefined,
        "clipboardBtn"
      );

      // Добавляем кнопку в конец строки
      item.appendChild(clipboardBtn);

      clipboardBtn.addEventListener("click", () => {
        const result = {
          title: productName,
          price: productPrice,
          quantity: productQuantity,
          link: productLink,
        };

        copyToClipboard(JSON.stringify(result));
      });
    });
  } catch (e) {
    console.error("ebayMain func error", e);
  }
}
