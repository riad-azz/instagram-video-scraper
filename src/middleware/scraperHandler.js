const puppeteer = require('puppeteer');
const NodeCache = require("node-cache");


const minimalArgs = [
  '--autoplay-policy=user-gesture-required',
  '--disable-background-networking',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-breakpad',
  '--disable-client-side-phishing-detection',
  '--disable-component-update',
  '--disable-default-apps',
  '--disable-dev-shm-usage',
  '--disable-domain-reliability',
  '--disable-extensions',
  '--disable-features=AudioServiceOutOfProcess',
  '--disable-hang-monitor',
  '--disable-ipc-flooding-protection',
  '--disable-notifications',
  '--disable-offer-store-unmasked-wallet-cards',
  '--disable-popup-blocking',
  '--disable-print-preview',
  '--disable-prompt-on-repost',
  '--disable-renderer-backgrounding',
  '--disable-setuid-sandbox',
  '--disable-speech-api',
  '--disable-sync',
  '--hide-scrollbars',
  '--ignore-gpu-blacklist',
  '--metrics-recording-only',
  '--mute-audio',
  '--no-default-browser-check',
  '--no-first-run',
  '--no-pings',
  '--no-sandbox',
  '--no-zygote',
  '--password-store=basic',
  '--use-gl=swiftshader',
  '--use-mock-keychain',
  '--window-size=100,100'
];
const browserOptions = {
  headless: false,
  defaultViewport: { width: 100, height: 100 },
  args: minimalArgs,
};

const cacheInstance = new NodeCache();

const scraperHandler = {
  browser: null,
  handler: async (req, res, next) => {
    if (!scraperHandler.browser) {
      scraperHandler.browser = await puppeteer.launch(browserOptions);
    }
    req.scraper = scraperHandler;
    next()
  },
  activePostsId: {},
  addActivePost: (tabId) => {
    scraperHandler.activePostsId[tabId] = true;
  },
  removeActivePost: (tabId) => {
    delete scraperHandler.activePostsId[tabId];
  },
  waitForCache: (key, tabId = null, attempts = 15) => {
    const waitedTabId = tabId || key;
    return new Promise((resolve) => {
      let secondsRemaining = attempts;
      const interval = setInterval(async () => {
        const cachedResponse = await scraperHandler.getCache(key);
        if (cachedResponse) {
          clearInterval(interval);
          resolve(cachedResponse);
        }

        if (secondsRemaining === 0) {
          clearInterval(interval);
          resolve(null);
        }

        if (!(waitedTabId in scraperHandler.activePostsId)) {
          secondsRemaining = 0;
        } else {
          secondsRemaining -= 1;
        }
      }, 1000);
    });
  },
  // Caching Logic
  cache: cacheInstance,
  setCache: async (key, value, expire = 3600) => {
    try {
      const cachedValue = JSON.stringify(value);
      scraperHandler.cache.set(key, cachedValue, expire);
    }
    catch (error) {
      console.log("Error setting cache:", error); // eslint-disable-line no-console
    }
  },
  getCache: async (cacheKey) => {
    try {
      const cachedValue = await scraperHandler.cache.get(cacheKey);
      if (cachedValue) {
        const parsedValue = JSON.parse(cachedValue);
        return parsedValue;
      }
    } catch (error) {
      console.log("Error getting cache:", error); // eslint-disable-line no-console
    }

    return null;
  },
}


module.exports = scraperHandler