import { OUTLOOK_CLASSES, OUTLOOK_SELECTORS } from './constants.js';
import { addRemoveClass, hasClass } from '../shared/utils.js';

const { SELECTED_ROW, UNSELECTED_ROW, EMAIL_ROW: EMAIL_ROW_CLASS, TIME_ROW } = OUTLOOK_CLASSES;
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
  const [address, fullDomain] = email.split('@');
  const [domain, tld] = fullDomain.split('.');
  return { address, domain, tld };
};

export const matchesMyEmail = email => {
  const myEmail = getMyEmailAddress();
  if (!myEmail || !email) {
    return false;
  }
  const { address: myAddress, domain: myDomain } = deconstructEmail(myEmail);
  const { address, domain } = deconstructEmail(email);
  return myAddress === address && myDomain === domain;
};

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
    addRemoveClass(selectedEl.querySelector(EMAIL_ROW_INNER_CONTAINER), UNSELECTED_ROW, SELECTED_ROW);
  });
  // document.querySelectorAll('[aria-selected]').forEach(selectedEl => {
  //   selectedEl.setAttribute('aria-selected', false);
  //   addRemoveClass(selectedEl.querySelector(EMAIL_ROW_INNER_CONTAINER), UNSELECTED_ROW, SELECTED_ROW);
  // });
  // row.setAttribute('aria-selected', true);
  row.setAttribute('data-selected', true);
  setTimeout(() => {
    document.body.setAttribute('tabindex', '-1');
    document.body.focus();
  });
  addRemoveClass(row.querySelector(EMAIL_ROW_INNER_CONTAINER), SELECTED_ROW, UNSELECTED_ROW);
};

export const findNextVisibleRow = (currentRow, searchNext = true, includeTimeRows = false) => {
  const navigator = searchNext ? 'nextSibling' : 'previousSibling';
  const currentBundle = currentRow.getAttribute('data-bundles');
  let nextRow = currentRow.parentNode.parentNode[navigator]?.firstElementChild?.firstElementChild;
  if (!nextRow) return;
  let isEmailOrTimeRow = hasClass(nextRow, EMAIL_ROW_CLASS) || (includeTimeRows && hasClass(nextRow, TIME_ROW));
  let isEmailBundled = nextRow.getAttribute('data-inbox') === 'bundled';
  let isSameBundle = nextRow.getAttribute('data-bundles') === currentBundle;
  // let isPreviousBundle = previousEmail.getAttribute('data-inbox') === 'bundled' && nextRow === previousBundle;
  while (nextRow && (!isEmailOrTimeRow || isEmailBundled || !isSameBundle)) {
    nextRow = nextRow.parentNode.parentNode[navigator]?.firstElementChild?.firstElementChild;
    if (nextRow) {
      isEmailOrTimeRow = hasClass(nextRow, EMAIL_ROW_CLASS) || (includeTimeRows && hasClass(nextRow, TIME_ROW));
      isEmailBundled = nextRow.getAttribute('data-inbox') === 'bundled';
      isSameBundle = nextRow.getAttribute('data-bundles') === currentBundle;
      // isPreviousBundle = previousEmail.getAttribute('data-inbox') === 'bundled' && nextRow === previousBundle;
    }
  }
  return nextRow;
};
