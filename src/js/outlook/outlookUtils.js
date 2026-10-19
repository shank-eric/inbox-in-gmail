import { OUTLOOK_CLASSES, OUTLOOK_SELECTORS } from './constants.js';
import { addClass, hasClass, removeClass } from '../shared/utils.js';
import { getOptions } from '../shared/options.js';
import { CLASSES } from '../shared/constants.js';

const { SELECTED_ROW, EMAIL_ROW: EMAIL_ROW_CLASS } = OUTLOOK_CLASSES;
const { BUNDLE_WRAPPER_CLASS } = CLASSES;
const { EMAIL_ROW_OUTER_CONTAINER } = OUTLOOK_SELECTORS;

let foundEmail;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const findEmailInLink = () => {
  const brandLink = document.querySelector('#O365_AppName');
  if (brandLink) {
    const brandUrl = new URL(brandLink.getAttribute('href'));
    return brandUrl.searchParams.get('login_hint');
  }
};
// the folder pane's mailbox root is titled with the account email
const findEmailInFolderPane = () => {
  const mailboxRoot = document.querySelector('[id^="primaryMailboxRoot"]');
  const title = mailboxRoot?.getAttribute('title') || mailboxRoot?.textContent.trim();
  return EMAIL_REGEX.test(title || '') ? title : undefined;
};

export const getMyEmailAddress = () => {
  if (!foundEmail) {
    foundEmail = findEmailInLink() || findEmailInFolderPane();
  }
  return foundEmail;
};

const deconstructEmail = email => {
  const [address, fullDomain = ''] = email.split('@');
  const [domain, tld] = fullDomain.split('.');
  return { address, domain, tld };
};

const matchEmails = (email1, email2) => {
  const { address: address1, domain: domain1 } = deconstructEmail(email1);
  const { address: address2, domain: domain2 } = deconstructEmail(email2);
  return address1 === address2 && domain1 === domain2;
};

export const matchesMyEmail = email => {
  const myEmail = getMyEmailAddress();
  const { emailAliases } = getOptions();
  if (!myEmail || !email) {
    return false;
  }
  const emails = [myEmail];
  if (emailAliases) {
    emails.push(...emailAliases.split(';'));
  }
  return emails.some(e => matchEmails(e, email));
};

export const isSearchResults = () => !!document.querySelector('#searchBoxId-Mail [data-icon-name="ArrowLeftRegular"]');
export const isInInbox = () => document.location.pathname === '/mail/' || document.location.pathname.match(/mail\/inbox/g);

// export const openReminder = async () => {
//   const myEmail = getMyEmailAddress();

//   const composeButton = document.querySelector('.m2Lea');
//   composeButton.click();

//   const composeContainer = await observeForElement(document, PREVIEW_COMPOSE);
//   addClass(composeContainer, 'compose-reminder');

//   const focusListener = () => {
//     composeContainer.removeEventListener('focus', focusListener, true);

//     // wait for focus to move before setting value
//     setTimeout(() => {
//       // const options = getOptions();
//       // const title = composeContainer.querySelector('.FN9jN input');
//       // // const body = composeContainer.querySelector('div[aria-label="Message Body"]');
//       // if (options.reminderTreatment === 'all') {
//       //   title.focus();
//       // // } else {
//       // //   title.value = 'Reminder';
//       // //   body.focus();
//       // }

//       if (myEmail) {
//         const to = composeContainer.querySelector('.UvnRr input');
//         to.value = myEmail;
//         to.focus();
//       } else {
//         addClass(composeContainer, 'show-to-address');
//       }
//     });
//   };
//   composeContainer.addEventListener('focus', focusListener, true);
// };

export const getOutlookSelectedRow = () => document.querySelector(`${EMAIL_ROW_OUTER_CONTAINER}[aria-selected="true"]`)?.closest(`.${EMAIL_ROW_CLASS}`);

export const setSelectedRow = row => {
  document.querySelectorAll('[data-selected]').forEach(selectedEl => {
    selectedEl.setAttribute('data-selected', false);
    removeClass(selectedEl.querySelector(EMAIL_ROW_OUTER_CONTAINER), SELECTED_ROW);
  });
  // document.querySelectorAll('[aria-selected]').forEach(selectedEl => {
  //   selectedEl.setAttribute('aria-selected', false);
  //   addRemoveClass(selectedEl.querySelector(EMAIL_ROW_INNER_CONTAINER), UNSELECTED_ROW, SELECTED_ROW);
  // });
  // row.setAttribute('aria-selected', true);
  row.setAttribute('data-selected', true);
  // setTimeout(() => {
  //   document.body.setAttribute('tabindex', '-1');
  //   document.body.focus();
  // });
  const outerContainer = row.querySelector(EMAIL_ROW_OUTER_CONTAINER);
  outerContainer.focus();
  addClass(outerContainer, SELECTED_ROW);
};

