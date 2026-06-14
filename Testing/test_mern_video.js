const { generateScript } = require('./services/script');
const { generateVoice } = require('./services/voice');
const { generateSRT } = require('./services/subtitles');
const { renderVideo } = require('./services/video');
const { uploadToInstagram } = require('./services/instagram');
const path = require('path');
require('dotenv').config();

async function createMernVideo() {
  const topic = "What is MERN Stack?";
  const requestId = `mern_test_${Date.now()}`;
  const language = "English";
  const voice = "en-US-AvaNeural"; // Female voice

  console.log(`\n🚀 Starting MERN Stack Video Generation & Upload Test`);

  try {
    // 1. Script Generation
    console.log('--- Step 1: Generating Script ---');
    const { script, keyword } = await generateScript(topic, language);
    console.log('Keyword:', keyword);

    // 2. Voiceover Generation
    console.log('\n--- Step 2: Generating Female Voiceover ---');
    const { audioPath, wordBoundaries } = await generateVoice(script, `voice_${requestId}`, voice);

    // 3. Subtitles Generation
    console.log('\n--- Step 3: Creating Subtitles ---');
    const srtPath = await generateSRT(wordBoundaries, `subs_${requestId}`);

    // 4. Video Rendering
    console.log('\n--- Step 4: Rendering Final 9:16 Video ---');
    const outputName = `final_mern_${requestId}`;
    const finalVideoPath = await renderVideo(audioPath, srtPath, keyword, outputName);
    console.log('✅ Video Rendering Successful!');

    // 5. Instagram Upload
    console.log('\n--- Step 5: Uploading to Instagram Reels ---');
    const caption = `${topic} Explained in 60 seconds! 🚀 #mernstack #coding #webdevelopment #javascript #tutorial`;
    await uploadToInstagram(finalVideoPath, caption);
    console.log('✅ Everything Complete! Video uploaded with female voice and 9:16 ratio.');

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
  }
}

createMernVideo();
