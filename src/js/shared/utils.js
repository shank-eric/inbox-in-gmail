// ---- HTML Elements ---- \\
export const observeForCondition = (el, condition) =>
  new Promise(resolve => {
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
      observer.observe(el, { subtree: true, childList: true, attributes: true });
    }
  });

export const observeForElement = (el, selector) => observeForCondition(el, () => el && el.querySelector(selector));
export const observeForRemoval = (el, selector) => observeForCondition(el, () => !el || !el.querySelector(selector));

export const runObserver = (element, options, callback, runContinously, existingObserver) => {
  if (existingObserver) {
    existingObserver.disconnect();
  }
  const observer = new MutationObserver(async () => {
    observer.disconnect();
    await callback();
    if (runContinously) {
      observer.observe(element, options);
    }
  });
  if (!element) {
    console.log('element not found');
    return null;
  }
  observer.observe(element, options);
  return observer;
};

export const querySelectorWithText = (selector, container = document) => {
  const element = container.querySelector(selector);
  return element ? { element, text: element.innerText } : { text: '' };
};
export const querySelectorText = (selector, container = document) => querySelectorWithText(selector, container).text;

export const htmlToElements = html => {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content.firstElementChild;
};

export const isTypable = element => {
  const role = element.getAttribute && element.getAttribute('role');
  const contentEditable = element.getAttribute && element.getAttribute('contenteditable');
  return ['INPUT', 'TEXTAREA'].includes(element.tagName) || role === 'textbox' || contentEditable === 'true';
};

export const pixelsToInt = pixels => (typeof pixels === 'number' ? pixels : parseInt(pixels.replace('px')));
export const addPixels = (...pixels) => {
  const pixelInt = pixels.reduce((pixelSum, pixel) => {
    pixelSum += pixelsToInt(pixel);
    return pixelSum;
  }, 0);
  return `${pixelInt}px`;
};

export const isInViewport = element => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
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
export const buildSelectors = classObject => objectMap(classObject, ([key, value]) => [key, `.${value.split(' ').join(' .')}`]);

// ---- Classes ---- \\
export const hasClass = (element, className) => element && element.classList && element.classList.contains(className);

export const addClass = (element, className) => {
  if (Array.isArray(className)) {
    className.forEach(classN => addClass(element, classN));
  } else if (element && !hasClass(element, className)) {
    element.classList.add(className);
  }
};

export const removeClass = (element, className) => {
  if (Array.isArray(className)) {
    className.forEach(classN => removeClass(element, classN));
  } else if (element && hasClass(element, className)) {
    element.classList.remove(className);
  }
};

export const replaceClass = (element, classToAdd, classToRemove) => {
  if (classToAdd === classToRemove) {
    return;
  }
  removeClass(element, classToRemove);
  addClass(element, classToAdd);
};

export const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

export const createRgba = (r, g, b, a) => {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};
export const createGradient = (colors, direction = 'to right') => {
  const gradient = `linear-gradient(${direction}, ${colors.join(', ')})`;
  return gradient;
};
