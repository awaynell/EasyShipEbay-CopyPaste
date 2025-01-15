// ==UserScript==
// @name         EasyShipEbay CopyPaste
// @namespace    https://github.com/awaynell/EasyShipEbay-CopyPaste
// @version      1.0
// @description  Объединение двух скриптов для разных сайтов
// @author       Clovett
// @match        https://www.ebay.com/itm/*
// @match        https://lk.easyship.ru/*
// @match        https://creations.mattel.com/*
// ==/UserScript==

(function () {
  "use strict";

  let inputs = [];

  let easyShipClipboardItemsCount = 0;

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

  const waitForElement = (selector, parent, timeout = 5000) =>
    new Promise((resolve, reject) => {
      const interval = 100;
      const startTime = Date.now();

      const checkElement = () => {
        const element = parent.querySelector(selector);
        if (element) {
          resolve(element);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error("Элемент не найден за отведенное время"));
        } else {
          setTimeout(checkElement, interval);
        }
      };

      checkElement();
    });

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

  const handleEasyShipModal = (modal) => {
    console.log("modal", modal);
    const parentSelector = "div > div.shrink.buttons.margin-top-35";

    const parentElem = modal.querySelector(parentSelector);

    Object.assign(parentElem.style, {
      display: "flex",
      position: "relative",
    });

    const pasteBtnElem = modal.querySelector("#pasteBtn");

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

    document.body.focus();

    const pasteBtnClickHandler = () => {
      navigator.clipboard
        .readText()
        .then((content) => {
          const parsedContent = JSON.parse(content);
          if (Array.isArray(parsedContent) && parsedContent.length > 1) {
            console.log("parsed content with length > 1", parsedContent);

            handleInputs(JSON.stringify(parsedContent[0]));

            waitForElement("div.shrink.buttons > div > div > span", modal, 1000)
              .then((addItemNewModalBtn) => {
                console.log("Кнопка добавления найдена!", addItemNewModalBtn);
                addItemNewModalBtn.click();
              })
              .catch((error) => console.error(error.message));

            const parsedContentWithoutCurrentItemLength =
              parsedContent.slice(1).length;

            easyShipClipboardItemsCount = parsedContentWithoutCurrentItemLength;

            console.log(
              "current easyShipClipboardItemsCount",
              easyShipClipboardItemsCount
            );

            const readyToCopyContent =
              parsedContentWithoutCurrentItemLength > 1
                ? JSON.stringify(parsedContent.slice(1))
                : JSON.stringify(parsedContent.slice(1)[0]);

            console.log("readyToCopyContent", readyToCopyContent);

            copyToClipboard(readyToCopyContent);

            return;
          }

          if (easyShipClipboardItemsCount === 1) {
            easyShipClipboardItemsCount = 0;
          }

          handleInputs(content);

          const saveBtn = document.querySelector(
            "div.shrink.buttons.margin-top-35 > div.button.radius-20.hover-highlight.pos-relative.bg-green-gradient.width-275 > div"
          );
          saveBtn.click();
        })
        .catch((e) => console.log("clipboard reading error", e));
    };

    if (easyShipClipboardItemsCount !== 0) {
      pasteBtnClickHandler();

      return;
    }

    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey && e.key === "q") || e.key === "й") {
        pasteBtnClickHandler();
      }
    });

    pasteBtn.addEventListener("click", pasteBtnClickHandler);
  };

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

  function creationsMattelMain() {
    try {
      const parentTable = ".order__items";

      const parentTableElem = document.querySelector(parentTable);

      const orderItems = parentTableElem.querySelectorAll("tr.order-item");

      // Проходимся по каждому найденному элементу
      orderItems.forEach((item) => {
        // Извлекаем ссылку на продукт
        const linkElement = item.querySelector(".order-item__info .link");

        const productLink = `${linkElement?.href}` || "Ссылка не найдена";
        const productName =
          linkElement?.textContent.trim() || "Название не найдено";

        // Извлекаем цену
        const priceElement = item.querySelector(".order-item__unit-price");

        const productPrice =
          priceElement?.textContent.trim() || "Цена не найдена";

        // Извлекаем количество
        const quantityElement = item.querySelector(".order-item__quantity");

        const productQuantity =
          quantityElement?.textContent.trim() || "Количество не найдено";

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

  function easyShipMain() {
    try {
      observeModal(handleEasyShipModal);
    } catch (e) {
      console.error("easyShipMain func error", e);
    }
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
        return element?.textContent || "";
      });

      const [title, price, brand] = ebayElementsTextContent;

      if (!titleElement || !priceElement || !brandElement) {
        console.error("Не удалось найти элементы на странице");
        return;
      }

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
    } catch (e) {
      console.error("ebayMain func error", e);
    }
  }

  function main() {
    const hostname = window.location.hostname;

    const ebayHostname = "ebay.com";
    const easyShipHostname = "easyship.ru";
    const creationsMattel = "creations.mattel.com";
    const _localhost = "localhost";

    if (hostname.includes(ebayHostname)) {
      ebayMain();
    }

    if (hostname.includes(easyShipHostname) || hostname.includes(_localhost)) {
      easyShipMain();
    }

    if (hostname.includes(creationsMattel)) {
      creationsMattelMain();
    }
  }

  window.addEventListener("load", main);
})();
