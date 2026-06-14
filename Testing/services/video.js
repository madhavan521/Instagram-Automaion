const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');

/**
 * Renders the final video.
 * @param {string} audioPath - Path to the voiceover mp3.
 * @param {string} srtPath - Path to the subtitles srt.
 * @param {string} backgroundSource - Path to background media OR a keyword.
 * @param {string} outputName - Final file name.
 * @returns {Promise<string>} - Path to the final MP4.
 */
async function renderVideo(audioPath, srtPath, backgroundSource, outputName) {
  console.log(`--- Starting Video Render: ${outputName} ---`);
  console.log(`Audio: ${audioPath}`);
  console.log(`Subtitles: ${srtPath}`);
  console.log(`Background Source: ${backgroundSource}`);

  // Use relative path for output to avoid Windows drive letter issues in some FFmpeg builds
  const relativeOutputPath = path.join('output', `${outputName}.mp4`);
  const absoluteOutputPath = path.join(process.cwd(), relativeOutputPath);
  await fs.ensureDir(path.dirname(absoluteOutputPath));

  let selectedBgs = [];
  let downloadedFiles = [];
  const tempDir = path.join(process.cwd(), 'temp');
  await fs.ensureDir(tempDir);

  const videoDir = path.join(process.cwd(), 'assets', 'video');
  let defaultVideoPath = null;
  if (fs.existsSync(videoDir)) {
    const videoFiles = fs.readdirSync(videoDir).filter(f => f.endsWith('.mp4'));
    if (videoFiles.length > 0) {
      defaultVideoPath = path.join(videoDir, videoFiles[0]);
    }
  }

  if (defaultVideoPath && fs.existsSync(defaultVideoPath)) {
    console.log(`Using default asset video: ${defaultVideoPath}`);
    selectedBgs = [defaultVideoPath];
  } else if (backgroundSource && !fs.existsSync(backgroundSource)) {
    try {
      const augmentedQuery = `${backgroundSource} programming coding technology software development`;
      console.log(`Searching for background matching keyword: ${augmentedQuery}...`);
      const pexelsKey = process.env.PEXELS_API_KEY;
      console.log(`Pexels API Key: ${pexelsKey ? 'Present' : 'MISSING'}`);
      
      if (pexelsKey && pexelsKey !== 'your_pexels_api_key_here') {
        try {
          console.log("Searching Pexels for relevant images...");
          // Request more images to ensure we have a good variety (min 6-8)
          const perPage = 10;
          const imageSearchResponse = await axios.get(`https://api.pexels.com/v1/search?query=${encodeURIComponent(augmentedQuery)}&per_page=${perPage}&orientation=portrait`, {
            headers: { 'Authorization': pexelsKey },
            timeout: 10000
          });
          if (imageSearchResponse.data.photos?.length > 0) {
            console.log(`Found ${imageSearchResponse.data.photos.length} images. Downloading...`);
            // Attempt to get at least 6-8 images
            const photosToDownload = imageSearchResponse.data.photos;
            for (let i = 0; i < photosToDownload.length; i++) {
              const imgUrl = photosToDownload[i].src.large2x;
              const imgPath = path.join(tempDir, `bg_img_${Date.now()}_${i}.jpg`);
              const response = await axios({ method: 'get', url: imgUrl, responseType: 'stream', timeout: 20000 });
              const writer = fs.createWriteStream(imgPath);
              response.data.pipe(writer);
              await new Promise((resolve, reject) => { writer.on('finish', resolve); writer.on('error', reject); });
              selectedBgs.push(imgPath);
              downloadedFiles.push(imgPath);
            }
            console.log(`Downloaded ${selectedBgs.length} images.`);
          }
        } catch (e) {
          console.error("Pexels image search error:", e.message);
        }
      }
      if (selectedBgs.length === 0) {
        console.log("No media found on Pexels. Using fallback image service...");
        // Fallback to getting 6 images from LoremFlickr if possible
        for (let i = 0; i < 6; i++) {
          const fallbackPath = path.join(tempDir, `bg_fallback_${Date.now()}_${i}.jpg`);
          const downloadUrl = `https://loremflickr.com/1080/1920/coding,tech,${backgroundSource.replace(/\s+/g, ',')}?lock=${i}`;
          try {
            const response = await axios({ method: 'get', url: downloadUrl, responseType: 'stream', timeout: 30000 });
            const writer = fs.createWriteStream(fallbackPath);
            response.data.pipe(writer);
            await new Promise((resolve, reject) => { writer.on('finish', resolve); writer.on('error', reject); });
            selectedBgs.push(fallbackPath);
            downloadedFiles.push(fallbackPath);
          } catch (err) {
            console.error(`Fallback download ${i} failed:`, err.message);
          }
        }
        console.log(`Downloaded ${selectedBgs.length} fallback images.`);
      }
    } catch (err) {
      console.error("Search failed:", err.message);
    }
  } else if (backgroundSource && fs.existsSync(backgroundSource)) {
    console.log(`Using local file as background: ${backgroundSource}`);
    selectedBgs = [backgroundSource];
  }

  const getDuration = (file) => new Promise((resolve, reject) => {
    ffmpeg.ffprobe(file, (err, metadata) => { if (err) return reject(err); resolve(metadata.format.duration); });
  });

  try {
    const audioDuration = await getDuration(audioPath);
    const audioDurRounded = parseFloat(audioDuration).toFixed(3);
    const bgDuration = await getDuration(selectedBgs[0]);

    return new Promise((resolve, reject) => {
      let command = ffmpeg();
      const stockDir = path.join(process.cwd(), 'assets', 'backgrounds');
      
      if (selectedBgs.length === 0) {
        if (fs.existsSync(stockDir)) {
          const files = fs.readdirSync(stockDir).filter(f => /\.(jpg|png|jpeg)$/i.test(f));
          if (files.length > 0) {
              // Use up to 8 random images from assets if search fails completely
              const numStock = Math.min(files.length, 8);
              for(let i=0; i<numStock; i++) {
                  selectedBgs.push(path.join(stockDir, files[i]));
              }
          }
        }
        if (selectedBgs.length === 0) selectedBgs = [path.join(process.cwd(), 'assets', 'background.png')];
      }

      selectedBgs.forEach(bg => {
        command = command.input(bg);
        if (/\.(jpg|png|jpeg)$/i.test(bg)) command = command.inputOptions(['-loop 1']);
        else command = command.inputOptions(['-stream_loop -1']);
      });

      command = command.input(audioPath);

      // Use relative path for subtitles to avoid drive letter escaping issues on Windows
      const relativeSrtPath = path.relative(process.cwd(), srtPath).replace(/\\/g, '/');
      
        // Subtitle styling: Small, clean Arial font at the bottom.
        // Alignment 2 = Bottom Center. MarginV 100 stays at the bottom safe zone.
        const subFilter = `subtitles=filename='${relativeSrtPath}':force_style='Fontname=Arial,Bold=1,FontSize=20,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,BorderStyle=1,Outline=1,Alignment=2,MarginV=100,MarginL=60,MarginR=60'`;

      const numBgs = selectedBgs.length;
      const audioInputIndex = numBgs;
      
      let filterComplex = "";

      const targetDuration = parseFloat(audioDuration);
      console.log(`Target Video Duration: ${targetDuration}s`);

      if (numBgs === 1 && !/\.(jpg|png|jpeg)$/i.test(selectedBgs[0])) {
        // Handle single video
        filterComplex = `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,trim=duration=${targetDuration},setpts=PTS-STARTPTS[contentv];`;
        filterComplex += `[contentv]${subFilter}[outv];`;
        filterComplex += `[${audioInputIndex}:a]atrim=duration=${targetDuration},asetpts=PTS-STARTPTS,afade=t=out:st=${targetDuration - 1}:d=1[outa]`;
      } else if (numBgs > 1) {
        const timePerBg = (targetDuration / numBgs).toFixed(3);
        for (let i = 0; i < numBgs; i++) {
          filterComplex += `[${i}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,trim=duration=${timePerBg},setpts=PTS-STARTPTS[v${i}];`;
        }
        for (let i = 0; i < numBgs; i++) filterComplex += `[v${i}]`;
        filterComplex += `concat=n=${numBgs}:v=1:a=0[bgv];[bgv]${subFilter}[outv];`;
        filterComplex += `[${audioInputIndex}:a]atrim=duration=${targetDuration},asetpts=PTS-STARTPTS,afade=t=out:st=${targetDuration - 1}:d=1[outa]`;
      } else {
        filterComplex = `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,trim=duration=${targetDuration},setpts=PTS-STARTPTS,${subFilter}[outv];`;
        filterComplex += `[${audioInputIndex}:a]atrim=duration=${targetDuration},asetpts=PTS-STARTPTS,afade=t=out:st=${targetDuration - 1}:d=1[outa]`;
      }

      console.log("Filter Complex:", filterComplex);

      const cleanup = async () => {
        console.log("Cleaning up temporary background images...");
        for (const file of downloadedFiles) {
          try {
            if (fs.existsSync(file)) await fs.remove(file);
          } catch (e) {
            console.error(`Failed to delete temp file ${file}:`, e.message);
          }
        }
      };

      command
        .complexFilter(filterComplex) // Don't use the second argument to avoid automatic mapping
        .outputOptions([
          '-map [outv]',
          '-map [outa]',
          '-c:v libx264',
          '-preset fast',
          '-pix_fmt yuv420p',
          '-c:a aac',
          '-b:a 128k',
          `-t ${targetDuration}` // Force output duration to match audio duration
        ])
        .on('start', (cmd) => console.log('FFmpeg command:', cmd))
        .on('end', async () => {
          await cleanup();
          resolve(absoluteOutputPath);
        })
        .on('error', async (err) => {
          console.error('FFmpeg error:', err.message);
          await cleanup();
          reject(err);
        })
        .save(relativeOutputPath); // Save using relative path
    });
  } catch (err) { throw err; }
}

