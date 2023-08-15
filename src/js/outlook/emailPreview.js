import {
  addClass,
  addRemoveClass,
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
const { PREVIEW_COMPOSE, PREVIEW_PANE, PREVIEW_WRAPPER, EMAIL_CONTAINER } = OUTLOOK_SELECTORS;

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
    const previewPane = await this.getPreviewPane();
    const clickedCurrentEmail = clickedEmail && this.currentEmail && this.currentEmail === clickedEmail;
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
    addClass(previewPane, 'show-preview');
    this.previewShowing = true;
    const adjustPreviewSize = () => {
      if (hasClass(previewPane, 'preview-compose')) {
        previewPane.style.height = null;
        return;
      }
      const previewWrapper = previewPane.querySelector(PREVIEW_WRAPPER);
      if (previewWrapper?.childElementCount > 1) {
        const previewHeight = addPixels(previewWrapper.offsetHeight, 12);
        const previewWidth = getComputedStyle(previewPlaceholder).width;
        const { height, width } = previewPlaceholder.style;
        const sizeChanged = previewHeight !== height || previewWidth !== width;
        if (sizeChanged) {
          previewPlaceholder.style.height = previewHeight;
          previewPane.style.height = previewHeight;
          previewPane.style.width = previewWidth;
          if (this.currentEmail.getAttribute('data-previewing') !== 'true') {
            document.querySelectorAll('[data-previewing="true"]').forEach(el => el.setAttribute('data-previewing', false));
            this.currentEmail.setAttribute('data-previewing', true);
            setTimeout(() => previewScrollTarget.scrollIntoView({ behavior: 'smooth' }), 0);
          }
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
      previewPane.style.top = null;
      return;
    }
    const previewPlaceholder = document.querySelector('.preview-placeholder');
    const { offsetTop } = previewPlaceholder.parentNode.parentNode;
    const totalTop = addPixels(offsetTop, 36, 39);
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
    if (this.rowObserver) {
      this.rowObserver.disconnect();
    }
    if (previewPane) {
      previewPane.style['margin-top'] = 0;
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
      addRemoveClass(previewPane, 'preview-compose', 'show-preview');
      previewPane.style.top = null;
      previewPane.style.height = null;
      return;
    }
    const selectedEmailOptions = previewPane.querySelector('.J7DEf');
    if (selectedEmailOptions) {
      addRemoveClass(previewPane, 'show-preview', 'preview-compose');
      previewPane.style.height = null;
      return;
    }
    addRemoveClass(previewPane, 'show-preview', 'preview-compose');
    this.hideIfCurrentEmailRemoved(previewPane);

    const nothingSelected = previewPane.querySelector('.QYrHp');
    const selectedEmails = document.querySelectorAll(`${EMAIL_CONTAINER} [aria-selected="true"]:not(.${BUNDLE_WRAPPER_CLASS})`);
    if (selectedEmails.length === 1 && !nothingSelected) {
      const selectedEmail = selectedEmails[0];
      const selectedEmailIsBundled = selectedEmail && selectedEmail.getAttribute('data-inbox') === 'bundled';
      const previewBundledEmail = selectedEmail && selectedEmail.getAttribute('data-inbox') === 'show-bundled';
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
