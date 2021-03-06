import {
  buildAvatar,
  buildDateLabel
} from './emailUtils';
import { CLASSES } from './constants';
import calendar from './calendar';
import { getOptions } from './options';
import emailPreview from './emailPreview';

import {
  addClass,
  encodeBundleId,
  getMyEmailAddress,
  getTabs,
  querySelectorText,
  querySelectorWithText,
  hasClass,
  isDarkMode,
  isInBundle,
  isInInbox,
  openInbox,
  queryParentSelector,
  observeForRemoval
} from './utils';

const IGNORE_CLICK_COLUMNS = [ 'oZ-x3', 'apU', 'bq4' ];
export default class Email {
  constructor(emailEl, prevDate) {
    this.emailEl = emailEl;

    const options = getOptions();
    this.processIcon();
    if (options.emailBundling === 'enabled') {
      this.processBundle();
    }
    this.processCalendar();
    this.processDate(prevDate);
    this.setupPreview();
  }

  getLabels() {
    return Array.from(this.emailEl.querySelectorAll('.ar.as')).map(labelContainer => {
      const labelEl = labelContainer.querySelector('.at');
      const labelTitle = labelEl.getAttribute('title');
      const labelText = labelContainer.querySelector('.av');
      const whiteText = labelText.style.color === 'rgb(255, 255, 255)';

      return {
        title: labelTitle,
        encodedId: encodeBundleId(labelTitle),
        textColor: isDarkMode() || whiteText ? labelEl.style.backgroundColor : labelText.style.color,
        element: labelEl
      };
    });
  }

  getParticipants() {
    const participantNodes = Array.from(this.emailEl.querySelectorAll('.yW span[email]'));
    return participantNodes.map(node => ({ email: node.getAttribute('email'), name: node.getAttribute('name') }));
  }

  isBundled() {
    return [ 'bundled', 'show-bundled' ].includes(this.emailEl.getAttribute('data-inbox'));
  }

  isReminder() {
    const options = getOptions();
    // if user doesn't want reminders treated special,
    // then just return as though current email is not a reminder
    if (options.reminderTreatment === 'none') {
      return false;
    }
    if (hasClass(this.emailEl, CLASSES.REMINDER_EMAIL_CLASS) || this.emailEl.getAttribute('data-icon') === 'reminder') {
      return true;
    }

    const participants = this.getParticipants();
    const allNamesMe = participants.length > 0 && participants.every(participant => participant.email === getMyEmailAddress());
    if (this.isCalendarReminder()) {
      return true;
    }
    if (options.reminderTreatment === 'all') {
      return allNamesMe;
    }
    if (options.reminderTreatment === 'containing-word') {
      const subjectText = querySelectorText('.y6', this.emailEl);
      return allNamesMe && subjectText.match(/reminder/i);
    }

    return false;
  }

  isCalendarReminder() {
    const subjectText = querySelectorText('.y6', this.emailEl).toLowerCase();
    return subjectText.includes('notification') && subjectText.includes('(reminders)');
  }

  isUnread() {
    return hasClass(this.emailEl, 'zE');
  }

  processIcon() {
    if (this.isReminder()) {
      this.processReminder();
      this.emailEl.setAttribute('data-icon', 'reminder');
    } else {
      this.processAvatar();
      this.emailEl.setAttribute('data-icon', 'avatar');
    }
  }

  processAvatar() {
    const options = getOptions();
    if (options.showAvatar === 'enabled') {
      const participants = this.getParticipants();
      if (!participants.length) {
        return; // Prevents Drafts in Search or Drafts folder from causing errors
      }
      let firstParticipant = participants[0];

      const excludingMe = participants.filter(participant => participant.email !== getMyEmailAddress());
      // If there are others in the participants, use one of their initials instead
      if (excludingMe.length > 0) {
        [firstParticipant] = excludingMe;
      }

      this.addAvatar(firstParticipant);
    }
  }

