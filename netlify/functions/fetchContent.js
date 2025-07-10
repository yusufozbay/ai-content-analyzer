import fetch from 'node-fetch';

export async function handler(event) {
  const { url } = JSON.parse(event.body || '{}');
  if (!url) {
    return { statusCode: 400, body: 'Missing URL' };
  }
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await response.text();
    return { statusCode: 200, body: html };
  } catch (err) {
    return { statusCode: 500, body: 'Fetch failed: ' + err.message };
  }
}