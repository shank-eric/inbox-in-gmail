import {
  addClass,
  addRemoveClass,
  addPixels,
  observeForElement,
  removeClass,
  runObserver,
  hasClass,
  observeForRemoval
} from '../shared/utils.js';
import { CLASSES } from '../shared/constants.js';
import { OUTLOOK_SELECTORS } from '../outlook/constants.js';

const { BUNDLE_WRAPPER_CLASS } = CLASSES;
const {
  PREVIEW_COMPOSE, PREVIEW_PANE, PREVIEW_ELEMENTS, EMAIL_CONTAINER
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
      previewPlaceholder = document.createElement('div');
      addClass(previewPlaceholder, 'preview-placeholder');
    }
    previewPlaceholder.style.order = parseInt(this.currentEmail.style.order) + 1;
    this.currentEmail.parentNode.insertBefore(previewPlaceholder, this.currentEmail.nextSibling);
    this.setPreviewPosition(previewPane);
  },
  showPreviewPane(previewPane) {
    this.movePreviewPane(previewPane);
    const previewPlaceholder = document.querySelector('.preview-placeholder');
    addClass(previewPane, 'show-preview');
    const emailContainer = document.querySelector(EMAIL_CONTAINER);
    addClass(emailContainer, 'preview-showing');
    this.previewShowing = true;
    const adjustPreviewHeight = () => {
      if (hasClass(previewPane, 'preview-compose')) {
        previewPane.style.height = null;
        return;
      }
      const previewEls = Array.from(previewPane.querySelectorAll(PREVIEW_ELEMENTS));
      previewPlaceholder.style.height = addPixels(...previewEls.map(el => el.offsetHeight), 20);
      previewPane.style.height = previewPlaceholder.style.height;
      this.previewObserver.observe(previewPane, { subtree: true, attributes: true });
    };
    this.previewObserver = runObserver(previewPane, { subtree: true, attributes: true }, adjustPreviewHeight, false, this.previewObserver);
    adjustPreviewHeight();
    // this.setAvatars();

    this.setPreviewPosition(previewPane);
    if (this.currentEmail.getAttribute('data-previewing') !== 'true') {
      document.querySelectorAll('[data-previewing="true"]').forEach(el => el.setAttribute('data-previewing', false));
      this.currentEmail.setAttribute('data-previewing', true);
      previewPane.scrollIntoView({ behavior: 'smooth' });
    }
  },
  setPreviewPosition(previewPane) {
    if (hasClass(previewPane, 'preview-compose')) {
      previewPane.style.top = null;
      return;
    }
    const previewPlaceholder = document.querySelector('.preview-placeholder');
    const { offsetTop } = previewPlaceholder;
    const totalTop = addPixels(offsetTop, 30); // -9 for...?  dunno, but it works
    previewPane.style.top = totalTop; // `${offsetTop}px`;
  },
  // async setAvatars() {
  //   const previewPane = await this.getPreviewPane();
  //   const avatars = Array.from(previewPane.querySelectorAll('.aCi'));
  //   avatars.forEach(avatarWrapperEl => {
  //     const currentImage = avatarWrapperEl.querySelector('img');
  //     if (currentImage) {
  //       if (currentImage.getAttribute('src') === DEFAULT_PROFILE_URL) {
  //         const participant = { name: currentImage.getAttribute('data-name'), email: currentImage.getAttribute('data-hovercard-id') };
  //         buildAvatar(avatarWrapperEl, participant);
  //         currentImage.style.display = 'none';
  //       } else {
  //         currentImage.style.display = 'block';
  //         const avatarElement = avatarWrapperEl.querySelector(`.${AVATAR_CLASS}`);
  //         if (avatarElement) {
  //           avatarElement.style.display = 'none';
  //         }
  //       }
  //     }
  //   });
  // },
  hidePreviewPane(previewPane) {
    // console.trace('hidinng preview pane');
    const previewingEmail = document.querySelector('[data-previewing]');
    if (previewingEmail) {
      previewingEmail.removeAttribute('data-previewing');
    }
    if (previewPane) {
      removeClass(previewPane, 'show-preview');
    }
    const emailContainer = document.querySelector(EMAIL_CONTAINER);
    removeClass(emailContainer, 'preview-showing');
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
  // previewMatchesSelected(previewPane, selectedEmail) {
  //   const previewThreadId = getThreadId(previewPane, 'data-thread-perm-id');
  //   const selectedThreadId = getThreadId(selectedEmail);
  //   return `#${previewThreadId}` === selectedThreadId;
  // },
  async checkPreview() {
    const previewPane = await this.getPreviewPane();
    const composeContainer = previewPane.querySelector(PREVIEW_COMPOSE);
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
    const selectedEmails = document.querySelectorAll(`${EMAIL_CONTAINER} [data-selected="true"]:not(.${BUNDLE_WRAPPER_CLASS})`);
    if (selectedEmails.length === 1 && !nothingSelected) {
      const selectedEmail = selectedEmails[0];
      const selectedEmailIsBundled = selectedEmail && selectedEmail.getAttribute('data-inbox') === 'bundled';
      const previewBundledEmail = selectedEmail && selectedEmail.getAttribute('data-inbox') === 'show-bundled';
      const currentEmailChanged = this.currentEmail !== selectedEmail;

      if (previewBundledEmail) {
        addClass(previewPane, 'bundle-preview');
      } else {
        removeClass(previewPane, 'bundle-preview');
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
  }
};
