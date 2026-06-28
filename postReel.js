require('dotenv').config();
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const { google } = require("googleapis");

// Best practice: Use GitHub Secrets and access them via process.env
// For example: process.env.ACCESS_TOKEN
const ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN || "EAAai7FgW0BoBRit5vZCTvFalJG0ZBkz3Ldxs9IJDciT9PSZAehXm3ZB7dU3rV73L5WdFwCI9kob1IRodghLH8W75wwVhdmEfuUSiFVJ5G5nSmpp8KzCTczjHWfpy7ywzvl1q3hKiIV81HIUYTgHPdxZAUFkgf5EYNCZCxPRvN9mei0zpvwKx6FWa5GY4TDdq3gO4CyEYMLVCDGqOfEnSkjLogZBJb2YZAg7WjiWLaJ92sxElJeFGHJmntxkYYp2ekjwyqYBUc38kJvZC2nqhTD66kaqxr";
const IG_USER_ID = process.env.IG_USER_ID || "17841475355433500";

/**
 * Uploads a local file to Catbox.moe to get a public URL for Meta
 */
async function uploadToCatbox(localFilePath) {
  try {
    console.log(`[Upload] Uploading ${localFilePath} to Catbox for public URL...`);
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", fs.createReadStream(localFilePath));

    const response = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: form.getHeaders(),
    });

    const publicUrl = response.data;
    console.log(`[Upload] Success! Public URL: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error("[Upload] Failed to upload to Catbox:", error.message);
    throw error;
  }
}

/**
 * Publishes the video to Instagram using the public URL
 */
async function publishInstagramReel(publicVideoUrl, caption) {
  try {
    console.log(`[IG] Creating container for ${publicVideoUrl}...`);
    const container = await axios.post(
      `https://graph.facebook.com/v25.0/${IG_USER_ID}/media`,
      {
        media_type: "REELS",
        video_url: publicVideoUrl,
        caption: caption,
        access_token: ACCESS_TOKEN,
      }
    );

    const creationId = container.data.id;
    console.log(`[IG] Container ID: ${creationId}. Waiting 60s for Meta processing...`);

    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          console.log("[IG] Publishing reel...");
          const publish = await axios.post(
            `https://graph.facebook.com/v25.0/${IG_USER_ID}/media_publish`,
            {
              creation_id: creationId,
              access_token: ACCESS_TOKEN,
            }
          );
          resolve(publish.data.id);
        } catch (err) {
          reject(err);
        }
      }, 60000);
    });
  } catch (err) {
    throw err;
  }
}

/**
 * Publishes the video to YouTube
 */
async function publishYouTubeVideo(localFilePath, caption, thumbnailPath = null) {
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

    // Use the first 50 chars of caption as title, or a default
    let title = caption ? caption.split('\n')[0].substring(0, 50) : "Automated Upload";
    if (caption && caption.includes('#shorts') && !title.includes('#shorts')) {
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
          privacyStatus: 'public', // Set to public as requested
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

/**
 * Main execution function
 */
async function processAndUpload(localFilePath, caption) {
  try {
    // 1. Upload local file to a public URL (Catbox)
    const publicUrl = await uploadToCatbox(localFilePath);

    // 2. Publish to Instagram
    const reelId = await publishInstagramReel(publicUrl, caption);
    console.log(`[Success] Reel published with ID: ${reelId}`);

    // 3. Publish to YouTube
    const ytId = await publishYouTubeVideo(localFilePath, caption);
    if (ytId) {
      console.log(`[Success] YouTube video published with ID: ${ytId}`);
    }

  } catch (error) {
    console.error("[Error] Process failed:", error.response?.data || error.message);
  } finally {
    // 3. CLEANUP - Delete the local temp file, whether it succeeded or failed!
    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
        console.log(`[Cleanup] Deleted local temporary file: ${localFilePath}`);
      } catch (cleanupErr) {
        console.error(`[Cleanup] Failed to delete file ${localFilePath}:`, cleanupErr.message);
      }
    } else {
      console.log(`[Cleanup] File ${localFilePath} not found, nothing to delete.`);
    }
  }
}

// ==== HOW TO USE ====
// If running from GitHub Actions, you can pass arguments to the script
// e.g. `node postReel.js "temp/downloaded_video.mp4" "My awesome caption"`

const targetFile = process.argv[2]; 
const caption = process.argv[3] || "Automated upload via GitHub Actions!";

if (require.main === module) {
  if (!targetFile) {
    console.error("Usage: node postReel.js <path_to_video> <caption_text>");
    process.exit(1);
  }
  processAndUpload(targetFile, caption);
}

module.exports = { processAndUpload, uploadToCatbox, publishInstagramReel, publishYouTubeVideo };
