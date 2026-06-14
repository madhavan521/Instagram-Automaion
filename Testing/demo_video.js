const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs-extra');

async function createDemoVideo() {
    const videoPath = path.join(__dirname, 'assets', 'video', 'Video_Tutorial_With_Different_Angles.mp4');
    const audioPath = path.join(__dirname, 'temp', 'voice_1771567605660.mp3');
    const srtPath = path.join(__dirname, 'temp', 'subs_1771567605660.srt');
    const outputPath = path.join(__dirname, 'output', 'demo_video.mp4');

    if (!fs.existsSync(videoPath)) {
        console.error('Video file not found:', videoPath);
        return;
    }
    if (!fs.existsSync(audioPath)) {
        console.error('Audio file not found:', audioPath);
        return;
    }
    if (!fs.existsSync(srtPath)) {
        console.error('SRT file not found:', srtPath);
        return;
    }

    console.log('--- Creating Demo Video ---');
    console.log('Video:', videoPath);
    console.log('Audio:', audioPath);
    console.log('Subtitles:', srtPath);

    const relativeSrtPath = path.relative(process.cwd(), srtPath).replace(/\\/g, '/');
    
    // Subtitle styling: 
    // PrimaryColour=&HFFFFFF (White)
    // OutlineColour=&H000000 (Black)
    // MarginV=200 (Slightly higher than 140)
    const subFilter = `subtitles=filename='${relativeSrtPath}':force_style='FontSize=24,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,BorderStyle=1,Outline=1,Alignment=2,MarginV=60,MarginL=60,MarginR=60'`;

    ffmpeg()
        .input(videoPath)
        .inputOptions(['-stream_loop -1']) // Loop video if it's shorter than audio
        .input(audioPath)
        .complexFilter([
            {
                filter: 'scale',
                options: { w: 1080, h: 1920, force_original_aspect_ratio: 'increase' },
                inputs: '0:v',
                outputs: 'scaled'
            },
            {
                filter: 'crop',
                options: { w: 1080, h: 1920 },
                inputs: 'scaled',
                outputs: 'cropped'
            },
            {
                filter: 'subtitles',
                options: {
                    filename: relativeSrtPath,
                    force_style: 'FontSize=24,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,BorderStyle=1,Outline=1,Alignment=2,MarginV=60,MarginL=60,MarginR=60'
                },
                inputs: 'cropped',
                outputs: 'outv'
            }
        ])
        .outputOptions([
            '-map [outv]',
            '-map 1:a',
            '-c:v libx264',
            '-preset fast',
            '-pix_fmt yuv420p',
            '-c:a aac',
            '-b:a 128k',
            '-shortest'
        ])
        .on('start', (cmd) => console.log('FFmpeg command:', cmd))
        .on('end', () => console.log('Demo video created at:', outputPath))
        .on('error', (err) => console.error('FFmpeg error:', err.message))
        .save(outputPath);
}

createDemoVideo();