  processDate(prevDate) {
    const { element: dateElement, text: dateDisplay } = querySelectorWithText('.xW.xY span', this.emailEl);
    const rawDate = dateElement && dateElement.getAttribute('title');
    let date = new Date(rawDate);
    const snoozeString = querySelectorText('.by1.cL', this.emailEl);
    const isSnoozed = snoozeString || (prevDate && date < prevDate);
    if (isSnoozed) {
      date = prevDate || new Date();
    }

    const dateLabel = buildDateLabel(date);
    this.dateInfo = {
      date,
      dateLabel,
      dateDisplay,
      rawDate
    };

    this.emailEl.setAttribute('data-date-label', dateLabel);
  }

  processBundle() {
    const tabs = getTabs();
    const labels = this.getLabels().filter(label => !tabs.includes(label.title));

    // only process bundles on the inbox page
    if (isInInbox() && !isInBundle()) {
      const starContainer = this.emailEl.querySelector('.T-KT');
      const isStarred = hasClass(starContainer, 'T-KT-Jp');
      const isUnbundled = labels.some(label => label.title.includes(CLASSES.UNBUNDLED_PARENT_LABEL));

      if (labels.length && !isStarred && !isUnbundled) {
        if (this.emailEl.getAttribute('data-inbox') !== 'show-bundled') {
          this.emailEl.setAttribute('data-inbox', 'bundled');
        }
        labels.forEach(label => {
          this.emailEl.setAttribute(`data-${encodeBundleId(label.title)}`, true);
        });
        this.emailEl.setAttribute('data-bundles', labels.map(label => encodeBundleId(label.title)).join('||'));
      } else {
        this.emailEl.setAttribute('data-inbox', 'email');
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
  }

  processCalendar() {
    const calendarAlreadyProcessed = this.emailEl.getAttribute('data-calendar');
    const isCalendarEvent = querySelectorText('.aKS .aJ6', this.emailEl) === 'RSVP';

    if (isCalendarEvent && !calendarAlreadyProcessed) {
      calendar.addEventAttachment(this.emailEl);
      this.emailEl.setAttribute('data-calendar', true);
    }
  }

  processReminder() {
    const { element: subjectEl, text: subject } = querySelectorWithText('.bog span', this.emailEl);

    // if subject is reminder, hide subject in the row and show the body instead
    if (subject) {
      if (subject.toLowerCase() === 'reminder') {
        subjectEl.outerHTML = '';
        this.emailEl.querySelectorAll('.Zt').forEach(node => { node.outerHTML = ''; });
        this.emailEl.querySelectorAll('.y2').forEach(node => { node.style.color = '#202124'; });
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
    this.emailEl.querySelectorAll('.yP,.zF').forEach(node => { node.innerHTML = 'Reminder'; });
    const options = getOptions();
    if (options.showAvatar === 'enabled') {
      this.addAvatar();
    }
    addClass(this.emailEl, CLASSES.REMINDER_EMAIL_CLASS);
  }

  addAvatar(participant) {
    buildAvatar(this.emailEl.querySelector('.oZ-x3'), participant);
  }

  setupPreview() {
    const previewProcessed = this.emailEl.getAttribute('data-preview-enabled');
    if (previewProcessed !== 'true') {
      this.emailEl.addEventListener('click', e => this.emailClicked(e));
      this.emailEl.setAttribute('data-preview-enabled', true);
    }
  }

  async emailClicked(event) {
    if (this.emailEl.getAttribute('data-inbox') && isInBundle()) {
      openInbox();
      emailPreview.hidePreview();
      await observeForRemoval(document, '[data-pane="bundle"]');
      const clickColumn = queryParentSelector(event.target, '.xY');
      if (clickColumn && IGNORE_CLICK_COLUMNS.some(col => hasClass(clickColumn, col))) {
        const clickSelector = `${event.target.tagName}.${Array.from(event.target.classList).join('.')}`;
        const clickTarget = this.emailEl.querySelector(clickSelector);
        if (clickTarget) {
          clickTarget.click();
        }
      } else {
        emailPreview.emailClicked(this.emailEl);
      }
    } else {
      const clickColumn = queryParentSelector(event.target, '.xY');
      if (clickColumn && IGNORE_CLICK_COLUMNS.some(col => hasClass(clickColumn, col))) {
        return;
      }
      emailPreview.emailClicked(this.emailEl);
    }
  }
}
