# Instagram Scraper API

Scrape instagram videos with no login required using puppeteer and express.

## Description

This is a powerful Instagram video scraper built using Express.js and Puppeteer. It allows you to extract video URL's from Instagram posts/reels with ease. Whether you want to create a personal video collection or analyze content for research, this tool makes the process straightforward.

## Getting Started

Clone the repository

```bash
git clone https://github.com/riad-azz/instagram-video-scraper.git
```

Install dependencies

```bash
cd instagram-video-scraper && npm install
```

Running the server

```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

- `GET /api/video?url={POST_URL}`: Scrapes the video URL of the specified Instagram Post/Reel URL.

## Example

## Response Example

```json
{
  "videoUrl": "https://scontent.cdninstagram.com/v/t50.2886-16/385047357_643...mp4?...",
}
```

## Request Example

```javascript
const fetch = require('node-fetch');

const postUrl = 'https://www.instagram.com/p/{shortcode}/';
const apiUrl = `http://localhost:3000/api/video?url=${postUrl}`;

fetch(apiUrl)
  .then(response => response.json())
  .then(data => {
    // Handle the scraped data here
    mp4Url = data.videoUrl;
    console.log(mp4Url);
  })
  .catch(error => {
    console.error(error);
  });
```

## License

This Instagram Video Scraper is licensed under the MIT License - see the LICENSE file for details.
