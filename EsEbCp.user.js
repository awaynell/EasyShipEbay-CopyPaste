// ==UserScript==
// @name         EasyShipEbay CopyPaste
// @namespace    https://github.com/awaynell/EasyShipEbay-CopyPaste
// @version      1.0
// @description  Объединение двух скриптов для разных сайтов
// @author       Clovett
// @match        https://www.ebay.com/itm/*
// @match        https://lk.easyship.ru/*
// ==/UserScript==

(function () {
  "use strict";

  let inputs = [];

  function formatPrice(price) {
    return price.replace(/^\D+/g, "").replace(",", ".");
  }

  function createElement(tag, textContent, style, parentTag, id) {
    const elem = document.createElement(tag);

    elem.textContent = textContent;

    elem.id = id;

    Object.assign(elem.style, style);

    if (parentTag) {
      document.querySelector(parentTag)?.appendChild(elem);
    } else {
      document.body.appendChild(elem);
    }

    return elem;
  }

  function observeModal() {
    const modalSelector = 'div[role="dialog"][aria-modal="true"]';
    const observer = new MutationObserver(handleMutations);

    function handleMutations(mutations) {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          const modals = document.querySelectorAll(modalSelector);
          const [first, second] = modals;

          if (second) {
            inputs = second.querySelectorAll("input");
            easyShipMain();
            break;
          }
        }
      }
    }

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }

  function copyToClipboard(content) {
    navigator.clipboard.writeText(content);

    const notification = createElement("div", "Скопировано", {
      position: "fixed",
      top: "20px",
      right: "20px",
      backgroundColor: "#4caf50",
      color: "white",
      padding: "10px 20px",
      borderRadius: "5px",
      fontSize: "14px",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
      zIndex: "1000",
    });

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  function handleInputs(content) {
    const parsedContent = JSON.parse(content);

    const fields = ["title", "brand", "quantity", "price", "link"];

    fields.forEach((field, index) => {
      if (inputs[index]) {
        inputs[index].defaultValue =
          field === "price"
            ? formatPrice(parsedContent[field])
            : parsedContent[field];

        const event = new Event("input", { bubbles: true });
        inputs[index].dispatchEvent(event);
      }
    });
  }

  function easyShipMain() {
    const parentSelector =
      "body > div:nth-child(24) > div > div > div.modal-body > div > div.shrink.buttons.margin-top-35";

    const parentElem = document.querySelector(parentSelector);

    Object.assign(parentElem.style, {
      display: "flex",
      position: "relative",
    });
    const pasteBtnElem = document.querySelector("#pasteBtn");

    if (pasteBtnElem) return;

    const pasteBtn = createElement(
      "div",
      "Вставить",
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
        padding: "10px",
      },
      parentSelector,
      "pasteBtn"
    );

    pasteBtn.addEventListener("click", () => {
      navigator.clipboard
        .readText()
        .then((content) => handleInputs(content))
        .catch((e) => console.log("clipboard reading error", e));
    });
  }

  function ebayMain() {
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

    try {
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
        return element.textContent;
      });

      const [title, price, brand] = ebayElementsTextContent;

      if (!titleElement || !priceElement || !brandElement) {
        console.error("Не удалось найти элементы на странице");
        return;
      }

      const quantity = 1;
      const link = window.location.href.split("?")[0];

      const result = { title, price, quantity, link, brand };

      try {
        clipboardBtn.addEventListener("click", () =>
          copyToClipboard(JSON.stringify(result))
        );
      } catch (e) {
        console.error("clipboard button error on click", e);
      }
    } catch (e) {
      console.error("ebayMain func error", e);
    }
  }

  function main() {
    const hostname = window.location.hostname;

    const ebayHostname = "ebay.com";
    const easyShipHostname = "easyship.ru";
    const _localhost = "localhost";

    if (hostname.includes(ebayHostname)) {
      ebayMain();
    }

    if (hostname.includes(easyShipHostname) || hostname.includes(_localhost)) {
      observeModal();
    }
  }

  window.addEventListener("load", main);
})();
