const { generateScript } = require('./services/script');
const { generateVoice } = require('./services/voice');
const { generateSRT } = require('./services/subtitles');
const { renderVideo } = require('./services/video');
const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();

async function testFullFlow() {
  const topic = "How to use useEffect hook in React";
  const requestId = `test_full_${Date.now()}`;
  const language = "English";
  const voice = "en-US-AvaNeural"; // Female voice

  console.log(`\n🚀 Starting Full Flow Test for: "${topic}"`);

  try {
    // 1. Script Generation
    console.log('--- Step 1: Generating Script ---');
    const { script, keyword } = await generateScript(topic, language);
    console.log('Script Length:', script.length);
    console.log('Keyword:', keyword);
    console.log('Full Script excerpt:', script.substring(0, 100) + '...');

    // 2. Voiceover Generation
    console.log('\n--- Step 2: Generating Neural Voiceover ---');
    const { audioPath, wordBoundaries } = await generateVoice(script, `voice_${requestId}`, voice);
    console.log('Audio Path:', audioPath);
    console.log('Word Boundaries count:', wordBoundaries.length);

    // 3. Subtitles Generation
    console.log('\n--- Step 3: Creating Subtitles ---');
    const srtPath = await generateSRT(wordBoundaries, `subs_${requestId}`);
    console.log('SRT Path:', srtPath);

    // 4. Video Rendering
    console.log('\n--- Step 4: Rendering Final 54s Video ---');
    const outputName = `final_test_${requestId}`;
    const finalVideoPath = await renderVideo(audioPath, srtPath, keyword, outputName);
    console.log('✅ Full Flow Successful!');
    console.log('Final Video Path:', finalVideoPath);

    ffmpeg.ffprobe(finalVideoPath, (err, metadata) => {
        if (!err) {
            console.log('Final Video Duration:', metadata.format.duration, 'seconds');
        }
    });

  } catch (error) {
    console.error('\n❌ Full Flow Test Failed:', error);
  }

  // --- KEEP ALIVE LOGIC ---
  console.log('\n🚀 Bot is staying ALIVE until manually closed.');
  console.log('Press Ctrl + C to terminate the process.');
  
  // This keeps the event loop active indefinitely
  setInterval(() => {}, 1000 * 60); 
}

testFullFlow();
