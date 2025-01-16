export function createElement(
  tag: string,
  textContent: string,
  style: Partial<CSSStyleDeclaration>,
  parentTag?: string,
  id?: string
): HTMLElement {
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
