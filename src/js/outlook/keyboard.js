import { addClass, hasClass, isTypable, observeForCondition, observeForElement, removeClass } from '../shared/utils.js';
import emailPreview from './emailPreview.js';
import { CLASSES } from '../shared/constants.js';
import { OUTLOOK_CLASSES, OUTLOOK_SELECTORS } from './constants.js';
import { findNextVisibleRow, setSelectedRow } from './outlookUtils.js';

const { EMAIL_ROW: EMAIL_ROW_CLASS } = OUTLOOK_CLASSES;
const { BUNDLE_WRAPPER_CLASS } = CLASSES;
const { COMPOSE_NEW_MAIL_BUTTON, COMPOSE_SUBJECT_LINE, COMPOSE_TO_ADDRESS, SELECTED_EMAIL, EMAIL_ROW } = OUTLOOK_SELECTORS;

export default {
  init() {
    window.addEventListener('keydown', this.handleKeyboardEvents.bind(this));
    // const composeButton = await document.querySelector(COMPOSE_NEW_MAIL_BUTTON);
    // composeButton.addEventListener('click', () => this.removeReminderClass());
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
    // KeyC: async () => {
    //   const composeButton = await document.querySelector(COMPOSE_NEW_MAIL_BUTTON);
    //   composeButton.click();
    // },
    KeyN: ({ removeReminderClass }) => removeReminderClass(),
    KeyE: ({ currentRow, navigate, ...rest }) => {
      if (emailPreview.previewShowing) {
        emailPreview.emailClicked(currentRow);
      }
      navigate({ currentRow, ...rest });
    },
    KeyT: async () => {
      const composeButton = await document.querySelector(COMPOSE_NEW_MAIL_BUTTON);
      composeButton.click();
      const toAddress = await observeForElement(document, COMPOSE_TO_ADDRESS);
      toAddress.innerHTML = 'eric@everfi.com';
      // const sensitivityMenuButton = await observeForElement(document, '.tDDbL');
      // sensitivityMenuButton.click();
      // const internalOption = await observeForElement(document, '.ms-ContextualMenu-list li:nth-child(2) button');
      // internalOption.click();
      const subjectLine = document.querySelector(COMPOSE_SUBJECT_LINE);
      addClass(document.querySelector('.preview-compose'), 'reminder-compose');
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
        const selector = rowToSelect;
        selector.click(); // check the box to select the row
        selector.click(); // check it again to uncheck the box, but leave it selected
        setSelectedRow(rowToSelect);
      });
    }
  },
  async removeReminderClass() {
    const composeWindow = await observeForElement(document, '.preview-compose');
    removeClass(composeWindow, 'reminder-compose');
  },
};
