// netlify/functions/fetchContent.js

const fetch = require('node-fetch');

exports.handler = async function(event) {
  const { url } = JSON.parse(event.body || '{}');
  if (!url) {
    return { statusCode: 400, body: 'Missing URL' };
  }
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
      }
    });
    const html = await response.text();
    if (!response.ok) {
      console.error('Fetch failed:', response.status, html.slice(0, 500));
      return { statusCode: response.status, body: html };
    }
    return { statusCode: 200, body: html };
  } catch (err) {
    console.error('Fetch error:', err);
    return { statusCode: 500, body: 'Fetch failed: ' + err.message };
  }
};