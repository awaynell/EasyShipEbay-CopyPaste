// ==UserScript==
// @name         EasyShipEbay CopyPaste
// @namespace    https://github.com/awaynell/EasyShipEbay-CopyPaste
// @version      1.0
// @description  Объединение двух скриптов для разных сайтов
// @author       Clovett
// @downloadURL  https://raw.githubusercontent.com/awaynell/EasyShipEbay-CopyPaste/main/EsEbCp.js
// @match        https://www.ebay.com/itm/*
// @match        https://lk.easyship.ru/ru/orders/Incoming/*
// ==/UserScript==

(function () {
  "use strict";

  const hostname = window.location.hostname;

  function formatPrice(price) {
    return price.replace(/^\D+/g, "").replace(",", ".");
  }

  function createElement(tag, textContent, style, parentTag) {
    const elem = document.createElement(tag);

    elem.textContent = textContent;

    Object.assign(elem.style, style);

    if (parentTag) {
      document.querySelector(parentTag).appendChild(elem);
    } else {
      document.body.appendChild(elem);
    }

    return elem;
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
    const inputs = document.querySelectorAll("input");

    const titleInput = inputs[0];
    const brandInput = inputs[1];
    const quantityInput = inputs[2];
    const priceInput = inputs[3];
    const linkInput = inputs[4];

    const parsedContent = JSON.parse(content);

    titleInput.value = parsedContent.title;
    brandInput.value = parsedContent.brand;
    quantityInput.value = parsedContent.quantity;
    priceInput.value = formatPrice(parsedContent.price);
    linkInput.value = parsedContent.link;
  }

  function easyShipMain() {
    const pasteBtn = createElement(
      "div",
      "Вставить",
      {
        backgroundColor: "white",
        cursor: "pointer",
        width: "fit-content",
        height: "fit-content",
        color: "tomato",
      },
      "div.shrink.buttons.margin-top-35 > div"
    );

    pasteBtn.addEventListener("click", () => {
      navigator.clipboard
        .readText()
        .then((content) => handleInputs(content))
        .catch((e) => console.log("script error", e));
    });
  }

  function ebayMain() {
    const clipboardBtn = createElement("div", "Скопировать", {
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
    });

    try {
      const titleElement = document.querySelector(".x-item-title__mainTitle");
      const priceElement = document.querySelector(".x-price-primary");
      const brandElement = document.querySelector(
        ".ux-labels-values--brand > dd"
      );

      if (!titleElement || !priceElement) {
        console.error("Не удалось найти элементы на странице");
        return;
      }

      const title = titleElement.textContent;
      const price = priceElement.textContent;
      const brand = brandElement.textContent;
      const quantity = 1;
      const link = window.location.href.split("?")[0];

      const result = { title, price, quantity, link, brand };

      try {
        clipboardBtn.addEventListener("click", () =>
          copyToClipboard(JSON.stringify(result))
        );
      } catch (e) {
        console.error("script error onclick", e);
      }
    } catch (e) {
      console.error("script error", e);
    }
  }

  function main() {
    if (hostname.includes("ebay.com")) {
      ebayMain();
    }

    if (hostname.includes("lk.easyship.ru") || hostname.includes("localhost")) {
      easyShipMain();
    }
  }

  window.addEventListener("load", main);
})();
