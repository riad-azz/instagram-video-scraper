const cheerio = require('cheerio');
const express = require('express');

const { getPostId } = require('../lib/utils');
const { handleBlockedResources } = require('../lib/scraper');

const router = express.Router();


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
  const { scraper } = req;
  let cachedResponse = await scraper.getCache(postId)
  if (cachedResponse) {
    return res.status(200).json(cachedResponse);
  }

  // Check if this post is already being processed
  if (postId in scraper.activePostsId) {
    cachedResponse = await scraper.waitForCache(postId);
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
    currentPage = await scraper.browser.newPage();
    // Intercept and block certain resource types for better performance
    await currentPage.setRequestInterception(true);
    currentPage.on("request", handleBlockedResources);
    // Load post page
    scraper.addActivePost(postId);
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
    scraper.setCache(postId, response);
    return res.status(200).send(response);
  } catch (error) {
    return next(error);
  } finally {
    scraper.removeActivePost(postId);
    await currentPage.close();
  }
});


module.exports = router;
