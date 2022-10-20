import { CLASSES } from '../shared/constants.js';
import { OUTLOOK_CLASSES, getCheckboxClasses, OUTLOOK_SELECTORS } from '../outlook/constants.js';
import emailPreview from './emailPreview.js';
import {
  addClass,
  addRemoveClass,
  htmlToElements,
  queryParentSelector,
  removeClass
} from '../shared/utils.js';

import { getOptions } from '../shared/options.js';
import { setSelectedRow } from '../outlook/outlookUtils.js';

const { BUNDLE_WRAPPER_CLASS } = CLASSES;
const {
  EMAIL_ROW_INNER_CONTAINER,
  EMAIL_COLUMN_CONTAINER,
  EMAIL_DATE,
  EMAIL_PARTICIPANT_CONTAINERS,
  EMAIL_ROW,
  HIDE_AVATAR,
  SELECTED_ROW,
  UNSELECTED_ROW,
  UNREAD_EMAIL_ROW
} = OUTLOOK_CLASSES;
const {
  EMAIL_COLUMN_CONTAINER: EMAIL_COLUMN_CONTAINER_SELECTOR,
  EMAIL_ROW_INNER_CONTAINER: EMAIL_ROW_INNER_CONTAINER_SELECTOR,
  EMAIL_CONTAINER
} = OUTLOOK_SELECTORS;

export default class Bundle {
  constructor(attrs) {
    this.attrs = attrs;
    this.element = document.querySelector(`${EMAIL_CONTAINER} .${BUNDLE_WRAPPER_CLASS}[data-inbox="${attrs.encodedId}"]`);
    if (attrs.count === 0 && this.element) {
      this.element.remove();
    } else if (!this.element) {
      this.element = this.buildBundleWrapper();
    }
  }

