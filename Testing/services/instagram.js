const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

/**
 * Uploads a local file to Catbox.moe to get a public URL for Meta
 */
async function uploadToFileHost(localFilePath) {
    try {
        console.log(`[Upload] Uploading ${localFilePath} to Catbox for public URL...`);
        const form = new FormData();
        form.append("reqtype", "fileupload");
        form.append("fileToUpload", fs.createReadStream(localFilePath));

        const response = await axios.post("https://catbox.moe/user/api.php", form, {
            headers: form.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });

        const publicUrl = response.data;
        if (!publicUrl || !publicUrl.startsWith('http')) {
             throw new Error("Invalid URL returned from Catbox");
        }
        console.log(`[Upload] Success! Public URL: ${publicUrl}`);
        return publicUrl;
    } catch (error) {
        console.error("[Upload] Failed to upload to Catbox:", error.message);
        throw error;
    }
}

/**
 * Uploads a video to Instagram as a Reel using the Meta Graph API.
 * @param {string} videoPath - Absolute path to the MP4 file.
 * @param {string} caption - The caption for the post.
 * @param {string} thumbnailPath - Optional path to a thumbnail image.
 * @returns {Promise<boolean>} - Success status.
 */
async function uploadToInstagram(videoPath, caption, thumbnailPath) {
    console.log("--- Starting API Instagram Upload ---");
    const ACCESS_TOKEN = (process.env.IG_ACCESS_TOKEN || '').trim();
    const IG_USER_ID = (process.env.IG_USER_ID || '').trim();

    if (!ACCESS_TOKEN || !IG_USER_ID) {
        throw new Error("Missing IG_ACCESS_TOKEN or IG_USER_ID in .env");
    }

    try {
        // 1. Get a public URL for the video
        const publicUrl = await uploadToFileHost(videoPath);
        console.log(`[IG] Public Video URL ready: ${publicUrl}`);
        
        const payload = {
            media_type: "REELS",
            video_url: publicUrl,
            caption: caption,
            access_token: ACCESS_TOKEN,
        };
        
        // 2. If thumbnail is provided, upload it to Catbox and pass it to Meta
        if (thumbnailPath && fs.existsSync(thumbnailPath)) {
            console.log("Uploading thumbnail to Catbox...");
            const thumbUrl = await uploadToFileHost(thumbnailPath);
            console.log(`[IG] Public Thumbnail URL ready: ${thumbUrl}`);
            payload.cover_url = thumbUrl;
        }

        // 3. Create the container on Instagram
        console.log(`[IG] Creating Reel container...`);
        const container = await axios.post(
            `https://graph.facebook.com/v25.0/${IG_USER_ID}/media`,
            payload
        );

        const creationId = container.data.id;
        console.log(`[IG] Container ID: ${creationId}. Waiting 60s for Meta processing...`);

        // 4. Wait for processing
        await new Promise(r => setTimeout(r, 60000));

        // 5. Publish the Reel
        console.log("[IG] Publishing reel...");
        const publish = await axios.post(
            `https://graph.facebook.com/v25.0/${IG_USER_ID}/media_publish`,
            {
                creation_id: creationId,
                access_token: ACCESS_TOKEN,
            }
        );
        console.log(`✅ [Success] Reel published with ID: ${publish.data.id}`);
        return true;

    } catch (error) {
        console.error("❌ API Upload Error:", error.response?.data || error.message);
        throw error;
    }
}

/**
 * Navigates to the user's profile and edits the latest post's caption.
 * (Deprecated in API flow - caption is set cleanly at upload).
 */
async function editLatestPostCaption(caption) {
    console.log("Caption editing is not supported via Graph API directly without Media ID, but your caption is already set during upload!");
    return true;
}

module.exports = { uploadToInstagram, editLatestPostCaption };
