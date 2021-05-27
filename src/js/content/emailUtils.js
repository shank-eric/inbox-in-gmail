import {
  DATE_LABELS,
  DEFAULT_PROFILE_URL,
  CLASSES,
  MONTHS,
  NAME_COLORS
} from './constants';
import profilePhoto from './profilePhoto';
import { addClass } from './utils';

export const buildDateLabel = date => {
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
};

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

export const getThreadId = (emailEl, threadAttr = 'data-thread-id') => {
  const selectedThread = emailEl.querySelector(`[${threadAttr}]`);
  return selectedThread && selectedThread.getAttribute(threadAttr);
};
