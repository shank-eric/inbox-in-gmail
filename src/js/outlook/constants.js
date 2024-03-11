import { addClass, buildSelectors, observeForElement } from '../shared/utils.js';
import { CLASSES } from '../shared/constants.js';

export const DEFAULT_PROFILE_URL = '';
export const OUTLOOK_CLASSES = {
  COMPOSE_SUBJECT_LINE: 'TK0zZ',
  EMAIL_ROW: 'jGG6V',
  EMAIL_ROW_INNER_CONTAINER: 'zKDWD',
  EMAIL_COLUMN_CONTAINER: 'y1E5h',
  EMAIL_CONTAINER: 'q9iRC',
  EMAIL_DATE: 'hwyHQ',
  EMAIL_LABEL_CONTAINERS: 'F6Q1l',
  EMAIL_LABEL_TEXTS: 'cFOen',
  EMAIL_PARTICIPANT_CONTAINERS: 'Dc0o9',
  EMAIL_SUBJECT: 'vTzd2',
  HIDDEN_EMAIL_ROW: 'l9cM7',
  HIDE_AVATAR: 'oWYiS',
  INBOX: 'mKBmm',
  PREVIEW_WRAPPER: 'Q8TCC',
  PREVIEW_CONTAINER: 'Mq3cC',
  PREVIEW_COMPOSE: 'soZTT',
  SCROLLBAR_ELEMENT: 'zXLz3',
  SELECTED_ROW: 'epBmH',
  TIME_ROW: 'Cnnoo',
  UNREAD_EMAIL_ROW: 'cSOXK',
  UNSELECTED_ROW: 'IjQyD',
};

const CLASS_SELECTORS = buildSelectors(OUTLOOK_CLASSES);

export const OUTLOOK_SELECTORS = {
  ...CLASS_SELECTORS,
  COMPOSE_NEW_MAIL_BUTTON: 'button[data-unique-id=Ribbon-588]',
  COMPOSE_TO_ADDRESS: '.AtODR .T6Va1',
  PREVIEW_PANE: `${CLASS_SELECTORS.PREVIEW_CONTAINER} #ReadingPaneContainerId`,
  SELECTED_EMAIL: `${CLASS_SELECTORS.EMAIL_ROW}[aria-selected="true"]`,
  EMAIL_PARTICIPANTS: `${CLASS_SELECTORS.EMAIL_PARTICIPANT_CONTAINERS} span, .Ljsqx span, .uSUBc span`,
  EMAIL_LABELS: `${CLASS_SELECTORS.EMAIL_LABEL_CONTAINERS} ${CLASS_SELECTORS.EMAIL_LABEL_TEXTS}`,
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
