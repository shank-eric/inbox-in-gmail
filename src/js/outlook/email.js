import { CLASSES } from '../shared/constants.js';
import { OUTLOOK_CLASSES, OUTLOOK_SELECTORS } from './constants.js';
import { getOptions } from '../shared/options.js';
import emailPreview from './emailPreview.js';
import { isInInbox, matchesMyEmail, setSelectedRow } from './outlookUtils.js';
import { encodeBundleId, querySelectorText, querySelectorWithText, hasClass, queryParentSelector } from '../shared/utils.js';

const { REMINDER_EMAIL_CLASS } = CLASSES;
const { UNREAD_EMAIL_ROW } = OUTLOOK_CLASSES;
const { EMAIL_LABELS, EMAIL_PARTICIPANTS, EMAIL_SUBJECT, EMAIL_DATE, EMAIL_ROW_INNER_CONTAINER } = OUTLOOK_SELECTORS;

export default class Email {
  constructor(emailEl, emailIndex) {
    this.emailEl = emailEl;
    this.order = emailIndex * 100;
    if (!this.emailEl.parentNode.parentNode.style.order) {
      this.emailEl.parentNode.parentNode.style.order = this.order;
    }

    const options = getOptions();
    this.processIcon();
    if (options.emailBundling === 'enabled') {
      this.processBundle();
    }
    this.setupPreview();
  }

  getLabels() {
    return Array.from(this.emailEl.querySelectorAll(EMAIL_LABELS)).map(labelContainer => {
      const labelTitle = querySelectorText('span', labelContainer);
      const { color, borderColor, backgroundColor } = getComputedStyle(labelContainer);
      return {
        title: labelTitle,
        encodedId: encodeBundleId(labelTitle),
        borderColor,
        textColor: color,
        backgroundColor,
        element: labelContainer,
      };
    });
  }

  getParticipants() {
    const participantNodes = Array.from(this.emailEl.querySelectorAll(EMAIL_PARTICIPANTS));
    const participants = participantNodes.map(node => ({ email: node.getAttribute('title'), name: node.innerText }));
    return participants;
  }

  isBundled() {
    return ['bundled', 'show-bundled'].includes(this.emailEl.getAttribute('data-inbox'));
  }

  isReminder() {
    const options = getOptions();
    // if user doesn't want reminders treated special,
    // then just return as though current email is not a reminder
    if (options.reminderTreatment === 'none') {
      return false;
    }
    if (hasClass(this.emailEl, REMINDER_EMAIL_CLASS) || this.emailEl.getAttribute('data-icon') === 'reminder') {
      return true;
    }

    const participants = this.getParticipants();
    // TODO: matching email is very hard for everfi/bb account
    const allNamesMe = participants.length > 0 && participants.every(participant => matchesMyEmail(participant.email));
    if (options.reminderTreatment === 'all') {
      return allNamesMe;
    }
    if (options.reminderTreatment === 'containing-word') {
      const subjectText = querySelectorText(EMAIL_SUBJECT, this.emailEl);
      return allNamesMe && subjectText.match(/reminder/i);
    }

    return false;
  }

  isUnread() {
    return hasClass(this.emailEl.querySelector(EMAIL_ROW_INNER_CONTAINER), UNREAD_EMAIL_ROW);
  }

  processIcon() {
    if (this.isReminder()) {
      this.processReminder();
      this.emailEl.setAttribute('data-icon', 'reminder');
    }
  }

  getDate() {
    const { text: dateDisplay } = querySelectorWithText(EMAIL_DATE, this.emailEl);
    // dateDisplay looks like `Fri 4/22`; not sure what happens if it's a previous year
    return dateDisplay;
  }

  processBundle() {
    if (!this.emailEl.querySelector(EMAIL_ROW_INNER_CONTAINER)) {
      return;
    }
    const labels = this.getLabels(); // .filter(label => !tabs.includes(label.title));

    // only process bundles on the inbox page
    const isStarred = this.emailEl.querySelector('[data-icon-name="PinFilled"]');
    const isUnbundled = labels.some(label => label.title.includes(CLASSES.UNBUNDLED_PARENT_LABEL));

    if (labels.length && !isStarred && !isUnbundled && isInInbox()) {
      let showEmail = this.emailEl.getAttribute('data-inbox') === 'show-bundled';
      const bundles = labels
        .map(label => {
          const bundleId = encodeBundleId(label.title);
          this.emailEl.setAttribute(`data-${bundleId}`, true);
          const bundle = document.querySelector(`[data-inbox="${bundleId}"]`);
          if (bundle && !showEmail) {
            showEmail = bundle.getAttribute('data-show-emails') === 'true';
          }
          return bundleId;
        })
        .join('||');

      this.emailEl.setAttribute('data-inbox', showEmail ? 'show-bundled' : 'bundled');
      this.emailEl.setAttribute('data-bundles', bundles); // labels.map(label => encodeBundleId(label.title)).join('||'));
    } else {
      this.emailEl.setAttribute('data-inbox', 'email');
      this.emailEl.parentNode.parentNode.style.order = this.order;
      if (isUnbundled) {
        labels.forEach(label => {
          if (label.title.includes(CLASSES.UNBUNDLED_PARENT_LABEL)) {
            // Remove 'Unbundled/' from display in the UI
            label.element.querySelector('.av').innerText = label.title.replace(`${CLASSES.UNBUNDLED_PARENT_LABEL}/`, '');
          } else {
            // Hide labels that aren't nested under UNBUNDLED_PARENT_LABEL
            label.element.hidden = true;
          }
        });
      }
    }
  }

  processReminder() {
    const { element: subjectEl, text: subject } = querySelectorWithText('.bog span', this.emailEl);

    // if subject is reminder, hide subject in the row and show the body instead
    if (subject) {
      if (subject.toLowerCase() === 'reminder') {
        subjectEl.outerHTML = '';
        this.emailEl.querySelectorAll('.Zt').forEach(node => (node.outerHTML = ''));
        this.emailEl.querySelectorAll('.y2').forEach(node => (node.style.color = '#202124'));
      } else if (this.isCalendarReminder()) {
        if (subject.indexOf('Notification: ') >= 0) {
          let newSubject = subject.replace('Notification: ', '');
          newSubject = newSubject.substring(0, newSubject.indexOf('@') - 1);
          subjectEl.innerText = newSubject;
          this.emailEl.querySelector('.y2').style.display = 'none';
        }
      }
    }
    // replace email with Reminder
    this.emailEl.querySelectorAll(EMAIL_PARTICIPANTS).forEach(node => (node.innerHTML = 'Reminder'));
  }

  setupPreview() {
    const previewProcessed = this.emailEl.getAttribute('data-preview-enabled');
    if (previewProcessed !== 'true') {
      this.emailEl.addEventListener('click', e => this.emailClicked(e));
      this.emailEl.setAttribute('data-preview-enabled', true);
    }
  }

  async emailClicked(event) {
    const isButton = queryParentSelector(event.target, '.ms-Button');
    const isCheckbox = queryParentSelector(event.target, '.ms-Checkbox');
    const isSelector = hasClass(event.target, 'hidden-selector');
    if (isButton || isCheckbox || isSelector) {
      return;
    }
    setSelectedRow(this.emailEl);
    const conversationEmail = queryParentSelector(event.target, '[role="treeitem"]');
    if (conversationEmail) {
      emailPreview.emailClicked(conversationEmail);
    } else {
      emailPreview.emailClicked(this.emailEl);
    }
  }
}
