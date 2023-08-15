import { addClass, hasClass, buildSelectors, observeForCondition, observeForElement } from '../shared/utils.js';
import { CLASSES } from '../shared/constants.js';

export const DEFAULT_PROFILE_URL = '';
export const OUTLOOK_CLASSES = {
  EMAIL_ROW: 'hcptT',
  EMAIL_ROW_INNER_CONTAINER: 'YbB6r',
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
  PREVIEW_WRAPPER: 'MtujV',
  PREVIEW_CONTAINER: 'Mq3cC',
  PREVIEW_COMPOSE: 'soZTT',
  SCROLLBAR_ELEMENT: 'zXLz3',
  SELECTED_ROW: 'epBmH',
  TIME_ROW: 'Cnnoo',
  UNREAD_EMAIL_ROW: 'VcZPl',
  UNSELECTED_ROW: 'IjQyD',
};

const CLASS_SELECTORS = buildSelectors(OUTLOOK_CLASSES);

export const OUTLOOK_SELECTORS = {
  ...CLASS_SELECTORS,
  PREVIEW_PANE: `${CLASS_SELECTORS.PREVIEW_CONTAINER} #ReadingPaneContainerId`,
  SELECTED_EMAIL: `${CLASS_SELECTORS.EMAIL_ROW}[aria-selected="true"]`,
  EMAIL_PARTICIPANTS: `${CLASS_SELECTORS.EMAIL_PARTICIPANT_CONTAINERS} span, .Ljsqx span, .uSUBc span`,
  EMAIL_LABELS: `${CLASS_SELECTORS.EMAIL_LABEL_CONTAINERS} ${CLASS_SELECTORS.EMAIL_LABEL_TEXTS}`,
};

const findPrefixedClass = (el, prefix) => Array.from(el?.classList).find(c => c.startsWith(prefix));
const findPrefixedClasses = (el, prefixes) => prefixes.map(prefix => findPrefixedClass(el, prefix));

const CHECKBOX_CLASSES = {
  UNCHECKED_ROOT: '',
  UNCHECKED_CHECK: '',
  UNCHECKED_CIRCLE: '',
  CHECKED_ROOT: '',
  CHECKED_CHECK: '',
  CHECKED_CIRCLE: '',
};

export const getCheckboxClasses = () => CHECKBOX_CLASSES;
export const findCheckboxClasses = async () => {
  if (CHECKBOX_CLASSES.UNCHECKED_ROOT !== '') {
    return;
  }
  const firstEmailCheckbox = await observeForElement(document, '.ms-Check[class*="root-"]');
  CHECKBOX_CLASSES.UNCHECKED_ROOT = findPrefixedClass(firstEmailCheckbox, 'root-');
  CHECKBOX_CLASSES.UNCHECKED_CHECK = findPrefixedClasses(firstEmailCheckbox.querySelector('.ms-Check-check'), ['check-', 'css-', 'root-']);
  CHECKBOX_CLASSES.UNCHECKED_CIRCLE = findPrefixedClasses(firstEmailCheckbox.querySelector('.ms-Check-circle'), ['circle-', 'css-', 'root-']);
  firstEmailCheckbox.click();
  await observeForCondition(firstEmailCheckbox, () => !hasClass(firstEmailCheckbox, CHECKBOX_CLASSES.UNCHECKED_ROOT));
  CHECKBOX_CLASSES.CHECKED_ROOT = findPrefixedClass(firstEmailCheckbox, 'root-');
  CHECKBOX_CLASSES.CHECKED_CHECK = findPrefixedClasses(firstEmailCheckbox.querySelector('.ms-Check-check'), ['check-', 'css-', 'root-']);
  CHECKBOX_CLASSES.CHECKED_CIRCLE = findPrefixedClasses(firstEmailCheckbox.querySelector('.ms-Check-circle'), ['circle-', 'css-', 'root-']);
  firstEmailCheckbox.click();
  document.querySelectorAll(`${CLASSES.BUNDLE_WRAPPER_CLASS} .ms-Check`).forEach(el => addClass(el, CHECKBOX_CLASSES.UNCHECKED_ROOT));
  document.querySelectorAll(`${CLASSES.BUNDLE_WRAPPER_CLASS} .ms-Check-circle`).forEach(el => addClass(el, CHECKBOX_CLASSES.UNCHECKED_CIRCLE));
  document.querySelectorAll(`${CLASSES.BUNDLE_WRAPPER_CLASS} .ms-Check-check`).forEach(el => addClass(el, CHECKBOX_CLASSES.UNCHECKED_CHECK));
};
