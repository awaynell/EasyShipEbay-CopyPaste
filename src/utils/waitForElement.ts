export const waitForElement = (
  selector: string,
  parent: Document | Element,
  timeout: number = 5000
): Promise<Element> => {
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
