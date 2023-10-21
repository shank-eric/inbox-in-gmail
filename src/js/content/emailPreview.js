import { addClass, addPixels, observeForElement, removeClass, runObserver } from '../shared/utils.js';
import { buildAvatar, getThreadId, isInBundle } from './emailUtils.js';
import { CLASSES, DEFAULT_PROFILE_URL, GMAIL_SELECTORS } from './constants.js';

const { EMAIL_CONTAINER, EMAIL_ROW, PREVIEW_PANE } = GMAIL_SELECTORS;

/* Issues
 * navigating quickly between two bundles can cause weird things
 */

export default {
  currentEmail: null,
  hidePreview() {
    this.showPreview = false;
  },
  getPreviewPane() {
    const previewSelector = `${EMAIL_CONTAINER}[role="main"] ${PREVIEW_PANE}`;
    return document.querySelector(previewSelector);
  },
  async emailClicked(clickedEmail) {
    const previewPane = this.getPreviewPane();
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
  movePreviewPane(previewPane) {
    // this creates a space for the preview and uses absolute positioning to make it look like it's under the current email
    let previewPlaceholder = document.querySelector('.preview-placeholder');
    if (!previewPlaceholder) {
      previewPlaceholder = document.createElement('div');
      addClass(previewPlaceholder, 'preview-placeholder');
    }
    this.currentEmail.style.position = 'relative';
    const selectedTop = this.currentEmail.offsetTop;
    this.currentEmail.style.position = '';
    this.currentEmail.parentNode.insertBefore(previewPlaceholder, this.currentEmail.nextSibling);
    previewPane.style.position = 'absolute';
    previewPane.style.top = `${selectedTop}px`;
  },
  showPreviewPane(previewPane) {
    this.movePreviewPane(previewPane);
    const previewPlaceholder = document.querySelector('.preview-placeholder');
    addClass(previewPane, 'show-preview');
    this.previewShowing = true;
    const adjustPreviewHeight = () => {
      const rowHeight = this.currentEmail.clientHeight;
      if (isInBundle()) {
        previewPlaceholder.style.height = addPixels(previewPane.offsetHeight, 16);
      } else {
        previewPane.style['padding-top'] = `${rowHeight}px`;
        previewPlaceholder.style.height = addPixels(previewPane.offsetHeight, -rowHeight, 16);
      }
    };
    this.previewObserver = runObserver(previewPane, { subtree: true, attributes: true }, adjustPreviewHeight, false, this.previewObserver);
    adjustPreviewHeight();
    this.setAvatars();

    const checkPreviewPosition = () => {
      this.rowObserver.disconnect();
      this.currentEmail.style.position = 'relative';
      const selectedTop = this.currentEmail.offsetTop;
      this.currentEmail.style.position = '';
      if (previewPane.style.top !== `${selectedTop}px`) {
        previewPane.style.top = `${selectedTop}px`;
      }
      this.rowObserver.observe(this.currentEmail, { attributes: true });
    };
    this.rowObserver = runObserver(this.currentEmail, { attributes: true }, checkPreviewPosition, false, this.rowObserver);
    if (!this.currentEmail.getAttribute('data-previewing')) {
      document.querySelectorAll('[data-previewing="true"]').forEach(el => el.setAttribute('data-previewing', false));
      this.currentEmail.setAttribute('data-previewing', true);
      previewPane.scrollIntoView({ behavior: 'smooth' });
    }
  },
  async setAvatars() {
    const previewPane = this.getPreviewPane();
    const avatars = Array.from(previewPane.querySelectorAll('.aCi'));
    avatars.forEach(avatarWrapperEl => {
      const currentImage = avatarWrapperEl.querySelector('img');
      if (currentImage) {
        if (currentImage.getAttribute('src') === DEFAULT_PROFILE_URL) {
          const participant = { name: currentImage.getAttribute('data-name'), email: currentImage.getAttribute('data-hovercard-id') };
          buildAvatar(avatarWrapperEl, participant);
          currentImage.style.display = 'none';
        } else {
          currentImage.style.display = 'block';
          const avatarElement = avatarWrapperEl.querySelector(`.${CLASSES.AVATAR_CLASS}`);
          if (avatarElement) {
            avatarElement.style.display = 'none';
          }
        }
      }
    });
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
      previewPane.style['padding-top'] = 0;
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
  previewMatchesSelected(previewPane, selectedEmail) {
    const previewThreadId = getThreadId(previewPane, 'data-thread-perm-id');
    const selectedThreadId = getThreadId(selectedEmail);
    return `#${previewThreadId}` === selectedThreadId;
  },
  checkPreview() {
    const previewPane = this.getPreviewPane();
    this.hideIfCurrentEmailRemoved(previewPane);

    const selectedEmail = document.querySelector(`${EMAIL_CONTAINER}[role="main"]  ${EMAIL_ROW}.aps`);
    if (selectedEmail) {
      const selectedEmailIsBundled = selectedEmail && selectedEmail.getAttribute('data-inbox') === 'bundled';
      const currentEmailChanged = this.currentEmail !== selectedEmail;
      const emailPreviewing = previewPane && previewPane.querySelector('.UG');
      const previewMatchesSelected = this.previewMatchesSelected(previewPane, selectedEmail);

      if (currentEmailChanged) {
        this.currentEmail = selectedEmail;
        this.movePreviewPane(previewPane);
      }

      if (selectedEmailIsBundled || !this.showPreview || !emailPreviewing || !previewMatchesSelected) {
        this.hidePreviewPane(previewPane);
      } else {
        this.showPreviewPane(previewPane);
      }
    } else {
      this.hidePreviewPane(previewPane);
    }
  },
};
