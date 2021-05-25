const LOOKUP_PROFILE_URL = 'https://people-pa.clients6.google.com/v2/people/lookup';

const hexString = buffer => {
  const byteArray = new Uint8Array(buffer);
  const hexCodes = [...byteArray].map(value => {
    const hexCode = value.toString(16);
    const paddedHexCode = hexCode.padStart(2, '0');
    return paddedHexCode;
  });
  return hexCodes.join('');
};

const sha1 = async message => {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const digestValue = await crypto.subtle.digest('SHA-1', data);
  return hexString(digestValue);
};

const appendQueryParams = (url, queryParams) => {
  Object.keys(queryParams).forEach(key => {
    if (Array.isArray(queryParams[key])) {
      queryParams[key].forEach(queryValue => url.searchParams.append(key, queryValue));
    } else {
      url.searchParams.append(key, queryParams[key]);
    }
  });
  return url;
};

const cachedProfiles = [];

const profilePhoto = {
  getCachedProfile(senderAddress) {
    return cachedProfiles.find(cached => cached.senderAddress === senderAddress);
  },
  getPhotoUrl(senderAddress) {
    const sender = this.getCachedProfile(senderAddress);
    if (sender) {
      return sender.photoURL;
    }
  },
  buildProfileLookupUrl(senderAddressList) {
    // Query parameters to be attached to LOOKUP_PROFILE_URL
    const profileLoookupQueryParams = {
      'context.clientVersion.clientType': 'GMAIL_WEB_DOMAIN',
      'context.clientVersion.clientVersion': 'contact_store_245761685',
      id: senderAddressList,
      'mergedPersonSourceOptions.includedProfileStates': 'CORE_ID',
      'mergedPersonSourceOptions.personModelParams.personModel': 'CONTACT_CENTRIC',
      'profileLookupOptions.emailLookupOption': 'INCLUDE_EMAIL_LOOKUP_KEY',
      'requestMask.includeContainer': [ 'CONTACT', 'PROFILE', 'DOMAIN_CONTACT', 'DOMAIN_PROFILE', 'AFFINITY' ],
      'requestMask.includeField': 'person.name,person.photo,person.email,person.phone,person.email.certificate,person.metadata',
      'requestMask.imageUrlType': 'FIFE_URL',
      type: 'EMAIL',
      // Surprisingly, this key is static across accounts/browsers. It's hardcoded and seems like it's been around for years.
      // It's not an important API key, despite the name. The real auth is done in the headers and cookie exchange.
      key: 'AIzaSyBuUpn1wi2-0JpM3S-tq2csYx0z2_m_pqc',
      // Appears to be static across different accounts/browsers, despite the name of this property.
      $unique: 'gc606'
    };

    return appendQueryParams(new URL(LOOKUP_PROFILE_URL), profileLoookupQueryParams);
  },
  async getMatches(senderAddressList) {
    const pageCookies = document.cookie.split('; ').map(x => ({ name: x.split('=')[0], value: x.split('=')[1] }));
    const SAPISID = pageCookies.find(x => x.name === 'SAPISID').value;
    const timestamp = Math.round(new Date().getTime() / 1000);
    const origin = 'https://mail.google.com';
    const tokenHash = await sha1(`${timestamp} ${SAPISID} ${origin}`);
    const authorizationHeader = `SAPISIDHASH ${timestamp}_${tokenHash}`;

    const clientDetails = [ 'appVersion', 'platform', 'userAgent' ];
    // eslint-disable-next-line camelcase
    const X_ClientDetails = clientDetails.map(val => `${val}=${encodeURIComponent(navigator[val])}`).join('&');
    // Get user number from /mail/u/{:number}/
    // eslint-disable-next-line camelcase
    const X_Goog_AuthUser = window.location.pathname.split('/')[3];

    const fetchParams = {
      method: 'GET',
      headers: {
        Authorization: authorizationHeader,
        DNT: '1',
        Origin: origin,
        Referer: `https://mail.google.com/mail/u/${X_Goog_AuthUser}/`, // eslint-disable-line camelcase
        'User-Agent': navigator.userAgent,
        'X-ClientDetails': X_ClientDetails,
        'X-Goog-AuthUser': X_Goog_AuthUser,
        'X-Goog-Encode-Response-If-Executable': 'base64',
        'X-JavaScript-User-Agent': 'google-api-javascript-client/1.1.0',
        'X-Requested-With': 'XMLHttpRequest'
      },
      mode: 'cors',
      credentials: 'include',
      referrerPolicy: 'no-referrer-when-downgrade'
    };

    const lookupProfileUrl = this.buildProfileLookupUrl(senderAddressList);
    const response = await fetch(lookupProfileUrl, fetchParams);
    return response.json();
  },
  async fetchProfilePhotos(senderAddressList) {
    if (!Array.isArray(senderAddressList)) {
      senderAddressList = [senderAddressList];
    }
    senderAddressList = senderAddressList.filter(address => !cachedProfiles.some(cached => cached.senderAddress === address));
    if (senderAddressList.length === 0) {
      return;
    }
    senderAddressList.forEach(senderAddress => cachedProfiles.push({ senderAddress, photoURL: null }));

    const responseJSON = await this.getMatches(senderAddressList);

    // Parse result to get an array of { senderAddress, photoURL } pairs
    if (responseJSON.matches) {
      responseJSON.matches.forEach(match => {
        const cachedProfile = this.getCachedProfile(match.lookupId);
        cachedProfile.photoURL = responseJSON.people[match.personId[0]].photo[0].url;
      });
    }
  }
};

export default profilePhoto;
