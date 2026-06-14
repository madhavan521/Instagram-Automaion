const { renderVideo } = require('./services/video');
const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();

async function testCleanup() {
    console.log("--- Testing Automatic Cleanup ---");
    
    // We'll use existing files from previous runs
    const audioPath = path.join(process.cwd(), 'temp', 'voice_1771569416793.mp3');
    const srtPath = path.join(process.cwd(), 'temp', 'subs_1771569416793.srt');
    
    if (!fs.existsSync(audioPath) || !fs.existsSync(srtPath)) {
        console.error("Required test files not found.");
        return;
    }

    const keyword = "javascript coding";
    const outputName = `cleanup_test_${Date.now()}`;

    try {
        console.log("Starting render. Watch for image downloads followed by cleanup...");
        const resultPath = await renderVideo(audioPath, srtPath, keyword, outputName);
        console.log("✅ Render complete:", resultPath);
        
        // Wait a second for FS to update
        await new Promise(r => setTimeout(r, 1000));
        
        // Check temp directory for any remaining bg_img files
        const files = await fs.readdir(path.join(process.cwd(), 'temp'));
        const remainingImages = files.filter(f => f.startsWith('bg_img_') || f.startsWith('bg_fallback_'));
        
        if (remainingImages.length === 0) {
            console.log("✅ SUCCESS: All temporary images were deleted.");
        } else {
            console.log("❌ FAILURE: Some temporary images remain:", remainingImages);
        }
    } catch (err) {
        console.error("❌ Rendering failed:", err.message);
    }
}

testCleanup();
