import Email from './email';
import Bundle from './bundle';
import {
  addClass,
  addPixels,
  encodeBundleId,
  getTabs,
  getCurrentBundle,
  isInBundle,
  isInInbox,
  observeForElement,
  openInbox,
  removeClass
} from './utils';
import dateLabels from './dateLabels';
import { getOptions, reloadOptions } from './options';
import { CLASSES, SELECTORS } from './constants';
import emailPreview from './emailPreview';
import profilePhoto from './profilePhoto';

const {
  EMAIL_CONTAINER, EMAIL_ROW, PREVIEW_PANE, SELECTED_EMAIL
} = SELECTORS;
const { BUNDLE_WRAPPER_CLASS } = CLASSES;

// document.querySelectorAll('.v1') -- gmail's loading indicator

export default {
  async observeEmails() {
    const mainContainer = await observeForElement(document, '.AO');
    const observer = new MutationObserver(() => {
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
      }
      reloadOptions();
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
              senders: [{
                name: firstParticipant,
                isUnread: email.isUnread()
              }]
            };
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
    profilePhoto.fetchProfilePhotos([...participantEmails]);

    // Update bundle stats
    if (isInInboxFlag && !isInBundle() && options.emailBundling === 'enabled') {
      Object.values(labelStats).forEach(stats => {
        const bundle = new Bundle(stats);
        bundle.updateStats();
      });

      const emailBundles = this.getBundledLabels();
      Object.entries(emailBundles).forEach(([ label, el ]) => {
        if (!labelStats[label]) {
          el.remove();
        }
      });
      this.setCurrentBundle();
    }

    dateLabels.addDateLabels();
  },
  getBundledLabels() {
    const bundleRows = Array.from(document.querySelectorAll(`${EMAIL_CONTAINER}[role=main] .${BUNDLE_WRAPPER_CLASS}`));
    return bundleRows.reduce((bundles, el) => {
      bundles[el.getAttribute('data-inbox')] = el;
      return bundles;
    }, {});
  },
  setCurrentBundle() {
    const currentBundle = document.querySelector(`.${BUNDLE_WRAPPER_CLASS}.btb`);
    if (currentBundle) {
      removeClass(currentBundle, 'btb');
      removeClass(currentBundle.querySelector('.PF'), 'PE');
    }

    const selectedEmail = document.querySelector(`[role=main] ${SELECTED_EMAIL}:not(.${BUNDLE_WRAPPER_CLASS})`);
    if (selectedEmail && selectedEmail.getAttribute('data-inbox') === 'bundled') {
      const [newBundle] = selectedEmail.getAttribute('data-bundles').split('||');
      const selectedBundle = document.querySelector(`[data-inbox=${encodeBundleId(newBundle)}]`);
      if (selectedBundle) {
        addClass(selectedBundle, 'btb');
        // add left border
        addClass(selectedBundle.querySelector('.PF'), 'PE');
      }
    }
  },
  moveBundleElement() {
    if (isInBundle()) {
      const inboxPane = document.querySelector(`${EMAIL_CONTAINER}[data-pane="inbox"]`);
      const bundlePane = document.querySelector(`${EMAIL_CONTAINER}[role="main"]:not([data-pane="inbox"])`);

      if (inboxPane && bundlePane && inboxPane !== bundlePane && !bundlePane.getAttribute('data-navigating')) {
        const bundleEmails = bundlePane.querySelectorAll(`${EMAIL_ROW}`);
        if (!bundleEmails.length) {
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
          bundlePane.style.top = addPixels(bundleRow.offsetTop, bundleRow.clientHeight, 6);

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
  }
};