export const isBundleWrapper = row => hasClass(row, BUNDLE_WRAPPER_CLASS);
// hidden behind a collapsed bundle row
const isCollapsedEmail = row => row.getAttribute('data-inbox') === 'bundled';
const isEmailRow = row => hasClass(row, EMAIL_ROW_CLASS) && !isBundleWrapper(row) && !!row.querySelector(EMAIL_ROW_OUTER_CONTAINER);

// the bundle row a bundled email belongs to (the first of its labels)
export const bundleWrapperFor = row => {
  const [bundleId] = (row.getAttribute('data-bundles') || '').split('||');
  return bundleId ? document.querySelector(`.${BUNDLE_WRAPPER_CLASS}[data-inbox="${bundleId}"]`) : null;
};

// rows are laid out by flex order, not dom order (outlook appends new mail at the end of the dom)
export const rowOrder = row => parseFloat(row.parentNode?.style.order) || 0;
const byOrder = rows => rows.sort((a, b) => rowOrder(a) - rowOrder(b));
const allRows = () => Array.from(document.querySelectorAll(`.${EMAIL_ROW_CLASS}`));

// every row the user can see, in visual order: loose emails, bundle rows and the emails of expanded bundles
export const visibleRows = () =>
  byOrder(allRows().filter(row => (isBundleWrapper(row) ? row.style.display !== 'none' : isEmailRow(row) && !isCollapsedEmail(row))));

// the visible neighbour of a row; a collapsed email navigates from the bundle row hiding it.
// neighbours are taken by position so rows sharing a flex order are not skipped
export const findNextVisibleRow = (currentRow, searchNext = true) => {
  const rows = visibleRows();
  const anchor = (isCollapsedEmail(currentRow) && bundleWrapperFor(currentRow)) || currentRow;
  const index = rows.indexOf(anchor);
  if (index >= 0) {
    return rows[index + (searchNext ? 1 : -1)];
  }
  // the anchor is not visible (e.g. removed): fall back to the nearest row by order
  const anchorOrder = rowOrder(anchor);
  return searchNext ? rows.find(row => rowOrder(row) > anchorOrder) : rows.filter(row => rowOrder(row) < anchorOrder).pop();
};

// the visible email neighbour of a row within the same bundle (or among loose emails)
const findNeighbourInBundle = (row, searchNext) => {
  const bundles = row.getAttribute('data-bundles');
  const order = rowOrder(row);
  const rows = byOrder(allRows().filter(r => isEmailRow(r) && !isCollapsedEmail(r) && r.getAttribute('data-bundles') === bundles));
  return searchNext ? rows.find(r => rowOrder(r) > order) : rows.filter(r => rowOrder(r) < order).pop();
};

// the neighbour that takes a removed (archived, deleted) row's place within its bundle
export const findReplacementRow = removedRow => findNeighbourInBundle(removedRow, true) || findNeighbourInBundle(removedRow, false);

// true while selectRow dispatches its click, so the row's click handler can leave the preview alone
let programmaticSelection = false;
export const isProgrammaticSelection = () => programmaticSelection;

// select a row through outlook (click) without toggling the preview, and mark it as ours.
// outlook auto-selects its own next item shortly after a removal, so apply now and once more
// after that has settled; `acceptCurrent` can approve outlook's pick and skip the override
export const selectRow = (row, acceptCurrent = () => false) => {
  [0, 400].forEach(delay =>
    setTimeout(() => {
      const outerContainer = row.querySelector(EMAIL_ROW_OUTER_CONTAINER);
      if (!outerContainer || !outerContainer.isConnected || acceptCurrent()) {
        return;
      }
      if (outerContainer.getAttribute('aria-selected') !== 'true') {
        programmaticSelection = true;
        try {
          outerContainer.click();
        } finally {
          programmaticSelection = false;
        }
      }
      setSelectedRow(row);
    }, delay)
  );
};
