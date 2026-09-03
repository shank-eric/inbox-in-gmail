import {
  addClass,
  doesElementByIdExist,
  replaceClass,
  addPixels,
  hasClass,
  htmlToElements,
  observeForElement,
  removeClass,
  runObserver,
} from '../shared/utils.js';
import { CLASSES } from '../shared/constants.js';
import { OUTLOOK_SELECTORS } from './constants.js';
import { findReplacementRow, getOutlookSelectedRow, rowOrder, selectRow } from './outlookUtils.js';

const { BUNDLE_WRAPPER_CLASS } = CLASSES;
// hold when outlook moves the selection on its own; an archived row's removal follows in ~300ms
const SELECTION_HOLD_MS = 600;
// the placeholder's height transition, defined once in email-preview.scss
const previewResizeMs = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--inbox-reborn-preview-resize')) || 0;
const {
  PREVIEW_CALENDAR_CONFLICT_CONTAINER,
  PREVIEW_COMPOSE,
  LIST_SCROLL_CONTAINER,
  PREVIEW_CONVERSATION_CONTAINER,
  PREVIEW_PANE,
  PREVIEW_THREAD_ROW,
  PREVIEW_WRAPPER,
  EMAIL_CONTAINER,
  EMAIL_ROW,
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
      await observeForElement(previewPane, PREVIEW_CONVERSATION_CONTAINER);
      this.previewShowing = false;
      this.showPreview = true;
    }
  },
  movePreviewPane(previewPane) {
    // this creates a space for the preview and uses absolute positioning to make it look like it's under the current email
    let previewPlaceholder = document.querySelector('.preview-placeholder');
    if (!previewPlaceholder) {
      previewPlaceholder = htmlToElements('<div class="preview-placeholder"></div>');
    }
    const parentContainer = this.currentEmail.parentNode.parentNode;
    // moving the placeholder from above the clicked row to below it removes that much space above
    // the viewport; compensate so the row stays put (by flex order: a pinned row's rect misleads)
    const placeholderHeight = previewPlaceholder.getBoundingClientRect().height;
    const wasAbove = placeholderHeight > 0 && parseFloat(previewPlaceholder.style.order) < parseFloat(parentContainer.style.order);
    parentContainer.parentNode.insertBefore(previewPlaceholder, parentContainer.nextSibling);
    previewPlaceholder.style.order = parentContainer.style.order;
    if (wasAbove) {
      const scroller = document.querySelector(LIST_SCROLL_CONTAINER);
      if (scroller) {
        scroller.scrollTop -= placeholderHeight;
      }
    }
    this.setPreviewPosition(previewPane);
  },
  showPreviewPane(previewPane) {
    this.movePreviewPane(previewPane);
    const previewPlaceholder = document.querySelector('.preview-placeholder');
    if (!this.previewShowing) {
      addClass(previewPane, 'show-preview');
      this.previewShowing = true;
    }

    const adjustPreviewSize = async () => {
      // hidden while a mutation was pending; sizing now would leave a gap in the list
      if (!this.previewShowing) {
        return;
      }
      if (hasClass(previewPane, 'preview-compose')) {
        document.querySelectorAll('[data-previewing="true"]').forEach(el => el.setAttribute('data-previewing', false));
        previewPlaceholder.style.height = null;
        previewPlaceholder.parentNode.parentNode.style.height = null;
        previewPane.style.height = null;
        return;
      }
      // thread + subject header; the copilot summary banner is hidden by css
      const previewEls = Array.from(previewPane.querySelectorAll(`${PREVIEW_WRAPPER} > div,${PREVIEW_CALENDAR_CONFLICT_CONTAINER}`));
      const previewHeight = addPixels(...previewEls.map(el => el.offsetHeight), 12);
      // width is controlled by the window size, not by the email preview
      const placeholderWidth = getComputedStyle(previewPlaceholder).width;
      const { height: placeholderHeight } = previewPlaceholder.style;
      const sizeChanged = previewHeight !== placeholderHeight;
      const firstPass = this.currentEmail.getAttribute('data-previewing') !== 'true';
      if (sizeChanged) {
        previewPlaceholder.style.height = previewHeight;
        previewPane.style.height = previewHeight;
        previewPane.style.width = placeholderWidth;
      }
      if (firstPass || sizeChanged) {
        if (firstPass) {
          document.querySelectorAll('[data-previewing="true"]').forEach(el => el.setAttribute('data-previewing', false));
          this.currentEmail.setAttribute('data-previewing', true);
          document.querySelectorAll('.sticky-email').forEach(el => removeClass(el, 'sticky-email'));
          document.querySelectorAll('.sticky-bundle-email').forEach(el => removeClass(el, 'sticky-bundle-email'));
          const isBundled = this.currentEmail.parentNode.getAttribute('data-inbox') === 'show-bundled';
          addClass(this.currentEmail.parentNode.parentNode, isBundled ? 'sticky-bundle-email' : 'sticky-email');
          // pin the email under its bundle row
          const bundleRow = isBundled ? document.querySelector(`.${BUNDLE_WRAPPER_CLASS}[data-show-emails="true"]`) : null;
          const bundleRowHeight = bundleRow ? bundleRow.getBoundingClientRect().height : 0;
          if (bundleRow) {
            this.currentEmail.parentNode.parentNode.style.setProperty('top', `${bundleRowHeight}px`, 'important');
          }
          this.pinnedHeight = bundleRowHeight + this.currentEmail.getBoundingClientRect().height;
          this.previewOpenedAt = Date.now();
          const focusedEmail = await observeForElement(document, `${PREVIEW_THREAD_ROW}#focused`);
          // hidden while waiting for the message to render
          if (!this.previewShowing) {
            return;
          }
          this.scrollMessageIntoView(focusedEmail, previewPane);
        } else if (Date.now() - this.previewOpenedAt < 2000) {
          // the body usually renders after the first size pass; follow it
          const focusedEmail = previewPane.querySelector(`${PREVIEW_THREAD_ROW}#focused`);
          if (focusedEmail) {
            this.scrollMessageIntoView(focusedEmail, previewPane);
          }
        }
      }
      this.previewObserver.observe(previewPane, { subtree: true, attributes: true });
    };
    this.previewObserver = runObserver(previewPane, { subtree: true, attributes: true }, adjustPreviewSize, false, this.previewObserver);
    adjustPreviewSize();

    this.setPreviewPosition(previewPane);
  },
  // scroll only as far as needed to show the opened message below the pinned rows:
  // its bottom if it fits, its top if it is taller than the viewport
  async scrollMessageIntoView(messageEl, previewPane) {
    const scroller = document.querySelector(LIST_SCROLL_CONTAINER);
    if (!scroller) {
      return;
    }
    // let the placeholder's height transition finish so the scroll range is final
    await new Promise(resolve => setTimeout(resolve, previewResizeMs() + 20));
    if (!this.previewShowing) {
      return;
    }
    // the focused row is zero-size when its message renders expanded; the pane ends with it
    const target = messageEl.offsetHeight ? messageEl : previewPane;
    const { top, bottom } = target.getBoundingClientRect();
    const scrollerRect = scroller.getBoundingClientRect();
    const visibleTop = scrollerRect.top + this.pinnedHeight;
    const visibleBottom = scrollerRect.bottom - 12;
    let delta = 0;
    if (bottom - top > visibleBottom - visibleTop || top < visibleTop) {
      delta = top - visibleTop;
    } else if (bottom > visibleBottom) {
      delta = bottom - visibleBottom;
    }
    // never scroll the conversation's subject header (the top of the pane) under the pinned rows
    const headerRoom = previewPane.getBoundingClientRect().top - visibleTop;
    if (delta > 0 && headerRoom < delta) {
      delta = Math.max(0, headerRoom);
    }
    if (Math.abs(delta) > 1) {
      scroller.scrollBy({ top: delta, behavior: 'smooth' });
    }
  },
  setPreviewPosition(previewPane) {
    if (hasClass(previewPane, 'preview-compose')) {
      document.querySelectorAll('[data-previewing="true"]').forEach(el => el.setAttribute('data-previewing', false));
      previewPane.style.top = null;
      return;
    }
    const previewPlaceholder = document.querySelector('.preview-placeholder');
    const { offsetTop } = previewPlaceholder;
    const totalTop = addPixels(offsetTop, 45);
    if (previewPane.style.top !== totalTop) {
      previewPane.style.top = totalTop;
    }
  },
  // `instant` skips the height transition; `keepRow` stays put on screen as the placeholder collapses
  hidePreviewPane(previewPane, { instant = false, keepRow = null } = {}) {
    const previewPlaceholder = document.querySelector('.preview-placeholder');
    if (instant && previewPlaceholder) {
      const placeholderHeight = previewPlaceholder.getBoundingClientRect().height;
      previewPlaceholder.style.transition = 'none';
      previewPlaceholder.style.height = 0;
      requestAnimationFrame(() => {
        previewPlaceholder.style.transition = '';
      });
      const scroller = document.querySelector(LIST_SCROLL_CONTAINER);
      if (scroller && keepRow && placeholderHeight > 0 && parseFloat(previewPlaceholder.style.order) < rowOrder(keepRow)) {
        scroller.scrollTop -= placeholderHeight;
      }
    }
    document.querySelectorAll('[data-previewing]').forEach(el => el.removeAttribute('data-previewing'));
    document.querySelectorAll('.sticky-email').forEach(el => removeClass(el, 'sticky-email'));
    document.querySelectorAll('.sticky-bundle-email').forEach(el => removeClass(el, 'sticky-bundle-email'));
    if (previewPane) {
      removeClass(previewPane, 'show-preview');
      // clear inline sizing so the native reading pane isn't constrained while our styling is inactive
      previewPane.style.height = null;
      previewPane.style.width = null;
      previewPane.style.top = null;
    }
    this.previewShowing = false;
    if (previewPlaceholder) {
      previewPlaceholder.style.height = 0;
    }
    if (this.previewObserver) {
      this.previewObserver.disconnect();
    }
    if (previewPane) {
      previewPane.style['margin-top'] = 0;
    }
  },
  // called from the row click handler so a selection change that follows a click is expected
  noteExpectedSelection() {
    this.expectedSelectionUntil = Date.now() + 1000;
  },
  // no click behind it and it leaves the bundle (or hits a hidden row): outlook's post-archive pick
  isUnexpectedSelection(selectedEmail) {
    if (!this.currentEmail || !this.currentEmailRow || Date.now() < this.expectedSelectionUntil) {
      return false;
    }
    const newRow = selectedEmail.closest(EMAIL_ROW);
    const sameBundle = newRow.getAttribute('data-bundles') === this.currentEmailRow.getAttribute('data-bundles');
    return !sameBundle || newRow.getAttribute('data-inbox') === 'bundled';
  },
  // after an archive, outlook selects its own next item, sometimes before the row leaves the dom
  handleRemovedEmail(previewPane) {
    // outlook detaches the inner container, so use the rows captured while it was attached
    let removedRow = null;
    if (this.currentEmail && !doesElementByIdExist(this.currentEmail)) {
      removedRow = this.currentEmailRow;
      this.currentEmail = null;
      this.hidePreviewPane(previewPane, { instant: true, keepRow: findReplacementRow(removedRow) });
    } else if (this.lastEmail && !doesElementByIdExist(this.lastEmail) && Date.now() - this.lastEmailChangedAt < 2000) {
      // the selection moved off this row just before it was removed
      removedRow = this.lastEmailRow;
    }
    if (!removedRow) {
      return;
    }
    this.lastEmail = null;
    // stay on the neighbour in the same bundle unless outlook already picked one
    const replacement = findReplacementRow(removedRow);
    if (replacement) {
      const bundles = removedRow.getAttribute('data-bundles');
      const stayedInBundle = () => {
        const picked = getOutlookSelectedRow();
        return !!picked && picked.getAttribute('data-bundles') === bundles && picked.getAttribute('data-inbox') !== 'bundled';
      };
      selectRow(replacement, stayedInBundle);
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
    this.handleRemovedEmail(previewPane);

    // the conversation container only exists once an email is selected
    const nothingSelected = !previewPane.querySelector(PREVIEW_CONVERSATION_CONTAINER);
    const selectedEmails = document.querySelectorAll(`${EMAIL_CONTAINER} [aria-selected="true"]:not(.${BUNDLE_WRAPPER_CLASS}):not(button)`);
    if (selectedEmails.length === 1 && !nothingSelected) {
      const selectedEmail = selectedEmails[0];
      const selectedEmailIsBundled = selectedEmail && selectedEmail.parentNode.getAttribute('data-inbox') === 'bundled';
      const previewBundledEmail = selectedEmail && selectedEmail.parentNode.getAttribute('data-inbox') === 'show-bundled';
      const currentEmailChanged = this.currentEmail !== selectedEmail;
      if (currentEmailChanged && this.isUnexpectedSelection(selectedEmail)) {
        // hold; handleRemovedEmail takes over if the row is removed, else the change is accepted
        if (!this.selectionHoldUntil) {
          this.selectionHoldUntil = Date.now() + SELECTION_HOLD_MS;
          // close now instead of showing outlook's pick under the departing row
          this.hidePreviewPane(previewPane, { instant: true, keepRow: findReplacementRow(this.currentEmailRow) });
          setTimeout(() => this.checkPreview(), SELECTION_HOLD_MS + 20);
        }
        if (Date.now() < this.selectionHoldUntil) {
          return;
        }
      }
      this.selectionHoldUntil = null;

      if (previewBundledEmail) {
        addClass(previewPane, 'bundle-preview');
        addClass(previewPlaceholder, 'bundle-preview-placeholder');
      } else {
        removeClass(previewPane, 'bundle-preview');
        removeClass(previewPlaceholder, 'bundle-preview-placeholder');
      }

      if (currentEmailChanged) {
        this.lastEmail = this.currentEmail;
        this.lastEmailRow = this.currentEmailRow;
        this.lastEmailChangedAt = Date.now();
        this.currentEmail = selectedEmail;
        this.currentEmailRow = selectedEmail.closest(EMAIL_ROW);
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
