import { hasClass, isTypable, observeForCondition } from '../shared/utils.js';
import emailPreview from './emailPreview.js';
import { CLASSES } from '../shared/constants.js';
import { OUTLOOK_CLASSES, OUTLOOK_SELECTORS } from './constants.js';
import { findNextVisibleRow, setSelectedRow } from './outlookUtils.js';

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
      currentBundle,
      currentRow,
      currentTarget: event.currentTarget,
      event,
      keyCode: event.code,
      mainContainer,
      navigate: this.navigate,
      target: event.target,
      shiftKey: event.shiftKey,
    };

    const navKeys = ['ArrowUp', 'ArrowDown', 'KeyJ', 'KeyK', 'KeyE'];
    if (isTypable(event.target)) {
      return;
    }
    if (this.handlers[event.code]) {
      this.handlers[event.code](parameters);
    } else if (navKeys.includes(event.code)) {
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
        const currentBundle = currentRow.getAttribute('data-bundles');
        if (currentBundle) {
          const bundleRow = document.querySelector(`[data-inbox="${currentBundle}"]`);
          bundleRow.click();
        }
      }
    },
    KeyE: ({ currentRow, navigate, ...rest }) => {
      if (emailPreview.previewShowing) {
        emailPreview.emailClicked(currentRow);
      }
      navigate({ currentRow, ...rest });
    },
    Quote: ({ mainContainer, shiftKey }) => mainContainer.scrollBy(0, shiftKey ? -250 : -25),
    Semicolon: ({ mainContainer, shiftKey }) => mainContainer.scrollBy(0, shiftKey ? 250 : 25),
    // KeyT: openReminder
    // Space: ({ currentRow }) => currentRow.querySelector('.aid [role="checkbox"]').click()
  },
  async navigate({ currentRow, keyCode, target }) {
    const searchNext = ['ArrowDown', 'KeyJ', 'KeyE'].includes(keyCode);
    const rowToSelect = currentRow ? findNextVisibleRow(currentRow, searchNext) : document.querySelector(EMAIL_ROW);
    if (hasClass(target, EMAIL_ROW_CLASS)) {
      await observeForCondition(document, () => {
        const outlookSelectedRow = document.querySelector('[aria-selected="true"]');
        const matches = outlookSelectedRow === target;
        return !matches;
      });
    }

    if (rowToSelect) {
      setTimeout(() => {
        const selector = rowToSelect;
        selector.click(); // check the box to select the row
        selector.click(); // check it again to uncheck the box, but leave it selected
        setSelectedRow(rowToSelect);
      });
    }
  },
};
