import { hasClass, isTypable } from '../shared/utils.js';
import { isInBundle, openInbox, openReminder, setCurrentBundle } from './emailUtils.js';
import emailPreview from './emailPreview.js';
import { GMAIL_CLASSES, CLASSES, GMAIL_SELECTORS } from './constants.js';

const { EMAIL_ROW, SELECTED_EMAIL } = GMAIL_SELECTORS;
const { EMAIL_ROW: EMAIL_ROW_CLASS } = GMAIL_CLASSES;
const { BUNDLE_WRAPPER_CLASS } = CLASSES;

export default {
  init() {
    window.addEventListener('keydown', this.handleKeyboardEvents.bind(this));
  },
  handleKeyboardEvents(event) {
    const currentRow = document.querySelector(`[role="main"] ${SELECTED_EMAIL}:not(.${BUNDLE_WRAPPER_CLASS})`);
    const currentBundle = document.querySelector(`[role="main"] ${SELECTED_EMAIL}.${BUNDLE_WRAPPER_CLASS}`);
    const mainContainer = document.querySelector('.AO');
    const parameters = {
      currentRow,
      currentBundle,
      keyCode: event.code,
      mainContainer,
      shiftKey: event.shiftKey,
    };

    const navKeys = ['ArrowUp', 'ArrowDown', 'KeyJ', 'KeyK'];
    if (isTypable(event.target)) {
      return;
    }
    if (this.handlers[event.code]) {
      this.handlers[event.code](parameters);
    } else if (navKeys.includes(event.code)) {
      this.navigate(parameters);
    }

    setCurrentBundle();
  },
  handlers: {
    Enter: ({ currentRow, currentBundle }) => {
      if (currentRow.getAttribute('data-inbox') === 'bundled') {
        currentBundle.click();
      } else {
        currentRow.click();
      }
    },
    Escape: ({ currentRow }) => {
      if (emailPreview.previewShowing) {
        emailPreview.emailClicked(currentRow);
      } else if (isInBundle()) {
        openInbox();
      }
    },
    Quote: ({ mainContainer, shiftKey }) => mainContainer.scrollBy(0, shiftKey ? -250 : -25),
    Semicolon: ({ mainContainer, shiftKey }) => mainContainer.scrollBy(0, shiftKey ? 250 : 25),
    KeyT: openReminder,
    // Space: ({ currentRow }) => currentRow.querySelector('.aid [role="checkbox"]').click()
  },
  navigate({ currentRow, keyCode }) {
    if (currentRow.getAttribute('data-inbox') === 'bundled') {
      const nextRow = this.findNextVisibleRow(keyCode);

      let emailToSelect;
      if (hasClass(nextRow, BUNDLE_WRAPPER_CLASS)) {
        const nextBundle = nextRow.getAttribute('data-inbox');
        nextRow.setAttribute('data-selected', true);
        // select the first email in the bundle
        emailToSelect = document.querySelector(`[role="main"] ${EMAIL_ROW}[data-inbox="bundled"][data-${nextBundle}]`);
      } else if (nextRow) {
        emailToSelect = nextRow;
      }
      if (emailToSelect) {
        emailToSelect.setAttribute('data-selected', true);
        const checkbox = emailToSelect.querySelector('.aid [role="checkbox"]');
        checkbox.click(); // check the box to select the row
        checkbox.click(); // check it again to uncheck the box, but leave it selected
      }
    } else {
      if (isInBundle()) {
        const previousEmail = document.querySelector(`[role="main"] ${EMAIL_ROW}[data-selected="true"]:not(.${BUNDLE_WRAPPER_CLASS})`);
        if (previousEmail === currentRow) {
          // we probably tried to navigate while on the first/last email of the bundle
          // close the bundle and go back to the inbox
          openInbox();
        }
      }
      document.querySelectorAll('[data-selected=true]').forEach(el => el.setAttribute('data-selected', null));
      currentRow.setAttribute('data-selected', true);
    }
  },
  findNextVisibleRow(keyCode) {
    // gmail moved focus to a bundled email, we need to decide if we're going to focus that bundle or if we should ignore it?
    // - if there's anything visible between the previously selected email and the one that is now selected, select that instead
    // - if there's nothing visible between the previously selected email and the one that is now selected
    //   find the next visible thing after the previous email and select that
    // - if there's nothing visible after the previous email, stay focused on that one
    const previousEmail = document.querySelector(`[role="main"] ${EMAIL_ROW}[data-selected="true"]:not(.${BUNDLE_WRAPPER_CLASS})`);
    const previousBundle = document.querySelector(`.${BUNDLE_WRAPPER_CLASS}[data-selected="true"]`);

    const searchNext = keyCode === 'ArrowDown' || keyCode === 'KeyJ';
    const navigator = searchNext ? 'nextSibling' : 'previousSibling';

    let nextRow = previousEmail[navigator];
    // skip rows that we shouldn't focus on
    // - non emails (date labels, preview pane, etc)
    // - bundled emails
    // - the bundle row from the previously selected email
    let isEmailRow = hasClass(nextRow, EMAIL_ROW_CLASS);
    let isEmailBundled = nextRow.getAttribute('data-inbox') === 'bundled';
    let isPreviousBundle = previousEmail.getAttribute('data-inbox') === 'bundled' && nextRow === previousBundle;
    while (nextRow && (!isEmailRow || isEmailBundled || isPreviousBundle)) {
      nextRow = nextRow[navigator];
      if (nextRow) {
        isEmailRow = hasClass(nextRow, EMAIL_ROW_CLASS);
        isEmailBundled = nextRow.getAttribute('data-inbox') === 'bundled';
        isPreviousBundle = previousEmail.getAttribute('data-inbox') === 'bundled' && nextRow === previousBundle;
      }
    }
    if (nextRow) {
      if (previousEmail) {
        previousEmail.setAttribute('data-selected', null);
      }
      if (previousBundle) {
        previousBundle.setAttribute('data-selected', null);
      }
    } else {
      nextRow = previousEmail;
    }
    return nextRow;
  },
};
