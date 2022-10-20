import { buildSelectors } from '../shared/utils.js';

export const MONTHS = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ];

export const NAME_COLORS = [ '1bbc9b', '16a086', 'f1c40f', 'f39c11', '2dcc70', '27ae61', 'd93939', 'd25400', '3598db', '297fb8', 'e84c3d', 'c1392b',
  '9a59b5', '8d44ad', 'bec3c7', '34495e', '2d3e50', '95a5a4', '7e8e8e', 'ec87bf', 'd870ad', 'f69785', '9ba37e', 'b49255', 'b49255', 'a94136' ];

export const DATE_LABELS = {
  TODAY: 'Today',
  YESTERDAY: 'Yesterday',
  THIS_MONTH: 'This month',
  LAST_YEAR: 'Last year'
};

export const CLASSES = {
  AVATAR_EMAIL_CLASS: 'email-with-avatar',
  AVATAR_CLASS: 'avatar',
  AVATAR_OPTION_CLASS: 'show-avatar-enabled',
  BUNDLING_OPTION_CLASS: 'email-bundling-enabled',
  BUNDLE_PAGE_CLASS: 'bundle-page',
  BUNDLE_WRAPPER_CLASS: 'bundle-wrapper',
  CALENDAR_EMAIL_CLASS: 'calendar-event',
  CALENDAR_ATTACHMENT_CLASS: 'calendar-attachment',
  REMINDER_EMAIL_CLASS: 'reminder',
  TIME_ROW: 'time-row',
  UNREAD_BUNDLE_CLASS: 'contains-unread',
  UNBUNDLED_PARENT_LABEL: 'Unbundled'
};

export const GMAIL_CLASSES = {
  EMAIL_CONTAINER: 'BltHke',
  EMAIL_DATE_CONTAINER: 'xW',
  EMAIL_LABEL_CONTAINERS: 'ar',
  EMAIL_LABEL_TEXTS: 'av',
  EMAIL_LABELS: 'at',
  EMAIL_PARTICIPANT_CONTAINERS: 'yW',
  EMAIL_SUBJECT: 'y6',
  EMAIL_ROW: 'zA',
  UNREAD_EMAIL_ROW: 'zE'
};

const CLASS_SELECTORS = buildSelectors(GMAIL_CLASSES);

export const GMAIL_SELECTORS = {
  ...CLASS_SELECTORS,
  // EMAIL_CONTAINER: '.BltHke', // could add .nH.oy8Mbf
  EMAIL_DATE: `${CLASS_SELECTORS.EMAIL_DATE_CONTAINER} span`,
  EMAIL_PARTICIPANTS: `${CLASS_SELECTORS.EMAIL_PARTICIPANT_CONTAINERS} span[email]`,
  PREVIEW_PANE: '.Nu.S3.aZ6',
  SELECTED_EMAIL: `${CLASS_SELECTORS.EMAIL_ROW}.btb`
};

// export const OUTLOOK_CLASSES = {
//   EMAIL_ROW: 'hcptT',
//   EMAIL_ROW_INNER_CONTAINER: 'zKDWD',
//   EMAIL_COLUMN_CONTAINER: 'y1E5h',
//   EMAIL_CONTAINER: 'q9iRC',
//   EMAIL_DATE: 'hwyHQ',
//   EMAIL_LABEL_CONTAINERS: 'F6Q1l',
//   EMAIL_LABEL_TEXTS: 'cFOen',
//   EMAIL_PARTICIPANT_CONTAINERS: 'gy2aJ',
//   EMAIL_SUBJECT: 'vTzd2',
//   HIDDEN_EMAIL_ROW: 'l9cM7',
//   HIDE_AVATAR: 'oWYiS',
//   INBOX: 'mKBmm',
//   // INBOX_HEADER: 'UF2Vc',
//   // PINNED_EMAIL_ROW: 'fWXdQ',
//   PREVIEW_ELEMENTS: 'c2xp6',
//   PREVIEW_CONTAINER: 'Mq3cC',
//   PREVIEW_COMPOSE: 'soZTT',
//   SCROLLBAR_ELEMENT: 'zXLz3',
//   SELECTED_ROW: 'epBmH',
//   TIME_ROW: 'Cnnoo',
//   UNREAD_EMAIL_ROW: 'VcZPl',
//   UNSELECTED_ROW: 'IjQyD'
// };

