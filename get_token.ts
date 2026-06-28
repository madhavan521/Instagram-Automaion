import { google } from 'googleapis';
import * as http from 'http';
import * as url from 'url';

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID || 'YOUR_CLIENT_ID';
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const scopes = [
  'https://www.googleapis.com/auth/youtube.upload'
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent' // Forces consent screen so a refresh token is always returned
});

console.log('Please open this URL in your browser:');
console.log(authUrl);

const server = http.createServer(async (req, res) => {
  try {
    if (req.url && req.url.startsWith('/oauth2callback')) {
      const qs = new url.URL(req.url, 'http://localhost:3000').searchParams;
      const code = qs.get('code');
      if (code) {
        res.end('Authentication successful! You can close this window.');
        server.close();
        
        const { tokens } = await oauth2Client.getToken(code);
        console.log('\n' + '='.repeat(50));
        console.log('SUCCESS! Here is your Refresh Token:');
        console.log('='.repeat(50));
        console.log(`\n${tokens.refresh_token}\n`);
        console.log('='.repeat(50));
        console.log('Copy the above token and add it to your .env file as:');
        console.log(`YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`);
        console.log(`YOUTUBE_CLIENT_ID=${CLIENT_ID}`);
        console.log(`YOUTUBE_CLIENT_SECRET=${CLIENT_SECRET}`);
        process.exit(0);
      } else {
        res.end('Authentication failed! No code received.');
        server.close();
        process.exit(1);
      }
    }
  } catch (e) {
    console.error('Error during token exchange:', e);
  }
}).listen(3000, () => {
  console.log('Listening on http://localhost:3000/ ...');
});
