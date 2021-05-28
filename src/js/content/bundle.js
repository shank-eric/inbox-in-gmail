import { CLASSES, SELECTORS } from './constants';
import emailPreview from './emailPreview';
import {
  addClass,
  checkImportantMarkers,
  getCurrentBundle,
  htmlToElements,
  isInBundle,
  observeForRemoval,
  openBundle,
  openInbox,
  removeClass,
  hasClass
} from './utils';
import { getOptions } from './options';

const { BUNDLE_WRAPPER_CLASS, EMAIL_ROW } = CLASSES;
const { EMAIL_CONTAINER } = SELECTORS;

export default class Bundle {
  constructor(attrs) {
    this.attrs = attrs;
    this.element = document.querySelector(`${EMAIL_CONTAINER}[role=main] .${BUNDLE_WRAPPER_CLASS}[data-inbox="${attrs.encodedId}"]`);
    if (attrs.count === 0 && this.element) {
      this.element.remove();
    } else if (!this.element) {
      this.element = this.buildBundleWrapper();
    }
  }

  buildBundleWrapper() {
    const importantMarkerClass = checkImportantMarkers() ? '' : 'hide-important-markers';
    const {
      email, emailEl, encodedId, title
    } = this.attrs;
    const labels = this.attrs.email.getLabels();
    const label = labels.find(lab => lab.encodedId === encodedId);
    const { dateLabel, dateDisplay, rawDate } = email.dateInfo;
    const options = getOptions();
    const showEmail = this.attrs.count === 1 && !options.bundleOne;
    if (showEmail) {
      document.querySelectorAll(`[data-inbox="bundled"][data-${encodedId}]`).forEach(emailRow => {
        emailRow.setAttribute('data-inbox', 'show-bundled');
      });
      return;
    }

    const bundleWrapper = htmlToElements(`
        <div class="${EMAIL_ROW} yO ${BUNDLE_WRAPPER_CLASS}" data-inbox=${encodedId} data-date-label="${dateLabel}" data-show-emails="false">
          <div class="PF xY"></div>
          <div class="apU xY"></div>
          <div class="WA xY ${importantMarkerClass}"></div>
          <div class="yX xY label-link .yW" style="color: ${label.textColor}">${title}</div>
          <div class="xY a4W">
            <div class="xS">
              <div class="xT">
                <span class="y2 bundle-senders"/>
              </div>
            </div>
          </div>
          <div class="xW xY">
            <span title="${rawDate}">${dateDisplay}</span>
          </div>
          <div class="bq4 xY">
            <ul class="bqY" role="toolbar">
              <li class="bqX show-emails" data-tooltip="Show Inbox Emails"></li>
            </ul>
          </div>
        </div>
    `);

    bundleWrapper.onclick = e => this.handleBundleClick(e);

    if (emailEl && emailEl.parentNode) {
      emailEl.parentElement.insertBefore(bundleWrapper, emailEl);
    }
    return bundleWrapper;
  }

  async handleBundleClick(e) {
    const { encodedId } = this.attrs;
    if (hasClass(e.target, 'show-emails')) {
      const bundleRow = e.currentTarget;
      const currentlyShowing = bundleRow.getAttribute('data-show-emails') === 'true';
      if (currentlyShowing) {
        document.querySelectorAll(`[data-inbox="show-bundled"][data-${encodedId}]`).forEach(emailRow => {
          emailRow.setAttribute('data-inbox', 'bundled');
        });
      } else {
        document.querySelectorAll(`[data-inbox="bundled"][data-${encodedId}]`).forEach(emailRow => {
          emailRow.setAttribute('data-inbox', 'show-bundled');
        });
      }
      bundleRow.setAttribute('data-show-emails', !currentlyShowing);
    } else {
      const currentBundleId = getCurrentBundle(); // will be null when in inbox
      const isInBundleFlag = isInBundle();
      const clickedClosedBundle = encodedId !== currentBundleId;

      emailPreview.hidePreview();
      if (isInBundleFlag) {
        openInbox(); // opening the inbox closes the open bundle
      }
      if (clickedClosedBundle) {
        if (isInBundleFlag) {
          await observeForRemoval(document, '[data-pane="bundle"]');
        }
        openBundle(encodedId);
      }
    }
  }

  updateStats() {
    const options = getOptions();
    const showEmail = this.attrs.count === 1 && !options.bundleOne;
    if (this.attrs.count === 0 || showEmail) {
      return;
    }
    this.addCount();
    this.addSenders();
    this.checkUnread();
  }

  addCount() {
    const replacementHTML = `<span>${this.attrs.title}</span><span class="bundle-count">(${this.attrs.count})</span>`;
    this.replaceHtml('.label-link', replacementHTML);
  }

  addSenders() {
    const uniqueSenders = this.attrs.senders.reverse().filter((sender, index, self) => {
      if (self.findIndex(s => s.name === sender.name && s.isUnread === sender.isUnread) === index) {
        if (!sender.isUnread && self.findIndex(s => s.name === sender.name && s.isUnread) >= 0) {
          return false;
        }
        return true;
      }
      return false;
    });

    const replacementHTML = `${uniqueSenders.map(sender => `<span class="${sender.isUnread ? 'strong' : ''}">${sender.name}</span>`).join(', ')}`;
    this.replaceHtml('.bundle-senders', replacementHTML);
  }

  checkUnread() {
    if (this.attrs.containsUnread) {
      addClass(this.element, 'zE');
      removeClass(this.element, 'yO');
    } else {
      addClass(this.element, 'yO');
      removeClass(this.element, 'zE');
    }
  }

  replaceHtml(selector, html) {
    const el = this.element.querySelector(selector);
    if (el && el.innerHTML !== html) {
      el.innerHTML = html;
    }
  }
}
