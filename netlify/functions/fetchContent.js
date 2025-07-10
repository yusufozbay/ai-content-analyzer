// netlify/functions/fetchContent.js

const fetch = require('node-fetch');

exports.handler = async function(event) {
  const { url } = JSON.parse(event.body || '{}');
  if (!url) {
    return { statusCode: 400, body: 'Missing URL' };
  }
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await response.text();
    if (!response.ok) {
      console.error('Fetch failed:', response.status, html);
      return { statusCode: response.status, body: html };
    }
    return { statusCode: 200, body: html };
  } catch (err) {
    console.error('Fetch error:', err);
    return { statusCode: 500, body: 'Fetch failed: ' + err.message };
  }
};