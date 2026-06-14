const { renderVideo } = require('./services/video');
const path = require('path');
const fs = require('fs-extra');

async function testIntegration() {
    const audioPath = path.join(__dirname, 'temp', 'voice_1771567605660.mp3');
    const srtPath = path.join(__dirname, 'temp', 'subs_1771567605660.srt');
    const outputName = 'test_integrated_video';

    console.log('--- Testing Integrated Video Service ---');
    try {
        const finalPath = await renderVideo(audioPath, srtPath, 'programming', outputName);
        console.log('Integrated test successful. Video saved at:', finalPath);
    } catch (err) {
        console.error('Integration test failed:', err.message);
    }
}

testIntegration();
