import leftNav from './leftNav.js';
import navigation from './navigation.js';
import inbox from './inbox.js';
import { addClass, observeForElement } from '../shared/utils.js';
import keyboard from './keyboard.js';

async function checkForDarkMode() {
  const backgroundEl = await observeForElement(document, '.wl');
  const backgroundColor = getComputedStyle(backgroundEl).getPropertyValue('background-color');
  const darkThemeColors = [ 'rgb(17, 17, 17)', 'rgb(13, 14, 14)' ];
  const gmailDarkTheme = darkThemeColors.includes(backgroundColor);
  if (gmailDarkTheme) {
    addClass(document.body, 'dark-mode');
  }
}

function isPopupEmail() {
  const params = new URLSearchParams(window.location.search);
  return params.get('ui') === '2';
}

function initInboxReborn() {
  if (isPopupEmail()) {
    return;
  }
  checkForDarkMode();
  inbox.observeEmails();
  navigation.init();
  keyboard.init();
  leftNav.init();
}

if (document.head) {
  initInboxReborn();
} else {
  document.addEventListener('DOMContentLoaded', initInboxReborn);
}