/**
 * Generates a thumbnail with the topic name overlay.
 * @param {string} videoPath - Path to the video file.
 * @param {string} topic - The topic text to display.
 * @param {string} outputName - Name for the thumbnail file.
 * @returns {Promise<string>} - Path to the generated thumbnail.
 */
async function generateThumbnail(videoPath, topic, outputName) {
  console.log(`--- Generating Thumbnail: ${outputName} ---`);
  const absoluteOutputPath = path.join(process.cwd(), 'output', `${outputName}.jpg`);
  await fs.ensureDir(path.dirname(absoluteOutputPath));

  return new Promise((resolve, reject) => {
    // Sanitize topic for ffmpeg (remove quotes, etc)
    const sanitizedTopic = topic.replace(/['"]/g, '').toUpperCase();
    
    // Split topic into multiple lines if too long
    const words = sanitizedTopic.split(' ');
    let lines = [];
    let currentLine = "";
    for (const word of words) {
        if ((currentLine + word).length > 20) {
            lines.push(currentLine.trim());
            currentLine = word + " ";
        } else {
            currentLine += word + " ";
        }
    }
    lines.push(currentLine.trim());
    
    // Construct drawtext filter for each line
    // Use absolute path for Windows Arial font to ensure FFmpeg finds it
    const fontPath = 'C:/Windows/Fonts/arial.ttf'.replace(/\\/g, '/').replace(':', '\\:');
    
    let drawTextFilters = lines.map((line, index) => {
        const yOffset = 960 - (lines.length * 50) + (index * 120);
        return `drawtext=fontfile='${fontPath}':text='${line}':fontcolor=white:fontsize=100:x=(w-text_w)/2:y=${yOffset}:box=1:boxcolor=black@0.6:boxborderw=20`;
    }).join(',');

    ffmpeg(videoPath)
      .screenshots({
        timestamps: [1], // Take frame at 1 second
        filename: path.basename(absoluteOutputPath),
        folder: path.dirname(absoluteOutputPath),
        size: '1080x1920'
      })
      .on('end', () => {
        console.log("Frame extracted. Overlaying text...");
        ffmpeg(absoluteOutputPath)
          .videoFilters(drawTextFilters)
          .on('end', () => {
              console.log("Thumbnail complete.");
              resolve(absoluteOutputPath);
          })
          .on('error', (err) => {
              console.error("Overlay error:", err.message);
              resolve(absoluteOutputPath);
          })
          .save(absoluteOutputPath + '_final.jpg');
      })
      .on('error', (err) => {
          console.error("Screenshot error:", err.message);
          reject(err);
      });
      
    // Set a safety timeout for the entire operation
    setTimeout(() => {
        reject(new Error("Thumbnail generation timed out after 30s"));
    }, 30000);
  }).then(finalPath => {
      // Rename final to original
      const originalPath = absoluteOutputPath;
      const tempFinalPath = absoluteOutputPath + '_final.jpg';
      if (fs.existsSync(tempFinalPath)) {
          fs.removeSync(originalPath);
          fs.moveSync(tempFinalPath, originalPath);
      }
      return absoluteOutputPath;
  });
}

module.exports = { renderVideo, generateThumbnail };
