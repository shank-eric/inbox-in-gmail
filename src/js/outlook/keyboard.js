import { addClass, isTypable, observeForElement, removeClass } from '../shared/utils.js';
import emailPreview from './emailPreview.js';
import { OUTLOOK_SELECTORS } from './constants.js';
import { bundleWrapperFor, findNextVisibleRow, isBundleWrapper, setSelectedRow, visibleRows } from './outlookUtils.js';

const {
  COMPOSE_NEW_MAIL_BUTTON,
  COMPOSE_SUBJECT_LINE,
  COMPOSE_TO_ADDRESS_CONTAINER,
  LIST_SCROLL_CONTAINER,
  EMAIL_ROW,
  EMAIL_ROW_OUTER_CONTAINER,
} = OUTLOOK_SELECTORS;

export default {
  init() {
    window.addEventListener('keydown', this.handleKeyboardEvents.bind(this), true);
  },
  handleKeyboardEvents(event) {
    const currentRow = document.querySelector(`${EMAIL_ROW}[data-selected="true"]`);
    const mainContainer = document.querySelector(LIST_SCROLL_CONTAINER);
    const parameters = {
      ...this,
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
    // opens the email; on a bundle row (or an email hidden behind one) expands or collapses the bundle
    Enter: ({ currentRow }) => {
      if (!currentRow) {
        return;
      }
      const row = currentRow.getAttribute('data-inbox') === 'bundled' ? bundleWrapperFor(currentRow) : currentRow;
      row?.click();
    },
    Escape: ({ currentRow }) => {
      if (emailPreview.previewShowing) {
        emailPreview.emailClicked(currentRow);
      } else if (currentRow) {
        bundleWrapperFor(currentRow)?.click();
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
    // nothing selected yet: start from the first row on screen
    const rowToSelect = currentRow ? findNextVisibleRow(currentRow, searchNext) : visibleRows()[0];
    if (!rowToSelect) {
      return;
    }
    if (isBundleWrapper(rowToSelect)) {
      // highlight the bundle row without toggling it; enter expands or collapses
      emailPreview.hidePreview();
      setSelectedRow(rowToSelect);
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