// const CLASS_SELECTORS = objectMap(OUTLOOK_CLASSES, ([ key, value ]) => [ key, `.${value.split(' ').join(' .')}` ]);

// export const OUTLOOK_SELECTORS = {
//   ...CLASS_SELECTORS,
//   PREVIEW_PANE: `${CLASS_SELECTORS.PREVIEW_CONTAINER} #ReadingPaneContainerId`,
//   SELECTED_EMAIL: `${CLASS_SELECTORS.EMAIL_ROW}[aria-selected="true"]`,
//   EMAIL_PARTICIPANTS: `${CLASS_SELECTORS.EMAIL_PARTICIPANT_CONTAINERS} span, .Ljsqx span, .uSUBc span`,
//   EMAIL_LABELS: `${CLASS_SELECTORS.EMAIL_LABEL_CONTAINERS} ${CLASS_SELECTORS.EMAIL_LABEL_TEXTS}`
// };

export const DEFAULT_PROFILE_URL = '//ssl.gstatic.com/ui/v1/icons/mail/profile_mask2.png';

// const findPrefixedClass = (el, prefix) => Array.from(el?.classList).find(c => c.startsWith(prefix));
// const findPrefixedClasses = (el, prefixes) => prefixes.map(prefix => findPrefixedClass(el, prefix));

// const CHECKBOX_CLASSES = {
//   UNCHECKED_ROOT: '',
//   UNCHECKED_CHECK: '',
//   UNCHECKED_CIRCLE: '',
//   CHECKED_ROOT: '',
//   CHECKED_CHECK: '',
//   CHECKED_CIRCLE: ''
// };
// export const getCheckboxClasses = () => CHECKBOX_CLASSES;
// export const findCheckboxClasses = async () => {
//   if (CHECKBOX_CLASSES.UNCHECKED_ROOT !== '') {
//     return;
//   }
//   const firstEmailCheckbox = await observeForElement(document, '.ms-Check[class*="root-"]');
//   CHECKBOX_CLASSES.UNCHECKED_ROOT = findPrefixedClass(firstEmailCheckbox, 'root-');
//   CHECKBOX_CLASSES.UNCHECKED_CHECK = findPrefixedClasses(firstEmailCheckbox.querySelector('.ms-Check-check'), [ 'check-', 'css-', 'root-' ]);
//   CHECKBOX_CLASSES.UNCHECKED_CIRCLE = findPrefixedClasses(firstEmailCheckbox.querySelector('.ms-Check-circle'), [ 'circle-', 'css-', 'root-' ]);
//   firstEmailCheckbox.click();
//   await observeForCondition(firstEmailCheckbox, () => !hasClass(firstEmailCheckbox, CHECKBOX_CLASSES.UNCHECKED_ROOT));
//   CHECKBOX_CLASSES.CHECKED_ROOT = findPrefixedClass(firstEmailCheckbox, 'root-');
//   CHECKBOX_CLASSES.CHECKED_CHECK = findPrefixedClasses(firstEmailCheckbox.querySelector('.ms-Check-check'), [ 'check-', 'css-', 'root-' ]);
//   CHECKBOX_CLASSES.CHECKED_CIRCLE = findPrefixedClasses(firstEmailCheckbox.querySelector('.ms-Check-circle'), [ 'circle-', 'css-', 'root-' ]);
//   firstEmailCheckbox.click();
//   document.querySelectorAll(`${CLASSES.BUNDLE_WRAPPER_CLASS} .ms-Check`).forEach(el => addClass(el, CHECKBOX_CLASSES.UNCHECKED_ROOT));
//   document.querySelectorAll(`${CLASSES.BUNDLE_WRAPPER_CLASS} .ms-Check-circle`).forEach(el => addClass(el, CHECKBOX_CLASSES.UNCHECKED_CIRCLE));
//   document.querySelectorAll(`${CLASSES.BUNDLE_WRAPPER_CLASS} .ms-Check-check`).forEach(el => addClass(el, CHECKBOX_CLASSES.UNCHECKED_CHECK));
// };
