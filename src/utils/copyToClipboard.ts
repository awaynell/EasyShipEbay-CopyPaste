import { createElement } from "./createElement";

export function copyToClipboard(content: string) {
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
