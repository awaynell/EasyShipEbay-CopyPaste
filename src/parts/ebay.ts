import { copyToClipboard, createElement, formatPrice, log } from "@/utils";

const pathname = window.location.pathname;

const isEbayItem = pathname.startsWith("/itm");
const isEbayOrder = pathname.startsWith("/ord");

// Функция для конвертации данных в формат для Google Sheets (TSV)
function convertToSheetsFormat(data: any): string {
  // Если это один объект, преобразуем в массив
  const items = Array.isArray(data) ? data : [data];

  // Создаем строки данных
  // Порядок: наименование - количество - ценник - доставка
  const rows = items.map((item) => {
    // Форматируем цену: заменяем точку на запятую для Excel
    const formattedPrice = item.price ? String(item.price).replace(".", ",") : "";
    const formattedShipping = item.shipping ? String(item.shipping).replace(".", ",") : "";
    
    return [
      item.title || "",
      item.quantity || "",
      formattedPrice,
      formattedShipping,
    ];
  });

  // Конвертируем в TSV (Tab-separated values)
  return rows.map((row) => row.join("\t")).join("\n");
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
    log.error(`clipboard button error on click: ${e}`);
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

  // Массив для JSON (оригинальные данные)
  const readyToCopyArr: { [key: string]: string | number }[] = [];
  const readyToSheetsArr: { [key: string]: string | number }[] = [];

  // Собираем информацию о товарах
  let totalQuantity = 0; // Общее количество всех товаров
  let positionsCount = 0; // Количество позиций (строк) в заказе

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

    const priceForOneItem = quantityElement
      ? parseFloat(formatPrice(price)) / Number(quantity)
      : formatPrice(price);

    totalQuantity += Number(quantity);
    positionsCount++; // Увеличиваем счётчик позиций

    readyToCopyArr.push({
      title,
      price: String(priceForOneItem),
      quantity,
      link,
      brand,
    });

    readyToSheetsArr.push({
      title,
      priceForAllItems: formatPrice(price),
      quantity,
      link,
      brand,
    });
  });

  log.info("📦 Собранные данные для таблиц (readyToSheetsArr):");
  log.info(readyToSheetsArr);

  // Ищем стоимость доставки на странице
  let shippingPerItem = 0;
  try {
    log.info("🔍 Начинаем искать доставку...");
    log.info(`📦 Общее количество товаров: ${totalQuantity}`);
    log.info(`📦 Количество позиций (строк): ${positionsCount}`);
    
    // Ищем элемент "Shipping" в payment-line-items
    const paymentLineItems = document.querySelector(".payment-line-items");
    log.info(`📋 Найден payment-line-items: ${!!paymentLineItems}`);
    
    if (paymentLineItems) {
      // Находим все строки с label-value
      const labelValueLines = paymentLineItems.querySelectorAll(".eui-label-value-line");
      log.info(`📝 Найдено строк label-value: ${labelValueLines.length}`);
      
      for (const line of labelValueLines) {
        const label = line.querySelector("dt");
        const labelText = label?.textContent?.trim();
        log.info(`🏷️ Проверяем label: ${labelText}`);
        
        if (label && label.textContent?.includes("Shipping")) {
          log.info("✅ Нашли строку с Shipping!");
          
          // Нашли строку с "Shipping", теперь берём значение из dd
          const valueElement = line.querySelector("dd");
          const valueText = valueElement?.textContent?.trim();
          log.info(`💰 Текст значения доставки: ${valueText}`);
          
          if (valueElement && valueElement.textContent) {
            const shippingText = valueElement.textContent.trim();
            const formattedShipping = formatPrice(shippingText);
            log.info(`🔧 После formatPrice: ${formattedShipping}`);
            
            const totalShipping = parseFloat(formattedShipping);
            log.info(`🔢 totalShipping (число): ${totalShipping}`);
            
            if (!isNaN(totalShipping) && totalShipping > 0 && totalQuantity > 0) {
              shippingPerItem = totalShipping / totalQuantity;
              log.info(`✨ Доставка на один товар: ${shippingPerItem}`);
            } else {
              log.warn({
                message: "❌ Не прошла проверка",
                isNaN: isNaN(totalShipping),
                totalShipping,
                totalQuantity
              });
            }
            break;
          }
        }
      }
    } else {
      log.warn("❌ payment-line-items не найден");
    }
    
    log.info(`📊 Итоговая доставка на один товар: ${shippingPerItem}`);
  } catch (e) {
    log.error(`❌ Ошибка при получении стоимости доставки: ${e}`);
  }

  // Отдельный массив для таблиц с доставкой
  const sheetsDataArr = readyToSheetsArr.map((item) => {
    return {
      title: item.title,
      quantity: item.quantity,
      price: item.priceForAllItems,
      shipping: shippingPerItem ? shippingPerItem.toFixed(2) : "",
    };
  });
  
  log.info("📋 Массив для таблиц (sheetsDataArr):");
  log.info(sheetsDataArr);

  try {
    // JSON кнопка - оригинальные данные
    jsonBtn.addEventListener("click", () => {
      copyToClipboard(JSON.stringify(readyToCopyArr));
      showNotification("JSON скопирован!");
    });

    // Google Sheets кнопка - данные с доставкой
    sheetsBtn.addEventListener("click", () => {
      log.info("🔄 Нажата кнопка Sheets");
      log.info("📊 Данные для конвертации:");
      log.info(sheetsDataArr);
      const sheetsData = convertToSheetsFormat(sheetsDataArr);
      log.info("📋 Результат конвертации:");
      log.info(sheetsData);
      copyToClipboard(sheetsData);
      showNotification("Данные для Sheets скопированы!");
    });
  } catch (e) {
    log.error(`clipboard button error on click: ${e}`);
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
    log.error(`ebayMain func error: ${e}`);
  }
}
