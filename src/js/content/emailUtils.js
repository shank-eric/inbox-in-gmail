import {
  CLASSES,
  NAME_COLORS
} from '../shared/constants.js';

import {
  DEFAULT_PROFILE_URL,
  OUTLOOK_SELECTORS
} from '../outlook/constants.js';
import profilePhoto from './profilePhoto.js';
import {
  addClass, hasClass, observeForElement
} from '../shared/utils.js';

const { EMAIL_ROW, PREVIEW_COMPOSE } = OUTLOOK_SELECTORS;

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
const findEmailInLink = () => {
  const brandLink = document.querySelector('#O365_AppName');
  if (brandLink) {
    const brandUrl = new URL(brandLink.getAttribute('href'));
    return brandUrl.searchParams.get('login_hint');
  }
};

export const getMyEmailAddress = () => {
  if (!foundEmail) {
    foundEmail = findEmailInLink();
  }
  return foundEmail;
};

const deconstructEmail = email => {
  const [ address, fullDomain ] = email.split('@');
  const [ domain, tld ] = fullDomain.split('.');
  return { address, domain, tld };
};

export const matchesMyEmail = email => {
  const myEmail = getMyEmailAddress();
  if (!myEmail || !email) {
    return false;
  }
  const { address: myAddress, domain: myDomain } = deconstructEmail(myEmail);
  const { address, domain } = deconstructEmail(email);
  return myAddress === address && myDomain === domain;
};

export const openReminder = async () => {
  const myEmail = getMyEmailAddress();

  const composeButton = document.querySelector('.m2Lea');
  composeButton.click();

  const composeContainer = await observeForElement(document, PREVIEW_COMPOSE);
  addClass(composeContainer, 'compose-reminder');

  const focusListener = () => {
    composeContainer.removeEventListener('focus', focusListener, true);

    // wait for focus to move before setting value
    setTimeout(() => {
      // const options = getOptions();
      // const title = composeContainer.querySelector('.FN9jN input');
      // // const body = composeContainer.querySelector('div[aria-label="Message Body"]');
      // if (options.reminderTreatment === 'all') {
      //   title.focus();
      // // } else {
      // //   title.value = 'Reminder';
      // //   body.focus();
      // }

      if (myEmail) {
        const to = composeContainer.querySelector('.UvnRr input');
        to.value = myEmail;
        to.focus();
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

export const checkImportantMarkers = () => document.querySelector(`${EMAIL_ROW}:not(.${CLASSES.BUNDLE_WRAPPER_CLASS}) td.WA.xY`);
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
