const express = require('express');
const asyncHandler = require('express-async-handler')

const { getPostId, getVideoUrl } = require('../lib/utils');
const { handleBlockedResources } = require('../lib/scraper');

const router = express.Router();

router.get('/video', asyncHandler(async (req, res, next) => {
  const inputUrl = req.query.url;
  const { scraper } = req;

  const postId = getPostId(inputUrl);


  // Check if cached response exists
  const cachedResponse = await scraper.isAlreadyProcessed(postId)
  if (cachedResponse) {
    return res.status(200).json(cachedResponse);
  }

  // Scrape post webpage
  let html;
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
    html = await currentPage.content();
  } catch (error) {
    return next(error);
  } finally {
    scraper.removeActivePost(postId);
    await currentPage.close();
  }

  // Parse page HTML
  const videoUrl = getVideoUrl(html);

  const response = { videoUrl };
  scraper.setCache(postId, response);
  return res.status(200).send(response);

}));


module.exports = router;
