import { addClass, hasClass, observeForElement, queryParentSelector, removeClass } from '../shared/utils.js';
import inbox from './inbox.js';
import { GMAIL_SELECTORS } from './constants.js';

const { LEFT_MENU_BUTTON } = GMAIL_SELECTORS;

export default {
  loadedMenu: false,
  menuItems: [
    { label: 'inbox', selector: '.aHS-bnt' },
    { label: 'snoozed', selector: '.aHS-bu1' },
    { label: 'archive', selector: '.aHS-aHO' },
    { label: 'drafts', selector: '.aHS-bnq' },
    { label: 'sent', selector: '.aHS-bnu' },
    { label: 'spam', selector: '.aHS-bnv' },
    { label: 'trash', selector: '.aHS-bnx' },
    { label: 'starred', selector: '.aHS-bnw' },
    { label: 'important', selector: '.aHS-bns' },
  ],
  init() {
    const observer = new MutationObserver(() => {
      const parent = document.querySelector('.wT .byl');
      const refer = document.querySelector('.wT .byl > .TK');
      const moreMenu = document.querySelector('.J-Ke.n4.ah9');

      const menuItemsLoaded = this.menuItems.every(item => {
        item.node = this.findMenuItem(item.selector);
        return !!item.node;
      });

      if (parent && refer && this.loadedMenu && menuItemsLoaded) {
        // Gmail will execute its script to add element to the first child, so
        // add one placeholder for it and do the rest in the next child.
        const placeholder = document.createElement('div');
        addClass(placeholder, 'TK');
        addClass(placeholder, 'google-menu-placeholder');
        placeholder.style.cssText = 'padding: 0; border: 0;';
        parent.insertBefore(placeholder, refer);

        const inboxEl = this.menuItems.find(item => item.label === 'inbox').node;
        const snoozed = this.menuItems.find(item => item.label === 'snoozed').node;
        const archive = this.menuItems.find(item => item.label === 'archive').node;

        archive.firstChild.removeAttribute('id'); // removing the ID disconnects gmail event
        archive.addEventListener('click', () => window.location.assign('#archive')); // Manually add on-click event to done elment
        archive.querySelector('a').innerText = 'Archive'; // default text is All Mail
        const archiveItem = archive.querySelector('div');
        if (window.location.hash === '#archive') {
          addClass(archiveItem, 'nZ');
        }

        const newNode = document.createElement('div');
        addClass(newNode, 'TK');
        addClass(newNode, 'main-menu');
        newNode.appendChild(inboxEl);
        newNode.appendChild(snoozed);
        newNode.appendChild(archive);
        parent.insertBefore(newNode, refer);

        const chatContainer = document.querySelector('div[aria-label="Hangouts"][role="complementary"]');
        const leftHandChat = chatContainer && queryParentSelector(chatContainer, '.aeN');
        addClass(document.body, leftHandChat ? 'left-hand-chat' : 'right-hand-chat');
        moreMenu.click();
        this.setupClickEventForNodes();
        this.observeLabelNav();
        this.checkShownCategories();
        observer.disconnect();
      }

      if (!this.loadedMenu && moreMenu) {
        moreMenu.click(); // archive menu item is hiding in the more menu
        this.loadedMenu = true;
      }
    });
    observer.observe(document.body, { subtree: true, childList: true });
  },
  observeLabelNav() {
    this.applyLabelColors();
    const observer = new MutationObserver(() => {
      this.applyLabelColors();
      this.setupClickEventForNodes();
    });
    const leftNavContainer = document.querySelector('.ajl.aib .wT');
    observer.observe(leftNavContainer, { subtree: true, childList: true });
  },
  applyLabelColors() {
    document.querySelectorAll('.qj').forEach(labelIcon => {
      if (labelIcon.style.borderColor) {
        const color = labelIcon.style.borderColor;
        const text = labelIcon.parentNode.querySelector('a');
        text.style.color = color;
      }
    });
  },
  setupClickEventForNodes() {
    const leftNavItems = document.querySelectorAll('.TN');
    leftNavItems.forEach(item => item.addEventListener('click', this.activateMenuItem));
  },
  async checkShownCategories() {
    const categorySelectors = {
      Updates: '.aS4',
      Forums: '.aS3',
      Promotions: '.aS5',
      Social: '.aS6',
    };
    const body = document.querySelector('body');
    const categories = document.querySelectorAll('.byl.aJZ .aim .TO');
    if (categories.length === 0) {
      Object.keys(categorySelectors).forEach(categoryName => {
        body.setAttribute(`data-${categoryName}`, false);
      });
    } else {
      const navContainer = document.querySelector('[role=navigation]');
      const menuButton = await observeForElement(document, LEFT_MENU_BUTTON);
      const navExpanded = !hasClass(navContainer, 'bhZ');
      const categoriesExpanded = categories.length > 1;
      if (!categoriesExpanded) {
        if (!navExpanded) {
          menuButton.click(); // expand the nav
        }
        categories[0].click(); // expand the categories
        await observeForElement(document, '.byl.aJZ .aim .TO[class*="aS"]');
      }
      Object.entries(categorySelectors).forEach(([categoryName, categorySelector]) => {
        const categoryShown = !!this.findMenuItem(`.byl.aJZ .aim .TO${categorySelector}`);
        body.setAttribute(`data-${categoryName}`, categoryShown);
      });
      if (!categoriesExpanded) {
        categories[0].click(); // categories was collapsed, put it back
        if (!navExpanded) {
          menuButton.click(); // nav was collapsed before, put it back
        }
      }
    }
  },
  activateMenuItem(event) {
    inbox.restoreBundle();
    document.querySelectorAll('.nZ').forEach(el => removeClass(el, 'nZ'));
    addClass(event.currentTarget.parentNode, 'nZ');
  },
  findMenuItem(itemSelector) {
    return queryParentSelector(document.querySelector(itemSelector), '.aim');
  },
};
