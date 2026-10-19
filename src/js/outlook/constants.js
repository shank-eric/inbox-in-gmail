import { addClass, buildSelectors, observeForElement } from '../shared/utils.js';
import { CLASSES } from '../shared/constants.js';

export const DEFAULT_PROFILE_URL = '';
export const OUTLOOK_CLASSES = {
  EMAIL_ROW: 'l8vF9',
  EMAIL_ROW_OUTER_CONTAINER_PRIMARY: 'gDC9O',
  EMAIL_ROW_OUTER_CONTAINER_SECONDARY: 'jGG6V',
  // paints row background/hover from outlook's variables
  EMAIL_ROW_OUTER_CONTAINER_BACKGROUND: 'UWKUc',
  EMAIL_ROW_INNER_CONTAINER: 'lHRXq',
  EMAIL_COLUMN_CONTAINER: 'hQj7T',
  EMAIL_CONTAINER: 'q9iRC',
  EMAIL_DATE: 'hwyHQ',
  EMAIL_LABEL_CONTAINERS: 'F6Q1l',
  EMAIL_LABEL_TEXTS: 'cFOen',
  EMAIL_PARTICIPANT_CONTAINERS: 'DOWm0',
  // container of the subject text in the email row
  EMAIL_SUBJECT: 'yg0l0',
  HIDDEN_EMAIL_ROW: 'l9cM7',
  // list + preview wrapper; our scroll container
  LIST_SCROLL_CONTAINER: 'G8_Dc',
  PREVIEW_WRAPPER: 'Q8TCC',
  PREVIEW_CONTAINER: 'Mq3cC',
  PREVIEW_COMPOSE: 'FXtdL',
  PREVIEW_CONVERSATION_CONTAINER: 'MtujV',
  PREVIEW_THREAD_ROW: 'SlLx9',
  // conversation subject header
  PREVIEW_CALENDAR_CONFLICT_CONTAINER: 'NTPm6',
  SCROLLBAR_ELEMENT: 'zXLz3',
  // set on the outer row container
  SELECTED_ROW: 'epBmH',
  SELECTED_EMAILS_MENU_CONTAINER: 'DPXAn',
  TOP_BAR_CONTAINER: 'bkYAr',
  UNREAD_EMAIL_ROW: 'DLvHz',
};

const CLASS_SELECTORS = buildSelectors(OUTLOOK_CLASSES);

export const OUTLOOK_SELECTORS = {
  ...CLASS_SELECTORS,
  COMPOSE_SUBJECT_LINE: '.Ut9Zz input',
  COMPOSE_NEW_MAIL_BUTTON: 'button[data-unique-id=Ribbon-588]',
  // "To" row: button + recipient editor
  COMPOSE_TO_ADDRESS_CONTAINER: `${CLASS_SELECTORS.PREVIEW_COMPOSE} .fui-Input:has([aria-label="To"])`,
  PREVIEW_PANE: `${CLASS_SELECTORS.PREVIEW_CONTAINER} #ReadingPaneContainerId`,
  // date group headers ("Today", "Yesterday", ...)
  TIME_ROW: '[id^="groupHeader"]',
  SELECTED_EMAIL: `${CLASS_SELECTORS.EMAIL_ROW}[aria-selected="true"]`,
  EMAIL_PARTICIPANTS: `${CLASS_SELECTORS.EMAIL_PARTICIPANT_CONTAINERS} span, .ESO13 span, .uSUBc span, .DOWm0 span`,
  EMAIL_LABELS: `${CLASS_SELECTORS.EMAIL_LABEL_CONTAINERS} ${CLASS_SELECTORS.EMAIL_LABEL_TEXTS}`,
  EMAIL_ROW_OUTER_CONTAINER: `${CLASS_SELECTORS.EMAIL_ROW_OUTER_CONTAINER_PRIMARY}, ${CLASS_SELECTORS.EMAIL_ROW_OUTER_CONTAINER_SECONDARY}`,
};

const findPrefixedClass = (el, prefix) => el && Array.from(el?.classList).find(c => c.startsWith(prefix));

const CHECKED_CHECKBOX_CLASSES = {
  ROOT: '',
  INPUT: '',
  LABEL: '',
  CHECKBOX: '',
  CHECKMARK: '',
};
const UNCHECKED_CHECKBOX_CLASSES = {
  ROOT: '',
  INPUT: '',
  LABEL: '',
  CHECKBOX: '',
  CHECKMARK: '',
};

const findClasses = (firstEmailCheckbox, classesObj) => {
  classesObj.ROOT = findPrefixedClass(firstEmailCheckbox.querySelector('.ms-Checkbox'), 'root-');
  classesObj.INPUT = findPrefixedClass(firstEmailCheckbox.querySelector('input'), 'input-');
  classesObj.LABEL = findPrefixedClass(firstEmailCheckbox.querySelector('label'), 'label-');
  classesObj.CHECKBOX = findPrefixedClass(firstEmailCheckbox.querySelector('.ms-Checkbox-checkbox'), 'checkbox-');
  classesObj.CHECKMARK = findPrefixedClass(firstEmailCheckbox.querySelector('.ms-Checkbox-checkmark'), 'checkmark-');
};

export const getCheckboxClasses = () => ({ CHECKED_CHECKBOX_CLASSES, UNCHECKED_CHECKBOX_CLASSES });
export const findCheckboxClasses = async () => {
  if (!!CHECKED_CHECKBOX_CLASSES.ROOT) {
    return;
  }
  const firstEmailCheckbox = await observeForElement(document, `${CLASS_SELECTORS.EMAIL_ROW} [role="checkbox"]`);
  firstEmailCheckbox.click();
  const checkedCheckbox = await observeForElement(document, `${CLASS_SELECTORS.EMAIL_ROW} [aria-checked="true"] .is-checked.ms-Checkbox[class*="root-"]`);
  findClasses(checkedCheckbox, CHECKED_CHECKBOX_CLASSES);
  const uncheckedCheckbox = document.querySelector(`${CLASS_SELECTORS.EMAIL_ROW}:not(.bundle-wrapper) [role="checkbox"][aria-checked="false"]`);
  findClasses(uncheckedCheckbox, UNCHECKED_CHECKBOX_CLASSES);
  checkedCheckbox.click();
  document.querySelectorAll(`.${CLASSES.BUNDLE_WRAPPER_CLASS} .ms-Checkbox`).forEach(el => {
    addClass(el, UNCHECKED_CHECKBOX_CLASSES.ROOT);
    addClass(el.querySelector('input'), UNCHECKED_CHECKBOX_CLASSES.INPUT);
    addClass(el.querySelector('label'), UNCHECKED_CHECKBOX_CLASSES.LABEL);
    addClass(el.querySelector('.ms-Checkbox-checkbox'), UNCHECKED_CHECKBOX_CLASSES.CHECKBOX);
    addClass(el.querySelector('.ms-Checkbox-checkmark'), UNCHECKED_CHECKBOX_CLASSES.CHECKMARK);
  });
};
