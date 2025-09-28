import { copyToClipboard, createElement, formatPrice } from "@/utils";

const pathname = window.location.pathname;

const isEbayItem = pathname.startsWith("/itm");
const isEbayOrder = pathname.startsWith("/ord");

// Функция для конвертации данных в формат для Google Sheets (TSV)
function convertToSheetsFormat(data: any): string {
  const headers = ["Title", "Price", "Quantity", "Link", "Brand"];

  // Если это один объект, преобразуем в массив
  const items = Array.isArray(data) ? data : [data];

  // Создаем строки данных
  const rows = items.map((item) => [
    item.title || "",
    item.price || "",
    item.quantity || "",
    item.link || "",
    item.brand || "",
  ]);

  // Объединяем заголовки и данные
  const allRows = [...rows];

  // Конвертируем в TSV (Tab-separated values)
  return allRows.map((row) => row.join("\t")).join("\n");
}

// Создание кнопки с указанным текстом и стилями
function createButton(text: string, styles: any, id: string): HTMLElement {
  return createElement(
    "div",
    text,
    {
      position: "fixed",
      backgroundColor: "tomato",
      color: "white",
      padding: "10px 15px",
      borderRadius: "5px",
      fontSize: "14px",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
      zIndex: "1000",
      cursor: "pointer",
      fontFamily: "Arial, sans-serif",
      userSelect: "none",
      ...styles,
    },
    undefined,
    id
  );
}

function handleEbayItem() {
  // Кнопка для JSON формата
  const jsonBtn = createButton(
    "JSON",
    {
      top: "100px",
      left: "20px",
    },
    "jsonBtn"
  );

  // Кнопка для Google Sheets формата
  const sheetsBtn = createButton(
    "Sheets",
    {
      top: "140px",
      left: "20px",
      backgroundColor: "#4285f4", // Google Blue
    },
    "sheetsBtn"
  );

  const ebaySelectors = [
    ".x-item-title__mainTitle",
    ".x-price-primary",
    ".ux-labels-values--brand > dd",
  ];

  const ebayElements = ebaySelectors.map((selector) =>
    document.querySelector(selector)
  );

  const [titleElement, priceElement, brandElement] = ebayElements;

  const ebayElementsTextContent = ebayElements.map((element) => {
    return element?.textContent || "";
  });

  const [title, price, brand] = ebayElementsTextContent;

  const quantity = 1;
  const link = window.location.href.split("?")[0];

  const result = { title, price, quantity, link, brand };

  document.body.focus();

  // Обработчик клавиш (JSON по умолчанию)
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey && e.key === "q") || e.key === "й") {
      copyToClipboard(JSON.stringify(result));
    }
    // Ctrl+Shift+Q для Google Sheets формата
    if (e.ctrlKey && e.shiftKey && (e.key === "Q" || e.key === "Й")) {
      const sheetsData = convertToSheetsFormat(result);
      copyToClipboard(sheetsData);
    }
  });

  try {
    // JSON кнопка
    jsonBtn.addEventListener("click", () => {
      copyToClipboard(JSON.stringify(result));
      showNotification("JSON скопирован!");
    });

    // Google Sheets кнопка
    sheetsBtn.addEventListener("click", () => {
      const sheetsData = convertToSheetsFormat(result);
      copyToClipboard(sheetsData);
      showNotification("Данные для Sheets скопированы!");
    });
  } catch (e) {
    console.error("clipboard button error on click", e);
  }
}

function handleEbayOrder() {
  // Кнопка для JSON формата
  const jsonBtn = createButton(
    "JSON",
    {
      bottom: "80px",
      right: "25px",
      padding: "80px 80px",
    },
    "jsonBtn"
  );

  // Кнопка для Google Sheets формата
  const sheetsBtn = createButton(
    "Sheets",
    {
      bottom: "25px",
      right: "25px",
      padding: "80px 80px",
      backgroundColor: "#4285f4", // Google Blue
    },
    "sheetsBtn"
  );

  const orderItems = document.querySelectorAll(".item-card");

  const readyToCopyArr: { [key: string]: string | number }[] = [];

  orderItems.forEach((item) => {
    const title =
      item.querySelector(".item-title .eui-text-span span")?.textContent || "";

    const aspectValues = item.querySelectorAll(".item-aspect-value");

    const quantityElement = Array.from(aspectValues)
      .map((element) => element.querySelector(".eui-text-span .SECONDARY"))
      .find((_) => _.textContent?.includes("Quantity"));

    const quantity = quantityElement
      ? quantityElement.textContent.replace("Quantity", "").trim()
      : "1";
    const price =
      item.querySelector(".item-price .eui-text-span span")?.textContent || "";
    const link =
      (item.querySelector(".item-page-content-link") as HTMLAnchorElement)
        ?.href || "";
    const brand = "";

    const handledPrice = quantityElement
      ? parseFloat(formatPrice(price)) / Number(quantity)
      : formatPrice(price);

    readyToCopyArr.push({
      title,
      price: String(handledPrice),
      quantity,
      link,
      brand,
    });
  });

  try {
    // JSON кнопка
    jsonBtn.addEventListener("click", () => {
      copyToClipboard(JSON.stringify(readyToCopyArr));
      showNotification("JSON скопирован!");
    });

    // Google Sheets кнопка
    sheetsBtn.addEventListener("click", () => {
      const sheetsData = convertToSheetsFormat(readyToCopyArr);
      copyToClipboard(sheetsData);
      showNotification("Данные для Sheets скопированы!");
    });
  } catch (e) {
    console.error("clipboard button error on click", e);
  }
}

// Функция для показа уведомлений
function showNotification(message: string) {
  const notification = createElement("div", message, {
    position: "fixed",
    top: "20px",
    right: "20px",
    backgroundColor: "#4caf50",
    color: "white",
    padding: "10px 20px",
    borderRadius: "5px",
    fontSize: "14px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
    zIndex: "10000",
    fontFamily: "Arial, sans-serif",
  });

  document.body.appendChild(notification);

  // Убираем уведомление через 2 секунды
  setTimeout(() => {
    if (notification && notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 2000);
}

export function ebayMain() {
  try {
    if (isEbayItem) {
      handleEbayItem();
    }
    if (isEbayOrder) {
      handleEbayOrder();
    }
  } catch (e) {
    console.error("ebayMain func error", e);
  }
}
