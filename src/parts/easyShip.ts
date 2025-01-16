import {
  copyToClipboard,
  createElement,
  formatPrice,
  waitForElement,
} from "@/utils";

let inputs: NodeList;
let easyShipClipboardItemsCount = 0;

const pasteBtnClickHandler = (modal: HTMLDivElement) => {
  navigator.clipboard
    .readText()
    .then((content) => {
      const parsedContent = JSON.parse(content);
      if (Array.isArray(parsedContent) && parsedContent.length > 1) {
        console.log("parsed content with length > 1", parsedContent);
        handleInputs(inputs, JSON.stringify(parsedContent[0]));
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
      handleInputs(inputs, content);
      const saveBtn = document.querySelector(
        "div.shrink.buttons.margin-top-35 > div.button.radius-20.hover-highlight.pos-relative.bg-green-gradient.width-275 > div"
      );
      saveBtn.click();
    })
    .catch((e) => console.log("clipboard reading error", e));
};

function observeModal(onModalDetected: (second: Element) => void) {
  const modalSelector = 'div[role="dialog"][aria-modal="true"]';
  const observer = new MutationObserver(handleMutations);

  function handleMutations(mutations: MutationRecord[]) {
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

function handleInputs(inputs: NodeList, content: string) {
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

const handleEasyShipModal = (modal: HTMLDivElement) => {
  const parentSelector = "div > div.shrink.buttons.margin-top-35";

  const parentElem = modal.querySelector(parentSelector) as HTMLDivElement;

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

  if (easyShipClipboardItemsCount !== 0) {
    pasteBtnClickHandler(modal);
    return;
  }

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey && e.key === "q") || e.key === "й") {
      pasteBtnClickHandler(modal);
    }
  });

  pasteBtn.addEventListener("click", () => {
    pasteBtnClickHandler(modal);
  });
};

export function easyShipMain() {
  try {
    observeModal(handleEasyShipModal);
  } catch (e) {
    console.error("easyShipMain func error", e);
  }
}
