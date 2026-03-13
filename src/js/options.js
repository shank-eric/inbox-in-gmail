const REMINDER_TREATMENT_SELECTOR = 'input[name=reminder-treatment]';
const EMAIL_ALIASES_SELECTOR = 'input[name=email-aliases]';
const BUNDLED_EMAIL_SELECTOR = 'input[name=email-bundling]';
const AVATAR_SELECTOR = 'input[name=avatar]';
const BUNDLE_ONE_SELECTOR = 'input[name=bundle-one]';
const EMPTY_IMAGE_INPUT = '#empty-inbox-image';
const EMPTY_IMAGE_DATA = '#empty-inbox-image-data';
const EMPTY_IMAGE_PREVIEW = '#empty-inbox-preview';
const EMPTY_IMAGE_REMOVE = '#empty-inbox-remove';

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
    emptyInboxImage: document.querySelector(EMPTY_IMAGE_DATA).value || '',
  };

  chrome.storage.local.set({ options });
}

async function restoreOptions() {
  const { options } = !!chrome.storage?.local ? await chrome.storage?.local.get('options') : {};
  selectRadioWithValue(REMINDER_TREATMENT_SELECTOR, options?.reminderTreatment);
  selectRadioWithValue(BUNDLED_EMAIL_SELECTOR, options?.emailBundling);
  selectRadioWithValue(AVATAR_SELECTOR, options?.showAvatar);
  setCheckbox(BUNDLE_ONE_SELECTOR, options?.bundleOne);
  document.querySelector(EMAIL_ALIASES_SELECTOR).value = options?.emailAliases || '';
  const imgData = options?.emptyInboxImage || '';
  document.querySelector(EMPTY_IMAGE_DATA).value = imgData;
  const preview = document.querySelector(EMPTY_IMAGE_PREVIEW);
  if (imgData) {
    preview.style.backgroundImage = `url("${imgData}")`;
    preview.style.display = 'block';
    document.documentElement.style.setProperty('--empty-inbox-image', `url("${imgData}")`);
  } else {
    preview.style.backgroundImage = '';
    preview.style.display = 'none';
    document.documentElement.style.removeProperty('--empty-inbox-image');
  }
}

const monitorChange = element => element.addEventListener('click', saveOptions);

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelectorAll(REMINDER_TREATMENT_SELECTOR).forEach(monitorChange);
document.querySelectorAll(BUNDLED_EMAIL_SELECTOR).forEach(monitorChange);
document.querySelectorAll(AVATAR_SELECTOR).forEach(monitorChange);
monitorChange(document.querySelector(BUNDLE_ONE_SELECTOR));
document.querySelector(EMAIL_ALIASES_SELECTOR).addEventListener('input', saveOptions);

// Handle image selection and preview
const fileInput = document.querySelector(EMPTY_IMAGE_INPUT);
if (fileInput) {
  fileInput.addEventListener('change', function () {
    const file = this.files && this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const data = e.target.result;
      const preview = document.querySelector(EMPTY_IMAGE_PREVIEW);
      document.querySelector(EMPTY_IMAGE_DATA).value = data;
      preview.style.backgroundImage = `url("${data}")`;
      preview.style.display = 'block';
      // also set CSS variable so preview matches content rendering
      document.documentElement.style.setProperty('--empty-inbox-image', `url("${data}")`);
      saveOptions();
    };
    reader.readAsDataURL(file);
  });
}

const removeBtn = document.querySelector(EMPTY_IMAGE_REMOVE);
if (removeBtn) {
  removeBtn.addEventListener('click', () => {
    document.querySelector(EMPTY_IMAGE_DATA).value = '';
    const preview = document.querySelector(EMPTY_IMAGE_PREVIEW);
    preview.style.backgroundImage = '';
    preview.style.display = 'none';
    // clear the file input value if present
    if (fileInput) fileInput.value = '';
    // clear CSS variable used by content
    document.documentElement.style.removeProperty('--empty-inbox-image');
    saveOptions();
  });
}
