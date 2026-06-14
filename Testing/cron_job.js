const { generateScript } = require('./services/script');
const { generateVoice } = require('./services/voice');
const { generateSRT } = require('./services/subtitles');
const { renderVideo, generateThumbnail } = require('./services/video');
const { uploadToInstagram, editLatestPostCaption } = require('./services/instagram');
const fs = require('fs-extra');
const path = require('path');
const { Telegram } = require('telegraf');

require('dotenv').config();

const telegram = new Telegram(process.env.TELEGRAM_BOT_TOKEN);
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function notifyUser(message) {
    console.log(message);
    if (CHAT_ID) {
        try { await telegram.sendMessage(CHAT_ID, message); } catch(e) { console.log('Telegram notify error:', e.message); }
    }
}

async function runCron() {
    let requestId = Date.now();
    try {
        await notifyUser("🔄 GitHub Actions Cron Job Started: Fetching next topic from question.json...");
        
        const jsonPath = path.join(__dirname, 'question.json');
        let topics = [];
        try {
            topics = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
        } catch (err) {
            await notifyUser("⚠️ Could not read question.json!");
            process.exit(1);
        }

        // Ensure topics are strictly in order by ID
        topics.sort((a, b) => a.id - b.id);

        // Find the first topic that hasn't been processed
        const topicIndex = topics.findIndex(t => t.process === false || t.process === undefined);
        
        if (topicIndex === -1) {
            await notifyUser("⚠️ No topics found in the queue! All topics processed.");
            process.exit(0);
        }

        const topicData = topics[topicIndex];
        const prompt = topicData.topic;
        
        await notifyUser(`🎯 Selected Topic: "${prompt}"\n\n🚀 Generating script...`);

        // MARK TOPIC AS PROCESSING AND SAVE IT BACK IMMEDIATELY
        topics[topicIndex].process = true;
        await fs.writeFile(jsonPath, JSON.stringify(topics, null, 2));

        const langConfig = { name: 'English', voice: 'en-US-AvaNeural' };
        
        const { script, keyword, caption, hashtags } = await generateScript(prompt, langConfig.name);
        await notifyUser(`🎙 Generating neural voiceover...`);
        
        const { audioPath, wordBoundaries } = await generateVoice(script, `voice_${requestId}`, langConfig.voice);
        await notifyUser('📝 Creating subtitles and syncing audio...');
        
        const srtPath = await generateSRT(wordBoundaries, `subs_${requestId}`);
        
        await notifyUser('🎬 Rendering video in GitHub Actions (serverless)...');
        const finalVideoPath = await renderVideo(audioPath, srtPath, keyword, `final_${requestId}`);
        
        let thumbnailPath = null;
        try {
            thumbnailPath = await generateThumbnail(finalVideoPath, prompt, `thumb_${requestId}`);
            if (CHAT_ID && thumbnailPath && fs.existsSync(thumbnailPath)) {
                await telegram.sendPhoto(CHAT_ID, { source: thumbnailPath }, { caption: `Video generated! Topic: ${prompt}. Now uploading...` });
            }
        } catch (err) {
            console.error("Thumbnail failed:", err);
        }

        if (process.env.IG_ACCESS_TOKEN && process.env.IG_USER_ID) {
            const fullCaption = `${caption || prompt}\n\n${(hashtags || []).join(' ')}`;
            await notifyUser('📸 Uploading to Instagram Reels directly from GitHub Actions...');
            await uploadToInstagram(finalVideoPath, fullCaption, thumbnailPath);
            await notifyUser('🔄 Verifying and editing caption for reliability...');
            await editLatestPostCaption(fullCaption);
            await notifyUser(`✅ Successfully posted on Instagram!\nTopic: ${prompt}`);
        } else {
            await notifyUser('⚠️ Skipping Instagram upload: IG_ACCESS_TOKEN not set.');
        }

    } catch (error) {
        await notifyUser(`❌ Error in Cron Job: ${error.message}`);
        console.error(error);
        process.exit(1);
    } finally {
        // Cleanup temp files
        const filesToDelete = [
            path.join(process.cwd(), 'temp', `voice_${requestId}.mp3`),
            path.join(process.cwd(), 'temp', `synced_voice_${requestId}.mp3`),
            path.join(process.cwd(), 'temp', `subs_${requestId}.srt`),
            path.join(process.cwd(), 'output', `thumb_${requestId}.jpg`),
            path.join(process.cwd(), 'output', `final_${requestId}.mp4`)
        ];
        
        for (const file of filesToDelete) {
            try { if (await fs.pathExists(file)) await fs.remove(file); } catch (e) {}
        }
        process.exit(0);
    }
}

runCron();
