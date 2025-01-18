// ==UserScript==
// @name        EasyShipEbay-CopyPaste
// @version     0.2.0
// @match       https://order.ebay.com/ord/show*
// @match       https://www.ebay.com/itm/*
// @match       https://lk.easyship.ru/*
// @match       https://creations.mattel.com/*
// @namespace   https://github.com/awaynell/EasyShipEbay-CopyPaste
// @description Объединение двух скриптов для разных сайтов и немножко еще
// @author      Clovett
// ==/UserScript==

(function() {
  "use strict";
  function createElement(tag, textContent, style, parentTag, id) {
    const element = document.createElement(tag);
    element.textContent = textContent;
    element.id = id;
    Object.assign(element.style, style);
    const parent = parentTag ? document.querySelector(parentTag) : document.body;
    if (parent) {
      parent.appendChild(element);
    } else {
      throw new Error(`Parent element not found: ${parentTag}`);
    }
    return element;
  }
  function formatPrice(price) {
    return price.replace(/^\D+/g, "").replace(",", ".");
  }
  function copyToClipboard(content) {
    navigator.clipboard.writeText(content);
    const notification = createElement("div", "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043E", {
      position: "fixed",
      top: "20px",
      right: "20px",
      backgroundColor: "#4caf50",
      color: "white",
      padding: "10px 20px",
      borderRadius: "5px",
      fontSize: "14px",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
      zIndex: "1000"
    });
    setTimeout(() => {
      notification.remove();
    }, 3e3);
  }
  const waitForElement = (selector, parent, timeout = 5e3) => {
    const startTime = Date.now();
    const interval = 100;
    return new Promise((resolve, reject) => {
      const checkElement = () => {
        const element = parent.querySelector(selector);
        if (element) {
          resolve(element);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`Element not found within ${timeout}ms`));
        } else {
          globalThis.setTimeout(checkElement, interval);
        }
      };
      checkElement();
    });
  };
  function logger(prefix) {
    return {
      error: (message) => console.error(`[${prefix}]`, message),
      warn: (message) => console.warn(`[${prefix}]`, message),
      info: (message) => console.log(`[${prefix}]`, message)
    };
  }
  const log = logger("EsEbCp");
  const pathname = window.location.pathname;
  const isEbayItem = pathname.startsWith("/itm");
  const isEbayOrder = pathname.startsWith("/ord");
  function handleEbayItem() {
    const clipboardBtn = createElement(
      "div",
      "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C",
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
        cursor: "pointer"
      },
      void 0,
      "clipboardBtn"
    );
    const ebaySelectors = [
      ".x-item-title__mainTitle",
      ".x-price-primary",
      ".ux-labels-values--brand > dd"
    ];
    const ebayElements = ebaySelectors.map(
      (selector) => document.querySelector(selector)
    );
    const ebayElementsTextContent = ebayElements.map((element) => {
      return element?.textContent || "";
    });
    const [title, price, brand] = ebayElementsTextContent;
    const quantity = 1;
    const link = window.location.href.split("?")[0];
    const result = { title, price, quantity, link, brand };
    document.body.focus();
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "q" || e.key === "\u0439") {
        copyToClipboard(JSON.stringify(result));
      }
    });
    try {
      clipboardBtn.addEventListener(
        "click",
        () => copyToClipboard(JSON.stringify(result))
      );
    } catch (e) {
      console.error("clipboard button error on click", e);
    }
  }
  function handleEbayOrder() {
    const clipboardBtn = createElement(
      "div",
      "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C",
      {
        position: "relative",
        backgroundColor: "tomato",
        color: "white",
        padding: "10px 10px",
        borderRadius: "5px",
        fontSize: "14px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
        zIndex: "1000",
        cursor: "pointer"
      },
      "item-card-container",
      "clipboardBtn"
    );
    const orderItems = document.querySelectorAll(".item-card");
    const readyToCopyArr = [];
    orderItems.forEach((item) => {
      const title = item.querySelector(".item-title .eui-text-span span")?.textContent || "";
      const quantityElement = item.querySelector(
        ".item-aspect-value .eui-text-span span.SECONDARY"
      );
      const quantity = quantityElement ? quantityElement.textContent.replace("Quantity", "").trim() : "1";
      const price = item.querySelector(".item-price .eui-text-span span")?.textContent || "";
      const link = item.querySelector(".item-page-content-link")?.href || "";
      const brand = "";
      const handledPrice = quantityElement ? parseFloat(formatPrice(price)) / Number(quantity) : formatPrice(price);
      readyToCopyArr.push({
        title,
        price: String(handledPrice),
        quantity,
        link,
        brand
      });
    });
    log.info({ readyToCopyArr, clipboardBtn, orderItems });
    try {
      clipboardBtn.addEventListener(
        "click",
        () => copyToClipboard(JSON.stringify(readyToCopyArr))
      );
    } catch (e) {
      console.error("clipboard button error on click", e);
    }
  }
  function ebayMain() {
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
  function creationsMattelMain() {
    try {
      const parentTable = ".order__items";
      const parentTableElem = document.querySelector(parentTable);
      const orderItems = parentTableElem?.querySelectorAll("tr.order-item");
      orderItems?.forEach((item) => {
        const linkElement = item.querySelector(".order-item__info .link");
        const productLink = `${linkElement?.href}` || "\u0421\u0441\u044B\u043B\u043A\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430";
        const productName = linkElement?.textContent?.trim() || "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E";
        const priceElement = item.querySelector(".order-item__unit-price");
        const productPrice = priceElement?.textContent?.trim() || "\u0426\u0435\u043D\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430";
        const quantityElement = item.querySelector(".order-item__quantity");
        const productQuantity = quantityElement?.textContent?.trim() || "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E";
        const clipboardBtn = createElement(
          "div",
          "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C",
          {
            position: "relative",
            backgroundColor: "tomato",
            color: "white",
            padding: "10px 10px",
            borderRadius: "5px",
            fontSize: "14px"
          },
          void 0,
          "clipboardBtn"
        );
        item.appendChild(clipboardBtn);
        clipboardBtn.addEventListener("click", () => {
          const result = {
            title: productName,
            price: productPrice,
            quantity: productQuantity,
            link: productLink
          };
          copyToClipboard(JSON.stringify(result));
        });
      });
    } catch (e) {
      console.error("ebayMain func error", e);
    }
  }
  let inputs;
  let easyShipClipboardItemsCount = 0;
  const pasteBtnClickHandler = (modal) => {
    navigator.clipboard.readText().then((content) => {
      const parsedContent = JSON.parse(content);
      if (Array.isArray(parsedContent) && parsedContent.length > 1) {
        handleInputs(inputs, JSON.stringify(parsedContent[0]));
        waitForElement("div.shrink.buttons > div > div > span", modal, 1e3).then((addItemNewModalBtn) => {
          addItemNewModalBtn.click();
        }).catch((error) => console.error(error.message));
        const parsedContentWithoutCurrentItemLength = parsedContent.slice(1).length;
        easyShipClipboardItemsCount = parsedContentWithoutCurrentItemLength;
        const readyToCopyContent = parsedContentWithoutCurrentItemLength > 1 ? JSON.stringify(parsedContent.slice(1)) : JSON.stringify(parsedContent.slice(1)[0]);
        copyToClipboard(readyToCopyContent);
        return;
      }
      if (easyShipClipboardItemsCount === 1) {
        easyShipClipboardItemsCount = 0;
      }
      handleInputs(inputs, content);
      const saveBtn = document.querySelector(
        "div.shrink.buttons.margin-top-35 > div.button.radius-20.hover-highlight.pos-relative.bg-green-gradient.width-275 > div"
      );
      saveBtn.click();
    }).catch((e) => console.log("clipboard reading error", e));
  };
  function observeModal(onModalDetected) {
    const modalSelector = 'div[role="dialog"][aria-modal="true"]';
    const observer = new MutationObserver(handleMutations);
    function handleMutations(mutations) {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          const modals = document.querySelectorAll(modalSelector);
          const [first, second] = modals;
          if (second) {
            inputs = second.querySelectorAll("input");
            onModalDetected(second);
            break;
          }
        }
      }
    }
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }
  function handleInputs(inputs2, content) {
    const parsedContent = JSON.parse(content);
    const fields = ["title", "brand", "quantity", "price", "link"];
    fields.forEach((field, index) => {
      if (inputs2[index]) {
        inputs2[index].defaultValue = field === "price" ? formatPrice(parsedContent[field]) : parsedContent[field];
        const event = new Event("input", { bubbles: true });
        inputs2[index].dispatchEvent(event);
      }
    });
  }
  const handleEasyShipModal = (modal) => {
    const parentSelector = "div > div.shrink.buttons.margin-top-35";
    const parentElem = modal.querySelector(parentSelector);
    Object.assign(parentElem.style, {
      display: "flex",
      position: "relative"
    });
    const pasteBtnElem = modal.querySelector("#pasteBtn");
    if (pasteBtnElem) return;
    const pasteBtn = createElement(
      "div",
      "\u0412\u0441\u0442\u0430\u0432\u0438\u0442\u044C",
      {
        position: "absolute",
        bottom: "0px",
        right: "20px",
        backgroundColor: "#cddc39",
        borderRadius: "10px",
        cursor: "pointer",
        width: "fit-content",
        height: "fit-content",
        zIndex: "1000",
        border: "2px solid #fdf5e6",
        color: "#fdf5e6",
        padding: "10px"
      },
      parentSelector,
      "pasteBtn"
    );
    document.body.focus();
    if (easyShipClipboardItemsCount !== 0) {
      pasteBtnClickHandler(modal);
      return;
    }
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "q" || e.key === "\u0439") {
        pasteBtnClickHandler(modal);
      }
    });
    pasteBtn.addEventListener("click", () => {
      pasteBtnClickHandler(modal);
    });
  };
  function easyShipMain() {
    try {
      observeModal(handleEasyShipModal);
    } catch (e) {
      console.error("easyShipMain func error", e);
    }
  }
  const hostname = window.location.hostname;
  const hostnames = {
    ebayHostname: "ebay.com",
    easyShipHostname: "easyship.ru",
    creationsMattel: "creations.mattel.com",
    _localhost: "localhost"
  };
  function main() {
    if (hostname.includes(hostnames.ebayHostname)) {
      ebayMain();
    }
    if (hostname.includes(hostnames.easyShipHostname) || hostname.includes(hostnames._localhost)) {
      easyShipMain();
    }
    if (hostname.includes(hostnames.creationsMattel)) {
      creationsMattelMain();
    }
  }
  main();
})();
