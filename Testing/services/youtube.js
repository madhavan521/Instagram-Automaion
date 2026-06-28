const { google } = require('googleapis');
const fs = require('fs');

async function publishYouTubeVideo(localFilePath, caption, thumbnailPath = null, youtubeTitle = null) {
  try {
    const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
    const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
    const YOUTUBE_REFRESH_TOKEN = process.env.YOUTUBE_REFRESH_TOKEN;

    if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET || !YOUTUBE_REFRESH_TOKEN) {
      console.log("[YT] Missing YouTube credentials. Skipping YouTube upload.");
      return null;
    }

    console.log(`[YT] Uploading ${localFilePath} to YouTube...`);
    const oauth2Client = new google.auth.OAuth2(YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET);
    oauth2Client.setCredentials({ refresh_token: YOUTUBE_REFRESH_TOKEN });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    // Use the provided youtubeTitle, fallback to caption parsing if missing
    let title = youtubeTitle || (caption ? caption.split('\n')[0].substring(0, 50) : "Automated Upload");
    if (!title.toLowerCase().includes('#shorts')) {
      title += " #shorts";
    }

    const res = await youtube.videos.insert({
      part: 'snippet,status',
      requestBody: {
        snippet: {
          title: title,
          description: caption,
          tags: ['shorts', 'automation'],
        },
        status: {
          privacyStatus: 'public', // Set to public
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: fs.createReadStream(localFilePath),
      },
    });

    console.log(`[YT] Success! YouTube Video ID: ${res.data.id}`);

    // Set custom thumbnail if provided
    if (thumbnailPath && fs.existsSync(thumbnailPath)) {
      try {
        console.log(`[YT] Uploading custom thumbnail from ${thumbnailPath}...`);
        await youtube.thumbnails.set({
          videoId: res.data.id,
          media: {
            body: fs.createReadStream(thumbnailPath),
          },
        });
        console.log(`[YT] Custom thumbnail set successfully!`);
      } catch (thumbErr) {
        console.error(`[YT] Warning: Failed to set custom thumbnail:`, thumbErr.message);
      }
    }

    return res.data.id;
  } catch (err) {
    console.error("[YT] Failed to upload to YouTube:", err.message);
    throw err;
  }
}

module.exports = { publishYouTubeVideo };
