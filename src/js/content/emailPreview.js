import {
  addClass,
  removeClass,
  observeForElement
} from './utils';
import { SELECTORS } from './constants';

const { EMAIL_CONTAINER, EMAIL_ROW, PREVIEW_PANE } = SELECTORS;

/* Issues
* archiving emails in a bundle from oldest to newest doesn't automatically update preview pane
* navigating quickly between two bundles can cause weird things
* previews still aren't always consistent - might need to
*/

export default {
  currentEmail: null,
  hidePreview() {
    this.showPreview = false;
  },
  getPreviewPane(emailEl) {
    let previewSelector;
    if (emailEl.getAttribute('data-inbox')) {
      previewSelector = `${EMAIL_CONTAINER} ${PREVIEW_PANE}[data-inbox]`;
    } else {
      // this catches both emails in nested bundles and emails on non-inbox pages (like snoozed/done)
      previewSelector = `${EMAIL_CONTAINER}[role="main"] ${PREVIEW_PANE}`;
    }
    return document.querySelector(previewSelector);
  },
  async emailClicked(clickedEmail) {
    const previewPane = this.getPreviewPane(clickedEmail);
    const clickedCurrentEmail = clickedEmail && this.currentEmail && this.currentEmail === clickedEmail;
    if (clickedCurrentEmail) {
      if (this.previewShowing) {
        this.showPreview = false;
        this.hidePreviewPane(previewPane);
      } else {
        await observeForElement(previewPane, '.UG');
        this.showPreview = true;
        this.showPreviewPane(previewPane);
      }
    } else {
      // clicking the email changes the selected email automatically
      // set showPreview so that checkPreview will make it visible
      // when it processes the new selected email
      this.showPreview = true;
    }
  },
  movePreviewPane(selectedEmail, previewPane) {
    if (selectedEmail && previewPane) {
      selectedEmail.parentNode.insertBefore(previewPane, selectedEmail.nextSibling);

      // this creates a space for the preview and uses absolute positioning
      // to make it look like it's under the current email.  This did not work well with scrolling
      // let previewPlaceholder = document.querySelector('.preview-placeholder');
      // if (!previewPlaceholder) {
      //   previewPlaceholder = document.createElement('div');
      //   addClass(previewPlaceholder, 'preview-placeholder');
      // }
      // const selectedTop = selectedEmail.offsetTop;
      // selectedEmail.parentNode.insertBefore(previewPlaceholder, selectedEmail.nextSibling);
      // previewPane.style.position = 'absolute';
      // previewPane.style.top = addPixels(selectedTop, selectedEmail.clientHeight);
      // const adjustPreviewHeight = () => {
      //   console.log('adjusting height');
      //   const previewHeight = previewPane.offsetHeight;
      //   previewPlaceholder.style.height = `${previewHeight}px`;
      // };
      // if (this.observer) {
      //   this.observer.disconnect();
      // }
      // this.observer = new MutationObserver(adjustPreviewHeight);
      // this.observer.observe(previewPane, { subtree: true, childList: true });
      // adjustPreviewHeight();
    }
  },
  restorePreview(previewPane) {
    let containerSelector;
    if (previewPane.getAttribute('data-inbox')) {
      containerSelector = `${EMAIL_CONTAINER}[data-inbox]`;
    } else if (previewPane.getAttribute('data-bundle')) {
      containerSelector = `${EMAIL_CONTAINER}[data-bundle]`;
    } else {
      containerSelector = `${EMAIL_CONTAINER}[role=main]:not([data-inbox]):not([data-bundle])`;
    }

    const container = document.querySelector(containerSelector);
    if (container) {
      const nested = document.querySelector(`${containerSelector} > .Nr.UI`);
      nested.appendChild(previewPane);
    }
  },
  showPreviewPane(previewPane) {
    addClass(previewPane, 'show-preview');
    this.previewShowing = true;
  },
  hidePreviewPane(previewPane) {
    if (previewPane) {
      removeClass(previewPane, 'show-preview');
    }
    // const previewPlaceholder = document.querySelector('.preview-placeholder');
    // if (previewPlaceholder) {
    //   previewPlaceholder.style.height = 0;
    // }
    // if (this.observer) {
    //   this.observer.disconnect();
    // }
    this.previewShowing = false;
  },
  hideIfCurrentEmailRemoved() {
    if (this.currentEmail) {
      const currentEmailEl = document.getElementById(this.currentEmail.getAttribute('id'));
      const previewPane = this.getPreviewPane(this.currentEmail);
      if (!currentEmailEl) {
        this.currentEmail = null;
        this.hidePreviewPane(previewPane);
      }
    }
  },
  checkPreview() {
    this.hideIfCurrentEmailRemoved();

    const selectedEmail = document.querySelector(`${EMAIL_CONTAINER}[role="main"]  ${EMAIL_ROW}.btb`);
    if (selectedEmail) {
      const previewPane = this.getPreviewPane(selectedEmail);
      const selectedEmailIsBundled = selectedEmail && selectedEmail.getAttribute('data-bundled');
      const currentEmailChanged = this.currentEmail !== selectedEmail;
      const emailPreviewing = previewPane && previewPane.querySelector('.UG');
      if (currentEmailChanged) {
        this.currentEmail = selectedEmail;
        this.movePreviewPane(selectedEmail, previewPane);
      }

      if (selectedEmailIsBundled || !this.showPreview || !emailPreviewing) {
        this.hidePreviewPane(previewPane);
      } else {
        this.showPreviewPane(previewPane);
      }
    }
  }
};
