const cheerio = require('cheerio');
const { CustomError } = require('./errors');

const getPostId = (postUrl) => {
  const postRegex =
    /^https:\/\/(?:www\.)?instagram\.com\/p\/([a-zA-Z0-9_-]+)\/?/;
  const reelRegex =
    /^https:\/\/(?:www\.)?instagram\.com\/reels?\/([a-zA-Z0-9_-]+)\/?/;
  let postId;

  if (!postUrl) {
    throw new CustomError("Post URL is required", 400);
  }

  const postCheck = postUrl.match(postRegex);
  if (postCheck) {
    postId = postCheck.at(-1);
  }

  const reelCheck = postUrl.match(reelRegex);
  if (reelCheck) {
    postId = reelCheck.at(-1);
  }

  if (!postId) {
    throw new CustomError("Invalid URL, post ID not found", 400);
  }

  return postId;
};

const getVideoUrl = (html) => {
  const $ = cheerio.load(html);

  // Check if this post exists
  const isNotFound = $('main > div > div > span').length > 0;
  if (isNotFound) {
    throw new CustomError("This post is private or does not exist", 404);
  }

  // Check if instagram redirected the page to a login page
  const isLoginPage = $('input[name="username"]').length > 0;
  if (isLoginPage) {
    throw new CustomError("Something went wrong, please try again", 500);
  }

  // Get video metadata
  const videoUrl = $("video").attr("src");
  if (!videoUrl) {
    throw new CustomError("This post does not contain a video", 404);
  }

  return videoUrl;
}


module.exports = {
  getPostId,
  getVideoUrl
}