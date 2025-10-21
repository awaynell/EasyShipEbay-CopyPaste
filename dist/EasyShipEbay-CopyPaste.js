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
  function convertToSheetsFormat(data) {
    const items = Array.isArray(data) ? data : [data];
    const rows = items.map((item) => {
      const formattedPrice = item.price ? String(item.price).replace(".", ",") : "";
      const formattedShipping = item.shipping ? String(item.shipping).replace(".", ",") : "";
      return [
        item.title || "",
        item.quantity || "",
        formattedPrice,
        formattedShipping
      ];
    });
    return rows.map((row) => row.join("	")).join("\n");
  }
  function createButton(text, styles, id) {
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
        ...styles
      },
      void 0,
      id
    );
  }
  function handleEbayItem() {
    const jsonBtn = createButton(
      "JSON",
      {
        top: "100px",
        left: "20px"
      },
      "jsonBtn"
    );
    const sheetsBtn = createButton(
      "Sheets",
      {
        top: "140px",
        left: "20px",
        backgroundColor: "#4285f4"
        // Google Blue
      },
      "sheetsBtn"
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
      if (e.ctrlKey && e.shiftKey && (e.key === "Q" || e.key === "\u0419")) {
        const sheetsData = convertToSheetsFormat(result);
        copyToClipboard(sheetsData);
      }
    });
    try {
      jsonBtn.addEventListener("click", () => {
        copyToClipboard(JSON.stringify(result));
        showNotification("JSON \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D!");
      });
      sheetsBtn.addEventListener("click", () => {
        const sheetsData = convertToSheetsFormat(result);
        copyToClipboard(sheetsData);
        showNotification("\u0414\u0430\u043D\u043D\u044B\u0435 \u0434\u043B\u044F Sheets \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u044B!");
      });
    } catch (e) {
      log.error(`clipboard button error on click: ${e}`);
    }
  }
  function handleEbayOrder() {
    const jsonBtn = createButton(
      "JSON",
      {
        bottom: "80px",
        right: "25px",
        padding: "80px 80px"
      },
      "jsonBtn"
    );
    const sheetsBtn = createButton(
      "Sheets",
      {
        bottom: "25px",
        right: "25px",
        padding: "80px 80px",
        backgroundColor: "#4285f4"
        // Google Blue
      },
      "sheetsBtn"
    );
    const orderItems = document.querySelectorAll(".item-card");
    const readyToCopyArr = [];
    const readyToSheetsArr = [];
    let totalQuantity = 0;
    let positionsCount = 0;
    orderItems.forEach((item) => {
      const title = item.querySelector(".item-title .eui-text-span span")?.textContent || "";
      const aspectValues = item.querySelectorAll(".item-aspect-value");
      const quantityElement = Array.from(aspectValues).map((element) => element.querySelector(".eui-text-span .SECONDARY")).find((_) => _.textContent?.includes("Quantity"));
      const quantity = quantityElement ? quantityElement.textContent.replace("Quantity", "").trim() : "1";
      const price = item.querySelector(".item-price .eui-text-span span")?.textContent || "";
      const link = item.querySelector(".item-page-content-link")?.href || "";
      const brand = "";
      const priceForOneItem = quantityElement ? parseFloat(formatPrice(price)) / Number(quantity) : formatPrice(price);
      totalQuantity += Number(quantity);
      positionsCount++;
      readyToCopyArr.push({
        title,
        price: String(priceForOneItem),
        quantity,
        link,
        brand
      });
      readyToSheetsArr.push({
        title,
        priceForAllItems: formatPrice(price),
        quantity,
        link,
        brand
      });
    });
    log.info("\u{1F4E6} \u0421\u043E\u0431\u0440\u0430\u043D\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u0434\u043B\u044F \u0442\u0430\u0431\u043B\u0438\u0446 (readyToSheetsArr):");
    log.info(readyToSheetsArr);
    let shippingPerItem = 0;
    try {
      log.info("\u{1F50D} \u041D\u0430\u0447\u0438\u043D\u0430\u0435\u043C \u0438\u0441\u043A\u0430\u0442\u044C \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0443...");
      log.info(`\u{1F4E6} \u041E\u0431\u0449\u0435\u0435 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0442\u043E\u0432\u0430\u0440\u043E\u0432: ${totalQuantity}`);
      log.info(`\u{1F4E6} \u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u043F\u043E\u0437\u0438\u0446\u0438\u0439 (\u0441\u0442\u0440\u043E\u043A): ${positionsCount}`);
      const paymentLineItems = document.querySelector(".payment-line-items");
      log.info(`\u{1F4CB} \u041D\u0430\u0439\u0434\u0435\u043D payment-line-items: ${!!paymentLineItems}`);
      if (paymentLineItems) {
        const labelValueLines = paymentLineItems.querySelectorAll(".eui-label-value-line");
        log.info(`\u{1F4DD} \u041D\u0430\u0439\u0434\u0435\u043D\u043E \u0441\u0442\u0440\u043E\u043A label-value: ${labelValueLines.length}`);
        for (const line of labelValueLines) {
          const label = line.querySelector("dt");
          const labelText = label?.textContent?.trim();
          log.info(`\u{1F3F7}\uFE0F \u041F\u0440\u043E\u0432\u0435\u0440\u044F\u0435\u043C label: ${labelText}`);
          if (label && label.textContent?.includes("Shipping")) {
            log.info("\u2705 \u041D\u0430\u0448\u043B\u0438 \u0441\u0442\u0440\u043E\u043A\u0443 \u0441 Shipping!");
            const valueElement = line.querySelector("dd");
            const valueText = valueElement?.textContent?.trim();
            log.info(`\u{1F4B0} \u0422\u0435\u043A\u0441\u0442 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0438: ${valueText}`);
            if (valueElement && valueElement.textContent) {
              const shippingText = valueElement.textContent.trim();
              const formattedShipping = formatPrice(shippingText);
              log.info(`\u{1F527} \u041F\u043E\u0441\u043B\u0435 formatPrice: ${formattedShipping}`);
              const totalShipping = parseFloat(formattedShipping);
              log.info(`\u{1F522} totalShipping (\u0447\u0438\u0441\u043B\u043E): ${totalShipping}`);
              if (!isNaN(totalShipping) && totalShipping > 0 && totalQuantity > 0) {
                shippingPerItem = totalShipping / totalQuantity;
                log.info(`\u2728 \u0414\u043E\u0441\u0442\u0430\u0432\u043A\u0430 \u043D\u0430 \u043E\u0434\u0438\u043D \u0442\u043E\u0432\u0430\u0440: ${shippingPerItem}`);
              } else {
                log.warn({
                  message: "\u274C \u041D\u0435 \u043F\u0440\u043E\u0448\u043B\u0430 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0430",
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
        log.warn("\u274C payment-line-items \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D");
      }
      log.info(`\u{1F4CA} \u0418\u0442\u043E\u0433\u043E\u0432\u0430\u044F \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0430 \u043D\u0430 \u043E\u0434\u0438\u043D \u0442\u043E\u0432\u0430\u0440: ${shippingPerItem}`);
    } catch (e) {
      log.error(`\u274C \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0441\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u0438 \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0438: ${e}`);
    }
    const sheetsDataArr = readyToSheetsArr.map((item) => {
      return {
        title: item.title,
        quantity: item.quantity,
        price: item.priceForAllItems,
        shipping: shippingPerItem ? shippingPerItem.toFixed(2) : ""
      };
    });
    log.info("\u{1F4CB} \u041C\u0430\u0441\u0441\u0438\u0432 \u0434\u043B\u044F \u0442\u0430\u0431\u043B\u0438\u0446 (sheetsDataArr):");
    log.info(sheetsDataArr);
    try {
      jsonBtn.addEventListener("click", () => {
        copyToClipboard(JSON.stringify(readyToCopyArr));
        showNotification("JSON \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D!");
      });
      sheetsBtn.addEventListener("click", () => {
        log.info("\u{1F504} \u041D\u0430\u0436\u0430\u0442\u0430 \u043A\u043D\u043E\u043F\u043A\u0430 Sheets");
        log.info("\u{1F4CA} \u0414\u0430\u043D\u043D\u044B\u0435 \u0434\u043B\u044F \u043A\u043E\u043D\u0432\u0435\u0440\u0442\u0430\u0446\u0438\u0438:");
        log.info(sheetsDataArr);
        const sheetsData = convertToSheetsFormat(sheetsDataArr);
        log.info("\u{1F4CB} \u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u043A\u043E\u043D\u0432\u0435\u0440\u0442\u0430\u0446\u0438\u0438:");
        log.info(sheetsData);
        copyToClipboard(sheetsData);
        showNotification("\u0414\u0430\u043D\u043D\u044B\u0435 \u0434\u043B\u044F Sheets \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u044B!");
      });
    } catch (e) {
      log.error(`clipboard button error on click: ${e}`);
    }
  }
  function showNotification(message) {
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
      fontFamily: "Arial, sans-serif"
    });
    document.body.appendChild(notification);
    setTimeout(() => {
      if (notification && notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 2e3);
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
      log.error(`ebayMain func error: ${e}`);
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
