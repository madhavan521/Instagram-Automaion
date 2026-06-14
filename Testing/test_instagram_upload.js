const { uploadToInstagram } = require('./services/instagram');
const path = require('path');
require('dotenv').config();

async function testInstagramUpload() {
  // Use the latest successfully rendered MERN video
  const videoPath = path.join(process.cwd(), 'output', 'final_mern_mern_test_1771925346334.mp4'); 
  const caption = "What is the MERN Stack? 🚀 #mernstack #coding #webdevelopment #tutorial";

  console.log('--- Starting Instagram Upload Test ---');
  console.log(`Video: ${videoPath}`);

  try {
    const success = await uploadToInstagram(videoPath, caption);
    if (success) {
      console.log('✅ Instagram Upload Test SUCCESSFUL!');
    } else {
      console.log('❌ Instagram Upload Test FAILED (returned false).');
    }
  } catch (error) {
    console.error('❌ Instagram Upload Test FAILED with error:', error.message);
    console.log('Check temp folder for debug screenshots if available.');
  }

  // --- KEEP ALIVE LOGIC ---
  console.log('\n🚀 Bot is staying ALIVE until manually closed.');
  console.log('Press Ctrl + C to terminate the process.');
  
  // This keeps the event loop active indefinitely
  setInterval(() => {}, 1000 * 60); 
}

testInstagramUpload();
