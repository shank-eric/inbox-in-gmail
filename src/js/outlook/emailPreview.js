import {
  addClass,
  replaceClass,
  addPixels,
  hasClass,
  htmlToElements,
  observeForElement,
  observeForRemoval,
  removeClass,
  runObserver,
} from '../shared/utils.js';
import { CLASSES } from '../shared/constants.js';
import { OUTLOOK_SELECTORS } from './constants.js';

const { BUNDLE_WRAPPER_CLASS } = CLASSES;
const {
  PREVIEW_CALENDAR_CONFLICT_CONTAINER,
  PREVIEW_COMPOSE,
  PREVIEW_PANE,
  PREVIEW_THREAD_ROW,
  PREVIEW_WRAPPER,
  EMAIL_CONTAINER,
  SELECTED_EMAILS_MENU_CONTAINER,
} = OUTLOOK_SELECTORS;

export default {
  currentEmail: null,
  async hidePreview() {
    this.showPreview = false;
    const previewPane = await this.getPreviewPane();
    this.hidePreviewPane(previewPane);
  },
  getPreviewPane() {
    return observeForElement(document, PREVIEW_PANE);
  },
  async emailClicked(clickedEmail) {
    if (clickedEmail.getAttribute('data-preview-enabled') !== 'true') {
      return;
    }
    const previewPane = await this.getPreviewPane();
    const clickedEmailContainer = clickedEmail?.querySelector('[data-convid]');
    const clickedCurrentEmail = clickedEmail && this.currentEmail && this.currentEmail === clickedEmailContainer;
    if (clickedCurrentEmail) {
      if (this.previewShowing) {
        this.showPreview = false;
        this.hidePreviewPane(previewPane);
      } else {
        this.showPreview = true;
        this.showPreviewPane(previewPane);
      }
    } else {
      // clicking the email changes the selected email automatically
      // set showPreview so that checkPreview will make it visible
      // when it processes the new selected email
      await observeForRemoval(previewPane, '.QYrHp');
      this.showPreview = true;
    }
  },
  movePreviewPane(previewPane) {
    // this creates a space for the preview and uses absolute positioning to make it look like it's under the current email
    let previewPlaceholder = document.querySelector('.preview-placeholder');
    if (!previewPlaceholder) {
      previewPlaceholder = htmlToElements('<div class="preview-placeholder"><div class="preview-scroll-target"></div></div>');
    }
    this.currentEmail.parentNode.insertBefore(previewPlaceholder, this.currentEmail.nextSibling);
    this.setPreviewPosition(previewPane);
  },
  showPreviewPane(previewPane) {
    this.movePreviewPane(previewPane);
    const previewPlaceholder = document.querySelector('.preview-placeholder');
    const previewScrollTarget = document.querySelector('.preview-scroll-target');
    const listScrollContainer = document.querySelector('.jEpCF > div');
    addClass(previewPane, 'show-preview');
    this.previewShowing = true;
    const adjustPreviewSize = () => {
      if (hasClass(previewPane, 'preview-compose')) {
        document.querySelectorAll('[data-previewing="true"]').forEach(el => el.setAttribute('data-previewing', false));
        previewPlaceholder.style.height = null;
        previewPlaceholder.parentNode.parentNode.style.height = null;
        previewPane.style.height = null;
        return;
      }
      const previewEls = Array.from(previewPane.querySelectorAll(`${PREVIEW_WRAPPER} > div,${PREVIEW_CALENDAR_CONFLICT_CONTAINER}`));
      const previewHeight = addPixels(...previewEls.map(el => el.offsetHeight), 12);
      // width is controlled by the window size, not by the email preview
      const placeholderWidth = getComputedStyle(previewPlaceholder).width;
      const { height: placeholderHeight } = previewPlaceholder.style;
      const sizeChanged = previewHeight !== placeholderHeight;
      if (sizeChanged) {
        previewPlaceholder.style.height = previewHeight;
        listScrollContainer.style.maxHeight = `calc(100vh + ${previewHeight})`;
        previewPane.style.height = previewHeight;
        previewPane.style.width = placeholderWidth;
        const expandedEmails = Array.from(previewPane.querySelectorAll(`${PREVIEW_THREAD_ROW} div[aria-expanded="true"]`));
        previewScrollTarget.style.top = addPixels(previewHeight, ...expandedEmails.map(el => -el.offsetHeight), -12, -44, -80);
        if (this.currentEmail.getAttribute('data-previewing') !== 'true') {
          document.querySelectorAll('[data-previewing="true"]').forEach(el => el.setAttribute('data-previewing', false));
          this.currentEmail.setAttribute('data-previewing', true);
          setTimeout(() => previewScrollTarget.scrollIntoViewIfNeeded({ behavior: 'smooth' }), 0);
        }
      }
      this.previewObserver.observe(previewPane, { subtree: true, attributes: true });
    };
    this.previewObserver = runObserver(previewPane, { subtree: true, attributes: true }, adjustPreviewSize, false, this.previewObserver);
    adjustPreviewSize();

    this.setPreviewPosition(previewPane);
  },
  setPreviewPosition(previewPane) {
    if (hasClass(previewPane, 'preview-compose')) {
      document.querySelectorAll('[data-previewing="true"]').forEach(el => el.setAttribute('data-previewing', false));
      previewPane.style.top = null;
      return;
    }
    const previewPlaceholder = document.querySelector('.preview-placeholder');
    const { offsetTop } = previewPlaceholder.parentNode.parentNode;
    const { children } = previewPlaceholder.parentNode;
    const childrenHeight = Array.from(children)
      .map(child => (hasClass(child, 'preview-placeholder') ? 0 : child.offsetHeight))
      .reduce((a, b) => a + b, 0);
    const totalTop = addPixels(offsetTop, childrenHeight, 45);
    if (previewPane.style.top !== totalTop) {
      previewPane.style.top = totalTop;
    }
  },
  hidePreviewPane(previewPane) {
    const previewingEmail = document.querySelector('[data-previewing]');
    if (previewingEmail) {
      previewingEmail.removeAttribute('data-previewing');
    }
    if (previewPane) {
      removeClass(previewPane, 'show-preview');
    }
    this.previewShowing = false;
    const previewPlaceholder = document.querySelector('.preview-placeholder');
    if (previewPlaceholder) {
      previewPlaceholder.style.height = 0;
    }
    if (this.previewObserver) {
      this.previewObserver.disconnect();
    }
    if (previewPane) {
      previewPane.style['margin-top'] = 0;
    }
    const listScrollContainer = document.querySelector('.jEpCF > div');
    if (listScrollContainer) {
      listScrollContainer.style.maxHeight = '';
    }
  },
  hideIfCurrentEmailRemoved(previewPane) {
    if (this.currentEmail) {
      const currentEmailEl = document.getElementById(this.currentEmail.getAttribute('id'));
      if (!currentEmailEl) {
        this.currentEmail = null;
        this.hidePreviewPane(previewPane);
      }
    }
  },
  async checkPreview() {
    const previewPane = await this.getPreviewPane();
    const composeContainer = previewPane.querySelector(PREVIEW_COMPOSE);
    const previewPlaceholder = document.querySelector('.preview-placeholder');
    if (composeContainer) {
      document.querySelectorAll('[data-previewing="true"]').forEach(el => el.setAttribute('data-previewing', false));
      replaceClass(previewPane, 'preview-compose', 'show-preview');
      previewPane.style.top = null;
      previewPane.style.height = null;
      return;
    }
    const selectedEmailOptions = previewPane.querySelector(SELECTED_EMAILS_MENU_CONTAINER);
    if (selectedEmailOptions) {
      replaceClass(previewPane, 'show-preview', 'preview-compose');
      previewPane.style.height = null;
      this.hidePreviewPane(previewPane);
      return;
    }
    replaceClass(previewPane, 'show-preview', 'preview-compose');
    this.hideIfCurrentEmailRemoved(previewPane);

    const nothingSelected = previewPane.querySelector('.QYrHp');
    const selectedEmails = document.querySelectorAll(`${EMAIL_CONTAINER} [aria-selected="true"]:not(.${BUNDLE_WRAPPER_CLASS}):not(button)`);
    if (selectedEmails.length === 1 && !nothingSelected) {
      const selectedEmail = selectedEmails[0];
      const selectedEmailIsBundled = selectedEmail && selectedEmail.parentNode.getAttribute('data-inbox') === 'bundled';
      const previewBundledEmail = selectedEmail && selectedEmail.parentNode.getAttribute('data-inbox') === 'show-bundled';
      const currentEmailChanged = this.currentEmail !== selectedEmail;

      if (previewBundledEmail) {
        addClass(previewPane, 'bundle-preview');
        addClass(previewPlaceholder, 'bundle-preview-placeholder');
      } else {
        removeClass(previewPane, 'bundle-preview');
        removeClass(previewPlaceholder, 'bundle-preview-placeholder');
      }

      if (currentEmailChanged) {
        this.currentEmail = selectedEmail;
        this.movePreviewPane(previewPane);
      }

      if (selectedEmailIsBundled || !this.showPreview) {
        this.hidePreviewPane(previewPane);
      } else {
        this.showPreviewPane(previewPane);
      }
    } else {
      this.hidePreviewPane(previewPane);
    }
  },
};
