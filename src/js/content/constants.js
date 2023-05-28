import { objectMap } from '../shared/utils.js';

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const NAME_COLORS = [
  '1bbc9b',
  '16a086',
  'f1c40f',
  'f39c11',
  '2dcc70',
  '27ae61',
  'd93939',
  'd25400',
  '3598db',
  '297fb8',
  'e84c3d',
  'c1392b',
  '9a59b5',
  '8d44ad',
  'bec3c7',
  '34495e',
  '2d3e50',
  '95a5a4',
  '7e8e8e',
  'ec87bf',
  'd870ad',
  'f69785',
  '9ba37e',
  'b49255',
  'b49255',
  'a94136',
];

export const DATE_LABELS = {
  TODAY: 'Today',
  YESTERDAY: 'Yesterday',
  THIS_MONTH: 'This month',
  LAST_YEAR: 'Last year',
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
  UNBUNDLED_PARENT_LABEL: 'Unbundled',
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
  UNREAD_EMAIL_ROW: 'zE',
};

const CLASS_SELECTORS = objectMap(GMAIL_CLASSES, ([key, value]) => [key, `.${value.split(' ').join(' .')}`]);

export const GMAIL_SELECTORS = {
  ...CLASS_SELECTORS,
  // EMAIL_CONTAINER: '.BltHke', // could add .nH.oy8Mbf
  EMAIL_DATE: `${CLASS_SELECTORS.EMAIL_DATE_CONTAINER} span`,
  EMAIL_PARTICIPANTS: `${CLASS_SELECTORS.EMAIL_PARTICIPANT_CONTAINERS} span[email]`,
  LEFT_MENU_BUTTON: '.gb_Ic[aria-expanded]',
  PREVIEW_PANE: '.Nu.S3.aZ6',
  SELECTED_EMAIL: `${CLASS_SELECTORS.EMAIL_ROW}.btb`,
};

export const DEFAULT_PROFILE_URL = '//ssl.gstatic.com/ui/v1/icons/mail/profile_mask2.png';