  buildBundleWrapper() {
    const {
      email, emailEl, encodedId, title
    } = this.attrs;
    const labels = email.getLabels();
    const label = labels.find(lab => lab.encodedId === encodedId);
    const options = getOptions();
    const showEmail = this.attrs.count === 1 && !options.bundleOne;
    if (showEmail) {
      document.querySelectorAll(`[data-inbox="bundled"][data-${encodedId}]`).forEach(emailRow => {
        emailRow.setAttribute('data-inbox', 'show-bundled');
      });
      return;
    }

    emailEl.style.width = '100%';

    const {
      UNCHECKED_ROOT,
      UNCHECKED_CIRCLE,
      UNCHECKED_CHECK
    } = getCheckboxClasses();
    const columnWidths = Array.from(emailEl.querySelectorAll(`.${EMAIL_COLUMN_CONTAINER} > div`)).map(el => [ el.style.width, el.style.paddingLeft ]);
    emailEl.style.width = '';
    addClass(emailEl, 'bundle-email');
    const abbrev = title.split(' ').map(word => word.substring(0, 1)).join('');
    const archiveButtonPath = 'M6.5 8a.5.5 0 000 1h3a.5.5 0 000-1h-3zM1 3.5C1 2.67 1.67 2 2.5'
      + ' 2h11c.83 0 1.5.67 1.5 1.5v1c0 .65-.42 1.2-1 1.41v5.59a2.5 2.5 0 01-2.5 2.5h-7A2.5 2.5 0'
      + ' 012 11.5V5.91c-.58-.2-1-.76-1-1.41v-1zM2.5 3a.5.5 0 00-.5.5v1c0 .28.22.5.5.5h11a.5.5 0'
      + ' 00.5-.5v-1a.5.5 0 00-.5-.5h-11zM3 6v5.5c0 .83.67 1.5 1.5 1.5h7c.83 0 1.5-.67 1.5-1.5V6H3z';

    const bundleWrapper = htmlToElements(`
    <div
      tabindex="-1"
      class="${EMAIL_ROW} ${BUNDLE_WRAPPER_CLASS}"
      aria-selected="false"
      role="option"
      style="order: ${email.order - 1}"
      data-inbox=${encodedId}
      data-show-emails="false"
    >
      <div draggable="true">
        <div
          class="${EMAIL_ROW_INNER_CONTAINER} YbB6r IKvQi IjQyD JCRRb G1NES"
          tabindex="-1"
        >
          <div class="oJTdD">
            <div class="${EMAIL_COLUMN_CONTAINER} XG5Jd zItCb">
              <div class="jHAG3 XG5Jd" style="width: ${columnWidths[0][0]}; max-width: ${columnWidths[0][0]};">
                <div class="XG5Jd d1dnN B3KmY q0f8X"
                  tabindex="-1" role="checkbox" aria-checked="false" aria-label="Select a conversation"
                >
                  <div role="presentation"
                    class="ms-Persona-coin ms-Persona--size28 mP9b0 BQOiO">
                    <div role="presentation" class="ms-Persona-imageArea">
                        <div class="ms-Persona-initials" aria-hidden="true"
                          style="color: ${label.textColor}; background-color: ${label.backgroundColor}; border-color: ${label.borderColor}">
                          <span>${abbrev}</span>
                        </div>
                    </div>
                  </div>
                  <div class="ms-Check F5KOS pz2Jt ${UNCHECKED_ROOT}">
                      <i data-icon-name="CircleRing" aria-hidden="true"
                          class="ms-Icon ms-Check-circle ${UNCHECKED_CIRCLE}"
                          style="font-family: controlIcons;"></i>
                      <i data-icon-name="StatusCircleCheckmark" aria-hidden="true"
                          class="ms-Icon ms-Check-check LHmNz ${UNCHECKED_CHECK}"
                          style="font-family: controlIcons;"></i>
                  </div>
                </div>
                <div class="${EMAIL_PARTICIPANT_CONTAINERS} W3BHj Dc0o9 Ejrkd">
                  <span class="label-link" style="color: ${label.textColor}; background-color: ${label.backgroundColor}; border-color: ${label.borderColor}">
                    ${title}
                  </span>
                </div>
                <div class="">
                  <div class="s93_XCYBPlIFwyUuLPd5 tTNd3pbNNouuyPAh49lU">
                      <!--this is where the buttons are-->
                  </div>
                </div>
              </div>
              <div class="r7Ra_ B3KmY"
                style="width: ${columnWidths[1][0]}; max-width: ${columnWidths[1][0]}; padding-left: ${columnWidths[1][1]};">
                <div class="jN2P9 ">
                  <div class="lMXAF gy2aJ Ejrkd bundle-senders">
                  </div>
                  <div class="YH9yX">
                    <div class="Zgp3k">
                      <span class="FqgPc gy2aJ Ejrkd"></span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="WP8_u" style="width: ${columnWidths[2][0]}; max-width: ${columnWidths[2][0]};">
                <div class="lulAg">
                  <span
                    class="${EMAIL_DATE} B3KmY qq2gS IHjSF D8iyG _rWRU Ejrkd hwyHQ B3KmY"
                  >
                    ${email.getDate()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="QpoLy">
            <!-- <button type="button" class="ms-Button ms-Button--icon pz2Jt XG5Jd BsnNQ uzT44 lZpaF zItCb root-199" data-is-focusable="true">
            this is the archive button, could be a sweep button for the whole bundle, but doesn't currently work
              <span class="ms-Button-flexContainer flexContainer-163" data-automationid="splitbuttonprimary">
                <i data-icon-name="ArchiveRegular" aria-hidden="true" class="ms-Icon root-90 ms-Button-icon icon-200">
                  <span role="presentation" aria-hidden="true" class="rtm3y">
                    <svg class="d36TZ" viewBox="0 0 16 16">
                      <path d="${archiveButtonPath}">
                      </path>
                    </svg>
                  </span>
                </i>
              </span>
            </button>-->
          </div>
        </div>
      </div>
      <span class="hidden-selector"></span>
      <div class="bundle-spacer"></div>
    </div>
    `);

    bundleWrapper.onclick = e => this.handleBundleClick(e);

    if (emailEl && emailEl.parentNode) {
      emailEl.parentElement.insertBefore(bundleWrapper, emailEl);
    }
    return bundleWrapper;
  }

  async handleBundleClick(e) {
    const bundleRow = e.currentTarget;
    const isCheckClick = queryParentSelector(e.target, '.ms-Check');
    if (isCheckClick) {
      this.checkEmails();
    }

    const { encodedId } = this.attrs;
    const order = parseInt(this.element.style.order);
    emailPreview.hidePreview();
    const currentlyShowing = bundleRow.getAttribute('data-show-emails') === 'true';
    if (currentlyShowing) {
      if (!isCheckClick) {
        document.querySelectorAll(`[data-inbox="show-bundled"][data-${encodedId}]`).forEach(emailRow => {
          emailRow.setAttribute('data-inbox', 'bundled');
        });
        bundleRow.setAttribute('data-show-emails', !currentlyShowing);
        setSelectedRow(bundleRow);
        addRemoveClass(bundleRow.querySelector(EMAIL_ROW_INNER_CONTAINER_SELECTOR), SELECTED_ROW, UNSELECTED_ROW);
      }
    } else {
      document.querySelectorAll(`[data-inbox="bundled"][data-${encodedId}]`).forEach((emailRow, index) => {
        emailRow.setAttribute('data-inbox', 'show-bundled');
        emailRow.style.order = order + index + 1;
        if (index === 0) {
          setSelectedRow(emailRow);
          // emailRow.click();
          // emailRow.click();
        }
      });
      addRemoveClass(bundleRow.querySelector(EMAIL_ROW_INNER_CONTAINER_SELECTOR), UNSELECTED_ROW, SELECTED_ROW);
      bundleRow.setAttribute('data-show-emails', !currentlyShowing);
    }
  }

