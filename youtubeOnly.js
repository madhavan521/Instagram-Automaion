require('dotenv').config();
const { publishYouTubeVideo } = require('./postReel.js');
const fs = require('fs');

const targetFile = process.argv[2];
const caption = process.argv[3] || "Catchup upload #shorts";
const thumbnailPath = process.argv[4]; // Optional 3rd argument

if (!targetFile) {
  console.error("Usage: node youtubeOnly.js <path_to_video> [caption_text] [path_to_thumbnail]");
  process.exit(1);
}

if (!fs.existsSync(targetFile)) {
  console.error(`File not found: ${targetFile}`);
  process.exit(1);
}

console.log(`Starting YouTube-only upload for: ${targetFile}`);
if (thumbnailPath) {
  console.log(`Will also upload custom thumbnail: ${thumbnailPath}`);
}

publishYouTubeVideo(targetFile, caption, thumbnailPath)
  .then(id => {
    if(id) {
       console.log(`✅ Successfully uploaded ${targetFile}! YouTube Video ID: ${id}`);
    }
  })
  .catch(err => {
    console.error("❌ Upload failed:", err.message);
  });
