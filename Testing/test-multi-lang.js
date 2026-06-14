const { generateScript } = require('./services/script');
const { generateVoice } = require('./services/voice');
const { renderVideo } = require('./services/video');
const { generateSRT } = require('./services/subtitles');
const path = require('path');
require('dotenv').config();

async function testTamilVideo() {
    console.log("--- Testing Tamil Video Generation ---");
    const prompt = "explain what is react props";
    const language = "Tamil";
    const voice = "ta-IN-ValluvarNeural";
    const requestId = `test_ta_${Date.now()}`;

    try {
        console.log("1. Generating Tamil Script...");
        const { script, keyword } = await generateScript(prompt, language);
        console.log("Script:", script);
        console.log("Keyword:", keyword);

        console.log("2. Generating Tamil Voice...");
        const { audioPath, wordBoundaries } = await generateVoice(script, `voice_${requestId}`, voice);
        
        console.log("3. Creating Subtitles...");
        const srtPath = await generateSRT(wordBoundaries, `subs_${requestId}`);

        console.log("4. Rendering Video...");
        const finalVideoPath = await renderVideo(audioPath, srtPath, keyword, `final_${requestId}`);
        console.log("✅ Video complete:", finalVideoPath);

    } catch (err) {
        console.error("❌ Test failed:", err.message);
    }
}

testTamilVideo();
