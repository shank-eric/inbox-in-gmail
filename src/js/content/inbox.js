import Email from './email.js';
import Bundle from './bundle.js';
import { getTabs, getCurrentBundle, isInBundle, isInInbox, openInbox, setCurrentBundle } from './emailUtils.js';
import { addClass, addPixels, encodeBundleId, observeForElement } from '../shared/utils.js';
import dateLabels from './dateLabels.js';
import { getOptions, reloadOptions } from '../shared/options.js';
import { CLASSES, GMAIL_SELECTORS } from './constants.js';
import emailPreview from './emailPreview.js';
import profilePhoto from './profilePhoto.js';

const { EMAIL_CONTAINER, EMAIL_ROW, PREVIEW_PANE, SELECTED_EMAIL } = GMAIL_SELECTORS;
const { BUNDLE_WRAPPER_CLASS } = CLASSES;

// document.querySelectorAll('.v1') -- gmail's loading indicator

export default {
  async observeEmails() {
    const mainContainer = await observeForElement(document, '.AO');
    const observer = new MutationObserver(async () => {
      observer.disconnect();
      if (isInInbox()) {
        let inbox = document.querySelector(`${EMAIL_CONTAINER}[role=main][data-pane="inbox"]`);
        if (!inbox) {
          inbox = document.querySelector(`${EMAIL_CONTAINER}[role=main]`);
          if (inbox) {
            inbox.setAttribute('data-pane', 'inbox');
            const previewPane = inbox.querySelector(PREVIEW_PANE);
            if (previewPane) {
              previewPane.setAttribute('data-pane', 'inbox');
            }
          }
        }
      } else if (!isInBundle()) {
        const inbox = document.querySelector(`${EMAIL_CONTAINER}[data-pane="inbox"]`);
        if (inbox) {
          inbox.style.display = 'none';
        }
      }
      await reloadOptions();
      this.moveBundleElement();
      emailPreview.checkPreview();
      this.processEmails();
      observer.observe(mainContainer, { subtree: true, childList: true });
    });
    observer.observe(mainContainer, { subtree: true, childList: true });
  },
  processEmails() {
    const isInInboxFlag = isInInbox();
    const emailElements = document.querySelectorAll(`${EMAIL_CONTAINER}[role=main] ${EMAIL_ROW}:not(.${BUNDLE_WRAPPER_CLASS})`);
    let selectedEmail = document.querySelector(`[role="main"] ${EMAIL_ROW}[data-selected="true"]`);
    if (!selectedEmail) {
      selectedEmail = document.querySelector(`[role="main"] ${SELECTED_EMAIL}`);
      if (selectedEmail) {
        selectedEmail.setAttribute('data-selected', true);
      }
    }

    const tabs = getTabs();
    const options = getOptions();

    const currentTab = tabs.length && document.querySelector('.aAy[aria-selected="true"]');
    const labelStats = {};
    const participantEmails = new Set();
    let prevDate;

    // Start from last email on page and head towards first
    for (let i = emailElements.length - 1; i >= 0; i--) {
      const emailElement = emailElements[i];
      const email = new Email(emailElement, prevDate);
      prevDate = email.dateInfo.date;

      const emailLabels = email.getLabels().map(label => label.title);

      // Check for labels used for Tabs, and hide them from the row.
      if (currentTab) {
        email.emailEl.querySelectorAll('.ar.as').forEach(labelEl => {
          if (labelEl.innerText === currentTab.innerText) {
            // Remove Tabbed labels from the row.
            labelEl.hidden = true;
          }
        });
      }

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
              senders: [
                {
                  name: firstParticipant,
                  isUnread: email.isUnread(),
                },
              ],
            };
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
    profilePhoto.fetchProfilePhotos([...participantEmails]);

    // Update bundle stats
    if (isInInboxFlag && !isInBundle() && options.emailBundling === 'enabled') {
      Object.values(labelStats).forEach(stats => {
        const bundle = new Bundle(stats);
        bundle.updateStats();
      });

      const emailBundles = this.getBundledLabels();
      Object.entries(emailBundles).forEach(([label, el]) => {
        if (!labelStats[label]) {
          el.remove();
        }
      });
      setCurrentBundle();
    }

    dateLabels.addDateLabels();

    const imgData = options.emptyInboxImage || '';
    if (isInInboxFlag) {
      if (emailElements.length === 0 && imgData) {
        document.documentElement.style.setProperty('--empty-inbox-image', `url("${imgData}")`);
      } else {
        document.documentElement.style.removeProperty('--empty-inbox-image');
      }
    }
  },
  getBundledLabels() {
    const bundleRows = Array.from(document.querySelectorAll(`${EMAIL_CONTAINER}[role=main] .${BUNDLE_WRAPPER_CLASS}`));
    return bundleRows.reduce((bundles, el) => {
      bundles[el.getAttribute('data-inbox')] = el;
      return bundles;
    }, {});
  },
  moveBundleElement() {
    if (isInBundle()) {
      const inboxPane = document.querySelector(`${EMAIL_CONTAINER}[data-pane="inbox"]`);
      const bundlePanes = document.querySelectorAll(`${EMAIL_CONTAINER}.nH.oy8Mbf:not([data-pane="inbox"])`);
      const bundlePane = bundlePanes[bundlePanes.length - 1];

      if (inboxPane && bundlePane && inboxPane !== bundlePane) {
        const loading = document.querySelectorAll('.sq.bjE.bFQ:not(.bFR)').length > 0;
        const bundleEmails = bundlePane.querySelectorAll(`${EMAIL_ROW}`);
        if (!bundleEmails.length && !loading) {
          if (this.bundleObserver) {
            this.bundleObserver.disconnect();
          }
          openInbox();
          return;
        }
        bundlePane.setAttribute('data-pane', 'bundle');
        const bundleId = getCurrentBundle();
        inboxPane.style.display = '';
        const bundleRow = inboxPane.querySelector(`${EMAIL_ROW}.${BUNDLE_WRAPPER_CLASS}[data-inbox="${bundleId}"]`);
        if (bundleRow) {
          let bundlePlaceholder = document.querySelector('.bundle-placeholder');
          if (!bundlePlaceholder) {
            bundlePlaceholder = document.createElement('div');
            addClass(bundlePlaceholder, 'bundle-placeholder');
          }
          bundlePane.style.position = 'absolute';
          bundleRow.parentNode.insertBefore(bundlePlaceholder, bundleRow.nextSibling);
          bundleRow.style.position = 'initial';
          bundlePane.style.top = addPixels(bundleRow.offsetTop, bundleRow.clientHeight, 4);
          bundleRow.style.position = null;

          const adjustBundleHeight = () => {
            bundlePane.style['margin-top'] = `${bundleRow.clientHeight}px`;
            bundlePlaceholder.style.height = `${bundlePane.offsetHeight}px`;
          };
          if (this.bundleObserver) {
            this.bundleObserver.disconnect();
          }
          this.bundleObserver = new MutationObserver(adjustBundleHeight);
          this.bundleObserver.observe(bundlePane, { subtree: true, attributes: true });
          adjustBundleHeight();
        }
      }
    } else {
      if (this.bundleObserver) {
        this.bundleObserver.disconnect();
      }
      const bundlePlaceholder = document.querySelector('.bundle-placeholder');
      if (bundlePlaceholder) {
        bundlePlaceholder.remove();
      }
    }
  },
  restoreBundle() {
    const inboxPane = document.querySelector(`${EMAIL_CONTAINER}[data-pane="inbox"]`);
    const bundlePane = document.querySelector(`${EMAIL_CONTAINER}[data-pane="bundle"]`);
    if (inboxPane && bundlePane) {
      inboxPane.parentNode.appendChild(bundlePane);
      inboxPane.style.display = 'none';
      bundlePane.removeAttribute('data-pane');
      bundlePane.setAttribute('data-navigating', true);
    }
  },
};
