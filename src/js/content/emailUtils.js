import {
  DEFAULT_PROFILE_URL,
  CLASSES,
  NAME_COLORS,
  GMAIL_SELECTORS
} from './constants.js';
import profilePhoto from './profilePhoto.js';
import { getOptions } from '../shared/options.js';
import { addClass, hasClass, observeForElement } from '../shared/utils.js';

export const buildAvatar = (avatarWrapperEl, participant) => {
  let avatarElement = avatarWrapperEl.querySelector(`.${CLASSES.AVATAR_CLASS}`);
  if (!avatarElement) {
    avatarElement = document.createElement('div');
    avatarElement.className = CLASSES.AVATAR_CLASS;
    avatarWrapperEl.appendChild(avatarElement);
  }

  if (participant) {
    const photoUrl = profilePhoto.getPhotoUrl(participant.email);
    const firstLetter = (participant && participant.name && participant.name.toUpperCase()[0]) || '-';
    if (photoUrl && photoUrl !== DEFAULT_PROFILE_URL) {
      avatarElement.style.background = `url(${photoUrl})`;
      addClass(avatarElement, 'profile-photo');
      avatarElement.innerText = '';
    } else if (firstLetter) {
      const firstLetterCode = firstLetter.charCodeAt(0);
      if (firstLetterCode >= 65 && firstLetterCode <= 90) {
        avatarElement.style.background = `#${NAME_COLORS[firstLetterCode - 65]}`;
      } else {
        avatarElement.style.background = '#000000';
        // Some unicode characters are not affected by 'color: white', hence this alternative
        avatarElement.style.color = 'transparent';
        avatarElement.style.textShadow = '0 0 rgba(255, 255, 255, 0.65)';
      }

      avatarElement.innerText = firstLetter;
    }
  }
};

let foundEmail;
const isAnEmail = text => text.indexOf('@') >= 0 && text.indexOf(' ') === -1;
const findEmailInArray = array => Array.isArray(array) && array.find(item => isAnEmail(item));

const findEmailInElements = elements => {
  let emailAddress;
  Array.from(elements).some(element => {
    if (element.innerText && isAnEmail(element.innerText)) {
      emailAddress = element.innerText;
    } else if (element.childNodes) {
      emailAddress = findEmailInElements(element.childNodes);
    }
    return emailAddress;
  });
  return emailAddress;
};

const findEmailInTitle = () => {
  const title = document.querySelector('title');
  if (title) {
    const titleArray = title.innerText.split('-').map(item => item.trim());
    return findEmailInArray(titleArray);
  }
};

const findEmailInAttribute = () => {
  const signOutLink = document.querySelector('[href^="https://accounts.google.com/SignOutOptions"]');
  if (signOutLink) {
    const label = signOutLink.getAttribute('aria-label');
    const labelArray = label.split(' ').map(item => item.replace('(', '').replace(')', '').trim());
    return findEmailInArray(labelArray);
  }
};

export const getMyEmailAddress = () => {
  if (!foundEmail) {
    foundEmail = findEmailInTitle();
  }
  if (!foundEmail) {
    foundEmail = findEmailInElements(document.querySelectorAll('.gb_be'));
  }
  if (!foundEmail) {
    foundEmail = findEmailInAttribute();
  }
  return foundEmail;
};

export const openReminder = async () => {
  const myEmail = getMyEmailAddress();

  const composeButton = document.querySelector('.T-I.T-I-KE.L3');
  composeButton.click();

  const composeContainer = await observeForElement(document, '.AD');
  addClass(composeContainer, 'compose-reminder');

  const focusListener = () => {
    composeContainer.removeEventListener('focus', focusListener, true);

    // wait for focus to move before setting value
    setTimeout(() => {
      const options = getOptions();
      const title = composeContainer.querySelector('input[name=subjectbox]');
      const body = composeContainer.querySelector('div[aria-label="Message Body"]');
      if (options.reminderTreatment === 'all') {
        title.focus();
      } else {
        title.value = 'Reminder';
        body.focus();
      }

      if (myEmail) {
        const to = composeContainer.querySelector('textarea[name=to]') || composeContainer.querySelector('[name=to] input');
        to.value = myEmail;
      } else {
        addClass(composeContainer, 'show-to-address');
      }
    });
  };
  composeContainer.addEventListener('focus', focusListener, true);
};

export const getThreadId = (emailEl, threadAttr = 'data-thread-id') => {
  const selectedThread = emailEl.querySelector(`[${threadAttr}]`);
  return selectedThread && selectedThread.getAttribute(threadAttr);
};

export const checkImportantMarkers = () => document.querySelector(`${GMAIL_SELECTORS.EMAIL_ROW}:not(.${CLASSES.BUNDLE_WRAPPER_CLASS}) td.WA.xY`);
export const getTabs = () => Array.from(document.querySelectorAll('.aKz')).map(el => el.innerText);
export const isInInbox = () => document.location.hash.match(/#inbox/g) !== null;
export const isInBundle = () => document.location.hash.match(/#search\/in%3Ainbox\+label%3A/g) !== null;
export const getCurrentBundle = () => {
  const matches = document.location.hash.match(/#search\/in%3Ainbox\+label%3A(.*)\+-in%3Astarred/);
  return matches && matches[1];
};
export const openBundle = bundleId => { window.location.href = `#search/in%3Ainbox+label%3A${bundleId}+-in%3Astarred`; };
export const openInbox = () => { window.location.href = '#inbox'; };

export const isDarkMode = () => hasClass(document.querySelector('body'), 'dark-mode');
