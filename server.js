require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const querystring = require('querystring');
const cors = require('cors');

const app = express();
app.use(cors());

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:8888/callback';
const FRONTEND_URI = process.env.FRONTEND_URI || 'http://localhost:5500';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.warn('Warning: CLIENT_ID and CLIENT_SECRET are not set. Copy .env.example to .env and fill values.');
}

app.get('/login', (req, res) => {
  const scope = 'streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state';
  const params = querystring.stringify({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope,
    redirect_uri: REDIRECT_URI
  });
  res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  if (!code) return res.status(400).send('Missing code');

  const tokenUrl = 'https://accounts.spotify.com/api/token';
  const body = querystring.stringify({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET
  });

  try {
    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    const tokenData = await tokenRes.json();

    // Redirect to front-end with tokens in fragment (not query) for client-side usage
    const redirectTo = `${FRONTEND_URI}#access_token=${tokenData.access_token}&refresh_token=${tokenData.refresh_token}&expires_in=${tokenData.expires_in}`;
    res.redirect(redirectTo);
  } catch (err) {
    console.error(err);
    res.status(500).send('Token exchange failed');
  }
});

// optional refresh endpoint
app.get('/refresh_token', async (req, res) => {
  const refresh_token = req.query.refresh_token;
  const tokenUrl = 'https://accounts.spotify.com/api/token';
  const body = querystring.stringify({ grant_type: 'refresh_token', refresh_token, client_id: CLIENT_ID, client_secret: CLIENT_SECRET });
  try {
    const tokenRes = await fetch(tokenUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    const tokenData = await tokenRes.json();
    res.json(tokenData);
  } catch (err) {
    console.error(err);
    res.status(500).send('Refresh failed');
  }
});

// YouTube search proxy (uses server-side API key so key is not exposed to client)
app.get('/youtube-search', async (req, res) => {
  const q = req.query.q;
  const key = process.env.YT_API_KEY;
  if (!q) return res.status(400).json({ error: 'missing q' });
  if (!key) return res.status(500).json({ error: 'YT_API_KEY not configured on server' });
  const endpoint = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${encodeURIComponent(q)}&key=${encodeURIComponent(key)}`;
  try {
    const r = await fetch(endpoint);
    if (!r.ok) return res.status(r.status).send(await r.text());
    const data = await r.json();
    if (!data.items || data.items.length === 0) return res.json({ items: [] });
    const item = data.items[0];
    res.json({ videoId: item.id.videoId, snippet: item.snippet });
  } catch (err) {
    console.error('youtube-search error', err);
    res.status(500).json({ error: 'youtube search failed' });
  }
});

const PORT = process.env.PORT || 8888;
app.listen(PORT, () => console.log(`Auth server listening on ${PORT}`));
