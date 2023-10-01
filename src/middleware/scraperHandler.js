const puppeteer = require('puppeteer');
const NodeCache = require("node-cache");
const { CustomError } = require('../lib/errors');

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
  headless: "new",
  defaultViewport: { width: 100, height: 100 },
  args: minimalArgs,
};

const createScraperMiddleware = () => {
  const middleware = async (req, res, next) => {
    if (!middleware.browser) {
      middleware.browser = await puppeteer.launch(browserOptions);
    }
    req.scraper = middleware;
    next();
  };

  // Initialize dependencies
  middleware.cache = new NodeCache();

  middleware.activePostsId = {};
  middleware.addActivePost = (tabId) => {
    middleware.activePostsId[tabId] = true;
  };
  middleware.removeActivePost = (tabId) => {
    delete middleware.activePostsId[tabId];
  };

  middleware.setCache = async (key, value, expire = 3600) => {
    try {
      const cachedValue = JSON.stringify(value);
      middleware.cache.set(key, cachedValue, expire);
    }
    catch (error) {
      console.log("Error setting cache:", error); // eslint-disable-line no-console
    }
  };

  middleware.getCache = async (cacheKey) => {
    try {
      const cachedValue = await middleware.cache.get(cacheKey);
      if (cachedValue) {
        const parsedValue = JSON.parse(cachedValue);
        return parsedValue;
      }
    } catch (error) {
      console.log("Error getting cache:", error); // eslint-disable-line no-console
    }

    return null;
  };

  middleware.waitForCache = (key, tabId = null, attempts = 15) => {
    const waitedTabId = tabId || key;
    return new Promise((resolve) => {
      let secondsRemaining = attempts;
      const interval = setInterval(async () => {
        const cachedResponse = await middleware.getCache(key);
        if (cachedResponse) {
          clearInterval(interval);
          resolve(cachedResponse);
        }

        if (secondsRemaining === 0) {
          clearInterval(interval);
          resolve(null);
        }

        if (!(waitedTabId in middleware.activePostsId)) {
          secondsRemaining = 0;
        } else {
          secondsRemaining -= 1;
        }
      }, 1000);
    });
  };

  middleware.isAlreadyProcessed = async (key, tabId = null) => {
    const waitedTabId = tabId || key;
    // Check if cached response exists
    let cachedResponse = await middleware.getCache(key)
    if (cachedResponse) {
      return cachedResponse;
    }

    // Check if this post is being processed
    if (key in middleware.activePostsId) {
      cachedResponse = await middleware.waitForCache(key, waitedTabId);
      if (cachedResponse) {
        return cachedResponse
      }
      throw new CustomError("Request timed out, please try again", 408);
    }

    return null;
  }

  return middleware;
};

module.exports = createScraperMiddleware()