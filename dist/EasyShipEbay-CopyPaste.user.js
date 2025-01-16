// ==UserScript==
// @name        EasyShipEbay-CopyPaste
// @version     0.2.0
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
  function ebayMain() {
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
    try {
      const ebaySelectors = [
        ".x-item-title__mainTitle",
        ".x-price-primary",
        ".ux-labels-values--brand > dd"
      ];
      const ebayElements = ebaySelectors.map(
        (selector) => document.querySelector(selector)
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
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "q" || e.key === "\u0439") {
        navigator.clipboard.readText().then((content) => handleInputs(inputs, content)).catch((e2) => console.log("clipboard reading error", e2));
      }
    });
    pasteBtn.addEventListener("click", () => {
      navigator.clipboard.readText().then((content) => handleInputs(inputs, content)).catch((e) => console.log("clipboard reading error", e));
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
