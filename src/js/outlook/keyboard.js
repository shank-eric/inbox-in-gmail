import { addClass, hasClass, isTypable, observeForElement, removeClass } from '../shared/utils.js';
import emailPreview from './emailPreview.js';
import { CLASSES } from '../shared/constants.js';
import { OUTLOOK_SELECTORS } from './constants.js';
import { findNextVisibleRow } from './outlookUtils.js';

const { BUNDLE_WRAPPER_CLASS } = CLASSES;
const {
  COMPOSE_NEW_MAIL_BUTTON,
  COMPOSE_SUBJECT_LINE,
  COMPOSE_TO_ADDRESS_CONTAINER,
  LIST_SCROLL_CONTAINER,
  SELECTED_EMAIL,
  EMAIL_ROW,
  EMAIL_ROW_OUTER_CONTAINER,
} = OUTLOOK_SELECTORS;

export default {
  init() {
    window.addEventListener('keydown', this.handleKeyboardEvents.bind(this), true);
  },
  handleKeyboardEvents(event) {
    const currentRow = document.querySelector(`${EMAIL_ROW}[data-selected="true"]`);
    const currentBundle = document.querySelector(`${SELECTED_EMAIL}.${BUNDLE_WRAPPER_CLASS}`);
    const mainContainer = document.querySelector(LIST_SCROLL_CONTAINER);
    const parameters = {
      ...this,
      currentBundle,
      currentRow,
      currentTarget: event.currentTarget,
      event,
      keyCode: event.code,
      mainContainer,
      shiftKey: event.shiftKey,
      target: event.target,
    };

    const navKeys = ['ArrowUp', 'ArrowDown', 'KeyJ', 'KeyK'];
    if (isTypable(event.target)) {
      return;
    }
    if (this.handlers[event.code]) {
      this.handlers[event.code](parameters);
    } else if (navKeys.includes(event.code)) {
      // outlook's list would also step its selection, in its own order; only ours should move
      event.preventDefault();
      event.stopPropagation();
      this.navigate(parameters);
    }
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
      } else {
        const currentBundle = currentRow?.getAttribute('data-bundles');
        if (currentBundle) {
          const bundleRow = document.querySelector(`[data-inbox="${currentBundle}"]`);
          bundleRow.click();
        }
      }
    },
    KeyC: ({ removeReminderClass }) => removeReminderClass(),
    KeyT: async ({ event }) => {
      event.preventDefault();
      const composeButton = await document.querySelector(COMPOSE_NEW_MAIL_BUTTON);
      composeButton.click();
      const composeContainer = await observeForElement(document, '.preview-compose');
      addClass(composeContainer, 'reminder-compose');
      // const sensitivityMenuButton = await observeForElement(document, '.eU3xR button:nth-child(1)');
      // sensitivityMenuButton.click();
      // const internalOption = await observeForElement(document, '[role="menu"] [role="menuitemcheckbox"]:nth-child(3)');
      // internalOption.click();
      const subjectLine = await observeForElement(document, COMPOSE_SUBJECT_LINE);
      setTimeout(async () => {
        const toAddressContainer = await observeForElement(document, COMPOSE_TO_ADDRESS_CONTAINER);
        addClass(toAddressContainer, 'to-address');
        const toAddress = await observeForElement(toAddressContainer, '[contenteditable="true"]');
        toAddress.innerHTML = 'eric@everfi.com';
        setTimeout(() => {
          subjectLine.focus();
          subjectLine.value = '';
        }, 0);
      }, 500);
    },
    Quote: ({ mainContainer, shiftKey }) => mainContainer?.scrollBy(0, shiftKey ? -250 : -25),
    Semicolon: ({ mainContainer, shiftKey }) => mainContainer?.scrollBy(0, shiftKey ? 250 : 25),
    // Space: ({ currentRow }) => currentRow.querySelector('.aid [role="checkbox"]').click()
  },
  async navigate({ currentRow, keyCode }) {
    const searchNext = ['ArrowDown', 'KeyJ'].includes(keyCode);
    const rowToSelect = currentRow ? findNextVisibleRow(currentRow, searchNext) : document.querySelector(`${EMAIL_ROW}:not(.${BUNDLE_WRAPPER_CLASS})`);
    if (hasClass(rowToSelect, BUNDLE_WRAPPER_CLASS)) {
      rowToSelect.click();
      return;
    }
    const convId = rowToSelect ? rowToSelect.querySelector('[data-convid]')?.getAttribute('data-convid') : null;
    if (!convId) {
      console.log('No convId found for rowToSelect', rowToSelect);
      return;
    }

    if (rowToSelect) {
      setTimeout(async () => {
        const rowToSelectOuterRow = await observeForElement(document, `[data-convid="${convId}"]`);
        const outlookSelectedRow = document.querySelector(`${EMAIL_ROW_OUTER_CONTAINER}[aria-selected="true"]`);
        if (rowToSelectOuterRow !== outlookSelectedRow) {
          rowToSelectOuterRow.click();
          // if they match, first click would collapse the row, click again to re-expand
          rowToSelectOuterRow.click();
        }
      });
    }
  },
  async removeReminderClass() {
    const composeWindow = await observeForElement(document, '.preview-compose');
    removeClass(composeWindow, 'reminder-compose');
  },
};
