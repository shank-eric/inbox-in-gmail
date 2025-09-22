import { addClass, hasClass, isTypable, observeForCondition, observeForElement, removeClass } from '../shared/utils.js';
import emailPreview from './emailPreview.js';
import { CLASSES } from '../shared/constants.js';
import { OUTLOOK_CLASSES, OUTLOOK_SELECTORS } from './constants.js';
import { findNextVisibleRow, setSelectedRow } from './outlookUtils.js';

const { EMAIL_ROW: EMAIL_ROW_CLASS } = OUTLOOK_CLASSES;
const { BUNDLE_WRAPPER_CLASS } = CLASSES;
const { COMPOSE_NEW_MAIL_BUTTON, COMPOSE_SUBJECT_LINE, COMPOSE_TO_ADDRESS_CONTAINER, SELECTED_EMAIL, EMAIL_ROW } = OUTLOOK_SELECTORS;

export default {
  init() {
    window.addEventListener('keydown', this.handleKeyboardEvents.bind(this));
  },
  handleKeyboardEvents(event) {
    const currentRow = document.querySelector(`${EMAIL_ROW}[data-selected="true"]`);
    const currentBundle = document.querySelector(`${SELECTED_EMAIL}.${BUNDLE_WRAPPER_CLASS}`);
    const mainContainer = document.querySelector('.AO');
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
    KeyC: ({ removeReminderClass }) => removeReminderClass(),
    KeyE: ({ currentRow, navigate, ...rest }) => {
      navigate({ currentRow, ...rest });
    },
    KeyT: async ({ event }) => {
      event.preventDefault();
      const composeButton = await document.querySelector(COMPOSE_NEW_MAIL_BUTTON);
      composeButton.click();
      const toAddressContainer = await observeForElement(document, COMPOSE_TO_ADDRESS_CONTAINER);
      addClass(document.querySelector('.preview-compose'), 'reminder-compose');
      addClass(toAddressContainer, 'to-address');
      const toAddress = await observeForElement(toAddressContainer, '[role="textbox"]');
      toAddress.innerHTML = 'eric@everfi.com';
      // const sensitivityMenuButton = await observeForElement(document, '.eU3xR button:nth-child(1)');
      // sensitivityMenuButton.click();
      // const internalOption = await observeForElement(document, '[role="menu"] [role="menuitemcheckbox"]:nth-child(3)');
      // internalOption.click();
      const subjectLine = await observeForElement(document, COMPOSE_SUBJECT_LINE);
      setTimeout(() => {
        subjectLine.focus();
        subjectLine.value = '';
      }, 500);
    },
    Quote: ({ mainContainer, shiftKey }) => mainContainer.scrollBy(0, shiftKey ? -250 : -25),
    Semicolon: ({ mainContainer, shiftKey }) => mainContainer.scrollBy(0, shiftKey ? 250 : 25),
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
        rowToSelect.setAttribute('data-preview-enabled', false);
        rowToSelect.click();
        rowToSelect.setAttribute('data-preview-enabled', true);
        setSelectedRow(rowToSelect);
      });
    }
  },
  async removeReminderClass() {
    const composeWindow = await observeForElement(document, '.preview-compose');
    removeClass(composeWindow, 'reminder-compose');
  },
};
