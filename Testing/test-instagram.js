const { uploadToInstagram } = require('./services/instagram');
const path = require('path');
require('dotenv').config();

async function testUpload() {
  console.log("--- Instagram Upload Test ---");
  const videoFile = "final_1771569416793.mp4"; // Using one of the generated videos
  const videoPath = path.join(process.cwd(), 'output', videoFile);
  const caption = "Testing automated Reels upload with @Oldmoviestamil1.0 #test #coding #automated";

  try {
    console.log(`Starting upload for: ${videoFile}`);
    const result = await uploadToInstagram(videoPath, caption);
    console.log("✅ UPLOAD SUCCESS!");
    console.log("Result Media ID:", result.media_id);
  } catch (err) {
    console.error("❌ UPLOAD FAILED!");
    console.error("Error Message:", err.message);
    if (err.response) {
       console.error("Status:", err.response.statusCode);
       console.error("Body:", err.response.body);
    }
  }
}

testUpload();
