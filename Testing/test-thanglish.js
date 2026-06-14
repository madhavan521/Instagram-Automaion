const { generateScript } = require('./services/script');
const { generateVoice } = require('./services/voice');
const { renderVideo } = require('./services/video');
const { generateSRT } = require('./services/subtitles');
const path = require('path');
require('dotenv').config();

async function testThanglish() {
    console.log("--- Testing Thanglish Video Generation ---");
    const prompt = "explain what is useEffect in React";
    const language = "Thanglish"; // This maps to the prompt modification I made
    const voice = "ta-IN-ValluvarNeural";
    const requestId = `test_thanglish_${Date.now()}`;

    try {
        console.log("1. Generating Thanglish Script...");
        const { script, keyword } = await generateScript(prompt, language);
        console.log("Script:", script);
        console.log("Keyword:", keyword);

        console.log("2. Generating Voice...");
        const { audioPath, wordBoundaries } = await generateVoice(script, `voice_${requestId}`, voice);
        
        console.log("3. Creating Subtitles...");
        const srtPath = await generateSRT(wordBoundaries, `subs_${requestId}`);

        console.log("4. Rendering Video...");
        const finalVideoPath = await renderVideo(audioPath, srtPath, keyword, `final_${requestId}`);
        console.log("✅ Thanglish Video complete:", finalVideoPath);

    } catch (err) {
        console.error("❌ Test failed:", err.message);
    }
}

testThanglish();
