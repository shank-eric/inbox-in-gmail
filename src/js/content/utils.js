// ---- HTML Elements ---- \\
export const observeForCondition = (el, condition) => new Promise(
  resolve => {
    let satisfied = condition();
    if (satisfied) {
      resolve(satisfied);
    }
    const observer = new MutationObserver(() => {
      satisfied = condition();
      if (satisfied) {
        observer.disconnect();
        resolve(satisfied);
      }
    });
    if (el) {
      observer.observe(el, { subtree: true, childList: true });
    }
  }
);

export const observeForElement = (el, selector) => observeForCondition(el, () => el && el.querySelector(selector));
export const observeForRemoval = (el, selector) => observeForCondition(el, () => !el || !el.querySelector(selector));
export const startObserver = (observer, element, options, callback) => {
  if (observer) {
    observer.disconnect();
  }
  observer = new MutationObserver(callback);
  observer.observe(element, options);
  return observer;
};

export const querySelectorWithText = (selector, container = document) => {
  const element = container.querySelector(selector);
  return element ? { element, text: element.innerText } : {};
};
export const querySelectorText = (selector, container = document) => querySelectorWithText(selector, container).text;

export const htmlToElements = html => {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content.firstElementChild;
};

export const isTypable = element => {
  const role = element.getAttribute && element.getAttribute('role');
  return [ 'INPUT', 'TEXTAREA' ].includes(element.tagName) || (role === 'textbox');
};

export const pixelsToInt = pixels => (typeof pixels === 'number' ? pixels : parseInt(pixels.replace('px')));
export const addPixels = (...pixels) => {
  const pixelInt = pixels.reduce((pixel, pixelSum) => {
    pixelSum += pixelsToInt(pixel);
    return pixelSum;
  }, 0);
  return `${pixelInt}px`;
};

export const encodeBundleId = bundleId => encodeURIComponent(bundleId.replace(/[/\\& ]/g, '-'));

export const queryParentSelector = (el, selector) => {
  if (!el) {
    return null;
  }
  let parent = el.parentElement;
  while (parent && !parent.matches(selector)) {
    parent = parent.parentElement;
    if (!parent) {
      return null;
    }
  }
  return parent;
};

export const objectMap = (obj, fn) => Object.fromEntries(Object.entries(obj).map(fn));

// ---- Classes ---- \\
export const hasClass = (element, className) => element && element.classList && element.classList.contains(className);

export const addClass = (element, className) => {
  if (element && !hasClass(element, className)) {
    element.classList.add(className);
  }
};

export const removeClass = (element, className) => {
  if (element && hasClass(element, className)) {
    element.classList.remove(className);
  }
};

export const addRemoveClass = (element, classToAdd, classToRemove) => {
  if (classToAdd === classToRemove) {
    return;
  }
  addClass(element, classToAdd);
  removeClass(element, classToRemove);
};
