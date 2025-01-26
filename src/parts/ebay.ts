import { copyToClipboard, createElement, formatPrice, log } from "@/utils";

const pathname = window.location.pathname;

const isEbayItem = pathname.startsWith("/itm");

const isEbayOrder = pathname.startsWith("/ord");

function handleEbayItem() {
  const clipboardBtn = createElement(
    "div",
    "Скопировать",
    {
      position: "fixed",
      top: "100px",
      left: "20px",
      backgroundColor: "tomato",
      color: "white",
      padding: "10px 10px",
      borderRadius: "5px",
      fontSize: "14px",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
      zIndex: "1000",
      cursor: "pointer",
    },
    undefined,
    "clipboardBtn"
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

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey && e.key === "q") || e.key === "й") {
      copyToClipboard(JSON.stringify(result));
    }
  });

  try {
    clipboardBtn.addEventListener("click", () =>
      copyToClipboard(JSON.stringify(result))
    );
  } catch (e) {
    console.error("clipboard button error on click", e);
  }
}

function handleEbayOrder() {
  const clipboardBtn = createElement(
    "div",
    "Скопировать",
    {
      position: "fixed",
      bottom: "25px",
      right: "25px",
      backgroundColor: "tomato",
      color: "white",
      padding: "100px 100px",
      borderRadius: "5px",
      fontSize: "14px",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
      zIndex: "9999",
      cursor: "pointer",
    },
    undefined,
    "clipboardBtn"
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

    log.info({
      handledPrice,
      aspectValues,
      quantityElement,
      quantity,
      title,
      link,
      brand,
    });

    readyToCopyArr.push({
      title,
      price: handledPrice,
      quantity,
      link,
      brand,
    });
  });

  log.info({ readyToCopyArr, clipboardBtn, orderItems });

  try {
    clipboardBtn.addEventListener("click", () =>
      copyToClipboard(JSON.stringify(readyToCopyArr))
    );
  } catch (e) {
    console.error("clipboard button error on click", e);
  }
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
