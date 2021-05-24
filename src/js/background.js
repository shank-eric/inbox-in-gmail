chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.method === 'getOptions') {
    const options = JSON.parse(localStorage.getItem('options') || '{}');
    options.reminderTreatment = options.reminderTreatment || 'containing-word';
    options.emailBundling = options.emailBundling || 'enabled';
    options.showAvatar = options.showAvatar || 'enabled';
    options.bundleOne = options.bundleOne || false;

    sendResponse(options);
  } else sendResponse({});
});
