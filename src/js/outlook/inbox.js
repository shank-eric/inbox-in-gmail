import { addClass, encodeBundleId, hasClass, removeClass, runObserver } from '../shared/utils.js';
import { getOptions, reloadOptions } from '../shared/options.js';

import { isInInbox } from './outlookUtils.js';
import { CLASSES } from '../shared/constants.js';
import { findCheckboxClasses, OUTLOOK_SELECTORS } from './constants.js';

import Email from './email.js';
import Bundle from './bundle.js';
import emailPreview from './emailPreview.js';

const { BUNDLE_WRAPPER_CLASS } = CLASSES;
const { EMAIL_CONTAINER, EMAIL_ROW, HIDDEN_EMAIL_ROW, SELECTED_EMAIL, TIME_ROW } = OUTLOOK_SELECTORS;

export default {
  async observeEmails() {
    findCheckboxClasses();
    const outerContainer = document.querySelector(EMAIL_CONTAINER);
    const options = { subtree: true, childList: true, attributes: true };
    runObserver(
      outerContainer,
      options,
      async () => {
        reloadOptions();
        await emailPreview.checkPreview();
        this.processEmails();
      },
      true
    );
  },
  processEmails() {
    const emailSelector = `${EMAIL_CONTAINER} ${EMAIL_ROW}:not(.${BUNDLE_WRAPPER_CLASS})`;
    const hiddenEmailSelector = `${EMAIL_CONTAINER} ${HIDDEN_EMAIL_ROW}`;
    const emailElements = document.querySelectorAll(`${emailSelector},${hiddenEmailSelector}`);
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
    // TODO: this for loop is an area that might be able to be shared with gmail
    for (let i = emailElements.length - 1; i >= 0; i--) {
      const emailElement = emailElements[i];
      const email = new Email(emailElement, i);

      const emailLabels = email.getLabels().map(label => label.title);

      // Collect senders, message count and unread stats for each label
      if (emailLabels.length && email.isBundled()) {
        const firstParticipant = email.isReminder() ? 'Reminder' : email.getParticipants()[0]?.name;
        emailLabels.forEach(label => {
          const encodedId = encodeBundleId(label);
          if (!labelStats[encodedId]) {
            labelStats[encodedId] = {
              title: label,
              encodedId,
              count: 1,
              senders: [
                {
                  name: firstParticipant,
                  isUnread: email.isUnread(),
                },
              ],
            };
            if (!hasClass(email.emailEl, 'bundle-last-email')) {
              removeClass(document.querySelector(`[data-${encodedId}].bundle-last-email`), 'bundle-last-email');
              addClass(email.emailEl, 'bundle-last-email');
            }
          } else {
            labelStats[encodedId].count++;
            labelStats[encodedId].senders.push({
              name: firstParticipant,
              isUnread: email.isUnread(),
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

    // Update bundle stats
    if (options.emailBundling === 'enabled' && isInInbox()) {
      document.querySelectorAll(`.${BUNDLE_WRAPPER_CLASS}`).forEach(el => (el.style.display = 'block'));
      Object.values(labelStats).forEach(stats => {
        const bundle = new Bundle(stats);
        bundle.updateStats(stats);
      });

      const emailBundles = this.getBundledLabels();
      Object.entries(emailBundles).forEach(([label, el]) => {
        if (!labelStats[label]) {
          el.remove();
        }
      });
    } else {
      document.querySelectorAll(`.${BUNDLE_WRAPPER_CLASS}`).forEach(el => (el.style.display = 'none'));
    }

    document.querySelectorAll(TIME_ROW).forEach(timeRow => {
      timeRow.style.pointerEvents = 'none';
      timeRow.style.display = 'none';
    });
  },
  getBundledLabels() {
    const bundleRows = Array.from(document.querySelectorAll(`${EMAIL_CONTAINER} .${BUNDLE_WRAPPER_CLASS}`));
    return bundleRows.reduce((bundles, el) => {
      bundles[el.getAttribute('data-inbox')] = el.parentNode.parentNode;
      return bundles;
    }, {});
  },
};
