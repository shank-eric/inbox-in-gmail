const REMINDER_TREATMENT_SELECTOR = 'input[name=reminder-treatment]';
const EMAIL_ALIASES_SELECTOR = 'input[name=email-aliases]';
const BUNDLED_EMAIL_SELECTOR = 'input[name=email-bundling]';
const AVATAR_SELECTOR = 'input[name=avatar]';
const BUNDLE_ONE_SELECTOR = 'input[name=bundle-one]';

function selectRadioWithValue(selector, value) {
  document.querySelectorAll(selector).forEach(radioInput => {
    if (radioInput.value === value) {
      radioInput.checked = true;
    }
  });
}

function setCheckbox(selector, value) {
  document.querySelector(selector).checked = !!value;
}

const getSelectedRadioValue = selector => document.querySelector(`${selector}:checked`).value;
const getCheckboxState = selector => document.querySelector(selector).checked;

function saveOptions() {
  const bundleOne = getCheckboxState(BUNDLE_ONE_SELECTOR);
  const emailAliases = document.querySelector(EMAIL_ALIASES_SELECTOR).value;
  const emailBundling = getSelectedRadioValue(BUNDLED_EMAIL_SELECTOR);
  const reminderTreatment = getSelectedRadioValue(REMINDER_TREATMENT_SELECTOR);
  const showAvatar = getSelectedRadioValue(AVATAR_SELECTOR);

  const options = {
    bundleOne,
    emailAliases,
    emailBundling,
    reminderTreatment,
    showAvatar,
  };

  chrome.storage.local.set({ options });
}

async function restoreOptions() {
  const { options } = !!chrome.storage?.local ? await chrome.storage?.local.get('options') : {};
  selectRadioWithValue(REMINDER_TREATMENT_SELECTOR, options.reminderTreatment);
  selectRadioWithValue(BUNDLED_EMAIL_SELECTOR, options.emailBundling);
  selectRadioWithValue(AVATAR_SELECTOR, options.showAvatar);
  setCheckbox(BUNDLE_ONE_SELECTOR, options.bundleOne);
  document.querySelector(EMAIL_ALIASES_SELECTOR).value = options.emailAliases || '';
}

const monitorChange = element => element.addEventListener('click', saveOptions);

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelectorAll(REMINDER_TREATMENT_SELECTOR).forEach(monitorChange);
document.querySelectorAll(BUNDLED_EMAIL_SELECTOR).forEach(monitorChange);
document.querySelectorAll(AVATAR_SELECTOR).forEach(monitorChange);
monitorChange(document.querySelector(BUNDLE_ONE_SELECTOR));
document.querySelector(EMAIL_ALIASES_SELECTOR).addEventListener('input', saveOptions);
