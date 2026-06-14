const { Telegraf } = require('telegraf');
const { generateScript } = require('./services/script');
const { generateVoice } = require('./services/voice');
const { generateSRT } = require('./services/subtitles');
const { renderVideo, generateThumbnail } = require('./services/video');
const { uploadToInstagram, editLatestPostCaption } = require('./services/instagram');
const fs = require('fs-extra');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
require('dotenv').config();

console.log('Bot is starting with token:', !!process.env.TELEGRAM_BOT_TOKEN);

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || 'DUMMY_TOKEN', { handlerTimeout: 9000000 });

// Language and Voice Mapping
const LANGUAGES = {
  'english': { name: 'English', voice: 'en-US-AvaNeural' }, // Female (Ava)
  'tamil': { name: 'Tamil', voice: 'ta-IN-PallaviNeural' }   // Female (Pallavi)
};

let userSettings = {
  language: 'english'
};

bot.start((ctx) => ctx.reply('Welcome! I will generate viral MERN stack tutorials for you.\n\nJust send me a topic, like "how to use react hooks" or "mongoDB connectivity".\n\nCommands:\n/lang [language] - Change language (e.g., /lang tamil)'));

bot.command('lang', async (ctx) => {
  const lang = ctx.message.text.split(' ')[1]?.toLowerCase();
  if (lang && LANGUAGES[lang]) {
    userSettings.language = lang;
    ctx.reply(`✅ Language set to: ${LANGUAGES[lang].name}`);
  } else {
    ctx.reply(`Available languages: english, tamil`);
  }
});

bot.on('text', async (ctx) => {
  const prompt = ctx.message.text;
  const chatId = ctx.chat.id;
  const requestId = Date.now();

  try {
    const langConfig = LANGUAGES[userSettings.language];
    await ctx.reply(`🚀 Generating script in ${langConfig.name}...`);
    const { script, keyword } = await generateScript(prompt, langConfig.name);
    
    await ctx.reply(`🎙 Generating neural voiceover (${langConfig.name})...`);
    const { audioPath, wordBoundaries } = await generateVoice(script, `voice_${requestId}`, langConfig.voice);
    
    await ctx.reply('📝 Creating subtitles and syncing audio...');
    // Get actual duration to sync subtitles
    const audioDuration = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(audioPath, (err, metadata) => {
        if (err) return reject(err);
        resolve(metadata.format.duration);
      });
    });

    const srtPath = await generateSRT(wordBoundaries, `subs_${requestId}`);
    
    await ctx.reply('🎬 Rendering video (this may take a minute)...');
    console.log(`Starting video render for request ${requestId}...`);
    // Use the original natural audio path for rendering
    const finalVideoPath = await renderVideo(audioPath, srtPath, keyword, `final_${requestId}`);
    console.log(`Video render complete: ${finalVideoPath}`);
    
    // GENERATE THUMBNAIL BEFORE REPLYING
    let thumbnailPath = null;
    try {
      console.log('🖼 Generating thumbnail with topic...');
      thumbnailPath = await generateThumbnail(finalVideoPath, prompt, `thumb_${requestId}`);
    } catch (err) {
      console.error('Thumbnail generation failed:', err.message);
    }

    // REPLY WITH THUMBNAIL INSTEAD OF VIDEO (as requested)
    if (thumbnailPath && fs.existsSync(thumbnailPath)) {
      await ctx.replyWithPhoto({ source: thumbnailPath }, { caption: `Video generated! Topic: ${prompt}. Now uploading...` });
    } else {
      await ctx.reply('🎬 Video generated! Now uploading to Instagram...');
    }
    
    console.log(`Thumbnail sent to user for request ${requestId}`);

    // Automatic Instagram Upload
    if (process.env.IG_USERNAME && process.env.IG_USERNAME !== 'your_ig_username') {
      try {
        const fullCaption = `${prompt} #coding #developer #mern #tutorial`;
        console.log('📸 Uploading to Instagram Reels...');
        await uploadToInstagram(finalVideoPath, fullCaption, thumbnailPath);
        
        // NEW: Edit caption after upload for extra reliability
        console.log('🔄 Performing post-upload caption verification/edit...');
        await ctx.reply('🔄 Verifying and editing caption for reliability...');
        await editLatestPostCaption(fullCaption);

        await ctx.reply('✅ Successfully posted and verified on Instagram!');
      } catch (igError) {
        console.error('Instagram Upload Error:', igError.message);
        await ctx.reply(`⚠️ Instagram process encountered an issue: ${igError.message}`);
      }
    } else {
      console.log('Skipping Instagram upload: Credentials not set.');
    }
    
    // Cleanup
    // await fs.remove(path.join(process.cwd(), 'temp'));
  } catch (error) {
    console.error(error);
    ctx.reply(`❌ Error: ${error.message}`);
  } finally {
    // Local Cleanup of component files
    console.log(`--- Cleaning up components for request ${requestId} ---`);
    const filesToDelete = [
      path.join(process.cwd(), 'temp', `voice_${requestId}.mp3`),
      path.join(process.cwd(), 'temp', `synced_voice_${requestId}.mp3`),
      path.join(process.cwd(), 'temp', `subs_${requestId}.srt`),
      path.join(process.cwd(), 'output', `thumb_${requestId}.jpg`)
    ];
    
    for (const file of filesToDelete) {
      try {
        if (await fs.pathExists(file)) {
          await fs.remove(file);
          console.log(`Deleted temp file: ${file}`);
        }
      } catch (e) {
        console.error(`Failed to delete ${file}:`, e.message);
      }
    }
  }
});

// --- Keep-Alive and Error Handling ---
// This ensures the bot process doesn't exit even if the event loop is momentarily idle
setInterval(() => {}, 1000 * 60 * 60);

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('exit', (code) => {
  console.log(`⚠️ Bot process is exiting with code: ${code}`);
});

bot.launch().then(() => {
  console.log('Bot is running...');
}).catch((err) => {
  console.error('Bot failed to launch:', err);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
