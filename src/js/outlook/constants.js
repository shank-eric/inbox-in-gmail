import { buildSelectors, observeForElement } from '../shared/utils.js';
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
  // one message in the open thread
  PREVIEW_THREAD_ROW: 'BS0OK',
  // sender + to/cc of an expanded message
  PREVIEW_MESSAGE_HEADER: 'mO63H',
  // conversation subject header
  PREVIEW_CALENDAR_CONFLICT_CONTAINER: 'EklBn',
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
  COMPOSE_SUBJECT_LINE: `${CLASS_SELECTORS.PREVIEW_COMPOSE} input[aria-label="Subject"]`,
  COMPOSE_NEW_MAIL_BUTTON: 'button[data-unique-id=Ribbon-588]',
  // "To" row: button + recipient editor
  COMPOSE_TO_ADDRESS_CONTAINER: `${CLASS_SELECTORS.PREVIEW_COMPOSE} .fui-Input:has([aria-label="To"])`,
  // the contact outlook suggests for what's typed in To
  COMPOSE_RECIPIENT_SUGGESTION: '#FloatingSuggestionsList [role="option"]',
  PREVIEW_PANE: `${CLASS_SELECTORS.PREVIEW_CONTAINER} #ReadingPaneContainerId`,
  // date group headers ("Today", "Yesterday", ...)
  TIME_ROW: '[id^="groupHeader"]',
  SELECTED_EMAIL: `${CLASS_SELECTORS.EMAIL_ROW}[aria-selected="true"]`,
  EMAIL_PARTICIPANTS: `${CLASS_SELECTORS.EMAIL_PARTICIPANT_CONTAINERS} span, .ESO13 span, .uSUBc span, .DOWm0 span`,
  EMAIL_LABELS: `${CLASS_SELECTORS.EMAIL_LABEL_CONTAINERS} ${CLASS_SELECTORS.EMAIL_LABEL_TEXTS}`,
  EMAIL_ROW_OUTER_CONTAINER: `${CLASS_SELECTORS.EMAIL_ROW_OUTER_CONTAINER_PRIMARY}, ${CLASS_SELECTORS.EMAIL_ROW_OUTER_CONTAINER_SECONDARY}`,
};

// outlook's fluent v9 checkbox keeps its state on the outer span and the check icon, so we copy their whole classNames
// (and the icon font's glyph)
const CHECKED_CHECKBOX_CLASSES = { ROOT: '', CHECKMARK: '', ICON_TEXT: '' };
const UNCHECKED_CHECKBOX_CLASSES = { ROOT: '', CHECKMARK: '', ICON_TEXT: '' };

const findClasses = (row, classesObj) => {
  classesObj.ROOT = row.querySelector('.fui-Checkbox').className;
  const icon = row.querySelector('.fui-Checkbox__indicator i');
  classesObj.CHECKMARK = icon.className;
  classesObj.ICON_TEXT = icon.textContent;
};

export const getCheckboxClasses = () => ({ CHECKED_CHECKBOX_CLASSES, UNCHECKED_CHECKBOX_CLASSES });
export const findCheckboxClasses = async () => {
  if (!!CHECKED_CHECKBOX_CLASSES.ROOT) {
    return;
  }
  const rowSelector = `${CLASS_SELECTORS.EMAIL_ROW}:not(.${CLASSES.BUNDLE_WRAPPER_CLASS})`;
  const firstEmailCheckbox = await observeForElement(document, `${rowSelector} [role="checkbox"]`);
  firstEmailCheckbox.click();
  const checkedCheckbox = await observeForElement(document, `${rowSelector} [role="checkbox"][aria-checked="true"]:has(.fui-Checkbox input:checked)`);
  findClasses(checkedCheckbox, CHECKED_CHECKBOX_CLASSES);
  const uncheckedCheckbox = document.querySelector(`${rowSelector} [role="checkbox"][aria-checked="false"]`);
  findClasses(uncheckedCheckbox, UNCHECKED_CHECKBOX_CLASSES);
  checkedCheckbox.click();
  document.querySelectorAll(`.${CLASSES.BUNDLE_WRAPPER_CLASS} .fui-Checkbox`).forEach(el => {
    el.className = UNCHECKED_CHECKBOX_CLASSES.ROOT;
    const icon = el.querySelector('.fui-Checkbox__indicator i');
    icon.className = UNCHECKED_CHECKBOX_CLASSES.CHECKMARK;
    icon.textContent = UNCHECKED_CHECKBOX_CLASSES.ICON_TEXT;
  });
};
