import {
  addClass, encodeBundleId, hasClass, isInViewport, removeClass, runObserver
} from '../shared/utils.js';
import { getOptions, reloadOptions } from '../shared/options.js';

import { findNextVisibleRow } from './outlookUtils.js';
import { CLASSES } from '../shared/constants.js';
import { OUTLOOK_CLASSES, findCheckboxClasses, OUTLOOK_SELECTORS } from './constants.js';

import Email from './email.js';
import Bundle from './bundle.js';
import emailPreview from './emailPreview.js';

const { BUNDLE_WRAPPER_CLASS } = CLASSES;
const { TIME_ROW: TIME_ROW_CLASS } = OUTLOOK_CLASSES;
const {
  EMAIL_CONTAINER, EMAIL_ROW, HIDDEN_EMAIL_ROW, SELECTED_EMAIL, SCROLLBAR_ELEMENT, TIME_ROW
} = OUTLOOK_SELECTORS;

export default {
  async observeEmails() {
    findCheckboxClasses();
    const outerContainer = document.querySelector(EMAIL_CONTAINER);
    const options = { subtree: true, childList: true, attributes: true };
    runObserver(outerContainer, options, async () => {
      reloadOptions();
      await emailPreview.checkPreview();
      this.processEmails();
    }, true);
  },
  processEmails() {
    const emailElements = document.querySelectorAll(`${EMAIL_CONTAINER} ${EMAIL_ROW}:not(.${BUNDLE_WRAPPER_CLASS}),`
      + `${EMAIL_CONTAINER} ${HIDDEN_EMAIL_ROW}`);
    let selectedEmail = document.querySelector(`${EMAIL_ROW}[data-selected="true"]`);
    if (!selectedEmail) {
      selectedEmail = document.querySelector(SELECTED_EMAIL);
      if (selectedEmail) {
        selectedEmail.setAttribute('data-selected', true);
      }
    }

    const options = getOptions();
    const labelStats = {};
    const participantEmails = new Set();

    // Start from last email on page and head towards first
    let lastEmailEl;
    let visibleEmptyEmails;
    const loaderEl = document.querySelector('.jxHeC');
    if (loaderEl) {
      loaderEl.style.order = emailElements.length * 100;
    }
    // TODO: this for loop is an area that might be able to be shared with gmail
    for (let i = emailElements.length - 1; i >= 0; i--) {
      const emailElement = emailElements[i];
      if (i === emailElements.length - 1) {
        lastEmailEl = emailElement;
      }
      const emptyEmail = emailElement.childElementCount === 0;
      if (emptyEmail && !visibleEmptyEmails) {
        visibleEmptyEmails = isInViewport(emailElement);
      } else {
        const email = new Email(emailElement, i);

        const emailLabels = email.getLabels().map(label => label.title);

        // Collect senders, message count and unread stats for each label
        if (emailLabels.length && email.isBundled()) {
          const firstParticipant = email.isReminder() ? 'Reminder' : email.getParticipants()[0].name;
          emailLabels.forEach(label => {
            const encodedId = encodeBundleId(label);
            if (!labelStats[encodedId]) {
              labelStats[encodedId] = {
                title: label,
                encodedId,
                count: 1,
                senders: [{
                  name: firstParticipant,
                  isUnread: email.isUnread()
                }]
              };
              removeClass(document.querySelector(`[data-${encodedId}].bundle-last-email`), 'bundle-last-email');
              addClass(email.emailEl, 'bundle-last-email');
            } else {
              labelStats[encodedId].count++;
              labelStats[encodedId].senders.push({
                name: firstParticipant,
                isUnread: email.isUnread()
              });
            }
            labelStats[encodedId].email = email;
            labelStats[encodedId].emailEl = email.emailEl;
            if (email.isUnread()) {
              labelStats[encodedId].containsUnread = true;
            }
          });
        }
        email.getParticipants().forEach(participant => participantEmails.add(participant.email));
      }
    }

    // Update bundle stats
    if (options.emailBundling === 'enabled') {
      Object.values(labelStats).forEach(stats => {
        const bundle = new Bundle(stats);
        bundle.updateStats(stats);
      });

      const emailBundles = this.getBundledLabels();
      Object.entries(emailBundles).forEach(([ label, el ]) => {
        if (!labelStats[label]) {
          el.remove();
        }
      });
    }

    if (visibleEmptyEmails) {
      const emailContainer = document.querySelector(EMAIL_CONTAINER);
      if (hasClass(emailContainer, 'preview-showing')) {
        removeClass(emailContainer, 'preview-showing');
        addClass(emailContainer, 'preview-showing');
      } else {
        const firstEmailEl = document.querySelector(`${SCROLLBAR_ELEMENT} > div:nth-child(1)`);
        firstEmailEl.style.height = '100vh';
        lastEmailEl.scrollIntoView();
        firstEmailEl.style.height = '';
        firstEmailEl.scrollIntoView();
      }
    }

    document.querySelectorAll(TIME_ROW).forEach(timeRow => {
      const nextVisibleRow = findNextVisibleRow(timeRow, true, true);
      if (!nextVisibleRow || hasClass(nextVisibleRow, TIME_ROW_CLASS)) {
        timeRow.style.display = 'none';
      } else {
        timeRow.style.display = null;
        timeRow.style.order = parseInt(nextVisibleRow.style.order);
      }
    });
  },
  getBundledLabels() {
    const bundleRows = Array.from(document.querySelectorAll(`${EMAIL_CONTAINER} .${BUNDLE_WRAPPER_CLASS}`));
    return bundleRows.reduce((bundles, el) => {
      bundles[el.getAttribute('data-inbox')] = el;
      return bundles;
    }, {});
  }
};
