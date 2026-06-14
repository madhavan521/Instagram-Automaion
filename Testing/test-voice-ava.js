const { generateVoice } = require('./services/voice');
const path = require('path');
const fs = require('fs-extra');

async function testVoice() {
    const voiceName = "en-US-AvaNeural";
    const text = "Hi, I'm Ava! I will be your new voice for these MERN stack tutorials. I'm designed to sound more natural and engaging for your viral reels. Let's build something amazing together!";
    const requestId = `voice_test_${Date.now()}`;
    
    console.log(`--- Testing Voice: ${voiceName} ---`);
    
    try {
        const { audioPath } = await generateVoice(text, requestId, voiceName);
        console.log(`✅ Voice generated successfully!`);
        console.log(`Audio File: ${audioPath}`);
    } catch (err) {
        console.error(`❌ Voice generation failed:`, err.message);
    }
}

testVoice();
