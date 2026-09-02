import { CLASSES } from './constants.js';
import { addClass, removeClass } from './utils.js';

let options = {};
export const getOptions = () => options;

// after an extension reload, scripts still running in open tabs lose their chrome.* APIs
const isExtensionContextValid = () => !!chrome.runtime?.id;
const readStoredOptions = async () => {
  if (!isExtensionContextValid()) {
    return null;
  }
  if (!chrome.storage?.local) {
    return {};
  }
  try {
    const storage = await chrome.storage.local.get('options');
    return storage.options || {};
  } catch (error) {
    return null;
  }
};

export const reloadOptions = async () => {
  const storedOptions = await readStoredOptions();
  if (!storedOptions) {
    // keep the last known options
    return;
  }
  options = storedOptions;
  options.reminderTreatment = options.reminderTreatment || 'containing-word';
  options.emailBundling = options.emailBundling || 'enabled';
  options.showAvatar = options.showAvatar || 'enabled';
  options.bundleOne = options.bundleOne || false;
  options.emptyInboxImage = options.emptyInboxImage || '';

  // Add option classes to body for css styling, removes avatars when disabled
  if (options.showAvatar === 'enabled') {
    addClass(document.body, CLASSES.AVATAR_OPTION_CLASS);
  } else if (options.showAvatar === 'disabled') {
    removeClass(document.body, CLASSES.AVATAR_OPTION_CLASS);
    // Remove avatar elements
    document.querySelectorAll(`.${CLASSES.AVATAR_EMAIL_CLASS}`).forEach(emailEl => removeClass(emailEl, CLASSES.AVATAR_EMAIL_CLASS));
    document.querySelectorAll(`.${CLASSES.AVATAR_CLASS}`).forEach(avatarEl => avatarEl.remove());
  }

  // Add option classes to body for css styling, and unbundle emails when disabled
  if (options.emailBundling === 'enabled') {
    addClass(document.body, CLASSES.BUNDLING_OPTION_CLASS);
  } else if (options.emailBundling === 'disabled') {
    removeClass(document.body, CLASSES.BUNDLING_OPTION_CLASS);
    // Unbundle emails
    document.querySelectorAll('[data-inbox="bundled"]').forEach(emailEl => emailEl.setAttribute('data-inbox', 'email'));
    // Remove bundle wrapper rows
    document.querySelectorAll(`.${CLASSES.BUNDLE_WRAPPER_CLASS}`).forEach(bundleEl => bundleEl.remove());
  }
};
