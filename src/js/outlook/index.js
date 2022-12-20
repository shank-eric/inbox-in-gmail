import inbox from './inbox.js';
import { addClass, observeForElement } from '../shared/utils.js';
import keyboard from './keyboard.js';

async function setupOutlookNavigation() {
  const buttonContainer = document.querySelector('.V2uYM');
  const topBarSelector = window.location.host === 'outlook.office365.com' ? '.ms-CommandBar' : '#paddleContainer';
  const topBar = await observeForElement(document, topBarSelector);
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
