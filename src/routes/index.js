const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const NodeCache = require("node-cache");
const express = require('express');

const { getPostId } = require('../lib/instagram/helpers');
const { getCache, setCache } = require('../lib/cache');
const { browserOptions, handleBlockedResources } = require('../lib/scraper');

const router = express.Router();
const cache = new NodeCache();

let browser;
const activePostsId = {};


const waitForCurrentTab = (postId, attempts = 15) => {
  return new Promise((resolve) => {
    let secondsRemaining = attempts;
    const interval = setInterval(async () => {
      const cachedResponse = await getCache(cache, postId);
      if (cachedResponse) {
        clearInterval(interval);
        resolve(cachedResponse);
      }

      if (secondsRemaining === 0) {
        clearInterval(interval);
        resolve(null);
      }

      if (postId in activePostsId) {
        secondsRemaining = 0;
      } else {
        secondsRemaining -= 1;
      }
    }, 1000);
  });
}


router.get('/video', async (req, res, next) => {
  const inputUrl = req.query.url;

  // Validate user input
  if (!inputUrl) {
    return res.status(400).send({ message: "Post URL is required" });
  }

  const postId = getPostId(inputUrl);
  if (!postId) {
    return res.status(400).send({ message: "Invalid URL, post ID not found" });
  }

  // Check if cached response exists
  let cachedResponse = await getCache(cache, postId)
  if (cachedResponse) {
    return res.status(200).json(cachedResponse);
  }

  if (!browser) {
    browser = await puppeteer.launch(browserOptions);
  }

  // Check if this post is already being processed
  if (postId in activePostsId) {
    cachedResponse = await waitForCurrentTab(postId);
    if (cachedResponse) {
      return res.status(200).json(cachedResponse);
    }
    return res.status(500).json({ message: "Request timed out, please try again" });
  }

  // Scrape post metadata
  let currentPage;
  try {
    const postUrl = `https://www.instagram.com/p/${postId}/`;

    // Open new browser tab
    currentPage = await browser.newPage();
    // Intercept and block certain resource types for better performance
    await currentPage.setRequestInterception(true);
    currentPage.on("request", handleBlockedResources);
    // Load post page
    activePostsId[postId] = true;
    await currentPage.goto(postUrl, { waitUntil: 'networkidle0' });

    // Parse page HTML
    const html = await currentPage.content();
    const $ = cheerio.load(html);

    const isNotFound = $('main > div > div > span').length > 0;
    if (isNotFound) {
      const message = "This post is private or does not exist"
      return res.status(400).send({ message });
    }

    const isLoginPage = $('input[name="username"]').length > 0;
    if (isLoginPage) {
      const message = "Something went wrong, please try again"
      return res.status(500).send({ message });
    }

    // Get video metadata
    const videoUrl = $("video").attr("src");

    if (!videoUrl) {
      const response = { message: "This post does not contain a video" };
      return res.status(400).send(response);
    }

    const response = { videoUrl };
    setCache(cache, postId, response);
    return res.status(200).send(response);
  } catch (error) {
    return next(error);
  } finally {
    delete activePostsId[postId];
    await currentPage.close();
  }
});


module.exports = router;
