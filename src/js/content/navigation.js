import {
  addClass,
  getMyEmailAddress,
  hasClass,
  isInBundle,
  isInInbox,
  isTypable,
  observeForElement,
  openInbox,
  removeClass
} from './utils';
import leftNav from './leftNav';
import inbox from './inbox';
import emailPreview from './emailPreview';
import { getOptions, reloadOptions } from './options';
import { CLASSES, SELECTORS } from './constants';

const { EMAIL_ROW, SELECTED_EMAIL } = SELECTORS;
const { BUNDLE_PAGE_CLASS, BUNDLE_WRAPPER_CLASS } = CLASSES;

export default {
  init() {
    reloadOptions();
    this.updateFloatingButtons();
    this.updateHeader();
    if (!isInInbox()) { // always make sure we start on the main inbox page so we can find the right email container
      openInbox();
    }
    window.addEventListener('hashchange', this.handleHashChange);
    window.addEventListener('keydown', this.handleKeyboardEvents);
  },
  async updateHeader() {
    if (document.querySelector('link[rel*="icon"]')) {
      document.querySelector('link[rel*="icon"]').href = chrome.runtime.getURL('images/favicon.png');
    }

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
    const headerElement = document.querySelector('header') && document.querySelector('header').parentElement.parentElement;
    if (headerElement) {
      headerElement.setAttribute('pageTitle', title);
    }

    const titleNode = document.querySelector('a[title="Gmail"]:not([aria-label])');
    if (titleNode) {
      titleNode.href = hash;
    }
  },
  handleKeyboardEvents(event) {
    const navKeys = [ 'ArrowUp', 'ArrowDown', 'KeyJ', 'KeyK' ];
    const currentRow = document.querySelector(`[role="main"] ${SELECTED_EMAIL}:not(.${BUNDLE_WRAPPER_CLASS})`);
    const currentBundle = document.querySelector(`[role="main"] ${SELECTED_EMAIL}.${BUNDLE_WRAPPER_CLASS}`);

    if (event.code === 'Escape') {
      if (emailPreview.previewShowing) {
        emailPreview.emailClicked(currentRow);
      } else if (isInBundle()) {
        openInbox();
      }
    } else if (event.code === 'Enter') {
      if (currentRow.getAttribute('data-inbox') === 'bundled') {
        currentBundle.click();
      } else {
        currentRow.click();
      }
    } else if (navKeys.includes(event.code)) {
      if (currentRow.getAttribute('data-inbox') === 'bundled') {
        // gmail moved focus to a bundled email, we need to decide if we're going to focus that bundle or if we should ignore it?
        // - if there's anything visible between the previously selected email and the one that is now selected, select that instead
        // - if there's nothing visible between the previously selected email and the one that is now selected
        //   find the next visible thing after the previous email and select that
        // - if there's nothing visible after the previous email, stay focused on that one
        const previousEmail = document.querySelector(`[role="main"] ${EMAIL_ROW}[data-selected="true"]:not(.${BUNDLE_WRAPPER_CLASS})`);
        const previousBundle = document.querySelector(`.${BUNDLE_WRAPPER_CLASS}[data-selected="true"]`);

        const searchNext = event.code === 'ArrowDown' || event.code === 'KeyJ';
        const navigator = searchNext ? 'nextSibling' : 'previousSibling';

        let nextRow = previousEmail[navigator];
        // skip rows that we shouldn't focus on
        // - non emails (date labels, preview pane, etc)
        // - bundled emails
        // - the bundle row from the previously selected email
        let isEmailRow = hasClass(nextRow, EMAIL_ROW);
        let isEmailBundled = nextRow.getAttribute('data-inbox') === 'bundled';
        let isPreviousBundle = previousEmail.getAttribute('data-inbox') === 'bundled' && nextRow === previousBundle;
        while (nextRow && (!isEmailRow || isEmailBundled || isPreviousBundle)) {
          nextRow = nextRow[navigator];
          if (nextRow) {
            isEmailRow = hasClass(nextRow, EMAIL_ROW);
            isEmailBundled = nextRow.getAttribute('data-inbox') === 'bundled';
            isPreviousBundle = previousEmail.getAttribute('data-inbox') === 'bundled' && nextRow === previousBundle;
          }
        }
        if (nextRow) {
          if (previousEmail) {
            previousEmail.setAttribute('data-selected', null);
          }
          if (previousBundle) {
            previousBundle.setAttribute('data-selected', null);
          }
        } else {
          nextRow = previousEmail;
        }

        let emailToSelect;
        if (hasClass(nextRow, BUNDLE_WRAPPER_CLASS)) {
          const nextBundle = nextRow.getAttribute('data-inbox');
          nextRow.setAttribute('data-selected', true);
          // select the first email in the bundle
          emailToSelect = document.querySelector(`[role="main"] ${EMAIL_ROW}[data-inbox="bundled"][data-${nextBundle}]`);
        } else if (nextRow) {
          emailToSelect = nextRow;
        }
        if (emailToSelect) {
          emailToSelect.setAttribute('data-selected', true);
          const checkbox = emailToSelect.querySelector('.aid');
          // check the box to select the row
          checkbox.click();
          // check it again to uncheck the box, but leave it selected
          checkbox.click();
        }
      } else {
        currentRow.setAttribute('data-selected', true);
      }
    }
    inbox.setCurrentBundle();
  },
  async updateFloatingButtons() {
    const menuButton = await observeForElement(document, '.gb_uc');
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
    addReminder.addEventListener('click', this.openReminder);
    window.addEventListener('keydown', event => {
      const inInput = event.target && isTypable(event.target);

      if (event.code === 'KeyT' && !inInput) {
        this.openReminder();
      }
    });
    composeContainer.querySelector('.z0').appendChild(addReminder);
    if (navExpanded) {
      // nav was originally expanded, re-open it
      menuButton.click();
    }
  },
  async openReminder() {
    const myEmail = getMyEmailAddress();

    // TODO: Replace all of the below with gmail.compose.start_compose() via the Gmail.js lib
    const composeButton = document.querySelector('.T-I.T-I-KE.L3');
    composeButton.click();

    // TODO: Delete waitForElement() function, replace with gmail.observe.on('compose') via the Gmail.js lib
    const composeContainer = await observeForElement(document, '.AD');
    addClass(composeContainer, 'compose-reminder');
    const to = composeContainer.querySelector('textarea[name=to]');
    const title = composeContainer.querySelector('input[name=subjectbox]');
    const body = composeContainer.querySelector('div[aria-label="Message Body"]');
    const from = composeContainer.querySelector('input[name="from"]');

    from.value = myEmail;
    to.value = myEmail;
    const options = getOptions();
    if (options.reminderTreatment === 'all') {
      to.addEventListener('focus', () => title.focus());
    } else {
      title.value = 'Reminder';
      to.addEventListener('focus', () => body.focus());
    }
  }
};