  checkEmails() {
    // none selected -> select all
    // some selected -> select all
    // all selected -> unselect all
    const unCheckedEmails = document.querySelectorAll(`[data-${this.attrs.encodedId}][aria-selected=false]`);
    const allEmailsChecked = unCheckedEmails.length === 0;

    const emailSelector = `[aria-selected=${allEmailsChecked ? 'true' : 'false'}]`;
    document.querySelectorAll(`[data-${this.attrs.encodedId}]${emailSelector} [role="checkbox"]`).forEach(checkbox => checkbox.click());
  }

  updateCheckbox() {
    const unCheckedEmails = document.querySelectorAll(`[data-${this.attrs.encodedId}][aria-selected=false]`);
    const allEmailsChecked = unCheckedEmails.length === 0;
    const checkedEmails = document.querySelectorAll(`[data-${this.attrs.encodedId}][aria-selected=true]`);
    const anyEmailsChecked = checkedEmails.length > 0;

    const action = !allEmailsChecked ? 'UNCHECK' : 'CHECK';
    const unaction = action === 'CHECK' ? 'UNCHECK' : 'CHECK';

    this.updateCheckboxEl('.ms-Check', 'ROOT', action, unaction);
    this.updateCheckboxEl('.ms-Check-circle', 'CIRCLE', action, unaction);
    this.updateCheckboxEl('.ms-Check-check', 'CHECK', action, unaction);

    const checkboxContainer = this.element.querySelector('[role="checkbox"');
    if (anyEmailsChecked) {
      addClass(checkboxContainer, HIDE_AVATAR);
    } else {
      removeClass(checkboxContainer, HIDE_AVATAR);
    }
  }

  updateCheckboxEl(selector, suffix, action, unaction) {
    const checkboxClasses = getCheckboxClasses();

    const check = this.element.querySelector(selector);
    addRemoveClass(check, checkboxClasses[`${action}ED_${suffix}`], checkboxClasses[`${unaction}ED_${suffix}`]);
  }

  updateStats({ email, emailEl }) {
    this.email = email;
    this.emailEl = emailEl;
    this.element.style.order = email.order - 1;
    const { encodedId } = this.attrs;
    const order = parseInt(this.element.style.order);
    document.querySelectorAll(`[data-inbox="show-bundled"][data-${encodedId}]`).forEach((emailRow, index) => {
      emailRow.style.order = order + index + 1;
    });

    const options = getOptions();
    const showEmail = this.attrs.count === 1 && !options.bundleOne;
    if (this.attrs.count === 0 || showEmail) {
      return;
    }
    this.addCount();
    this.addSenders();
    this.checkUnread();
    this.updateColumnWidths();
    this.updateCheckbox();
  }

  updateColumnWidths() {
    const { emailEl } = this.attrs;
    if (emailEl) {
      emailEl.style.width = '100%';
      const columnWidths = Array.from(emailEl.querySelectorAll(`${EMAIL_COLUMN_CONTAINER_SELECTOR} > div`)).map(el => el.style.width);
      emailEl.style.width = '';
      Array.from(this.element.querySelectorAll(`${EMAIL_COLUMN_CONTAINER_SELECTOR} > div`)).forEach((column, index) => {
        column.style.width = columnWidths[index];
        column.style.maxWidth = columnWidths[index];
      });
    }
  }

  addCount() {
    const replacementHTML = `<span>${this.attrs.title}</span> <span class="bundle-count">(${this.attrs.count})</span>`;
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
      addClass(this.element, 'bundle-unread');
      addClass(this.element.querySelector(EMAIL_ROW_INNER_CONTAINER_SELECTOR), UNREAD_EMAIL_ROW);
    } else {
      removeClass(this.element, 'bundle-unread');
      removeClass(this.element.querySelector(EMAIL_ROW_INNER_CONTAINER_SELECTOR), UNREAD_EMAIL_ROW);
    }
  }

  replaceHtml(selector, html) {
    const el = this.element.querySelector(selector);
    if (el && el.innerHTML !== html) {
      el.innerHTML = html;
    }
  }
}
