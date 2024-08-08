import inbox from './inbox.js';
import { addClass, observeForElement } from '../shared/utils.js';
import keyboard from './keyboard.js';
import { OUTLOOK_SELECTORS } from './constants.js';

const { SELECT_EMAILS_CONTAINER, TOP_BAR_CONTAINER } = OUTLOOK_SELECTORS;

async function setupOutlookNavigation() {
  const buttonContainer = document.querySelector(SELECT_EMAILS_CONTAINER);
  const topBar = await observeForElement(document, TOP_BAR_CONTAINER);
  topBar.appendChild(buttonContainer);
  addClass(topBar, 'top-bar');
}
async function initInboxReborn() {
  await observeForElement(document, '#app > div');
  inbox.observeEmails();
  keyboard.init();
  setupOutlookNavigation();
}

if (document.head) {
  initInboxReborn();
} else {
  document.addEventListener('DOMContentLoaded', initInboxReborn);
}
