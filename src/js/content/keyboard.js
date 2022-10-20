import {
  hasClass,
  isTypable,
  observeForCondition
} from '../shared/utils.js';
// import inbox from './inbox.js';
import emailPreview from './emailPreview.js';
import { CLASSES } from '../shared/constants.js';
import { OUTLOOK_CLASSES, OUTLOOK_SELECTORS } from '../outlook/constants.js';
import {
  findNextVisibleRow,
  // isInBundle,
  // openInbox,
  // openReminder,
  setSelectedRow
} from '../outlook/outlookUtils.js';

const { EMAIL_ROW: EMAIL_ROW_CLASS } = OUTLOOK_CLASSES;
const { BUNDLE_WRAPPER_CLASS } = CLASSES;
const { SELECTED_EMAIL, EMAIL_ROW } = OUTLOOK_SELECTORS;

export default {
  init() {
    window.addEventListener('keydown', this.handleKeyboardEvents.bind(this));
  },
  handleKeyboardEvents(event) {
    const currentRow = document.querySelector(`${EMAIL_ROW}[data-selected="true"]`);
    const currentBundle = document.querySelector(`${SELECTED_EMAIL}.${BUNDLE_WRAPPER_CLASS}`);
    const mainContainer = document.querySelector('.AO');
    const parameters = {
      event,
      target: event.target,
      currentTarget: event.currentTarget,
      currentRow,
      currentBundle,
      keyCode: event.code,
      mainContainer,
      shiftKey: event.shiftKey
    };

    const navKeys = [ 'ArrowUp', 'ArrowDown', 'KeyJ', 'KeyK', 'KeyE' ];
    // console.log('keyboard event', event, isTypable(event.target));
    if (isTypable(event.target)) {
      return;
    }
    if (this.handlers[event.code]) {
      this.handlers[event.code](parameters);
    } else if (navKeys.includes(event.code)) {
      this.navigate(parameters);
    }

    // inbox.setCurrentBundle();
  },
  handlers: {
    Enter: ({ currentRow, currentBundle }) => {
      console.log('keyboard enter event', currentRow, currentBundle);
      if (currentRow.getAttribute('data-inbox') === 'bundled') {
        currentBundle.click();
      } else {
        currentRow.click();
      }
    },
    Escape: ({ currentRow }) => {
      // console.log('keyboard enter escape', currentRow);0
      if (emailPreview.previewShowing) {
        emailPreview.emailClicked(currentRow);
      } else {
        const currentBundle = currentRow.getAttribute('data-bundles');
        if (currentBundle) {
          const bundleRow = document.querySelector(`[data-inbox="${currentBundle}"]`);
          bundleRow.click();
        }
      }
    },
    Quote: ({ mainContainer, shiftKey }) => mainContainer.scrollBy(0, shiftKey ? -250 : -25),
    Semicolon: ({ mainContainer, shiftKey }) => mainContainer.scrollBy(0, shiftKey ? 250 : 25)
    // KeyT: openReminder
    // Space: ({ currentRow }) => currentRow.querySelector('.aid [role="checkbox"]').click()
  },
  async navigate({ currentRow, keyCode, target }) {
    const searchNext = [ 'ArrowDown', 'KeyJ', 'KeyE' ].includes(keyCode);
    const rowToSelect = currentRow ? findNextVisibleRow(currentRow, searchNext) : document.querySelector(EMAIL_ROW);
    if (hasClass(target, EMAIL_ROW_CLASS)) {
      await observeForCondition(document, () => {
        const outlookSelectedRow = document.querySelector('[aria-selected="true"]');
        const matches = outlookSelectedRow === target;
        return !matches;
      });
    }

    if (rowToSelect) {
      // console.log('selecting row', rowToSelect);
      // setSelectedRow(rowToSelect);
      // if (!hasClass(rowToSelect, BUNDLE_WRAPPER_CLASS)) {
      // rowToSelect.click();
      setTimeout(() => {
        const selector = rowToSelect.querySelector('.hidden-selector');
        selector.click(); // check the box to select the row
        selector.click(); // check it again to uncheck the box, but leave it selected
        setSelectedRow(rowToSelect);
      });
      // } else {

      //   rowToSelect.click(); // check the box to select the row
      // }
    // } else {
    //   const currentBundle = currentRow.getAttribute('data-bundles');
    //   const bundleRow = document.querySelector(`[data-inbox="${currentBundle}"]`);
    //   bundleRow.click();
    }
  }
  // findNextVisibleRow(currentRow, keyCode) {
  //   const searchNext = [ 'ArrowDown', 'KeyJ', 'KeyE' ].includes(keyCode);
  //   const navigator = searchNext ? 'nextSibling' : 'previousSibling';
  //   const currentBundle = currentRow.getAttribute('data-bundles');
  //   let nextRow = currentRow[navigator];
  //   if (!nextRow) return;
  //   let isEmailRow = hasClass(nextRow, EMAIL_ROW_CLASS);
  //   let isEmailBundled = nextRow.getAttribute('data-inbox') === 'bundled';
  //   let isSameBundle = nextRow.getAttribute('data-bundles') === currentBundle;
  //   // let isPreviousBundle = previousEmail.getAttribute('data-inbox') === 'bundled' && nextRow === previousBundle;
  //   while (nextRow && (!isEmailRow || isEmailBundled || !isSameBundle)) {
  //     nextRow = nextRow[navigator];
  //     if (nextRow) {
  //       isEmailRow = hasClass(nextRow, EMAIL_ROW_CLASS);
  //       isEmailBundled = nextRow.getAttribute('data-inbox') === 'bundled';
  //       isSameBundle = nextRow.getAttribute('data-bundles') === currentBundle;
  //       // isPreviousBundle = previousEmail.getAttribute('data-inbox') === 'bundled' && nextRow === previousBundle;
  //     }
  //   }
  //   return nextRow;
  // }
  // findNextVisibleRow(keyCode) {
  //   // gmail moved focus to a bundled email, we need to decide if we're going to focus that bundle or if we should ignore it?
  //   // - if there's anything visible between the previously selected email and the one that is now selected, select that instead
  //   // - if there's nothing visible between the previously selected email and the one that is now selected
  //   //   find the next visible thing after the previous email and select that
  //   // - if there's nothing visible after the previous email, stay focused on that one
  //   const previousEmail = document.querySelector(`${EMAIL_ROW}[data-selected="true"]:not(.${BUNDLE_WRAPPER_CLASS})`);
  //   const previousBundle = document.querySelector(`.${BUNDLE_WRAPPER_CLASS}[data-selected="true"]`);

  //   const searchNext = keyCode === 'ArrowDown' || keyCode === 'KeyJ';
  //   const navigator = searchNext ? 'nextSibling' : 'previousSibling';

  //   let nextRow = previousEmail[navigator];
  //   // skip rows that we shouldn't focus on
  //   // - non emails (date labels, preview pane, etc)
  //   // - bundled emails
  //   // - the bundle row from the previously selected email
  //   let isEmailRow = hasClass(nextRow, EMAIL_ROW_CLASS);
  //   let isEmailBundled = nextRow.getAttribute('data-inbox') === 'bundled';
  //   let isPreviousBundle = previousEmail.getAttribute('data-inbox') === 'bundled' && nextRow === previousBundle;
  //   while (nextRow && (!isEmailRow || isEmailBundled || isPreviousBundle)) {
  //     nextRow = nextRow[navigator];
  //     if (nextRow) {
  //       isEmailRow = hasClass(nextRow, EMAIL_ROW_CLASS) && !hasClass(nextRow, BUNDLE_WRAPPER_CLASS);
  //       isEmailBundled = nextRow.getAttribute('data-inbox') === 'bundled';
  //       isPreviousBundle = previousEmail.getAttribute('data-inbox') === 'bundled' && nextRow === previousBundle;
  //     }
  //   }
  //   if (nextRow) {
  //     if (previousEmail) {
  //       previousEmail.setAttribute('data-selected', null);
  //     }
  //     if (previousBundle) {
  //       previousBundle.setAttribute('data-selected', null);
  //     }
  //   } else {
  //     nextRow = previousEmail;
  //   }
  //   return nextRow;
  // }
};
