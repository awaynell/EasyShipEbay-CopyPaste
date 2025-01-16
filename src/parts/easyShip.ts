import { createElement, formatPrice } from "@/utils";

let inputs: NodeList;

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

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey && e.key === "q") || e.key === "й") {
      navigator.clipboard
        .readText()
        .then((content) => handleInputs(inputs, content))
        .catch((e) => console.log("clipboard reading error", e));
    }
  });

  pasteBtn.addEventListener("click", () => {
    navigator.clipboard
      .readText()
      .then((content) => handleInputs(inputs, content))
      .catch((e) => console.log("clipboard reading error", e));
  });
};

export function easyShipMain() {
  try {
    observeModal(handleEasyShipModal);
  } catch (e) {
    console.error("easyShipMain func error", e);
  }
}
