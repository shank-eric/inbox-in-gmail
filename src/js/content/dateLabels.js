import { addClass, hasClass } from './utils.js';
import {
  CLASSES, DATE_LABELS, GMAIL_SELECTORS, MONTHS
} from './constants.js';

const { TIME_ROW } = CLASSES;
const { EMAIL_CONTAINER, EMAIL_ROW } = GMAIL_SELECTORS;

export default {
  addDateLabels() {
    let lastLabel = null;
    this.cleanupDateLabels();
    const emailContainer = document.querySelector(`${EMAIL_CONTAINER}[role=main]`);
    if (emailContainer) {
      const emailElements = emailContainer.querySelectorAll(`${EMAIL_ROW}:not([data-inbox="bundled"])`);
      emailElements.forEach(emailEl => {
        const dateLabel = emailEl.getAttribute('data-date-label');

        // Add date label if it's a new label
        if (dateLabel !== lastLabel) {
          this.addDateLabel(emailEl, dateLabel);
          lastLabel = dateLabel;
        }
      });
    }
  },
  addDateLabel(email, label) {
    if (email.previousSibling && email.previousSibling.className === TIME_ROW) {
      if (email.previousSibling.innerText === label) {
        return;
      }
      email.previousSibling.remove();
    }
    const timeRow = document.createElement('div');
    addClass(timeRow, TIME_ROW);

    const time = document.createElement('div');
    time.className = 'time';
    time.innerText = label;
    timeRow.appendChild(time);
    email.parentElement.insertBefore(timeRow, email);
  },
  buildDateLabel(date) {
    const now = new Date();
    if (!date) {
      return null;
    }

    if (now.getFullYear() === date.getFullYear()) {
      if (now.getMonth() === date.getMonth()) {
        if (now.getDate() === date.getDate()) {
          return DATE_LABELS.TODAY;
        }
        if (now.getDate() - 1 === date.getDate()) {
          return DATE_LABELS.YESTERDAY;
        }
        return DATE_LABELS.THIS_MONTH;
      }
      return MONTHS[date.getMonth()];
    }
    if (now.getFullYear() - 1 === date.getFullYear()) {
      return DATE_LABELS.LAST_YEAR;
    }

    return date.getFullYear().toString();
  },
  isEmptyDateLabel(row) {
    let sibling = row.nextSibling;
    if (!sibling) {
      return true;
    }
    if (sibling.classList.contains('bundle-placeholder') || sibling.classList.contains('preview-placeholder')) {
      sibling = sibling.nextSibling;
    }
    if (!sibling) {
      return true;
    }
    if (hasClass(sibling, TIME_ROW)) {
      return true;
    }
    if (sibling.getAttribute('data-inbox') !== 'bundled') {
      return false;
    }
    return this.isEmptyDateLabel(sibling);
  },
  cleanupDateLabels() {
    document.querySelectorAll('.time-row').forEach(row => {
      // Delete any back to back date labels
      if (row.nextSibling && row.nextSibling.className === TIME_ROW) {
        row.remove();
        // Check nextSibling recursively until reaching the next .time-row
        // If all siblings are bundled, then hide row
      } else if (this.isEmptyDateLabel(row)) {
        row.hidden = true;
      }
    });
  }
};
