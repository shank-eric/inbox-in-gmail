import inbox from './inbox.js';
import { addClass, observeForElement } from '../shared/utils.js';
import keyboard from './keyboard.js';

async function setupOutlookNavigation() {
  const buttonContainer = document.querySelector('.V2uYM');
  const topBar = await observeForElement(document, '#paddleContainer');
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
