import {
  addClass,
  hasClass,
  observeForElement,
  removeClass
} from '../shared/utils.js';
import {
  isInBundle,
  isInInbox,
  openInbox,
  openReminder
} from './emailUtils.js';
import leftNav from './leftNav.js';
import inbox from './inbox.js';
import { reloadOptions } from '../shared/options.js';
import { CLASSES } from '../shared/constants.js';

const { BUNDLE_PAGE_CLASS } = CLASSES;

export default {
  init() {
    reloadOptions();
    this.updateFloatingButtons();
    this.updateHeader();
    if (!isInInbox()) { // always make sure we start on the main inbox page so we can find the right email container
      openInbox();
    } else {
      this.handleHashChange();
    }
    window.addEventListener('hashchange', this.handleHashChange);
  },
  async updateHeader() {
    await observeForElement(document, 'a[title="Gmail"]:not([aria-label])');
    const gSuiteLogo = document.querySelector('.gb_ua.gb_ra.gb_va');
    if (gSuiteLogo) {
      addClass(document.body, 'g-suite');
    }
    this.handleSearchSubmit();
    this.handleHashChange();
  },
  async handleSearchSubmit() {
    const searchInput = await observeForElement(document, 'header form input');
    searchInput.addEventListener('keydown', event => {
      if (event.code === 'Enter') {
        inbox.restoreBundle();
      }
    });
    const searchButton = await observeForElement(document, '.gb_Df');
    if (searchButton) {
      searchButton.addEventListener('click', inbox.restoreBundle);
    }
  },
  handleHashChange() {
    let { hash } = window.location;
    // eslint-disable-next-line prefer-destructuring
    hash = hash.split('/')[0].split('?')[0];
    let title = hash.replace('#', '');
    if (isInBundle()) {
      hash = '#inbox';
      title = 'inbox';
      addClass(document.body, BUNDLE_PAGE_CLASS);
    } else {
      removeClass(document.body, BUNDLE_PAGE_CLASS);
      if (!leftNav.menuItems.some(item => `#${item.label}` === hash)) {
        hash = '#inbox';
        title = 'gmail';
      }
    }
    document.body.setAttribute('data-page', title);

    const titleNodes = document.querySelectorAll('a[title="Gmail"]');
    if (titleNodes) {
      titleNodes.forEach(titleNode => { titleNode.href = hash; });
    }
  },
  async updateFloatingButtons() {
    const menuButton = await observeForElement(document, '.gb_Rd');
    const navContainer = document.querySelector('[role=navigation]');
    const navExpanded = !hasClass(navContainer, 'bhZ');
    if (navExpanded) {
      // nav is expanded, which uses a different compose button
      // collapse it to get our compose button
      menuButton.click();
    }
    const composeContainer = await observeForElement(document, '.aic');
    const mainContainer = document.querySelector('.bkL');
    mainContainer.appendChild(composeContainer);
    const addReminder = document.createElement('div');
    addReminder.className = 'add-reminder';
    addReminder.addEventListener('click', openReminder);
    composeContainer.querySelector('.z0').appendChild(addReminder);
    if (navExpanded) {
      // nav was originally expanded, re-open it
      menuButton.click();
    }
  }
};
