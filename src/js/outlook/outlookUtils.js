import { OUTLOOK_CLASSES, OUTLOOK_SELECTORS } from './constants.js';
import { hasClass, replaceClass } from '../shared/utils.js';
import { getOptions } from '../shared/options.js';

const { SELECTED_ROW, UNSELECTED_ROW, EMAIL_ROW: EMAIL_ROW_CLASS, BUNDLE_WRAPPER_CLASS } = OUTLOOK_CLASSES;
const { EMAIL_ROW_INNER_CONTAINER } = OUTLOOK_SELECTORS;

let foundEmail;
const findEmailInLink = () => {
  const brandLink = document.querySelector('#O365_AppName');
  if (brandLink) {
    const brandUrl = new URL(brandLink.getAttribute('href'));
    return brandUrl.searchParams.get('login_hint');
  }
};

export const getMyEmailAddress = () => {
  if (!foundEmail) {
    foundEmail = findEmailInLink();
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

export const isSearchResults = () => !!document.querySelector('#owaSearchBox [data-icon-name="ArrowLeftRegular"]');
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

export const setSelectedRow = row => {
  document.querySelectorAll('[data-selected]').forEach(selectedEl => {
    selectedEl.setAttribute('data-selected', false);
    replaceClass(selectedEl.querySelector(EMAIL_ROW_INNER_CONTAINER), UNSELECTED_ROW, SELECTED_ROW);
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
  replaceClass(row.querySelector(EMAIL_ROW_INNER_CONTAINER), SELECTED_ROW, UNSELECTED_ROW);
};

export const findNextVisibleRow = (currentRow, searchNext = true) => {
  const navigator = searchNext ? 'nextSibling' : 'previousSibling';
  const currentBundle = currentRow.getAttribute('data-bundles');
  let nextRow = currentRow.parentNode[navigator]?.firstElementChild;
  if (!nextRow) return;
  let isEmail = hasClass(nextRow, EMAIL_ROW_CLASS) && !hasClass(nextRow, BUNDLE_WRAPPER_CLASS);
  let isSameBundle = nextRow.getAttribute('data-bundles') === currentBundle;
  let hasInnerContainer = nextRow.querySelector(EMAIL_ROW_INNER_CONTAINER);
  let selectableRow = nextRow && isEmail && hasInnerContainer && isSameBundle;

  while (!selectableRow) {
    nextRow = nextRow?.parentNode[navigator]?.firstElementChild;
    if (!nextRow) {
      return;
    }

    isEmail = hasClass(nextRow, EMAIL_ROW_CLASS) && !hasClass(nextRow, BUNDLE_WRAPPER_CLASS);
    isSameBundle = nextRow.getAttribute('data-bundles') === currentBundle;
    hasInnerContainer = nextRow.querySelector(EMAIL_ROW_INNER_CONTAINER);
    selectableRow = nextRow && isEmail && hasInnerContainer && isSameBundle;
  }
  return nextRow;
};
